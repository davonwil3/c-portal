import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, responses, respondentName, respondentEmail, formType } = body

    if (!formId || !responses) {
      return NextResponse.json(
        { success: false, error: 'Form ID and responses are required' },
        { status: 400 }
      )
    }

    // Use direct Supabase client without cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine which table to query based on formType or try both
    let form: any = null
    let isLeadForm = formType === 'lead'

    if (formType === 'lead') {
      // Try lead_forms first
      const { data: leadForm, error: leadError } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (leadForm && !leadError) {
        form = leadForm
        isLeadForm = true
      }
    } else if (formType === 'regular') {
      // Try forms table
      const { data: regularForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (regularForm && !formError) {
        form = regularForm
        isLeadForm = false
      }
    } else {
      // Try both tables if formType not specified
      const { data: leadForm, error: leadError } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (leadForm && !leadError) {
        form = leadForm
        isLeadForm = true
      } else {
        const { data: regularForm, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single()

        if (regularForm && !formError) {
          form = regularForm
          isLeadForm = false
        }
      }
    }

    if (!form) {
      console.error('Error fetching form: Form not found')
      return NextResponse.json(
        { success: false, error: 'Form not found' },
        { status: 404 }
      )
    }

    // Calculate completion statistics
    const fields = form.form_structure?.fields || []
    const totalFields = fields.length
    const completedFields = Object.keys(responses).length
    const completionPercentage = totalFields > 0 ? (completedFields / totalFields) * 100 : 0

    // Create detailed responses with field information
    const detailedResponses = fields.map(field => ({
      field_id: field.id,
      field_type: field.type,
      field_label: field.label,
      field_description: field.description || null,
      field_required: field.required || false,
      field_options: field.options || null,
      response_value: responses[field.id] || null,
      response_text: responses[field.id] ? String(responses[field.id]) : null
    }))

    // Create submission data - structure differs slightly between lead and regular forms
    const baseSubmissionData = {
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
    }

    const submissionData = isLeadForm
      ? {
          ...baseSubmissionData,
          tag: 'New',
          tag_color: '#f59e0b',
          time_spent: 0,
        }
      : {
          ...baseSubmissionData,
          detailed_responses: detailedResponses,
          form_title: form.title,
          form_description: form.description,
          form_instructions: form.instructions,
          time_spent: 0,
        }

    // Insert into the appropriate submissions table
    const submissionsTable = isLeadForm ? 'lead_form_submissions' : 'form_submissions'
    const { data: submission, error: submissionError } = await supabase
      .from(submissionsTable)
      .insert(submissionData)
      .select()
      .single()

    if (submissionError) {
      console.error('Error submitting form:', submissionError)
      return NextResponse.json(
        { success: false, error: 'Failed to submit form' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Error submitting form:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit form' },
      { status: 500 }
    )
  }
}
