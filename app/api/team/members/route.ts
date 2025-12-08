import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      )
    }

    // Verify user is a member of this workspace
    const { data: membership } = await supabaseAdmin
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this workspace' },
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

    // Get all members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('workspace_members')
      .select(`
        id,
        role,
        created_at,
        user_id
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json(
        { error: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Get pending invites
    const { data: invites, error: invitesError } = await supabaseAdmin
      .from('workspace_invites')
      .select('id, email, role, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (invitesError) {
      console.error('Error fetching invites:', invitesError)
      return NextResponse.json(
        { error: 'Failed to fetch invites' },
        { status: 500 }
      )
    }

    // Get profiles for all members
    const userIds = (members || []).map((m: any) => m.user_id)
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('user_id, email, first_name, last_name, profile_photo_url')
      .in('user_id', userIds)

    const profilesMap = new Map((profiles || []).map((p: any) => [p.user_id, p]))

    // Format members
    const formattedMembers = (members || []).map((member: any) => {
      const profile = profilesMap.get(member.user_id)
      return {
        id: member.id,
        userId: member.user_id,
        email: profile?.email || '',
        name: profile?.first_name || profile?.last_name
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
          : profile?.email || 'Unknown',
        role: member.role,
        profilePhotoUrl: profile?.profile_photo_url || null,
        createdAt: member.created_at,
      }
    })

    // Format invites
    const formattedInvites = (invites || []).map((invite: any) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.company_name,
          planTier: workspace.plan_tier,
        },
        members: formattedMembers,
        pendingInvites: formattedInvites,
      },
    })
  } catch (error: any) {
    console.error('Error in members endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

