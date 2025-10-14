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
