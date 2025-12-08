"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

// Mock data
const mockForms = [
  {
    id: "1",
    name: "General Lead Inquiry",
    type: "Lead",
    linkedProject: null,
    submissions: 47,
    status: "Active",
    embedLink: "https://yoursite.com/forms/general-lead",
    lastSubmission: "2025-10-28",
  },
  {
    id: "2",
    name: "Website Redesign Brief",
    type: "Project",
    linkedProject: "Website Redesign",
    submissions: 12,
    status: "Active",
    embedLink: "https://yoursite.com/forms/redesign-brief",
    lastSubmission: "2025-10-29",
  },
  {
    id: "3",
    name: "Brand Identity Questionnaire",
    type: "Project",
    linkedProject: "Brand Identity",
    submissions: 8,
    status: "Active",
    embedLink: "https://yoursite.com/forms/brand-questionnaire",
    lastSubmission: "2025-10-27",
  },
  {
    id: "4",
    name: "Quick Contact Form",
    type: "Lead",
    linkedProject: null,
    submissions: 103,
    status: "Active",
    embedLink: "https://yoursite.com/forms/quick-contact",
    lastSubmission: "2025-10-30",
  },
  {
    id: "5",
    name: "Contact Us Form",
    type: "Lead",
    linkedProject: null,
    submissions: 0,
    status: "Draft",
    embedLink: "https://yoursite.com/forms/contact-us",
    lastSubmission: "",
  },
]

type FormType = "Lead" | "Project"
type FormStatus = "Active" | "Draft" | "Archived"

export function FormsSection() {
  const router = useRouter()
  const [forms, setForms] = useState(mockForms)
  const [activeTab, setActiveTab] = useState<"all" | "lead" | "project">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [newFormModalOpen, setNewFormModalOpen] = useState(false)
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [selectedForm, setSelectedForm] = useState<typeof mockForms[0] | null>(null)
  const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false)
  const [submissionsForm, setSubmissionsForm] = useState<typeof mockForms[0] | null>(null)
  const [submissions, setSubmissions] = useState<Array<{ id: string; name: string; email: string; date: string; status: string }>>([])
  const [submissionsSort, setSubmissionsSort] = useState<"newest" | "oldest">("newest")
  const [submissionsTagFilter, setSubmissionsTagFilter] = useState<string>("all")
  const [viewingSubmissions, setViewingSubmissions] = useState(false)
  const [viewingForm, setViewingForm] = useState<typeof mockForms[0] | null>(null)
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set())

  // Tag editor state
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [tagTargetId, setTagTargetId] = useState<string | null>(null)
  const [selectedTagOption, setSelectedTagOption] = useState<"Qualified" | "Reviewed" | "New" | "Custom">("Qualified")
  const [customTagName, setCustomTagName] = useState("")
  const [customTagColor, setCustomTagColor] = useState("#6366F1")

  // New form modal state
  const [newFormName, setNewFormName] = useState("")
  const [newFormType, setNewFormType] = useState<FormType>("Lead")
  const [newFormProject, setNewFormProject] = useState("")
  const [newFormTemplate, setNewFormTemplate] = useState("lead-inquiry")

  const handleStatusChange = (formId: string, newStatus: FormStatus) => {
    setForms(forms.map(f => f.id === formId ? { ...f, status: newStatus } : f))
    toast.success(`Form status changed to ${newStatus}`)
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

  const handleOpenDrawer = (form: typeof mockForms[0]) => {
    setSelectedForm(form)
    setFormDrawerOpen(true)
  }

  const buildMockSubmissions = (count: number) => {
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
        name: names[i % names.length],
        email: `contact${i + 1}@example.com`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        status,
        tagColor: defaultTagColors[status],
        fields: {
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
        }
      }
    })
  }

  const handleOpenSubmissions = (form: typeof mockForms[0]) => {
    setSubmissionsForm(form)
    setViewingForm(form)
    // build sample submissions matching count (cap to a reasonable number for demo)
    const count = Math.min(Math.max(form.submissions, 0), 50)
    setSubmissions(buildMockSubmissions(count || 10))
    setViewingSubmissions(true)
  }

  const handleBackToForms = () => {
    setViewingSubmissions(false)
    setViewingForm(null)
    setSubmissionsForm(null)
    setSubmissions([])
  }

  const handleExportSubmissions = () => {
    if (!submissionsForm) return
    const headers = ["ID", "Name", "Email", "Date", "Status"]
    const rows = submissions.map(s => [s.id, s.name, s.email, new Date(s.date).toLocaleString(), s.status])
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
  }

  // Get unique tags from submissions
  const uniqueTags = Array.from(new Set(submissions.map(s => s.status))).sort()

  const filteredAndSortedSubmissions = [...submissions]
    .filter((submission) => {
      if (submissionsTagFilter === "all") return true
      return submission.status === submissionsTagFilter
    })
    .sort((a, b) => {
      const da = new Date(a.date).getTime()
      const db = new Date(b.date).getTime()
      return submissionsSort === "newest" ? db - da : da - db
    })

  const sortedSubmissions = filteredAndSortedSubmissions

  const defaultTagColors: Record<string, string> = {
    Qualified: "#10b981", // emerald-500
    Reviewed: "#8b5cf6",  // violet-500
    New: "#f59e0b",       // amber-500
  }

  const getTagColor = (status: string, tagColor?: string) => {
    if (tagColor) return tagColor
    return defaultTagColors[status] || "#6366F1"
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const sanitized = hex.replace('#','')
    const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map(c=>c+c).join('') : sanitized, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const openTagDialogFor = (s: { id: string; status: string; tagColor?: string }) => {
    setTagTargetId(s.id)
    if (s.status === 'Qualified' || s.status === 'Reviewed' || s.status === 'New') {
      setSelectedTagOption(s.status as any)
      setCustomTagName("")
      setCustomTagColor(defaultTagColors[s.status])
    } else {
      setSelectedTagOption('Custom')
      setCustomTagName(s.status)
      setCustomTagColor(s.tagColor || '#6366F1')
    }
    setTagDialogOpen(true)
  }

  const applyTagChange = () => {
    if (!tagTargetId) return
    const label = selectedTagOption === 'Custom' ? (customTagName.trim() || 'Custom') : selectedTagOption
    const color = selectedTagOption === 'Custom' ? customTagColor : defaultTagColors[selectedTagOption]
    setSubmissions(prev => prev.map(s => s.id === tagTargetId ? { ...s, status: label, tagColor: color } : s))
    setTagDialogOpen(false)
  }

  const handleConvertToLead = (s: { id: string; name: string; email: string }) => {
    try {
      const payload = { name: s.name, email: s.email }
      localStorage.setItem("prefillLead", JSON.stringify(payload))
      window.location.href = "/dashboard/lead-workflow?active=manage-leads&prefillLead=1"
    } catch {}
  }

  const handleCreateForm = () => {
    if (newFormTemplate === "custom") {
      router.push(`/dashboard/forms/builder?name=${encodeURIComponent(newFormName)}&type=${encodeURIComponent(newFormType)}&return_to=leads&leads_url=${encodeURIComponent('/dashboard/lead-workflow?active=forms')}`)
    } else {
      toast.success(`Form "${newFormName}" created successfully!`)
      setNewFormModalOpen(false)
      setNewFormName("")
      setNewFormType("Lead")
      setNewFormProject("")
      setNewFormTemplate("lead-inquiry")
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
                      <h3 className="text-lg font-semibold text-gray-900">{submission.name}</h3>
                      <p className="text-sm text-gray-500">{submission.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      className="border pointer-events-none"
                      style={{
                        backgroundColor: hexToRgba(getTagColor(submission.status, (submission as any).tagColor), 0.12),
                        color: getTagColor(submission.status, (submission as any).tagColor),
                        borderColor: hexToRgba(getTagColor(submission.status, (submission as any).tagColor), 0.3)
                      }}
                    >
                      {submission.status}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => openTagDialogFor(submission)}>
                      <Tag className="h-4 w-4 mr-2" /> Change Tag
                    </Button>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
                
                {/* All Form Fields */}
                {(submission as any).fields && Object.keys((submission as any).fields).length > 0 && (
                  <div className="mt-4 space-y-3">
                    {/* Regular Fields Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries((submission as any).fields).map(([fieldName, fieldValue]) => {
                        const value = String(fieldValue)
                        const isLongTextField = fieldName === "Notes" || fieldName === "Project Scope" || value.length > 150
                        
                        if (isLongTextField) return null

                        return (
                          <div key={fieldName} className="flex flex-col">
                            <p className="text-xs font-medium text-gray-500 mb-1">{fieldName}</p>
                            <p className="text-sm text-gray-900 break-words">{value}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Long Text Fields (Expandable) */}
                    {Object.entries((submission as any).fields).map(([fieldName, fieldValue]) => {
                      const value = String(fieldValue)
                      const isLongTextField = fieldName === "Notes" || fieldName === "Project Scope" || value.length > 150
                      
                      if (!isLongTextField) return null

                      const isExpanded = expandedSubmissions.has(`${submission.id}-${fieldName}`)
                      const shouldTruncate = value.length > 150
                      const displayValue = isExpanded || !shouldTruncate ? value : value.substring(0, 150) + '...'

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
                          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{displayValue}</p>
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
          <Button
            data-help="btn-new-form"
            onClick={() => setNewFormModalOpen(true)}
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Form
          </Button>
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
                  onClick={() => handleOpenDrawer(form)}
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
                      Copy
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
                      form.status === "Active" ? "bg-green-100 text-green-700" :
                      form.status === "Draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }>
                      {form.status}
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
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Edit form"); }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(form.embedLink); }}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {form.status === "Draft" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Active"); }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Make Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Archived"); }}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {form.status === "Active" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Draft"); }}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Make Draft
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Archived"); }}>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </>
                        )}
                        {form.status === "Archived" && (
                          <>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Active"); }}>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Make Active
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStatusChange(form.id, "Draft"); }}>
                              <FileEdit className="mr-2 h-4 w-4" />
                              Make Draft
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toast.success("Form deleted"); }} className="text-red-600">
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
            <div>
              <Label htmlFor="form-template">Template</Label>
              <Select value={newFormTemplate} onValueChange={setNewFormTemplate}>
                <SelectTrigger className="mt-1" data-help="select-form-template">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead-inquiry">
                    <div className="flex flex-col">
                      <span className="font-medium">Lead Inquiry</span>
                      <span className="text-xs text-gray-500">
                        Name, Email, Service Needed, Budget
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="project-brief">
                    <div className="flex flex-col">
                      <span className="font-medium">Project Brief</span>
                      <span className="text-xs text-gray-500">
                        Goals, Timeline, Deliverables
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="custom" data-help="option-template-custom">
                    <div className="flex flex-col">
                      <span className="font-medium">Custom</span>
                      <span className="text-xs text-gray-500">Start blank</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-2">
                Saved templates will show here.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFormModalOpen(false)}>
              Cancel
            </Button>
            {newFormTemplate !== "custom" && (
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/dashboard/forms/builder?name=${encodeURIComponent(newFormName)}&type=${encodeURIComponent(newFormType)}&template=${encodeURIComponent(newFormTemplate)}`)
                }}
                disabled={!newFormName}
              >
                Customize Template
              </Button>
            )}
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
                      selectedForm.status === "Active" ? "bg-green-100 text-green-700" :
                      selectedForm.status === "Draft" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedForm.status}
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
                  <Button variant="outline" className="flex-1" onClick={() => toast.success("Opening form editor...")}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Form
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => toast.success("Opening submissions...")}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Submissions
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
    </div>
  )
}

