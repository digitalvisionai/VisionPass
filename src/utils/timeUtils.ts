
export const formatTime = (timestamp: string | null): string => {
  if (!timestamp) return '-';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const formatMinutesToHours = (minutes: number): string => {
  if (minutes === 0) return '0:00';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}`;
};

export const calculateAttendanceMinutes = (entryTime: string | null, exitTime: string | null): number => {
  if (!entryTime || !exitTime) return 0;
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  return Math.floor((exit.getTime() - entry.getTime()) / (1000 * 60));
};
