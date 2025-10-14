import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, responses, respondentName, respondentEmail } = body

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

    // Get form details first
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      console.error('Error fetching form:', formError)
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

    // Create submission data
    const submissionData = {
      form_id: formId,
      status: 'completed' as const,
      respondent_name: respondentName || null,
      respondent_email: respondentEmail || null,
      responses: responses, // Keep original responses for compatibility
      detailed_responses: detailedResponses, // New detailed responses
      form_title: form.title,
      form_description: form.description,
      form_instructions: form.instructions,
      total_fields: totalFields,
      completed_fields: completedFields,
      completion_percentage: completionPercentage,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      time_spent: 0
    }

    const { data: submission, error: submissionError } = await supabase
      .from('form_submissions')
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
