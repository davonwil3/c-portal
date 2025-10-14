import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const portalId = params.id
    const supabase = createClient()

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

    // Get portal details
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('id, name, client_id, url')
      .eq('id', portalId)
      .eq('account_id', profile.account_id)
      .single()

    if (portalError || !portal) {
      return NextResponse.json(
        { success: false, message: 'Portal not found' },
        { status: 404 }
      )
    }

    // Get all members for this client (including main client)
    const { data: members, error: membersError } = await supabase
      .from('client_allowlist')
      .select(`
        id,
        email,
        name,
        role,
        is_active,
        created_at,
        client_slug,
        company_slug
      `)
      .eq('account_id', profile.account_id)
      .eq('client_id', portal.client_id)
      .order('created_at', { ascending: true })

    if (membersError) {
      console.error('Error fetching members:', membersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch members' },
        { status: 500 }
      )
    }

    // Get main client details
    const { data: mainClient, error: clientError } = await supabase
      .from('clients')
      .select('id, first_name, last_name, email, company')
      .eq('id', portal.client_id)
      .single()

    if (clientError) {
      console.error('Error fetching main client:', clientError)
    }

    // Format members data
    const formattedMembers = members?.map(member => ({
      id: member.id,
      email: member.email,
      name: member.name,
      role: member.role || 'client',
      is_active: member.is_active,
      created_at: member.created_at,
      is_main_client: member.email === mainClient?.email,
      portal_access: `${member.company_slug}/${member.client_slug}`
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        portal: {
          id: portal.id,
          name: portal.name,
          url: portal.url
        },
        main_client: mainClient ? {
          id: mainClient.id,
          name: `${mainClient.first_name} ${mainClient.last_name}`,
          email: mainClient.email,
          company: mainClient.company
        } : null,
        members: formattedMembers,
        total_count: formattedMembers.length
      }
    })

  } catch (error) {
    console.error('Error in get portal members API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
