import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || '')

export async function GET(request: NextRequest) {
  try {
    // Check if service key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY not configured' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const companySlug = searchParams.get('company')
    
    if (!companySlug) {
      return NextResponse.json(
        { error: 'Please provide company slug (e.g., ?company=acme-co)' },
        { status: 400 }
      )
    }

    console.log('🔍 Testing allowlist for company:', companySlug)

    // Get account_id from company name
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .ilike('company_name', `%${companySlug.replace(/-/g, '%')}%`)
      .single()

    if (accountError || !accountData) {
      return NextResponse.json(
        { error: 'Company not found', companySlug },
        { status: 404 }
      )
    }

    console.log('✅ Found company:', accountData)

    // Get all allowlist entries for this account
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('*')
      .eq('account_id', accountData.id)

    if (allowlistError) {
      return NextResponse.json(
        { error: 'Failed to fetch allowlist', details: allowlistError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      company: {
        id: accountData.id,
        name: accountData.company_name,
        slug: companySlug
      },
      allowlist: allowlistData || [],
      totalEntries: allowlistData?.length || 0,
      message: `Found ${allowlistData?.length || 0} entries in allowlist for ${accountData.company_name}`
    })

  } catch (error) {
    console.error('Test allowlist error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
