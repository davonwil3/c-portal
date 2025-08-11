"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Eye, Check, FileText, Users, Calendar, Star, ChevronRight, Zap, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFormTemplates, getFormTemplate, type FormField, publishForm } from "@/lib/forms"
import { getClients, type Client } from "@/lib/clients"
import { getProjectsByClient, type Project } from "@/lib/projects"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface PickTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Template {
  id: string
  name: string
  description: string | null
  category: string | null
  template_data: {
    fields: FormField[]
    settings: {
      title: string
    }
  }
  is_public: boolean
  is_featured: boolean
  usage_count: number
  created_by_name: string | null
  created_at: string
}

const categories = ["All", "Onboarding", "Feedback", "Approval", "Content", "Meeting", "Requirements", "Survey", "Contact"]

export function PickTemplateModal({ open, onOpenChange }: PickTemplateModalProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [sendImmediately, setSendImmediately] = useState(false)
  const [showPreview, setShowPreview] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Load templates when modal opens
  useEffect(() => {
    if (open) {
      loadTemplates()
      loadClients()
    }
  }, [open])

  // Load clients when modal opens
  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadTemplates = async () => {
    setLoading(true)
    try {
      const templatesData = await getFormTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error("Error loading templates:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const clientsData = await getClients()
      setClients(clientsData)
    } catch (error) {
      console.error("Error loading clients:", error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId)
    setSelectedProject("")
    setAvailableProjects([])
    
    if (clientId === "none") {
      return
    }
    
    setLoadingProjects(true)
    try {
      const projects = await getProjectsByClient(clientId)
      setAvailableProjects(projects)
    } catch (error) {
      console.error("Error loading projects:", error)
      setAvailableProjects([])
    } finally {
      setLoadingProjects(false)
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate)

  const handleCreateForm = async () => {
    if (!selectedTemplate || !selectedClient) return

    console.log("Creating form from template:", {
      templateId: selectedTemplate,
      clientId: selectedClient,
      projectId: selectedProject,
      sendImmediately,
    })

    const template = templates.find(t => t.id === selectedTemplate)
    if (!template) return

    if (sendImmediately) {
      // Publish form immediately
      setPublishing(true)
      try {
        const publishData = {
          title: template.name,
          description: template.description || "",
          instructions: template.description || "",
          maxSubmissions: "",
          submissionDeadline: null,
          notifyEmails: [],
          notifyOnSubmission: true,
          accessLevel: "client" as const,
          clientId: selectedClient,
          projectId: selectedProject || "",
        }

        const result = await publishForm(publishData, template.template_data.fields)
        
        if (result.success) {
          toast.success("Form published and sent to client successfully!")
          resetForm()
          onOpenChange(false)
        } else {
          toast.error("Failed to publish form")
        }
      } catch (error) {
        console.error("Error publishing form:", error)
        toast.error("Failed to publish form")
      } finally {
        setPublishing(false)
      }
    } else {
      // Navigate to form builder with template data
      const formData = {
        title: template.name,
        fields: template.template_data.fields,
        client_id: selectedClient,
        project_id: selectedProject || undefined,
        instructions: template.description || "",
      }
      
      const encodedData = encodeURIComponent(JSON.stringify(formData))
      router.push(`/dashboard/forms/builder?edit=${encodedData}`)
      
      // Reset form and close modal
      resetForm()
      onOpenChange(false)
    }
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setSelectedClient("")
    setSelectedProject("")
    setSendImmediately(false)
    setSearchTerm("")
    setSelectedCategory("All")
    setShowPreview(null)
    setPublishing(false)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "Onboarding":
        return Users
      case "Feedback":
        return Star
      case "Approval":
        return Check
      case "Content":
        return FileText
      case "Meeting":
        return Calendar
      case "Survey":
        return FileText
      case "Contact":
        return Users
      default:
        return FileText
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Pick from Templates</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
              {/* Template Selection */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Templates Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2">
                  {loading ? (
                    <div className="col-span-2 flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : filteredTemplates.length > 0 ? (
                    filteredTemplates.map((template) => {
                      const Icon = getCategoryIcon(template.category)
                      const isSelected = selectedTemplate === template.id

                      return (
                        <Card
                          key={template.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            isSelected && "ring-2 ring-[#3C3CFF] shadow-lg",
                          )}
                          onClick={() => setSelectedTemplate(template.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="p-2 bg-gray-100 rounded-lg">
                                  <Icon className="h-4 w-4 text-gray-600" />
                                </div>
                                {template.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {template.category}
                                  </Badge>
                                )}
                              </div>
                              {isSelected && (
                                <div className="p-1 bg-[#3C3CFF] rounded-full">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.description || "No description available"}
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Used {template.usage_count} times</span>
                              <span>{new Date(template.created_at).toLocaleDateString()}</span>
                            </div>

                            <div className="mt-3 pt-3 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowPreview(template.id)
                                }}
                                className="w-full text-[#3C3CFF] hover:bg-[#3C3CFF]/10"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Preview Form
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="col-span-2 text-center py-12">
                      <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                      <p className="text-gray-600">Try adjusting your search or category filter</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Section */}
              <div className="space-y-6">
                {selectedTemplateData && (
                  <>
                    <div className="p-4 bg-[#3C3CFF]/5 rounded-lg border border-[#3C3CFF]/20">
                      <h3 className="font-semibold text-gray-900 mb-2">Selected Template</h3>
                      <div className="text-sm text-gray-600 mb-2">{selectedTemplateData.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplateData.template_data.fields.length} fields
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="client-select" className="text-sm font-medium text-gray-700 mb-2 block">
                          Select Client *
                        </Label>
                        <Select
                          value={selectedClient}
                          onValueChange={handleClientChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={
                              loadingClients ? "Loading clients..." : "Choose a client..."
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No client</SelectItem>
                            {loadingClients ? (
                              <SelectItem value="loading" disabled>
                                <div className="flex items-center">
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Loading clients...
                                </div>
                              </SelectItem>
                            ) : (
                              clients.map((client) => (
                                <SelectItem key={client.id} value={client.id}>
                                  {client.company || `${client.first_name} ${client.last_name}`}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedClient && selectedClient !== "none" && (
                        <div>
                          <Label htmlFor="project-select" className="text-sm font-medium text-gray-700 mb-2 block">
                            Select Project (Optional)
                          </Label>
                          <Select 
                            value={selectedProject} 
                            onValueChange={setSelectedProject}
                            disabled={loadingProjects}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={
                                loadingProjects 
                                  ? "Loading projects..." 
                                  : availableProjects.length === 0 
                                    ? "No projects for this client" 
                                    : "Choose a project..."
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No project</SelectItem>
                              {loadingProjects ? (
                                <SelectItem value="loading" disabled>
                                  <div className="flex items-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading projects...
                                  </div>
                                </SelectItem>
                              ) : (
                                availableProjects.map((project) => (
                                  <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="send-immediately"
                          checked={sendImmediately}
                          onCheckedChange={setSendImmediately}
                        />
                        <Label htmlFor="send-immediately" className="text-sm text-gray-700">
                          This form will be sent as is immediately to client
                        </Label>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Note:</strong> {sendImmediately 
                            ? "This form will be published immediately and sent to the client without going to the form builder." 
                            : "This template will be duplicated as a new form that you can customize before sending."
                          }
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {!selectedTemplateData && (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-2">Select a template to continue</div>
                    <div className="text-sm text-gray-400">Choose from the templates on the left</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateForm}
              disabled={!selectedTemplate || !selectedClient || selectedClient === "none" || publishing}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              {publishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  {sendImmediately ? "Publish & Send to Client" : "Create Form from Template"}
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {showPreview && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Form Preview</DialogTitle>
              <div className="text-sm text-gray-600">This is how your form will appear to users</div>
            </DialogHeader>
            <div className="py-6">
              {(() => {
                const template = templates.find((t) => t.id === showPreview)
                if (!template) return null

                const { fields } = template.template_data

                return (
                  <div className="space-y-6">
                    {/* Form Header */}
                    <div className="text-center mb-8 pb-6 border-b border-gray-200">
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{template.name}</h1>
                      {template.description && (
                        <p className="text-gray-600 mb-2">{template.description}</p>
                      )}
                      <p className="text-gray-600">Please fill out the form below</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                      {fields.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-4">
                            <FileText className="h-12 w-12 mx-auto" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No fields in this template</h3>
                          <p className="text-gray-600">This template doesn't contain any form fields</p>
                        </div>
                      ) : (
                        fields.map((field, index) => {
                          return (
                            <div key={field.id} className="space-y-3">
                              {/* Field Label */}
                              <div className="flex items-center space-x-2">
                                <Label className="text-sm font-medium text-gray-900">
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                              </div>
                              
                              {/* Field Description */}
                              {field.description && (
                                <div className="text-sm text-gray-600">{field.description}</div>
                              )}
                              
                              {/* Field Input */}
                              <div>
                                {field.type === "short-text" && (
                                  <Input 
                                    placeholder={field.placeholder} 
                                    className="max-w-md"
                                  />
                                )}
                                
                                {field.type === "paragraph" && (
                                  <textarea 
                                    placeholder={field.placeholder} 
                                    rows={4}
                                    className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent resize-none"
                                  />
                                )}
                                
                                {field.type === "email" && (
                                  <Input 
                                    type="email" 
                                    placeholder="Enter email address" 
                                    className="max-w-md"
                                  />
                                )}
                                
                                {field.type === "phone" && (
                                  <Input 
                                    type="tel" 
                                    placeholder="Enter phone number" 
                                    className="max-w-md"
                                  />
                                )}
                                
                                {field.type === "date" && (
                                  <Input 
                                    type="date" 
                                    className="max-w-md"
                                  />
                                )}
                                
                                {field.type === "dropdown" && field.options && (
                                  <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent">
                                    <option value="">Select an option</option>
                                    {field.options.map((option, idx) => (
                                      <option key={idx} value={option}>{option}</option>
                                    ))}
                                  </select>
                                )}
                                
                                {field.type === "multiple-choice" && field.options && (
                                  <div className="space-y-2 max-w-md">
                                    {field.options.map((option, idx) => (
                                      <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="radio" name={`field-${field.id}`} className="w-4 h-4 text-[#3C3CFF] border-gray-300 focus:ring-[#3C3CFF]" />
                                        <span className="text-sm text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                
                                {field.type === "checkbox" && field.options && (
                                  <div className="space-y-2 max-w-md">
                                    {field.options.map((option, idx) => (
                                      <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 text-[#3C3CFF] border-gray-300 rounded focus:ring-[#3C3CFF]" />
                                        <span className="text-sm text-gray-700">{option}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                                
                                {field.type === "rating" && (
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button key={star} className="text-gray-300 hover:text-yellow-400 transition-colors">
                                        <Star className="h-6 w-6" />
                                      </button>
                                    ))}
                                    <span className="ml-3 text-sm text-gray-500">Click to rate</span>
                                  </div>
                                )}
                                
                                {field.type === "file-upload" && (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                                    <div className="text-sm font-medium text-gray-700 mb-2">Click to upload or drag and drop</div>
                                    <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                                  </div>
                                )}
                                
                                {field.type === "signature" && (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                                    <div className="text-sm font-medium text-gray-700 mb-2">Click to sign</div>
                                    <div className="text-xs text-gray-500">Draw your signature in the box above</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* Form Footer */}
                    {fields.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex justify-end space-x-3">
                          <Button variant="outline">Cancel</Button>
                          <Button className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                            Submit Form
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
