
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmployeeFormData } from '@/hooks/useEmployeeForm';

interface EmployeeFormFieldsProps {
  formData: EmployeeFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const EmployeeFormFields = ({ formData, onInputChange }: EmployeeFormFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            
      <div className="space-y-2">
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={onInputChange}
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
          onChange={onInputChange}
          placeholder="Enter email address"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={onInputChange}
          placeholder="Enter phone number"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="job_class">Job Class</Label>
        <Input
          id="job_class"
          name="job_class"
          value={formData.job_class}
          onChange={onInputChange}
          placeholder="Enter job class"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="hire_date">Hire Date</Label>
        <Input
          id="hire_date"
          name="hire_date"
          type="date"
          value={formData.hire_date}
          onChange={onInputChange}
        />
      </div>
    </div>
  );
};

export default EmployeeFormFields;
