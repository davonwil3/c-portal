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
  Paperclip,
  Download,
  GitBranch,
  Send,
  Tag,
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

// Mock data - same as pipeline page, mapped to ManageLeads structure (30 unique leads)
const pipelineMockLeads = [
  { name: "Sarah Johnson", company: "Tech Corp", source: "Reddit", stage: "new" },
  { name: "Michael Chen", company: "Design Studio", source: "Portfolio", stage: "contacted" },
  { name: "Emily Davis", company: "Marketing Agency", source: "Referral", stage: "discovery" },
  { name: "David Miller", company: "Startup Inc", source: "Ad Campaign", stage: "proposal" },
  { name: "Jessica Wilson", company: "Consulting LLC", source: "Reddit", stage: "negotiation" },
  { name: "Robert Brown", company: "Creative Co", source: "Inbound", stage: "won" },
  { name: "Lisa Anderson", company: "Digital Labs", source: "Portfolio", stage: "lost" },
  { name: "James Martinez", company: "Tech Solutions", source: "Ad Campaign", stage: "new" },
  { name: "Patricia Taylor", company: "Innovate Inc", source: "Reddit", stage: "contacted" },
  { name: "John Williams", company: "Design Works", source: "Inbound", stage: "discovery" },
  { name: "Jennifer Garcia", company: "Agency Pro", source: "Referral", stage: "proposal" },
  { name: "William Rodriguez", company: "Startup Hub", source: "Ad Campaign", stage: "negotiation" },
  { name: "Linda Lewis", company: "Tech Ventures", source: "Reddit", stage: "won" },
  { name: "Richard Walker", company: "Creative Minds", source: "Inbound", stage: "lost" },
  { name: "Barbara Hall", company: "Digital Dynamics", source: "Referral", stage: "new" },
  { name: "Joseph Allen", company: "Marketing Pro", source: "Ad Campaign", stage: "contacted" },
  { name: "Elizabeth Young", company: "Innovation Co", source: "Portfolio", stage: "discovery" },
  { name: "Thomas King", company: "Tech Innovations", source: "Inbound", stage: "proposal" },
  { name: "Susan Wright", company: "Design Hub", source: "Referral", stage: "negotiation" },
  { name: "Christopher Lopez", company: "Startup Labs", source: "Ad Campaign", stage: "won" },
  { name: "Karen Hill", company: "Creative Solutions", source: "Reddit", stage: "lost" },
  { name: "Daniel Scott", company: "Tech Group", source: "Inbound", stage: "new" },
  { name: "Nancy Green", company: "Marketing Masters", source: "Referral", stage: "contacted" },
  { name: "Paul Adams", company: "Digital Works", source: "Ad Campaign", stage: "discovery" },
  { name: "Betty Baker", company: "Innovate Labs", source: "Reddit", stage: "proposal" },
  { name: "Mark Gonzalez", company: "Tech Partners", source: "Inbound", stage: "negotiation" },
  { name: "Margaret Nelson", company: "Design Studio Pro", source: "Referral", stage: "won" },
  { name: "Donald Carter", company: "Startup Network", source: "Ad Campaign", stage: "lost" },
  { name: "Dorothy Mitchell", company: "Creative Agency", source: "Reddit", stage: "new" },
  { name: "Kenneth Perez", company: "Tech Collective", source: "Inbound", stage: "contacted" },
]

const mockLeads = pipelineMockLeads.map((lead, i) => {
  // Map pipeline stage to ManageLeads status
  const stageToStatus: Record<string, string> = {
    "new": "New",
    "contacted": "Contacted",
    "discovery": "Qualified",
    "proposal": "Proposal Sent",
    "negotiation": "Proposal Sent",
    "won": "Won",
    "lost": "Lost",
  }
  
  // Map pipeline source to ManageLeads source format
  const sourceMap: Record<string, string> = {
    "Reddit": "Reddit",
    "Inbound": "Inbound",
    "Referral": "Referral",
    "Ad Campaign": "Ad Campaign",
  }
  
  return {
  id: `lead-${i}`,
    name: lead.name,
    company: lead.company,
    email: `contact${i}@${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
    status: stageToStatus[lead.stage] || "New",
    source: sourceMap[lead.source] || lead.source,
  value: Math.floor(Math.random() * 50000) + 5000,
  lastContacted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  notes: "Initial conversation went well. Interested in our premium package.",
  }
})

export function ManageLeadsSection() {
  const router = useRouter()
  const [leads, setLeads] = useState(mockLeads)
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
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [changeStatusModalOpen, setChangeStatusModalOpen] = useState(false)
  const [statusChangeLead, setStatusChangeLead] = useState<any>(null)
  const [selectedStatusOption, setSelectedStatusOption] = useState<string>("New")
  const [customStatusName, setCustomStatusName] = useState("")
  const [customStatusColor, setCustomStatusColor] = useState("#6366F1")
  const searchParams = useSearchParams()

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
  
  // New lead form state
  const [newLeadSource, setNewLeadSource] = useState("")
  const [customSource, setCustomSource] = useState("")
  const [showCustomSourceInput, setShowCustomSourceInput] = useState(false)

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lead.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lead.status.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
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
        return b.lastContacted.getTime() - a.lastContacted.getTime()
      }
      if (sortBy === "value") {
        return b.value - a.value
      }
      return 0
    })
  }, [leads, searchQuery, statusFilter, sourceFilter, sortBy, segment, showPortfolioOnly])

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead)
    setLeadDrawerOpen(true)
  }

  const handleBulkDelete = () => {
    setLeads(leads.filter(l => !selectedLeads.includes(l.id)))
    setSelectedLeads([])
    toast.success(`${selectedLeads.length} leads deleted`)
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
    // Check if it's a custom status (not in defaultStatuses)
    if (defaultStatuses.includes(lead.status)) {
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

  const handleSaveStatusChange = () => {
    if (!statusChangeLead) return
    const newStatus = selectedStatusOption === "Custom" ? (customStatusName.trim() || "Custom") : selectedStatusOption
    const statusColor = selectedStatusOption === "Custom" ? customStatusColor : undefined
    setLeads(leads.map(l => l.id === statusChangeLead.id ? { ...l, status: newStatus, statusColor } : l))
    toast.success(`Status changed to ${newStatus}`)
    setChangeStatusModalOpen(false)
  }

  const defaultStatuses = ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"]

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
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/pipeline'}>
              <GitBranch className="mr-2 h-4 w-4" />
              Pipeline View
            </Button>
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
        <div className="flex items-center gap-2 whitespace-nowrap">
          <Switch id="portfolio-only" checked={showPortfolioOnly} onCheckedChange={setShowPortfolioOnly} />
          <Label htmlFor="portfolio-only">Show leads from portfolio</Label>
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
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Change Status
          </Button>
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
          {filteredLeads.length === 0 ? (
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
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </div>
                        </div>
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
                        ${lead.value.toLocaleString()}
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
                            <DropdownMenuItem onClick={() => handleOpenChangeStatus(lead)}>
                              <Tag className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <GitBranch className="mr-2 h-4 w-4" />
                              View Pipeline
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send Proposal
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
                    setNewLeadSource(value)
                    if (value === "custom") {
                      setShowCustomSourceInput(true)
                    } else {
                      setShowCustomSourceInput(false)
                      setCustomSource("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Ad Campaign">Ad Campaign</SelectItem>
                    <SelectItem value="Manual Import">Manual Import</SelectItem>
                    <SelectItem value="Reddit">Reddit</SelectItem>
                    <SelectItem value="Inbound">Inbound</SelectItem>
                    <SelectItem value="custom">Custom Source</SelectItem>
                  </SelectContent>
                </Select>
                {showCustomSourceInput && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom source..."
                    value={customSource}
                    onChange={(e) => setCustomSource(e.target.value)}
                  />
                )}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select defaultValue="new">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
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
              setNewLeadSource("")
              setCustomSource("")
              setShowCustomSourceInput(false)
              setNewLeadName("")
              setNewLeadCompany("")
              setNewLeadEmail("")
              setNewLeadPhone("")
              setNewLeadValueAmount("")
              setNewLeadNotes("")
            }}>
              Cancel
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => {
              const finalSource = newLeadSource === "custom" ? customSource : newLeadSource
              if (newLeadSource === "custom" && !customSource.trim()) {
                toast.error("Please enter a custom source")
                return
              }
              // Add lead logic would go here
              toast.success("Lead created successfully!")
              setNewLeadOpen(false)
              setNewLeadSource("")
              setCustomSource("")
              setShowCustomSourceInput(false)
              setNewLeadName("")
              setNewLeadCompany("")
              setNewLeadEmail("")
              setNewLeadPhone("")
              setNewLeadValueAmount("")
              setNewLeadNotes("")
            }}>
              Save Lead
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
              <div className="flex items-center gap-3">
                <Select defaultValue={selectedLead.status.toLowerCase()}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal sent">Proposal Sent</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
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
                      <p className="font-medium">${selectedLead.value.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedLead.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedLead.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Source</p>
                      <p className="font-medium">{selectedLead.source}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Last Contacted</p>
                      <p className="font-medium">{format(selectedLead.lastContacted, "MMM d, yyyy")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Notes & Activity</h3>
                <div className="space-y-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                    <p className="text-xs text-gray-500 mt-2">{format(selectedLead.lastContacted, "MMM d, yyyy 'at' h:mm a")}</p>
                  </div>
                </div>
                <div>
                  <Textarea placeholder="Add a note..." rows={3} />
                  <Button className="mt-2">Add Note</Button>
                </div>
              </div>

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
                  {defaultStatuses.map((status) => (
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
    </div>
  )
}

