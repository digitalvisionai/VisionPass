-- Create recent_activity table
CREATE TABLE IF NOT EXISTS public.recent_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id UUID REFERENCES attendance_records(id) ON DELETE CASCADE,
  employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('entry', 'exit')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  snapshot_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_recent_activity_timestamp ON public.recent_activity(timestamp DESC); 