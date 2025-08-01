"use client"

import { useState } from "react"
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
} from "lucide-react"
import { useParams } from "next/navigation"

// Mock client data
const mockClient = {
  id: 1,
  firstName: "Sarah",
  lastName: "Johnson",
  email: "sarah@acmecorp.com",
  company: "Acme Corp",
  avatar: "SJ",
  portalUrl: "acme-co",
}

// Mock projects data
const mockProjects = [
  { id: 1, name: "Website Redesign", isVisible: true, isDefault: true },
  { id: 2, name: "Mobile App Development", isVisible: true, isDefault: false },
  { id: 3, name: "Brand Identity", isVisible: false, isDefault: false },
  { id: 4, name: "Marketing Campaign", isVisible: true, isDefault: false },
]

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
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "Intelligent support and automation",
    icon: Bot,
    enabled: false,
    beta: true,
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

export default function PortalSettingsPage() {
  const params = useParams()
  const clientId = params.id

  const [moduleStates, setModuleStates] = useState(
    modules.reduce((acc, module) => ({ ...acc, [module.id]: module.enabled }), {}),
  )
  const [projectVisibility, setProjectVisibility] = useState(
    mockProjects.reduce((acc, project) => ({ ...acc, [project.id]: project.isVisible }), {}),
  )
  const [defaultProject, setDefaultProject] = useState(mockProjects.find((p) => p.isDefault)?.id || null)
  const [brandColor, setBrandColor] = useState("#3C3CFF")
  const [customColor, setCustomColor] = useState("")
  const [welcomeMessage, setWelcomeMessage] = useState(
    "Welcome to your client portal! Here you can track project progress, access files, and communicate with our team.",
  )
  const [passwordProtected, setPasswordProtected] = useState(false)
  const [portalPassword, setPortalPassword] = useState("")
  const [inviteEmails, setInviteEmails] = useState(["sarah@acmecorp.com"])
  const [newEmail, setNewEmail] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const handleModuleToggle = (moduleId: string) => {
    setModuleStates((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
    setHasChanges(true)
  }

  const handleProjectVisibilityToggle = (projectId: number) => {
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

  const handleDefaultProjectChange = (projectId: number) => {
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

  const handleSaveChanges = () => {
    // Handle saving changes
    console.log("Saving portal settings...")
    setHasChanges(false)
  }

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(`https://clientportalhq.com/portal/${mockClient.portalUrl}`)
  }

  const visibleProjects = mockProjects.filter((project) => projectVisibility[project.id])

  return (
    <DashboardLayout
      title={`Portal Settings for ${mockClient.firstName} ${mockClient.lastName}`}
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
                    {mockClient.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {mockClient.firstName} {mockClient.lastName}
                  </h2>
                  <p className="text-gray-600">{mockClient.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500">Portal URL:</span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      clientportalhq.com/portal/{mockClient.portalUrl}
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
                  onClick={() => window.open(`/portal/${mockClient.portalUrl}`, "_blank")}
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
                {mockProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      id={`project-${project.id}`}
                      checked={projectVisibility[project.id]}
                      onChange={() => handleProjectVisibilityToggle(project.id)}
                      className="h-4 w-4 text-[#3C3CFF] focus:ring-[#3C3CFF] border-gray-300 rounded"
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="flex-1 text-sm font-medium text-gray-900 cursor-pointer"
                    >
                      {project.name}
                    </label>
                    {defaultProject === project.id && (
                      <Badge variant="secondary" className="bg-[#F0F2FF] text-[#3C3CFF]">
                        Default
                      </Badge>
                    )}
                  </div>
                ))}
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop your logo here, or{" "}
                  <button className="text-[#3C3CFF] hover:underline">browse files</button>
                </p>
                <p className="text-xs text-gray-500">PNG, JPG up to 2MB. Recommended: 200x60px</p>
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
            {/* Password Protection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Password Protection</Label>
                  <p className="text-sm text-gray-600">Require a password to access the portal</p>
                </div>
                <Switch
                  checked={passwordProtected}
                  onCheckedChange={(checked) => {
                    setPasswordProtected(checked)
                    setHasChanges(true)
                  }}
                  className="data-[state=checked]:bg-[#3C3CFF]"
                />
              </div>
              {passwordProtected && (
                <div className="space-y-2">
                  <Label htmlFor="portalPassword">Portal Password</Label>
                  <Input
                    id="portalPassword"
                    type="password"
                    value={portalPassword}
                    onChange={(e) => {
                      setPortalPassword(e.target.value)
                      setHasChanges(true)
                    }}
                    placeholder="Enter portal password"
                    className="border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Email Invitations */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">Invite Client Users</Label>
                <p className="text-sm text-gray-600">Send portal access invitations via email</p>
              </div>

              <div className="space-y-3">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="flex-1 text-sm">{email}</span>
                    {index > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(email)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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
                <Button onClick={handleAddEmail} disabled={!newEmail} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
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
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white shadow-lg"
            >
              Save Changes
            </Button>
          </div>

          {/* Mobile */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50">
            <Button onClick={handleSaveChanges} size="lg" className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
              Save Changes
            </Button>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
