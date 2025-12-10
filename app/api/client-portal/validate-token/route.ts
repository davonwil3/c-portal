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
    const { token, slug } = await request.json()

    if (!token || !slug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: token and slug' },
        { status: 400 }
      )
    }

    // Find account by slug
    const { data: accounts } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
    
    let accountId = null
    let companySlug = slug
    
    if (accounts) {
      const matchingAccount = accounts.find(a => {
        if (!a.company_name) return false
        const accountSlug = a.company_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        return accountSlug === slug
      })
      accountId = matchingAccount?.id
    }

    if (!accountId) {
      // Try matching by user name
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('account_id, first_name, last_name')
      
      if (profiles) {
        const matchingProfile = profiles.find(p => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
          if (!fullName) return false
          const nameSlug = fullName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
          return nameSlug === slug
        })
        accountId = matchingProfile?.account_id || null
      }
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      )
    }

    // Validate magic link token (using updated function without client_slug)
    const { data: validationData, error: validationError } = await supabaseAdmin.rpc('validate_magic_link_token', {
      p_token: token,
      p_company_slug: companySlug
    })

    if (validationError || !validationData || !validationData[0]?.is_valid) {
      return NextResponse.json(
        { success: false, message: validationData?.[0]?.message || 'Invalid or expired token' },
        { status: 400 }
      )
    }

    const email = validationData[0].email

    // Find allowlist entries for this email and account
    const { data: allowlistEntries, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, company_slug')
      .eq('email', email)
      .eq('account_id', accountId)
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

    // Create session (without client_slug)
    const { data: sessionData, error: sessionError } = await supabaseAdmin.rpc('create_client_session', {
      p_email: email,
      p_company_slug: companySlug
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