
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSettings = () => {
  const [workingHours, setWorkingHours] = useState(8);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWorkingHours = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'working_hours')
        .single();

      if (error) throw error;
      
      setWorkingHours(parseInt(data.value as string));
    } catch (error) {
      console.error('Error fetching working hours:', error);
      setWorkingHours(8); // Default fallback
    } finally {
      setLoading(false);
    }
  };

  const updateWorkingHours = async (hours: number) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          key: 'working_hours', 
          value: hours.toString() 
        });

      if (error) throw error;

      setWorkingHours(hours);
      toast({
        title: "Success",
        description: "Working hours updated successfully",
      });
    } catch (error) {
      console.error('Error updating working hours:', error);
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkingHours();
  }, []);

  return { workingHours, updateWorkingHours, loading };
};
