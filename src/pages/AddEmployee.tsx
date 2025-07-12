
import React, { useState } from 'react';
import AddEmployeeForm from '@/components/AddEmployeeForm';
import { useNavigate } from 'react-router-dom';

const AddEmployee = () => {
  const navigate = useNavigate();

  const handleEmployeeAdded = () => {
    // Navigate to employees page after successful addition
    navigate('/employees');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-600">Create a new employee record</p>
      </div>
      <AddEmployeeForm onEmployeeAdded={handleEmployeeAdded} />
    </div>
  );
};

export default AddEmployee;
