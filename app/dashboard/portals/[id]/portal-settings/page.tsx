"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import {
  Eye,
  EyeOff,
  Upload,
  Palette,
  Shield,
  TimerIcon as Timeline,
  FileText,
  CreditCard,
  MessageCircle,
  FolderOpen,
  Mail,
  Plus,
  X,
  Loader2,
  Home,
  CheckSquare,
  CalendarDays,
  Activity,
  Settings,
  Send,
  Download,
  ExternalLink,
  Clock,
  Grid3x3,
  List,
  Filter,
  Search,
  MoreVertical,
  Paperclip,
  Check,
  CheckCircle2,
  AlertCircle,
  PenLine,
  Video,
  Phone,
  Type,
  AlignLeft,
  ChevronDown,
  Square,
  PenTool,
  Star,
  Image as ImageIcon,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Globe,
  ArrowLeft,
  MessageSquare,
  Building2,
} from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { uploadPortalLogo, validateLogoFile, getPortalLogoUrl, uploadPortalBackground, getPortalBackgroundUrl } from "@/lib/storage"
import { getFileUrl } from "@/lib/files"
import { ImageCropModal } from "@/components/ui/image-crop-modal"
import { FormFilloutModal } from "@/components/forms/form-fillout-modal"
import { FormPreviewModal } from "@/components/forms/form-preview-modal"
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal"
import { FileReviewModal } from "@/components/files/file-review-modal"
import { ContractPreviewModal } from "@/components/contracts/contract-preview-modal"
import { ContractSignatureModal } from "@/components/contracts/contract-signature-modal"
import { getScheduleSettings, getScheduleSettingsByAccountId, getScheduleSettingsBySlug, getMeetingTypesByAccount, getBookingsByAccount, createPublicBooking, updateBooking, ensureScheduleSetup, getOrCreateConsultationMeetingType, type MeetingType, type ScheduleSettings } from "@/lib/schedule"
import { getCurrentAccount, type Account } from "@/lib/auth"
import { generateTimeSlots, type ExistingBooking } from "@/lib/schedule-utils"
import { format, parseISO, addMinutes, setHours, setMinutes, isBefore, startOfDay, addMonths, subMonths } from "date-fns"
import Image from "next/image"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

// Types
interface Client {
  id: string
  firstName: string
  lastName: string
  email: string
  company: string
  avatar: string
}

interface Project {
  id: string
  name: string
  status: string
  isVisible: boolean
  isDefault: boolean
}

interface PortalSettings {
  id: string
  account_id?: string
  name: string
  status: string
  url: string
  description: string
  brandColor: string
  welcomeMessage: string
  passwordProtected: boolean
  portalPassword: string
  useBackgroundImage: boolean
  backgroundImageUrl: string
  backgroundColor: string
  sidebarBgColor: string
  sidebarTextColor: string
  portalFont: string
  portalBgColor: string
  portalTextColor: string
  highlightColor: string
  highlightTextColor: string
  roundedButtons: boolean
}

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

const brandColors = [
  "#4647E0", // Jolix purple
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
]

const backgroundColors = [
  "#4647E0", // Jolix purple
  "#1F2937", // Dark gray
  "#111827", // Very dark gray
  "#059669", // Green
  "#DC2626", // Red
  "#7C3AED", // Purple
  "#EA580C", // Orange
  "#0891B2", // Cyan
  "#BE185D", // Pink
  "#65A30D", // Lime
]

// Google Fonts options for portal
const googleFonts = [
  { label: "Inter", value: "Inter", url: "Inter:wght@400;500;600;700" },
  { label: "Poppins", value: "Poppins", url: "Poppins:wght@400;500;600;700" },
  { label: "Roboto", value: "Roboto", url: "Roboto:wght@400;500;700" },
  { label: "Open Sans", value: "Open Sans", url: "Open+Sans:wght@400;500;600;700" },
  { label: "Lato", value: "Lato", url: "Lato:wght@400;700" },
  { label: "Montserrat", value: "Montserrat", url: "Montserrat:wght@400;600;700" },
  { label: "Source Sans 3", value: "Source Sans 3", url: "Source+Sans+3:wght@400;600;700" },
  { label: "Nunito", value: "Nunito", url: "Nunito:wght@400;600;700" },
  { label: "Work Sans", value: "Work Sans", url: "Work+Sans:wght@400;600;700" },
  { label: "Merriweather", value: "Merriweather", url: "Merriweather:wght@400;700" },
]

function getGoogleFontUrl(fontFamily: string): string | null {
  const f = googleFonts.find((g) => g.value === fontFamily)
  if (!f) return null
  return `https://fonts.googleapis.com/css2?family=${f.url}&display=swap`
}

// Helper function to lighten a hex color
function lightenColor(hex: string, percent: number = 10): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Lighten by adding percent of (255 - current)
  const newR = Math.min(255, Math.round(r + (255 - r) * (percent / 100)))
  const newG = Math.min(255, Math.round(g + (255 - g) * (percent / 100)))
  const newB = Math.min(255, Math.round(b + (255 - b) * (percent / 100)))
  
  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

export default function PortalEditorPage() {
  const params = useParams()
  const router = useRouter()
  const portalId = params.id as string
  const isGlobalTemplate = portalId === 'global'

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portal, setPortal] = useState<PortalSettings | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [files, setFiles] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [formSubmissions, setFormSubmissions] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [bookings, setBookings] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [activeSection, setActiveSection] = useState("home")
  const [viewMode, setViewMode] = useState<"portal" | "login">("portal")

  // Portal settings
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({})
  const [projectVisibility, setProjectVisibility] = useState<Record<string, boolean>>({})
  const [defaultProject, setDefaultProject] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState("#4647E0")
  const [customColor, setCustomColor] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  const [showPreviewModal, setShowPreviewModal] = useState(false)

  // Background settings
  const [useBackgroundImage, setUseBackgroundImage] = useState(false)
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState("#4647E0")
  const [customBackgroundColor, setCustomBackgroundColor] = useState("")

  // Sidebar & Font settings
  const [sidebarBgColor, setSidebarBgColor] = useState("#FFFFFF")
  const [sidebarTextColor, setSidebarTextColor] = useState("#1F2937")
  const [sidebarHighlightColor, setSidebarHighlightColor] = useState("#4647E0")
  const [sidebarHighlightTextColor, setSidebarHighlightTextColor] = useState("#FFFFFF")
  const [portalFont, setPortalFont] = useState("Inter")
  // Client-side task view preferences (defaults to both enabled)
  const [clientTaskViews, setClientTaskViews] = useState<{milestones: boolean; board: boolean}>(() => {
    // Default to both enabled
    return { milestones: true, board: true }
  })

  // Login page settings
  const [loginDevice, setLoginDevice] = useState<"desktop" | "mobile">("desktop")
  const [loginLogoUrl, setLoginLogoUrl] = useState<string>('')
  const [loginLogoFile, setLoginLogoFile] = useState<File | null>(null)
  const [loginWelcomeHeadline, setLoginWelcomeHeadline] = useState<string>("Welcome")
  const [loginWelcomeSubtitle, setLoginWelcomeSubtitle] = useState<string>("Login to access your portal")
  const [loginBgMode, setLoginBgMode] = useState<"solid" | "gradient" | "image">("solid")
  const [loginBgColor, setLoginBgColor] = useState<string>("#F3F4F6")
  const [loginBgGradientFrom, setLoginBgGradientFrom] = useState<string>("#EEF2FF")
  const [loginBgGradientTo, setLoginBgGradientTo] = useState<string>("#F5F7FF")
  const [loginBgGradientAngle, setLoginBgGradientAngle] = useState<number>(135)
  const [loginBgImageUrl, setLoginBgImageUrl] = useState<string>('')
  const [loginImageFit, setLoginImageFit] = useState<"cover" | "contain">("cover")
  const [loginOverlayOpacity, setLoginOverlayOpacity] = useState<number>(20)
  const [loginBlur, setLoginBlur] = useState<boolean>(false)
  const [loginMagicLinkEnabled, setLoginMagicLinkEnabled] = useState<boolean>(true)
  const [loginPasswordEnabled, setLoginPasswordEnabled] = useState<boolean>(false)
  const [loginActiveAuthMode, setLoginActiveAuthMode] = useState<"magic" | "password">("magic")
  const [loginMagicLinkButtonLabel, setLoginMagicLinkButtonLabel] = useState<string>("Send Magic Link")
  const [loginPasswordButtonLabel, setLoginPasswordButtonLabel] = useState<string>("Sign In")
  const [loginShowResend, setLoginShowResend] = useState<boolean>(false)

  // Task views settings
  const [taskViews, setTaskViews] = useState<{milestones: boolean; board: boolean}>({
    milestones: true,
    board: true
  })
  const [loginSupportLink, setLoginSupportLink] = useState<string>("")

  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')
  const [hasChanges, setHasChanges] = useState(false)
  const [account, setAccount] = useState<Account | null>(null)
  const [companyName, setCompanyName] = useState<string>('')

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      try {
        const accountData = await getCurrentAccount()
        if (accountData) {
          setAccount(accountData)
        }
      } catch (error) {
        console.error('Error loading account:', error)
      }
    }
    loadAccount()
  }, [])
  
  // Set company name from account if portal settings don't have it (only on initial load)
  const [companyNameInitialized, setCompanyNameInitialized] = useState(false)
  useEffect(() => {
    if (account?.company_name && !companyName && !companyNameInitialized) {
      setCompanyName(account.company_name)
      setCompanyNameInitialized(true)
    }
  }, [account])

  // Fetch portal settings
  const fetchPortalSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/portals/${portalId}/settings`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        console.log('Loaded portal settings:', JSON.stringify(data.portal, null, 2))
        setPortal(data.portal)
        setClient(data.client || { id: 'global', company: 'Your Company', firstName: 'Portal', lastName: 'Template', avatar: 'YC' } as any)
        setProjects(data.projects || [])
        setInvoices(data.invoices || [])
        console.log('Loaded invoices:', data.invoices?.length || 0, 'invoices')
        setFiles(data.files || [])
        setTasks(data.tasks || [])
        setMilestones(data.milestones || [])
        setContracts(data.contracts || [])
        setForms(data.forms || [])
        setFormSubmissions(data.formSubmissions || [])
        setMessages(data.messages || [])
        setBookings(data.bookings || [])
        // Default all modules to on unless explicitly set to false
        const defaultModules = {
          timeline: true,
          files: true,
          invoices: true,
          contracts: true,
          forms: true,
          messages: true,
          "ai-assistant": true
        }
        setModuleStates(data.modules ? { ...defaultModules, ...data.modules } : defaultModules)
        
        // Default all projects to visible unless explicitly set to false
        const defaultProjectVisibility: Record<string, boolean> = {}
        if (data.projects && data.projects.length > 0) {
          data.projects.forEach((p: Project) => {
            // If projectVisibility exists and has this project, use it, otherwise default to true
            defaultProjectVisibility[p.id] = data.projectVisibility?.[p.id] ?? true
          })
        }
        setProjectVisibility(defaultProjectVisibility)
        setDefaultProject(data.defaultProject || 'newest')
        setBrandColor(data.portal.brandColor || "#4647E0")
        // Set initial selected project based on defaultProject setting
        if (data.projects && data.projects.length > 0) {
          const defaultProjectValue = data.defaultProject || 'newest'
          if (defaultProjectValue === 'newest' || defaultProjectValue === null) {
            // Select the newest project (first one in the list, sorted by creation date)
            setSelectedProject(data.projects[0].id)
          } else {
            // Just copy the defaultProject value directly - it's a project ID
            setSelectedProject(defaultProjectValue)
          }
        }
        setWelcomeMessage(data.portal.welcomeMessage || '')
        setLogoUrl(data.portal.logoUrl || '')
        setUseBackgroundImage(data.portal.useBackgroundImage ?? false)
        setBackgroundImageUrl(data.portal.backgroundImageUrl || '')
        setBackgroundImagePreview(data.portal.backgroundImageUrl || null)
        setBackgroundColor(data.portal.backgroundColor || '#4647E0')
        console.log('Set brandColor:', data.portal.brandColor)
        console.log('Set welcomeMessage:', data.portal.welcomeMessage)
        console.log('Set logoUrl:', data.portal.logoUrl)
        console.log('Set sidebarBgColor:', data.portal.sidebarBgColor)
        console.log('Set sidebarTextColor:', data.portal.sidebarTextColor)
        console.log('Set portalFont:', data.portal.portalFont)
        // Load company name from portal settings or account (only on initial load)
        if (!companyNameInitialized) {
          if (data.portal.companyName !== undefined && data.portal.companyName !== null) {
            setCompanyName(data.portal.companyName)
          } else if (account?.company_name) {
            setCompanyName(account.company_name)
          } else {
            setCompanyName('')
          }
          setCompanyNameInitialized(true)
        }
        // Sidebar & Font - these now come from merged settings
        setSidebarBgColor(data.portal.sidebarBgColor || '#FFFFFF')
        setSidebarTextColor(data.portal.sidebarTextColor || '#1F2937')
        setSidebarHighlightColor(data.portal.sidebarHighlightColor || (data.portal.brandColor || '#4647E0'))
        setSidebarHighlightTextColor(data.portal.sidebarHighlightTextColor || '#FFFFFF')
        setPortalFont(data.portal.portalFont || 'Inter')
        // Initialize task views from portal settings or default to both
        const loadedTaskViews = data.portal.taskViews || { milestones: true, board: true }
        setTaskViews({
          milestones: loadedTaskViews.milestones !== false,
          board: loadedTaskViews.board !== false
        })
        // Also set clientTaskViews for preview
        setClientTaskViews({
          milestones: loadedTaskViews.milestones !== false,
          board: loadedTaskViews.board !== false
        })
        // Login settings
        const login = data.portal.login || {}
        setLoginLogoUrl(login.logoUrl || '')
        setLoginWelcomeHeadline(login.welcomeHeadline || 'Welcome')
        setLoginWelcomeSubtitle(login.welcomeSubtitle || 'Login to access your portal')
        setLoginBgMode(login.bgMode || 'solid')
        setLoginBgColor(login.bgColor || '#F3F4F6')
        setLoginBgGradientFrom(login.bgGradientFrom || '#EEF2FF')
        setLoginBgGradientTo(login.bgGradientTo || '#F5F7FF')
        setLoginBgGradientAngle(typeof login.bgGradientAngle === 'number' ? login.bgGradientAngle : 135)
        setLoginBgImageUrl(login.bgImageUrl || '')
        setLoginImageFit(login.imageFit || 'cover')
        setLoginOverlayOpacity(typeof login.overlayOpacity === 'number' ? login.overlayOpacity : 20)
        setLoginBlur(!!login.blur)
        setLoginMagicLinkEnabled(typeof login.magicLinkEnabled === 'boolean' ? login.magicLinkEnabled : true)
        setLoginPasswordEnabled(!!login.passwordEnabled)
        setLoginActiveAuthMode(login.activeAuthMode === 'password' ? 'password' : 'magic')
        setLoginMagicLinkButtonLabel(login.magicLinkButtonLabel || 'Send Magic Link')
        setLoginPasswordButtonLabel(login.passwordButtonLabel || 'Sign In')
        setLoginShowResend(!!login.showResend)
      } else {
        toast.error(result.message || 'Failed to fetch portal settings')
      }
    } catch (error) {
      console.error('Error fetching portal settings:', error)
      toast.error('Failed to fetch portal settings')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (portalId) {
      fetchPortalSettings()
    }
  }, [portalId])

  // Update selectedProject when defaultProject or projects change to ensure it matches the default
  useEffect(() => {
    if (projects.length > 0 && defaultProject !== null) {
      // defaultProject can be 'newest' or a project ID like "84b02578-76df-40c1-a7e5-16d6938824e1"
      if (defaultProject === 'newest') {
        // Select the newest project (first one in the list, sorted by creation date)
        setSelectedProject(projects[0].id)
      } else {
        // Just copy the defaultProject value directly - it's a project ID
        setSelectedProject(defaultProject)
      }
    }
  }, [defaultProject, projects])

  // Handle ESC key to close preview modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showPreviewModal) {
        setShowPreviewModal(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showPreviewModal])

  const handleSaveChanges = async () => {
    try {
      setSaving(true)

      let newLogoUrl = logoUrl

      if (logoFile) {
        const uploadResult = await uploadPortalLogo(logoFile, portalId)
        if (uploadResult.success && uploadResult.url) {
          newLogoUrl = uploadResult.url
        } else {
          toast.error(uploadResult.error || 'Failed to upload logo')
          return
        }
      }

      const response = await fetch(`/api/portals/${portalId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portal: {
            name: portal?.name,
            description: portal?.description,
            brandColor,
            welcomeMessage,
            logoUrl: newLogoUrl,
            companyName,
            useBackgroundImage,
            backgroundImageUrl,
            backgroundColor,
            sidebarBgColor,
            sidebarTextColor,
            sidebarHighlightColor,
            sidebarHighlightTextColor,
            portalFont,
            taskViews: taskViews,
            login: {
              logoUrl: loginLogoUrl,
              welcomeHeadline: loginWelcomeHeadline,
              welcomeSubtitle: loginWelcomeSubtitle,
              bgMode: loginBgMode,
              bgColor: loginBgColor,
              bgGradientFrom: loginBgGradientFrom,
              bgGradientTo: loginBgGradientTo,
              bgGradientAngle: loginBgGradientAngle,
              bgImageUrl: loginBgImageUrl,
              imageFit: loginImageFit,
              overlayOpacity: loginOverlayOpacity,
              blur: loginBlur,
              magicLinkEnabled: loginMagicLinkEnabled,
              passwordEnabled: loginPasswordEnabled,
              activeAuthMode: loginActiveAuthMode,
              magicLinkButtonLabel: loginMagicLinkButtonLabel,
              passwordButtonLabel: loginPasswordButtonLabel,
              showResend: loginShowResend,
            }
          },
          modules: moduleStates,
          projects: projects.map(p => ({
            id: p.id,
            isVisible: projectVisibility[p.id] || false,
          })),
          defaultProject,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Portal saved successfully!')
        setHasChanges(false)
        setLogoFile(null)
        setLogoPreview('')
        setLogoUrl(newLogoUrl)
      } else {
        toast.error(result.message || 'Failed to save portal')
      }
    } catch (error) {
      console.error('Error saving portal:', error)
      toast.error('Failed to save portal')
    } finally {
      setSaving(false)
    }
  }


  const handlePublish = async () => {
    if (portal?.status === 'live') {
      toast.info('Portal is already published')
      return
    }

    // TODO: Implement publish logic
    toast.success('Portal published successfully!')
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const validation = validateLogoFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        return
      }

      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setHasChanges(true)
    }
  }

  const handleBackgroundImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setBackgroundImageFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        setImageToCrop(imageUrl)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error processing background image:', error)
      toast.error('Failed to process background image')
    }
  }

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      setBackgroundImagePreview(croppedImageUrl)

      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'cropped-background.jpg', { type: 'image/jpeg' })

      const uploadedUrl = await uploadPortalBackground(file, portalId as string)
      setBackgroundImageUrl(uploadedUrl)
      setUseBackgroundImage(true)
      setBackgroundImagePreview(uploadedUrl)
      setHasChanges(true)

      toast.success('Background image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading cropped background image:', error)
      toast.error('Failed to upload background image')
      setBackgroundImagePreview(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4647E0] mx-auto mb-4" />
          <p className="text-gray-600">Loading portal editor...</p>
        </div>
      </div>
    )
  }

  if (!portal || !client) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Portal not found</p>
          <Button onClick={() => router.push('/dashboard/portals')}>
            Back to Portals
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50" data-help="portal-editor-page">
      {getGoogleFontUrl(portalFont) && (
        <link rel="stylesheet" href={getGoogleFontUrl(portalFont) as string} />
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-6 py-4" data-help="portal-editor-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/workflow?active=portals')}
              className="text-gray-600 hover:text-gray-900"
              data-help="btn-back-to-workflow"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {viewMode === "portal" ? (
              <>
                <h1 className="text-xl font-bold text-gray-900">
                  {isGlobalTemplate ? 'Global Settings' : `Editing ${portal?.name || client.company}`}
                </h1>
              </>
            ) : (
              <>
                <h1 className="text-xl font-bold text-gray-900">Login Page</h1>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            {viewMode === "portal" ? (
              <>
                {!isGlobalTemplate && (
            <Button
                    variant="outline"
              size="sm"
                    onClick={() => router.push('/dashboard/portals/global/portal-settings')}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    Global Portal Settings
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
                  Preview
            </Button>
              </>
            ) : (
            <Button
              variant="outline"
              size="sm"
                onClick={() => setViewMode("portal")}
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portal
            </Button>
            )}
            <Button
              size="sm"
              onClick={handlePublish}
              disabled={saving}
              className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "portal" | "login")} className="mt-4">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="portal">Portal Page</TabsTrigger>
            {isGlobalTemplate && <TabsTrigger value="login">Login Page</TabsTrigger>}
          </TabsList>
        </Tabs>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Sidebar + Preview */}
        <div className="flex-1 flex overflow-hidden" data-help="portal-editor-left-side">
          {/* Left Sidebar - Navigation */}
          {viewMode === "portal" && (
          <div className="w-64 border-r border-gray-200 flex flex-col" style={{ backgroundColor: sidebarBgColor, fontFamily: portalFont }}>
          <style>{`
            .editor-nav-item:hover:not(.active) {
              background-color: ${lightenColor(sidebarBgColor, 10)} !important;
              color: ${sidebarTextColor} !important;
            }
          `}</style>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-1">
              {/* Client Branding Block */}
              <div className="px-3 py-6 mb-2">
                <div className="flex flex-col items-center text-center">
                  {logoPreview || logoUrl ? (
                    <>
                      <img
                        src={logoPreview || (logoUrl ? getPortalLogoUrl(logoUrl) : '')}
                        alt="Company logo"
                        className="h-14 w-14 mb-3 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                          const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                          if (placeholder) placeholder.style.display = 'flex'
                        }}
                      />
                      <div className="h-14 w-14 mb-3 rounded-lg hidden items-center justify-center bg-gradient-to-br from-[#4647E0] to-[#5757FF]">
                        <Building2 className="h-7 w-7 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="h-14 w-14 mb-3 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#4647E0] to-[#5757FF]">
                      <Building2 className="h-7 w-7 text-white" />
                    </div>
                  )}
                  <div className="w-full">
                    <div className="text-base font-bold truncate" style={{ color: sidebarTextColor }}>
                      {companyName || account?.company_name || client.company}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Selector */}
              {projects.length > 0 && (
                <div className="px-3 mb-3">
                  <Label htmlFor="sidebar-project-select" className="text-xs mb-1.5 block" style={{ color: sidebarTextColor }}>
                    Project
                  </Label>
                  <select
                    id="sidebar-project-select"
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
                // Always show home and settings
                if (section.id === 'home' || section.id === 'settings') return true
                // Show other sections only if enabled in moduleStates
                return moduleStates[section.id] !== false
              }).map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`editor-nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl ${isActive ? "active shadow-md" : ""}`}
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
        )}

          {/* Center - Preview */}
          <div className="flex-1 overflow-y-auto relative" style={{ fontFamily: portalFont }}>
          {viewMode === "portal" ? (
            <PortalPreview
              section={activeSection}
              brandColor={brandColor}
              welcomeMessage={welcomeMessage}
              logoUrl={logoPreview || logoUrl}
              backgroundImageUrl={useBackgroundImage ? (backgroundImagePreview || backgroundImageUrl) : ''}
              backgroundColor={!useBackgroundImage ? backgroundColor : ''}
              client={client}
              projects={projects.filter(p => projectVisibility[p.id])}
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
            />
          ) : (
            <div
              className="h-full flex items-center justify-center p-8"
              style={{
                background:
                  loginBgMode === 'solid'
                    ? loginBgColor
                    : loginBgMode === 'gradient'
                      ? `linear-gradient(${loginBgGradientAngle}deg, ${loginBgGradientFrom}, ${loginBgGradientTo})`
                      : undefined,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {loginBgMode === 'image' && loginBgImageUrl && (
                <div
                  className={`absolute inset-0 ${loginBlur ? 'backdrop-blur-sm' : ''}`}
                  style={{
                    backgroundImage: `url(${loginBgImageUrl})`,
                    backgroundSize: loginImageFit,
                    backgroundPosition: 'center',
                    filter: loginBlur ? 'blur(2px)' : 'none'
                  }}
                />
              )}
              {loginBgMode === 'image' && loginOverlayOpacity > 0 && (
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `rgba(0,0,0,${loginOverlayOpacity / 100})` }}
                />
              )}
              <div className="relative w-full flex items-center justify-center">
                <LoginPreview
                  brandColor={brandColor}
                  logoUrl={loginLogoUrl || logoPreview || logoUrl}
                  client={client}
                  device="desktop"
                  welcomeHeadline={loginWelcomeHeadline}
                  welcomeSubtitle={loginWelcomeSubtitle?.replace('{{PortalName}}', client?.company || 'your')}
                  magicLinkEnabled={loginMagicLinkEnabled}
                  passwordEnabled={loginPasswordEnabled}
                  activeAuthMode={loginActiveAuthMode}
                  magicLinkButtonLabel={loginMagicLinkButtonLabel}
                  passwordButtonLabel={loginPasswordButtonLabel}
                  showResend={loginShowResend}
                />
              </div>
            </div>
          )}
        </div>
        </div>

        {/* Right Sidebar - Settings */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto" data-help="portal-editor-settings-panel">
          <div className="p-6">
              {viewMode === "portal" ? (
              <PortalSettings
                brandColor={brandColor}
                setBrandColor={(color) => {
                  setBrandColor(color)
                  setHasChanges(true)
                }}
                customColor={customColor}
                setCustomColor={setCustomColor}
                welcomeMessage={welcomeMessage}
                setWelcomeMessage={(msg) => {
                  setWelcomeMessage(msg)
                  setHasChanges(true)
                }}
                logoUrl={logoPreview || logoUrl}
                onLogoUpload={handleLogoUpload}
                companyName={companyName}
                setCompanyName={(name) => {
                  setCompanyName(name)
                  setHasChanges(true)
                }}
                useBackgroundImage={useBackgroundImage}
                setUseBackgroundImage={(val) => {
                  setUseBackgroundImage(val)
                  setHasChanges(true)
                }}
                backgroundImageUrl={backgroundImagePreview || backgroundImageUrl}
                onBackgroundImageUpload={handleBackgroundImageChange}
                backgroundColor={backgroundColor}
                setBackgroundColor={(color) => {
                  setBackgroundColor(color)
                  setHasChanges(true)
                }}
                customBackgroundColor={customBackgroundColor}
                setCustomBackgroundColor={setCustomBackgroundColor}
                moduleStates={moduleStates}
                setModuleStates={(states) => {
                  setModuleStates(states)
                  setHasChanges(true)
                }}
                projects={projects}
                projectVisibility={projectVisibility}
                setProjectVisibility={(vis) => {
                  setProjectVisibility(vis)
                  setHasChanges(true)
                }}
                defaultProject={defaultProject}
                setDefaultProject={(project) => {
                  setDefaultProject(project)
                  setHasChanges(true)
                }}
                selectedProject={selectedProject}
                setSelectedProject={setSelectedProject}
                sidebarBgColor={sidebarBgColor}
                setSidebarBgColor={(c: string) => { setSidebarBgColor(c); setHasChanges(true) }}
                sidebarTextColor={sidebarTextColor}
                setSidebarTextColor={(c: string) => { setSidebarTextColor(c); setHasChanges(true) }}
                portalFont={portalFont}
                setPortalFont={(f) => { setPortalFont(f); setHasChanges(true) }}
                googleFonts={googleFonts}
                sidebarHighlightColor={sidebarHighlightColor}
                setSidebarHighlightColor={(c: string) => { setSidebarHighlightColor(c); setHasChanges(true) }}
                sidebarHighlightTextColor={sidebarHighlightTextColor}
                setSidebarHighlightTextColor={(c: string) => { setSidebarHighlightTextColor(c); setHasChanges(true) }}
                taskViews={taskViews}
                setTaskViews={(views) => { 
                  setTaskViews(views)
                  setClientTaskViews(views) // Sync with preview
                  setHasChanges(true) 
                }}
              />
              ) : (
                <LoginSettings
                  // Branding
                  loginLogoUrl={loginLogoUrl || logoPreview || logoUrl}
                  onLoginLogoUpload={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    
                    // Validate file first
                    const validation = validateLogoFile(file)
                    if (!validation.valid) {
                      toast.error(validation.error || 'Invalid file')
                      return
                    }
                    
                    // For global portal, we need to use account_id instead of 'global'
                    let uploadPortalId = portalId as string
                    if (portalId === 'global') {
                      if (!account?.id) {
                        toast.error('Account information not loaded. Please try again.')
                        return
                      }
                      uploadPortalId = account.id
                    }
                    
                    setHasChanges(true)
                    
                    try {
                      const uploadResult = await uploadPortalLogo(file, uploadPortalId)
                      if (uploadResult.success && uploadResult.url) {
                        setLoginLogoUrl(uploadResult.url)
                        toast.success('Logo uploaded successfully')
                      } else {
                        console.error('Upload failed:', uploadResult.error)
                        toast.error(uploadResult.error || 'Failed to upload logo')
                      }
                    } catch (error: any) {
                      console.error('Error uploading login logo:', error)
                      toast.error(error?.message || 'Failed to upload logo')
                    } finally {
                      // Reset file input to allow re-uploading the same file
                      if (e.target) {
                        e.target.value = ''
                      }
                    }
                  }}
                  welcomeHeadline={loginWelcomeHeadline}
                  setWelcomeHeadline={(v) => { setLoginWelcomeHeadline(v); setHasChanges(true) }}
                  welcomeSubtitle={loginWelcomeSubtitle}
                  setWelcomeSubtitle={(v) => { setLoginWelcomeSubtitle(v); setHasChanges(true) }}
                  // Background
                  bgMode={loginBgMode}
                  setBgMode={(v) => { setLoginBgMode(v); setHasChanges(true) }}
                  bgColor={loginBgColor}
                  setBgColor={(v) => { setLoginBgColor(v); setHasChanges(true) }}
                  bgGradientFrom={loginBgGradientFrom}
                  setBgGradientFrom={(v) => { setLoginBgGradientFrom(v); setHasChanges(true) }}
                  bgGradientTo={loginBgGradientTo}
                  setBgGradientTo={(v) => { setLoginBgGradientTo(v); setHasChanges(true) }}
                  bgGradientAngle={loginBgGradientAngle}
                  setBgGradientAngle={(v) => { setLoginBgGradientAngle(v); setHasChanges(true) }}
                  bgImageUrl={loginBgImageUrl}
                  onBgImageUpload={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setHasChanges(true)
                    const uploadedUrl = await uploadPortalBackground(file, portalId as string)
                    if (uploadedUrl) {
                      setLoginBgImageUrl(uploadedUrl)
                    } else {
                      toast.error('Failed to upload background')
                    }
                  }}
                  imageFit={loginImageFit}
                  setImageFit={(v) => { setLoginImageFit(v); setHasChanges(true) }}
                  overlayOpacity={loginOverlayOpacity}
                  setOverlayOpacity={(v) => { setLoginOverlayOpacity(v); setHasChanges(true) }}
                  blur={loginBlur}
                  setBlur={(v) => { setLoginBlur(v); setHasChanges(true) }}
                  // Auth
                  magicLinkEnabled={loginMagicLinkEnabled}
                  setMagicLinkEnabled={(v) => {
                    if (!v && !loginPasswordEnabled) {
                      toast.error('At least one authentication method must be enabled')
                      return
                    }
                    setLoginMagicLinkEnabled(v)
                    if (v) setLoginActiveAuthMode('magic')
                    setHasChanges(true)
                  }}
                  passwordEnabled={loginPasswordEnabled}
                  setPasswordEnabled={(v) => {
                    if (!v && !loginMagicLinkEnabled) {
                      toast.error('At least one authentication method must be enabled')
                      return
                    }
                    setLoginPasswordEnabled(v)
                    if (v) setLoginActiveAuthMode('password')
                    setHasChanges(true)
                  }}
                  magicLinkButtonLabel={loginMagicLinkButtonLabel}
                  setMagicLinkButtonLabel={(v) => { setLoginMagicLinkButtonLabel(v); setHasChanges(true) }}
                  passwordButtonLabel={loginPasswordButtonLabel}
                  setPasswordButtonLabel={(v) => { setLoginPasswordButtonLabel(v); setHasChanges(true) }}
                  showResend={loginShowResend}
                  setShowResend={(v) => { setLoginShowResend(v); setHasChanges(true) }}
                />
              )}
            </div>

          {/* Save Button */}
          {hasChanges && (
            <div className="sticky bottom-0 p-4 border-t border-gray-200 bg-white" data-help="portal-editor-save">
              <Button
                onClick={handleSaveChanges}
                disabled={saving}
                className="w-full bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                data-help="btn-save-portal-settings"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          {/* Preview Header */}
          <div className="bg-gray-900 text-white px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreviewModal(false)}
                className="text-white hover:bg-gray-800"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Button>
              <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2 flex-1 max-w-2xl">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-mono text-gray-300">
                  clientportal.@{client?.company?.toLowerCase().replace(/\s+/g, '')}.jolix.io
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreviewModal(false)}
              className="text-white hover:bg-gray-800 ml-4"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Client Sidebar */}
            <div className="w-64 flex flex-col overflow-y-auto" style={{ backgroundColor: sidebarBgColor, fontFamily: portalFont }}>
              <style>{`
                .preview-nav-item:hover:not(.active) {
                  background-color: ${lightenColor(sidebarBgColor, 10)} !important;
                  color: ${sidebarTextColor} !important;
                }
              `}</style>
              <div className="p-4 space-y-1">
                {/* Client Branding Block */}
                <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-gray-200">
                  {logoPreview || logoUrl ? (
                    <img
                      src={logoPreview || (logoUrl ? getPortalLogoUrl(logoUrl) : '')}
                      alt="Company logo"
                      className="h-14 w-14 mb-3 rounded-lg object-contain"
                    />
                  ) : (
                    <Avatar className="h-14 w-14 mb-3">
                      <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-lg">
                        {account?.company_name ? account.company_name.substring(0, 2).toUpperCase() : client.avatar}
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
                    <Label htmlFor="preview-project-select" className="text-xs mb-1.5 block" style={{ color: sidebarTextColor }}>
                      Project
                    </Label>
                    <select
                      id="preview-project-select"
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
                  // Always show home and settings
                  if (section.id === 'home' || section.id === 'settings') return true
                  // Show other sections only if enabled in moduleStates
                  return moduleStates[section.id] !== false
                }).map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`preview-nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl ${isActive ? "active shadow-md" : ""}`}
                      style={isActive ? { backgroundColor: sidebarHighlightColor, color: sidebarHighlightTextColor } : { color: sidebarTextColor }}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}

              </div>
            </div>

            {/* Portal Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50" style={{ fontFamily: portalFont }}>
            <PortalPreview
              section={activeSection}
              brandColor={brandColor}
              welcomeMessage={welcomeMessage}
              logoUrl={logoPreview || logoUrl}
              backgroundImageUrl={useBackgroundImage ? (backgroundImagePreview || backgroundImageUrl) : ''}
              backgroundColor={!useBackgroundImage ? backgroundColor : ''}
              client={client}
              projects={projects.filter(p => projectVisibility[p.id])}
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
            />
            </div>
          </div>
        </div>
      )}

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        imageUrl={imageToCrop}
        onCrop={handleCropComplete}
        aspectRatio={6}
        recommendedSize={{ width: 1200, height: 200 }}
      />
    </div>
  )
}

// Login Settings Component (Right Sidebar for Login Page)
function LoginSettings({
  // Branding
  loginLogoUrl,
  onLoginLogoUpload,
  welcomeHeadline,
  setWelcomeHeadline,
  welcomeSubtitle,
  setWelcomeSubtitle,
  // Background
  bgMode,
  setBgMode,
  bgColor,
  setBgColor,
  bgGradientFrom,
  setBgGradientFrom,
  bgGradientTo,
  setBgGradientTo,
  bgGradientAngle,
  setBgGradientAngle,
  bgImageUrl,
  onBgImageUpload,
  imageFit,
  setImageFit,
  overlayOpacity,
  setOverlayOpacity,
  blur,
  setBlur,
  // Auth
  magicLinkEnabled,
  setMagicLinkEnabled,
  passwordEnabled,
  setPasswordEnabled,
  magicLinkButtonLabel,
  setMagicLinkButtonLabel,
  passwordButtonLabel,
  setPasswordButtonLabel,
  showResend,
  setShowResend,
}: {
  loginLogoUrl: string
  onLoginLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  welcomeHeadline: string
  setWelcomeHeadline: (v: string) => void
  welcomeSubtitle: string
  setWelcomeSubtitle: (v: string) => void
  bgMode: "solid" | "gradient" | "image"
  setBgMode: (v: "solid" | "gradient" | "image") => void
  bgColor: string
  setBgColor: (v: string) => void
  bgGradientFrom: string
  setBgGradientFrom: (v: string) => void
  bgGradientTo: string
  setBgGradientTo: (v: string) => void
  bgGradientAngle: number
  setBgGradientAngle: (v: number) => void
  bgImageUrl: string
  onBgImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  imageFit: "cover" | "contain"
  setImageFit: (v: "cover" | "contain") => void
  overlayOpacity: number
  setOverlayOpacity: (v: number) => void
  blur: boolean
  setBlur: (v: boolean) => void
  magicLinkEnabled: boolean
  setMagicLinkEnabled: (v: boolean) => void
  passwordEnabled: boolean
  setPasswordEnabled: (v: boolean) => void
  magicLinkButtonLabel: string
  setMagicLinkButtonLabel: (v: string) => void
  passwordButtonLabel: string
  setPasswordButtonLabel: (v: string) => void
  showResend: boolean
  setShowResend: (v: boolean) => void
}) {
  return (
    <div className="space-y-8">
      {/* Branding */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>
        <div className="space-y-4">
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#4647E0] transition-colors"
            onClick={() => document.getElementById('login-logo-upload')?.click()}
          >
            <input 
              id="login-logo-upload" 
              type="file" 
              accept="image/jpeg,image/png,image/svg+xml,image/webp" 
              onChange={onLoginLogoUpload} 
              className="hidden" 
            />
            {loginLogoUrl ? (
              <div className="space-y-2">
                <img src={getPortalLogoUrl(loginLogoUrl)} alt="Logo" className="h-12 mx-auto object-contain" />
                <p className="text-xs text-gray-600">Click to change</p>
              </div>
            ) : (
              <>
                <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">Upload logo</p>
              </>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Welcome Headline</Label>
            <Input value={welcomeHeadline} onChange={(e) => setWelcomeHeadline(e.target.value)} placeholder="Welcome" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subtitle</Label>
            <Input value={welcomeSubtitle} onChange={(e) => setWelcomeSubtitle(e.target.value)} placeholder="Login to access your portal" />
          </div>
        </div>
      </div>

      {/* Background */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Background</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className={`rounded-lg ${bgMode === 'solid' ? 'bg-gray-100 font-medium' : ''}`} onClick={() => setBgMode('solid')}>Solid</Button>
            <Button size="sm" variant="ghost" className={`rounded-lg ${bgMode === 'gradient' ? 'bg-gray-100 font-medium' : ''}`} onClick={() => setBgMode('gradient')}>Gradient</Button>
            <Button size="sm" variant="ghost" className={`rounded-lg ${bgMode === 'image' ? 'bg-gray-100 font-medium' : ''}`} onClick={() => setBgMode('image')}>Image</Button>
          </div>

          {bgMode === 'solid' && (
            <div className="flex items-center gap-2">
              <Input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-12 h-8 p-1" />
              <span className="text-xs text-gray-600 font-mono">{bgColor}</span>
            </div>
          )}

          {bgMode === 'gradient' && (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">From</span>
                  <Input type="color" value={bgGradientFrom} onChange={(e) => setBgGradientFrom(e.target.value)} className="w-12 h-8 p-1" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">To</span>
                  <Input type="color" value={bgGradientTo} onChange={(e) => setBgGradientTo(e.target.value)} className="w-12 h-8 p-1" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Angle ({bgGradientAngle}°)</Label>
                <input type="range" min={0} max={360} value={bgGradientAngle} onChange={(e) => setBgGradientAngle(Number(e.target.value))} className="w-full" />
              </div>
            </div>
          )}

          {bgMode === 'image' && (
            <div className="space-y-3">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#4647E0] transition-colors"
                onClick={() => document.getElementById('login-bg-upload')?.click()}
              >
                <input id="login-bg-upload" type="file" accept="image/*" onChange={onBgImageUpload} className="hidden" />
                {bgImageUrl ? (
                  <div className="space-y-2">
                    <img src={bgImageUrl} alt="Background" className="h-16 w-full object-cover rounded-lg" />
                    <p className="text-xs text-gray-600">Click to change</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Upload background</p>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-600">Fit</Label>
                <select value={imageFit} onChange={(e) => setImageFit(e.target.value as "cover" | "contain")} className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs">
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-600">Overlay Opacity ({overlayOpacity}%)</Label>
                <input type="range" min={0} max={60} value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Blur background</span>
                <Switch checked={blur} onCheckedChange={setBlur} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Authentication Options */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Authentication</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Magic Link</span>
            <Switch checked={magicLinkEnabled} onCheckedChange={setMagicLinkEnabled} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Password</span>
            <Switch checked={passwordEnabled} onCheckedChange={setPasswordEnabled} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Magic Link Button Label</Label>
            <Input value={magicLinkButtonLabel} onChange={(e) => setMagicLinkButtonLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Password Button Label</Label>
            <Input value={passwordButtonLabel} onChange={(e) => setPasswordButtonLabel(e.target.value)} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Show "Resend link" (Magic Link)</span>
            <Switch checked={showResend} onCheckedChange={setShowResend} />
          </div>
        </div>
      </div>
    </div>
  )
}

// Messages Section Component
function MessagesSection({ brandColor, messages, selectedProject, client, account }: { brandColor: string; messages: any[]; selectedProject: string; client: Client; account: Account | null }) {
  const [newMessage, setNewMessage] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [localMessages, setLocalMessages] = useState(messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Update local messages when prop changes
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  // Filter messages by selected project and sort by date (oldest first for display - newest at bottom)
  const projectFilteredMessages = (selectedProject === 'all' 
    ? localMessages 
    : localMessages.filter(m => !m.project_id || m.project_id === selectedProject)
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Format time helper
  const formatTime = (dateString: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    // If same day, show time
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    }
    // If yesterday
    if (diffDays === 1) {
      return 'Yesterday'
    }
    // If within a week
    if (diffDays < 7) {
      return `${diffDays} days ago`
    }
    // Otherwise show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Group messages by date
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { [key: string]: any[] } = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at)
      msgDate.setHours(0, 0, 0, 0)
      const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24))
      
      let dateLabel = 'Today'
      if (diffDays === 1) dateLabel = 'Yesterday'
      else if (diffDays > 1 && diffDays < 7) dateLabel = `${diffDays} days ago`
      else if (diffDays >= 7) dateLabel = msgDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      
      if (!groups[dateLabel]) {
        groups[dateLabel] = []
      }
      groups[dateLabel].push(msg)
    })
    
    return groups
  }

  const groupedMessages = groupMessagesByDate(projectFilteredMessages)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [localMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  // Remove selected file
  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload file and get URL
  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!client || !account) {
      toast.error('Client or account information missing')
      return null
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('isPreview', 'true')
      formData.append('clientId', client.id)
      formData.append('accountId', account.id)
      formData.append('projectId', selectedProject !== 'all' ? selectedProject : '')

      const response = await fetch('/api/client-portal/upload-file', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (!response.ok) {
        toast.error(result.message || 'Failed to upload attachment')
        return null
      }

      return result.data?.publicUrl || null
    } catch (error) {
      console.error('Error uploading attachment:', error)
      toast.error('Error uploading attachment')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) {
      return
    }

    if (!account || !client) {
      toast.error('Account or client information missing')
      return
    }

    if (selectedProject === 'all') {
      toast.error('Please select a project to send messages')
      return
    }

    setIsSending(true)
    try {
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      let attachmentType: string | null = null
      let attachmentSize: number | null = null

      // Upload file if one is selected
      if (selectedFile) {
        attachmentUrl = await uploadAttachment(selectedFile)
        if (!attachmentUrl) {
          setIsSending(false)
          return
        }
        attachmentName = selectedFile.name
        attachmentType = selectedFile.type
        attachmentSize = selectedFile.size
      }

      // Send message
      const messageData = {
        projectId: selectedProject,
        accountId: account.id,
        content: newMessage.trim() || (selectedFile ? `Sent ${selectedFile.name}` : ''),
        senderName: `${client.firstName} ${client.lastName}`,
        senderType: 'client',
        clientId: client.id,
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize
      }

      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      })

      const result = await response.json()

      if (result.success) {
        // Add new message to local state
        setLocalMessages(prev => [...prev, result.data])
        setNewMessage("")
        setSelectedFile(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        toast.success('Message sent')
        // Scroll will happen automatically via useEffect
      } else {
        toast.error(result.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (fileName: string, fileType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return '🖼️'
    if (['pdf'].includes(ext || '')) return '📄'
    if (['doc', 'docx'].includes(ext || '')) return '📝'
    if (['xls', 'xlsx'].includes(ext || '')) return '📊'
    return '📎'
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
        <p className="text-sm text-gray-600 mt-1">Communicate with your team</p>
      </div>

      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          {/* Chat Thread */}
          <div ref={messagesContainerRef} className="space-y-6 mb-6 max-h-[500px] overflow-y-auto">
            {projectFilteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">No messages yet</p>
                <p className="text-sm text-gray-400 mt-1">Start a conversation with your team</p>
              </div>
            ) : (
              Object.entries(groupedMessages).map(([dateLabel, dateMessages]) => (
                <div key={dateLabel}>
                  {/* Date Divider */}
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-gray-500 font-medium">{dateLabel}</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {dateMessages.map((message) => {
                    const isClient = message.sender_type === "client"
                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${isClient ? "items-end" : "items-start"} mb-4`}
                      >
                        {/* Sender Label */}
                        {isClient ? (
                          <span className="text-xs text-gray-500 mb-1 mr-2">You</span>
                        ) : (
                          message.sender_name && (
                            <span className="text-xs text-gray-500 mb-1 ml-2">{message.sender_name}</span>
                          )
                        )}
                        
                        {/* Message Bubble */}
                        <div
                          className={`max-w-[70%] ${
                            isClient
                              ? "bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white"
                              : "bg-gray-100 text-gray-900"
                          } rounded-2xl px-4 py-3 shadow-sm`}
                          style={
                            isClient
                              ? { background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)` }
                              : {}
                          }
                        >
                          {message.content && (
                            <p className="text-sm leading-relaxed">{message.content}</p>
                          )}
                          
                          {/* Attachment Display */}
                          {message.attachment_url && (
                            <div className={`mt-2 ${message.content ? 'mt-3' : ''}`}>
                              <a
                                href={message.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                  isClient
                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                                }`}
                              >
                                <span className="text-lg">{getFileIcon(message.attachment_name || '', message.attachment_type || '')}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{message.attachment_name || 'Attachment'}</p>
                                  {message.attachment_size && (
                                    <p className={`text-xs ${isClient ? 'text-white/70' : 'text-gray-500'}`}>
                                      {formatFileSize(message.attachment_size)}
                                    </p>
                                  )}
                                </div>
                                <Download className={`h-3 w-3 ${isClient ? 'text-white/80' : 'text-gray-400'}`} />
                              </a>
                            </div>
                          )}
                          
                          <span
                            className={`text-xs mt-1 block ${
                              isClient ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {formatTime(message.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="border-t pt-3 mb-3">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <span className="text-lg">{getFileIcon(selectedFile.name, selectedFile.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeSelectedFile}
                  className="h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Type your message..."
                className="flex-1 rounded-xl"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={isSending || isUploading}
              />
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSending || isUploading}
              />
              <Button
                variant="outline"
                size="icon"
                className="rounded-xl"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Paperclip className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                className="rounded-xl text-white"
                style={{ backgroundColor: brandColor }}
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedFile) || isSending || isUploading}
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tasks Section Component
function TasksSection({ 
  brandColor, 
  tasks, 
  milestones, 
  taskViews, 
  selectedProject,
  onTaskViewsChange 
}: { 
  brandColor: string
  tasks: any[]
  milestones?: any[]
  taskViews?: {milestones: boolean; board: boolean}
  selectedProject: string
  onTaskViewsChange?: (views: {milestones: boolean; board: boolean}) => void
}) {
  const [activeView, setActiveView] = useState<'milestones' | 'board'>('milestones')
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set())

  // Default taskViews if not provided - default to both enabled
  const views = taskViews || { milestones: true, board: true }

  // Filter tasks by selected project
  const projectFilteredTasks = selectedProject === 'all' 
    ? tasks 
    : tasks.filter(t => !t.project_id || t.project_id === selectedProject)

  // Get task status - map database status to display status
  const getTaskStatus = (task: any): 'todo' | 'in-progress' | 'done' => {
    if (task.status === 'done' || task.status === 'completed') return 'done'
    if (task.status === 'in-progress' || task.status === 'in_progress') return 'in-progress'
    return 'todo'
  }

  // Toggle milestone expansion
  const toggleMilestone = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  // Get milestones - use provided milestones or extract from tasks
  let projectMilestones: any[] = []
  
  if (milestones && milestones.length > 0) {
    // Filter milestones by selected project
    projectMilestones = selectedProject === 'all'
      ? milestones
      : milestones.filter((m: any) => !m.project_id || m.project_id === selectedProject)
  } else {
    // Fallback: extract milestones from tasks that have milestone data attached
    const milestoneMap = new Map<string, any>()
    
    projectFilteredTasks.forEach(task => {
      if (task.milestone_id && task.milestone && !milestoneMap.has(task.milestone_id)) {
        milestoneMap.set(task.milestone_id, {
          id: task.milestone_id,
          title: task.milestone.title,
          description: task.milestone.description,
          status: task.milestone.status || 'pending',
          due_date: task.milestone.due_date,
        })
      }
    })
    
    projectMilestones = Array.from(milestoneMap.values())
  }

  // Get tasks without milestones
  const tasksWithoutMilestone = projectFilteredTasks.filter(t => !t.milestone_id)

  // Show tabs only if multiple views are enabled
  const availableViews = []
  if (views.milestones) availableViews.push('milestones')
  if (views.board) availableViews.push('board')
  
  // Set active view to first available if current is disabled
  useEffect(() => {
    const availableViews = []
    if (views.milestones) availableViews.push('milestones')
    if (views.board) availableViews.push('board')
    
    if (!availableViews.includes(activeView)) {
      if (availableViews.length > 0) {
        setActiveView(availableViews[0] as 'milestones' | 'board')
      }
    }
  }, [views.milestones, views.board, activeView])

  const showTabs = availableViews.length > 1

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="text-sm text-gray-600 mt-1">Track project milestones and action items</p>
        </div>
        
      </div>

      {projectFilteredTasks.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-200">
          <CardContent className="p-12 text-center">
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-900 font-medium mb-2">No tasks yet</p>
            <p className="text-gray-500 text-sm">Tasks will appear here once they're created for your project</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* View Toggle */}
          {showTabs && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 w-fit">
              {views.milestones && (
                <button
                  onClick={() => setActiveView('milestones')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeView === 'milestones'
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={activeView === 'milestones' ? { backgroundColor: brandColor } : {}}
                >
                  Milestones
                </button>
              )}
              {views.board && (
                <button
                  onClick={() => setActiveView('board')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    activeView === 'board'
                      ? 'text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={activeView === 'board' ? { backgroundColor: brandColor } : {}}
                >
                  Board
                </button>
              )}
            </div>
          )}

          {/* Milestones View */}
          {activeView === 'milestones' && views.milestones && (
            <div className="space-y-4">
              {/* Milestones with tasks */}
              {projectMilestones.map((milestone) => {
                const milestoneTasks = projectFilteredTasks.filter(t => t.milestone_id === milestone.id)
                const completedTasks = milestoneTasks.filter(t => getTaskStatus(t) === 'done').length
                const progressPercent = milestoneTasks.length > 0 ? Math.round((completedTasks / milestoneTasks.length) * 100) : 0
                const isExpanded = expandedMilestones.has(milestone.id)

                return (
                  <Card key={milestone.id} className="border border-gray-200 hover:shadow-md transition-all duration-200">
                    <CardHeader className="cursor-pointer" onClick={() => toggleMilestone(milestone.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">{milestone.title}</h3>
                            <Badge className={`${
                              milestone.status === 'completed' ? 'bg-green-100 text-green-700 border-green-200' :
                              milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                              'bg-gray-100 text-gray-700 border-gray-200'
                            } border pointer-events-none`}>
                              {milestone.status === 'completed' ? 'Completed' :
                               milestone.status === 'in-progress' ? 'In Progress' :
                               'Pending'}
                            </Badge>
                          </div>
                          {milestone.description && (
                            <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                                <div 
                                  className={`h-2 rounded-full transition-all ${
                                    progressPercent === 100 ? 'bg-green-600' : ''
                                  }`}
                                  style={{ 
                                    width: `${progressPercent}%`,
                                    backgroundColor: progressPercent === 100 ? undefined : brandColor
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-600 font-medium">{progressPercent}%</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {completedTasks}/{milestoneTasks.length} tasks
                            </span>
                            {milestone.due_date && (
                              <span className="text-xs text-gray-500 flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                {new Date(milestone.due_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent className="p-4 space-y-2">
                        {milestoneTasks.length === 0 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                            <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>No tasks in this milestone yet</p>
                          </div>
                        ) : (
                          milestoneTasks.map((task) => {
                            const isDone = getTaskStatus(task) === 'done'
                            const due = task.due_date ? new Date(task.due_date) : null
                            const overdue = !!(due && !isDone && due < new Date())
                            const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 2)
                            
                            return (
                              <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  readOnly
                                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                                  style={{ accentColor: brandColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                      {task.title}
                                    </span>
                                    {overdue && !isDone && (
                                      <Badge variant="destructive" className="text-xs pointer-events-none">Overdue</Badge>
                                    )}
                                    {dueSoon && !isDone && (
                                      <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 pointer-events-none">Due Soon</Badge>
                                    )}
                                  </div>
                                  {task.description && (
                                    <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                  )}
                                  {due && (
                                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                      <CalendarDays className="h-3 w-3" />
                                      {due.toLocaleDateString()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </CardContent>
                    )}
                  </Card>
                )
              })}
            </div>
          )}

          {/* Board View */}
          {activeView === 'board' && views.board && (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {[
                { key: 'todo', label: 'To Do', color: 'gray' },
                { key: 'in-progress', label: 'Doing', color: 'blue' },
                { key: 'done', label: 'Done', color: 'green' },
              ].map((col) => {
                const colTasks = projectFilteredTasks.filter((t) => getTaskStatus(t) === col.key)
                return (
                  <div key={col.key} className="flex-shrink-0 w-80">
                    <Card className="bg-gray-50/50 border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            {col.label}
                            <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
                          </h4>
                        </div>

                        <div className="space-y-3 min-h-[100px]">
                          {colTasks.map((task) => {
                            const isDone = getTaskStatus(task) === 'done'
                            const due = task.due_date ? new Date(task.due_date) : null
                            const overdue = !!(due && !isDone && due < new Date())
                            const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 2)
                            return (
                              <Card
                                key={task.id}
                                className="bg-white hover:shadow-lg transition-all duration-200 border border-gray-200"
                                style={{ borderColor: brandColor + '20' }}
                              >
                                <CardContent className="p-3">
                                  <h5 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{task.title}</h5>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      {due && (
                                        <Badge
                                          variant="outline"
                                          className={`text-xs pointer-events-none ${
                                            overdue
                                              ? 'bg-red-50 text-red-700 border-red-200'
                                              : dueSoon
                                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                : 'bg-gray-50 text-gray-600 border-gray-200'
                                          }`}
                                        >
                                          {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Contracts Section Component
function ContractsSection({ brandColor, contracts, selectedProject, account, client, onContractUpdate }: { brandColor: string; contracts: any[]; selectedProject: string; account?: Account | null; client?: Client; onContractUpdate?: (updatedContract: any) => void }) {
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [showContractViewModal, setShowContractViewModal] = useState(false)
  const [showContractSignModal, setShowContractSignModal] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)

  // Filter contracts by selected project and exclude drafts
  const projectFilteredContracts = (selectedProject === 'all' 
    ? contracts 
    : contracts.filter(c => !c.project_id || c.project_id === selectedProject)
  ).filter(c => c.status !== 'draft')

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getStatusInfo = (status: string, contract: any) => {
    // In client portal, if client has signed, show "Signed" even if status is partially_signed
    const clientHasSigned = contract.client_signature_status === 'signed'
    const displayStatus = (status === 'partially_signed' && clientHasSigned) ? 'signed' : status
    
    switch (displayStatus) {
      case "signed":
        return {
          badge: <Badge className="bg-green-100 text-green-700 border-green-200 border pointer-events-none">Signed</Badge>,
          icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
        }
      case "awaiting_signature":
      case "sent":
      case "partially_signed":
        return {
          badge: <Badge className="bg-amber-100 text-amber-700 border-amber-200 border pointer-events-none">Awaiting Signature</Badge>,
          icon: <PenLine className="h-5 w-5 text-amber-600" />,
        }
      case "declined":
        return {
          badge: <Badge className="bg-red-100 text-red-700 border-red-200 border pointer-events-none">Declined</Badge>,
          icon: <X className="h-5 w-5 text-red-600" />,
        }
      case "expired":
        return {
          badge: <Badge className="bg-gray-100 text-gray-700 border-gray-200 border pointer-events-none">Expired</Badge>,
          icon: <Clock className="h-5 w-5 text-gray-600" />,
        }
      case "archived":
        return {
          badge: <Badge className="bg-gray-100 text-gray-700 border-gray-200 border pointer-events-none">Archived</Badge>,
          icon: <FileText className="h-5 w-5 text-gray-600" />,
        }
      default:
        return {
          badge: <Badge className="bg-gray-100 text-gray-700 border-gray-200 border pointer-events-none">{status}</Badge>,
          icon: <FileText className="h-5 w-5 text-gray-600" />,
        }
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Contracts</h2>
        <p className="text-sm text-gray-600 mt-1">View and manage your agreements</p>
      </div>

      {/* Contracts List */}
      <div className="grid grid-cols-1 gap-4">
        {projectFilteredContracts.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-200">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-900 font-medium mb-2">No contracts available</p>
              <p className="text-gray-500 text-sm">Contracts will appear here once they're shared with you</p>
            </CardContent>
          </Card>
        ) : (
          projectFilteredContracts.map((contract) => {
            const statusInfo = getStatusInfo(contract.status, contract)
            // Only show sign button if client hasn't signed yet
            const clientHasSigned = contract.client_signature_status === 'signed'
            const needsSignature = !clientHasSigned && (contract.status === 'sent' || contract.status === 'awaiting_signature' || contract.status === 'partially_signed')
            
            return (
              <Card
                key={contract.id}
                className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
                      style={{ backgroundColor: `${brandColor}15` }}
                    >
                      {statusInfo.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{contract.name}</h3>
                          <div className="flex items-center gap-3 mb-3">
                            {statusInfo.badge}
                            {contract.contract_number && (
                              <span className="text-xs text-gray-500">#{contract.contract_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {contract.description && (
                        <p className="text-sm text-gray-600 mb-3">{contract.description}</p>
                      )}
                      <div className="space-y-1 text-sm text-gray-600 mb-4">
                        {contract.signed_at && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Signed:</span>
                            <span>{formatDate(contract.signed_at)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Last updated:</span>
                          <span>{formatDate(contract.updated_at || contract.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-xl"
                          onClick={() => {
                            setSelectedContract(contract)
                            setShowContractViewModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        {needsSignature && (
                          <Button
                            size="sm"
                            className="rounded-xl text-white"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => {
                              setSelectedContract(contract)
                              setShowContractSignModal(true)
                            }}
                          >
                            <PenLine className="h-4 w-4 mr-2" />
                            Sign
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-xl"
                          onClick={async () => {
                            if (!contract) return
                            try {
                              setDownloadingPDF(contract.id)
                              
                              // Generate contract HTML using the same logic as ContractPreviewModal
                              const content = contract.contract_content || {}
                              const branding = content.branding || {}
                              const company = content.company || {}
                              const client = content.client || {}
                              const terms = content.terms || {}
                              const paymentPlan = content.paymentPlan || {}
                              const scope = content.scope || {}
                              
                              // Helper to get payment schedule
                              const getPaymentSchedule = () => {
                                if (paymentPlan.schedule && Array.isArray(paymentPlan.schedule)) {
                                  return paymentPlan.schedule
                                }
                                const total = parseFloat(terms.projectTotal || "0") || 0
                                return [total]
                              }
                              
                              const paymentSchedule = getPaymentSchedule()
                              const totalPayment = paymentSchedule.reduce((sum: number, amount: number) => sum + amount, 0)
                              
                              // Check if client has signed
                              const clientHasSigned = contract.client_signature_status === 'signed' || (terms.clientSignatureName && terms.clientSignatureName.trim() !== '')
                              
                              // Generate full contract HTML (same as preview modal)
                              const htmlContent = `
                                <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; padding: 64px; font-family: Georgia, serif;">
                                  <!-- Header -->
                                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
                                    ${branding.showLogo && branding.logoUrl ? `
                                      <div style="width: 128px; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #d1d5db; background: #f9fafb;">
                                        <img src="${branding.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;" />
                                      </div>
                                    ` : '<div style="width: 128px;"></div>'}
                                    <div style="text-align: right; font-size: 14px; font-family: Inter, sans-serif;">
                                      <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${company.name || "{your_company_name}"}</div>
                                      <div style="color: #4b5563;">${company.email || "{your_email}"}</div>
                                      ${branding.showAddress && company.address ? `<div style="color: #4b5563; font-size: 12px; margin-top: 4px;">${company.address}</div>` : ''}
                                    </div>
                                  </div>

                                  <div style="text-align: center; border-bottom: 1px solid ${branding.accentColor || '#6366F1'}; padding-bottom: 24px; margin-bottom: 32px;">
                                    <h1 style="font-size: 24px; font-weight: 400; color: #111827; margin-bottom: 8px;">Freelance Service Agreement</h1>
                                    <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-bottom: 8px;">
                                      This Agreement is between <strong>${company.name || "{your_company_name}"}</strong> ("Freelancer") and <strong>${client.name || "{client_name}"}</strong> ("Client") for the project described below.
                                    </p>
                                    <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-top: 8px;">
                                      Both parties agree to the following terms.
                                    </p>
                                  </div>

                                  <div style="font-size: 14px; font-family: Inter, sans-serif; line-height: 1.75;">
                                    <!-- 1. Project Summary -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        1️⃣ Project Summary
                                      </h2>
                                      <p style="color: #374151; line-height: 1.75; margin-bottom: 12px;">
                                        Freelancer agrees to perform the following services for Client:
                                      </p>
                                      <div style="margin-left: 16px; margin-bottom: 12px;">
                                        <p style="color: #374151; margin-bottom: 4px;"><strong>Project:</strong> ${content.projectName || "{project_name}"}</p>
                                        <p style="color: #374151; margin-bottom: 4px;"><strong>Deliverables:</strong></p>
                                        ${scope.deliverables ? `
                                          <div style="white-space: pre-wrap; margin-left: 16px; color: #374151;">${scope.deliverables}</div>
                                        ` : `
                                          <p style="color: #6b7280; font-style: italic; margin-left: 16px;">Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support</p>
                                        `}
                                        <p style="color: #374151; margin-top: 8px; margin-bottom: 4px;"><strong>Start Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        <p style="color: #374151; margin-bottom: 4px;"><strong>Estimated Completion:</strong> ${terms.estimatedCompletionDate ? new Date(terms.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
                                      </div>
                                      <p style="color: #374151; line-height: 1.75; margin-top: 12px;">
                                        Any additional work outside this scope will require a new written agreement or change order.
                                      </p>
                                    </div>

                                    <!-- 2. Payment Terms -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        2️⃣ Payment Terms
                                      </h2>
                                      <div style="color: #374151; line-height: 1.75;">
                                        <p style="margin-bottom: 12px;"><strong>Total Project Fee:</strong> $${totalPayment.toLocaleString()} USD</p>
                                        ${paymentPlan.enabled ? `
                                          ${paymentPlan.type === "milestone" ? `
                                            <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> Milestone-based billing. You will be invoiced at each milestone; no full upfront payment is required.</p>
                                            <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                                              ${(paymentPlan.milestones || []).slice(0, paymentPlan.milestonesCount || 4).map((m: any, i: number) => 
                                                `<li style="margin-bottom: 4px;">${m.name || `Milestone ${i+1}`}: $${Number(m.amount || 0).toLocaleString()} USD</li>`
                                              ).join('')}
                                            </ul>
                                          ` : `
                                            <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> The total fee will be paid in ${paymentSchedule.length} payment(s) as follows:</p>
                                            <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                                              ${paymentSchedule.map((amt: number, idx: number) => 
                                                `<li style="margin-bottom: 4px;">Payment ${idx + 1}: $${amt.toLocaleString()} USD</li>`
                                              ).join('')}
                                            </ul>
                                          `}
                                        ` : `
                                          <p style="margin-bottom: 12px;"><strong>Payment Schedule:</strong> Full payment due upon project completion.</p>
                                        `}
                                        <p style="margin-bottom: 8px;">Client agrees to pay invoices by the due date shown on each invoice.</p>
                                        ${terms.includeLateFee ? `
                                          <p style="margin-bottom: 8px;">Late payments may incur a ${terms.lateFee}% fee after ${terms.lateDays || 15} days overdue.</p>
                                        ` : ''}
                                        <p>Ownership of deliverables transfers to Client only after full payment has been received.</p>
                                      </div>
                                    </div>

                                    <!-- 3. Revisions & Changes -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        3️⃣ Revisions & Changes
                                      </h2>
                                      <div style="color: #374151; line-height: 1.75;">
                                        <p style="margin-bottom: 8px;">This agreement includes ${terms.revisionCount || 2} revision(s) per deliverable.</p>
                                        ${terms.includeHourlyClause ? `
                                          <p>Additional revisions or changes in scope will be billed at $${terms.hourlyRate || 150} USD per hour or a mutually agreed rate.</p>
                                        ` : ''}
                                      </div>
                                    </div>

                                    <!-- 4. Intellectual Property -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        4️⃣ Intellectual Property
                                      </h2>
                                      <p style="color: #374151; line-height: 1.75; margin-bottom: 8px;">After full payment:</p>
                                      <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
                                        <li style="margin-bottom: 8px;">Client owns final approved deliverables.</li>
                                        <li>Freelancer retains the right to display completed work for portfolio and marketing purposes, unless Client requests otherwise in writing.</li>
                                      </ul>
                                    </div>

                                    <!-- 5. Confidentiality -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        5️⃣ Confidentiality
                                      </h2>
                                      <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
                                        <li style="margin-bottom: 8px;">Freelancer will not share or disclose Client's confidential information without written consent.</li>
                                        <li>Client will not share Freelancer's proprietary methods or materials without consent.</li>
                                      </ul>
                                    </div>

                                    <!-- 6. Termination -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        6️⃣ Termination
                                      </h2>
                                      <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
                                        <li style="margin-bottom: 8px;">Either party may end this Agreement with written notice.</li>
                                        <li style="margin-bottom: 8px;">Client agrees to pay for all work completed up to the termination date.</li>
                                        <li>Deposits and completed milestone payments are non-refundable once work has begun.</li>
                                      </ul>
                                    </div>

                                    <!-- 7. Liability -->
                                    <div style="margin-bottom: 32px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
                                        7️⃣ Liability
                                      </h2>
                                      <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
                                        <li style="margin-bottom: 8px;">Freelancer provides services in good faith but cannot guarantee specific results or outcomes.</li>
                                        <li>Freelancer's total liability is limited to the amount Client has paid under this Agreement.</li>
                                      </ul>
                                    </div>

                                    <!-- 8. Acceptance & Signatures -->
                                    <div style="border-top: 1px solid ${branding.accentColor || '#6366F1'}; padding-top: 48px; margin-top: 48px;">
                                      <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; font-family: Georgia, serif;">
                                        8️⃣ Acceptance & Signatures
                                      </h2>
                                      <p style="color: #374151; line-height: 1.75; margin-bottom: 24px;">
                                        By signing below, both parties agree to the terms of this Agreement.<br />
                                        Typing your full legal name acts as your electronic signature.
                                      </p>
                                      
                                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px;">
                                        <!-- Service Provider Signature -->
                                        <div>
                                          <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Service Provider</div>
                                          <div style="margin-bottom: 12px;">
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                                            <div style="font-size: 14px; color: #111827;">${terms.yourName || "Your Name"}</div>
                                          </div>
                                          <div style="margin-bottom: 12px;">
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                                            <div style="font-size: 14px; color: #111827;">
                                              ${terms.yourSignatureDate ? new Date(terms.yourSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                                            </div>
                                          </div>
                                          <div>
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                                            <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                                              ${terms.yourName || "Your Name"}
                                            </div>
                                          </div>
                                        </div>

                                        <!-- Client Signature -->
                                        <div>
                                          <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Client</div>
                                          <div style="margin-bottom: 12px;">
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                                            <div style="font-size: 14px; color: #111827;">${client.name || "Client Name"}</div>
                                          </div>
                                          <div style="margin-bottom: 12px;">
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                                            <div style="font-size: 14px; color: #111827;">
                                              ${terms.clientSignatureDate ? new Date(terms.clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                                            </div>
                                          </div>
                                          <div>
                                            <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                                            ${clientHasSigned ? `
                                              <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                                                ${terms.clientSignatureName}
                                              </div>
                                            ` : ''}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  ${account?.plan_tier === 'free' ? `
                                    <div style="padding-top: 40px; margin-top: 40px; border-top: 1px solid #e5e7eb;">
                                      <div style="display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; color: #9ca3af;">
                                        <span>Powered by</span>
                                        <a href="https://jolix.io" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; color: #3C3CFF; font-weight: 500; text-decoration: none;">
                                          <img src="/jolixlogo.png" alt="Jolix" width="18" height="18" style="object-fit: contain" />
                                          <span>Jolix</span>
                                        </a>
                                      </div>
                                    </div>
                                  ` : ''}
                                </div>
                              `
                              
                              // Create temporary div
                              const tempDiv = document.createElement('div')
                              tempDiv.style.position = 'absolute'
                              tempDiv.style.left = '-9999px'
                              tempDiv.style.top = '-9999px'
                              tempDiv.style.width = '800px'
                              tempDiv.style.backgroundColor = '#ffffff'
                              tempDiv.style.fontFamily = 'Georgia, serif'
                              tempDiv.innerHTML = htmlContent
                              document.body.appendChild(tempDiv)
                              
                              // Wait for images to load
                              await new Promise((resolve) => {
                                const images = tempDiv.querySelectorAll('img')
                                if (images.length === 0) {
                                  resolve(undefined)
                                  return
                                }
                                let loaded = 0
                                const checkComplete = () => {
                                  loaded++
                                  if (loaded === images.length) {
                                    resolve(undefined)
                                  }
                                }
                                images.forEach((img) => {
                                  if (img.complete) {
                                    checkComplete()
                                  } else {
                                    img.onload = checkComplete
                                    img.onerror = checkComplete
                                  }
                                })
                              })
                              
                              // Generate PDF
                              const canvas = await html2canvas(tempDiv, {
                                scale: 2,
                                useCORS: true,
                                allowTaint: true,
                                backgroundColor: '#ffffff',
                                logging: false
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
                              toast.error('Failed to generate contract PDF')
                            } finally {
                              setDownloadingPDF(null)
                            }
                          }}
                          disabled={downloadingPDF === contract.id}
                        >
                          {downloadingPDF === contract.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
                          )}
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Contract View Modal */}
      <ContractPreviewModal
        open={showContractViewModal}
        onOpenChange={(open) => {
          setShowContractViewModal(open)
          if (!open) {
            // Refresh contract data when modal closes
            setSelectedContract(null)
          }
        }}
        contract={selectedContract}
        account={account}
      />

      {/* Contract Sign Modal */}
      <ContractSignatureModal
        open={showContractSignModal}
        onOpenChange={setShowContractSignModal}
        contract={selectedContract}
        brandColor={brandColor}
        isClient={true}
        onSign={async (signatureName: string, signatureDate: string, clientName?: string) => {
          if (!selectedContract) return

          // Update contract content with signature and client name
          const content = selectedContract.contract_content || {}
          const terms = content.terms || {}
          const updatedContent = {
            ...content,
            client: {
              ...content.client,
              name: clientName || content.client?.name || "{client_name}"
            },
            terms: {
              ...terms,
              clientSignatureName: signatureName,
              clientSignatureDate: signatureDate
            }
          }

          // Don't pass status - let API calculate it based on actual signature statuses
          const response = await fetch('/api/contracts/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId: selectedContract.id,
              signatureData: JSON.stringify({ name: signatureName, type: 'typed', date: signatureDate }),
              clientId: client?.id,
              projectId: selectedProject !== 'all' ? selectedProject : selectedContract.project_id,
              contractContent: updatedContent
            })
          })

          if (response.ok) {
            const result = await response.json()
            // Update the selected contract with the new data
            if (result.data) {
              setSelectedContract(result.data)
              // Update the contract in the parent component's list
              if (onContractUpdate) {
                onContractUpdate(result.data)
              }
            }
            toast.success('Contract signed successfully!')
            // Close the sign modal
            setShowContractSignModal(false)
          } else {
            const error = await response.json()
            toast.error(error.error || 'Failed to sign contract')
            throw new Error(error.error || 'Failed to sign contract')
          }
        }}
      />
    </div>
  )
}

// Activity Section Component
function ActivitySection({ brandColor, selectedProject }: { brandColor: string; selectedProject: string }) {
  const [filterType, setFilterType] = useState<"all" | "finance" | "files" | "tasks" | "contracts">("all")
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch activities when selectedProject changes
  useEffect(() => {
    const loadActivities = async () => {
      if (!selectedProject || selectedProject === "all") {
        setActivities([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(`/api/projects/${selectedProject}/activities`)
        if (response.ok) {
          const data = await response.json()
          setActivities(data.activities || [])
        } else {
          console.error('Failed to load activities')
          setActivities([])
        }
      } catch (error) {
        console.error('Error loading activities:', error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }

    loadActivities()
  }, [selectedProject])

  // Helper function to map activity type to filter category
  const getActivityCategory = (activityType: string): "finance" | "files" | "tasks" | "contracts" | null => {
    const type = activityType?.toLowerCase() || ''
    if (type.includes('invoice') || type.includes('payment')) return 'finance'
    if (type.includes('file')) return 'files'
    if (type.includes('task') || type.includes('milestone')) return 'tasks'
    if (type.includes('contract')) return 'contracts'
    // Messages are filtered out - don't show them
    if (type.includes('message')) return null
    return null
  }

  // Helper function to get activity icon and styling
  const getActivityDisplay = (activityType: string) => {
    const type = activityType?.toLowerCase() || ''
    
    if (type.includes('invoice') || type.includes('payment')) {
      return {
        icon: CreditCard,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
      }
    }
    if (type.includes('contract')) {
      return {
        icon: FileText,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      }
    }
    if (type.includes('file')) {
      return {
        icon: Upload,
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
      }
    }
    if (type.includes('message')) {
      return {
        icon: MessageCircle,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      }
    }
    if (type.includes('task') || type.includes('milestone')) {
      return {
        icon: CheckSquare,
        iconBg: "bg-teal-100",
        iconColor: "text-teal-600",
      }
    }
    // Default
    return {
      icon: Activity,
      iconBg: "bg-gray-100",
      iconColor: "text-gray-600",
    }
  }

  // Format timestamp to relative time
  const formatTimestamp = (dateString: string) => {
    if (!dateString) return "Unknown time"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
  }

  // Format activities for display
  const formattedActivities = activities.map(activity => {
    const display = getActivityDisplay(activity.activity_type)
    const category = getActivityCategory(activity.activity_type)
    
    // Extract title and description from action and metadata
    let title = activity.action || 'Activity'
    let description = ''
    
    if (activity.metadata) {
      // Try to extract meaningful info from metadata
      if (activity.metadata.file_name) {
        description = activity.metadata.file_name
      } else if (activity.metadata.invoice_number) {
        description = `Invoice ${activity.metadata.invoice_number}`
        if (activity.metadata.amount) {
          description += ` - $${parseFloat(activity.metadata.amount).toLocaleString()}`
        }
      } else if (activity.metadata.contract_name) {
        description = activity.metadata.contract_name
      } else if (activity.metadata.task_name) {
        description = activity.metadata.task_name
      } else if (activity.metadata.milestone_name) {
        description = activity.metadata.milestone_name
      } else if (activity.metadata.content_preview) {
        // Message content preview
        description = activity.metadata.content_preview
        if (activity.metadata.has_attachment && activity.metadata.attachment_name) {
          description += ` (📎 ${activity.metadata.attachment_name})`
        }
      } else if (activity.metadata.has_attachment && activity.metadata.attachment_name) {
        description = `📎 ${activity.metadata.attachment_name}`
      }
    }

    return {
      id: activity.id,
      type: category || 'other',
      icon: display.icon,
      iconBg: display.iconBg,
      iconColor: display.iconColor,
      title: title,
      actor: activity.user_name || 'System',
      timestamp: formatTimestamp(activity.created_at),
      description: description || activity.action || '',
      rawActivity: activity,
    }
  })

  const filteredActivities = filterType === "all" 
    ? formattedActivities 
    : formattedActivities.filter(activity => activity.type === filterType)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activity</h2>
        <p className="text-sm text-gray-600 mt-1">Recent activity and updates on your projects</p>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterType("all")}
              className={`rounded-lg ${filterType === "all" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
            >
              All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterType("finance")}
              className={`rounded-lg ${filterType === "finance" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
            >
              Finance
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterType("files")}
              className={`rounded-lg ${filterType === "files" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
            >
              Files
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterType("tasks")}
              className={`rounded-lg ${filterType === "tasks" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
            >
              Tasks
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilterType("contracts")}
              className={`rounded-lg ${filterType === "contracts" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
            >
              Contracts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-sm text-gray-600">Loading activities...</span>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y divide-gray-200">
                {filteredActivities.map((activity) => {
                  const Icon = activity.icon
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      {/* Icon */}
                      <div className={`flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 ${activity.iconBg}`}>
                        <Icon className={`h-5 w-5 ${activity.iconColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900">{activity.title}</h4>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">{activity.actor}</span>
                          <span>·</span>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Empty State */}
      {!loading && filteredActivities.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
          <CardContent className="p-12">
            <div className="text-center">
              <div
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Activity className="h-8 w-8" style={{ color: brandColor }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {!selectedProject || selectedProject === "all" 
                  ? "Select a project to view activity" 
                  : "No activity yet"}
              </h3>
              <p className="text-sm text-gray-600">
                {!selectedProject || selectedProject === "all"
                  ? "Choose a project from the dropdown above to see its activity"
                  : "Activity will appear here as things happen"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Appointments Section Component
function AppointmentsSection({ brandColor, bookings, selectedProject, accountId, clientId }: { brandColor: string; bookings: any[]; selectedProject: string; accountId?: string; clientId?: string }) {
  const [showBookingView, setShowBookingView] = useState(false)
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "completed" | "canceled">("all")
  
  // Booking UI state
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<(ScheduleSettings & { user_name?: string, account_name?: string }) | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(startOfDay(new Date()))
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<Array<{ time: string; available: boolean }>>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [step, setStep] = useState<"date-time" | "details" | "confirmation">("date-time")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [selectedBookingForReschedule, setSelectedBookingForReschedule] = useState<any>(null)
  const [updatingBooking, setUpdatingBooking] = useState(false)
  const [localBookings, setLocalBookings] = useState<any[]>(bookings)

  // Load schedule settings and meeting types when booking view opens
  useEffect(() => {
    const loadBookingData = async () => {
      if (!showBookingView) return
      
      try {
        setLoading(true)
        
        // Load account data for logo and company name
        const accountData = await getCurrentAccount()
        if (accountData) {
          setAccount(accountData)
        }
        
        // Get account_id and user_id from account data
        if (!accountData?.id) {
          throw new Error('Account not found')
        }
        
        // Get user_id from schedule settings
        const scheduleSettingsData = await getScheduleSettingsByAccountId(accountData.id)
        if (!scheduleSettingsData) {
          throw new Error('Schedule settings not found')
        }
        
        // Auto-initialize schedule settings and meeting types if they don't exist
        // For client portal, always use Consultation meeting type
        const { settings: scheduleSettings, meetingTypes: meetingTypesData } = await ensureScheduleSetup(
          accountData.id,
          scheduleSettingsData.user_id
        )

        // Ensure availability has defaults if empty
        if (!scheduleSettings.availability || Object.keys(scheduleSettings.availability).length === 0) {
          const defaultAvailability = {
            Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
            Saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
            Sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
          }
          scheduleSettings.availability = defaultAvailability
        }

        setSettings(scheduleSettings as any)
        
        // Filter to only show Consultation meeting types, or use Consultation if available
        const consultationTypes = meetingTypesData.filter(mt => 
          mt.name === 'Consultation' && mt.is_active && !mt.is_archived
        )
        
        // If no Consultation found, it should have been created by ensureScheduleSetup
        // But just in case, use the first available meeting type
        const meetingTypesToShow = consultationTypes.length > 0 ? consultationTypes : meetingTypesData
        setMeetingTypes(meetingTypesToShow)
        
        // Always select Consultation if available, otherwise first meeting type
        if (consultationTypes.length > 0) {
          setSelectedMeetingType(consultationTypes[0])
        } else if (meetingTypesToShow.length > 0) {
          setSelectedMeetingType(meetingTypesToShow[0])
        }

        // Auto-select today's date if available
        const today = startOfDay(new Date())
        const dayOfWeek = today.getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = dayNames[dayOfWeek]
        const availability = scheduleSettings.availability || {}
        const dayAvailability = availability[dayName]
        
        // If today is available, select it
        if (dayAvailability && dayAvailability.enabled) {
          setSelectedDate(today)
        }
      } catch (error) {
        console.error('Error loading booking data:', error)
        toast.error('Failed to load booking page')
        setShowBookingView(false)
      } finally {
        setLoading(false)
      }
    }
    
    loadBookingData()
  }, [showBookingView])

  // Generate available time slots for selected date
  useEffect(() => {
    if (!selectedDate || !selectedMeetingType || !settings || !showBookingView) {
      setAvailableSlots([])
      return
    }

    const loadTimeSlots = async () => {
      try {
        const dayOfWeek = selectedDate.getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = dayNames[dayOfWeek]
        const availability = settings.availability || {}
        const dayAvailability = availability[dayName]

        if (!dayAvailability || !dayAvailability.enabled) {
          setAvailableSlots([])
          return
        }

        const existingBookingsData = await getBookingsByAccount(settings.account_id, {
          startDate: format(selectedDate, 'yyyy-MM-dd'),
          endDate: format(selectedDate, 'yyyy-MM-dd'),
          status: ['Scheduled', 'Completed'],
        })

        const existingBookings: ExistingBooking[] = existingBookingsData.map(booking => ({
          startTime: booking.start_time,
          endTime: booking.end_time,
          scheduled_date: booking.scheduled_date,
        }))

        const bufferTime = settings.buffer_time_minutes || 15
        const slots = generateTimeSlots({
          availabilityWindow: {
            startTime: dayAvailability.startTime,
            endTime: dayAvailability.endTime,
          },
          meetingDuration: selectedMeetingType.duration_minutes,
          bufferBefore: bufferTime,
          bufferAfter: bufferTime,
          existingBookings,
          selectedDate,
          minimumAdvanceNoticeHours: 0,
        })

        setAvailableSlots(slots)
      } catch (error) {
        console.error('Error generating time slots:', error)
        setAvailableSlots([])
      }
    }

    loadTimeSlots()
  }, [selectedDate, selectedMeetingType, settings, showBookingView])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      setSelectedTime("")
      return
    }
    
    const dayOfWeek = date.getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[dayOfWeek]
    const availability = settings?.availability || {}
    const dayAvailability = availability[dayName]
    
    if (isBefore(date, startOfDay(new Date()))) {
      toast.error("Cannot select a date in the past")
      return
    }
    
    if (!dayAvailability || !dayAvailability.enabled) {
      toast.error("This day is not available for booking")
      return
    }
    
    setSelectedDate(date)
    setSelectedTime("")
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("details")
  }

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientEmail.trim() || !selectedMeetingType || !selectedDate || !selectedTime || !settings) {
      toast.error("Please fill in all required fields")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSubmitting(true)

      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startDateTime = setMinutes(setHours(selectedDate, hours), minutes)
      const endDateTime = addMinutes(startDateTime, selectedMeetingType.duration_minutes)
      const endTime = format(endDateTime, 'HH:mm')

      // Ensure we're using Consultation meeting type for client portal
      let meetingTypeToUse = selectedMeetingType
      if (!meetingTypeToUse || meetingTypeToUse.name !== 'Consultation') {
        // Find or create Consultation meeting type
        meetingTypeToUse = await getOrCreateConsultationMeetingType(settings.account_id, settings.user_id)
      }

      // If rescheduling, cancel the old booking first
      if (selectedBookingForReschedule) {
        await updateBooking(selectedBookingForReschedule.id, {
          status: 'Canceled',
          canceled_at: new Date().toISOString(),
        })
      }

      await createPublicBooking({
        account_id: settings.account_id,
        user_id: settings.user_id,
        meeting_type_id: meetingTypeToUse.id,
        client_id: clientId ? clientId : undefined, // Add client_id so booking shows in portal
        project_id: selectedProject !== 'all' ? selectedProject : undefined, // Add project_id if a project is selected
        // service_id removed - column doesn't exist
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTime,
        timezone: settings.timezone,
        location_type: meetingTypeToUse.location_type,
        client_name: clientName,
        client_email: clientEmail,
        client_notes: notes || undefined,
      })

      // Update local bookings if rescheduling
      if (selectedBookingForReschedule) {
        setLocalBookings(prev => prev.map(b => 
          b.id === selectedBookingForReschedule.id 
            ? { ...b, status: 'Canceled', canceled_at: new Date().toISOString() }
            : b
        ))
      }

      setStep("confirmation")
      toast.success(selectedBookingForReschedule ? "Meeting rescheduled successfully!" : "Booking confirmed!")
      
      // Reset reschedule state
      setSelectedBookingForReschedule(null)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error(selectedBookingForReschedule ? 'Failed to reschedule meeting. Please try again.' : 'Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const getTimezoneAbbr = (timezone: string) => {
    const tzMap: Record<string, string> = {
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'America/Phoenix': 'MST',
      'America/Anchorage': 'AKST',
      'Pacific/Honolulu': 'HST',
    }
    return tzMap[timezone] || timezone.split('/').pop()?.split('_').join(' ') || 'UTC'
  }

  // Handler for canceling a booking
  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this meeting?')) return
    
    try {
      setUpdatingBooking(true)
      await updateBooking(bookingId, {
        status: 'Canceled',
        canceled_at: new Date().toISOString(),
      })
      
      // Update local bookings
      setLocalBookings(prev => prev.map(b => 
        b.id === bookingId 
          ? { ...b, status: 'Canceled', canceled_at: new Date().toISOString() }
          : b
      ))
      
      toast.success('Meeting canceled successfully')
    } catch (error) {
      console.error('Error canceling booking:', error)
      toast.error('Failed to cancel meeting')
    } finally {
      setUpdatingBooking(false)
    }
  }

  // Handler for opening reschedule - reuse booking view
  const handleRescheduleClick = async (booking: any) => {
    setSelectedBookingForReschedule(booking)
    // Set the meeting type from the booking
    const bookingMeetingType = meetingTypes.find(mt => mt.id === booking.meeting_type_id)
    if (bookingMeetingType) {
      setSelectedMeetingType(bookingMeetingType)
    }
    // Pre-fill client name and email from the booking
    if (booking.client_name) setClientName(booking.client_name)
    if (booking.client_email) setClientEmail(booking.client_email)
    if (booking.client_notes) setNotes(booking.client_notes)
    setSelectedDate(undefined)
    setSelectedTime("")
    setStep("date-time")
    setShowBookingView(true)
  }

  // Update local bookings when bookings prop changes
  useEffect(() => {
    setLocalBookings(bookings)
  }, [bookings])

  // Filter bookings by selected project
  // In appointments section, show all bookings for the client regardless of project
  // (bookings can be created without a project_id from the portal)
  const projectFilteredBookings = selectedProject === 'all'
    ? localBookings
    : localBookings.filter((b: any) => !b.project_id || b.project_id === selectedProject)

  // Sort bookings into upcoming and past
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const upcomingMeetings = projectFilteredBookings
    .filter((booking: any) => {
      const bookingDate = new Date(booking.scheduled_date)
      bookingDate.setHours(0, 0, 0, 0)
      // Include today and future dates, exclude yesterday and older
      const isPast = bookingDate < today
      const isScheduled = booking.status === 'Scheduled'
      return !isPast && isScheduled
    })
    .map((booking: any) => {
      const bookingDate = new Date(booking.scheduled_date)
      const dateStr = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      
      // Calculate if can join (meeting is within 15 mins before to 1 hour after start time)
      const now = new Date()
      let canJoin = false
      if (booking.start_time) {
        const [startHour, startMin] = booking.start_time.split(':').map(Number)
        const startDateTime = new Date(booking.scheduled_date)
        startDateTime.setHours(startHour, startMin, 0, 0)
        const fifteenMinsBefore = new Date(startDateTime.getTime() - 15 * 60 * 1000)
        const oneHourAfter = new Date(startDateTime.getTime() + 60 * 60 * 1000)
        canJoin = now >= fifteenMinsBefore && now <= oneHourAfter
      }

      return {
        id: booking.id,
        title: booking.title || booking.service_name || 'Meeting',
        status: 'scheduled',
        date: dateStr,
        time: `${booking.start_time} - ${booking.end_time}`,
        duration: booking.start_time && booking.end_time 
          ? `${Math.round((new Date(`1970-01-01T${booking.end_time}`).getTime() - new Date(`1970-01-01T${booking.start_time}`).getTime()) / 60000)} min`
          : 'N/A',
        type: booking.location_type?.toLowerCase() || 'video',
        notes: booking.client_notes || booking.notes || '',
        canJoin,
      }
    })

  const pastMeetings = projectFilteredBookings
    .filter((booking: any) => {
      const bookingDate = new Date(booking.scheduled_date)
      bookingDate.setHours(0, 0, 0, 0)
      // Include yesterday and older dates, or completed/canceled status
      const isPast = bookingDate < today
      const isCompleted = booking.status === 'Completed'
      const isCanceled = booking.status === 'Canceled'
      return isPast || isCompleted || isCanceled
    })
    .map((booking: any) => {
      const bookingDate = new Date(booking.scheduled_date)
      const dateStr = bookingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      
      return {
        id: booking.id,
        title: booking.title || booking.service_name || 'Meeting',
        date: dateStr,
        time: booking.start_time,
        duration: booking.start_time && booking.end_time 
          ? `${Math.round((new Date(`1970-01-01T${booking.end_time}`).getTime() - new Date(`1970-01-01T${booking.start_time}`).getTime()) / 60000)} min`
          : 'N/A',
        status: booking.status.toLowerCase(),
      }
    })

  // Apply filterStatus to filter meetings
  const filteredUpcomingMeetings = (filterStatus === 'all' || filterStatus === 'upcoming')
    ? upcomingMeetings
    : []
  
  const filteredPastMeetings = pastMeetings.filter((meeting: any) => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'upcoming') return false // Don't show past when filtering for upcoming
    if (filterStatus === 'completed') return meeting.status === 'completed'
    if (filterStatus === 'canceled') return meeting.status === 'canceled'
    return false
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">Scheduled</Badge>
      case "completed":
        return <Badge className="bg-green-100 text-green-700 border-green-200 border">Completed</Badge>
      case "canceled":
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200 border">Canceled</Badge>
      default:
        return null
    }
  }

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />
      case "phone":
        return <Phone className="h-4 w-4" />
      case "in-person":
        return <MapPin className="h-4 w-4" />
      default:
        return <Video className="h-4 w-4" />
    }
  }

  // If showing booking view, render booking UI
  if (showBookingView) {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading booking page...</p>
          </div>
        </div>
      )
    }

    // Settings and meeting types are auto-created by ensureScheduleSetup()
    // But add a safety check just in case
    if (!settings || meetingTypes.length === 0) {
      return (
        <div className="space-y-4">
          <Button
            variant="ghost"
            onClick={() => setShowBookingView(false)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Appointments
          </Button>
          <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Schedule</h3>
              <p className="text-sm text-gray-600">Please refresh the page and try again.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    const timezoneAbbr = getTimezoneAbbr(settings.timezone)
    const hostName = settings.display_name || settings.user_name || settings.account_name || "Host"
    const hostInitials = hostName.split(" ").length >= 2 
      ? `${hostName.split(" ")[0][0]}${hostName.split(" ")[1][0]}`.toUpperCase()
      : hostName[0].toUpperCase()

    return (
      <div className="space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => {
            setShowBookingView(false)
            setStep("date-time")
            setSelectedDate(undefined)
            setSelectedTime("")
            setClientName("")
            setClientEmail("")
            setNotes("")
            setSelectedBookingForReschedule(null)
          }}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Appointments
        </Button>

        {/* Booking UI */}
        <div className="grid lg:grid-cols-[400px,1fr] gap-8">
          {/* Left Column - Meeting & Host Info */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-sm rounded-xl p-6">
              {/* Host/Company Info */}
              <div className="flex items-center gap-4 mb-6">
                {account?.logo_url ? (
                  <img 
                    src={account.logo_url} 
                    alt={account.company_name || "Company logo"} 
                    className="w-16 h-16 rounded-lg object-contain"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-xl font-semibold" style={{ backgroundColor: brandColor }}>
                    {account?.company_name ? account.company_name.substring(0, 2).toUpperCase() : hostInitials}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {account?.company_name || hostName}
                  </h2>
                  {settings.industry_label && (
                    <p className="text-sm text-gray-600">{settings.industry_label}</p>
                  )}
                  {!settings.industry_label && account?.industry && (
                    <p className="text-sm text-gray-600">{account.industry}</p>
                  )}
                </div>
              </div>

              {/* Meeting Type Info */}
              {selectedMeetingType && (
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedMeetingType.name}</h3>
                    {selectedMeetingType.description && (
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedMeetingType.description}</p>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{selectedMeetingType.duration_minutes} minutes</span>
                    </div>
                    {selectedMeetingType.location_type && (
                      <div className="flex items-center gap-2 text-gray-600">
                        {selectedMeetingType.location_type === 'Zoom' || selectedMeetingType.location_type === 'Google Meet' ? (
                          <Video className="h-4 w-4 text-gray-400" />
                        ) : selectedMeetingType.location_type === 'Phone' ? (
                          <Phone className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Building2 className="h-4 w-4 text-gray-400" />
                        )}
                        <span>{selectedMeetingType.location_type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Booking Flow */}
          <div>
            <Card className="border border-gray-200 shadow-sm rounded-xl p-6 md:p-8">
              {step === "date-time" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      {selectedBookingForReschedule ? "Reschedule meeting" : "Pick a date & time"}
                    </h2>
                    <p className="text-sm text-gray-600">Times shown in {timezoneAbbr}</p>
                  </div>

                  {/* Calendar */}
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="h-8 w-8"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <h3 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="h-8 w-8"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      captionLayout="dropdown"
                      disabled={(date) => {
                        const today = startOfDay(new Date())
                        if (isBefore(date, today)) {
                          return true
                        }
                        
                        // Ensure we have availability (should always have defaults now)
                        const availability = settings?.availability || {
                          Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                          Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                          Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                          Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                          Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
                          Saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
                          Sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
                        }
                        
                        const dayOfWeek = date.getDay()
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        const dayName = dayNames[dayOfWeek]
                        const dayAvailability = availability[dayName]
                        
                        if (!dayAvailability || !dayAvailability.enabled) {
                          return true
                        }
                        
                        return false
                      }}
                      className="rounded-lg"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "flex justify-center pt-1 relative items-center",
                        caption_label: "text-sm font-medium hidden",
                        nav: "hidden",
                        button_previous: "hidden",
                        button_next: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md"),
                        day_selected: cn("text-white hover:text-white focus:text-white"),
                        day_today: "bg-gray-100 text-gray-900 font-semibold",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                        day_hidden: "invisible",
                      }}
                      style={{
                        '--day_selected_bg': brandColor,
                      } as React.CSSProperties}
                      components={{
                        Chevron: () => null, // Hide built-in chevrons
                      }}
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </h3>
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">No available times for this date</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                              disabled={!slot.available}
                              className={cn(
                                "py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                slot.available
                                  ? "border-2 border-gray-200 hover:border-gray-400 bg-white text-gray-900"
                                  : "border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                              )}
                              style={slot.available && selectedTime === slot.time ? {
                                backgroundColor: brandColor,
                                borderColor: brandColor,
                                color: 'white'
                              } : {}}
                            >
                              {format(parseISO(`2000-01-01T${slot.time}`), 'h:mm a')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === "details" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Step 2 of 2: Your details
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enter your details</h2>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Meeting:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedTime && format(parseISO(`2000-01-01T${selectedTime}`), 'h:mm a')} - {selectedTime && selectedMeetingType && format(addMinutes(parseISO(`2000-01-01T${selectedTime}`), selectedMeetingType.duration_minutes), 'h:mm a')} {timezoneAbbr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Your full name"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                        Add notes for your meeting <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional information you'd like to share..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStep("date-time")
                          setSelectedTime("")
                        }}
                        className="flex-1 h-11"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || !clientName.trim() || !clientEmail.trim()}
                        className="flex-1 h-11 text-white font-medium"
                        style={{ backgroundColor: brandColor }}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {selectedBookingForReschedule ? "Rescheduling..." : "Scheduling..."}
                          </>
                        ) : (
                          selectedBookingForReschedule ? "Reschedule Meeting" : "Schedule meeting"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === "confirmation" && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're booked!</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mt-6 mb-6 text-left max-w-md mx-auto">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Meeting:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedTime && format(parseISO(`2000-01-01T${selectedTime}`), 'h:mm a')} - {selectedTime && selectedMeetingType && format(addMinutes(parseISO(`2000-01-01T${selectedTime}`), selectedMeetingType.duration_minutes), 'h:mm a')} {timezoneAbbr}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType?.duration_minutes} minutes</span>
                      </div>
                      {selectedMeetingType?.location_type && (
                        <div>
                          <span className="text-gray-500">Location:</span>{" "}
                          <span className="font-medium text-gray-900">{selectedMeetingType.location_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    A confirmation will be sent to <span className="font-medium">{clientEmail}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    You can reschedule or cancel using the link in your email.
                  </p>

                  <Button
                    variant="outline"
                    className="border-gray-300"
                    onClick={() => {
                      setShowBookingView(false)
                      setStep("date-time")
                      setSelectedDate(undefined)
                      setSelectedTime("")
                      setClientName("")
                      setClientEmail("")
                      setNotes("")
                    }}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Back to Appointments
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Regular appointments list view
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appointments</h2>
          <p className="text-sm text-gray-600 mt-1">View and schedule meetings related to your project</p>
        </div>
        <Button
          className="rounded-xl text-white"
          style={{ backgroundColor: brandColor }}
          onClick={() => setShowBookingView(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Book Meeting
        </Button>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilterStatus("all")}
                className={`rounded-lg ${filterStatus === "all" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
              >
                All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilterStatus("upcoming")}
                className={`rounded-lg ${filterStatus === "upcoming" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
              >
                Upcoming
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilterStatus("completed")}
                className={`rounded-lg ${filterStatus === "completed" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
              >
                Completed
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilterStatus("canceled")}
                className={`rounded-lg ${filterStatus === "canceled" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
              >
                Canceled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings - Only show if not filtering for completed/canceled */}
      {(filterStatus === 'all' || filterStatus === 'upcoming') && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5" style={{ color: brandColor }} />
            Upcoming Meetings
          </h3>
        {filteredUpcomingMeetings.length > 0 ? (
          <div className="space-y-4">
            {filteredUpcomingMeetings.map((meeting) => {
              // Find the original booking to get the full booking object
              const originalBooking = projectFilteredBookings.find((b: any) => b.id === meeting.id)
              return (
              <Card
                key={meeting.id}
                className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{meeting.title}</h4>
                        {getStatusBadge(meeting.status)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {meeting.date}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {meeting.time}
                          </span>
                          <span className="text-gray-500">·</span>
                          <span>{meeting.duration}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          {getMeetingTypeIcon(meeting.type)}
                          <span className="capitalize">{meeting.type} meeting</span>
                        </div>
                        {meeting.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{meeting.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t">
                    {meeting.canJoin && (
                      <Button
                        size="sm"
                        className="rounded-xl text-white"
                        style={{ backgroundColor: brandColor }}
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Meeting
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl"
                      onClick={() => originalBooking && handleRescheduleClick(originalBooking)}
                      disabled={updatingBooking}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Reschedule
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="rounded-xl text-red-600 hover:text-red-700"
                      onClick={() => handleCancelBooking(meeting.id)}
                      disabled={updatingBooking}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
              )
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 rounded-2xl">
            <CardContent className="p-12">
              <div className="text-center">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <CalendarDays className="h-8 w-8" style={{ color: brandColor }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming meetings</h3>
                <p className="text-sm text-gray-600 mb-4">Book one to get started</p>
                <Button
                  className="rounded-xl text-white"
                  style={{ backgroundColor: brandColor }}
                  onClick={() => setShowBookingView(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      )}

      {/* Past/Completed/Canceled Meetings - Show based on filter */}
      {filterStatus !== 'upcoming' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-gray-600" />
            {filterStatus === 'completed' ? 'Completed Meetings' : 
             filterStatus === 'canceled' ? 'Canceled Meetings' : 
             'Past Meetings'}
          </h3>
          {filteredPastMeetings.length > 0 ? (
            <Card className="border border-gray-200 shadow-lg rounded-2xl">
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {filteredPastMeetings.map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-6 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center gap-6 flex-1">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">{meeting.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{meeting.date}</span>
                            <span>·</span>
                            <span>{meeting.time}</span>
                            <span>·</span>
                            <span>{meeting.duration}</span>
                          </div>
                        </div>
                        <div>{getStatusBadge(meeting.status)}</div>
                      </div>
                      {meeting.status === "completed" && (
                        <Button size="sm" variant="ghost" className="rounded-lg ml-4">
                          <Eye className="h-4 w-4 mr-2" />
                          View Summary
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No past meetings yet</p>
          )}
        </div>
      )}

    </div>
  )
}

// Portal Preview Component
function PortalPreview({
  section,
  brandColor,
  welcomeMessage,
  logoUrl,
  backgroundImageUrl,
  backgroundColor,
  client,
  projects,
  invoices,
  files,
  tasks,
  contracts,
  forms,
  formSubmissions,
  messages,
  bookings,
  selectedProject,
  onProjectChange,
  taskViews,
  milestones,
  account,
  onTaskViewsChange,
  onContractsUpdate,
}: {
  section: string
  brandColor: string
  welcomeMessage: string
  logoUrl: string
  backgroundImageUrl: string
  backgroundColor: string
  client: Client
  projects: Project[]
  invoices: any[]
  files: any[]
  tasks: any[]
  contracts: any[]
  forms: any[]
  formSubmissions: any[]
  messages: any[]
  bookings: any[]
  selectedProject: string
  onProjectChange: (projectId: string) => void
  taskViews: {milestones: boolean; board: boolean}
  milestones: any[]
  account: Account | null
  onTaskViewsChange?: (views: {milestones: boolean; board: boolean}) => void
  onContractsUpdate?: (updatedContract: any) => void
}) {
  const [activityFilter, setActivityFilter] = useState<string>('all')
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [showContractViewModal, setShowContractViewModal] = useState(false)
  const [showContractSignModal, setShowContractSignModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [showFileReviewModal, setShowFileReviewModal] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [showInvoicePreviewModal, setShowInvoicePreviewModal] = useState(false)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})
  const [signatureName, setSignatureName] = useState("")
  
  return (
    <Card className="w-full shadow-2xl rounded-none">
      {/* Hero Banner */}
      <div
        className="relative h-56"
        style={{
          backgroundColor: backgroundColor || '#4647E0',
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
       
      </div>

      {/* Title Card (overlapping) */}
      <div className="relative -mt-16 mx-16 mb-8">
        <Card className="bg-white shadow-sm rounded-2xl border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-xl">
                    {client.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {client.company} Portal
                  </h2>
                  <p className="text-gray-600">
                    {client.firstName} {client.lastName}
                  </p>
                </div>
              </div>
             
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Area */}
      <div className="px-16 pb-16 space-y-10 bg-gradient-to-b from-gray-50/50 to-white min-h-[calc(100vh-300px)]">
        {section === "home" ? (
          <>
            {/* Welcome Message */}
            {welcomeMessage && (
              <div className="pt-6 text-center">
                <p className="text-xl leading-relaxed max-w-3xl mx-auto">{welcomeMessage}</p>
              </div>
            )}


            {/* Progress Summary */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Progress Summary</h3>
              <div className="grid grid-cols-3 gap-6">
                {/* Project Progress */}
                <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-900">Project Progress</span>
                    </div>
                    {(() => {
                      // Filter tasks by selected project
                      const filteredTasks = selectedProject === 'all' 
                        ? tasks 
                        : tasks.filter(t => t.project_id === selectedProject)
                      
                      const completedTasks = filteredTasks.filter(t => t.status === 'done').length
                      const totalTasks = filteredTasks.length
                      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
                      const circumference = 2 * Math.PI * 32
                      const offset = circumference * (1 - progress / 100)
                      
                      if (totalTasks === 0) {
                        return (
                          <div className="flex items-center justify-center py-4">
                            <div className="text-center">
                              <p className="text-sm text-gray-500">No tasks yet</p>
                              <p className="text-xs text-gray-400 mt-1">Tasks will appear here once created</p>
                            </div>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="flex items-center gap-4">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="32"
                                stroke="#e5e7eb"
                                strokeWidth="8"
                                fill="none"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="32"
                                stroke={brandColor}
                                strokeWidth="8"
                                fill="none"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl font-bold text-gray-900">{Math.round(progress)}%</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900">{completedTasks}/{totalTasks}</div>
                            <div className="text-sm text-gray-500">tasks completed</div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Financial Snapshot */}
                <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-900">Financial Snapshot</span>
                    </div>
                    {(() => {
                      // Filter invoices by selected project
                      const projectFilteredInvoices = selectedProject === 'all' 
                        ? invoices 
                        : invoices.filter(inv => inv.project_id === selectedProject)
                      
                      const outstandingBalance = projectFilteredInvoices
                        .filter(inv => inv.status !== 'paid' && inv.status !== 'draft')
                        .reduce((sum, inv) => sum + (inv.total_amount || inv.subtotal || 0), 0)
                      
                      const upcomingInvoices = projectFilteredInvoices
                        .filter(inv => inv.status !== 'paid' && inv.status !== 'draft' && inv.due_date)
                        .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                      
                      const nextInvoice = upcomingInvoices[0]
                      const formatDate = (dateString: string) => {
                        if (!dateString) return 'N/A'
                        const date = new Date(dateString)
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      }
                      
                      return (
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-gray-500">Outstanding Balance</div>
                            <div className="text-2xl font-bold text-gray-900">${outstandingBalance.toLocaleString()}</div>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="text-sm text-gray-500">Next Invoice Due</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {nextInvoice ? formatDate(nextInvoice.due_date) : 'No upcoming invoices'}
                      </div>
                    </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>

                {/* Documents */}
                <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-gray-900">Documents</span>
                    </div>
                    {(() => {
                      const approvedFiles = files.filter(f => f.approval_status === 'approved').length
                      const awaitingReviewFiles = files.filter(f => f.approval_status === 'pending').length
                      
                      return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Files Approved</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              {approvedFiles}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Awaiting Review</span>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              {awaitingReviewFiles}
                        </Badge>
                      </div>
                    </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Actions Needed & Latest Activity */}
            <div className="space-y-6">
              {/* Actions Needed Card */}
              <div>
                <h3 className="text-sm font-semibold mb-4">Actions Needed</h3>
                <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    {(() => {
                      // Filter by selected project
                      const projectFilteredForms = selectedProject === 'all' 
                        ? forms 
                        : forms.filter(f => f.project_id === selectedProject)
                      
                      // Get forms that need submission (published forms without completed submissions)
                      const submittedFormIds = new Set(formSubmissions.map(fs => fs.form_id))
                      const formsNeedingSubmission = projectFilteredForms.filter(f => !submittedFormIds.has(f.id))
                      
                      // Filter contracts by selected project
                      const projectFilteredContracts = selectedProject === 'all' 
                        ? contracts 
                        : contracts.filter(c => c.project_id === selectedProject)
                      
                      // Get contracts that need client signature
                      // Only show if client hasn't signed yet (or status is awaiting_signature/sent)
                      // Exclude if client already signed (partially_signed means client signed, waiting for user)
                      const contractsNeedingSignature = projectFilteredContracts.filter(c => {
                        // Don't show if fully signed, declined, or expired
                        if (c.status === 'signed' || c.status === 'declined' || c.status === 'expired') {
                          return false
                        }
                        
                        // Check if client has already signed
                        if (c.client_signature_status === 'signed') {
                          return false // Client already signed, no action needed from client
                        }
                        
                        // Show contracts that need signing (sent, awaiting_signature, or draft)
                        return c.status === 'sent' || c.status === 'awaiting_signature' || c.status === 'draft'
                      })
                      
                      // Filter files by selected project
                      const projectFilteredFiles = selectedProject === 'all' 
                        ? files 
                        : files.filter(f => !f.project_id || f.project_id === selectedProject)
                      
                      // Get files awaiting approval (pending approval status)
                      // Files that need approval are those with approval_status = 'pending'
                      // Note: We show all pending files regardless of approval_required flag
                      const filesNeedingApproval = projectFilteredFiles.filter(f => 
                        f.approval_status === 'pending'
                      )
                      
                      // Filter invoices by selected project
                      const projectFilteredInvoices = selectedProject === 'all' 
                        ? invoices 
                        : invoices.filter(inv => !inv.project_id || inv.project_id === selectedProject)
                      
                      // Get invoices that are due or overdue
                      // An invoice is due/overdue if:
                      // 1. Status is 'sent', 'viewed', or 'overdue'
                      // 2. Status is not 'paid', 'cancelled', or 'refunded'
                      // 3. Has a due_date that is today or in the past
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      
                      const invoicesNeedingPayment = projectFilteredInvoices.filter(inv => {
                        // Exclude paid, cancelled, or refunded invoices
                        if (inv.status === 'paid' || inv.status === 'cancelled' || inv.status === 'refunded') {
                          return false
                        }
                        
                        // Must have a due date
                        if (!inv.due_date) {
                          return false
                        }
                        
                        // Check if due date is today or in the past
                        const dueDate = new Date(inv.due_date)
                        dueDate.setHours(0, 0, 0, 0)
                        
                        return dueDate <= today
                      })
                      
                      // Debug logging (remove in production)
                      if (filesNeedingApproval.length > 0) {
                        console.log('Files needing approval:', filesNeedingApproval)
                      }
                      if (files.length > 0 && filesNeedingApproval.length === 0) {
                        console.log('All files:', files.map(f => ({ 
                          id: f.id, 
                          name: f.name, 
                          approval_status: f.approval_status, 
                          status: f.status,
                          project_id: f.project_id 
                        })))
                      }
                      
                      const totalActions = formsNeedingSubmission.length + contractsNeedingSignature.length + filesNeedingApproval.length + invoicesNeedingPayment.length
                      
                      if (totalActions === 0) {
                        return (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No actions needed at this time</p>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* Forms to Submit */}
                          {formsNeedingSubmission.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                  <span className="text-base">📋</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900">Forms to Submit</h4>
                              </div>
                              <div className="space-y-2">
                                {formsNeedingSubmission.map((form) => (
                                  <div key={form.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{form.title}</p>
                                      {form.submission_deadline && (
                                        <p className="text-xs text-gray-600 mt-0.5">
                                          Due: {new Date(form.submission_deadline).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                    <Button 
                                      size="sm" 
                                      className="ml-3"
                                      style={{ backgroundColor: brandColor }}
                                      onClick={() => {
                                        setSelectedForm(form)
                                        setShowFormModal(true)
                                      }}
                                    >
                                      Fill Out
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Contracts to Sign */}
                          {contractsNeedingSignature.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <span className="text-base">📝</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900">Contracts to Sign</h4>
                              </div>
                              <div className="space-y-2">
                                {contractsNeedingSignature.map((contract) => (
                                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{contract.name}</p>
                                      <p className="text-xs text-gray-600 mt-0.5 capitalize">
                                        {contract.status?.replace('_', ' ') || 'Awaiting signature'}
                                      </p>
                                    </div>
                                    <div className="flex gap-2 ml-3">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          setSelectedContract(contract)
                                          setShowContractViewModal(true)
                                        }}
                                      >
                                        View
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        style={{ backgroundColor: brandColor }}
                                        onClick={() => {
                                          setSelectedContract(contract)
                                          setShowContractSignModal(true)
                                        }}
                                      >
                                        Sign
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Files Awaiting Approval */}
                          {filesNeedingApproval.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                  <span className="text-base">📄</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900">Files Awaiting Approval</h4>
                              </div>
                              <div className="space-y-2">
                                {filesNeedingApproval.map((file) => (
                                  <div key={file.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                      <p className="text-xs text-gray-600 mt-0.5">
                                        Uploaded: {new Date(file.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="ml-3"
                                      onClick={() => {
                                        setSelectedFile(file)
                                        setShowFileReviewModal(true)
                                      }}
                                    >
                                      Review
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Invoices Due/Overdue */}
                          {invoicesNeedingPayment.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                                  <span className="text-base">💰</span>
                                </div>
                                <h4 className="text-sm font-semibold text-gray-900">Invoices Due</h4>
                              </div>
                              <div className="space-y-2">
                                {invoicesNeedingPayment.map((invoice) => {
                                  const dueDate = new Date(invoice.due_date)
                                  const today = new Date()
                                  today.setHours(0, 0, 0, 0)
                                  dueDate.setHours(0, 0, 0, 0)
                                  const isOverdue = dueDate < today
                                  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                                  
                                  return (
                                    <div key={invoice.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                                      isOverdue 
                                        ? 'bg-red-50 border-red-200 hover:bg-red-100' 
                                        : 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                    }`}>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                          {invoice.invoice_number || `Invoice #${invoice.id.slice(0, 8)}`}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                          <p className="text-xs text-gray-600">
                                            ${(invoice.total_amount || invoice.subtotal || 0).toLocaleString()}
                                          </p>
                                          <span className="text-xs text-gray-400">•</span>
                                          <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                                            {isOverdue 
                                              ? `${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} overdue`
                                              : `Due ${dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                            }
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 ml-3">
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedInvoice(invoice)
                                            setShowInvoicePreviewModal(true)
                                          }}
                                        >
                                          View
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          style={{ backgroundColor: brandColor }}
                                          onClick={() => {
                                            setSelectedInvoice(invoice)
                                            setShowInvoicePreviewModal(true)
                                          }}
                                        >
                                          Pay
                                        </Button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>
              
              {/* Latest Activity */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold">Latest Activity</h3>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-3 text-xs rounded-lg ${activityFilter === 'all' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
                      onClick={() => setActivityFilter('all')}
                    >
                      All
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-3 text-xs rounded-lg ${activityFilter === 'finance' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
                      onClick={() => setActivityFilter('finance')}
                    >
                      Finance
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={`h-7 px-3 text-xs rounded-lg ${activityFilter === 'docs' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
                      onClick={() => setActivityFilter('docs')}
                    >
                      Docs
                    </Button>
                  </div>
                </div>
                <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
                  <CardContent className="p-6">
                    {(() => {
                      const formatTimeAgo = (dateString: string) => {
                        if (!dateString) return 'Recently'
                        const date = new Date(dateString)
                        const now = new Date()
                        const diffMs = now.getTime() - date.getTime()
                        
                        // Handle negative differences (future dates)
                        if (diffMs < 0) {
                          return 'Recently'
                        }
                        
                        const diffMins = Math.floor(diffMs / 60000)
                        const diffHours = Math.floor(diffMs / 3600000)
                        const diffDays = Math.floor(diffMs / 86400000)
                        const diffWeeks = Math.floor(diffDays / 7)
                        const diffMonths = Math.floor(diffDays / 30)
                        
                        if (diffMins < 1) return 'Just now'
                        if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
                        if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
                        if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
                        if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`
                        if (diffMonths < 12) return `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'} ago`
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
                      }
                      
                      // Create activity items from invoices, files, contracts, and messages
                      const activities: any[] = []
                      
                      // Filter invoices by selected project
                      const projectFilteredInvoices = selectedProject === 'all' 
                        ? invoices 
                        : invoices.filter(inv => !inv.project_id || inv.project_id === selectedProject)
                      
                      // Add paid invoices (if filter is 'all' or 'finance')
                      if (activityFilter === 'all' || activityFilter === 'finance') {
                        projectFilteredInvoices
                          .filter(inv => inv.status === 'paid')
                          .forEach(inv => {
                            activities.push({
                              type: 'invoice_paid',
                              category: 'finance',
                              icon: '💰',
                              bgColor: 'bg-green-100',
                              title: `Invoice ${inv.invoice_number || `#${inv.id.slice(0, 8)}`} paid`,
                              description: `Payment of $${(inv.total_amount || inv.subtotal || 0).toLocaleString()} received`,
                              date: inv.paid_date || inv.updated_at || inv.created_at,
                            })
                          })
                      }
                      
                      // Add approved files (if filter is 'all' or 'docs')
                      if (activityFilter === 'all' || activityFilter === 'docs') {
                        // Filter files by selected project
                        const projectFilteredFiles = selectedProject === 'all' 
                          ? files 
                          : files.filter(f => !f.project_id || f.project_id === selectedProject)
                        
                        projectFilteredFiles
                          .filter(f => f.approval_status === 'approved')
                          .forEach(file => {
                            activities.push({
                              type: 'file_approved',
                              category: 'docs',
                              icon: '📄',
                              bgColor: 'bg-blue-100',
                              title: 'File approved',
                              description: file.name,
                              date: file.updated_at || file.created_at,
                            })
                          })
                        
                        // Filter contracts by selected project
                        const projectFilteredContracts = selectedProject === 'all' 
                          ? contracts 
                          : contracts.filter(c => !c.project_id || c.project_id === selectedProject)
                        
                        // Add signed contracts
                        projectFilteredContracts
                          .filter(c => c.status === 'signed' && c.signed_at)
                          .forEach(contract => {
                            activities.push({
                              type: 'contract_signed',
                              category: 'docs',
                              icon: '📝',
                              bgColor: 'bg-purple-100',
                              title: 'Contract signed',
                              description: contract.name || 'Contract finalized',
                              date: contract.signed_at || contract.updated_at || contract.created_at,
                            })
                          })
                      }
                      
                      // Messages are no longer shown in activity feed
                      
                      // Filter by category if needed
                      const filteredActivities = activityFilter === 'all' 
                        ? activities 
                        : activities.filter(a => a.category === activityFilter)
                      
                      // Sort by date (most recent first) and take top 4
                      filteredActivities.sort((a, b) => {
                        const dateA = new Date(a.date).getTime()
                        const dateB = new Date(b.date).getTime()
                        return dateB - dateA // Descending order (newest first)
                      })
                      const recentActivities = filteredActivities.slice(0, 4)
                      
                      if (recentActivities.length === 0) {
                        return (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No recent activity</p>
                        </div>
                        )
                      }
                      
                      return (
                        <div className="space-y-3">
                          {recentActivities.map((activity, idx) => (
                            <div key={idx} className="flex gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 -mx-3">
                              <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${activity.bgColor} flex items-center justify-center`}>
                                <span className="text-lg">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                                  <p className="text-sm font-semibold text-gray-900">{activity.title}</p>
                                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.date)}</span>
                          </div>
                                <p className="text-sm text-gray-600 mt-0.5">{activity.description}</p>
                        </div>
                      </div>
                          ))}
                    </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </div>

            </div>
            
            {/* Form Fill Out Modal */}
            <FormFilloutModal
              open={showFormModal}
              onOpenChange={(open) => {
                setShowFormModal(open)
                if (!open) {
                  setFormResponses({})
                }
              }}
              form={selectedForm}
              account={account}
              client={client}
              onSubmit={() => {
                window.location.reload()
              }}
            />

            {/* Contract View Modal */}
            <ContractPreviewModal
              open={showContractViewModal}
              onOpenChange={setShowContractViewModal}
              contract={selectedContract}
              account={account}
            />

            {/* Invoice Preview Modal */}
            <InvoicePreviewModal
              open={showInvoicePreviewModal}
              onOpenChange={(open) => {
                setShowInvoicePreviewModal(open)
                if (!open) {
                  setSelectedInvoice(null)
                }
              }}
              invoice={selectedInvoice}
              account={account}
              projects={projects}
              brandColor={brandColor}
            />

            {/* Contract Sign Modal */}
            {showContractSignModal && selectedContract && (
              <Dialog open={showContractSignModal} onOpenChange={setShowContractSignModal}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                      Sign {selectedContract.name || 'Contract'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="mt-4 space-y-4">
                    <p className="text-sm text-gray-600">
                      Type your full legal name below. This will act as your electronic signature.
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signatureName">Your Full Name</Label>
                      <Input
                        id="signatureName"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        placeholder="Enter your full legal name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Handle enter key if needed
                          }
                        }}
                      />
                    </div>

                    {signatureName && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-600 mb-2">Your signature will appear as:</p>
                        <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                          {signatureName}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={() => {
                      setShowContractSignModal(false)
                      setSignatureName("")
                    }}>
                      Cancel
                    </Button>
                    <Button 
                      style={{ backgroundColor: brandColor }}
                      disabled={!signatureName.trim()}
                      onClick={async () => {
                        try {
                          if (!signatureName.trim()) {
                            toast.error('Please enter your full name')
                            return
                          }

                          // Call API to sign contract as client
                          const response = await fetch('/api/contracts/sign', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              contractId: selectedContract.id,
                              signatureData: JSON.stringify({ name: signatureName.trim(), type: 'typed' }),
                              clientId: client.id,
                              projectId: selectedProject !== 'all' ? selectedProject : selectedContract.project_id
                            })
                          })

                          if (response.ok) {
                            toast.success('Contract signed successfully!')
                            setShowContractSignModal(false)
                            setSignatureName("")
                            // Refresh contracts list
                            window.location.reload()
                          } else {
                            const error = await response.json()
                            toast.error(error.error || 'Failed to sign contract')
                          }
                        } catch (error) {
                          console.error('Error signing contract:', error)
                          toast.error('Error signing contract')
                        }
                      }}
                    >
                      Sign Contract
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* File Review Modal */}
            {selectedFile && (
              <FileReviewModal
                open={showFileReviewModal}
                onOpenChange={(open) => {
                  setShowFileReviewModal(open)
                }}
                file={selectedFile}
                brandColor={brandColor}
                showReviewActions={true}
                onApproved={() => {
                  window.location.reload()
                }}
                onRejected={() => {
                  window.location.reload()
                }}
              />
            )}
          </>
        ) : section === "invoices" ? (
          <InvoicesSection brandColor={brandColor} invoices={invoices} selectedProject={selectedProject} projects={projects} />
        ) : section === "forms" ? (
          <FormsSection brandColor={brandColor} forms={forms} formSubmissions={formSubmissions} selectedProject={selectedProject} client={client!} account={account} />
        ) : section === "files" ? (
          <FilesSection brandColor={brandColor} files={files} selectedProject={selectedProject} client={client!} account={account} />
        ) : section === "messages" ? (
          <MessagesSection brandColor={brandColor} messages={messages} selectedProject={selectedProject} client={client!} account={account} />
        ) : section === "tasks" ? (
          <TasksSection 
            brandColor={brandColor} 
            tasks={tasks} 
            milestones={milestones} 
            taskViews={taskViews} 
            selectedProject={selectedProject}
            onTaskViewsChange={onTaskViewsChange}
          />
        ) : section === "contracts" ? (
          <ContractsSection 
            brandColor={brandColor} 
            contracts={contracts} 
            selectedProject={selectedProject} 
            account={account} 
            client={client}
            onContractUpdate={onContractsUpdate}
          />
        ) : section === "appointments" ? (
          <AppointmentsSection brandColor={brandColor} bookings={bookings} selectedProject={selectedProject} clientId={client.id} />
        ) : section === "activity" ? (
          <ActivitySection brandColor={brandColor} selectedProject={selectedProject} />
        ) : (
          // Other sections placeholder
          <Card className="border border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 mb-4">
                  {(() => {
                    const sectionData = sections.find(s => s.id === section)
                    if (!sectionData) return null
                    const Icon = sectionData.icon
                    return <Icon className="h-8 w-8 text-gray-400" />
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {sections.find(s => s.id === section)?.label} Section
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  This is a preview of the {sections.find(s => s.id === section)?.label.toLowerCase()} section.
                  Customize the appearance and settings in the right panel.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Card>
  )
}

// Login Preview Component
function LoginPreview({
  brandColor,
  logoUrl,
  client,
  device = "desktop",
  welcomeHeadline = "Welcome",
  welcomeSubtitle = "Login to access your portal",
  magicLinkEnabled = true,
  passwordEnabled = false,
  activeAuthMode = "magic",
  magicLinkButtonLabel = "Send Magic Link",
  passwordButtonLabel = "Sign In",
  showResend = false,
}: {
  brandColor: string
  logoUrl: string
  client: Client
  device?: "desktop" | "mobile"
  welcomeHeadline?: string
  welcomeSubtitle?: string
  magicLinkEnabled?: boolean
  passwordEnabled?: boolean
  activeAuthMode?: "magic" | "password"
  magicLinkButtonLabel?: string
  passwordButtonLabel?: string
  showResend?: boolean
}) {
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [currentMode, setCurrentMode] = useState<"magic" | "password">(activeAuthMode)
  const isBoth = magicLinkEnabled && passwordEnabled
  const mode = isBoth ? currentMode : (magicLinkEnabled ? "magic" : "password")

  // Sync currentMode with activeAuthMode when it changes
  useEffect(() => {
    setCurrentMode(activeAuthMode)
  }, [activeAuthMode])

  return (
    <div className={`w-full ${device === 'mobile' ? 'max-w-sm' : 'max-w-md'}`}>
      <Card className="w-full shadow-2xl rounded-3xl overflow-hidden">
      <CardContent className="p-8 relative">
        {showCreateAccount && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateAccount(false)}
            className="absolute top-4 left-0 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Login
          </Button>
        )}
        <div className="text-center mb-8">
          {logoUrl ? (
            <>
              <img 
                src={getPortalLogoUrl(logoUrl)} 
                alt="Logo" 
                className="h-12 mx-auto mb-6 object-contain" 
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                  const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                  if (placeholder) placeholder.style.display = 'flex'
                }} 
              />
              <div className="w-16 h-16 rounded-2xl mx-auto mb-6 hidden items-center justify-center" style={{ backgroundColor: brandColor }}>
                <Building2 className="h-8 w-8 text-white" />
              </div>
            </>
          ) : (
            <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: brandColor }}>
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{welcomeHeadline}</h2>
            <p className="text-gray-600">{welcomeSubtitle}</p>
        </div>

          {isBoth && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'magic' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                onClick={() => setCurrentMode('magic')}
              >
                Magic Link
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'password' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                onClick={() => setCurrentMode('password')}
              >
                Password
              </button>
            </div>
          )}

          {mode === 'magic' ? (
        <div className="space-y-4">
          <div>
                <Label htmlFor="login-email">Email Address</Label>
                <Input id="login-email" type="email" placeholder="you@example.com" className="mt-1" />
          </div>
          <Button className="w-full" style={{ backgroundColor: brandColor }} disabled>
            <Mail className="h-4 w-4 mr-2" />
                {magicLinkButtonLabel}
          </Button>
              <p className="text-xs text-gray-500 text-center">We'll email you a secure link to access your portal</p>
              {showResend && (
                <p className="text-xs text-gray-500 text-center">Resend link will be shown after submit</p>
              )}
        </div>
          ) : showCreateAccount ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-800">
                  Use the email you provided to your freelancer
                </p>
              </div>
              <div>
                <Label htmlFor="create-email">Email Address</Label>
                <Input id="create-email" type="email" placeholder="you@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="create-password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="create-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button className="w-full" style={{ backgroundColor: brandColor }} disabled>
                Create Account
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email Address</Label>
                <Input id="login-email" type="email" placeholder="you@example.com" className="mt-1" />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" placeholder="••••••••" className="mt-1" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Forgot password?</span>
              </div>
              <Button className="w-full" style={{ backgroundColor: brandColor }} disabled>
                {passwordButtonLabel}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateAccount(true)}
              >
                Create your account
              </Button>
            </div>
          )}

      </CardContent>
    </Card>
    </div>
  )
}

// Invoices Section Component
function InvoicesSection({ brandColor, invoices, selectedProject, projects }: { brandColor: string; invoices: any[]; selectedProject: string; projects: Project[] }) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [previewInvoice, setPreviewInvoice] = useState<any>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadAccount = async () => {
      try {
        const accountData = await getCurrentAccount()
        if (accountData) {
          setAccount(accountData)
        }
      } catch (error) {
        console.error('Error loading account:', error)
      }
    }
    loadAccount()
  }, [])

  // Filter invoices by selected project
  const projectFilteredInvoices = selectedProject === 'all' 
    ? invoices 
    : invoices.filter(inv => !inv.project_id || inv.project_id === selectedProject)
  
  // Determine invoice status (including overdue)
  const getInvoiceStatus = (invoice: any) => {
    if (invoice.status === 'paid') return 'paid'
    if (invoice.status === 'draft') return 'draft'
    if (invoice.due_date && new Date(invoice.due_date) < new Date()) return 'overdue'
    return 'unpaid'
  }

  // Filter by status
  const filteredInvoices = projectFilteredInvoices.filter(invoice => {
    if (statusFilter === 'all') return true
    const status = getInvoiceStatus(invoice)
    return status === statusFilter
  })
  
  // Calculate real statistics from actual invoices
  const outstandingBalance = projectFilteredInvoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'draft')
    .reduce((sum, inv) => sum + (inv.total_amount || inv.subtotal || 0), 0)
  
  const paidToDate = projectFilteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.total_amount || inv.subtotal || 0), 0)
  
  // Find next upcoming invoice
  const upcomingInvoices = projectFilteredInvoices
    .filter(inv => inv.status !== 'paid' && inv.status !== 'draft' && inv.due_date)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
  
  const nextDueInvoice = upcomingInvoices[0]

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0)
  }

  const handleDownloadPDF = async (invoice: any) => {
    try {
      setDownloadingPDF(invoice.id)
      
      // Set preview invoice temporarily to generate PDF
      setPreviewInvoice(invoice)
      setPreviewOpen(true)
      
      // Wait for modal to render
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const previewElement = previewRef.current
      if (!previewElement) {
        toast.error('Failed to generate PDF')
        setPreviewOpen(false)
        setPreviewInvoice(null)
        return
      }

      // Store original styles
      const originalStyles = {
        visibility: previewElement.style.visibility,
        opacity: previewElement.style.opacity,
        position: previewElement.style.position,
        left: previewElement.style.left,
        top: previewElement.style.top,
        width: previewElement.style.width,
      }

      // Position element off-screen for capture
      previewElement.style.visibility = 'visible'
      previewElement.style.opacity = '1'
      previewElement.style.position = 'absolute'
      previewElement.style.left = '-9999px'
      previewElement.style.top = '0'
      previewElement.style.width = '1000px'
      document.body.appendChild(previewElement)

      // Generate canvas
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: previewElement.scrollWidth,
        windowHeight: previewElement.scrollHeight,
      })

      // Remove from body and restore styles
      document.body.removeChild(previewElement)
      Object.assign(previewElement.style, originalStyles)
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Download the PDF
      pdf.save(`invoice-${invoice.invoice_number || 'draft'}.pdf`)
      
      toast.success('PDF downloaded successfully')
      setPreviewOpen(false)
      setPreviewInvoice(null)
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
      setPreviewOpen(false)
      setPreviewInvoice(null)
    } finally {
      setDownloadingPDF(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Row */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Outstanding Balance</div>
            <div className="text-3xl font-bold text-gray-900">${outstandingBalance.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Paid to Date</div>
            <div className="text-3xl font-bold text-green-600">${paidToDate.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="text-sm text-gray-600 mb-1">Next Due</div>
            <div className="text-3xl font-bold" style={{ color: brandColor }}>
              {nextDueInvoice ? `$${(nextDueInvoice.total_amount || nextDueInvoice.subtotal || 0).toLocaleString()}` : '$0'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {nextDueInvoice ? `Due ${formatDate(nextDueInvoice.due_date)}` : 'No upcoming invoices'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className={`rounded-lg ${statusFilter === 'all' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`rounded-lg ${statusFilter === 'paid' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              onClick={() => setStatusFilter('paid')}
            >
              Paid
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`rounded-lg ${statusFilter === 'unpaid' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              onClick={() => setStatusFilter('unpaid')}
            >
              Unpaid
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className={`rounded-lg ${statusFilter === 'overdue' ? 'bg-gray-100 font-medium' : 'hover:bg-gray-100'}`}
              onClick={() => setStatusFilter('overdue')}
            >
              Overdue
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">No invoices yet</p>
                        <p className="text-sm mt-1">Invoices will appear here once they're created</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const status = getInvoiceStatus(invoice)
                    return (
                  <tr key={invoice.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">
                            {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                          </span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`${
                              status === "paid"
                            ? "bg-green-100 text-green-700 border-green-200"
                                : status === "draft"
                                ? "bg-gray-100 text-gray-700 border-gray-200"
                                : status === "overdue"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : "bg-amber-100 text-amber-700 border-amber-200"
                        } border`}
                      >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.issue_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(invoice.due_date)}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          ${(invoice.total_amount || invoice.subtotal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-3 rounded-lg hover:bg-gray-100"
                          onClick={() => {
                            setPreviewInvoice(invoice)
                            setPreviewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                            {status !== "paid" && status !== "draft" && (
                          <Button
                            size="sm"
                            className="h-8 px-3 rounded-lg text-white"
                            style={{ backgroundColor: brandColor }}
                          >
                            Pay
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 px-3 rounded-lg hover:bg-gray-100"
                          onClick={() => handleDownloadPDF(invoice)}
                          disabled={downloadingPDF === invoice.id}
                        >
                          {downloadingPDF === invoice.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        ref={previewRef}
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreviewInvoice(null)
        }}
        invoice={previewInvoice}
        account={account}
        projects={projects}
        brandColor={brandColor}
      />
    </div>
  )
}

// Forms Section Component
function FormsSection({ brandColor, forms, formSubmissions, selectedProject, client, account }: { brandColor: string; forms: any[]; formSubmissions: any[]; selectedProject: string; client: Client; account: Account | null }) {
  const [selectedForm, setSelectedForm] = useState<any>(null)
  const [showFormModal, setShowFormModal] = useState(false)
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null)
  
  // Filter forms by selected project
  const projectFilteredForms = selectedProject === 'all' 
    ? forms 
    : forms.filter(f => !f.project_id || f.project_id === selectedProject)
  
  // Get submitted form IDs and create a map of form_id to submission
  const submittedFormIds = new Set(formSubmissions.map(fs => fs.form_id))
  const submissionMap = new Map(formSubmissions.map(fs => [fs.form_id, fs]))
  
  // Format date helper
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="space-y-8 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Forms</h2>
          <p className="text-sm text-gray-600 mt-1">Complete the forms assigned to you</p>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {projectFilteredForms.length === 0 ? (
          <Card className="border border-gray-200 shadow-lg rounded-2xl">
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium text-gray-500">No forms available</p>
              <p className="text-sm text-gray-400 mt-1">Forms will appear here once they're assigned to you</p>
            </CardContent>
          </Card>
        ) : (
          projectFilteredForms.map((form) => {
            const isCompleted = submittedFormIds.has(form.id)
            const status = isCompleted ? 'completed' : 'not-started'
            
            return (
              <Card
                key={form.id}
                className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{form.title}</h3>
                        <Badge
                          className={`${
                            status === "completed"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-700 border-gray-200"
                          } border`}
                        >
                          {status === "completed" ? "Completed" : "Not Started"}
                        </Badge>
                      </div>
                      {form.description && (
                        <p className="text-sm text-gray-600 mb-3">{form.description}</p>
                      )}
                      {form.instructions && (
                        <p className="text-xs text-gray-500 mb-3 italic">{form.instructions}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {form.created_at && (
                          <span>Created {formatTimeAgo(form.created_at)}</span>
                        )}
                        {form.submission_deadline && (
                          <span className="text-amber-600">
                            Due: {new Date(form.submission_deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      className="rounded-xl text-white ml-4"
                      style={{ backgroundColor: brandColor }}
                      onClick={() => {
                        if (status === "completed") {
                          // Show preview with filled data
                          const submission = submissionMap.get(form.id)
                          setSelectedForm(form)
                          setSelectedSubmission(submission)
                          setShowFormPreview(true)
                        } else {
                          // Show fill out modal
                          setSelectedForm(form)
                          setShowFormModal(true)
                        }
                      }}
                    >
                      {status === "completed" ? "View" : "Fill Out"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Form Fill Out Modal */}
      {showFormModal && selectedForm && (
        <FormFilloutModal
          open={showFormModal}
          onOpenChange={(open) => {
            setShowFormModal(open)
            if (!open) {
              setSelectedForm(null)
            }
          }}
          form={selectedForm}
          account={account}
          client={client}
          onSubmit={() => {
            window.location.reload()
          }}
        />
      )}

      {/* Form Preview Modal with Filled Data */}
      {showFormPreview && selectedForm && (
        <FormPreviewModal
          open={showFormPreview}
          onOpenChange={(open) => {
            setShowFormPreview(open)
            if (!open) {
              setSelectedForm(null)
              setSelectedSubmission(null)
            }
          }}
          form={selectedForm}
          submission={selectedSubmission}
          account={account}
        />
      )}
    </div>
  )
}


// Files Section Component
function FilesSection({ brandColor, files, selectedProject, client, account }: { brandColor: string; files: any[]; selectedProject: string; client: Client; account: Account | null }) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [fileTypeFilter, setFileTypeFilter] = useState<"all" | "images" | "pdfs" | "docs">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [showFileModal, setShowFileModal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get file type icon - defined first so it can be used in filters
  const getFileType = (fileName: string, fileType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image'
    if (['pdf'].includes(ext || '')) return 'pdf'
    return 'doc'
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  // Filter files by selected project
  let projectFilteredFiles = selectedProject === 'all' 
    ? files 
    : files.filter(f => !f.project_id || f.project_id === selectedProject)

  // Apply file type filter
  if (fileTypeFilter !== "all") {
    projectFilteredFiles = projectFilteredFiles.filter(file => {
      const fileType = getFileType(file.name, file.file_type)
      if (fileTypeFilter === "images") return fileType === "image"
      if (fileTypeFilter === "pdfs") return fileType === "pdf"
      if (fileTypeFilter === "docs") return fileType === "doc"
      return true
    })
  }

  // Apply search filter
  if (searchQuery) {
    projectFilteredFiles = projectFilteredFiles.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // Get status badge - maps directly to approval_status column
  const getStatusBadge = (file: any) => {
    const approvalStatus = file.approval_status || 'pending'
    
    if (approvalStatus === 'approved') {
      return { label: 'Approved', className: 'bg-green-100 text-green-700 border-green-200' }
    } else if (approvalStatus === 'rejected') {
      return { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-200' }
    } else {
      return { label: 'Needs Review', className: 'bg-amber-100 text-amber-700 border-amber-200' }
    }
  }

  // Get shared by name - shows "You" if uploaded by client, otherwise shows uploaded_by_name
  const getSharedByName = (file: any) => {
    if (file.sent_by_client) {
      return 'You'
    }
    return file.uploaded_by_name || 'Agency'
  }

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!client || !account) {
      toast.error('Client or account information missing')
      return
    }

    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('isPreview', 'true')
        formData.append('clientId', client.id)
        formData.append('accountId', account.id)
        formData.append('projectId', selectedProject !== 'all' ? selectedProject : '')

        const response = await fetch('/api/client-portal/upload-file', {
          method: 'POST',
          body: formData
        })

        const result = await response.json()
        if (!response.ok) {
          toast.error(result.message || 'Failed to upload file')
        } else {
          toast.success(`${file.name} uploaded successfully`)
        }
      }
      // Refresh files list
      window.location.reload()
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Error uploading file')
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileClick = (file: any) => {
    setSelectedFile(file)
    setShowFileModal(true)
  }

  const handleFileApproved = () => {
    window.location.reload()
  }

  const handleFileRejected = () => {
    window.location.reload()
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Files</h2>
          <p className="text-sm text-gray-600 mt-1">Access shared documents and files</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              <Grid3x3 className="h-4 w-4 text-gray-700" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
              }`}
            >
              <List className="h-4 w-4 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 shadow-sm rounded-2xl hover:border-gray-400 transition-colors duration-200">
        <CardContent className="p-8">
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{ backgroundColor: `${brandColor}15` }}
            >
              {isUploading ? (
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: brandColor }} />
              ) : (
                <Upload className="h-8 w-8" style={{ color: brandColor }} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Files</h3>
            <p className="text-sm text-gray-600 mb-4">Drag and drop files here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isUploading}
            />
            <Button 
              className="rounded-xl text-white" 
              style={{ backgroundColor: brandColor }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border border-gray-200 shadow-lg rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="ghost" 
                className={`rounded-lg ${fileTypeFilter === "all" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
                onClick={() => setFileTypeFilter("all")}
              >
                All Files
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`rounded-lg ${fileTypeFilter === "images" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
                onClick={() => setFileTypeFilter("images")}
              >
                Images
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`rounded-lg ${fileTypeFilter === "pdfs" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
                onClick={() => setFileTypeFilter("pdfs")}
              >
                PDFs
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className={`rounded-lg ${fileTypeFilter === "docs" ? "bg-gray-100 font-medium" : "hover:bg-gray-100"}`}
                onClick={() => setFileTypeFilter("docs")}
              >
                Docs
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search files..." 
                  className="pl-9 h-9 rounded-lg w-48" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {viewMode === "list" ? (
        <Card className="border border-gray-200 shadow-lg rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Shared By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {projectFilteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium text-gray-500">No files available</p>
                        <p className="text-sm text-gray-400 mt-1">Files will appear here once they're shared</p>
                      </td>
                    </tr>
                  ) : (
                    projectFilteredFiles.map((file) => {
                      const fileType = getFileType(file.name, file.file_type)
                      const statusBadge = getStatusBadge(file)
                      
                      return (
                        <tr key={file.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="flex items-center justify-center w-10 h-10 rounded-lg"
                                style={{ backgroundColor: `${brandColor}15` }}
                              >
                                {fileType === "pdf" ? (
                                  <FileText className="h-5 w-5" style={{ color: brandColor }} />
                                ) : fileType === "image" ? (
                                  <span className="text-lg">🖼️</span>
                                ) : (
                                  <FileText className="h-5 w-5" style={{ color: brandColor }} />
                                )}
                              </div>
                          <span className="text-sm font-semibold text-gray-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getSharedByName(file)}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{formatDate(file.created_at)}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${statusBadge.className} border pointer-events-none`}>
                              {statusBadge.label}
                            </Badge>
                          </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {file.approval_status === 'approved' ? (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-3 rounded-lg hover:bg-gray-100"
                              onClick={() => handleFileClick(file)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 px-3 rounded-lg hover:bg-gray-100"
                              onClick={() => handleFileClick(file)}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {projectFilteredFiles.length === 0 ? (
            <div className="col-span-4">
              <Card className="border border-gray-200 shadow-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">No files available</p>
                  <p className="text-sm text-gray-400 mt-1">Files will appear here once they're shared</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            projectFilteredFiles.map((file) => {
              const fileType = getFileType(file.name, file.file_type)
              const statusBadge = getStatusBadge(file)
              
              return (
                <Card
                  key={file.id}
                  className="border border-gray-200 shadow-lg rounded-2xl hover:shadow-xl transition-all duration-200 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <CardContent className="p-4">
                    <div
                      className="flex items-center justify-center h-32 rounded-xl mb-3"
                      style={{ backgroundColor: `${brandColor}10` }}
                    >
                      {fileType === "pdf" ? (
                        <FileText className="h-12 w-12" style={{ color: brandColor }} />
                      ) : fileType === "image" ? (
                        <span className="text-5xl">🖼️</span>
                      ) : (
                        <FileText className="h-12 w-12" style={{ color: brandColor }} />
                      )}
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 truncate mb-1">{file.name}</h4>
                    <Badge className={`${statusBadge.className} border text-xs mb-2 pointer-events-none`}>
                      {statusBadge.label}
                    </Badge>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{getSharedByName(file)}</span>
                      {file.approval_status === 'approved' ? (
                        <span className="text-xs text-gray-400">Click to view</span>
                      ) : (
                        <span className="text-xs text-gray-400">Click to review</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* File Review Modal */}
      {selectedFile && (
        <FileReviewModal
          open={showFileModal}
          onOpenChange={setShowFileModal}
          file={selectedFile}
          brandColor={brandColor}
          showReviewActions={selectedFile.approval_status !== 'approved'}
          onApproved={handleFileApproved}
          onRejected={handleFileRejected}
        />
      )}
    </div>
  )
}

// Portal Settings Component
function PortalSettings({
  brandColor,
  setBrandColor,
  customColor,
  setCustomColor,
  welcomeMessage,
  setWelcomeMessage,
  logoUrl,
  onLogoUpload,
  companyName,
  setCompanyName,
  useBackgroundImage,
  setUseBackgroundImage,
  backgroundImageUrl,
  onBackgroundImageUpload,
  backgroundColor,
  setBackgroundColor,
  customBackgroundColor,
  setCustomBackgroundColor,
  moduleStates,
  setModuleStates,
  projects,
  projectVisibility,
  setProjectVisibility,
  defaultProject,
  setDefaultProject,
  selectedProject,
  setSelectedProject,
  sidebarBgColor,
  setSidebarBgColor,
  sidebarTextColor,
  setSidebarTextColor,
  portalFont,
  setPortalFont,
  googleFonts,
  sidebarHighlightColor,
  setSidebarHighlightColor,
  sidebarHighlightTextColor,
  setSidebarHighlightTextColor,
  taskViews,
  setTaskViews,
}: {
  brandColor: string
  setBrandColor: (color: string) => void
  customColor: string
  setCustomColor: (color: string) => void
  welcomeMessage: string
  setWelcomeMessage: (msg: string) => void
  logoUrl: string
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  companyName: string
  setCompanyName: (name: string) => void
  useBackgroundImage: boolean
  setUseBackgroundImage: (val: boolean) => void
  backgroundImageUrl: string
  onBackgroundImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  customBackgroundColor: string
  setCustomBackgroundColor: (color: string) => void
  moduleStates: Record<string, boolean>
  setModuleStates: (states: Record<string, boolean>) => void
  projects: Project[]
  projectVisibility: Record<string, boolean>
  setProjectVisibility: (vis: Record<string, boolean>) => void
  defaultProject: string | null
  setDefaultProject: (project: string | null) => void
  selectedProject: string
  setSelectedProject: (project: string) => void
  sidebarBgColor: string
  setSidebarBgColor: (c: string) => void
  sidebarTextColor: string
  setSidebarTextColor: (c: string) => void
  portalFont: string
  setPortalFont: (f: string) => void
  googleFonts: { label: string; value: string; url: string }[]
  sidebarHighlightColor?: string
  setSidebarHighlightColor?: (c: string) => void
  sidebarHighlightTextColor?: string
  setSidebarHighlightTextColor?: (c: string) => void
  taskViews: {milestones: boolean; board: boolean}
  setTaskViews: (views: {milestones: boolean; board: boolean}) => void
}) {
  return (
    <div className="space-y-8">
      {/* Branding Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Branding</h3>

        <div className="space-y-6">
          {/* Logo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo</Label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#4647E0] transition-colors"
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={onLogoUpload}
                className="hidden"
              />
              {logoUrl ? (
                <div className="space-y-2">
                  <img
                    src={logoUrl.startsWith('data:') ? logoUrl : getPortalLogoUrl(logoUrl)}
                    alt="Logo"
                    className="h-12 mx-auto object-contain"
                    onError={(e) => {
                      console.error('Logo load error:', logoUrl)
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <p className="text-xs text-gray-600">Click to change</p>
                </div>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Upload logo</p>
                </>
              )}
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">
              Your Company Name
            </Label>
            <Input
              id="company-name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              className="rounded-xl"
            />
          </div>

          {/* Welcome Message */}
          <div className="space-y-2">
            <Label htmlFor="welcome" className="text-sm font-medium">
              Welcome Message
            </Label>
            <Textarea
              id="welcome"
              value={welcomeMessage}
              onChange={(e) => setWelcomeMessage(e.target.value)}
              placeholder="Welcome to your portal..."
              className="min-h-[80px] rounded-xl"
            />
          </div>

          {/* Brand Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Brand Color</Label>
            <div className="flex items-center gap-2">
              <Input
                type="color"
                value={customColor || brandColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  setBrandColor(e.target.value)
                }}
                className="w-12 h-8 p-1"
              />
              <span className="text-xs text-gray-600 font-mono">{brandColor}</span>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Header Background</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={useBackgroundImage}
                onCheckedChange={setUseBackgroundImage}
              />
              <span className="text-sm text-gray-700">
                {useBackgroundImage ? 'Image' : 'Solid Color'}
              </span>
            </div>

            {useBackgroundImage ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-[#4647E0] transition-colors"
                onClick={() => document.getElementById('bg-upload')?.click()}
              >
                <input
                  id="bg-upload"
                  type="file"
                  accept="image/*"
                  onChange={onBackgroundImageUpload}
                  className="hidden"
                />
                {backgroundImageUrl ? (
                  <div className="space-y-2">
                    <img
                      src={backgroundImageUrl}
                      alt="Background"
                      className="h-16 w-full object-cover rounded-lg"
                    />
                    <p className="text-xs text-gray-600">Click to change</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600">Upload background</p>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={customBackgroundColor || backgroundColor}
                  onChange={(e) => {
                    setCustomBackgroundColor(e.target.value)
                    setBackgroundColor(e.target.value)
                  }}
                  className="w-12 h-8 p-1"
                />
                <span className="text-xs text-gray-600 font-mono">{backgroundColor}</span>
              </div>
            )}
          </div>

          {/* Sidebar & Font */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Sidebar & Font</Label>
            <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Sidebar Background</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={sidebarBgColor}
                    onChange={(e) => setSidebarBgColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <span className="text-xs text-gray-600 font-mono">{sidebarBgColor}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Sidebar Text</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={sidebarTextColor}
                    onChange={(e) => setSidebarTextColor(e.target.value)}
                    className="w-12 h-8 p-1"
                  />
                  <span className="text-xs text-gray-600 font-mono">{sidebarTextColor}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">Sidebar Highlight</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={sidebarHighlightColor || '#4647E0'}
                    onChange={(e) => {
                      if (setSidebarHighlightColor) {
                        setSidebarHighlightColor(e.target.value)
                      }
                    }}
                    className="w-12 h-8 p-1"
                  />
                  <span className="text-xs text-gray-600 font-mono">{sidebarHighlightColor || '#4647E0'}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-600">Highlight Text</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={sidebarHighlightTextColor || '#FFFFFF'}
                    onChange={(e) => {
                      if (setSidebarHighlightTextColor) {
                        setSidebarHighlightTextColor(e.target.value)
                      }
                    }}
                    className="w-12 h-8 p-1"
                  />
                  <span className="text-xs text-gray-600 font-mono">{sidebarHighlightTextColor || '#FFFFFF'}</span>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Portal Font</Label>
              <select
                value={portalFont}
                onChange={(e) => setPortalFont(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4647E0] focus:border-transparent"
              >
                {googleFonts.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
            </div>
          </div>

          {/* Default Project */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Default Project</Label>
              <p className="text-xs text-gray-600">Which project clients see when opening the portal</p>
              <select
                value={defaultProject || 'newest'}
                onChange={(e) => {
                  const value = e.target.value
                  const newDefaultProject = value === 'newest' ? null : value
                  setDefaultProject(newDefaultProject)
                  
                  // Immediately update the preview's selected project to match
                  if (newDefaultProject === null || newDefaultProject === 'newest') {
                    // Select the newest project (first one in the list)
                    const visibleProjects = projects.filter((p: Project) => projectVisibility[p.id] !== false)
                    if (visibleProjects.length > 0) {
                      setSelectedProject(visibleProjects[0].id)
                    } else if (projects.length > 0) {
                      setSelectedProject(projects[0].id)
                    }
                  } else {
                    // Select the specific default project
                    const defaultProjectExists = projects.find((p: Project) => p.id === newDefaultProject)
                    if (defaultProjectExists && projectVisibility[newDefaultProject] !== false) {
                      setSelectedProject(newDefaultProject)
                    } else {
                      // Fallback to first visible project
                      const firstVisibleProject = projects.find((p: Project) => projectVisibility[p.id] !== false) || projects[0]
                      if (firstVisibleProject) {
                        setSelectedProject(firstVisibleProject.id)
                      }
                    }
                  }
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#4647E0] focus:border-transparent"
              >
                <option value="newest">Newest Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Modules Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Modules</h3>
        <p className="text-sm text-gray-600 mb-4">Show or hide sections in the portal</p>

        <div className="space-y-3">
          {sections.filter(s => s.id !== 'home' && s.id !== 'settings').map((section) => {
            const Icon = section.icon
            return (
              <div
                key={section.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">{section.label}</span>
                </div>
                <Switch
                  checked={moduleStates[section.id] !== false}
                  onCheckedChange={(checked) =>
                    setModuleStates({ ...moduleStates, [section.id]: checked })
                  }
                />
              </div>
            )
          })}
        </div>
      </div>

      {moduleStates.tasks && (
        <>
          <Separator />

          {/* Task Views Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Views</h3>
            <p className="text-sm text-gray-600 mb-4">Choose which views to show in the tasks section</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Milestones View</span>
                </div>
                <Switch
                  checked={taskViews.milestones}
                  onCheckedChange={(checked) =>
                    setTaskViews({ ...taskViews, milestones: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Grid3x3 className="h-4 w-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">Board View</span>
                </div>
                <Switch
                  checked={taskViews.board}
                  onCheckedChange={(checked) =>
                    setTaskViews({ ...taskViews, board: checked })
                  }
                />
              </div>
            </div>

            {!taskViews.milestones && !taskViews.board && (
              <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded-lg">
                At least one view must be enabled
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

