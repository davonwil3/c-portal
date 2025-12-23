import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface LeadForm {
  id: string
  account_id: string
  title: string
  description: string | null
  instructions: string | null
  form_structure: any
  status: 'draft' | 'published' | 'archived' | 'deleted'
  is_template: boolean
  template_id: string | null
  form_type: 'Lead' | 'Project'
  project_id: string | null
  access_level: 'private' | 'team' | 'public'
  password_protected: boolean
  password_hash: string | null
  max_submissions: number | null
  submission_deadline: string | null
  notify_on_submission: boolean
  notify_emails: string[] | null
  total_submissions: number
  total_views: number
  completion_rate: number
  embed_link: string | null
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
  published_at: string | null
  last_submission_at: string | null
}

export interface LeadFormSubmission {
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
  tag: string
  tag_color: string
  started_at: string | null
  completed_at: string | null
  time_spent: number | null
  created_at: string
  updated_at: string
}

// Get all lead forms for the current user's account
export async function getLeadForms(): Promise<LeadForm[]> {
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

  // Get lead forms
  const { data, error } = await supabase
    .from('lead_forms')
    .select('*')
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lead forms:', error)
    throw error
  }

  return data || []
}

// Get lead forms filtered by type
export async function getLeadFormsByType(formType: 'Lead' | 'Project' | 'all'): Promise<(LeadForm & { projects?: { name: string } | null })[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  let query = supabase
    .from('lead_forms')
    .select(`
      *,
      projects:projects(name)
    `)
    .eq('account_id', profile.account_id)

  if (formType !== 'all') {
    query = query.eq('form_type', formType)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching lead forms:', error)
    throw error
  }

  return data || []
}

// Get form submissions for a specific form
export async function getLeadFormSubmissions(formId: string): Promise<LeadFormSubmission[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lead_form_submissions')
    .select('*')
    .eq('form_id', formId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching form submissions:', error)
    throw error
  }

  return data || []
}

// Create a new lead form
export async function createLeadForm(formData: {
  title: string
  description?: string
  instructions?: string
  form_structure: any
  status?: 'draft' | 'published' | 'archived' | 'deleted'
  form_type?: 'Lead' | 'Project'
  project_id?: string
  access_level?: 'private' | 'team' | 'public'
  max_submissions?: number
  submission_deadline?: string
  notify_on_submission?: boolean
  notify_emails?: string[]
  embed_link?: string
}): Promise<LeadForm | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data, error } = await supabase
    .from('lead_forms')
    .insert({
      account_id: profile.account_id,
      title: formData.title,
      description: formData.description || null,
      instructions: formData.instructions || null,
      form_structure: formData.form_structure,
      status: formData.status || 'draft',
      form_type: formData.form_type || 'Lead',
      project_id: formData.project_id || null,
      access_level: formData.access_level || 'public',
      max_submissions: formData.max_submissions || null,
      submission_deadline: formData.submission_deadline || null,
      notify_on_submission: formData.notify_on_submission || true,
      notify_emails: formData.notify_emails || null,
      embed_link: formData.embed_link || null,
      created_by: user.id,
      created_by_name: `${profile.first_name} ${profile.last_name}`,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating lead form:', error)
    throw error
  }

  return data
}

// Update a lead form
export async function updateLeadForm(formId: string, updates: Partial<LeadForm>): Promise<LeadForm | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lead_forms')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', formId)
    .select()
    .single()

  if (error) {
    console.error('Error updating lead form:', error)
    throw error
  }

  return data
}

// Update form status
export async function updateLeadFormStatus(formId: string, status: 'draft' | 'published' | 'archived' | 'deleted'): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('lead_forms')
    .update({ 
      status,
      published_at: status === 'published' ? new Date().toISOString() : undefined,
      updated_at: new Date().toISOString()
    })
    .eq('id', formId)

  if (error) {
    console.error('Error updating form status:', error)
    throw error
  }
}

// Delete a lead form
export async function deleteLeadForm(formId: string): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('lead_forms')
    .delete()
    .eq('id', formId)

  if (error) {
    console.error('Error deleting lead form:', error)
    throw error
  }
}

// Submit a lead form
export async function submitLeadForm(
  formId: string,
  responses: Record<string, any>,
  respondentName?: string,
  respondentEmail?: string
): Promise<LeadFormSubmission | null> {
  const supabase = createClient()
  
  // Get form details first
  const { data: form, error: formError } = await supabase
    .from('lead_forms')
    .select('*')
    .eq('id', formId)
    .single()

  if (formError || !form) {
    throw new Error('Form not found')
  }

  // Calculate completion statistics
  const fields = form.form_structure?.fields || []
  const totalFields = fields.length
  const completedFields = Object.keys(responses).length
  const completionPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0

  // Create submission data
  const submissionData = {
    form_id: formId,
    status: 'completed' as const,
    respondent_name: respondentName || null,
    respondent_email: respondentEmail || null,
    responses: responses,
    total_fields: totalFields,
    completed_fields: completedFields,
    completion_percentage: completionPercentage,
    tag: 'New',
    tag_color: '#f59e0b',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    time_spent: 0
  }

  const { data, error } = await supabase
    .from('lead_form_submissions')
    .insert(submissionData)
    .select()
    .single()

  if (error) {
    console.error('Error submitting lead form:', error)
    throw error
  }

  return data
}

// Update submission tag
export async function updateSubmissionTag(
  submissionId: string,
  tag: string,
  tagColor: string
): Promise<void> {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('lead_form_submissions')
    .update({
      tag,
      tag_color: tagColor,
      updated_at: new Date().toISOString()
    })
    .eq('id', submissionId)

  if (error) {
    console.error('Error updating submission tag:', error)
    throw error
  }
}

// Get a single lead form by ID
export async function getLeadForm(formId: string): Promise<LeadForm | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('lead_forms')
    .select('*')
    .eq('id', formId)
    .single()

  if (error) {
    console.error('Error fetching lead form:', error)
    return null
  }

  return data
}
