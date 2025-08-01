import { createClient as createSupabaseClient } from '@/lib/supabase/client'

export interface Client {
  id: string
  account_id: string
  first_name: string
  last_name: string
  email: string
  company: string | null
  phone: string | null
  portal_url: string | null
  status: 'active' | 'archived' | 'pending'
  avatar_initials: string | null
  total_invoices: number
  paid_invoices: number
  unpaid_amount: number
  files_uploaded: number
  forms_submitted: number
  project_count: number
  joined_date: string
  last_activity_at: string | null
  created_at: string
  updated_at: string
}

export interface ClientTag {
  id: string
  client_id: string
  tag_name: string
  color: string
  created_at: string
}

export interface Tag {
  name: string
  color: string
}

// Standard tags with colors
export const standardTags: Tag[] = [
  { name: "VIP", color: "#FFD700" },
  { name: "Enterprise", color: "#4F46E5" },
  { name: "Startup", color: "#10B981" },
  { name: "Design", color: "#F59E0B" },
  { name: "Marketing", color: "#EC4899" },
  { name: "Retainer", color: "#8B5CF6" },
  { name: "Completed", color: "#6B7280" },
  { name: "New", color: "#3B82F6" },
  { name: "Priority", color: "#EF4444" },
  { name: "Long-term", color: "#059669" },
]

// Get all clients for the current user's account
export async function getClients(): Promise<Client[]> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Then get all clients for that account
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching clients:', error)
    throw error
  }

  return data || []
}

// Get client tags with colors
export async function getClientTags(clientId: string): Promise<ClientTag[]> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('client_tags')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching client tags:', error)
    throw error
  }

  return data || []
}

// Get all unique tags for an account
export async function getAccountTags(): Promise<string[]> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // First get all client IDs for this account
  const { data: clientIds, error: clientError } = await supabase
    .from('clients')
    .select('id')
    .eq('account_id', profile.account_id)

  if (clientError) {
    console.error('Error fetching client IDs:', clientError)
    throw clientError
  }

  if (!clientIds || clientIds.length === 0) {
    return []
  }

  // Then get all tags for these clients
  const { data, error } = await supabase
    .from('client_tags')
    .select('tag_name')
    .in('client_id', clientIds.map(client => client.id))
    .order('tag_name', { ascending: true })

  if (error) {
    console.error('Error fetching account tags:', error)
    throw error
  }

  // Extract unique tag names
  const uniqueTags = [...new Set(data?.map(tag => tag.tag_name) || [])]
  return uniqueTags
}

// Get a single client by ID
export async function getClient(clientId: string): Promise<Client | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  return data
}

// Create a new client
export async function createClient(clientData: {
  first_name: string
  last_name: string
  email: string
  company?: string
  phone?: string
  portal_url?: string
  tags?: Array<{ name: string; color?: string }>
}): Promise<Client | null> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Generate avatar initials
  const avatar_initials = `${clientData.first_name.charAt(0)}${clientData.last_name.charAt(0)}`.toUpperCase()

  // Start a transaction
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      account_id: profile.account_id,
      first_name: clientData.first_name,
      last_name: clientData.last_name,
      email: clientData.email,
      company: clientData.company || null,
      phone: clientData.phone || null,
      portal_url: clientData.portal_url || null,
      avatar_initials,
      status: 'active'
    })
    .select()
    .single()

  if (clientError) {
    console.error('Error creating client:', clientError)
    throw clientError
  }

  // Add tags if provided
  if (clientData.tags && clientData.tags.length > 0) {
    const tagInserts = clientData.tags.map(tag => {
      // Check if it's a standard tag or custom tag
      const standardTag = standardTags.find(stdTag => stdTag.name.toLowerCase() === tag.name.trim().toLowerCase())
      const color = tag.color || (standardTag ? standardTag.color : '#6B7280')
      
      return {
        client_id: client.id,
        tag_name: tag.name.trim(),
        color: color
      }
    })

    const { error: tagError } = await supabase
      .from('client_tags')
      .insert(tagInserts)

    if (tagError) {
      console.error('Error creating client tags:', tagError)
      // Don't throw here, client was created successfully
    }
  }

  return client
}

// Update a client
export async function updateClient(clientId: string, updates: Partial<{
  first_name: string
  last_name: string
  email: string
  company: string
  phone: string
  portal_url: string
  status: 'active' | 'archived' | 'pending'
  tags?: Array<{ name: string; color?: string }>
}>): Promise<Client | null> {
  const supabase = createSupabaseClient()
  
  // If name is being updated, regenerate avatar initials
  let avatar_initials = undefined
  if (updates.first_name || updates.last_name) {
    const currentClient = await getClient(clientId)
    if (currentClient) {
      const firstName = updates.first_name || currentClient.first_name
      const lastName = updates.last_name || currentClient.last_name
      avatar_initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
  }

  // Update client data
  const { data, error } = await supabase
    .from('clients')
    .update({
      first_name: updates.first_name,
      last_name: updates.last_name,
      email: updates.email,
      company: updates.company,
      phone: updates.phone,
      portal_url: updates.portal_url,
      status: updates.status,
      ...(avatar_initials && { avatar_initials }),
      updated_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .select()
    .single()

  if (error) {
    console.error('Error updating client:', error)
    throw error
  }

  // Update tags if provided
  if (updates.tags !== undefined) {
    // Delete existing tags
    await supabase
      .from('client_tags')
      .delete()
      .eq('client_id', clientId)

    // Add new tags
    if (updates.tags.length > 0) {
      const tagInserts = updates.tags.map(tag => ({
        client_id: clientId,
        tag_name: tag.name.trim(),
        color: tag.color || getTagColor(tag.name.trim()) // Use provided color or default
      }))

      const { error: tagError } = await supabase
        .from('client_tags')
        .insert(tagInserts)

      if (tagError) {
        console.error('Error updating client tags:', tagError)
        // Don't throw here, client was updated successfully
      }
    }
  }

  return data
}

// Delete a client
export async function deleteClient(clientId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  console.log('Attempting to delete client:', clientId)
  
  // Delete related records in order (child tables first)
  
  // 1. Delete client_tags
  const { error: tagError } = await supabase
    .from('client_tags')
    .delete()
    .eq('client_id', clientId)

  if (tagError) {
    console.error('Error deleting client tags:', tagError)
    throw new Error(`Failed to delete client tags: ${tagError.message}`)
  }
  console.log('Client tags deleted successfully')

  // 2. Delete client_activities
  const { error: activityError } = await supabase
    .from('client_activities')
    .delete()
    .eq('client_id', clientId)

  if (activityError) {
    console.error('Error deleting client activities:', activityError)
    throw new Error(`Failed to delete client activities: ${activityError.message}`)
  }
  console.log('Client activities deleted successfully')

  // 3. Update portals to remove client reference (SET NULL)
  const { error: portalError } = await supabase
    .from('portals')
    .update({ client_id: null })
    .eq('client_id', clientId)

  if (portalError) {
    console.error('Error updating portals:', portalError)
    throw new Error(`Failed to update portals: ${portalError.message}`)
  }
  console.log('Portals updated successfully')

  // 4. Finally delete the client
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', clientId)

  if (error) {
    console.error('Error deleting client:', error)
    throw new Error(`Failed to delete client: ${error.message}`)
  }

  console.log('Client deleted successfully')
}

// Archive a client (soft delete)
export async function archiveClient(clientId: string): Promise<Client | null> {
  return updateClient(clientId, { status: 'archived' })
}

// Restore an archived client
export async function restoreClient(clientId: string): Promise<Client | null> {
  return updateClient(clientId, { status: 'active' })
}

// Get tag color (helper function)
export function getTagColor(tagName: string): string {
  const standardTag = standardTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
  return standardTag?.color || '#6B7280' // Default gray color
}

// Create a custom tag with color
export async function createCustomTag(tagName: string, color: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Add the custom tag to a special table or update the standard tags
  // For now, we'll just return the color for the tag
  return color
} 