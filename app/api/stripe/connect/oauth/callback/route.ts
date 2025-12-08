import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This is the account_id
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('Stripe OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=integrations&stripe_error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?tab=integrations&stripe_error=missing_parameters', request.url)
      )
    }

    // Exchange the authorization code for an access token
    const response = await fetch('https://connect.stripe.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.STRIPE_CLIENT_ID!,
        code: code,
        client_secret: process.env.STRIPE_SECRET_KEY!,
      }),
    })

    const data = await response.json()

    if (!response.ok || data.error) {
      console.error('Error exchanging OAuth code:', data)
      return NextResponse.redirect(
        new URL(`/dashboard/settings?tab=integrations&stripe_error=${encodeURIComponent(data.error_description || 'oauth_failed')}`, request.url)
      )
    }

    const connectedAccountId = data.stripe_user_id

    // Update the account with the connected Stripe account ID
    await supabaseAdmin
      .from('accounts')
      .update({
        stripe_connect_account_id: connectedAccountId,
        stripe_connect_enabled: true, // OAuth accounts are typically already enabled
      })
      .eq('id', state)

    // Verify the account status
    const connectAccount = await stripe.accounts.retrieve(connectedAccountId)
    const isEnabled = connectAccount.details_submitted && 
                      connectAccount.charges_enabled && 
                      connectAccount.payouts_enabled

    // Update with actual status
    await supabaseAdmin
      .from('accounts')
      .update({
        stripe_connect_enabled: isEnabled,
      })
      .eq('id', state)

    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&stripe_connected=true', request.url)
    )
  } catch (error: any) {
    console.error('Error handling Stripe OAuth callback:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&stripe_error=callback_failed', request.url)
    )
  }
}

