import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, getDaysInMonth } from 'date-fns';
import { Calendar, Eye } from 'lucide-react';
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { formatMinutesToHours } from '@/utils/timeUtils';

interface MonthlyViewProps {
  records: AttendanceRecord[];
  employeeName: string;
  onDayClick: (date: string) => void;
}

const MonthlyView = ({ records, employeeName, onDayClick }: MonthlyViewProps) => {
  const currentDate = new Date();
  const today = new Date();
  const daysInMonth = getDaysInMonth(currentDate);
  const currentDay = today.getDate();

  const getRecordForDate = (day: number) => {
    const dateStr = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd');
    return records.find(record => record.date === dateStr);
  };

  const getLeakHoursColor = (record: AttendanceRecord | undefined) => {
    if (!record || record.attendance_minutes === 0) return 'bg-gray-100 text-gray-600';
    
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const leakHours = leakMinutes / 60;
    
    if (leakHours === 0) return 'bg-green-100 text-green-800';
    if (leakHours <= 1) return 'bg-yellow-100 text-yellow-800';
    if (leakHours <= 2) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getLeakHoursText = (record: AttendanceRecord | undefined) => {
    if (!record || record.attendance_minutes === 0) return 'No Entry';
    
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const hours = Math.floor(leakMinutes / 60);
    const minutes = leakMinutes % 60;
    
    if (leakMinutes === 0) return 'Complete';
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const getRowColor = (day: number) => {
    const record = getRecordForDate(day);
    if (!record || record.attendance_minutes === 0) return '';
    
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const leakHours = leakMinutes / 60;
    
    if (leakHours > 2) return 'bg-red-50 hover:bg-red-100';
    if (leakHours > 1) return 'bg-orange-50 hover:bg-orange-100';
    if (leakHours > 0) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-green-50 hover:bg-green-100';
  };

  const isCurrentDay = (day: number) => {
    return day === currentDay;
  };

  const isFutureDay = (day: number) => {
    const today = new Date();
    return day > today.getDate() && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  };

  // Only show days up to today
  const daysToShow = Math.min(daysInMonth, currentDay);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          Monthly Attendance Report
        </CardTitle>
        <CardDescription>
          {format(currentDate, 'MMMM yyyy')} (Days 1-{daysToShow})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead>Attendance Hours</TableHead>
              <TableHead>Leak Hours</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Image In</TableHead>
              <TableHead>Image Out</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: daysToShow }, (_, index) => {
              const day = index + 1;
              const record = getRecordForDate(day);
              const rowColor = getRowColor(day);
              const isToday = isCurrentDay(day);
              
              return (
                <TableRow 
                  key={day} 
                  className={`${rowColor} ${isToday ? 'border-blue-500 border-2' : ''}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span className={isToday ? 'text-blue-600 font-bold' : ''}>
                        {day}
                      </span>
                      {isToday && <Badge variant="outline" className="text-xs">Today</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className={record?.entry_time ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {record?.entry_time || '-'}
                  </TableCell>
                  <TableCell className={record?.exit_time ? 'text-red-600 font-medium' : 'text-gray-400'}>
                    {record?.exit_time || '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {record ? formatMinutesToHours(record.attendance_minutes) : '-'}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <Badge 
                        className={getLeakHoursColor(record)}
                        variant="outline"
                      >
                        {getLeakHoursText(record)}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          record.attendance_minutes === 0 ? 'bg-gray-400' :
                          record.attendance_minutes >= record.working_hours_minutes ? 'bg-green-500' :
                          record.attendance_minutes >= record.working_hours_minutes * 0.75 ? 'bg-yellow-500' :
                          record.attendance_minutes >= record.working_hours_minutes * 0.5 ? 'bg-orange-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-sm">
                          {record.attendance_minutes === 0 ? 'No Entry' :
                           record.attendance_minutes >= record.working_hours_minutes ? 'Complete' :
                           record.attendance_minutes >= record.working_hours_minutes * 0.75 ? 'Good' :
                           record.attendance_minutes >= record.working_hours_minutes * 0.5 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {record?.entry_snapshot ? (
                      <img 
                        src={record.entry_snapshot} 
                        alt="Entry" 
                        className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-green-200 hover:border-green-400 transition-colors"
                        onClick={() => window.open(record.entry_snapshot!, '_blank')}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {record?.exit_snapshot ? (
                      <img 
                        src={record.exit_snapshot} 
                        alt="Exit" 
                        className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-red-200 hover:border-red-400 transition-colors"
                        onClick={() => window.open(record.exit_snapshot!, '_blank')}
                      />
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {record ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDayClick(record.date)}
                        className="flex items-center space-x-1"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
                      </Button>
                    ) : !isFutureDay(day) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDayClick(format(new Date(currentDate.getFullYear(), currentDate.getMonth(), day), 'yyyy-MM-dd'))}
                        className="flex items-center space-x-1"
                        disabled
                      >
                        <Eye className="h-3 w-3" />
                        <span>No Data</span>
                      </Button>
                    ) : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Complete (≥8 hours)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Good (≥6 hours)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Fair (≥4 hours)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Poor (&lt;4 hours)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>No Entry</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyView; 