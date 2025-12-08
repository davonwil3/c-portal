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
        { error: 'You must be logged in to accept an invitation' },
        { status: 401 }
      )
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Get invite by token
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invites')
      .select('id, workspace_id, email, role, expires_at, accepted_at')
      .eq('token', token)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Verify email matches
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('user_id', user.id)
      .single()

    if (!profile || profile.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseAdmin
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', invite.workspace_id)
      .eq('user_id', user.id)
      .single()

    if (existingMember) {
      // Mark invite as accepted even if already a member
      await supabaseAdmin
        .from('workspace_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      return NextResponse.json({
        success: true,
        message: 'You are already a member of this workspace',
      })
    }

    // Check if this user was created via invite (they might have an auto-created account)
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
    const viaInvite = authUser?.user?.user_metadata?.via_invite === true

    // If user was created via invite, link their profile to the workspace account
    // instead of keeping their auto-created account
    if (viaInvite) {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      // Link profile to workspace account for easier data access
      // This ensures they see the workspace's data, not their own empty account
      if (userProfile) {
        await supabaseAdmin
          .from('profiles')
          .update({ account_id: invite.workspace_id })
          .eq('user_id', user.id)
      }
    }

    // Create workspace member
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role: invite.role,
      })

    if (memberError) {
      console.error('Error creating workspace member:', memberError)
      return NextResponse.json(
        { error: 'Failed to join workspace' },
        { status: 500 }
      )
    }

    // Mark invite as accepted
    const { error: updateError } = await supabaseAdmin
      .from('workspace_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (updateError) {
      console.error('Error updating invite:', updateError)
      // Don't fail the request if this fails, member is already added
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined workspace',
      data: {
        workspaceId: invite.workspace_id,
        role: invite.role,
      },
    })
  } catch (error: any) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

