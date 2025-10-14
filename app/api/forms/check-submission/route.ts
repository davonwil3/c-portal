import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')

    if (!formId) {
      return NextResponse.json(
        { success: false, error: 'Form ID is required' },
        { status: 400 }
      )
    }

    // Use direct Supabase client without cookies
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('form_submissions')
      .select('id')
      .eq('form_id', formId)

    console.log('Checking submission for form:', formId)
    console.log('Query result:', { data, error })

    if (error) {
      console.error('Error checking form submission:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to check submission status' },
        { status: 500 }
      )
    }

    // Simple: if record exists in form_submissions, it's submitted
    const isSubmitted = (data?.length || 0) > 0
    console.log('Is submitted:', isSubmitted)

    return NextResponse.json({
      success: true,
      isSubmitted
    })
  } catch (error) {
    console.error('Error checking form submission:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check submission status' },
      { status: 500 }
    )
  }
}
