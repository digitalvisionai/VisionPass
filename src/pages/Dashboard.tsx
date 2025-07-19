
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RealTimeAttendance from '@/components/RealTimeAttendance';
import ImageViewer from '@/components/ImageViewer';
import { useWorkTimeSettings } from '@/hooks/useWorkTimeSettings';

interface DashboardStats {
  totalEmployees: number;
  todayAttendance: number;
  onTimePercentage: number;
  lateArrivals: number;
}

interface RecentActivity {
  id: string;
  employee_name: string;
  entry_type: 'entry' | 'exit';
  timestamp: string;
  snapshot_url?: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    todayAttendance: 0,
    onTimePercentage: 0,
    lateArrivals: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean;
    imageUrl: string | null;
    title: string;
  }>({
    isOpen: false,
    imageUrl: null,
    title: '',
  });
  const { workStartTime } = useWorkTimeSettings();

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time subscription for attendance records
    const subscription = supabase
      .channel('attendance_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance_records' },
        () => {
          console.log('Real-time update received, refreshing dashboard data');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id');
      
      if (employeesError) throw employeesError;

      // Fetch today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRecords, error: todayError } = await supabase
        .from('attendance_records')
        .select('employee_id, entry_type, timestamp')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`);

      if (todayError) throw todayError;
      const typedTodayRecords = todayRecords as Array<{ employee_id: string; entry_type: 'entry' | 'exit'; timestamp: string }>;

      // Count unique employees who attended today
      const uniqueEmployeesToday = new Set(typedTodayRecords?.map(r => r.employee_id) || []).size;

      // Calculate late arrivals and on-time percentage
      let lateArrivals = 0;
      let onTimeCount = 0;
      let totalArrivals = 0;
      const startTime = workStartTime || '09:00';
      typedTodayRecords?.forEach(record => {
        if (record.entry_type === 'entry') {
          totalArrivals++;
          const entryTime = new Date(record.timestamp);
          const entryHour = entryTime.getHours();
          const entryMinute = entryTime.getMinutes();
          const [startHour, startMinute] = startTime.split(':').map(Number);
          if (
            entryHour > startHour ||
            (entryHour === startHour && entryMinute > startMinute)
          ) {
            lateArrivals++;
          } else {
            onTimeCount++;
          }
        }
      });
      const onTimePercentage = totalArrivals > 0 ? Math.round((onTimeCount / totalArrivals) * 100) : 0;

      // Fetch recent activities from recent_activity
      const { data: activities, error: activitiesError } = await supabase
        .from('recent_activity')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      const formattedActivities: RecentActivity[] = activities?.map(activity => ({
        id: activity.id,
        employee_name: activity.employee_name,
        entry_type: activity.entry_type,
        timestamp: activity.timestamp,
        snapshot_url: activity.snapshot_url
      })) || [];

      setStats({
        totalEmployees: employees?.length || 0,
        todayAttendance: uniqueEmployeesToday,
        onTimePercentage,
        lateArrivals,
      });

      setRecentActivities(formattedActivities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageViewer = (imageUrl: string, employeeName: string, entryType: string) => {
    setImageViewer({
      isOpen: true,
      imageUrl,
      title: `${employeeName} - ${entryType === 'entry' ? 'Entry' : 'Exit'} Snapshot`,
    });
  };

  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      imageUrl: null,
      title: '',
    });
  };

  // Add this function to handle deleting a recent activity
  const handleDeleteActivity = async (activityId: string) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      const { error } = await supabase
        .from('recent_activity')
        .delete()
        .eq('id', activityId);
      if (error) throw error;
      setRecentActivities((prev) => prev.filter((a) => a.id !== activityId));
    } catch (error) {
      alert('Failed to delete activity.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Mobile-only: VisionPass logo at top left, Digital Vision logo at top right above dashboard title */}
      <div className="sm:hidden w-full relative mb-4" style={{ minHeight: '120px' }}>
        <img
          src="/lovable-uploads/vision pass.png"
          alt="VisionPass Logo"
          className="absolute top-0 left-0 h-32 w-auto object-contain"
          style={{ maxWidth: '180px' }}
        />
        <img
          src="/lovable-uploads/645e2f58-74f1-4736-9ed6-ce62d08f2a8d.png"
          alt="Digital Vision Logo"
          className="absolute top-0 right-0 h-28 w-auto object-contain"
          style={{ maxWidth: '160px' }}
        />
      </div>
      {/* Desktop-only: VisionPass logo centered above dashboard title */}
      <div className="hidden sm:flex w-full justify-center mb-4">
        <img
          src="/lovable-uploads/vision pass.png"
          alt="VisionPass Logo"
          className="h-32 w-auto object-contain drop-shadow-md"
          style={{ maxWidth: '260px' }}
        />
      </div>
      {/* Header with Digital Vision Logo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Face Recognition Attendance System Overview</p>
        </div>
        <div className="mt-4 sm:mt-0 hidden sm:block">
          <img 
            src="/lovable-uploads/645e2f58-74f1-4736-9ed6-ce62d08f2a8d.png" 
            alt="Digital Vision" 
            className="h-12 object-contain"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Registered in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">Employees present today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Time %</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.onTimePercentage}%</div>
            <p className="text-xs text-muted-foreground">Punctuality rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateArrivals}</div>
            <p className="text-xs text-muted-foreground">Today's late entries</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest attendance entries and exits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {activity.employee_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.entry_type === 'entry' ? 'Entered' : 'Exited'} at{' '}
                      {format(new Date(activity.timestamp), 'HH:mm')}
                    </p>
                  </div>
                  {activity.snapshot_url && (
                    <button
                      onClick={() => openImageViewer(activity.snapshot_url!, activity.employee_name, activity.entry_type)}
                      className="flex-shrink-0"
                    >
                      <img 
                        src={activity.snapshot_url} 
                        alt="Snapshot"
                        className="w-8 h-8 rounded object-cover border-2 border-gray-200 hover:border-blue-500 transition-colors cursor-pointer"
                      />
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteActivity(activity.id)}
                    className="ml-2 text-xs text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete Activity"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
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

export default Dashboard;
