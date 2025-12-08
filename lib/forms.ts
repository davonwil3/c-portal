import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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

// Get forms for a specific project
export async function getProjectForms(projectId: string): Promise<Form[]> {
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

  // Get forms for the specific project with client and project information
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .eq('account_id', profile.account_id)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching project forms:', error)
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

// Update form draft (for editing existing forms)
export async function updateFormDraft(
  formId: string,
  formTitle: string,
  fields: FormField[],
  clientId?: string | null,
  projectId?: string | null,
  notifyOnSubmission?: boolean,
  submissionDeadline?: string | null,
  instructions?: string,
  silent: boolean = false,
  brandColor?: string,
  logoUrl?: string | null,
  companyName?: string,
  companyAddress?: string,
  companyPhone?: string,
  companyEmail?: string,
  formDate?: string,
  footerLine1?: string,
  footerLine2?: string
) {
  try {
    // Validate that we have a proper title
    if (!formTitle.trim()) {
      console.error("Cannot update draft with empty title")
      return { success: false, error: "Title cannot be empty" }
    }

    const supabase = createClient()
    
    // Create form structure from fields
    const formStructure = {
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options
      })),
      settings: {
        title: formTitle.trim(),
      },
      brand_color: brandColor,
      logo_url: logoUrl,
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_email: companyEmail,
      form_date: formDate,
      footer_line1: footerLine1,
      footer_line2: footerLine2
    }

    // Build update object - only include client_id and project_id if they are explicitly provided
    const updateData: any = {
      title: formTitle.trim(),
      instructions: instructions || "",
      form_structure: formStructure,
      updated_at: new Date().toISOString()
    }

    // Only update client_id if explicitly provided (not null)
    if (clientId !== null && clientId !== undefined) {
      updateData.client_id = clientId
    }

    // Only update project_id if explicitly provided (not null)
    if (projectId !== null && projectId !== undefined) {
      updateData.project_id = projectId
    }

    // Only update notify_on_submission if explicitly provided
    if (notifyOnSubmission !== undefined) {
      updateData.notify_on_submission = notifyOnSubmission
    }

    // Only update submission_deadline if explicitly provided
    if (submissionDeadline !== null && submissionDeadline !== undefined) {
      updateData.submission_deadline = submissionDeadline
    }

    const { data, error } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', formId)
      .select()
      .single()

    if (error) {
      console.error("Error updating draft:", error)
      if (!silent) {
        toast.error("Failed to update draft. Please try again.")
      }
      return { success: false, error }
    }

    if (!silent) {
      toast.success("Draft updated successfully!")
    }
    console.log("Draft updated in database:", data)
    return { success: true, data }
    
  } catch (error) {
    console.error("Error updating draft:", error)
    if (!silent) {
      toast.error("Failed to update draft. Please try again.")
    }
    return { success: false, error }
  }
}

// Update and publish form (for editing existing forms)
export async function updateAndPublishForm(
  formId: string,
  publishFormData: {
    title: string
    description: string
    instructions: string
    clientId: string
    projectId: string
    submissionDeadline: Date | null
    accessLevel: 'private' | 'team' | 'client' | 'public'
    maxSubmissions: string
    notifyEmails: string[]
  },
  fields: FormField[],
  brandColor?: string,
  logoUrl?: string | null,
  companyName?: string,
  companyAddress?: string,
  companyPhone?: string,
  companyEmail?: string,
  formDate?: string,
  footerLine1?: string,
  footerLine2?: string
) {
  try {
    const supabase = createClient()
    
    // Create form structure from fields
    const formStructure = {
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options
      })),
      settings: {
        title: publishFormData.title,
      },
      brand_color: brandColor,
      logo_url: logoUrl,
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_email: companyEmail,
      form_date: formDate,
      footer_line1: footerLine1,
      footer_line2: footerLine2
    }

    const updateData = {
      title: publishFormData.title,
      description: publishFormData.description,
      instructions: publishFormData.instructions,
      form_structure: formStructure,
      status: 'published',
      client_id: (publishFormData.clientId === "none" || !publishFormData.clientId || publishFormData.clientId === "") ? null : publishFormData.clientId,
      project_id: (publishFormData.projectId === "none" || !publishFormData.projectId || publishFormData.projectId === "") ? null : publishFormData.projectId,
      notify_on_submission: publishFormData.notifyEmails.length > 0,
      submission_deadline: publishFormData.submissionDeadline?.toISOString() || null,
      access_level: publishFormData.accessLevel,
      max_submissions: publishFormData.maxSubmissions ? parseInt(publishFormData.maxSubmissions) : null,
      notify_emails: publishFormData.notifyEmails,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    console.log('Updating form with data:', { formId, updateData })

    const { data, error } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', formId)
      .select()
      .single()

    if (error) {
      console.error("Error updating and publishing form:", error)
      console.error("Error details:", JSON.stringify(error, null, 2))
      toast.error(`Failed to update and publish form: ${error.message || 'Unknown error'}`)
      return { success: false, error }
    }

    toast.success("Form updated and published successfully!")
    console.log("Form updated and published in database:", data)
    return { success: true, data }
    
  } catch (error) {
    console.error("Error updating and publishing form:", error)
    toast.error("Failed to update and publish form. Please try again.")
    return { success: false, error }
  }
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

// =====================================================
// FORM BUILDER FUNCTIONS (New additions)
// =====================================================

export interface FormField {
  id: string
  type: string
  label: string
  description?: string
  required: boolean
  placeholder?: string
  options?: string[]
  settings?: Record<string, any>
  currency?: string
}

export interface FormBuilderData {
  title: string
  description?: string
  instructions?: string
  form_structure: {
    fields: FormField[]
    settings: {
      title: string
    }
  }
  status: 'draft' | 'published' | 'archived' | 'deleted'
  client_id?: string | null
  project_id?: string | null
  notify_on_submission?: boolean
  submission_deadline?: string | null
  access_level?: 'private' | 'team' | 'client' | 'public'
  max_submissions?: number | null
  notify_emails?: string[]
  published_at?: string
}

export interface TemplateData {
  name: string
  description?: string
  template_data: {
    fields: FormField[]
    settings: {
      title: string
    }
  }
  is_public?: boolean
  is_featured?: boolean
  usage_count?: number
}

export async function saveFormDraft(
  formTitle: string,
  fields: FormField[],
  clientId?: string | null,
  projectId?: string | null,
  notifyOnSubmission?: boolean,
  submissionDeadline?: string | null,
  instructions?: string,
  silent: boolean = false,
  brandColor?: string,
  logoUrl?: string | null,
  companyName?: string,
  companyAddress?: string,
  companyPhone?: string,
  companyEmail?: string,
  formDate?: string,
  footerLine1?: string,
  footerLine2?: string
) {
  try {
    // Validate that we have a proper title
    if (!formTitle.trim()) {
      console.error("Cannot save draft with empty title")
      return { success: false, error: "Title cannot be empty" }
    }

    const supabase = createClient()
    
    // Get current user's account_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')
    
    // Create form structure from fields
    const formStructure = {
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options
      })),
      settings: {
        title: formTitle.trim(),
      },
      brand_color: brandColor,
      logo_url: logoUrl,
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_email: companyEmail,
      form_date: formDate,
      footer_line1: footerLine1,
      footer_line2: footerLine2
    }

    const formData: FormBuilderData = {
      title: formTitle.trim(),
      description: "",
      instructions: instructions || "",
      form_structure: formStructure,
      status: 'draft',
      client_id: clientId || null,
      project_id: projectId || null,
      notify_on_submission: notifyOnSubmission,
      submission_deadline: submissionDeadline,
      access_level: 'private',
      max_submissions: null,
      notify_emails: []
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('forms')
      .insert({
        ...formData,
        account_id: profile.account_id,
        created_by: user.id,
        created_by_name: `${profile.first_name} ${profile.last_name}`,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving draft:", error)
      if (!silent) {
        toast.error("Failed to save draft. Please try again.")
      }
      return { success: false, error }
    }

    if (!silent) {
      toast.success("Draft saved successfully!")
    }
    console.log("Draft saved to database:", data)
    return { success: true, data }
    
  } catch (error) {
    console.error("Error saving draft:", error)
    if (!silent) {
      toast.error("Failed to save draft. Please try again.")
    }
    return { success: false, error }
  }
}

export async function saveFormTemplate(
  templateName: string,
  templateDescription: string,
  formTitle: string,
  fields: FormField[]
) {
  try {
    const supabase = createClient()
    
    // Get current user's account_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')
    
    // Create template data from form structure
    const templateData = {
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options
      })),
      settings: {
        title: formTitle,
      }
    }

    const templateFormData: TemplateData = {
      name: templateName,
      description: templateDescription,
      template_data: templateData,
      is_public: false,
      is_featured: false,
      usage_count: 0
    }

    // Save template to Supabase
    const { data, error } = await supabase
      .from('form_templates')
      .insert({
        ...templateFormData,
        account_id: profile.account_id,
        created_by: user.id,
        created_by_name: `${profile.first_name} ${profile.last_name}`,
      })
      .select()
      .single()

    if (error) {
      console.error("Error saving template:", error)
      toast.error("Failed to save template. Please try again.")
      return { success: false, error }
    }

    toast.success("Template saved successfully!")
    console.log("Template saved to database:", data)
    return { success: true, data }
    
  } catch (error) {
    console.error("Error saving template:", error)
    toast.error("Failed to save template. Please try again.")
    return { success: false, error }
  }
}

export async function publishForm(
  publishFormData: {
    title: string
    description: string
    instructions: string
    clientId: string
    projectId: string
    submissionDeadline: Date | null
    accessLevel: 'private' | 'team' | 'client' | 'public'
    maxSubmissions: string
    notifyEmails: string[]
  },
  fields: FormField[],
  brandColor?: string,
  logoUrl?: string | null,
  companyName?: string,
  companyAddress?: string,
  companyPhone?: string,
  companyEmail?: string,
  formDate?: string,
  footerLine1?: string,
  footerLine2?: string
) {
  try {
    const supabase = createClient()
    
    // Get current user's account_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (!profile) throw new Error('Profile not found')
    
    // Create form structure from fields
    const formStructure = {
      fields: fields.map(field => ({
        id: field.id,
        type: field.type,
        label: field.label,
        description: field.description,
        required: field.required,
        placeholder: field.placeholder,
        options: field.options
      })),
      settings: {
        title: publishFormData.title,
      },
      brand_color: brandColor,
      logo_url: logoUrl,
      company_name: companyName,
      company_address: companyAddress,
      company_phone: companyPhone,
      company_email: companyEmail,
      form_date: formDate,
      footer_line1: footerLine1,
      footer_line2: footerLine2
    }

    const formData: FormBuilderData = {
      title: publishFormData.title,
      description: publishFormData.description,
      instructions: publishFormData.instructions,
      form_structure: formStructure,
      status: 'published',
      client_id: (publishFormData.clientId === "none" || !publishFormData.clientId || publishFormData.clientId === "") ? null : publishFormData.clientId,
      project_id: (publishFormData.projectId === "none" || !publishFormData.projectId || publishFormData.projectId === "") ? null : publishFormData.projectId,
      notify_on_submission: publishFormData.notifyEmails.length > 0,
      submission_deadline: publishFormData.submissionDeadline?.toISOString() || null,
      access_level: publishFormData.accessLevel,
      max_submissions: publishFormData.maxSubmissions ? parseInt(publishFormData.maxSubmissions) : null,
      notify_emails: publishFormData.notifyEmails,
      published_at: new Date().toISOString()
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('forms')
      .insert({
        ...formData,
        account_id: profile.account_id,
        created_by: user.id,
        created_by_name: `${profile.first_name} ${profile.last_name}`,
      })
      .select()
      .single()

    if (error) {
      console.error("Error publishing form:", error)
      toast.error("Failed to publish form. Please try again.")
      return { success: false, error }
    }

    toast.success("Form published successfully!")
    console.log("Form published to database:", data)
    return { success: true, data }
    
  } catch (error) {
    console.error("Error publishing form:", error)
    toast.error("Failed to publish form. Please try again.")
    return { success: false, error }
  }
} 

// Get form templates for the current user's account
export async function getFormTemplates(): Promise<{
  id: string
  name: string
  description: string | null
  category: string | null
  template_data: any
  is_public: boolean
  is_featured: boolean
  usage_count: number
  created_by_name: string | null
  created_at: string
}[]> {
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

  // Get templates from the user's account and public templates
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .or(`account_id.eq.${profile.account_id},is_public.eq.true`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching templates:', error)
    throw error
  }

  return data || []
}

// Get a specific form template by ID
export async function getFormTemplate(templateId: string): Promise<{
  id: string
  name: string
  description: string | null
  category: string | null
  template_data: any
  is_public: boolean
  is_featured: boolean
  usage_count: number
  created_by_name: string | null
  created_at: string
} | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('form_templates')
    .select('*')
    .eq('id', templateId)
    .single()

  if (error) {
    console.error('Error fetching template:', error)
    return null
  }

  return data
}

// =====================================================
// FORM SUBMISSION FUNCTIONS
// =====================================================

// Submit a form (for client portal)
export async function submitForm(
  formId: string,
  responses: Record<string, any>,
  respondentName?: string,
  respondentEmail?: string
): Promise<FormSubmission | null> {
  const supabase = createClient()
  
  // Get form details first
  const form = await getForm(formId)
  if (!form) {
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
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    time_spent: 0 // Could be calculated if we track start time
  }

  const { data, error } = await supabase
    .from('form_submissions')
    .insert(submissionData)
    .select()
    .single()

  if (error) {
    console.error('Error submitting form:', error)
    throw error
  }

  return data
}

// Get form submissions for a specific form
export async function getFormSubmissionsForForm(formId: string): Promise<FormSubmission[]> {
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

// Check if a form has been submitted by a specific user
export async function hasFormBeenSubmitted(formId: string, respondentEmail?: string): Promise<boolean> {
  const supabase = createClient()
  
  let query = supabase
    .from('form_submissions')
    .select('id')
    .eq('form_id', formId)
    .eq('status', 'completed')

  if (respondentEmail) {
    query = query.eq('respondent_email', respondentEmail)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking form submission:', error)
    return false
  }

  return (data?.length || 0) > 0
}

// Get forms for a specific client (for portal)
export async function getClientForms(clientId: string): Promise<Form[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('forms')
    .select(`
      *,
      clients:clients(first_name, last_name, company),
      projects:projects(name)
    `)
    .eq('client_id', clientId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching client forms:', error)
    throw error
  }

  return data || []
} 