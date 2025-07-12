import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

const RealTimeAttendance = () => {
  const { isConnected, systemStatus, recentAttendance, refreshFaces } = useWebSocket();

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              {isConnected ? (
                <Wifi className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 mr-2 text-red-500" />
              )}
              Backend Connection
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time face recognition system status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {systemStatus && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus.registered_faces}
                </div>
                <div className="text-sm text-gray-600">Registered Faces</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.connected_clients}
                </div>
                <div className="text-sm text-gray-600">Connected Clients</div>
              </div>
            </div>
          )}
          
          {/* Refresh Button */}
          <div className="mt-4 flex justify-center">
            <Button 
              onClick={refreshFaces} 
              disabled={!isConnected}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Faces
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Attendance
          </CardTitle>
          <CardDescription>
            Live attendance events from face recognition system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {isConnected ? 'Waiting for attendance events...' : 'Backend not connected'}
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentAttendance.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        event.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <div>
                      <p className="font-medium">{event.employee_name}</p>
                      <p className="text-sm text-gray-600 capitalize">
                        {event.entry_type} at {format(new Date(event.timestamp), 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={event.entry_type === 'entry' ? 'default' : 'destructive'}>
                    {event.entry_type === 'entry' ? 'Entry' : 'Exit'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeAttendance; 