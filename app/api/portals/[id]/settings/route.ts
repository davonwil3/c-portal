import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// GET portal settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portalId } = await params

    if (!portalId) {
      return NextResponse.json(
        { success: false, message: 'Portal ID is required' },
        { status: 400 }
      )
    }

    // Get portal details
    const { data: portal, error: portalError } = await supabaseAdmin
      .from('portals')
      .select(`
        id,
        name,
        status,
        url,
        description,
        brand_color,
        client_id,
        account_id,
        clients (
          id,
          first_name,
          last_name,
          email,
          company
        )
      `)
      .eq('id', portalId)
      .single()

    if (portalError || !portal) {
      console.error('Error fetching portal:', portalError)
      return NextResponse.json(
        { success: false, message: 'Portal not found' },
        { status: 404 }
      )
    }

    // Get portal settings
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('portal_settings')
      .select('modules, project_visibility, default_project_id, brand_color, welcome_message, password_protected, portal_password, logo_url, use_background_image, background_image_url, background_color')
      .eq('portal_id', portalId)
      .single()

    // Use settings data or defaults
    const modules = settings?.modules || {
      timeline: true,
      files: true,
      invoices: true,
      contracts: true,
      forms: false,
      messages: true,
      "ai-assistant": false
    }

    // Get projects for this client
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, status')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Get allowlist members
    const { data: members, error: membersError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, is_active')
      .eq('account_id', portal.account_id)
      .eq('client_id', portal.client_id)
      .eq('is_active', true)

    if (membersError) {
      console.error('Error fetching allowlist members:', membersError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch allowlist members' },
        { status: 500 }
      )
    }

    // Use settings data or defaults
    const projectVisibility = settings?.project_visibility || {}
    const defaultProject = settings?.default_project_id || null

    return NextResponse.json({
      success: true,
      data: {
        portal: {
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
        },
        client: {
          id: portal.clients.id,
          firstName: portal.clients.first_name,
          lastName: portal.clients.last_name,
          email: portal.clients.email,
          company: portal.clients.company,
          avatar: portal.clients.first_name?.charAt(0) + portal.clients.last_name?.charAt(0) || 'C',
        },
        modules,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          isVisible: projectVisibility[p.id] || false,
          isDefault: p.id === defaultProject,
        })),
        projectVisibility,
        defaultProject,
        members: members.map(m => ({
          email: m.email,
          name: m.name,
          role: m.role,
        })),
      },
    })

  } catch (error) {
    console.error('Error in get portal settings API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT update portal settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: portalId } = await params
    const body = await request.json()

    if (!portalId) {
      return NextResponse.json(
        { success: false, message: 'Portal ID is required' },
        { status: 400 }
      )
    }

    const {
      portal,
      modules,
      projects,
      defaultProject,
    } = body

    // Update portal basic info
    if (portal) {
      const { error: portalError } = await supabaseAdmin
        .from('portals')
        .update({
          name: portal.name,
          description: portal.description,
        })
        .eq('id', portalId)

      if (portalError) {
        console.error('Error updating portal:', portalError)
        return NextResponse.json(
          { success: false, message: 'Failed to update portal basic info' },
          { status: 500 }
        )
      }
    }

    // Handle logo URL (now comes from bucket storage)
    const logoUrl = portal?.logoUrl || null

    // Update portal settings in the portal_settings table
    const { error: settingsError } = await supabaseAdmin
      .from('portal_settings')
      .upsert({
        portal_id: portalId,
        modules: modules || {},
        project_visibility: projects ? projects.reduce((acc, p) => {
          acc[p.id] = p.isVisible
          return acc
        }, {} as Record<string, boolean>) : {},
        default_project_id: defaultProject,
        brand_color: portal?.brandColor,
        welcome_message: portal?.welcomeMessage,
        logo_url: logoUrl,
        use_background_image: portal?.useBackgroundImage,
        background_image_url: portal?.backgroundImageUrl,
        background_color: portal?.backgroundColor,
      }, {
        onConflict: 'portal_id'
      })

    if (settingsError) {
      console.error('Error updating portal settings:', settingsError)
      return NextResponse.json(
        { success: false, message: 'Failed to update portal settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Portal settings updated successfully',
    })

  } catch (error) {
    console.error('Error in update portal settings API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
