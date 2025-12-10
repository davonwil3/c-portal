import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { accountId, clientId, members } = await request.json()

    if (!accountId || !clientId || !members || !Array.isArray(members)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data: accountId, clientId, and members are required' },
        { status: 400 }
      )
    }

    // Get account info to generate company slug
    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('company_name')
      .eq('id', accountId)
        .single()

    if (accountError || !account) {
      console.error('Error looking up account:', accountError)
        return NextResponse.json(
        { success: false, message: 'Account not found' },
          { status: 404 }
        )
      }

    // Generate company slug from account owner's company name or user name
    let companySlug = ''
    if (account.company_name) {
      companySlug = account.company_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    } else {
      // Fall back to user name
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('account_id', accountId)
        .limit(1)
        .single()

      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        if (fullName) {
          companySlug = fullName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
        }
      }
    }

    if (!companySlug) {
      return NextResponse.json(
        { success: false, message: 'Could not determine company slug' },
        { status: 400 }
      )
    }

    // Verify client belongs to this account
    const { data: clientRecord, error: clientError } = await supabaseAdmin
      .from('clients')
      .select('id, account_id')
      .eq('id', clientId)
      .eq('account_id', accountId)
      .single()

    if (clientError || !clientRecord) {
      console.error('Error looking up client:', clientError)
        return NextResponse.json(
        { success: false, message: 'Client not found or does not belong to this account' },
          { status: 404 }
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

    // Prepare data for insertion - add members to allowlist for this account
    const allowlistData = []
      
      for (const member of validMembers) {
      // Check if member already exists for this account
        const { data: existingMember } = await supabaseAdmin
          .from('client_allowlist')
          .select('id')
        .eq('account_id', accountId)
          .eq('email', member.email.trim().toLowerCase())
          .single()

        // Only add if member doesn't already exist
        if (!existingMember) {
          allowlistData.push({
          account_id: accountId,
          client_id: clientId,
          company_slug: companySlug,
            email: member.email.trim().toLowerCase(),
            name: member.name.trim(),
            role: member.role?.trim() || null,
            is_active: true
          })
        }
    }

    console.log('Adding members to allowlist:', {
      accountId: accountId,
      companySlug: companySlug,
      members: allowlistData.length
    })

    // Check if there are any new members to add
    if (allowlistData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All members already exist in the allowlist',
        data: { addedCount: 0 }
      })
    }

    // Insert members into allowlist for all portals
    // Use simple insert and handle duplicates gracefully
    const { data, error } = await supabaseAdmin
      .from('client_allowlist')
      .insert(allowlistData)

    if (error) {
      console.error('Error adding members to allowlist:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to add members to allowlist',
          error: error.message,
          details: error.details
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${allowlistData.length} member(s) to the portal`,
      data: { addedCount: allowlistData.length }
    })

  } catch (error) {
    console.error('Error in add-members API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 