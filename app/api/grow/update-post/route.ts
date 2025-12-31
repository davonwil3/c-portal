import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface UpdatePostRequest {
  id: string
  content?: string
  platform?: 'twitter' | 'linkedin' | 'both'
  images?: string[]
  scheduled_at?: string
  status?: 'draft' | 'scheduled' | 'posted'
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: UpdatePostRequest = await request.json()
    const { id, content, platform, images, scheduled_at, status } = body

    console.log('📝 Updating post:', { id, content: content?.substring(0, 50), platform, scheduled_at, status })

    // Build update object with only provided fields
    const updateData: any = {}
    if (content !== undefined) updateData.content = content
    if (platform !== undefined) updateData.platform = platform
    if (images !== undefined) updateData.images = images
    if (scheduled_at !== undefined) updateData.scheduled_at = scheduled_at ? new Date(scheduled_at).toISOString() : null
    if (status !== undefined) updateData.status = status

    // Update post in database
    const { data: post, error: updateError } = await supabase
      .from('social_posts')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the post
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    console.log('✅ Post updated successfully:', post.id)

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      },
      { status: 500 }
    )
  }
}

