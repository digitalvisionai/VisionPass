
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, RefreshCw } from 'lucide-react';
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

  const { records, loading, refetch } = useAttendanceData(targetDate);

  // Debug logging
  console.log('StaffLog - dateRange:', dateRange);
  console.log('StaffLog - targetDate:', targetDate);
  console.log('StaffLog - records:', records);
  console.log('StaffLog - loading:', loading);

  const handleExport = () => {
    const filename = `staff-log-${format(targetDate, 'yyyy-MM-dd')}.csv`;
    exportAttendanceToCSV(records, filename);
  };

  const handleRefresh = () => {
    refetch(targetDate);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Staff Log</h1>
          <p className="text-sm sm:text-base text-gray-600">Staff attendance log with detailed hours tracking</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={handleRefresh} 
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center space-x-1 sm:space-x-2"
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-xs sm:text-sm">Refresh</span>
          </Button>
          <Button 
            onClick={handleExport} 
            size="sm"
            className="flex items-center space-x-1 sm:space-x-2"
          >
            <Download className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">Export CSV</span>
          </Button>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <DateRangeSelector
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Staff Attendance Log
          </CardTitle>
          <CardDescription>
            Detailed attendance tracking for all staff members on {format(targetDate, 'MMMM dd, yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-base sm:text-lg">No attendance records found for {format(targetDate, 'MMMM dd, yyyy')}</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-2">Try selecting a different date or check if data exists for this date.</p>
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <AttendanceTable records={records} showJobClass={true} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffLog;
