import { createClient } from '@/lib/supabase/client'
import { getCurrentAccount } from './auth'

export interface MeetingType {
  id: string
  account_id: string
  name: string
  description?: string
  duration_minutes: number
  price?: number
  currency?: string
  location_type: 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person'
  color: string
  is_active: boolean
  is_archived: boolean
  metadata?: any
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
}

// Alias for backward compatibility
export type Service = MeetingType

export interface ScheduleSettings {
  id: string
  account_id: string
  user_id: string
  timezone: string
  default_duration_minutes: number
  buffer_time_minutes: number
  email_notifications: boolean
  availability: Record<string, {
    enabled: boolean
    startTime: string
    endTime: string
  }>
  display_name?: string
  industry_label?: string
  shareable_link_url?: string
  shareable_link_slug?: string
  created_at: string
  updated_at: string
}

export interface Booking {
  id: string
  account_id: string
  booking_number?: string
  title?: string
  service_id?: string
  client_id?: string
  project_id?: string
  service_name?: string
  service_duration_minutes?: number
  service_price?: number
  service_location_type?: string
  service_color?: string
  scheduled_date: string
  start_time: string
  end_time: string
  timezone: string
  location?: string
  location_type: 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person'
  client_name?: string
  client_email?: string
  client_phone?: string
  status: 'Scheduled' | 'Completed' | 'Canceled' | 'No-show' | 'Rescheduled'
  payment_status: 'pending' | 'paid' | 'partial' | 'refunded'
  amount_paid?: number
  notes?: string
  client_notes?: string
  description?: string
  reminder_sent: boolean
  reminder_sent_at?: string
  canceled_at?: string
  cancellation_reason?: string
  canceled_by?: string
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface CreateMeetingTypeInput {
  name: string
  description?: string
  duration_minutes: number
  price?: number
  currency?: string
  location_type: 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person'
  color: string
  metadata?: any
}

// Alias for backward compatibility
export type CreateServiceInput = CreateMeetingTypeInput

export interface UpdateMeetingTypeInput {
  name?: string
  description?: string
  duration_minutes?: number
  price?: number
  currency?: string
  location_type?: 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person'
  color?: string
  is_active?: boolean
  is_archived?: boolean
  metadata?: any
}

// Alias for backward compatibility
export type UpdateServiceInput = UpdateMeetingTypeInput

export interface CreateBookingInput {
  title?: string
  service_id?: string // This maps to meeting_type_id in the database
  meeting_type_id?: string
  client_id?: string
  project_id?: string
  scheduled_date: string
  start_time: string
  end_time: string
  timezone?: string
  location?: string
  location_type?: 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person'
  client_name?: string
  client_email?: string
  client_phone?: string
  notes?: string
  client_notes?: string
  description?: string // Description provided by client on scheduling page
}

export interface UpdateScheduleSettingsInput {
  timezone?: string
  default_duration_minutes?: number
  buffer_time_minutes?: number
  email_notifications?: boolean
  availability?: Record<string, {
    enabled: boolean
    startTime: string
    endTime: string
  }>
  display_name?: string
  industry_label?: string
  shareable_link_url?: string
  shareable_link_slug?: string
}

export interface PublicBookingPage {
  id: string
  account_id: string
  user_id: string
  schedule_settings_id: string
  slug: string
  meeting_type_id?: string
  page_title?: string
  page_description?: string
  welcome_message?: string
  is_active: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface CreatePublicBookingPageInput {
  meeting_type_id?: string
  page_title?: string
  page_description?: string
  welcome_message?: string
}

const supabase = createClient()

// =====================================================
// MEETING TYPES (formerly services)
// =====================================================

// getServices is for billing/invoicing - keep it separate
export async function getServices(): Promise<Service[]> {
  // This should query the services table for billing, not meeting_types
  // But this function is in schedule.ts, so it might be used for scheduling
  // Let me check if this is used for scheduling or billing...
  // Actually, since this is in schedule.ts, I think it's being used for scheduling
  // But the user says services are for billing. Let me create a separate function.
  // Actually, wait - the user wants meeting_types for scheduling, services for billing
  // So getServices() in schedule.ts should probably not exist, or should be removed
  // But to be safe, let me just make getMeetingTypes work properly
  return []
}

export async function getMeetingTypes(): Promise<MeetingType[]> {
  const account = await getCurrentAccount()
  if (!account) {
    console.warn('No account found, returning empty meeting types array')
    return []
  }

  const { data, error } = await supabase
    .from('meeting_types')
    .select('*')
    .eq('account_id', account.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching meeting types:', error)
    return []
  }

  return data || []
}

// getServicesByAccount - this should NOT be used for scheduling, only for billing
// But keeping it for backward compatibility - it will return empty array
export async function getServicesByAccount(accountId: string): Promise<Service[]> {
  // Services are for billing, not scheduling
  // This function should not be used for scheduling
  return []
}

export async function getMeetingTypesByAccount(accountId: string): Promise<MeetingType[]> {
  if (!accountId) {
    console.warn('No accountId provided, returning empty meeting types array')
    return []
  }

  const { data, error } = await supabase
    .from('meeting_types')
    .select('*')
    .eq('account_id', accountId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching meeting types:', error)
    return []
  }

  return data || []
}

// createService - this should NOT be used for scheduling, services are for billing
export async function createService(input: CreateServiceInput): Promise<Service> {
  throw new Error('createService should not be used for scheduling. Use createMeetingType instead.')
}

export async function createMeetingType(input: CreateMeetingTypeInput): Promise<MeetingType> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get profile - handle gracefully if not found
  let created_by_name: string | null = null
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profileError && profile) {
      created_by_name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || null
    }
  } catch (profileErr) {
    console.warn('Could not fetch profile for meeting type creator:', profileErr)
    // Continue without created_by_name
  }

  const insertData = {
    account_id: account.id,
    name: input.name,
    description: input.description || null,
    duration_minutes: input.duration_minutes,
    price: input.price || null,
    currency: input.currency || 'USD',
    location_type: input.location_type,
    color: input.color,
    metadata: input.metadata || null,
    created_by: user.id,
    created_by_name: created_by_name,
  }

  const { data, error } = await supabase
    .from('meeting_types')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating meeting type:', error)
    throw new Error(error.message || 'Failed to create meeting type')
  }

  if (!data) {
    throw new Error('Meeting type was not created - no data returned')
  }

  return data
}

// updateService - this should NOT be used for scheduling, services are for billing
export async function updateService(serviceId: string, input: UpdateServiceInput): Promise<Service> {
  throw new Error('updateService should not be used for scheduling. Use updateMeetingType instead.')
}

export async function updateMeetingType(meetingTypeId: string, input: UpdateMeetingTypeInput): Promise<MeetingType> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('meeting_types')
    .update(input)
    .eq('id', meetingTypeId)
    .eq('account_id', account.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating meeting type:', error)
    throw error
  }

  return data
}

// deleteService - this should NOT be used for scheduling, services are for billing
export async function deleteService(serviceId: string): Promise<void> {
  throw new Error('deleteService should not be used for scheduling. Use deleteMeetingType instead.')
}

export async function deleteMeetingType(meetingTypeId: string): Promise<void> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('meeting_types')
    .update({ is_active: false })
    .eq('id', meetingTypeId)
    .eq('account_id', account.id)

  if (error) {
    console.error('Error deleting meeting type:', error)
    throw error
  }
}

// =====================================================
// SCHEDULE SETTINGS
// =====================================================

export async function getScheduleSettings(): Promise<ScheduleSettings | null> {
  const account = await getCurrentAccount()
  if (!account) {
    console.warn('No account found, returning null for schedule settings')
    return null
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('No user found, returning null for schedule settings')
    return null
  }

  const { data, error } = await supabase
    .from('schedule_settings')
    .select('*')
    .eq('account_id', account.id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 406) {
      // No settings found, table doesn't exist, or not acceptable - return null
      return null
    }
    console.error('Error fetching schedule settings:', error)
    // Return null instead of throwing to handle gracefully
    return null
  }

  return data || null
}

export async function getScheduleSettingsByAccountId(accountId: string): Promise<ScheduleSettings | null> {
  const { data, error } = await supabase
    .from('schedule_settings')
    .select('*')
    .eq('account_id', accountId)
    .limit(1)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 406) {
      // No settings found, table doesn't exist, or not acceptable - return null
      return null
    }
    console.error('Error fetching schedule settings by account_id:', error)
    // Return null instead of throwing to handle gracefully
    return null
  }

  return data || null
}

export async function getScheduleSettingsBySlug(slug: string): Promise<ScheduleSettings & { user_name?: string, account_name?: string } | null> {
  const { data: settings, error } = await supabase
    .from('schedule_settings')
    .select('*')
    .eq('shareable_link_slug', slug)
    .single()

  if (error) {
    if (error.code === 'PGRST116' || error.code === '42P01' || error.status === 406) {
      // No settings found, table doesn't exist, or not acceptable - return null
      return null
    }
    console.error('Error fetching schedule settings by slug:', error)
    // Return null instead of throwing to handle gracefully
    return null
  }

  if (!settings) return null

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, account_id')
    .eq('user_id', settings.user_id)
    .single()

  // Get account name and logo
  let accountName: string | undefined
  let accountLogoUrl: string | undefined
  if (profile?.account_id) {
    const { data: account } = await supabase
      .from('accounts')
      .select('company_name, logo_url')
      .eq('id', profile.account_id)
      .single()
    
    accountName = account?.company_name || undefined
    // Only set logo URL if it exists and is not empty
    accountLogoUrl = account?.logo_url && account.logo_url.trim() ? account.logo_url : undefined
  }

  return {
    ...settings,
    user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined,
    account_name: accountName,
    account_logo_url: accountLogoUrl,
  }
}

/**
 * Create default schedule settings with sensible defaults
 * This auto-creates settings so users don't have to configure everything first
 */
export async function createDefaultScheduleSettings(): Promise<ScheduleSettings> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get user profile for display name
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single()

  const displayName = profile 
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Your Name'
    : 'Your Name'

  // Default availability: Monday-Friday, 9 AM - 5 PM
  const defaultAvailability = {
    Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
    Saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    Sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  }

  const { data, error } = await supabase
    .from('schedule_settings')
    .insert({
      account_id: account.id,
      user_id: user.id,
      timezone: 'America/New_York',
      default_duration_minutes: 30,
      buffer_time_minutes: 15,
      email_notifications: true,
      availability: defaultAvailability,
      display_name: displayName,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating default schedule settings:', error)
    throw error
  }

  return data
}

/**
 * Create a default meeting type for quick booking
 */
export async function createDefaultMeetingType(accountId?: string, userId?: string): Promise<MeetingType> {
  let account = null
  let user = null
  
  if (accountId && userId) {
    // For public bookings, use provided account_id and user_id
    account = { id: accountId }
    user = { id: userId }
  } else {
    // For authenticated users, get from current session
    account = await getCurrentAccount()
    if (!account) throw new Error('Not authenticated')

    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) throw new Error('Not authenticated')
    user = authUser
  }

  const { data, error } = await supabase
    .from('meeting_types')
    .insert({
      account_id: account.id,
      name: 'Consultation',
      description: 'General meeting to discuss your needs',
      duration_minutes: 30,
      location_type: 'Zoom',
      color: '#3b82f6',
      is_active: true,
      is_archived: false,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating default meeting type:', error)
    throw error
  }

  return data
}

/**
 * Get or create a Consultation meeting type for an account
 */
export async function getOrCreateConsultationMeetingType(accountId: string, userId: string): Promise<MeetingType> {
  // First, try to find an existing Consultation meeting type
  const { data: existing, error } = await supabase
    .from('meeting_types')
    .select('*')
    .eq('account_id', accountId)
    .eq('name', 'Consultation')
    .eq('is_active', true)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing && !error) {
    return existing
  }

  // If not found, create one
  return await createDefaultMeetingType(accountId, userId)
}

/**
 * Initialize schedule settings and meeting types if they don't exist
 * This ensures users can book immediately without manual setup
 */
export async function ensureScheduleSetup(accountId?: string, userId?: string): Promise<{
  settings: ScheduleSettings
  meetingTypes: MeetingType[]
}> {
  let account = null
  let user = null
  
  if (accountId && userId) {
    // For public bookings, use provided account_id and user_id
    account = { id: accountId }
    user = { id: userId }
    
    // Get settings by account_id
    const settingsData = await getScheduleSettingsByAccountId(accountId)
    if (!settingsData) {
      throw new Error('Schedule settings not found for account')
    }
    
    // Ensure Consultation meeting type exists
    const consultationType = await getOrCreateConsultationMeetingType(accountId, userId)
    
    // Get all meeting types
    const meetingTypes = await getMeetingTypesByAccount(accountId)
    
    return { settings: settingsData, meetingTypes }
  } else {
    // For authenticated users, get from current session
    // Check if settings exist
    let settings = await getScheduleSettings()
    
    // If no settings, create defaults
    if (!settings) {
      settings = await createDefaultScheduleSettings()
    }

    // Check if meeting types exist
    let meetingTypes = await getMeetingTypesByAccount(settings.account_id)
    
    // If no meeting types, create a default one
    if (meetingTypes.length === 0) {
      const defaultMeetingType = await createDefaultMeetingType()
      meetingTypes = [defaultMeetingType]
    } else {
      // Ensure Consultation exists
      const hasConsultation = meetingTypes.some(mt => mt.name === 'Consultation' && mt.is_active && !mt.is_archived)
      if (!hasConsultation) {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const consultationType = await getOrCreateConsultationMeetingType(settings.account_id, authUser.id)
          meetingTypes.push(consultationType)
        }
      }
    }

    return { settings, meetingTypes }
  }
}

export async function createOrUpdateScheduleSettings(input: UpdateScheduleSettingsInput): Promise<ScheduleSettings> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check if settings exist
  const existing = await getScheduleSettings()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('schedule_settings')
      .update(input)
      .eq('id', existing.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule settings:', error)
      throw error
    }

    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('schedule_settings')
      .insert({
        account_id: account.id,
        user_id: user.id,
        timezone: input.timezone || 'America/New_York',
        default_duration_minutes: input.default_duration_minutes || 60,
        buffer_time_minutes: input.buffer_time_minutes || 15,
        email_notifications: input.email_notifications !== undefined ? input.email_notifications : true,
        availability: input.availability || {},
        display_name: input.display_name || null,
        industry_label: input.industry_label || null,
        shareable_link_url: input.shareable_link_url || null,
        shareable_link_slug: input.shareable_link_slug || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating schedule settings:', error)
      throw error
    }

    return data
  }
}

// =====================================================
// BOOKINGS
// =====================================================

export async function getBookings(filters?: {
  startDate?: string
  endDate?: string
  status?: string[]
  serviceId?: string
  clientId?: string
}): Promise<Booking[]> {
  const account = await getCurrentAccount()
  if (!account) {
    console.warn('No account found, returning empty bookings array')
    return []
  }

  let query = supabase
    .from('bookings')
    .select('*')
    .eq('account_id', account.id)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (filters?.startDate) {
    query = query.gte('scheduled_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('scheduled_date', filters.endDate)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  if (filters?.serviceId) {
    query = query.eq('meeting_type_id', filters.serviceId)
  }

  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bookings:', error)
    // Return empty array instead of throwing to handle gracefully
    return []
  }

  return data || []
}

export async function getBookingsByAccount(accountId: string, filters?: {
  startDate?: string
  endDate?: string
  status?: string[]
}): Promise<Booking[]> {
  let query = supabase
    .from('bookings')
    .select('*')
    .eq('account_id', accountId)
    .order('scheduled_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (filters?.startDate) {
    query = query.gte('scheduled_date', filters.startDate)
  }

  if (filters?.endDate) {
    query = query.lte('scheduled_date', filters.endDate)
  }

  if (filters?.status && filters.status.length > 0) {
    query = query.in('status', filters.status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching bookings:', error)
    // Return empty array instead of throwing to handle gracefully
    return []
  }

  return data || []
}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single()

  const created_by_name = profile ? `${profile.first_name} ${profile.last_name}`.trim() : null

  // Get meeting_type_id from input (either directly or from service_id for backward compatibility)
  const meetingTypeId = input.meeting_type_id || input.service_id

  // If meeting_type_id is provided, fetch meeting type details to cache
  let meetingTypeData = null
  if (meetingTypeId) {
    const { data: meetingType } = await supabase
      .from('meeting_types')
      .select('name, duration_minutes, price, location_type, color')
      .eq('id', meetingTypeId)
      .single()

    if (meetingType) {
      meetingTypeData = meetingType
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      account_id: account.id,
      title: input.title || null,
      meeting_type_id: meetingTypeId || null,
      client_id: input.client_id || null,
      project_id: input.project_id || null,
      service_name: meetingTypeData?.name || null,
      service_duration_minutes: meetingTypeData?.duration_minutes || null,
      service_price: meetingTypeData?.price || null,
      service_location_type: meetingTypeData?.location_type || null,
      service_color: meetingTypeData?.color || null,
      scheduled_date: input.scheduled_date,
      start_time: input.start_time,
      end_time: input.end_time,
      timezone: input.timezone || 'America/New_York',
      location: input.location || null,
      location_type: input.location_type || 'Zoom',
      client_name: input.client_name || null,
      client_email: input.client_email || null,
      client_phone: input.client_phone || null,
      notes: input.notes || null,
      client_notes: input.client_notes || null,
      created_by: user.id,
      created_by_name: created_by_name,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating booking:', error)
    throw error
  }

  // Create activity log entry
  await supabase
    .from('booking_activities')
    .insert({
      booking_id: data.id,
      account_id: account.id,
      user_id: user.id,
      activity_type: 'created',
      action: 'Booking created',
      metadata: { booking_number: data.booking_number },
    })

  return data
}

export async function createPublicBooking(input: CreateBookingInput & { account_id: string, user_id: string }): Promise<Booking> {
  // If service_id/meeting_type_id is provided, fetch meeting type details to cache
  const meetingTypeId = input.meeting_type_id || input.service_id
  let serviceData = null
  if (meetingTypeId) {
    // Try meeting_types first, fallback to services
    let result = await supabase
      .from('meeting_types')
      .select('name, duration_minutes, price, location_type, color')
      .eq('id', meetingTypeId)
      .single()

    if (result.error && result.error.code === '42P01') {
      result = await supabase
        .from('services')
        .select('name, duration_minutes, price, location_type, color')
        .eq('id', meetingTypeId)
        .single()
    }

    if (result.data) {
      serviceData = result.data
    }
  }

  // Generate booking number in application code with better collision handling
  const maxRetries = 10
  let retryCount = 0
  let data = null
  let error = null

  while (retryCount < maxRetries) {
    // Generate unique booking number
    let bookingNumber = null
    
    try {
      // Get max booking number for this account
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('booking_number')
        .eq('account_id', input.account_id)
        .like('booking_number', 'BK-%')
        .order('created_at', { ascending: false })
        .limit(100)

      let maxNumber = 0
      if (existingBookings && existingBookings.length > 0) {
        existingBookings.forEach(booking => {
          const match = booking.booking_number?.match(/^BK-(\d+)/)
          if (match) {
            const num = parseInt(match[1], 10)
            if (num > maxNumber) maxNumber = num
          }
        })
      }

      // Generate next number with retry offset
      const nextNumber = maxNumber + 1 + retryCount
      bookingNumber = `BK-${String(nextNumber).padStart(3, '0')}`

      // Double-check this number doesn't exist
      const { data: existingCheck } = await supabase
        .from('bookings')
        .select('id')
        .eq('account_id', input.account_id)
        .eq('booking_number', bookingNumber)
        .maybeSingle()

      // If it exists, add timestamp suffix
      if (existingCheck) {
        const timestamp = Date.now().toString().slice(-5)
        bookingNumber = `BK-${String(nextNumber).padStart(3, '0')}-${timestamp}`
      }
    } catch (err) {
      // Fallback: use timestamp-based number
      const timestamp = Date.now().toString().slice(-6)
      bookingNumber = `BK-${timestamp}`
    }

    const insertData = {
      account_id: input.account_id,
      booking_number: bookingNumber, // Explicitly set
      title: input.title || null,
      meeting_type_id: meetingTypeId || null,
      // service_id column no longer exists - removed
      client_id: input.client_id || null,
      project_id: input.project_id || null,
      service_name: serviceData?.name || null,
      service_duration_minutes: serviceData?.duration_minutes || null,
      service_price: serviceData?.price || null,
      service_location_type: serviceData?.location_type || null,
      service_color: serviceData?.color || null,
      scheduled_date: input.scheduled_date,
      start_time: input.start_time,
      end_time: input.end_time,
      timezone: input.timezone || 'America/New_York',
      location: input.location || null,
      location_type: input.location_type || 'Zoom',
      client_name: input.client_name || null,
      client_email: input.client_email || null,
      client_phone: input.client_phone || null,
      notes: input.notes || null,
      client_notes: input.client_notes || null,
      description: input.description || null,
      created_by: input.user_id,
      status: 'Scheduled', // Set default status
    }

    const result = await supabase
      .from('bookings')
      .insert(insertData)
      .select()
      .single()

    data = result.data
    error = result.error

    // If successful or error is not a duplicate key, break
    if (!error || error.code !== '23505') {
      break
    }

    // If duplicate key error, wait and retry with new number
    if (error.code === '23505') {
      retryCount++
      if (retryCount < maxRetries) {
        console.log(`Booking number collision, retrying (${retryCount}/${maxRetries})`)
        // Wait a random amount between 100-300ms
        const delay = 100 + Math.random() * 200
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
    }
  }

  if (error) {
    console.error('Error creating public booking:', error)
    throw error
  }

  // Create activity log entry
  await supabase
    .from('booking_activities')
    .insert({
      booking_id: data.id,
      account_id: input.account_id,
      user_id: input.user_id,
      activity_type: 'created',
      action: 'Booking created via public link',
      metadata: { booking_number: data.booking_number },
    })

  return data
}

export async function updateBooking(bookingId: string, updates: Partial<Booking>): Promise<Booking> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .eq('account_id', account.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating booking:', error)
    throw error
  }

  return data
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)
    .eq('account_id', account.id)

  if (error) {
    console.error('Error deleting booking:', error)
    throw error
  }
}

// =====================================================
// PUBLIC BOOKING PAGES
// =====================================================

export async function createPublicBookingPage(input: CreatePublicBookingPageInput): Promise<PublicBookingPage> {
  const account = await getCurrentAccount()
  if (!account) throw new Error('Not authenticated')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get schedule settings
  const settings = await getScheduleSettings()
  if (!settings) throw new Error('Schedule settings not found')

  // Get account and user info for slug generation
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, account_id')
    .eq('user_id', user.id)
    .single()

  let slugBase = ''
  if (account?.company_name) {
    slugBase = account.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  } else if (profile) {
    const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
    slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  } else {
    slugBase = 'user'
  }

  // Generate unique slug with timestamp and random number
  const timestamp = Date.now().toString(36)
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  const slug = `${slugBase}.${timestamp}.${randomNum}`

  // Create public booking page
  const { data, error } = await supabase
    .from('public_booking_pages')
    .insert({
      account_id: account.id,
      user_id: user.id,
      schedule_settings_id: settings.id,
      slug: slug,
      meeting_type_id: input.meeting_type_id || null,
      page_title: input.page_title || null,
      page_description: input.page_description || null,
      welcome_message: input.welcome_message || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating public booking page:', error)
    throw error
  }

  return data
}

export async function getPublicBookingPageBySlug(slug: string): Promise<(PublicBookingPage & { schedule_settings?: ScheduleSettings, meeting_type?: MeetingType, user_name?: string, account_name?: string }) | null> {
  // First get the booking page
  const { data: bookingPage, error } = await supabase
    .from('public_booking_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('is_published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    console.error('Error fetching public booking page:', error)
    return null
  }

  if (!bookingPage) return null

  // Get schedule settings
  const settings = await getScheduleSettingsBySlug('') // We'll get it by ID instead
  let scheduleSettings: ScheduleSettings | null = null
  
  if (bookingPage.schedule_settings_id) {
    const { data: settingsData } = await supabase
      .from('schedule_settings')
      .select('*')
      .eq('id', bookingPage.schedule_settings_id)
      .single()
    
    if (settingsData) {
      scheduleSettings = settingsData as ScheduleSettings
    }
  }

  // Get meeting type if specified
  let meetingType: MeetingType | null = null
  if (bookingPage.meeting_type_id) {
    // Try meeting_types first, fallback to services
    let result = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', bookingPage.meeting_type_id)
      .single()

    if (result.error && result.error.code === '42P01') {
      result = await supabase
        .from('services')
        .select('*')
        .eq('id', bookingPage.meeting_type_id)
        .single()
    }

    if (result.data) {
      meetingType = result.data as MeetingType
    }
  }

  // Get user and account names
  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, account_id')
    .eq('user_id', bookingPage.user_id)
    .single()

  let accountName: string | undefined
  let accountLogoUrl: string | undefined
  if (profile?.account_id) {
    const { data: account } = await supabase
      .from('accounts')
      .select('company_name, logo_url')
      .eq('id', profile.account_id)
      .single()
    
    accountName = account?.company_name || undefined
    // Only set logo URL if it exists and is not empty
    accountLogoUrl = account?.logo_url && account.logo_url.trim() ? account.logo_url : undefined
  }

  return {
    ...bookingPage,
    schedule_settings: scheduleSettings ? {
      ...scheduleSettings,
      account_logo_url: accountLogoUrl,
    } : undefined,
    meeting_type: meetingType || undefined,
    user_name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : undefined,
    account_name: accountName,
    account_logo_url: accountLogoUrl,
  } as any
}
