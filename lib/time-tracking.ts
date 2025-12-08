import { createClient } from '@/lib/supabase/client'

export interface TimeEntry {
  id: string
  account_id: string
  user_id: string
  project_id: string | null
  project_name: string
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  is_running: boolean
  hourly_rate: number | null
  billable_amount: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export interface TimeEntryCreate {
  project_id: string
  project_name: string
  hourly_rate?: number
  note?: string
}

export interface TimeEntryUpdate {
  end_time?: string
  hourly_rate?: number
  note?: string
  is_running?: boolean
  start_time?: string // For resuming - update start_time to now
}

// Get all time entries for the current user
export async function getTimeEntries(): Promise<TimeEntry[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching time entries:', error)
    throw error
  }

  return data || []
}

// Get running timer for current user
export async function getRunningTimer(): Promise<TimeEntry | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_running', true)
    .order('start_time', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[Time Tracking] 406 Error in getRunningTimer:', {
      error,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      user_id: user.id,
      url: error.url || 'N/A'
    })
    // Don't throw - just return null if there's an error
    return null
  }

  return data && data.length > 0 ? data[0] : null
}

// Get paused timer for current user (has entry but is_running = false and no end_time)
export async function getPausedTimer(entryId?: string): Promise<TimeEntry | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_running', false)
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)

  if (entryId) {
    query = query.eq('id', entryId)
  }

  const { data, error } = await query.single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching paused timer:', error)
    throw error
  }

  return data || null
}

// Start a new time entry
export async function startTimeEntry(entry: TimeEntryCreate): Promise<TimeEntry> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get account_id from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Stop any running timers first
  const runningTimer = await getRunningTimer()
  if (runningTimer) {
    await stopTimeEntry(runningTimer.id)
  }

  const { data, error } = await supabase
    .from('time_entries')
    .insert({
      account_id: profile.account_id,
      user_id: user.id,
      project_id: entry.project_id,
      project_name: entry.project_name,
      hourly_rate: entry.hourly_rate || null,
      note: entry.note || null,
      start_time: new Date().toISOString(),
      is_running: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Error starting time entry:', error)
    throw error
  }

  return data
}

// Pause a time entry (sets is_running to false and stores paused_at timestamp)
export async function pauseTimeEntry(entryId: string): Promise<TimeEntry> {
  const supabase = createClient()

  // First get the current entry to calculate elapsed time
  const { data: currentEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (!currentEntry) {
    throw new Error('Time entry not found')
  }

  // Calculate elapsed time at pause
  const start = new Date(currentEntry.start_time)
  const now = new Date()
  const elapsedSeconds = Math.floor((now.getTime() - start.getTime()) / 1000)

  // Store paused_at timestamp and elapsed time in metadata (or we can add a paused_elapsed field)
  // For now, we'll use updated_at as paused_at indicator and calculate from start_time when resuming
  const { data, error } = await supabase
    .from('time_entries')
    .update({
      is_running: false,
      updated_at: now.toISOString(), // This acts as paused_at
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    console.error('Error pausing time entry:', error)
    throw error
  }

  return data
}

// Resume a time entry (sets is_running to true and updates start_time to account for pause duration)
export async function resumeTimeEntry(entryId: string, pausedElapsedSeconds: number): Promise<TimeEntry> {
  const supabase = createClient()

  // Get the paused entry to get the original start_time
  const { data: pausedEntry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', entryId)
    .single()

  if (!pausedEntry) {
    throw new Error('Time entry not found')
  }

  // Calculate the actual elapsed time from the original start_time
  // This accounts for any delay between pause and resume
  const originalStart = new Date(pausedEntry.start_time)
  const now = new Date()
  
  // The elapsed time should be based on the original start_time
  // We adjust start_time so that: now - newStartTime = elapsedSeconds
  // This way, any delay between pause and resume is automatically corrected
  const newStartTime = new Date(now.getTime() - pausedElapsedSeconds * 1000)

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      is_running: true,
      start_time: newStartTime.toISOString(), // Adjust start_time to maintain elapsed time
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    console.error('Error resuming time entry:', error)
    throw error
  }

  return data
}

// Stop a time entry
export async function stopTimeEntry(entryId: string): Promise<TimeEntry> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_entries')
    .update({
      end_time: new Date().toISOString(),
      is_running: false,
    })
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    console.error('Error stopping time entry:', error)
    throw error
  }

  return data
}

// Update a time entry
export async function updateTimeEntry(entryId: string, updates: TimeEntryUpdate): Promise<TimeEntry> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('time_entries')
    .update(updates)
    .eq('id', entryId)
    .select()
    .single()

  if (error) {
    console.error('Error updating time entry:', error)
    throw error
  }

  return data
}

// Delete a time entry
export async function deleteTimeEntry(entryId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)

  if (error) {
    console.error('Error deleting time entry:', error)
    throw error
  }
}

// Get time entries for a specific date range
export async function getTimeEntriesByDateRange(startDate: Date, endDate: Date): Promise<TimeEntry[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching time entries by date range:', error)
    throw error
  }

  return data || []
}

// Get time entries for today
export async function getTodayTimeEntries(): Promise<TimeEntry[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getTimeEntriesByDateRange(today, tomorrow)
}

// Get time entries for this week
export async function getWeekTimeEntries(): Promise<TimeEntry[]> {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - dayOfWeek)
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 7)

  return getTimeEntriesByDateRange(startOfWeek, endOfWeek)
}

// Get recent time entries (last 7 days, max 20 entries)
export async function getRecentTimeEntries(daysBack: number = 7, limit: number = 20): Promise<TimeEntry[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', user.id)
    .gte('start_time', startDate.toISOString())
    .order('start_time', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent time entries:', error)
    throw error
  }

  return data || []
}

// Get time entries for a specific project
export async function getProjectTimeEntries(projectId: string): Promise<TimeEntry[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('project_id', projectId)
    .order('start_time', { ascending: false }) // Newest first

  if (error) {
    console.error('Error fetching project time entries:', error)
    throw error
  }

  return data || []
}

// Calculate total duration for entries
export function calculateTotalDuration(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + (entry.duration_seconds || 0)
  }, 0)
}

// Calculate total billable amount for entries
export function calculateTotalBillable(entries: TimeEntry[]): number {
  return entries.reduce((total, entry) => {
    return total + (entry.billable_amount || 0)
  }, 0)
}

// Format duration in seconds to readable string
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

// Format time display (HH:MM:SS)
export function formatTimeDisplay(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

