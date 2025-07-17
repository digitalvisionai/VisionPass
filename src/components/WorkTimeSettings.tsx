
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface WorkTimeSettingsProps {
  workStartTime: string;
  workEndTime: string;
  onUpdate: () => void;
}

const WorkTimeSettings: React.FC<WorkTimeSettingsProps> = ({
  workStartTime,
  workEndTime,
  onUpdate
}) => {
  const [startTime, setStartTime] = useState(workStartTime);
  const [endTime, setEndTime] = useState(workEndTime);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update start time
      const { error: startError } = await supabase
        .from('settings')
        .upsert({ 
          key: 'work_start_time', 
          value: `"${startTime}"` 
        });

      if (startError) throw startError;

      // Update end time
      const { error: endError } = await supabase
        .from('settings')
        .upsert({ 
          key: 'work_end_time', 
          value: `"${endTime}"` 
        });

      if (endError) throw endError;

      toast({
        title: "Success",
        description: "Work time settings updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating work time settings:', error);
      toast({
        title: "Error",
        description: "Failed to update work time settings",
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
          <Clock className="h-5 w-5 mr-2" />
          Work Time Settings
        </CardTitle>
        <CardDescription>
          Set the standard work hours for attendance tracking
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Work Start Time</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Work End Time</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="w-full sm:w-auto"
        >
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Work Time Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default WorkTimeSettings;
