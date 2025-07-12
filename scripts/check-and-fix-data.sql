-- Check and fix data for today
-- This script will check what data exists and add some records for today

-- First, let's see what data we have
SELECT 
    'Current date in database:' as info,
    CURRENT_DATE as value
UNION ALL
SELECT 
    'Total employees:' as info,
    COUNT(*)::text as value
FROM public.employees
UNION ALL
SELECT 
    'Total attendance records:' as info,
    COUNT(*)::text as value
FROM public.attendance_records
UNION ALL
SELECT 
    'Records for today:' as info,
    COUNT(*)::text as value
FROM public.attendance_records 
WHERE DATE(timestamp) = CURRENT_DATE;

-- Check the date range of existing records
SELECT 
    'Date range of records:' as info,
    MIN(DATE(timestamp))::text || ' to ' || MAX(DATE(timestamp))::text as value
FROM public.attendance_records;

-- Add some records for today if none exist
INSERT INTO public.attendance_records (employee_id, entry_type, timestamp, snapshot_url)
SELECT 
    e.id,
    'entry',
    CURRENT_DATE + INTERVAL '8 hours' + INTERVAL '1 minute' * floor(random() * 60),
    'https://via.placeholder.com/150x150?text=' || substring(e.name from 1 for 1) || 'E'
FROM public.employees e
WHERE NOT EXISTS (
    SELECT 1 FROM public.attendance_records ar 
    WHERE ar.employee_id = e.id 
    AND ar.entry_type = 'entry' 
    AND DATE(ar.timestamp) = CURRENT_DATE
)
LIMIT 5;

INSERT INTO public.attendance_records (employee_id, entry_type, timestamp, snapshot_url)
SELECT 
    e.id,
    'exit',
    CURRENT_DATE + INTERVAL '17 hours' + INTERVAL '1 minute' * floor(random() * 60),
    'https://via.placeholder.com/150x150?text=' || substring(e.name from 1 for 1) || 'X'
FROM public.employees e
WHERE NOT EXISTS (
    SELECT 1 FROM public.attendance_records ar 
    WHERE ar.employee_id = e.id 
    AND ar.entry_type = 'exit' 
    AND DATE(ar.timestamp) = CURRENT_DATE
)
LIMIT 5;

-- Show final count for today
SELECT 
    'Records for today after fix:' as info,
    COUNT(*)::text as value
FROM public.attendance_records 
WHERE DATE(timestamp) = CURRENT_DATE; 