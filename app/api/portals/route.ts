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
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get the user's account_id from their profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('account_id')
      .eq('user_id', userId)
      .single()

    if (profileError || !profileData?.account_id) {
      return NextResponse.json(
        { success: false, message: 'User profile not found' },
        { status: 404 }
      )
    }

    // Fetch portals for this account with client information
    const { data: portals, error: portalsError } = await supabaseAdmin
      .from('portals')
      .select(`
        *,
        client:clients(
          id,
          first_name,
          last_name,
          company,
          avatar_initials
        )
      `)
      .eq('account_id', profileData.account_id)
      .order('created_at', { ascending: false })

    if (portalsError) {
      console.error('Error fetching portals:', portalsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch portals' },
        { status: 500 }
      )
    }

    // Fetch portal modules for each portal
    const { data: portalModules, error: modulesError } = await supabaseAdmin
      .from('portal_modules')
      .select('portal_id, module_name, is_enabled')
      .eq('is_enabled', true)

    if (modulesError) {
      console.error('Error fetching portal modules:', modulesError)
      // Continue without modules if there's an error
    }

    // Group modules by portal_id
    const modulesByPortal = portalModules?.reduce((acc, module) => {
      if (!acc[module.portal_id]) {
        acc[module.portal_id] = []
      }
      acc[module.portal_id].push(module.module_name)
      return acc
    }, {} as Record<string, string[]>) || {}

    // Transform the data to match our interface
    const transformedPortals = portals.map(portal => ({
      id: portal.id,
      name: portal.name,
      account_id: portal.account_id || profileData.account_id,
      client: {
        id: portal.client_id || 'no-client',
        name: portal.client ? 
          (portal.client.company || `${portal.client.first_name} ${portal.client.last_name}`) : 
          'No Client',
        avatar: portal.client?.avatar_initials || 'NP'
      },
      project: null, // We can add project association later if needed
      status: portal.status as "live" | "draft" | "archived" | "maintenance",
      url: portal.url,
      views: portal.view_count || 0,
      lastActivity: portal.last_accessed_at ? 
        formatTimeAgo(new Date(portal.last_accessed_at)) : 
        'Never',
      description: portal.description || 'No description provided',
      modules: modulesByPortal[portal.id] || []
    }))

    return NextResponse.json({
      success: true,
      data: transformedPortals
    })

  } catch (error) {
    console.error('Error in portals API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return `${diffInDays} days ago`
  }
}
