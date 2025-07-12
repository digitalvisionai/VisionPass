#!/usr/bin/env python3
"""
Startup script for the Silent Attendance Eye backend
"""

import asyncio
import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import main

if __name__ == "__main__":
    try:
        print("Starting Silent Attendance Eye Backend...")
        print("WebSocket server will be available at ws://localhost:8001")
        print("Face recognition system will start automatically")
        print("Press Ctrl+C to stop the server")
        
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutting down gracefully...")
    except Exception as e:
        print(f"Error starting server: {e}")
        sys.exit(1) 