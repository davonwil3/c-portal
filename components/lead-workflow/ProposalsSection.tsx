"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProposalWizard } from "./ProposalWizard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  FileText,
  Mail,
  Building2,
  DollarSign,
  Calendar as CalendarIcon,
  X,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Check,
  Clock,
  AlertCircle,
  Send,
  Files,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { format, subDays } from "date-fns"
import { getProposals, deleteProposal, duplicateProposal, type Proposal } from "@/lib/proposals"
import { getClients } from "@/lib/clients"
import { getLeads } from "@/lib/leads"
import { Loader2 } from "lucide-react"

type ProposalStatus = "Draft" | "Sent" | "Accepted" | "Declined"

export function ProposalsSection() {
  const router = useRouter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedProposals, setSelectedProposals] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState("recent")
  const [dateRangeOpen, setDateRangeOpen] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [leadPickerOpen, setLeadPickerOpen] = useState(false)
  const [leadSearch, setLeadSearch] = useState("")
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const [selectedLead, setSelectedLead] = useState<{ id: string; name: string; company: string; email: string } | null>(null)
  const [leads, setLeads] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [leadsLoading, setLeadsLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [useCustomLead, setUseCustomLead] = useState(false)
  const [recipientType, setRecipientType] = useState<'lead' | 'client'>('lead')
  const [customLeadName, setCustomLeadName] = useState("")
  const [customLeadCompany, setCustomLeadCompany] = useState("")
  const [customLeadEmail, setCustomLeadEmail] = useState("")
  const [proposalDrawerOpen, setProposalDrawerOpen] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState<any>(null)
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })

  // Load proposals from database
  useEffect(() => {
    const loadProposals = async () => {
      try {
        setLoading(true)
        const fetchedProposals = await getProposals()
        setProposals(fetchedProposals)
      } catch (error: any) {
        console.error('Error loading proposals:', error)
        toast.error('Failed to load proposals: ' + (error?.message || 'Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    loadProposals()
  }, [])

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: proposals.length,
      draft: proposals.filter(p => p.status === "Draft").length,
      sent: proposals.filter(p => p.status === "Sent").length,
      accepted: proposals.filter(p => p.status === "Accepted").length,
      declined: proposals.filter(p => p.status === "Declined").length,
    }
  }, [proposals])

  // Filter proposals
  const filteredProposals = useMemo(() => {
    return proposals.filter(proposal => {
      if (searchQuery && 
          !proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !proposal.recipient.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !proposal.id.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      if (statusFilter !== "all" && proposal.status.toLowerCase() !== statusFilter) {
        return false
      }
      
      // Date range uses Date Sent when present, otherwise createdAt
      const baseDate = proposal.dateSent || proposal.createdAt
      if (dateRange.from && baseDate < dateRange.from) {
        return false
      }
      
      if (dateRange.to && baseDate > dateRange.to) {
        return false
      }
      
      return true
    })
    .sort((a, b) => {
      if (sortBy === "recent") {
        return b.lastActivity.getTime() - a.lastActivity.getTime()
      }
      if (sortBy === "value") {
        return b.value - a.value
      }
      if (sortBy === "date_newest") {
        return (b.dateSent?.getTime() || 0) - (a.dateSent?.getTime() || 0)
      }
      if (sortBy === "date_oldest") {
        return (a.dateSent?.getTime() || 0) - (b.dateSent?.getTime() || 0)
      }
      if (sortBy === "recipient") {
        return a.recipient.name.localeCompare(b.recipient.name)
      }
      return 0
    })
  }, [proposals, searchQuery, statusFilter, sortBy, dateRange])

  const handleProposalClick = (proposal: any) => {
    // Navigate to proposal builder with the proposal ID
    router.push(`/dashboard/proposals/create?id=${proposal.id}`)
  }

  const handleView = (proposal: any) => {
    // Navigate to proposal builder with the proposal ID
    router.push(`/dashboard/proposals/create?id=${proposal.id}`)
  }

  const handleDuplicate = async (proposal: any) => {
    try {
      await duplicateProposal(proposal.id)
      toast.success('Proposal duplicated successfully')
      // Reload proposals
      const fetchedProposals = await getProposals()
      setProposals(fetchedProposals)
    } catch (error: any) {
      console.error('Error duplicating proposal:', error)
      toast.error('Failed to duplicate proposal: ' + (error?.message || 'Unknown error'))
    }
  }

  const handleDelete = async (proposalId: string) => {
    try {
      await deleteProposal(proposalId)
      setProposals(proposals.filter(p => p.id !== proposalId))
      toast.success('Proposal deleted successfully')
    } catch (error: any) {
      console.error('Error deleting proposal:', error)
      toast.error('Failed to delete proposal: ' + (error?.message || 'Unknown error'))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProposals.map(id => deleteProposal(id)))
      setProposals(proposals.filter(p => !selectedProposals.includes(p.id)))
      setSelectedProposals([])
      toast.success(`${selectedProposals.length} proposals deleted`)
    } catch (error: any) {
      console.error('Error deleting proposals:', error)
      toast.error('Failed to delete proposals')
    }
  }

  const handleCopyLink = (proposal: Proposal) => {
    // Use UUID for the live link, fallback to id if UUID not available
    const proposalUuid = proposal.uuid || proposal.id
    // Use subdomain format as per middleware: proposal.[proposalid].jolix.io
    // In development, still use production format for the copied link
    const link = `https://proposal.${proposalUuid}.jolix.io`
    navigator.clipboard.writeText(link)
    toast.success("Link copied to clipboard")
  }

  // Load leads and clients when modal opens
  useEffect(() => {
    if (leadPickerOpen) {
      const loadLeadsAndClients = async () => {
        setLeadsLoading(true)
        try {
          const [fetchedLeads, fetchedClients] = await Promise.all([
            getLeads(),
            getClients()
          ])
          setLeads(fetchedLeads)
          setClients(fetchedClients)
        } catch (error) {
          console.error('Error loading leads/clients:', error)
          toast.error('Failed to load leads and clients')
        } finally {
          setLeadsLoading(false)
        }
      }
      loadLeadsAndClients()
    }
  }, [leadPickerOpen])

  const getStatusColor = (status: ProposalStatus) => {
    const colors: Record<ProposalStatus, string> = {
      "Draft": "bg-gray-100 text-gray-700",
      "Sent": "bg-blue-100 text-blue-700",
      "Viewed": "bg-purple-100 text-purple-700",
      "Accepted": "bg-green-100 text-green-700",
      "Declined": "bg-red-100 text-red-700",
      "Expired": "bg-orange-100 text-orange-700",
    }
    return colors[status]
  }

  const getActivityIcon = (type: string) => {
    switch(type) {
      case "created": return <FileText className="h-4 w-4 text-gray-500" />
      case "sent": return <Send className="h-4 w-4 text-blue-500" />
      case "accepted": return <Check className="h-4 w-4 text-green-500" />
      case "declined": return <X className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays}d ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`
    return format(date, "MMM d, yyyy")
  }

  // Show wizard instead of main content
  if (showWizard) {
    return (
      <ProposalWizard
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false)
          toast.success("Proposal sent successfully!")
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Proposals</h2>
            </div>
            <p className="text-gray-600 ml-[60px]">Create, send, and track professional proposals.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" data-help="btn-new-proposal" onClick={() => setLeadPickerOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Proposal
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative" data-help="proposals-search-bar">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          data-help="input-search-proposals"
          placeholder="Search title, recipient, ID…"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} data-help="proposals-status-tabs">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700">
              {statusCounts.all}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="gap-2">
            Draft
            <Badge variant="secondary" className="ml-1 bg-gray-200 text-gray-700">
              {statusCounts.draft}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            Sent
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
              {statusCounts.sent}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="viewed" className="gap-2">
            Viewed
            <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-700">
              {statusCounts.viewed}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted" className="gap-2">
            Accepted
            <Badge variant="secondary" className="ml-1 bg-green-100 text-green-700">
              {statusCounts.accepted}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="declined" className="gap-2">
            Declined
            <Badge variant="secondary" className="ml-1 bg-red-100 text-red-700">
              {statusCounts.declined}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Popover open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recently updated</SelectItem>
            <SelectItem value="value">Value (high → low)</SelectItem>
            <SelectItem value="recipient">Recipient A → Z</SelectItem>
            <SelectItem value="date_newest">Date Sent (newest → oldest)</SelectItem>
            <SelectItem value="date_oldest">Date Sent (oldest → newest)</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Selector */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>

        {dateRange.from && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDateRange({ from: undefined, to: undefined })}
            className="gap-1"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedProposals.length > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            {selectedProposals.length} selected
          </span>
          <Button variant="outline" size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Change Status
          </Button>
          <Button variant="outline" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedProposals([])}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Proposals Table */}
      <Card data-help="proposals-table">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#3C3CFF] mb-4" />
              <p className="text-gray-600">Loading proposals...</p>
            </div>
          ) : filteredProposals.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-[#3C3CFF]/10 to-[#6366F1]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-[#3C3CFF]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No proposals yet</h3>
              <p className="text-gray-600 mb-6">Get started by creating your first proposal for a lead.</p>
              <div className="flex justify-center">
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => setLeadPickerOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Make a Proposal
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Checkbox
                        checked={selectedProposals.length === filteredProposals.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProposals(filteredProposals.map(p => p.id))
                          } else {
                            setSelectedProposals([])
                          }
                        }}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Recipient</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Value</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date Sent</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Link</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProposals.map((proposal) => (
                    <tr
                      key={proposal.id}
                      className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleProposalClick(proposal)}
                    >
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProposals.includes(proposal.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedProposals([...selectedProposals, proposal.id])
                            } else {
                              setSelectedProposals(selectedProposals.filter(id => id !== proposal.id))
                            }
                          }}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{proposal.title}</div>
                          <div className="text-xs text-gray-500">{proposal.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {proposal.recipient.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{proposal.recipient.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              {proposal.recipient.company}
                              <span>·</span>
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {proposal.recipient.type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {proposal.recipient.email || '—'}
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-900">
                        ${proposal.value.toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {proposal.dateSent ? format(proposal.dateSent, "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        {proposal.status !== 'Draft' ? (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleCopyLink(proposal)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy
                          </Button>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(proposal)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(proposal)}>
                              <Files className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            {proposal.status !== 'Draft' && (
                              <DropdownMenuItem onClick={() => handleCopyLink(proposal)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy link
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(proposal.id)}>
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
      {filteredProposals.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select defaultValue="25">
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-600">
            Showing 1-{Math.min(25, filteredProposals.length)} of {filteredProposals.length}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Proposal Detail Drawer */}
      <Sheet open={proposalDrawerOpen} onOpenChange={setProposalDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl flex items-center justify-between">
              <span>{selectedProposal?.title}</span>
              {selectedProposal && (
                <Badge className={getStatusColor(selectedProposal.status)}>
                  {selectedProposal.status}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {selectedProposal && (
            <div className="mt-6 space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" size="sm">
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  if (selectedProposal) {
                    handleCopyLink(selectedProposal)
                  }
                }}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </Button>
                <Button variant="outline" size="sm">
                  <Files className="mr-2 h-4 w-4" />
                  Duplicate
                </Button>
                <Button variant="outline" size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Convert to Invoice
                </Button>
              </div>

              {/* Recipient Card */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Recipient</h3>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {selectedProposal.recipient.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{selectedProposal.recipient.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {selectedProposal.recipient.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3 w-3" />
                          {selectedProposal.recipient.company}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {selectedProposal.recipient.email}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Value</div>
                    <div className="text-2xl font-bold text-gray-900">
                      ${selectedProposal.value.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Valid Until</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {format(selectedProposal.validUntil, "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Proposal ID</div>
                    <div className="text-sm font-mono font-semibold text-gray-900">
                      {selectedProposal.id}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Activity Timeline</h3>
                <div className="space-y-4">
                  {selectedProposal.activities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {activity.type}
                        </div>
                        <div className="text-xs text-gray-600">
                          {format(activity.date, "MMM d, yyyy 'at' h:mm a")} by {activity.user}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    router.push(`/dashboard/proposals/create?id=${selectedProposal.id}`)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" onClick={() => setProposalDrawerOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Lead Picker Modal */}
      <Dialog open={leadPickerOpen} onOpenChange={setLeadPickerOpen}>
        <DialogContent className="max-w-4xl" data-help="lead-picker-modal">
          <DialogHeader>
            <DialogTitle>Create a Proposal</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className={`relative ${useCustomLead ? 'opacity-50 pointer-events-none' : ''} flex-1`}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  data-help="input-search-leads-modal"
                  placeholder={`Search ${recipientType === 'lead' ? 'leads' : 'clients'} by name, company, or email`}
                  className="pl-10"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="customLead" checked={useCustomLead} onCheckedChange={(c) => setUseCustomLead(!!c)} />
                <Label htmlFor="customLead">Enter custom details</Label>
              </div>
            </div>

            {!useCustomLead && (
              <>
                <Tabs value={recipientType} onValueChange={(v) => setRecipientType(v as 'lead' | 'client')}>
                  <TabsList className="w-full">
                    <TabsTrigger value="lead" className="flex-1">
                      Leads
                    </TabsTrigger>
                    <TabsTrigger value="client" className="flex-1">
                      Clients
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="border rounded-lg overflow-hidden" data-help="leads-selection-table">
                <div className="max-h-96 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Select</th>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Company</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Source</th>
                        <th className="px-3 py-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadsLoading ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#3C3CFF] mb-2" />
                            <p className="text-sm text-gray-600">Loading leads...</p>
                          </td>
                        </tr>
                      ) : leads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-8 text-center text-gray-500">
                            No leads found
                          </td>
                        </tr>
                      ) : recipientType === 'lead' ? (
                        leads
                          .filter(lead => {
                            const searchLower = leadSearch.toLowerCase()
                            return (
                              lead.name?.toLowerCase().includes(searchLower) ||
                              lead.company?.toLowerCase().includes(searchLower) ||
                              lead.email?.toLowerCase().includes(searchLower) ||
                              lead.source?.toLowerCase().includes(searchLower)
                            )
                          })
                          .map((lead) => {
                            const id = lead.id
                            return (
                              <tr key={id} className="border-t hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <input
                                    type="radio"
                                    name="recipientSelect"
                                    data-help={`radio-lead-${id}`}
                                    checked={selectedLeadId === id}
                                    onChange={() => {
                                      setSelectedLeadId(id)
                                      setSelectedLead({ 
                                        id, 
                                        name: lead.name, 
                                        company: lead.company || '', 
                                        email: lead.email || '' 
                                      })
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">{lead.name}</td>
                                <td className="px-3 py-2">{lead.company || '—'}</td>
                                <td className="px-3 py-2">{lead.email || '—'}</td>
                                <td className="px-3 py-2">{lead.source || '—'}</td>
                                <td className="px-3 py-2 text-right">
                                  {lead.value ? `$${lead.value.toLocaleString()}` : '—'}
                                </td>
                              </tr>
                            )
                          })
                      ) : (
                        clients
                          .filter(client => {
                            const searchLower = leadSearch.toLowerCase()
                            const fullName = `${client.first_name} ${client.last_name}`.trim()
                            return (
                              fullName.toLowerCase().includes(searchLower) ||
                              client.company?.toLowerCase().includes(searchLower) ||
                              client.email?.toLowerCase().includes(searchLower)
                            )
                          })
                          .map((client) => {
                            const id = client.id
                            const fullName = `${client.first_name} ${client.last_name}`.trim()
                            return (
                              <tr key={id} className="border-t hover:bg-gray-50">
                                <td className="px-3 py-2">
                                  <input
                                    type="radio"
                                    name="recipientSelect"
                                    data-help={`radio-client-${id}`}
                                    checked={selectedLeadId === id}
                                    onChange={() => {
                                      setSelectedLeadId(id)
                                      setSelectedLead({ 
                                        id, 
                                        name: fullName, 
                                        company: client.company || '', 
                                        email: client.email || '' 
                                      })
                                    }}
                                  />
                                </td>
                                <td className="px-3 py-2">{fullName}</td>
                                <td className="px-3 py-2">{client.company || '—'}</td>
                                <td className="px-3 py-2">{client.email || '—'}</td>
                                <td className="px-3 py-2">Client</td>
                                <td className="px-3 py-2 text-right">—</td>
                              </tr>
                            )
                          })
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-gray-50 text-xs text-gray-600">
                  Tip: Switch between Leads and Clients tabs above, or use "Enter custom details" for someone not in your list.
                </div>
              </div>
              </>
            )}
            
            {useCustomLead && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Name</Label>
                  <Input value={customLeadName} onChange={(e) => setCustomLeadName(e.target.value)} placeholder="Client name" />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={customLeadCompany} onChange={(e) => setCustomLeadCompany(e.target.value)} placeholder="Company" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={customLeadEmail} onChange={(e) => setCustomLeadEmail(e.target.value)} placeholder="client@company.com" />
                </div>
                <div className="col-span-3 text-xs text-gray-600">We'll carry this info into your proposal builder where you can refine it.</div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeadPickerOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              data-help="btn-continue-lead-picker"
              onClick={() => {
                if (useCustomLead) {
                  router.push(`/dashboard/proposals/create?template=professional&clientName=${encodeURIComponent(customLeadName)}&clientCompany=${encodeURIComponent(customLeadCompany)}&clientEmail=${encodeURIComponent(customLeadEmail)}`)
                  return
                }
                if (!selectedLeadId) {
                  toast.error("Please select a lead/client or enter custom details")
                  return
                }
                const q = selectedLead ? `&clientName=${encodeURIComponent(selectedLead.name)}&clientCompany=${encodeURIComponent(selectedLead.company)}&clientEmail=${encodeURIComponent(selectedLead.email)}` : ""
                const typeParam = recipientType === 'client' ? '&clientId=' : '&leadId='
                router.push(`/dashboard/proposals/create?template=professional${typeParam}${encodeURIComponent(selectedLeadId)}${q}`)
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

