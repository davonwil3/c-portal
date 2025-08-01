"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
  Users,
  Package,
} from "lucide-react"
import { useRouter } from "next/navigation"

// Mock data
const portals = [
  {
    id: 1,
    name: "Acme Corp Portal",
    client: { name: "Acme Corp", avatar: "AC" },
    project: { name: "Website Redesign", id: 1 },
    status: "live",
    lastUpdated: "2 hours ago",
    url: "acme.clientportalhq.com",
    modules: ["timeline", "files", "invoices", "messages"],
    views: 24,
    description: "Main client portal for website redesign project",
  },
  {
    id: 2,
    name: "TechStart Brand Portal",
    client: { name: "TechStart Inc", avatar: "TI" },
    project: { name: "Brand Identity", id: 2 },
    status: "live",
    lastUpdated: "1 day ago",
    url: "techstart.clientportalhq.com",
    modules: ["files", "forms", "messages"],
    views: 18,
    description: "Brand identity project portal",
  },
  {
    id: 3,
    name: "Design Co Workspace",
    client: { name: "Design Co", avatar: "DC" },
    project: null,
    status: "draft",
    lastUpdated: "3 days ago",
    url: "designco.clientportalhq.com",
    modules: ["timeline", "files", "invoices"],
    views: 0,
    description: "General client workspace",
  },
  {
    id: 4,
    name: "Marketing Plus Hub",
    client: { name: "Marketing Plus", avatar: "MP" },
    project: { name: "Q2 Campaign", id: 3 },
    status: "archived",
    lastUpdated: "2 weeks ago",
    url: "marketingplus.clientportalhq.com",
    modules: ["timeline", "files", "forms", "invoices", "messages"],
    views: 156,
    description: "Completed campaign portal",
  },
]

const clients = [
  { name: "Acme Corp", avatar: "AC" },
  { name: "TechStart Inc", avatar: "TI" },
  { name: "Design Co", avatar: "DC" },
  { name: "Marketing Plus", avatar: "MP" },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "live", label: "Live" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
]

export default function PortalsPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")

  const filteredPortals = portals.filter((portal) => {
    const matchesSearch =
      portal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      portal.client.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || portal.status === statusFilter
    const matchesClient = clientFilter === "all" || portal.client.name === clientFilter

    return matchesSearch && matchesStatus && matchesClient
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "bg-green-100 text-green-700 border-green-200"
      case "draft":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "archived":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "live":
        return <Globe className="h-3 w-3" />
      case "draft":
        return <Clock className="h-3 w-3" />
      case "archived":
        return <Archive className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const handlePortalAction = (action: string, portal: (typeof portals)[0], e: React.MouseEvent) => {
    e.stopPropagation()
    switch (action) {
      case "view":
        window.open(`https://${portal.url}`, "_blank")
        break
      case "edit":
        router.push(`/dashboard/portals/${portal.id}/edit`)
        break
      case "copy":
        navigator.clipboard.writeText(`https://${portal.url}`)
        // Show toast notification
        break
      case "archive":
        // Handle archiving
        break
    }
  }

  const handleCreatePortal = () => {
    router.push("/dashboard/portals/new")
  }

  return (
    <DashboardLayout title="Portals" subtitle="Create and manage branded client portals">
      <div className="space-y-6">
        {/* Header with Search and Filters */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by client or portal name..."
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
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
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
                      <SelectItem key={client.name} value={client.name}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Portal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPortals.map((portal) => (
            <Card
              key={portal.id}
              className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl cursor-pointer group"
            >
              <CardContent className="p-6">
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
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => handlePortalAction("view", portal, e)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("edit", portal, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Portal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("copy", portal, e)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handlePortalAction("archive", portal, e)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${getStatusColor(portal.status)} flex items-center space-x-1`}>
                      {getStatusIcon(portal.status)}
                      <span className="capitalize">{portal.status}</span>
                    </Badge>
                    <span className="text-xs text-gray-500">{portal.lastUpdated}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Portal URL</span>
                      <span className="text-[#3C3CFF] font-mono text-xs">{portal.url}</span>
                    </div>
                    {portal.status === "live" && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Views</span>
                        <span className="text-gray-900 font-medium">{portal.views}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-gray-600">Active Modules</span>
                    <div className="flex flex-wrap gap-1">
                      {portal.modules.map((module) => (
                        <Badge
                          key={module}
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-200 capitalize"
                        >
                          {module}
                        </Badge>
                      ))}
                    </div>
                  </div>

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

        {/* Empty State */}
        {filteredPortals.length === 0 && (
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardContent className="p-12 text-center">
              <Globe className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No portals found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all" || clientFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first client portal to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && clientFilter === "all" && (
                <Button onClick={handleCreatePortal} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Portal
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
