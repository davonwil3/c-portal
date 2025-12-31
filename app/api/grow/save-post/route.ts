import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SavePostRequest {
  content: string
  platform: 'twitter' | 'linkedin' | 'both'
  images?: string[]
  scheduled_at?: string
  generation_method: 'ai' | 'manual'
  status: 'draft' | 'scheduled' | 'posted'
}

export async function POST(request: NextRequest) {
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

    // Get user's account
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const body: SavePostRequest = await request.json()
    const { content, platform, images, scheduled_at, generation_method, status } = body

    console.log('📝 Saving post:', {
      account_id: profile.account_id,
      user_id: user.id,
      platform,
      generation_method,
      status,
      has_images: images && images.length > 0,
      scheduled_at,
    })

    // Insert post into database
    const { data: post, error: insertError } = await supabase
      .from('social_posts')
      .insert({
        account_id: profile.account_id,
        user_id: user.id,
        content,
        platform,
        images: images || [],
        scheduled_at: scheduled_at || null,
        generation_method,
        status,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting post:', insertError)
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ Post saved successfully:', post.id)

    return NextResponse.json({
      success: true,
      post,
    })
  } catch (error) {
    console.error('Error saving post:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save post',
      },
      { status: 500 }
    )
  }
}

