
-- Revert the employees table ID column back to UUID with auto-generation
ALTER TABLE employees ALTER COLUMN id TYPE UUID USING gen_random_uuid();
ALTER TABLE employees ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Revert the attendance_records foreign key back to UUID
ALTER TABLE attendance_records ALTER COLUMN employee_id TYPE UUID;

-- Recreate the foreign key constraint with UUID
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_employee_id_fkey;
ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_employee_id_fkey 
    FOREIGN KEY (employee_id) REFERENCES employees(id);
