
-- Insert test employees
INSERT INTO public.employees (name, email, phone, hire_date, is_active) VALUES
('John Smith', 'john.smith@company.com', '+1-555-0101', '2024-01-15', true),
('Sarah Johnson', 'sarah.johnson@company.com', '+1-555-0102', '2024-02-20', true),
('Michael Brown', 'michael.brown@company.com', '+1-555-0103', '2024-03-10', true),
('Emily Davis', 'emily.davis@company.com', '+1-555-0104', '2023-12-05', true),
('David Wilson', 'david.wilson@company.com', '+1-555-0105', '2024-01-30', false),
('Lisa Anderson', 'lisa.anderson@company.com', '+1-555-0106', '2023-11-15', true),
('Robert Martinez', 'robert.martinez@company.com', '+1-555-0107', '2024-04-01', true),
('Jennifer Taylor', 'jennifer.taylor@company.com', '+1-555-0108', '2024-02-14', true);

-- Insert test attendance records for the employees
-- We'll use the employee IDs that were generated
WITH employee_ids AS (
  SELECT id, name FROM public.employees
)
INSERT INTO public.attendance_records (employee_id, entry_type, timestamp, snapshot_url)
SELECT 
  e.id,
  CASE WHEN random() > 0.5 THEN 'entry'::public.entry_type ELSE 'exit'::public.entry_type END,
  NOW() - INTERVAL '1 day' * floor(random() * 30) - INTERVAL '1 hour' * floor(random() * 8),
  CASE WHEN random() > 0.7 THEN 'https://via.placeholder.com/150x150?text=' || substring(e.name from 1 for 1) ELSE NULL END
FROM employee_ids e
CROSS JOIN generate_series(1, 3) -- 3 records per employee
ORDER BY random();

-- Add some more recent attendance records
WITH employee_ids AS (
  SELECT id FROM public.employees LIMIT 5
)
INSERT INTO public.attendance_records (employee_id, entry_type, timestamp)
SELECT 
  e.id,
  'entry'::public.entry_type,
  NOW() - INTERVAL '1 hour' * floor(random() * 2)
FROM employee_ids e;
