
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, User } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  job_class: string | null;
  photo_url: string | null;
}

interface EmployeeSearchProps {
  onEmployeeSelect?: (employee: Employee) => void;
}

const EmployeeSearch: React.FC<EmployeeSearchProps> = ({ onEmployeeSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEmployees([]);
    } else {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.phone?.includes(searchTerm)
      );
      setFilteredEmployees(filtered);
    }
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

  const handleEmployeeClick = (employee: Employee) => {
    if (onEmployeeSelect) {
      onEmployeeSelect(employee);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Search Employees
        </CardTitle>
        <CardDescription>
          Search for employees by name, email, or phone number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Enter name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}

          {searchTerm && filteredEmployees.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              No employees found matching "{searchTerm}"
            </div>
          )}

          {filteredEmployees.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeClick(employee)}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    {employee.photo_url ? (
                      <img
                        src={employee.photo_url}
                        alt={employee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{employee.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {employee.email || employee.phone || employee.job_class || 'No contact info'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployeeSearch;
