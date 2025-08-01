import { createClient as createSupabaseClient } from '@/lib/supabase/client'

export interface Project {
  id: string
  account_id: string
  client_id: string
  name: string
  description: string | null
  status: 'draft' | 'active' | 'on-hold' | 'completed' | 'archived'
  progress: number
  start_date: string | null
  due_date: string | null
  completed_date: string | null
  portal_id: string | null
  total_messages: number
  total_files: number
  total_invoices: number
  total_milestones: number
  completed_milestones: number
  created_at: string
  updated_at: string
  last_activity_at: string | null
}

export interface ProjectTag {
  id: string
  project_id: string
  tag_name: string
  color: string
  created_at: string
}

export interface Tag {
  name: string
  color: string
}

// Standard project tags with colors
export const standardProjectTags: Tag[] = [
  { name: "Design", color: "#F59E0B" },
  { name: "Development", color: "#3B82F6" },
  { name: "Marketing", color: "#EC4899" },
  { name: "Branding", color: "#8B5CF6" },
  { name: "Consulting", color: "#10B981" },
  { name: "Maintenance", color: "#6B7280" },
  { name: "Urgent", color: "#EF4444" },
  { name: "High Priority", color: "#F97316" },
  { name: "Long-term", color: "#059669" },
  { name: "Quick Win", color: "#06B6D4" },
]

// Get all projects for the current user's account
export async function getProjects(): Promise<Project[]> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Then get all projects for that account
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    throw error
  }

  return data || []
}

// Get projects filtered by client ID
export async function getProjectsByClient(clientId: string): Promise<Project[]> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Then get projects for that account and client
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('account_id', profile.account_id)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects by client:', error)
    throw error
  }

  return data || []
}

// Get project tags
export async function getProjectTags(projectId: string): Promise<ProjectTag[]> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_tags')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching project tags:', error)
    throw error
  }

  return data || []
}

// Get all unique tags for an account
export async function getAccountProjectTags(): Promise<string[]> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // First get all project IDs for this account
  const { data: projectIds, error: projectError } = await supabase
    .from('projects')
    .select('id')
    .eq('account_id', profile.account_id)

  if (projectError) {
    console.error('Error fetching project IDs:', projectError)
    throw projectError
  }

  if (!projectIds || projectIds.length === 0) {
    return []
  }

  // Then get all tags for these projects
  const { data, error } = await supabase
    .from('project_tags')
    .select('tag_name')
    .in('project_id', projectIds.map(project => project.id))
    .order('tag_name', { ascending: true })

  if (error) {
    console.error('Error fetching account project tags:', error)
    throw error
  }

  // Extract unique tag names
  const uniqueTags = [...new Set(data?.map(tag => tag.tag_name) || [])]
  return uniqueTags
}

// Get a single project by ID
export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    console.error('Error fetching project:', error)
    return null
  }

  return data
}

// Create a new project
export async function createProject(projectData: {
  client_id: string
  name: string
  description?: string
  status?: 'draft' | 'active' | 'on-hold' | 'completed' | 'archived'
  start_date?: string
  due_date?: string
  portal_id?: string
  tags?: Array<{ name: string; color?: string }>
}): Promise<Project | null> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Create the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      account_id: profile.account_id,
      client_id: projectData.client_id,
      name: projectData.name,
      description: projectData.description || null,
      status: projectData.status || 'draft',
      start_date: projectData.start_date || null,
      due_date: projectData.due_date || null,
      portal_id: projectData.portal_id || null,
    })
    .select()
    .single()

  if (projectError) {
    console.error('Error creating project:', projectError)
    throw projectError
  }

  // Add tags if provided
  if (projectData.tags && projectData.tags.length > 0) {
    const tagInserts = projectData.tags.map(tag => {
      const standardTag = standardProjectTags.find(stdTag => stdTag.name.toLowerCase() === tag.name.trim().toLowerCase())
      const color = tag.color || (standardTag ? standardTag.color : '#6B7280')
      
      return {
        project_id: project.id,
        tag_name: tag.name.trim(),
        color: color
      }
    })

    const { error: tagError } = await supabase
      .from('project_tags')
      .insert(tagInserts)

    if (tagError) {
      console.error('Error creating project tags:', tagError)
      // Don't throw here, project was created successfully
    }
  }

  return project
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<{
  client_id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'on-hold' | 'completed' | 'archived'
  start_date: string
  due_date: string
  portal_id: string
  tags?: Array<{ name: string; color?: string }>
}>): Promise<Project | null> {
  const supabase = createSupabaseClient()
  
  // Update project data
  const { data, error } = await supabase
    .from('projects')
    .update({
      client_id: updates.client_id,
      name: updates.name,
      description: updates.description,
      status: updates.status,
      start_date: updates.start_date,
      due_date: updates.due_date,
      portal_id: updates.portal_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw error
  }

  // Update tags if provided
  if (updates.tags !== undefined) {
    // Delete existing tags
    await supabase
      .from('project_tags')
      .delete()
      .eq('project_id', projectId)

    // Add new tags
    if (updates.tags.length > 0) {
      const tagInserts = updates.tags.map(tag => {
        const standardTag = standardProjectTags.find(stdTag => stdTag.name.toLowerCase() === tag.name.trim().toLowerCase())
        const color = tag.color || (standardTag ? standardTag.color : '#6B7280')
        
        return {
          project_id: projectId,
          tag_name: tag.name.trim(),
          color: color
        }
      })

      const { error: tagError } = await supabase
        .from('project_tags')
        .insert(tagInserts)

      if (tagError) {
        console.error('Error updating project tags:', tagError)
        // Don't throw here, project was updated successfully
      }
    }
  }

  return data
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  console.log('Attempting to delete project:', projectId)
  
  // Delete related records in order (child tables first)
  
  // 1. Delete project_tags
  const { error: tagError } = await supabase
    .from('project_tags')
    .delete()
    .eq('project_id', projectId)

  if (tagError) {
    console.error('Error deleting project tags:', tagError)
    throw new Error(`Failed to delete project tags: ${tagError.message}`)
  }
  console.log('Project tags deleted successfully')

  // 2. Delete project_activities
  const { error: activityError } = await supabase
    .from('project_activities')
    .delete()
    .eq('project_id', projectId)

  if (activityError) {
    console.error('Error deleting project activities:', activityError)
    throw new Error(`Failed to delete project activities: ${activityError.message}`)
  }
  console.log('Project activities deleted successfully')

  // 3. Delete project_members
  const { error: memberError } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)

  if (memberError) {
    console.error('Error deleting project members:', memberError)
    throw new Error(`Failed to delete project members: ${memberError.message}`)
  }
  console.log('Project members deleted successfully')

  // 4. Delete project_tasks
  const { error: taskError } = await supabase
    .from('project_tasks')
    .delete()
    .eq('project_id', projectId)

  if (taskError) {
    console.error('Error deleting project tasks:', taskError)
    throw new Error(`Failed to delete project tasks: ${taskError.message}`)
  }
  console.log('Project tasks deleted successfully')

  // 5. Delete project_milestones
  const { error: milestoneError } = await supabase
    .from('project_milestones')
    .delete()
    .eq('project_id', projectId)

  if (milestoneError) {
    console.error('Error deleting project milestones:', milestoneError)
    throw new Error(`Failed to delete project milestones: ${milestoneError.message}`)
  }
  console.log('Project milestones deleted successfully')

  // 6. Finally delete the project
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw new Error(`Failed to delete project: ${error.message}`)
  }

  console.log('Project deleted successfully')
}

// Archive a project (soft delete)
export async function archiveProject(projectId: string): Promise<Project | null> {
  return updateProject(projectId, { status: 'archived' })
}

// Restore an archived project
export async function restoreProject(projectId: string): Promise<Project | null> {
  return updateProject(projectId, { status: 'active' })
}

// Get tag color (helper function)
export function getProjectTagColor(tagName: string): string {
  const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
  return standardTag?.color || '#6B7280' // Default gray color
}

// Get clients for project creation
export async function getClientsForProjects(): Promise<Array<{ id: string; first_name: string; last_name: string; company: string | null }>> {
  const supabase = createSupabaseClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Get active clients for this account
  const { data, error } = await supabase
    .from('clients')
    .select('id, first_name, last_name, company')
    .eq('account_id', profile.account_id)
    .eq('status', 'active')
    .order('first_name', { ascending: true })

  if (error) {
    console.error('Error fetching clients for projects:', error)
    throw error
  }

  return data || []
}

// Get project with client information
export async function getProjectWithClient(projectId: string): Promise<{
  project: Project | null
  client: { id: string; first_name: string; last_name: string; company: string | null } | null
  tags: ProjectTag[]
}> {
  const supabase = createSupabaseClient()
  
  // Get the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (projectError) {
    console.error('Error fetching project:', projectError)
    return { project: null, client: null, tags: [] }
  }

  // Get the client
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('id, first_name, last_name, company')
    .eq('id', project.client_id)
    .single()

  if (clientError) {
    console.error('Error fetching client:', clientError)
    return { project, client: null, tags: [] }
  }

  // Get project tags
  const { data: tags, error: tagsError } = await supabase
    .from('project_tags')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (tagsError) {
    console.error('Error fetching project tags:', tagsError)
    return { project, client, tags: [] }
  }

  return { project, client, tags: tags || [] }
}

// Get project milestones
export async function getProjectMilestones(projectId: string): Promise<any[]> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching project milestones:', error)
    throw error
  }

  return data || []
}

// Get project tasks
export async function getProjectTasks(projectId: string): Promise<any[]> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_tasks')
    .select(`
      *,
      assignee:profiles!project_tasks_assignee_id_fkey(
        user_id,
        first_name,
        last_name
      )
    `)
    .eq('project_id', projectId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching project tasks:', error)
    throw error
  }

  return data || []
}

// Create a milestone
export async function createMilestone(milestoneData: {
  project_id: string
  title: string
  description?: string
  due_date?: string
  client_note?: string
  internal_note?: string
}): Promise<any> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_milestones')
    .insert({
      project_id: milestoneData.project_id,
      title: milestoneData.title,
      description: milestoneData.description || null,
      due_date: milestoneData.due_date || null,
      client_note: milestoneData.client_note || null,
      internal_note: milestoneData.internal_note || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating milestone:', error)
    throw error
  }

  return data
}

// Update a milestone
export async function updateMilestone(milestoneId: string, updates: {
  title?: string
  description?: string
  status?: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  due_date?: string
  client_note?: string
  internal_note?: string
}): Promise<any> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_milestones')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('Error updating milestone:', error)
    throw error
  }

  return data
}

// Create a task
export async function createTask(taskData: {
  project_id: string
  milestone_id?: string
  title: string
  description?: string
  assignee_id?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}): Promise<any> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_tasks')
    .insert({
      project_id: taskData.project_id,
      milestone_id: taskData.milestone_id || null,
      title: taskData.title,
      description: taskData.description || null,
      assignee_id: taskData.assignee_id || null,
      due_date: taskData.due_date || null,
      priority: taskData.priority || 'medium',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw error
  }

  return data
}

// Update a task
export async function updateTask(taskId: string, updates: {
  title?: string
  description?: string
  status?: 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled'
  assignee_id?: string
  due_date?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}): Promise<any> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('project_tasks')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single()

  if (error) {
    console.error('Error updating task:', error)
    throw error
  }

  return data
}

// Delete a milestone and all its associated tasks
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  // First delete all tasks associated with this milestone
  const { error: tasksError } = await supabase
    .from('project_tasks')
    .delete()
    .eq('milestone_id', milestoneId)

  if (tasksError) {
    console.error('Error deleting milestone tasks:', tasksError)
    throw tasksError
  }

  // Then delete the milestone itself
  const { error: milestoneError } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', milestoneId)

  if (milestoneError) {
    console.error('Error deleting milestone:', milestoneError)
    throw milestoneError
  }
}

// Delete a task
export async function deleteTask(taskId: string): Promise<void> {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase
    .from('project_tasks')
    .delete()
    .eq('id', taskId)

  if (error) {
    console.error('Error deleting task:', error)
    throw error
  }
} 