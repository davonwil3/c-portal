"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getCurrentAccount, type Account } from "@/lib/auth"
import { Loader2, Home, CheckSquare, CalendarDays, Activity, CreditCard, FileText, FolderOpen, MessageCircle, Building2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { PortalPreview, getGoogleFontUrl, lightenColor } from "./page-editor-backup"

// Navigation sections
const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "invoices", label: "Invoices", icon: CreditCard },
  { id: "forms", label: "Forms", icon: FileText },
  { id: "files", label: "Files", icon: FolderOpen },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "appointments", label: "Appointments", icon: CalendarDays },
  { id: "activity", label: "Activity", icon: Activity },
]

export default function ClientPortalPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [portal, setPortal] = useState<any>(null)
  const [client, setClient] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [formSubmissions, setFormSubmissions] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [projectActivities, setProjectActivities] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [activeSection, setActiveSection] = useState("home")
  const [account, setAccount] = useState<Account | null>(null)

  // Portal settings from database
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({})
  const [projectVisibility, setProjectVisibility] = useState<Record<string, boolean>>({})
  const [brandColor, setBrandColor] = useState("#4647E0")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [useBackgroundImage, setUseBackgroundImage] = useState(false)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState("#4647E0")
  const [sidebarBgColor, setSidebarBgColor] = useState("#FFFFFF")
  const [sidebarTextColor, setSidebarTextColor] = useState("#374151")
  const [sidebarHighlightColor, setSidebarHighlightColor] = useState("#4647E0")
  const [sidebarHighlightTextColor, setSidebarHighlightTextColor] = useState("#FFFFFF")
  const [portalFont, setPortalFont] = useState("Inter")
  const [clientTaskViews, setClientTaskViews] = useState({ milestones: true, board: true })
  const [companyName, setCompanyName] = useState("")

  // Check authentication
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = sessionStorage.getItem(`portal_auth_${slug}`)
      if (!isAuth) {
        router.push(`/portal/${slug}/login`)
        return
      }
      setAuthenticated(true)
    }
    
    checkAuth()
  }, [slug, router])

  // Ensure selectedProject is valid when projects change
  useEffect(() => {
    if (projects.length > 0 && selectedProject) {
      const visibleProjects = projects.filter(p => projectVisibility[p.id] !== false)
      // If selectedProject is not in visible projects, update it
      if (visibleProjects.length > 0 && !visibleProjects.find(p => p.id === selectedProject)) {
        setSelectedProject(visibleProjects[0].id)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects.length]) // Only run when projects array length changes

  // Load portal data
  useEffect(() => {
    if (!authenticated) return

    const loadPortalData = async () => {
      try {
        const supabase = createClient()

        // Get authenticated client email from session
        const clientEmail = sessionStorage.getItem(`portal_email_${slug}`)
        
        if (!clientEmail) {
          router.push(`/portal/${slug}/login`)
          return
        }

        // Find account by matching slug to company name or user name
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, company_name')
        
        let accountId = null
        if (accounts) {
          const matchingAccount = accounts.find(a => {
            if (!a.company_name) return false
            const accountSlug = a.company_name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return accountSlug === slug
          })
          accountId = matchingAccount?.id
        }

        if (!accountId) {
          // Try matching by user name
          const { data: profiles } = await supabase
            .from('profiles')
            .select('account_id, first_name, last_name')
          
          if (profiles) {
            const matchingProfile = profiles.find(p => {
              const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
              if (!fullName) return false
              const nameSlug = fullName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
              return nameSlug === slug
            })
            accountId = matchingProfile?.account_id || null
          }
        }

        if (!accountId) {
          console.error('Account not found for slug:', slug)
          setLoading(false)
          return
        }

        // Get allowlist entry for this email - this contains the client_id
        const { data: allowlistEntry } = await supabase
          .from('client_allowlist')
          .select('client_id, email, name')
          .eq('account_id', accountId)
          .eq('email', clientEmail.toLowerCase())
          .eq('is_active', true)
          .single()

        if (!allowlistEntry) {
          console.error('Email not authorized for this portal:', clientEmail)
          router.push(`/portal/${slug}/login`)
          return
        }

        if (!allowlistEntry.client_id) {
          console.error('No client_id found in allowlist entry for:', clientEmail)
          router.push(`/portal/${slug}/login`)
          return
        }

        // Load portal for this specific client_id from allowlist
        const { data: portalData, error: portalError } = await supabase
          .from('portals')
          .select('*, client:clients(*)')
          .eq('account_id', accountId)
          .eq('client_id', allowlistEntry.client_id)
          .single()

        if (portalError || !portalData) {
          console.error('Portal not found for client_id:', allowlistEntry.client_id, portalError)
          setLoading(false)
          return
        }

        if (!portalData) {
          console.error('Portal not found')
          setLoading(false)
          return
        }

        setPortal(portalData)
        
        // Get authenticated user info from allowlist
        const { data: userAllowlist } = await supabase
          .from('client_allowlist')
          .select('name, email')
          .eq('account_id', portalData.account_id)
          .eq('email', clientEmail.toLowerCase())
          .eq('is_active', true)
          .single()

        // Use allowlist name if available, otherwise use client data
        const userName = userAllowlist?.name || `${portalData.client?.first_name || ''} ${portalData.client?.last_name || ''}`.trim() || 'Client'
        const userEmail = userAllowlist?.email || portalData.client?.email || clientEmail
        
        // Extract initials from name
        const nameParts = userName.split(' ')
        const avatar = (nameParts[0]?.[0] || '') + (nameParts[1]?.[0] || '')

        setClient({
          id: portalData.client?.id || 'member',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          email: userEmail,
          company: portalData.client?.company || 'Client',
          avatar: avatar || 'U'
        })

        // Load portal settings - first get global settings, then individual portal settings
        const { data: globalSettings } = await supabase
          .from('global_portal_settings')
          .select('settings, modules')
          .eq('account_id', portalData.account_id)
          .maybeSingle()

        // Get individual portal settings
        const { data: portalSettings } = await supabase
          .from('portal_settings')
          .select('settings, modules, project_visibility')
          .eq('portal_id', portalData.id)
          .maybeSingle()

        // Merge settings: individual portal settings override global settings
        const globalSettingsJson = globalSettings?.settings || {}
        const individualSettingsJson = portalSettings?.settings || {}
        
        // Merge function (individual overrides global)
        const mergeSettings = (global: any, individual: any) => {
          if (!individual || Object.keys(individual).length === 0) return global || {}
          if (!global || Object.keys(global).length === 0) return individual || {}
          
          const merged = { ...individual }
          Object.keys(global).forEach(key => {
            if (!(key in merged)) {
              merged[key] = global[key]
            } else if (
              typeof merged[key] === 'object' && 
              !Array.isArray(merged[key]) &&
              typeof global[key] === 'object' && 
              !Array.isArray(global[key])
            ) {
              merged[key] = { ...global[key], ...merged[key] }
            }
          })
          return merged
        }

        const settings = mergeSettings(globalSettingsJson, individualSettingsJson)
        
        setBrandColor(settings.brandColor || "#4647E0")
        setWelcomeMessage(settings.welcomeMessage || "")
        setLogoUrl(settings.logoUrl || "")
        setUseBackgroundImage(settings.useBackgroundImage || false)
        setBackgroundImageUrl(settings.backgroundImageUrl || "")
        setBackgroundColor(settings.backgroundColor || "#4647E0")
        setSidebarBgColor(settings.sidebarBgColor || "#FFFFFF")
        setSidebarTextColor(settings.sidebarTextColor || "#374151")
        setSidebarHighlightColor(settings.sidebarHighlightColor || settings.highlightColor || "#4647E0")
        setSidebarHighlightTextColor(settings.sidebarHighlightTextColor || settings.highlightTextColor || "#FFFFFF")
        setPortalFont(settings.portalFont || "Inter")
        
        // Merge module states from both sources
        const defaultModules = {
          home: true,
          tasks: true,
          invoices: true,
          forms: true,
          files: true,
          messages: true,
          contracts: true,
          appointments: true,
          activity: true
        }
        const globalModules = globalSettings?.modules || {}
        const individualModules = portalSettings?.modules || {}
        const mergedModules = { ...defaultModules, ...globalModules, ...individualModules }
        setModuleStates(settings.moduleStates || mergedModules || {})
        
        setClientTaskViews(settings.clientTaskViews || settings.taskViews || { milestones: true, board: true })
        setCompanyName(settings.companyName || "")

        // Get account info
        const { data: accountInfo } = await supabase
          .from('accounts')
          .select('id, company_name')
          .eq('id', portalData.account_id)
          .single()
        
        if (accountInfo) {
          setAccount({
            id: accountInfo.id,
            company_name: accountInfo.company_name || '',
            name: accountInfo.company_name || '',
            plan_tier: 'free',
            stripe_customer_id: null,
            subscription_status: null,
            trial_ends_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as Account)
        }

        // Load projects for this client_id from allowlist
        const { data: projectsData } = await supabase
          .from('projects')
          .select('*')
          .eq('account_id', portalData.account_id)
          .eq('client_id', allowlistEntry.client_id)
          .order('created_at', { ascending: false })

        setProjects(projectsData || [])

        // Initialize project visibility - default all projects to visible if not set
        if (projectsData && projectsData.length > 0) {
          // Get visibility from settings (defined earlier in the function)
          const currentVisibility = portalSettings?.project_visibility || settings.projectVisibility || {}
          // If visibility is empty, default all projects to visible
          if (!currentVisibility || Object.keys(currentVisibility).length === 0) {
            const defaultVisibility: Record<string, boolean> = {}
            projectsData.forEach(p => {
              defaultVisibility[p.id] = true
            })
            setProjectVisibility(defaultVisibility)
          } else {
            // Merge with existing visibility, defaulting new projects to visible
            const mergedVisibility: Record<string, boolean> = { ...currentVisibility }
            projectsData.forEach(p => {
              if (!(p.id in mergedVisibility)) {
                mergedVisibility[p.id] = true // Default to visible for new projects
              }
            })
            setProjectVisibility(mergedVisibility)
          }
        } else {
          // No projects, set empty visibility
          setProjectVisibility({})
        }

        // Set default project
        if (projectsData && projectsData.length > 0) {
          const defaultProj = settings.defaultProject
          // Handle 'newest', null, or undefined - use first project (newest by created_at)
          if (defaultProj === 'newest' || !defaultProj || defaultProj === null) {
            setSelectedProject(projectsData[0].id)
          } else if (defaultProj && projectsData.find(p => p.id === defaultProj)) {
            // Use the specified default project if it exists
            setSelectedProject(defaultProj)
          } else {
            // Fallback to first project if default doesn't exist
            setSelectedProject(projectsData[0].id)
          }
        } else {
          // No projects available
          setSelectedProject('')
        }

        // Load other data using client_id from allowlist
        const clientId = allowlistEntry.client_id
        
        // Get project IDs for this client to filter tasks and milestones
        const projectIds = projectsData?.map(p => p.id) || []
        
        const [invoicesRes, filesRes, tasksRes, milestonesRes, contractsRes, formsRes, submissionsRes, messagesRes, bookingsRes] = await Promise.all([
          supabase.from('invoices').select('*').eq('account_id', portalData.account_id).eq('client_id', clientId).order('created_at', { ascending: false }),
          supabase.from('files').select('*').eq('account_id', portalData.account_id).eq('client_id', clientId).order('created_at', { ascending: false }),
          // Use project_tasks table and filter by project_id
          projectIds.length > 0 
            ? supabase.from('project_tasks').select('*').in('project_id', projectIds).order('created_at', { ascending: false })
            : Promise.resolve({ data: [], error: null }),
          // Use project_milestones table and filter by project_id, order by sort_order
          projectIds.length > 0
            ? supabase.from('project_milestones').select('*').in('project_id', projectIds).order('sort_order', { ascending: true })
            : Promise.resolve({ data: [], error: null }),
          supabase.from('contracts').select('*').eq('account_id', portalData.account_id).eq('client_id', clientId).order('created_at', { ascending: false }),
          supabase.from('forms').select('*').eq('account_id', portalData.account_id).order('created_at', { ascending: false }),
          supabase.from('form_submissions').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
          supabase.from('messages').select('*').eq('account_id', portalData.account_id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').eq('account_id', portalData.account_id).order('start_time', { ascending: false })
        ])

        setInvoices(invoicesRes.data || [])
        setFiles(filesRes.data || [])
        setTasks(tasksRes.data || [])
        setMilestones(milestonesRes.data || [])
        setContracts(contractsRes.data || [])
        setForms(formsRes.data || [])
        setFormSubmissions(submissionsRes.data || [])
        setMessages(messagesRes.data || [])
        setBookings(bookingsRes.data || [])

        // Load project activities for latest activity section
        if (projectIds.length > 0) {
          const { data: activitiesData, error: activitiesError } = await supabase
            .from('project_activities')
            .select('*')
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })
            .limit(50)
          
          if (activitiesError) {
            console.error('Error loading project activities:', activitiesError)
          }
          console.log('Loaded project activities:', activitiesData?.length || 0)
          setProjectActivities(activitiesData || [])
        } else {
          setProjectActivities([])
        }

    } catch (error) {
        console.error('Error loading portal data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPortalData()
  }, [authenticated, slug])

  if (!authenticated || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4647E0] mx-auto mb-4" />
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    )
  }

  if (!portal || !client) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-900 font-semibold mb-2">Portal not found</p>
          <p className="text-gray-600">This portal does not exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {getGoogleFontUrl(portalFont) && (
        <link rel="stylesheet" href={getGoogleFontUrl(portalFont) as string} />
      )}
      
      {/* Client Sidebar */}
      <div className="w-64 flex flex-col overflow-y-auto border-r border-gray-200" style={{ backgroundColor: sidebarBgColor, fontFamily: portalFont }}>
          <style>{`
          .client-nav-item:hover:not(.active) {
              background-color: ${lightenColor(sidebarBgColor, 10)} !important;
              color: ${sidebarTextColor} !important;
            }
          `}</style>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {/* Client Branding Block */}
            <div className="flex flex-col items-center text-center mb-4 pb-4 border-b" style={{ borderColor: `${sidebarTextColor}20` }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                        alt="Company logo"
                        className="h-14 w-14 mb-3 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                  }}
                    />
                  ) : (
                    <Avatar className="h-14 w-14 mb-3">
                      <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-lg">
                    {client.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="w-full">
                    <div className="text-base font-bold truncate" style={{ color: sidebarTextColor }}>
                      {companyName || account?.company_name || client.company}
                    </div>
                  </div>
                </div>

                {/* Project Selector */}
                {projects.length > 0 && (
                  <div className="px-3 mb-3">
                    <Label htmlFor="project-select" className="text-xs mb-1.5 block" style={{ color: sidebarTextColor }}>
                      Project
                    </Label>
                    <select
                      id="project-select"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4647E0] focus:border-transparent"
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                    >
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Separator className="my-2" />

                {/* Navigation Items */}
                {sections.filter(section => {
              // Always show home
              if (section.id === 'home') return true
                  // Show other sections only if enabled in moduleStates
                  return moduleStates[section.id] !== false
                }).map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                  className={`client-nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl ${isActive ? "active shadow-md" : ""}`}
                      style={isActive ? { backgroundColor: sidebarHighlightColor, color: sidebarHighlightTextColor } : { color: sidebarTextColor }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
              </div>
        </ScrollArea>
            </div>

            {/* Portal Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50" style={{ fontFamily: portalFont }}>
            <PortalPreview
              section={activeSection}
              brandColor={brandColor}
              welcomeMessage={welcomeMessage}
          logoUrl={logoUrl}
          backgroundImageUrl={useBackgroundImage ? backgroundImageUrl : ''}
              backgroundColor={!useBackgroundImage ? backgroundColor : ''}
              client={client}
          projects={projects}
              invoices={invoices}
              files={files}
              tasks={tasks}
              contracts={contracts}
              forms={forms}
              formSubmissions={formSubmissions}
              messages={messages}
              bookings={bookings}
              selectedProject={selectedProject}
              onProjectChange={setSelectedProject}
              taskViews={clientTaskViews}
              milestones={milestones}
              account={account}
              onTaskViewsChange={setClientTaskViews}
              onContractsUpdate={(updatedContract) => {
                setContracts(prev => prev.map(c => c.id === updatedContract.id ? updatedContract : c))
              }}
              projectActivities={projectActivities}
            />
            </div>
    </div>
  )
}
