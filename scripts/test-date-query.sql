-- Test date query to see what's happening
-- This will help us understand why StaffLog shows no data

-- Check current date in database
SELECT 'Current database date:' as info, CURRENT_DATE::text as value;

-- Check if there are any records at all
SELECT 'Total records:' as info, COUNT(*)::text as value FROM public.attendance_records;

-- Check the most recent records
SELECT 
    'Recent records:' as info,
    employee_id,
    entry_type,
    timestamp,
    DATE(timestamp) as date_only
FROM public.attendance_records 
ORDER BY timestamp DESC 
LIMIT 10;

-- Check records for today specifically
SELECT 
    'Today records:' as info,
    COUNT(*)::text as value
FROM public.attendance_records 
WHERE DATE(timestamp) = CURRENT_DATE;

-- Check records for yesterday
SELECT 
    'Yesterday records:' as info,
    COUNT(*)::text as value
FROM public.attendance_records 
WHERE DATE(timestamp) = CURRENT_DATE - INTERVAL '1 day';

-- Check the date range of all records
SELECT 
    'Date range:' as info,
    MIN(DATE(timestamp))::text || ' to ' || MAX(DATE(timestamp))::text as value
FROM public.attendance_records;

-- Show some sample records with their dates
SELECT 
    employee_id,
    entry_type,
    timestamp,
    DATE(timestamp) as date_only,
    EXTRACT(HOUR FROM timestamp) as hour
FROM public.attendance_records 
ORDER BY timestamp DESC 
LIMIT 5; 