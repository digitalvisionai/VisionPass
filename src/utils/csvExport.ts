
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { formatMinutesToHours } from './timeUtils';

export const exportAttendanceToCSV = (records: AttendanceRecord[], filename: string) => {
  const headers = [
    'Employee',
    'Job Title',
    'Entry Time',
    'Exit Time',
    'Hours Worked',
    'Status',
    'Entry Photo',
    'Exit Photo'
  ];
  const csvContent = [
    headers.join(','),
    ...records.map(record => {
      const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
      const isLateEntry = record.entry_time ? isLateArrival(record.entry_time, '09:00') : false;
      const hasLeakingHours = leakMinutes > 0;
      let status = 'On Time';
      if (isLateEntry && hasLeakingHours) {
        status = 'Late & Under Hours';
      } else if (isLateEntry) {
        status = 'Late Arrival';
      } else if (hasLeakingHours) {
        status = 'Under Hours';
      }
      return [
        record.employee_name,
        record.job_class,
        record.entry_time || '',
        record.exit_time || '',
        formatMinutesToHours(record.attendance_minutes),
        status,
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

export const exportMonthlyLogCSV = (records: AttendanceRecord[], filename: string) => {
  const headers = [
    'Day',
    'Time In',
    'Time Out',
    'Attendance Hours',
    'Leak Hours',
    'Class',
    'Image In',
    'Image Out'
  ];
  const csvContent = [
    headers.join(','),
    ...records.map(record => {
      const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
      return [
        record.date ? new Date(record.date).getDate() : '',
        record.entry_time || '',
        record.exit_time || '',
        formatMinutesToHours(record.attendance_minutes),
        formatMinutesToHours(leakMinutes),
        record.job_class,
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

function isLateArrival(entryTime: string, workStartTime: string): boolean {
  try {
    const entry = new Date(`1970-01-01T${entryTime}`);
    const workStart = new Date(`1970-01-01T${workStartTime}:00`);
    return entry > workStart;
  } catch {
    return false;
  }
}
