
-- Add work time settings to the settings table
INSERT INTO public.settings (key, value) 
VALUES 
  ('work_start_time', '"09:00"'::jsonb),
  ('work_end_time', '"17:00"'::jsonb)
ON CONFLICT (key) DO NOTHING;
