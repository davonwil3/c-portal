"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  ChevronRight,
  Upload,
  Eye,
  Save,
  ArrowLeft,
  Palette,
  Globe,
  Package,
  FileText,
  MessageCircle,
  CreditCard,
  Calendar,
  Bot,
  Clock,
  Mail,
  Lock,
  Lightbulb,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock data
const clients = [
  { id: 1, name: "Acme Corp", avatar: "AC", recentProject: "Website Redesign" },
  { id: 2, name: "TechStart Inc", avatar: "TI", recentProject: "Brand Identity" },
  { id: 3, name: "Design Co", avatar: "DC", recentProject: null },
  { id: 4, name: "Marketing Plus", avatar: "MP", recentProject: "Q2 Campaign" },
]

const projects = [
  { id: 1, name: "Website Redesign", clientId: 1 },
  { id: 2, name: "Brand Identity", clientId: 2 },
  { id: 3, name: "Q2 Campaign", clientId: 4 },
  { id: 4, name: "Mobile App Design", clientId: 1 },
]

const brandColors = ["#3C3CFF", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8"]

export default function NewPortalPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft",
    clientId: "",
    projectId: "",
    brandColor: "#3C3CFF",
    welcomeText: "",
    modules: {
      timeline: false,
      files: true,
      forms: false,
      invoices: false,
      messages: true,
      ai: false,
    },
    accessType: "invite",
    inviteEmails: "",
    passwordProtected: false,
    password: "",
    hasExpiry: false,
    expiryDays: 30,
  })

  const selectedClient = clients.find((c) => c.id.toString() === formData.clientId)
  const availableProjects = projects.filter((p) => p.clientId.toString() === formData.clientId)

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleModuleToggle = (module: string, enabled: boolean) => {
    setFormData((prev) => ({
      ...prev,
      modules: { ...prev.modules, [module]: enabled },
    }))
  }

  const handleSave = (status: "draft" | "live") => {
    const portalData = { ...formData, status }
    console.log("Saving portal:", portalData)
    // Handle save logic
    router.push("/dashboard/portals")
  }

  const handlePreview = () => {
    console.log("Opening preview...")
    // Handle preview logic
  }

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "timeline":
        return <Calendar className="h-4 w-4" />
      case "files":
        return <FileText className="h-4 w-4" />
      case "forms":
        return <FileText className="h-4 w-4" />
      case "invoices":
        return <CreditCard className="h-4 w-4" />
      case "messages":
        return <MessageCircle className="h-4 w-4" />
      case "ai":
        return <Bot className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#F7F9FB]">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-[#3C3CFF] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/portals" className="hover:text-[#3C3CFF] transition-colors">
            Portals
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">Create New Portal</span>
        </nav>
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Portal</h1>
                <p className="text-gray-600">Set up a branded portal for your client</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview as Client
              </Button>
              <Button variant="outline" onClick={() => handleSave("draft")}>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={() => handleSave("live")} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                <Globe className="h-4 w-4 mr-2" />
                Go Live
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Section 1: Portal Info */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                1
              </div>
              <span>Portal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="portalName">Portal Name *</Label>
                <Input
                  id="portalName"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Acme Corp Portal"
                  className="h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                />
              </div>
              <div className="space-y-2">
                <Label>Portal Status</Label>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={formData.status === "live"}
                    onCheckedChange={(checked) => handleInputChange("status", checked ? "live" : "draft")}
                  />
                  <Badge
                    variant="outline"
                    className={formData.status === "live" ? getStatusColor("live") : getStatusColor("draft")}
                  >
                    {formData.status === "live" ? (
                      <>
                        <Globe className="h-3 w-3 mr-1" />
                        Live
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 mr-1" />
                        Draft
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Brief description of this portal's purpose"
                rows={3}
                className="border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Link to Client & Project */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <span>Link to Client & Project</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Assign to Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => handleInputChange("clientId", value)}>
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                              {client.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <span>{client.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Link to Project (Optional)</Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => handleInputChange("projectId", value)}
                  disabled={!formData.clientId}
                >
                  <SelectTrigger className="h-10 border-gray-200">
                    <SelectValue placeholder={formData.clientId ? "Select a project" : "Select client first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <span>{project.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedClient?.recentProject && !formData.projectId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      <strong>Smart suggestion:</strong> You recently worked with {selectedClient.name} on "
                      {selectedClient.recentProject}". Would you like to link this portal to that project?
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-blue-700 border-blue-300 hover:bg-blue-100 bg-transparent"
                      onClick={() => {
                        const project = projects.find((p) => p.name === selectedClient.recentProject)
                        if (project) handleInputChange("projectId", project.id.toString())
                      }}
                    >
                      Link to {selectedClient.recentProject}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Appearance */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                3
              </div>
              <span>Appearance</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Upload Logo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Welcome Text (Optional)</Label>
                  <Textarea
                    value={formData.welcomeText}
                    onChange={(e) => handleInputChange("welcomeText", e.target.value)}
                    placeholder="Welcome message for your client"
                    rows={3}
                    className="border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {brandColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleInputChange("brandColor", color)}
                        className={`w-12 h-12 rounded-xl border-2 transition-all ${
                          formData.brandColor === color
                            ? "border-gray-400 scale-110"
                            : "border-gray-200 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Palette className="h-4 w-4 text-gray-400" />
                    <Input
                      type="color"
                      value={formData.brandColor}
                      onChange={(e) => handleInputChange("brandColor", e.target.value)}
                      className="w-16 h-8 p-0 border-0"
                    />
                    <span className="text-sm text-gray-600 font-mono">{formData.brandColor}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Modules */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                4
              </div>
              <span>Modules to Include</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries({
                timeline: "Project Timeline",
                files: "Files",
                forms: "Forms",
                invoices: "Invoices",
                messages: "Messages",
                ai: "AI Assistant",
              }).map(([key, label]) => (
                <div
                  key={key}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    formData.modules[key as keyof typeof formData.modules]
                      ? "border-[#3C3CFF] bg-[#F0F2FF]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleModuleToggle(key, !formData.modules[key as keyof typeof formData.modules])}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getModuleIcon(key)}
                      <span className="font-medium text-gray-900">{label}</span>
                      {key === "ai" && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          Beta
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={formData.modules[key as keyof typeof formData.modules]}
                      onCheckedChange={(checked) => handleModuleToggle(key, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Access Settings */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                5
              </div>
              <span>Access Settings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Access Type</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.accessType === "public" ? "border-[#3C3CFF] bg-[#F0F2FF]" : "border-gray-200"
                    }`}
                    onClick={() => handleInputChange("accessType", "public")}
                  >
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Public</p>
                        <p className="text-sm text-gray-600">Anyone with the link can access</p>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.accessType === "invite" ? "border-[#3C3CFF] bg-[#F0F2FF]" : "border-gray-200"
                    }`}
                    onClick={() => handleInputChange("accessType", "invite")}
                  >
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">Invite Only</p>
                        <p className="text-sm text-gray-600">Only invited users can access</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {formData.accessType === "invite" && (
                <div className="space-y-2">
                  <Label htmlFor="inviteEmails">Invite Email Addresses</Label>
                  <Textarea
                    id="inviteEmails"
                    value={formData.inviteEmails}
                    onChange={(e) => handleInputChange("inviteEmails", e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    rows={3}
                    className="border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Password Protection</p>
                      <p className="text-sm text-gray-600">Require a password to access the portal</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.passwordProtected}
                    onCheckedChange={(checked) => handleInputChange("passwordProtected", checked)}
                  />
                </div>

                {formData.passwordProtected && (
                  <div className="space-y-2 ml-8">
                    <Label htmlFor="password">Portal Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      placeholder="Enter portal password"
                      className="h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Portal Expiry</p>
                      <p className="text-sm text-gray-600">Automatically disable portal after a set time</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.hasExpiry}
                    onCheckedChange={(checked) => handleInputChange("hasExpiry", checked)}
                  />
                </div>

                {formData.hasExpiry && (
                  <div className="space-y-2 ml-8">
                    <Label htmlFor="expiryDays">Expires in (days)</Label>
                    <Input
                      id="expiryDays"
                      type="number"
                      value={formData.expiryDays}
                      onChange={(e) => handleInputChange("expiryDays", Number.parseInt(e.target.value))}
                      min="1"
                      max="365"
                      className="h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] w-32"
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Sticky Actions */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3">
          <Button onClick={() => handleSave("live")} className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            <Globe className="h-4 w-4 mr-2" />
            Go Live
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleSave("draft")} className="flex-1">
              Save Draft
            </Button>
            <Button variant="outline" onClick={handlePreview} className="flex-1 bg-transparent">
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "live":
      return "bg-green-100 text-green-700 border-green-200"
    case "draft":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}
