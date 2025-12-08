import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Get invite by token
    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('workspace_invites')
      .select(`
        id,
        workspace_id,
        email,
        role,
        expires_at,
        accepted_at,
        accounts:workspace_id (
          id,
          company_name
        )
      `)
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

    return NextResponse.json({
      success: true,
      data: {
        inviteId: invite.id,
        workspaceId: invite.workspace_id,
        workspaceName: (invite.accounts as any)?.company_name || 'Workspace',
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expires_at,
      },
    })
  } catch (error: any) {
    console.error('Error verifying invite:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

