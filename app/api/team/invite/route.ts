import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { canInviteToWorkspace, generateInviteToken } from '@/lib/workspace'
import { sendWorkspaceInviteEmail } from '@/lib/email-service'

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

    const { workspaceId, email, role } = await request.json()

    if (!workspaceId || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: workspaceId, email, and role are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "member"' },
        { status: 400 }
      )
    }

    // Get user's profile and workspace membership
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if user is owner or admin of the workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can invite members' },
        { status: 403 }
      )
    }

    // Get workspace details
    const { data: workspace } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name, plan_tier')
      .eq('id', workspaceId)
      .single()

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }

    // Check if user is already a member by email
    // First, find the user by email in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingProfile) {
      // Check if this user is already a member of the workspace
      const { data: existingMember } = await supabaseAdmin
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', existingProfile.user_id)
        .single()

      if (existingMember) {
        return NextResponse.json(
          { error: 'This user is already a member of this workspace' },
          { status: 400 }
        )
      }
    }

    // Check if there's already a pending invite for this email
    const { data: existingInvite } = await supabaseAdmin
      .from('workspace_invites')
      .select('id, expires_at, accepted_at')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email address' },
        { status: 400 }
      )
    }

    // Check plan limits
    const planCheck = await canInviteToWorkspace(
      workspaceId,
      workspace.plan_tier as 'free' | 'pro' | 'premium'
    )

    if (!planCheck.canInvite) {
      return NextResponse.json(
        { error: planCheck.reason || 'Cannot invite to this workspace' },
        { status: 403 }
      )
    }

    // Generate invite token
    const token = generateInviteToken()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    // Create invite
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invites')
      .insert({
        workspace_id: workspaceId,
        email: email.toLowerCase(),
        role,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Error creating invite:', inviteError)
      return NextResponse.json(
        { error: 'Failed to create invitation' },
        { status: 500 }
      )
    }

    // Get inviter's name
    const { data: inviterProfile } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const inviterName = inviterProfile
      ? `${inviterProfile.first_name || ''} ${inviterProfile.last_name || ''}`.trim() || user.email || 'Someone'
      : user.email || 'Someone'

    // Send invite email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/invite/accept?token=${token}`

    try {
      await sendWorkspaceInviteEmail({
        to: email.toLowerCase(),
        inviterName,
        workspaceName: workspace.company_name || 'Workspace',
        inviteUrl,
        role,
      })
    } catch (emailError) {
      console.error('Error sending invite email:', emailError)
      // Don't fail the request if email fails, but log it
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        inviteId: invite.id,
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at,
      },
    })
  } catch (error: any) {
    console.error('Error in invite endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

