import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  return NextResponse.json(
    { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
    { status: 500 }
  )
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { token, companySlug, clientSlug } = await request.json()

    if (!token || !companySlug || !clientSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing token validation:', { token, companySlug, clientSlug })

    // First, let's see what's in the magic_link_tokens table
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('magic_link_tokens')
      .select('*')
      .eq('token_hash', token)
      .single()

    if (tokenError) {
      console.log('❌ Token lookup error:', tokenError)
      return NextResponse.json(
        { error: 'Token lookup failed', details: tokenError },
        { status: 500 }
      )
    }

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token not found in database' },
        { status: 404 }
      )
    }

    console.log('✅ Token found in database:', tokenData)

    // Now let's test the validate_magic_link_token function
    const { data: validationData, error: validationError } = await supabaseAdmin.rpc('validate_magic_link_token', {
      p_token: token,
      p_company_slug: companySlug,
      p_client_slug: clientSlug
    })

    if (validationError) {
      console.log('❌ Function validation error:', validationError)
      return NextResponse.json(
        { error: 'Function validation failed', details: validationError },
        { status: 500 }
      )
    }

    console.log('✅ Function validation result:', validationData)

    return NextResponse.json({
      success: true,
      tokenData,
      validationData,
      message: 'Token validation test completed'
    })

  } catch (error) {
    console.error('Test token error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
