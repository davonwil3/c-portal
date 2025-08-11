"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Type,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Square,
  Upload,
  PenTool,
  Star,
  Mail,
  Phone,
  GripVertical,
  Trash2,
  Eye,
  Save,
  Zap,
  Rocket,
  Plus,
  ChevronRight,
  Settings,
  Loader2,
  Check,
  X,
  Globe,
  Users,
  Lock,
  UserCheck,
  Clock,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { getClients, type Client } from "@/lib/clients"
import { getProjectsByClient, type Project } from "@/lib/projects"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { saveFormDraft, saveFormTemplate, publishForm, updateFormDraft, updateAndPublishForm, type FormField } from "@/lib/forms"
import { toast } from "sonner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Field types
const basicFields = [
  { id: "short-text", name: "Short Text", icon: Type, description: "Single line text input" },
  { id: "paragraph", name: "Paragraph", icon: AlignLeft, description: "Multi-line text area" },
  { id: "email", name: "Email", icon: Mail, description: "Email validation" },
  { id: "phone", name: "Phone", icon: Phone, description: "Phone number input" },
  { id: "dropdown", name: "Dropdown", icon: ChevronDown, description: "Select from options" },
  { id: "multiple-choice", name: "Multiple Choice", icon: CheckSquare, description: "Radio buttons" },
  { id: "checkbox", name: "Checkbox", icon: Square, description: "Multiple selections" },
  { id: "date", name: "Date Picker", icon: CalendarIcon, description: "Date selection" },
  { id: "file-upload", name: "File Upload", icon: Upload, description: "File attachment" },
  { id: "signature", name: "Signature", icon: PenTool, description: "Digital signature" },
]

const advancedFields = [
  { id: "rating", name: "Rating", icon: Star, description: "Star or number rating" },
]

const getFieldIcon = (type: string) => {
  const allFields = [...basicFields, ...advancedFields]
  const field = allFields.find((f) => f.id === type)
  return field?.icon || Type
}

// Sortable Field Component
function SortableField({ field, index, onUpdate, onDelete, onSelect, isSelected }: {
  field: FormField
  index: number
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onDelete: (fieldId: string) => void
  onSelect: (fieldId: string) => void
  isSelected: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const Icon = getFieldIcon(field.type)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all", 
        isSelected && "ring-2 ring-[#3C3CFF] shadow-md",
        isDragging && "opacity-50"
      )}
      data-field-id={field.id}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex items-center space-x-2">
            <div {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            </div>
            <Icon className="h-4 w-4 text-gray-600" />
          </div>

          <div className="flex-1">
            {/* Field Preview */}
            <div className="mt-3 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              {/* Field Header with Settings */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {field.type === "short-text" ? "Text Input" :
                     field.type === "paragraph" ? "Paragraph" :
                     field.type === "email" ? "Email" :
                     field.type === "phone" ? "Phone" :
                     field.type === "dropdown" ? "Dropdown" :
                     field.type === "multiple-choice" ? "Multiple Choice" :
                     field.type === "checkbox" ? "Checkbox" :
                     field.type === "date" ? "Date Picker" :
                     field.type === "file-upload" ? "File Upload" :
                     field.type === "signature" ? "Signature" :
                     field.type === "rating" ? "Rating" : field.type}
                  </span>
                </div>
              <div className="flex items-center space-x-2">
                {field.required && (
                    <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 border-red-200">
                    Required
                  </Badge>
                )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(field.id)
                    }}
                    className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(field.id)
                  }}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

              {/* Inline Editable Form Field */}
              <div className="space-y-3">
                {/* Editable Label */}
                <div>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full text-lg font-medium text-gray-900 border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400"
                    placeholder="Enter field label..."
                  />
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </div>

                {/* Editable Description */}
            {field.description && (
                  <div>
                    <textarea
                      value={field.description}
                      onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full text-sm text-gray-600 border-none p-0 focus:outline-none focus:ring-0 bg-transparent resize-none placeholder-gray-400"
                      placeholder="Add description (optional)..."
                      rows={1}
                    />
                  </div>
                )}

                {/* Form Field Preview */}
                <div className="mt-4">
                  {field.type === "short-text" && (
                    <input 
                      type="text" 
                      placeholder={field.placeholder || "Enter text..."} 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
              {field.type === "paragraph" && (
                    <textarea 
                      placeholder={field.placeholder || "Enter text..."} 
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  {field.type === "email" && (
                    <input 
                      type="email" 
                      placeholder="Enter email address..." 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  {field.type === "phone" && (
                    <input 
                      type="tel" 
                      placeholder="Enter phone number..." 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  {field.type === "date" && (
                    <input 
                      type="date" 
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  )}
                  
                  {(field.type === "dropdown" || field.type === "multiple-choice" || field.type === "checkbox") &&
                field.options && (
                      <div className="space-y-3">
                    {field.options.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                        {field.type === "multiple-choice" && (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex-shrink-0" />
                        )}
                        {field.type === "checkbox" && (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0" />
                            )}
                            {field.type === "dropdown" && (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded flex-shrink-0 flex items-center justify-center">
                                <ChevronDown className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(field.options || [])]
                                newOptions[idx] = e.target.value
                                onUpdate(field.id, { options: newOptions })
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-sm text-gray-700 border-none p-0 focus:outline-none focus:ring-0 bg-transparent"
                              placeholder={`Option ${idx + 1}`}
                            />
                      </div>
                    ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [
                              ...(field.options || []),
                              `Option ${(field.options?.length || 0) + 1}`,
                            ]
                            onUpdate(field.id, { options: newOptions })
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                  </div>
                )}
                  
              {field.type === "file-upload" && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                      <div className="text-sm font-medium text-gray-700 mb-2">Click to upload or drag and drop</div>
                      <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                </div>
              )}
                  
                  {field.type === "signature" && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                      <PenTool className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                      <div className="text-sm font-medium text-gray-700 mb-2">Click to sign</div>
                      <div className="text-xs text-gray-500">Draw your signature in the box above</div>
            </div>
                  )}
                  
                  {field.type === "rating" && (
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-6 w-6 text-gray-300 hover:text-yellow-400 transition-colors cursor-pointer" />
                      ))}
                      <span className="ml-3 text-sm text-gray-500">Click to rate</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function FormBuilderPage() {
  const searchParams = useSearchParams()
  const [formTitle, setFormTitle] = useState("Untitled Form")
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [publishFormData, setPublishFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    maxSubmissions: "",
    submissionDeadline: null as Date | null,
    notifyEmails: [] as string[],
    notifyOnSubmission: true,
    accessLevel: "public" as "private" | "team" | "client" | "public",
    clientId: "", // Added for cascading dropdowns
    projectId: "", // Added for cascading dropdowns
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [editingFormId, setEditingFormId] = useState<string | null>(null) // Track if we're editing an existing form
  const [draftFormId, setDraftFormId] = useState<string | null>(null) // Track the draft form ID for auto-save
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isFormInitialized, setIsFormInitialized] = useState(false) // Track if form data is loaded

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end for reordering
  const handleDndDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // Initialize form data from URL parameters
  useEffect(() => {
    const title = searchParams.get('title')
    const editData = searchParams.get('edit')
    
    // Reset initialization flag
    setIsFormInitialized(false)
    
    if (editData) {
      try {
        const formData = JSON.parse(decodeURIComponent(editData))
        setFormTitle(formData.title || "Untitled Form")
        setFields(formData.fields || [])
        setEditingFormId(formData.id) // Set the form ID for editing
        setDraftFormId(formData.id) // Also set as draft ID for auto-save
        
        // Set publish form data for editing
        setPublishFormData(prev => ({
          ...prev,
          title: formData.title || "",
          description: formData.description || "",
          instructions: formData.instructions || "",
          clientId: formData.client_id || "",
          projectId: formData.project_id || "",
          accessLevel: formData.access_level || "public",
          maxSubmissions: formData.max_submissions?.toString() || "",
          notifyEmails: formData.notify_emails || [],
          submissionDeadline: formData.submission_deadline ? new Date(formData.submission_deadline) : null,
        }))
        
        toast.success("Form loaded for editing")
        
        // Small delay to ensure all state is set before allowing auto-save
        setTimeout(() => setIsFormInitialized(true), 100)
      } catch (error) {
        console.error("Error parsing form data:", error)
        toast.error("Failed to load form data")
        setTimeout(() => setIsFormInitialized(true), 100)
      }
    } else if (title) {
      setFormTitle(title)
      setTimeout(() => setIsFormInitialized(true), 100)
    } else {
      // No title or edit data, mark as initialized for new blank forms
      setTimeout(() => setIsFormInitialized(true), 100)
    }
  }, [searchParams])

  // Load clients when publish modal opens
  useEffect(() => {
    const loadClients = async () => {
      if (!showPublishModal) return 
      
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

    loadClients()
  }, [showPublishModal])

  // Load clients and projects when editing a form (to preserve client/project data)
  useEffect(() => {
    const loadClientsAndProjects = async () => {
      if (!editingFormId || !publishFormData.clientId) return
      
      setLoadingClients(true)
      setLoadingProjects(true)
      
      try {
        // Load clients
        const clientsData = await getClients()
        setClients(clientsData)
        
        // Load projects for the selected client
        if (publishFormData.clientId && publishFormData.clientId !== "none") {
          const projects = await getProjectsByClient(publishFormData.clientId)
          setAvailableProjects(projects)
        }
      } catch (error) {
        console.error("Error loading clients and projects:", error)
      } finally {
        setLoadingClients(false)
        setLoadingProjects(false)
      }
    }

    loadClientsAndProjects()
  }, [editingFormId, publishFormData.clientId])

  // Load projects when client is selected in publish modal (for new forms)
  useEffect(() => {
    const loadProjects = async () => {
      if (!publishFormData.clientId || publishFormData.clientId === "none" || !showPublishModal) return 
      
      setLoadingProjects(true)
      try {
        const projects = await getProjectsByClient(publishFormData.clientId)
        setAvailableProjects(projects)
      } catch (error) {
        console.error("Error loading projects:", error)
        setAvailableProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }

    loadProjects()
  }, [publishFormData.clientId, showPublishModal])

  const addField = (fieldType: any) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType.id,
      label: fieldType.name,
      required: false,
      placeholder: `Enter ${fieldType.name.toLowerCase()}...`,
      options:
        fieldType.id === "dropdown" || fieldType.id === "multiple-choice" || fieldType.id === "checkbox"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
    }
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter((field) => field.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  const getFieldIcon = (type: string) => {
    const allFields = [...basicFields, ...advancedFields]
    const field = allFields.find((f) => f.id === type)
    return field?.icon || Type
  }

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    console.log('Drag start:', fieldId)
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = "move"
    // Add some data to the drag operation
    e.dataTransfer.setData('text/plain', fieldId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  // Handle dropping on a specific field (for reordering)
  const handleFieldDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault()
    console.log('Field drop event:', { draggedField, targetFieldId })
    
    if (!draggedField) return

    const draggedIndex = fields.findIndex((f) => f.id === draggedField)
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId)

    console.log('Indices:', { draggedIndex, targetIndex })

    // Don't drop on itself
    if (draggedField === targetFieldId) {
      console.log('Dropping on itself, ignoring')
      setDraggedField(null)
      return
    }

    if (draggedIndex !== -1 && targetIndex !== -1) {
      console.log(`Moving field from ${draggedIndex} to ${targetIndex}`)
      // This function is no longer needed as DndContext handles reordering
      // moveField(draggedIndex, targetIndex) 
    }
    setDraggedField(null)
  }

  // Handle dropping on canvas (for adding new fields or moving to end)
  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    console.log('Canvas drop event')
    
    try {
      // Try to parse as JSON first (field library drop)
      const jsonData = e.dataTransfer.getData('application/json')
      if (jsonData) {
        const fieldData = JSON.parse(jsonData)
        console.log('Adding field from library:', fieldData)
        addField(fieldData)
        return
      }
      
      // Try to parse as text (reordering - move to end)
      const textData = e.dataTransfer.getData('text/plain')
      if (textData && draggedField) {
        const draggedIndex = fields.findIndex(f => f.id === draggedField)
        if (draggedIndex !== -1) {
          console.log('Moving field to end:', draggedField)
          // This function is no longer needed as DndContext handles reordering
          // moveField(draggedIndex, fields.length)
        }
        setDraggedField(null)
        return
      }
    } catch (error) {
      console.error('Error parsing dropped field:', error)
    }
  }

  // Reset drag state when drag ends
  const handleDragEnd = (e: React.DragEvent) => {
    console.log('Drag end')
    setDraggedField(null)
  }

  // Auto-scroll during drag
  const handleDragOverWithScroll = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    
    // Auto-scroll functionality
    const container = e.currentTarget.closest('.overflow-y-auto')
    if (container) {
      const rect = container.getBoundingClientRect()
      const scrollSpeed = 10
      const scrollThreshold = 50
      
      // Scroll up
      if (e.clientY - rect.top < scrollThreshold) {
        container.scrollTop -= scrollSpeed
      }
      // Scroll down
      else if (rect.bottom - e.clientY < scrollThreshold) {
        container.scrollTop += scrollSpeed
      }
    }
  }

  const selectedFieldData = fields.find((f) => f.id === selectedField)

  const handleSaveTemplate = () => {
    // Save template logic here
    console.log("Saving template:", { templateName, templateDescription, fields })
    setShowSaveTemplate(false)
    setTemplateName("")
    setTemplateDescription("")
  }

  const handleSaveDraft = async () => {
    // Don't save if no title or if title is just whitespace
    if (!formTitle.trim()) {
      toast.error("Please enter a form title before saving")
      return
    }

    setIsSaving(true)
    try {
      let result
      
      if (editingFormId) {
        // Update existing form (edit mode) - only save form structure
        result = await updateFormDraft(
          editingFormId,
          formTitle.trim(),
          fields,
          null, // Don't save client_id in manual save
          null, // Don't save project_id in manual save
          undefined, // Don't save notify_on_submission in manual save
          null, // Don't save submission_deadline in manual save
          publishFormData.instructions
        )
      } else if (draftFormId) {
        // Update existing draft - only save form structure
        result = await updateFormDraft(
          draftFormId,
          formTitle.trim(),
          fields,
          null, // Don't save client_id in manual save
          null, // Don't save project_id in manual save
          undefined, // Don't save notify_on_submission in manual save
          null, // Don't save submission_deadline in manual save
          publishFormData.instructions
        )
      } else {
        // Create new form - only save form structure
        result = await saveFormDraft(
          formTitle.trim(),
          fields,
          null, // Don't save client_id in manual save
          null, // Don't save project_id in manual save
          undefined, // Don't save notify_on_submission in manual save
          null, // Don't save submission_deadline in manual save
          publishFormData.instructions
        )
        
        // Store the draft ID for future auto-saves
        if (result.success && result.data) {
          setDraftFormId(result.data.id)
        }
      }

      if (result.success) {
        setLastSaved(new Date())
        toast.success("Draft saved successfully!")
      }
      
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return
    
    setIsSaving(true)
    try {
      const result = await saveFormTemplate(
        templateName,
        "", // Empty description since we removed the field
        formTitle,
        fields
      )

      if (result.success) {
        setShowSaveTemplate(false)
        setTemplateName("")
        setTemplateDescription("")
      }
      
    } catch (error) {
      console.error("Error saving template:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!publishFormData.title.trim()) {
      toast.error("Please enter a form title")
      return
    }
    
    setIsPublishing(true)
    try {
      let result
      
      if (editingFormId) {
        // Update and publish existing form
        result = await updateAndPublishForm(editingFormId, publishFormData, fields)
      } else if (draftFormId) {
        // Update and publish existing draft
        result = await updateAndPublishForm(draftFormId, publishFormData, fields)
      } else {
        // Create and publish new form
        result = await publishForm(publishFormData, fields)
      }

      if (result.success) {
        setShowPublishModal(false)
        // TODO: Redirect to forms page or show form URL
      }
      
    } catch (error) {
      console.error("Error publishing form:", error)
    } finally {
      setIsPublishing(false)
    }
  }

  const handleClientChange = async (clientId: string) => {
    setPublishFormData(prev => ({ ...prev, clientId, projectId: "" }))
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

  // Auto-save function
  const autoSave = async () => {
    // Don't save if no title or if title is just whitespace
    if (!formTitle.trim()) return
    
    // Don't save if form is not initialized
    if (!isFormInitialized) {
      console.log("Auto-save skipped: Form not initialized yet")
      return
    }
    
    console.log("Auto-save triggered:", { 
      formTitle: formTitle.trim(), 
      fieldsCount: fields.length, 
      editingFormId, 
      draftFormId,
      isFormInitialized 
    })
    
    setIsAutoSaving(true)
    try {
      let result
      
      if (editingFormId) {
        // Update existing form (edit mode) - only save form structure
        console.log("Auto-save: Updating existing form", editingFormId)
        result = await updateFormDraft(
          editingFormId,
          formTitle.trim(),
          fields,
          null, // Don't save client_id in auto-save
          null, // Don't save project_id in auto-save
          undefined, // Don't save notify_on_submission in auto-save
          null, // Don't save submission_deadline in auto-save
          publishFormData.instructions,
          true // silent for auto-save
        )
      } else if (draftFormId) {
        // Update existing draft - only save form structure
        console.log("Auto-save: Updating existing draft", draftFormId)
        result = await updateFormDraft(
          draftFormId,
          formTitle.trim(),
          fields,
          null, // Don't save client_id in auto-save
          null, // Don't save project_id in auto-save
          undefined, // Don't save notify_on_submission in auto-save
          null, // Don't save submission_deadline in auto-save
          publishFormData.instructions,
          true // silent for auto-save
        )
      } else {
        // Create new draft only if we don't have one AND have a proper title
        console.log("Auto-save: Creating new draft")
        result = await saveFormDraft(
          formTitle.trim(),
          fields,
          null, // Don't save client_id in auto-save
          null, // Don't save project_id in auto-save
          undefined, // Don't save notify_on_submission in auto-save
          null, // Don't save submission_deadline in auto-save
          publishFormData.instructions,
          true // silent for auto-save
        )
        
        // Store the draft ID for future auto-saves
        if (result.success && result.data) {
          setDraftFormId(result.data.id)
          console.log("Auto-save: New draft created", result.data.id)
        }
      }

      if (result.success) {
        setLastSaved(new Date())
        console.log("Auto-save: Success")
      }
      
    } catch (error) {
      console.error("Error auto-saving:", error)
      // Don't show toast for auto-save errors to avoid spam
    } finally {
      setIsAutoSaving(false)
    }
  }

  // Debounced auto-save
  const debouncedAutoSave = () => {
    // Clear existing timeout
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout)
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      autoSave()
    }, 2000) // Wait 2 seconds after user stops typing
    
    setAutoSaveTimeout(timeout)
  }

  // Auto-save when form title, description, or fields change
  useEffect(() => {
    // Only auto-save if form is initialized and we have a proper title
    if (isFormInitialized && formTitle.trim()) {
      debouncedAutoSave()
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [formTitle, publishFormData.instructions, fields, isFormInitialized])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout)
      }
    }
  }, [])

  // Global drag end handler to reset drag state
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedField(null)
    }

    document.addEventListener('dragend', handleGlobalDragEnd)
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
    }
  }, [])

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard/forms" className="text-gray-600 hover:text-gray-900">
                      Forms
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-900 font-medium">{formTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center text-sm text-gray-500">
                {isAutoSaving ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                    All changes saved
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                <Save className="h-4 w-4 mr-2" />
                Save Draft
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
              <Button 
                className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90" 
                size="sm"
                onClick={() => {
                  setPublishFormData(prev => ({ ...prev, title: formTitle }))
                  setShowPublishModal(true)
                  toast.info("Configure your form settings before publishing")
                }}
              >
                <Rocket className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Field Library */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Field</h2>

              {/* Basic Fields */}
              <div className="space-y-2 mb-6">
                {basicFields.map((field) => {
                  const Icon = field.icon
                  return (
                    <Card
                      key={field.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/json', JSON.stringify(field))
                        e.dataTransfer.effectAllowed = 'copy'
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{field.name}</div>
                            <div className="text-sm text-gray-500">{field.description}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Advanced Fields Toggle */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between p-0 h-auto text-gray-700 hover:text-gray-900"
                >
                  <span className="font-medium">Advanced Fields</span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
                </Button>
              </div>

              {/* Advanced Fields */}
              {showAdvanced && (
                <div className="space-y-2">
                  {advancedFields.map((field) => {
                    const Icon = field.icon
                    return (
                      <Card
                        key={field.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/json', JSON.stringify(field))
                          e.dataTransfer.effectAllowed = 'copy'
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{field.name}</div>
                              <div className="text-sm text-gray-500">{field.description}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center - Form Canvas */}
          <div 
            className={cn(
              "flex-1 overflow-y-auto bg-white transition-colors duration-200",
              isDragOver && "bg-blue-50"
            )}
            onDragOver={(e) => {
              e.preventDefault()
              e.dataTransfer.dropEffect = 'copy'
              setIsDragOver(true)
              
              // Auto-scroll functionality
              const container = e.currentTarget
              const rect = container.getBoundingClientRect()
              const scrollSpeed = 15
              const scrollThreshold = 100
              
              // Scroll down when near bottom
              if (rect.bottom - e.clientY < scrollThreshold) {
                container.scrollTop += scrollSpeed
              }
              // Scroll up when near top
              else if (e.clientY - rect.top < scrollThreshold) {
                container.scrollTop -= scrollSpeed
              }
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              setIsDragOver(false)
            }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragOver(false)
              
              try {
                const jsonData = e.dataTransfer.getData('application/json')
                if (jsonData) {
                  const fieldData = JSON.parse(jsonData)
                  console.log('Adding field from library:', fieldData)
                  
                  // If no fields exist, just add to the end
                  if (fields.length === 0) {
                    const newField: FormField = {
                      id: `field-${Date.now()}`,
                      type: fieldData.id,
                      label: fieldData.name,
                      required: false,
                      placeholder: `Enter ${fieldData.name.toLowerCase()}...`,
                      options:
                        fieldData.id === "dropdown" || fieldData.id === "multiple-choice" || fieldData.id === "checkbox"
                          ? ["Option 1", "Option 2", "Option 3"]
                          : undefined,
                    }
                    setFields([newField])
                    console.log('Added first field to empty canvas')
                    return
                  }
                  
                  // Calculate drop position for populated canvas
                  const canvasRect = e.currentTarget.getBoundingClientRect()
                  const dropY = e.clientY - canvasRect.top
                  const scrollTop = e.currentTarget.scrollTop
                  const actualDropY = dropY + scrollTop
                  
                  // Find the best insertion position based on drop location
                  let insertIndex = fields.length // Default to end
                  
                  // Get all field elements
                  const fieldElements = e.currentTarget.querySelectorAll('[data-field-id]')
                  let bestIndex = fields.length
                  
                  fieldElements.forEach((element, index) => {
                    const elementRect = element.getBoundingClientRect()
                    const elementTop = elementRect.top - canvasRect.top + scrollTop
                    
                    // If drop is above the middle of this field, insert before it
                    if (actualDropY < elementTop + elementRect.height / 2) {
                      bestIndex = Math.min(bestIndex, index)
                    }
                  })
                  
                  insertIndex = bestIndex
                  
                  // Create new field
                  const newField: FormField = {
                    id: `field-${Date.now()}`,
                    type: fieldData.id,
                    label: fieldData.name,
                    required: false,
                    placeholder: `Enter ${fieldData.name.toLowerCase()}...`,
                    options:
                      fieldData.id === "dropdown" || fieldData.id === "multiple-choice" || fieldData.id === "checkbox"
                        ? ["Option 1", "Option 2", "Option 3"]
                        : undefined,
                  }
                  
                  // Insert at calculated position
                  setFields(prev => {
                    const newFields = [...prev]
                    newFields.splice(insertIndex, 0, newField)
                    return newFields
                  })
                  
                  // Don't automatically open settings panel - let user choose
                  console.log(`Inserted field at position ${insertIndex}`)
                }
              } catch (error) {
                console.error('Error parsing dropped field:', error)
              }
            }}
          >
            <div className="max-w-2xl mx-auto p-8">
              {/* Form Header - Styled like preview */}
              <div className="text-center mb-8 pb-6 border-b border-gray-200">
              {/* Form Title */}
                <div className="mb-4">
                  <h1 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setFormTitle(e.currentTarget.textContent || "Untitled Form")}
                    className="text-3xl font-bold text-gray-900 text-center outline-none focus:ring-0 bg-transparent min-h-[2.5rem] flex items-center justify-center"
                    style={{ minHeight: '2.5rem' }}
                  >
                    {formTitle || "Enter form title..."}
                  </h1>
                </div>
                
                {/* Form Description/Instructions */}
                <div className="mb-2">
                  <Textarea
                    value={publishFormData.instructions}
                    onChange={(e) => setPublishFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    className="text-gray-600 border-none p-0 focus-visible:ring-0 bg-transparent text-center resize-none placeholder-gray-400"
                    placeholder="Add instructions for respondents..."
                    rows={2}
                  />
                </div>
                
                {/* Helper text */}
                <p className="text-sm text-gray-500">Please fill out the form below</p>
              </div>

              {/* Form Fields */}
              {fields.length === 0 ? (
                <div 
                  className={cn(
                    "text-center py-16 border-2 border-dashed rounded-lg transition-colors duration-200",
                    isDragOver 
                      ? "border-blue-400 bg-blue-50" 
                      : "border-gray-300"
                  )}
                >
                  <div className={cn(
                    "mb-2 transition-colors duration-200",
                    isDragOver ? "text-blue-600" : "text-gray-500"
                  )}>
                    {isDragOver ? "Drop field here" : "Start building your form by adding fields on the left"}
                  </div>
                  <div className="text-sm text-gray-400">Drag and drop fields from the left sidebar</div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDndDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {fields.map((field, index) => {
                        const isSelected = selectedField === field.id
                        return (
                          <SortableField
                            key={field.id}
                            field={field}
                            index={index}
                            onUpdate={updateField}
                            onDelete={deleteField}
                            onSelect={setSelectedField}
                            isSelected={isSelected}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Right Sidebar - Field Settings */}
          {selectedFieldData && (
            <div className="fixed right-0 top-0 w-80 h-screen bg-white border-l border-gray-200 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Field Settings</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedField(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Field Label */}
                  <div>
                    <Label htmlFor="field-label" className="text-sm font-medium text-gray-700 mb-2 block">
                      Field Label
                    </Label>
                    <Input
                      id="field-label"
                      value={selectedFieldData.label}
                      onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                      placeholder="Enter field label"
                    />
                  </div>

                  {/* Field Description */}
                  <div>
                    <Label htmlFor="field-description" className="text-sm font-medium text-gray-700 mb-2 block">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="field-description"
                      value={selectedFieldData.description || ""}
                      onChange={(e) => updateField(selectedFieldData.id, { description: e.target.value })}
                      placeholder="Add helpful text for this field"
                      rows={3}
                    />
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Required Field</Label>
                      <div className="text-xs text-gray-500 mt-1">Users must fill this field</div>
                    </div>
                    <Switch
                      checked={selectedFieldData.required}
                      onCheckedChange={(checked) => updateField(selectedFieldData.id, { required: checked })}
                    />
                  </div>

                  {/* Placeholder Text */}
                  {(selectedFieldData.type === "short-text" || selectedFieldData.type === "paragraph") && (
                    <div>
                      <Label htmlFor="field-placeholder" className="text-sm font-medium text-gray-700 mb-2 block">
                        Placeholder Text
                      </Label>
                      <Input
                        id="field-placeholder"
                        value={selectedFieldData.placeholder || ""}
                        onChange={(e) => updateField(selectedFieldData.id, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  {/* Options for dropdown/multiple choice/checkbox */}
                  {(selectedFieldData.type === "dropdown" ||
                    selectedFieldData.type === "multiple-choice" ||
                    selectedFieldData.type === "checkbox") && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Options</Label>
                      <div className="space-y-2">
                        {selectedFieldData.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(selectedFieldData.options || [])]
                                newOptions[index] = e.target.value
                                updateField(selectedFieldData.id, { options: newOptions })
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOptions = selectedFieldData.options?.filter((_, i) => i !== index)
                                updateField(selectedFieldData.id, { options: newOptions })
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [
                              ...(selectedFieldData.options || []),
                              `Option ${(selectedFieldData.options?.length || 0) + 1}`,
                            ]
                            updateField(selectedFieldData.id, { options: newOptions })
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Footer */}
        <div className="md:hidden border-t bg-white p-4">
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
              <Rocket className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Form Preview</DialogTitle>
            <div className="text-sm text-gray-600">This is how your form will appear to users</div>
          </DialogHeader>
          <div className="py-6">
            {/* Form Header */}
            <div className="text-center mb-8 pb-6 border-b border-gray-200">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{formTitle}</h1>
              {publishFormData.instructions && (
                <p className="text-gray-600 mb-2">{publishFormData.instructions}</p>
              )}
              <p className="text-gray-600">Please fill out the form below</p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {fields.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Type className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fields added yet</h3>
                  <p className="text-gray-600">Add some fields to your form to see them here</p>
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
                          <Textarea 
                            placeholder={field.placeholder} 
                            rows={4}
                            className="max-w-md resize-none"
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
                            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                            <div className="text-sm font-medium text-gray-700 mb-2">Click to upload or drag and drop</div>
                            <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                          </div>
                        )}
                        
                        {field.type === "signature" && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                            <PenTool className="h-10 w-10 text-gray-400 mx-auto mb-4" />
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
        </DialogContent>
      </Dialog>

      {/* Save as Template Modal */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save This Form as a Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name" className="text-sm font-medium text-gray-700 mb-2 block">
                Template Name *
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Client Onboarding Template"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsTemplate}
              disabled={!templateName.trim() || isSaving}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish Form Modal */}
      <Dialog open={showPublishModal} onOpenChange={setShowPublishModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Publish Your Form</DialogTitle>
            <div className="text-sm text-gray-600">Configure your form settings before publishing</div>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Form Title */}
            <div>
              <Label htmlFor="publish-title" className="text-sm font-medium text-gray-700 mb-2 block">
                Form Title *
              </Label>
              <Input
                id="publish-title"
                value={publishFormData.title}
                onChange={(e) => setPublishFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter form title"
              />
            </div>

            {/* Client and Project Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Link to Client & Project</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="publish-client" className="text-sm font-medium text-gray-700 mb-2 block">
                    Client (Optional)
                  </Label>
                  <Select value={publishFormData.clientId} onValueChange={handleClientChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client"} />
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

                <div>
                  <Label htmlFor="publish-project" className="text-sm font-medium text-gray-700 mb-2 block">
                    Project (Optional)
                  </Label>
                  <Select 
                    value={publishFormData.projectId} 
                    onValueChange={(projectId) => setPublishFormData(prev => ({ ...prev, projectId }))}
                    disabled={publishFormData.clientId === "none" || publishFormData.clientId === ""}
                  >
                    <SelectTrigger className={cn(
                      "w-full",
                      (publishFormData.clientId === "none" || publishFormData.clientId === "") && "opacity-50 cursor-not-allowed"
                    )}>
                      <SelectValue placeholder={
                        publishFormData.clientId === "none" || publishFormData.clientId === ""
                          ? "Select a client first" 
                          : loadingProjects
                            ? "Loading projects..."
                            : availableProjects.length === 0 
                              ? "No projects for this client" 
                              : "Select a project"
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
                  {publishFormData.clientId === "none" || publishFormData.clientId === "" ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Select a client first to see available projects
                    </p>
                  ) : loadingProjects ? (
                    <p className="text-sm text-gray-500 mt-1">
                      Loading projects...
                    </p>
                  ) : availableProjects.length === 0 && publishFormData.clientId !== "none" ? (
                    <p className="text-sm text-gray-500 mt-1">
                      No projects found for this client
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Access Level */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Access Level</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    publishFormData.accessLevel === 'public' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPublishFormData(prev => ({ ...prev, accessLevel: 'public' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Public</span>
                  </div>
                  <p className="text-sm text-gray-600">Anyone with the link can access</p>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    publishFormData.accessLevel === 'client' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPublishFormData(prev => ({ ...prev, accessLevel: 'client' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <UserCheck className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Client Only</span>
                  </div>
                  <p className="text-sm text-gray-600">Only linked clients can access</p>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    publishFormData.accessLevel === 'team' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPublishFormData(prev => ({ ...prev, accessLevel: 'team' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Team Only</span>
                  </div>
                  <p className="text-sm text-gray-600">Only your team can access</p>
                </div>
                
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    publishFormData.accessLevel === 'private' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setPublishFormData(prev => ({ ...prev, accessLevel: 'private' }))}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Lock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Private</span>
                  </div>
                  <p className="text-sm text-gray-600">Only you can access</p>
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                <p className="text-sm text-gray-600">Get notified when clients submit responses</p>
              </div>
              <Switch
                checked={publishFormData.notifyOnSubmission}
                onCheckedChange={(checked) => setPublishFormData(prev => ({ ...prev, notifyOnSubmission: checked }))}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
            </div>

            {/* Submission Deadline */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Submission Deadline (Optional)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !publishFormData.submissionDeadline && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {publishFormData.submissionDeadline ? 
                      format(publishFormData.submissionDeadline, "PPP") : 
                      "Select deadline (optional)"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={publishFormData.submissionDeadline || undefined}
                    onSelect={(date: Date | undefined) => setPublishFormData(prev => ({ ...prev, submissionDeadline: date || null }))}
                    disabled={(date: Date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPublishModal(false)} disabled={isPublishing}>
              Cancel
            </Button>
            <Button 
              onClick={handlePublish}
              disabled={!publishFormData.title.trim() || isPublishing}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Publish Form
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
