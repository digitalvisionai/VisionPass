
-- Change the employee ID column from UUID to TEXT to allow custom IDs
ALTER TABLE employees ALTER COLUMN id TYPE TEXT;

-- Update the foreign key in attendance_records to match
ALTER TABLE attendance_records ALTER COLUMN employee_id TYPE TEXT;
