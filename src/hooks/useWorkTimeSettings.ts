import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useWorkTimeSettings = () => {
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchWorkTimeSettings = async () => {
    try {
      setLoading(true);
      
      const { data: startTimeData, error: startError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'work_start_time')
        .single();

      const { data: endTimeData, error: endError } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'work_end_time')
        .single();

      if (!startError && startTimeData) {
        setWorkStartTime(startTimeData.value as string);
      }
      
      if (!endError && endTimeData) {
        setWorkEndTime(endTimeData.value as string);
      }
    } catch (error) {
      console.error('Error fetching work time settings:', error);
      // Keep default values
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkTimeSettings();
  }, []);

  return { 
    workStartTime, 
    workEndTime, 
    loading, 
    refetch: fetchWorkTimeSettings 
  };
};
