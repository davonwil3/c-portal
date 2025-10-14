"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
  Copy,
  Eye,
  Upload,
  Palette,
  Shield,
  TimerIcon as Timeline,
  FileText,
  CreditCard,
  MessageCircle,
  Bot,
  FolderOpen,
  Mail,
  Plus,
  X,
  Loader2,
} from "lucide-react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { uploadPortalLogo, validateLogoFile, getPortalLogoUrl, uploadPortalBackground, getPortalBackgroundUrl } from "@/lib/storage"
import { ImageCropModal } from "@/components/ui/image-crop-modal"

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
}

const modules = [
  {
    id: "timeline",
    name: "Timeline",
    description: "Project milestones and progress tracking",
    icon: Timeline,
    enabled: true,
  },
  {
    id: "files",
    name: "Files",
    description: "Document sharing and file management",
    icon: FolderOpen,
    enabled: true,
  },
  {
    id: "invoices",
    name: "Invoices",
    description: "Billing and payment information",
    icon: CreditCard,
    enabled: true,
  },
  {
    id: "contracts",
    name: "Contracts",
    description: "Contract management and digital signatures",
    icon: FileText,
    enabled: true,
  },
  {
    id: "forms",
    name: "Forms",
    description: "Custom forms and data collection",
    icon: FileText,
    enabled: false,
  },
  {
    id: "messages",
    name: "Messages",
    description: "Direct communication with your team",
    icon: MessageCircle,
    enabled: true,
  },
]

const brandColors = [
  "#3C3CFF", // Default purple
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#96CEB4", // Green
  "#FFEAA7", // Yellow
  "#DDA0DD", // Plum
  "#98D8C8", // Mint
]

const backgroundColors = [
  "#3C3CFF", // Default purple
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

export default function PortalSettingsPage() {
  const params = useParams()
  const portalId = params.id

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [portal, setPortal] = useState<PortalSettings | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [moduleStates, setModuleStates] = useState<Record<string, boolean>>({})
  const [projectVisibility, setProjectVisibility] = useState<Record<string, boolean>>({})
  const [defaultProject, setDefaultProject] = useState<string | null>(null)
  const [brandColor, setBrandColor] = useState("#3C3CFF")
  const [customColor, setCustomColor] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState("")
  const [inviteEmails, setInviteEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [sendingInvites, setSendingInvites] = useState(false)
  const [allowlistMembers, setAllowlistMembers] = useState<any[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string>('')
  
  // Background settings
  const [useBackgroundImage, setUseBackgroundImage] = useState(false)
  const [backgroundImageFile, setBackgroundImageFile] = useState<File | null>(null)
  const [backgroundImagePreview, setBackgroundImagePreview] = useState<string | null>(null)
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState("#3C3CFF")
  const [customBackgroundColor, setCustomBackgroundColor] = useState("")
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string>('')

  // Fetch portal settings function
  const fetchPortalSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/portals/${portalId}/settings`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setPortal(data.portal)
        setClient(data.client)
        setProjects(data.projects)
        setModuleStates(data.modules)
        setProjectVisibility(data.projectVisibility)
        setDefaultProject(data.defaultProject)
        setBrandColor(data.portal.brandColor)
        setWelcomeMessage(data.portal.welcomeMessage)
        setLogoUrl(data.portal.logoUrl)
        setUseBackgroundImage(data.portal.useBackgroundImage || false)
        setBackgroundImageUrl(data.portal.backgroundImageUrl || '')
        setBackgroundImagePreview(data.portal.backgroundImageUrl || null) // Set preview to existing image
        setBackgroundColor(data.portal.backgroundColor || '#3C3CFF')
        setAllowlistMembers(data.members || [])
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

  // Fetch portal settings on mount
  useEffect(() => {
    if (portalId) {
      fetchPortalSettings()
    }
  }, [portalId])

  const handleModuleToggle = (moduleId: string) => {
    setModuleStates((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
    setHasChanges(true)
  }

  const handleProjectVisibilityToggle = (projectId: string) => {
    setProjectVisibility((prev) => {
      const newVisibility = { ...prev, [projectId]: !prev[projectId] }

      // If hiding the default project, clear the default
      if (!newVisibility[projectId] && defaultProject === projectId) {
        setDefaultProject(null)
      }

      return newVisibility
    })
    setHasChanges(true)
  }

  const handleDefaultProjectChange = (projectId: string) => {
    setDefaultProject(projectId)
    setHasChanges(true)
  }

  const handleColorChange = (color: string) => {
    setBrandColor(color)
    setCustomColor("")
    setHasChanges(true)
  }

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color)
    setBrandColor(color)
    setHasChanges(true)
  }

  // Background handlers
  const handleBackgroundColorChange = async (color: string) => {
    setBackgroundColor(color)
    setCustomBackgroundColor("")
    setUseBackgroundImage(false) // Switch to solid color
    await saveBackgroundSettings('') // Save with empty image URL
  }

  const handleCustomBackgroundColorChange = async (color: string) => {
    setCustomBackgroundColor(color)
    setBackgroundColor(color)
    setUseBackgroundImage(false) // Switch to solid color
    await saveBackgroundSettings('') // Save with empty image URL
  }

  const handleBackgroundImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size must be less than 5MB')
      return
    }

    try {
      setBackgroundImageFile(file)
      
      // Create preview for crop modal
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
      // Set preview immediately for better UX
      setBackgroundImagePreview(croppedImageUrl)
      
      // Convert blob URL to file
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'cropped-background.jpg', { type: 'image/jpeg' })
      
      // Upload cropped image to storage
      const uploadedUrl = await uploadPortalBackground(file, portalId as string)
      setBackgroundImageUrl(uploadedUrl)
      setUseBackgroundImage(true) // Automatically enable background image
      
      // Auto-save the background image settings (no refresh needed)
      await saveBackgroundSettings(uploadedUrl)
      
      // Update preview to use the uploaded URL for consistency
      setBackgroundImagePreview(uploadedUrl)
      
    } catch (error) {
      console.error('Error uploading cropped background image:', error)
      toast.error('Failed to upload background image')
      // Clear preview on error
      setBackgroundImagePreview(null)
    }
  }

  const saveBackgroundSettings = async (imageUrl: string) => {
    try {
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
            logoUrl,
            useBackgroundImage: true,
            backgroundImageUrl: imageUrl,
            backgroundColor,
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
      if (!result.success) {
        console.error('Failed to save background settings:', result.message)
        throw new Error(result.message || 'Failed to save background settings')
      }
    } catch (error) {
      console.error('Error saving background settings:', error)
      throw error // Re-throw to handle in calling function
    }
  }

  const handleAddEmail = () => {
    if (newEmail && !inviteEmails.includes(newEmail)) {
      setInviteEmails([...inviteEmails, newEmail])
      setNewEmail("")
      setHasChanges(true)
    }
  }

  const handleRemoveEmail = (email: string) => {
    setInviteEmails(inviteEmails.filter((e) => e !== email))
    setHasChanges(true)
  }

  const handleSendInvites = async () => {
    if (inviteEmails.length === 0) {
      toast.error('Please add at least one email address')
      return
    }

    setSendingInvites(true)
    try {
      const response = await fetch('/api/client-portal/add-members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portalId,
          emails: inviteEmails
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Invitations sent successfully!')
        setInviteEmails([])
        setHasChanges(false)
        // Refresh allowlist members
        const settingsResponse = await fetch(`/api/portals/${portalId}/settings`)
        const settingsResult = await settingsResponse.json()
        if (settingsResult.success) {
          setAllowlistMembers(settingsResult.data.members || [])
        }
      } else {
        toast.error(result.message || 'Failed to send invitations')
      }
    } catch (error) {
      console.error('Error sending invitations:', error)
      toast.error('Failed to send invitations')
    } finally {
      setSendingInvites(false)
    }
  }

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file
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

  const handleLogoDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      // Validate file
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

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const handleSaveChanges = async () => {
    try {
      setSaving(true)
      
      let newLogoUrl = logoUrl // Keep existing logo URL
      
      // Upload new logo if file is selected
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
            useBackgroundImage,
            backgroundImageUrl,
            backgroundColor,
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
        toast.success('Portal settings saved successfully!')
        setHasChanges(false)
        setLogoFile(null)
        setLogoPreview('')
        setLogoUrl(newLogoUrl)
      } else {
        toast.error(result.message || 'Failed to save portal settings')
      }
    } catch (error) {
      console.error('Error saving portal settings:', error)
      toast.error('Failed to save portal settings')
    } finally {
      setSaving(false)
    }
  }

  const copyPortalUrl = () => {
    if (portal?.url) {
      const urlParts = portal.url.split('.')
      const portalUrl = `/${urlParts[0]}/${urlParts[1]}`
      navigator.clipboard.writeText(portalUrl)
      toast.success('Portal URL copied to clipboard!')
    }
  }

  const visibleProjects = projects.filter((project) => projectVisibility[project.id])

  if (loading) {
    return (
      <DashboardLayout title="Portal Settings" subtitle="Loading portal settings...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF] mx-auto mb-4" />
            <p className="text-gray-600">Loading portal settings...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!portal || !client) {
    return (
      <DashboardLayout title="Portal Settings" subtitle="Portal not found">
        <div className="text-center py-12">
          <p className="text-gray-600">Portal not found</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title={`Portal Settings for ${client.firstName} ${client.lastName}`}
      subtitle="Customize your client's portal experience"
    >
      <div className="space-y-8 pb-20">
        {/* Header */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium text-xl">
                    {client.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {client.firstName} {client.lastName}
                  </h2>
                  <p className="text-gray-600">{client.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Portal URL:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {portal.url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyPortalUrl}
                      className="text-[#3C3CFF] hover:bg-[#F0F2FF]"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={copyPortalUrl}
                  className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const urlParts = portal.url.split('.')
                    const portalUrl = `/${urlParts[0]}/${urlParts[1]}?preview=true`
                    window.open(portalUrl, "_blank")
                  }}
                  className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF]"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview as Client
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Show/Hide Modules */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-[#F0F2FF] rounded-lg">
                <Timeline className="h-5 w-5 text-[#3C3CFF]" />
              </div>
              Show/Hide Modules
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {modules.map((module) => {
                const IconComponent = module.icon
                return (
                  <Card
                    key={module.id}
                    className={`border-2 transition-all duration-200 ${
                      moduleStates[module.id]
                        ? "border-[#3C3CFF] bg-[#F0F2FF]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-lg ${moduleStates[module.id] ? "bg-[#3C3CFF]" : "bg-gray-100"}`}>
                            <IconComponent
                              className={`h-4 w-4 ${moduleStates[module.id] ? "text-white" : "text-gray-600"}`}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium text-gray-900">{module.name}</h3>
                              {module.beta && (
                                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                                  Beta
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={moduleStates[module.id]}
                          onCheckedChange={() => handleModuleToggle(module.id)}
                          className="data-[state=checked]:bg-[#3C3CFF]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Project Visibility */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-[#F0F2FF] rounded-lg">
                <FolderOpen className="h-5 w-5 text-[#3C3CFF]" />
              </div>
              Project Visibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-medium">Select projects to show in portal:</Label>
              <div className="space-y-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`project-${project.id}`}
                      checked={projectVisibility[project.id] || false}
                      onChange={() => handleProjectVisibilityToggle(project.id)}
                      className="h-4 w-4 text-[#3C3CFF] focus:ring-[#3C3CFF] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="flex-1 text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {project.name}
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {project.status}
                    </Badge>
                    {defaultProject === project.id && (
                      <Badge variant="secondary" className="bg-[#F0F2FF] text-[#3C3CFF]">
                        Default
                      </Badge>
                    )}
                  </div>
                ))}
                {projects.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No projects found for this client</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base font-medium">Default project (loads first):</Label>
              <div className="space-y-2">
                {visibleProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      id={`default-${project.id}`}
                      name="defaultProject"
                      checked={defaultProject === project.id}
                      onChange={() => handleDefaultProjectChange(project.id)}
                      className="h-4 w-4 text-[#3C3CFF] focus:ring-[#3C3CFF] border-gray-300"
                    />
                    <label
                      htmlFor={`default-${project.id}`}
                      className="text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {project.name}
                    </label>
                  </div>
                ))}
                {visibleProjects.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No visible projects selected</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-[#F0F2FF] rounded-lg">
                <Palette className="h-5 w-5 text-[#3C3CFF]" />
              </div>
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Company/Client Logo</Label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={handleLogoDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                {logoPreview || logoUrl ? (
                  <div className="space-y-3">
                    <img 
                      src={logoPreview || getPortalLogoUrl(logoUrl)} 
                      alt="Logo preview" 
                      className="h-16 mx-auto object-contain"
                    />
                    <p className="text-sm text-gray-600">Click to change logo</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your logo here, or{" "}
                      <span className="text-[#3C3CFF] hover:underline">browse files</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB. Recommended: 200x60px</p>
                  </>
                )}
              </div>
            </div>

            {/* Brand Color */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Primary Brand Color</Label>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {brandColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        brandColor === color ? "border-gray-900 scale-110" : "border-gray-300 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="customColor" className="text-sm">
                    Custom:
                  </Label>
                  <Input
                    id="customColor"
                    type="color"
                    value={customColor || brandColor}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-16 h-10 p-1 border-gray-300"
                  />
                  <span className="text-sm text-gray-600 font-mono">{brandColor}</span>
                </div>
              </div>
            </div>

            {/* Background Settings */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Header Background</Label>
              <div className="space-y-4">
                {/* Background Type Toggle */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useBackgroundImage"
                      checked={useBackgroundImage}
                      onCheckedChange={async (checked) => {
                        setUseBackgroundImage(checked)
                        if (checked && backgroundImageUrl) {
                          await saveBackgroundSettings(backgroundImageUrl)
                        } else {
                          await saveBackgroundSettings('')
                        }
                      }}
                    />
                    <Label htmlFor="useBackgroundImage" className="text-sm">
                      Use Background Image
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useSolidColor"
                      checked={!useBackgroundImage}
                      onCheckedChange={async (checked) => {
                        setUseBackgroundImage(!checked)
                        if (!checked) {
                          await saveBackgroundSettings('')
                        }
                      }}
                    />
                    <Label htmlFor="useSolidColor" className="text-sm">
                      Use Solid Color
                    </Label>
                  </div>
                </div>

                {/* Background Image Upload */}
                {useBackgroundImage && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Background Image</Label>
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#3C3CFF] transition-colors"
                      onClick={() => document.getElementById('backgroundImageInput')?.click()}
                    >
                      <input
                        id="backgroundImageInput"
                        type="file"
                        accept="image/*"
                        onChange={handleBackgroundImageChange}
                        className="hidden"
                      />
                      {(backgroundImagePreview || backgroundImageUrl) ? (
                        <div className="space-y-2">
                          <img
                            src={backgroundImagePreview || backgroundImageUrl}
                            alt="Background preview"
                            className="h-24 w-full object-cover rounded-lg mx-auto"
                          />
                          <p className="text-sm text-gray-600">Click to change background image</p>
                        </div>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">
                            Drag and drop your background image here, or{" "}
                            <span className="text-[#3C3CFF] hover:underline">browse files</span>
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB. Recommended: 1200x400px</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Solid Color Selection */}
                {!useBackgroundImage && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Background Color</Label>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-3">
                        {backgroundColors.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleBackgroundColorChange(color)}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              backgroundColor === color ? "border-gray-900 scale-110" : "border-gray-300 hover:scale-105"
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <Label htmlFor="customBackgroundColor" className="text-sm">
                          Custom:
                        </Label>
                        <Input
                          id="customBackgroundColor"
                          type="color"
                          value={customBackgroundColor || backgroundColor}
                          onChange={(e) => handleCustomBackgroundColorChange(e.target.value)}
                          className="w-16 h-10 p-1 border-gray-300"
                        />
                        <span className="text-sm text-gray-600 font-mono">{backgroundColor}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-3">
              <Label htmlFor="welcomeMessage" className="text-base font-medium">
                Welcome Message (Optional)
              </Label>
              <Textarea
                id="welcomeMessage"
                value={welcomeMessage}
                onChange={(e) => {
                  setWelcomeMessage(e.target.value)
                  setHasChanges(true)
                }}
                placeholder="Enter a personalized welcome message for your client..."
                className="min-h-[100px] border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
              />
              <p className="text-xs text-gray-500">This message will appear at the top of the client portal</p>
            </div>
          </CardContent>
        </Card>

        {/* Access Control */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 bg-[#F0F2FF] rounded-lg">
                <Shield className="h-5 w-5 text-[#3C3CFF]" />
              </div>
              Access Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Portal Members */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Portal Members</Label>
                <p className="text-sm text-gray-600">Users who have access to this portal</p>
              </div>

              {allowlistMembers.length > 0 ? (
                <div className="space-y-3">
                  {allowlistMembers.map((member: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-sm font-medium">
                          {member.name ? member.name.split(' ').map((n: string) => n[0]).join('') : member.email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {member.name || 'No name provided'}
                        </div>
                        <div className="text-xs text-gray-500">{member.email}</div>
                        {member.role && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {member.role}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No members have been invited yet</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Invite New Members */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Invite New Members</Label>
                <p className="text-sm text-gray-600">Send portal access invitations via email</p>
              </div>

              <div className="space-y-3">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="flex-1 text-sm text-blue-900">{email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveEmail(email)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  onKeyPress={(e) => e.key === "Enter" && handleAddEmail()}
                />
                <Button 
                  onClick={handleAddEmail} 
                  disabled={!newEmail} 
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>

              {inviteEmails.length > 0 && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSendInvites}
                    disabled={sendingInvites}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {sendingInvites ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitations
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sticky Save Button */}
      {hasChanges && (
        <>
          {/* Desktop */}
          <div className="hidden md:block fixed bottom-6 right-6 z-50">
            <Button
              onClick={handleSaveChanges}
              size="lg"
              disabled={saving}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white shadow-lg"
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

          {/* Mobile */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
            <Button 
              onClick={handleSaveChanges} 
              size="lg" 
              disabled={saving}
              className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
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
        </>
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
    </DashboardLayout>
  )
}
