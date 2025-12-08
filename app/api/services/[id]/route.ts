import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

// PUT - Update a service
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

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

    // Verify service belongs to this account
    const { data: existingService } = await supabaseAdmin
      .from('services')
      .select('account_id')
      .eq('id', id)
      .single()

    if (!existingService || existingService.account_id !== profile.account_id) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, description, rate, rate_type } = body

    // Update service
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .update({
        name,
        description: description || '',
        rate,
        rate_type,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating service:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: service
    })
  } catch (error) {
    console.error('Error in PUT /api/services/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a service
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params

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

    // Verify service belongs to this account
    const { data: existingService } = await supabaseAdmin
      .from('services')
      .select('account_id')
      .eq('id', id)
      .single()

    if (!existingService || existingService.account_id !== profile.account_id) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      )
    }

    // Delete service
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete service' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })
  } catch (error) {
    console.error('Error in DELETE /api/services/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

