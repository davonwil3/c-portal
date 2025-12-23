"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Archive,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Building2,
  DollarSign,
  Calendar,
  FileText,
  X,
  Check,
  AlertCircle,
  Paperclip,
  Download,
  Loader2,
  Globe,
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

export default function ManageLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [segment, setSegment] = useState("all")
  
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // New lead form state
  const [newLeadName, setNewLeadName] = useState("")
  const [newLeadCompany, setNewLeadCompany] = useState("")
  const [newLeadEmail, setNewLeadEmail] = useState("")
  const [newLeadPhone, setNewLeadPhone] = useState("")
  const [newLeadSource, setNewLeadSource] = useState<Lead['source']>("Manual Import")
  const [newLeadStatus, setNewLeadStatus] = useState<Lead['status']>("New")
  const [newLeadValue, setNewLeadValue] = useState("")
  const [newLeadNotes, setNewLeadNotes] = useState("")
  const [newLeadTwitter, setNewLeadTwitter] = useState("")
  const [newLeadLinkedIn, setNewLeadLinkedIn] = useState("")
  const [newLeadInstagram, setNewLeadInstagram] = useState("")
  const [newLeadPortfolioUrl, setNewLeadPortfolioUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  // Load leads on mount
  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const fetchedLeads = await getLeads()
      setLeads(fetchedLeads)
    } catch (error) {
      console.error('Error loading leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
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
      
      // Status filter
      if (statusFilter !== "all" && lead.status !== statusFilter) {
        return false
      }
      
      // Source filter
      if (sourceFilter !== "all" && lead.source !== sourceFilter) {
        return false
      }
      
      // Segment filter
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
  }, [leads, searchQuery, statusFilter, sourceFilter, sortBy, segment])

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead)
    setLeadDrawerOpen(true)
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
        value: newLeadValue ? parseFloat(newLeadValue) : undefined,
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
        setNewLeadValue("")
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

  const handleUpdateLastContacted = async (leadId: string) => {
    try {
      await updateLeadLastContacted(leadId)
      const updatedLead = await getLeads()
      setLeads(updatedLead)
      if (selectedLead?.id === leadId) {
        const updated = updatedLead.find(l => l.id === leadId)
        if (updated) setSelectedLead(updated)
      }
      toast.success('Last contacted date updated')
    } catch (error) {
      console.error('Error updating last contacted:', error)
      toast.error('Failed to update last contacted date')
    }
  }

  const getStatusColor = (status: string) => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-1">Manage and track your potential clients</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setImportCsvOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => setNewLeadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search leads by name, company, or status…"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Popover open={filterOpen} onOpenChange={setFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
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
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Contacted">Contacted</SelectItem>
                      <SelectItem value="Qualified">Qualified</SelectItem>
                      <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                      <SelectItem value="Won">Won</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
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
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Ad Campaign">Ad Campaign</SelectItem>
                      <SelectItem value="Portfolio">Portfolio</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Manual Import">Manual Import</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
        <Tabs value={segment} onValueChange={setSegment}>
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
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Qualified">Qualified</SelectItem>
                <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                <SelectItem value="Won">Won</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
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
        <Card>
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Last Contacted</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Owner</th>
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
                            {lead.social_media && Object.keys(lead.social_media).length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Globe className="h-3 w-3" />
                                {Object.entries(lead.social_media).map(([platform, username]) => (
                                  <span key={platform}>{platform}: {username}</span>
                                )).join(', ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          ${(lead.value || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {lead.last_contacted_at 
                            ? format(new Date(lead.last_contacted_at), "MMM d, yyyy")
                            : lead.created_at 
                            ? format(new Date(lead.created_at), "MMM d, yyyy")
                            : '—'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{lead.owner_name || 'You'}</td>
                        <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Convert to Client
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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
      </div>

      {/* New Lead Modal */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input 
                  placeholder="John Doe" 
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input 
                  placeholder="Company Inc" 
                  value={newLeadCompany}
                  onChange={(e) => setNewLeadCompany(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input 
                  type="email" 
                  placeholder="john@company.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input 
                  placeholder="(555) 123-4567"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Social Media</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <Input 
                    placeholder="Twitter/X" 
                    value={newLeadTwitter}
                    onChange={(e) => setNewLeadTwitter(e.target.value)}
                  />
                </div>
                <div>
                  <Input 
                    placeholder="LinkedIn" 
                    value={newLeadLinkedIn}
                    onChange={(e) => setNewLeadLinkedIn(e.target.value)}
                  />
                </div>
                <div>
                  <Input 
                    placeholder="Instagram" 
                    value={newLeadInstagram}
                    onChange={(e) => setNewLeadInstagram(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Value</Label>
                <Input 
                  type="number" 
                  placeholder="10000"
                  value={newLeadValue}
                  onChange={(e) => setNewLeadValue(e.target.value)}
                />
              </div>
              <div>
                <Label>Source</Label>
                <Select value={newLeadSource} onValueChange={(v) => setNewLeadSource(v as Lead['source'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Ad Campaign">Ad Campaign</SelectItem>
                    <SelectItem value="Portfolio">Portfolio</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Manual Import">Manual Import</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Proposal Sent">Proposal Sent</SelectItem>
                  <SelectItem value="Won">Won</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea 
                placeholder="Add any notes about this lead..." 
                rows={3}
                value={newLeadNotes}
                onChange={(e) => setNewLeadNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeadOpen(false)} disabled={isSaving}>
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
      <Dialog open={importCsvOpen} onOpenChange={setImportCsvOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Leads from CSV</DialogTitle>
          </DialogHeader>
          <div className="py-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">Drag & drop your CSV file</p>
              <p className="text-sm text-gray-600 mb-4">or click to browse</p>
              <Button variant="outline">Choose File</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportCsvOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              Import Leads
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Details Drawer */}
      <Sheet open={leadDrawerOpen} onOpenChange={setLeadDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{selectedLead?.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              {selectedLead?.name}
            </SheetTitle>
          </SheetHeader>

          {selectedLead && (
            <div className="mt-6 space-y-6">
              {/* Status & Actions */}
              <div className="flex items-center gap-3">
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
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convert to Client
                </Button>
              </div>

              {/* Key Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Company</p>
                      <p className="font-medium">{selectedLead.company}</p>
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
                  {selectedLead.social_media && Object.keys(selectedLead.social_media).length > 0 && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Social Media</p>
                        <div className="space-y-1">
                          {Object.entries(selectedLead.social_media).map(([platform, username]) => (
                            <p key={platform} className="font-medium text-sm capitalize">{platform}: {username}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
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
              </div>

              {/* Notes & Activity */}
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
                <div>
                  <Textarea placeholder="Add a note..." rows={3} />
                  <Button className="mt-2">Add Note</Button>
                </div>
              </div>

              {/* Follow-ups */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Follow-Ups & Reminders</h3>
                <p className="text-sm text-gray-600">No reminders set</p>
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Reminder
                </Button>
              </div>

              {/* Attachments */}
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
    </DashboardLayout>
  )
}

