import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Clock, Camera, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface ActivityLog {
  id: string;
  timestamp: string;
  entry_type: 'entry' | 'exit';
  snapshot_url?: string;
}

interface DailyDetailViewProps {
  date: string;
  activities: ActivityLog[];
  employeeName: string;
  onClose: () => void;
}

const DailyDetailView = ({ date, activities, employeeName, onClose }: DailyDetailViewProps) => {
  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss');
  };

  const getActivityIcon = (type: 'entry' | 'exit') => {
    return type === 'entry' ? (
      <ArrowDownLeft className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowUpRight className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Daily Activity Log
          </div>
          <Badge variant="outline">
            {format(new Date(date), 'PPP')}
          </Badge>
        </CardTitle>
        <CardDescription>
          Detailed activity for {format(new Date(date), 'PPP')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No activities recorded for this day.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Snapshot</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity, index) => (
                  <tr key={activity.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{index + 1}</td>
                    <td className="px-4 py-2">{formatTime(activity.timestamp)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={activity.entry_type === 'entry' ? 'default' : 'secondary'}>
                        {activity.entry_type === 'entry' ? 'Entry' : 'Exit'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2">
                      {activity.snapshot_url ? (
                        <img 
                          src={activity.snapshot_url} 
                          alt={`${activity.entry_type} snapshot`}
                          className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                          onClick={() => window.open(activity.snapshot_url!, '_blank')}
                        />
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyDetailView; 