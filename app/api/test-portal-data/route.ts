import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientSlug = searchParams.get('clientSlug')
    const companySlug = searchParams.get('companySlug')
    const preview = searchParams.get('preview') === 'true'

    if (!clientSlug || !companySlug) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing clientSlug or companySlug' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // In preview mode, verify user is authenticated and owns this portal
    if (preview) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.log('No authenticated user for preview access')
        return NextResponse.json({ 
          success: false, 
          error: 'Authentication required for preview access' 
        }, { status: 401 })
      }

      // Get user's profile to get their account_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        console.log('User profile not found:', { userId: user.id, profileError })
        return NextResponse.json({ 
          success: false, 
          error: 'User profile not found' 
        }, { status: 404 })
      }

      console.log('Authenticated user account:', { userId: user.id, accountId: profile.account_id })
    }

    // Get client data from allowlist
    const { data: allowlistEntries, error: allowlistError } = await supabase
      .from('client_allowlist')
      .select('*')
      .eq('client_slug', clientSlug)
      .eq('company_slug', companySlug)
      .eq('is_active', true)

    if (allowlistError) {
      console.error('Allowlist error:', allowlistError)
      return NextResponse.json({ 
        success: false, 
        error: 'Database error checking allowlist' 
      }, { status: 500 })
    }

    if (!allowlistEntries || allowlistEntries.length === 0) {
      console.error('No allowlist entries found for:', { clientSlug, companySlug })
      return NextResponse.json({ 
        success: false, 
        error: 'Client not found in allowlist' 
      }, { status: 404 })
    }

    // Use the first allowlist entry if multiple exist
    const allowlistData = allowlistEntries[0]
    const clientId = allowlistData.client_id
    const accountId = allowlistData.account_id

    console.log('Found client:', { clientId, accountId, clientSlug, companySlug })

    // In preview mode, verify the authenticated user's account matches the portal's account
    if (preview) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      if (profile.account_id !== accountId) {
        console.log('Account mismatch:', { 
          userAccountId: profile.account_id, 
          portalAccountId: accountId,
          userId: user.id 
        })
        return NextResponse.json({ 
          success: false, 
          error: 'You do not have access to this portal' 
        }, { status: 403 })
      }

      console.log('Account verification passed:', { userAccountId: profile.account_id, portalAccountId: accountId })
    }

    // Get portal settings - need to find portal_id first
    const { data: portal, error: portalError } = await supabase
      .from('portals')
      .select('id')
      .eq('client_id', clientId)
      .single()

    let portalSettings = null
    if (portal && portal.id) {
      const { data: settings, error: settingsError } = await supabase
        .from('portal_settings')
        .select('*')
        .eq('portal_id', portal.id)
        .single()

      if (settingsError) {
        console.error('Portal settings error:', settingsError)
        console.log('No portal settings found for portal:', portal.id)
      } else {
        console.log('Portal settings found:', settings)
        portalSettings = settings
      }
    } else {
      console.error('No portal found for client:', clientId)
    }

    // Get projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Projects error:', projectsError)
    }

    // Get invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (invoicesError) {
      console.error('Invoices error:', invoicesError)
    }

    // Get files
    const { data: files, error: filesError } = await supabase
      .from('files')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (filesError) {
      console.error('Files error:', filesError)
    }

    // Get contracts
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (contractsError) {
      console.error('Contracts error:', contractsError)
    }

    // Get forms
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (formsError) {
      console.error('Forms error:', formsError)
    }

    // Get project milestones - get all milestones for projects belonging to this client
    const { data: milestones, error: milestonesError } = await supabase
      .from('project_milestones')
      .select(`
        *,
        projects!inner(
          id,
          client_id,
          account_id
        )
      `)
      .eq('projects.client_id', clientId)
      .eq('projects.account_id', accountId)
      .order('created_at', { ascending: false })

    if (milestonesError) {
      console.error('Milestones error:', milestonesError)
    }

    // Get messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('client_id', clientId)
      .eq('account_id', accountId)
      .order('created_at', { ascending: false })

    if (messagesError) {
      console.error('Messages error:', messagesError)
    }

    return NextResponse.json({
      success: true,
      data: {
        allowlist: allowlistData,
        portalSettings: portalSettings || null,
        portalId: portal?.id || null, // Add portal ID for view tracking
        projects: projects || [],
        invoices: invoices || [],
        files: files || [],
        contracts: contracts || [],
        forms: forms || [],
        milestones: milestones || [],
        messages: messages || [],
        // Add branding data in the format expected by client portal
        branding: {
          logo: portalSettings?.logo_url || "/placeholder.svg?height=60&width=200&text=Logo",
          primaryColor: portalSettings?.brand_color || "#3C3CFF",
          headerBackgroundImage: portalSettings?.background_image_url || null,
          useBackgroundImage: portalSettings?.use_background_image ?? false, // Use nullish coalescing to properly handle false values
          backgroundColor: portalSettings?.background_color || "#F5F7FF"
        }
      }
    })

    console.log('Portal settings debug:', {
      use_background_image: portalSettings?.use_background_image,
      background_image_url: portalSettings?.background_image_url,
      background_color: portalSettings?.background_color,
      branding: {
        logo: portalSettings?.logo_url || "/placeholder.svg?height=60&width=200&text=Logo",
        primaryColor: portalSettings?.brand_color || "#3C3CFF",
        headerBackgroundImage: portalSettings?.background_image_url || null,
        useBackgroundImage: portalSettings?.use_background_image ?? false,
        backgroundColor: portalSettings?.background_color || "#F5F7FF"
      }
    })

  } catch (error) {
    console.error('Error in test-portal-data API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
