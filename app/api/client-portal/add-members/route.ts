import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { companySlug, clientSlug, clientId, members } = await request.json()

    if (!companySlug || !clientSlug || !members || !Array.isArray(members)) {
      return NextResponse.json(
        { success: false, message: 'Invalid request data' },
        { status: 400 }
      )
    }

    // Get the client_id and account_id - either from provided clientId or by looking it up
    let clientIdToUse = clientId
    let accountIdToUse: string

    if (clientId) {
      // If clientId is provided, get the account_id from the client record
      const { data: clientRecord, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('account_id')
        .eq('id', clientId)
        .single()

      if (clientError || !clientRecord) {
        console.error('Error looking up client:', clientError)
        return NextResponse.json(
          { success: false, message: 'Client not found' },
          { status: 404 }
        )
      }
      accountIdToUse = clientRecord.account_id
    } else {
      // Fall back to looking up from allowlist
      const { data: existingAllowlistEntry, error: lookupError } = await supabaseAdmin
        .from('client_allowlist')
        .select('client_id, account_id')
        .eq('company_slug', companySlug)
        .eq('client_slug', clientSlug)
        .eq('is_active', true)
        .single()

      if (lookupError || !existingAllowlistEntry) {
        console.error('Error looking up client in allowlist:', lookupError)
        return NextResponse.json(
          { success: false, message: 'Client not found in allowlist' },
          { status: 404 }
        )
      }
      clientIdToUse = existingAllowlistEntry.client_id
      accountIdToUse = existingAllowlistEntry.account_id
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

    // Get all portals for this client to add members to all of them
    const { data: clientPortals, error: portalsError } = await supabaseAdmin
      .from('portals')
      .select('id, url, name')
      .eq('account_id', accountIdToUse)
      .eq('client_id', clientIdToUse)
      .eq('status', 'live')

    if (portalsError) {
      console.error('Error fetching client portals:', portalsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch client portals' },
        { status: 500 }
      )
    }

    console.log('Found portals for client:', clientPortals)

    // Check if client has any portals
    if (!clientPortals || clientPortals.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'No portals found for this client. Please create a portal first.' 
        },
        { status: 400 }
      )
    }

    // Prepare data for insertion - add members to ALL portals for this client
    const allowlistData = []
    
    for (const portal of clientPortals) {
      // Extract company and client slug from portal URL
      const urlParts = portal.url.split('.')
      const portalCompanySlug = urlParts[0]
      const portalClientSlug = urlParts[1]
      
      for (const member of validMembers) {
        // Check if member already exists for this portal
        const { data: existingMember } = await supabaseAdmin
          .from('client_allowlist')
          .select('id')
          .eq('account_id', accountIdToUse)
          .eq('company_slug', portalCompanySlug)
          .eq('client_slug', portalClientSlug)
          .eq('email', member.email.trim().toLowerCase())
          .single()

        // Only add if member doesn't already exist
        if (!existingMember) {
          allowlistData.push({
            account_id: accountIdToUse,
            client_id: clientIdToUse, // Add the main client's ID
            company_slug: portalCompanySlug,
            client_slug: portalClientSlug,
            email: member.email.trim().toLowerCase(),
            name: member.name.trim(),
            role: member.role?.trim() || null,
            is_active: true
          })
        }
      }
    }

    console.log('Adding members to allowlist for all client portals:', {
      accountId: accountIdToUse,
      portals: clientPortals?.length || 0,
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
      message: `Successfully added ${allowlistData.length} member(s)`,
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