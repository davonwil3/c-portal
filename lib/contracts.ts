import { createClient } from '@/lib/supabase/client'

export interface Contract {
  id: string
  account_id: string
  name: string
  description?: string
  contract_number?: string
  contract_content: any // JSONB content
  contract_html?: string
  contract_pdf_path?: string
  contract_type: 'custom' | 'web-design' | 'social-media' | 'consulting' | 'contractor' | 'retainer' | 'sow' | 'nda'
  client_id?: string
  project_id?: string
  portal_id?: string
  status: 'draft' | 'sent' | 'awaiting_signature' | 'partially_signed' | 'signed' | 'declined' | 'expired' | 'archived'
  total_value?: number
  currency?: string
  payment_terms?: string
  deposit_amount?: number
  deposit_percentage?: number
  start_date?: string
  end_date?: string
  due_date?: string
  expiration_date?: string
  signer_name?: string
  signer_email?: string
  signer_role?: string
  signature_data?: any
  signature_ip?: string
  signature_user_agent?: string
  signature_status?: 'pending' | 'signed' | 'declined'
  signed_at?: string
  declined_at?: string
  decline_reason?: string
  email_subject?: string
  email_body?: string
  cc_emails?: string[]
  bcc_emails?: string[]
  reminder_schedule?: string
  auto_reminder?: boolean
  email_sent_at?: string
  email_opened_at?: string
  email_clicked_at?: string
  tags?: string[]
  metadata?: any
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
  sent_at?: string
  last_activity_at?: string
  // Joined data
  client_name?: string
  project_name?: string
}

export interface ContractTemplate {
  id: string
  account_id: string
  name: string
  description?: string
  template_number?: string
  template_content: any // JSONB content
  template_html?: string
  template_pdf_path?: string
  template_type: 'custom' | 'web-design' | 'social-media' | 'consulting' | 'contractor' | 'retainer' | 'sow' | 'nda'
  source_contract_id?: string
  is_public: boolean
  is_default: boolean
  tags?: string[]
  metadata?: any
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
  last_used_at?: string
}

export interface ContractStats {
  total: number
  draft: number
  sent: number
  awaiting_signature: number
  partially_signed: number
  signed: number
  declined: number
  expired: number
  archived: number
}

const supabase = createClient()

export async function getContracts(): Promise<Contract[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(contract => ({
    ...contract,
    client_name: contract.clients ? 
      (contract.clients.company || `${contract.clients.first_name} ${contract.clients.last_name}`) : 
      null,
    project_name: contract.projects?.name || null
  })) || []
}

export async function getContractStats(): Promise<ContractStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .select('status')
    .eq('account_id', profile.account_id)

  if (error) throw error

  const stats: ContractStats = {
    total: data?.length || 0,
    draft: 0,
    sent: 0,
    awaiting_signature: 0,
    partially_signed: 0,
    signed: 0,
    declined: 0,
    expired: 0,
    archived: 0
  }

  data?.forEach(contract => {
    if (contract.status in stats) {
      stats[contract.status as keyof ContractStats]++
    }
  })

  return stats
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .single()

  if (error) throw error

  return data ? {
    ...data,
    client_name: data.clients ? 
      (data.clients.company || `${data.clients.first_name} ${data.clients.last_name}`) : 
      null,
    project_name: data.projects?.name || null
  } : null
}

export async function getContractByNumber(contractNumber: string): Promise<Contract | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('contract_number', contractNumber)
    .eq('account_id', profile.account_id)
    .single()

  if (error) throw error

  return data ? {
    ...data,
    client_name: data.clients ? 
      (data.clients.company || `${data.clients.first_name} ${data.clients.last_name}`) : 
      null,
    project_name: data.projects?.name || null
  } : null
}

export async function createContract(contractData: Partial<Contract>): Promise<Contract> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // First, let's check if the profile exists and what data it has
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('account_id, email, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (profileError) {
    console.error('Profile lookup error:', profileError)
    throw new Error(`Profile lookup failed: ${profileError.message}`)
  }

  if (!profile) {
    console.error('No profile found for user:', user.id)
    throw new Error('No profile found for user')
  }

  console.log('Profile data:', profile)

  if (!profile.account_id) {
    console.error('Profile exists but no account_id:', profile)
    throw new Error('Profile exists but no account_id found')
  }

  // Create full name from first_name and last_name
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'

  // Generate a unique contract number manually
  const currentYear = new Date().getFullYear()
  const timestamp = Date.now()
  const contractNumber = `CON-${currentYear}-${timestamp}`

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      ...contractData,
      contract_number: contractNumber,
      account_id: profile.account_id,
      created_by: user.id,
      created_by_name: fullName
    })
    .select()
    .single()

  if (error) throw error
  
  return data
}

export async function updateContract(id: string, updates: Partial<Contract>): Promise<Contract> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .update(updates)
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContract(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', id)
    .eq('account_id', profile.account_id)

  if (error) throw error
}

export async function sendContract(id: string, emailData: {
  email_subject: string
  email_body: string
  signer_email: string
  signer_name: string
  cc_emails?: string[]
  bcc_emails?: string[]
}): Promise<Contract> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contracts')
    .update({
      ...emailData,
      status: 'sent',
      sent_at: new Date().toISOString(),
      email_sent_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

// =====================================================
// CONTRACT TEMPLATES FUNCTIONS
// =====================================================

export async function getContractTemplates(): Promise<ContractTemplate[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .or(`account_id.eq.${profile.account_id},is_public.eq.true`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getContractTemplate(id: string): Promise<ContractTemplate | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('id', id)
    .or(`account_id.eq.${profile.account_id},is_public.eq.true`)
    .single()

  if (error) throw error
  return data
}

export async function getContractTemplateByNumber(templateNumber: string): Promise<ContractTemplate | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contract_templates')
    .select('*')
    .eq('template_number', templateNumber)
    .eq('account_id', profile.account_id)
    .single()

  if (error) throw error
  return data
}

export async function createContractTemplate(templateData: Partial<ContractTemplate>): Promise<ContractTemplate> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  // Create full name from first_name and last_namee
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'

  // Generate a unique template number manually
  const currentYear = new Date().getFullYear()
  const timestamp = Date.now()
  const templateNumber = `TPL-${currentYear}-${timestamp}`

  const { data, error } = await supabase
    .from('contract_templates')
    .insert({
      ...templateData,
      template_number: templateNumber,
      account_id: profile.account_id,
      created_by: user.id,
      created_by_name: fullName
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateContractTemplate(id: string, updates: Partial<ContractTemplate>): Promise<ContractTemplate> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('contract_templates')
    .update(updates)
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteContractTemplate(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { error } = await supabase
    .from('contract_templates')
    .delete()
    .eq('id', id)
    .eq('account_id', profile.account_id)

  if (error) throw error
}

export async function createContractFromTemplate(templateId: string, contractData: Partial<Contract>): Promise<Contract> {
  const template = await getContractTemplate(templateId)
  if (!template) throw new Error('Template not found')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  // Create full name from first_name and last_name
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User'

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      ...contractData,
      contract_content: template.template_content,
      contract_html: template.template_html,
      contract_pdf_path: template.template_pdf_path,
      contract_type: template.template_type,
      source_contract_id: template.id,
      account_id: profile.account_id,
      created_by: user.id,
      created_by_name: fullName
    })
    .select()
    .single()

  if (error) throw error
  
  return data
}

function createContractTextForVector(contract: any): string {
  const lines: string[] = []
  lines.push(`Contract: ${contract.name || ''}`)
  lines.push(`Contract Number: ${contract.contract_number || ''}`)
  lines.push(`Description: ${contract.description || ''}`)
  lines.push(`Type: ${contract.contract_type || ''}`)
  lines.push(`Status: ${contract.status || ''}`)
  if (contract.total_value) lines.push(`Total Value: ${contract.total_value} ${contract.currency || 'USD'}`)
  if (contract.payment_terms) lines.push(`Payment Terms: ${contract.payment_terms}`)
  if (contract.start_date) lines.push(`Start Date: ${contract.start_date}`)
  if (contract.end_date) lines.push(`End Date: ${contract.end_date}`)
  if (contract.due_date) lines.push(`Due Date: ${contract.due_date}`)
  if (contract.signer_name) lines.push(`Signer: ${contract.signer_name}`)
  if (contract.signer_email) lines.push(`Signer Email: ${contract.signer_email}`)
  
  // Add contract content if available
  if (contract.contract_content) {
    lines.push('\nContract Content:')
    lines.push(JSON.stringify(contract.contract_content, null, 2))
  }
  
  return lines.join('\n')
}