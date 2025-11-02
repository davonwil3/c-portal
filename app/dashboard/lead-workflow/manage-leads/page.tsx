"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"

// Mock data
const mockLeads = Array.from({ length: 50 }).map((_, i) => ({
  id: `lead-${i}`,
  name: ["Sarah Johnson", "Michael Chen", "Emily Davis", "David Miller", "Jessica Wilson"][i % 5],
  company: ["Tech Corp", "Design Studio", "Marketing Agency", "Startup Inc", "Consulting LLC"][i % 5],
  email: `contact${i}@company.com`,
  phone: `(555) 123-${String(i).padStart(4, '0')}`,
  status: ["New", "Contacted", "Qualified", "Proposal Sent", "Won", "Lost"][i % 6],
  source: ["Website", "Referral", "Ad Campaign", "Manual Import"][i % 4],
  value: Math.floor(Math.random() * 50000) + 5000,
  lastContacted: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
  owner: "You",
  notes: "Initial conversation went well. Interested in our premium package.",
}))

export default function ManageLeadsPage() {
  const [leads, setLeads] = useState(mockLeads)
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [sortBy, setSortBy] = useState("recent")
  const [segment, setSegment] = useState("all")
  
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [leadDrawerOpen, setLeadDrawerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [filterOpen, setFilterOpen] = useState(false)

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      // Search filter
      if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lead.company.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lead.status.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
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
        return b.lastContacted.getTime() - a.lastContacted.getTime()
      }
      if (sortBy === "value") {
        return b.value - a.value
      }
      return 0
    })
  }, [leads, searchQuery, statusFilter, sourceFilter, sortBy, segment])

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead)
    setLeadDrawerOpen(true)
  }

  const handleBulkDelete = () => {
    setLeads(leads.filter(l => !selectedLeads.includes(l.id)))
    setSelectedLeads([])
    toast.success(`${selectedLeads.length} leads deleted`)
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
                          <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-900">
                          ${lead.value.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">
                          {format(lead.lastContacted, "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">{lead.owner}</td>
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
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input placeholder="John Doe" />
              </div>
              <div>
                <Label>Company</Label>
                <Input placeholder="Company Inc" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="john@company.com" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input placeholder="(555) 123-4567" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lead Value</Label>
                <Input type="number" placeholder="10000" />
              </div>
              <div>
                <Label>Source</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="ad">Ad Campaign</SelectItem>
                    <SelectItem value="manual">Manual Import</SelectItem>
                  </SelectContent>
                </Select>
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
              <Textarea placeholder="Add any notes about this lead..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewLeadOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => {
              toast.success("Lead created successfully!")
              setNewLeadOpen(false)
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
              {/* Status & Actions */}
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

              {/* Notes & Activity */}
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

