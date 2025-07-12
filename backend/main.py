import os
import cv2
import json
import asyncio
import websockets
import threading
import time
import requests
import numpy as np
from datetime import datetime
from typing import Dict, Set
import inspireface as isf
from supabase import create_client, Client
import base64
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = "https://gbzfprghpuexczgkkxop.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiemZwcmdocHVleGN6Z2treG9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMzcxNjIsImV4cCI6MjA2NzcxMzE2Mn0.M90diEDghXpQUanxSefFUzY9YiEiiY6oV7MTVxmuAs0"

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# Global variables for tracking
connected_clients: Set[websockets.WebSocketServerProtocol] = set()
last_attendance: Dict[str, datetime] = {}  # Track last attendance to prevent duplicates
attendance_cooldown = 30  # seconds between attendance records

class FaceRecognitionSystem:
    def __init__(self):
        # Create session & reload Megatron
        self.session = isf.InspireFaceSession(
            isf.HF_ENABLE_FACE_RECOGNITION,
            isf.HF_DETECT_MODE_ALWAYS_DETECT
        )
        
        # Enable FeatureHub (in-memory)
        hub_cfg = isf.FeatureHubConfiguration(
            primary_key_mode=isf.HF_PK_AUTO_INCREMENT,
            enable_persistence=False,
            persistence_db_path="",
            search_threshold=0.5,
            search_mode=isf.HF_SEARCH_MODE_EAGER
        )
        assert isf.feature_hub_enable(hub_cfg), "Failed to enable FeatureHub"
        
        self.hub_cfg = hub_cfg
        self.id2name = {}
        self.name2id = {}  # Reverse mapping
        self.load_faces_from_supabase()
        
    def download_image_from_url(self, url: str):
        """Download image from URL and convert to OpenCV format"""
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            
            # Convert to numpy array
            nparr = np.frombuffer(response.content, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img is None:
                logger.error(f"Failed to decode image from URL: {url}")
                return None
                
            return img
        except Exception as e:
            logger.error(f"Error downloading image from {url}: {e}")
            return None
        
    def load_faces_from_supabase(self):
        """Load employee faces from Supabase storage"""
        try:
            # Clear existing faces
            isf.feature_hub_clear()
            self.id2name.clear()
            self.name2id.clear()
            
            # Get all employees with photos
            response = supabase.table('employees').select('*').execute()
            employees = response.data
            
            logger.info(f"Found {len(employees)} employees in database")
            
            for employee in employees:
                if employee.get('photo_url'):
                    logger.info(f"Loading face for employee: {employee['name']}")
                    self.load_employee_face(employee)
                    
            count = isf.feature_hub_get_face_count()
            logger.info(f"[INFO] {count} faces loaded into FeatureHub")
            
        except Exception as e:
            logger.error(f"Error loading faces from Supabase: {e}")
    
    def load_employee_face(self, employee):
        """Load a single employee's face into the recognition system"""
        try:
            # Download image from Supabase storage
            photo_url = employee['photo_url']
            if not photo_url:
                logger.warning(f"No photo URL for {employee['name']}")
                return
                
            logger.info(f"Downloading image for {employee['name']} from {photo_url}")
            img = self.download_image_from_url(photo_url)
            
            if img is None:
                logger.warning(f"Could not load image for {employee['name']}")
                return
                
            faces = self.session.face_detection(img)
            if not faces:
                logger.warning(f"No face detected in {employee['name']}'s photo")
                return
                
            feat = self.session.face_feature_extract(img, faces[0])
            identity = isf.FaceIdentity(feat, id=len(self.id2name))
            ok, alloc_id = isf.feature_hub_face_insert(identity)
            
            if ok:
                self.id2name[alloc_id] = employee['name']
                self.name2id[employee['name']] = alloc_id
                logger.info(f"[+] Registered {employee['name']} → ID {alloc_id}")
            else:
                logger.error(f"Failed to insert face for {employee['name']}")
                
        except Exception as e:
            logger.error(f"Error loading face for {employee['name']}: {e}")
    
    def refresh_faces(self):
        """Refresh faces from Supabase - called when new employee is added"""
        logger.info("Refreshing faces from Supabase...")
        self.load_faces_from_supabase()
        return len(self.id2name)
    
    def add_new_employee_face(self, employee_name: str, image_data: bytes):
        """Add a new employee's face to the recognition system"""
        try:
            # Convert bytes to OpenCV image
            nparr = np.frombuffer(image_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            faces = self.session.face_detection(img)
            if not faces:
                return False, "No face detected in image"
                
            feat = self.session.face_feature_extract(img, faces[0])
            identity = isf.FaceIdentity(feat, id=len(self.id2name))
            ok, alloc_id = isf.feature_hub_face_insert(identity)
            
            if ok:
                self.id2name[alloc_id] = employee_name
                self.name2id[employee_name] = alloc_id
                logger.info(f"[+] Added new employee {employee_name} → ID {alloc_id}")
                return True, f"Successfully registered {employee_name}"
            else:
                return False, "Failed to register face"
                
        except Exception as e:
            logger.error(f"Error adding new employee face: {e}")
            return False, str(e)
    
    async def log_attendance(self, employee_name: str, entry_type: str = "entry"):
        """Log attendance to Supabase"""
        try:
            # Check cooldown to prevent duplicate entries
            now = datetime.now()
            key = f"{employee_name}_{entry_type}"
            
            if key in last_attendance:
                time_diff = (now - last_attendance[key]).total_seconds()
                if time_diff < attendance_cooldown:
                    logger.info(f"Skipping {entry_type} for {employee_name} (cooldown)")
                    return False
            
            # Get employee ID from name
            response = supabase.table('employees').select('id').eq('name', employee_name).execute()
            if not response.data:
                logger.error(f"Employee {employee_name} not found in database")
                return False
                
            employee_id = response.data[0]['id']
            
            # Create attendance record
            attendance_data = {
                'employee_id': employee_id,
                'entry_type': entry_type,
                'timestamp': now.isoformat(),
                'snapshot_url': None  # Will be updated with snapshot
            }
            
            response = supabase.table('attendance_records').insert(attendance_data).execute()
            
            if response.data:
                last_attendance[key] = now
                logger.info(f"Logged {entry_type} for {employee_name}")
                
                # Notify connected clients
                await self.notify_clients({
                    'type': 'attendance',
                    'employee_name': employee_name,
                    'entry_type': entry_type,
                    'timestamp': now.isoformat(),
                    'employee_id': employee_id
                })
                
                return True
            else:
                logger.error(f"Failed to log attendance for {employee_name}")
                return False
                
        except Exception as e:
            logger.error(f"Error logging attendance: {e}")
            return False
    
    async def notify_clients(self, data: dict):
        """Notify all connected WebSocket clients"""
        if connected_clients:
            message = json.dumps(data)
            await asyncio.gather(
                *[client.send(message) for client in connected_clients],
                return_exceptions=True
            )
    
    def process_frame(self, frame):
        """Process a single frame for face recognition"""
        results = []
        
        for face in self.session.face_detection(frame):
            x1, y1, x2, y2 = face.location
            h, w = frame.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)
            
            if x2 <= x1 or y2 <= y1:
                continue
                
            crop = cv2.resize(frame[y1:y2, x1:x2], (112, 112))
            feat = self.session.face_feature_extract(frame, face)
            
            # Search FeatureHub for best match
            res = isf.feature_hub_face_search(feat)
            fid = res.similar_identity.id
            conf = res.confidence
            
            if fid != -1 and conf >= self.hub_cfg.search_threshold:
                name = self.id2name[fid]
                results.append({
                    'name': name,
                    'confidence': conf,
                    'location': (x1, y1, x2, y2),
                    'face_id': fid
                })
            else:
                results.append({
                    'name': 'Unknown',
                    'confidence': conf,
                    'location': (x1, y1, x2, y2),
                    'face_id': -1
                })
        
        return results

# Global face recognition system
face_system = FaceRecognitionSystem()

async def websocket_handler(websocket, path):
    """Handle WebSocket connections"""
    connected_clients.add(websocket)
    logger.info(f"Client connected. Total clients: {len(connected_clients)}")
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'add_employee':
                # Handle adding new employee face
                employee_name = data['employee_name']
                image_data = base64.b64decode(data['image_data'])
                
                success, message = face_system.add_new_employee_face(employee_name, image_data)
                
                await websocket.send(json.dumps({
                    'type': 'add_employee_response',
                    'success': success,
                    'message': message
                }))
                
            elif data['type'] == 'refresh_faces':
                # Refresh faces from Supabase
                face_count = face_system.refresh_faces()
                
                await websocket.send(json.dumps({
                    'type': 'refresh_faces_response',
                    'success': True,
                    'face_count': face_count,
                    'message': f"Refreshed {face_count} faces from database"
                }))
                
            elif data['type'] == 'get_status':
                # Return current system status
                await websocket.send(json.dumps({
                    'type': 'status',
                    'registered_faces': len(face_system.id2name),
                    'connected_clients': len(connected_clients)
                }))
                
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        logger.info(f"Client disconnected. Total clients: {len(connected_clients)}")

def run_face_recognition():
    """Run the face recognition loop in a separate thread"""
    cap = cv2.VideoCapture(0)  # or your RTSP URL
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    
    logger.info("[INFO] Starting live recognition...")
    
    def draw_label(img, rect, text):
        x1, y1, x2, y2 = rect
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(img, text, (x1, y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        
        # Process frame for face recognition
        results = face_system.process_frame(frame)
        
        for result in results:
            x1, y1, x2, y2 = result['location']
            name = result['name']
            conf = result['confidence']
            
            if name != 'Unknown':
                label = f"{name} ({conf:.2f})"
                # Log attendance asynchronously
                asyncio.create_task(face_system.log_attendance(name, "entry"))
            else:
                label = "Unknown"
            
            draw_label(frame, (x1, y1, x2, y2), label)
        
        cv2.imshow("FeatureHub Recognition", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    
    cap.release()
    cv2.destroyAllWindows()

async def main():
    """Main function to run WebSocket server and face recognition"""
    # Start face recognition in a separate thread
    face_thread = threading.Thread(target=run_face_recognition, daemon=True)
    face_thread.start()
    
    # Start WebSocket server
    server = await websockets.serve(
        websocket_handler, 
        "localhost", 
        8001,
        ping_interval=20,
        ping_timeout=20
    )
    
    logger.info("WebSocket server started on ws://localhost:8001")
    logger.info("Face recognition system started")
    
    await server.wait_closed()

if __name__ == "__main__":
    asyncio.run(main()) 