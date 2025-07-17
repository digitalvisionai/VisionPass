
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { formatMinutesToHours } from './timeUtils';

export const exportAttendanceToCSV = (records: AttendanceRecord[], filename: string) => {
  const headers = ['Employee Name', 'Job Title', 'Date', 'Entry Time', 'Exit Time', 'Attendance Hours', 'Leak Hours', 'Entry Snapshot', 'Exit Snapshot'];
  
  const csvContent = [
    headers.join(','),
    ...records.map(record => {
      const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
      return [
        record.employee_name,
        record.job_class,
        record.date,
        record.entry_time || '',
        record.exit_time || '',
        formatMinutesToHours(record.attendance_minutes),
        formatMinutesToHours(leakMinutes),
        record.entry_snapshot || '',
        record.exit_snapshot || ''
      ].join(',');
    })
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
