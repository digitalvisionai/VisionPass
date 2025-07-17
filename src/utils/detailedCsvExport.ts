
import { AttendanceRecord } from '@/hooks/useAttendanceData';
import { formatMinutesToHours } from './timeUtils';

interface ActivityLog {
  id: string;
  timestamp: string;
  entry_type: 'entry' | 'exit';
  snapshot_url?: string;
}

export const exportPersonLogDetailsToCsv = (
  activities: ActivityLog[], 
  filename: string
) => {
  const headers = ['Entry #', 'Date', 'Time', 'Type', 'Snapshot'];
  const csvContent = [
    headers.join(','),
    ...activities.map((activity, idx) => [
      idx + 1,
      new Date(activity.timestamp).toLocaleDateString(),
      new Date(activity.timestamp).toLocaleTimeString(),
      activity.entry_type === 'entry' ? 'Entry' : 'Exit',
      activity.snapshot_url || ''
    ].join(','))
  ].join('\n');
  downloadCsv(csvContent, filename);
};

export const exportStaffLogWithColorCoding = (records: AttendanceRecord[], filename: string, workStartTime: string = '09:00', workEndTime: string = '17:00') => {
  const headers = [
    'Employee Name', 
    'Job Title', 
    'Date', 
    'Entry Time', 
    'Exit Time', 
    'Attendance Hours', 
    'Expected Hours',
    'Leak Hours', 
    'Late Arrival',
    'Status',
    'Entry Snapshot', 
    'Exit Snapshot'
  ];
  
  const csvContent = [
    headers.join(','),
    ...records.map(record => {
      const leakMinutes = Math.max(0, record.working_hours_minutes - record.attendance_minutes);
      const isLateEntry = record.entry_time ? isLateArrival(record.entry_time, workStartTime) : false;
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
        record.date,
        record.entry_time || '',
        record.exit_time || '',
        formatMinutesToHours(record.attendance_minutes),
        formatMinutesToHours(record.working_hours_minutes),
        formatMinutesToHours(leakMinutes),
        isLateEntry ? 'Yes' : 'No',
        status,
        record.entry_snapshot || '',
        record.exit_snapshot || ''
      ].join(',');
    })
  ].join('\n');

  downloadCsv(csvContent, filename);
};

const isLateArrival = (entryTime: string, workStartTime: string): boolean => {
  const entry = new Date(`1970-01-01T${entryTime}`);
  const workStart = new Date(`1970-01-01T${workStartTime}:00`);
  return entry > workStart;
};

const downloadCsv = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
