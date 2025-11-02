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
import { DashboardLayout } from "@/components/dashboard/layout"
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
  Users,
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
  budget: '$' | '$$' | '$$$'
  location: string
  url: string
}

type Filters = {
  budget: string
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
  nextRefreshAt: number | null // epoch ms
  batchSize: number // 24
}

// Helper function to format countdown
function formatCountdown(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

// Mock data hook
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
      budget: '$$$',
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
      budget: '$$',
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
      budget: '$$',
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
      budget: '$',
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
      budget: '$$',
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
      budget: '$$$',
      location: 'Remote',
      url: '#'
    },
    {
      id: '7',
      source: 'Reddit',
      subreddit: 'r/DesignJobs',
      postedAgo: '1d',
      title: 'UI/UX designer for fintech app',
      summary: 'Fintech startup needs designer for mobile banking app. Must have experience with financial interfaces and compliance requirements.',
      role: 'Design',
      budget: '$$$',
      location: 'London, UK',
      url: '#'
    },
    {
      id: '8',
      source: 'Reddit',
      subreddit: 'r/freelance',
      postedAgo: '8h',
      title: 'Content writer for tech blog',
      summary: 'Tech company needs regular blog posts about industry trends and product updates. Must understand technical concepts and write for developers.',
      role: 'Copy',
      budget: '$',
      location: 'Remote',
      url: '#'
    },
    {
      id: '9',
      source: 'Reddit',
      subreddit: 'r/forhire',
      postedAgo: '12h',
      title: 'WordPress developer for agency',
      summary: 'Digital agency needs WordPress developer for client websites. Experience with custom themes, plugins, and page builders required.',
      role: 'Web',
      budget: '$$',
      location: 'Chicago, IL',
      url: '#'
    },
    {
      id: '10',
      source: 'Reddit',
      subreddit: 'r/marketing',
      postedAgo: '1d',
      title: 'PPC specialist for e-commerce',
      summary: 'E-commerce store needs Google Ads expert to optimize campaigns and improve ROAS. Experience with Shopify and conversion tracking preferred.',
      role: 'Marketing',
      budget: '$$',
      location: 'Remote',
      url: '#'
    },
    {
      id: '11',
      source: 'Reddit',
      subreddit: 'r/DesignJobs',
      postedAgo: '3d',
      title: 'Brand identity designer',
      summary: 'New consulting firm needs complete brand identity including logo, business cards, and website design. Looking for professional, trustworthy aesthetic.',
      role: 'Design',
      budget: '$$$',
      location: 'Los Angeles, CA',
      url: '#'
    },
    {
      id: '12',
      source: 'Reddit',
      subreddit: 'r/freelance',
      postedAgo: '2h',
      title: 'Technical writer for API documentation',
      summary: 'SaaS company needs clear, comprehensive API documentation. Must understand REST APIs and be able to write for both technical and non-technical audiences.',
      role: 'Copy',
      budget: '$$',
      location: 'Remote',
      url: '#'
    }
  ]
}

// Components
function StatsBanner() {
  return (
    <div className="mb-8 bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] rounded-2xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <TrendingUp className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              Lead Discovery Engine
            </h3>
            <p className="text-white/90 text-sm font-medium">
              AI-powered matching • Real-time updates • Premium opportunities
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-white">24</div>
          <div className="text-white/80 text-sm font-medium">leads found today</div>
        </div>
      </div>
      <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/90 text-sm font-medium">Live scanning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-white/90 text-sm font-medium">High-quality leads</span>
            </div>
          </div>
          <Button size="sm" className="bg-white text-[#3C3CFF] hover:bg-white/90 font-semibold shadow-md">
            View Analytics
          </Button>
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
    const interval = setInterval(updateTimeLeft, 60000) // Update every minute

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
        title={isDisabled ? "You can refresh again after the cooldown — we're gathering new leads!" : "Refresh leads"}
      >
        <RotateCcw className="h-3 w-3" />
        <span>
          {isDisabled ? `Next refresh in ${formatCountdown(timeLeft)}` : 'Refresh Leads'}
        </span>
      </Button>
    </div>
  )
}

function CooldownBanner() {
  return (
    <Card className="mb-6 border-0 shadow-sm bg-orange-50/50 backdrop-blur-sm border-orange-200">
      <CardContent className="p-3">
        <div className="flex items-center space-x-2 text-orange-800">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            Feed locked during cooldown. We'll have more warm leads soon.
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function FiltersBar({ filters, setFilters }: { filters: Filters, setFilters: (filters: Filters) => void }) {
  const budgets = ['All', '$', '$$', '$$$']
  const recencies = ['<24h', '<48h', '<7d']

  const activeFiltersCount = [
    filters.budget !== 'All', 
    filters.recency !== '<24h',
    filters.remote,
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
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Budget Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-800">Budget</Label>
            <div className="flex gap-1">
              {budgets.map((budget) => (
                <Button
                  key={budget}
                  size="sm"
                  variant={filters.budget === budget ? "default" : "outline"}
                  onClick={() => setFilters({ ...filters, budget })}
                  className={`text-xs font-medium transition-all duration-200 ${
                    filters.budget === budget 
                      ? 'bg-[#3C3CFF] text-white shadow-md hover:bg-[#2D2DCC]' 
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {budget}
                </Button>
              ))}
            </div>
          </div>

          {/* Recency Filter */}
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

          {/* Remote Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-gray-800">Work Type</Label>
            <div className="flex items-center space-x-2 p-2 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg border border-gray-200">
              <Switch
                checked={filters.remote}
                onCheckedChange={(checked) => setFilters({ ...filters, remote: checked })}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
              <div>
                <div className="text-xs font-medium text-gray-900">Remote Only</div>
              </div>
            </div>
          </div>

          {/* Saved Leads Filter */}
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

  const getBudgetColor = (budget: string) => {
    const colors = {
      '$': 'bg-green-50 text-green-700 border-green-200',
      '$$': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      '$$$': 'bg-red-50 text-red-700 border-red-200'
    }
    return colors[budget as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <Card className="group hover:shadow-xl hover:shadow-[#3C3CFF]/10 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <Badge className={`text-xs border font-medium ${getRoleColor(lead.role)}`}>
                {lead.role}
              </Badge>
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

        {/* Meta Info */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{lead.postedAgo}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="h-4 w-4" />
              <span>{lead.location}</span>
            </div>
            <div className="flex items-center space-x-1">
              <DollarSign className="h-4 w-4" />
              <Badge className={`text-xs border font-medium ${getBudgetColor(lead.budget)}`}>
                {lead.budget}
              </Badge>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>High match</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="text-xs text-gray-500">r/forhire</div>
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

function PitchModal({ open, onClose, lead }: {
  open: boolean
  onClose: () => void
  lead: Lead | null
}) {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (lead) {
      const template = `Hi! I saw your post about ${lead.title.toLowerCase()}. I have experience with ${lead.role.toLowerCase()} and would love to help. I can deliver high-quality work within your budget. Let me know if you'd like to discuss further!`
      setMessage(template)
    }
  }, [lead])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message)
    toast.success('Message copied to clipboard!')
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Compose Pitch</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="message">Your message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1"
              rows={4}
              placeholder="Write your pitch message..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Reply on Reddit or paste into email
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            <Copy className="h-4 w-4 mr-2" />
            Copy Reply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [minBudget, setMinBudget] = useState([1000])
  const [remote, setRemote] = useState(false)
  const [region, setRegion] = useState('')

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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSave = () => {
    onSave({
      services,
      niche,
      minBudget: minBudget[0],
      remote,
      region
    })
    onClose()
    toast.success('Niche saved!')
  }

  const toggleService = (service: string) => {
    setServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Your Niche ({step}/3)</DialogTitle>
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

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Preferences</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Minimum Budget: ${minBudget[0]}</Label>
                  <Slider
                    value={minBudget}
                    onValueChange={setMinBudget}
                    max={10000}
                    min={100}
                    step={100}
                    className="mt-2"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={remote}
                    onCheckedChange={setRemote}
                  />
                  <Label className="text-sm">Remote work only</Label>
                </div>

                <div>
                  <Label className="text-sm">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">US</SelectItem>
                      <SelectItem value="eu">EU</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={handleNext} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
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

function EmptyState({ hasNiche, onSetNiche, onBroadenFilters }: {
  hasNiche: boolean
  onSetNiche: () => void
  onBroadenFilters: () => void
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

  return (
    <Card className="text-center py-12">
      <CardContent>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Filter className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No perfect matches
        </h3>
        <p className="text-gray-600 mb-6">
          Try broadening your filters to see more leads
        </p>
        <Button onClick={onBroadenFilters} variant="outline">
          Broaden filters
        </Button>
      </CardContent>
    </Card>
  )
}

// Main component
export default function LeadsPage() {
  const [hasNiche, setHasNiche] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    budget: 'All',
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
    count: 138, // Good amount of credits
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
  const [nicheModalOpen, setNicheModalOpen] = useState(false)

  const mockLeads = useMockLeads()

  // Auto-open niche modal on first load
  useEffect(() => {
    if (!hasNiche) {
      setNicheModalOpen(true)
    }
  }, [hasNiche])

  // Filter leads based on current filters
  const filteredLeads = mockLeads.filter(lead => {
    if (filters.budget !== 'All' && lead.budget !== filters.budget) return false
    
    // Simple recency filter (in real app, would parse postedAgo)
    if (filters.recency === '<24h' && !lead.postedAgo.includes('h')) return false
    if (filters.recency === '<48h' && lead.postedAgo.includes('d')) return false
    
    return true
  })

  const handleRefresh = () => {
    // Simulate fetching new leads
    const newBatchSize = Math.floor(Math.random() * 11) + 20 // 20-30 leads
    setRefreshState(prev => ({
      ...prev,
      batchSize: newBatchSize
    }))
    
    // Start cooldown (3 hours)
    const cooldownMs = 3 * 60 * 60 * 1000 // 3 hours
    setRefreshState(prev => ({
      ...prev,
      isCoolingDown: true,
      nextRefreshAt: Date.now() + cooldownMs
    }))
    
    toast.success(`New leads loaded! Found ${newBatchSize} fresh opportunities.`)
  }

  const handleOpen = (lead: Lead) => {
    const isSaved = credits.savedLeadIds.includes(lead.id)
    
    if (isSaved) {
      // Saved leads can be opened without confirmation
      toast.success(`Opened saved lead: "${lead.title}"`)
    } else {
      // Show confirmation modal for new leads
      setSelectedLead(lead)
      setConfirmModalOpen(true)
    }
  }

  const handleConfirmDeduct = () => {
    if (selectedLead) {
      setCredits(prev => ({
        ...prev,
        count: prev.count - 1
      }))
      toast.success(`Opened lead: "${selectedLead.title}"`)
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

  const handleBroadenFilters = () => {
    setFilters({
      budget: 'All',
      recency: '<7d',
      remote: false,
      showSavedLeads: false
    })
  }

  const handleRefinePreferences = (newPreferences: Preferences) => {
    setPreferences(newPreferences)
    toast.success('Preferences updated')
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gray-50 min-h-screen -m-6 p-6">
        {/* Header with Credits Badge and Refresh Button */}
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

        {/* Stats Banner */}
        <StatsBanner />

        {/* Cooldown Banner */}
        {refreshState.isCoolingDown && <CooldownBanner />}

        {/* Context Bar */}
        <ContextBar 
          preferences={preferences} 
          onRefine={() => setRefineModalOpen(true)} 
        />

        {/* Credits Banner (shows when low or zero) */}
        {credits.count <= credits.lowThreshold && (
          <CreditsBanner count={credits.count} lowThreshold={credits.lowThreshold} />
        )}

        <FiltersBar filters={filters} setFilters={setFilters} />

        {filteredLeads.length === 0 ? (
          <EmptyState
            hasNiche={hasNiche}
            onSetNiche={() => setNicheModalOpen(true)}
            onBroadenFilters={handleBroadenFilters}
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

        <NicheOnboardingModal
          open={nicheModalOpen}
          onClose={() => setNicheModalOpen(false)}
          onSave={handleNicheSave}
        />
      </div>
    </DashboardLayout>
  )
}
