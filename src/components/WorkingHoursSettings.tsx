
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock } from 'lucide-react';
import { useSettings } from '@/hooks/useSettings';

const WorkingHoursSettings = () => {
  const { workingHours, updateWorkingHours, loading } = useSettings();
  const [tempHours, setTempHours] = useState(workingHours);

  React.useEffect(() => {
    setTempHours(workingHours);
  }, [workingHours]);

  const handleSave = () => {
    updateWorkingHours(tempHours);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          Working Hours Configuration
        </CardTitle>
        <CardDescription>
          Set the standard working hours for calculating leak time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="working-hours">Working Hours per Day</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="working-hours"
              type="number"
              min="1"
              max="24"
              value={tempHours}
              onChange={(e) => setTempHours(parseInt(e.target.value) || 8)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">hours</span>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading || tempHours === workingHours}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkingHoursSettings;
