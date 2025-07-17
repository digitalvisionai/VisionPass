
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Users, RefreshCw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { useAttendanceData } from '@/hooks/useAttendanceData';
import { useWorkTimeSettings } from '@/hooks/useWorkTimeSettings';
import AttendanceTable from '@/components/AttendanceTable';
import DateRangeSelector from '@/components/DateRangeSelector';
import ImageViewer from '@/components/ImageViewer';
import { exportStaffLogWithColorCoding } from '@/utils/detailedCsvExport';

const StaffLog = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<string>('today');
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
  }>({
    isOpen: false,
    imageUrl: null,
    title: '',
  });
  const { workStartTime, workEndTime } = useWorkTimeSettings();

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
  console.log('StaffLog - workStartTime:', workStartTime);
  console.log('StaffLog - workEndTime:', workEndTime);

  const handleExport = () => {
    const filename = `staff-log-${format(targetDate, 'yyyy-MM-dd')}.csv`;
    exportStaffLogWithColorCoding(records, filename, workStartTime, workEndTime);
  };

  const handleRefresh = () => {
    console.log('Refreshing data for date:', targetDate);
    refetch(targetDate);
  };

  const openImageViewer = (imageUrl: string, employeeName: string, type: string) => {
    setImageViewer({
      isOpen: true,
      imageUrl,
      title: `${employeeName} - ${type} Snapshot`,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      imageUrl: null,
      title: '',
    });
  };

  // Add color coding logic
  const getRowClassName = (record: any) => {
    const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
    const isLateEntry = record.entry_time ? isLateArrival(record.entry_time, workStartTime) : false;
    const hasLeakingHours = leakMinutes > 0;
    
    if (isLateEntry && hasLeakingHours) {
      return 'bg-red-50 border-l-4 border-red-500'; // Late and under hours
    } else if (isLateEntry) {
      return 'bg-orange-50 border-l-4 border-orange-500'; // Late arrival
    } else if (hasLeakingHours) {
      return 'bg-yellow-50 border-l-4 border-yellow-500'; // Under hours
    }
    return 'bg-green-50 border-l-4 border-green-500'; // On time
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
            disabled={records.length === 0}
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

      {/* Color Legend */}
      <div className="mb-4 p-3 bg-white rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Status Legend:</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>On Time</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Late Arrival</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Under Hours</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Late & Under Hours</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            Staff Attendance Log
          </CardTitle>
          <CardDescription>
            Detailed attendance tracking for all staff members on {format(targetDate, 'MMMM dd, yyyy')}
            <br />
            <span className="text-xs text-gray-500">
              Work Hours: {workStartTime} - {workEndTime}
            </span>
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
              <div className="space-y-2">
                {records.map((record, index) => (
                  <div key={`${record.employee_id}-${record.date}`} className={`p-3 rounded-lg ${getRowClassName(record)}`}>
                    <AttendanceTable 
                      records={[record]} 
                      showJobClass={true}
                      workStartTime={workStartTime}
                      onImageClick={openImageViewer}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={imageViewer.imageUrl}
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
        title={imageViewer.title}
      />
    </div>
  );
};

export default StaffLog;
