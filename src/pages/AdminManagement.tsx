
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, UserPlus, Users, Trash2, Settings, UserPen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import WorkingHoursSettings from '@/components/WorkingHoursSettings';
import AddEmployeeForm from '@/components/AddEmployeeForm';
import { deleteEmployeePhoto } from '@/utils/photoUpload';
import EditEmployeeForm from '@/components/EditEmployeeForm';
import WorkTimeSettings from '@/components/WorkTimeSettings';
import { useWorkTimeSettings } from '@/hooks/useWorkTimeSettings';

interface Admin {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

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

const AdminManagement = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const workTimeSettings = useWorkTimeSettings();

  useEffect(() => {
    fetchAdmins();
    fetchEmployees();
  }, []);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdmins(data || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admins",
        variant: "destructive",
      });
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setAddingAdmin(true);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: adminError } = await supabase
          .from('admins')
          .insert({
            user_id: authData.user.id,
            name: newAdmin.name,
            email: newAdmin.email,
          });

        if (adminError) throw adminError;
      }

      toast({
        title: "Success",
        description: "Admin added successfully",
      });

      setNewAdmin({ name: '', email: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add admin",
        variant: "destructive",
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;

    try {
      const { error } = await supabase
        .from('admins')
        .delete()
        .eq('id', adminId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Admin deleted successfully",
      });

      fetchAdmins();
    } catch (error: any) {
      console.error('Error deleting admin:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
      // Find the employee to get their name for photo deletion
      const employee = employees.find(e => e.id === employeeId);
      if (employee) {
        await deleteEmployeePhoto(employee.name);
      }
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Employee deleted successfully",
      });

      fetchEmployees();
    } catch (error: any) {
      console.error('Error deleting employee:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">Manage administrators, employees, and system settings</p>
        </div>
        {/* Remove logos here */}
      </div>

      <Tabs defaultValue="admins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="admins">Admins</TabsTrigger>
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  System Administrators
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Add Admin</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Administrator</DialogTitle>
                      <DialogDescription>
                        Create a new admin account with full system access
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddAdmin} className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={newAdmin.name}
                          onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                          placeholder="Enter full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newAdmin.email}
                          onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newAdmin.password}
                          onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                          placeholder="Enter password"
                        />
                      </div>
                      <Button type="submit" disabled={addingAdmin}>
                        {addingAdmin ? 'Adding...' : 'Add Admin'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Manage system administrators who have full access to the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.name}</TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>{format(new Date(admin.created_at), 'PPP')}</TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAdmin(admin.id)}
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Employee Management
                </div>
                <Dialog open={showAddEmployee} onOpenChange={setShowAddEmployee}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center space-x-2">
                      <UserPlus className="h-4 w-4" />
                      <span>Add Employee</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>
                        Add a new employee to the system
                      </DialogDescription>
                    </DialogHeader>
                    <AddEmployeeForm onSuccess={() => {
                      setShowAddEmployee(false);
                      fetchEmployees();
                    }} />
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <CardDescription>
                Manage all employees in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Hire Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.name}</TableCell>
                      <TableCell>{employee.email || '-'}</TableCell>
                      <TableCell>{employee.job_class || 'Employee'}</TableCell>
                      <TableCell>
                        {employee.hire_date 
                          ? format(new Date(employee.hire_date), 'MMM dd, yyyy')
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEmployee(employee)}
                          className="flex items-center space-x-1 ml-2"
                        >
                          <UserPen className="h-3 w-3" />
                          <span>Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="space-y-6">
            <WorkingHoursSettings />
            <WorkTimeSettings 
              workStartTime={workTimeSettings.workStartTime} 
              workEndTime={workTimeSettings.workEndTime} 
              onUpdate={workTimeSettings.refetch} 
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => { if (!open) setEditingEmployee(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Edit employee information and photo</DialogDescription>
          </DialogHeader>
          {editingEmployee && (
            <EditEmployeeForm
              employee={editingEmployee}
              onEmployeeUpdated={() => {
                setEditingEmployee(null);
                fetchEmployees();
              }}
              onCancel={() => setEditingEmployee(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManagement;
