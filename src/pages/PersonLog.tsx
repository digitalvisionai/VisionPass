import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Download, User, Eye, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { format, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AttendanceTable from '@/components/AttendanceTable';
import MonthlyView from '@/components/MonthlyView';
import DailyDetailView from '@/components/DailyDetailView';
import EmployeeSearch from '@/components/EmployeeSearch';
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { exportAttendanceToCSV } from '@/utils/csvExport';
import { exportPersonLogDetailsToCsv } from '@/utils/detailedCsvExport';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_class: string | null;
  hire_date: string | null;
  photo_url: string | null;
}

interface ActivityLog {
  id: string;
  timestamp: string;
  entry_type: 'entry' | 'exit';
  snapshot_url?: string;
}

const PersonLog = () => {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [reportType, setReportType] = useState<string>('daily');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dailyActivities, setDailyActivities] = useState<ActivityLog[]>([]);
  const [showDailyDetail, setShowDailyDetail] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      if (reportType === 'daily') {
        // For daily report, fetch data for the selected calendar date
        const dateStr = format(selectedCalendarDate || new Date(), 'yyyy-MM-dd');
        console.log('PersonLog - Fetching daily data for:', dateStr);
        fetchDateSpecificAttendance(dateStr);
      } else {
        // For monthly report, fetch last 30 days
        fetchPersonAttendance();
      }
    }
  }, [selectedEmployee, reportType, selectedCalendarDate]);

  const fetchAllEmployees = async () => {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      setAllEmployees(employees || []);
    } catch (error) {
      console.error('Error fetching all employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    }
  };

  const fetchPersonAttendance = async () => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      console.log('Fetching person attendance for:', selectedEmployee.name);
      
      // Get last 30 days of data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching attendance:', error);
        throw error;
      }

      console.log('Attendance records fetched:', attendance?.length);

      // Group by date and process
      const dailyRecords = new Map();
      attendance?.forEach(record => {
        const date = record.timestamp.split('T')[0];
        if (!dailyRecords.has(date)) {
          dailyRecords.set(date, { entry: null, exit: null });
        }
        if (record.entry_type === 'entry') {
          dailyRecords.get(date).entry = record;
        } else {
          dailyRecords.get(date).exit = record;
        }
      });

      const formattedRecords: AttendanceRecord[] = Array.from(dailyRecords.entries()).map(([date, { entry, exit }]) => {
        let attendanceMinutes = 0;
        if (entry && exit) {
          const entryTime = new Date(entry.timestamp);
          const exitTime = new Date(exit.timestamp);
          attendanceMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
        }

        return {
          employee_id: selectedEmployee.id,
          employee_name: selectedEmployee.name,
          job_class: selectedEmployee.job_class || 'Employee',
          entry_time: entry ? new Date(entry.timestamp).toLocaleTimeString() : null,
          exit_time: exit ? new Date(exit.timestamp).toLocaleTimeString() : null,
          entry_snapshot: entry?.snapshot_url || null,
          exit_snapshot: exit?.snapshot_url || null,
          attendance_minutes: attendanceMinutes,
          working_hours_minutes: 480, // 8 hours default
          date: date
        };
      });

      // Sort by date, most recent first
      formattedRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      console.log('Formatted records:', formattedRecords.length);
      setRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching person attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch person attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyActivities = async (date: string) => {
    if (!selectedEmployee) return;

    try {
      console.log('Fetching daily activities for:', date, selectedEmployee.name);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: activities, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: true });

      if (error) throw error;

      console.log('Daily activities found:', activities?.length || 0);
      setDailyActivities(activities || []);
      setSelectedDate(date);
      setShowDailyDetail(true);
    } catch (error) {
      console.error('Error fetching daily activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch daily activities",
        variant: "destructive",
      });
    }
  };

  const handleEmployeeSelect = (employee: Omit<Employee, "hire_date"> | null) => {
    if (employee) {
      // Convert the employee from EmployeeSearch format to PersonLog format
      const fullEmployee: Employee = {
        ...employee,
        hire_date: null // Set default value since EmployeeSearch doesn't provide this
      };
      setSelectedEmployee(fullEmployee);
    } else {
      setSelectedEmployee(null);
    }
    setRecords([]);
    setSelectedCalendarDate(new Date());
  };

  const handleDayClick = (date: string) => {
    fetchDailyActivities(date);
  };

  const handleCalendarDateSelect = (date: Date | undefined) => {
    console.log('Calendar date selected:', date);
    setSelectedCalendarDate(date);
    setCalendarOpen(false);
  };

  const fetchDateSpecificAttendance = async (dateStr: string) => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      console.log('Fetching specific date attendance:', dateStr);
      
      const startOfDay = new Date(dateStr);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateStr);
      endOfDay.setHours(23, 59, 59, 999);

      const { data: attendance, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', selectedEmployee.id)
        .gte('timestamp', startOfDay.toISOString())
        .lte('timestamp', endOfDay.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching date-specific attendance:', error);
        throw error;
      }

      console.log('Date-specific attendance records:', attendance?.length);

      // Create individual records for each entry/exit instead of grouping
      const formattedRecords: AttendanceRecord[] = [];
      
      if (attendance && attendance.length > 0) {
        // Group by date first to calculate total attendance
        const dailyRecords = new Map();
        attendance.forEach(record => {
          const date = record.timestamp.split('T')[0];
          if (!dailyRecords.has(date)) {
            dailyRecords.set(date, { entries: [], exits: [] });
          }
          if (record.entry_type === 'entry') {
            dailyRecords.get(date).entries.push(record);
          } else {
            dailyRecords.get(date).exits.push(record);
          }
        });

        // Create records for each individual entry/exit
        attendance.forEach(record => {
          const date = record.timestamp.split('T')[0];
          const dayData = dailyRecords.get(date);
          
          // Calculate total attendance for the day
          let totalAttendanceMinutes = 0;
          if (dayData.entries.length > 0 && dayData.exits.length > 0) {
            const firstEntry = dayData.entries[0];
            const lastExit = dayData.exits[dayData.exits.length - 1];
            const entryTime = new Date(firstEntry.timestamp);
            const exitTime = new Date(lastExit.timestamp);
            totalAttendanceMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
          }

          formattedRecords.push({
            employee_id: selectedEmployee.id,
            employee_name: selectedEmployee.name,
            job_class: selectedEmployee.job_class || 'Employee',
            entry_time: record.entry_type === 'entry' ? new Date(record.timestamp).toLocaleTimeString() : null,
            exit_time: record.entry_type === 'exit' ? new Date(record.timestamp).toLocaleTimeString() : null,
            entry_snapshot: record.entry_type === 'entry' ? record.snapshot_url : null,
            exit_snapshot: record.entry_type === 'exit' ? record.snapshot_url : null,
            attendance_minutes: totalAttendanceMinutes,
            working_hours_minutes: 480, // 8 hours default
            date: date,
            timestamp: record.timestamp,
            entry_type: record.entry_type
          });
        });
      }

      console.log('Formatted date-specific records:', formattedRecords.length);
      setRecords(formattedRecords);
    } catch (error) {
      console.error('Error fetching date-specific attendance:', error);
      toast({
        title: "Error",
        description: "Failed to fetch date-specific attendance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!selectedEmployee || records.length === 0) return;
    
    if (reportType === 'daily' && showDailyDetail) {
      // Export detailed activities
      const filename = `${selectedEmployee.name}_daily_details_${selectedDate}.csv`;
      exportPersonLogDetailsToCsv(records, dailyActivities, selectedEmployee.name, filename);
    } else {
      // Export regular attendance records
      const filename = `${selectedEmployee.name}_attendance_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      exportAttendanceToCSV(records, filename);
    }
  };

  const handleBackToMain = () => {
    setShowDailyDetail(false);
    setSelectedDate(null);
  };

  if (showDailyDetail && selectedDate) {
    return (
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBackToMain}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Daily Activity Details</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {selectedEmployee?.name} - {format(new Date(selectedDate), 'PPP')}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleExport}
            className="flex items-center space-x-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            <span>Export Details CSV</span>
          </Button>
        </div>
        
        <DailyDetailView
          date={selectedDate}
          activities={dailyActivities}
          employeeName={selectedEmployee?.name || ''}
          onClose={handleBackToMain}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Person Log</h1>
          <p className="text-gray-600">Individual employee attendance tracking</p>
        </div>
        {selectedEmployee && records.length > 0 && (
          <div className="flex space-x-2">
            <Button onClick={handleExport} className="flex items-center space-x-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </Button>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-4">
        {/* Search Section */}
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Employee
            </label>
            <EmployeeSearch onEmployeeSelect={handleEmployeeSelect} />
          </div>

          {selectedEmployee && (
            <div className="w-full lg:w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type
              </label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Report</SelectItem>
                  <SelectItem value="monthly">Monthly Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Employee Table - Mobile Responsive */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Or choose from the list below:
          </label>
          
          {/* Mobile View - Cards */}
          <div className="lg:hidden space-y-3">
            {allEmployees.map((employee) => (
              <div
                key={employee.id}
                className={`bg-white border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedEmployee?.id === employee.id 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{employee.name}</h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {employee.job_class || 'Employee'}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {employee.email && (
                    <div className="flex items-center">
                      <span className="font-medium w-12">Email:</span>
                      <span className="truncate">{employee.email}</span>
                    </div>
                  )}
                  {employee.phone && (
                    <div className="flex items-center">
                      <span className="font-medium w-12">Phone:</span>
                      <span>{employee.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allEmployees.map((employee) => (
                    <tr 
                      key={employee.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedEmployee?.id === employee.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleEmployeeSelect(employee)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.job_class || 'Employee'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.email || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {employee.phone || '-'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calendar for Daily Report */}
        {selectedEmployee && reportType === 'daily' && (
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Select Date:
            </label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[240px] justify-start text-left font-normal",
                      !selectedCalendarDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedCalendarDate ? format(selectedCalendarDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedCalendarDate}
                    onSelect={handleCalendarDateSelect}
                    disabled={(date) => isFuture(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {selectedCalendarDate && (
                <Button 
                  onClick={() => {
                    const dateStr = format(selectedCalendarDate, 'yyyy-MM-dd');
                    fetchDailyActivities(dateStr);
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              {selectedEmployee.name}
            </CardTitle>
            <CardDescription>
              {selectedEmployee.email} • {selectedEmployee.job_class}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reportType === 'monthly' ? (
              <MonthlyView
                records={records}
                employeeName={selectedEmployee.name}
                onDayClick={handleDayClick}
              />
            ) : records.length > 0 ? (
              <div>
                {/* Mobile View - Cards */}
                <div className="lg:hidden space-y-3">
                  {records.map((record, index) => (
                    <div key={`${record.employee_id}-${record.date}-${index}`} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">
                          Entry #{index + 1}
                        </span>
                        <Badge variant={record.entry_type === 'entry' ? 'default' : 'secondary'}>
                          {record.entry_type === 'entry' ? 'Entry' : 'Exit'}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm">
                          <span className="font-medium">Time:</span> {record.entry_time || record.exit_time}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Date:</span> {format(new Date(record.date), 'MMM dd, yyyy')}
                        </div>
                        {(record.entry_snapshot || record.exit_snapshot) && (
                          <div>
                            <span className="text-sm font-medium">Snapshot:</span>
                            <img 
                              src={record.entry_snapshot || record.exit_snapshot || ''} 
                              alt={record.entry_type || 'snapshot'}
                              className="mt-1 w-16 h-16 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                              onClick={() => window.open(record.entry_snapshot || record.exit_snapshot!, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Entry #</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Snapshot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((record, index) => (
                        <tr key={`${record.employee_id}-${record.date}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium">{index + 1}</td>
                          <td className="px-4 py-2">{format(new Date(record.date), 'MMM dd, yyyy')}</td>
                          <td className="px-4 py-2">{record.entry_time || record.exit_time}</td>
                          <td className="px-4 py-2">
                            <Badge variant={record.entry_type === 'entry' ? 'default' : 'secondary'}>
                              {record.entry_type === 'entry' ? 'Entry' : 'Exit'}
                            </Badge>
                          </td>
                          <td className="px-4 py-2">
                            {(record.entry_snapshot || record.exit_snapshot) ? (
                              <img 
                                src={record.entry_snapshot || record.exit_snapshot || ''} 
                                alt={record.entry_type || 'snapshot'}
                                className="w-12 h-12 rounded object-cover cursor-pointer border-2 border-gray-200 hover:border-blue-500 transition-colors"
                                onClick={() => window.open(record.entry_snapshot || record.exit_snapshot!, '_blank')}
                              />
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No attendance records found for the selected date: {selectedCalendarDate ? format(selectedCalendarDate, 'PPP') : 'today'}.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonLog;
