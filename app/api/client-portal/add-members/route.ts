import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { companySlug, clientSlug, members } = await request.json()

    if (!companySlug || !clientSlug || !members || !Array.isArray(members)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Validate member data
    const validMembers = members.filter((member: any) => 
      member.email && member.name && 
      typeof member.email === 'string' && 
      typeof member.name === 'string'
    )

    if (validMembers.length === 0) {
      return NextResponse.json(
        { success: false, message: 'No valid members provided' },
        { status: 400 }
      )
    }

    // Prepare data for insertion
    const allowlistData = validMembers.map((member: any) => ({
      company_slug: companySlug,
      client_slug: clientSlug,
      email: member.email.trim().toLowerCase(),
      name: member.name.trim(),
      role: member.role?.trim() || null,
      is_active: true
    }))

    // Insert members into allowlist
    const { data, error } = await supabaseAdmin
      .from('client_allowlist')
      .upsert(allowlistData, {
        onConflict: 'company_slug,client_slug,email',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('Error adding members to allowlist:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to add members to allowlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${validMembers.length} member(s)`,
      data: { addedCount: validMembers.length }
    })

  } catch (error) {
    console.error('Error in add-members API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 