import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: portalId, memberId } = await params
    const { role } = await request.json()
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user's profile to get account_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify portal belongs to user's account
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('id, account_id')
      .eq('id', portalId)
      .eq('account_id', profile.account_id)
      .single()

    if (portalError || !portal) {
      return NextResponse.json(
        { success: false, message: 'Portal not found' },
        { status: 404 }
      )
    }

    // Update member role
    const { error: updateError } = await supabase
      .from('client_allowlist')
      .update({ role })
      .eq('id', memberId)
      .eq('account_id', profile.account_id)

    if (updateError) {
      console.error('Error updating member role:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to update member role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member role updated successfully'
    })

  } catch (error) {
    console.error('Error in update member role API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Delete member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: portalId, memberId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Get user's profile to get account_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Verify portal belongs to user's account
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('id, account_id')
      .eq('id', portalId)
      .eq('account_id', profile.account_id)
      .single()

    if (portalError || !portal) {
      return NextResponse.json(
        { success: false, message: 'Portal not found' },
        { status: 404 }
      )
    }

    // Get member to check if it's the main client
    const { data: member, error: memberError } = await supabase
      .from('client_allowlist')
      .select('id, email, client_id')
      .eq('id', memberId)
      .eq('account_id', profile.account_id)
      .single()

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, message: 'Member not found' },
        { status: 404 }
      )
    }

    // Get main client email to prevent deletion
    const { data: mainClient } = await supabase
      .from('clients')
      .select('email')
      .eq('id', member.client_id)
      .single()

    // Don't allow deletion of main client
    if (mainClient && member.email === mainClient.email) {
      return NextResponse.json(
        { success: false, message: 'Cannot remove the main client from the portal' },
        { status: 400 }
      )
    }

    // Delete member (or deactivate)
    const { error: deleteError } = await supabase
      .from('client_allowlist')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('account_id', profile.account_id)

    if (deleteError) {
      console.error('Error deleting member:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Failed to remove member' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Member removed successfully'
    })

  } catch (error) {
    console.error('Error in delete member API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
