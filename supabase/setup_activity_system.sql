-- Clean Activity System Setup (No Triggers)
-- This script sets up the activity system without any problematic triggers

-- Step 1: Run the main activity function
\i supabase/get_project_activities.sql

-- Step 2: Run the safe activity logging functions (no triggers)
\i supabase/safe_activity_logging_functions.sql

-- Step 3: Add sample activities
\i supabase/safe_sample_activities.sql

-- That's it! The activity system should now work without any recursion issues.
