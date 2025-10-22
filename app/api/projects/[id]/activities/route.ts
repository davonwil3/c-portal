import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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

    const { id: projectId } = await params

    // Get project activities directly from project_activities table
    const { data: activities, error } = await supabase
      .from('project_activities')
      .select(`
        id,
        activity_type,
        action,
        metadata,
        created_at,
        user_id,
        profiles:user_id(first_name, last_name, email)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching project activities:', error)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    // Format the activities data
    const formattedActivities = activities?.map(activity => ({
      id: activity.id,
      activity_type: activity.activity_type,
      action: activity.action,
      metadata: activity.metadata,
      created_at: activity.created_at,
      source_table: 'project_activities',
      source_id: activity.id,
      user_name: activity.profiles 
        ? `${activity.profiles.first_name || ''} ${activity.profiles.last_name || ''}`.trim() || 'Unknown User'
        : 'System',
      user_email: activity.profiles?.email || null
    })) || []

    return NextResponse.json({ activities: formattedActivities })
  } catch (error) {
    console.error('Error in project activities API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
