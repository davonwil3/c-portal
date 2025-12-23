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

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('user_id', user.id)
      .single()

    const approverName = profile?.full_name || 
      (profile?.first_name && profile?.last_name 
        ? `${profile.first_name} ${profile.last_name}` 
        : user.email?.split('@')[0] || 'Unknown User')

    // Update file approval status (following schema - no approval_date or approval_notes columns)
    const { data: file, error: fileError } = await supabase
      .from('files')
      .update({
        approval_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()
      .single()

    if (fileError) {
      console.error('Error updating file:', fileError)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    // Create approval record in file_approvals table
    const { error: approvalError } = await supabase
      .from('file_approvals')
      .insert({
        file_id: fileId,
        approver_id: user.id,
        approver_name: approverName,
        status: approval_status,
        decision: comment || null,
        decision_date: new Date().toISOString(),
      })

    if (approvalError) {
      console.error('Error creating approval record:', approvalError)
      // Don't fail the request if approval record fails, but log it
    }

    // Add comment if provided (using correct schema columns)
    if (comment) {
      const { error: commentError } = await supabase
        .from('file_comments')
        .insert({
          file_id: fileId,
          content: comment,
          author_id: user.id,
          author_name: approverName,
          is_internal: false, // Client-visible comment
        })

      if (commentError) {
        console.error('Error adding comment:', commentError)
        // Don't fail the request if comment fails, but log it
      }
    }

    return NextResponse.json({ success: true, file })
  } catch (error) {
    console.error('Error in file review:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

