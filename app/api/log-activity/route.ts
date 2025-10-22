import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, action, projectId, metadata } = await request.json()

    if (!type || !action || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    const userName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User' : 'Unknown User'

    // Simple duplicate check (within last 10 seconds for same action)
    const { data: recentActivities } = await supabase
      .from('project_activities')
      .select('id')
      .eq('project_id', projectId)
      .eq('action', action)
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 10000).toISOString())
      .limit(1)

    if (recentActivities && recentActivities.length > 0) {
      console.log('Duplicate activity prevented:', { action, projectId, userId: user.id })
      return NextResponse.json({ success: true, duplicate: true })
    }

    // Log the activity based on type
    let activityId
    switch (type) {
      case 'file':
        // Log as project activity for file-related actions
        const { data: fileActivity } = await supabase
          .from('project_activities')
          .insert({
            project_id: projectId,
            activity_type: 'file',
            action: action,
            metadata: {
              ...metadata,
              user_name: userName,
              activity_source: 'file'
            },
            user_id: user.id
          })
          .select('id')
          .single()
        activityId = fileActivity?.id
        break

      case 'invoice':
        // Log as project activity for invoice-related actions
        const { data: invoiceActivity } = await supabase
          .from('project_activities')
          .insert({
            project_id: projectId,
            activity_type: 'status_change',
            action: action,
            metadata: {
              ...metadata,
              user_name: userName,
              activity_source: 'invoice'
            },
            user_id: user.id
          })
          .select('id')
          .single()
        activityId = invoiceActivity?.id
        break

      case 'contract':
        // Log as project activity for contract-related actions
        const { data: contractActivity } = await supabase
          .from('project_activities')
          .insert({
            project_id: projectId,
            activity_type: 'status_change',
            action: action,
            metadata: {
              ...metadata,
              user_name: userName,
              activity_source: 'contract'
            },
            user_id: user.id
          })
          .select('id')
          .single()
        activityId = contractActivity?.id
        break

      case 'form':
        // Log as project activity for form-related actions
        const { data: formActivity } = await supabase
          .from('project_activities')
          .insert({
            project_id: projectId,
            activity_type: 'status_change',
            action: action,
            metadata: {
              ...metadata,
              user_name: userName,
              activity_source: 'form'
            },
            user_id: user.id
          })
          .select('id')
          .single()
        activityId = formActivity?.id
        break

      case 'project':
        // Log as project activity for project-related actions
        const { data: projectActivity } = await supabase
          .from('project_activities')
          .insert({
            project_id: projectId,
            activity_type: 'status_change',
            action: action,
            metadata: {
              ...metadata,
              user_name: userName
            },
            user_id: user.id
          })
          .select('id')
          .single()
        activityId = projectActivity?.id
        break

      default:
        return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 })
    }

    // Update project last_activity_at
    await supabase
      .from('projects')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', projectId)

    return NextResponse.json({ success: true, activityId })
  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
