import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { UserPen, Upload, Save } from 'lucide-react';
import { uploadEmployeePhoto } from '@/utils/photoUpload';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_class: string | null;
  hire_date: string | null;
  photo_url: string | null;
}

interface EditEmployeeFormProps {
  employee: Employee;
  onEmployeeUpdated?: () => void;
  onCancel?: () => void;
}

const EditEmployeeForm = ({ employee, onEmployeeUpdated, onCancel }: EditEmployeeFormProps) => {
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email || '',
    phone: employee.phone || '',
    job_class: employee.job_class || 'Employee',
    hire_date: employee.hire_date || '',
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting employee update with data:', formData);

      let photoUrl = employee.photo_url;

      // Upload new photo if provided
      if (photo) {
        const newPhotoUrl = await uploadEmployeePhoto(photo, formData.name);
        if (newPhotoUrl) {
          photoUrl = newPhotoUrl;
        }
      }

      // Update employee record
      const { error: updateError } = await supabase
        .from('employees')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          job_class: formData.job_class,
          hire_date: formData.hire_date || null,
          photo_url: photoUrl
        })
        .eq('id', employee.id);

      if (updateError) {
        console.error('Employee update error:', updateError);
        throw updateError;
      }

      toast({
        title: "Success",
        description: "Employee updated successfully!",
      });

      if (onEmployeeUpdated) {
        onEmployeeUpdated();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      toast({
        title: "Error",
        description: `Failed to update employee: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPen className="h-5 w-5 mr-2" />
          Edit Employee
        </CardTitle>
        <CardDescription>
          Update employee information and photo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {employee.photo_url && (
            <div className="flex justify-center mb-4">
              <img 
                src={employee.photo_url} 
                alt={employee.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter email address"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Enter phone number"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="job_class">Job Title</Label>
              <Input
                id="job_class"
                name="job_class"
                value={formData.job_class}
                onChange={handleInputChange}
                placeholder="Enter job title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hire_date">Hire Date</Label>
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                value={formData.hire_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="photo">Update Employee Photo</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="flex-1"
              />
              <Upload className="h-4 w-4 text-gray-500" />
            </div>
            {photo && (
              <p className="text-sm text-gray-600">Selected: {photo.name}</p>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={loading || !formData.name}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Updating...' : 'Update Employee'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditEmployeeForm;
