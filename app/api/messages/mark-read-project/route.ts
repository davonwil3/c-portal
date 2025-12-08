import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createAdminClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectId } = body

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required' },
        { status: 400 }
      )
    }

    // Get user from server-side Supabase client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get account from profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile || !profile.account_id) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const accountId = profile.account_id

    // First, get all unread client messages for this project
    const { data: unreadMessages, error: fetchError } = await supabaseAdmin
      .from('messages')
      .select('id, content, is_read, sender_type, sender_name')
      .eq('project_id', projectId)
      .eq('account_id', accountId)
      .eq('sender_type', 'client')
      .or('is_read.is.null,is_read.eq.false')

    if (fetchError) {
      console.error('Error fetching unread messages:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch unread messages' },
        { status: 500 }
      )
    }

    console.log(`Found ${unreadMessages?.length || 0} unread messages to mark as read`)

    if (!unreadMessages || unreadMessages.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No unread messages to mark'
      })
    }

    const unreadMessageIds = unreadMessages.map(m => m.id)
    console.log('Marking messages as read:', unreadMessageIds)

    // Mark messages as read
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        read_by: user.id
      })
      .in('id', unreadMessageIds)
      .select()

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }

    console.log(`Successfully marked ${data?.length || 0} messages as read`)

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      data: data
    })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to mark messages as read' },
      { status: 500 }
    )
  }
}

