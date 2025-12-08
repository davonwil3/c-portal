import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: fileId } = await params
    const { approval_status, comment } = await request.json()

    if (!approval_status || !['approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ error: 'Invalid approval status' }, { status: 400 })
    }

    // Update file approval status
    const { data: file, error } = await supabase
      .from('files')
      .update({
        approval_status,
        approval_date: new Date().toISOString(),
        approval_notes: comment || null,
        status: approval_status === 'approved' ? 'active' : 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()
      .single()

    if (error) {
      console.error('Error updating file:', error)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    // Add comment if provided
    if (comment) {
      await supabase
        .from('file_comments')
        .insert({
          file_id: fileId,
          comment_text: comment,
          commenter_id: user.id,
          commenter_type: 'account_user',
        })
    }

    return NextResponse.json({ success: true, file })
  } catch (error) {
    console.error('Error in file review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

