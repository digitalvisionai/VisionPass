
-- Ensure the employees table ID column is TEXT
ALTER TABLE employees ALTER COLUMN id TYPE TEXT;

-- Ensure the attendance_records foreign key also uses TEXT
ALTER TABLE attendance_records ALTER COLUMN employee_id TYPE TEXT;

-- Drop and recreate the foreign key constraint to use TEXT
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_employee_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id);
