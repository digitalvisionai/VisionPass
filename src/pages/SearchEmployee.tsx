
import React from 'react';
import EmployeeSearch from '@/components/EmployeeSearch';

const SearchEmployee = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Search Employee</h1>
        <p className="text-gray-600">Find employees by name, ID, or email</p>
      </div>
      <EmployeeSearch />
    </div>
  );
};

export default SearchEmployee;
