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
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error fetching running timer:', error)
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

