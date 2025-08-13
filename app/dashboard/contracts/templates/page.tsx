"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Loader2,
  Trash2,
  X,
} from "lucide-react"
import { getContractTemplates, createContractTemplate, deleteContractTemplate, type ContractTemplate } from "@/lib/contracts"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await getContractTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handlePreviewTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setPreviewModalOpen(true)
  }

  const handleDuplicateTemplate = async (template: ContractTemplate) => {
    try {
      setDuplicating(template.id)
      
      // Create new template with same data
      const newTemplateData = {
        name: `${template.name} (Copy)`,
        description: template.description,
        template_content: template.template_content,
        template_html: template.template_html,
        template_type: template.template_type,
        is_default: false, // Always start as non-default
        tags: template.tags,
        metadata: template.metadata
      }
      
      await createContractTemplate(newTemplateData)
      await loadTemplates() // Refresh the list
      toast.success('Template duplicated successfully')
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Failed to duplicate template')
    } finally {
      setDuplicating(null)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      try {
        setDeleting(templateId)
        await deleteContractTemplate(templateId)
        await loadTemplates() // Refresh the list
        toast.success('Template deleted successfully')
      } catch (error) {
        console.error('Error deleting template:', error)
        toast.error('Failed to delete template')
      } finally {
        setDeleting(null)
      }
    }
  }

  const handleNewTemplate = () => {
    // Navigate to contracts/new with create from scratch selected
    router.push('/dashboard/contracts/new?step=1&mode=create')
  }

  const handleEditTemplate = (template: ContractTemplate) => {
    // Navigate to contracts/new with template data prefilled
    router.push(`/dashboard/contracts/new?edit=${template.template_number}&mode=template`)
  }

  const handleTemplateCardClick = (template: ContractTemplate, event: React.MouseEvent) => {
    // Only open preview if clicking on the card itself, not on action buttons
    if (!(event.target as HTMLElement).closest('[data-action-button]')) {
      handlePreviewTemplate(template)
    }
  }

  const handleDropdownItemClick = (event: React.MouseEvent, action: () => void) => {
    event.stopPropagation()
    action()
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSearch
  })

  if (loading) {
    return (
      <DashboardLayout title="Contract Templates" subtitle="Manage your contract templates and reusable clauses">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

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
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Primary CTA */}
          <Button 
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
            onClick={handleNewTemplate}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery ? "No templates found" : "No templates yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first template to streamline contract creation"}
              </p>
              {!searchQuery && (
                <Button 
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                  onClick={handleNewTemplate}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Template
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={(e) => handleTemplateCardClick(template, e)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          data-action-button
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleDropdownItemClick(e, () => handlePreviewTemplate(template))}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleDropdownItemClick(e, () => handleEditTemplate(template))}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleDropdownItemClick(e, () => handleDuplicateTemplate(template))}
                          disabled={duplicating === template.id}
                        >
                          {duplicating === template.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={(e) => handleDropdownItemClick(e, () => handleDeleteTemplate(template.id))}
                          disabled={deleting === template.id}
                        >
                          {deleting === template.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4 mr-2" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{template.description || 'No description available'}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>by {template.created_by_name || 'Unknown'}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Created {new Date(template.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Template Preview: {selectedTemplate?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewModalOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto p-0">
              {selectedTemplate?.template_html ? (
                <div 
                  className="bg-white border rounded-lg shadow-sm overflow-auto"
                  style={{ minHeight: '100%', maxHeight: '70vh' }}
                  dangerouslySetInnerHTML={{ __html: selectedTemplate.template_html }}
                />
              ) : selectedTemplate?.template_content ? (
                <div className="bg-white border rounded-lg shadow-sm p-6 overflow-auto" style={{ maxHeight: '70vh' }}>
                  <pre className="whitespace-pre-wrap text-sm text-gray-700">
                    {JSON.stringify(selectedTemplate.template_content, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No template content available</p>
                  <p className="text-sm">This template has no preview content.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
