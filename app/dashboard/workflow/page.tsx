"use client"

export const dynamic = 'force-dynamic'

import React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DashboardLayout } from "@/components/dashboard/layout"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'
import AddMembersModal from "@/components/AddMembersModal"
import ViewMembersModal from "@/components/ViewMembersModal"
import { 
  Users, 
  Package, 
  Globe, 
  Plus, 
  ChevronRight,
  CheckCircle,
  Circle,
  ArrowRight,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Star,
  TrendingUp,
  Eye,
  Edit,
  Archive,
  ExternalLink,
  Upload,
  Phone,
  Mail,
  Building2,
  Tag,
  Clock,
  XCircle,
  Trash2,
  Loader2,
  CalendarDays,
  MessageCircle,
  CreditCard,
  Link2,
  Copy,
  Settings,
  BarChart3,
  AlertCircle
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { 
  getClients, 
  createClient as createClientFunc, 
  updateClient, 
  deleteClient, 
  archiveClient,
  restoreClient,
  getClientTags,
  getAccountTags,
  standardTags,
  getTagColor,
  getClientActivities,
  getClientInvoices,
  getClientProjects,
  getClientFiles,
  type Client 
} from "@/lib/clients"
import { getInvoicesByClient } from "@/lib/invoices"
import { getProjectsByClient } from "@/lib/projects"
import { getFiles } from "@/lib/files"
import { 
  getProjects, 
  createProject, 
  deleteProject, 
  archiveProject, 
  restoreProject,
  updateProject,
  getProjectTags,
  getAccountProjectTags,
  getClientsForProjects,
  standardProjectTags,
  getProjectTagColor,
  type Project,
  type ProjectTag
} from "@/lib/projects"

// Step configuration
const workflowSteps = [
  {
    id: "clients",
    title: "Clients",
    description: "Manage your client relationships",
    icon: Users,
    stepNumber: 1,
    href: "/dashboard/clients"
  },
  {
    id: "projects", 
    title: "Projects",
    description: "Organize client work and deliverables",
    icon: Package,
    stepNumber: 2,
    href: "/dashboard/projects"
  },
  {
    id: "portals",
    title: "Portals", 
    description: "Create client-facing portals",
    icon: Globe,
    stepNumber: 3,
    href: "/dashboard/portals"
  }
]

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes: number, decimalPoint = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimalPoint < 0 ? 0 : decimalPoint;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const getActivityIcon = (type: string) => {
  switch (type) {
    case "file":
      return <Upload className="h-4 w-4 text-blue-500" />
    case "payment":
      return <DollarSign className="h-4 w-4 text-green-500" />
    case "message":
      return <MessageCircle className="h-4 w-4 text-purple-500" />
    case "form":
      return <FileText className="h-4 w-4 text-orange-500" />
    case "login":
      return <Eye className="h-4 w-4 text-indigo-500" />
    case "portal_access":
      return <ExternalLink className="h-4 w-4 text-teal-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

const getTagDisplayColor = (tagName: string, clientId?: string, clientTagColors?: Record<string, Record<string, string>>) => {
  // Check if it's a standard tag
  const standardTag = standardTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
  if (standardTag) {
    return standardTag.color
  }
  
  // Check if we have a stored color for this tag from the database
  if (clientId && clientTagColors && clientTagColors[clientId] && clientTagColors[clientId][tagName]) {
    return clientTagColors[clientId][tagName]
  }
  
  // Default color
  return '#6B7280'
}

// Step Navigation Component
function StepNavigation({ activeStep, onStepChange }: { activeStep: string, onStepChange: (step: string) => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-8">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            const isCompleted = workflowSteps.findIndex(s => s.id === activeStep) > index
            
            return (
              <div key={step.id} className="flex items-center space-x-4">
                <button
                  onClick={() => onStepChange(step.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] text-white shadow-lg' 
                      : isCompleted
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive 
                      ? 'bg-white/20' 
                      : isCompleted
                      ? 'bg-green-100'
                      : 'bg-gray-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {step.stepNumber}. {step.title}
                      </span>
                      {isCompleted && !isActive && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {step.description}
                    </p>
                  </div>
                </button>
                
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
        
        <div className="text-right">
          <div className="text-sm font-medium text-gray-600">Progress</div>
          <div className="text-lg font-bold text-[#3C3CFF]">
            {Math.round((workflowSteps.findIndex(s => s.id === activeStep) + 1) / workflowSteps.length * 100)}%
          </div>
        </div>
      </div>
    </div>
  )
}

// Clients Section Component
function ClientsSection({ 
  clients, 
  clientTags, 
  clientTagColors, 
  loading, 
  onAddClient, 
  onEditClient, 
  onDeleteClient, 
  onViewClient,
  onArchiveClient,
  onRestoreClient,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  tagFilter,
  setTagFilter,
  availableTags
}: {
  clients: Client[]
  clientTags: Record<string, string[]>
  clientTagColors: Record<string, Record<string, string>>
  loading: boolean
  onAddClient: () => void
  onEditClient: (client: Client) => void
  onDeleteClient: (client: Client) => void
  onViewClient: (client: Client) => void
  onArchiveClient: (client: Client) => void
  onRestoreClient: (client: Client) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  tagFilter: string
  setTagFilter: (filter: string) => void
  availableTags: string[]
}) {
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    
    const clientTagsList = clientTags[client.id] || []
    const matchesTag = tagFilter === "all" || clientTagsList.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesTag
  })

  const getTagFilterColor = (tagName: string) => {
    // First check if it's a standard tag
    const standardTag = standardTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Check if we have any stored colors for this tag across all clients
    const colors: string[] = []
    Object.values(clientTagColors).forEach(clientColors => {
      if (clientColors[tagName]) {
        colors.push(clientColors[tagName])
      }
    })
    
    // Return the most common color, or the first one found
    if (colors.length > 0) {
      // Count occurrences of each color
      const colorCounts = colors.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Find the most common color
      const mostCommonColor = Object.entries(colorCounts).reduce((a, b) => 
        colorCounts[a[0]] > colorCounts[b[0]] ? a : b
      )[0]
      
      return mostCommonColor
    }
    
    // Default color
    return '#6B7280'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-600 mt-1">Manage your client relationships and information</p>
        </div>
        <Button 
          onClick={onAddClient}
          className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-[180px]">
              <Tag className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getTagFilterColor(tag) }}
                    />
                    {tag}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{clients.length}</div>
                <div className="text-sm text-blue-700">Total Clients</div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{clients.filter(c => c.status === 'active').length}</div>
                <div className="text-sm text-green-700">Active</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">{clients.filter(c => c.status === 'pending').length}</div>
                <div className="text-sm text-orange-700">Pending</div>
              </div>
              <Circle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(clients.reduce((sum, c) => sum + (c.unpaid_amount || 0), 0))}</div>
                <div className="text-sm text-purple-700">Unpaid Amount</div>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">All Clients</CardTitle>
            <div className="text-sm text-gray-600">
              {loading ? (
                <span>Loading clients...</span>
              ) : (
                `${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""} found`
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
              <span className="ml-2 text-gray-600">Loading clients...</span>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                onClick={() => onViewClient(client)}
              >
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] text-white font-semibold">
                      {client.avatar_initials || `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{client.company || "No company"}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{client.project_count || 0}</div>
                    <div className="text-xs text-gray-500">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-semibold text-gray-900">{client.total_invoices || 0}</div>
                    <div className="text-xs text-gray-500">Invoices</div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(clientTags[client.id] || []).map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-xs"
                        style={{ 
                          backgroundColor: `${getTagDisplayColor(tag, client.id, clientTagColors)}20`,
                          borderColor: getTagDisplayColor(tag, client.id, clientTagColors),
                          color: getTagDisplayColor(tag, client.id, clientTagColors)
                        }}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Badge
                    variant={client.status === "active" ? "default" : "secondary"}
                    className={
                      client.status === "active"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : client.status === "archived"
                        ? "bg-gray-100 text-gray-700 hover:bg-gray-100"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                    }
                  >
                    {client.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onViewClient(client)
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onEditClient(client)
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                      </DropdownMenuItem>
                      {client.portal_url && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          window.open(client.portal_url ?? undefined, '_blank')
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Portal
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        if (client.status === 'archived') {
                          onRestoreClient(client)
                        } else {
                          onArchiveClient(client)
                        }
                      }}>
                        {client.status === 'archived' ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Make Active
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onDeleteClient(client)
                      }} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Projects Section Component
function ProjectsSection({ 
  projects, 
  clients, 
  projectTags, 
  projectTagColors, 
  availableTags,
  loading, 
  onAddProject, 
  onEditProject, 
  onDeleteProject, 
  onViewProject,
  onArchiveProject,
  onRestoreProject,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  clientFilter,
  setClientFilter,
  tagFilter,
  setTagFilter
}: {
  projects: Project[]
  clients: Array<{ id: string; first_name: string; last_name: string; company: string | null }>
  projectTags: Record<string, string[]>
  projectTagColors: Record<string, Record<string, string>>
  availableTags: string[]
  loading: boolean
  onAddProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onViewProject: (project: Project) => void
  onArchiveProject: (project: Project) => void
  onRestoreProject: (project: Project) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  clientFilter: string
  setClientFilter: (filter: string) => void
  tagFilter: string
  setTagFilter: (filter: string) => void
}) {
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    
    // Get client name for filtering
    const client = clients.find(c => c.id === project.client_id)
    const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : ""
    const matchesClient = clientFilter === "all" || clientName.includes(clientFilter.toLowerCase())
    
    return matchesSearch && matchesStatus && matchesClient
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "on-hold":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "archived":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getTagDisplayColor = (tagName: string, projectId: string): string => {
    // First check database colors
    const projectColors = projectTagColors[projectId]
    if (projectColors && projectColors[tagName]) {
      return projectColors[tagName]
    }
    
    // Then check standard tags
    const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Default color
    return '#6B7280'
  }

  const getTagFilterColor = (tagName: string): string => {
    // First check if this tag exists in any project with a saved color
    for (const projectId in projectTagColors) {
      const projectColors = projectTagColors[projectId]
      if (projectColors && projectColors[tagName]) {
        return projectColors[tagName]
      }
    }
    
    // Then check standard tags
    const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Default color
    return '#6B7280'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    // Add one day to fix the timezone offset issue
    date.setDate(date.getDate() + 1)
    return date.toLocaleDateString()
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
          <p className="text-gray-600 mt-1">Organize client work and track project progress</p>
        </div>
        <Button 
          onClick={onAddProject}
          className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white shadow-lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
          />
        </div>
        <div className="flex gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 border-gray-200">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on-hold">On Hold</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[140px] h-10 border-gray-200">
              <Users className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Clients" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={`${client.first_name} ${client.last_name}`}>
                  {client.first_name} {client.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-blue-900">{projects.length}</div>
                <div className="text-sm text-blue-700">Total Projects</div>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-900">{projects.filter(p => p.status === 'completed').length}</div>
                <div className="text-sm text-green-700">Completed</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-900">{projects.filter(p => p.status === 'active').length}</div>
                <div className="text-sm text-orange-700">Active</div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-900">{Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)}%</div>
                <div className="text-sm text-purple-700">Avg Progress</div>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
          <span className="ml-2 text-gray-600">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-12 text-center">
            <div className="text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="mb-4">Get started by creating your first project</p>
              <Button 
                onClick={onAddProject}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const client = clients.find(c => c.id === project.client_id)
            const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'
            const clientInitials = client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'
            const projectTagNames = projectTags[project.id] || []
            
            return (
              <Card
                key={project.id}
                className="bg-white border border-gray-200 shadow-lg hover:shadow-xl hover:border-[#3C3CFF]/30 hover:scale-[1.02] transition-all duration-200 rounded-2xl cursor-pointer group"
                onClick={() => onViewProject(project)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors mb-2">
                        {project.name}
                      </h3>
                      <div className="flex items-center space-x-2 mb-3">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                            {clientInitials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{clientName}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-500 hover:text-gray-800 opacity-60 hover:opacity-100 transition-all duration-200"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onViewProject(project)
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onEditProject(project)
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          toast.info('Portal view coming soon')
                        }}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Portal
                        </DropdownMenuItem>
                        {project.status === "archived" ? (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onRestoreProject(project)
                          }}>
                            <Archive className="h-4 w-4 mr-2" />
                            Make Active
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onArchiveProject(project)
                          }}>
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation()
                            onDeleteProject(project)
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Progress</span>
                        <span className="text-sm font-medium text-gray-900">{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={getStatusColor(project.status)}>
                        {project.status.replace("-", " ")}
                      </Badge>
                    </div>


                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{project.total_messages || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FileText className="h-3 w-3" />
                          <span>{project.total_files || 0}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{project.total_invoices || 0}</span>
                        </div>
                      </div>
                      {project.due_date && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}



function PortalsSection({
  portals,
  loading,
  onViewPortal,
  onEditPortal,
  onArchivePortal,
  onDeletePortal,
  onCreatePortal,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  viewMode,
  setViewMode,
  getStatusConfig,
  getActivityIndicator,
  handlePortalAction
}: {
  portals: Portal[]
  loading: boolean
  onViewPortal: (portal: Portal) => void
  onEditPortal: (portal: Portal) => void
  onArchivePortal: (portal: Portal) => void
  onDeletePortal: (portal: Portal) => void
  onCreatePortal: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  statusFilter: string
  setStatusFilter: (filter: string) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  getStatusConfig: (status: string) => any
  getActivityIndicator: (lastActivity: string) => React.ReactNode
  handlePortalAction: (action: string, portal: Portal, e: React.MouseEvent) => void
}) {
  const statusOptions = [
    { value: "all", label: "All Status", icon: Filter },
    { value: "live", label: "Live", icon: CheckCircle, color: "text-green-600" },
    { value: "draft", label: "Draft", icon: Clock, color: "text-yellow-600" },
    { value: "maintenance", label: "Maintenance", icon: AlertCircle, color: "text-orange-600" },
    { value: "archived", label: "Archived", icon: XCircle, color: "text-gray-600" },
  ]

  const filteredPortals = portals.filter((portal) => {
    const matchesSearch =
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || portal.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* One Portal Per Client Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">i</span>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">One Portal Per Client</h3>
            <p className="text-sm text-blue-700 mt-1">
              Each client can only have one portal. If you need to create a new portal for a client who already has one, 
              you'll need to delete the existing portal first.
            </p>
          </div>
        </div>
      </div>

      {/* Header with Search, Filters, and Actions */}
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by client, portal name, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px] h-10 border-gray-200">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center space-x-2">
                        <option.icon className={`h-4 w-4 ${option.color || "text-gray-600"}`} />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-r-none ${viewMode === "grid" ? "bg-[#3C3CFF] text-white" : "text-gray-600"}`}
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`rounded-l-none ${viewMode === "list" ? "bg-[#3C3CFF] text-white" : "text-gray-600"}`}
                >
                  <div className="flex flex-col gap-1 w-4 h-4">
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                  </div>
                </Button>
              </div>
              <Button onClick={onCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Portal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-white border-0 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="p-3 bg-gray-200 rounded-lg animate-pulse">
                      <div className="w-6 h-6"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Portals</p>
                    <p className="text-2xl font-bold text-gray-900">{portals.length}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Globe className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Live Portals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {portals.filter(p => p.status === "live").length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {portals.reduce((sum, p) => sum + p.views, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Portals</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {portals.filter(p => p.status === "live").length}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Globe className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF] mx-auto mb-4" />
            <p className="text-gray-600">Loading portals...</p>
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map((portal) => (
            <Card
              key={portal.id}
              className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer group"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors mb-2">
                      {portal.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                          {portal.client.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{portal.client.name}</span>
                    </div>
                    {portal.project && (
                      <div className="flex items-center space-x-1 mb-3">
                        <Package className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{portal.project.name}</span>
                        <Badge variant="outline" className="text-xs ml-2">
                          {portal.project.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={(e) => handlePortalAction("view", portal, e)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("analytics", portal, e)}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("edit", portal, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("settings", portal, e)}>
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("add-members", portal, e)}>
                        <Users className="h-4 w-4 mr-2" />
                        Add Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("view-members", portal, e)}>
                        <Users className="h-4 w-4 mr-2" />
                        View Members
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("copy", portal, e)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("archive", portal, e)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {portal.status === 'archived' ? 'Unarchive' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handlePortalAction("delete", portal, e)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status and Activity */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${getStatusConfig(portal.status).color} flex items-center space-x-1`}>
                      {(() => {
                        const IconComponent = getStatusConfig(portal.status).icon
                        return <IconComponent className={`h-3 w-3 ${getStatusConfig(portal.status).iconColor}`} />
                      })()}
                      <span className="capitalize">{portal.status}</span>
                    </Badge>
                  </div>

                  {/* Portal Info */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Portal URL</span>
                      <span className="text-[#3C3CFF] font-mono text-xs">
                        {(() => {
                          const urlParts = portal.url.split('.')
                          if (urlParts.length >= 3) {
                            return `/${urlParts[0]}/${urlParts[1]}`
                          } else {
                            return `/${urlParts[0]}/${portal.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                          }
                        })()}
                      </span>
                    </div>

                  </div>

                  {/* Views */}
                  {portal.status === "live" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Views</span>
                        <span className="text-gray-900 font-medium">{portal.views.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Modules */}
                  <div className="space-y-2">
                    <span className="text-xs text-gray-600">Modules ({portal.modules.length})</span>
                    <div className="flex flex-wrap gap-1">
                      {portal.modules.slice(0, 3).map((module) => (
                        <Badge
                          key={module}
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 capitalize"
                        >
                          {module}
                        </Badge>
                      ))}
                      {portal.modules.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                          +{portal.modules.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handlePortalAction("view", portal, e)}
                      className="flex-1 text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF]"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handlePortalAction("copy", portal, e)}
                      className="flex-1 text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF]"
                    >
                      <Link2 className="h-4 w-4 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {filteredPortals.map((portal) => (
            <Card
              key={portal.id}
              className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer group"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium">
                        {portal.client.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                        {portal.name}
                      </h3>
                      <p className="text-sm text-gray-600">{portal.client.name}</p>
                      {portal.project && (
                        <p className="text-xs text-gray-500">{portal.project.name}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{portal.views.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{portal.modules.length}</p>
                      <p className="text-xs text-gray-500">Modules</p>
                    </div>
                    <Badge variant="outline" className={`${getStatusConfig(portal.status).color} flex items-center space-x-1`}>
                      {(() => {
                        const IconComponent = getStatusConfig(portal.status).icon
                        return <IconComponent className={`h-3 w-3 ${getStatusConfig(portal.status).iconColor}`} />
                      })()}
                      <span className="capitalize">{portal.status}</span>
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm text-gray-900 font-mono">
                        {(() => {
                          const urlParts = portal.url.split('.')
                          if (urlParts.length >= 3) {
                            return `/${urlParts[0]}/${urlParts[1]}`
                          } else {
                            return `/${urlParts[0]}/${portal.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
                          }
                        })()}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => handlePortalAction("view", portal, e)}>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Portal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("analytics", portal, e)}>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("edit", portal, e)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Portal
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("settings", portal, e)}>
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("add-members", portal, e)}>
                          <Users className="h-4 w-4 mr-2" />
                          Add Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("view-members", portal, e)}>
                          <Users className="h-4 w-4 mr-2" />
                          View Members
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("copy", portal, e)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePortalAction("archive", portal, e)}>
                          <Archive className="h-4 w-4 mr-2" />
                          {portal.status === 'archived' ? 'Unarchive' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handlePortalAction("delete", portal, e)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPortals.length === 0 && (
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-12 text-center">
            <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No portals found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first client portal to get started"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button onClick={onCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Portal
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Portal interface
interface Portal {
  id: string
  name: string
  client: {
    id: string
    name: string
    avatar: string
  }
  project?: {
    name: string
    status: string
  }
  status: "live" | "draft" | "archived" | "maintenance"
  url: string
  views: number
  lastActivity: string
  description: string
  modules: string[]
}

// Main Component
export default function ClientWorkflowPage() {
  const [activeStep, setActiveStep] = useState("clients")
  
  // Client state
  const [clients, setClients] = useState<Client[]>([])
  const [clientTags, setClientTags] = useState<Record<string, string[]>>({})
  const [clientTagColors, setClientTagColors] = useState<Record<string, Record<string, string>>>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Client filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  
  // Client modals
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  
  // Client form data
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    portalUrl: "",
    tags: [] as Array<{ name: string; color?: string }>,
  })
  
  const [editClient, setEditClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    portalUrl: "",
    tags: [] as Array<{ name: string; color?: string }>,
  })
  
  // Client tag state
  const [addNewTag, setAddNewTag] = useState("")
  const [addNewTagColor, setAddNewTagColor] = useState("#6B7280")
  const [editNewTag, setEditNewTag] = useState("")
  const [editNewTagColor, setEditNewTagColor] = useState("#6B7280")
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>({})
  
  // Additional client data state
  const [clientActivities, setClientActivities] = useState<Record<string, any[]>>({})
  const [clientInvoices, setClientInvoices] = useState<Record<string, any[]>>({})
  const [clientProjects, setClientProjects] = useState<Record<string, any[]>>({})
  const [clientFiles, setClientFiles] = useState<Record<string, any[]>>({})
  const [loadingClientData, setLoadingClientData] = useState<Record<string, boolean>>({})

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [projectClients, setProjectClients] = useState<Array<{ id: string; first_name: string; last_name: string; company: string | null }>>([])
  const [projectTags, setProjectTags] = useState<Record<string, string[]>>({})
  const [projectTagColors, setProjectTagColors] = useState<Record<string, Record<string, string>>>({})
  const [availableProjectTags, setAvailableProjectTags] = useState<string[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsSaving, setProjectsSaving] = useState(false)
  const [projectsDeleting, setProjectsDeleting] = useState(false)
  
  // Project filters
  const [projectSearchQuery, setProjectSearchQuery] = useState("")
  const [projectStatusFilter, setProjectStatusFilter] = useState("all")
  const [projectClientFilter, setProjectClientFilter] = useState("all")
  const [projectTagFilter, setProjectTagFilter] = useState("all")
  
  // Project modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  
  // Project form data
  const [newProject, setNewProject] = useState({
    name: "",
    client_id: "",
    due_date: "",
    description: "",
    status: "draft" as 'draft' | 'active' | 'on-hold' | 'completed' | 'archived',
    tags: [] as Array<{ name: string; color?: string }>,
  })
  
  const [editProject, setEditProject] = useState({
    name: "",
    client_id: "",
    due_date: "",
    description: "",
    status: "draft" as 'draft' | 'active' | 'on-hold' | 'completed' | 'archived',
    tags: [] as Array<{ name: string; color?: string }>,
  })
  
  const [addNewProjectTag, setAddNewProjectTag] = useState("")
  const [addNewProjectTagColor, setAddNewProjectTagColor] = useState("#6B7280")
  const [editNewProjectTag, setEditNewProjectTag] = useState("")
  const [editNewProjectTagColor, setEditNewProjectTagColor] = useState("#6B7280")
  const [customProjectTagColors, setCustomProjectTagColors] = useState<Record<string, string>>({})
  
  // Portal state
  const [portals, setPortals] = useState<Portal[]>([])
  const [portalsLoading, setPortalsLoading] = useState(true)
  const [portalSearchQuery, setPortalSearchQuery] = useState("")
  const [portalStatusFilter, setPortalStatusFilter] = useState("all")
  const [portalViewMode, setPortalViewMode] = useState<"grid" | "list">("grid")
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [selectedPortalForMembers, setSelectedPortalForMembers] = useState<Portal | null>(null)
  const [showViewMembersModal, setShowViewMembersModal] = useState(false)
  const [selectedPortalForView, setSelectedPortalForView] = useState<Portal | null>(null)
  
  const router = useRouter()

  // Load clients on component mount
  useEffect(() => {
    loadClients()
  }, [])

  // Load projects when projects step is active
  useEffect(() => {
    if (activeStep === "projects") {
      loadProjects()
    }
  }, [activeStep])

  // Load portals when portals step is active
  useEffect(() => {
    if (activeStep === "portals") {
      loadPortals()
    }
  }, [activeStep])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      const clientsData = await getClients()
      setClients(clientsData)
      
      // Load tags for each client
      const tagsData: Record<string, string[]> = {}
      const tagColorsData: Record<string, Record<string, string>> = {}
      for (const client of clientsData) {
        try {
          const tags = await getClientTags(client.id)
          tagsData[client.id] = tags.map(tag => tag.tag_name)
          tagColorsData[client.id] = tags.reduce((acc, tag) => {
            acc[tag.tag_name] = tag.color
            return acc
          }, {} as Record<string, string>)
        } catch (error) {
          console.error(`Error loading tags for client ${client.id}:`, error)
          tagsData[client.id] = []
          tagColorsData[client.id] = {}
        }
      }
      setClientTags(tagsData)
      setClientTagColors(tagColorsData)
      
      // Load available tags for filtering
      const accountTags = await getAccountTags()
      setAvailableTags(accountTags)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId: string) => {
    if (loadingClientData[clientId]) return // Prevent duplicate loading
    
    try {
      setLoadingClientData(prev => ({ ...prev, [clientId]: true }))
      
      const [activities, invoices, projects, files] = await Promise.all([
        getClientActivities(clientId),
        getInvoicesByClient(clientId),
        getProjectsByClient(clientId),
        getFiles().then(allFiles => allFiles.filter(file => file.client_id === clientId))
      ])
      
      setClientActivities(prev => ({ ...prev, [clientId]: activities || [] }))
      setClientInvoices(prev => ({ ...prev, [clientId]: invoices || [] }))
      setClientProjects(prev => ({ ...prev, [clientId]: projects || [] }))
      setClientFiles(prev => ({ ...prev, [clientId]: files || [] }))
      
    } catch (error) {
      console.error(`Error loading data for client ${clientId}:`, error)
      toast.error('Failed to load client data')
      
      // Set empty arrays on error to prevent undefined states
      setClientActivities(prev => ({ ...prev, [clientId]: [] }))
      setClientInvoices(prev => ({ ...prev, [clientId]: [] }))
      setClientProjects(prev => ({ ...prev, [clientId]: [] }))
      setClientFiles(prev => ({ ...prev, [clientId]: [] }))
    } finally {
      setLoadingClientData(prev => ({ ...prev, [clientId]: false }))
    }
  }

  const handleAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const createdClient = await createClientFunc({
        first_name: newClient.firstName,
        last_name: newClient.lastName,
        email: newClient.email,
        company: newClient.company || undefined,
        phone: newClient.phone || undefined,
        portal_url: newClient.portalUrl || undefined,
        tags: newClient.tags,
      })

      if (createdClient) {
        toast.success('Client created successfully')
        setIsAddClientOpen(false)
        
        // Add the new client to local state instead of reloading
        setClients(prevClients => [createdClient, ...prevClients])
        
        // Add client tags to local state
        const newClientTags = newClient.tags.map(tag => tag.name)
        setClientTags(prev => ({
          ...prev,
          [createdClient.id]: newClientTags
        }))
        
        // Add client tag colors to local state
        const newClientTagColors: Record<string, string> = {}
        newClient.tags.forEach(tag => {
          newClientTagColors[tag.name] = tag.color || getTagDisplayColor(tag.name)
        })
        setClientTagColors(prev => ({
          ...prev,
          [createdClient.id]: newClientTagColors
        }))
        
        setNewClient({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          phone: "",
          portalUrl: "",
          tags: [],
        })
      }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClient = async () => {
    if (!selectedClient || !editClient.firstName || !editClient.lastName || !editClient.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const updatedClient = await updateClient(selectedClient.id, {
        first_name: editClient.firstName,
        last_name: editClient.lastName,
        email: editClient.email,
        company: editClient.company || undefined,
        phone: editClient.phone || undefined,
        portal_url: editClient.portalUrl || undefined,
        tags: editClient.tags,
      })

      if (updatedClient) {
        toast.success('Client updated successfully')
        setIsEditClientOpen(false)
        
        // Update local state instead of reloading
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === selectedClient.id 
              ? {
                  ...client,
                  first_name: editClient.firstName,
                  last_name: editClient.lastName,
                  email: editClient.email,
                  company: editClient.company || null,
                  phone: editClient.phone || null,
                  portal_url: editClient.portalUrl || null,
                }
              : client
          )
        )
        
        // Update client tags locally
        const updatedTags = editClient.tags.map(tag => tag.name)
        setClientTags(prev => ({
          ...prev,
          [selectedClient.id]: updatedTags
        }))
        
        // Update client tag colors locally
        const updatedTagColors: Record<string, string> = {}
        editClient.tags.forEach(tag => {
          updatedTagColors[tag.name] = tag.color || getTagDisplayColor(tag.name)
        })
        setClientTagColors(prev => ({
          ...prev,
          [selectedClient.id]: updatedTagColors
        }))
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return

    try {
      setDeleting(true)
      await deleteClient(selectedClient.id)
      toast.success('Client deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedClient(null)
      
      // Remove from local state instead of reloading
      setClients(prevClients => 
        prevClients.filter(client => client.id !== selectedClient.id)
      )
      
      // Clean up client tags
      setClientTags(prev => {
        const newTags = { ...prev }
        delete newTags[selectedClient.id]
        return newTags
      })
      
      // Clean up client tag colors
      setClientTagColors(prev => {
        const newColors = { ...prev }
        delete newColors[selectedClient.id]
        return newColors
      })
    } catch (error) {
      console.error('Error deleting client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleArchiveClient = async (client: Client) => {
    try {
      await archiveClient(client.id)
      toast.success('Client archived successfully')
      
      // Update local state instead of reloading
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id 
            ? { ...c, status: 'archived' as const }
            : c
        )
      )
    } catch (error) {
      console.error('Error archiving client:', error)
      toast.error('Failed to archive client')
    }
  }

  const handleRestoreClient = async (client: Client) => {
    try {
      await restoreClient(client.id)
      toast.success('Client restored successfully')
      
      // Update local state instead of reloading
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id 
            ? { ...c, status: 'active' as const }
            : c
        )
      )
    } catch (error) {
      console.error('Error restoring client:', error)
      toast.error('Failed to restore client')
    }
  }

  const handleClientAction = (action: string, client: Client) => {
    setSelectedClient(client)
    
    switch (action) {
      case "view":
        setIsClientDetailOpen(true)
        loadClientData(client.id)
        break
      case "edit":
        setEditClient({
          firstName: client.first_name || "",
          lastName: client.last_name || "",
          email: client.email || "",
          company: client.company || "",
          phone: client.phone || "",
          portalUrl: client.portal_url || "",
          tags: (clientTags[client.id] || []).map(tagName => ({
            name: tagName,
            color: clientTagColors[client.id]?.[tagName] || getTagDisplayColor(tagName, client.id)
          })),
        })
        setIsEditClientOpen(true)
        break
      case "delete":
        setIsDeleteDialogOpen(true)
        break
      case "archive":
        handleArchiveClient(client)
        break
      case "restore":
        handleRestoreClient(client)
        break
    }
  }

  // Client tag helper functions
  const addTagToNewClient = (tagName: string) => {
    if (!newClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const tagColor = addNewTagColor || getTagDisplayColor(tagName)
      setNewClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: tagColor }]
      }))
    }
  }

  const addTagToNewClientWithColor = (tagName: string, color: string) => {
    if (!newClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setNewClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: color }]
      }))
    }
  }

  const removeTagFromNewClient = (tagName: string) => {
    setNewClient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }))
  }

  const createCustomTag = (dialogType: 'add' | 'edit') => {
    const tagValue = dialogType === 'add' ? addNewTag : editNewTag
    const tagColor = dialogType === 'add' ? addNewTagColor : editNewTagColor
    
    if (tagValue.trim()) {
      // Check if tag already exists for this client
      const currentTags = dialogType === 'add' ? newClient.tags : editClient.tags
      if (currentTags.some(tag => tag.name.toLowerCase() === tagValue.trim().toLowerCase())) {
        toast.error('This tag is already added to this client')
        return
      }
      
      // Store the custom tag color
      setCustomTagColors(prev => ({
        ...prev,
        [tagValue.trim()]: tagColor
      }))
      
      // Add to available tags if it's a new tag
      if (!availableTags.includes(tagValue.trim())) {
        setAvailableTags(prev => [...prev, tagValue.trim()])
      }
      
      // Add to the current client's tags with the custom color
      if (dialogType === 'add') {
        addTagToNewClient(tagValue.trim())
        setAddNewTag("")
        setAddNewTagColor("#6B7280")
        toast.success(`Added tag "${tagValue.trim()}"`)
      } else {
        addTagToEditClient(tagValue.trim())
        setEditNewTag("")
        setEditNewTagColor("#6B7280")
        toast.success(`Added tag "${tagValue.trim()}"`)
      }
    } else {
      toast.error('Please enter a tag name')
    }
  }

  const handleEnterKey = (dialogType: 'add' | 'edit', e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      createCustomTag(dialogType)
    }
  }

  const addTagToEditClient = (tagName: string) => {
    if (!editClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const tagColor = editNewTagColor || getTagDisplayColor(tagName)
      setEditClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: tagColor }]
      }))
    }
  }

  const addTagToEditClientWithColor = (tagName: string, color: string) => {
    if (!editClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setEditClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: color }]
      }))
    }
  }

  const removeTagFromEditClient = (tagName: string) => {
    setEditClient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }))
  }

  // Projects functions
  const loadProjects = async () => {
    try {
      setProjectsLoading(true)
      const [projectsData, clientsData, tagsData] = await Promise.all([
        getProjects(),
        getClientsForProjects(),
        getAccountProjectTags()
      ])
      
      setProjects(projectsData)
      setProjectClients(clientsData)
      setAvailableProjectTags(tagsData)

      // Load tags for each project
      const tagsMap: Record<string, string[]> = {}
      const tagColorsMap: Record<string, Record<string, string>> = {}
      for (const project of projectsData) {
        try {
          const tags = await getProjectTags(project.id)
          tagsMap[project.id] = tags.map(tag => tag.tag_name)
          tagColorsMap[project.id] = {}
          tags.forEach(tag => {
            tagColorsMap[project.id][tag.tag_name] = tag.color
          })
        } catch (error) {
          console.error(`Error loading tags for project ${project.id}:`, error)
          tagsMap[project.id] = []
          tagColorsMap[project.id] = {}
        }
      }
      setProjectTags(tagsMap)
      setProjectTagColors(tagColorsMap)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setProjectsLoading(false)
    }
  }

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const handleProjectAction = async (action: string, project: Project, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    
    switch (action) {
      case "view":
        handleProjectClick(project.id)
        break
      case "edit":
        handleEditProject(project)
        break
      case "portal":
        toast.info('Portal view coming soon')
        break
      case "archive":
        await handleArchiveProject(project.id)
        break
      case "restore":
        await handleRestoreProject(project.id)
        break
      case "delete":
        await handleDeleteProject(project.id)
        break
    }
  }

  const handleEditProject = (project: Project) => {
    const projectTagNames = projectTags[project.id] || []
    const projectTagColorsData = projectTagColors[project.id] || {}
    
    // Format the date for the input field (YYYY-MM-DD format)
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }
    
    setSelectedProject(project)
    setEditProject({
      name: project.name,
      client_id: project.client_id,
      due_date: formatDateForInput(project.due_date),
      description: project.description || "",
      status: project.status,
      tags: projectTagNames.map(tagName => ({ 
        name: tagName, 
        color: projectTagColorsData[tagName] || getProjectTagColor(tagName)
      })),
    })
    setIsEditProjectOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!selectedProject) return
    
    if (!editProject.name.trim()) {
      toast.error('Please enter a project name')
      return
    }
    
    if (!editProject.client_id) {
      toast.error('Please select a client')
      return
    }
    
    try {
      setProjectsSaving(true)
      const loadingToast = toast.loading('Updating project...')
      
      await updateProject(selectedProject.id, {
        client_id: editProject.client_id,
        name: editProject.name.trim(),
        description: editProject.description.trim() || undefined,
        status: editProject.status,
        due_date: editProject.due_date || undefined,
        tags: editProject.tags
      })
      
      toast.dismiss(loadingToast)
      toast.success('Project updated successfully')
      setIsEditProjectOpen(false)
      setSelectedProject(null)
      
      // Update local state immediately instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === selectedProject.id 
            ? {
                ...project,
                name: editProject.name.trim(),
                description: editProject.description.trim() || null,
                status: editProject.status,
                due_date: editProject.due_date || null,
                client_id: editProject.client_id
              }
            : project
        )
      )
      
      // Update project tags locally
      const updatedTags = editProject.tags.map(tag => tag.name)
      setProjectTags(prev => ({
        ...prev,
        [selectedProject.id]: updatedTags
      }))
      
      // Update project tag colors locally
      const updatedTagColors: Record<string, string> = {}
      editProject.tags.forEach(tag => {
        updatedTagColors[tag.name] = tag.color || getProjectTagColor(tag.name)
      })
      setProjectTagColors(prev => ({
        ...prev,
        [selectedProject.id]: updatedTagColors
      }))
      
      setEditProject({
        name: "",
        client_id: "",
        due_date: "",
        description: "",
        status: "draft",
        tags: [],
      })
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setProjectsSaving(false)
    }
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      setProjectsDeleting(true)
      await archiveProject(projectId)
      toast.success('Project archived successfully')
      
      // Update local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: 'archived' as const }
            : project
        )
      )
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    } finally {
      setProjectsDeleting(false)
    }
  }

  const handleRestoreProject = async (projectId: string) => {
    try {
      setProjectsDeleting(true)
      await restoreProject(projectId)
      toast.success('Project restored successfully')
      
      // Update local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: 'active' as const }
            : project
        )
      )
    } catch (error) {
      console.error('Error restoring project:', error)
      toast.error('Failed to restore project')
    } finally {
      setProjectsDeleting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    
    try {
      setProjectsDeleting(true)
      await deleteProject(projectId)
      toast.success('Project deleted successfully')
      
      // Remove from local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== projectId)
      )
      
      // Clean up project tags
      setProjectTags(prev => {
        const newTags = { ...prev }
        delete newTags[projectId]
        return newTags
      })
      
      // Clean up project tag colors
      setProjectTagColors(prev => {
        const newColors = { ...prev }
        delete newColors[projectId]
        return newColors
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setProjectsDeleting(false)
    }
  }

  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name')
      return
    }
    
    if (!newProject.client_id) {
      toast.error('Please select a client')
      return
    }
    
    try {
      setProjectsSaving(true)
      const loadingToast = toast.loading('Creating project...')
      
      const createdProject = await createProject({
        client_id: newProject.client_id,
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        status: newProject.status,
        due_date: newProject.due_date || undefined,
        tags: newProject.tags
      })
      
      toast.dismiss(loadingToast)
      
      if (!createdProject) {
        toast.error('Failed to create project')
        return
      }
      
      toast.success('Project created successfully')
      setIsNewProjectOpen(false)
      
      // Add the new project to local state instead of reloading
      setProjects(prevProjects => [createdProject, ...prevProjects])
      
      // Add project tags to local state
      const newProjectTags = newProject.tags.map(tag => tag.name)
      setProjectTags(prev => ({
        ...prev,
        [createdProject.id]: newProjectTags
      }))
      
      // Add project tag colors to local state
      const newProjectTagColors: Record<string, string> = {}
      newProject.tags.forEach(tag => {
        newProjectTagColors[tag.name] = tag.color || getProjectTagColor(tag.name)
      })
      setProjectTagColors(prev => ({
        ...prev,
        [createdProject.id]: newProjectTagColors
      }))
      
      setNewProject({
        name: "",
        client_id: "",
        due_date: "",
        description: "",
        status: "draft",
        tags: [],
      })
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    } finally {
      setProjectsSaving(false)
    }
  }

  // Portal functions
  const loadPortals = async () => {
    try {
      setPortalsLoading(true)
      
      // Get current user from Supabase
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Failed to get user session')
        return
      }

      // Fetch portals from API
      const response = await fetch(`/api/portals?userId=${user.id}`)
      const result = await response.json()
      
      if (result.success) {
        setPortals(result.data)
      } else {
        toast.error(result.message || 'Failed to fetch portals')
      }
    } catch (error) {
      console.error('Error fetching portals:', error)
      toast.error('Failed to fetch portals')
    } finally {
      setPortalsLoading(false)
    }
  }

  const handlePortalAction = async (action: string, portal: Portal, e: React.MouseEvent) => {
    e.stopPropagation()
    
    switch (action) {
      case "view":
        // Use the actual portal URL structure from database
        // Portal URL format: company.client.clientportalhq.com
        const urlParts = portal.url.split('.')
        if (urlParts.length >= 3) {
          const companySlug = urlParts[0] // e.g., "acme" from "acme.client.clientportalhq.com"
          const clientSlug = urlParts[1] // e.g., "client" from "acme.client.clientportalhq.com"
          const portalUrl = `/${companySlug}/${clientSlug}?preview=true`
          window.open(portalUrl, "_blank")
        } else {
          // Fallback for old URL format
          const companySlug = urlParts[0]
          const clientSlug = portal.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
          const portalUrl = `/${companySlug}/${clientSlug}?preview=true`
          window.open(portalUrl, "_blank")
        }
        break
      case "edit":
        router.push(`/dashboard/portals/${portal.id}/portal-settings`)
        break
      case "copy":
        try {
          const urlParts = portal.url.split('.')
          if (urlParts.length >= 3) {
            const companySlug = urlParts[0]
            const clientSlug = urlParts[1]
            const portalUrl = `/${companySlug}/${clientSlug}`
            await navigator.clipboard.writeText(portalUrl)
            toast.success("Portal URL copied to clipboard!")
          } else {
            // Fallback for old URL format
            const companySlug = urlParts[0]
            const clientSlug = portal.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')
            const portalUrl = `/${companySlug}/${clientSlug}`
            await navigator.clipboard.writeText(portalUrl)
            toast.success("Portal URL copied to clipboard!")
          }
        } catch (error) {
          toast.error("Failed to copy URL")
        }
        break
      case "add-members":
        setSelectedPortalForMembers(portal)
        setShowAddMembersModal(true)
        break
      case "view-members":
        setSelectedPortalForView(portal)
        setShowViewMembersModal(true)
        break
      case "archive":
        if (portal.status === 'archived') {
          await handleUnarchivePortal(portal)
        } else {
          await handleArchivePortal(portal)
        }
        break
      case "delete":
        await handleDeletePortal(portal)
        break
      case "analytics":
        router.push(`/dashboard/portals/${portal.id}/analytics`)
        break
      case "settings":
        router.push(`/dashboard/portals/${portal.id}/portal-settings`)
        break
    }
  }

  const handleArchivePortal = async (portal: Portal) => {
    try {
      setPortalsLoading(true)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User session not found")
        return
      }

      // Update portal status to archived
      const { error } = await supabase
        .from('portals')
        .update({ status: 'archived' })
        .eq('id', portal.id)

      if (error) {
        throw error
      }

      // Update local state
      setPortals(prev => prev.map(p => 
        p.id === portal.id ? { ...p, status: 'archived' as const } : p
      ))

      toast.success("Portal archived successfully!")
    } catch (error) {
      console.error('Error archiving portal:', error)
      toast.error("Failed to archive portal")
    } finally {
      setPortalsLoading(false)
    }
  }

  const handleUnarchivePortal = async (portal: Portal) => {
    try {
      setPortalsLoading(true)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User session not found")
        return
      }

      // Update portal status to live
      const { error } = await supabase
        .from('portals')
        .update({ status: 'live' })
        .eq('id', portal.id)

      if (error) {
        throw error
      }

      // Update local state
      setPortals(prev => prev.map(p => 
        p.id === portal.id ? { ...p, status: 'live' as const } : p
      ))

      toast.success("Portal unarchived successfully!")
    } catch (error) {
      console.error('Error unarchiving portal:', error)
      toast.error("Failed to unarchive portal")
    } finally {
      setPortalsLoading(false)
    }
  }

  const handleDeletePortal = async (portal: Portal) => {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${portal.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setPortalsLoading(true)
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error("User session not found")
        return
      }

      // Delete portal (this will cascade delete related records due to foreign key constraints)
      const { error } = await supabase
        .from('portals')
        .delete()
        .eq('id', portal.id)

      if (error) {
        throw error
      }

      // Update local state
      setPortals(prev => prev.filter(p => p.id !== portal.id))

      toast.success("Portal deleted successfully!")
    } catch (error) {
      console.error('Error deleting portal:', error)
      toast.error("Failed to delete portal")
    } finally {
      setPortalsLoading(false)
    }
  }

  const handleCreatePortal = () => {
    router.push("/dashboard/portals/new")
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "live":
        return {
          color: "bg-green-100 text-green-700 border-green-200",
          icon: CheckCircle,
          iconColor: "text-green-600"
        }
      case "draft":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: Clock,
          iconColor: "text-yellow-600"
        }
      case "maintenance":
        return {
          color: "bg-orange-100 text-orange-700 border-orange-200",
          icon: AlertCircle,
          iconColor: "text-orange-600"
        }
      case "archived":
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: XCircle,
          iconColor: "text-gray-600"
        }
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
          icon: Clock,
          iconColor: "text-gray-600"
        }
    }
  }

  const getActivityIndicator = (lastActivity: string) => {
    if (lastActivity === "Never") {
      return <span className="text-gray-400">No activity</span>
    }
    if (lastActivity.includes("hours ago") || lastActivity.includes("minutes ago")) {
      return <span className="text-green-600">{lastActivity}</span>
    }
    if (lastActivity.includes("days ago")) {
      return <span className="text-gray-600">{lastActivity}</span>
    }
    return <span className="text-gray-600">{lastActivity}</span>
  }

  const renderActiveSection = () => {
    switch (activeStep) {
      case "clients":
        return (
          <ClientsSection
            clients={clients}
            clientTags={clientTags}
            clientTagColors={clientTagColors}
            loading={loading}
            onAddClient={() => setIsAddClientOpen(true)}
            onEditClient={(client) => handleClientAction("edit", client)}
            onDeleteClient={(client) => handleClientAction("delete", client)}
            onViewClient={(client) => handleClientAction("view", client)}
            onArchiveClient={(client) => handleClientAction("archive", client)}
            onRestoreClient={(client) => handleClientAction("restore", client)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            availableTags={availableTags}
          />
        )
      case "projects":
        return (
          <ProjectsSection
            projects={projects}
            clients={projectClients}
            projectTags={projectTags}
            projectTagColors={projectTagColors}
            availableTags={availableProjectTags}
            loading={projectsLoading}
            onAddProject={() => setIsNewProjectOpen(true)}
            onEditProject={(project) => handleProjectAction("edit", project)}
            onDeleteProject={(project) => handleProjectAction("delete", project)}
            onViewProject={(project) => handleProjectAction("view", project)}
            onArchiveProject={(project) => handleProjectAction("archive", project)}
            onRestoreProject={(project) => handleProjectAction("restore", project)}
            searchQuery={projectSearchQuery}
            setSearchQuery={setProjectSearchQuery}
            statusFilter={projectStatusFilter}
            setStatusFilter={setProjectStatusFilter}
            clientFilter={projectClientFilter}
            setClientFilter={setProjectClientFilter}
            tagFilter={projectTagFilter}
            setTagFilter={setProjectTagFilter}
          />
        )
      case "portals":
        return (
          <PortalsSection
            portals={portals}
            loading={portalsLoading}
            onViewPortal={(portal) => handlePortalAction("view", portal, {} as React.MouseEvent)}
            onEditPortal={(portal) => handlePortalAction("edit", portal, {} as React.MouseEvent)}
            onArchivePortal={(portal) => handlePortalAction("archive", portal, {} as React.MouseEvent)}
            onDeletePortal={(portal) => handlePortalAction("delete", portal, {} as React.MouseEvent)}
            onCreatePortal={handleCreatePortal}
            searchQuery={portalSearchQuery}
            setSearchQuery={setPortalSearchQuery}
            statusFilter={portalStatusFilter}
            setStatusFilter={setPortalStatusFilter}
            viewMode={portalViewMode}
            setViewMode={setPortalViewMode}
            getStatusConfig={getStatusConfig}
            getActivityIndicator={getActivityIndicator}
            handlePortalAction={handlePortalAction}
          />
        )
      default:
        return (
          <ClientsSection
            clients={clients}
            clientTags={clientTags}
            clientTagColors={clientTagColors}
            loading={loading}
            onAddClient={() => setIsAddClientOpen(true)}
            onEditClient={(client) => handleClientAction("edit", client)}
            onDeleteClient={(client) => handleClientAction("delete", client)}
            onViewClient={(client) => handleClientAction("view", client)}
            onArchiveClient={(client) => handleClientAction("archive", client)}
            onRestoreClient={(client) => handleClientAction("restore", client)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            availableTags={availableTags}
          />
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Client Workflow 🚀
                </h1>
                <p className="text-blue-100 text-lg">
                  Manage your clients, projects, and portals in one unified workflow
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{clients.length}</div>
                  <div className="text-blue-100 text-sm">Total Clients</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Step Navigation */}
        <StepNavigation activeStep={activeStep} onStepChange={setActiveStep} />

        {/* Active Section Content */}
        {renderActiveSection()}

        {/* Add Client Dialog */}
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="portalUrl">Portal URL</Label>
                <Input
                  id="portalUrl"
                  value={newClient.portalUrl}
                  onChange={(e) => setNewClient({ ...newClient, portalUrl: e.target.value })}
                  placeholder="company-name"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {newClient.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => removeTagFromNewClient(tag.name)}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Standard Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {standardTags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          className="cursor-pointer hover:opacity-80"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          }}
                          onClick={() => addTagToNewClientWithColor(tag.name, tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Custom Tag:</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom tag"
                        value={addNewTag}
                        onChange={(e) => setAddNewTag(e.target.value)}
                        onKeyPress={(e) => handleEnterKey('add', e)}
                      />
                      <input
                        type="color"
                        value={addNewTagColor}
                        onChange={(e) => setAddNewTagColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title="Choose tag color"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createCustomTag('add')}
                        disabled={!addNewTag.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {addNewTag.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Preview:</span>
                        <Badge
                          variant="outline"
                          style={{ 
                            backgroundColor: `${addNewTagColor}20`,
                            borderColor: addNewTagColor,
                            color: addNewTagColor
                          }}
                        >
                          {addNewTag}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={editClient.firstName}
                    onChange={(e) => setEditClient({ ...editClient, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={editClient.lastName}
                    onChange={(e) => setEditClient({ ...editClient, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editClient.email}
                  onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input
                  id="editCompany"
                  value={editClient.company}
                  onChange={(e) => setEditClient({ ...editClient, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editClient.phone}
                  onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="editPortalUrl">Portal URL</Label>
                <Input
                  id="editPortalUrl"
                  value={editClient.portalUrl}
                  onChange={(e) => setEditClient({ ...editClient, portalUrl: e.target.value })}
                  placeholder="company-name"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {editClient.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => removeTagFromEditClient(tag.name)}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Standard Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {standardTags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          className="cursor-pointer hover:opacity-80"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          }}
                          onClick={() => addTagToEditClientWithColor(tag.name, tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Custom Tag:</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom tag"
                        value={editNewTag}
                        onChange={(e) => setEditNewTag(e.target.value)}
                        onKeyPress={(e) => handleEnterKey('edit', e)}
                      />
                      <input
                        type="color"
                        value={editNewTagColor}
                        onChange={(e) => setEditNewTagColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title="Choose tag color"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createCustomTag('edit')}
                        disabled={!editNewTag.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {editNewTag.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Preview:</span>
                        <Badge
                          variant="outline"
                          style={{ 
                            backgroundColor: `${editNewTagColor}20`,
                            borderColor: editNewTagColor,
                            color: editNewTagColor
                          }}
                        >
                          {editNewTag}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClient} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {selectedClient?.first_name} {selectedClient?.last_name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Detail Sheet */}
        <Sheet open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl">
            {selectedClient && (
              <div>
                <SheetHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium text-xl">
                        {selectedClient.avatar_initials || `${selectedClient.first_name.charAt(0)}${selectedClient.last_name.charAt(0)}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-2xl">
                        {selectedClient.first_name} {selectedClient.last_name}
                      </SheetTitle>
                      <p className="text-gray-600">{selectedClient.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={selectedClient.status === "active" ? "default" : "secondary"}
                          className={
                            selectedClient.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {selectedClient.status}
                        </Badge>
                        {(clientTags[selectedClient.id] || []).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${getTagDisplayColor(tag, selectedClient.id, clientTagColors)}20`,
                              borderColor: getTagDisplayColor(tag, selectedClient.id, clientTagColors),
                              color: getTagDisplayColor(tag, selectedClient.id, clientTagColors)
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.email}</p>
                            <p className="text-sm text-gray-600">Email</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.phone || "No phone number"}</p>
                            <p className="text-sm text-gray-600">Phone</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.company || "No company"}</p>
                            <p className="text-sm text-gray-600">Company</p>
                          </div>
                        </div>
                        {selectedClient.portal_url && (
                        <div className="flex items-center space-x-3">
                          <ExternalLink className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-[#3C3CFF] cursor-pointer hover:underline">
                                {selectedClient.portal_url}
                            </p>
                            <p className="text-sm text-gray-600">Portal URL</p>
                          </div>
                        </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <CalendarDays className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{formatDate(selectedClient.joined_date)}</p>
                            <p className="text-sm text-gray-600">Joined Date</p>
                          </div>
                        </div>
                        {selectedClient.last_activity_at && (
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{formatDate(selectedClient.last_activity_at)}</p>
                              <p className="text-sm text-gray-600">Last Activity</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.total_invoices || 0}</p>
                              <p className="text-sm text-gray-600">Total Invoices</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-[#3C3CFF]" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                {formatCurrency(selectedClient.unpaid_amount || 0)}
                              </p>
                              <p className="text-sm text-gray-600">Unpaid Amount</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.files_uploaded || 0}</p>
                              <p className="text-sm text-gray-600">Files Uploaded</p>
                            </div>
                            <Upload className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.forms_submitted || 0}</p>
                              <p className="text-sm text-gray-600">Forms Submitted</p>
                            </div>
                            <FileText className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading activities...</span>
                          </div>
                        ) : clientActivities[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientActivities[selectedClient.id].map((activity) => (
                              <div key={activity.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                <div className="flex-shrink-0">
                                  {getActivityIcon(activity.activity_type || 'default')}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{activity.action || 'Unknown action'}</p>
                                  <p className="text-xs text-gray-600">{formatDate(activity.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No recent activity found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{selectedClient.paid_invoices}</p>
                              <p className="text-sm text-gray-600">Paid Invoices</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-red-600">
                                {selectedClient.total_invoices - selectedClient.paid_invoices}
                              </p>
                              <p className="text-sm text-gray-600">Unpaid Invoices</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Invoice History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading invoices...</span>
                          </div>
                        ) : clientInvoices[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientInvoices[selectedClient.id].map((invoice) => (
                              <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div>
                                  <p className="font-medium">{invoice.title || `Invoice #${invoice.invoice_number}`}</p>
                                  <p className="text-sm text-gray-600">{formatDate(invoice.issue_date)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">{formatCurrency(invoice.total_amount || 0)}</p>
                                  <Badge 
                                    className={
                                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                      invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                      'bg-blue-100 text-blue-700'
                                    }
                                  >
                                    {invoice.status || 'unknown'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No invoices found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Client Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading projects...</span>
                          </div>
                        ) : clientProjects[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientProjects[selectedClient.id].map((project) => (
                              <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div>
                                  <p className="font-medium">{project.name || 'Unnamed Project'}</p>
                                  <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    className={
                                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                      project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                      project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                                      project.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                      'bg-gray-100 text-gray-700'
                                    }
                                  >
                                    {project.status || 'unknown'}
                                  </Badge>
                                  <p className="text-sm text-gray-600 mt-1">{formatDate(project.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No projects found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="files" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Files & Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading files...</span>
                          </div>
                        ) : clientFiles[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientFiles[selectedClient.id].map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{file.name || 'Unnamed File'}</p>
                                    <p className="text-sm text-gray-600">{file.file_type || 'Unknown'} • {formatFileSize(file.file_size || 0)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">{formatDate(file.created_at)}</p>
                                  <Badge 
                                    className={
                                      file.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                      file.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      file.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }
                                  >
                                    {file.approval_status || 'unknown'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No files found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* New Project Modal */}
        <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectClient">Client *</Label>
                  <Select
                    value={newProject.client_id}
                    onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                          {client.company && ` (${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectStatus">Status</Label>
                  <Select
                    value={newProject.status}
                    onValueChange={(value: any) => setNewProject({ ...newProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectDescription">Description</Label>
                  <Textarea
                    id="projectDescription"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    placeholder="Optional project description"
                    rows={4}
                  />
                </div>
              </div>

              {/* Right Column - Dates */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projectDueDate">Due Date</Label>
                  <Input
                    id="projectDueDate"
                    type="date"
                    value={newProject.due_date}
                    onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddProject} 
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                disabled={projectsSaving}
              >
                {projectsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Create Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Project Modal */}
        <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Basic Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editProjectName">Project Name *</Label>
                  <Input
                    id="editProjectName"
                    value={editProject.name}
                    onChange={(e) => setEditProject({ ...editProject, name: e.target.value })}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProjectClient">Client *</Label>
                  <Select
                    value={editProject.client_id}
                    onValueChange={(value) => setEditProject({ ...editProject, client_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.first_name} {client.last_name}
                          {client.company && ` (${client.company})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProjectStatus">Status</Label>
                  <Select
                    value={editProject.status}
                    onValueChange={(value: any) => setEditProject({ ...editProject, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editProjectDescription">Description</Label>
                  <Textarea
                    id="editProjectDescription"
                    value={editProject.description}
                    onChange={(e) => setEditProject({ ...editProject, description: e.target.value })}
                    placeholder="Optional project description"
                    rows={4}
                  />
                </div>
              </div>

              {/* Right Column - Dates */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="editProjectDueDate">Due Date</Label>
                  <Input
                    id="editProjectDueDate"
                    type="date"
                    value={editProject.due_date}
                    onChange={(e) => setEditProject({ ...editProject, due_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
              <Button variant="outline" onClick={() => setIsEditProjectOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpdateProject} 
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                disabled={projectsSaving}
              >
                {projectsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Update Project
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Members Modal */}
        {showAddMembersModal && selectedPortalForMembers && (
          <AddMembersModal
            isOpen={showAddMembersModal}
            onClose={() => {
              setShowAddMembersModal(false)
              setSelectedPortalForMembers(null)
            }}
            clientId={selectedPortalForMembers.client.id}
            clientName={selectedPortalForMembers.client.name}
            companySlug={selectedPortalForMembers.url.split('.')[0]}
            clientSlug={selectedPortalForMembers.url.split('.').length >= 3 ? selectedPortalForMembers.url.split('.')[1] : selectedPortalForMembers.client.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}
          />
        )}

        {/* View Members Modal */}
        {showViewMembersModal && selectedPortalForView && (
          <ViewMembersModal
            isOpen={showViewMembersModal}
            onClose={() => {
              setShowViewMembersModal(false)
              setSelectedPortalForView(null)
            }}
            portalId={selectedPortalForView.id}
            portalName={selectedPortalForView.name}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
