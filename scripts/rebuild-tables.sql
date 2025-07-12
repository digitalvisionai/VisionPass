-- Rebuild all tables for the attendance system
-- This script will create tables if they don't exist and won't duplicate them

-- Create enum for entry/exit types (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_type') THEN
        CREATE TYPE public.entry_type AS ENUM ('entry', 'exit');
    END IF;
END $$;

-- Create employees table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  entry_type public.entry_type NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admins table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create settings table (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin (only if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = is_admin.user_id
  );
$$;

-- Drop existing policies to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "Admins can view all employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can update employees" ON public.employees;
DROP POLICY IF EXISTS "Admins can delete employees" ON public.employees;

DROP POLICY IF EXISTS "Admins can view all attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can insert attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can update attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Admins can delete attendance records" ON public.attendance_records;

DROP POLICY IF EXISTS "Admins can view all admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON public.admins;

DROP POLICY IF EXISTS "Admins can view settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can insert settings" ON public.settings;

-- RLS Policies for employees (admin only)
CREATE POLICY "Admins can view all employees" 
  ON public.employees FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert employees" 
  ON public.employees FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update employees" 
  ON public.employees FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete employees" 
  ON public.employees FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- RLS Policies for attendance_records (admin only)
CREATE POLICY "Admins can view all attendance records" 
  ON public.attendance_records FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert attendance records" 
  ON public.attendance_records FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update attendance records" 
  ON public.attendance_records FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete attendance records" 
  ON public.attendance_records FOR DELETE 
  USING (public.is_admin(auth.uid()));

-- RLS Policies for admins (admin only)
CREATE POLICY "Admins can view all admins" 
  ON public.admins FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert new admins" 
  ON public.admins FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for settings (admin only)
CREATE POLICY "Admins can view settings" 
  ON public.settings FOR SELECT 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update settings" 
  ON public.settings FOR UPDATE 
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert settings" 
  ON public.settings FOR INSERT 
  WITH CHECK (public.is_admin(auth.uid()));

-- Create storage buckets (only if they don't exist)
INSERT INTO storage.buckets (id, name, public) VALUES 
('faces', 'faces', true),
('snapshots', 'snapshots', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to avoid conflicts, then recreate them
DROP POLICY IF EXISTS "Admins can view faces" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload faces" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update faces" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete faces" ON storage.objects;

DROP POLICY IF EXISTS "Admins can view snapshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload snapshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update snapshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete snapshots" ON storage.objects;

-- Storage policies for faces bucket
CREATE POLICY "Admins can view faces" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'faces' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload faces" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'faces' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update faces" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'faces' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete faces" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'faces' AND public.is_admin(auth.uid()));

-- Storage policies for snapshots bucket
CREATE POLICY "Admins can view snapshots" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'snapshots' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can upload snapshots" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'snapshots' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can update snapshots" 
  ON storage.objects FOR UPDATE 
  USING (bucket_id = 'snapshots' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete snapshots" 
  ON storage.objects FOR DELETE 
  USING (bucket_id = 'snapshots' AND public.is_admin(auth.uid()));

-- Insert default settings (only if they don't exist)
INSERT INTO public.settings (key, value) VALUES 
('working_hours', '"8"'),
('attendance_start_time', '"08:00"'),
('attendance_end_time', '"17:00"')
ON CONFLICT (key) DO NOTHING;

-- Display current table status
SELECT 
    'Tables Status' as info,
    'All tables created successfully' as status
UNION ALL
SELECT 
    'Employees' as info,
    COUNT(*)::TEXT || ' records' as status
FROM public.employees
UNION ALL
SELECT 
    'Attendance Records' as info,
    COUNT(*)::TEXT || ' records' as status
FROM public.attendance_records
UNION ALL
SELECT 
    'Settings' as info,
    COUNT(*)::TEXT || ' records' as status
FROM public.settings
UNION ALL
SELECT 
    'Admins' as info,
    COUNT(*)::TEXT || ' records' as status
FROM public.admins; 