import { createClient } from '@/lib/supabase/client'
import type { Invoice, InvoiceLineItem } from './invoices'

export interface RecurringInvoice {
  id: string
  account_id: string
  user_id?: string
  name: string
  client_id?: string
  project_id?: string
  title?: string
  description?: string
  notes?: string
  po_number?: string
  line_items: InvoiceLineItem[]
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
  email_subject?: string
  email_body?: string
  cc_emails?: string[]
  bcc_emails?: string[]
  interval_type: 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval_value: number
  start_date: string
  next_run_at: string
  end_date?: string
  auto_send: boolean
  days_until_due: number
  status: 'active' | 'paused' | 'ended'
  metadata?: any
  created_at: string
  updated_at: string
  last_run_at?: string
}

export interface CreateRecurringInvoiceInput {
  name: string
  client_id?: string
  project_id?: string
  title?: string
  description?: string
  notes?: string
  po_number?: string
  line_items: InvoiceLineItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_type: 'percentage' | 'fixed'
  discount_amount: number
  discount_value: number
  total_amount: number
  currency?: string
  payment_terms?: string
  allow_online_payment?: boolean
  email_subject?: string
  email_body?: string
  cc_emails?: string[]
  bcc_emails?: string[]
  interval_type: 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval_value?: number
  start_date: string
  end_date?: string
  auto_send?: boolean
  days_until_due?: number
  metadata?: any
}

const supabase = createClient()

export async function getRecurringInvoices(): Promise<RecurringInvoice[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getRecurringInvoice(id: string): Promise<RecurringInvoice | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { data, error } = await supabase
    .from('recurring_invoices')
    .select('*')
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .single()

  if (error) throw error
  return data
}

export async function createRecurringInvoice(input: CreateRecurringInvoiceInput): Promise<RecurringInvoice> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  // Calculate next_run_at from start_date
  const startDate = new Date(input.start_date)
  const nextRunAt = calculateNextRunDate(startDate, input.interval_type, input.interval_value || 1)

  const { data, error } = await supabase
    .from('recurring_invoices')
    .insert({
      ...input,
      account_id: profile.account_id,
      user_id: user.id,
      interval_value: input.interval_value || 1,
      currency: input.currency || 'USD',
      payment_terms: input.payment_terms || 'net-30',
      allow_online_payment: input.allow_online_payment ?? true,
      auto_send: input.auto_send ?? false,
      days_until_due: input.days_until_due || 30,
      next_run_at: nextRunAt.toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateRecurringInvoice(id: string, updates: Partial<RecurringInvoice>): Promise<RecurringInvoice> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  // If interval or start_date changed, recalculate next_run_at
  if (updates.interval_type || updates.interval_value || updates.start_date) {
    const existing = await getRecurringInvoice(id)
    if (existing) {
      const startDate = new Date(updates.start_date || existing.start_date)
      const intervalType = updates.interval_type || existing.interval_type
      const intervalValue = updates.interval_value || existing.interval_value
      updates.next_run_at = calculateNextRunDate(startDate, intervalType, intervalValue).toISOString()
    }
  }

  const { data, error } = await supabase
    .from('recurring_invoices')
    .update(updates)
    .eq('id', id)
    .eq('account_id', profile.account_id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteRecurringInvoice(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) throw new Error('No account found')

  const { error } = await supabase
    .from('recurring_invoices')
    .delete()
    .eq('id', id)
    .eq('account_id', profile.account_id)

  if (error) throw error
}

/**
 * Calculate the next run date based on interval type and value
 */
export function calculateNextRunDate(
  fromDate: Date,
  intervalType: 'weekly' | 'monthly' | 'yearly' | 'custom',
  intervalValue: number = 1
): Date {
  const nextDate = new Date(fromDate)

  switch (intervalType) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * intervalValue))
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + intervalValue)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + intervalValue)
      break
    case 'custom':
      // For custom, interval_value is in days
      nextDate.setDate(nextDate.getDate() + intervalValue)
      break
  }

  return nextDate
}

