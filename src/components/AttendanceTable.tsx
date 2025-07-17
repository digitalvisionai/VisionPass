
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { formatMinutesToHours } from '@/utils/timeUtils';
import { AttendanceRecord } from '@/hooks/useAttendanceData';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showJobClass?: boolean;
  workStartTime?: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ 
  records, 
  showJobClass = false,
  workStartTime = '09:00'
}) => {
  const isLateArrival = (entryTime: string | null, workStart: string): boolean => {
    if (!entryTime) return false;
    try {
      const entry = new Date(`1970-01-01T${entryTime}`);
      const workStartTime = new Date(`1970-01-01T${workStart}:00`);
      return entry > workStartTime;
    } catch {
      return false;
    }
  };

  const getStatusBadge = (record: AttendanceRecord) => {
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const isLate = record.entry_time ? isLateArrival(record.entry_time, workStartTime) : false;
    const hasLeakingHours = leakMinutes > 0;
    
    if (isLate && hasLeakingHours) {
      return <Badge variant="destructive">Late & Under Hours</Badge>;
    } else if (isLate) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Late Arrival</Badge>;
    } else if (hasLeakingHours) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Under Hours</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">On Time</Badge>;
  };

  return (
    <div className="overflow-x-auto">
      {/* Mobile View */}
      <div className="lg:hidden space-y-3">
        {records.map((record, index) => (
          <div key={`${record.employee_id}-${record.date}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">{record.employee_name}</h3>
              {getStatusBadge(record)}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {showJobClass && (
                <div>
                  <span className="font-medium text-gray-500">Job:</span>
                  <p className="mt-1">{record.job_class}</p>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500">Entry:</span>
                <p className="mt-1">{record.entry_time || 'Not recorded'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Exit:</span>
                <p className="mt-1">{record.exit_time || 'Not recorded'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Hours:</span>
                <p className="mt-1">
                  {formatMinutesToHours(record.attendance_minutes)} / {formatMinutesToHours(record.working_hours_minutes)}
                </p>
              </div>
            </div>

            <div className="flex space-x-2 mt-3">
              {record.entry_snapshot && (
                <img 
                  src={record.entry_snapshot} 
                  alt="Entry"
                  className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                  onClick={() => window.open(record.entry_snapshot!, '_blank')}
                />
              )}
              {record.exit_snapshot && (
                <img 
                  src={record.exit_snapshot} 
                  alt="Exit"
                  className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                  onClick={() => window.open(record.exit_snapshot!, '_blank')}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              {showJobClass && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Job Class
                </th>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entry Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Exit Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hours Worked
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Snapshots
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((record, index) => (
              <tr key={`${record.employee_id}-${record.date}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                </td>
                {showJobClass && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{record.job_class}</div>
                  </td>
                )}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{record.entry_time || 'Not recorded'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{record.exit_time || 'Not recorded'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatMinutesToHours(record.attendance_minutes)} / {formatMinutesToHours(record.working_hours_minutes)}
                  </div>
                  {record.working_hours_minutes > record.attendance_minutes && (
                    <div className="text-xs text-red-600">
                      -{formatMinutesToHours(record.working_hours_minutes - record.attendance_minutes)} leak
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(record)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    {record.entry_snapshot && (
                      <img 
                        src={record.entry_snapshot} 
                        alt="Entry"
                        className="w-8 h-8 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        onClick={() => window.open(record.entry_snapshot!, '_blank')}
                      />
                    )}
                    {record.exit_snapshot && (
                      <img 
                        src={record.exit_snapshot} 
                        alt="Exit"
                        className="w-8 h-8 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                        onClick={() => window.open(record.exit_snapshot!, '_blank')}
                      />
                    )}
                  </div>
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
