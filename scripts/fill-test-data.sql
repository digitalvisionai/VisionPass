-- Fill Supabase with random test data
-- This script will create employees and attendance records for testing

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM public.attendance_records;
-- DELETE FROM public.employees;

-- Insert test employees with proper UUIDs
INSERT INTO public.employees (id, name, email, phone, hire_date, photo_url) VALUES
(gen_random_uuid(), 'John Smith', 'john.smith@company.com', '+1-555-0101', '2024-01-15', 'https://via.placeholder.com/150x150?text=JS'),
(gen_random_uuid(), 'Sarah Johnson', 'sarah.johnson@company.com', '+1-555-0102', '2024-02-20', 'https://via.placeholder.com/150x150?text=SJ'),
(gen_random_uuid(), 'Michael Brown', 'michael.brown@company.com', '+1-555-0103', '2024-03-10', 'https://via.placeholder.com/150x150?text=MB'),
(gen_random_uuid(), 'Emily Davis', 'emily.davis@company.com', '+1-555-0104', '2023-12-05', 'https://via.placeholder.com/150x150?text=ED'),
(gen_random_uuid(), 'David Wilson', 'david.wilson@company.com', '+1-555-0105', '2024-01-30', 'https://via.placeholder.com/150x150?text=DW'),
(gen_random_uuid(), 'Lisa Anderson', 'lisa.anderson@company.com', '+1-555-0106', '2023-11-15', 'https://via.placeholder.com/150x150?text=LA'),
(gen_random_uuid(), 'Robert Martinez', 'robert.martinez@company.com', '+1-555-0107', '2024-04-01', 'https://via.placeholder.com/150x150?text=RM'),
(gen_random_uuid(), 'Jennifer Taylor', 'jennifer.taylor@company.com', '+1-555-0108', '2024-02-14', 'https://via.placeholder.com/150x150?text=JT'),
(gen_random_uuid(), 'Christopher Lee', 'chris.lee@company.com', '+1-555-0109', '2024-05-01', 'https://via.placeholder.com/150x150?text=CL'),
(gen_random_uuid(), 'Amanda Garcia', 'amanda.garcia@company.com', '+1-555-0110', '2024-03-15', 'https://via.placeholder.com/150x150?text=AG');

-- Function to generate random attendance records for the last 30 days
CREATE OR REPLACE FUNCTION generate_test_attendance()
RETURNS VOID AS $$
DECLARE
    emp RECORD;
    work_date DATE;
    entry_time TIMESTAMP;
    exit_time TIMESTAMP;
    working_hours INTEGER;
    i INTEGER;
BEGIN
    -- Loop through each employee
    FOR emp IN SELECT id, name FROM public.employees LOOP
        -- Generate attendance for the last 30 days
        FOR i IN 0..29 LOOP
            work_date := CURRENT_DATE - INTERVAL '1 day' * i;
            
            -- Skip weekends (Saturday = 6, Sunday = 0)
            IF EXTRACT(DOW FROM work_date) NOT IN (0, 6) THEN
                -- Generate random working hours (6-10 hours)
                working_hours := 6 + floor(random() * 5);
                
                -- Generate entry time between 7 AM and 10 AM
                entry_time := work_date + INTERVAL '7 hours' + INTERVAL '1 minute' * floor(random() * 180);
                
                -- Generate exit time based on working hours
                exit_time := entry_time + INTERVAL '1 hour' * working_hours + INTERVAL '1 minute' * floor(random() * 60);
                
                -- Insert entry record
                INSERT INTO public.attendance_records (employee_id, entry_type, timestamp, snapshot_url)
                VALUES (
                    emp.id,
                    'entry',
                    entry_time,
                    'https://via.placeholder.com/150x150?text=' || substring(emp.name from 1 for 1) || 'E'
                );
                
                -- Insert exit record
                INSERT INTO public.attendance_records (employee_id, entry_type, timestamp, snapshot_url)
                VALUES (
                    emp.id,
                    'exit',
                    exit_time,
                    'https://via.placeholder.com/150x150?text=' || substring(emp.name from 1 for 1) || 'X'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to generate test data
SELECT generate_test_attendance();

-- Drop the function after use
DROP FUNCTION generate_test_attendance();

-- Add some variation (some employees missing some days, late arrivals, etc.)
-- Randomly remove some attendance records to simulate missing days
DELETE FROM public.attendance_records 
WHERE id IN (
    SELECT id FROM public.attendance_records 
    WHERE random() < 0.1  -- 10% chance of deletion
    LIMIT (SELECT COUNT(*) * 0.1 FROM public.attendance_records)
);

-- Add some late arrivals (entry after 9 AM)
UPDATE public.attendance_records 
SET timestamp = timestamp + INTERVAL '2 hours' + INTERVAL '1 minute' * floor(random() * 60)
WHERE entry_type = 'entry' 
AND random() < 0.15  -- 15% chance of late arrival
AND EXTRACT(HOUR FROM timestamp) < 9;

-- Add some early exits (exit before 5 PM)
UPDATE public.attendance_records 
SET timestamp = timestamp - INTERVAL '2 hours' + INTERVAL '1 minute' * floor(random() * 60)
WHERE entry_type = 'exit' 
AND random() < 0.1  -- 10% chance of early exit
AND EXTRACT(HOUR FROM timestamp) > 17;

-- Create settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
('working_hours', '"8"'),
('attendance_start_time', '"08:00"'),
('attendance_end_time', '"17:00"')
ON CONFLICT (key) DO NOTHING;

-- Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;

-- Create RLS policies for settings
CREATE POLICY "Admins can view settings" 
  ON public.settings FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" 
  ON public.settings FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings" 
  ON public.settings FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Display summary
SELECT 
    'Employees' as table_name,
    COUNT(*) as record_count
FROM public.employees
UNION ALL
SELECT 
    'Attendance Records' as table_name,
    COUNT(*) as record_count
FROM public.attendance_records
UNION ALL
SELECT 
    'Settings' as table_name,
    COUNT(*) as record_count
FROM public.settings; 