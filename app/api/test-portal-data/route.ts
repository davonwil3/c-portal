import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientSlug = searchParams.get('clientSlug')
    const companySlug = searchParams.get('companySlug')
    const isPreview = searchParams.get('preview') === 'true'

    if (!clientSlug || !companySlug) {
      return NextResponse.json(
        { success: false, message: 'Missing clientSlug or companySlug' },
        { status: 400 }
      )
    }

    // Get account data
    const { data: accountData, error: accountError } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
      .ilike('company_name', `%${companySlug.replace(/-/g, '%')}%`)
      .single()

    if (accountError || !accountData) {
      return NextResponse.json(
        { success: false, message: 'Company not found' },
        { status: 404 }
      )
    }

    let allowlistData = null
    let clientId = null

    if (isPreview) {
      // In preview mode, find the client directly by slug without allowlist check
      console.log('Preview mode: Finding client directly by slug:', { clientSlug, companySlug })
      
      // First, try to find the client by matching the slug with company name
      const { data: clients } = await supabaseAdmin
        .from('clients')
        .select('id, first_name, last_name, company, email')
        .eq('account_id', accountData.id)
        .or(`company.ilike.%${clientSlug.replace(/-/g, '%')}%,first_name.ilike.%${clientSlug.replace(/-/g, '%')}%,last_name.ilike.%${clientSlug.replace(/-/g, '%')}%`)
        .limit(1)

      if (clients && clients.length > 0) {
        clientId = clients[0].id
        allowlistData = {
          client_id: clients[0].id,
          name: `${clients[0].first_name} ${clients[0].last_name}`,
          company_name: clients[0].company,
          email: clients[0].email || `${clients[0].first_name?.toLowerCase()}.${clients[0].last_name?.toLowerCase()}@example.com`
        }
        console.log('Preview mode: Found client directly:', allowlistData)
      } else {
        return NextResponse.json(
          { success: false, message: 'Client not found for preview' },
          { status: 404 }
        )
      }
    } else {
      // Regular mode: Check allowlist for authentication
      console.log('Regular mode: Looking for client in allowlist:', { 
        accountId: accountData.id, 
        clientSlug, 
        companySlug 
      })
      
      const { data: allowlist, error: allowlistError } = await supabaseAdmin
        .from('client_allowlist')
        .select('*')
        .eq('account_id', accountData.id)
        .eq('client_slug', clientSlug)
        .eq('is_active', true)
        .maybeSingle()

      if (allowlistError) {
        console.error('Error fetching allowlist data:', allowlistError)
        return NextResponse.json(
          { success: false, message: 'Database error' },
          { status: 500 }
        )
      }

      console.log('Allowlist data found:', allowlist)

      if (!allowlist) {
        // Let's also try to find by partial match or show all allowlist entries for debugging
        const { data: allAllowlist } = await supabaseAdmin
          .from('client_allowlist')
          .select('*')
          .eq('account_id', accountData.id)
          .eq('is_active', true)
        
        console.log('All allowlist entries for this account:', allAllowlist)
        
        return NextResponse.json(
          { success: false, message: 'Client not found in allowlist' },
          { status: 404 }
        )
      }

      allowlistData = allowlist
      clientId = allowlist.client_id
    }

    // Get projects for this client
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('account_id', accountData.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get project milestones for each project
    let projectsWithMilestones = []
    if (projects && projects.length > 0) {
      for (const project of projects) {
        const { data: milestones, error: milestonesError } = await supabaseAdmin
          .from('project_milestones')
          .select('*')
          .eq('project_id', project.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true })
        
        projectsWithMilestones.push({
          ...project,
          milestones: milestones || []
        })
      }
    }

    // Get invoices for this client
    const { data: invoices, error: invoicesError } = await supabaseAdmin
      .from('invoices')
      .select('*')
      .eq('account_id', accountData.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get files for this client
    const { data: files, error: filesError } = await supabaseAdmin
      .from('files')
      .select('*')
      .eq('account_id', accountData.id)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    // Get contracts for this client (either directly linked to client or linked to client's projects)
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('*')
      .eq('account_id', accountData.id)
      .or(`client_id.eq.${clientId},project_id.in.(${projects?.map(p => p.id) || []})`)
      .order('created_at', { ascending: false })

    // Get portal for this client
    const { data: portal, error: portalError } = await supabaseAdmin
      .from('portals')
      .select(`
        id,
        name,
        status,
        url,
        description,
        brand_color
      `)
      .eq('client_id', clientId)
      .eq('account_id', accountData.id)
      .single()

    let portalSettings = null
    if (!portalError && portal) {
      // Get portal settings
      const { data: settings, error: settingsError } = await supabaseAdmin
        .from('portal_settings')
        .select('modules, project_visibility, default_project_id, brand_color, welcome_message, password_protected, portal_password, logo_url, use_background_image, background_image_url, background_color')
        .eq('portal_id', portal.id)
        .single()

      const modules = settings?.modules || {
        timeline: true,
        files: true,
        invoices: true,
        contracts: true,
        forms: false,
        messages: true,
        "ai-assistant": false
      }

      portalSettings = {
        id: portal.id,
        name: portal.name,
        status: portal.status,
        url: portal.url,
        description: portal.description || '',
        brandColor: settings?.brand_color || portal.brand_color || '#3C3CFF',
        welcomeMessage: settings?.welcome_message || '',
        passwordProtected: settings?.password_protected || false,
        portalPassword: settings?.portal_password || '',
        logoUrl: settings?.logo_url || '',
        useBackgroundImage: settings?.use_background_image || false,
        backgroundImageUrl: settings?.background_image_url || '',
        backgroundColor: settings?.background_color || '#3C3CFF',
        modules,
        projectVisibility: settings?.project_visibility || {},
        defaultProject: settings?.default_project_id || null,
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Portal data retrieved successfully',
      data: {
        account: accountData,
        allowlist: allowlistData,
        projects: projectsWithMilestones,
        invoices: invoices || [],
        files: files || [],
        contracts: contracts || [],
        portalSettings,
        errors: {
          projects: projectsError?.message,
          invoices: invoicesError?.message,
          files: filesError?.message,
          contracts: contractsError?.message,
          portal: portalError?.message
        }
      }
    })

  } catch (error) {
    console.error('Error in test-portal-data API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
