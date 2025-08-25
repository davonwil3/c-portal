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

    // Get user info from allowlist - use flexible logic like the magic link endpoint
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, company_slug, client_slug')
      .eq('email', email)
      .eq('is_active', true)
      .or(`company_slug.eq.${companySlug},client_slug.eq.${clientSlug}`)
      .maybeSingle()

    if (allowlistError || !allowlistData) {
      return NextResponse.json(
        { success: false, message: 'User not found in allowlist' },
        { status: 404 }
      )
    }

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

    // Mark the magic link token as used after successful session creation
    const { error: markUsedError } = await supabaseAdmin.rpc('mark_magic_link_token_used', {
      p_token: token,
      p_company_slug: companySlug,
      p_client_slug: clientSlug
    })

    if (markUsedError) {
      console.error('Warning: Could not mark token as used:', markUsedError)
      // Don't fail the request for this - the session was created successfully
    }

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