"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Archive,
  FileText,
  Calendar,
  Users,
  Crown,
  Lock,
} from "lucide-react"

// Mock data for templates
const templates = [
  {
    id: 1,
    name: "Website Design Contract",
    description: "Comprehensive agreement for website design and development projects",
    category: "Design",
    status: "active",
    lastUsed: "2 days ago",
    usageCount: 15,
    isEditable: true,
    isPremium: false,
    createdBy: "You",
  },
  {
    id: 2,
    name: "Social Media Management Agreement",
    description: "Monthly retainer for social media content and management",
    category: "Marketing",
    status: "active",
    lastUsed: "1 week ago",
    usageCount: 8,
    isEditable: true,
    isPremium: false,
    createdBy: "You",
  },
  {
    id: 3,
    name: "Consulting Services Agreement",
    description: "Professional services and strategic consulting contract",
    category: "Services",
    status: "active",
    lastUsed: "3 days ago",
    usageCount: 12,
    isEditable: false,
    isPremium: false,
    createdBy: "ClientPortalHQ",
  },
  {
    id: 4,
    name: "Independent Contractor Agreement",
    description: "Standard independent contractor agreement with IP clauses",
    category: "Legal",
    status: "active",
    lastUsed: "1 day ago",
    usageCount: 22,
    isEditable: false,
    isPremium: false,
    createdBy: "ClientPortalHQ",
  },
  {
    id: 5,
    name: "Monthly Retainer Agreement",
    description: "Ongoing monthly services retainer agreement",
    category: "Services",
    status: "active",
    lastUsed: "5 days ago",
    usageCount: 6,
    isEditable: true,
    isPremium: true,
    createdBy: "You",
  },
  {
    id: 6,
    name: "Statement of Work Template",
    description: "Detailed project scope and deliverables document",
    category: "Project",
    status: "archived",
    lastUsed: "2 months ago",
    usageCount: 3,
    isEditable: true,
    isPremium: false,
    createdBy: "You",
  },
  {
    id: 7,
    name: "Non-Disclosure Agreement",
    description: "Confidentiality agreement for sensitive projects",
    category: "Legal",
    status: "active",
    lastUsed: "1 week ago",
    usageCount: 18,
    isEditable: false,
    isPremium: false,
    createdBy: "ClientPortalHQ",
  },
]

const categories = ["All", "Design", "Marketing", "Services", "Legal", "Project"]

export default function TemplatesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [statusFilter, setStatusFilter] = useState("all")
  const userPlan = "starter" // This would come from user context

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "All" || template.category === categoryFilter
    const matchesStatus = statusFilter === "all" || template.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <DashboardLayout title="Contract Templates" subtitle="Manage your contract templates and reusable clauses">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/contracts">Contracts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Templates</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primary CTA */}
          <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white" disabled={userPlan === "free"}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
            {userPlan === "free" && <Lock className="ml-2 h-4 w-4" />}
          </Button>
        </div>

        {/* Plan Notice */}
        {userPlan === "free" && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Free Plan - Read-Only Templates</p>
                  <p className="text-sm text-amber-700">
                    Upgrade to Starter plan to create custom templates, or Premium for advanced clause library.
                  </p>
                </div>
                <Button size="sm" className="ml-auto">
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || categoryFilter !== "All" ? "No templates found" : "No templates yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || categoryFilter !== "All"
                  ? "Try adjusting your search or filters"
                  : "Create your first template to streamline contract creation"}
              </p>
              {!searchQuery && categoryFilter === "All" && userPlan !== "free" && (
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {template.isPremium && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge
                        className={
                          template.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }
                      >
                        {template.status}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          {template.isEditable && (
                            <DropdownMenuItem disabled={userPlan === "free"}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                              {userPlan === "free" && <Lock className="h-4 w-4 ml-auto" />}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {template.isEditable && (
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              {template.status === "active" ? "Archive" : "Restore"}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">{template.category}</span>
                      <span>by {template.createdBy}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{template.usageCount} uses</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{template.lastUsed}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Clauses Library Section */}
        {userPlan === "premium" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Reusable Clauses Library</h2>
                <p className="text-gray-600">Manage standard clauses for quick insertion into contracts</p>
              </div>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Clause
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: "Payment Terms - Net 30", category: "Payment", uses: 45 },
                { name: "IP Rights - Work for Hire", category: "Legal", uses: 32 },
                { name: "Termination - 30 Day Notice", category: "Legal", uses: 28 },
                { name: "Revision Policy - 3 Rounds", category: "Scope", uses: 38 },
              ].map((clause, index) => (
                <Card key={index} className="hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{clause.name}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-1 rounded">{clause.category}</span>
                      <span>{clause.uses} uses</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
