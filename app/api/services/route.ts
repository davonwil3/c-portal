import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all services for the current user's account
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    // Fetch services for this account
    const { data: services, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .eq('account_id', profile.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching services:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch services' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: services || []
    })
  } catch (error) {
    console.error('Error in GET /api/services:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new service
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's account_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, rate, rate_type } = body

    if (!name || rate === undefined || !rate_type) {
      return NextResponse.json(
        { success: false, error: 'Name, rate, and rate_type are required' },
        { status: 400 }
      )
    }

    // Create service
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert({
        account_id: profile.account_id,
        name,
        description: description || '',
        rate,
        rate_type,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating service:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: service
    })
  } catch (error) {
    console.error('Error in POST /api/services:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

