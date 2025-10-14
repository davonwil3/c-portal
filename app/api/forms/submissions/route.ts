import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    const email = searchParams.get('email')

    if (!formId || !email) {
      return NextResponse.json(
        { success: false, error: 'Form ID and email are required' },
        { status: 400 }
      )
    }

    // Use direct Supabase client without cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the form submission for this form and email
    const { data: submission, error } = await supabase
      .from('form_submissions')
      .select('*')
      .eq('form_id', formId)
      .eq('respondent_email', email)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !submission) {
      return NextResponse.json(
        { success: false, error: 'Form submission not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: submission
    })
  } catch (error) {
    console.error('Error fetching form submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch form submission' },
      { status: 500 }
    )
  }
}
