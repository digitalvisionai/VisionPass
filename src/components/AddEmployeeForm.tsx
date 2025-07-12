
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import { useEmployeeForm } from '@/hooks/useEmployeeForm';
import EmployeeFormFields from './EmployeeFormFields';
import PhotoUpload from './PhotoUpload';
import { uploadEmployeePhoto } from '@/utils/photoUpload';

interface AddEmployeeFormProps {
  onEmployeeAdded?: () => void;
  onSuccess?: () => void;
}

const AddEmployeeForm = ({ onEmployeeAdded, onSuccess }: AddEmployeeFormProps) => {
  const {
    formData,
    setFormData,
    photo,
    loading,
    setLoading,
    handleInputChange,
    handlePhotoChange,
    resetForm
  } = useEmployeeForm();
  
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Starting employee creation');
      console.log('Form data:', formData);
      
      // Check authentication status
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', session ? 'Found' : 'None');
      if (sessionError) {
        console.error('Session error:', sessionError);
      }

      // Prepare the employee data
      const employeeData = {
        name: formData.name.trim(),
        email: formData.email ? formData.email.trim() : null,
        phone: formData.phone ? formData.phone.trim() : null,
        job_class: formData.job_class,
        hire_date: formData.hire_date || null,
        photo_url: formData.photo_url
      };

      console.log('Prepared employee data:', employeeData);

      // Create the employee record
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .insert(employeeData)
        .select()
        .single();

      console.log('Employee insert result:', { employee, employeeError });

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        throw employeeError;
      }

      // Upload photo if provided
      let photoUrl = null;
      if (photo && employee) {
        photoUrl = await uploadEmployeePhoto(photo, employee.name);
        
        if (photoUrl) {
          // Update employee record with photo URL
          const { error: updateError } = await supabase
            .from('employees')
            .update({ photo_url: photoUrl })
            .eq('id', employee.id);

          if (updateError) {
            console.error('Error updating photo URL:', updateError);
          } else {
            console.log('Photo URL updated successfully');
          }
        }
      }

      toast({
        title: "Success",
        description: `Employee added successfully with ID: ${employee.id}`,
      });

      // Reset form
      resetForm();
      
      if (onEmployeeAdded) {
        onEmployeeAdded();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error adding employee:', error);
      toast({
        title: "Error",
        description: `Failed to add employee: ${error.message || 'Unknown error'}`,
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
          <UserPlus className="h-5 w-5 mr-2" />
          Add New Employee
        </CardTitle>
        <CardDescription>
          Create a new employee record with photo upload (Employee ID will be auto-generated)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EmployeeFormFields 
            formData={formData} 
            onInputChange={handleInputChange}
          />
          
          <PhotoUpload 
            photo={photo} 
            onPhotoChange={handlePhotoChange} 
          />
          
          <Button type="submit" disabled={loading || !formData.name}>
            {loading ? 'Adding Employee...' : 'Add Employee'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddEmployeeForm;
