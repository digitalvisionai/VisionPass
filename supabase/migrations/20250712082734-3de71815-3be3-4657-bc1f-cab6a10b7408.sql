
-- Add job_class column to employees table to store job titles
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS job_class TEXT DEFAULT 'Employee';

-- Create a settings table to store working hours configuration
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage settings
CREATE POLICY "Admins can manage settings" 
  ON public.settings 
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Insert default working hours setting (8 hours)
INSERT INTO public.settings (key, value) 
VALUES ('working_hours', '8'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Add foreign key constraint for attendance_records -> employees
ALTER TABLE public.attendance_records 
ADD CONSTRAINT fk_attendance_employee 
FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_timestamp 
ON public.attendance_records(employee_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_attendance_timestamp 
ON public.attendance_records(timestamp);

-- Create a function to get daily attendance summary
CREATE OR REPLACE FUNCTION get_daily_attendance_summary(target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  employee_id UUID,
  employee_name TEXT,
  job_class TEXT,
  entry_time TIMESTAMP WITH TIME ZONE,
  exit_time TIMESTAMP WITH TIME ZONE,
  entry_snapshot TEXT,
  exit_snapshot TEXT,
  attendance_minutes INTEGER,
  working_hours_minutes INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  working_hours_setting INTEGER;
BEGIN
  -- Get working hours from settings
  SELECT (value::text)::integer INTO working_hours_setting
  FROM public.settings 
  WHERE key = 'working_hours';
  
  -- Default to 8 hours if not set
  working_hours_setting := COALESCE(working_hours_setting, 8);

  RETURN QUERY
  WITH daily_records AS (
    SELECT DISTINCT
      e.id as emp_id,
      e.name as emp_name,
      COALESCE(e.job_class, 'Employee') as emp_job_class,
      (
        SELECT ar1.timestamp 
        FROM attendance_records ar1 
        WHERE ar1.employee_id = e.id 
          AND ar1.entry_type = 'entry'
          AND DATE(ar1.timestamp) = target_date
        ORDER BY ar1.timestamp ASC 
        LIMIT 1
      ) as entry_ts,
      (
        SELECT ar2.timestamp 
        FROM attendance_records ar2 
        WHERE ar2.employee_id = e.id 
          AND ar2.entry_type = 'exit'
          AND DATE(ar2.timestamp) = target_date
        ORDER BY ar2.timestamp DESC 
        LIMIT 1
      ) as exit_ts,
      (
        SELECT ar3.snapshot_url 
        FROM attendance_records ar3 
        WHERE ar3.employee_id = e.id 
          AND ar3.entry_type = 'entry'
          AND DATE(ar3.timestamp) = target_date
        ORDER BY ar3.timestamp ASC 
        LIMIT 1
      ) as entry_snap,
      (
        SELECT ar4.snapshot_url 
        FROM attendance_records ar4 
        WHERE ar4.employee_id = e.id 
          AND ar4.entry_type = 'exit'
          AND DATE(ar4.timestamp) = target_date
        ORDER BY ar4.timestamp DESC 
        LIMIT 1
      ) as exit_snap
    FROM employees e
    WHERE e.is_active = true
  )
  SELECT 
    dr.emp_id,
    dr.emp_name,
    dr.emp_job_class,
    dr.entry_ts,
    dr.exit_ts,
    dr.entry_snap,
    dr.exit_snap,
    CASE 
      WHEN dr.entry_ts IS NOT NULL AND dr.exit_ts IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (dr.exit_ts - dr.entry_ts))::INTEGER / 60
      ELSE 0 
    END as attendance_minutes,
    working_hours_setting * 60 as working_hours_minutes
  FROM daily_records dr
  ORDER BY dr.emp_name;
END;
$$;
