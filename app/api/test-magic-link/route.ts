import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { success: false, message: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test database connection
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .limit(5)

    if (accountsError) {
      return NextResponse.json(
        { success: false, message: 'Database connection failed', error: accountsError.message },
        { status: 500 }
      )
    }

    // Test allowlist table
    const { data: allowlist, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('*')
      .limit(5)

    if (allowlistError) {
      return NextResponse.json(
        { success: false, message: 'Allowlist table access failed', error: allowlistError.message },
        { status: 500 }
      )
    }

    // Test if the function exists
    const { data: functionTest, error: functionError } = await supabaseAdmin.rpc('generate_magic_link_token', {
      p_email: 'test@example.com',
      p_company_slug: 'test-company',
      p_client_slug: 'test-client'
    })

    return NextResponse.json({
      success: true,
      message: 'All tests passed',
      data: {
        accounts: accounts,
        allowlist: allowlist,
        functionTest: functionTest,
        functionError: functionError?.message || null
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { success: false, message: 'Test failed', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
