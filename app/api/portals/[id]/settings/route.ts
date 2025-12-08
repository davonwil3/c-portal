import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

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

    // Handle "global" template portal - return settings from global_portal_settings table
    if (portalId === 'global') {
      // Get account_id from the authenticated user using server client (reads from cookies)
      const supabase = await createServerClient()
      let accountId: string | null = null

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_id')
          .eq('user_id', user.id)
          .single()
        
        accountId = profile?.account_id || null
      }

      if (!accountId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Get account logo_url to use as default
      const { data: account } = await supabaseAdmin
        .from('accounts')
        .select('logo_url')
        .eq('id', accountId)
        .maybeSingle()

      const accountLogoUrl = account?.logo_url || ''

      // Get global settings from global_portal_settings table
      const { data: globalSettings } = await supabaseAdmin
        .from('global_portal_settings')
        .select('settings, modules')
        .eq('account_id', accountId)
        .maybeSingle()

      const settingsJson = globalSettings?.settings || {}
      const defaultModules = {
        timeline: true,
        files: true,
        invoices: true,
        contracts: true,
        forms: true,
        messages: true,
        "ai-assistant": true
      }
      const modules = globalSettings?.modules ? { ...defaultModules, ...globalSettings.modules } : defaultModules

      return NextResponse.json({
        success: true,
        data: {
          portal: {
            id: 'global',
            name: 'Global Portal Template',
            status: 'draft',
            url: '',
            description: '',
            brandColor: settingsJson.brandColor || '#3C3CFF',
            welcomeMessage: settingsJson.welcomeMessage || '',
            passwordProtected: false,
            portalPassword: '',
            logoUrl: settingsJson.logoUrl || accountLogoUrl || '',
            companyName: settingsJson.companyName || null,
            useBackgroundImage: settingsJson.useBackgroundImage ?? false,
            backgroundImageUrl: settingsJson.backgroundImageUrl || '',
            backgroundColor: settingsJson.backgroundColor || '#3C3CFF',
            sidebarBgColor: settingsJson.sidebarBgColor || '#FFFFFF',
            sidebarTextColor: settingsJson.sidebarTextColor || '#1F2937',
            sidebarHighlightColor: settingsJson.sidebarHighlightColor || '#4647E0',
            sidebarHighlightTextColor: settingsJson.sidebarHighlightTextColor || '#FFFFFF',
            portalFont: settingsJson.portalFont || 'Inter',
            taskViews: settingsJson.taskViews || { milestones: true, board: true },
            login: (() => {
              // Clean login object - only include fields we want, apply defaults
              const login = settingsJson.login || {}
              return {
                logoUrl: login.logoUrl || accountLogoUrl || '',
                welcomeHeadline: login.welcomeHeadline || 'Welcome',
                welcomeSubtitle: login.welcomeSubtitle || 'Login to access your portal',
                bgMode: login.bgMode || 'solid',
                bgColor: login.bgColor || '#F3F4F6',
                bgGradientFrom: login.bgGradientFrom || '#EEF2FF',
                bgGradientTo: login.bgGradientTo || '#F5F7FF',
                bgGradientAngle: login.bgGradientAngle || 135,
                bgImageUrl: login.bgImageUrl || '',
                imageFit: login.imageFit || 'cover',
                overlayOpacity: login.overlayOpacity !== undefined ? login.overlayOpacity : 20,
                blur: login.blur || false,
                magicLinkEnabled: login.magicLinkEnabled !== undefined ? login.magicLinkEnabled : true,
                passwordEnabled: login.passwordEnabled || false,
                activeAuthMode: login.activeAuthMode || 'magic',
                magicLinkButtonLabel: login.magicLinkButtonLabel || 'Send Magic Link',
                passwordButtonLabel: login.passwordButtonLabel || 'Sign In',
                showResend: login.showResend || false,
              }
            })(),
          },
          client: {
            id: 'global',
            firstName: 'Portal',
            lastName: 'Template',
            email: '',
            company: 'Your Company',
            avatar: 'PT',
          },
          modules: {
            timeline: true,
            files: true,
            invoices: true,
            contracts: true,
            forms: true,
            messages: true,
            "ai-assistant": true
          },
          projects: [],
          invoices: [],
          files: [],
          tasks: [],
          milestones: [],
          contracts: [],
          forms: [],
          formSubmissions: [],
          messages: [],
          bookings: [],
          projectVisibility: {},
          defaultProject: null,
          members: [],
        },
      })
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

    // Get account logo_url to use as default
    const { data: account } = await supabaseAdmin
      .from('accounts')
      .select('logo_url')
      .eq('id', portal.account_id)
      .maybeSingle()

    const accountLogoUrl = account?.logo_url || ''

    // Get global settings (for account-level defaults)
    // Global settings are stored in global_portal_settings table
    const { data: globalSettings } = await supabaseAdmin
      .from('global_portal_settings')
      .select('settings, modules')
      .eq('account_id', portal.account_id)
      .maybeSingle()

    // Get individual portal settings - ONLY from JSONB settings column
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('portal_settings')
      .select('settings, modules, project_visibility, default_project_id, password_protected, portal_password')
      .eq('portal_id', portalId)
      .maybeSingle()

    // Helper function to merge settings (individual overrides global)
    // Deep merge for nested objects like login and taskViews
    // IMPORTANT: If individual settings exist (even if empty), they take precedence
    const mergeSettings = (global: any, individual: any) => {
      // If individual settings exist (object with keys), use them as base and merge global only for missing keys
      // If individual is empty or doesn't exist, use global
      if (!individual || (typeof individual === 'object' && Object.keys(individual).length === 0)) {
        return global || {}
      }
      
      if (!global || (typeof global === 'object' && Object.keys(global).length === 0)) {
        return individual || {}
      }
      
      // Start with individual settings (they override global)
      const merged = { ...individual }
      
      // Only add global settings for keys that don't exist in individual
      Object.keys(global).forEach(key => {
        if (!(key in merged)) {
          merged[key] = global[key]
        } else if (
          typeof merged[key] === 'object' && 
          !Array.isArray(merged[key]) &&
          typeof global[key] === 'object' && 
          !Array.isArray(global[key])
        ) {
          // Deep merge nested objects - individual values override global
          merged[key] = { ...global[key], ...merged[key] }
        }
      })
      
      return merged
    }

    // Get settings from JSONB - prioritize JSONB over individual columns
    // Ensure settings is parsed as object (Supabase should handle this, but be safe)
    let globalSettingsJson = {}
    let individualSettingsJson = {}
    
    try {
      globalSettingsJson = typeof globalSettings?.settings === 'string' 
        ? JSON.parse(globalSettings.settings) 
        : (globalSettings?.settings || {})
    } catch (e) {
      console.error('Error parsing global settings JSON:', e)
      globalSettingsJson = {}
    }
    
    try {
      individualSettingsJson = typeof settings?.settings === 'string'
        ? JSON.parse(settings.settings)
        : (settings?.settings || {})
    } catch (e) {
      console.error('Error parsing individual settings JSON:', e)
      individualSettingsJson = {}
    }
    
    // Debug logging (can be removed later)
    console.log('=== PORTAL SETTINGS LOAD ===')
    console.log('Portal ID:', portalId)
    console.log('Global settings from DB:', JSON.stringify(globalSettingsJson, null, 2))
    console.log('Individual settings from DB:', JSON.stringify(individualSettingsJson, null, 2))
    console.log('Individual settings object exists:', !!settings)
    console.log('Individual settings.settings exists:', !!settings?.settings)
    
    // Merge global and individual settings (individual overrides global)
    // If individual portal has settings, use them; otherwise use global
    const mergedSettings = mergeSettings(globalSettingsJson, individualSettingsJson)
    
    // Debug logging (can be removed later)
    console.log('Merged settings (individual overrides global):', JSON.stringify(mergedSettings, null, 2))
    console.log('=== END PORTAL SETTINGS LOAD ===')
    
    // Use ONLY merged settings (which already has individual overriding global)
    // Then fallback to portal defaults only if nothing is set
    const finalSettings = {
      brandColor: mergedSettings.brandColor ?? portal.brand_color ?? '#3C3CFF',
      welcomeMessage: mergedSettings.welcomeMessage ?? '',
      logoUrl: mergedSettings.logoUrl || accountLogoUrl || '',
      companyName: mergedSettings.companyName ?? null,
      useBackgroundImage: mergedSettings.useBackgroundImage ?? false,
      backgroundImageUrl: mergedSettings.backgroundImageUrl ?? '',
      backgroundColor: mergedSettings.backgroundColor ?? '#3C3CFF',
      sidebarBgColor: mergedSettings.sidebarBgColor ?? '#FFFFFF',
      sidebarTextColor: mergedSettings.sidebarTextColor ?? '#1F2937',
      sidebarHighlightColor: mergedSettings.sidebarHighlightColor ?? (mergedSettings.brandColor ?? '#4647E0'),
      sidebarHighlightTextColor: mergedSettings.sidebarHighlightTextColor ?? '#FFFFFF',
      portalFont: mergedSettings.portalFont ?? 'Inter',
      taskViews: mergedSettings.taskViews ?? { milestones: true, board: true },
      login: (() => {
        // Clean login object - only include fields we want, apply defaults
        const login = mergedSettings.login || {}
        return {
          logoUrl: login.logoUrl || accountLogoUrl || '',
          welcomeHeadline: login.welcomeHeadline || 'Welcome',
          welcomeSubtitle: login.welcomeSubtitle || 'Login to access your portal',
          bgMode: login.bgMode || 'solid',
          bgColor: login.bgColor || '#F3F4F6',
          bgGradientFrom: login.bgGradientFrom || '#EEF2FF',
          bgGradientTo: login.bgGradientTo || '#F5F7FF',
          bgGradientAngle: login.bgGradientAngle || 135,
          bgImageUrl: login.bgImageUrl || '',
          imageFit: login.imageFit || 'cover',
          overlayOpacity: login.overlayOpacity !== undefined ? login.overlayOpacity : 20,
          blur: login.blur || false,
          magicLinkEnabled: login.magicLinkEnabled !== undefined ? login.magicLinkEnabled : true,
          passwordEnabled: login.passwordEnabled || false,
          activeAuthMode: login.activeAuthMode || 'magic',
          magicLinkButtonLabel: login.magicLinkButtonLabel || 'Send Magic Link',
          passwordButtonLabel: login.passwordButtonLabel || 'Sign In',
          showResend: login.showResend || false,
        }
      })(),
    }
    
    console.log('Final settings after merge:', JSON.stringify(finalSettings, null, 2))

    // Use settings data or defaults - default all modules to ON
    const defaultModules = {
      timeline: true,
      files: true,
      invoices: true,
      contracts: true,
      forms: true,
      messages: true,
      "ai-assistant": true
    }
    const modulesFromSettings = settings?.modules || globalSettings?.modules || {}
    const finalModules = { ...defaultModules, ...modulesFromSettings }

    // Get projects for this client (ordered by creation date, newest first)
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select('id, name, status, created_at')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return NextResponse.json(
        { success: false, message: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    // Get invoices for this client
    let invoices: any[] = []
    if (portal.client_id && portal.account_id) {
      const { data: invoicesData, error: invoicesError } = await supabaseAdmin
        .from('invoices')
        .select(`
          id, 
          invoice_number, 
          title, 
          description, 
          status, 
          issue_date, 
          due_date, 
          total_amount, 
          subtotal, 
          project_id, 
          line_items, 
          notes, 
          tax_amount, 
          tax_rate, 
          discount_amount, 
          discount_value, 
          currency, 
          client_id,
          po_number,
          is_recurring,
          recurring_schedule,
        clients:client_id(first_name, last_name, company, email, phone),
        accounts:account_id(company_name, address, logo_url),
        metadata
        `)
        .eq('client_id', portal.client_id)
        .eq('account_id', portal.account_id)
        .order('issue_date', { ascending: false })

      if (invoicesError) {
        console.error('Error fetching invoices:', invoicesError)
      } else if (invoicesData) {
        // Format invoices to include client and company info
        invoices = invoicesData.map((inv: any) => ({
          ...inv,
          client_name: inv.clients ? (inv.clients.company || `${inv.clients.first_name || ''} ${inv.clients.last_name || ''}`.trim()) : null,
          client_email: inv.clients?.email || null,
          client_phone: inv.clients?.phone || null,
          company_name: inv.metadata?.company_name || inv.accounts?.company_name || null,
          company_address: inv.metadata?.company_address || inv.accounts?.address || null,
          company_email: inv.metadata?.company_email || inv.accounts?.email || null,
          company_phone: inv.metadata?.company_phone || inv.accounts?.phone || null,
          logo_url: inv.metadata?.logo_url || inv.accounts?.logo_url || null,
        }))
        console.log(`Fetched ${invoices.length} invoices for client ${portal.client_id}`)
      } else {
        console.log('No invoices data returned from query')
      }
    } else {
      console.warn('Portal client_id or account_id is missing, skipping invoice fetch', { client_id: portal.client_id, account_id: portal.account_id })
    }

    // Get project IDs for use in multiple queries
    const projectIds = projects.map(p => p.id)
    
    // Get files for this client
    // Files can be linked directly via client_id OR via project_id (projects have client_id)
    let files: any[] = []
    
    // First, get files directly linked to client
    const { data: clientFiles, error: clientFilesError } = await supabaseAdmin
      .from('files')
      .select('id, name, approval_status, status, created_at, project_id, approval_required, client_id, uploaded_by_name, sent_by_client, storage_path, storage_bucket, file_type')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (clientFilesError) {
      console.error('Error fetching client files:', clientFilesError)
    } else {
      files = clientFiles || []
    }
    
    // Also get files linked via projects (files might not have client_id but belong to client's projects)
    if (projectIds.length > 0) {
      const { data: projectFiles, error: projectFilesError } = await supabaseAdmin
        .from('files')
        .select('id, name, approval_status, status, created_at, project_id, approval_required, client_id, uploaded_by_name, sent_by_client, storage_path, storage_bucket, file_type')
        .in('project_id', projectIds)
        .eq('account_id', portal.account_id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (projectFilesError) {
        console.error('Error fetching project files:', projectFilesError)
      } else {
        // Merge project files, avoiding duplicates
        const existingIds = new Set(files.map(f => f.id))
        const newFiles = (projectFiles || []).filter(f => !existingIds.has(f.id))
        files = [...files, ...newFiles]
      }
    }
    
    // Debug: Log files with pending approval
    const pendingFiles = files.filter(f => f.approval_status === 'pending')
    if (pendingFiles.length > 0) {
      console.log(`Found ${pendingFiles.length} files with pending approval status:`, pendingFiles)
    }
    if (files.length > 0) {
      console.log(`Total files fetched: ${files.length}, Pending: ${pendingFiles.length}, Approved: ${files.filter(f => f.approval_status === 'approved').length}`)
    }

    // Get milestones for this client's projects
    let milestones: any[] = []
    if (projectIds.length > 0) {
      const { data: milestonesData, error: milestonesError } = await supabaseAdmin
        .from('project_milestones')
        .select('id, title, description, status, due_date, project_id')
        .in('project_id', projectIds)
        .order('sort_order', { ascending: true })

      if (milestonesError) {
        console.error('Error fetching milestones:', milestonesError)
      } else {
        milestones = milestonesData || []
      }
    }

    // Get tasks for this client's projects
    // Note: project_tasks doesn't have account_id, it's linked via project_id
    let tasks: any[] = []
    if (projectIds.length > 0) {
      const { data: tasksData, error: tasksError } = await supabaseAdmin
        .from('project_tasks')
        .select('id, title, description, status, project_id, milestone_id, due_date')
        .in('project_id', projectIds)

      if (tasksError) {
        console.error('Error fetching tasks:', tasksError)
      } else {
        // Attach milestone data to tasks
        tasks = (tasksData || []).map((task: any) => {
          if (task.milestone_id) {
            const milestone = milestones.find((m: any) => m.id === task.milestone_id)
            return {
              ...task,
              milestone: milestone || null
            }
          }
          return task
        })
      }
    }

    // Get bookings for this client's projects
    let bookings: any[] = []
    if (projectIds.length > 0) {
      const { data: bookingsData, error: bookingsError } = await supabaseAdmin
        .from('bookings')
        .select('id, title, scheduled_date, start_time, end_time, status, location_type, service_name, notes, client_notes, project_id, client_name, client_email')
        .in('project_id', projectIds)
        .eq('account_id', portal.account_id)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true })

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError)
      } else {
        bookings = bookingsData || []
      }
    }

    // Also get bookings linked directly via client_id
    const { data: clientBookings, error: clientBookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, title, scheduled_date, start_time, end_time, status, location_type, service_name, notes, client_notes, project_id, client_name, client_email')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (clientBookingsError) {
      console.error('Error fetching client bookings:', clientBookingsError)
    } else {
      // Merge client bookings, avoiding duplicates
      const existingBookingIds = new Set(bookings.map((b: any) => b.id))
      const newBookings = (clientBookings || []).filter((b: any) => !existingBookingIds.has(b.id))
      bookings = [...bookings, ...newBookings]
    }

    // Get contracts for this client
    const { data: contracts, error: contractsError } = await supabaseAdmin
      .from('contracts')
      .select('id, name, status, signed_at, created_at, updated_at, project_id, contract_content, signature_status, client_signature_status, user_signature_status, client_signed_at, user_signed_at')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)
      .order('created_at', { ascending: false })

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError)
    }

    // Get forms for this client
    const { data: forms, error: formsError } = await supabaseAdmin
      .from('forms')
      .select('id, title, description, instructions, form_structure, status, client_id, project_id, submission_deadline, created_at')
      .eq('client_id', portal.client_id)
      .eq('account_id', portal.account_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (formsError) {
      console.error('Error fetching forms:', formsError)
    }

    // Get form submissions to check which forms have been submitted
    const formIds = forms?.map(f => f.id) || []
    let formSubmissions: any[] = []
    if (formIds.length > 0) {
      const { data: submissions, error: submissionsError } = await supabaseAdmin
        .from('form_submissions')
        .select('form_id, status')
        .in('form_id', formIds)
        .eq('status', 'completed')

      if (!submissionsError && submissions) {
        formSubmissions = submissions
      }
    }

    // Get messages for this client's projects
    let messages: any[] = []
    if (projectIds.length > 0) {
      const { data: messagesData, error: messagesError } = await supabaseAdmin
        .from('messages')
        .select('id, content, sender_name, sender_type, sender_id, project_id, created_at, client_id, attachment_url, attachment_name, attachment_type, attachment_size')
        .in('project_id', projectIds)
        .eq('account_id', portal.account_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (messagesError) {
        console.error('Error fetching messages:', messagesError)
      } else {
        messages = messagesData || []
        
        // Get unique sender IDs for account users
        const accountUserSenderIds = [...new Set(
          messages
            .filter((msg: any) => msg.sender_type === 'account_user' && msg.sender_id)
            .map((msg: any) => msg.sender_id)
        )]

        // Fetch profiles for account users
        let profilesMap: { [key: string]: { first_name: string; last_name: string } } = {}
        if (accountUserSenderIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('user_id, first_name, last_name')
            .in('user_id', accountUserSenderIds)

          if (!profilesError && profilesData) {
            profilesMap = profilesData.reduce((acc: any, profile: any) => {
              acc[profile.user_id] = {
                first_name: profile.first_name || '',
                last_name: profile.last_name || ''
              }
              return acc
            }, {})
          }
        }

        // Update messages with profile names for account users
        messages = messages.map((msg: any) => {
          if (msg.sender_type === 'account_user' && msg.sender_id && profilesMap[msg.sender_id]) {
            const profile = profilesMap[msg.sender_id]
            const fullName = `${profile.first_name} ${profile.last_name}`.trim()
            if (fullName) {
              return {
                ...msg,
                sender_name: fullName
              }
            }
          }
          return msg
        })
      }
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
    // Default all projects to visible unless explicitly set to false
    let projectVisibility = settings?.project_visibility || {}
    if (projects && projects.length > 0) {
      const defaultVisibility: Record<string, boolean> = {}
      projects.forEach((p: any) => {
        // If visibility is explicitly set, use it; otherwise default to true
        defaultVisibility[p.id] = projectVisibility[p.id] ?? true
      })
      projectVisibility = defaultVisibility
    }
    // Get defaultProject from settings JSON first, fallback to default_project_id column for backward compatibility
    const defaultProjectFromSettings = mergedSettings.defaultProject !== undefined 
      ? (mergedSettings.defaultProject === null ? 'newest' : mergedSettings.defaultProject)
      : null
    const defaultProject = defaultProjectFromSettings || settings?.default_project_id || 'newest'

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Returning portal settings:', JSON.stringify({
        brandColor: finalSettings.brandColor,
        welcomeMessage: finalSettings.welcomeMessage,
        logoUrl: finalSettings.logoUrl,
        sidebarBgColor: finalSettings.sidebarBgColor,
        sidebarTextColor: finalSettings.sidebarTextColor,
        portalFont: finalSettings.portalFont,
        login: finalSettings.login,
      }, null, 2))
    }

    return NextResponse.json({
      success: true,
      data: {
        portal: {
          id: portal.id,
          account_id: portal.account_id,
          name: portal.name,
          status: portal.status,
          url: portal.url,
          description: portal.description || '',
          brandColor: finalSettings.brandColor,
          welcomeMessage: finalSettings.welcomeMessage,
          passwordProtected: settings?.password_protected || false,
          portalPassword: settings?.portal_password || '',
          logoUrl: finalSettings.logoUrl || '',
          companyName: finalSettings.companyName,
          useBackgroundImage: finalSettings.useBackgroundImage,
          backgroundImageUrl: finalSettings.backgroundImageUrl || '',
          backgroundColor: finalSettings.backgroundColor,
          sidebarBgColor: finalSettings.sidebarBgColor,
          sidebarTextColor: finalSettings.sidebarTextColor,
          sidebarHighlightColor: finalSettings.sidebarHighlightColor,
          sidebarHighlightTextColor: finalSettings.sidebarHighlightTextColor,
          portalFont: finalSettings.portalFont,
          taskViews: finalSettings.taskViews,
          login: {
            ...(finalSettings.login || {}),
            welcomeHeadline: finalSettings.login?.welcomeHeadline || 'Welcome',
            welcomeSubtitle: finalSettings.login?.welcomeSubtitle || 'Login to access your portal',
          },
        },
        client: {
          id: portal.clients.id,
          firstName: portal.clients.first_name,
          lastName: portal.clients.last_name,
          email: portal.clients.email,
          company: portal.clients.company,
          avatar: portal.clients.first_name?.charAt(0) + portal.clients.last_name?.charAt(0) || 'C',
        },
        modules: finalModules,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          isVisible: projectVisibility[p.id] !== false, // Default to true
          isDefault: defaultProject === 'newest' ? false : p.id === defaultProject,
        })),
        invoices: invoices || [],
        files: files || [],
        tasks: tasks || [],
        milestones: milestones || [],
        contracts: contracts || [],
        forms: forms || [],
        formSubmissions: formSubmissions || [],
        messages: messages || [],
        bookings: bookings || [],
        projectVisibility,
        defaultProject: defaultProject === null ? 'newest' : defaultProject,
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

    // Handle global portal settings FIRST (before trying to update portals table)
    if (portalId === 'global') {
      // Get account_id from the authenticated user using server client (reads from cookies)
      const supabase = await createServerClient()
      let accountId: string | null = null

      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_id')
          .eq('user_id', user.id)
          .single()
        
        accountId = profile?.account_id || null
      }

      if (!accountId) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Handle logo URL (now comes from bucket storage)
      const logoUrl = portal?.logoUrl || null

      // Build settings JSONB object with ALL settings from right sidebar
      // Only include properties that are actually provided (not undefined)
      const settingsJson: Record<string, any> = {}
      
      if (portal?.brandColor !== undefined) settingsJson.brandColor = portal.brandColor
      if (portal?.welcomeMessage !== undefined) settingsJson.welcomeMessage = portal.welcomeMessage
      if (logoUrl !== undefined && logoUrl !== null) settingsJson.logoUrl = logoUrl
      if (portal?.companyName !== undefined) settingsJson.companyName = portal.companyName
      if (portal?.useBackgroundImage !== undefined) settingsJson.useBackgroundImage = portal.useBackgroundImage
      if (portal?.backgroundImageUrl !== undefined) settingsJson.backgroundImageUrl = portal.backgroundImageUrl
      if (portal?.backgroundColor !== undefined) settingsJson.backgroundColor = portal.backgroundColor
      if (portal?.sidebarBgColor !== undefined) settingsJson.sidebarBgColor = portal.sidebarBgColor
      if (portal?.sidebarTextColor !== undefined) settingsJson.sidebarTextColor = portal.sidebarTextColor
      if (portal?.sidebarHighlightColor !== undefined) settingsJson.sidebarHighlightColor = portal.sidebarHighlightColor
      if (portal?.sidebarHighlightTextColor !== undefined) settingsJson.sidebarHighlightTextColor = portal.sidebarHighlightTextColor
      if (portal?.portalFont !== undefined) settingsJson.portalFont = portal.portalFont
      if (portal?.taskViews !== undefined) settingsJson.taskViews = portal.taskViews
      // Only save login fields we want (exclude rememberMe, supportText, supportLink)
      if (portal?.login !== undefined) {
        settingsJson.login = {
          logoUrl: portal.login.logoUrl,
          welcomeHeadline: portal.login.welcomeHeadline,
          welcomeSubtitle: portal.login.welcomeSubtitle,
          bgMode: portal.login.bgMode,
          bgColor: portal.login.bgColor,
          bgGradientFrom: portal.login.bgGradientFrom,
          bgGradientTo: portal.login.bgGradientTo,
          bgGradientAngle: portal.login.bgGradientAngle,
          bgImageUrl: portal.login.bgImageUrl,
          imageFit: portal.login.imageFit,
          overlayOpacity: portal.login.overlayOpacity,
          blur: portal.login.blur,
          magicLinkEnabled: portal.login.magicLinkEnabled,
          passwordEnabled: portal.login.passwordEnabled,
          activeAuthMode: portal.login.activeAuthMode,
          magicLinkButtonLabel: portal.login.magicLinkButtonLabel,
          passwordButtonLabel: portal.login.passwordButtonLabel,
          showResend: portal.login.showResend,
        }
      }
      // Add defaultProject to settings JSON
      if (defaultProject !== undefined) {
        settingsJson.defaultProject = defaultProject === 'newest' ? null : defaultProject
      }

      // Get existing global settings to merge (preserve values not being updated)
      const { data: existingGlobalSettings } = await supabaseAdmin
        .from('global_portal_settings')
        .select('settings')
        .eq('account_id', accountId)
        .maybeSingle()

      // Merge with existing settings - new values override existing ones
      const existingGlobalSettingsJson = existingGlobalSettings?.settings || {}
      const mergedSettings = {
        ...existingGlobalSettingsJson,
        ...settingsJson
      }
      
      // Clean up login object - remove old fields and ensure defaults
      if (mergedSettings.login) {
        mergedSettings.login = {
          logoUrl: mergedSettings.login.logoUrl || '',
          welcomeHeadline: mergedSettings.login.welcomeHeadline || 'Welcome',
          welcomeSubtitle: mergedSettings.login.welcomeSubtitle || 'Login to access your portal',
          bgMode: mergedSettings.login.bgMode || 'solid',
          bgColor: mergedSettings.login.bgColor || '#F3F4F6',
          bgGradientFrom: mergedSettings.login.bgGradientFrom || '#EEF2FF',
          bgGradientTo: mergedSettings.login.bgGradientTo || '#F5F7FF',
          bgGradientAngle: mergedSettings.login.bgGradientAngle || 135,
          bgImageUrl: mergedSettings.login.bgImageUrl || '',
          imageFit: mergedSettings.login.imageFit || 'cover',
          overlayOpacity: mergedSettings.login.overlayOpacity !== undefined ? mergedSettings.login.overlayOpacity : 20,
          blur: mergedSettings.login.blur || false,
          magicLinkEnabled: mergedSettings.login.magicLinkEnabled !== undefined ? mergedSettings.login.magicLinkEnabled : true,
          passwordEnabled: mergedSettings.login.passwordEnabled || false,
          activeAuthMode: mergedSettings.login.activeAuthMode || 'magic',
          magicLinkButtonLabel: mergedSettings.login.magicLinkButtonLabel || 'Send Magic Link',
          passwordButtonLabel: mergedSettings.login.passwordButtonLabel || 'Sign In',
          showResend: mergedSettings.login.showResend || false,
        }
      }
      
      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Saving global settings - existing:', JSON.stringify(existingGlobalSettingsJson, null, 2))
        console.log('Saving global settings - new:', JSON.stringify(settingsJson, null, 2))
        console.log('Saving global settings - merged:', JSON.stringify(mergedSettings, null, 2))
      }

      // Update global portal settings
      const { error: settingsError } = await supabaseAdmin
        .from('global_portal_settings')
        .upsert({
          account_id: accountId,
          settings: mergedSettings,
          modules: modules || {},
        }, {
          onConflict: 'account_id'
        })

      if (settingsError) {
        console.error('Error updating global portal settings:', settingsError)
        return NextResponse.json(
          { success: false, message: 'Failed to update global portal settings' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Global portal settings updated successfully',
      })
    }

    // Handle individual portal settings
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

    // Build settings JSONB object with ALL settings from right sidebar
    // Only include properties that are actually provided (not undefined)
    const settingsJson: Record<string, any> = {}
    
    if (portal?.brandColor !== undefined) settingsJson.brandColor = portal.brandColor
    if (portal?.welcomeMessage !== undefined) settingsJson.welcomeMessage = portal.welcomeMessage
    if (logoUrl !== undefined && logoUrl !== null) settingsJson.logoUrl = logoUrl
    if (portal?.companyName !== undefined) settingsJson.companyName = portal.companyName
    if (portal?.useBackgroundImage !== undefined) settingsJson.useBackgroundImage = portal.useBackgroundImage
    if (portal?.backgroundImageUrl !== undefined) settingsJson.backgroundImageUrl = portal.backgroundImageUrl
    if (portal?.backgroundColor !== undefined) settingsJson.backgroundColor = portal.backgroundColor
    if (portal?.sidebarBgColor !== undefined) settingsJson.sidebarBgColor = portal.sidebarBgColor
    if (portal?.sidebarTextColor !== undefined) settingsJson.sidebarTextColor = portal.sidebarTextColor
    if (portal?.sidebarHighlightColor !== undefined) settingsJson.sidebarHighlightColor = portal.sidebarHighlightColor
    if (portal?.sidebarHighlightTextColor !== undefined) settingsJson.sidebarHighlightTextColor = portal.sidebarHighlightTextColor
    if (portal?.portalFont !== undefined) settingsJson.portalFont = portal.portalFont
    if (portal?.taskViews !== undefined) settingsJson.taskViews = portal.taskViews
    // Only save login fields we want (exclude rememberMe, supportText, supportLink)
    if (portal?.login !== undefined) {
      settingsJson.login = {
        logoUrl: portal.login.logoUrl,
        welcomeHeadline: portal.login.welcomeHeadline,
        welcomeSubtitle: portal.login.welcomeSubtitle,
        bgMode: portal.login.bgMode,
        bgColor: portal.login.bgColor,
        bgGradientFrom: portal.login.bgGradientFrom,
        bgGradientTo: portal.login.bgGradientTo,
        bgGradientAngle: portal.login.bgGradientAngle,
        bgImageUrl: portal.login.bgImageUrl,
        imageFit: portal.login.imageFit,
        overlayOpacity: portal.login.overlayOpacity,
        blur: portal.login.blur,
        magicLinkEnabled: portal.login.magicLinkEnabled,
        passwordEnabled: portal.login.passwordEnabled,
        activeAuthMode: portal.login.activeAuthMode,
        magicLinkButtonLabel: portal.login.magicLinkButtonLabel,
        passwordButtonLabel: portal.login.passwordButtonLabel,
        showResend: portal.login.showResend,
      }
    }
    // Add defaultProject to settings JSON
    if (defaultProject !== undefined) {
      settingsJson.defaultProject = defaultProject === 'newest' ? null : defaultProject
    }

    // Get existing settings to merge (preserve values not being updated)
    const { data: existingSettings } = await supabaseAdmin
      .from('portal_settings')
      .select('settings')
      .eq('portal_id', portalId)
      .maybeSingle()

    // Merge with existing settings - new values override existing ones
    // This ensures we preserve settings that aren't being updated
    const existingSettingsJson = existingSettings?.settings || {}
    const mergedSettings = {
      ...existingSettingsJson,
      ...settingsJson
    }
    
    // Clean up login object - remove old fields and ensure defaults
    if (mergedSettings.login) {
      mergedSettings.login = {
        logoUrl: mergedSettings.login.logoUrl || '',
        welcomeHeadline: mergedSettings.login.welcomeHeadline || 'Welcome',
        welcomeSubtitle: mergedSettings.login.welcomeSubtitle || 'Login to access your portal',
        bgMode: mergedSettings.login.bgMode || 'solid',
        bgColor: mergedSettings.login.bgColor || '#F3F4F6',
        bgGradientFrom: mergedSettings.login.bgGradientFrom || '#EEF2FF',
        bgGradientTo: mergedSettings.login.bgGradientTo || '#F5F7FF',
        bgGradientAngle: mergedSettings.login.bgGradientAngle || 135,
        bgImageUrl: mergedSettings.login.bgImageUrl || '',
        imageFit: mergedSettings.login.imageFit || 'cover',
        overlayOpacity: mergedSettings.login.overlayOpacity !== undefined ? mergedSettings.login.overlayOpacity : 20,
        blur: mergedSettings.login.blur || false,
        magicLinkEnabled: mergedSettings.login.magicLinkEnabled !== undefined ? mergedSettings.login.magicLinkEnabled : true,
        passwordEnabled: mergedSettings.login.passwordEnabled || false,
        activeAuthMode: mergedSettings.login.activeAuthMode || 'magic',
        magicLinkButtonLabel: mergedSettings.login.magicLinkButtonLabel || 'Send Magic Link',
        passwordButtonLabel: mergedSettings.login.passwordButtonLabel || 'Sign In',
        showResend: mergedSettings.login.showResend || false,
      }
    }
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Saving settings - existing:', JSON.stringify(existingSettingsJson, null, 2))
      console.log('Saving settings - new:', JSON.stringify(settingsJson, null, 2))
      console.log('Saving settings - merged:', JSON.stringify(mergedSettings, null, 2))
    }

    // Update portal settings in the portal_settings table
    // Handle default project - if it's 'newest', store as null
    const defaultProjectId = defaultProject === 'newest' ? null : defaultProject
    
    const { error: settingsError } = await supabaseAdmin
      .from('portal_settings')
      .upsert({
        portal_id: portalId,
        settings: mergedSettings,
        modules: modules || {
          timeline: true,
          files: true,
          invoices: true,
          contracts: true,
          forms: true,
          messages: true,
          "ai-assistant": true
        },
        project_visibility: projects ? projects.reduce((acc, p) => {
          acc[p.id] = p.isVisible !== false // Default to true if not explicitly false
          return acc
        }, {} as Record<string, boolean>) : {},
        default_project_id: defaultProjectId,
        // Keep individual columns for backward compatibility during migration
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
