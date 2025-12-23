"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  X,
  Paperclip,
  Download,
  GitBranch,
  Send,
  Tag,
  Loader2,
  Globe,
  Settings,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import {
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  bulkDeleteLeads,
  bulkUpdateLeadStatus,
  updateLeadLastContacted,
  type Lead,
} from "@/lib/leads"
import {
  getPipelineStages,
  getPipelineStagesFromDB,
  getStatusNames,
  type PipelineStage,
} from "@/lib/pipeline-stages"
import { PipelineSettingsDrawer } from "./PipelineSettingsDrawer"
import { ImportLeadsModal } from "./ImportLeadsModal"
import { useTour } from "@/contexts/TourContext"
import { dummyTourLeads } from "@/lib/tour-dummy-data"

export function ManageLeadsSection() {
  const router = useRouter()
  const { isTourRunning } = useTour()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [segment, setSegment] = useState("all")
  const [showPortfolioOnly, setShowPortfolioOnly] = useState(false)
  
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadCompany, setNewLeadCompany] = useState("")
  const [newLeadEmail, setNewLeadEmail] = useState("")
  const [newLeadPhone, setNewLeadPhone] = useState("")
  const [newLeadValueAmount, setNewLeadValueAmount] = useState("")
  const [newLeadNotes, setNewLeadNotes] = useState("")
  const [newLeadTwitter, setNewLeadTwitter] = useState("")
  const [newLeadLinkedIn, setNewLeadLinkedIn] = useState("")
  const [newLeadInstagram, setNewLeadInstagram] = useState("")
  const [newLeadPortfolioUrl, setNewLeadPortfolioUrl] = useState("")
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false)
  const [statusChangeLead, setStatusChangeLead] = useState<Lead | null>(null)
  const [selectedStatusOption, setSelectedStatusOption] = useState<string>("New")
  const [customStatusName, setCustomStatusName] = useState("")
  const [customStatusColor, setCustomStatusColor] = useState("#6366F1")
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editLeadName, setEditLeadName] = useState("")
  const [editLeadCompany, setEditLeadCompany] = useState("")
  const [editLeadEmail, setEditLeadEmail] = useState("")
  const [editLeadPhone, setEditLeadPhone] = useState("")
  const [editLeadTwitter, setEditLeadTwitter] = useState("")
  const [editLeadLinkedIn, setEditLeadLinkedIn] = useState("")
  const [editLeadInstagram, setEditLeadInstagram] = useState("")
  const [editLeadSource, setEditLeadSource] = useState<Lead['source']>("Manual Import")
  const [editLeadStatus, setEditLeadStatus] = useState<Lead['status']>("New")
  const [editLeadValue, setEditLeadValue] = useState("")
  const [editLeadNotes, setEditLeadNotes] = useState("")
  const [editLeadPortfolioUrl, setEditLeadPortfolioUrl] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [stages, setStages] = useState<PipelineStage[]>(getPipelineStages())
  const searchParams = useSearchParams()

  // New lead form state
  const [newLeadSource, setNewLeadSource] = useState<Lead['source']>("Manual Import")
  const [newLeadStatus, setNewLeadStatus] = useState<Lead['status']>(getStatusNames()[0] as Lead['status'] || "New")

  // Load leads and stages on mount
  useEffect(() => {
    loadLeads()
    // Load stages from database
    const loadStages = async () => {
      // Skip loading stages from DB during tour
      if (isTourRunning) return
      
      try {
        const dbStages = await getPipelineStagesFromDB()
        setStages(dbStages)
        // Update localStorage for fast access
        if (typeof window !== 'undefined') {
          localStorage.setItem('pipeline_stages', JSON.stringify(dbStages))
        }
      } catch (error) {
        console.error('Error loading stages from DB:', error)
        // Use cached stages from localStorage
        setStages(getPipelineStages())
      }
    }
    loadStages()
  }, [isTourRunning])

  // Listen for pipeline stages updates
  useEffect(() => {
    const handleStagesUpdate = () => {
      setStages(getPipelineStages())
      // Reload leads to reflect status changes
      loadLeads()
    }
    window.addEventListener('pipeline-stages-updated', handleStagesUpdate)
    return () => {
      window.removeEventListener('pipeline-stages-updated', handleStagesUpdate)
    }
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      
      // Use tour mock data if tour is running
      if (isTourRunning) {
        setLeads(dummyTourLeads as Lead[])
        setLoading(false)
        return
      }
      
      const fetchedLeads = await getLeads()
      setLeads(fetchedLeads)
    } catch (error: any) {
      console.error('Error loading leads:', error)
      // Check if it's a table doesn't exist error
      if (error?.message?.includes('relation') || error?.code === '42P01') {
        toast.error('Leads table not found. Please run the database migration first.')
      } else {
        toast.error('Failed to load leads: ' + (error?.message || 'Unknown error'))
      }
    } finally {
      setLoading(false)
    }
  }

  // Prefill from forms submissions
  useEffect(() => {
    const prefill = searchParams?.get("prefillLead")
    if (prefill) {
      try {
        const raw = localStorage.getItem("prefillLead")
        if (raw) {
          const data = JSON.parse(raw)
          setNewLeadName(data.name || "")
          setNewLeadEmail(data.email || "")
          setNewLeadCompany("")
          setNewLeadPhone("")
          setNewLeadValueAmount("")
          setNewLeadNotes("")
          setNewLeadOpen(true)
          localStorage.removeItem("prefillLead")
        }
      } catch {}
    }
  }, [searchParams])

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesName = lead.name?.toLowerCase().includes(query)
        const matchesCompany = lead.company?.toLowerCase().includes(query) || false
        const matchesEmail = lead.email?.toLowerCase().includes(query) || false
        const matchesStatus = lead.status?.toLowerCase().includes(query) || false
        if (!matchesName && !matchesCompany && !matchesEmail && !matchesStatus) {
          return false
        }
      }
      
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false
      }
      
      if (sourceFilter !== "all" && lead.source !== sourceFilter) {
        return false
      }
      if (showPortfolioOnly && lead.source !== "Portfolio") {
        return false
      }
      
      if (segment === "active" && (lead.status === "Won" || lead.status === "Lost")) {
        return false
      }
      if (segment === "won" && lead.status !== "Won") {
        return false
      }
      if (segment === "lost" && lead.status !== "Lost") {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        const aDate = a.last_contacted_at ? new Date(a.last_contacted_at).getTime() : new Date(a.created_at).getTime()
        const bDate = b.last_contacted_at ? new Date(b.last_contacted_at).getTime() : new Date(b.created_at).getTime()
        return bDate - aDate
      }
      if (sortBy === "value") {
        return (b.value || 0) - (a.value || 0)
      }
      return 0
    })
  }, [leads, searchQuery, statusFilter, sourceFilter, sortBy, segment, showPortfolioOnly])

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setIsEditing(false)
    // Populate edit fields
    setEditLeadName(lead.name)
    setEditLeadCompany(lead.company || "")
    setEditLeadEmail(lead.email || "")
    setEditLeadPhone(lead.phone || "")
    setEditLeadTwitter(lead.social_media?.twitter || "")
    setEditLeadLinkedIn(lead.social_media?.linkedIn || "")
    setEditLeadInstagram(lead.social_media?.instagram || "")
    setEditLeadSource(lead.source)
    setEditLeadStatus(lead.status)
    setEditLeadValue(lead.value?.toString() || "")
    setEditLeadNotes(lead.notes || "")
    setEditLeadPortfolioUrl(lead.portfolio_url || "")
    setLeadDrawerOpen(true)
  }

  const handleEditLead = (lead: Lead) => {
    setSelectedLead(lead)
    setIsEditing(true)
    // Populate edit fields
    setEditLeadName(lead.name)
    setEditLeadCompany(lead.company || "")
    setEditLeadEmail(lead.email || "")
    setEditLeadPhone(lead.phone || "")
    setEditLeadTwitter(lead.social_media?.twitter || "")
    setEditLeadLinkedIn(lead.social_media?.linkedIn || "")
    setEditLeadInstagram(lead.social_media?.instagram || "")
    setEditLeadSource(lead.source)
    setEditLeadStatus(lead.status)
    setEditLeadValue(lead.value?.toString() || "")
    setEditLeadNotes(lead.notes || "")
    setEditLeadPortfolioUrl(lead.portfolio_url || "")
    setLeadDrawerOpen(true)
  }

  const handleSaveLead = async () => {
    if (!selectedLead) return

    try {
      setIsUpdating(true)
      const socialMedia: Record<string, string> = {}
      if (editLeadTwitter) socialMedia.twitter = editLeadTwitter
      if (editLeadLinkedIn) socialMedia.linkedIn = editLeadLinkedIn
      if (editLeadInstagram) socialMedia.instagram = editLeadInstagram

      const updatedLead = await updateLead(selectedLead.id, {
        name: editLeadName,
        company: editLeadCompany || null,
        email: editLeadEmail || null,
        phone: editLeadPhone || null,
        social_media: socialMedia,
        source: editLeadSource,
        status: editLeadStatus,
        value: editLeadValue ? parseFloat(editLeadValue) : 0,
        notes: editLeadNotes || null,
        portfolio_url: editLeadPortfolioUrl || null,
      })

      if (updatedLead) {
        setLeads(leads.map(l => l.id === selectedLead.id ? updatedLead : l))
        setSelectedLead(updatedLead)
        setIsEditing(false)
        toast.success('Lead updated successfully!')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteLeads(selectedLeads)
      setLeads(leads.filter(l => !selectedLeads.includes(l.id)))
      setSelectedLeads([])
      toast.success(`${selectedLeads.length} leads deleted`)
    } catch (error) {
      console.error('Error deleting leads:', error)
      toast.error('Failed to delete leads')
    }
  }

  const handleCreateLead = async () => {
    if (!newLeadName.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setIsSaving(true)
      const socialMedia: Record<string, string> = {}
      if (newLeadTwitter) socialMedia.twitter = newLeadTwitter
      if (newLeadLinkedIn) socialMedia.linkedIn = newLeadLinkedIn
      if (newLeadInstagram) socialMedia.instagram = newLeadInstagram

      const newLead = await createLead({
        name: newLeadName,
        company: newLeadCompany || undefined,
        email: newLeadEmail || undefined,
        phone: newLeadPhone || undefined,
        social_media: Object.keys(socialMedia).length > 0 ? socialMedia : undefined,
        source: newLeadSource,
        status: newLeadStatus,
        value: newLeadValueAmount ? parseFloat(newLeadValueAmount) : undefined,
        notes: newLeadNotes || undefined,
        portfolio_url: newLeadPortfolioUrl || undefined,
      })

      if (newLead) {
        setLeads([newLead, ...leads])
        toast.success('Lead created successfully!')
        // Reset form
        setNewLeadName("")
        setNewLeadCompany("")
        setNewLeadEmail("")
        setNewLeadPhone("")
        setNewLeadSource("Manual Import")
        setNewLeadStatus("New")
        setNewLeadValueAmount("")
        setNewLeadNotes("")
        setNewLeadTwitter("")
        setNewLeadLinkedIn("")
        setNewLeadInstagram("")
        setNewLeadPortfolioUrl("")
        setNewLeadOpen(false)
      }
    } catch (error) {
      console.error('Error creating lead:', error)
      toast.error('Failed to create lead')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    try {
      await deleteLead(leadId)
      setLeads(leads.filter(l => l.id !== leadId))
      if (selectedLead?.id === leadId) {
        setLeadDrawerOpen(false)
        setSelectedLead(null)
      }
      toast.success('Lead deleted successfully')
    } catch (error) {
      console.error('Error deleting lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const handleUpdateLeadStatus = async (leadId: string, status: Lead['status']) => {
    try {
      await updateLead(leadId, { status })
      setLeads(leads.map(l => l.id === leadId ? { ...l, status } : l))
      if (selectedLead?.id === leadId) {
        setSelectedLead({ ...selectedLead, status })
      }
      toast.success('Lead status updated')
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Failed to update lead status')
    }
  }

  const handleBulkStatusChange = async (status: Lead['status']) => {
    try {
      await bulkUpdateLeadStatus(selectedLeads, status)
      setLeads(leads.map(l => selectedLeads.includes(l.id) ? { ...l, status } : l))
      setSelectedLeads([])
      toast.success(`Status updated for ${selectedLeads.length} leads`)
    } catch (error) {
      console.error('Error updating lead status:', error)
      toast.error('Failed to update lead status')
    }
  }

  const getStatusColor = (status: string, statusColor?: string) => {
    if (statusColor) {
      const hexToRgba = (hex: string, alpha: number) => {
        const sanitized = hex.replace('#', '')
        const bigint = parseInt(sanitized.length === 3 ? sanitized.split('').map(c => c + c).join('') : sanitized, 16)
        const r = (bigint >> 16) & 255
        const g = (bigint >> 8) & 255
        const b = bigint & 255
        return `rgba(${r}, ${g}, ${b}, ${alpha})`
      }
      return {
        backgroundColor: hexToRgba(statusColor, 0.12),
        color: statusColor,
        borderColor: hexToRgba(statusColor, 0.3)
      }
    }
    const colors: Record<string, string> = {
      "New": "bg-blue-100 text-blue-700",
      "Contacted": "bg-purple-100 text-purple-700",
      "Qualified": "bg-green-100 text-green-700",
      "Proposal Sent": "bg-yellow-100 text-yellow-700",
      "Won": "bg-emerald-100 text-emerald-700",
      "Lost": "bg-red-100 text-red-700",
    }
    return colors[status] || "bg-gray-100 text-gray-700"
  }

  const handleOpenChangeStatus = (lead: any) => {
    setStatusChangeLead(lead)
    const statusNames = getStatusNames()
    // Check if it's a known status
    if (statusNames.includes(lead.status)) {
      setSelectedStatusOption(lead.status)
      setCustomStatusName("")
      setCustomStatusColor("#6366F1")
    } else {
      // It's a custom status
      setSelectedStatusOption("Custom")
      setCustomStatusName(lead.status)
      setCustomStatusColor((lead as any).statusColor || "#6366F1")
    }
    setChangeStatusModalOpen(true)
  }

  const handleSaveStatusChange = async () => {
    if (!statusChangeLead) return
    const newStatus = selectedStatusOption === "Custom" ? (customStatusName.trim() || "Custom") : selectedStatusOption
    try {
      const updatedLead = await updateLead(statusChangeLead.id, { status: newStatus as Lead['status'] })
      if (updatedLead) {
        setLeads(leads.map(l => l.id === statusChangeLead.id ? updatedLead : l))
        if (selectedLead?.id === statusChangeLead.id) {
          setSelectedLead(updatedLead)
        }
        toast.success(`Status changed to ${newStatus}`)
        setChangeStatusModalOpen(false)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Management</h2>
            </div>
            <p className="text-gray-600 ml-[60px]">Track, organize, and convert your leads.</p>
        </div>
        <div className="flex items-center gap-3">
            <Button variant="outline" data-help="btn-pipeline-view" onClick={() => router.push('/dashboard/pipeline')}>
              <GitBranch className="mr-2 h-4 w-4" />
              Pipeline View
            </Button>
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          <Button variant="outline" data-help="btn-import-csv" onClick={() => setImportCsvOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" data-help="btn-new-lead" onClick={() => setNewLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Lead
          </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4" data-help="search-filters-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            data-help="input-search-leads"
            placeholder="Search leads by name, company, or status…"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Switch id="portfolio-only" checked={showPortfolioOnly} onCheckedChange={setShowPortfolioOnly} />
          <Label htmlFor="portfolio-only">Show leads from portfolio</Label>
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" data-help="btn-filter">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {getStatusNames().map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="Lead Engine">Lead Engine</SelectItem>
                      <SelectItem value="Portfolio">Portfolio</SelectItem>
                      <SelectItem value="Website form">Website form</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Manual Import">Manual Import</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recently Added</SelectItem>
                    <SelectItem value="value">Lead Value (High → Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Segment Tabs */}
      <Tabs value={segment} onValueChange={setSegment} data-help="segment-tabs">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="won">Won</TabsTrigger>
          <TabsTrigger value="lost">Lost</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Actions */}
      {selectedLeads.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {selectedLeads.length} selected
          </span>
          <Select onValueChange={(value) => handleBulkStatusChange(value as Lead['status'])}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              {getStatusNames().map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedLeads([])}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Leads Table */}
      <Card data-help="leads-table">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
              <span className="ml-3 text-gray-600">Loading leads...</span>
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No leads yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first lead or importing from CSV</p>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={() => setNewLeadOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
                <Button variant="outline" onClick={() => setImportCsvOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedLeads.length === filteredLeads.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLeads(filteredLeads.map(l => l.id))
                          } else {
                            setSelectedLeads([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Company</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Social Media</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Source</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Pipeline</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleLeadClick(lead)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLeads([...selectedLeads, lead.id])
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id))
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{lead.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-gray-900">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{lead.company}</td>
                      <td className="px-4 py-4">
                        <div className="space-y-1 text-sm text-gray-600">
                          {lead.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </div>
                          )}
                          {!lead.email && !lead.phone && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {lead.social_media && Object.keys(lead.social_media).length > 0 ? (
                          <div className="space-y-1 text-sm text-gray-600">
                            {Object.entries(lead.social_media).map(([platform, username]) => (
                              <div key={platform} className="flex items-center gap-1">
                                <Globe className="h-3 w-3 text-gray-400" />
                                <span className="capitalize">{platform}:</span>
                                <span className="font-medium">{username}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <Badge 
                          className={typeof getStatusColor(lead.status, (lead as any).statusColor) === 'string' ? getStatusColor(lead.status, (lead as any).statusColor) as string : "border pointer-events-none"}
                          style={typeof getStatusColor(lead.status, (lead as any).statusColor) === 'object' ? getStatusColor(lead.status, (lead as any).statusColor) as React.CSSProperties : undefined}
                        >
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        ${(lead.value || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">{lead.source}</td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Navigate to pipeline with pre-filled search query
                            const q = encodeURIComponent(lead.name)
                            router.push(`/dashboard/pipeline?q=${q}`)
                          }}
                        >
                          View
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleOpenChangeStatus(lead)
                            }}>
                              <Tag className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleEditLead(lead)
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              const q = encodeURIComponent(lead.name)
                              router.push(`/dashboard/pipeline?q=${q}`)
                            }}>
                              <GitBranch className="mr-2 h-4 w-4" />
                              View Pipeline
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toast.info('Proposal feature coming soon')
                            }}>
                              <Send className="mr-2 h-4 w-4" />
                              Send Proposal
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              toast.info('Convert to client feature coming soon')
                            }}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Convert to Client
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm('Are you sure you want to delete this lead?')) {
                                  handleDeleteLead(lead.id)
                                }
                              }}
                            >
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
        </CardContent>
      </Card>

      {/* Pagination */}
      {filteredLeads.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredLeads.length} of {leads.length} leads
          </p>
        </div>
      )}

      {/* New Lead Modal */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input placeholder="John Doe" value={newLeadName} onChange={(e) => setNewLeadName(e.target.value)} />
              </div>
              <div>
                <Label>Company</Label>
                <Input placeholder="Company Inc" value={newLeadCompany} onChange={(e) => setNewLeadCompany(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="john@company.com" value={newLeadEmail} onChange={(e) => setNewLeadEmail(e.target.value)} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="(555) 123-4567" value={newLeadPhone} onChange={(e) => setNewLeadPhone(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Social Media</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Input 
                  placeholder="Twitter/X" 
                  value={newLeadTwitter}
                  onChange={(e) => setNewLeadTwitter(e.target.value)}
                />
                <Input 
                  placeholder="LinkedIn" 
                  value={newLeadLinkedIn}
                  onChange={(e) => setNewLeadLinkedIn(e.target.value)}
                />
                <Input 
                  placeholder="Instagram" 
                  value={newLeadInstagram}
                  onChange={(e) => setNewLeadInstagram(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Value</Label>
                <Input type="number" placeholder="10000" value={newLeadValueAmount} onChange={(e) => setNewLeadValueAmount(e.target.value)} />
              </div>
              <div>
                <Label>Source</Label>
                <Select 
                  value={newLeadSource}
                  onValueChange={(value) => {
                    setNewLeadSource(value as Lead['source'])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lead Engine">Lead Engine</SelectItem>
                    <SelectItem value="Portfolio">Portfolio</SelectItem>
                    <SelectItem value="Website form">Website form</SelectItem>
                    <SelectItem value="Social">Social</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Manual Import">Manual Import</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newLeadSource === 'Portfolio' && (
              <div>
                <Label>Portfolio URL</Label>
                <Input 
                  placeholder="https://yourportfolio.com/page"
                  value={newLeadPortfolioUrl}
                  onChange={(e) => setNewLeadPortfolioUrl(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Status</Label>
              <Select value={newLeadStatus} onValueChange={(v) => setNewLeadStatus(v as Lead['status'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatusNames().map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Add any notes about this lead..." rows={3} value={newLeadNotes} onChange={(e) => setNewLeadNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewLeadOpen(false)
              setNewLeadSource("Manual Import")
              setNewLeadStatus("New")
              setNewLeadName("")
              setNewLeadCompany("")
              setNewLeadEmail("")
              setNewLeadPhone("")
              setNewLeadValueAmount("")
              setNewLeadNotes("")
              setNewLeadTwitter("")
              setNewLeadLinkedIn("")
              setNewLeadInstagram("")
              setNewLeadPortfolioUrl("")
            }} disabled={isSaving}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" 
              onClick={handleCreateLead}
              disabled={isSaving || !newLeadName.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Lead'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import CSV Modal */}
      <ImportLeadsModal
        open={importCsvOpen}
        onOpenChange={setImportCsvOpen}
        onImportComplete={loadLeads}
      />

      {/* Lead Details Drawer */}
      <Sheet open={leadDrawerOpen} onOpenChange={(open) => {
        setLeadDrawerOpen(open)
        if (!open) {
          setIsEditing(false)
          setSelectedLead(null)
        }
      }}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{(isEditing ? editLeadName : selectedLead?.name)?.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {isEditing ? editLeadName : selectedLead?.name}
            </SheetTitle>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-6 space-y-6">
              <div className="flex items-center gap-3">
                {!isEditing && (
                  <Select 
                    value={selectedLead.status} 
                    onValueChange={(v) => handleUpdateLeadStatus(selectedLead.id, v as Lead['status'])}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                      <SelectItem value="Won">Won</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                )}
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (isEditing) {
                      // Reset to original values when canceling
                      if (selectedLead) {
                        setEditLeadName(selectedLead.name)
                        setEditLeadCompany(selectedLead.company || "")
                        setEditLeadEmail(selectedLead.email || "")
                        setEditLeadPhone(selectedLead.phone || "")
                        setEditLeadTwitter(selectedLead.social_media?.twitter || "")
                        setEditLeadLinkedIn(selectedLead.social_media?.linkedIn || "")
                        setEditLeadInstagram(selectedLead.social_media?.instagram || "")
                        setEditLeadSource(selectedLead.source)
                        setEditLeadStatus(selectedLead.status)
                        setEditLeadValue(selectedLead.value?.toString() || "")
                        setEditLeadNotes(selectedLead.notes || "")
                        setEditLeadPortfolioUrl(selectedLead.portfolio_url || "")
                      }
                    }
                    setIsEditing(!isEditing)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                {!isEditing && (
                  <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Convert to Client
                  </Button>
                )}
              </div>

              {/* Portfolio Message (if sourced from Portfolio) */}
              {selectedLead.source === "Portfolio" && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">
                    Message from {selectedLead.name}
                  </h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-800 leading-relaxed">
                      Hi there! I found your work through your portfolio and I'm interested in
                      discussing a new project. We're looking to redesign our product marketing
                      site with a modern, conversion-focused approach. Could you share your
                      availability next week for a quick call?
                    </p>
                    <div className="mt-3 text-xs text-gray-500">
                      Received via Portfolio • {format(new Date(), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Overview</h3>
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Name *</Label>
                        <Input 
                          value={editLeadName}
                          onChange={(e) => setEditLeadName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Company</Label>
                        <Input 
                          value={editLeadCompany}
                          onChange={(e) => setEditLeadCompany(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email</Label>
                        <Input 
                          type="email"
                          value={editLeadEmail}
                          onChange={(e) => setEditLeadEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Phone</Label>
                        <Input 
                          value={editLeadPhone}
                          onChange={(e) => setEditLeadPhone(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Social Media</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <Input 
                          placeholder="Twitter/X" 
                          value={editLeadTwitter}
                          onChange={(e) => setEditLeadTwitter(e.target.value)}
                        />
                        <Input 
                          placeholder="LinkedIn" 
                          value={editLeadLinkedIn}
                          onChange={(e) => setEditLeadLinkedIn(e.target.value)}
                        />
                        <Input 
                          placeholder="Instagram" 
                          value={editLeadInstagram}
                          onChange={(e) => setEditLeadInstagram(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Lead Value</Label>
                        <Input 
                          type="number"
                          value={editLeadValue}
                          onChange={(e) => setEditLeadValue(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Source</Label>
                        <Select value={editLeadSource} onValueChange={(v) => setEditLeadSource(v as Lead['source'])}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Lead Engine">Lead Engine</SelectItem>
                            <SelectItem value="Portfolio">Portfolio</SelectItem>
                            <SelectItem value="Website form">Website form</SelectItem>
                            <SelectItem value="Social">Social</SelectItem>
                            <SelectItem value="Referral">Referral</SelectItem>
                            <SelectItem value="Manual Import">Manual Import</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {editLeadSource === 'Portfolio' && (
                      <div>
                        <Label>Portfolio URL</Label>
                        <Input 
                          placeholder="https://yourportfolio.com/page"
                          value={editLeadPortfolioUrl}
                          onChange={(e) => setEditLeadPortfolioUrl(e.target.value)}
                        />
                      </div>
                    )}
                    <div>
                      <Label>Status</Label>
                      <Select value={editLeadStatus} onValueChange={(v) => setEditLeadStatus(v as Lead['status'])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getStatusNames().map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea 
                        rows={4}
                        value={editLeadNotes}
                        onChange={(e) => setEditLeadNotes(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false)
                          // Reset to original values
                          if (selectedLead) {
                            setEditLeadName(selectedLead.name)
                            setEditLeadCompany(selectedLead.company || "")
                            setEditLeadEmail(selectedLead.email || "")
                            setEditLeadPhone(selectedLead.phone || "")
                            setEditLeadTwitter(selectedLead.social_media?.twitter || "")
                            setEditLeadLinkedIn(selectedLead.social_media?.linkedIn || "")
                            setEditLeadInstagram(selectedLead.social_media?.instagram || "")
                            setEditLeadSource(selectedLead.source)
                            setEditLeadStatus(selectedLead.status)
                            setEditLeadValue(selectedLead.value?.toString() || "")
                            setEditLeadNotes(selectedLead.notes || "")
                            setEditLeadPortfolioUrl(selectedLead.portfolio_url || "")
                          }
                        }}
                        disabled={isUpdating}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveLead}
                        disabled={isUpdating || !editLeadName.trim()}
                        className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save Changes'
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Company</p>
                        <p className="font-medium">{selectedLead.company || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Lead Value</p>
                        <p className="font-medium">${(selectedLead.value || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedLead.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedLead.email}</p>
                        </div>
                      </div>
                    )}
                    {selectedLead.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-medium">{selectedLead.phone}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Social Media</p>
                        {selectedLead.social_media && Object.keys(selectedLead.social_media).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(selectedLead.social_media).map(([platform, username]) => (
                              <p key={platform} className="font-medium text-sm capitalize">{platform}: {username}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="font-medium text-gray-400">—</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Source</p>
                        <p className="font-medium">{selectedLead.source}</p>
                        {selectedLead.portfolio_url && (
                          <a href={selectedLead.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">
                            View Portfolio →
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Last Contacted</p>
                        <p className="font-medium">
                          {selectedLead.last_contacted_at 
                            ? format(new Date(selectedLead.last_contacted_at), "MMM d, yyyy")
                            : selectedLead.created_at
                            ? format(new Date(selectedLead.created_at), "MMM d, yyyy")
                            : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Notes & Activity</h3>
                  <div className="space-y-3">
                    {selectedLead.notes ? (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedLead.updated_at 
                            ? format(new Date(selectedLead.updated_at), "MMM d, yyyy 'at' h:mm a")
                            : format(new Date(selectedLead.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No notes yet</p>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Follow-Ups & Reminders</h3>
                <p className="text-sm text-gray-600">No reminders set</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reminder
                </Button>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Attachments</h3>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Paperclip className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Drag & drop files or click to upload</p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Change Status Modal */}
      <Dialog open={changeStatusModalOpen} onOpenChange={setChangeStatusModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Status</Label>
              <Select value={selectedStatusOption} onValueChange={(v: string) => setSelectedStatusOption(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getStatusNames().map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                  <SelectItem value="Custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedStatusOption === 'Custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <Label className="mb-1 block">Custom Status</Label>
                  <Input value={customStatusName} onChange={e => setCustomStatusName(e.target.value)} placeholder="e.g. On Hold" />
                </div>
                <div>
                  <Label className="mb-1 block">Color</Label>
                  <input type="color" value={customStatusColor} onChange={e => setCustomStatusColor(e.target.value)} className="h-10 w-full rounded border" />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setChangeStatusModalOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveStatusChange} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pipeline Settings Drawer */}
      <PipelineSettingsDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  )
}

