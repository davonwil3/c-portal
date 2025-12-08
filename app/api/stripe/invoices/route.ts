import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe, getOrCreateStripeCustomer } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Get user from server-side Supabase client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get account
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id, email')
      .eq('user_id', user.id)
      .single()

    if (!profile || !profile.account_id) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Get account with Stripe customer ID
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_customer_id')
      .eq('id', profile.account_id)
      .single()

    // Get or create Stripe customer if one doesn't exist
    // This ensures the customer exists even if they haven't subscribed yet
    let customerId = account?.stripe_customer_id
    if (!customerId) {
      console.log('No Stripe customer ID found, creating one for account:', profile.account_id)
      customerId = await getOrCreateStripeCustomer(
        user.id,
        profile.email || user.email || '',
        profile.account_id
      )
      console.log('Created Stripe customer:', customerId)
    }

    // Get invoices from Stripe (including all statuses to catch prorated invoices from plan changes)
    // Note: Can't expand more than 4 levels, so we'll fetch product info separately if needed
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 100,
      expand: ['data.lines.data.price'], // Only expand price, not product (too many levels)
    })

    console.log(`Found ${invoices.data.length} total invoices for customer ${customerId}`)

    // Format invoices for the frontend
    const formattedInvoices = invoices.data
      .filter((invoice) => {
        // Include paid, open, void, and uncollectible invoices
        // Also include draft invoices that are finalized (have a finalized_at timestamp)
        return invoice.status === 'paid' || 
               invoice.status === 'open' || 
               invoice.status === 'void' || 
               invoice.status === 'uncollectible' ||
               (invoice.status === 'draft' && invoice.finalized_at !== null)
      })
      .map((invoice) => {
        // Build description from line items to show plan changes
        let description = invoice.description || 'Subscription'
        if (invoice.lines.data.length > 0) {
          const lineDescriptions = invoice.lines.data
            .map((line) => {
              if (line.description) {
                return line.description
              }
              // For prorated items, show the plan name
              if (line.plan) {
                const planName = line.plan.nickname || line.plan.id
                const proration = line.proration ? ' (prorated)' : ''
                return `${planName}${proration}`
              }
              // Try to get product name from price
              if (line.price) {
                const price = typeof line.price === 'string' 
                  ? null 
                  : line.price as any
                
                if (price?.nickname) {
                  const proration = line.proration ? ' (prorated)' : ''
                  return `${price.nickname}${proration}`
                }
                
                // Try to determine plan from price ID
                if (price?.id) {
                  let planName = 'Subscription'
                  if (price.id === process.env.STRIPE_PRO_PRICE_ID) {
                    planName = 'Pro Plan'
                  } else if (price.id === process.env.STRIPE_PREMIUM_PRICE_ID) {
                    planName = 'Premium Plan'
                  }
                  const proration = line.proration ? ' (prorated)' : ''
                  return `${planName}${proration}`
                }
              }
              return null
            })
            .filter(Boolean)
          
          if (lineDescriptions.length > 0) {
            description = lineDescriptions.join(', ')
          }
        }

        return {
          id: invoice.id,
          invoiceNumber: invoice.number || invoice.id,
          date: new Date(invoice.created * 1000).toISOString().split('T')[0],
          amount: (invoice.amount_paid || invoice.amount_due || invoice.total) / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'open' ? 'Open' : invoice.status === 'void' ? 'Void' : 'Draft',
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          description,
        }
      })
      // Sort by date, most recent first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`Returning ${formattedInvoices.length} formatted invoices`)

    return NextResponse.json({ invoices: formattedInvoices })
  } catch (error: any) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

