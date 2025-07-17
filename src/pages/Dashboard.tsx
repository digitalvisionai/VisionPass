
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import RealTimeAttendance from '@/components/RealTimeAttendance';
import ImageViewer from '@/components/ImageViewer';

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
        .select('employee_id, entry_type')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`);

      if (todayError) throw todayError;

      // Count unique employees who attended today
      const uniqueEmployeesToday = new Set(todayRecords?.map(r => r.employee_id) || []).size;

      // Fetch recent activities with employee names
      const { data: activities, error: activitiesError } = await supabase
        .from('attendance_records')
        .select(`
          id,
          entry_type,
          timestamp,
          snapshot_url,
          employees!inner(name)
        `)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      const formattedActivities: RecentActivity[] = activities?.map(activity => ({
        id: activity.id,
        employee_name: (activity.employees as any).name,
        entry_type: activity.entry_type,
        timestamp: activity.timestamp,
        snapshot_url: activity.snapshot_url
      })) || [];

      setStats({
        totalEmployees: employees?.length || 0,
        todayAttendance: uniqueEmployeesToday,
        onTimePercentage: 85, // This would need more complex calculation based on work hours
        lateArrivals: 3, // This would need calculation based on work start time
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Header with Digital Vision Logo */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Face Recognition Attendance System Overview</p>
        </div>
        <div className="mt-4 sm:mt-0">
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

      {/* Real-time Components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Real-time Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Real-time Attendance</CardTitle>
            <CardDescription>Live attendance tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <RealTimeAttendance />
          </CardContent>
        </Card>

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
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

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
