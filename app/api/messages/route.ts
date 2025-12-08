import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const accountId = searchParams.get('accountId')

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

    // Get messages for the project, ordered by creation date
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        message_type,
        sender_name,
        sender_type,
        client_id,
        attachment_url,
        attachment_name,
        attachment_type,
        attachment_size,
        is_read,
        read_at,
        read_by,
        parent_message_id,
        thread_id,
        metadata,
        created_at,
        updated_at
      `)
      .eq('project_id', projectId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: messages || []
    })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/messages - Received body:', body)
    
    const { 
      projectId, 
      accountId, 
      content, 
      senderName, 
      senderType, 
      clientId,
      attachmentUrl,
      attachmentName,
      attachmentType,
      attachmentSize,
      parentMessageId,
      threadId
    } = body

    console.log('Extracted fields:', {
      projectId,
      accountId,
      content,
      senderName,
      senderType,
      clientId
    })

    if (!projectId || !accountId || !content || !senderName || !senderType) {
      console.log('Missing required fields:', {
        projectId: !!projectId,
        accountId: !!accountId,
        content: !!content,
        senderName: !!senderName,
        senderType: !!senderType
      })
      return NextResponse.json(
        { success: false, error: 'Required fields are missing' },
        { status: 400 }
      )
    }

    // Use direct Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Create message data
    const messageData = {
      project_id: projectId,
      account_id: accountId,
      content: content.trim(),
      message_type: 'text',
      sender_name: senderName,
      sender_type: senderType,
      client_id: clientId || null,
      attachment_url: attachmentUrl || null,
      attachment_name: attachmentName || null,
      attachment_type: attachmentType || null,
      attachment_size: attachmentSize || null,
      parent_message_id: parentMessageId || null,
      thread_id: threadId || null,
      is_read: false
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single()

    if (error) {
      console.error('Error creating message:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create message' },
        { status: 500 }
      )
    }

    // Log message as project activity
    try {
      // Get sender_id if senderType is account_user
      let senderUserId = null
      if (senderType === 'account_user') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('account_id', accountId)
          .ilike('first_name || \' \' || last_name', `%${senderName}%`)
          .limit(1)
          .single()
        
        if (profile) {
          senderUserId = profile.user_id
        }
      }

      // Create activity entry
      const actionText = parentMessageId 
        ? `${senderName} replied to a message`
        : `${senderName} sent a message`
      
      const { error: activityError } = await supabase
        .from('project_activities')
        .insert({
          project_id: projectId,
          account_id: accountId,
          user_id: senderUserId,
          activity_type: 'message',
          action: actionText,
          metadata: {
            message_id: message.id,
            sender_name: senderName,
            sender_type: senderType,
            client_id: clientId || null,
            has_attachment: !!(attachmentUrl || attachmentName),
            attachment_name: attachmentName || null,
            content_preview: content.trim().substring(0, 100), // First 100 chars
          }
        })

      if (activityError) {
        console.error('Error logging message activity:', activityError)
        // Don't fail the request if activity logging fails
      }

      // Update project last_activity_at
      await supabase
        .from('projects')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', projectId)
    } catch (activityErr) {
      console.error('Error in activity logging:', activityErr)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({
      success: true,
      data: message
    })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create message' },
      { status: 500 }
    )
  }
}
