
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import AttendanceTable from '@/components/AttendanceTable';
import DateRangeSelector from '@/components/DateRangeSelector';
import { exportAttendanceToCSV } from '@/utils/csvExport';

const StaffLog = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<string>('today');

  const targetDate = useMemo(() => {
    const today = new Date();
    switch (dateRange) {
      case 'yesterday':
        return subDays(today, 1);
      case 'custom':
        return selectedDate;
      case 'today':
      default:
        return today;
    }
  }, [dateRange, selectedDate]);

  const { records, loading } = useAttendanceData(targetDate);

  // Debug logging
  console.log('StaffLog - dateRange:', dateRange);
  console.log('StaffLog - targetDate:', targetDate);
  console.log('StaffLog - records:', records);
  console.log('StaffLog - loading:', loading);

  const handleExport = () => {
    const filename = `staff-log-${format(targetDate, 'yyyy-MM-dd')}.csv`;
    exportAttendanceToCSV(records, filename);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Log</h1>
          <p className="text-gray-600">Staff attendance log with detailed hours tracking</p>
        </div>
        <Button onClick={handleExport} className="flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="mb-6">
        <DateRangeSelector
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Staff Attendance Log
          </CardTitle>
          <CardDescription>
            Detailed attendance tracking for all staff members
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">No attendance records found for {format(targetDate, 'MMMM dd, yyyy')}</p>
              <p className="text-gray-400 text-sm mt-2">Try selecting a different date or check if data exists for this date.</p>
            </div>
          ) : (
            <AttendanceTable records={records} showJobClass={true} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLog;
