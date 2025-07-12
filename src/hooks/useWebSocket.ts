import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface AttendanceEvent {
  type: 'attendance';
  employee_name: string;
  entry_type: 'entry' | 'exit';
  timestamp: string;
  employee_id: string;
}

interface SystemStatus {
  type: 'status';
  registered_faces: number;
  connected_clients: number;
}

export const useWebSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceEvent[]>([]);
  const { toast } = useToast();

  const connect = useCallback(() => {
    const ws = new WebSocket('ws://localhost:8001');

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Request system status
      ws.send(JSON.stringify({ type: 'get_status' }));
    };

    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        
        switch (data.type) {
          case 'attendance':
            const attendanceEvent = data as AttendanceEvent;
            setRecentAttendance(prev => [attendanceEvent, ...prev.slice(0, 9)]); // Keep last 10
            
            // Show toast notification
            toast({
              title: `${attendanceEvent.entry_type === 'entry' ? 'Entry' : 'Exit'}`,
              description: `${attendanceEvent.employee_name} ${attendanceEvent.entry_type === 'entry' ? 'entered' : 'exited'} at ${new Date(attendanceEvent.timestamp).toLocaleTimeString()}`,
              variant: attendanceEvent.entry_type === 'entry' ? 'default' : 'destructive',
            });
            break;
            
          case 'status':
            setSystemStatus(data as SystemStatus);
            break;
            
          case 'add_employee_response':
            if (data.success) {
              toast({
                title: "Success",
                description: data.message,
              });
            } else {
              toast({
                title: "Error",
                description: data.message,
                variant: "destructive",
              });
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (!isConnected) {
          connect();
        }
      }, 5000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    setSocket(ws);
  }, [isConnected, toast]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  const addEmployeeFace = useCallback(async (employeeName: string, imageFile: File) => {
    if (!socket || !isConnected) {
      toast({
        title: "Error",
        description: "WebSocket not connected",
        variant: "destructive",
      });
      return;
    }

    try {
      // Convert image to base64
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      socket.send(JSON.stringify({
        type: 'add_employee',
        employee_name: employeeName,
        image_data: base64
      }));
    } catch (error) {
      console.error('Error adding employee face:', error);
      toast({
        title: "Error",
        description: "Failed to add employee face",
        variant: "destructive",
      });
    }
  }, [socket, isConnected, toast]);

  const getSystemStatus = useCallback(() => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'get_status' }));
    }
  }, [socket, isConnected]);

  const refreshFaces = useCallback(() => {
    if (socket && isConnected) {
      socket.send(JSON.stringify({ type: 'refresh_faces' }));
    }
  }, [socket, isConnected]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    systemStatus,
    recentAttendance,
    addEmployeeFace,
    getSystemStatus,
    refreshFaces,
    connect,
    disconnect
  };
}; 