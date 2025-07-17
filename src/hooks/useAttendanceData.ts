
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AttendanceRecord {
  employee_id: string;
  employee_name: string;
  job_class: string;
  entry_time: string | null;
  exit_time: string | null;
  entry_snapshot: string | null;
  exit_snapshot: string | null;
  attendance_minutes: number;
  working_hours_minutes: number;
  date: string;
}

export const useAttendanceData = (targetDate?: Date) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Memoize the date string to prevent unnecessary re-renders
  const dateString = useMemo(() => {
    if (!targetDate) return new Date().toISOString().split('T')[0];
    return targetDate.toISOString().split('T')[0];
  }, [targetDate]);

  const fetchAttendanceData = async (date?: Date) => {
    try {
      setLoading(true);
      const dateParam = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      
      console.log('Fetching attendance data for date:', dateParam);
      
      // Try using the Supabase function first
      try {
        const { data: functionData, error: functionError } = await supabase
          .rpc('get_daily_attendance_summary', { target_date: dateParam });

        if (!functionError && functionData) {
          console.log('Function data:', functionData);
          
          const formattedRecords: AttendanceRecord[] = functionData.map((record: any) => ({
            employee_id: record.employee_id,
            employee_name: record.employee_name,
            job_class: record.job_class || 'Employee',
            entry_time: record.entry_time ? new Date(record.entry_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : null,
            exit_time: record.exit_time ? new Date(record.exit_time).toLocaleTimeString('en-US', { 
              hour12: false, 
              hour: '2-digit', 
              minute: '2-digit' 
            }) : null,
            entry_snapshot: record.entry_snapshot,
            exit_snapshot: record.exit_snapshot,
            attendance_minutes: record.attendance_minutes || 0,
            working_hours_minutes: record.working_hours_minutes || 480,
            date: dateParam
          }));

          setRecords(formattedRecords);
          return;
        }
      } catch (funcError) {
        console.log('Function failed, falling back to manual query:', funcError);
      }

      // Fallback to manual data processing
      console.log('Using manual data processing...');
      
      // Get all employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');

      if (empError) {
        console.error('Error fetching employees:', empError);
        throw empError;
      }

      // Create more flexible date range
      const startDate = new Date(dateParam + 'T00:00:00.000Z');
      const endDate = new Date(dateParam + 'T23:59:59.999Z');
      
      console.log('Date range:', { 
        startDate: startDate.toISOString(), 
        endDate: endDate.toISOString(),
        originalDate: dateParam 
      });
      
      const { data: attendanceRecords, error: attError } = await supabase
        .from('attendance_records')
        .select('*')
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (attError) {
        console.error('Error fetching attendance records:', attError);
        throw attError;
      }

      console.log('Raw attendance records:', attendanceRecords);

      // Process the data manually
      const processedRecords: AttendanceRecord[] = employees?.map(employee => {
        const employeeRecords = attendanceRecords?.filter(record => record.employee_id === employee.id) || [];
        
        console.log(`Records for ${employee.name}:`, employeeRecords);
        
        const entryRecord = employeeRecords.find(record => record.entry_type === 'entry');
        const exitRecord = employeeRecords.find(record => record.entry_type === 'exit');
        
        let attendanceMinutes = 0;
        if (entryRecord && exitRecord) {
          const entryTime = new Date(entryRecord.timestamp);
          const exitTime = new Date(exitRecord.timestamp);
          attendanceMinutes = Math.floor((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
        }

        return {
          employee_id: employee.id,
          employee_name: employee.name,
          job_class: employee.job_class || 'Employee',
          entry_time: entryRecord ? new Date(entryRecord.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null,
          exit_time: exitRecord ? new Date(exitRecord.timestamp).toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : null,
          entry_snapshot: entryRecord?.snapshot_url || null,
          exit_snapshot: exitRecord?.snapshot_url || null,
          attendance_minutes: attendanceMinutes,
          working_hours_minutes: 480, // 8 hours default
          date: dateParam
        };
      }) || [];

      console.log('Final processed records:', processedRecords);
      setRecords(processedRecords);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data. Please try again.",
        variant: "destructive",
      });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(targetDate);
  }, [dateString]);

  return { records, loading, refetch: fetchAttendanceData };
};
