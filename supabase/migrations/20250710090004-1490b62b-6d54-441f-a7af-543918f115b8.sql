
-- Create enum for entry/exit types
CREATE TYPE public.entry_type AS ENUM ('entry', 'exit');

-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  hire_date DATE,
  photo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE public.attendance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  entry_type public.entry_type NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admins table for admin management
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
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

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('faces', 'faces', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('snapshots', 'snapshots', true);

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

-- Insert the initial admin user (will be created after user signs up)
-- This will be handled by a trigger or manual insertion after authentication
