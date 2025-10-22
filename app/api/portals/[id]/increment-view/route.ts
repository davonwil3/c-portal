import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { id: portalId } = await params

    if (!portalId) {
      return NextResponse.json({ error: 'Portal ID is required' }, { status: 400 })
    }

    // Increment the view count for this portal
    const { data, error } = await supabase
      .from('portals')
      .update({ 
        view_count: supabase.sql`view_count + 1`,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', portalId)
      .select('view_count')
      .single()

    if (error) {
      console.error('Error incrementing view count:', error)
      return NextResponse.json({ error: 'Failed to increment view count' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      viewCount: data.view_count 
    })

  } catch (error) {
    console.error('Error in increment view API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
