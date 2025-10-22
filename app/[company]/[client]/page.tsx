"use client"

import { useState, useEffect, use, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Download,
  Upload,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  PenTool,
  DollarSign,
  Menu,
  X,
  MoreHorizontal,
  LogOut,
  Loader2,
  FileText,
  MessageCircle,
  Send,
} from "lucide-react"
import { useParams, useSearchParams } from "next/navigation"
import { getProjectsByClient } from "@/lib/projects"
import { getInvoicesByClient } from "@/lib/invoices"
import { getFilesByClient, getFileUrl } from "@/lib/files"
import { getClientTags } from "@/lib/clients"
import { getPortalThemeClasses, getContrastTextColor, isLightColor } from "@/lib/color-utils"
import { getPortalLogoUrl } from "@/lib/storage"
import { createClient } from '@/lib/supabase/client'
import { getClientForms, submitForm, hasFormBeenSubmitted, type Form } from "@/lib/forms"
import { FormFillingModal } from "@/components/forms/form-filling-modal"
import { FormSubmissionViewer } from "@/components/forms/form-submission-viewer"
import { MessageChat } from "@/components/messages/message-chat"
import { SignatureModal } from "@/components/ui/signature-modal"
import { FileUploadModal } from "@/components/ui/file-upload-modal"

// Mock data based on client slug
const getClientData = (slug: string) => {
  const clientData = {
    "sarah-johnson": {
      clientName: "Sarah Johnson",
      name: "Sarah Johnson",
      email: "sarah.johnson@acmecorp.com",
      companyName: "Acme Corp",
      avatar: "SJ",
      // Branding settings
      branding: {
        logo: "/placeholder.svg?height=60&width=200&text=Acme+Corp+Logo",
        primaryColor: "#3C3CFF",
        headerBackgroundImage: "/placeholder.svg?height=300&width=1200&text=Header+Background",
        useBackgroundImage: true, // Toggle for using background image vs solid color
      },
      projects: [],
      actionItems: [],
      files: [],
      invoices: [],
      timeline: [],
    },
  }

  // If we have specific data for this slug, return it
  if (clientData[slug as keyof typeof clientData]) {
    return clientData[slug as keyof typeof clientData]
  }
  
  // Otherwise, return default data for any client slug
  return {
    clientName: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    name: slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    email: `${slug}@wilsontech.com`,
    companyName: "Wilson Tech",
    avatar: slug.split('-').map(word => word.charAt(0).toUpperCase()).join(''),
    // Branding settings
    branding: {
      logo: "/placeholder.svg?height=60&width=200&text=Wilson+Tech+Logo",
      primaryColor: "#3C3CFF",
      headerBackgroundImage: "/placeholder.svg?height=300&width=1200&text=Header+Background",
      useBackgroundImage: true,
    },
    projects: [],
    actionItems: [],
    files: [],
    invoices: [],
    timeline: [],
  }
}

export default function ClientPortalPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const clientSlug = params.client as string
  const companySlug = params.company as string
  const isPreview = searchParams.get('preview') === 'true'
  const clientData = getClientData(clientSlug)
  
  // Authentication state
  const [user, setUser] = useState<{
    email: string
    name: string
    role: string
    companySlug: string
    clientSlug: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [portalExists, setPortalExists] = useState<boolean | null>(null)
  const [portalLoading, setPortalLoading] = useState(true)

  // Check if portal exists
  useEffect(() => {
    const checkPortalExists = async () => {
      try {
        setPortalLoading(true)
        
        // In preview mode, assume portal exists to allow data loading
        if (isPreview) {
          setPortalExists(true)
          setPortalLoading(false)
          return
        }
        
        const response = await fetch('/api/client-portal/check-portal-exists', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companySlug,
            clientSlug
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setPortalExists(data.exists)
        } else {
          setPortalExists(false)
        }
      } catch (error) {
        console.error('Error checking portal existence:', error)
        setPortalExists(false)
      } finally {
        setPortalLoading(false)
      }
    }

    checkPortalExists()
  }, [companySlug, clientSlug, isPreview])

  // Track portal view
  const trackPortalView = async (portalId?: string) => {
    try {
      // Only track views for actual client portal, not preview
      if (isPreview) return

      // Use the passed portalId or get it from the client data
      const idToUse = portalId || realClientData?.portalId
      if (!idToUse) return

      console.log('Tracking portal view for portal:', idToUse)
      
      const response = await fetch(`/api/portals/${idToUse}/increment-view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result = await response.json()
        console.log('View tracked successfully:', result)
      } else {
        console.error('Failed to track view:', response.statusText)
      }
    } catch (error) {
      console.error('Error tracking portal view:', error)
    }
  }

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // In preview mode, verify user is authenticated and owns this portal
        if (isPreview) {
          // Verify user has access to this portal by checking if they can access the portal data
          // The API will handle authentication verification
          try {
            const response = await fetch(`/api/test-portal-data?clientSlug=${clientSlug}&companySlug=${companySlug}&preview=true`)
            const result = await response.json()
            
            if (!result.success) {
              console.log('User does not have access to this portal:', result.error)
              setLoading(false)
              // Redirect to dashboard if user is authenticated but doesn't have access
              // Redirect to auth if user is not authenticated
              if (response.status === 401) {
                window.location.href = '/auth'
              } else {
                window.location.href = '/dashboard'
              }
              return
            }

            // User has access, set preview user
            setUser({
              email: 'preview@example.com',
              name: 'Preview User',
              role: 'client',
              companySlug,
              clientSlug
            })
            setLoading(false)
            return
          } catch (error) {
            console.error('Error verifying portal access:', error)
            setLoading(false)
            window.location.href = '/auth'
            return
          }
        }

        const sessionData = localStorage.getItem('client_session')
        if (sessionData) {
          const session = JSON.parse(sessionData)
          
          // Check if session is for this client
          if (session.clientSlug === clientSlug && session.companySlug === companySlug) {
            // Check if session has expired locally first
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
              localStorage.removeItem('client_session')
              setUser(null)
              setLoading(false)
              window.location.href = `/${companySlug}?client=${clientSlug}`
              return
            }
            
            // Validate session with server
            const response = await fetch('/api/client-portal/validate-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionToken: session.sessionToken,
                companySlug,
                clientSlug
              }),
            })

            const result = await response.json()
            
            if (result.success) {
              setUser(result.data)
              setLoading(false)
            } else {
              // Session invalid or expired, clear it and redirect to login
              localStorage.removeItem('client_session')
              setUser(null)
              setLoading(false)
              // Redirect to login page for this portal
              window.location.href = `/${companySlug}?client=${clientSlug}`
            }
          } else {
            // Session is for different client, clear it
            localStorage.removeItem('client_session')
            setUser(null)
            setLoading(false)
          }
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
        setLoading(false)
        // Redirect to login page on error
        window.location.href = `/${companySlug}?client=${clientSlug}`
      }
    }

    checkSession()
  }, [clientSlug, companySlug, isPreview])

  // Fetch real data when user is authenticated
  useEffect(() => {
    const fetchRealData = async () => {
      if (!user) return
      
      try {
        setDataLoading(true)
        
        // First, we need to get the client_id from the client_allowlist
        // We'll use the test-portal-data API endpoint to get this information
        console.log('Fetching data for:', { clientSlug, companySlug, isPreview, user })
        
        const response = await fetch(`/api/test-portal-data?clientSlug=${clientSlug}&companySlug=${companySlug}&preview=${isPreview}`)
        const result = await response.json()
        
        console.log('API response:', result)
        
        if (result.success) {
          const { projects, invoices, files, contracts, allowlist, portalSettings, portalId, milestones, messages, branding } = result.data
          
          console.log('Data received:', { 
            projects: projects?.length || 0, 
            invoices: invoices?.length || 0, 
            files: files?.length || 0, 
            contracts: contracts?.length || 0, 
            allowlist, 
            portalSettings,
            milestones: milestones?.length || 0,
            messages: messages?.length || 0
          })
          console.log('Projects data:', projects)
          console.log('Portal settings:', portalSettings)

          
          // Apply project visibility from settings (if provided)
          let visibleProjects = projects || []
          console.log('Original projects count:', projects?.length || 0)
          console.log('Portal settings projectVisibility:', portalSettings?.projectVisibility)
          
          if (portalSettings?.projectVisibility && Object.keys(portalSettings.projectVisibility).length > 0) {
            const visibilityMap = portalSettings.projectVisibility as Record<string, boolean>
            console.log('Visibility map:', visibilityMap)
            
            // Check if any projects are actually visible
            const hasVisibleProjects = Object.values(visibilityMap).some(visible => visible)
            
            if (hasVisibleProjects) {
              visibleProjects = (projects || []).filter((p: any) => {
                const isVisible = visibilityMap[p.id]
                console.log(`Project ${p.id} (${p.name}) visibility:`, isVisible)
                return isVisible
              })
              console.log('After visibility filter:', visibleProjects.length)
            } else {
              // If no projects are marked as visible, show all projects (fallback)
              console.log('No projects marked as visible, showing all projects as fallback')
              visibleProjects = projects || []
            }
          } else {
            console.log('No visibility settings, showing all projects')
          }
          
          // Set real data from database
          console.log('Setting visible projects:', visibleProjects)
          
          // Add milestones to projects
          const projectsWithMilestones = visibleProjects.map(project => ({
            ...project,
            milestones: milestones?.filter(milestone => milestone.project_id === project.id) || []
          }))
          
          setRealProjects(projectsWithMilestones)
          setRealInvoices(invoices || [])
          setRealFiles(files || [])
          setRealContracts(contracts || [])
          setRealMilestones(milestones || [])
          setRealMessages(messages || [])

          // Track portal view after data is loaded
          await trackPortalView(portalId)

          // Load forms for this client
          if (allowlist?.client_id) {
            try {
              const forms = await getClientForms(allowlist.client_id)
              setRealForms(forms)
              
              // Check submission status for each form
              const submissionStatus: Record<string, boolean> = {}
              for (const form of forms) {
                try {
                  const response = await fetch(`/api/forms/check-submission?formId=${form.id}`)
                  const result = await response.json()
                  submissionStatus[form.id] = result.success ? result.isSubmitted : false
                  console.log(`Form ${form.id} submission status:`, submissionStatus[form.id])
                } catch (error) {
                  console.error(`Error checking submission status for form ${form.id}:`, error)
                  submissionStatus[form.id] = false
                }
              }
              console.log('All form submission statuses:', submissionStatus)
              setFormSubmissionStatus(submissionStatus)
            } catch (error) {
              console.error('Error loading forms:', error)
            }
          }
          setRealFiles(files || [])
          setRealContracts(contracts || [])
          
          // Set portal settings
          if (portalSettings) {
            setPortalModules(portalSettings.modules || {})
            setPortalSettings(portalSettings)
            setBrandColor(portalSettings.brandColor || '#3C3CFF')
            setLogoUrl(portalSettings.logoUrl || '')
            setWelcomeMessage(portalSettings.welcomeMessage || '')
          }

          // If a default project is configured and visible, select it
          if (portalSettings?.defaultProject) {
            const defaultProj = (visibleProjects || []).find((p: any) => p.id === portalSettings.defaultProject)
            if (defaultProj) {
              setSelectedProject(defaultProj)
            }
          }
          
          // Set client data
          setRealClientData({
            clientName: user.name || allowlist.name || clientData?.clientName,
            companyName: allowlist.company_name || clientData?.companyName,
            avatar: user.name ? user.name.split(' ').map(n => n[0]).join('') : clientData?.avatar,
            branding: branding || clientData?.branding, // Use real branding data from API
            accountId: allowlist.account_id || result.data.account?.id,
            clientId: allowlist.client_id, // Add client ID for AI assistant
            email: allowlist.email || user.email
          })
          
          console.log('Real data set successfully:', {
            projects: projects?.length || 0,
            invoices: invoices?.length || 0,
            files: files?.length || 0,
            clientData: {
              clientName: user.name || allowlist.name || clientData?.clientName,
              companyName: allowlist.company_name || clientData?.companyName,
              avatar: user.name ? user.name.split(' ').map(n => n[0]).join('') : clientData?.avatar,
              branding: clientData?.branding
            }
          })
        } else {
          console.error('Failed to fetch portal data:', result.message)
          // Fall back to empty arrays if there's an error
          setRealProjects([])
          setRealInvoices([])
          setRealFiles([])
          setRealContracts([])
          setRealMilestones([])
          setRealMessages([])
          setRealClientData(clientData)
        }
        
      } catch (error) {
        console.error('Error fetching real data:', error)
        // Fall back to empty arrays if there's an error
        setRealProjects([])
        setRealInvoices([])
        setRealFiles([])
        setRealContracts([])
        setRealMilestones([])
        setRealMessages([])
        setRealClientData(clientData)
      } finally {
        setDataLoading(false)
      }
    }
    
    // Only run if user exists and we haven't already fetched data
    // In preview mode, always fetch data to show real content
    if (user && (!hasFetchedData.current || isPreview)) {
      console.log('Fetching real data for preview mode:', { isPreview, user, clientSlug, companySlug })
      if (!isPreview) {
        hasFetchedData.current = true
      }
      fetchRealData()
    }
  }, [user, clientSlug, companySlug, isPreview])

  const logout = () => {
    localStorage.removeItem('client_session')
    setUser(null)
    // Redirect to login
    window.location.href = `/${companySlug}?client=${clientSlug}`
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [files, setFiles] = useState<any[]>([])

  const [selectedTimelineStep, setSelectedTimelineStep] = useState<any>(null)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)

  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)

  const [selectedPortalFile, setSelectedPortalFile] = useState<any>(null)
  const [isFileModalOpen, setIsFileModalOpen] = useState(false)
  const [fileViewUrl, setFileViewUrl] = useState<string | null>(null)

  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isContractModalOpen, setIsContractModalOpen] = useState(false)
  const [contractHtml, setContractHtml] = useState<string | null>(null)
  const [loadingContract, setLoadingContract] = useState(false)

  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [contractToSign, setContractToSign] = useState<any>(null)

  const [realForms, setRealForms] = useState<Form[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [formSubmissionStatus, setFormSubmissionStatus] = useState<Record<string, boolean>>({})
  const [selectedFormSubmission, setSelectedFormSubmission] = useState<any>(null)
  const [isFormSubmissionModalOpen, setIsFormSubmissionModalOpen] = useState(false)

  const [activeDocumentTab, setActiveDocumentTab] = useState<'contracts' | 'invoices' | 'forms' | 'files'>('contracts')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  
  // File upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [showClientFilesOnly, setShowClientFilesOnly] = useState(false)

  // Real data state
  const [realProjects, setRealProjects] = useState<any[]>([])
  const [realInvoices, setRealInvoices] = useState<any[]>([])
  const [realFiles, setRealFiles] = useState<any[]>([])
  const [realContracts, setRealContracts] = useState<any[]>([])
  const [realMilestones, setRealMilestones] = useState<any[]>([])
  const [realMessages, setRealMessages] = useState<any[]>([])
  const [realClientData, setRealClientData] = useState<any>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const hasFetchedData = useRef(false)
  const [portalModules, setPortalModules] = useState<Record<string, boolean>>({})
  const [portalSettings, setPortalSettings] = useState<any>(null)
  const [brandColor, setBrandColor] = useState('#3C3CFF')
  const [logoUrl, setLogoUrl] = useState('')
  const [welcomeMessage, setWelcomeMessage] = useState('')

  // Dynamic brand color styles and theme classes
  const themeClasses = getPortalThemeClasses(brandColor)
  const isLight = isLightColor(brandColor)
  const textColor = getContrastTextColor(brandColor)
  
  // Create dynamic styles for inline use
  const brandStyles = {
    '--brand-color': brandColor,
    '--brand-color-hover': brandColor + 'CC', // Add opacity
    '--brand-color-light': brandColor + '20', // Add opacity
  } as React.CSSProperties

  // Handle project selection
  const handleProjectSelect = (project: any) => {
    setSelectedProject(project)
  }

  // Set first project as selected by default
  useEffect(() => {
    if (realProjects.length > 0 && !selectedProject) {
      setSelectedProject(realProjects[0])
    }
  }, [realProjects, selectedProject])

  // Handle tab switching when modules are disabled
  useEffect(() => {
    if (portalModules && Object.keys(portalModules).length > 0) {
      // Check if current tab is still enabled
      const currentTabEnabled = 
        (activeDocumentTab === 'contracts' && portalModules.contracts !== false) ||
        (activeDocumentTab === 'invoices' && portalModules.invoices !== false) ||
        (activeDocumentTab === 'forms' && portalModules.forms !== false) ||
        (activeDocumentTab === 'files' && portalModules.files !== false)
      
      // If current tab is disabled, switch to first available tab
      if (!currentTabEnabled) {
        if (portalModules.contracts !== false) {
          setActiveDocumentTab('contracts')
        } else if (portalModules.invoices !== false) {
          setActiveDocumentTab('invoices')
        } else if (portalModules.forms !== false) {
          setActiveDocumentTab('forms')
        } else if (portalModules.files !== false) {
          setActiveDocumentTab('files')
        }
      }
    }
  }, [portalModules, activeDocumentTab])

  // Handle redirect to login if no user - MUST be at top level with other hooks
  useEffect(() => {
    if (!user && !loading) {
      window.location.href = `/${companySlug}?client=${clientSlug}`
    }
  }, [user, loading, companySlug, clientSlug])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    )
  }

  // Show loading while fetching data
  if (dataLoading && user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your data...</p>
        </div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600">The requested client portal could not be found.</p>
        </div>
      </div>
    )
  }



  if (!user) {
    // Redirect immediately to login page
    useEffect(() => {
      window.location.href = `/${companySlug}?client=${clientSlug}`
    }, [])
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }


  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return "📄"
      case "zip":
        return "📦"
      case "image":
        return "🖼️"
      case "document":
        return "📝"
      default:
        return "📄"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-700"
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "pending":
        return "bg-gray-100 text-gray-700"
      case "due":
        return "bg-red-100 text-red-700"
      case "paid":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleApproveFile = async (fileId: string) => {
    try {
      const response = await fetch('/api/files/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the real files state
        setRealFiles(realFiles.map((file) => 
          file.id === fileId 
            ? { ...file, approval_status: "approved" } 
            : file
        ))
        
        // Also update the mock files state for consistency
        setFiles(files.map((file) => 
          file.id === fileId 
            ? { ...file, status: "approved" } 
            : file
        ))
      } else {
        console.error('Failed to approve file:', result.error)
      }
    } catch (error) {
      console.error('Error approving file:', error)
    }
  }

  const handleAddComment = (fileId: number) => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: realClientData?.clientName || clientData.clientName,
        avatar: realClientData?.avatar || clientData.avatar,
        message: newComment,
        timestamp: "Just now",
        isClient: true,
      }

      setFiles(files.map((file) => (file.id === fileId ? { ...file, comments: [...file.comments, comment] } : file)))
      setNewComment("")
    }
  }

  const openCommentsModal = (file: any) => {
    setSelectedFile(file)
    setIsCommentsOpen(true)
  }

  const openTimelineModal = (step: any) => {
    setSelectedTimelineStep(step)
    setIsTimelineModalOpen(true)
  }

  const openInvoiceModal = (invoice: any) => {
    setSelectedInvoice(invoice)
    setIsInvoiceModalOpen(true)
  }

  const handlePayInvoice = async (invoice: any) => {
    // TODO: Implement payment processing
    console.log('Processing payment for invoice:', invoice.invoice_number || invoice.number)
    // For now, just show a success message
    alert(`Payment processing started for invoice ${invoice.invoice_number || invoice.number}`)
    setIsInvoiceModalOpen(false)
  }

  const openFileModal = async (file: any) => {
    try {
      setSelectedPortalFile(file)
      setIsFileModalOpen(true)
      const url = await getFileUrl(file.id)
      setFileViewUrl(url)
    } catch (error) {
      console.error('Error getting file URL:', error)
      alert('Failed to load file for viewing')
    }
  }

  const openContractModal = async (contract: any) => {
    setSelectedContract(contract)
    setIsContractModalOpen(true)
    setLoadingContract(true)
    
    try {
      // Fetch contract details including HTML content
      const response = await fetch(`/api/contracts/${contract.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch contract')
      }
      
      const contractData = await response.json()
      
      if (contractData.contract_html) {
        // Load HTML content from storage if available
        try {
          const supabase = createClient()
          const { data, error } = await supabase.storage
            .from('files')
            .download(contractData.contract_html)
          
          if (error) {
            console.error('Error loading contract HTML from storage:', error)
            // Fallback to contract content from database
            if (contractData.contract_content) {
              setContractHtml(generateContractDocument(contractData.contract_content, contractData))
            }
          } else {
            // Convert blob to text
            const htmlText = await data.text()
            setContractHtml(htmlText)
          }
        } catch (storageError) {
          console.error('Error accessing storage:', storageError)
          // Fallback to contract content from database
          if (contractData.contract_content) {
            setContractHtml(generateContractDocument(contractData.contract_content, contractData))
          }
        }
      } else if (contractData.contract_content) {
        // Fallback to contract content from database
        setContractHtml(generateContractDocument(contractData.contract_content, contractData))
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      // Generate fallback document
      if (contract.contract_content) {
        setContractHtml(generateContractDocument(contract.contract_content, contract))
      }
    } finally {
      setLoadingContract(false)
    }
  }

  // Handle contract signing
  const handleSignContract = (contract: any) => {
    setContractToSign(contract)
    setIsSignatureModalOpen(true)
  }

  const handleSignatureSave = async (signatureData: string) => {
    if (!contractToSign) return

    try {
      const response = await fetch('/api/contracts/sign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contractToSign.id,
          signatureData,
          clientId: realClientData?.client_id,
          projectId: selectedProject?.id
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update the contract in local state
        setRealContracts(prev => 
          prev.map(contract => {
            if (contract.id === contractToSign.id) {
              const updatedContract = { 
                ...contract, 
                client_signature_data: signatureData, 
                client_signature_status: 'signed',
                client_signed_at: new Date().toISOString()
              }
              
              // Determine the new status based on existing user signature
              if (contract.user_signature_status === 'signed') {
                updatedContract.status = 'signed'
                updatedContract.signature_status = 'signed'
                updatedContract.signed_at = new Date().toISOString()
              } else {
                updatedContract.status = 'partially_signed'
                updatedContract.signature_status = 'signed'
                updatedContract.signed_at = new Date().toISOString()
              }
              
              return updatedContract
            }
            return contract
          })
        )
        
        // Update the selected contract if it's the same one
        if (selectedContract && selectedContract.id === contractToSign.id) {
          const updatedSelectedContract = { 
            ...selectedContract, 
            client_signature_data: signatureData, 
            client_signature_status: 'signed',
            client_signed_at: new Date().toISOString()
          }
          
          // Determine the new status based on existing user signature
          if (selectedContract.user_signature_status === 'signed') {
            updatedSelectedContract.status = 'signed'
            updatedSelectedContract.signature_status = 'signed'
            updatedSelectedContract.signed_at = new Date().toISOString()
          } else {
            updatedSelectedContract.status = 'partially_signed'
            updatedSelectedContract.signature_status = 'signed'
            updatedSelectedContract.signed_at = new Date().toISOString()
          }
          
          setSelectedContract(updatedSelectedContract)
          
          // Regenerate contract HTML with signature
          if (selectedContract.contract_content) {
            setContractHtml(generateContractDocument(selectedContract.contract_content, updatedSelectedContract))
          }
        }
        
        // Close modals
        setIsSignatureModalOpen(false)
        setIsContractModalOpen(false)
        
        // Show success message
        alert('Contract signed successfully!')
      } else {
        throw new Error(result.error || 'Failed to sign contract')
      }
    } catch (error) {
      console.error('Error signing contract:', error)
      alert('Failed to sign contract. Please try again.')
    }
  }

  // Reload client data
  const reloadClientData = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/test-portal-data?clientSlug=${clientSlug}&companySlug=${companySlug}&preview=${isPreview}`)
      const result = await response.json()
      
      if (result.success) {
        const { projects, invoices, files, contracts, allowlist, portalSettings, portalId, milestones, messages, branding } = result.data
        
        // Apply project visibility from settings (if provided)
        let visibleProjects = projects || []
        if (portalSettings?.projectVisibility && Object.keys(portalSettings.projectVisibility).length > 0) {
          const visibilityMap = portalSettings.projectVisibility as Record<string, boolean>
          const hasVisibleProjects = Object.values(visibilityMap).some(visible => visible)
          
          if (hasVisibleProjects) {
            visibleProjects = (projects || []).filter((p: any) => visibilityMap[p.id])
          } else {
            visibleProjects = projects || []
          }
        }
        
        // Add milestones to projects
        const projectsWithMilestones = visibleProjects.map(project => ({
          ...project,
          milestones: milestones?.filter(milestone => milestone.project_id === project.id) || []
        }))
        
        setRealProjects(projectsWithMilestones)
        setRealInvoices(invoices || [])
        setRealFiles(files || [])
        setRealContracts(contracts || [])
        setRealMilestones(milestones || [])
        setRealMessages(messages || [])
      }
    } catch (error) {
      console.error('Error reloading client data:', error)
    }
  }

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file || !user) return

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companySlug', companySlug)
      formData.append('clientSlug', clientSlug)
      formData.append('description', `Uploaded by ${user.name || user.email}`)
      formData.append('isPreview', isPreview.toString())

      // Add client data for preview mode
      if (isPreview && realClientData) {
        formData.append('clientId', realClientData.clientId || '')
        formData.append('accountId', realClientData.accountId || '')
      }

      // Add project ID if a project is selected
      if (selectedProject) {
        formData.append('projectId', selectedProject.id)
      }

      // Only add session token if not in preview mode
      if (!isPreview) {
        const sessionData = localStorage.getItem('client_session')
        if (!sessionData) {
          throw new Error('No session found. Please log in again.')
        }
        
        const session = JSON.parse(sessionData)
        const sessionToken = session.sessionToken
        
        if (!sessionToken) {
          localStorage.removeItem('client_session')
          window.location.href = `/${companySlug}?client=${clientSlug}`
          return
        }
        
        formData.append('sessionToken', sessionToken)
      }

      console.log('Upload data:', {
        fileName: file.name,
        fileSize: file.size,
        companySlug,
        clientSlug,
        user: user.name || user.email,
        isPreview
      })

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 20
        })
      }, 200)

      const response = await fetch('/api/client-portal/upload-file', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadProgress(100)
        // Refresh the files list
        await reloadClientData()
        return Promise.resolve()
      } else {
        throw new Error(result.message || 'Failed to upload file')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const openFormModal = async (form: Form) => {
    setSelectedForm(form)
    setIsFormModalOpen(true)
  }

  const openFormSubmissionModal = async (form: Form) => {
    try {
      console.log('Opening form submission modal for form:', form.id)
      console.log('Using email:', realClientData?.email || clientData.email)
      
      // Fetch the form submission data
      const response = await fetch(`/api/forms/submissions?formId=${form.id}&email=${encodeURIComponent(realClientData?.email || clientData.email)}`)
      const result = await response.json()
      
      console.log('Form submission API response:', result)
      
      if (result.success && result.data) {
        setSelectedFormSubmission(result.data)
        setIsFormSubmissionModalOpen(true)
      } else {
        console.error('Error fetching form submission:', result.error)
        alert('Failed to load form submission: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error fetching form submission:', error)
      alert('Failed to load form submission: ' + error)
    }
  }

  const handleFormSubmitted = async () => {
    // Refresh form submission status for all forms
    try {
      const updatedStatus: Record<string, boolean> = {}
      for (const form of realForms) {
        try {
          const response = await fetch(`/api/forms/check-submission?formId=${form.id}`)
          const result = await response.json()
          updatedStatus[form.id] = result.success ? result.isSubmitted : false
        } catch (error) {
          console.error(`Error checking submission status for form ${form.id}:`, error)
          updatedStatus[form.id] = false
        }
      }
      setFormSubmissionStatus(updatedStatus)
    } catch (error) {
      console.error('Error refreshing form submission status:', error)
    }
  }

  // Handle PDF downloads
  const handleDownloadContractPDF = async (contract: any) => {
    try {
      // Create a temporary div with the contract content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.padding = '40px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      
      // Generate contract HTML content with signatures
      const contractContent = contract.contract_content || {}
      const htmlContent = generateContractDocument(contractContent, contract)
      tempDiv.innerHTML = htmlContent
      
      document.body.appendChild(tempDiv)
      
      // Convert to canvas and PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Clean up
      document.body.removeChild(tempDiv)
      
      // Download PDF
      pdf.save(`${contract.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_contract.pdf`)
      
      toast.success('Contract PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating contract PDF:', error)
      toast.error('Failed to download contract PDF')
    }
  }

  const handleDownloadInvoicePDF = async (invoice: any) => {
    try {
      // Create a temporary div with the invoice content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.padding = '40px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.lineHeight = '1.4'
      
      // Generate the HTML content
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
                ${invoice.title || 'Untitled Invoice'}
              </h1>
              <p style="color: #6B7280; margin: 0; font-size: 16px;">
                Invoice #${invoice.invoice_number}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="color: #6B7280; margin: 0; font-size: 14px;">Issue Date</p>
              <p style="font-weight: 600; margin: 0; font-size: 16px;">
                ${new Date(invoice.issue_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <!-- Invoice Details -->
          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Bill To:</h3>
                <p style="color: #6B7280; margin: 0; font-size: 14px;">${invoice.client_name || 'N/A'}</p>
              </div>
              <div>
                <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Amount Due:</h3>
                <p style="font-size: 24px; font-weight: bold; color: #111827; margin: 0;">
                  $${(invoice.total_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <!-- Invoice Items -->
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #111827; border-bottom: 1px solid #E5E7EB;">Description</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #111827; border-bottom: 1px solid #E5E7EB;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #374151;">
                    ${invoice.description || 'Service provided'}
                  </td>
                  <td style="padding: 12px; text-align: right; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #111827;">
                    $${(invoice.total_amount || 0).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Payment Terms -->
          <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px;">
            <h3 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">Payment Terms</h3>
            <p style="color: #6B7280; margin: 0; font-size: 14px;">
              ${invoice.payment_terms || 'Payment due within 30 days of invoice date.'}
            </p>
          </div>
        </div>
      `
      
      document.body.appendChild(tempDiv)
      
      // Convert to canvas and PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 800,
        height: tempDiv.scrollHeight,
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Clean up
      document.body.removeChild(tempDiv)
      
      // Download PDF
      pdf.save(`invoice_${invoice.invoice_number}_${invoice.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'invoice'}.pdf`)
      
      toast.success('Invoice PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating invoice PDF:', error)
      toast.error('Failed to download invoice PDF')
    }
  }

  const handleDownloadFile = async (file: any) => {
    try {
      if (file.file_url) {
        // Create a temporary link to download the file
        const link = document.createElement('a')
        link.href = file.file_url
        link.download = file.name || 'download'
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success('File downloaded successfully')
      } else {
        toast.error('File download URL not available')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  // Generate contract document from contract content as fallback
  const generateContractDocument = (content: any, contractData?: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.clientName || 'Contract'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 40px 20px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.125rem;
            color: #6b7280;
        }
        .content {
            padding: 0 40px 40px;
        }
        .section { 
            margin-bottom: 32px; 
        }
        .section h2 { 
            color: #111827; 
            border-bottom: 2px solid #3C3CFF; 
            padding-bottom: 8px; 
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .parties { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 24px; 
            margin-bottom: 32px; 
        }
        .party { 
            border-left: 4px solid #3C3CFF; 
            padding-left: 16px; 
        }
        .party h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .party p {
            color: #374151;
            margin-bottom: 4px;
        }
        .party .name {
            font-weight: 500;
            color: #111827;
        }
        .content-box {
            background-color: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .content-box p {
            color: #374151;
            margin: 0;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .payment-field {
            margin-bottom: 16px;
        }
        .payment-field label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
        }
        .payment-field input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
        }
        .payment-field textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
            resize: vertical;
            min-height: 80px;
        }
        .estimated-total {
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
        }
        .estimated-total .label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #1e40af;
        }
        .estimated-total .amount {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e3a8a;
        }
        .estimated-total .details {
            font-size: 0.75rem;
            color: #3b82f6;
        }
        .signature-section {
            margin-top: 32px;
        }
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .signature-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            background: white;
        }
        .signature-area h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .signature-area p {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
        }
        @media (max-width: 768px) {
            .parties, .payment-grid, .signature-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 0 20px 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONTRACT FOR SERVICES</h1>
            <p>This agreement is made and entered into as of ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>PARTIES</h2>
                <div class="parties">
                    <div class="party">
                        <h3>COMPANY</h3>
                        <p class="name">${content.companyName || 'Your Company'}</p>
                        ${content.companyAddress ? `<p>${content.companyAddress}</p>` : ''}
                    </div>
                    <div class="party">
                        <h3>CLIENT</h3>
                        <p class="name">${content.clientName || 'Client Name'}</p>
                        ${content.clientEmail ? `<p>${content.clientEmail}</p>` : ''}
                        ${content.clientAddress ? `<p>${content.clientAddress}</p>` : ''}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>1. PROJECT SCOPE</h2>
                <div class="content-box">
                    <p>${content.projectScope || 'Project scope to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>2. PAYMENT TERMS</h2>
                <div class="content-box">
                    ${content.paymentType === "fixed" ? `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Total Amount</label>
                                <input type="text" value="${content.totalAmount || '$0.00'}" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Deposit Amount</label>
                                <input type="text" value="${content.depositAmount || '$0.00'}" readonly />
                            </div>
                        </div>
                    ` : `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Hourly Rate</label>
                                <input type="text" value="${content.hourlyRate || '$0.00'}/hour" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Estimated Hours</label>
                                <input type="text" value="${content.estimatedHours || '0'} hours" readonly />
                            </div>
                        </div>
                        ${content.hourlyRate && content.estimatedHours ? `
                            <div class="estimated-total">
                                <div class="label">Estimated Total</div>
                                <div class="amount">$${(parseFloat(content.hourlyRate) * parseFloat(content.estimatedHours)).toFixed(2)}</div>
                                <div class="details">Based on ${content.estimatedHours} hours at $${content.hourlyRate}/hour</div>
                            </div>
                        ` : ''}
                    `}
                    <div class="payment-field" style="margin-top: 16px;">
                        <label>Payment Terms</label>
                        <textarea readonly>${content.paymentTerms || ''}</textarea>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>3. DELIVERABLES & MILESTONES</h2>
                <div class="content-box">
                    <p>${content.milestones || 'Project milestones to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>4. INTELLECTUAL PROPERTY</h2>
                <div class="content-box">
                    <p>${content.ipRights === "client" ? "All work product will be owned by the Client upon full payment." : 
                        content.ipRights === "shared" ? "Intellectual property will be shared between parties." : 
                        "Contractor retains all intellectual property rights."}</p>
                </div>
            </div>

            <div class="section">
                <h2>5. ADDITIONAL TERMS</h2>
                <div class="content-box">
                    <p><strong>Included Revisions:</strong> ${content.revisions || '3'} revision${(content.revisions || '3') !== "1" ? "s" : ""}</p>
                    <p><strong>Termination:</strong> Either party may terminate this agreement with ${content.terminationClause || '30-day notice'}</p>
                </div>
            </div>

            <div class="section signature-section">
                <h2>6. SIGNATURES</h2>
                <p style="margin-bottom: 16px; color: #374151;">
                    This contract requires signatures from both parties. 
                    ${content.signatureOrder === "sequential" 
                        ? " Signatures will be collected sequentially (Company first, then Client)." 
                        : " Both parties may sign simultaneously."}
                </p>
                
                <div class="signature-grid">
                    <div class="signature-area">
                        <h3>Company Signature</h3>
                        ${contractData?.user_signature_data ? `<img src="${contractData.user_signature_data}" alt="Company Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                        ${contractData?.user_signed_at ? `<p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">Signed on ${new Date(contractData.user_signed_at).toLocaleDateString()}</p>` : ''}
                    </div>
                    
                    <div class="signature-area">
                        <h3>Client Signature</h3>
                        ${contractData?.client_signature_data ? `<img src="${contractData.client_signature_data}" alt="Client Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                        ${contractData?.client_signed_at ? `<p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">Signed on ${new Date(contractData.client_signed_at).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This contract is valid and binding upon both parties upon signature.</p>
            <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>
    `
  }



  // Document Card Component
  const DocumentCard = ({ 
    type, 
    title, 
    description, 
    status, 
    date, 
    amount, 
    tags,
    uploadedBy,
    onView, 
    onDownload,
    onAction, 
    actionText, 
    actionColor 
  }: {
    type: 'contract' | 'invoice' | 'form' | 'file'
    title: string
    description: string
    status: string
    date: string
    amount?: number
    tags?: Array<{name: string, color: string}>
    uploadedBy?: string
    onView?: () => void
    onDownload?: () => void
    onAction?: () => void
    actionText?: string
    actionColor?: 'red' | 'blue' | 'green'
  }) => {
    const getTypeIcon = () => {
      switch (type) {
        case 'contract':
          return <PenTool className="h-5 w-5" />
        case 'invoice':
          return <CreditCard className="h-5 w-5" />
        case 'form':
          return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        case 'file':
          return <span className="text-2xl">{getFileIcon('document')}</span>
        default:
          return <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
      }
    }

    const getTypeColor = () => {
      switch (type) {
        case 'contract':
          return 'bg-red-100 text-red-600'
        case 'invoice':
          return 'bg-blue-100 text-blue-600'
        case 'form':
          return 'bg-green-100 text-green-600'
        case 'file':
          return 'bg-purple-100 text-purple-600'
        default:
          return 'bg-gray-100 text-gray-600'
      }
    }

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending':
          return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        case 'approved':
        case 'signed':
        case 'completed':
          return 'bg-green-100 text-green-700 border-green-200'
        case 'rejected':
          return 'bg-red-100 text-red-700 border-red-200'
        default:
          return 'bg-gray-100 text-gray-700 border-gray-200'
      }
    }

    return (
      <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-3">
              <div className={`p-2 rounded-lg ${getTypeColor()}`}>
                {getTypeIcon()}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge className={getStatusColor(status)}>
                    {status === 'pending' ? 'Pending' : 
                     status === 'approved' ? 'Approved' : 
                     status === 'signed' ? 'Signed' : 
                     status === 'completed' ? 'Completed' : 
                     status === 'rejected' ? 'Rejected' : status}
                  </Badge>
                  {date && (
                    <span className="text-xs text-gray-500">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  )}
                  {amount && (
                    <span className="text-sm font-medium text-gray-900">
                      ${amount.toLocaleString()}
                    </span>
                  )}
                </div>
                {/* Tags and Upload Info */}
                <div className="flex items-center space-x-2 mt-2">
                  {tags && tags.length > 0 && (
                    <div className="flex space-x-1">
                      {tags.map((tag, index) => (
                        <Badge 
                          key={index}
                          className="text-xs"
                          style={{ 
                            backgroundColor: tag.color + '20', 
                            color: tag.color,
                            borderColor: tag.color + '40'
                          }}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {uploadedBy && (
                    <span className="text-xs text-gray-500">
                      {uploadedBy}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              {onView && (
              <Button
                variant="outline"
                size="sm"
                onClick={onView}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              )}
              {onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              )}
              {onAction && actionText && (
                <Button
                  size="sm"
                  onClick={onAction}
                  className="text-white"
                  style={{ 
                    backgroundColor: actionColor === 'red' ? '#DC2626' : 
                                   actionColor === 'blue' ? '#2563EB' : 
                                   actionColor === 'green' ? '#16A34A' : 
                                   brandColor 
                  }}
                >
                  {actionText}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show loading state while checking portal existence (skip in preview mode)
  if (portalLoading && !isPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading portal...</p>
        </div>
      </div>
    )
  }

  // Show portal not found if portal doesn't exist (skip in preview mode)
  if (portalExists === false && !isPreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600 mb-6">
            The portal you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => window.location.href = `/${companySlug}`}
            className="bg-[${brandColor}] hover:bg-[${brandColor}CC] text-white"
          >
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  // Show unauthorized access message for preview mode when user is not authenticated
  if (isPreview && !user && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to preview this portal. Only the portal owner can access the preview.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Log In
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Debug log for preview mode
  console.log('Rendering portal content:', { 
    isPreview, 
    user, 
    portalExists, 
    portalLoading, 
    dataLoading,
    realProjects: realProjects?.length || 0,
    realInvoices: realInvoices?.length || 0,
    realFiles: realFiles?.length || 0,
    realContracts: realContracts?.length || 0
  })
  return (
    <div className="min-h-screen bg-white" style={brandStyles}>
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-yellow-100 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Preview Mode - This is how your portal looks to clients
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.close()}
              className="text-yellow-700 hover:text-yellow-900"
            >
              Close Preview
            </Button>
          </div>
        </div>
      )}
      
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[${brandColor}] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="font-semibold text-gray-900">ClientPortalHQ</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300" />
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[${brandColor}20] text-[${brandColor}] font-medium text-sm">
                    {realClientData?.avatar || clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{realClientData?.clientName || clientData.clientName}</p>
                  <p className="text-xs text-gray-600">{realClientData?.companyName || clientData.companyName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.role && (
                    <p className="text-xs text-gray-500">{user.role}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[${brandColor}20] text-[${brandColor}] font-medium">
                    {realClientData?.avatar || clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{realClientData?.clientName || clientData.clientName}</p>
                  <p className="text-sm text-gray-600">{realClientData?.companyName || clientData.companyName}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Branded Header Section */}
      {/* Debug branding data */}
      {console.log('Branding data:', {
        useBackgroundImage: realClientData?.branding?.useBackgroundImage,
        headerBackgroundImage: realClientData?.branding?.headerBackgroundImage,
        backgroundColor: realClientData?.branding?.backgroundColor,
        brandColor
      })}
      
      <div
        className="relative w-full shadow-lg"
        style={{
          aspectRatio: '6 / 1', // Half the height - matches the crop aspect ratio perfectly
          minHeight: '100px', // Minimum height for smaller screens
          background: realClientData?.branding?.useBackgroundImage && realClientData?.branding?.headerBackgroundImage
            ? `linear-gradient(135deg, rgba(60, 60, 255, 0.1) 0%, rgba(245, 247, 255, 0.9) 100%), url('${realClientData?.branding?.headerBackgroundImage}?t=${Date.now()}') center/cover`
            : realClientData?.branding?.backgroundColor || `linear-gradient(135deg, ${brandColor}20 0%, ${brandColor}10 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center lg:justify-start">
            <img
              src={getPortalLogoUrl(logoUrl) || realClientData?.branding?.logo || clientData.branding.logo || "/placeholder.svg"}
              alt={`${realClientData?.companyName || clientData.companyName} Logo`}
              className="h-16 md:h-20 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>


      {/* Welcome Message Section - Below Banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome, {realClientData?.clientName || clientData.clientName} 👋
            </h1>
            <p className="text-base md:text-lg text-gray-700 font-medium">
              {welcomeMessage || "Everything you need, all in one place."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
            {/* Projects Overview */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading projects...</p>
                </div>
              ) : realProjects.length > 0 ? (
                <div className="space-y-6">
                  {/* Project Selection Tabs */}
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                  {realProjects.map((project: any) => (
                      <button
                        key={project.id}
                        onClick={() => handleProjectSelect(project)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedProject?.id === project.id
                            ? `bg-[${brandColor}] text-white shadow-md`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        style={selectedProject?.id === project.id ? {
                          backgroundColor: brandColor,
                          color: textColor
                        } : {}}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>

                  {/* Selected Project Details */}
                  {selectedProject && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="p-0">
                          {/* Project Header */}
                          <div 
                            className="p-6 text-white relative overflow-hidden"
                            style={{ backgroundColor: brandColor }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10"></div>
                            <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                                  <h3 className="text-2xl font-bold">{selectedProject.name}</h3>
                                  <p className="text-white/90 text-sm">
                                    {selectedProject.last_activity_at 
                                      ? `Last updated ${new Date(selectedProject.last_activity_at).toLocaleDateString()}` 
                                      : selectedProject.lastUpdated 
                                        ? `Last updated ${selectedProject.lastUpdated}` 
                                        : 'No recent activity'
                                    }
                            </p>
                        </div>
                                <Badge 
                                  className="bg-white/20 text-white border-white/30"
                                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                                >
                                  {selectedProject.status}
                                </Badge>
                      </div>
                              
                              {/* Progress Section */}
                              <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                                  <span className="text-white/90">Progress</span>
                                  <span className="font-semibold">{selectedProject.progress}%</span>
                        </div>
                                <div className="w-full bg-white/20 rounded-full h-3">
                                  <div 
                                    className="bg-white rounded-full h-3 transition-all duration-500 ease-out"
                                    style={{ width: `${selectedProject.progress}%` }}
                                  ></div>
                      </div>
                              </div>
                            </div>
                          </div>

                          {/* Project Content */}
                          <div className="p-6">
                            {selectedProject.description && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                <p className="text-gray-600 leading-relaxed">{selectedProject.description}</p>
                              </div>
                            )}

                            {/* Project Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900">{selectedProject.progress}%</div>
                                <div className="text-sm text-gray-600">Complete</div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900">
                                  {selectedProject.milestones?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">Milestones</div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900">
                                  {selectedProject.files?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">Files</div>
                              </div>
                              <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900">
                                  {selectedProject.invoices?.length || 0}
                                </div>
                                <div className="text-sm text-gray-600">Invoices</div>
                              </div>
                            </div>
                          </div>
                    </CardContent>
                  </Card>
                    </div>
                  )}
              </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Select a project above to view its timeline and milestones.
                  </p>
                </div>
              )}
            </div>

            {/* Action Needed Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">📝 Action Needed</h2>
              
              {/* Sent Invoices - Light Red Background */}
              {selectedProject && realInvoices.filter((invoice: any) => invoice.status === "sent" && invoice.project_id === selectedProject.id).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">Invoices to Review</h3>
                  {realInvoices.filter((invoice: any) => invoice.status === "sent" && invoice.project_id === selectedProject.id).map((invoice: any) => (
                    <Card key={`invoice-${invoice.id}`} className="border-0 shadow-sm rounded-2xl bg-red-50 ring-1 ring-red-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-red-100">
                              <CreditCard className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                              <h4 className="font-medium text-gray-900">{invoice.invoice_number || invoice.number || 'Invoice'}</h4>
                              <p className="text-sm text-gray-600">{invoice.title || invoice.description || 'No description'}</p>
                              <p className="text-sm text-red-600 font-medium">${(invoice.total_amount || invoice.subtotal || 0).toLocaleString()}</p>
                              </div>
                            </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openInvoiceModal(invoice)}
                              className="border-gray-300 text-gray-700 hover:bg-white"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-white"
                              onClick={() => handleDownloadInvoicePDF(invoice)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handlePayInvoice(invoice)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay
                            </Button>
                          </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
              </div>
            )}



              {/* Contracts - Light Red Background */}
              {realContracts.filter((contract: any) => 
                contract.status === "awaiting_signature" || 
                (contract.status === "partially_signed" && contract.client_signature_status !== "signed")
              ).length > 0 && (
                      <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">Contracts to Sign</h3>
                  {realContracts.filter((contract: any) => 
                    contract.status === "awaiting_signature" || 
                    (contract.status === "partially_signed" && contract.client_signature_status !== "signed")
                  ).map((contract: any) => (
                    <Card key={`contract-${contract.id}`} className="border-0 shadow-sm rounded-2xl bg-red-50 ring-1 ring-red-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-red-100">
                              <PenTool className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{contract.name}</h4>
                              <p className="text-sm text-gray-600">{contract.description || 'No description'}</p>
                              <p className="text-sm text-red-600 font-medium">Contract pending signature</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-white"
                              onClick={() => openContractModal(contract)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-white"
                              onClick={() => handleDownloadContractPDF(contract)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-600 hover:bg-red-700 text-white"
                              onClick={() => handleSignContract(contract)}
                            >
                              <PenTool className="h-4 w-4 mr-1" />
                              Sign
                            </Button>
                        </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Forms - No Red Background - Only show published forms that haven't been submitted */}
              {selectedProject && realForms.filter((form: any) => form.project_id === selectedProject.id && form.status === 'published' && !(formSubmissionStatus[form.id] || false)).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">Forms to Complete</h3>
                  {realForms
                    .filter((form: any) => form.project_id === selectedProject.id && form.status === 'published' && !(formSubmissionStatus[form.id] || false))
                    .map((form: any) => {
                      const isSubmitted = formSubmissionStatus[form.id] || false
                      return (
                        <Card key={`form-${form.id}`} className="border-0 shadow-sm rounded-2xl bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                                  <h4 className="font-medium text-gray-900">{form.title}</h4>
                                  <p className="text-sm text-gray-600">{form.description || 'No description'}</p>
                                  <p className={`text-sm font-medium ${isSubmitted ? 'text-green-600' : 'text-blue-600'}`}>
                                    {isSubmitted ? 'Form completed' : 'Form pending completion'}
                                  </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                          {isSubmitted ? (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => openFormSubmissionModal(form)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => openFormModal(form)}
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Fill Out
                            </Button>
                          )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                      )
                    })}
                </div>
              )}

              {/* Files Pending Approval - No Red Background */}
              {selectedProject && realFiles.filter((file: any) => (file.approval_status || file.status) === "pending" && file.project_id === selectedProject.id && !file.sent_by_client).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-800">Files to Review</h3>
                  {realFiles.filter((file: any) => (file.approval_status || file.status) === "pending" && file.project_id === selectedProject.id && !file.sent_by_client).map((file: any) => (
                    <Card key={`file-${file.id}`} className="border-0 shadow-sm rounded-2xl bg-white">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 rounded-lg bg-yellow-100">
                              <span className="text-2xl">{getFileIcon(file.file_type || file.type)}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{file.name}</h4>
                              <p className="text-sm text-gray-600">
                                {file.file_size_formatted || 
                                 (file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : file.size) || 'Unknown size'}
                              </p>
                              <p className="text-sm text-yellow-600 font-medium">Pending approval</p>
                              {/* Tags and Upload Info */}
                              <div className="flex items-center space-x-2 mt-1">
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex space-x-1">
                                    {file.tags.map((tag: any, index: number) => (
                                      <Badge 
                                        key={index}
                                        className="text-xs"
                                        style={{ 
                                          backgroundColor: tag.color + '20', 
                                          color: tag.color,
                                          borderColor: tag.color + '40'
                                        }}
                                      >
                                        {tag.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {file.uploaded_by_name && (
                                  <span className="text-xs text-gray-500">
                                    {file.sent_by_client ? `Sent by client (${file.uploaded_by_name})` : `Uploaded by ${file.uploaded_by_name}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => openFileModal(file)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-300 text-gray-700 hover:bg-gray-50"
                              onClick={() => handleDownloadFile(file)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproveFile(file.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </div>
              )}

              {/* Show empty state if no action items */}
              {realInvoices.filter((invoice: any) => invoice.status === "sent").length === 0 &&
               realContracts.filter((contract: any) => 
                 contract.status === "awaiting_signature" || 
                 (contract.status === "partially_signed" && contract.client_signature_status !== "signed")
               ).length === 0 &&
               realProjects.filter((project: any) => project.status === "form_sent").length === 0 &&
               realFiles.filter((file: any) => (file.approval_status || file.status) === "pending" && !file.sent_by_client).length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">All Caught Up!</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    No actions needed at the moment. You're all set! Check back here for any new tasks or approvals.
                  </p>
                </div>
              )}
            </div>

            {/* Documents Section - Tabbed Interface */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">📚 Documents</h2>
                <Button 
                  variant="outline" 
                  className="bg-transparent" 
                  style={{ color: brandColor, borderColor: brandColor, backgroundColor: 'transparent' }}
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </div>

              {/* Document Tabs */}
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                  {portalModules.contracts !== false && (
                    <button
                      onClick={() => setActiveDocumentTab('contracts')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeDocumentTab === 'contracts'
                          ? 'bg-white border-b-2'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={activeDocumentTab === 'contracts' ? { color: brandColor, borderBottomColor: brandColor } : {}}
                    >
                      Contracts
                    </button>
                  )}
                  {portalModules.invoices !== false && (
                    <button
                      onClick={() => setActiveDocumentTab('invoices')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeDocumentTab === 'invoices'
                          ? 'bg-white border-b-2'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={activeDocumentTab === 'invoices' ? { color: brandColor, borderBottomColor: brandColor } : {}}
                    >
                      Invoices
                    </button>
                  )}
                  {portalModules.forms !== false && (
                    <button
                      onClick={() => setActiveDocumentTab('forms')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeDocumentTab === 'forms'
                          ? 'bg-white border-b-2'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={activeDocumentTab === 'forms' ? { color: brandColor, borderBottomColor: brandColor } : {}}
                    >
                      Forms
                    </button>
                  )}
                  {portalModules.files !== false && (
                    <button
                      onClick={() => setActiveDocumentTab('files')}
                      className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                        activeDocumentTab === 'files'
                          ? 'bg-white border-b-2'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      style={activeDocumentTab === 'files' ? { color: brandColor, borderBottomColor: brandColor } : {}}
                    >
                      Files
                    </button>
                  )}
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {dataLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading documents...</p>
                    </div>
                  ) : (
                    <>
                      {/* Contracts Tab */}
                      {portalModules.contracts !== false && activeDocumentTab === 'contracts' && (
                        <div className="space-y-4">
                          {selectedProject && realContracts.filter((contract: any) => contract.project_id === selectedProject.id).length > 0 ? (
                            <div className="grid gap-4">
                              {realContracts.filter((contract: any) => contract.project_id === selectedProject.id).map((contract: any) => {
                                // Determine if contract needs action
                                const needsAction = contract.status === "awaiting_signature" || 
                                  (contract.status === "partially_signed" && contract.client_signature_status !== "signed")
                                
                                return (
                                <DocumentCard
                                  key={`contract-${contract.id}`}
                                  type="contract"
                                  title={contract.name}
                                  description={contract.description || 'Contract document'}
                                  status={contract.status}
                                  date={contract.created_at}
                                  onView={() => openContractModal(contract)}
                                  onDownload={() => handleDownloadContractPDF(contract)}
                                  onAction={needsAction ? () => handleSignContract(contract) : undefined}
                                  actionText={needsAction ? "Sign" : undefined}
                                  actionColor={needsAction ? "red" : undefined}
                                />
                              )
                              })}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PenTool className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Contracts</h3>
                              <p className="text-gray-600 max-w-sm mx-auto">
                                No contracts have been sent to you yet. Check back here when contracts are ready for your signature.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Invoices Tab */}
                      {portalModules.invoices !== false && activeDocumentTab === 'invoices' && (
                        <div className="space-y-4">
                          {selectedProject && realInvoices.filter((invoice: any) => invoice.status === "sent" && invoice.project_id === selectedProject.id).length > 0 ? (
                            <div className="grid gap-4">
                              {realInvoices.filter((invoice: any) => invoice.status === "sent" && invoice.project_id === selectedProject.id).map((invoice: any) => (
                                <DocumentCard
                                  key={`invoice-${invoice.id}`}
                                  type="invoice"
                                  title={`Invoice #${invoice.invoice_number || invoice.number}`}
                                  description={invoice.title || invoice.description || 'Invoice document'}
                                  status="pending"
                                  date={invoice.issue_date}
                                  amount={invoice.total_amount || invoice.subtotal}
                                  onView={() => openInvoiceModal(invoice)}
                                  onDownload={() => handleDownloadInvoicePDF(invoice)}
                                  onAction={() => handlePayInvoice(invoice)}
                                  actionText="Pay"
                                  actionColor="red"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-gray-400" />
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Invoices</h3>
                              <p className="text-gray-600 max-w-sm mx-auto">
                                No invoices have been sent to you yet. Check back here when invoices are ready for payment.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Forms Tab */}
                      {portalModules.forms !== false && activeDocumentTab === 'forms' && (
                        <div className="space-y-4">
                          {realForms.length > 0 ? (
                            <div className="grid gap-4">
                              {realForms
                                .filter(form => !selectedProject || form.project_id === selectedProject.id)
                                .map((form) => {
                                  const isSubmitted = formSubmissionStatus[form.id] || false
                                  return (
                                <DocumentCard
                                      key={form.id}
                                  type="form"
                                      title={form.title}
                                      description={form.description || 'Form document'}
                                      status={isSubmitted ? "completed" : "pending"}
                                      date={form.created_at}
                                      onView={isSubmitted ? () => openFormSubmissionModal(form) : undefined}
                                      onAction={!isSubmitted ? () => openFormModal(form) : undefined}
                                      actionText={!isSubmitted ? "Fill Out" : undefined}
                                  actionColor="blue"
                                />
                                  )
                                })}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Forms</h3>
                              <p className="text-gray-600 max-w-sm mx-auto">
                                No forms have been sent to you yet. Check back here when forms are ready for completion.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Files Tab */}
                      {portalModules.files !== false && activeDocumentTab === 'files' && (
                        <div className="space-y-4">
                          {/* Files Filter Toggle */}
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900">Project Files</h3>
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="client-files-only"
                                checked={showClientFilesOnly}
                                onCheckedChange={setShowClientFilesOnly}
                              />
                              <label htmlFor="client-files-only" className="text-sm text-gray-600">
                                Show your uploads
                              </label>
                            </div>
                          </div>
                          
                          {selectedProject && realFiles.filter((file: any) => {
                            const projectMatch = file.project_id === selectedProject.id
                            if (!showClientFilesOnly) return projectMatch
                            return projectMatch && file.sent_by_client === true
                          }).length > 0 ? (
                            <div className="grid gap-4">
                              {realFiles.filter((file: any) => {
                                const projectMatch = file.project_id === selectedProject.id
                                if (!showClientFilesOnly) return projectMatch
                                return projectMatch && file.sent_by_client === true
                              }).map((file: any) => (
                                <DocumentCard
                                  key={`file-${file.id}`}
                                  type="file"
                                  title={file.name}
                                  description={`${file.file_size_formatted || (file.file_size ? `${(file.file_size / 1024 / 1024).toFixed(1)} MB` : file.size) || 'Unknown size'}`}
                                  status={file.approval_status || file.status}
                                  date={file.created_at}
                                  tags={file.tags}
                                  uploadedBy={file.sent_by_client ? `Sent by client (${file.uploaded_by_name})` : file.uploaded_by_name}
                                  onView={() => openFileModal(file)}
                                  onDownload={() => handleDownloadFile(file)}
                                  onAction={file.approval_status === "pending" ? () => handleApproveFile(file.id) : undefined}
                                  actionText={file.approval_status === "pending" ? "Approve" : undefined}
                                  actionColor="green"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2 2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-medium text-gray-900 mb-2">No Files</h3>
                              <p className="text-gray-600 max-w-sm mx-auto">
                                No files have been shared with you yet. Check back here when files are ready for review.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline Section - Only show if timeline module is enabled */}
            {portalModules.timeline !== false && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">🗂 Project Timeline</h2>
              
              {dataLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading timeline...</p>
                </div>
              ) : selectedProject ? (
              <div className="space-y-4">
                  {/* Selected Project Milestones Timeline */}
                  {(() => {
                    // Get milestones for the selected project
                    const projectMilestones = selectedProject.milestones || [];
                    
                    return (
                      <div key={`project-${selectedProject.id}`} className="space-y-4">
                        {/* Project Header */}
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: `${brandColor}20` }}>
                            <svg className="h-3 w-3" style={{ color: brandColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <h3 className="font-medium text-gray-900">{selectedProject.name}</h3>
                        </div>

                        {/* Milestones for this project */}
                        {projectMilestones.length > 0 ? (
                          projectMilestones.map((milestone: any, index: number) => (
                            <div key={milestone.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    milestone.status === "completed"
                            ? "bg-green-100"
                                      : milestone.status === "in-progress"
                              ? "bg-gray-100"
                              : "bg-gray-100"
                        }`}
                        style={milestone.status === "in-progress" ? { backgroundColor: `${brandColor}20` } : {}}
                      >
                                  {milestone.status === "completed" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                                  ) : milestone.status === "in-progress" ? (
                          <Clock className="h-5 w-5" style={{ color: brandColor }} />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                                {index < projectMilestones.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2" />}
                    </div>
                              <div className="flex-1 pb-8">
                                <div className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-medium text-gray-900">
                                      {milestone.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-500">
                                        {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No due date'}
                                      </span>
                            </div>
                          </div>
                                  <p className="text-gray-600 mb-3">
                                    {milestone.description || 'No description available'}
                                  </p>
                                  
                                  {/* Client Note */}
                                  {milestone.client_note && (
                                    <div className="rounded-lg p-3 mb-3" style={{ backgroundColor: `${brandColor}10`, border: `1px solid ${brandColor}30` }}>
                                      <div className="flex items-start space-x-2">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5" style={{ backgroundColor: `${brandColor}20` }}>
                                          <svg className="w-2.5 h-2.5" style={{ color: brandColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                          </svg>
                        </div>
                                        <div className="flex-1">
                                          <h4 className="text-sm font-medium mb-1" style={{ color: brandColor }}>Note from Team</h4>
                                          <p className="text-sm leading-relaxed" style={{ color: brandColor }}>{milestone.client_note}</p>
                      </div>
                    </div>
                  </div>
                                  )}
              </div>
            </div>
          </div>
                          ))
                        ) : (
                          <div className="ml-12 text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-sm text-gray-500">No milestones created for this project yet</p>
                        </div>
                        )}
                        </div>
                    );
                  })()}
                        </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                      </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Project Selected</h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Select a project above to view its timeline and milestones.
                  </p>
              </div>
              )}
            </div>
            )}

            {/* Messages Section - Only show if messages module is enabled and project is selected */}
            {portalModules.messages !== false && selectedProject && (
            <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: brandColor }}></div>
                  Messages - {selectedProject.name}
                </h2>
                {(() => {
                  const accountId = realClientData?.accountId || realClientData?.account_id || ''
                  console.log('MessageChat props:', {
                    projectId: selectedProject.id,
                    accountId,
                    clientName: realClientData?.clientName || clientData.clientName,
                    clientEmail: realClientData?.email || clientData.email,
                    realClientData,
                    portalSettings
                  })
                  
                  if (!accountId) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <p>Unable to load messages: Account ID is missing</p>
                        <p className="text-sm mt-2">Please refresh the page or contact support.</p>
                          </div>
                    )
                  }
                  
                  return (
                    <MessageChat
                      projectId={selectedProject.id}
                      accountId={accountId}
                      clientName={realClientData?.clientName || clientData.clientName}
                      clientEmail={realClientData?.email || clientData.email}
                      brandColor={brandColor}
                    />
                  )
                })()}
            </div>
            )}
        </div>
      </div>

      {/* Timeline Details Modal */}
      {isTimelineModalOpen && selectedTimelineStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTimelineStep.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTimelineModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Date and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedTimelineStep.status === "complete"
                        ? "bg-green-100"
                        : selectedTimelineStep.status === "in-progress"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                    }`}
                  >
                    {selectedTimelineStep.status === "complete" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : selectedTimelineStep.status === "in-progress" ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedTimelineStep.date}</p>
                    <Badge
                      className={`text-xs ${
                        selectedTimelineStep.status === "complete"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : selectedTimelineStep.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {selectedTimelineStep.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Note from Admin */}
              {selectedTimelineStep.note && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Project Update</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedTimelineStep.note}</p>
                  </div>
                </div>
              )}

              {/* Associated Files */}
              {selectedTimelineStep.uploads && selectedTimelineStep.uploads.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Associated Files</h4>
                  <div className="space-y-2">
                    {selectedTimelineStep.uploads.map((upload: any) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getFileIcon(upload.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{upload.name}</p>
                            <p className="text-xs text-gray-600">{upload.size}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="text-[${brandColor}] hover:bg-[${brandColor}20] p-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[${brandColor}] hover:bg-[${brandColor}20] p-2">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <Button
                onClick={() => setIsTimelineModalOpen(false)}
                className="w-full bg-[${brandColor}] hover:bg-[${brandColor}CC] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {isCommentsOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Comments - {selectedFile.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCommentsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedFile.comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                selectedFile.comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`text-xs font-medium ${
                          comment.isClient ? "bg-[${brandColor}20] text-[${brandColor}]" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {comment.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[${brandColor}20] text-[${brandColor}] text-xs font-medium">
                    {clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px] border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleAddComment(selectedFile.id)}
                      disabled={!newComment.trim()}
                      className="bg-[${brandColor}] hover:bg-[${brandColor}CC] text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    

      {/* Invoice Preview Modal */}
      {isInvoiceModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="bg-white p-8">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedInvoice.title || selectedInvoice.description || 'Untitled Invoice'}
                    </h2>
                    <p className="text-gray-600">
                      Invoice #{selectedInvoice.invoice_number || selectedInvoice.number || 'No Number'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium">
                      {selectedInvoice.issue_date ? new Date(selectedInvoice.issue_date).toLocaleDateString() : 'No date'}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">Due Date</p>
                    <p className="font-medium">
                      {selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <p className="text-gray-900">{realClientData?.clientName || clientData.clientName}</p>
                  <p className="text-gray-600">{realClientData?.companyName || clientData.companyName}</p>
                  {selectedInvoice.project_name && (
                    <p className="text-gray-600">Project: {selectedInvoice.project_name}</p>
                  )}
                </div>

                {/* Line Items */}
                <div>
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.line_items && selectedInvoice.line_items.length > 0 ? (
                        selectedInvoice.line_items.map((item: any) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{item.name || "Untitled Item"}</p>
                                {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                              </div>
                            </td>
                            <td className="text-right py-3">{item.quantity}</td>
                            <td className="text-right py-3">${(item.unit_rate || 0).toLocaleString()}</td>
                            <td className="text-right py-3">${(item.total_amount || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-gray-500">No line items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${(selectedInvoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {selectedInvoice.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({selectedInvoice.tax_rate}%):</span>
                        <span>${(selectedInvoice.tax_amount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    {selectedInvoice.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-${(selectedInvoice.discount_value || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${(selectedInvoice.total_amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedInvoice.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-2 ${getStatusColor(selectedInvoice.status)}`}>
                      {selectedInvoice.status === "due" ? "Due" : selectedInvoice.status === "paid" ? "Paid" : selectedInvoice.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Payment Terms:</span>
                    <span className="ml-2">{selectedInvoice.payment_terms || 'Not specified'}</span>
                  </div>
                  {selectedInvoice.po_number && (
                    <div>
                      <span className="font-medium">PO Number:</span>
                      <span className="ml-2">{selectedInvoice.po_number}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Currency:</span>
                    <span className="ml-2">{selectedInvoice.currency || 'USD'}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setIsInvoiceModalOpen(false)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </Button>
                  {selectedInvoice.status === "due" && (
                    <Button
                      onClick={() => handlePayInvoice(selectedInvoice)}
                      className="bg-[${brandColor}] hover:bg-[${brandColor}CC] text-white"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay Now
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contract Preview Modal */}
      {isContractModalOpen && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Contract Preview</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsContractModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {loadingContract ? (
                <div className="flex items-center justify-center h-64">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading contract...</span>
                  </div>
                </div>
              ) : contractHtml ? (
                <div 
                  className="bg-white border rounded-lg shadow-sm overflow-auto"
                  style={{ minHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: contractHtml }}
                />
              ) : (
                <div className="bg-white border rounded-lg p-8 min-h-[600px] shadow-sm text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No contract content available</p>
                  <p className="text-sm">The contract content could not be loaded.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setIsContractModalOpen(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleSignContract(selectedContract)}
                  className="bg-[${brandColor}] hover:bg-[${brandColor}CC] text-white"
                >
                  <PenTool className="h-4 w-4 mr-2" />
                  Sign Contract
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {isFileModalOpen && selectedPortalFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl h-[95vh] max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {selectedPortalFile.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFileModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden p-0">
              {fileViewUrl ? (
                <div className="w-full h-full">
                  {/* Image files */}
                  {['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP'].includes((selectedPortalFile.file_type || '').toUpperCase()) && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <img 
                        src={fileViewUrl} 
                        alt={selectedPortalFile.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                        style={{ maxHeight: 'calc(100vh - 200px)' }}
                      />
                    </div>
                  )}

                  {/* PDF files */}
                  {(selectedPortalFile.file_type || '').toUpperCase() === 'PDF' && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <iframe
                        src={`${fileViewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                        title={`PDF Viewer - ${selectedPortalFile.name}`}
                        className="w-full h-full border-0 rounded-lg shadow-lg"
                        style={{ minHeight: 'calc(100vh - 200px)' }}
                      />
                    </div>
                  )}

                  {/* Video files */}
                  {['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MKV', 'M4V'].includes((selectedPortalFile.file_type || '').toUpperCase()) && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <video 
                        src={fileViewUrl}
                        controls
                        className="max-w-full max-h-full rounded-lg shadow-lg"
                        style={{ maxHeight: 'calc(100vh - 200px)' }}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}

                  {/* Audio files */}
                  {['MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', 'WMA'].includes((selectedPortalFile.file_type || '').toUpperCase()) && (
                    <div className="w-full h-full flex items-center justify-center p-4">
                      <div className="text-center max-w-md">
                        <div className="mb-4">
                          <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-4">{selectedPortalFile.name}</p>
                        </div>
                        <audio 
                          src={fileViewUrl}
                          controls
                          className="w-full"
                        >
                          Your browser does not support the audio tag.
                        </audio>
                      </div>
                    </div>
                  )}

                  {/* Fallback for non-previewable types */}
                  {!['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP', 'PDF', 'MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MKV', 'M4V', 'MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', 'WMA'].includes((selectedPortalFile.file_type || '').toUpperCase()) && (
                    <div className="w-full h-full flex items-center justify-center p-8">
                      <div className="text-center max-w-md">
                        <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mt-4 mb-4">
                          Preview not available for {selectedPortalFile.file_type} files
                        </p>
                        <Button onClick={() => window.open(fileViewUrl || '#', '_blank')}>
                          <Download className="h-4 w-4 mr-2" />
                          Download to View
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-600">Loading file for viewing...</p>
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setIsFileModalOpen(false)}>
                  Close
                </Button>
                {fileViewUrl && (
                  <Button onClick={() => window.open(fileViewUrl, '_blank')}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Filling Modal */}
      <FormFillingModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        form={selectedForm}
        clientEmail={realClientData?.email || clientData.email}
        clientName={realClientData?.name || clientData.name}
        onFormSubmitted={handleFormSubmitted}
      />

      {/* Form Submission Viewer Modal */}
      <FormSubmissionViewer
        open={isFormSubmissionModalOpen}
        onOpenChange={setIsFormSubmissionModalOpen}
        submission={selectedFormSubmission}
      />

      {/* Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSignatureSave={handleSignatureSave}
        contractTitle={contractToSign?.name || 'Contract'}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleFileUpload}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
      />

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src={getPortalLogoUrl(logoUrl) || realClientData?.branding?.logo || clientData.branding.logo || "/placeholder.svg"}
                alt={`${realClientData?.companyName || clientData.companyName} Logo`}
                className="h-8 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-sm text-gray-500">
              Powered by <span className="text-[${brandColor}] font-medium">ClientPortalHQ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
    
   
  )
}
