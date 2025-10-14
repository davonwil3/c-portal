"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Plus,
  Search,
  FileText,
  Users,
  Calendar,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  UserCheck,
  Zap,
  Loader2,
  Archive,
  RotateCcw,
  Type,
  AlignLeft,
  Mail,
  Phone,
  ChevronDown,
  CheckSquare,
  Square,
  Upload,
  PenTool,
  Star,
} from "lucide-react"
import { 
  getForms, 
  getFormStats, 
  deleteForm, 
  archiveForm, 
  restoreForm,
  type Form 
} from "@/lib/forms"
import { CreateFormModal } from "@/components/forms/create-form-modal"
import { PickTemplateModal } from "@/components/forms/pick-template-modal"
import { FormPreviewModal } from "@/components/forms/form-preview-modal"

const getStatusBadge = (status: string) => {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>
    case "draft":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Draft</Badge>
    case "archived":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Archived</Badge>
    case "deleted":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Deleted</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

const getSubmittedBadge = (submissions: number) => {
  if (submissions === 0) {
    return <Badge variant="outline" className="text-gray-500">No</Badge>
  } else {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Yes</Badge>
  }
}

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedForms, setSelectedForms] = useState<string[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [stats, setStats] = useState({
    totalForms: 0,
    publishedForms: 0,
    totalSubmissions: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [selectedFormForPreview, setSelectedFormForPreview] = useState<Form | null>(null)

  const router = useRouter()

  // Load forms and stats on component mount
  useEffect(() => {
    loadForms()
    loadStats()
  }, [])

  const loadForms = async () => {
    try {
      setLoading(true)
      const formsData = await getForms()
      setForms(formsData)
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getFormStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const filteredForms = forms.filter((form) => {
    const matchesSearch =
      form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (form.clients?.company && form.clients.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.projects?.name && form.projects.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (form.created_by_name && form.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || form.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedForms(filteredForms.map((form) => form.id))
    } else {
      setSelectedForms([])
    }
  }

  const handleSelectForm = (formId: string, checked: boolean) => {
    if (checked) {
      setSelectedForms([...selectedForms, formId])
    } else {
      setSelectedForms(selectedForms.filter((id) => id !== formId))
    }
  }

  const handleFormAction = async (action: string, form: Form) => {
    try {
      setActionLoading(form.id)
      
      switch (action) {
        case "view":
          setSelectedFormForPreview(form)
          setShowPreviewModal(true)
          break
        case "submissions":
          // Navigate to form submissions page
          router.push(`/dashboard/forms/${form.id}/submissions`)
          break
        case "edit":
          // Navigate to form builder with form data
          const formData = encodeURIComponent(JSON.stringify({
            id: form.id,
            title: form.title,
            description: form.description,
            instructions: form.instructions,
            client_id: form.client_id,
            project_id: form.project_id,
            notify_on_submission: form.notify_on_submission,
            submission_deadline: form.submission_deadline,
            access_level: form.access_level,
            max_submissions: form.max_submissions,
            notify_emails: form.notify_emails,
            fields: form.form_structure?.fields || []
          }))
          router.push(`/dashboard/forms/builder?edit=${formData}`)
          break
        case "duplicate":
          // TODO: Implement form duplication
          toast.info('Form duplication functionality coming soon')
          break
        case "archive":
          await archiveForm(form.id)
          toast.success('Form archived successfully')
          setForms(prev => prev.map(f => 
            f.id === form.id ? { ...f, status: 'archived' as const } : f
          ))
          await loadStats()
          break
        case "restore":
          await restoreForm(form.id)
          toast.success('Form restored successfully')
          setForms(prev => prev.map(f => 
            f.id === form.id ? { ...f, status: 'draft' as const } : f
          ))
          await loadStats()
          break
        case "toggle-status":
          const newStatus = form.status === 'published' ? 'draft' : 'published'
          try {
            const response = await fetch('/api/forms/toggle-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ formId: form.id, status: newStatus }),
            })

            const result = await response.json()

            if (result.success) {
              toast.success(`Form ${newStatus === 'published' ? 'published' : 'moved to draft'} successfully`)
              setForms(prev => prev.map(f => 
                f.id === form.id ? { ...f, status: newStatus as 'draft' | 'published' } : f
              ))
              await loadStats()
            } else {
              toast.error(`Failed to ${newStatus === 'published' ? 'publish' : 'draft'} form`)
            }
          } catch (error) {
            console.error('Error toggling form status:', error)
            toast.error('Failed to update form status')
          }
          break
        case "delete":
          if (confirm(`Are you sure you want to delete "${form.title}"?`)) {
            await deleteForm(form.id)
            toast.success('Form deleted successfully')
            setForms(prev => prev.filter(f => f.id !== form.id))
            setSelectedForms(prev => prev.filter(id => id !== form.id))
            await loadStats()
          }
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on form:`, error)
      toast.error(`Failed to ${action} form`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedForms.length === 0) {
      toast.error('Please select forms first')
      return
    }

    try {
      setActionLoading('bulk')
      
      switch (action) {
        case "archive":
          for (const formId of selectedForms) {
            await archiveForm(formId)
          }
          toast.success(`Archived ${selectedForms.length} form(s)`)
          setForms(prev => prev.map(f => 
            selectedForms.includes(f.id) ? { ...f, status: 'archived' as const } : f
          ))
          break
        case "delete":
          if (confirm(`Are you sure you want to delete ${selectedForms.length} form(s)?`)) {
            for (const formId of selectedForms) {
              await deleteForm(formId)
            }
            toast.success(`Deleted ${selectedForms.length} form(s)`)
            setForms(prev => prev.filter(f => !selectedForms.includes(f.id)))
          }
          break
      }
      
      setSelectedForms([])
      await loadStats()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} forms`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
            <p className="text-gray-600 mt-1">
              Create and manage forms for clients and projects
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowTemplateModal(true)}
              className="border-[#3C3CFF] text-[#3C3CFF] hover:bg-[#3C3CFF]/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              Pick from Templates
            </Button>
            <Button 
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Form
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalForms}</div>
              <p className="text-xs text-muted-foreground">All forms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Forms</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.publishedForms}</div>
              <p className="text-xs text-muted-foreground">Active forms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search forms by title, client, or project..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedForms.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedForms.length} form{selectedForms.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("archive")}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
                    Archive
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("delete")} 
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms Table */}
        <Card>
          <CardContent className="p-0">
            {filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms created yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first form</p>
                <Button 
                  className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">
                        <Checkbox
                          checked={selectedForms.length === filteredForms.length && filteredForms.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">Form Title</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Client</th>
                      <th className="text-left p-4 font-medium text-gray-900">Project</th>
                      <th className="text-left p-4 font-medium text-gray-900">Created By</th>
                      <th className="text-left p-4 font-medium text-gray-900">Created Date</th>
                      <th className="text-left p-4 font-medium text-gray-900">Submitted</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredForms.map((form) => (
                      <tr 
                        key={form.id} 
                        className="border-b hover:bg-gray-50 cursor-pointer"
                        onClick={(e) => {
                          // Don't trigger row click if clicking on checkbox, dropdown, or action buttons
                          if (
                            (e.target as HTMLElement).closest('input[type="checkbox"]') ||
                            (e.target as HTMLElement).closest('[role="menuitem"]') ||
                            (e.target as HTMLElement).closest('button')
                          ) {
                            return
                          }
                          setSelectedFormForPreview(form)
                          setShowPreviewModal(true)
                        }}
                      >
                        <td className="p-4">
                          <Checkbox
                            checked={selectedForms.includes(form.id)}
                            onCheckedChange={(checked) => handleSelectForm(form.id, checked as boolean)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <FileText className="h-5 w-5 text-blue-500 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">{form.title}</div>
                              {form.description && (
                                <div className="text-sm text-gray-500">{form.description}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">{getStatusBadge(form.status)}</td>
                        <td className="p-4 text-gray-900">
                          {form.clients ? (
                            form.clients.company || `${form.clients.first_name} ${form.clients.last_name}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-900">
                          {form.projects ? form.projects.name : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="p-4 text-gray-900">{form.created_by_name || "Unknown"}</td>
                        <td className="p-4 text-gray-600">{new Date(form.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          {getSubmittedBadge(form.total_submissions)}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleFormAction("view", form)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleFormAction("submissions", form)
                              }}>
                                <UserCheck className="h-4 w-4 mr-2" />
                                View Submissions
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleFormAction("edit", form)
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleFormAction("duplicate", form)
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              
                              {/* Toggle Status - only show for draft and published forms */}
                              {form.status === "draft" && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFormAction("toggle-status", form)
                                  }}
                                  className="text-green-600"
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                              {form.status === "published" && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFormAction("toggle-status", form)
                                  }}
                                  className="text-yellow-600"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Move to Draft
                                </DropdownMenuItem>
                              )}
                              
                              {form.status === "archived" ? (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFormAction("restore", form)
                                  }}
                                  className="text-green-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Restore
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleFormAction("archive", form)
                                  }}
                                  className="text-yellow-600"
                                >
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                              
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFormAction("delete", form)
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {actionLoading === form.id && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Modals */}
      <CreateFormModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <PickTemplateModal open={showTemplateModal} onOpenChange={setShowTemplateModal} />
      <FormPreviewModal 
        open={showPreviewModal} 
        onOpenChange={setShowPreviewModal} 
        form={selectedFormForPreview} 
      />
    </DashboardLayout>
  )
}
