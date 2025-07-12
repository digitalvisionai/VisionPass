
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
      
      // Get all employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*');

      if (empError) {
        console.error('Error fetching employees:', empError);
        throw empError;
      }

      // Get attendance records for the specific date using date casting
      console.log('Date parameter for query:', dateParam);
      
      // Use a more flexible date range to account for timezone differences
      const startDate = new Date(dateParam);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateParam);
      endDate.setHours(23, 59, 59, 999);
      
      console.log('Date range:', { startDate: startDate.toISOString(), endDate: endDate.toISOString() });
      
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

      console.log('Data fetched - employees:', employees?.length, 'attendance records:', attendanceRecords?.length);
      
      // Debug: Check if there's any data at all
      if (attendanceRecords?.length === 0) {
        const { data: allRecords, error: allError } = await supabase
          .from('attendance_records')
          .select('*')
          .limit(5);
        console.log('Debug - All attendance records (first 5):', allRecords);
      }

      // Process the data manually
      const processedRecords: AttendanceRecord[] = employees?.map(employee => {
        const employeeRecords = attendanceRecords?.filter(record => record.employee_id === employee.id) || [];
        
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
          entry_time: entryRecord ? new Date(entryRecord.timestamp).toLocaleTimeString() : null,
          exit_time: exitRecord ? new Date(exitRecord.timestamp).toLocaleTimeString() : null,
          entry_snapshot: entryRecord?.snapshot_url || null,
          exit_snapshot: exitRecord?.snapshot_url || null,
          attendance_minutes: attendanceMinutes,
          working_hours_minutes: 480, // 8 hours default
          date: dateParam
        };
      }) || [];

      console.log('Processed records:', processedRecords.length);
      setRecords(processedRecords);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data. Please try again.",
        variant: "destructive",
      });
      setRecords([]); // Set empty array instead of leaving in loading state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData(targetDate);
  }, [dateString]); // Use dateString instead of targetDate to prevent infinite loops

  return { records, loading, refetch: fetchAttendanceData };
};
