
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { formatTime, formatMinutesToHours } from '@/utils/timeUtils';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  showDate?: boolean;
  showJobClass?: boolean;
  onEmployeeClick?: (employeeId: string) => void;
  onRowClick?: (record: AttendanceRecord) => void;
}

const AttendanceTable = ({ 
  records, 
  showDate = false, 
  showJobClass = false,
  onEmployeeClick,
  onRowClick
}: AttendanceTableProps) => {
  const calculateLeakHours = (attendanceMinutes: number, workingHoursMinutes: number) => {
    if (attendanceMinutes === 0) return { text: 'No Entry', color: 'bg-gray-100 text-gray-600' };
    const leak = Math.max(0, workingHoursMinutes - attendanceMinutes);
    const leakHours = leak / 60;
    
    let color = 'bg-green-100 text-green-800';
    if (leakHours > 2) color = 'bg-red-100 text-red-800';
    else if (leakHours > 1) color = 'bg-orange-100 text-orange-800';
    else if (leakHours > 0) color = 'bg-yellow-100 text-yellow-800';
    
    return { text: formatMinutesToHours(leak), color };
  };

  const getRowColor = (record: AttendanceRecord) => {
    if (record.attendance_minutes === 0) return '';
    
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const leakHours = leakMinutes / 60;
    
    if (leakHours > 2) return 'bg-red-50 hover:bg-red-100';
    if (leakHours > 1) return 'bg-orange-50 hover:bg-orange-100';
    if (leakHours > 0) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-green-50 hover:bg-green-100';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee Name</TableHead>
          {showJobClass && <TableHead>Job Class</TableHead>}
          {showDate && <TableHead>Date</TableHead>}
          <TableHead>Entry Time</TableHead>
          <TableHead>Exit Time</TableHead>
          <TableHead>Attendance Hours</TableHead>
          <TableHead>Leak Hours</TableHead>
          <TableHead>Entry Snapshot</TableHead>
          <TableHead>Exit Snapshot</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record, index) => {
          const leakInfo = calculateLeakHours(record.attendance_minutes, record.working_hours_minutes);
          const rowColor = getRowColor(record);
          
          return (
            <TableRow 
              key={index} 
              className={`${rowColor} ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(record)}
            >
              <TableCell 
                className={`font-medium ${onEmployeeClick ? 'cursor-pointer hover:text-blue-600' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onEmployeeClick?.(record.employee_id);
                }}
              >
                {record.employee_name}
              </TableCell>
              {showJobClass && <TableCell>{record.job_class}</TableCell>}
              {showDate && <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>}
              <TableCell className={record.entry_time ? 'text-green-600 font-medium' : 'text-gray-400'}>
                {record.entry_time || '-'}
              </TableCell>
              <TableCell className={record.exit_time ? 'text-red-600 font-medium' : 'text-gray-400'}>
                {record.exit_time || '-'}
              </TableCell>
              <TableCell className="font-medium">
                {formatMinutesToHours(record.attendance_minutes)}
              </TableCell>
              <TableCell>
                <Badge 
                  className={leakInfo.color}
                  variant="outline"
                >
                  {leakInfo.text}
                </Badge>
              </TableCell>
              <TableCell>
                {record.entry_snapshot ? (
                  <img 
                    src={record.entry_snapshot} 
                    alt="Entry" 
                    className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-green-200 hover:border-green-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(record.entry_snapshot!, '_blank');
                    }}
                  />
                ) : '-'}
              </TableCell>
              <TableCell>
                {record.exit_snapshot ? (
                  <img 
                    src={record.exit_snapshot} 
                    alt="Exit" 
                    className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-red-200 hover:border-red-400 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(record.exit_snapshot!, '_blank');
                    }}
                  />
                ) : '-'}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default AttendanceTable;
