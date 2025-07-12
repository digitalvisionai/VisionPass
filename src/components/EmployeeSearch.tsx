
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  job_class: string;
  hire_date: string;
}

interface EmployeeSearchProps {
  onEmployeeSelect: (employee: Employee) => void;
  selectedEmployee?: Employee | null;
  allEmployees?: Employee[];
}

const EmployeeSearch = ({ onEmployeeSelect, selectedEmployee, allEmployees }: EmployeeSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees([]);
      return;
    }

    const filtered = employees.filter(employee =>
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.phone?.includes(searchTerm)
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeSelect = (employee: Employee) => {
    onEmployeeSelect(employee);
    setSearchTerm(employee.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onEmployeeSelect(null as any);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search employees or click to see all..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={handleClear}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Dropdown - show all employees when no search term, or filtered results when searching */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading employees...
            </div>
          ) : searchTerm.trim() !== '' ? (
            // Show filtered results when searching
            filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No employees found matching "{searchTerm}"
              </div>
            ) : (
              filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                  onClick={() => handleEmployeeSelect(employee)}
                >
                  <div className="font-medium">{employee.name}</div>
                  <div className="text-sm text-gray-600">
                    {employee.email && `${employee.email} • `}
                    {employee.job_class}
                  </div>
                </div>
              ))
            )
          ) : (
            // Show all employees when no search term
            (allEmployees || employees).map((employee) => (
              <div
                key={employee.id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleEmployeeSelect(employee)}
              >
                <div className="font-medium">{employee.name}</div>
                <div className="text-sm text-gray-600">
                  {employee.email && `${employee.email} • `}
                  {employee.job_class}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default EmployeeSearch;
