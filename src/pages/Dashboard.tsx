
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Clock, TrendingUp, Camera } from 'lucide-react';
import { format } from 'date-fns';
import RealTimeAttendance from '@/components/RealTimeAttendance';

interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  lateToday: number;
  longBreaks: number;
}

interface RecentActivity {
  id: string;
  employee_name: string;
  entry_type: string;
  timestamp: string;
  snapshot_url: string;
}

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    longBreaks: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Get total employees
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true });

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance_records')
        .select(`
          *,
          employees!fk_attendance_employee(name)
        `)
        .gte('timestamp', `${today}T00:00:00.000Z`)
        .lt('timestamp', `${today}T23:59:59.999Z`)
        .order('timestamp', { ascending: false });

      // Calculate present employees (those who have entry records today)
      const presentEmployees = new Set();
      todayAttendance?.forEach(record => {
        if (record.entry_type === 'entry') {
          presentEmployees.add(record.employee_id);
        }
      });

      // Get recent activity (last 20 records)
      const { data: recent } = await supabase
        .from('attendance_records')
        .select(`
          id,
          entry_type,
          timestamp,
          snapshot_url,
          employees!fk_attendance_employee(name)
        `)
        .order('timestamp', { ascending: false })
        .limit(20);

      const recentFormatted = recent?.map(record => ({
        id: record.id,
        employee_name: record.employees?.name || 'Unknown',
        entry_type: record.entry_type,
        timestamp: record.timestamp,
        snapshot_url: record.snapshot_url
      })) || [];

      setStats({
        totalEmployees: totalEmployees || 0,
        presentToday: presentEmployees.size,
        lateToday: 0, // This would require business logic for late definition
        longBreaks: 0 // This would require calculating break durations
      });

      setRecentActivity(recentFormatted);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Face Recognition Attendance System Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Badge variant="default">
              <Users className="h-4 w-4 mr-1" />
              {stats.presentToday}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Checked in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Badge variant="secondary">
              <Clock className="h-4 w-4 mr-1" />
              {stats.lateToday}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long Breaks</CardTitle>
            <Badge variant="destructive">
              <TrendingUp className="h-4 w-4 mr-1" />
              {stats.longBreaks}
            </Badge>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Over 1 hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest employee entries and exits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      activity.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium">{activity.employee_name}</p>
                      <p className="text-sm text-gray-600">
                        {activity.entry_type === 'entry' ? 'Entered' : 'Exited'} at{' '}
                        {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  {activity.snapshot_url && (
                    <img 
                      src={activity.snapshot_url} 
                      alt="Snapshot"
                      className="w-12 h-12 rounded-md object-cover"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Attendance</CardTitle>
          <CardDescription>Live updates of employee attendance</CardDescription>
        </CardHeader>
        <CardContent>
          <RealTimeAttendance />
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
