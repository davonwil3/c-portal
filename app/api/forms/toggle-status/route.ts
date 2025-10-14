import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { formId, status } = body

    if (!formId || !status) {
      return NextResponse.json(
        { success: false, error: 'Form ID and status are required' },
        { status: 400 }
      )
    }

    if (!['draft', 'published'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status must be either "draft" or "published"' },
        { status: 400 }
      )
    }

    // Use direct Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the form's status
    const { data, error } = await supabase
      .from('forms')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', formId)
      .select()

    if (error) {
      console.error('Error updating form status:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update form status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error updating form status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update form status' },
      { status: 500 }
    )
  }
}
