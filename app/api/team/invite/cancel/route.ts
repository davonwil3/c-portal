import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { inviteId } = await request.json()

    if (!inviteId) {
      return NextResponse.json(
        { error: 'inviteId is required' },
        { status: 400 }
      )
    }

    // Get invite details
    const { data: invite } = await supabaseAdmin
      .from('workspace_invites')
      .select('workspace_id')
      .eq('id', inviteId)
      .single()

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      )
    }

    // Check if user is owner or admin of the workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can cancel invites' },
        { status: 403 }
      )
    }

    // Delete the invite
    const { error: deleteError } = await supabaseAdmin
      .from('workspace_invites')
      .delete()
      .eq('id', inviteId)

    if (deleteError) {
      console.error('Error canceling invite:', deleteError)
      return NextResponse.json(
        { error: 'Failed to cancel invitation' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation canceled successfully',
    })
  } catch (error: any) {
    console.error('Error in cancel invite endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

