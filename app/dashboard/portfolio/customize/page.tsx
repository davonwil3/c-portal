"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  RotateCcw, 
  Save, 
  Globe, 
  Copy, 
  CheckCircle2,
  X,
  ArrowLeft,
  Undo,
  Redo,
  Edit2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PortfolioPreview } from "../components/PortfolioPreview"
import { ControlPanel } from "../components/ControlPanel"
import { ServiceModal } from "../components/ServiceModal"
import { ProjectModal } from "../components/ProjectModal"
import { TestimonialModal } from "../components/TestimonialModal"
import { ContactModal } from "../components/ContactModal"
import { ShareModal } from "../components/ShareModal"
import { TemplateSelector } from "../components/TemplateSelector"
import { Status, Service, Project, Testimonial, ContactItem, PortfolioData } from "../types"
import { buildAuraMockData, buildMinimalistMockData, buildShiftMockData, buildInnovateMockData } from "../data/mockData"
import { savePortfolio, getUserPortfolios, getPortfolio, getPortfolioAnalytics } from "@/lib/portfolio"
import { getCurrentAccount, getCurrentUser, getUserProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { useTour } from "@/contexts/TourContext"
import { toast } from "sonner"

export default function PortfolioBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isTourRunning, currentTour } = useTour()
  const [status, setStatus] = useState<Status>("draft")
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [showTemplateConfirmModal, setShowTemplateConfirmModal] = useState(false)
  const [showNameRequiredModal, setShowNameRequiredModal] = useState(false)
  const [originalTemplateFromDb, setOriginalTemplateFromDb] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingSaveAction, setPendingSaveAction] = useState<'save' | 'publish' | null>(null)
  
  // Modals
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTestimonialModal, setShowTestimonialModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [portfolioId, setPortfolioId] = useState<string | undefined>(undefined)
  const [publicUrl, setPublicUrl] = useState<string>("")

  const [portfolioData, setPortfolioData] = useState<PortfolioData>(buildAuraMockData())
  
  // Undo/Redo history
  const [history, setHistory] = useState<PortfolioData[]>([buildAuraMockData()])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Helper function to pre-populate portfolio with account data
  const prePopulateWithAccountData = async (templateData: PortfolioData, forceUpdate: boolean = false): Promise<PortfolioData> => {
    try {
      const account = await getCurrentAccount()
      const user = await getCurrentUser()
      const profile = user ? await getUserProfile(user.id) : null
      
      if (!account && !profile) return templateData
      
      // Initialize branding if it doesn't exist
      if (!templateData.branding) {
        templateData.branding = {}
      }
      
      // Pre-populate logo in branding (always update if account has logo and forceUpdate is true, or if portfolio doesn't have one)
      if (account?.logo_url && (forceUpdate || !templateData.branding.logo)) {
        templateData.branding = {
          ...templateData.branding,
          logo: account.logo_url
        }
      }
      
      // Pre-populate logo text with company name if no logo (always update if forceUpdate is true)
      if (account?.company_name && !templateData.branding.logo && (forceUpdate || !templateData.branding.logoText)) {
        templateData.branding = {
          ...templateData.branding,
          logoText: account.company_name
        }
      }
      
      // Initialize footer if it doesn't exist
      if (!templateData.footer) {
        templateData.footer = { companyName: '' }
      }
      
      // Pre-populate company name in footer (always update if forceUpdate is true, or if portfolio doesn't have one)
      if (account?.company_name && (forceUpdate || !templateData.footer.companyName)) {
        templateData.footer = {
          ...templateData.footer,
          companyName: account.company_name
        }
      }
      
      // Pre-populate contact items with account/profile data
      const contactItems = [...(templateData.contactItems || [])]
      
      // Update or add email
      const emailIndex = contactItems.findIndex(item => item.label.toLowerCase() === 'email')
      if (profile?.email) {
        if (emailIndex >= 0) {
          // Update existing email if forceUpdate is true
          if (forceUpdate) {
            contactItems[emailIndex] = {
              ...contactItems[emailIndex],
              value: profile.email
            }
          }
        } else {
          // Add email if not exists
          contactItems.push({
            id: `email-${Date.now()}`,
            icon: 'Mail',
            label: 'Email',
            value: profile.email
          })
        }
      }
      
      // Update or add phone
      const phoneIndex = contactItems.findIndex(item => item.label.toLowerCase() === 'phone')
      if (profile?.phone) {
        if (phoneIndex >= 0) {
          // Update existing phone if forceUpdate is true
          if (forceUpdate) {
            contactItems[phoneIndex] = {
              ...contactItems[phoneIndex],
              value: profile.phone
            }
          }
        } else {
          // Add phone if not exists
          contactItems.push({
            id: `phone-${Date.now()}`,
            icon: 'Phone',
            label: 'Phone',
            value: profile.phone
          })
        }
      }
      
      // Update or add address
      const addressIndex = contactItems.findIndex(item => item.label.toLowerCase() === 'address' || item.label.toLowerCase() === 'location')
      if (account?.address) {
        if (addressIndex >= 0) {
          // Update existing address if forceUpdate is true
          if (forceUpdate) {
            contactItems[addressIndex] = {
              ...contactItems[addressIndex],
              value: account.address
            }
          }
        } else {
          // Add address if not exists
          contactItems.push({
            id: `address-${Date.now()}`,
            icon: 'MapPin',
            label: 'Location',
            value: account.address
          })
        }
      }
      
      templateData.contactItems = contactItems
      
      return templateData
    } catch (error) {
      console.error('Error pre-populating account data:', error)
      return templateData
    }
  }

  // Load existing portfolio data on mount
  useEffect(() => {
    const loadExistingPortfolio = async () => {
      try {
        // Check if user is coming from template selector
        const selectedTemplate = searchParams.get('template')
        
        if (selectedTemplate) {
          // User selected a template, initialize with that template
          const templates = {
            'aura': buildAuraMockData(),
            'minimalist': buildMinimalistMockData(),
            'shift': buildShiftMockData(),
            'innovate': buildInnovateMockData()
          }
          
          let templateData = templates[selectedTemplate as keyof typeof templates] || buildAuraMockData()
          // Pre-populate with account data
          templateData = await prePopulateWithAccountData(templateData)
          setPortfolioData(templateData)
          setHistory([templateData])
          setHistoryIndex(0)
        } else {
          // Try to load existing portfolio
          const portfolios = await getUserPortfolios()
          if (portfolios && portfolios.length > 0) {
            // Load the most recent portfolio with full data
            const latestPortfolio = portfolios[0]
            const fullPortfolio = await getPortfolio(latestPortfolio.id)
            
            if (fullPortfolio) {
              // Pre-populate with account data (merge in any missing fields)
              const populatedPortfolio = await prePopulateWithAccountData(fullPortfolio, false)
              console.log('📂 Loaded portfolio:', {
                id: latestPortfolio.id,
                template: populatedPortfolio.appearance.layoutStyle,
                hasBranding: !!populatedPortfolio.branding,
                hasFooter: !!populatedPortfolio.footer,
                servicesCount: populatedPortfolio.services?.length || 0,
                projectsCount: populatedPortfolio.projects?.length || 0,
                testimonialsCount: populatedPortfolio.testimonials?.length || 0
              })
              setPortfolioId(latestPortfolio.id)
              setStatus(latestPortfolio.status)
              setPortfolioData(populatedPortfolio)
              setHistory([populatedPortfolio])
              setHistoryIndex(0)
              // Store the original template from database
              setOriginalTemplateFromDb(populatedPortfolio.appearance.layoutStyle)
              
              // Load public URL - only set URL if published, check custom_domain first, then analytics.domain, then fallback
              if (latestPortfolio.status === 'published' && latestPortfolio.id) {
                // Check for custom domain first
                if (latestPortfolio.custom_domain) {
                  setPublicUrl(`https://${latestPortfolio.custom_domain}`)
                } else {
                  // Try to get analytics domain
                  const analytics = await getPortfolioAnalytics(latestPortfolio.id)
                  if (analytics && analytics.domain) {
                    setPublicUrl(`https://${analytics.domain}.jolix.io`)
                  } else if (latestPortfolio.public_url) {
                    setPublicUrl(latestPortfolio.public_url)
                  } else {
                    // Generate URL from hero name
                    const domain = fullPortfolio.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')
                    setPublicUrl(`https://${domain}.jolix.io`)
                  }
                }
              } else {
                // Draft or no portfolio - don't set URL, will show "Publish to get a URL"
                setPublicUrl("")
              }
            } else {
              // No portfolio exists yet, pre-populate default with account data
              let defaultData = buildAuraMockData()
              defaultData = await prePopulateWithAccountData(defaultData)
              setPortfolioData(defaultData)
              // Don't set URL for new drafts - will show "Publish to get a URL"
              setPublicUrl("")
            }
          } else {
            // No portfolios exist, pre-populate default with account data
            let defaultData = buildAuraMockData()
            defaultData = await prePopulateWithAccountData(defaultData)
            setPortfolioData(defaultData)
            // Don't set URL for new drafts - will show "Publish to get a URL"
            setPublicUrl("")
          }
        }
      } catch (error) {
        console.error('Error loading portfolio:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadExistingPortfolio()
  }, [searchParams])

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Z for undo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1
          setHistoryIndex(newIndex)
          setPortfolioData(history[newIndex])
          setHasChanges(true)
        }
      }
      // Cmd/Ctrl + Shift + Z for redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        if (historyIndex < history.length - 1) {
          const newIndex = historyIndex + 1
          setHistoryIndex(newIndex)
          setPortfolioData(history[newIndex])
          setHasChanges(true)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [historyIndex, history])

  // Show loading state while fetching portfolio data
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3C3CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your portfolio...</p>
        </div>
      </div>
    )
  }

  const handleDataChange = (newData: Partial<PortfolioData>) => {
    console.log('🟢 customize/page handleDataChange called with:', Object.keys(newData))
    if (newData.hero) {
      console.log('🟢 Hero update - avatar length:', newData.hero.avatar?.length || 0)
    }
    // Deep merge nested objects properly
    const updatedData = { ...portfolioData }
    
    // Handle nested object updates properly - always merge if key exists in newData
    if (newData.hasOwnProperty('hero') && newData.hero) {
      updatedData.hero = { ...portfolioData.hero, ...newData.hero }
      console.log('🟢 Updated hero, new avatar length:', updatedData.hero.avatar?.length || 0)
      
      // Update URL if hero name changed - only if published
      if (newData.hero.name && newData.hero.name !== portfolioData.hero.name && status === "published") {
        // Only update URL if we don't have a custom domain (check if URL contains a custom domain)
        // Custom domains won't contain '.jolix.io', so if it does, we can update it
        if (!publicUrl || publicUrl.includes('.jolix.io')) {
          const domain = newData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')
          setPublicUrl(`https://${domain}.jolix.io`)
        }
      }
    }
    if (newData.hasOwnProperty('about') && newData.about) {
      updatedData.about = { ...portfolioData.about, ...newData.about }
    }
    if (newData.hasOwnProperty('contact') && newData.contact) {
      updatedData.contact = { ...portfolioData.contact, ...newData.contact }
    }
    if (newData.hasOwnProperty('appearance') && newData.appearance) {
      updatedData.appearance = { ...portfolioData.appearance, ...newData.appearance }
    }
    if (newData.hasOwnProperty('branding') && newData.branding) {
      updatedData.branding = { ...portfolioData.branding, ...newData.branding }
    }
    if (newData.hasOwnProperty('behavior') && newData.behavior) {
      updatedData.behavior = { ...portfolioData.behavior, ...newData.behavior }
    }
    if (newData.hasOwnProperty('seo') && newData.seo) {
      updatedData.seo = { ...portfolioData.seo, ...newData.seo }
    }
    if (newData.hasOwnProperty('footer') && newData.footer) {
      updatedData.footer = { ...portfolioData.footer, ...newData.footer }
    }
    if (newData.hasOwnProperty('sectionHeaders')) {
      updatedData.sectionHeaders = { ...portfolioData.sectionHeaders, ...newData.sectionHeaders }
    }
    
    // For arrays and other non-nested objects
    if (newData.hasOwnProperty('services') && newData.services) updatedData.services = newData.services
    if (newData.hasOwnProperty('projects') && newData.projects) updatedData.projects = newData.projects
    if (newData.hasOwnProperty('testimonials') && newData.testimonials) updatedData.testimonials = newData.testimonials
    if (newData.hasOwnProperty('contactItems') && newData.contactItems) updatedData.contactItems = newData.contactItems
    if (newData.hasOwnProperty('socialLinks') && newData.socialLinks) updatedData.socialLinks = newData.socialLinks
    if (newData.hasOwnProperty('modules') && newData.modules) updatedData.modules = newData.modules
    if (newData.hasOwnProperty('modulesOrder') && newData.modulesOrder) updatedData.modulesOrder = newData.modulesOrder
    
    console.log('🟢 Setting portfolio data')
    setPortfolioData(updatedData)
    setHasChanges(true)
    
    // Add to history with deep copy
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(updatedData))) // Deep copy
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    console.log('🟢 State updated successfully')
  }
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setPortfolioData(history[newIndex])
      setHasChanges(true)
    }
  }
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setPortfolioData(history[newIndex])
      setHasChanges(true)
    }
  }

  const handleSave = async () => {
    // During tour, prevent actual saves
    if (isTourRunning && currentTour?.id === "portfolio") {
      toast.success("Portfolio saved (tour mode)")
      setHasChanges(false)
      return
    }

    // Check if portfolio name is still the default
    const defaultNames = ['Your Name', 'Your Portfolio', 'My Portfolio', 'Portfolio']
    const isDefaultName = defaultNames.includes(portfolioData.hero.name.trim())
    
    if (isDefaultName && !portfolioId) {
      // First time saving with default name - require custom name
      setPendingSaveAction('save')
      setShowNameRequiredModal(true)
      return
    }

    // Check if template has changed from the original database template
    if (originalTemplateFromDb && portfolioData.appearance.layoutStyle !== originalTemplateFromDb) {
      console.log('Template changed from', originalTemplateFromDb, 'to', portfolioData.appearance.layoutStyle)
      setShowTemplateConfirmModal(true)
      return
    }

    // Regular save - proceed immediately
    await performSave('draft')
  }

  const performSave = async (status: 'draft' | 'published') => {
    setIsSaving(true)
    try {
      console.log('💾 Saving portfolio with data:', {
        portfolioId: portfolioId || 'none (will check for existing)',
        template: portfolioData.appearance.layoutStyle,
        name: portfolioData.hero.name,
        hasBranding: !!portfolioData.branding,
        hasFooter: !!portfolioData.footer
      })
      const result = await savePortfolio(portfolioData, status, portfolioId)
      
      if (result.success) {
        // ALWAYS set the portfolio ID - this ensures state is updated
        const finalPortfolioId = result.portfolioId || portfolioId
        if (finalPortfolioId) {
          console.log('✅ Portfolio saved with ID:', finalPortfolioId)
          setPortfolioId(finalPortfolioId)
          
          // Reload the portfolio from database to ensure we have the latest data
          console.log('🔄 Reloading portfolio from database...')
          const reloadedPortfolio = await getPortfolio(finalPortfolioId)
          if (reloadedPortfolio) {
            // Pre-populate with account data
            const populatedPortfolio = await prePopulateWithAccountData(reloadedPortfolio, false)
            setPortfolioData(populatedPortfolio)
            setHistory([populatedPortfolio])
            setHistoryIndex(0)
            console.log('✅ Portfolio reloaded with latest data')
          }
        } else {
          // This shouldn't happen, but reload portfolios to get the ID
          console.warn('⚠️ No portfolio ID returned, reloading...')
          const portfolios = await getUserPortfolios()
          if (portfolios && portfolios.length > 0) {
            const newId = portfolios[0].id
            setPortfolioId(newId)
            const reloadedPortfolio = await getPortfolio(newId)
            if (reloadedPortfolio) {
              const populatedPortfolio = await prePopulateWithAccountData(reloadedPortfolio, false)
              setPortfolioData(populatedPortfolio)
              setHistory([populatedPortfolio])
              setHistoryIndex(0)
            }
          }
        }
        
        // Update original template after successful save
        setOriginalTemplateFromDb(portfolioData.appearance.layoutStyle)
        setHasChanges(false)
        showToastMessage(status === 'published' ? "Portfolio published!" : "Changes saved")
        
        if (status === 'published') {
          setStatus("published")
          // Update public URL after publishing - check custom_domain first
          if (finalPortfolioId) {
            // Fetch raw portfolio record to get custom_domain
            const supabase = createClient()
            const { data: portfolioRecord } = await supabase
              .from('portfolios')
              .select('custom_domain')
              .eq('id', finalPortfolioId)
              .single()
            
            if (portfolioRecord?.custom_domain) {
              setPublicUrl(`https://${portfolioRecord.custom_domain}`)
            } else {
              const analytics = await getPortfolioAnalytics(finalPortfolioId)
              if (analytics && analytics.domain) {
                setPublicUrl(`https://${analytics.domain}.jolix.io`)
              }
            }
          }
        }
      } else {
        console.error("❌ Save failed:", result.error)
        showToastMessage(result.error || `Failed to ${status === 'published' ? 'publish' : 'save'} portfolio`)
      }
    } catch (error: any) {
      console.error("❌ Error saving portfolio:", error)
      showToastMessage(error.message || `Failed to ${status === 'published' ? 'publish' : 'save'} portfolio`)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    // During tour, prevent actual publishes
    if (isTourRunning && currentTour?.id === "portfolio") {
      toast.success("Portfolio published (tour mode)")
      setStatus("published")
      setHasChanges(false)
      return
    }

    // Check if portfolio name is still the default
    const defaultNames = ['Your Name', 'Your Portfolio', 'My Portfolio', 'Portfolio']
    const isDefaultName = defaultNames.includes(portfolioData.hero.name.trim())
    
    if (isDefaultName && !portfolioId) {
      // First time publishing with default name - require custom name
      setPendingSaveAction('publish')
      setShowNameRequiredModal(true)
      return
    }

    await performSave('published')
  }

  const handleDiscard = () => {
    setHasChanges(false)
    showToastMessage("Changes discarded")
  }

  const copyPublicUrl = () => {
    // Only allow copying if published
    if (status !== "published") {
      return
    }
    
    // Get the URL to copy - use publicUrl if available, otherwise generate from hero name
    const urlToCopy = publicUrl || (portfolioData.hero.name 
      ? `https://${portfolioData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')}.jolix.io`
      : '')
    
    if (urlToCopy) {
      navigator.clipboard.writeText(urlToCopy)
      showToastMessage("Link copied!")
    }
  }

  const showToastMessage = (message: string) => {
    setShowToast(message)
    setTimeout(() => setShowToast(null), 3000)
  }

  // Show full-screen preview if requested
  if (previewMode) {
    return (
      <div className="h-screen w-full overflow-auto">
        <div className="fixed top-4 right-4 z-50">
          <Button 
            onClick={() => setPreviewMode(false)}
            className="bg-gray-900 text-white hover:bg-gray-800 shadow-lg"
          >
            <X className="w-4 h-4 mr-2" />
            Exit Preview
          </Button>
        </div>
        <PortfolioPreview
          data={portfolioData}
          editMode={false}
          onDataChange={() => {}}
          onManageServices={() => {}}
          onManageProjects={() => {}}
          onManageTestimonials={() => {}}
        />
      </div>
    )
  }

  // Show template selector if requested
  if (showTemplateSelector) {
    return (
      <div className="min-h-screen bg-white">
        <TemplateSelector
          currentTemplate={portfolioData.appearance.layoutStyle}
          onSelectTemplate={async (templateId) => {
            if (templateId === portfolioData.appearance.layoutStyle) {
              setShowTemplateSelector(false)
              return
            }
            
            // During tour, allow viewing templates but don't actually change them
            if (isTourRunning && currentTour?.id === "portfolio") {
              // Just show the template visually for the tour, but don't save
              let newData: PortfolioData
              if (templateId === 'minimalist') {
                newData = buildMinimalistMockData()
              } else if (templateId === 'shift') {
                newData = buildShiftMockData()
              } else if (templateId === 'innovate') {
                newData = buildInnovateMockData()
              } else {
                newData = buildAuraMockData()
              }
              
              // Pre-populate with account data when changing templates (force update to get latest data)
              const populatedData = await prePopulateWithAccountData(newData, true)
              setPortfolioData(populatedData)
              setHistory([populatedData])
              setHistoryIndex(0)
              setHasChanges(false) // Don't mark as changed during tour
              setShowTemplateSelector(false)
              showToastMessage("Template preview (tour mode)")
              return
            }
            
            // Immediately switch to the new template
            let newData: PortfolioData
            if (templateId === 'minimalist') {
              newData = buildMinimalistMockData()
            } else if (templateId === 'shift') {
              newData = buildShiftMockData()
            } else if (templateId === 'innovate') {
              newData = buildInnovateMockData()
            } else {
              newData = buildAuraMockData()
            }
            
            // Pre-populate with account data when changing templates (force update to get latest data)
            const populatedData = await prePopulateWithAccountData(newData, true)
            setPortfolioData(populatedData)
            setHistory([populatedData])
            setHistoryIndex(0)
            setHasChanges(true)
            setShowTemplateSelector(false)
            showToastMessage("Template applied! Click 'Save' to set as your default template.")
          }}
          onBack={() => setShowTemplateSelector(false)}
        />
      </div>
    )
  }

  // Service handlers
  const handleAddService = (service: Omit<Service, "id">) => {
    const newService = { ...service, id: Date.now().toString() }
    handleDataChange({ services: [...portfolioData.services, newService] })
    setShowServiceModal(false)
    showToastMessage("Service added")
  }

  const handleEditService = (service: Service) => {
    const updated = portfolioData.services.map((s: Service) => s.id === service.id ? service : s)
    handleDataChange({ services: updated })
    setShowServiceModal(false)
    setEditingItem(null)
    showToastMessage("Service updated")
  }

  const handleDeleteService = (id: string) => {
    const updated = portfolioData.services.filter((s: Service) => s.id !== id)
    handleDataChange({ services: updated })
    showToastMessage("Service deleted")
  }

  // Project handlers
  const handleAddProject = (project: Omit<Project, "id">) => {
    const newProject = { ...project, id: Date.now().toString() }
    handleDataChange({ projects: [...portfolioData.projects, newProject] })
    setShowProjectModal(false)
    showToastMessage("Project added")
  }

  const handleEditProject = (project: Project) => {
    const updated = portfolioData.projects.map((p: Project) => p.id === project.id ? project : p)
    handleDataChange({ projects: updated })
    setShowProjectModal(false)
    setEditingItem(null)
    showToastMessage("Project updated")
  }

  const handleDeleteProject = (id: string) => {
    const updated = portfolioData.projects.filter((p: Project) => p.id !== id)
    handleDataChange({ projects: updated })
    showToastMessage("Project deleted")
  }

  // Testimonial handlers
  const handleAddTestimonial = (testimonial: Omit<Testimonial, "id">) => {
    const newTestimonial = { ...testimonial, id: Date.now().toString() }
    handleDataChange({ testimonials: [...portfolioData.testimonials, newTestimonial] })
    setShowTestimonialModal(false)
    showToastMessage("Testimonial added")
  }

  const handleEditTestimonial = (testimonial: Testimonial) => {
    const updated = portfolioData.testimonials.map((t: Testimonial) => t.id === testimonial.id ? testimonial : t)
    handleDataChange({ testimonials: updated })
    setShowTestimonialModal(false)
    setEditingItem(null)
    showToastMessage("Testimonial updated")
  }

  const handleDeleteTestimonial = (id: string) => {
    const updated = portfolioData.testimonials.filter((t: Testimonial) => t.id !== id)
    handleDataChange({ testimonials: updated })
    showToastMessage("Testimonial deleted")
  }

  // Contact Item handlers
  const handleAddContactItem = (item: ContactItem) => {
    handleDataChange({ contactItems: [...portfolioData.contactItems, item] })
    setShowContactModal(false)
    showToastMessage("Contact item added")
  }

  const handleEditContactItem = (item: ContactItem) => {
    const updated = portfolioData.contactItems.map((c: ContactItem) => c.id === item.id ? item : c)
    handleDataChange({ contactItems: updated })
    setShowContactModal(false)
    setEditingItem(null)
    showToastMessage("Contact item updated")
  }

  const handleDeleteContactItem = (id: string) => {
    const updated = portfolioData.contactItems.filter((c: ContactItem) => c.id !== id)
    handleDataChange({ contactItems: updated })
    showToastMessage("Contact item deleted")
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Bar (Sticky) */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/portfolio')}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Portfolio Builder</h1>
            <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0">
              {portfolioData.appearance.layoutStyle === 'minimalist' 
                ? 'Minimalist' 
                : portfolioData.appearance.layoutStyle === 'shift' 
                ? 'Shift'
                : portfolioData.appearance.layoutStyle === 'innovate'
                ? 'Innovate'
                : 'Aura'}
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowTemplateSelector(true)}
              className="text-sm"
            >
              Change Template
            </Button>

            {/* Status Badge */}
            <Badge variant={status === "published" ? "default" : "secondary"}>
              {status === "published" ? "Published" : "Draft"}
            </Badge>

            {/* Public URL */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Globe className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 max-w-[200px] truncate">
                {status === "published" 
                  ? (publicUrl || (portfolioData.hero.name ? `https://${portfolioData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')}.jolix.io` : "Loading..."))
                  : "Publish to get a URL"
                }
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2" 
                onClick={copyPublicUrl}
                disabled={status !== "published" || (!publicUrl && !portfolioData.hero.name)}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                // Get the URL to open - use publicUrl if available, otherwise generate from hero name
                const urlToOpen = publicUrl || (portfolioData.hero.name 
                  ? `https://${portfolioData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-')}.jolix.io`
                  : '')
                
                if (urlToOpen) {
                  window.open(urlToOpen, '_blank', 'noopener,noreferrer')
                } else {
                  // Fallback: open preview in same page if no URL available
                  setPreviewMode(true)
                }
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </Button>
            <Button 
              variant="outline" 
              onClick={handleUndo} 
              disabled={historyIndex === 0}
              title="Undo (Cmd/Ctrl + Z)"
            >
              <Undo className="w-4 h-4 mr-2" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              onClick={handleRedo} 
              disabled={historyIndex === history.length - 1}
              title="Redo (Cmd/Ctrl + Shift + Z)"
            >
              <Redo className="w-4 h-4 mr-2" />
              Redo
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button onClick={handlePublish}>
              <Globe className="w-4 h-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden" data-help="portfolio-builder-workspace">
        {/* Left: Live Preview - Full Page */}
        <div className="flex-1 overflow-y-auto relative">
          {/* Floating Edit Mode Toggle - Sticky */}
          <div className="sticky top-4 flex justify-end pr-8 py-2 pointer-events-none" data-help="view-edit-toggle" style={{ position: 'sticky', top: '1rem', zIndex: 9999 }}>
            <div className="inline-flex rounded-xl border-2 border-gray-300 bg-white shadow-xl p-1.5 pointer-events-auto backdrop-blur-sm bg-white/95" style={{ zIndex: 9999 }}>
              <Button
                variant={!editMode ? "default" : "ghost"}
                size="default"
                onClick={() => setEditMode(false)}
                className="px-6 font-semibold"
                data-help="btn-view-mode"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                variant={editMode ? "default" : "ghost"}
                size="default"
                onClick={() => setEditMode(true)}
                className="px-6 font-semibold"
                data-help="btn-edit-mode"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>

          <div className="-mt-4" data-help="portfolio-preview">
            <PortfolioPreview
              data={portfolioData}
              editMode={editMode}
              onDataChange={handleDataChange}
              onManageServices={() => setShowServiceModal(true)}
              onManageProjects={() => setShowProjectModal(true)}
              onManageTestimonials={() => setShowTestimonialModal(true)}
            />
          </div>
        </div>

        {/* Right: Control Panel */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto" data-help="portfolio-control-panel">
          <ControlPanel
            data={portfolioData}
            onDataChange={handleDataChange}
            onOpenServiceModal={() => setShowServiceModal(true)}
            onOpenProjectModal={() => setShowProjectModal(true)}
            onOpenTestimonialModal={() => setShowTestimonialModal(true)}
            onOpenContactModal={() => setShowContactModal(true)}
            onEditService={(service: Service) => {
              setEditingItem(service)
              setShowServiceModal(true)
            }}
            onDeleteService={handleDeleteService}
            onEditProject={(project: Project) => {
              setEditingItem(project)
              setShowProjectModal(true)
            }}
            onDeleteProject={handleDeleteProject}
            onEditTestimonial={(testimonial: Testimonial) => {
              setEditingItem(testimonial)
              setShowTestimonialModal(true)
            }}
            onDeleteTestimonial={handleDeleteTestimonial}
            onEditContactItem={(item: ContactItem) => {
              setEditingItem(item)
              setShowContactModal(true)
            }}
            onDeleteContactItem={handleDeleteContactItem}
          />
        </div>
      </div>

      {/* Footer Bar (appears on change) */}
      {hasChanges && (
        <footer className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
              Unsaved changes
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                Save
              </Button>
              <Button onClick={handlePublish}>
                Publish
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* Toast Notifications */}
      {showToast && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>{showToast}</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 ml-2 hover:bg-gray-800"
              onClick={() => setShowToast(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ServiceModal
        open={showServiceModal}
        onClose={() => {
          setShowServiceModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditService : handleAddService}
        editingService={editingItem}
      />

      <ProjectModal
        open={showProjectModal}
        onClose={() => {
          setShowProjectModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditProject : handleAddProject}
        editingProject={editingItem}
      />

      <TestimonialModal
        open={showTestimonialModal}
        onClose={() => {
          setShowTestimonialModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditTestimonial : handleAddTestimonial}
        editingTestimonial={editingItem}
      />

      <ContactModal
        isOpen={showContactModal}
        onClose={() => {
          setShowContactModal(false)
          setEditingItem(null)
        }}
        onSave={editingItem ? handleEditContactItem : handleAddContactItem}
        editingItem={editingItem}
      />

      <ShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={publicUrl}
      />

      {/* Name Required Modal */}
      {showNameRequiredModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Customize Your Portfolio Name</h3>
            <p className="text-gray-600 mb-6">
              Please give your portfolio a unique name before saving. This will be used to create your portfolio URL.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portfolio Name *
                </label>
                <Input
                  type="text"
                  value={portfolioData.hero.name}
                  onChange={(e) => {
                    const newName = e.target.value
                    handleDataChange({ hero: { ...portfolioData.hero, name: newName } })
                  }}
                  placeholder="e.g., John's Portfolio"
                  className="w-full"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL will be: {portfolioData.hero.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '-') || 'your-portfolio'}.jolix.io
                </p>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNameRequiredModal(false)
                  setPendingSaveAction(null)
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const trimmedName = portfolioData.hero.name.trim()
                  if (!trimmedName || trimmedName.length < 2) {
                    showToastMessage("Please enter a portfolio name (at least 2 characters)")
                    return
                  }
                  
                  setShowNameRequiredModal(false)
                  const action = pendingSaveAction
                  setPendingSaveAction(null)
                  
                  if (action === 'publish') {
                    await performSave('published')
                  } else {
                    await performSave('draft')
                  }
                }}
                className="flex-1"
                disabled={!portfolioData.hero.name.trim() || portfolioData.hero.name.trim().length < 2}
              >
                {pendingSaveAction === 'publish' ? 'Publish' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Template Confirmation Modal */}
      {showTemplateConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold mb-4">Switch Your Default Template?</h3>
            <p className="text-gray-600 mb-6">
              You're switching from <strong>{originalTemplateFromDb}</strong> to <strong>{portfolioData.appearance.layoutStyle}</strong>. This will change your default portfolio template.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your current changes will be saved and this template will become your new default.
            </p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTemplateConfirmModal(false)
                  showToastMessage("Save cancelled")
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowTemplateConfirmModal(false)
                  
                  // During tour, prevent actual template changes
                  if (isTourRunning && currentTour?.id === "portfolio") {
                    toast.success("Template changed (tour mode)")
                    setHasChanges(false)
                    setOriginalTemplateFromDb(portfolioData.appearance.layoutStyle)
                    return
                  }
                  
                  setIsSaving(true)
                  try {
                    console.log('💾 Saving template change:', {
                      from: originalTemplateFromDb,
                      to: portfolioData.appearance.layoutStyle
                    })
                    const result = await savePortfolio(portfolioData, "draft", portfolioId)
                    
                    if (result.success) {
                      if (result.portfolioId) {
                        setPortfolioId(result.portfolioId)
                      }
                      setHasChanges(false)
                      // Update the original template after save
                      setOriginalTemplateFromDb(portfolioData.appearance.layoutStyle)
                      setShowTemplateConfirmModal(false)
                      showToastMessage("Template saved and set as your default!")
                    } else {
                      console.error("❌ Template save failed:", result.error)
                      showToastMessage(result.error || "Failed to save portfolio")
                    }
                  } catch (error: any) {
                    console.error("Error saving portfolio:", error)
                    showToastMessage(error.message || "Failed to save portfolio")
                  } finally {
                    setIsSaving(false)
                  }
                }}
                className="flex-1"
              >
                Save & Set as Default
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

