import { createClient as createSupabaseClient } from '@/lib/supabase/client'
// Vector store imports removed - use lib/ai/vector-store.server.ts in API routes only

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
  vector_store_id?: string | null
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
  
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) {
    console.error('Error fetching client:', error)
    return null
  }

  if (!client) return null

  return client
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

  // Normalize portal_url: convert empty strings to null to avoid unique constraint violations
  // PostgreSQL UNIQUE constraint allows multiple NULL values, but not duplicate empty strings
  const portalUrl = clientData.portal_url?.trim() || null
  const normalizedPortalUrl = portalUrl === '' ? null : portalUrl

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
      portal_url: normalizedPortalUrl,
      avatar_initials,
      status: 'active'
    })
    .select()
    .single()

  if (clientError) {
    console.error('Error creating client:', clientError)
    
    // Provide a more helpful error message for unique constraint violations
    if (clientError.code === '23505') {
      if (clientError.message?.includes('portal_url')) {
        throw new Error('A client with this portal URL already exists. Please choose a different portal URL or leave it blank.')
      }
      throw new Error('A client with this information already exists. Please check for duplicates.')
    }
    
    throw clientError
  }

  // NOTE: Vector store creation should be handled by the API route that calls createClient
  // Import lib/ai/vector-store.server.ts in the API route to create vector store and update client record

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

  // Automatically add client to their own portal's allowlist
  try {
    // Get the current user's company name from their account
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (userProfile?.account_id) {
      // Get the company name from the accounts table
      const { data: account } = await supabase
        .from('accounts')
        .select('company_name')
        .eq('id', userProfile.account_id)
        .single()

      if (account?.company_name) {
        // Generate a company slug from the company name
        const companySlug = account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        
        // Generate a client slug from the client's name
        const clientSlug = `${clientData.first_name.toLowerCase()}-${clientData.last_name.toLowerCase()}`
        
        // Add client to allowlist for their own portal access
        const { error: allowlistError } = await supabase
          .from('client_allowlist')
          .insert({
            account_id: userProfile.account_id,
            client_id: client.id, // Add the client_id here!
            company_slug: companySlug,
            client_slug: clientSlug,
            email: clientData.email.toLowerCase(),
            name: `${clientData.first_name} ${clientData.last_name}`,
            role: 'Client',
            is_active: true
          })

        if (allowlistError) {
          console.error('Error adding client to allowlist:', allowlistError)
          // Don't throw here, client was created successfully
        } else {
          console.log('✅ Client automatically added to portal allowlist')
          console.log('📋 Allowlist entry:', {
            account_id: userProfile.account_id,
            company_slug: companySlug,
            client_slug: clientSlug,
            email: clientData.email.toLowerCase()
          })
        }
      } else {
        console.error('❌ No company name found for account:', userProfile.account_id)
      }
    } else {
      console.error('❌ No account_id found for user:', user.id)
    }
  } catch (allowlistError) {
    console.error('Error setting up portal access for client:', allowlistError)
    // Don't throw here, client was created successfully
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

  // Update allowlist if email or name changed
  if (updates.email || updates.first_name || updates.last_name) {
    try {
      // Get the current user's company name from their account
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('account_id')
          .eq('user_id', user.id)
          .single()

        if (userProfile?.account_id) {
          // Get the company name from the accounts table
          const { data: account } = await supabase
            .from('accounts')
            .select('company_name')
            .eq('id', userProfile.account_id)
            .single()

          if (account?.company_name) {
            // Generate a company slug from the company name
            const companySlug = account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
            
            // Get current client data to determine what to update
            const currentClient = await getClient(clientId)
            if (currentClient) {
              const firstName = updates.first_name || currentClient.first_name
              const lastName = updates.last_name || currentClient.last_name
              const email = updates.email || currentClient.email
              
              // Generate a client slug from the client's name
              const clientSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
              
              // Update or insert allowlist entry
              const { error: allowlistError } = await supabase
                .from('client_allowlist')
                .upsert({
                  account_id: userProfile.account_id,
                  company_slug: companySlug,
                  client_slug: clientSlug,
                  email: email.toLowerCase(),
                  name: `${firstName} ${lastName}`,
                  role: 'Client',
                  is_active: true
                }, {
                  onConflict: 'account_id,company_slug,client_slug,email'
                })

              if (allowlistError) {
                console.error('Error updating client in allowlist:', allowlistError)
                // Don't throw here, client was updated successfully
              } else {
                console.log('✅ Client allowlist updated successfully')
              }
            }
          }
        }
      }
    } catch (allowlistError) {
      console.error('Error updating client allowlist:', allowlistError)
      // Don't throw here, client was updated successfully
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

  // 4. Remove client from allowlist
  try {
    // Get the current user's company name from their account
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      if (userProfile?.account_id) {
        // Get the company name from the accounts table
        const { data: account } = await supabase
          .from('accounts')
          .select('company_name')
          .eq('id', userProfile.account_id)
          .single()

        if (account?.company_name) {
          // Generate a company slug from the company name
          const companySlug = account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          
          // Get current client data to determine the client slug
          const currentClient = await getClient(clientId)
          if (currentClient) {
            const clientSlug = `${currentClient.first_name.toLowerCase()}-${currentClient.last_name.toLowerCase()}`
            
            // Remove client from allowlist
            const { error: allowlistError } = await supabase
              .from('client_allowlist')
              .delete()
              .eq('company_slug', companySlug)
              .eq('client_slug', clientSlug)
              .eq('email', currentClient.email.toLowerCase())

            if (allowlistError) {
              console.error('Error removing client from allowlist:', allowlistError)
              // Don't throw here, continue with deletion
            } else {
              console.log('Client removed from allowlist successfully')
            }
          }
        }
      }
    }
  } catch (allowlistError) {
    console.error('Error removing client from allowlist:', allowlistError)
    // Don't throw here, continue with deletion
  }

  // 5. Finally delete the client
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

// Get client activities - aggregates activities from all projects for this client
export async function getClientActivities(clientId: string): Promise<any[]> {
  const supabase = createSupabaseClient()
  const { getCurrentAccount } = await import('./auth')
  const account = await getCurrentAccount()
  
  if (!account) {
    console.warn('No account found')
    return []
  }

  try {
    // First, get all projects for this client with names
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .eq('client_id', clientId)
      .eq('account_id', account.id)

    if (projectsError) {
      console.error('Error fetching projects for client:', projectsError)
      return []
    }

    if (!projects || projects.length === 0) {
      return []
    }

    const projectIds = projects.map(p => p.id)
    // Create a map of project_id to project_name for quick lookup
    const projectMap = new Map(projects.map(p => [p.id, p.name]))

    // Get all activities from project_activities table only
    // All activities (files, invoices, contracts, forms) are now logged in project_activities
    // No need to fetch from separate activity tables to avoid duplicates
    const { data: projectActivities } = await supabase
      .from('project_activities')
      .select(`
        id,
        project_id,
        activity_type,
        action,
        metadata,
        created_at,
        user_id,
        profiles:user_id(first_name, last_name, email)
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false })

    if (!projectActivities) {
      return []
    }

    // Map activities to include project name and format user info
    const allActivities = projectActivities.map(activity => ({
      id: activity.id,
      activity_type: activity.activity_type,
      action: activity.action,
      metadata: activity.metadata,
      created_at: activity.created_at,
      source_table: 'project_activities',
      source_id: activity.id,
      project_id: activity.project_id,
      project_name: projectMap.get(activity.project_id) || 'Unknown Project',
      user_name: activity.profiles 
        ? `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim() || 'Unknown User'
        : 'System',
      user_email: activity.profiles?.email || null
    }))

    // Activities are already sorted by created_at descending from the query
    return allActivities
  } catch (error) {
    console.error('Error fetching client activities:', error)
    return []
  }
}

// Get client invoices (using the invoices library)
export async function getClientInvoices(clientId: string): Promise<any[]> {
  try {
    const { getInvoicesByClient } = await import('@/lib/invoices')
    return await getInvoicesByClient(clientId)
  } catch (error) {
    console.error('Error importing getInvoicesByClient:', error)
    return []
  }
}

// Get client projects (using the projects library)
export async function getClientProjects(clientId: string): Promise<any[]> {
  try {
    const { getProjectsByClient } = await import('@/lib/projects')
    return await getProjectsByClient(clientId)
  } catch (error) {
    console.error('Error importing getProjectsByClient:', error)
    return []
  }
}

// Get client files (using the files library)
export async function getClientFiles(clientId: string): Promise<any[]> {
  try {
    const { getFiles } = await import('@/lib/files')
    const allFiles = await getFiles()
    return allFiles.filter(file => file.client_id === clientId)
  } catch (error) {
    console.error('Error importing getFiles:', error)
    return []
  }
}

// Refresh client counts (useful after creating/deleting related records)
export async function refreshClientCounts(clientId: string): Promise<void> {
  try {
    const supabase = createSupabaseClient()
    
    // Calculate new counts
    const [projectCount, totalInvoices, paidInvoices, unpaidInvoices, filesCount, formsCount] = await Promise.all([
      // Get project count
      supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .then(result => result.count || 0),

      // Get total invoices count
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .then(result => result.count || 0),

      // Get paid invoices count
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .eq('status', 'paid')
        .then(result => result.count || 0),

      // Get unpaid invoices for amount calculation
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('client_id', clientId)
        .not('status', 'eq', 'paid')
        .then(result => result.data || []),

      // Get files count
      supabase
        .from('files')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .then(result => result.count || 0),

      // Get forms count
      supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', clientId)
        .then(result => result.count || 0),
    ])

    // Calculate unpaid amount
    const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

    // Update the client record with new counts
    await supabase
      .from('clients')
      .update({
        project_count: projectCount,
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        unpaid_amount: unpaidAmount,
        files_uploaded: filesCount,
        forms_submitted: formsCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)

  } catch (error) {
    console.error(`Error refreshing counts for client ${clientId}:`, error)
    throw error
  }
} 