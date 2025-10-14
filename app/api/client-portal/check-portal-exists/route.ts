import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { companySlug, clientSlug, email } = await request.json()

    if (!companySlug) {
      return NextResponse.json(
        { success: false, message: 'Company slug is required' },
        { status: 400 }
      )
    }

    console.log('Checking portal existence and authorization:', { companySlug, clientSlug, email })

    // Step 1: If email is provided, find the correct portal and client slug from allowlist
    if (email) {
      // Find the allowlist entry for this email and company
      const { data: allowlistEntry, error: allowlistError } = await supabaseAdmin
        .from('client_allowlist')
        .select('id, email, is_active, company_slug, client_slug, account_id, client_id')
        .eq('email', email.toLowerCase())
        .eq('company_slug', companySlug)
        .eq('is_active', true)
        .single()

      if (allowlistError || !allowlistEntry) {
        console.log('Email not found in allowlist for this company:', { email, companySlug })
        return NextResponse.json({
          success: true,
          exists: false,
          authorized: false,
          message: 'Email not authorized for this company'
        })
      }

      console.log('Found allowlist entry:', allowlistEntry)

      // Step 2: If client_id is null, try to find the client by email and update the allowlist
      let clientId = allowlistEntry.client_id
      
      if (!clientId) {
        console.log('Client ID is null, trying to find client by email...')
        
        // Find the client by email
        const { data: client, error: clientError } = await supabaseAdmin
          .from('clients')
          .select('id, first_name, last_name, email')
          .eq('email', email.toLowerCase())
          .eq('account_id', allowlistEntry.account_id)
          .single()

        if (clientError || !client) {
          console.log('No client found for this email:', email)
          return NextResponse.json({
            success: true,
            exists: false,
            authorized: true,
            message: 'No client found for this email'
          })
        }

        console.log('Found client:', client)
        clientId = client.id

        // Update the allowlist entry with the correct client_id
        const { error: updateError } = await supabaseAdmin
          .from('client_allowlist')
          .update({ client_id: clientId })
          .eq('id', allowlistEntry.id)

        if (updateError) {
          console.error('Error updating allowlist with client_id:', updateError)
        } else {
          console.log('Updated allowlist entry with client_id:', clientId)
        }
      }

      // Step 3: Find the portal for this account and client
      const { data: portal, error: portalError } = await supabaseAdmin
        .from('portals')
        .select('id, name, status, url, account_id, client_id')
        .eq('account_id', allowlistEntry.account_id)
        .eq('client_id', clientId)
        .single()

      if (portalError || !portal) {
        console.log('No portal found for this client:', { account_id: allowlistEntry.account_id, client_id: clientId })
        return NextResponse.json({
          success: true,
          exists: false,
          authorized: true,
          message: 'No portal found for this client'
        })
      }

      console.log('Portal found:', portal)

      return NextResponse.json({
        success: true,
        exists: true,
        authorized: true,
        data: {
          id: portal.id,
          name: portal.name,
          status: portal.status,
          url: portal.url,
          clientSlug: allowlistEntry.client_slug
        }
      })
    }

    // Step 3: If no email provided, just check if any portals exist for this company
    const { data: portals, error: portalError } = await supabaseAdmin
      .from('portals')
      .select('id, name, status, url, account_id, client_id')
      .like('url', `%${companySlug}%`)

    if (portalError) {
      console.error('Error checking portal existence:', portalError)
      return NextResponse.json(
        { success: false, message: 'Failed to check portal existence' },
        { status: 500 }
      )
    }

    // Check if we found any matching portals
    if (!portals || portals.length === 0) {
      console.log('No portals found for company:', companySlug)
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'No portals found for this company'
      })
    }

    console.log('Found portals for company:', portals)

    return NextResponse.json({
      success: true,
      exists: true,
      authorized: null, // null if no email provided
      data: {
        id: portals[0].id,
        name: portals[0].name,
        status: portals[0].status,
        url: portals[0].url
      }
    })

  } catch (error) {
    console.error('Error in check-portal-exists API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
