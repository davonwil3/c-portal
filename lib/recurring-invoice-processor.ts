import { createAdminClient } from '@/lib/supabase/admin'
import type { RecurringInvoice, Invoice, InvoiceLineItem } from './invoices'
import { calculateNextRunDate } from './recurring-invoices'

interface ProcessResult {
  success: boolean
  invoicesCreated: number
  errors: Array<{ recurringInvoiceId: string; error: string }>
}

/**
 * Process all due recurring invoices and create new invoices
 * This function should be called by a cron job or scheduled task
 */
export async function processDueRecurringInvoices(): Promise<ProcessResult> {
  const adminClient = createAdminClient()
  const result: ProcessResult = {
    success: true,
    invoicesCreated: 0,
    errors: [],
  }

  try {
    const now = new Date().toISOString()

    // Find all active recurring invoices where next_run_at <= now
    const { data: dueRecurringInvoices, error: fetchError } = await adminClient
      .from('recurring_invoices')
      .select('*')
      .eq('status', 'active')
      .lte('next_run_at', now)
      .order('next_run_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching due recurring invoices:', fetchError)
      throw fetchError
    }

    if (!dueRecurringInvoices || dueRecurringInvoices.length === 0) {
      console.log('No due recurring invoices found')
      return result
    }

    console.log(`Found ${dueRecurringInvoices.length} due recurring invoice(s) to process`)

    // Process each recurring invoice
    for (const recurringInvoice of dueRecurringInvoices) {
      try {
        // Check if end_date has passed
        if (recurringInvoice.end_date && new Date(recurringInvoice.end_date) < new Date()) {
          console.log(`Recurring invoice ${recurringInvoice.id} has passed end_date, marking as ended`)
          await adminClient
            .from('recurring_invoices')
            .update({ status: 'ended' })
            .eq('id', recurringInvoice.id)
          continue
        }

        // Get user profile to get created_by info
        const { data: profile } = await adminClient
          .from('profiles')
          .select('user_id, first_name, last_name, account_id')
          .eq('account_id', recurringInvoice.account_id)
          .limit(1)
          .maybeSingle()

        const createdBy = recurringInvoice.user_id || profile?.user_id
        const createdByName = profile
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'System'
          : 'System'

        // Calculate issue date (today) and due date
        const issueDate = new Date()
        const dueDate = new Date(issueDate)
        dueDate.setDate(dueDate.getDate() + (recurringInvoice.days_until_due || 30))

        // Create new invoice from template
        const newInvoice: Partial<Invoice> = {
          account_id: recurringInvoice.account_id,
          client_id: recurringInvoice.client_id || undefined,
          project_id: recurringInvoice.project_id || undefined,
          invoice_type: 'recurring',
          title: recurringInvoice.title || `Recurring: ${recurringInvoice.name}`,
          description: recurringInvoice.description,
          notes: recurringInvoice.notes,
          po_number: recurringInvoice.po_number || undefined,
          line_items: (recurringInvoice.line_items as InvoiceLineItem[]) || [],
          status: recurringInvoice.auto_send ? 'sent' : 'draft',
          is_recurring: true,
          recurring_schedule: `${recurringInvoice.interval_type}-${recurringInvoice.interval_value}`,
          issue_date: issueDate.toISOString(),
          due_date: dueDate.toISOString(),
          sent_date: recurringInvoice.auto_send ? issueDate.toISOString() : undefined,
          subtotal: Number(recurringInvoice.subtotal),
          tax_rate: Number(recurringInvoice.tax_rate),
          tax_amount: Number(recurringInvoice.tax_amount),
          discount_type: recurringInvoice.discount_type,
          discount_amount: Number(recurringInvoice.discount_amount),
          discount_value: Number(recurringInvoice.discount_value),
          total_amount: Number(recurringInvoice.total_amount),
          currency: recurringInvoice.currency || 'USD',
          payment_terms: recurringInvoice.payment_terms || 'net-30',
          allow_online_payment: recurringInvoice.allow_online_payment ?? true,
          email_subject: recurringInvoice.email_subject,
          email_body: recurringInvoice.email_body,
          cc_emails: recurringInvoice.cc_emails,
          bcc_emails: recurringInvoice.bcc_emails,
          reminder_schedule: '3-days',
          auto_reminder: true,
          tags: ['invoice', 'recurring', recurringInvoice.auto_send ? 'sent' : 'draft'],
          metadata: {
            source: 'recurring_invoice',
            recurring_invoice_id: recurringInvoice.id,
            ...recurringInvoice.metadata,
          },
          created_by: createdBy,
          created_by_name: createdByName,
        }

        // Insert the new invoice
        const { data: createdInvoice, error: invoiceError } = await adminClient
          .from('invoices')
          .insert(newInvoice)
          .select()
          .single()

        if (invoiceError) {
          throw new Error(`Failed to create invoice: ${invoiceError.message}`)
        }

        console.log(`Created invoice ${createdInvoice.id} from recurring template ${recurringInvoice.id}`)

        // If auto_send is true, generate share link and send the invoice
        if (recurringInvoice.auto_send && createdInvoice) {
          try {
            // Generate share token for the invoice
            let shareToken: string | null = null
            try {
              const { data: tokenData, error: tokenError } = await adminClient.rpc('generate_invoice_share_token')
              if (!tokenError && tokenData) {
                const { error: updateError } = await adminClient
                  .from('invoices')
                  .update({ share_token: tokenData })
                  .eq('id', createdInvoice.id)
                
                if (!updateError) {
                  shareToken = tokenData
                  console.log(`Generated share token for invoice ${createdInvoice.id}`)
                }
              }
            } catch (shareError) {
              console.error('Error generating share token:', shareError)
              // Fallback: generate token manually using Node.js crypto
              try {
                const crypto = await import('crypto')
                const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
                const randomBytes = crypto.randomBytes(8)
                const fallbackToken = Array.from(randomBytes)
                  .map(b => chars[b % chars.length])
                  .join('')
                
                const { error: updateError } = await adminClient
                  .from('invoices')
                  .update({ share_token: fallbackToken })
                  .eq('id', createdInvoice.id)
                
                if (!updateError) {
                  shareToken = fallbackToken
                }
              } catch (fallbackError) {
                console.error('Error in fallback token generation:', fallbackError)
              }
            }

            // Send email with share link
            await sendRecurringInvoiceEmail(createdInvoice, recurringInvoice, shareToken)
          } catch (emailError: any) {
            console.error(`Error sending invoice email for ${createdInvoice.id}:`, emailError)
            // Don't fail the whole process if email fails, but log it
            result.errors.push({
              recurringInvoiceId: recurringInvoice.id,
              error: `Email send failed: ${emailError.message}`,
            })
          }
        }

        // Calculate next run date
        const currentNextRun = new Date(recurringInvoice.next_run_at)
        const nextRunAt = calculateNextRunDate(
          currentNextRun,
          recurringInvoice.interval_type,
          recurringInvoice.interval_value
        )

        // Update recurring invoice with next run date and last run timestamp
        const { error: updateError } = await adminClient
          .from('recurring_invoices')
          .update({
            next_run_at: nextRunAt.toISOString(),
            last_run_at: new Date().toISOString(),
          })
          .eq('id', recurringInvoice.id)

        if (updateError) {
          throw new Error(`Failed to update recurring invoice: ${updateError.message}`)
        }

        result.invoicesCreated++
        console.log(`Updated recurring invoice ${recurringInvoice.id} - next run: ${nextRunAt.toISOString()}`)
      } catch (error: any) {
        console.error(`Error processing recurring invoice ${recurringInvoice.id}:`, error)
        result.errors.push({
          recurringInvoiceId: recurringInvoice.id,
          error: error.message || 'Unknown error',
        })
        result.success = false
        // Continue processing other invoices even if one fails
      }
    }

    console.log(`Processed ${dueRecurringInvoices.length} recurring invoice(s). Created ${result.invoicesCreated} invoice(s).`)
    return result
  } catch (error: any) {
    console.error('Error in processDueRecurringInvoices:', error)
    result.success = false
    result.errors.push({
      recurringInvoiceId: 'unknown',
      error: error.message || 'Unknown error',
    })
    return result
  }
}

/**
 * Send email for a recurring invoice
 */
async function sendRecurringInvoiceEmail(
  invoice: Invoice,
  recurringInvoice: RecurringInvoice,
  shareToken: string | null = null
): Promise<void> {
  // Get client email
  if (!recurringInvoice.client_id) {
    throw new Error('No client_id found for recurring invoice')
  }

  const adminClient = createAdminClient()
  const { data: client } = await adminClient
    .from('clients')
    .select('email, first_name, last_name, company')
    .eq('id', recurringInvoice.client_id)
    .single()

  if (!client || !client.email) {
    throw new Error('Client email not found')
  }

  // Get account info for company name
  const { data: account } = await adminClient
    .from('accounts')
    .select('company_name')
    .eq('id', invoice.account_id)
    .single()

  const companyName = account?.company_name || 'Your Company'
  const clientName = client.company || `${client.first_name} ${client.last_name}`.trim() || 'Client'

  // Generate share link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  let shareUrl = `${baseUrl}/invoice/${invoice.id}`
  
  if (shareToken) {
    // Get company slug for share URL
    const companySlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    shareUrl = `${baseUrl}/${companySlug}/invoice/${shareToken}`
  }

  // Import email service
  const { sendInvoiceEmail } = await import('./email-service')

  // Send email
  await sendInvoiceEmail({
    to: client.email,
    recipientName: clientName,
    companyName,
    invoiceNumber: invoice.invoice_number,
    invoiceTitle: invoice.title || 'Invoice',
    invoiceAmount: invoice.total_amount,
    invoiceCurrency: invoice.currency || 'USD',
    invoiceUrl: shareUrl,
    emailSubject: recurringInvoice.email_subject || `Invoice ${invoice.invoice_number} from ${companyName}`,
    emailBody: recurringInvoice.email_body,
    ccEmails: recurringInvoice.cc_emails,
    bccEmails: recurringInvoice.bcc_emails,
  })
}

