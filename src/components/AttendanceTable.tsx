
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { AttendanceRecord } from '@/hooks/useAttendanceData';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showJobClass?: boolean;
  workStartTime?: string;
  onImageClick?: (imageUrl: string, employeeName: string, type: string) => void;
}

const AttendanceTable = ({ records, showJobClass = false, workStartTime = '09:00', onImageClick }: AttendanceTableProps) => {
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return timeString;
  };

  const formatMinutesToHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const isLateEntry = record.entry_time ? isLateArrival(record.entry_time, workStartTime) : false;
    const hasLeakingHours = leakMinutes > 0;
    
    if (isLateEntry && hasLeakingHours) {
      return <Badge variant="destructive" className="text-xs">Late & Under Hours</Badge>;
    } else if (isLateEntry) {
      return <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">Late Arrival</Badge>;
    } else if (hasLeakingHours) {
      return <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">Under Hours</Badge>;
    }
    return <Badge variant="default" className="text-xs bg-green-100 text-green-800">On Time</Badge>;
  };

  const isLateArrival = (entryTime: string, workStartTime: string): boolean => {
    try {
      const entry = new Date(`1970-01-01T${entryTime}`);
      const workStart = new Date(`1970-01-01T${workStartTime}:00`);
      return entry > workStart;
    } catch {
      return false;
    }
  };

  const handleImageClick = (imageUrl: string, employeeName: string, type: string) => {
    if (onImageClick) {
      onImageClick(imageUrl, employeeName, type);
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No attendance records found.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {records.map((record, index) => (
          <div key={`${record.employee_id}-${record.date}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 truncate">{record.employee_name}</h3>
              {getStatusBadge(record)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 block">Entry Time</span>
                <span className="font-medium">{formatTime(record.entry_time)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Exit Time</span>
                <span className="font-medium">{formatTime(record.exit_time)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Hours Worked</span>
                <span className="font-medium">{formatMinutesToHours(record.attendance_minutes)}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Expected Hours</span>
                <span className="font-medium">{formatMinutesToHours(record.working_hours_minutes)}</span>
              </div>
            </div>

            {showJobClass && (
              <div className="mt-2">
                <span className="text-gray-500 text-sm">Job Class: </span>
                <span className="text-sm font-medium">{record.job_class}</span>
              </div>
            )}

            {/* Snapshots */}
            <div className="flex space-x-4 mt-3">
              {record.entry_snapshot && (
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Entry Photo</span>
                  <img 
                    src={record.entry_snapshot} 
                    alt="Entry snapshot"
                    className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                    onClick={() => handleImageClick(record.entry_snapshot!, record.employee_name, 'Entry')}
                  />
                </div>
              )}
              {record.exit_snapshot && (
                <div>
                  <span className="text-xs text-gray-500 block mb-1">Exit Photo</span>
                  <img 
                    src={record.exit_snapshot} 
                    alt="Exit snapshot"
                    className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                    onClick={() => handleImageClick(record.exit_snapshot!, record.employee_name, 'Exit')}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              {showJobClass && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Class
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours Worked
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Photo
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Photo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={`${record.employee_id}-${record.date}-${index}`} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {record.employee_name}
                  </div>
                </td>
                {showJobClass && (
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {record.job_class}
                    </div>
                  </td>
                )}
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(record.entry_time)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(record.exit_time)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatMinutesToHours(record.attendance_minutes)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Expected: {formatMinutesToHours(record.working_hours_minutes)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {getStatusBadge(record)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {record.entry_snapshot ? (
                    <img 
                      src={record.entry_snapshot} 
                      alt="Entry snapshot"
                      className="w-10 h-10 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      onClick={() => handleImageClick(record.entry_snapshot!, record.employee_name, 'Entry')}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {record.exit_snapshot ? (
                    <img 
                      src={record.exit_snapshot} 
                      alt="Exit snapshot"
                      className="w-10 h-10 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      onClick={() => handleImageClick(record.exit_snapshot!, record.employee_name, 'Exit')}
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;
