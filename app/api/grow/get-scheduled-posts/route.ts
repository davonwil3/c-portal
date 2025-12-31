import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
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

    // Fetch scheduled posts for this account
    const { data: posts, error: postsError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('account_id', profile.account_id)
      .in('status', ['draft', 'scheduled'])
      .order('scheduled_at', { ascending: true })

    if (postsError) {
      console.error('Error fetching scheduled posts:', postsError)
      return NextResponse.json(
        { success: false, error: postsError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
    })
  } catch (error) {
    console.error('Error in get-scheduled-posts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch posts',
      },
      { status: 500 }
    )
  }
}

