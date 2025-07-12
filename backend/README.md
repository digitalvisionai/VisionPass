# Silent Attendance Eye Backend

This is the backend server for the Silent Attendance Eye system, providing real-time face recognition and attendance tracking via WebSocket.

## Features

- Real-time face recognition using InspireFace
- WebSocket communication for live updates
- Supabase integration for data persistence
- Automatic attendance logging
- Live system status monitoring

## Setup

### Prerequisites

- Python 3.8+
- OpenCV
- Webcam access
- Supabase account

### Installation

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Install InspireFace (follow their documentation):
```bash
# Install InspireFace according to their documentation
# This may require specific setup based on your system
```

4. Configure environment variables:
```bash
cp env.example .env
# Edit .env with your Supabase credentials
```

### Running the Server

```bash
python start.py
```

The server will start on:
- WebSocket: `ws://localhost:8001`
- Face recognition will start automatically

## Architecture

### Components

1. **FaceRecognitionSystem**: Handles face detection and recognition
2. **WebSocket Server**: Manages real-time communication
3. **Supabase Integration**: Handles data persistence
4. **Attendance Logger**: Records attendance events

### Data Flow

1. Camera captures frames
2. Face detection identifies faces
3. Feature extraction creates face embeddings
4. FeatureHub searches for matches
5. Attendance is logged to Supabase
6. WebSocket clients are notified

## API

### WebSocket Messages

#### Client to Server
- `{"type": "get_status"}` - Get system status
- `{"type": "add_employee", "employee_name": "...", "image_data": "base64"}` - Add new employee

#### Server to Client
- `{"type": "attendance", "employee_name": "...", "entry_type": "entry", "timestamp": "...", "employee_id": "..."}` - Attendance event
- `{"type": "status", "registered_faces": 5, "connected_clients": 2}` - System status
- `{"type": "add_employee_response", "success": true, "message": "..."}` - Add employee response

## Configuration

### Environment Variables

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `ATTENDANCE_COOLDOWN`: Seconds between attendance records (default: 30)

### Face Recognition Settings

- Search threshold: 0.5 (adjustable in `hub_cfg`)
- Detection mode: Always detect
- Feature extraction: Optimized for speed

## Troubleshooting

### Common Issues

1. **Camera not found**: Check camera permissions and device availability
2. **WebSocket connection failed**: Ensure port 8001 is available
3. **Face recognition not working**: Verify InspireFace installation
4. **Supabase connection error**: Check credentials in .env file

### Logs

The system logs to console with different levels:
- INFO: Normal operations
- WARNING: Non-critical issues
- ERROR: Critical errors

## Development

### Adding New Features

1. Extend the `FaceRecognitionSystem` class
2. Add new WebSocket message types
3. Update the frontend to handle new messages
4. Test with real camera feed

### Testing

```bash
# Test WebSocket connection
python -c "import websockets; asyncio.run(websockets.connect('ws://localhost:8001'))"
```

## Security Notes

- WebSocket server runs on localhost only
- No authentication implemented (add for production)
- Face data is stored in memory only
- Consider encryption for sensitive data 