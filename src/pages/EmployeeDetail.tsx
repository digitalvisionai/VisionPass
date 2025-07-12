import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Calendar, Camera, AlertTriangle, Edit, Trash2 } from 'lucide-react';
import { format, differenceInMinutes, isToday } from 'date-fns';
import EditEmployeeForm from '@/components/EditEmployeeForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { uploadEmployeePhoto, deleteEmployeePhoto } from '@/utils/photoUpload';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_class: string | null;
  hire_date: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AttendanceRecord {
  id: string;
  entry_type: string;
  timestamp: string;
  snapshot_url: string;
}

const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      // Fetch employee details
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Fetch attendance records
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', id)
        .order('timestamp', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendanceRecords(attendanceData || []);
    } catch (error) {
      console.error('Error fetching employee details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeUpdated = () => {
    fetchEmployeeDetails();
    setIsEditing(false);
  };

  const handleDeleteEmployee = async () => {
    if (!employee) return;
    
    setIsDeleting(true);
    try {
      // Delete employee photo from storage if it exists
      if (employee.photo_url) {
        const photoDeleted = await deleteEmployeePhoto(employee.name);
        if (photoDeleted) {
          console.log('Employee photo deleted successfully');
        } else {
          console.log('Photo deletion failed or photo not found');
        }
      }

      // Delete attendance records first (due to foreign key constraint)
      await supabase
        .from('attendance_records')
        .delete()
        .eq('employee_id', employee.id);

      // Delete the employee
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) throw error;

      toast({
        title: "Employee Deleted",
        description: `${employee.name} has been successfully removed from the system.`,
      });

      // Navigate back to employees list
      navigate('/employees');
    } catch (error) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: "Failed to delete employee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateBreakDuration = (records: AttendanceRecord[]) => {
    const longBreaks: Array<{ duration: number; date: string }> = [];
    
    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const next = records[i + 1];
      
      if (current.entry_type === 'entry' && next.entry_type === 'exit') {
        const duration = differenceInMinutes(
          new Date(current.timestamp),
          new Date(next.timestamp)
        );
        
        if (duration > 60) {
          longBreaks.push({
            duration,
            date: format(new Date(next.timestamp), 'MMM dd, yyyy')
          });
        }
      }
    }
    
    return longBreaks;
  };

  const getTodayRecords = () => {
    return attendanceRecords.filter(record => 
      isToday(new Date(record.timestamp))
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Employee Not Found</h1>
          <Button onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Employees
          </Button>
        </div>
      </div>
    );
  }

  const longBreaks = calculateBreakDuration(attendanceRecords);
  const todayRecords = getTodayRecords();

  if (isEditing) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit {employee.name}</h1>
            <p className="text-gray-600">Update employee information</p>
          </div>
        </div>
        <EditEmployeeForm 
          employee={employee} 
          onEmployeeUpdated={handleEmployeeUpdated}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.name}</h1>
            <p className="text-gray-600">Employee Details & Attendance</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Employee
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Employee
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete {employee.name}'s 
                  profile, attendance records, and remove their photo from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteEmployee}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Employee'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Info */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee.photo_url && (
              <div className="flex justify-center">
                <img 
                  src={employee.photo_url} 
                  alt={employee.name}
                  className="w-24 h-24 rounded-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <div>
                <span className="font-medium">Name:</span> {employee.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {employee.email || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {employee.phone || 'N/A'}
              </div>
              <div>
                <span className="font-medium">Hire Date:</span>{' '}
                {employee.hire_date 
                  ? format(new Date(employee.hire_date), 'MMM dd, yyyy')
                  : 'N/A'
                }
              </div>
              <div>
                <span className="font-medium">Job Class:</span> {employee.job_class || 'Employee'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayRecords.length === 0 ? (
              <p className="text-gray-500">No activity today</p>
            ) : (
              <div className="space-y-2">
                {todayRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        record.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className="capitalize font-medium">{record.entry_type}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {format(new Date(record.timestamp), 'HH:mm')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Violations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              Long Breaks
            </CardTitle>
            <CardDescription>Breaks over 1 hour</CardDescription>
          </CardHeader>
          <CardContent>
            {longBreaks.length === 0 ? (
              <p className="text-green-600">No violations found</p>
            ) : (
              <div className="space-y-2">
                {longBreaks.map((breakInfo, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded border-l-4 border-red-500">
                    <div className="font-medium text-red-700">
                      {Math.floor(breakInfo.duration / 60)}h {breakInfo.duration % 60}m
                    </div>
                    <div className="text-sm text-red-600">{breakInfo.date}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Attendance History
          </CardTitle>
          <CardDescription>Complete attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records found</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {attendanceRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      record.entry_type === 'entry' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <div>
                      <p className="font-medium capitalize">{record.entry_type}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(record.timestamp), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  {record.snapshot_url && (
                    <div className="flex items-center space-x-2">
                      <Camera className="h-4 w-4 text-gray-500" />
                      <img 
                        src={record.snapshot_url} 
                        alt="Snapshot"
                        className="w-12 h-12 rounded object-cover cursor-pointer"
                        onClick={() => window.open(record.snapshot_url, '_blank')}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDetail;
