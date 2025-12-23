import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface Lead {
  id: string
  account_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  social_media: Record<string, string> | null // e.g., {"twitter": "@username", "linkedin": "username"}
  source: 'Lead Engine' | 'Portfolio' | 'Website form' | 'Social' | 'Referral' | 'Manual Import'
  portfolio_id: string | null
  portfolio_url: string | null
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal Sent' | 'Won' | 'Lost'
  value: number
  owner_id: string | null
  owner_name: string | null
  last_contacted_at: string | null
  first_contacted_at: string | null
  notes: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

// Get all leads for the current user's account
export async function getLeads(): Promise<Lead[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
    throw error
  }

  return data || []
}

// Get a single lead by ID
export async function getLead(leadId: string): Promise<Lead | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .eq('account_id', profile.account_id)
    .single()

  if (error) {
    console.error('Error fetching lead:', error)
    return null
  }

  return data
}

// Create a new lead
export async function createLead(leadData: {
  name: string
  company?: string
  email?: string
  phone?: string
  social_media?: Record<string, string>
  source?: Lead['source']
  portfolio_id?: string
  portfolio_url?: string
  status?: Lead['status']
  value?: number
  notes?: string
  tags?: string[]
}): Promise<Lead | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const insertData: any = {
    account_id: profile.account_id,
    name: leadData.name,
    company: leadData.company || null,
    email: leadData.email || null,
    phone: leadData.phone || null,
    source: leadData.source || 'Manual Import',
    portfolio_id: leadData.portfolio_id || null,
    portfolio_url: leadData.portfolio_url || null,
    status: leadData.status || 'New',
    value: leadData.value || 0,
    owner_id: user.id,
    owner_name: `${profile.first_name} ${profile.last_name}`,
    notes: leadData.notes || null,
    tags: leadData.tags || [],
    first_contacted_at: new Date().toISOString(),
  }

  // Explicitly set social_media - use empty object if not provided or empty
  if (leadData.social_media && Object.keys(leadData.social_media).length > 0) {
    insertData.social_media = leadData.social_media
  } else {
    insertData.social_media = {}
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating lead:', error)
    throw error
  }

  return data
}

// Update a lead
export async function updateLead(leadId: string, updates: Partial<Lead>): Promise<Lead | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // If updating last_contacted_at, set it to now
  const updateData: any = { ...updates }
  if (updates.last_contacted_at === undefined && Object.keys(updates).length > 0) {
    // Don't auto-update last_contacted_at unless explicitly set
  }

  // Ensure social_media is properly formatted as JSONB
  if ('social_media' in updateData) {
    if (updateData.social_media && typeof updateData.social_media === 'object') {
      // If it's an object with keys, use it; otherwise use empty object
      if (Object.keys(updateData.social_media).length === 0) {
        updateData.social_media = {}
      }
    } else {
      updateData.social_media = {}
    }
  }

  const { data, error } = await supabase
    .from('leads')
    .update(updateData)
    .eq('id', leadId)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating lead:', error)
    throw error
  }

  return data
}

// Update lead status
export async function updateLeadStatus(leadId: string, status: Lead['status']): Promise<void> {
  await updateLead(leadId, { status })
}

// Update last contacted date
export async function updateLeadLastContacted(leadId: string): Promise<void> {
  await updateLead(leadId, { last_contacted_at: new Date().toISOString() })
}

// Delete a lead
export async function deleteLead(leadId: string): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)
    .eq('account_id', profile.account_id)

  if (error) {
    console.error('Error deleting lead:', error)
    throw error
  }
}

// Bulk delete leads
export async function bulkDeleteLeads(leadIds: string[]): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('leads')
    .delete()
    .in('id', leadIds)
    .eq('account_id', profile.account_id)

  if (error) {
    console.error('Error bulk deleting leads:', error)
    throw error
  }
}

// Bulk update lead status
export async function bulkUpdateLeadStatus(leadIds: string[], status: Lead['status']): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .in('id', leadIds)
    .eq('account_id', profile.account_id)

  if (error) {
    console.error('Error bulk updating lead status:', error)
    throw error
  }
}
