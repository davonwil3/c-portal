import { createClient } from '@/lib/supabase/client'
import { getLeads } from './leads'
import { getClients } from './clients'

export interface Proposal {
  id: string
  proposal_number?: string
  uuid?: string // Actual database UUID for live links
  title: string
  description?: string
  recipient: {
    name: string
    company: string
    email: string
    type: 'Client' | 'Lead'
  }
  value: number
  status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
  lastActivity: Date
  createdAt: Date
  validUntil?: Date
  dateSent?: Date
  activities: Array<{
    type: string
    date: Date
    user: string
  }>
  // Additional fields
  client_id?: string
  project_id?: string
  lead_id?: string
  proposal_data?: any // Full proposal builder data
  client_signed_at?: Date // Client signature timestamp from database column
}

export interface ProposalBuilderData {
  // Client info
  client?: {
    name: string
    email: string
    company: string
    address?: string
  }
  // Company info
  company?: {
    name: string
    email: string
    address?: string
    showAddress?: boolean
  }
  // Branding
  branding?: {
    brandColor: string
    accentColor: string
    logoUrl?: string
    showLogo?: boolean
  }
  // Proposal content
  content?: {
    title: string
    subtitle?: string
    goals?: string
    successOutcome?: string
    deliverables?: string
    timeline?: string
    blocks?: Array<{
      id: string
      type: 'goals' | 'success' | 'deliverables' | 'timeline' | 'custom'
      label: string
      content: string
      order: number
    }>
    labels?: {
      goals?: string
      success?: string
      scope?: string
      timeline?: string
      investment?: string
    }
  }
  // Pricing
  pricing?: {
    items: Array<{
      id: string
      name: string
      description: string
      price: string
    }>
    addons: Array<{
      id: string
      name: string
      description?: string
      price: string
      selected: boolean
    }>
    currency?: string
    taxRate?: string
  }
  // Payment plan
  paymentPlan?: {
    enabled: boolean
    type?: string
    customPaymentsCount?: number
    customEqualSplit?: boolean
    customPaymentAmounts?: string[]
    milestonesCount?: number
    milestonesEqualSplit?: boolean
    milestones?: Array<{ id: string; name: string; amount: string }>
    schedule?: number[]
  }
  // Contract
  contract?: {
    projectName?: string
    revisionCount?: string
    hourlyRate?: string
    lateFee?: string
    lateDays?: string
    includeLateFee?: boolean
    includeHourlyClause?: boolean
    clientSignatureName?: string
    clientSignatureDate?: string
    clientSignedAt?: string
    yourName?: string
    estimatedCompletionDate?: string
  }
  // Invoice
  invoice?: {
    number?: string
    issueDate?: string
    dueDate?: string
  }
  // Document toggles
  documents?: {
    proposalEnabled?: boolean
    contractEnabled?: boolean
    invoiceEnabled?: boolean
  }
}

const supabase = createClient()

// Fetch all proposals
export async function getProposals(): Promise<Proposal[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Fetch proposals
  const { data: proposals, error } = await supabase
    .from('proposals')
    .select(`
      *,
      clients:clients(first_name, last_name, company, email),
      projects:projects(name)
    `)
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching proposals:', error)
    throw error
  }

  if (!proposals || proposals.length === 0) {
    return []
  }

  // Fetch activities for each proposal
  const proposalIds = proposals.map(p => p.id)
  const { data: activities } = await supabase
    .from('proposal_activities')
    .select('*')
    .in('proposal_id', proposalIds)
    .order('created_at', { ascending: true })

  // Transform proposals to our format
  const transformedProposals: Proposal[] = proposals.map((proposal: any) => {
    // Get recipient info
    let recipientName = proposal.recipient_name || 'Unknown'
    let recipientCompany = proposal.recipient_company || ''
    let recipientEmail = proposal.recipient_email || ''
    let recipientType: 'Client' | 'Lead' = (proposal.recipient_type || 'Client') as 'Client' | 'Lead'

    // Override with client data if available
    if (proposal.client_id && proposal.clients) {
      const client = proposal.clients
      recipientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || recipientName
      recipientCompany = client.company || recipientCompany
      recipientEmail = client.email || recipientEmail
      recipientType = 'Client'
    }

    // Get activities for this proposal
    const proposalActivities = (activities || []).filter((a: any) => a.proposal_id === proposal.id)
    
    const activityList: Proposal['activities'] = proposalActivities.map((activity: any) => ({
      type: activity.activity_type,
      date: new Date(activity.created_at),
      user: activity.metadata?.user_name || proposal.created_by_name || 'You'
    }))

    // If no activities, add a created activity
    if (activityList.length === 0) {
      activityList.push({
        type: 'created',
        date: new Date(proposal.created_at),
        user: proposal.created_by_name || 'You'
      })
    }

    // Determine last activity
    const activityDates = activityList.map(a => a.date.getTime())
    const lastActivityDate = new Date(Math.max(...activityDates, new Date(proposal.last_activity_at || proposal.updated_at).getTime()))

    return {
      id: proposal.proposal_number || proposal.id,
      proposal_number: proposal.proposal_number,
      uuid: proposal.id, // Store actual UUID for live links
      title: proposal.title,
      description: proposal.description,
      recipient: {
        name: recipientName,
        company: recipientCompany,
        email: recipientEmail,
        type: recipientType
      },
      value: proposal.total_value ? parseFloat(proposal.total_value.toString()) : 0,
      status: proposal.status as Proposal['status'],
      lastActivity: lastActivityDate,
      createdAt: new Date(proposal.created_at),
      validUntil: proposal.valid_until ? new Date(proposal.valid_until) : undefined,
      dateSent: proposal.sent_at ? new Date(proposal.sent_at) : undefined,
      activities: activityList,
      client_id: proposal.client_id,
      project_id: proposal.project_id,
      lead_id: proposal.lead_id,
      proposal_data: proposal.proposal_data,
      client_signed_at: proposal.client_signed_at ? new Date(proposal.client_signed_at) : undefined,
    }
  })

  return transformedProposals
}

// Create a new proposal
export async function createProposal(proposalData: {
  title: string
  description?: string
  proposal_data: ProposalBuilderData
  recipient_name: string
  recipient_email?: string
  recipient_company?: string
  recipient_type?: 'Client' | 'Lead'
  client_id?: string
  project_id?: string
  lead_id?: string
  status?: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
  total_value?: number
  currency?: string
  subtotal?: number
  tax_amount?: number
  valid_until?: string
  email_subject?: string
  email_body?: string
}): Promise<Proposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Calculate totals from proposal data if not provided
  let totalValue: number = Number(proposalData.total_value) || 0
  let subtotal: number = Number(proposalData.subtotal) || 0
  let taxAmount: number = Number(proposalData.tax_amount) || 0

  if (proposalData.proposal_data?.pricing) {
    const pricing = proposalData.proposal_data.pricing
    subtotal = pricing.items.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0) +
      pricing.addons.filter(a => a.selected).reduce((sum, addon) => sum + parseFloat(addon.price || '0'), 0)
    const taxRate = parseFloat(pricing.taxRate || '0')
    taxAmount = subtotal * (taxRate / 100)
    totalValue = subtotal + taxAmount
  }

  // Ensure all numeric values are properly formatted as numbers (not strings)
  totalValue = Number(totalValue.toFixed(2))
  subtotal = Number(subtotal.toFixed(2))
  taxAmount = Number(taxAmount.toFixed(2))

  // Insert proposal
  const { data, error } = await supabase
    .from('proposals')
    .insert({
      account_id: profile.account_id,
      title: proposalData.title,
      description: proposalData.description || null,
      proposal_data: proposalData.proposal_data,
      recipient_name: proposalData.recipient_name || null,
      recipient_email: proposalData.recipient_email || null,
      recipient_company: proposalData.recipient_company || null,
      recipient_type: proposalData.recipient_type || 'Client',
      client_id: proposalData.client_id || null,
      project_id: proposalData.project_id || null,
      lead_id: proposalData.lead_id || null,
      status: proposalData.status || 'Draft',
      total_value: totalValue,
      currency: proposalData.currency || 'USD',
      subtotal: subtotal,
      tax_amount: taxAmount,
      valid_until: proposalData.valid_until || null,
      email_subject: proposalData.email_subject || null,
      email_body: proposalData.email_body || null,
      created_by: user.id,
      created_by_name: `${profile.first_name} ${profile.last_name}`,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating proposal:', error)
    throw error
  }

  // Create activity log entry
  await supabase
    .from('proposal_activities')
    .insert({
      proposal_id: data.id,
      account_id: profile.account_id,
      user_id: user.id,
      activity_type: 'created',
      action: 'created proposal',
      metadata: {
        user_name: `${profile.first_name} ${profile.last_name}`
      }
    })

  // Transform to Proposal format
  return {
    id: data.proposal_number || data.id,
    proposal_number: data.proposal_number,
    title: data.title,
    description: data.description,
    recipient: {
      name: data.recipient_name,
      company: data.recipient_company || '',
      email: data.recipient_email,
      type: (data.recipient_type || 'Client') as 'Client' | 'Lead'
    },
    value: totalValue,
    status: data.status as Proposal['status'],
    lastActivity: new Date(data.created_at),
    createdAt: new Date(data.created_at),
    validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
    dateSent: data.sent_at ? new Date(data.sent_at) : undefined,
    activities: [{
      type: 'created',
      date: new Date(data.created_at),
      user: data.created_by_name || 'You'
    }],
    client_id: data.client_id,
    project_id: data.project_id,
    lead_id: data.lead_id,
    proposal_data: data.proposal_data,
  }
}

// Update a proposal
export async function updateProposal(
  proposalId: string,
  updates: Partial<{
    title: string
    description: string
    proposal_data: ProposalBuilderData
    recipient_name: string
    recipient_email?: string
    recipient_company: string
    recipient_type: 'Client' | 'Lead'
    status: 'Draft' | 'Sent' | 'Accepted' | 'Declined'
    total_value: number
    currency: string
    subtotal: number
    tax_amount: number
    valid_until: string
    sent_at: string
    accepted_at: string
    declined_at: string
    declined_reason: string
  }>
): Promise<Proposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Find proposal by id first (UUID), then by proposal_number if needed
  let existingProposal = null
  let errorById: any = null
  let errorByNumber: any = null
  
  // Try by id first (most common case)
  const { data: proposalById, error: errById } = await supabase
    .from('proposals')
    .select('id')
    .eq('account_id', profile.account_id)
    .eq('id', proposalId)
    .single()
  
  errorById = errById
  
  if (proposalById && !errorById) {
    existingProposal = proposalById
  } else {
    // Try by proposal_number if id didn't work
    const { data: proposalByNumber, error: errByNumber } = await supabase
      .from('proposals')
      .select('id')
      .eq('account_id', profile.account_id)
      .eq('proposal_number', proposalId)
      .single()
    
    errorByNumber = errByNumber
    
    if (proposalByNumber && !errorByNumber) {
      existingProposal = proposalByNumber
    }
  }

  if (!existingProposal) {
    console.error('Proposal not found:', {
      proposalId,
      accountId: profile.account_id,
      errorById: errorById?.message,
      errorByNumber: errorByNumber?.message
    })
    throw new Error(`Proposal not found with ID: ${proposalId}`)
  }

  // Recalculate totals if proposal_data is being updated
  if (updates.proposal_data?.pricing) {
    const pricing = updates.proposal_data.pricing
    const newSubtotal = pricing.items.reduce((sum, item) => sum + parseFloat(item.price || '0'), 0) +
      pricing.addons.filter(a => a.selected).reduce((sum, addon) => sum + parseFloat(addon.price || '0'), 0)
    const taxRate = parseFloat(pricing.taxRate || '0')
    const newTaxAmount = newSubtotal * (taxRate / 100)
    const newTotalValue = newSubtotal + newTaxAmount
    
    // Ensure all numeric values are properly formatted as numbers (not strings)
    updates.subtotal = Number(newSubtotal.toFixed(2))
    updates.tax_amount = Number(newTaxAmount.toFixed(2))
    updates.total_value = Number(newTotalValue.toFixed(2))
  }

  // Ensure numeric fields are properly typed if they're being updated
  if (updates.total_value !== undefined) {
    updates.total_value = Number(updates.total_value)
  }
  if (updates.subtotal !== undefined) {
    updates.subtotal = Number(updates.subtotal)
  }
  if (updates.tax_amount !== undefined) {
    updates.tax_amount = Number(updates.tax_amount)
  }

  // Update proposal
  const { data, error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', existingProposal.id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) {
    console.error('Error updating proposal:', error)
    throw error
  }

  // Log activity if status changed
  if (updates.status) {
    await supabase
      .from('proposal_activities')
      .insert({
        proposal_id: data.id,
        account_id: profile.account_id,
        user_id: user.id,
        activity_type: updates.status.toLowerCase() as any,
        action: `proposal ${updates.status.toLowerCase()}`,
        metadata: {
          user_name: profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'You'
        }
      })
  } else {
    // Log update activity
    await supabase
      .from('proposal_activities')
      .insert({
        proposal_id: data.id,
        account_id: profile.account_id,
        user_id: user.id,
        activity_type: 'updated',
        action: 'updated proposal',
        metadata: {
          user_name: profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'You'
        }
      })
  }

  // Fetch updated proposal with activities
  const proposals = await getProposals()
  const updated = proposals.find(p => p.id === proposalId || p.proposal_number === proposalId)
  if (!updated) {
    throw new Error('Failed to fetch updated proposal')
  }
  return updated
}

// Delete a proposal
export async function deleteProposal(proposalId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Find proposal by proposal_number or id
  const { data: proposal, error: findError } = await supabase
    .from('proposals')
    .select('id')
    .eq('account_id', profile.account_id)
    .or(`proposal_number.eq.${proposalId},id.eq.${proposalId}`)
    .single()

  if (findError || !proposal) {
    throw new Error('Proposal not found')
  }

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', proposal.id)
    .eq('account_id', profile.account_id)

  if (error) {
    console.error('Error deleting proposal:', error)
    throw error
  }
}

// Duplicate a proposal
export async function duplicateProposal(proposalId: string): Promise<Proposal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Find and fetch the original proposal
  const { data: originalProposal, error: findError } = await supabase
    .from('proposals')
    .select('*')
    .eq('account_id', profile.account_id)
    .or(`proposal_number.eq.${proposalId},id.eq.${proposalId}`)
    .single()

  if (findError || !originalProposal) {
    throw new Error('Proposal not found')
  }

  // Create a duplicate with modified title
  const { data: newProposal, error } = await supabase
    .from('proposals')
    .insert({
      account_id: profile.account_id,
      title: `${originalProposal.title} (Copy)`,
      description: originalProposal.description,
      proposal_data: originalProposal.proposal_data,
      recipient_name: originalProposal.recipient_name,
      recipient_email: originalProposal.recipient_email,
      recipient_company: originalProposal.recipient_company,
      recipient_type: originalProposal.recipient_type,
      client_id: originalProposal.client_id,
      project_id: originalProposal.project_id,
      lead_id: originalProposal.lead_id,
      status: 'Draft', // Always duplicate as draft
      total_value: originalProposal.total_value,
      currency: originalProposal.currency,
      subtotal: originalProposal.subtotal,
      tax_amount: originalProposal.tax_amount,
      valid_until: originalProposal.valid_until,
      email_subject: originalProposal.email_subject,
      email_body: originalProposal.email_body,
      created_by: user.id,
      created_by_name: `${profile.first_name} ${profile.last_name}`,
    })
    .select()
    .single()

  if (error) {
    console.error('Error duplicating proposal:', error)
    throw error
  }

  // Create activity log entry for the new proposal
  await supabase
    .from('proposal_activities')
    .insert({
      proposal_id: newProposal.id,
      account_id: profile.account_id,
      user_id: user.id,
      activity_type: 'created',
      action: 'created proposal (duplicated)',
      metadata: {
        user_name: `${profile.first_name} ${profile.last_name}`,
        duplicated_from: originalProposal.id
      }
    })

  // Transform to Proposal format
  return {
    id: newProposal.proposal_number || newProposal.id,
    proposal_number: newProposal.proposal_number,
    title: newProposal.title,
    description: newProposal.description,
    recipient: {
      name: newProposal.recipient_name || '',
      company: newProposal.recipient_company || '',
      email: newProposal.recipient_email || '',
      type: (newProposal.recipient_type || 'Lead') as 'Client' | 'Lead'
    },
    value: Number(newProposal.total_value) || 0,
    status: newProposal.status as Proposal['status'],
    lastActivity: new Date(newProposal.created_at),
    createdAt: new Date(newProposal.created_at),
    validUntil: newProposal.valid_until ? new Date(newProposal.valid_until) : undefined,
    dateSent: newProposal.sent_at ? new Date(newProposal.sent_at) : undefined,
    activities: [{
      type: 'created',
      date: new Date(newProposal.created_at),
      user: newProposal.created_by_name || 'You'
    }],
    client_id: newProposal.client_id,
    project_id: newProposal.project_id,
    lead_id: newProposal.lead_id,
    proposal_data: newProposal.proposal_data,
  }
}

// Get a single proposal by ID (requires authentication)
export async function getProposalById(proposalId: string): Promise<Proposal | null> {
  const proposals = await getProposals()
  return proposals.find(p => p.id === proposalId || p.proposal_number === proposalId) || null
}

// Get a single proposal by ID (public, no authentication required)
export async function getProposalByIdPublic(proposalId: string): Promise<Proposal | null> {
  const supabase = createClient()
  
  // Fetch proposal directly from database
  const { data: proposal, error } = await supabase
    .from('proposals')
    .select(`
      *,
      clients:clients(first_name, last_name, company, email)
    `)
    .eq('id', proposalId)
    .single()

  if (error || !proposal) {
    console.error('Error fetching proposal:', error)
    return null
  }

  // Get recipient info
  let recipientName = proposal.recipient_name || 'Unknown'
  let recipientCompany = proposal.recipient_company || ''
  let recipientEmail = proposal.recipient_email || ''
  let recipientType: 'Client' | 'Lead' = (proposal.recipient_type || 'Client') as 'Client' | 'Lead'

  // Override with client data if available
  if (proposal.client_id && proposal.clients) {
    // Handle both array and object formats from Supabase
    const client = Array.isArray(proposal.clients) ? proposal.clients[0] : proposal.clients
    if (client) {
      recipientName = `${client.first_name || ''} ${client.last_name || ''}`.trim() || recipientName
      recipientCompany = client.company || recipientCompany
      recipientEmail = client.email || recipientEmail
      recipientType = 'Client'
    }
  }
  
  // Ensure we have at least something for recipientName
  if (!recipientName || recipientName === 'Unknown') {
    // Try to get from proposal_data if available
    const proposalData = proposal.proposal_data
    if (proposalData?.client?.name) {
      recipientName = proposalData.client.name
    }
  }

  // Fetch activities for this proposal
  const { data: activities } = await supabase
    .from('proposal_activities')
    .select('*')
    .eq('proposal_id', proposal.id)
    .order('created_at', { ascending: true })

  const activityList: Proposal['activities'] = (activities || []).map((activity: any) => ({
    type: activity.activity_type,
    date: new Date(activity.created_at),
    user: activity.metadata?.user_name || proposal.created_by_name || 'You'
  }))

  // If no activities, add a created activity
  if (activityList.length === 0) {
    activityList.push({
      type: 'created',
      date: new Date(proposal.created_at),
      user: proposal.created_by_name || 'You'
    })
  }

  // Determine last activity
  const activityDates = activityList.map(a => a.date.getTime())
  const lastActivityDate = new Date(Math.max(...activityDates, new Date(proposal.last_activity_at || proposal.updated_at).getTime()))

  return {
    id: proposal.proposal_number || proposal.id,
    proposal_number: proposal.proposal_number,
    uuid: proposal.id, // Store actual UUID for live links
    title: proposal.title,
    description: proposal.description,
    recipient: {
      name: recipientName,
      company: recipientCompany,
      email: recipientEmail,
      type: recipientType
    },
    value: proposal.total_value ? parseFloat(proposal.total_value.toString()) : 0,
    status: proposal.status as Proposal['status'],
    lastActivity: lastActivityDate,
    createdAt: new Date(proposal.created_at),
    validUntil: proposal.valid_until ? new Date(proposal.valid_until) : undefined,
    dateSent: proposal.sent_at ? new Date(proposal.sent_at) : undefined,
    activities: activityList,
    client_id: proposal.client_id,
    project_id: proposal.project_id,
    lead_id: proposal.lead_id,
    proposal_data: proposal.proposal_data,
    client_signed_at: proposal.client_signed_at ? new Date(proposal.client_signed_at) : undefined,
  }
}

// Client-side signature submission (no authentication required)
export async function submitClientSignature(
  proposalId: string,
  signatureData: {
    clientSignatureName: string
    clientSignatureDate: string
  }
): Promise<void> {
  const supabase = createClient()
  
  // Get the proposal
  const { data: proposal, error: fetchError } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', proposalId)
    .single()

  if (fetchError || !proposal) {
    throw new Error('Proposal not found')
  }

  // Update proposal_data with signature information
  const updatedProposalData = {
    ...proposal.proposal_data,
    contract: {
      ...(proposal.proposal_data?.contract || {}),
      clientSignatureName: signatureData.clientSignatureName,
      clientSignatureDate: signatureData.clientSignatureDate,
      clientSignedAt: new Date().toISOString()
    }
  }

  // Update proposal with signature and set status to Accepted
  // Also save to client_signed_at column for easier querying
  const signatureTimestamp = new Date(signatureData.clientSignatureDate)
  const { error: updateError } = await supabase
    .from('proposals')
    .update({
      proposal_data: updatedProposalData,
      status: 'Accepted',
      accepted_at: new Date().toISOString(),
      client_signed_at: signatureTimestamp.toISOString()
    })
    .eq('id', proposalId)

  if (updateError) {
    console.error('Error updating proposal with signature:', updateError)
    throw new Error('Failed to submit signature')
  }

  // Create activity log entry (without user_id since this is client-facing)
  await supabase
    .from('proposal_activities')
    .insert({
      proposal_id: proposalId,
      account_id: proposal.account_id,
      user_id: null, // No user_id for client signatures
      activity_type: 'accepted',
      action: 'client signed proposal',
      metadata: {
        client_name: signatureData.clientSignatureName,
        signed_at: signatureData.clientSignatureDate
      }
    })
}


