"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  MoreVertical,
  Copy,
  Edit,
  Eye,
  Trash2,
  FileText,
  Clipboard,
  Link as LinkIcon,
  Calendar,
  TrendingUp,
  Archive,
  CheckCircle,
  FileEdit,
  ArrowLeft,
  Download,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  Loader2,
  Star,
  Code,
  Check,
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { 
  getLeadForms, 
  getLeadFormsByType, 
  getLeadFormSubmissions,
  updateLeadFormStatus,
  deleteLeadForm,
  updateSubmissionTag,
  type LeadForm,
  type LeadFormSubmission
} from "@/lib/lead-forms"
import { getProjectForms, getFormTemplates, type Form } from "@/lib/forms"
import { FormPreviewModal } from "@/components/forms/form-preview-modal"
import { getCurrentAccount, type Account } from "@/lib/auth"
import { useTour } from "@/contexts/TourContext"
import { dummyTourForms } from "@/lib/tour-dummy-data"

type FormType = "Lead" | "Project"
type FormStatus = "draft" | "published" | "archived"

interface CombinedForm {
  id: string
  name: string
  type: FormType
  linkedProject: string | null
  submissions: number
  status: FormStatus
  embedLink: string
  lastSubmission: string
  rawData: LeadForm | Form
}

export function FormsSection() {
  const router = useRouter()
  const { isTourRunning } = useTour()
  const [forms, setForms] = useState<CombinedForm[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "lead" | "project">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newFormModalOpen, setNewFormModalOpen] = useState(false)
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [showPreMadeTemplates, setShowPreMadeTemplates] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<any>(null)
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<CombinedForm | null>(null)
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false)
  const [submissionsForm, setSubmissionsForm] = useState<CombinedForm | null>(null)
  const [submissions, setSubmissions] = useState<LeadFormSubmission[]>([])
  const [submissionsSort, setSubmissionsSort] = useState<"newest" | "oldest">("newest")
  const [submissionsTagFilter, setSubmissionsTagFilter] = useState<string>("all")
  const [viewingSubmissions, setViewingSubmissions] = useState(false)
  const [viewingForm, setViewingForm] = useState<CombinedForm | null>(null)
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())

  // Tag editor state
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagTargetId, setTagTargetId] = useState<string | null>(null)
  const [selectedTagOption, setSelectedTagOption] = useState<"Qualified" | "Reviewed" | "New" | "Custom">("Qualified")
  const [customTagName, setCustomTagName] = useState("")
  const [customTagColor, setCustomTagColor] = useState("#6366F1")
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [embedModalOpen, setEmbedModalOpen] = useState(false)
  const [embedForm, setEmbedForm] = useState<CombinedForm | null>(null)
  const [embedCodeCopied, setEmbedCodeCopied] = useState(false)

  // New form modal state
  const [newFormName, setNewFormName] = useState("")
  const [newFormType, setNewFormType] = useState<FormType>("Lead")
  const [newFormProject, setNewFormProject] = useState("")

  // Load forms on mount
  useEffect(() => {
    loadForms()
  }, [activeTab, isTourRunning])

  const loadForms = async () => {
    try {
      setLoading(true)

      // Use tour mock data if tour is running
      if (isTourRunning) {
        const tourForms: CombinedForm[] = dummyTourForms.map(form => ({
          id: form.id,
          name: form.name,
          type: form.type as FormType,
          linkedProject: form.projects?.name || null,
          submissions: form.submissions,
          status: (form.published ? "published" : "draft") as FormStatus,
          embedLink: typeof window !== 'undefined' ? `${window.location.origin}/forms/${form.id}` : `/forms/${form.id}`,
          lastSubmission: form.updated_at,
          rawData: form as any,
        }))
        
        // Filter based on active tab
        let filteredTourForms = tourForms
        if (activeTab === 'lead') {
          filteredTourForms = tourForms.filter(f => f.type === 'Lead')
        } else if (activeTab === 'project') {
          filteredTourForms = tourForms.filter(f => f.type === 'Project')
        }
        
        setForms(filteredTourForms)
        setLoading(false)
        return
      }

      // Determine which forms to fetch based on active tab
      let leadForms: LeadForm[] = []
      let projectFormsFromLeadTable: LeadForm[] = []
      let projectFormsFromFormsTable: Form[] = []

      if (activeTab === 'all' || activeTab === 'lead') {
        // Fetch lead forms (form_type = 'Lead' OR project_id IS NULL)
        const allLeadForms = await getLeadFormsByType('all')
        // Filter to only show Lead forms (those without a project_id)
        leadForms = allLeadForms.filter(form => 
          form.form_type === 'Lead' || form.project_id === null
        )
      }

      if (activeTab === 'all' || activeTab === 'project') {
        // Fetch project forms from lead_forms table (form_type = 'Project' with project_id)
        const allLeadForms = await getLeadFormsByType('all')
        projectFormsFromLeadTable = allLeadForms.filter(form => 
          form.form_type === 'Project' && form.project_id !== null
        )

        // Also fetch project forms from the regular forms table (forms with project_id)
        try {
          projectFormsFromFormsTable = await getProjectForms('all')
        } catch (err) {
          console.error('Error fetching project forms from forms table:', err)
        }
      }

      // Combine and transform the data
      const combined: CombinedForm[] = [
        // Lead forms from lead_forms table
        ...leadForms.map(form => ({
          id: form.id,
          name: form.title,
          type: 'Lead' as FormType,
          linkedProject: null,
          submissions: form.total_submissions,
          status: form.status as FormStatus,
          embedLink: form.embed_link || `${window.location.origin}/forms/${form.id}`,
          lastSubmission: form.last_submission_at || '',
          rawData: form
        })),
        // Project forms from lead_forms table
        ...projectFormsFromLeadTable.map(form => ({
          id: form.id,
          name: form.title,
          type: 'Project' as FormType,
          linkedProject: (form as any).projects?.name || null,
          submissions: form.total_submissions,
          status: form.status as FormStatus,
          embedLink: form.embed_link || `${window.location.origin}/forms/${form.id}`,
          lastSubmission: form.last_submission_at || '',
          rawData: form
        })),
        // Project forms from forms table
        ...projectFormsFromFormsTable.map(form => ({
          id: form.id,
          name: form.title,
          type: 'Project' as FormType,
          linkedProject: form.projects?.name || null,
          submissions: form.total_submissions,
          status: form.status as FormStatus,
          embedLink: `${window.location.origin}/forms/${form.id}`,
          lastSubmission: form.last_submission_at || '',
          rawData: form
        }))
      ]

      setForms(combined)
    } catch (error) {
      console.error('Error loading forms:', error)
      toast.error('Failed to load forms')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (formId: string, newStatus: FormStatus) => {
    try {
      const form = forms.find(f => f.id === formId)
      if (!form) return

      // Update in database
      if ('form_type' in form.rawData) {
        // It's a lead form
        await updateLeadFormStatus(formId, newStatus)
      }
      // For regular project forms, you'd use updateForm from lib/forms.ts
      
      // Update local state
      setForms(forms.map(f => f.id === formId ? { ...f, status: newStatus } : f))
      
      const statusLabel = newStatus === 'published' ? 'Active' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
      toast.success(`Form status changed to ${statusLabel}`)
    } catch (error) {
      console.error('Error updating form status:', error)
      toast.error('Failed to update form status')
    }
  }

  const filteredForms = forms
    .filter((form) => {
      if (activeTab === "lead") return form.type === "Lead"
      if (activeTab === "project") return form.type === "Project"
      return true
    })
    .filter((form) => {
      if (!searchQuery.trim()) return true
      const hay = (
        `${form.name} ${form.type} ${form.linkedProject ?? ""} ${form.submissions} ${form.status}`
      ).toLowerCase()
      return hay.includes(searchQuery.toLowerCase())
    })

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link)
    toast.success("Form link copied to clipboard!")
  }

  const handleOpenDrawer = (form: CombinedForm) => {
    setSelectedForm(form)
    setFormDrawerOpen(true)
  }

  const handleOpenPreview = (form: CombinedForm) => {
    // Convert CombinedForm to Form format for preview modal
    const rawData = form.rawData
    let previewFormData: Form | null = null

    if ('form_type' in rawData) {
      // It's a LeadForm - convert to Form format
      const leadForm = rawData as LeadForm
      previewFormData = {
        id: leadForm.id,
        account_id: leadForm.account_id,
        title: leadForm.title,
        description: leadForm.description,
        instructions: leadForm.instructions,
        form_structure: leadForm.form_structure,
        status: leadForm.status,
        is_template: leadForm.is_template,
        template_id: leadForm.template_id,
        client_id: null,
        project_id: leadForm.project_id,
        portal_id: null,
        access_level: leadForm.access_level,
        password_protected: leadForm.password_protected,
        password_hash: leadForm.password_hash,
        max_submissions: leadForm.max_submissions,
        submission_deadline: leadForm.submission_deadline,
        notify_on_submission: leadForm.notify_on_submission,
        notify_emails: leadForm.notify_emails,
        total_submissions: leadForm.total_submissions,
        total_views: leadForm.total_views,
        completion_rate: leadForm.completion_rate,
        created_by: leadForm.created_by,
        created_by_name: leadForm.created_by_name,
        created_at: leadForm.created_at,
        updated_at: leadForm.updated_at,
        published_at: leadForm.published_at,
        last_submission_at: leadForm.last_submission_at,
      }
    } else {
      // It's already a Form
      previewFormData = rawData as Form
    }

    setPreviewForm(previewFormData)
    setPreviewModalOpen(true)
  }

  const handleOpenEmbed = (form: CombinedForm, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click from opening preview
    setEmbedForm(form)
    setEmbedCodeCopied(false)
    setEmbedModalOpen(true)
  }

  const getEmbedCode = (form: CombinedForm) => {
    // Use the form ID to create the embed URL
    // In production: jolix.io/forms/[id], in development: localhost:3000/forms/[id]
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const embedUrl = `${baseUrl}/forms/${form.id}`
    return `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`
  }

  const handleCopyEmbedCode = () => {
    if (!embedForm) return
    const code = getEmbedCode(embedForm)
    navigator.clipboard.writeText(code)
    setEmbedCodeCopied(true)
    toast.success("Embed code copied to clipboard!")
    setTimeout(() => setEmbedCodeCopied(false), 2000)
  }

  const buildMockSubmissions = (count: number): LeadFormSubmission[] => {
    const names = ["Sarah Johnson", "Michael Chen", "Emily Davis", "David Miller", "Jessica Wilson", "Robert Brown", "Lisa Anderson", "James Martinez"]
    const statuses = ["New", "Reviewed", "Qualified"]
    const sampleNotes = [
      "We're looking to redesign our entire brand identity and need a comprehensive package that includes logo design, color palette, typography, and brand guidelines. Our target audience is primarily millennials and Gen Z, so we want something modern and fresh.",
      "This is a quick inquiry about pricing for a small website update. We need to update our contact information and add a new service page. Nothing too complex, just a few pages of content updates.",
      "We're interested in a full e-commerce solution with product management, payment integration, and inventory tracking. Our current system is outdated and we're losing sales due to poor user experience.",
      "Need help with social media marketing strategy for Q1. We want to increase engagement by 50% and grow our follower base. Looking for someone who understands the SaaS industry.",
      "We're planning a major product launch in 3 months and need a complete marketing campaign including email sequences, landing pages, and social media content. Budget is flexible for the right agency."
    ]
    const sampleProjectScope = [
      "Complete website redesign including homepage, about page, services page, portfolio section, and contact form. We need responsive design for mobile and tablet. Timeline: 8 weeks. Budget: $15,000-$20,000.",
      "Brand identity package: Logo design (3 concepts), color palette (6 colors), typography selection, business card design, letterhead, and brand style guide PDF. We need everything finalized within 6 weeks.",
      "E-commerce platform migration from WooCommerce to Shopify. Includes product migration, theme customization, payment gateway setup, and SEO preservation. Expected completion: 4 weeks.",
      "Content marketing strategy and execution for 6 months. Includes 2 blog posts per week, social media content calendar, email newsletter templates, and monthly analytics reports. Focus on lead generation.",
      "UI/UX redesign for mobile app. Current app has low user retention. Need user research, wireframes, high-fidelity designs, and design system. Platform: iOS and Android. Timeline: 12 weeks."
    ]
    const companies = ["TechCorp Inc", "Design Studio", "StartupHub", "Global Solutions", "Creative Agency", "Digital Innovations", "NextGen Labs", "Smart Business"]
    const services = ["Web Design", "Brand Identity", "E-commerce", "Marketing Strategy", "UI/UX Design", "Content Marketing", "Social Media", "Full Service"]
    const budgets = ["$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "$50,000+", "$5,000 - $10,000", "$10,000 - $25,000", "$25,000 - $50,000", "$50,000+"]
    const phones = ["(555) 123-4567", "(555) 234-5678", "(555) 345-6789", "(555) 456-7890", "(555) 567-8901", "(555) 678-9012", "(555) 789-0123", "(555) 890-1234"]
    
    return Array.from({ length: count }).map((_, i) => {
      const status = statuses[i % statuses.length]
      const hasNotes = i % 3 === 0 || i % 3 === 1 // Some submissions have notes
      const hasProjectScope = i % 2 === 0 // Some submissions have project scope
      return {
        id: `SUB-${String(i + 1).padStart(3, '0')}`,
        form_id: '',
        submission_number: i + 1,
        status: 'completed' as const,
        respondent_id: null,
        respondent_name: names[i % names.length],
        respondent_email: `contact${i + 1}@example.com`,
        respondent_ip: null,
        user_agent: null,
        responses: {
          "Full Name": names[i % names.length],
          "Email": `contact${i + 1}@example.com`,
          "Phone": phones[i % phones.length],
          "Company": companies[i % companies.length],
          "Service Needed": services[i % services.length],
          "Budget": budgets[i % budgets.length],
          "Timeline": i % 3 === 0 ? "ASAP" : i % 3 === 1 ? "1-3 months" : "3-6 months",
          ...(hasNotes && { 
            "Notes": sampleNotes[i % sampleNotes.length] 
          }),
          ...(hasProjectScope && { 
            "Project Scope": sampleProjectScope[i % sampleProjectScope.length] 
          })
        },
        total_fields: null,
        completed_fields: null,
        completion_percentage: null,
        tag: status,
        tag_color: defaultTagColors[status],
        started_at: new Date(Date.now() - i * 86400000).toISOString(),
        completed_at: new Date(Date.now() - i * 86400000).toISOString(),
        time_spent: null,
        created_at: new Date(Date.now() - i * 86400000).toISOString(),
        updated_at: new Date(Date.now() - i * 86400000).toISOString()
      }
    })
  }

  const handleOpenSubmissions = async (form: CombinedForm) => {
    try {
      setSubmissionsForm(form)
      setViewingForm(form)
      
      // Fetch real submissions if it's a lead form
      if ('form_type' in form.rawData) {
        const realSubmissions = await getLeadFormSubmissions(form.id)
        if (realSubmissions.length > 0) {
          setSubmissions(realSubmissions)
        } else {
          // Fallback to mock data if no submissions
          const count = Math.min(Math.max(form.submissions, 0), 50)
          setSubmissions(buildMockSubmissions(count || 10))
        }
      } else {
        // For regular forms, use mock data for now
        const count = Math.min(Math.max(form.submissions, 0), 50)
        setSubmissions(buildMockSubmissions(count || 10))
      }
      
      setViewingSubmissions(true)
    } catch (error) {
      console.error('Error loading submissions:', error)
      toast.error('Failed to load submissions')
    }
  }

  const handleBackToForms = () => {
    setViewingSubmissions(false)
    setViewingForm(null)
    setSubmissionsForm(null)
    setSubmissions([])
  }

  const handleExportSubmissions = () => {
    if (!submissionsForm) return
    
    // Get all unique field names from all submissions
    const allFieldNames = new Set<string>()
    submissions.forEach(s => {
      Object.keys(s.responses || {}).forEach(field => allFieldNames.add(field))
    })
    
    const headers = ["ID", "Name", "Email", "Date", "Tag", ...Array.from(allFieldNames)]
    const rows = submissions.map(s => {
      const baseFields = [
        s.id, 
        s.respondent_name || '', 
        s.respondent_email || '', 
        new Date(s.created_at).toLocaleString(), 
        s.tag
      ]
      
      // Add all response fields
      const responseFields = Array.from(allFieldNames).map(fieldName => {
        const value = s.responses?.[fieldName]
        if (typeof value === 'object' && value !== null) {
          if ('rating' in value) return `${value.rating}/5`
          if ('value' in value) return String(value.value)
          return JSON.stringify(value)
        }
        return String(value || '')
      })
      
      return [...baseFields, ...responseFields]
    })
    
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${submissionsForm.name.replace(/\s+/g, '_')}_submissions.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Submissions exported successfully')
  }

  // Get unique tags from submissions
  const uniqueTags = Array.from(new Set(submissions.map(s => s.tag))).sort()

  const filteredAndSortedSubmissions = [...submissions]
    .filter((submission) => {
      if (submissionsTagFilter === "all") return true
      return submission.tag === submissionsTagFilter
    })
    .sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return submissionsSort === "newest" ? db - da : da - db
    })

  const sortedSubmissions = filteredAndSortedSubmissions

  const defaultTagColors: Record<string, string> = {
    Qualified: "#10b981", // emerald-500
    Reviewed: "#8b5cf6",  // violet-500
    New: "#f59e0b",       // amber-500
  }

  const getTagColor = (tag: string, tagColor?: string) => {
    if (tagColor) return tagColor
    return defaultTagColors[tag] || "#6366F1"
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#','')
    const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map(c=>c+c).join('') : sanitized, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const openTagDialogFor = (s: LeadFormSubmission) => {
    setTagTargetId(s.id)
    if (s.tag === 'Qualified' || s.tag === 'Reviewed' || s.tag === 'New') {
      setSelectedTagOption(s.tag as any)
      setCustomTagName("")
      setCustomTagColor(defaultTagColors[s.tag])
    } else {
      setSelectedTagOption('Custom')
      setCustomTagName(s.tag)
      setCustomTagColor(s.tag_color || '#6366F1')
    }
    setTagDialogOpen(true)
  }

  const applyTagChange = async () => {
    if (!tagTargetId) return
    
    try {
      const label = selectedTagOption === 'Custom' ? (customTagName.trim() || 'Custom') : selectedTagOption
      const color = selectedTagOption === 'Custom' ? customTagColor : defaultTagColors[selectedTagOption]
      
      // Update in database
      await updateSubmissionTag(tagTargetId, label, color)
      
      // Update local state
      setSubmissions(prev => prev.map(s => s.id === tagTargetId ? { ...s, tag: label, tag_color: color } : s))
      
      setTagDialogOpen(false)
      toast.success('Tag updated successfully')
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error('Failed to update tag')
    }
  }

  const handleConvertToLead = (s: LeadFormSubmission) => {
    try {
      const payload = { 
        name: s.respondent_name || 'Unknown', 
        email: s.respondent_email || '' 
      }
      localStorage.setItem("prefillLead", JSON.stringify(payload))
      window.location.href = "/dashboard/lead-workflow?active=manage-leads&prefillLead=1"
    } catch {}
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    try {
      const form = forms.find(f => f.id === formId)
      if (!form) return

      // Delete from database
      if ('form_type' in form.rawData) {
        await deleteLeadForm(formId)
      }
      
      // Update local state
      setForms(forms.filter(f => f.id !== formId))
      toast.success('Form deleted successfully')
      
      // Reload forms
      loadForms()
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Failed to delete form')
    }
  }

  const handleCreateForm = () => {
    router.push(`/dashboard/forms/builder?name=${encodeURIComponent(newFormName)}&type=${encodeURIComponent(newFormType)}&return_to=leads&leads_url=${encodeURIComponent('/dashboard/lead-workflow?active=forms')}`)
    setNewFormModalOpen(false)
    setNewFormName("")
    setNewFormType("Lead")
    setNewFormProject("")
  }

  // Load templates when modal opens or toggle changes
  useEffect(() => {
    if (templatesModalOpen) {
      loadTemplates()
    }
  }, [templatesModalOpen, showPreMadeTemplates])

  const loadTemplates = async () => {
    try {
      setTemplatesLoading(true)
      const fetchedTemplates = await getFormTemplates()
      
      if (showPreMadeTemplates) {
        // Filter for pre-made templates
        // Pre-made templates are identified by:
        // 1. category === 'premade' OR
        // 2. is_public === true AND no created_by_name (system templates)
        // You can adjust this logic based on how you identify pre-made templates in your database
        const preMadeTemplates = fetchedTemplates.filter(t => {
          return t.category === 'premade' || (t.is_public && !t.created_by_name)
        })
        setTemplates(preMadeTemplates)
      } else {
        // Show user's own templates (exclude pre-made templates)
        const userTemplates = fetchedTemplates.filter(t => {
          return t.category !== 'premade' && t.created_by_name
        })
        setTemplates(userTemplates)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setTemplatesLoading(false)
    }
  }

  const handleUseTemplate = (template: any) => {
    // Prepare template data in the format expected by the form builder
    const templateData = {
      templateId: template.id,
      title: template.name,
      fields: template.template_data?.fields || [],
      instructions: template.description || '',
      client_id: null,
      project_id: null
    }
    
    const encodedData = encodeURIComponent(JSON.stringify(templateData))
    router.push(`/dashboard/forms/builder?template=${encodedData}&return_to=leads&leads_url=${encodeURIComponent('/dashboard/lead-workflow?active=forms')}`)
    setTemplatesModalOpen(false)
  }

  const handleDeleteTemplate = (template: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering the template click
    setTemplateToDelete(template)
    setDeleteConfirmOpen(true)
  }

  const confirmDeleteTemplate = async () => {
    if (!templateToDelete) return

    try {
      const supabase = createClient()
      
      // First verify we can access this template
      const { data: template, error: fetchError } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', templateToDelete.id)
        .single()

      if (fetchError) {
        console.error('Error fetching template:', fetchError)
        throw new Error('Could not find template')
      }

      // Now delete it
      const { error: deleteError } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', templateToDelete.id)

      if (deleteError) {
        console.error('Delete error:', deleteError)
        throw deleteError
      }

      // Remove from local state immediately
      setTemplates(prev => prev.filter(t => t.id !== templateToDelete.id))
      
      toast.success('Template deleted successfully')
      setDeleteConfirmOpen(false)
      setTemplateToDelete(null)
    } catch (error: any) {
      console.error('Error deleting template:', error)
      toast.error(error.message || 'Failed to delete template')
    }
  }

  // If viewing submissions, show the submissions view
  if (viewingSubmissions && viewingForm) {
    return (
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToForms}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Forms
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{viewingForm.name}</h2>
              <p className="text-gray-600 mt-1">
                {sortedSubmissions.length} {sortedSubmissions.length === 1 ? 'submission' : 'submissions'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={submissionsTagFilter} onValueChange={setSubmissionsTagFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {uniqueTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={submissionsSort} onValueChange={(v: any) => setSubmissionsSort(v)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleExportSubmissions} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="space-y-4">
          {sortedSubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions yet</h3>
              <p className="text-gray-500">Submissions will appear here once someone fills out this form.</p>
            </div>
          ) : (
            sortedSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{submission.respondent_name || 'Anonymous'}</h3>
                      <p className="text-sm text-gray-500">{submission.respondent_email || 'No email provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="border pointer-events-none"
                      style={{
                        backgroundColor: hexToRgba(getTagColor(submission.tag, submission.tag_color), 0.12),
                        color: getTagColor(submission.tag, submission.tag_color),
                        borderColor: hexToRgba(getTagColor(submission.tag, submission.tag_color), 0.3)
                      }}
                    >
                      {submission.tag}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openTagDialogFor(submission)}>
                      <Tag className="h-4 w-4 mr-2" /> Change Tag
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {/* All Form Fields */}
                {submission.responses && Object.keys(submission.responses).length > 0 && (
                  <div className="mt-4 space-y-3">
                    {/* Regular Fields Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(submission.responses).map(([fieldName, fieldValue]) => {
                        // Handle different field types
                        let displayValue: string = ''
                        let isLongTextField = false

                        if (typeof fieldValue === 'object' && fieldValue !== null) {
                          // Handle rating fields
                          if ('rating' in fieldValue) {
                            displayValue = `${fieldValue.rating}/5 ⭐`
                          } else if ('value' in fieldValue) {
                            displayValue = String(fieldValue.value)
                          } else {
                            displayValue = JSON.stringify(fieldValue)
                          }
                        } else {
                          displayValue = String(fieldValue)
                        }

                        // Check if it's a long text field
                        isLongTextField = fieldName.toLowerCase().includes('notes') || 
                                         fieldName.toLowerCase().includes('scope') || 
                                         fieldName.toLowerCase().includes('description') ||
                                         displayValue.length > 150
                        
                        if (isLongTextField) return null

                        return (
                          <div key={fieldName} className="flex flex-col">
                            <p className="text-xs font-medium text-gray-500 mb-1">{fieldName}</p>
                            <p className="text-sm text-gray-900 break-words">{displayValue}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Long Text Fields (Expandable) */}
                    {Object.entries(submission.responses).map(([fieldName, fieldValue]) => {
                      let displayValue: string = ''
                      let isLongTextField = false

                      if (typeof fieldValue === 'object' && fieldValue !== null) {
                        if ('rating' in fieldValue) {
                          displayValue = `${fieldValue.rating}/5 ⭐`
                        } else if ('value' in fieldValue) {
                          displayValue = String(fieldValue.value)
                        } else {
                          displayValue = JSON.stringify(fieldValue)
                        }
                      } else {
                        displayValue = String(fieldValue)
                      }

                      isLongTextField = fieldName.toLowerCase().includes('notes') || 
                                       fieldName.toLowerCase().includes('scope') || 
                                       fieldName.toLowerCase().includes('description') ||
                                       displayValue.length > 150
                      
                      if (!isLongTextField) return null

                      const isExpanded = expandedSubmissions.has(`${submission.id}-${fieldName}`)
                      const shouldTruncate = displayValue.length > 150
                      const truncatedValue = isExpanded || !shouldTruncate ? displayValue : displayValue.substring(0, 150) + '...'

                      return (
                        <div key={fieldName} className="border-t border-gray-200 pt-3 mt-3">
                          <button
                            onClick={() => {
                              const key = `${submission.id}-${fieldName}`
                              setExpandedSubmissions(prev => {
                                const next = new Set(prev)
                                if (next.has(key)) {
                                  next.delete(key)
                                } else {
                                  next.add(key)
                                }
                                return next
                              })
                            }}
                            className="w-full flex items-center justify-between text-left mb-2 hover:opacity-70 transition-opacity"
                            disabled={!shouldTruncate}
                          >
                            <h4 className="text-sm font-semibold text-gray-900">{fieldName}</h4>
                            {shouldTruncate && (
                              <div className="ml-2 flex-shrink-0">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </div>
                            )}
                          </button>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{truncatedValue}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleConvertToLead(submission)}
                    className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#3C3CFF] hover:text-white"
                  >
                    Add to Leads
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Tag Dialog */}
        <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Tag Type</Label>
              <Select value={selectedTagOption} onValueChange={(v: any) => setSelectedTagOption(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedTagOption === 'Custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label className="mb-1 block">Custom Label</Label>
                  <Input value={customTagName} onChange={e => setCustomTagName(e.target.value)} placeholder="e.g. Needs Review" />
                </div>
                <div>
                  <Label className="mb-1 block">Color</Label>
                  <input type="color" value={customTagColor} onChange={e => setCustomTagColor(e.target.value)} className="h-10 w-full rounded border" />
                </div>
              </div>
            )}

            {/* Preview */}
            <div className="pt-2 border-t">
              <Label className="mb-2 block text-sm text-gray-500">Preview</Label>
              <Badge
                className="border"
                style={{
                  backgroundColor: hexToRgba(
                    selectedTagOption === 'Custom' 
                      ? customTagColor 
                      : defaultTagColors[selectedTagOption],
                    0.12
                  ),
                  color: selectedTagOption === 'Custom' 
                    ? customTagColor 
                    : defaultTagColors[selectedTagOption],
                  borderColor: hexToRgba(
                    selectedTagOption === 'Custom' 
                      ? customTagColor 
                      : defaultTagColors[selectedTagOption],
                    0.3
                  )
                }}
              >
                {selectedTagOption === 'Custom' ? (customTagName || 'Custom Tag') : selectedTagOption}
              </Badge>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setTagDialogOpen(false)}>Cancel</Button>
              <Button onClick={applyTagChange} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md">
                <Clipboard className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Forms</h2>
            </div>
            <p className="text-gray-600 ml-[60px]">
              Capture leads and collect project details.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setTemplatesModalOpen(true)}
              className="border-[#3C3CFF] text-[#3C3CFF] hover:bg-[#3C3CFF] hover:text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Templates
            </Button>
            <Button
              data-help="btn-new-form"
              onClick={() => setNewFormModalOpen(true)}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Form
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div data-help="forms-tabs" className="flex space-x-1 mt-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            data-help="tab-all-forms"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            data-help="tab-lead-forms"
            onClick={() => setActiveTab("lead")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "lead"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Lead Forms
          </button>
          <button
            data-help="tab-project-forms"
            onClick={() => setActiveTab("project")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "project"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Project Forms
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search forms by name, type, project, status…"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Forms Table */}
      <div data-help="forms-table" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
            <span className="ml-3 text-gray-600">Loading forms...</span>
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <FileText className="h-12 w-12 text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No forms yet</h3>
            <p className="text-sm text-gray-500">Create your first form to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Form Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Linked Project
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Submissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Embed
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    View Submissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredForms.map((form) => (
                <tr
                  key={form.id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleOpenPreview(form)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-gray-400 mr-3" />
                      <span className="text-sm font-medium text-gray-900">
                        {form.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={
                        form.type === "Lead"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }
                    >
                      {form.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">
                      {form.linkedProject || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {form.submissions}
                    </span>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleCopyLink(form.embedLink)}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={(e) => handleOpenEmbed(form, e)}>
                      <Code className="h-3 w-3 mr-1" />
                      Get Code
                    </Button>
                  </td>
                  <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                    {form.submissions > 0 ? (
                      <Button size="sm" variant="outline" onClick={() => handleOpenSubmissions(form)}>
                        View
                      </Button>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={
                      form.status === "published" ? "bg-green-100 text-green-700" :
                      form.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {form.status === "published" ? "Active" : form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenDrawer(form); }}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/forms/builder?id=${form.id}`); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(form.embedLink); }}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {form.status === "draft" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "published"); }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Make Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "archived"); }}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {form.status === "published" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "draft"); }}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Make Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "archived"); }}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {form.status === "archived" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "published"); }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Make Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "draft"); }}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Make Draft
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteForm(form.id); }} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Form Modal */}
      <Dialog open={newFormModalOpen} onOpenChange={setNewFormModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
            <DialogDescription>
              Set up a new form to capture leads or project details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="form-name">Form Name</Label>
              <Input
                id="form-name"
                data-help="input-form-name"
                placeholder="e.g., General Inquiry"
                value={newFormName}
                onChange={(e) => setNewFormName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="form-type">Type</Label>
              <Select value={newFormType} onValueChange={(v) => setNewFormType(v as FormType)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead">Lead Form</SelectItem>
                  <SelectItem value="Project">Project Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newFormType === "Project" && (
              <div>
                <Label htmlFor="form-project">Linked Project (Optional)</Label>
                <Select value={newFormProject} onValueChange={setNewFormProject}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website Redesign</SelectItem>
                    <SelectItem value="branding">Brand Identity</SelectItem>
                    <SelectItem value="app">Mobile App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFormModalOpen(false)}>
              Cancel
            </Button>
            <Button
              data-help="btn-create-form-modal"
              onClick={handleCreateForm}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              disabled={!newFormName}
            >
              Create Form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Details Drawer */}
      <Sheet open={formDrawerOpen} onOpenChange={setFormDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          {selectedForm && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-600" />
                  {selectedForm.name}
                </SheetTitle>
                <SheetDescription>
                  Form details and analytics
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Embed Link */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Embed Link
                  </Label>
                  <div className="flex items-center gap-2 mt-2">
                    <Input
                      value={selectedForm.embedLink}
                      readOnly
                      className="flex-1 text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleCopyLink(selectedForm.embedLink)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">
                        Submissions
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedForm.submissions}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      <span className="text-xs font-medium text-purple-700">
                        Conversion
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {Math.floor(Math.random() * 30 + 10)}%
                    </div>
                  </div>
                </div>

                {/* Last Submission */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Last Submission
                  </Label>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedForm.lastSubmission).toLocaleDateString(
                      "en-US",
                      { month: "long", day: "numeric", year: "numeric" }
                    )}
                  </div>
                </div>

                {/* Type & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Type
                    </Label>
                    <Badge
                      variant="secondary"
                      className={`mt-2 ${
                        selectedForm.type === "Lead"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {selectedForm.type}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Status
                    </Label>
                    <Badge className={`mt-2 ${
                      selectedForm.status === "published" ? "bg-green-100 text-green-700" :
                      selectedForm.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedForm.status === "published" ? "Active" : selectedForm.status.charAt(0).toUpperCase() + selectedForm.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Linked Project */}
                {selectedForm.linkedProject && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Linked Project
                    </Label>
                    <div className="mt-2 text-sm text-gray-900">
                      {selectedForm.linkedProject}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => router.push(`/dashboard/forms/builder?id=${selectedForm.id}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Form
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setFormDrawerOpen(false)
                    handleOpenSubmissions(selectedForm)
                  }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Submissions
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Templates Modal */}
      <Dialog open={templatesModalOpen} onOpenChange={setTemplatesModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold">Form Templates</DialogTitle>
                <DialogDescription>
                  Choose a template to get started quickly, or create a form from scratch.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          {/* Template Type Toggle */}
          <div className="flex items-center justify-between py-4 px-1 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium transition-colors ${!showPreMadeTemplates ? 'text-gray-900' : 'text-gray-500'}`}>
                My Templates
              </span>
              <Switch
                checked={showPreMadeTemplates}
                onCheckedChange={setShowPreMadeTemplates}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
              <span className={`text-sm font-medium transition-colors ${showPreMadeTemplates ? 'text-gray-900' : 'text-gray-500'}`}>
                Pre-made Templates
              </span>
            </div>
            {showPreMadeTemplates && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Star className="h-3 w-3 mr-1" />
                Curated by us
              </Badge>
            )}
          </div>
          
          {templatesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
              <span className="ml-3 text-gray-600">Loading templates...</span>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <FileText className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {showPreMadeTemplates ? 'No pre-made templates available' : 'No templates yet'}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                {showPreMadeTemplates 
                  ? 'Pre-made templates will appear here. Check back soon for new templates!'
                  : 'Templates you save will appear here. Start by creating a form and saving it as a template.'}
              </p>
              {!showPreMadeTemplates && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setTemplatesModalOpen(false)
                    setNewFormModalOpen(true)
                  }}
                >
                  Create New Form
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {templates.map((template) => {
                const fields = template.template_data?.fields || []
                const fieldCount = fields.length
                const fieldTypes = fields.map((f: any) => f.type).filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i)
                
                return (
                  <div
                    key={template.id}
                    className="group relative bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-[#3C3CFF] hover:shadow-lg transition-all duration-200 cursor-pointer"
                    onClick={() => handleUseTemplate(template)}
                  >
                    {/* Top Right Badges and Delete Button */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                      {/* Delete Button - Only show for user's templates, not pre-made */}
                      {!showPreMadeTemplates && (
                        <button
                          onClick={(e) => handleDeleteTemplate(template, e)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}

                      {/* Featured Badge - Only show for user templates, not pre-made */}
                      {!showPreMadeTemplates && template.is_featured && (
                        <Badge className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] text-white border-0">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Featured
                        </Badge>
                      )}

                      {/* Public Badge - Only show for user templates, not pre-made */}
                      {!showPreMadeTemplates && template.is_public && !template.is_featured && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          Public
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Clipboard className="h-6 w-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-[#3C3CFF] transition-colors">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                            {template.description}
                          </p>
                        )}
                        
                        {/* Template Info */}
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <FileText className="h-3 w-3" />
                            <span>{fieldCount} {fieldCount === 1 ? 'field' : 'fields'}</span>
                          </div>
                          {template.category && (
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                          )}
                          {template.usage_count > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <TrendingUp className="h-3 w-3" />
                              <span>Used {template.usage_count} {template.usage_count === 1 ? 'time' : 'times'}</span>
                            </div>
                          )}
                        </div>

                        {/* Field Types Preview */}
                        {fieldTypes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {fieldTypes.slice(0, 4).map((type: string) => (
                              <span
                                key={type}
                                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-md"
                              >
                                {type}
                              </span>
                            ))}
                            {fieldTypes.length > 4 && (
                              <span className="px-2 py-1 text-xs font-medium text-gray-500">
                                +{fieldTypes.length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Created By */}
                        {template.created_by_name && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                              Created by {template.created_by_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hover Effect */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#3C3CFF]/5 to-[#6366F1]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                )
              })}
            </div>
          )}

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setTemplatesModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setTemplatesModalOpen(false)
                setNewFormModalOpen(true)
              }}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create from Scratch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              This will permanently delete the template. Any forms created from this template will not be affected.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteConfirmOpen(false)
              setTemplateToDelete(null)
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTemplate}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Submissions Modal */}
      <Dialog open={submissionsModalOpen} onOpenChange={setSubmissionsModalOpen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Submissions {submissionsForm ? `— ${submissionsForm.name}` : ""}</DialogTitle>
            <DialogDescription>
              View and export submissions for this form.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Total submissions: <span className="font-medium text-gray-900">{submissions.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                className="h-9 border rounded-md text-sm px-2"
                value={submissionsSort}
                onChange={(e) => setSubmissionsSort(e.target.value as any)}
              >
                <option value="newest">Newest → Oldest</option>
                <option value="oldest">Oldest → Newest</option>
              </select>
              <Button onClick={handleExportSubmissions} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                Export CSV
              </Button>
            </div>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <div className="overflow-auto max-h-[70vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-5 py-3 text-left">ID</th>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Email</th>
                    <th className="px-5 py-3 text-left">Date</th>
                    <th className="px-5 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSubmissions.map((s) => (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-5 py-3 font-mono text-gray-700">{s.id}</td>
                      <td className="px-5 py-3 text-gray-900">{s.name}</td>
                      <td className="px-5 py-3 text-gray-700">{s.email}</td>
                      <td className="px-5 py-3 text-gray-700">{new Date(s.date).toLocaleString()}</td>
                      <td className="px-5 py-3">
                        <Button size="sm" variant="outline" onClick={() => handleConvertToLead(s)}>
                          Add to Leads
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {submissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-gray-500">No submissions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Preview Modal */}
      <FormPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        form={previewForm}
        account={account}
      />

      {/* Embed Code Modal */}
      <Dialog open={embedModalOpen} onOpenChange={setEmbedModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Code className="h-5 w-5 text-[#3C3CFF]" />
              Embed Form
            </DialogTitle>
            <DialogDescription className="text-sm">
              Copy the code below to embed this form on your website
            </DialogDescription>
          </DialogHeader>

          {embedForm && (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-2">
              {/* Compact Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">
                  <strong>What is an embed?</strong> Display your form directly on your website. Visitors can fill it out without leaving your page.
                </p>
              </div>

              {/* Embed Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold text-gray-900">Embed Code</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyEmbedCode}
                    className={embedCodeCopied ? "border-green-500 text-green-600" : ""}
                  >
                    {embedCodeCopied ? (
                      <>
                        <Check className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto text-xs font-mono border border-gray-700 max-h-32">
                    <code>{getEmbedCode(embedForm)}</code>
                  </pre>
                </div>
              </div>

              {/* Compact Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Quick Steps</h4>
                <ol className="space-y-1.5 text-xs text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-700">1.</span>
                    <span>Copy the embed code above</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-700">2.</span>
                    <span>Paste it into your website's HTML editor where you want the form to appear</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-semibold text-gray-700">3.</span>
                    <span>Save and publish - your form is live!</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setEmbedModalOpen(false)}>
              Close
            </Button>
            <Button
              onClick={handleCopyEmbedCode}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

