import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  let email: string = '', companySlug: string = '', clientSlug: string = ''
  
  try {
    const body = await request.json()
    email = body.email || ''
    companySlug = body.companySlug || ''
    clientSlug = body.clientSlug || ''

    if (!email || !companySlug || !clientSlug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email is in allowlist (including the client themselves)
    // First get the account_id from the company_slug
    console.log('🔍 Looking up company:', companySlug)
    
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .ilike('company_name', `%${companySlug.replace(/-/g, '%')}%`)
      .single()

    if (accountError || !accountData) {
      console.log('❌ Company not found for slug:', companySlug)
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      )
    }

    console.log('✅ Company found:', {
      id: accountData.id,
      name: accountData.company_name,
      slug: companySlug
    })

    // Check if email is in allowlist for this account
    // User can access if they're in the allowlist for this company OR this specific client
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, company_slug, client_slug')
      .eq('account_id', accountData.id)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .or(`company_slug.eq.${companySlug},client_slug.eq.${clientSlug}`)
      .maybeSingle()

    if (allowlistError) {
      console.error('❌ Allowlist query error:', allowlistError)
      return NextResponse.json(
        { success: false, message: 'Database error checking authorization' },
        { status: 500 }
      )
    }

    if (!allowlistData) {
      console.log('❌ Email not found in allowlist:', {
        email: email.toLowerCase(),
        companySlug,
        clientSlug,
        accountId: accountData.id
      })
      
      // Debug: Show what's actually in the allowlist for this account
      const { data: debugData, error: debugError } = await supabaseAdmin
        .from('client_allowlist')
        .select('email, company_slug, client_slug, is_active')
        .eq('account_id', accountData.id)
        .eq('is_active', true)
      
      if (!debugError && debugData) {
        console.log('🔍 Current allowlist entries for this account:', debugData)
      }
      
      return NextResponse.json(
        { success: false, message: 'Email not authorized for this portal. Please contact your administrator to be added to the access list.' },
        { status: 403 }
      )
    }

    console.log('✅ Email authorized:', allowlistData)

    // Generate magic link token
    let tokenData: string
    try {
      const { data, error: tokenError } = await supabaseAdmin.rpc('generate_magic_link_token', {
        p_email: email.toLowerCase(),
        p_company_slug: companySlug,
        p_client_slug: clientSlug
      })

      if (tokenError) {
        console.error('Error generating magic link token:', tokenError)
        return NextResponse.json(
          { success: false, message: 'Failed to generate magic link: ' + tokenError.message },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { success: false, message: 'No token generated' },
          { status: 500 }
        )
      }

      tokenData = data
    } catch (rpcError) {
      console.error('RPC Error:', rpcError)
      return NextResponse.json(
        { success: false, message: 'Database function error: ' + (rpcError as Error).message },
        { status: 500 }
        )
    }

    // Send magic link email
    // Import domain configuration
    let magicLink: string
    try {
      const { getMagicLinkUrl } = await import('@/lib/domain-config')
      
      // Generate magic link with proper domain structure
      magicLink = getMagicLinkUrl(companySlug, clientSlug, tokenData, process.env.NODE_ENV === 'production')
    } catch (importError) {
      console.error('Error importing domain config:', importError)
      // Fallback to basic URL
      magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${companySlug}?client=${clientSlug}&token=${tokenData}`
    }
    
    try {
      // Import the email service
      const { sendMagicLinkEmail } = await import('@/lib/email-service')
      
      // Send the magic link email via Resend
      await sendMagicLinkEmail({
        to: email.toLowerCase(),
        recipientName: allowlistData.name || 'there',
        companyName: companySlug,
        magicLink,
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com' // Update with your verified domain
      })
      
      console.log('✅ Magic link email sent successfully to:', email.toLowerCase())
    } catch (emailError) {
      console.error('❌ Failed to send magic link email:', emailError)
      // For development, just log the magic link instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Development Magic Link:', magicLink)
      }
      // Don't fail the entire request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email!',
      data: {
        email: allowlistData.email,
        name: allowlistData.name,
        role: allowlistData.role
      }
    })

  } catch (error) {
    console.error('Error in magic link API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email,
      companySlug,
      clientSlug
    })
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
} 