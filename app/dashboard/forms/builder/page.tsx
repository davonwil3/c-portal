"use client"

export const dynamic = 'force-dynamic'

import type React from "react"

import { useState, useEffect } from "react"

// Import Google Font for signature
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link)
  }
}
import { useSearchParams, useRouter } from "next/navigation"
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
  ArrowLeft,
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
  Package,
  ImageIcon,
  Building2,
  DollarSign,
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
import { getCurrentAccount, type Account } from "@/lib/auth"
import { toast } from "sonner"
import Image from "next/image"
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

// Phone number formatting helper
const formatPhoneNumber = (value: string) => {
  const cleaned = value.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/)
  if (match) {
    let formatted = ''
    if (match[1]) formatted = `(${match[1]}`
    if (match[2]) formatted += `)-${match[2]}`
    if (match[3]) formatted += `-${match[3]}`
    return formatted
  }
  return value
}

// Format date for display
const formatDateDisplay = (dateString: string) => {
  if (!dateString) return new Date().toLocaleDateString()
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// Parse freeform date text to ISO (YYYY-MM-DD). Returns null if invalid
const parseDateTextToISO = (text: string): string | null => {
  const cleaned = text.trim()
  if (!cleaned) return null
  // Try native Date
  const d1 = new Date(cleaned)
  if (!Number.isNaN(d1.getTime())) {
    return d1.toISOString().split('T')[0]
  }
  // Try YYYY-MM-DD
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`)
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  // Try M/D/YYYY or MM/DD/YYYY
  const mdY = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/)
  if (mdY) {
    const mm = mdY[1].padStart(2, '0')
    const dd = mdY[2].padStart(2, '0')
    const yyyy = mdY[3]
    const d = new Date(`${yyyy}-${mm}-${dd}`)
    if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0]
  }
  return null
}

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
  { id: "rating", name: "Rating", icon: Star, description: "Star or number rating" },
  { id: "budget", name: "Budget", icon: DollarSign, description: "Currency amount input" },
]

const getFieldIcon = (type: string) => {
  const allFields = [...basicFields]
  const field = allFields.find((f) => f.id === type)
  return field?.icon || Type
}

// Sortable Field Component - Professional Form Style
function SortableField({ field, index, onUpdate, onDelete, onSelect, isSelected, builderValue, onBuilderValueChange }: {
  field: FormField
  index: number
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onDelete: (fieldId: string) => void
  onSelect: (fieldId: string) => void
  isSelected: boolean
  builderValue?: any
  onBuilderValueChange?: (value: any) => void
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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group transition-all",
        isSelected && "ring-2 ring-blue-500 ring-offset-2",
        isDragging && "opacity-50"
      )}
      data-field-id={field.id}
    >
      {/* Professional Form Field */}
      <div className="space-y-2">
        {/* Field Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-900">
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate(field.id, { label: e.target.value })}
                onClick={(e) => e.stopPropagation()}
                className="border-none p-0 focus:outline-none focus:ring-0 bg-transparent placeholder-gray-400 font-medium"
                placeholder="Enter field label..."
              />
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
          </div>

          {/* Field Controls - Hidden by default, shown on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
            <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-gray-100 rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelect(field.id)
                    }}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

        {/* Field Description */}
            {field.description && (
          <p className="text-sm text-gray-600">
                    <textarea
                      value={field.description}
                      onChange={(e) => onUpdate(field.id, { description: e.target.value })}
                      onClick={(e) => e.stopPropagation()}
              className="w-full border-none p-0 focus:outline-none focus:ring-0 bg-transparent resize-none placeholder-gray-400"
                      placeholder="Add description (optional)..."
                      rows={1}
                    />
          </p>
                )}

        {/* Professional Form Input */}
        <div className="mt-2">
                  {field.type === "short-text" && (
                    <input 
                      type="text" 
                      placeholder={field.placeholder || "Enter text..."} 
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
                    />
                  )}
                  
              {field.type === "paragraph" && (
                    <textarea 
              placeholder={field.placeholder || "Enter your response..."} 
                      rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
                    />
                  )}
                  
                  {field.type === "email" && (
                    <input 
                      type="email" 
                      placeholder="Enter email address..." 
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
                    />
                  )}
                  
                  {field.type === "phone" && (
                    <input 
                      type="tel" 
                      placeholder="Enter phone number..." 
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
                    />
                  )}
                  
                  {field.type === "budget" && (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                        {(field as any).currency === 'EUR' ? '€' : '$'}
                      </span>
                      <input 
                        type="text" 
                        placeholder="0.00" 
                        className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        disabled
                      />
                    </div>
                  )}
                  
                  {field.type === "date" && (
                    <input 
                      type="date" 
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              disabled
            />
          )}
          
          {field.type === "dropdown" && field.options && (
            <select 
              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">Select an option</option>
                    {field.options.map((option, idx) => (
                <option key={idx} value={option}>{option}</option>
              ))}
            </select>
          )}
          
          {field.type === "multiple-choice" && field.options && (
            <div className="space-y-3">
              {field.options.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="radio" 
                    name={`field-${field.id}`} 
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                    disabled
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
                              </div>
                            )}
          
          {field.type === "checkbox" && field.options && (
            <div className="space-y-3">
              {field.options.map((option, idx) => (
                <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                            <input
                    type="checkbox" 
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                    disabled
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
                  </div>
                )}
                  
              {field.type === "file-upload" && (
            <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</div>
                      <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                </div>
              )}
                  
                  {field.type === "signature" && (
                    <div className="space-y-3 max-w-md">
                      <div className="border-2 border-gray-200 rounded-md p-3 bg-gray-50">
                        {!builderValue ? (
                          <div className="text-center py-2">
                            <PenTool className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                            <div className="text-sm text-gray-600">Type your full legal name below</div>
                          </div>
                        ) : (
                          <div className="text-center py-2">
                            <div 
                              className="text-2xl md:text-3xl text-gray-900"
                              style={{ fontFamily: "'Dancing Script', cursive", lineHeight: 1.15 }}
                            >
                              {builderValue}
                            </div>
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder="Type your full legal name"
                        value={builderValue || ''}
                        onChange={(e) => onBuilderValueChange?.(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                      <p className="text-xs text-gray-500">
                        By typing your name above, you agree that this constitutes a legal signature
                      </p>
            </div>
                  )}
                  
                  {field.type === "rating" && (
            <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-5 w-5 text-gray-300 cursor-pointer" />
                      ))}
              <span className="ml-3 text-sm text-gray-500">Rate from 1 to 5</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
  )
}

export default function FormBuilderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formTitle, setFormTitle] = useState("Untitled Form")
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [previewValues, setPreviewValues] = useState<Record<string, any>>({})
  const [builderValues, setBuilderValues] = useState<Record<string, any>>({})
  const [brandColor, setBrandColor] = useState<string>("#3C3CFF")
  const [formDate, setFormDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [footerLine1, setFooterLine1] = useState<string>(
    "Thank you for taking the time to complete this form."
  )
  const [footerLine2, setFooterLine2] = useState<string>(
    "We will review your submission and get back to you soon."
  )
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
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("Your Company Name")
  const [companyAddress, setCompanyAddress] = useState("123 Business Street, City, State 12345")
  const [companyPhone, setCompanyPhone] = useState("(555) 123-4567")
  const [companyEmail, setCompanyEmail] = useState("contact@yourcompany.com")
  const [isFormInitialized, setIsFormInitialized] = useState(false) // Track if form data is loaded
  const [account, setAccount] = useState<Account | null>(null) // Track user account
  const [isFromProjectDetails, setIsFromProjectDetails] = useState(false) // Track if form was opened from project details page

  // Load account data and pre-populate company information
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const userAccount = await getCurrentAccount()
        if (userAccount) {
          setAccount(userAccount)
          // Only set default values if form is not being edited and not initialized
          if (!isFormInitialized && !searchParams.get('edit')) {
            // Pre-load from account data, or use defaults if not available
            setCompanyName(userAccount.company_name || "Your Company Name")
            setCompanyAddress(userAccount.address || "123 Business Street, City, State 12345")
            setCompanyPhone(userAccount.phone || "(555) 123-4567")
            setCompanyEmail(userAccount.email || "contact@yourcompany.com")
            if (userAccount.logo_url) {
              setLogoUrl(userAccount.logo_url)
            }
          }
        } else {
          // If no account data, use dummy defaults
          if (!isFormInitialized && !searchParams.get('edit')) {
            setCompanyName("Your Company Name")
            setCompanyAddress("123 Business Street, City, State 12345")
            setCompanyPhone("(555) 123-4567")
            setCompanyEmail("contact@yourcompany.com")
          }
        }
      } catch (error) {
        console.error('Error loading account data:', error)
        // On error, use dummy defaults
        if (!isFormInitialized && !searchParams.get('edit')) {
          setCompanyName("Your Company Name")
          setCompanyAddress("123 Business Street, City, State 12345")
          setCompanyPhone("(555) 123-4567")
          setCompanyEmail("contact@yourcompany.com")
        }
      }
    }
    loadAccountData()
  }, []) // Only run on mount

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
    const templateData = searchParams.get('template')
    
    // Reset initialization flag
    setIsFormInitialized(false)
    
    if (editData) {
      try {
        const formData = JSON.parse(decodeURIComponent(editData))
        setFormTitle(formData.title || "Untitled Form")
        setFields(formData.fields || [])
        setEditingFormId(formData.id) // Set the form ID for editing
        setDraftFormId(formData.id) // Also set as draft ID for auto-save
        
        // Load company info from form_structure if available
        if (formData.form_structure) {
          if (formData.form_structure.brand_color) setBrandColor(formData.form_structure.brand_color)
          if (formData.form_structure.logo_url) setLogoUrl(formData.form_structure.logo_url)
          if (formData.form_structure.company_name) setCompanyName(formData.form_structure.company_name)
          if (formData.form_structure.company_address) setCompanyAddress(formData.form_structure.company_address)
          if (formData.form_structure.company_phone) setCompanyPhone(formData.form_structure.company_phone)
          if (formData.form_structure.company_email) setCompanyEmail(formData.form_structure.company_email)
          if (formData.form_structure.form_date) setFormDate(formData.form_structure.form_date)
          if (formData.form_structure.footer_line1) setFooterLine1(formData.form_structure.footer_line1)
          if (formData.form_structure.footer_line2) setFooterLine2(formData.form_structure.footer_line2)
        }
        
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
    } else if (templateData) {
      try {
        const template = JSON.parse(decodeURIComponent(templateData))
        console.log('Loading template:', template)
        setFormTitle(template.title || "Untitled Form")
        setFields(template.fields || [])
        
        // Set publish form data from template
        setPublishFormData(prev => ({
          ...prev,
          title: template.title || "",
          description: template.instructions || "",
          instructions: template.instructions || "",
          clientId: template.client_id || "",
          projectId: template.project_id || "",
        }))
        
        toast.success(`Template "${template.title}" loaded successfully`)
        
        // Small delay to ensure all state is set before allowing auto-save
        setTimeout(() => setIsFormInitialized(true), 100)
      } catch (error) {
        console.error("Error parsing template data:", error)
        toast.error("Failed to load template")
        setTimeout(() => setIsFormInitialized(true), 100)
      }
    } else if (title) {
      setFormTitle(title)
      setTimeout(() => setIsFormInitialized(true), 100)
    } else {
      // Check if we came from project details page with client_id and project_id
      const clientIdFromUrl = searchParams.get('client_id')
      const projectIdFromUrl = searchParams.get('project_id')
      
      if (clientIdFromUrl && projectIdFromUrl) {
        setIsFromProjectDetails(true)
        setPublishFormData(prev => ({
          ...prev,
          clientId: clientIdFromUrl,
          projectId: projectIdFromUrl,
        }))
      }
      
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

  // Load projects when client is selected in publish modal (for new forms) or when coming from project details
  useEffect(() => {
    const loadProjects = async () => {
      if (!publishFormData.clientId || publishFormData.clientId === "none") return 
      
      // Load projects if we're in publish modal OR if we came from project details page
      if (!showPublishModal && !isFromProjectDetails) return
      
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
  }, [publishFormData.clientId, showPublishModal, isFromProjectDetails])

  // Load clients when coming from project details page
  useEffect(() => {
    const loadClientsForProjectDetails = async () => {
      if (!isFromProjectDetails || !publishFormData.clientId) return
      
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

    loadClientsForProjectDetails()
  }, [isFromProjectDetails, publishFormData.clientId])

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
    const allFields = [...basicFields]
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
          publishFormData.instructions,
          false, // not silent
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
          publishFormData.instructions,
          false, // not silent
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
          publishFormData.instructions,
          false, // not silent
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
        result = await updateAndPublishForm(editingFormId, publishFormData, fields, brandColor, logoUrl, companyName, companyAddress, companyPhone, companyEmail, formDate, footerLine1, footerLine2)
      } else if (draftFormId) {
        // Update and publish existing draft
        result = await updateAndPublishForm(draftFormId, publishFormData, fields, brandColor, logoUrl, companyName, companyAddress, companyPhone, companyEmail, formDate, footerLine1, footerLine2)
      } else {
        // Create and publish new form
        result = await publishForm(publishFormData, fields, brandColor, logoUrl, companyName, companyAddress, companyPhone, companyEmail, formDate, footerLine1, footerLine2)
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
          true, // silent for auto-save
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
          true, // silent for auto-save
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
          true, // silent for auto-save
          brandColor,
          logoUrl,
          companyName,
          companyAddress,
          companyPhone,
          companyEmail,
          formDate,
          footerLine1,
          footerLine2
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const returnTo = searchParams.get('return_to')
                  const projectUrl = searchParams.get('project_url')
                  const leadsUrl = searchParams.get('leads_url')
                  
                  if (returnTo === 'project' && projectUrl) {
                    router.push(decodeURIComponent(projectUrl))
                  } else if (returnTo === 'leads' && leadsUrl) {
                    router.push(decodeURIComponent(leadsUrl))
                  } else {
                    // Default fallback
                    router.push('/dashboard/lead-workflow?active=forms')
                  }
                }}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>

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
              <Button 
                data-help="btn-preview-form"
                variant="outline" 
                size="sm" 
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button 
                data-help="btn-save-template"
                variant="outline" 
                size="sm" 
                onClick={() => setShowSaveTemplate(true)}
              >
                <Zap className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
              <Button 
                data-help="btn-publish-form"
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
          <div data-help="field-library" className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Field</h2>

              {/* Brand Color */}
              <div className="mb-6 p-3 bg-white rounded-lg border border-gray-200">
                <label className="text-sm font-medium text-gray-700 block mb-2">Brand Color</label>
                        <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="h-9 w-9 rounded cursor-pointer border border-gray-200"
                    aria-label="Pick brand color"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="flex-1 h-9 px-3 rounded-md border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="#3C3CFF"
                  />
                          </div>
                <div className="mt-3 flex items-center text-xs text-gray-500">
                  <span className="mr-2">Preview:</span>
                  <span className="inline-block h-1 w-12 rounded" style={{ backgroundColor: brandColor }}></span>
                          </div>
              </div>

              {/* Basic Fields */}
              <div data-help="field-types-list" className="space-y-2 mb-6">
                {basicFields.map((field) => {
                    const Icon = field.icon
                    return (
                      <Card
                        key={field.id}
                        data-help={`field-type-${field.id}`}
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

            </div>
          </div>

          {/* Center - Form Canvas */}
          <div 
            data-help="form-canvas"
            className={cn(
              "flex-1 overflow-y-auto bg-white transition-colors duration-200 p-8",
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
            {/* Professional Form Document */}
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  {/* Logo and Company Info */}
                  <div className="flex items-start space-x-6">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      {logoUrl ? (
                        <div className="relative group">
                          <img 
                            src={logoUrl} 
                            alt="Company Logo" 
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                               onClick={() => {
                                 const input = document.createElement('input')
                                 input.type = 'file'
                                 input.accept = 'image/*'
                                 input.onchange = (e) => {
                                   const file = (e.target as HTMLInputElement).files?.[0]
                                   if (file) {
                                     const reader = new FileReader()
                                     reader.onload = (e) => setLogoUrl(e.target?.result as string)
                                     reader.readAsDataURL(file)
                                   }
                                 }
                                 input.click()
                               }}>
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div 
                          className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (e) => setLogoUrl(e.target?.result as string)
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                        >
                          <ImageIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* Company Details */}
                    <div className="flex-1">
                      <h2 
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setCompanyName(e.currentTarget.textContent || "Your Company Name")}
                        className="text-xl font-bold text-gray-900 outline-none focus:ring-0 bg-transparent mb-1 hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                        title="Click to edit company name"
                      >
                        {companyName}
                      </h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p 
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => setCompanyAddress(e.currentTarget.textContent || "123 Business Street, City, State 12345")}
                          className="outline-none focus:ring-0 bg-transparent hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                          title="Click to edit company address"
                        >
                          {companyAddress}
                        </p>
                        <div className="flex space-x-4">
                          <span 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setCompanyPhone(e.currentTarget.textContent || "(555) 123-4567")}
                            className="outline-none focus:ring-0 bg-transparent hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                            title="Click to edit company phone"
                          >
                            {companyPhone}
                          </span>
                          <span 
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setCompanyEmail(e.currentTarget.textContent || "contact@yourcompany.com")}
                            className="outline-none focus:ring-0 bg-transparent hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                            title="Click to edit company email"
                          >
                            {companyEmail}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Date */}
                  <div className="text-right text-sm">
                    <div className="text-gray-500 mb-1">Form Date:</div>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      onBlur={(e) => {
                        const text = (e.currentTarget.textContent || '').trim()
                        const iso = parseDateTextToISO(text)
                        if (iso) {
                          setFormDate(iso)
                          e.currentTarget.textContent = formatDateDisplay(iso)
                        } else {
                          // Revert to current formatted date if parse failed
                          e.currentTarget.textContent = formatDateDisplay(formDate)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          ;(e.currentTarget as HTMLElement).blur()
                        }
                      }}
                      className="font-medium text-gray-900 px-2 py-1 rounded hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 outline-none focus:ring-0 cursor-text select-text text-sm transition-all"
                      aria-label="Form Date"
                      title="Click to edit form date"
                    >
                      {formatDateDisplay(formDate)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="px-8 py-8">
                {/* Form Title and Description */}
                <div className="text-center mb-8">
                  <h1 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setFormTitle(e.currentTarget.textContent || "Untitled Form")}
                    className="text-3xl font-bold text-gray-900 outline-none focus:ring-0 bg-transparent mb-4 hover:bg-gray-50 px-2 py-1 rounded"
                  >
                    {formTitle || "Enter form title..."}
                  </h1>
                
                  <Textarea
                    value={publishFormData.instructions}
                    onChange={(e) => setPublishFormData(prev => ({ ...prev, instructions: e.target.value }))}
                    className="text-gray-600 border-none p-2 focus-visible:ring-0 bg-transparent text-center resize-none placeholder-gray-400 hover:bg-gray-50 rounded max-w-2xl mx-auto"
                    placeholder="Add instructions for respondents..."
                    rows={2}
                  />
                
                  <div className="w-24 h-1 mx-auto rounded-full mt-4" style={{ backgroundColor: brandColor }}></div>
              </div>

              {/* Form Fields */}
                <div className="space-y-6">
              {fields.length === 0 ? (
                <div 
                  className={cn(
                        "text-center py-16 border-2 border-dashed rounded-lg transition-colors duration-200 bg-gray-50",
                    isDragOver 
                      ? "border-blue-400 bg-blue-50" 
                      : "border-gray-300"
                  )}
                >
                      <div className="text-gray-400 mb-4">
                        <Type className="h-12 w-12 mx-auto" />
                  </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your form</h3>
                      <p className="text-gray-600 mb-4">Drag fields from the sidebar to create your professional form</p>
                      <div className="text-sm text-gray-500">
                        💡 Your form will appear here as a professional document
                      </div>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDndDragEnd}
                >
                  <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-6">
                      {fields.map((field, index) => {
                        const isSelected = selectedField === field.id
                        return (
                              <div key={field.id} className="group">
                          <SortableField
                            field={field}
                            index={index}
                            onUpdate={updateField}
                            onDelete={deleteField}
                            onSelect={setSelectedField}
                            isSelected={isSelected}
                            builderValue={builderValues[field.id]}
                            onBuilderValueChange={(value) => setBuilderValues(prev => ({ ...prev, [field.id]: value }))}
                          />
                              </div>
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
                  
                  {/* Form Footer */}
                  {fields.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setFooterLine1(e.currentTarget.textContent || "")}
                            className="outline-none focus:ring-0 bg-transparent hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                            title="Click to edit footer line 1"
                          >
                            {footerLine1}
                          </div>
                          <div
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={(e) => setFooterLine2(e.currentTarget.textContent || "")}
                            className="mt-1 outline-none focus:ring-0 bg-transparent hover:bg-blue-50 hover:ring-1 hover:ring-blue-300 px-1 rounded cursor-text transition-all"
                            title="Click to edit footer line 2"
                          >
                            {footerLine2}
                          </div>
                        </div>
                        <Button className="text-white hover:opacity-90 px-8 py-3 text-lg font-medium" style={{ backgroundColor: brandColor }}>
                          Submit Form
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Field Settings */}
          {selectedFieldData && (
            <>
              <div className="fixed inset-0 bg-transparent z-40" onClick={() => setSelectedField(null)} />
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

                    {/* Currency selector for budget field */}
                    {selectedFieldData.type === "budget" && (
                      <div>
                        <Label htmlFor="field-currency" className="text-sm font-medium text-gray-700 mb-2 block">
                          Currency Type
                        </Label>
                        <Select
                          value={(selectedFieldData as any).currency || 'USD'}
                          onValueChange={(value) => updateField(selectedFieldData.id, { currency: value })}
                        >
                          <SelectTrigger id="field-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
                    )}
                </div>
              </div>
            </div>
              </div>
            </>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Form Preview</DialogTitle>
            <div className="text-sm text-gray-600">This is how your form will appear to users</div>
          </DialogHeader>
          <div className="py-6">
            {/* Professional Form Document Preview */}
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  {/* Logo and Company Info */}
                  <div className="flex items-start space-x-6">
                    {/* Logo */}
                    {logoUrl && (
                      <div className="flex-shrink-0">
                        <img 
                          src={logoUrl} 
                          alt="Company Logo" 
                          className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    
                    {/* Company Details */}
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-1">{companyName}</h2>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{companyAddress}</p>
                        <div className="flex space-x-4">
                          <span>{companyPhone}</span>
                          <span>{companyEmail}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Form Date */}
                  <div className="text-right text-sm">
                    <div className="text-gray-500 mb-1">Form Date:</div>
                    <div className="font-medium text-gray-900">{formatDateDisplay(formDate)}</div>
                  </div>
                </div>
              </div>
              
              {/* Form Content */}
              <div className="px-8 py-8">
                {/* Form Title and Description */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{formTitle}</h1>
              {publishFormData.instructions && (
                    <p className="text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                      {publishFormData.instructions}
                    </p>
              )}
                  <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: brandColor }}></div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {fields.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-gray-400 mb-4">
                    <Type className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fields added yet</h3>
                  <p className="text-gray-600">Add some fields to your form to see them here</p>
                </div>
              ) : (
                    fields.map((field, index) => (
                      <div key={field.id} className="space-y-2">
                      {/* Field Label */}
                        <label className="text-sm font-medium text-gray-900">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                      
                      {/* Field Description */}
                      {field.description && (
                          <p className="text-sm text-gray-600">{field.description}</p>
                      )}
                      
                        {/* Professional Form Input */}
                        <div className="mt-2">
                        {field.type === "short-text" && (
                            <input 
                              type="text" 
                              placeholder={field.placeholder || "Enter text..."} 
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        )}
                        
                        {field.type === "paragraph" && (
                            <textarea 
                              placeholder={field.placeholder || "Enter your response..."} 
                            rows={4}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        )}
                        
                        {field.type === "email" && (
                            <input 
                            type="email" 
                              placeholder="Enter email address..." 
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        )}
                        
                        {field.type === "phone" && (
                            <input 
                            type="tel" 
                              placeholder="(555)-555-5555" 
                              value={previewValues[field.id] || ''}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value)
                                setPreviewValues(prev => ({ ...prev, [field.id]: formatted }))
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        )}
                        
                        {field.type === "budget" && (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                              {(field as any).currency === 'EUR' ? '€' : '$'}
                            </span>
                            <input 
                              type="text" 
                              placeholder="0.00" 
                              value={previewValues[field.id] || ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d.]/g, '')
                                const parts = value.split('.')
                                if (parts.length > 2) return
                                if (parts[1] && parts[1].length > 2) return
                                setPreviewValues(prev => ({ ...prev, [field.id]: value }))
                              }}
                              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                          </div>
                        )}
                        
                        {field.type === "date" && (
                            <input 
                            type="date" 
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        )}
                        
                        {field.type === "dropdown" && field.options && (
                            <select 
                              value={previewValues[field.id] || ''}
                              onChange={(e) => setPreviewValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            >
                            <option value="">Select an option</option>
                            {field.options.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        
                        {field.type === "multiple-choice" && field.options && (
                            <div className="space-y-3">
                            {field.options.map((option, idx) => (
                                <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                                  <input 
                                    type="radio" 
                                    name={`field-${field.id}`} 
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500" 
                                  />
                                <span className="text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === "checkbox" && field.options && (
                            <div className="space-y-3">
                            {field.options.map((option, idx) => (
                                <label key={idx} className="flex items-center space-x-3 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" 
                                  />
                                <span className="text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                        
                        {field.type === "rating" && (
                          <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const isSelected = (previewValues[field.id] || 0) >= star
                                return (
                                  <Star 
                                    key={star} 
                                    className={`h-6 w-6 cursor-pointer transition-colors ${
                                      isSelected ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-400'
                                    }`}
                                    onClick={() => setPreviewValues(prev => ({ ...prev, [field.id]: star }))}
                                  />
                                )
                              })}
                              <span className="ml-3 text-sm text-gray-500">
                                {previewValues[field.id] ? `${previewValues[field.id]} star${previewValues[field.id] > 1 ? 's' : ''}` : 'Rate from 1 to 5'}
                              </span>
                          </div>
                        )}
                        
                        {field.type === "file-upload" && (
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center bg-gray-50 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = '*/*'
                                input.onchange = (e) => {
                                  const file = (e.target as HTMLInputElement).files?.[0]
                                  if (file) {
                                    setPreviewValues(prev => ({ ...prev, [field.id]: file.name }))
                                  }
                                }
                                input.click()
                              }}
                            >
                              {previewValues[field.id] ? (
                                <>
                                  <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                  <div className="text-sm text-gray-900 mb-1 font-medium">{previewValues[field.id]}</div>
                                  <div className="text-xs text-gray-500">Click to change file</div>
                                </>
                              ) : (
                                <>
                                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                  <div className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</div>
                            <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                                </>
                              )}
                          </div>
                        )}
                        
                        {field.type === "signature" && (
                          <div className="space-y-3 max-w-md">
                            <div className="border-2 border-gray-300 rounded-md p-3 bg-white">
                              {!previewValues[field.id] ? (
                                <div className="text-center py-2">
                                  <PenTool className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                                  <div className="text-sm text-gray-600">Type your full legal name below</div>
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <div 
                                    className="text-2xl md:text-3xl text-gray-900"
                                    style={{ fontFamily: "'Dancing Script', cursive", lineHeight: 1.15 }}
                                  >
                                    {previewValues[field.id]}
                                  </div>
                          </div>
                        )}
                      </div>
                            <Input
                              placeholder="Type your full legal name"
                              value={previewValues[field.id] || ''}
                              onChange={(e) => setPreviewValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            />
                            <p className="text-xs text-gray-500 text-center">
                              By typing your name above, you agree that this constitutes a legal signature
                            </p>
                </div>
              )}
            </div>
                </div>
                    ))
              )}

            {/* Form Footer */}
            {fields.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          <div>{footerLine1}</div>
                          <div className="mt-1">{footerLine2}</div>
                        </div>
                        <Button className="text-white hover:opacity-90 px-8 py-3 text-lg font-medium" style={{ backgroundColor: brandColor }}>
                    Submit Form
                  </Button>
                </div>
              </div>
            )}

            {/* Powered by Jolix Footer - Free Plan Only */}
            {account?.plan_tier === 'free' && (
              <div className="pt-10 mt-10 border-t border-gray-100 px-8">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span>Powered by</span>
                  <a
                    href="https://jolix.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors font-medium"
                  >
                    <Image
                      src="/jolixlogo.png"
                      alt="Jolix"
                      width={18}
                      height={18}
                      className="object-contain"
                    />
                    <span>Jolix</span>
                  </a>
                </div>
              </div>
            )}
                </div>
              </div>
            </div>
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
              <h3 className="text-sm font-medium text-gray-900">Form Assignment</h3>
              {isFromProjectDetails && (
                <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  This form is assigned to the project you're currently viewing. Client and project cannot be changed.
                </p>
              )}
              
              {isFromProjectDetails ? (
                // Read-only display when from project details
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Client
                    </Label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      {loadingClients ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-gray-500" />
                          {clients.find(c => c.id === publishFormData.clientId)?.company || 
                           clients.find(c => c.id === publishFormData.clientId) ? 
                           `${clients.find(c => c.id === publishFormData.clientId)?.first_name} ${clients.find(c => c.id === publishFormData.clientId)?.last_name}` : 
                           'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Project
                    </Label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                      {loadingProjects ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-2 text-gray-500" />
                          {availableProjects.find(p => p.id === publishFormData.projectId)?.name || 'Not specified'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Editable dropdowns when not from project details
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Client
                    </Label>
                    <Select
                      value={publishFormData.clientId || "none"}
                      onValueChange={(value) => {
                        setPublishFormData(prev => ({
                          ...prev,
                          clientId: value === "none" ? "" : value,
                          projectId: "" // Reset project when client changes
                        }))
                        setAvailableProjects([])
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No client</SelectItem>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company || `${client.first_name} ${client.last_name}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Project
                    </Label>
                    <Select
                      value={publishFormData.projectId || "none"}
                      onValueChange={(value) => {
                        setPublishFormData(prev => ({
                          ...prev,
                          projectId: value === "none" ? "" : value
                        }))
                      }}
                      disabled={!publishFormData.clientId || publishFormData.clientId === "none"}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {availableProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
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
