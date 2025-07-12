
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

export interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  job_class: string;
  hire_date: string;
  photo_url: string;
}

export const useEmployeeForm = () => {
  const initialFormData: EmployeeFormData = {
    name: '',
    email: '',
    phone: '',
    job_class: 'Employee',
    hire_date: '',
    photo_url: ''
  };

  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
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

  const resetForm = () => {
    setFormData(initialFormData);
    setPhoto(null);
  };

  return {
    formData,
    setFormData,
    photo,
    setPhoto,
    loading,
    setLoading,
    handleInputChange,
    handlePhotoChange,
    resetForm
  };
};
