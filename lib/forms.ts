import { createClient } from './supabase/client'

export interface Form {
  id: string
  account_id: string
  title: string
  description: string | null
  instructions: string | null
  form_structure: any
  status: 'draft' | 'published' | 'archived' | 'deleted'
  is_template: boolean
  template_id: string | null
  client_id: string | null
  project_id: string | null
  portal_id: string | null
  access_level: 'private' | 'team' | 'client' | 'public'
  password_protected: boolean
  password_hash: string | null
  max_submissions: number | null
  submission_deadline: string | null
  notify_on_submission: boolean
  notify_emails: string[] | null
  total_submissions: number
  total_views: number
  completion_rate: number
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  last_submission_at: string | null
  clients?: {
    first_name: string
    last_name: string
    company: string
  } | null
  projects?: {
    name: string
  } | null
}

export interface FormSubmission {
  id: string
  form_id: string
  submission_number: number
  status: 'draft' | 'completed' | 'abandoned'
  respondent_id: string | null
  respondent_name: string | null
  respondent_email: string | null
  respondent_ip: string | null
  user_agent: string | null
  responses: any
  total_fields: number | null
  completed_fields: number | null
  completion_percentage: number | null
  started_at: string | null
  completed_at: string | null
  time_spent: number | null
  created_at: string
  updated_at: string
}

// Get all forms for the current user's account
export async function getForms(): Promise<Form[]> {
  const supabase = createClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Get forms with client and project information
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching forms:', error)
    throw error
  }

  return data || []
}

// Get form statistics
export async function getFormStats(): Promise<{
  totalForms: number
  publishedForms: number
  totalSubmissions: number
}> {
  const supabase = createClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Get form statistics
  const { data, error } = await supabase
    .from('forms')
    .select('total_submissions, status')
    .eq('account_id', profile.account_id)

  if (error) {
    console.error('Error fetching form stats:', error)
    throw error
  }

  const totalForms = data?.length || 0
  const publishedForms = data?.filter(form => form.status === 'published').length || 0
  const totalSubmissions = data?.reduce((sum, form) => sum + (form.total_submissions || 0), 0) || 0

  return {
    totalForms,
    publishedForms,
    totalSubmissions
  }
}

// Create a new form
export async function createForm(formData: {
  title: string
  description?: string
  instructions?: string
  form_structure: any
  status?: 'draft' | 'published' | 'archived' | 'deleted'
  client_id?: string
  project_id?: string
  portal_id?: string
  access_level?: 'private' | 'team' | 'client' | 'public'
  max_submissions?: number
  submission_deadline?: string
  notify_on_submission?: boolean
  notify_emails?: string[]
}): Promise<Form | null> {
  const supabase = createClient()
  
  // First get the current user's account_id
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Create the form
  const { data, error } = await supabase
    .from('forms')
    .insert({
      account_id: profile.account_id,
      title: formData.title,
      description: formData.description || null,
      instructions: formData.instructions || null,
      form_structure: formData.form_structure,
      status: formData.status || 'draft',
      client_id: formData.client_id || null,
      project_id: formData.project_id || null,
      portal_id: formData.portal_id || null,
      access_level: formData.access_level || 'private',
      max_submissions: formData.max_submissions || null,
      submission_deadline: formData.submission_deadline || null,
      notify_on_submission: formData.notify_on_submission || true,
      notify_emails: formData.notify_emails || null,
      created_by: user.id,
      created_by_name: `${profile.first_name} ${profile.last_name}`,
    })
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .single()

  if (error) {
    console.error('Error creating form:', error)
    throw error
  }

  return data
}

// Update a form
export async function updateForm(formId: string, updates: Partial<{
  title: string
  description: string
  instructions: string
  form_structure: any
  status: 'draft' | 'published' | 'archived' | 'deleted'
  client_id: string
  project_id: string
  portal_id: string
  access_level: 'private' | 'team' | 'client' | 'public'
  max_submissions: number
  submission_deadline: string
  notify_on_submission: boolean
  notify_emails: string[]
}>): Promise<Form | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('forms')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', formId)
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .single()

  if (error) {
    console.error('Error updating form:', error)
    throw error
  }

  return data
}

// Delete a form
export async function deleteForm(formId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('forms')
    .delete()
    .eq('id', formId)

  if (error) {
    console.error('Error deleting form:', error)
    throw error
  }
}

// Archive a form
export async function archiveForm(formId: string): Promise<Form | null> {
  return updateForm(formId, { status: 'archived' })
}

// Restore an archived form
export async function restoreForm(formId: string): Promise<Form | null> {
  return updateForm(formId, { status: 'draft' })
}

// Get form submissions
export async function getFormSubmissions(formId: string): Promise<FormSubmission[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching form submissions:', error)
    throw error
  }

  return data || []
}

// Get a single form by ID
export async function getForm(formId: string): Promise<Form | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .eq('id', formId)
    .single()

  if (error) {
    console.error('Error fetching form:', error)
    return null
  }

  return data
} 