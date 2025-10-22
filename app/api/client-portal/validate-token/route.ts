import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { token, companySlug, clientSlug } = await request.json()

    if (!token || !companySlug || !clientSlug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate magic link token
    const { data: validationData, error: validationError } = await supabaseAdmin.rpc('validate_magic_link_token', {
      p_token: token,
      p_company_slug: companySlug,
      p_client_slug: clientSlug
    })

    if (validationError || !validationData || !validationData[0]?.is_valid) {
      return NextResponse.json(
        { success: false, message: validationData?.[0]?.message || 'Invalid or expired token' },
        { status: 400 }
      )
    }

    const email = validationData[0].email

    // Get user info from allowlist - find by email and account
    // First, find the account by company slug
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .ilike('company_name', `%${companySlug.replace(/-/g, '%')}%`)
      .single()

    if (accountError || !accountData) {
      console.log('Company not found for slug:', companySlug)
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      )
    }

    // Find allowlist entries for this email and account
    const { data: allowlistEntries, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, company_slug, client_slug')
      .eq('email', email)
      .eq('account_id', accountData.id)
      .eq('is_active', true)

    if (allowlistError) {
      console.error('Allowlist error:', allowlistError)
      return NextResponse.json(
        { success: false, message: 'Database error checking allowlist' },
        { status: 500 }
      )
    }

    if (!allowlistEntries || allowlistEntries.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in allowlist' },
        { status: 404 }
      )
    }

    // Use the first allowlist entry if multiple exist
    const allowlistData = allowlistEntries[0]

    // Create session
    const { data: sessionData, error: sessionError } = await supabaseAdmin.rpc('create_client_session', {
      p_email: email,
      p_company_slug: companySlug,
      p_client_slug: clientSlug
    })

    if (sessionError || !sessionData || !sessionData[0]) {
      console.error('Error creating session:', sessionError)
      return NextResponse.json(
        { success: false, message: 'Failed to create session' },
        { status: 500 }
      )
    }

    const session = sessionData[0]

    // Note: We no longer mark tokens as used to allow reuse within expiration period
    // This provides a smoother user experience for accessing the portal

    return NextResponse.json({
      success: true,
      message: 'Token validated and session created',
      data: {
        email: allowlistData.email,
        name: allowlistData.name,
        role: allowlistData.role,
        companySlug,
        clientSlug,
        sessionToken: session.session_token,
        refreshToken: session.refresh_token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
    })

  } catch (error) {
    console.error('Error in token validation API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 