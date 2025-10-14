import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Use direct Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Update the file's approval status to 'approved'
    const { data, error } = await supabase
      .from('files')
      .update({ 
        approval_status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', fileId)
      .select()

    if (error) {
      console.error('Error approving file:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to approve file' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data[0]
    })
  } catch (error) {
    console.error('Error approving file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to approve file' },
      { status: 500 }
    )
  }
}
