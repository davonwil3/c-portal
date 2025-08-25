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
    const { email, companySlug } = await request.json()

    if (!email || !companySlug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get account_id from company name
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .ilike('company_name', `%${companySlug.replace(/-/g, '%')}%`)
      .single()

    if (accountError || !accountData) {
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      )
    }

    // Get client info from allowlist
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, company_slug, client_slug')
      .eq('account_id', accountData.id)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .maybeSingle()

    if (allowlistError) {
      console.error('Error fetching allowlist data:', allowlistError)
      return NextResponse.json(
        { success: false, message: 'Database error' },
        { status: 500 }
      )
    }

    if (!allowlistData) {
      return NextResponse.json(
        { success: false, message: 'Email not found in allowlist' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Client slug found',
      data: {
        email: allowlistData.email,
        name: allowlistData.name,
        role: allowlistData.role,
        company_slug: allowlistData.company_slug,
        client_slug: allowlistData.client_slug
      }
    })

  } catch (error) {
    console.error('Error in get-client-slug API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
