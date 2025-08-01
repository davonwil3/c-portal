"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Eye, Check, FileText, Users, Calendar, Star, ChevronRight, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PickTemplateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock template data
const mockTemplates = [
  {
    id: "1",
    name: "Client Onboarding Form",
    description: "Comprehensive form to collect client information and project requirements",
    category: "Onboarding",
    createdDate: "2024-01-10",
    usedCount: 15,
    fields: ["Company Name", "Contact Info", "Project Goals", "Budget Range", "Timeline"],
  },
  {
    id: "2",
    name: "Project Feedback Survey",
    description: "Gather detailed feedback on project deliverables and client satisfaction",
    category: "Feedback",
    createdDate: "2024-01-08",
    usedCount: 8,
    fields: ["Overall Satisfaction", "Design Rating", "Communication Rating", "Suggestions"],
  },
  {
    id: "3",
    name: "Design Approval Form",
    description: "Quick approval form for design concepts and revisions",
    category: "Approval",
    createdDate: "2024-01-05",
    usedCount: 22,
    fields: ["Design Version", "Approval Status", "Revision Notes", "Signature"],
  },
  {
    id: "4",
    name: "Content Collection Form",
    description: "Collect text, images, and other content from clients",
    category: "Content",
    createdDate: "2024-01-03",
    usedCount: 12,
    fields: ["Page Content", "Images", "Brand Guidelines", "Special Requirements"],
  },
  {
    id: "5",
    name: "Meeting Preparation Form",
    description: "Pre-meeting form to gather agenda items and questions",
    category: "Meeting",
    createdDate: "2023-12-28",
    usedCount: 6,
    fields: ["Meeting Purpose", "Agenda Items", "Questions", "Attendees"],
  },
  {
    id: "6",
    name: "Project Requirements Survey",
    description: "Detailed technical and functional requirements gathering",
    category: "Requirements",
    createdDate: "2023-12-25",
    usedCount: 18,
    fields: ["Technical Specs", "Features List", "Integrations", "Performance Requirements"],
  },
]

const mockClients = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "Global Solutions" },
  { id: "4", name: "Creative Agency" },
]

const mockProjects = [
  { id: "1", name: "Website Redesign", clientId: "1" },
  { id: "2", name: "Brand Identity", clientId: "2" },
  { id: "3", name: "Marketing Campaign", clientId: "3" },
  { id: "4", name: "Mobile App", clientId: "1" },
]

const categories = ["All", "Onboarding", "Feedback", "Approval", "Content", "Meeting", "Requirements"]

export function PickTemplateModal({ open, onOpenChange }: PickTemplateModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [sendImmediately, setSendImmediately] = useState(false)
  const [showPreview, setShowPreview] = useState<string | null>(null)

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const selectedTemplateData = mockTemplates.find((t) => t.id === selectedTemplate)
  const availableProjects = mockProjects.filter((p) => p.clientId === selectedClient)

  const handleCreateForm = () => {
    if (!selectedTemplate || !selectedClient) return

    console.log("Creating form from template:", {
      templateId: selectedTemplate,
      clientId: selectedClient,
      projectId: selectedProject,
      sendImmediately,
    })

    // Reset form and close modal
    resetForm()
    onOpenChange(false)

    // Navigate to form builder with template data
    // This would typically use router.push() in a real app
  }

  const resetForm = () => {
    setSelectedTemplate(null)
    setSelectedClient("")
    setSelectedProject("")
    setSendImmediately(false)
    setSearchTerm("")
    setSelectedCategory("All")
    setShowPreview(null)
  }

  const handleClose = () => {
    resetForm()
    onOpenChange(false)
  }

  const getCategoryIcon = (category: string) => {
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
                  {filteredTemplates.map((template) => {
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
                              <Badge variant="outline" className="text-xs">
                                {template.category}
                              </Badge>
                            </div>
                            {isSelected && (
                              <div className="p-1 bg-[#3C3CFF] rounded-full">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>

                          <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{template.description}</p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Used {template.usedCount} times</span>
                            <span>{new Date(template.createdDate).toLocaleDateString()}</span>
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
                              Preview Fields
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-600">Try adjusting your search or category filter</p>
                  </div>
                )}
              </div>

              {/* Assignment Section */}
              <div className="space-y-6">
                {selectedTemplateData && (
                  <>
                    <div className="p-4 bg-[#3C3CFF]/5 rounded-lg border border-[#3C3CFF]/20">
                      <h3 className="font-semibold text-gray-900 mb-2">Selected Template</h3>
                      <div className="text-sm text-gray-600 mb-2">{selectedTemplateData.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {selectedTemplateData.fields.length} fields
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="client-select" className="text-sm font-medium text-gray-700 mb-2 block">
                          Select Client *
                        </Label>
                        <Select
                          value={selectedClient}
                          onValueChange={(value) => {
                            setSelectedClient(value)
                            setSelectedProject("") // Reset project when client changes
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a client..." />
                          </SelectTrigger>
                          <SelectContent>
                            {mockClients.map((client) => (
                              <SelectItem key={client.id} value={client.id}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedClient && (
                        <div>
                          <Label htmlFor="project-select" className="text-sm font-medium text-gray-700 mb-2 block">
                            Select Project (Optional)
                          </Label>
                          <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose a project..." />
                            </SelectTrigger>
                            <SelectContent>
                              {availableProjects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                  {project.name}
                                </SelectItem>
                              ))}
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
                          Send immediately to client
                        </Label>
                      </div>

                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-800">
                          <strong>Note:</strong> This template will be duplicated as a new form that you can customize
                          before sending.
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
              disabled={!selectedTemplate || !selectedClient}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              Create Form from Template
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      {showPreview && (
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Template Preview</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {(() => {
                const template = mockTemplates.find((t) => t.id === showPreview)
                if (!template) return null

                return (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{template.name}</h3>
                      <p className="text-gray-600 text-sm">{template.description}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Form Fields:</h4>
                      <div className="space-y-2">
                        {template.fields.map((field, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">{field}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
