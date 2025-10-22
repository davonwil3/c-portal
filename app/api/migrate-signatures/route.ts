import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test if the new columns already exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contracts')
      .eq('table_schema', 'public')
      .in('column_name', ['client_signature_data', 'user_signature_data'])

    if (columnError) {
      console.error('Error checking columns:', columnError)
      return NextResponse.json({ success: false, error: columnError.message }, { status: 500 })
    }

    const existingColumns = columns?.map(col => col.column_name) || []
    
    if (existingColumns.length === 2) {
      return NextResponse.json({ 
        success: true, 
        message: 'Dual signature fields already exist' 
      })
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Migration needs to be run manually in Supabase SQL editor. Please run the SQL from supabase/add_dual_signature_fields.sql' 
    })

  } catch (error) {
    console.error('Migration check error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration check failed' },
      { status: 500 }
    )
  }
}