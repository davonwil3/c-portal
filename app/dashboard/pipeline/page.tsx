"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { useTour } from "@/contexts/TourContext"
import { dummyPipelineLeads, dummyLeads, dummyTourLeads } from "@/lib/tour-dummy-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Plus,
  Search,
  Filter,
  Settings,
  Upload,
  TrendingUp,
  Users,
  Trophy,
  XCircle,
  Clock,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Paperclip,
  Calendar,
  ArrowLeft,
  DollarSign,
  Target,
  Mail,
  Phone,
  Building2,
  FileText,
  GripVertical,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getLeads, updateLead, type Lead } from "@/lib/leads"
import { Loader2 } from "lucide-react"
import {
  getPipelineStages,
  getPipelineStagesFromDB,
  statusToStageId,
  stageIdToStatus,
  type PipelineStage,
} from "@/lib/pipeline-stages"
import { PipelineSettingsDrawer } from "@/components/lead-workflow/PipelineSettingsDrawer"
import { ImportLeadsModal } from "@/components/lead-workflow/ImportLeadsModal"

// Mock data - 30 unique leads (same as ManageLeads page)
const uniqueLeadsData = [
  { name: "Sarah Johnson", company: "Tech Corp", source: "Reddit", stage: "new", niche: "Web Dev" },
  { name: "Michael Chen", company: "Design Studio", source: "Inbound", stage: "contacted", niche: "Design" },
  { name: "Emily Davis", company: "Marketing Agency", source: "Referral", stage: "discovery", niche: "SEO" },
  { name: "David Miller", company: "Startup Inc", source: "Ad Campaign", stage: "proposal", niche: "Marketing" },
  { name: "Jessica Wilson", company: "Consulting LLC", source: "Reddit", stage: "negotiation", niche: "Web Dev" },
  { name: "Robert Brown", company: "Creative Co", source: "Inbound", stage: "won", niche: "Design" },
  { name: "Lisa Anderson", company: "Digital Labs", source: "Referral", stage: "lost", niche: "SEO" },
  { name: "James Martinez", company: "Tech Solutions", source: "Ad Campaign", stage: "new", niche: "Marketing" },
  { name: "Patricia Taylor", company: "Innovate Inc", source: "Reddit", stage: "contacted", niche: "Web Dev" },
  { name: "John Williams", company: "Design Works", source: "Inbound", stage: "discovery", niche: "Design" },
  { name: "Jennifer Garcia", company: "Agency Pro", source: "Referral", stage: "proposal", niche: "SEO" },
  { name: "William Rodriguez", company: "Startup Hub", source: "Ad Campaign", stage: "negotiation", niche: "Marketing" },
  { name: "Linda Lewis", company: "Tech Ventures", source: "Reddit", stage: "won", niche: "Web Dev" },
  { name: "Richard Walker", company: "Creative Minds", source: "Inbound", stage: "lost", niche: "Design" },
  { name: "Barbara Hall", company: "Digital Dynamics", source: "Referral", stage: "new", niche: "SEO" },
  { name: "Joseph Allen", company: "Marketing Pro", source: "Ad Campaign", stage: "contacted", niche: "Marketing" },
  { name: "Elizabeth Young", company: "Innovation Co", source: "Reddit", stage: "discovery", niche: "Web Dev" },
  { name: "Thomas King", company: "Tech Innovations", source: "Inbound", stage: "proposal", niche: "Design" },
  { name: "Susan Wright", company: "Design Hub", source: "Referral", stage: "negotiation", niche: "SEO" },
  { name: "Christopher Lopez", company: "Startup Labs", source: "Ad Campaign", stage: "won", niche: "Marketing" },
  { name: "Karen Hill", company: "Creative Solutions", source: "Reddit", stage: "lost", niche: "Web Dev" },
  { name: "Daniel Scott", company: "Tech Group", source: "Inbound", stage: "new", niche: "Design" },
  { name: "Nancy Green", company: "Marketing Masters", source: "Referral", stage: "contacted", niche: "SEO" },
  { name: "Paul Adams", company: "Digital Works", source: "Ad Campaign", stage: "discovery", niche: "Marketing" },
  { name: "Betty Baker", company: "Innovate Labs", source: "Reddit", stage: "proposal", niche: "Web Dev" },
  { name: "Mark Gonzalez", company: "Tech Partners", source: "Inbound", stage: "negotiation", niche: "Design" },
  { name: "Margaret Nelson", company: "Design Studio Pro", source: "Referral", stage: "won", niche: "SEO" },
  { name: "Donald Carter", company: "Startup Network", source: "Ad Campaign", stage: "lost", niche: "Marketing" },
  { name: "Dorothy Mitchell", company: "Creative Agency", source: "Reddit", stage: "new", niche: "Web Dev" },
  { name: "Kenneth Perez", company: "Tech Collective", source: "Inbound", stage: "contacted", niche: "Design" },
]

const mockLeads = uniqueLeadsData.map((lead, i) => ({
  id: `lead-${i}`,
  name: lead.name,
  company: lead.company,
  email: `contact${i}@${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
  phone: `(555) ${String(i + 100).padStart(3, '0')}-${String(i + 1000).padStart(4, '0')}`,
  stage: lead.stage,
  source: lead.source,
  niche: lead.niche,
  value: Math.floor(Math.random() * 50000) + 5000,
  confidence: Math.floor(Math.random() * 40) + 60,
  lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
  nextStep: ["Send proposal", "Follow up call", "Discovery meeting", "Contract review", "Final negotiation"][i % 5],
  notes: "Initial conversation went well. Interested in premium package.",
}))

const defaultStages = [
  { id: "new", name: "New", color: "bg-blue-100 text-blue-700" },
  { id: "contacted", name: "Contacted", color: "bg-purple-100 text-purple-700" },
  { id: "discovery", name: "Discovery", color: "bg-yellow-100 text-yellow-700" },
  { id: "proposal", name: "Proposal Sent", color: "bg-orange-100 text-orange-700" },
  { id: "negotiation", name: "Negotiation", color: "bg-pink-100 text-pink-700" },
  { id: "won", name: "Won", color: "bg-green-100 text-green-700" },
  { id: "lost", name: "Lost", color: "bg-red-100 text-red-700" },
]


export default function PipelinePage() {
  const { isTourRunning } = useTour()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  
  // Use dummy data during tours
  const initialLeads = useMemo(() => {
    if (isTourRunning) {
      // Convert dummyPipelineLeads to the format expected by this page
      const tourLeads: any[] = []
      Object.entries(dummyPipelineLeads).forEach(([stage, stageLeads]) => {
        stageLeads.forEach((lead: any, index: number) => {
          tourLeads.push({
            id: `${stage}-${index}`,
            name: lead.name,
            company: lead.company,
            email: `${lead.name.toLowerCase().replace(/\s+/g, '.')}@${lead.company.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: '+1 (555) 123-4567',
            value: lead.value,
            source: lead.source,
            stage: stage,
            notes: `Potential project for ${lead.company}`,
            lastContact: new Date().toISOString(),
            nextFollowUp: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            tags: [],
          })
        })
      })
      return tourLeads
    }
    return []
  }, [isTourRunning])
  
  const [leads, setLeads] = useState(initialLeads)

  // Load leads from database
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true)
        
        // Use tour mock data if tour is running
        if (isTourRunning) {
          const pipelineLeads = dummyTourLeads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            company: lead.company || '',
            email: lead.email || '',
            phone: lead.phone || '',
            value: lead.value || 0,
            source: lead.source,
            stage: statusToStageId(lead.status),
            notes: lead.notes || '',
            lastContact: lead.last_contacted_at || lead.created_at,
            nextFollowUp: lead.last_contacted_at || lead.created_at,
            tags: lead.tags || [],
          }))
          setLeads(pipelineLeads)
          setLoading(false)
          return
        }
        
        const dbLeads = await getLeads()
        // Convert database leads to pipeline format
        const pipelineLeads = dbLeads.map((lead: Lead) => ({
          id: lead.id,
          name: lead.name,
          company: lead.company || '',
          email: lead.email || '',
          phone: lead.phone || '',
          value: lead.value || 0,
          source: lead.source,
          stage: statusToStageId(lead.status),
          notes: lead.notes || '',
          lastContact: lead.last_contacted_at || lead.created_at,
          nextFollowUp: lead.last_contacted_at || lead.created_at,
          tags: lead.tags || [],
        }))
        setLeads(pipelineLeads)
      } catch (error) {
        console.error('Error loading leads:', error)
        toast.error('Failed to load leads')
      } finally {
        setLoading(false)
      }
    }

    loadLeads()
  }, [isTourRunning])

  // Load stages from database on mount
  useEffect(() => {
    if (isTourRunning) return
    
    const loadStages = async () => {
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
    const handleStagesUpdate = async () => {
      if (isTourRunning) return
      // Reload from database to get latest
      try {
        const dbStages = await getPipelineStagesFromDB()
        setStages(dbStages)
        if (typeof window !== 'undefined') {
          localStorage.setItem('pipeline_stages', JSON.stringify(dbStages))
        }
        // Reload leads to reflect stage changes
        const dbLeads = await getLeads()
        const pipelineLeads = dbLeads.map((lead: Lead) => ({
          id: lead.id,
          name: lead.name,
          company: lead.company || '',
          email: lead.email || '',
          phone: lead.phone || '',
          value: lead.value || 0,
          source: lead.source,
          stage: statusToStageId(lead.status),
          notes: lead.notes || '',
          lastContact: lead.last_contacted_at || lead.created_at,
          nextFollowUp: lead.last_contacted_at || lead.created_at,
          tags: lead.tags || [],
        }))
        setLeads(pipelineLeads)
      } catch (error) {
        console.error('Error reloading stages:', error)
        setStages(getPipelineStages())
      }
    }
    window.addEventListener('pipeline-stages-updated', handleStagesUpdate)
    return () => {
      window.removeEventListener('pipeline-stages-updated', handleStagesUpdate)
    }
  }, [isTourRunning])

  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [newLeadOpen, setNewLeadOpen] = useState(false)
  const [importCsvOpen, setImportCsvOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    const q = searchParams.get('q')
    return q ? decodeURIComponent(q) : ""
  })
  
  // Update search query when URL param changes
  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setSearchQuery(decodeURIComponent(q))
    }
  }, [searchParams])
  const [filterOpen, setFilterOpen] = useState(false)
  const [stageFilter, setStageFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  
  // New lead form state
  const [newLeadSource, setNewLeadSource] = useState("")
  const [customSource, setCustomSource] = useState("")
  const [showCustomSourceInput, setShowCustomSourceInput] = useState(false)
  
  // Settings state - using mutable stages
  const [stages, setStages] = useState<PipelineStage[]>(getPipelineStages())
  const [followUpInterval, setFollowUpInterval] = useState(3)
  const [autoArchive, setAutoArchive] = useState(false)
  const [defaultCurrency, setDefaultCurrency] = useState("USD")
  

  // Drag & Drop state/refs
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)
  const autoScrollRaf = useRef<number | null>(null)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggedLeadId(leadId)
    try {
      e.dataTransfer.setData('text/plain', leadId)
      e.dataTransfer.effectAllowed = 'move'
    } catch {}
  }

  const stopAutoScroll = () => {
    if (autoScrollRaf.current) {
      cancelAnimationFrame(autoScrollRaf.current)
      autoScrollRaf.current = null
    }
  }

  const handleDragEnd = () => {
    setDraggedLeadId(null)
    stopAutoScroll()
  }

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    const container = scrollContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const threshold = 80
    let direction = 0

    if (e.clientX - rect.left < threshold) direction = -1
    else if (rect.right - e.clientX < threshold) direction = 1

    if (direction !== 0) {
      if (!autoScrollRaf.current) {
        const step = 12 * direction
        const tick = () => {
          container.scrollLeft += step
          autoScrollRaf.current = requestAnimationFrame(tick)
        }
        autoScrollRaf.current = requestAnimationFrame(tick)
      }
    } else {
      stopAutoScroll()
    }
  }

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleColumnDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    const dataId = (() => {
      try { return e.dataTransfer.getData('text/plain') } catch { return '' }
    })()
    const leadId = dataId || draggedLeadId
    if (leadId) {
      handleMoveStage(leadId, targetStageId)
    }
    handleDragEnd()
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = leads.length
    const won = leads.filter(l => l.stage === "won").length
    const lost = leads.filter(l => l.stage === "lost").length
    const winRate = total > 0 ? Math.round((won / (won + lost)) * 100) : 0
    return { total, won, lost, winRate }
  }, [leads])

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (searchQuery && !lead.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !lead.company.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (stageFilter !== "all" && lead.stage !== stageFilter) {
        return false
      }
      if (sourceFilter !== "all" && lead.source !== sourceFilter) {
        return false
      }
      return true
    })
  }, [leads, searchQuery, stageFilter, sourceFilter])

  // Group leads by stage
  const leadsByStage = useMemo(() => {
    const grouped: Record<string, typeof leads> = {}
    stages.forEach(stage => {
      grouped[stage.id] = filteredLeads.filter(lead => lead.stage === stage.id)
    })
    return grouped
  }, [filteredLeads])

  const handleLeadClick = (lead: any) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }

  const handleMoveStage = async (leadId: string, newStage: string) => {
    try {
      // Update in database
      const newStatus = stageIdToStatus(newStage) as Lead['status']
      await updateLead(leadId, { status: newStatus })
      
      // Update local state
      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, stage: newStage } : lead
      ))
      toast.success("Lead moved successfully")
    } catch (error) {
      console.error('Error moving lead:', error)
      toast.error('Failed to move lead')
    }
  }


  // Settings handlers
  const handleOpenSettings = () => {
    setSettingsOpen(true)
  }

  const getStageValue = (stageId: string) => {
    const stageLeads = leadsByStage[stageId] || []
    return stageLeads.reduce((sum, lead) => sum + lead.value, 0)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Pipeline 📊
                </h1>
                <p className="text-blue-100 text-lg">
                  Visualize and manage your leads through every stage
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => router.push('/dashboard/lead-workflow?active=manage-leads')}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-gray-400" />
                <p className="text-xs text-gray-600">Total Leads</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-green-500" />
                <p className="text-xs text-gray-600">Won</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.won}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-500" />
                <p className="text-xs text-gray-600">Lost</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.lost}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <p className="text-xs text-gray-600">Win Rate</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{metrics.winRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                data-help="input-pipeline-search"
                placeholder="Search leads by name or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Popover open={filterOpen} onOpenChange={setFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" data-help="btn-pipeline-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div>
                    <Label>Stage</Label>
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stages</SelectItem>
                        {stages.map(stage => (
                          <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
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
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <Button variant="outline" onClick={() => setImportCsvOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline" data-help="btn-pipeline-settings" onClick={handleOpenSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" data-help="btn-pipeline-new-lead" onClick={() => setNewLeadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
            <span className="ml-2 text-gray-600">Loading leads...</span>
          </div>
        )}

        {/* Kanban Board */}
        {!loading && (
        <div
          className="overflow-x-auto pb-4"
          ref={scrollContainerRef}
          onDragOver={handleContainerDragOver}
          onDragEnd={handleDragEnd}
          data-help="pipeline-kanban-board"
        >
          <div className="flex gap-4 min-w-max">
            {stages.map(stage => {
              const stageLeads = leadsByStage[stage.id] || []

              return (
                <div
                  key={stage.id}
                  className="w-80 flex-shrink-0"
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, stage.id)}
                  data-help={`pipeline-column-${stage.id}`}
                >
                  <Card className="bg-white border-0 shadow-sm h-full">
                    <CardContent className="p-4">
                      {/* Column Header */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <Badge className={stage.color}>{stage.name}</Badge>
                          <span className="text-sm font-semibold text-gray-700">
                            {stageLeads.length}
                          </span>
                        </div>
                      </div>

                      {/* Lead Cards */}
                      <div className="space-y-3">
                        {stageLeads.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-gray-500">No leads in this stage yet</p>
                          </div>
                        ) : (
                          stageLeads.map(lead => (
                            <Card
                              key={lead.id}
                              className="group hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-100"
                              onClick={() => handleLeadClick(lead)}
                              draggable
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              onDragEnd={handleDragEnd}
                            >
                              <CardContent className="p-3">
                                <div className="space-y-2">
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                                      {lead.name}
                                    </h4>
                                    <p className="text-xs text-gray-600">{lead.company}</p>
                                  </div>
                                  
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                      {lead.source}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {lead.niche}
                                    </Badge>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-gray-900">
                                      ${(lead.value / 1000).toFixed(0)}k
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{new Date(lead.lastActivity).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        </div>
        )}

        {/* Lead Details Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl">{selectedLead?.name}</SheetTitle>
            </SheetHeader>

            {selectedLead && (
              <div className="mt-6 space-y-6">
                {/* Summary */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Lead Summary</h3>
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
                        <p className="text-sm text-gray-600">Value</p>
                        <p className="font-medium">${selectedLead.value.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-sm">{selectedLead.email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium">{selectedLead.phone}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stage */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Stage</h3>
                  <Select
                    value={selectedLead.stage}
                    onValueChange={(value) => handleMoveStage(selectedLead.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Next Action */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Next Action</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Tomorrow</Button>
                    <Button variant="outline" size="sm">3 Days</Button>
                    <Button variant="outline" size="sm">Next Week</Button>
                  </div>
                  <Input placeholder="Set custom date..." />
                </div>

                {/* Notes */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Notes</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedLead.notes}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(selectedLead.lastActivity).toLocaleDateString()}
                    </p>
                  </div>
                  <Textarea placeholder="Add a note..." rows={3} />
                  <Button size="sm">Add Note</Button>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                    <Eye className="mr-2 h-4 w-4" />
                    View Lead
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <FileText className="mr-2 h-4 w-4" />
                    Open Proposal
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 border-green-200 text-green-700 hover:bg-green-50">
                    <Trophy className="mr-2 h-4 w-4" />
                    Mark Won
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-700 hover:bg-red-50">
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark Lost
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Pipeline Settings Drawer */}
        <PipelineSettingsDrawer
          open={settingsOpen}
          onOpenChange={(open) => {
            setSettingsOpen(open)
            if (!open) {
              // Reload leads when settings close to reflect any changes
              if (!isTourRunning) {
                const loadLeads = async () => {
                  try {
                    // Use tour mock data if tour is running (shouldn't get here, but just in case)
                    if (isTourRunning) {
                      const pipelineLeads = dummyTourLeads.map((lead) => ({
                        id: lead.id,
                        name: lead.name,
                        company: lead.company || '',
                        email: lead.email || '',
                        phone: lead.phone || '',
                        value: lead.value || 0,
                        source: lead.source,
                        stage: statusToStageId(lead.status),
                        notes: lead.notes || '',
                        lastContact: lead.last_contacted_at || lead.created_at,
                        nextFollowUp: lead.last_contacted_at || lead.created_at,
                        tags: lead.tags || [],
                      }))
                      setLeads(pipelineLeads)
                      return
                    }
                    
                    const dbLeads = await getLeads()
                    const pipelineLeads = dbLeads.map((lead: Lead) => ({
                      id: lead.id,
                      name: lead.name,
                      company: lead.company || '',
                      email: lead.email || '',
                      phone: lead.phone || '',
                      value: lead.value || 0,
                      source: lead.source,
                      stage: statusToStageId(lead.status),
                      niche: 'Web Dev',
                      notes: lead.notes || '',
                      lastContact: lead.last_contacted_at || lead.created_at,
                      nextFollowUp: lead.last_contacted_at || lead.created_at,
                      tags: lead.tags || [],
                    }))
                    setLeads(pipelineLeads)
                  } catch (error) {
                    console.error('Error loading leads:', error)
                  }
                }
                loadLeads()
              }
            }
          }}
          followUpInterval={followUpInterval}
          setFollowUpInterval={setFollowUpInterval}
          autoArchive={autoArchive}
          setAutoArchive={setAutoArchive}
          defaultCurrency={defaultCurrency}
          setDefaultCurrency={setDefaultCurrency}
        />

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
                  <Select 
                    value={newLeadSource}
                    onValueChange={(value) => {
                      setNewLeadSource(value)
                      setShowCustomSourceInput(false)
                      setCustomSource("")
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
              <Button variant="outline" onClick={() => {
                setNewLeadOpen(false)
                setNewLeadSource("")
                setCustomSource("")
                setShowCustomSourceInput(false)
              }}>
                Cancel
              </Button>
              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => {
                if (!newLeadSource) {
                  toast.error("Please select a source")
                  return
                }
                // Add lead logic would go here
                toast.success("Lead created successfully!")
                setNewLeadOpen(false)
                setNewLeadSource("")
                setCustomSource("")
                setShowCustomSourceInput(false)
              }}>
                Save Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import CSV Modal */}
        <ImportLeadsModal
          open={importCsvOpen}
          onOpenChange={setImportCsvOpen}
          onImportComplete={async () => {
            if (!isTourRunning) {
              try {
                const dbLeads = await getLeads()
                const pipelineLeads = dbLeads.map((lead: Lead) => ({
                  id: lead.id,
                  name: lead.name,
                  company: lead.company || '',
                  email: lead.email || '',
                  phone: lead.phone || '',
                  value: lead.value || 0,
                  source: lead.source,
                  stage: statusToStageId(lead.status),
                  notes: lead.notes || '',
                  lastContact: lead.last_contacted_at || lead.created_at,
                  nextFollowUp: lead.last_contacted_at || lead.created_at,
                  tags: lead.tags || [],
                }))
                setLeads(pipelineLeads)
              } catch (error) {
                console.error('Error reloading leads:', error)
              }
            }
          }}
        />
      </div>
    </DashboardLayout>
  )
}

