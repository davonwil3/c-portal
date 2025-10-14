import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageIds, projectId, accountId } = body

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message IDs are required' },
        { status: 400 }
      )
    }

    if (!projectId || !accountId) {
      return NextResponse.json(
        { success: false, error: 'Project ID and Account ID are required' },
        { status: 400 }
      )
    }

    // Use direct Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Mark messages as read
    const { data, error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', messageIds)
      .eq('project_id', projectId)
      .eq('account_id', accountId)
      .select()

    if (error) {
      console.error('Error marking messages as read:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to mark messages as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
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
