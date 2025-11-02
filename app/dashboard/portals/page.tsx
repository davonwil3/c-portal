"use client"

export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Link2,
  Copy,
  Archive,
  ExternalLink,
  Globe,
  Clock,
  Package,
  Settings,
  Trash2,
  BarChart3,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Users,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'
import AddMembersModal from "@/components/AddMembersModal"
import ViewMembersModal from "@/components/ViewMembersModal"

// Simplified portal data structure
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

// Empty array - will be populated from API
const initialPortals: Portal[] = []

const statusOptions = [
  { value: "all", label: "All Status", icon: Filter },
  { value: "live", label: "Live", icon: CheckCircle, color: "text-green-600" },
  { value: "draft", label: "Draft", icon: Clock, color: "text-yellow-600" },
  { value: "maintenance", label: "Maintenance", icon: AlertCircle, color: "text-orange-600" },
  { value: "archived", label: "Archived", icon: XCircle, color: "text-gray-600" },
]

export default function PortalsPage() {
  const router = useRouter()
  const [portals, setPortals] = useState<Portal[]>(initialPortals)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showAddMembersModal, setShowAddMembersModal] = useState(false)
  const [selectedPortalForMembers, setSelectedPortalForMembers] = useState<Portal | null>(null)
  const [showViewMembersModal, setShowViewMembersModal] = useState(false)
  const [selectedPortalForView, setSelectedPortalForView] = useState<Portal | null>(null)

  const filteredPortals = portals.filter((portal) => {
    const matchesSearch =
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || portal.status === statusFilter

    return matchesSearch && matchesStatus
  })

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
      setLoading(true)
      
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
      setLoading(false)
    }
  }

  const handleUnarchivePortal = async (portal: Portal) => {
    try {
      setLoading(true)
      
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
      setLoading(false)
    }
  }

  const handleDeletePortal = async (portal: Portal) => {
    // Show confirmation dialog
    if (!confirm(`Are you sure you want to delete "${portal.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      setLoading(true)
      
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
      setLoading(false)
    }
  }

  const handleCreatePortal = () => {
    router.push("/dashboard/portals/new")
  }

  // Fetch portals data on component mount
  useEffect(() => {
    const fetchPortals = async () => {
      try {
        setLoading(true)
        
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
        setLoading(false)
      }
    }

    fetchPortals()
  }, [])

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

  return (
    <DashboardLayout title="Portals" subtitle="Create and manage branded client portals">
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
                <Button onClick={handleCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
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
                        <DropdownMenuSeparator />
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
                      <span className="text-xs text-gray-500">{portal.lastActivity}</span>
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

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Activity</span>
                        {getActivityIndicator(portal.lastActivity)}
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
                        <p className="text-xs text-gray-500">{getActivityIndicator(portal.lastActivity)}</p>
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
                          <DropdownMenuSeparator />
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
                <Button onClick={handleCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Portal
                </Button>
              )}
            </CardContent>
          </Card>
        )}

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
