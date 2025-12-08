import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim()

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

if (!stripeSecretKey.startsWith('sk_test_') && !stripeSecretKey.startsWith('sk_live_')) {
  throw new Error('STRIPE_SECRET_KEY must start with sk_test_ or sk_live_')
}

// Initialize Stripe - let it use the default API version
export const stripe = new Stripe(stripeSecretKey, {
  typescript: true,
})

// Plan prices in cents (for Stripe)
export const PLAN_PRICES = {
  free: 0,
  pro: 2500, // $25.00
  premium: 3900, // $39.00
}

// Plan tier mapping
export const PLAN_TIERS = {
  free: 'free',
  pro: 'pro',
  premium: 'premium',
} as const

// Get or create Stripe customer
// This function should be called from server-side code (API routes) which have access to service role key
export async function getOrCreateStripeCustomer(userId: string, email: string, accountId: string) {
  // Use admin client with service role key for database updates
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for customer creation')
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  
  // Check if customer already exists in database
  const { data: account, error: accountError } = await supabaseAdmin
    .from('accounts')
    .select('stripe_customer_id')
    .eq('id', accountId)
    .single()

  if (accountError) {
    console.error('Error fetching account:', accountError)
  }

  if (account?.stripe_customer_id) {
    // Verify customer exists in Stripe
    try {
      const customer = await stripe.customers.retrieve(account.stripe_customer_id)
      if (!customer.deleted) {
        console.log(`Using existing Stripe customer: ${account.stripe_customer_id}`)
        return account.stripe_customer_id
      }
    } catch (error) {
      console.log('Customer not found in Stripe, will create new one')
      // Customer doesn't exist in Stripe, create new one
    }
  }

  // Create new Stripe customer
  console.log(`Creating new Stripe customer for account ${accountId}, email: ${email}`)
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
      accountId,
    },
  })

  console.log(`Created Stripe customer: ${customer.id}`)

  // Update account with Stripe customer ID using admin client
  const { error: updateError } = await supabaseAdmin
    .from('accounts')
    .update({ stripe_customer_id: customer.id })
    .eq('id', accountId)

  if (updateError) {
    console.error('Error updating account with Stripe customer ID:', updateError)
    throw new Error(`Failed to save Stripe customer ID to database: ${updateError.message}`)
  }

  console.log(`Successfully saved Stripe customer ID ${customer.id} to account ${accountId}`)

  return customer.id
}

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  planTier: 'pro' | 'premium',
  accountId: string,
  userId: string,
  customerEmail?: string
) {
  const priceId = planTier === 'pro' 
    ? process.env.STRIPE_PRO_PRICE_ID 
    : process.env.STRIPE_PREMIUM_PRICE_ID

  if (!priceId) {
    throw new Error(`Price ID for ${planTier} plan is not set`)
  }

  // Stripe doesn't allow both customer and customer_email - use customer if we have it
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    // payment_method_types is omitted to use Dashboard settings
    // Configure payment methods at: https://dashboard.stripe.com/settings/payment_methods
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?tab=billing&success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?tab=billing&canceled=true`,
    metadata: {
      accountId,
      userId,
      planTier,
    },
    // Security: Make session expire after 30 minutes
    expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
    // Add metadata to subscription for additional tracking
    subscription_data: {
      metadata: {
        accountId,
        userId,
        planTier,
      },
    },
    // Save payment method to customer for future use
    // For subscription mode, payment methods are automatically saved when customer is specified
    payment_method_collection: 'always',
  }

  // Only specify customer if we have a customerId (don't use both customer and customer_email)
  if (customerId) {
    sessionConfig.customer = customerId
  } else if (customerEmail) {
    sessionConfig.customer_email = customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionConfig)

  return session
}

// Create billing portal session
export async function createBillingPortalSession(customerId: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/settings?tab=billing`,
  })

  return session
}

