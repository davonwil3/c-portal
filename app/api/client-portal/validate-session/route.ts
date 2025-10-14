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
    const { sessionToken, companySlug, clientSlug } = await request.json()

    if (!sessionToken || !companySlug || !clientSlug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate session token
    const { data, error } = await supabaseAdmin.rpc('validate_client_session', {
      p_session_token: sessionToken,
      p_company_slug: companySlug,
      p_client_slug: clientSlug
    })

    if (error || !data || !data[0]?.is_valid) {
      const errorMessage = data?.[0]?.message || 'Invalid or expired session'
      return NextResponse.json(
        { 
          success: false, 
          message: errorMessage,
          errorType: errorMessage.includes('expired') ? 'expired' : 'invalid'
        },
        { status: 400 }
      )
    }

    const email = data[0].email

    // Get user info from allowlist
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role')
      .eq('email', email)
      .eq('company_slug', companySlug)
      .eq('client_slug', clientSlug)
      .eq('is_active', true)
      .single()

    if (allowlistError || !allowlistData) {
      return NextResponse.json(
        { success: false, message: 'User not found in allowlist' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session valid',
      data: {
        email: allowlistData.email,
        name: allowlistData.name,
        role: allowlistData.role,
        companySlug,
        clientSlug
      }
    })

  } catch (error) {
    console.error('Error in session validation API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 