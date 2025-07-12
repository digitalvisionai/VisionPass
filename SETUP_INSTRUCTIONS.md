# Setup Instructions for Silent Attendance Eye

## ✅ **Completed Updates:**

### 1. **Monthly View Fixed**
- ✅ Removed future days completely from the table
- ✅ Now shows only days 1 to current day
- ✅ Updated description to show "Days 1-X"

### 2. **Database Schema Analysis**

Your Supabase database has the following tables:

#### **Core Tables:**
- ✅ `employees` - Employee information
- ✅ `attendance_records` - Entry/exit records
- ✅ `admins` - Admin users
- ✅ `settings` - System settings

#### **Storage Buckets:**
- ✅ `faces` - Employee photos
- ✅ `snapshots` - Attendance snapshots

#### **Functions:**
- ✅ `get_daily_attendance_summary()` - Daily attendance summary
- ✅ `is_admin()` - Admin check function

## 📋 **What You Need to Do:**

### **Step 1: Fill Supabase with Test Data**

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/[your-project-id]

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Test Data Script**
   - Copy the contents of `scripts/fill-test-data.sql`
   - Paste it into the SQL editor
   - Click "Run" to execute

4. **Verify Data Creation**
   - Go to "Table Editor" → "employees" (should have 10 employees)
   - Go to "Table Editor" → "attendance_records" (should have ~600 records)
   - Go to "Table Editor" → "settings" (should have 3 settings)

### **Step 2: Check Database Structure**

Your database should have these columns:

#### **employees table:**
- `id` (TEXT) - Employee ID
- `name` (TEXT) - Employee name
- `email` (TEXT) - Email address
- `phone` (TEXT) - Phone number
- `job_class` (TEXT) - Job classification
- `hire_date` (DATE) - Hire date
- `photo_url` (TEXT) - Photo URL
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Update time

#### **attendance_records table:**
- `id` (UUID) - Record ID
- `employee_id` (TEXT) - Employee ID (foreign key)
- `entry_type` (ENUM) - 'entry' or 'exit'
- `timestamp` (TIMESTAMP) - Record time
- `snapshot_url` (TEXT) - Photo snapshot URL
- `created_at` (TIMESTAMP) - Creation time

#### **settings table:**
- `key` (TEXT) - Setting key
- `value` (TEXT) - Setting value
- `created_at` (TIMESTAMP) - Creation time
- `updated_at` (TIMESTAMP) - Update time

### **Step 3: Test the Application**

1. **Frontend**: http://localhost:8081
2. **Backend**: Running on WebSocket port 8001

### **Step 4: Test Features**

1. **Person Log Page**:
   - Search for employees (John Smith, Sarah Johnson, etc.)
   - Select "Monthly Report" to see the new table format
   - Click "Details" buttons to view daily activities
   - Test color-coded leak hours

2. **Dashboard**:
   - Check real-time attendance
   - View connection status
   - Test refresh faces button

## 🔧 **If Something is Missing:**

### **Missing Tables:**
If any tables are missing, run this in Supabase SQL Editor:

```sql
-- Create settings table if missing
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO public.settings (key, value) VALUES 
('working_hours', '8'),
('attendance_start_time', '08:00'),
('attendance_end_time', '17:00')
ON CONFLICT (key) DO NOTHING;
```

### **Missing Storage Buckets:**
If storage buckets are missing, run:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('faces', 'faces', true),
('snapshots', 'snapshots', true)
ON CONFLICT (id) DO NOTHING;
```

## 📊 **Expected Test Data:**

After running the script, you should have:
- **10 employees** with different job classes
- **~600 attendance records** (30 days × 10 employees × 2 records/day)
- **Realistic patterns**: Some missing days, late arrivals, early exits
- **Color-coded data**: Green (complete), Yellow (good), Orange (fair), Red (poor)

## 🎯 **Test Scenarios:**

1. **Search Employee**: Type "John" or "Sarah" in Person Log
2. **Monthly View**: Select "Monthly Report" → See table with days 1-12 (current day)
3. **Daily Details**: Click "Details" button → View activity logs
4. **Color Coding**: See green/yellow/orange/red indicators
5. **Export**: Download CSV reports

Let me know if you encounter any issues or need help with the setup! 