
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 min-h-screen bg-gray-100">
      <div className="pt-2 md:pt-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">Face Recognition Attendance System Overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">Active employees</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Badge variant="default" className="px-2 py-1">
              <Users className="h-3 w-3 mr-1" />
              {stats.presentToday}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.presentToday}</div>
            <p className="text-xs text-muted-foreground">Checked in today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Badge variant="secondary" className="px-2 py-1">
              <Clock className="h-3 w-3 mr-1" />
              {stats.lateToday}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lateToday}</div>
            <p className="text-xs text-muted-foreground">Late today</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long Breaks</CardTitle>
            <Badge variant="destructive" className="px-2 py-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stats.longBreaks}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.longBreaks}</div>
            <p className="text-xs text-muted-foreground">Over 1 hour</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Recent Activity</CardTitle>
          <CardDescription>Latest employee entries and exits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                      activity.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{activity.employee_name}</p>
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
                      className="w-10 h-10 md:w-12 md:h-12 rounded-md object-cover flex-shrink-0 ml-3"
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Attendance */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Real-time Attendance</CardTitle>
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
