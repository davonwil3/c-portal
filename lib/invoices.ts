import { createClient } from '@/lib/supabase/client'

export interface Invoice {
  id: string
  account_id: string
  invoice_number: string
  invoice_type: 'standard' | 'deposit' | 'milestone' | 'final' | 'recurring'
  client_id?: string
  project_id?: string
  contract_id?: string
  title?: string
  description?: string
  notes?: string
  po_number?: string
  line_items: InvoiceLineItem[]
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded'
  is_recurring: boolean
  recurring_schedule?: string
  issue_date: string
  due_date?: string
  sent_date?: string
  paid_date?: string
  viewed_date?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_type: 'percentage' | 'fixed'
  discount_amount: number
  discount_value: number
  total_amount: number
  currency: string
  payment_terms: string
  allow_online_payment: boolean
  payment_url?: string
  payment_methods?: string[]
  email_subject?: string
  email_body?: string
  cc_emails?: string[]
  bcc_emails?: string[]
  reminder_schedule: string
  auto_reminder: boolean
  tags?: string[]
  metadata?: any
  created_by?: string
  created_by_name?: string
  created_at: string
  updated_at: string
  last_activity_at?: string
  // Joined data
  client_name?: string
  project_name?: string
}

export interface InvoiceLineItem {
  id: string
  name: string
  description?: string
  item_type: 'service' | 'product' | 'expense' | 'time'
  quantity: number
  unit_rate: number
  total_amount: number
  is_taxable: boolean
  sort_order: number
}

export interface InvoiceStats {
  total: number
  draft: number
  sent: number
  viewed: number
  paid: number
  partially_paid: number
  overdue: number
  cancelled: number
  refunded: number
}

const supabase = createClient()

export async function getInvoices(): Promise<Invoice[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(invoice => ({
    ...invoice,
    client_name: invoice.clients ? 
      (invoice.clients.company || `${invoice.clients.first_name} ${invoice.clients.last_name}`) : 
      null,
    project_name: invoice.projects?.name || null
  })) || []
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .select('status')
    .eq('account_id', profile.account_id)

  if (error) throw error

  const stats: InvoiceStats = {
    total: data?.length || 0,
    draft: 0,
    sent: 0,
    viewed: 0,
    paid: 0,
    partially_paid: 0,
    overdue: 0,
    cancelled: 0,
    refunded: 0
  }

  data?.forEach(invoice => {
    if (invoice.status in stats) {
      stats[invoice.status as keyof InvoiceStats]++
    }
  })

  return stats
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
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

export async function getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('invoice_number', invoiceNumber)
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

export async function createInvoice(invoiceData: Partial<Invoice>): Promise<Invoice> {
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

  // Log the data being sent to Supabase
  const finalData = {
    ...invoiceData,
    account_id: profile.account_id,
    created_by: user.id,
    created_by_name: fullName
  }
  
  const { data, error } = await supabase
    .from('invoices')
    .insert(finalData)
    .select()
    .single()

  if (error) {
    throw error
  }
  
  return data
}

export async function updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteInvoice(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('account_id', profile.account_id)

  if (error) throw error
}

export async function sendInvoice(id: string, emailData: {
  email_subject: string
  email_body: string
  cc_emails?: string[]
  bcc_emails?: string[]
}): Promise<Invoice> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .update({
      ...emailData,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .update({
      status: 'paid',
      paid_date: new Date().toISOString()
    })
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getInvoicesByProject(projectId: string): Promise<Invoice[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('account_id', profile.account_id)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(invoice => ({
    ...invoice,
    client_name: invoice.clients ? 
      (invoice.clients.company || `${invoice.clients.first_name} ${invoice.clients.last_name}`) : 
      null,
    project_name: invoice.projects?.name || null
  })) || []
}

export async function getInvoicesByClient(clientId: string): Promise<Invoice[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('invoices')
    .select(`
      *,
      clients:client_id(first_name, last_name, company),
      projects:project_id(name)
    `)
    .eq('account_id', profile.account_id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data?.map(invoice => ({
    ...invoice,
    client_name: invoice.clients ? 
      (invoice.clients.company || `${invoice.clients.first_name} ${invoice.clients.last_name}`) : 
      null,
    project_name: invoice.projects?.name || null
  })) || []
} 