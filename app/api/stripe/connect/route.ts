import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { useOAuth } = await request.json().catch(() => ({ useOAuth: false }))

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
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || !profile.account_id) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      )
    }

    // Check if Connect account already exists
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('stripe_connect_account_id, stripe_connect_enabled')
      .eq('id', profile.account_id)
      .single()

    let connectAccountId = account?.stripe_connect_account_id

    // If account exists and is enabled, create a login link for management
    if (connectAccountId && account?.stripe_connect_enabled) {
      const loginLink = await stripe.accounts.createLoginLink(connectAccountId)
      return NextResponse.json({ url: loginLink.url })
    }

    // Use OAuth if requested (for connecting existing Stripe accounts)
    if (useOAuth) {
      const stripeClientId = process.env.STRIPE_CLIENT_ID
      if (!stripeClientId) {
        return NextResponse.json(
          { error: 'Stripe Client ID not configured. Please add STRIPE_CLIENT_ID to your environment variables.' },
          { status: 500 }
        )
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const oauthUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${stripeClientId}&scope=read_write&redirect_uri=${encodeURIComponent(`${baseUrl}/api/stripe/connect/oauth/callback`)}&state=${profile.account_id}`

      return NextResponse.json({ url: oauthUrl })
    }

    // Otherwise, create a new Express account
    if (!connectAccountId) {
      // Create a new Stripe Connect account
      const connectAccount = await stripe.accounts.create({
        type: 'express',
        country: 'US', // You might want to make this dynamic
        email: user.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: {
          accountId: profile.account_id,
          userId: user.id,
        },
      })

      connectAccountId = connectAccount.id

      // Save the Connect account ID
      await supabaseAdmin
        .from('accounts')
        .update({ 
          stripe_connect_account_id: connectAccountId,
          stripe_connect_enabled: false,
        })
        .eq('id', profile.account_id)
    }

    // Create account link for onboarding
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const accountLink = await stripe.accountLinks.create({
      account: connectAccountId,
      refresh_url: `${baseUrl}/dashboard/settings?tab=integrations&stripe_refresh=true`,
      return_url: `${baseUrl}/dashboard/settings?tab=integrations&stripe_connected=true`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (error: any) {
    console.error('Error creating Stripe Connect link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect link' },
      { status: 500 }
    )
  }
}

