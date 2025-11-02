"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { CreditsBadge } from "@/components/CreditsBadge"
import { CreditsBanner } from "@/components/CreditsBanner"
import { ConfirmDeductModal } from "@/components/ConfirmDeductModal"
import { RefinePreferencesModal } from "@/components/RefinePreferencesModal"
import { toast } from "sonner"
import { 
  Search, 
  Clock, 
  MapPin,
  DollarSign,
  Copy, 
  X,
  ChevronRight,
  ChevronLeft,
  Star,
  Filter,
  TrendingUp,
  Zap,
  Target,
  Eye,
  Bookmark,
  Edit3,
  RotateCcw
} from "lucide-react"

// Types
type Lead = {
  id: string
  source: 'Reddit'
  subreddit: string
  postedAgo: string
  title: string
  summary: string
  role: 'Web' | 'Design' | 'Copy' | 'SEO' | 'Marketing'
  budget: string | null
  location: string
  url: string
}

type Filters = {
  budget: boolean
  recency: string
  remote: boolean
  showSavedLeads: boolean
}

type CreditsState = {
  count: number
  resetsIn: string
  lowThreshold: number
  savedLeadIds: string[]
}

type Preferences = {
  services: string[]
  intentText: string
  budget: string
  remoteOnly: boolean
  region: string
  showSavedLeads?: boolean
}

type RefreshState = {
  isCoolingDown: boolean
  nextRefreshAt: number | null
  batchSize: number
}

// Helper function
function formatCountdown(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

// Mock data
function useMockLeads(): Lead[] {
  return [
    {
      id: '1',
      source: 'Reddit',
      subreddit: 'r/forhire',
      postedAgo: '3h',
      title: 'Need a web developer for SaaS dashboard redesign',
      summary: 'Looking for a skilled React developer to redesign our customer dashboard. Must have experience with modern UI libraries and responsive design.',
      role: 'Web',
      budget: '$50,000+',
      location: 'Remote',
      url: '#'
    },
    {
      id: '2',
      source: 'Reddit',
      subreddit: 'r/DesignJobs',
      postedAgo: '1d',
      title: 'Logo design for tech startup',
      summary: 'Startup needs a modern, minimalist logo that represents innovation and technology. Budget is flexible for the right designer.',
      role: 'Design',
      budget: '$2,500 - $5,000',
      location: 'San Francisco, CA',
      url: '#'
    },
    {
      id: '3',
      source: 'Reddit',
      subreddit: 'r/freelance',
      postedAgo: '5h',
      title: 'Copywriter needed for email marketing campaign',
      summary: 'E-commerce business needs compelling copy for welcome series and promotional emails. Experience with conversion optimization preferred.',
      role: 'Copy',
      budget: null,
      location: 'Remote',
      url: '#'
    },
    {
      id: '4',
      source: 'Reddit',
      subreddit: 'r/forhire',
      postedAgo: '2d',
      title: 'SEO specialist for local business',
      summary: 'Local restaurant needs help with Google My Business optimization and local SEO strategy. Must understand local search algorithms.',
      role: 'SEO',
      budget: '$1,000 - $2,500',
      location: 'Austin, TX',
      url: '#'
    },
    {
      id: '5',
      source: 'Reddit',
      subreddit: 'r/marketing',
      postedAgo: '4h',
      title: 'Social media manager for B2B company',
      summary: 'B2B SaaS company needs someone to manage LinkedIn and Twitter presence. Experience with lead generation and thought leadership content.',
      role: 'Marketing',
      budget: '$5,000 - $10,000',
      location: 'New York, NY',
      url: '#'
    },
    {
      id: '6',
      source: 'Reddit',
      subreddit: 'r/forhire',
      postedAgo: '6h',
      title: 'Full-stack developer for mobile app',
      summary: 'Startup needs React Native developer to build cross-platform mobile app. Experience with backend integration and payment systems required.',
      role: 'Web',
      budget: null,
      location: 'Remote',
      url: '#'
    }
  ]
}

// Components
function PageHeader() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center shadow-md">
              <Search className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Find Leads</h2>
          </div>
          <p className="text-gray-600 ml-[60px]">Discover and import potential clients.</p>
        </div>
      </div>
    </div>
  )
}

function ContextBar({ preferences, onRefine }: { 
  preferences: Preferences
  onRefine: () => void 
}) {
  return (
    <Card className="mb-6 border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              Showing leads for: <span className="font-semibold text-gray-900">{preferences.services.join(', ')}</span>
            </div>
            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{preferences.intentText}</span>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onRefine}
            className="flex items-center space-x-2 hover:bg-gray-50"
          >
            <Edit3 className="h-3 w-3" />
            <span>Refine Preferences</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function RefreshButton({ refreshState, onRefresh }: {
  refreshState: RefreshState
  onRefresh: () => void
}) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (!refreshState.isCoolingDown || !refreshState.nextRefreshAt) {
      setTimeLeft(0)
      return
    }

    const updateTimeLeft = () => {
      const now = Date.now()
      const remaining = refreshState.nextRefreshAt! - now
      setTimeLeft(Math.max(0, remaining))
    }

    updateTimeLeft()
    const interval = setInterval(updateTimeLeft, 60000)

    return () => clearInterval(interval)
  }, [refreshState.isCoolingDown, refreshState.nextRefreshAt])

  const isDisabled = refreshState.isCoolingDown && timeLeft > 0

  return (
    <div className="flex items-center space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={onRefresh}
        disabled={isDisabled}
        className={`flex items-center space-x-2 ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:bg-gray-50'
        }`}
        title={isDisabled ? "You can refresh again after the cooldown" : "Refresh leads"}
      >
        <RotateCcw className="h-3 w-3" />
        <span>
          {isDisabled ? `Next refresh in ${formatCountdown(timeLeft)}` : 'Refresh Leads'}
        </span>
      </Button>
    </div>
  )
}

function FiltersBar({ filters, setFilters }: { filters: Filters, setFilters: (filters: Filters) => void }) {
  const recencies = ['<24h', '<48h', '<7d']

  const activeFiltersCount = [
    filters.budget, 
    filters.recency !== '<24h',
    filters.showSavedLeads
  ].filter(Boolean).length

  return (
    <Card className="mb-6 border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center">
              <Filter className="h-3 w-3 text-white" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Quick Filters</h3>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="bg-[#3C3CFF]/10 text-[#3C3CFF] border-[#3C3CFF]/20 text-xs">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-800">Specifies Budget</Label>
            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
              <Switch
                checked={filters.budget}
                onCheckedChange={(checked) => setFilters({ ...filters, budget: checked })}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
              <div>
                <div className="text-xs font-medium text-gray-900">Budget Available</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-800">Posted</Label>
            <div className="flex gap-1">
              {recencies.map((recency) => (
                <Button
                  key={recency}
                  size="sm"
                  variant={filters.recency === recency ? "default" : "outline"}
                  onClick={() => setFilters({ ...filters, recency })}
                  className={`text-xs font-medium transition-all duration-200 ${
                    filters.recency === recency 
                      ? 'bg-[#3C3CFF] text-white shadow-md hover:bg-[#2D2DCC]' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {recency}
              </Button>
              ))}
            </div>
          </div>


          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-800">Saved Leads</Label>
            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
              <Switch
                checked={filters.showSavedLeads}
                onCheckedChange={(checked) => setFilters({ ...filters, showSavedLeads: checked })}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
              <div>
                <div className="text-xs font-medium text-gray-900">Show Saved</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LeadCard({ lead, onOpen, onSave, onDismiss, isSaved }: {
  lead: Lead
  onOpen: (lead: Lead) => void
  onSave: (lead: Lead) => void
  onDismiss: (lead: Lead) => void
  isSaved: boolean
}) {
  const getRoleColor = (role: string) => {
    const colors = {
      'Web': 'bg-blue-50 text-blue-700 border-blue-200',
      'Design': 'bg-purple-50 text-purple-700 border-purple-200',
      'Copy': 'bg-green-50 text-green-700 border-green-200',
      'SEO': 'bg-orange-50 text-orange-700 border-orange-200',
      'Marketing': 'bg-pink-50 text-pink-700 border-pink-200'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <Card className="group hover:shadow-xl hover:shadow-[#3C3CFF]/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-[#3C3CFF] transition-colors">
              {lead.title}
            </h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(lead)}
            className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{lead.postedAgo}</span>
            </div>
            {lead.location && lead.location !== 'Remote' && (
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{lead.location}</span>
              </div>
            )}
            {lead.budget && (
              <div className="text-sm text-gray-600">
                {lead.budget}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">{lead.source}</div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onOpen(lead)}
              className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Eye className="h-3 w-3 mr-1" />
              {isSaved ? 'Open' : 'View'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSave(lead)}
              className={`border-gray-200 hover:bg-gray-50 transition-all duration-200 ${
                isSaved ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' : 'hover:border-gray-300'
              }`}
            >
              <Bookmark className="h-3 w-3 mr-1" />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NicheOnboardingModal({ open, onClose, onSave }: {
  open: boolean
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [step, setStep] = useState(1)
  const [services, setServices] = useState<string[]>([])
  const [niche, setNiche] = useState('')

  const serviceOptions = [
    'Web Development',
    'Design',
    'Copywriting',
    'SEO',
    'Marketing',
    'Video Production',
    'Other'
  ]

  const nicheSuggestions = ['SaaS', 'Local Business', 'E-commerce', 'Coaching', 'Healthcare', 'Finance']

  const toggleService = (service: string) => {
    setServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  const handleSave = () => {
    onSave({ services, niche })
    onClose()
    toast.success('Niche saved!')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Your Niche ({step}/2)</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">What services do you offer?</Label>
              <p className="text-sm text-gray-600 mb-4">Select all that apply</p>
              <div className="grid grid-cols-2 gap-3">
                {serviceOptions.map((service) => (
                  <div key={service} className="flex items-center space-x-2">
                    <Checkbox
                      id={service}
                      checked={services.includes(service)}
                      onCheckedChange={() => toggleService(service)}
                    />
                    <Label htmlFor={service} className="text-sm">
                      {service}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">What's your niche?</Label>
              <p className="text-sm text-gray-600 mb-4">Help us personalize leads for you</p>
              <Input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g., SaaS, E-commerce, Local Business"
                className="mb-3"
              />
              <div className="flex flex-wrap gap-2">
                {nicheSuggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    size="sm"
                    variant="outline"
                    onClick={() => setNiche(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSave} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EmptyState({ hasNiche, onSetNiche }: {
  hasNiche: boolean
  onSetNiche: () => void
}) {
  if (!hasNiche) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tell us your niche to personalize leads
          </h3>
          <p className="text-gray-600 mb-6">
            We'll find the perfect clients for your services
          </p>
          <Button onClick={onSetNiche} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            Set my niche
          </Button>
        </CardContent>
      </Card>
    )
  }

  return null
}

// Main export component
export function FindLeadsSection() {
  const [hasNiche, setHasNiche] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    budget: false,
    recency: '<24h',
    remote: false,
    showSavedLeads: false
  })
  const [preferences, setPreferences] = useState<Preferences>({
    services: ['Design', 'Web Dev'],
    intentText: 'SaaS startups needing dashboards',
    budget: '$$',
    remoteOnly: true,
    region: 'Global',
    showSavedLeads: false
  })
  const [credits, setCredits] = useState<CreditsState>({
    count: 138,
    resetsIn: "12d",
    lowThreshold: 10,
    savedLeadIds: []
  })
  const [refreshState, setRefreshState] = useState<RefreshState>({
    isCoolingDown: false,
    nextRefreshAt: null,
    batchSize: 24
  })
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [refineModalOpen, setRefineModalOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [leadDetailModalOpen, setLeadDetailModalOpen] = useState(false)
  const [nicheModalOpen, setNicheModalOpen] = useState(false)

  const mockLeads = useMockLeads()

  const filteredLeads = mockLeads.filter(lead => {
    if (filters.budget && !lead.budget) return false
    if (filters.recency === '<24h' && !lead.postedAgo.includes('h')) return false
    if (filters.recency === '<48h' && lead.postedAgo.includes('d')) return false
    return true
  })

  const handleRefresh = () => {
    const newBatchSize = Math.floor(Math.random() * 11) + 20
    setRefreshState(prev => ({
      ...prev,
      batchSize: newBatchSize,
      isCoolingDown: true,
      nextRefreshAt: Date.now() + (3 * 60 * 60 * 1000)
    }))
    toast.success(`New leads loaded! Found ${newBatchSize} fresh opportunities.`)
  }

  const handleOpen = (lead: Lead) => {
    const isSaved = credits.savedLeadIds.includes(lead.id)
    setSelectedLead(lead)
    if (isSaved) {
      setLeadDetailModalOpen(true)
    } else {
      setConfirmModalOpen(true)
    }
  }

  const handleConfirmDeduct = () => {
    if (selectedLead) {
      setCredits(prev => ({
        ...prev,
        count: prev.count - 1
      }))
      setConfirmModalOpen(false)
      setLeadDetailModalOpen(true)
    }
  }

  const handleSave = (lead: Lead) => {
    setCredits(prev => ({
      ...prev,
      savedLeadIds: [...prev.savedLeadIds, lead.id]
    }))
    toast.success(`Saved "${lead.title}"`)
  }

  const handleDismiss = (lead: Lead) => {
    toast.success(`Dismissed "${lead.title}"`)
  }

  const handleNicheSave = (data: any) => {
    setHasNiche(true)
    setNicheModalOpen(false)
  }

  const handleRefinePreferences = (newPreferences: Preferences) => {
    setPreferences(newPreferences)
    toast.success('Preferences updated')
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex items-center space-x-3">
          <RefreshButton 
            refreshState={refreshState} 
            onRefresh={handleRefresh} 
          />
          <CreditsBadge count={credits.count} lowThreshold={credits.lowThreshold} />
        </div>
      </div>

      <PageHeader />

      <ContextBar 
        preferences={preferences} 
        onRefine={() => setRefineModalOpen(true)} 
      />

      {credits.count <= credits.lowThreshold && (
        <CreditsBanner count={credits.count} lowThreshold={credits.lowThreshold} />
      )}

      <FiltersBar filters={filters} setFilters={setFilters} />

      {filteredLeads.length === 0 ? (
        <EmptyState
          hasNiche={hasNiche}
          onSetNiche={() => setNicheModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onOpen={handleOpen}
              onSave={handleSave}
              onDismiss={handleDismiss}
              isSaved={credits.savedLeadIds.includes(lead.id)}
            />
          ))}
        </div>
      )}

      <ConfirmDeductModal
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmDeduct}
        leadTitle={selectedLead?.title || ''}
        currentBalance={credits.count}
        source={selectedLead?.source}
      />

      <RefinePreferencesModal
        open={refineModalOpen}
        onClose={() => setRefineModalOpen(false)}
        preferences={preferences}
        onSave={handleRefinePreferences}
      />

      {/* Lead Detail Modal */}
      <Dialog open={leadDetailModalOpen} onOpenChange={setLeadDetailModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedLead?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* AI Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-5 border border-blue-100">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">AI Summary</h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedLead?.summary || "This opportunity requires a skilled professional with experience in modern web technologies. The client is looking for someone who can deliver high-quality work and is open to ongoing collaboration."}
                  </p>
                </div>
              </div>
            </div>

            {/* Budget Section */}
            <div className="border border-gray-200 rounded-lg p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget</h3>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className="text-lg font-medium text-gray-900">
                  {selectedLead?.budget || "Not available"}
                </span>
              </div>
            </div>

            {/* Additional Lead Details */}
            {selectedLead && (
              <div className="grid grid-cols-3 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Posted</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLead.postedAgo} ago</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLead.location}</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Source</p>
                  <p className="text-sm font-medium text-gray-900">{selectedLead.source}</p>
                </div>
              </div>
            )}

            {/* Full Description */}
            {selectedLead?.summary && (
              <div className="border border-gray-200 rounded-lg p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Full Description</h3>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedLead.summary}
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-6">
            <Button variant="outline" onClick={() => setLeadDetailModalOpen(false)}>
              Close
            </Button>
            {selectedLead && (
              <Button 
                onClick={() => {
                  handleSave(selectedLead)
                  setLeadDetailModalOpen(false)
                }}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              >
                Save Lead
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}

