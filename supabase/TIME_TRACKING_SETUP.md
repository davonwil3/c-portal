# Time Tracking Setup Guide

## Quick Setup (2 Steps)

### Step 1: Run the SQL Schema
1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the entire contents of `time_tracking_schema.sql`
3. Click **Run**

This creates:
- ✅ `time_entries` table
- ✅ Automatic triggers for calculating duration and billable amounts
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions

### Step 2: Test It!
1. Go to `/dashboard/time-tracking`
2. Create a project in Client Workflow if you don't have any
3. Select a project and click **Start**
4. Timer will run and save to database
5. Click **Save Entry** to stop and save

---

## What Got Created

### Database Table: `time_entries`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `account_id` | uuid | Links to accounts table |
| `user_id` | uuid | Links to auth.users |
| `project_id` | uuid | Links to projects table |
| `project_name` | text | Denormalized for history |
| `start_time` | timestamptz | When timer started |
| `end_time` | timestamptz | When timer stopped (null if running) |
| `duration_seconds` | integer | Auto-calculated on stop |
| `is_running` | boolean | True if timer is active |
| `hourly_rate` | decimal | Optional rate for billing |
| `billable_amount` | decimal | Auto-calculated: (duration / 3600) × rate |
| `note` | text | Optional note about the work |
| `created_at` | timestamptz | When entry was created |
| `updated_at` | timestamptz | Last update timestamp |

### Automatic Features

#### 1. Duration Calculation
When you stop a timer, the database automatically calculates:
```sql
duration_seconds = end_time - start_time
```

#### 2. Billable Amount Calculation
If you set an hourly rate, it automatically calculates:
```sql
billable_amount = (duration_seconds / 3600) × hourly_rate
```

#### 3. Only One Running Timer
The system automatically stops any previous running timer when you start a new one.

#### 4. Security (RLS)
Users can only see/edit their own time entries via Row Level Security policies.

---

## Features

### ✅ Start/Pause/Resume Timer
- Real-time counting
- Persists to database immediately
- Can pause and resume
- Survives page refresh

### ✅ Project Selection
- Loads your actual projects from the database
- Empty state if no projects exist
- Links to Client Workflow to create projects

### ✅ Hourly Rate Tracking
- Optional per-entry rate
- Automatically calculates billable amount
- Shown in table and weekly summary

### ✅ Today & Week Summaries
- Total time tracked today
- Total time tracked this week
- Total billable amount for the week
- Includes currently running timer

### ✅ Recent Entries Table
- Shows last 10 entries
- Delete any completed entry
- Shows duration, billable amount, notes
- Real-time updates

### ✅ Notes
- Add optional notes to each entry
- Shown in the entries table
- Helps track what you worked on

---

## How It Works

### Starting a Timer
1. Select a project
2. Optional: Set hourly rate (defaults to $100)
3. Optional: Add a note
4. Click **Start**
5. Entry is created in database with `is_running = true`

### While Running
- Timer counts up every second
- Can pause/resume (only affects local counter)
- Can reset (deletes entry from database)
- Survives page refresh (reloads from database)

### Saving an Entry
1. Click **Save Entry**
2. Sets `end_time = now()`
3. Database trigger auto-calculates:
   - `duration_seconds`
   - `billable_amount`
   - Sets `is_running = false`
4. Entry appears in Recent Entries table

---

## Database Functions

### `stop_time_entry(entry_id)`
Stops a running timer by setting end_time and is_running = false

### `get_running_timer(user_id)`
Gets the currently running timer for a user (if any)

### `calculate_time_entry_amounts()`
Trigger function that automatically calculates duration and billable amount

---

## API Functions

Located in `/lib/time-tracking.ts`:

| Function | Description |
|----------|-------------|
| `getTimeEntries()` | Get all entries for user |
| `getRunningTimer()` | Get currently running timer |
| `startTimeEntry(data)` | Start a new timer |
| `stopTimeEntry(id)` | Stop a timer |
| `deleteTimeEntry(id)` | Delete an entry |
| `getTodayTimeEntries()` | Get today's entries |
| `getWeekTimeEntries()` | Get this week's entries |
| `calculateTotalDuration(entries)` | Sum durations |
| `calculateTotalBillable(entries)` | Sum billable amounts |
| `formatDuration(seconds)` | Format as "Xh Ym" |
| `formatTimeDisplay(seconds)` | Format as "HH:MM:SS" |

---

## Testing

### Test 1: Basic Timer
1. Select a project
2. Start timer
3. Wait 10 seconds
4. Save entry
5. Should appear in Recent Entries with ~10 second duration

### Test 2: Billable Amount
1. Set hourly rate to $100
2. Start timer
3. Wait 1 minute (60 seconds)
4. Save
5. Should show $1.67 billable (60/3600 × 100)

### Test 3: Page Refresh
1. Start a timer
2. Wait 30 seconds
3. Refresh the page
4. Timer should resume from 30 seconds
5. Project, note, and rate should be restored

### Test 4: Multiple Timers
1. Start timer for Project A
2. Save it
3. Start timer for Project B
4. Save it
5. Both should appear in Recent Entries

---

## Troubleshooting

### Timer not persisting after refresh
- Check browser console for errors
- Verify the `time_entries` table was created
- Check RLS policies are enabled

### Can't start timer
- Ensure you have projects in the database
- Check console for authentication errors
- Verify your profile has an `account_id`

### Duration not calculating
- Check the trigger `calculate_time_entry_amounts_trigger` exists
- Verify `end_time` is being set when you save

### Billable amount is wrong
- Verify hourly_rate is set (check database)
- Check the calculation: (duration_seconds / 3600) × hourly_rate
- Ensure the trigger is running

---

## Next Steps

### Optional Enhancements
1. Add ability to edit entries
2. Add date range filters
3. Export time entries to CSV
4. Generate invoices from time entries
5. Add project-level default hourly rates
6. Add tags/categories to entries
7. Add reports and analytics
8. Add team time tracking

---

## Schema Verification

Run this query to verify everything is set up:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'time_entries';

-- Check triggers exist
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table = 'time_entries';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'time_entries';

-- Check policies exist
SELECT policyname FROM pg_policies 
WHERE tablename = 'time_entries';
```

Should return:
- 1 table: `time_entries`
- 2 triggers: `time_entries_updated_at`, `calculate_time_entry_amounts_trigger`
- RLS enabled: `true`
- 4 policies: SELECT, INSERT, UPDATE, DELETE

