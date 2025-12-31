"use client"

import { useState, useEffect, useRef } from "react"
import { useTour } from "@/contexts/TourContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltipContent } from "@/components/ui/chart"
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  Sparkles,
  Edit3,
  Send,
  Clock,
  Plus,
  X as TwitterIcon,
  X,
  Linkedin,
  Image as ImageIcon,
  Link as LinkIcon,
  Save,
  ChevronRight,
  Target,
  RefreshCw,
  Lightbulb,
  MessageSquare,
  Heart,
  Share2,
  Copy,
  Zap,
  ArrowUp,
  CheckCircle2,
  CalendarDays,
  BarChart3,
  Play,
  Wand2,
  RotateCcw,
  ChevronDown,
  Trash2,
  Loader2,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { getCurrentAccount, getCurrentUser, getUserProfile } from "@/lib/auth"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import { toast } from "sonner"

// Mock engagement data for charts
const engagementData = [
  { date: "Mon", engagement: 245, followers: 1205 },
  { date: "Tue", engagement: 380, followers: 1218 },
  { date: "Wed", engagement: 290, followers: 1235 },
  { date: "Thu", engagement: 520, followers: 1267 },
  { date: "Fri", engagement: 410, followers: 1289 },
  { date: "Sat", engagement: 185, followers: 1295 },
  { date: "Sun", engagement: 220, followers: 1302 },
]

const followerGrowthData = [
  { month: "Jan", followers: 850 },
  { month: "Feb", followers: 920 },
  { month: "Mar", followers: 1050 },
  { month: "Apr", followers: 1180 },
  { month: "May", followers: 1250 },
  { month: "Jun", followers: 1302 },
]

const chartConfig = {
  engagement: {
    label: "Engagement",
    color: "hsl(var(--chart-1))",
  },
  followers: {
    label: "Followers",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function GrowPage() {
  const { isTourRunning, currentTour } = useTour()
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedGoal, setSelectedGoal] = useState<string>("")
  const [composeMode, setComposeMode] = useState<"manual" | "ai">("manual")
  const [autoPlanEnabled, setAutoPlanEnabled] = useState(false)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["twitter"])
  const [postText, setPostText] = useState("")
  const [plannerView, setPlannerView] = useState<"week" | "month" | "list" | "past">("week")
  
  // Wizard state
  const [wizardActive, setWizardActive] = useState(true)
  const [wizardStep, setWizardStep] = useState(1)
  const [includePromoInPlan, setIncludePromoInPlan] = useState<boolean>(true)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [customFocusTopic, setCustomFocusTopic] = useState<string>("")
  const [platformMode, setPlatformMode] = useState<"both" | "x" | "linkedin">("both")
  const [postsPerWeek, setPostsPerWeek] = useState<number>(4)
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)
  
  // AI-generated plan data
  const [aiPlanData, setAiPlanData] = useState<any>(null)

  // User data
  const [userName, setUserName] = useState<string>("")
  const [userIndustry, setUserIndustry] = useState<string>("")
  const weeklyGoal = 3
  const postsThisWeek = 2
  
  // Plan tier state
  const [planTier, setPlanTier] = useState<'free' | 'pro' | 'premium'>('free')
  
  // Fetch user name and plan tier on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Load user name
        const user = await getCurrentUser()
        if (user) {
          const profile = await getUserProfile(user.id)
          if (profile?.first_name) {
            // Use first name only, or full name if last name exists
            const name = profile.last_name 
              ? `${profile.first_name} ${profile.last_name}`
              : profile.first_name
            setUserName(name)
          } else {
            // Fallback to email or "there" if no name
            setUserName(user.email?.split('@')[0] || "there")
          }
        } else {
          setUserName("there")
        }

        // Load plan tier and industry
        const account = await getCurrentAccount()
        if (account) {
          if (account.plan_tier) {
            setPlanTier(account.plan_tier)
          }
          if (account.industry) {
            setUserIndustry(account.industry)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        setUserName("there")
      }
    }
    loadUserData()
  }, [])

  const handleGeneratePlan = async () => {
    setIsGenerating(true)
    console.log('🚀 Starting plan generation with:', {
      userName,
      userIndustry,
      selectedGoal,
      selectedTopics,
      customFocusTopic,
      platformMode,
      postsPerWeek,
      selectedSchedule,
    })

    try {
      const response = await fetch('/api/grow/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName,
          industry: userIndustry,
          selectedGoal,
          selectedTopics,
          customFocusTopic,
          platformMode,
          postsPerWeek,
          selectedSchedule,
          includePromo: includePromoInPlan,
        }),
      })

      console.log('📡 API Response status:', response.status, response.statusText)

      const result = await response.json()
      console.log('📦 API Response data:', result)

      if (result.success) {
        console.log('✅ Plan generated successfully!')
        console.log('📋 Generated Plan Data:', JSON.stringify(result.data, null, 2))
        setAiPlanData(result.data)
        setPlanGenerated(true)
        setWizardActive(false)
      } else {
        console.error('❌ Failed to generate plan:', result.error)
        console.error('Full error response:', result)
        toast.error('Failed to generate plan. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error generating plan:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast.error('An error occurred while generating your plan.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegeneratePlan = () => {
    setWizardActive(true)
    setWizardStep(1)
    setSelectedGoal("")
    setSelectedTopics([])
    setCustomFocusTopic("")
    setPlatformMode("both")
    setPostsPerWeek(4)
    setSelectedSchedule([])
    setIncludePromoInPlan(true)
    setPlanGenerated(false)
    setAiPlanData(null)
  }

  // Ensure we start on Growth Plan tab when tour starts
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "grow" && activeTab !== "overview") {
      setActiveTab("overview")
    }
  }, [isTourRunning, currentTour?.id])

  // Auto-switch tabs for grow tour - switch only when tour step specifically targets tab elements
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "grow") {
      let hasSwitchedToComposer = false
      let hasSwitchedToPlanner = false
      let hasSwitchedToBrand = false
      
      const checkForTabSwitch = () => {
        // Check if ai-studio-tab is the current target - only switch when tooltip text is specifically about this tab
        if (!hasSwitchedToComposer && activeTab === "overview") {
          const aiStudioTab = document.querySelector('[data-help="ai-studio-tab"]')
          const tourTooltip = document.querySelector('div[class*="bg-white"][class*="rounded-xl"]')
          if (aiStudioTab && tourTooltip) {
            const tooltipText = tourTooltip.textContent || ''
            // Only switch if tooltip text starts with "The AI Studio tab" (specific hint about this tab, not just mentioning it)
            if (tooltipText.includes("The AI Studio tab is your intelligent content composer")) {
              setActiveTab("composer")
              hasSwitchedToComposer = true
              return
            }
          }
        }
        
        // Check if schedule-tab is the current target
        if (!hasSwitchedToPlanner && activeTab === "composer") {
          const scheduleTab = document.querySelector('[data-help="schedule-tab"]')
          const tourTooltip = document.querySelector('div[class*="bg-white"][class*="rounded-xl"]')
          if (scheduleTab && tourTooltip) {
            const tooltipText = tourTooltip.textContent || ''
            // Only switch if tooltip text starts with "The Schedule tab" (specific hint about this tab)
            if (tooltipText.includes("The Schedule tab provides a comprehensive view")) {
              setActiveTab("planner")
              hasSwitchedToPlanner = true
              return
            }
          }
        }
        
        // Check if brand-profile-tab is the current target
        if (!hasSwitchedToBrand && activeTab === "planner") {
          const brandTab = document.querySelector('[data-help="brand-profile-tab"]')
          const tourTooltip = document.querySelector('div[class*="bg-white"][class*="rounded-xl"]')
          if (brandTab && tourTooltip) {
            const tooltipText = tourTooltip.textContent || ''
            // Only switch if tooltip text contains the exact phrase from the brand profile tab hint
            if (tooltipText.includes("The Brand Profile tab is your central location")) {
              setActiveTab("brand")
              hasSwitchedToBrand = true
              return
            }
          }
        }
      }
      
      const interval = setInterval(checkForTabSwitch, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-8 p-8" data-help="grow-page">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white" data-help="grow-header">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                Grow Your Brand 📈
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl">
                Let Jolix help you build visibility and attract clients with consistent content
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-100 px-6">
              <TabsList className="h-14 bg-transparent border-0 gap-6" data-help="grow-tabs">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="growth-plan-tab"
                >
                  Growth Plan
                </TabsTrigger>
                <TabsTrigger 
                  value="composer"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="ai-studio-tab"
                >
                  Create
                </TabsTrigger>
                <TabsTrigger 
                  value="planner"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="schedule-tab"
                >
                  Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="brand"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="brand-profile-tab"
                >
                  Brand Profile
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Growth Plan Tab */}
              <TabsContent value="overview" className="mt-0" data-help="growth-plan-content">
                <GrowthPlanTab 
                  userName={userName}
                  wizardActive={wizardActive}
                  wizardStep={wizardStep}
                  setWizardStep={setWizardStep}
                  selectedGoal={selectedGoal}
                  setSelectedGoal={setSelectedGoal}
                  selectedTopics={selectedTopics}
                  setSelectedTopics={setSelectedTopics}
                  customFocusTopic={customFocusTopic}
                  setCustomFocusTopic={setCustomFocusTopic}
                  platformMode={platformMode}
                  setPlatformMode={setPlatformMode}
                  postsPerWeek={postsPerWeek}
                  setPostsPerWeek={setPostsPerWeek}
                  selectedSchedule={selectedSchedule}
                  setSelectedSchedule={setSelectedSchedule}
                  isGenerating={isGenerating}
                  planGenerated={planGenerated}
                  onGeneratePlan={handleGeneratePlan}
                  onRegeneratePlan={handleRegeneratePlan}
                  postsThisWeek={postsThisWeek}
                  weeklyGoal={weeklyGoal}
                  planTier={planTier}
                  aiPlanData={aiPlanData}
                  includePromoInPlan={includePromoInPlan}
                  setIncludePromoInPlan={setIncludePromoInPlan}
                />
              </TabsContent>

              {/* AI Studio Tab */}
              <TabsContent value="composer" className="mt-0" data-help="ai-studio-content">
                <AIStudioTab 
                  mode={composeMode}
                  setMode={setComposeMode}
                  autoPlanEnabled={autoPlanEnabled}
                  setAutoPlanEnabled={setAutoPlanEnabled}
                  selectedPlatforms={selectedPlatforms}
                  setSelectedPlatforms={setSelectedPlatforms}
                  postText={postText}
                  setPostText={setPostText}
                  userIndustry={userIndustry}
                />
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="planner" className="mt-0" data-help="schedule-content">
                <ScheduleTab view={plannerView} setView={setPlannerView} />
              </TabsContent>

              {/* Brand Profile Tab */}
              <TabsContent value="brand" className="mt-0" data-help="brand-profile-content">
                <BrandProfileTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}

// 📊 POST FREQUENCY STEP
function PostFrequencyStep({
  platformMode,
  setPlatformMode,
  postsPerWeek,
  setPostsPerWeek,
  onBack,
  onContinue,
  planTier
}: {
  platformMode: "both" | "x" | "linkedin"
  setPlatformMode: (mode: "both" | "x" | "linkedin") => void
  postsPerWeek: number
  setPostsPerWeek: (count: number) => void
  onBack: () => void
  onContinue: () => void
  planTier: 'free' | 'pro' | 'premium'
}) {
  // Get available posts message based on plan tier
  const getAvailablePostsMessage = () => {
    if (planTier === 'premium') {
      return "You have unlimited posts available to be scheduled this month"
    } else if (planTier === 'pro') {
      return "You have 100 posts available to be scheduled this month"
    } else {
      return "You have 10 posts available to be scheduled this month"
    }
  }
  const [scaleAnim, setScaleAnim] = useState(false)
  const [showMaxTooltip, setShowMaxTooltip] = useState(false)

  // Calculate min/max based on platform
  const getLimits = () => {
    if (platformMode === "both") return { min: 2, max: 10, default: 4 }
    if (platformMode === "x") return { min: 2, max: 7, default: 3 }
    return { min: 2, max: 5, default: 3 } // linkedin
  }

  const limits = getLimits()

  // Auto-balance calculation for "both" mode
  const calculateSplit = (total: number) => {
    if (platformMode !== "both") return { x: total, linkedin: 0 }
    if (total >= 5) {
      const x = Math.round(total * 0.6)
      const linkedin = total - x // Ensure sum equals total
      return { x, linkedin }
    }
    // For smaller totals, split evenly
    const x = Math.ceil(total / 2)
    const linkedin = total - x
    return { x, linkedin }
  }

  const split = calculateSplit(postsPerWeek)

  // Handle platform mode change
  useEffect(() => {
    const newLimits = getLimits()
    if (postsPerWeek > newLimits.max) {
      setPostsPerWeek(newLimits.max)
      // Could show a toast here: "Adjusted to fit LinkedIn's best-practice limit."
    } else if (postsPerWeek < newLimits.min) {
      setPostsPerWeek(newLimits.min)
    } else if (platformMode !== "both" && postsPerWeek === 4) {
      // If switching from "both" (default 4) to single platform, use platform default
      setPostsPerWeek(newLimits.default)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformMode])

  const handleDecrease = () => {
    if (postsPerWeek > limits.min) {
      setScaleAnim(true)
      setTimeout(() => setScaleAnim(false), 250)
      setPostsPerWeek(postsPerWeek - 1)
    }
  }

  const handleIncrease = () => {
    if (postsPerWeek < limits.max) {
      setScaleAnim(true)
      setTimeout(() => setScaleAnim(false), 250)
      setPostsPerWeek(postsPerWeek + 1)
    } else {
      // Show tooltip for max limit
      setShowMaxTooltip(true)
      setTimeout(() => setShowMaxTooltip(false), 3000)
    }
  }

  const getHelperText = () => {
    if (platformMode === "both") {
      return "💡 Jolix recommends 4–8 posts/week across X + LinkedIn. We'll auto-balance for best results."
    }
    if (platformMode === "x") {
      return "💡 X performs well at 3–7 posts/week."
    }
    return "💡 LinkedIn performs best at 2–4 posts/week; too many can reduce reach."
  }

  return (
    <Card className="shadow-sm border-gray-100 animate-in fade-in duration-500">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">How many posts should Jolix create this week?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Platform Selector */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700">Select platforms:</Label>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setPlatformMode("both")}
              className={`px-5 py-3 rounded-xl border-2 transition-all ${
                platformMode === "both"
                  ? "border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 shadow-md"
                  : "border-gray-200 hover:border-[#3C3CFF]/30 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <TwitterIcon className="h-4 w-4" />
                <Linkedin className="h-4 w-4" />
                <span className={`font-medium ${platformMode === "both" ? "text-[#3C3CFF]" : "text-gray-700"}`}>
                  Both
                </span>
              </div>
            </button>
            <button
              onClick={() => setPlatformMode("x")}
              className={`px-5 py-3 rounded-xl border-2 transition-all ${
                platformMode === "x"
                  ? "border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 shadow-md"
                  : "border-gray-200 hover:border-[#3C3CFF]/30 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <TwitterIcon className="h-4 w-4" />
                <span className={`font-medium ${platformMode === "x" ? "text-[#3C3CFF]" : "text-gray-700"}`}>
                  only
                </span>
              </div>
            </button>
            <button
              onClick={() => setPlatformMode("linkedin")}
              className={`px-5 py-3 rounded-xl border-2 transition-all ${
                platformMode === "linkedin"
                  ? "border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 shadow-md"
                  : "border-gray-200 hover:border-[#3C3CFF]/30 bg-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <Linkedin className="h-4 w-4" />
                <span className={`font-medium ${platformMode === "linkedin" ? "text-[#3C3CFF]" : "text-gray-700"}`}>
                  LinkedIn only
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Stepper */}
        <div className="space-y-4">
          {/* Plan-based posts available pill */}
          <div className="flex justify-center">
            <Badge className="bg-[#3C3CFF]/10 text-[#3C3CFF] border border-[#3C3CFF]/20 px-3 py-1.5 text-xs font-medium hover:bg-[#3C3CFF]/10 hover:text-[#3C3CFF] cursor-default">
              {getAvailablePostsMessage()}
            </Badge>
          </div>
          <Label className="text-sm font-medium text-gray-700 text-center block">Posts per week:</Label>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleDecrease}
              disabled={postsPerWeek <= limits.min}
              className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:ring-offset-2 ${
                postsPerWeek <= limits.min
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:border-[#3C3CFF] hover:bg-blue-50"
              }`}
              aria-label="Decrease posts"
            >
              <span className="text-2xl font-light">−</span>
            </button>
            
            <div className="relative">
              <span
                className={`text-5xl font-bold text-gray-900 inline-block transition-transform duration-250 ease-out ${
                  scaleAnim ? "scale-[0.8]" : "scale-100"
                }`}
                aria-label={`Post count: ${postsPerWeek}`}
              >
                {postsPerWeek}
              </span>
              {showMaxTooltip && (
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10">
                  That's our weekly limit for healthy growth. Try repurposing high-performers instead.
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>

            <button
              onClick={handleIncrease}
              disabled={postsPerWeek >= limits.max}
              className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:ring-offset-2 ${
                postsPerWeek >= limits.max
                  ? "border-gray-200 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 text-gray-700 hover:border-[#3C3CFF] hover:bg-blue-50"
              }`}
              aria-label="Increase posts"
            >
              <span className="text-2xl font-light">+</span>
            </button>
          </div>

          {/* Balance Hint (only for "both") */}
          {platformMode === "both" && (
            <p className="text-xs text-center text-gray-500">
              Current split: X {split.x} · LinkedIn {split.linkedin} (auto-adjusts as you change the total)
            </p>
          )}

          {/* Helper Text */}
          <p className="text-sm text-center text-gray-600 leading-relaxed">
            {getHelperText()}
          </p>

        
        </div>

        {/* CTA Row */}
        <div className="flex gap-3 justify-center pt-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Back
          </button>
          <Button
            onClick={onContinue}
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            disabled={postsPerWeek < limits.min || postsPerWeek > limits.max}
          >
            Continue
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 🌱 GROWTH PLAN TAB (formerly Overview)
function GrowthPlanTab({ 
  userName, 
  wizardActive,
  wizardStep,
  setWizardStep,
  selectedGoal, 
  setSelectedGoal,
  selectedTopics,
  setSelectedTopics,
  customFocusTopic,
  setCustomFocusTopic,
  platformMode,
  setPlatformMode,
  postsPerWeek,
  setPostsPerWeek,
  selectedSchedule,
  setSelectedSchedule,
  isGenerating,
  planGenerated,
  onGeneratePlan,
  onRegeneratePlan,
  postsThisWeek,
  weeklyGoal,
  planTier,
  aiPlanData,
  includePromoInPlan,
  setIncludePromoInPlan
}: { 
  userName: string
  wizardActive: boolean
  wizardStep: number
  setWizardStep: (step: number) => void
  selectedGoal: string
  setSelectedGoal: (goal: string) => void
  selectedTopics: string[]
  setSelectedTopics: (topics: string[]) => void
  customFocusTopic: string
  setCustomFocusTopic: (topic: string) => void
  platformMode: "both" | "x" | "linkedin"
  setPlatformMode: (mode: "both" | "x" | "linkedin") => void
  postsPerWeek: number
  setPostsPerWeek: (count: number) => void
  selectedSchedule: string[]
  setSelectedSchedule: (schedule: string[]) => void
  isGenerating: boolean
  planGenerated: boolean
  onGeneratePlan: () => void
  onRegeneratePlan: () => void
  postsThisWeek: number
  weeklyGoal: number
  planTier: 'free' | 'pro' | 'premium'
  aiPlanData: any
  includePromoInPlan: boolean
  setIncludePromoInPlan: (value: boolean) => void
}) {
  // State for editing posts
  const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null)
  const [localPosts, setLocalPosts] = useState<any[]>([])
  
  // Schedule modal state for individual posts
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedPostForSchedule, setSelectedPostForSchedule] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("09:00")
  
  // Initialize local posts when aiPlanData changes
  useEffect(() => {
    if (aiPlanData?.posts) {
      setLocalPosts([...aiPlanData.posts])
    } else {
      // Use fallback posts
      setLocalPosts([
        { 
          num: "1",
          date: "Tue 10 AM",
          platform: "twitter",
          content: "Red flag I wish I caught earlier: clients who say 'just make it pop' without explaining what that means 🚩\n\nGreat clients give context. They say things like 'more vibrant colors for a younger audience' or 'increase contrast for accessibility.'\n\nClear feedback = better work. Always ask: 'Can you show me an example of what you mean?'",
          category: "Freelancing tip"
        },
        { 
          num: "2",
          date: "Thu 11 AM",
          platform: "linkedin",
          content: "Just wrapped a brand identity project that changed everything for this client.\n\nBefore: Generic, forgettable logo\nAfter: Distinctive identity that tells their story\n\n3 things that made the difference:\n\n1. Deep discovery session (not just 'what colors do you like?')\n2. Competitive audit to find whitespace\n3. Brand guidelines they can actually use\n\nSometimes clients don't know what they need until you show them.\n\nWhat's been your biggest client transformation story? 👇",
          category: "Client story"
        },
        { 
          num: "3",
          date: "Sat 9 AM",
          platform: "twitter",
          content: "3 lessons from my latest design project:\n\n1. Start with constraints\nInstead of unlimited options, I gave myself: max 3 colors, 2 fonts, mobile-first. Creativity exploded.\n\n2. Client feedback ≠ design direction\n'Make it bigger' often means 'make it more prominent.' Sometimes that's hierarchy, not size.\n\n3. Document decisions as you go\nWhat seems obvious today won't be in 6 months. Screenshot the 'why' behind every choice.\n\nWhat have you learned recently?",
          category: "Portfolio post"
        },
      ])
    }
  }, [aiPlanData])
  
  const handleEditPost = (index: number) => {
    setEditingPostIndex(index)
  }
  
  const handleSavePost = (index: number) => {
    setEditingPostIndex(null)
    // Update aiPlanData with edited content
    if (aiPlanData) {
      const updatedData = { ...aiPlanData, posts: [...localPosts] }
      // Note: We can't directly update aiPlanData prop, but we can update local state
      // The parent component would need to handle this if persistence is needed
    }
  }
  
  const handlePostContentChange = (index: number, newContent: string) => {
    const updated = [...localPosts]
    updated[index] = { ...updated[index], content: newContent }
    setLocalPosts(updated)
  }
  
  const goals = [
    { id: "clients", label: "Get Clients", icon: Target, tagline: "Attract new leads and projects", emoji: "🎯" },
    { id: "audience", label: "Grow Audience", icon: TrendingUp, tagline: "Build reach and followers", emoji: "🌍" },
    { id: "expertise", label: "Build Authority", icon: Lightbulb, tagline: "Share expertise, become a go-to pro", emoji: "💬" },
  ]

  const topics = ["#freelancing", "#design", "#clienttips", "#portfolio", "#pricing", "#branding"]
  const schedules = [
    { id: "morning", label: "Morning", time: "7–10 AM", emoji: "🕙" },
    { id: "midday", label: "Midday", time: "11–3 PM", emoji: "🌤️" },
    { id: "evening", label: "Evening", time: "6–9 PM", emoji: "🌙" },
  ]

  const toggleTopic = (topic: string) => {
    if (selectedTopics.includes(topic)) {
      setSelectedTopics(selectedTopics.filter(t => t !== topic))
    } else {
      setSelectedTopics([...selectedTopics, topic])
    }
  }

  const toggleSchedule = (schedule: string) => {
    if (selectedSchedule.includes(schedule)) {
      setSelectedSchedule(selectedSchedule.filter(s => s !== schedule))
    } else {
      setSelectedSchedule([...selectedSchedule, schedule])
    }
  }

  // Wizard View
  if (wizardActive) {
    return (
      <div className="max-w-3xl mx-auto">
        {/* Progress Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                step === wizardStep
                  ? "w-8 bg-[#3C3CFF]"
                  : step < wizardStep
                  ? "w-2 bg-[#3C3CFF]/60"
                  : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>

        {/* Step 1 - Greeting */}
        {wizardStep === 1 && (
          <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white to-purple-50/30 animate-in fade-in duration-500">
            <CardContent className="pt-12 pb-12 text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-3">
                  Hey {userName || "there"}, let's design your growth plan for this week 🚀
                </h2>
                <p className="text-gray-600 text-lg">
                  Jolix will craft a personalized content plan to help you hit your goals.
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => setWizardStep(2)}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC] h-12 px-8"
              >
                Start My Plan
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2 - Choose Goal */}
        {wizardStep === 2 && (
          <Card className="shadow-sm border-gray-100 animate-in fade-in duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">What's your main focus this week?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {goals.map((goal) => {
                  const Icon = goal.icon
                  const isSelected = selectedGoal === goal.id
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-center hover:scale-105 ${
                        isSelected
                          ? "border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 shadow-lg animate-pulse"
                          : "border-gray-200 hover:border-[#3C3CFF]/30 bg-white"
                      }`}
                    >
                      <div className="text-4xl mb-3">{goal.emoji}</div>
                      <div className={`font-bold text-lg mb-2 ${isSelected ? "text-[#3C3CFF]" : "text-gray-900"}`}>
                        {goal.label}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {goal.tagline}
                      </p>
                    </button>
                  )
                })}
              </div>
              
              {/* Include Promo Toggle */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <Switch
                  id="include-promo-plan"
                  checked={includePromoInPlan}
                  onCheckedChange={setIncludePromoInPlan}
                />
                <div className="flex-1">
                  <Label htmlFor="include-promo-plan" className="text-sm font-medium cursor-pointer">
                    Include promotional content
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {includePromoInPlan 
                      ? `When enabled, ${selectedGoal === 'clients' ? '~40%' : selectedGoal === 'audience' ? '~25%' : '~15%'} of posts will include promotional CTAs based on your focus.`
                      : 'All posts will be pure value content with no promotional mentions.'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setWizardStep(1)}>
                  Back
                </Button>
                <Button
                  onClick={() => setWizardStep(3)}
                  disabled={!selectedGoal}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3 - Choose Topics */}
        {wizardStep === 3 && (
          <Card className="shadow-sm border-gray-100 animate-in fade-in duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">What kind of content do you want to focus on?</CardTitle>
              <CardDescription>(Optional - Select multiple)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {topics.map((topic) => {
                  const isSelected = selectedTopics.includes(topic)
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-4 py-2 rounded-full border-2 transition-all ${
                        isSelected
                          ? "border-[#3C3CFF] bg-[#3C3CFF] text-white"
                          : "border-gray-300 hover:border-[#3C3CFF]/50 bg-white"
                      }`}
                    >
                      {topic}
                    </button>
                  )
                })}
              </div>
              <div className="text-center text-sm text-gray-600">
                <Lightbulb className="h-4 w-4 inline mr-1" />
                AI-suggested based on your Brand Profile
              </div>

              {/* Manual Input Field */}
              <div className="space-y-2">
                <Label htmlFor="custom-focus" className="text-sm font-medium text-gray-700">
                  Add your own focus
                </Label>
                <Input
                  id="custom-focus"
                  type="text"
                  placeholder="e.g. Client onboarding, pricing mindset, design process…"
                  value={customFocusTopic}
                  onChange={(e) => setCustomFocusTopic(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 leading-relaxed">
                  💡 Jolix will mix your focus into this week's content plan while balancing other engaging post types. This helps your feed stay natural and well-rounded.
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setWizardStep(2)}>
                  Back
                </Button>
                <Button
                  onClick={() => setWizardStep(4)}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4 - Post Frequency */}
        {wizardStep === 4 && (
          <PostFrequencyStep
            platformMode={platformMode}
            setPlatformMode={setPlatformMode}
            postsPerWeek={postsPerWeek}
            setPostsPerWeek={setPostsPerWeek}
            onBack={() => setWizardStep(3)}
            onContinue={() => setWizardStep(5)}
            planTier={planTier}
          />
        )}

        {/* Step 5 - Confirm Schedule */}
        {wizardStep === 5 && (
          <Card className="shadow-sm border-gray-100 animate-in fade-in duration-500">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">When do you like to post?</CardTitle>
              <CardDescription>Select your preferred posting times</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {schedules.map((schedule) => {
                  const isSelected = selectedSchedule.includes(schedule.id)
                  return (
                    <button
                      key={schedule.id}
                      onClick={() => toggleSchedule(schedule.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-center hover:scale-105 ${
                        isSelected
                          ? "border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 shadow-md"
                          : "border-gray-200 hover:border-[#3C3CFF]/30 bg-white"
                      }`}
                    >
                      <div className="text-4xl mb-3">{schedule.emoji}</div>
                      <div className={`font-bold text-lg mb-1 ${isSelected ? "text-[#3C3CFF]" : "text-gray-900"}`}>
                        {schedule.label}
                      </div>
                      <p className="text-sm text-gray-600">{schedule.time}</p>
                    </button>
                  )
                })}
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-[#3C3CFF] font-medium">
                  <Lightbulb className="h-4 w-4 inline mr-1" />
                  Your audience engages most at 10 AM and 7 PM
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => setWizardStep(4)}>
                  Back
                </Button>
                <Button
                  onClick={onGeneratePlan}
                  disabled={selectedSchedule.length === 0}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate My Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Generating Animation
  if (isGenerating) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm border-gray-100 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30">
          <CardContent className="pt-20 pb-20 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-[#3C3CFF] animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xl font-semibold text-gray-900 animate-pulse">✨ Crafting your growth plan…</p>
              <p className="text-gray-600 animate-pulse delay-100">Optimizing posting times…</p>
              <p className="text-gray-600 animate-pulse delay-200">Selecting high-performing topics…</p>
              <p className="text-gray-600 animate-pulse delay-300">Almost done…</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Revealed Plan View
  const goalLabels: Record<string, string> = {
    clients: "Get Clients",
    audience: "Grow Audience",
    expertise: "Build Authority"
  }

  // Extract first name from userName
  const firstName = userName.split(' ')[0] || userName

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header with Regenerate */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">
            {aiPlanData?.greeting || `Hey ${firstName}, Your Growth Plan for This Week 🌱`}
          </h2>
          <p className="text-gray-600 text-lg">
            Tailored to your goal: <span className="font-semibold text-[#3C3CFF]">{goalLabels[selectedGoal]}</span>
          </p>
        </div>
        <Button variant="outline" onClick={onRegeneratePlan} className="flex-shrink-0">
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate Plan
        </Button>
      </div>

      {/* A. Posting Schedule */}
      <Card className="shadow-sm border-gray-100 animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#3C3CFF]" />
              <h4 className="font-semibold text-lg">
                {aiPlanData?.postingSchedule?.description || "3 posts this week"}
              </h4>
            </div>
            {aiPlanData?.postingSchedule?.times ? (
              <p className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: aiPlanData.postingSchedule.times }} />
            ) : (
              <p className="text-gray-700 leading-relaxed">
                <span className="font-semibold text-gray-900">Tue 10 AM</span> • <span className="font-semibold text-gray-900">Thu 11 AM</span> • <span className="font-semibold text-gray-900">Sat 9 AM</span> — (best engagement windows)
              </p>
            )}
            <div className="flex items-center gap-2 text-sm text-[#3C3CFF] bg-blue-50 rounded-lg px-3 py-2 w-fit">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                {aiPlanData?.postingSchedule?.insight || "Avg reach +18% at these times."}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Topics & Ideas */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#3C3CFF]" />
          <h3 className="text-xl font-bold text-gray-900">Jolix suggests:</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {localPosts.map((post: any, idx: number) => (
            <Card key={idx} className="shadow-md border-[#3C3CFF]/20 hover:shadow-lg hover:border-[#3C3CFF]/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Post Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                      {post.num}
                    </div>
                  </div>

                  {/* Tweet Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge variant="secondary" className="text-xs">
                        {post.category}
                      </Badge>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-600 font-medium">{post.date}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <div className={`flex items-center gap-1 ${
                        post.platform === "twitter" ? "text-black" : "text-blue-700"
                      }`}>
                        {post.platform === "twitter" ? (
                          <>
                            <TwitterIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">X (manual post)</span>
                          </>
                        ) : (
                          <>
                            <Linkedin className="h-3 w-3" />
                            <span className="text-xs font-medium">LinkedIn</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Tweet Text */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-4">
                      {editingPostIndex === idx ? (
                        <Textarea
                          value={post.content || post.tweet || ''}
                          onChange={(e) => handlePostContentChange(idx, e.target.value)}
                          className="text-gray-900 leading-relaxed text-sm min-h-[150px] resize-y"
                          autoFocus
                        />
                      ) : (
                        <p className="text-gray-900 leading-relaxed whitespace-pre-line text-sm">
                          {post.content || post.tweet}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {editingPostIndex === idx ? (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300 hover:bg-gray-50"
                          onClick={() => handleSavePost(idx)}
                        >
                          <Save className="h-3.5 w-3.5 mr-1.5" />
                          Save
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300 hover:bg-gray-50"
                          onClick={() => handleEditPost(idx)}
                        >
                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-gray-300 hover:bg-gray-50"
                        onClick={() => handleOpenScheduleModal(idx)}
                      >
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        Schedule
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Schedule Modal for Individual Posts */}
      <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Schedule Your Post</DialogTitle>
            <DialogDescription>
              Choose a date and time to schedule this post
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Date Picker */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select Date</Label>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                className="rounded-md border"
              />
              {selectedDate && (
                <p className="text-sm text-gray-600">
                  Selected: {format(selectedDate, "PPP")}
                </p>
              )}
            </div>
            
            {/* Time Picker - Only show after date is selected */}
            {selectedDate && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label className="text-sm font-medium">Select Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Your post will be scheduled for {format(selectedDate, "PPP")} at {selectedTime}
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setScheduleModalOpen(false)
                setSelectedPostForSchedule(null)
                setSelectedDate(undefined)
                setSelectedTime("09:00")
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              onClick={handleScheduleIndividualPost}
              disabled={!selectedDate}
            >
              Schedule Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* C. Engagement Boosters */}
      <Card className="shadow-sm border-gray-100 animate-in slide-in-from-bottom-4 duration-1000">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3C3CFF]" />
            <CardTitle>Simple Actions:</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(aiPlanData?.engagementActions || [
              "Reply to 2 comments within 30 min of posting",
              "Comment on 3 posts from your niche daily",
              "Re-share a successful post mid-week"
            ]).map((action: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-[#3C3CFF] mt-0.5 flex-shrink-0" />
                <p className="text-gray-700" dangerouslySetInnerHTML={{ __html: action }} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* D. CTA Row */}
      <Card className="shadow-sm border-[#3C3CFF]/20 bg-gradient-to-br from-blue-50 to-purple-50 animate-in slide-in-from-bottom-4 duration-1000">
        <CardContent className="pt-6">
          <Button size="lg" className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] h-12 text-base mb-3">
            <Sparkles className="h-5 w-5 mr-2" />
            Approve and schedule
          </Button>
          <p className="text-sm text-center text-gray-600">
            Jolix will draft these posts and schedule them automatically.
          </p>
        </CardContent>
      </Card>

      {/* F. AI Summary */}
      <Card className="shadow-md border-[#3C3CFF]/30 bg-gradient-to-br from-[#3C3CFF]/5 via-purple-50/50 to-blue-50/50 animate-in slide-in-from-bottom-4 duration-1000">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Plan Summary</CardTitle>
              <CardDescription className="mt-1">Your personalized growth strategy at a glance</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overview */}
          <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
            <p className="text-gray-800 leading-relaxed">
              {aiPlanData?.summary?.overview || (
                <>
                  This week's plan is designed to help you <span className="font-semibold text-[#3C3CFF]">{goalLabels[selectedGoal].toLowerCase()}</span> through strategic content that resonates with your audience. You'll post <span className="font-semibold">3 times</span> at optimal engagement windows, focusing on <span className="font-semibold">freelancing expertise</span> and <span className="font-semibold">client management insights</span>.
                </>
              )}
            </p>
          </div>

          {/* Key Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-[#3C3CFF]" />
                <h4 className="font-semibold text-sm text-gray-700">Posting Schedule</h4>
              </div>
              <p className="text-sm text-gray-600">
                {aiPlanData?.postingSchedule?.times ? (
                  aiPlanData.postingSchedule.times
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">Tue, Thu, Sat</span> at peak engagement times (10 AM, 11 AM, 9 AM)
                  </>
                )}
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#3C3CFF]">
                <TrendingUp className="h-3 w-3" />
                <span>{aiPlanData?.summary?.expectedReach || "+18% expected reach"}</span>
              </div>
            </div>

            <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-[#3C3CFF]" />
                <h4 className="font-semibold text-sm text-gray-700">Content Focus</h4>
              </div>
              <p className="text-sm text-gray-600">
                {aiPlanData?.summary?.contentFocus || (
                  <>
                    Mix of <span className="font-semibold text-gray-900">practical tips</span>, <span className="font-semibold text-gray-900">client stories</span>, and <span className="font-semibold text-gray-900">portfolio showcases</span>
                  </>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedTopics.slice(0, 3).map((topic, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
                {selectedTopics.length === 0 && (
                  <Badge variant="secondary" className="text-xs">Freelancing</Badge>
                )}
              </div>
            </div>

            <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-[#3C3CFF]" />
                <h4 className="font-semibold text-sm text-gray-700">Engagement Strategy</h4>
              </div>
              <p className="text-sm text-gray-600">
                Quick actions to maximize reach: <span className="font-semibold text-gray-900">reply promptly</span>, <span className="font-semibold text-gray-900">engage daily</span>, and <span className="font-semibold text-gray-900">re-share top content</span>
              </p>
            </div>

            <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-[#3C3CFF]" />
                <h4 className="font-semibold text-sm text-gray-700">Expected Impact</h4>
              </div>
              <p className="text-sm text-gray-600">
                Consistent execution could drive <span className="font-semibold text-gray-900">+15-25% engagement</span> and <span className="font-semibold text-gray-900">increased visibility</span> in your niche
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="pt-4 border-t border-white/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">Ready to execute?</p>
                <p className="text-sm text-gray-600 mb-3">
                  Use the "Approve and schedule" button above to automatically create and schedule all 3 posts. Then focus on engagement actions throughout the week.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ✍️ AI STUDIO TAB
function AIStudioTab({ 
  mode, 
  setMode, 
  autoPlanEnabled,
  setAutoPlanEnabled,
  selectedPlatforms, 
  setSelectedPlatforms,
  postText,
  setPostText,
  userIndustry
}: {
  mode: "manual" | "ai"
  setMode: (mode: "manual" | "ai") => void
  autoPlanEnabled: boolean
  setAutoPlanEnabled: (enabled: boolean) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  postText: string
  setPostText: (text: string) => void
  userIndustry: string
}) {
  const [previewPlatform, setPreviewPlatform] = useState<"twitter" | "linkedin">("twitter")
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [promptText, setPromptText] = useState<string>("")
  const [selectedPlatform, setSelectedPlatform] = useState<"twitter" | "linkedin">("twitter")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [includePromo, setIncludePromo] = useState<boolean>(false)
  const [showInfoBanner, setShowInfoBanner] = useState<boolean>(false)
  
  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("09:00")
  
  // Confirm posted modal state for X posts
  const [confirmPostedModalOpen, setConfirmPostedModalOpen] = useState(false)
  const [editingPostIndex, setEditingPostIndex] = useState<number | null>(null)
  const [localPosts, setLocalPosts] = useState<any[]>([])
  const [rewriteCount, setRewriteCount] = useState<number>(0)
  const [undoText, setUndoText] = useState<string>("")
  const [showUndo, setShowUndo] = useState<boolean>(false)
  const [customRewritePrompt, setCustomRewritePrompt] = useState<string>("")
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const [localImages, setLocalImages] = useState<Array<{ file: File; preview: string }>>([])
  const [isRewriting, setIsRewriting] = useState<boolean>(false)
  const maxChars = previewPlatform === "twitter" ? 280 : 3000

  // Check if info banner should be shown (first visit only)
  useEffect(() => {
    const dismissed = localStorage.getItem('jolix-social-x-info-dismissed')
    if (!dismissed) {
      setShowInfoBanner(true)
    }
  }, [])

  // Handle banner dismissal
  const handleDismissBanner = () => {
    setShowInfoBanner(false)
    localStorage.setItem('jolix-social-x-info-dismissed', 'true')
  }

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Cleanup all object URLs when component unmounts
      setLocalImages((prev) => {
        prev.forEach((item) => URL.revokeObjectURL(item.preview))
        return []
      })
    }
  }, []) // Only run on unmount

  const togglePlatform = (platform: string) => {
    // Only allow one platform at a time
    setSelectedPlatforms([platform])
  }

  // Dummy data for posts
  const dummyPosts = [
    {
      text: "Red flag I wish I caught earlier: clients who say 'just make it pop' without explaining what that means 🚩\n\nGreat clients give context. They say things like 'more vibrant colors for a younger audience' or 'increase contrast for accessibility.'\n\nClear feedback = better work. Always ask: 'Can you show me an example of what you mean?'",
      category: "Freelancing tip",
      platform: "twitter",
      impact: "High"
    },
    {
      text: "Just wrapped a brand identity project that changed everything for this client.\n\nBefore: Generic, forgettable logo\nAfter: Distinctive identity that tells their story\n\n3 things that made the difference:\n\n1. Deep discovery session (not just 'what colors do you like?')\n2. Competitive audit to find whitespace\n3. Brand guidelines they can actually use\n\nSometimes clients don't know what they need until you show them.",
      category: "Client story",
      platform: "linkedin",
      impact: "High"
    },
    {
      text: "3 lessons from my latest design project:\n\n1. Start with constraints\nInstead of unlimited options, I gave myself: max 3 colors, 2 fonts, mobile-first. Creativity exploded.\n\n2. Client feedback ≠ design direction\n'Make it bigger' often means 'make it more prominent.' Sometimes that's hierarchy, not size.\n\n3. Document decisions as you go\nWhat seems obvious today won't be in 6 months. Screenshot the 'why' behind every choice.",
      category: "Portfolio post",
      platform: "twitter",
      impact: "Medium"
    },
    {
      text: "Client asked for 'just one more thing' after approval. Here's how I handled it 🚀\n\nI use a scope change policy:\n- Small tweaks (<15 min): included\n- Medium changes: hourly rate\n- Major revisions: new estimate\n\nClear boundaries = respectful relationships.\n\nWhat's your approach to scope creep?",
      category: "Freelancing tip",
      platform: "twitter",
      impact: "High"
    },
    {
      text: "Your portfolio isn't just your work—it's your proof.\n\nShow:\n✅ The problem you solved\n✅ The process you used\n✅ The results you delivered\n\nDon't just show pretty pictures. Show impact.",
      category: "Portfolio post",
      platform: "twitter",
      impact: "Medium"
    }
  ]

  const generateSuggestions = async () => {
    if (!promptText.trim()) {
      return
    }

    setIsGenerating(true)
    console.log('🚀 Starting post generation with:', {
      prompt: promptText,
      platform: selectedPlatform,
      industry: userIndustry,
    })

    try {
      const response = await fetch('/api/grow/generate-posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          platform: selectedPlatform,
          industry: userIndustry,
          includePromo,
        }),
      })

      console.log('📡 API Response status:', response.status, response.statusText)

      const result = await response.json()
      console.log('📦 API Response data:', result)

      if (result.success && result.data?.posts) {
        console.log('✅ Posts generated successfully!')
        console.log('📋 Generated Posts:', JSON.stringify(result.data.posts, null, 2))
        
        // Format posts to match the expected structure
        const formattedPosts = result.data.posts.map((post: any, idx: number) => ({
          num: `${idx + 1}`,
          content: post.content,
          category: post.category || 'Post',
          platform: post.platform || selectedPlatform,
        }))
        
        setAiSuggestions(formattedPosts)
        setLocalPosts(formattedPosts)
      } else {
        console.error('❌ Failed to generate posts:', result.error)
        console.error('Full error response:', result)
        toast.error('Failed to generate posts. Please try again.')
      }
    } catch (error) {
      console.error('❌ Error generating posts:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      toast.error('An error occurred while generating posts.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditPost = (index: number) => {
    setEditingPostIndex(index)
  }

  const handleSavePost = (index: number) => {
    setEditingPostIndex(null)
    // Update aiSuggestions to match localPosts
    setAiSuggestions([...localPosts])
  }

  const handlePostContentChange = (index: number, newContent: string) => {
    const updated = [...localPosts]
    updated[index] = { ...updated[index], content: newContent }
    setLocalPosts(updated)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Create local previews for selected files
    Array.from(files).forEach((file) => {
      const preview = URL.createObjectURL(file)
      setLocalImages((prev) => [...prev, { file, preview }])
    })

    // Reset input
    event.target.value = ''
  }

  const removeImage = (index: number) => {
    setLocalImages((prev) => {
      // Revoke the object URL to free memory
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (localImages.length === 0) return []

    const formData = new FormData()
    localImages.forEach((item) => {
      formData.append('files', item.file)
    })

    const response = await fetch('/api/grow/upload-images', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    if (result.success && result.urls) {
      // Clean up local previews
      localImages.forEach((item) => URL.revokeObjectURL(item.preview))
      setLocalImages([])
      return result.urls
    } else {
      throw new Error(result.error || 'Failed to upload images')
    }
  }

  // Handle confirming X post was posted
  const handleConfirmXPosted = async () => {
    try {
      // Save post to database with status 'posted'
      const response = await fetch('/api/grow/save-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: postText,
          platform: 'twitter',
          images: [], // X posts don't have images in manual composer
          generation_method: 'manual',
          status: 'posted',
        }),
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success('Nice! We\'ve marked this as posted on X.')
        // Clear the form
        setPostText('')
        setLocalImages([])
        setConfirmPostedModalOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error('Failed to save post. Please try again.')
    }
  }

  // Rewrite function with OpenAI
  const rewriteText = async (preset?: string, customPrompt?: string) => {
    if (rewriteCount >= 3) {
      toast.error('You have reached the maximum number of rewrites (3).')
      return // Limit reached
    }
    
    if (!postText.trim()) {
      return // No text to rewrite
    }

    // Store current text for undo
    setUndoText(postText)
    setDropdownOpen(false)
    setIsRewriting(true)
    
    // Determine platform from selected platforms
    const platform = selectedPlatforms.includes('twitter') ? 'twitter' : 'linkedin'
    
    try {
      const response = await fetch('/api/grow/refine-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: postText,
          preset,
          customPrompt,
          platform,
        }),
      })

      const result = await response.json()

      if (result.success && result.refinedText) {
        setPostText(result.refinedText)
        setRewriteCount(rewriteCount + 1)
        setCustomRewritePrompt("")
        
        // Show undo for 10 seconds
        setShowUndo(true)
        setTimeout(() => {
          setShowUndo(false)
          setUndoText("")
        }, 10000)
      } else {
        toast.error('Failed to refine text. Please try again.')
        console.error('Refine text error:', result.error)
      }
    } catch (error) {
      console.error('Error refining text:', error)
      toast.error('An error occurred while refining the text.')
    } finally {
      setIsRewriting(false)
    }
  }

  const handleUndo = () => {
    if (undoText) {
      setPostText(undoText)
      setRewriteCount(Math.max(0, rewriteCount - 1))
      setShowUndo(false)
      setUndoText("")
    }
  }

  return (
    <div className="space-y-6">
      {/* One-time Info Banner */}
      {showInfoBanner && (
        <Card className="bg-slate-50 border-slate-200 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">ℹ️</span>
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  Quick note: Jolix can auto-post to LinkedIn. For X, we generate and schedule content, and you publish with 1 click.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismissBanner}
                className="flex-shrink-0 text-slate-600 hover:text-slate-900"
              >
                Got it
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prompt Header */}
      <Card className="border-[#3C3CFF]/20 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#3C3CFF] flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">What do you want Jolix to help you talk about today?</h3>
              <p className="text-sm text-gray-600">Tell Jolix your idea and it'll create the perfect post</p>
            </div>
          </div>

          {/* Platform Toggle */}
          <div className="mb-4">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Select platform:</Label>
            <div className="flex gap-2">
              <Button
                variant={selectedPlatform === "twitter" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform("twitter")}
                className={selectedPlatform === "twitter" ? "bg-black hover:bg-black/90" : ""}
              >
                <TwitterIcon className="h-4 w-4 mr-2" />
                (Twitter)
              </Button>
              <Button
                variant={selectedPlatform === "linkedin" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPlatform("linkedin")}
                className={selectedPlatform === "linkedin" ? "bg-blue-700 hover:bg-blue-800" : ""}
              >
                <Linkedin className="h-4 w-4 mr-2" />
                LinkedIn
              </Button>
            </div>
            {/* Helper text */}
            <div className="mt-2 space-y-0.5">
              <p className="text-xs font-medium text-slate-500">How posting works</p>
              <p className="text-xs text-slate-500">LinkedIn posts publish automatically. X posts are sent to Jolix and you publish with 1 click.</p>
            </div>
          </div>
          
          <Input
            type="text"
            placeholder='Try: "Share a client tip about..." or "Hot take on pricing"'
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && promptText.trim() && !isGenerating) {
                generateSuggestions()
              }
            }}
            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent text-lg"
            disabled={isGenerating}
          />
          
          {/* Include Promo Toggle */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mt-3">
            <Switch
              id="include-promo"
              checked={includePromo}
              onCheckedChange={setIncludePromo}
            />
            <div className="flex-1">
              <Label htmlFor="include-promo" className="text-sm font-medium cursor-pointer">
                Mention my offer/website in this post
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Turn this on if you want this post to lightly promote your main offer
              </p>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={generateSuggestions}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              disabled={!promptText.trim() || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Posts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions (after generating) */}
      {aiSuggestions.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-[#3C3CFF]" />
            <h3 className="text-xl font-bold text-gray-900">Jolix suggests:</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {localPosts.map((post: any, idx: number) => (
              <Card key={idx} className="shadow-md border-[#3C3CFF]/20 hover:shadow-lg hover:border-[#3C3CFF]/40 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Post Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                        {post.num || `${idx + 1}`}
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {post.category}
                        </Badge>
                        <span className="text-xs text-gray-500">•</span>
                        <div className={`flex items-center gap-1 ${
                          post.platform === "twitter" ? "text-black" : "text-blue-700"
                        }`}>
                          {post.platform === "twitter" ? (
                            <>
                              <TwitterIcon className="h-3 w-3" />
                              <span className="text-xs font-medium">X (manual post)</span>
                            </>
                          ) : (
                            <>
                              <Linkedin className="h-3 w-3" />
                              <span className="text-xs font-medium">LinkedIn</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {/* Post Text */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-4">
                        {editingPostIndex === idx ? (
                          <Textarea
                            value={post.content || ''}
                            onChange={(e) => handlePostContentChange(idx, e.target.value)}
                            className="text-gray-900 leading-relaxed text-sm min-h-[150px] resize-y"
                            autoFocus
                          />
                        ) : (
                          <p className="text-gray-900 leading-relaxed whitespace-pre-line text-sm">
                            {post.content || post.text}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        {editingPostIndex === idx ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-300 hover:bg-gray-50"
                            onClick={() => handleSavePost(idx)}
                          >
                            <Save className="h-3.5 w-3.5 mr-1.5" />
                            Save
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-300 hover:bg-gray-50"
                            onClick={() => handleEditPost(idx)}
                          >
                            <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                            Edit
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Manual Composer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Panel */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader>
            <CardTitle className="text-lg">Compose Manually</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform Toggles */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Select platforms:</Label>
              <div className="flex gap-2">
                <Button
                  variant={selectedPlatforms.includes("twitter") ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlatform("twitter")}
                  className={selectedPlatforms.includes("twitter") ? "bg-black hover:bg-black/90" : ""}
                  title="Post to X (Twitter)"
                >
                  <TwitterIcon className="h-4 w-4 mr-2" />
                  (Twitter)
                </Button>
                <Button
                  variant={selectedPlatforms.includes("linkedin") ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePlatform("linkedin")}
                  className={selectedPlatforms.includes("linkedin") ? "bg-blue-700 hover:bg-blue-800" : ""}
                  title="Post to LinkedIn"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </Button>
              </div>
              {/* Helper text */}
              <div className="mt-2 space-y-0.5">
                <p className="text-xs font-medium text-slate-500">How posting works</p>
                <p className="text-xs text-slate-500">LinkedIn posts publish automatically. X posts are sent to Jolix and you publish with 1 click.</p>
              </div>
            </div>

            {/* Text Area */}
            <div className="space-y-2">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent"
              />
            </div>

            {/* Local Images Preview */}
            {localImages.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                {localImages.map((item, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={item.preview}
                      alt={`Preview ${idx + 1}`}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Attachments Row */}
            <div className="flex flex-wrap gap-2">
              <input
                type="file"
                id="image-upload"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              {selectedPlatforms.includes('twitter') ? (
                <TooltipProvider delayDuration={100}>
                  <UITooltip>
                    <TooltipTrigger asChild>
                      <div className="inline-block">
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled
                          className="cursor-not-allowed opacity-50"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Add image
                        </Button>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>For X posts, Jolix can't upload images for you (yet). We'll handle the text — you attach the image when you tweet.</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add image
                </Button>
              )}
            </div>

            {/* Footer Actions */}
            <Separator />
            <div className="flex gap-2 items-center">
              <Button 
                className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                onClick={async () => {
                  if (!postText.trim()) {
                    toast.error('Please write something first!')
                    return
                  }
                  
                  // If platform is X/Twitter, open intent URL and show confirmation modal
                  if (selectedPlatforms.includes('twitter')) {
                    const encodedText = encodeURIComponent(postText)
                    const intentUrl = `https://x.com/intent/tweet?text=${encodedText}`
                    
                    // Open X in new tab
                    window.open(intentUrl, '_blank')
                    
                    // Show confirmation modal
                    setConfirmPostedModalOpen(true)
                    return
                  }
                  
                  // For LinkedIn, save and post immediately
                  try {
                    // Upload images first if any
                    const imageUrls = await uploadImagesToStorage()
                    
                    // Save post to database with status 'posted'
                    const response = await fetch('/api/grow/save-post', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        content: postText,
                        platform: 'linkedin',
                        images: imageUrls,
                        generation_method: 'manual',
                        status: 'posted',
                      }),
                    })

                    const result = await response.json()
                    
                    if (result.success) {
                      toast.success('Post saved! Social media posting coming soon.')
                      // Clear the form
                      setPostText('')
                      setLocalImages([])
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (error) {
                    console.error('Error posting:', error)
                    toast.error('Failed to post. Please try again.')
                  }
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Post now
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  if (!postText.trim()) {
                    toast.error('Please write something first!')
                    return
                  }
                  setScheduleModalOpen(true)
                }}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Let's Schedule It
              </Button>
              
              {/* Schedule Modal */}
              <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Schedule Your Post</DialogTitle>
                    <DialogDescription>
                      Choose a date and time to schedule your post
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Select Date</Label>
                      <CalendarComponent
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        className="rounded-md border"
                      />
                      {selectedDate && (
                        <p className="text-sm text-gray-600">
                          Selected: {format(selectedDate, "PPP")}
                        </p>
                      )}
                    </div>
                    
                    {/* Time Picker - Only show after date is selected */}
                    {selectedDate && (
                      <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                        <Label className="text-sm font-medium">Select Time</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          Your post will be scheduled for {format(selectedDate, "PPP")} at {selectedTime}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setScheduleModalOpen(false)
                        setSelectedDate(undefined)
                        setSelectedTime("09:00")
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                      onClick={async () => {
                        if (!selectedDate) {
                          toast.error('Please select a date first')
                          return
                        }
                        
                        try {
                          // Combine date and time
                          const [hours, minutes] = selectedTime.split(':')
                          const scheduledDateTime = new Date(selectedDate)
                          scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
                          
                          // Upload images first if any
                          const imageUrls = await uploadImagesToStorage()
                          
                          // Save post to database with status 'scheduled'
                          const response = await fetch('/api/grow/save-post', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              content: postText,
                              platform: selectedPlatforms.includes('twitter') ? 'twitter' : 'linkedin',
                              images: imageUrls,
                              scheduled_at: scheduledDateTime.toISOString(),
                              generation_method: 'manual',
                              status: 'scheduled',
                            }),
                          })

                          const result = await response.json()
                          
                          if (result.success) {
                            toast.success('Post scheduled successfully!')
                            // Clear the form and modal
                            setPostText('')
                            setLocalImages([])
                            setScheduleModalOpen(false)
                            setSelectedDate(undefined)
                            setSelectedTime("09:00")
                          } else {
                            throw new Error(result.error)
                          }
                        } catch (error) {
                          console.error('Error scheduling:', error)
                          toast.error('Failed to schedule. Please try again.')
                        }
                      }}
                      disabled={!selectedDate}
                    >
                      Schedule Post
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              {/* Confirm Posted Modal for X Posts */}
              <Dialog open={confirmPostedModalOpen} onOpenChange={setConfirmPostedModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <div className="flex flex-col items-center text-center space-y-4 py-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-2xl">🚀</span>
                    </div>
                    
                    <DialogHeader>
                      <DialogTitle className="text-xl">Did you post this on X?</DialogTitle>
                      <DialogDescription className="text-sm text-slate-600 mt-2">
                        We just opened X with your post ready to go. Once you've hit Tweet, confirm below so Jolix can mark this as posted and add it to your streak.
                      </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex-row gap-2 w-full sm:justify-center">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setConfirmPostedModalOpen(false)
                        }}
                        className="flex-1 sm:flex-none"
                      >
                        Not yet
                      </Button>
                      <Button 
                        onClick={handleConfirmXPosted}
                        className="bg-[#3C3CFF] hover:bg-[#2D2DCC] flex-1 sm:flex-none"
                      >
                        Yes, I posted it
                      </Button>
                    </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={rewriteCount >= 3 || !postText.trim() || isRewriting}
                        >
                          {isRewriting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4 mr-2" />
                          )}
                          {isRewriting ? 'Rewriting...' : 'Refine with AI'}
                          {!isRewriting && <ChevronDown className="h-4 w-4 ml-2" />}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 p-3">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <DropdownMenuItem
                              onClick={() => rewriteText("Make clearer")}
                              className="cursor-pointer"
                              disabled={isRewriting}
                            >
                              Make clearer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More engaging")}
                              className="cursor-pointer"
                              disabled={isRewriting}
                            >
                              More engaging
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More concise")}
                              className="cursor-pointer"
                              disabled={isRewriting}
                            >
                              More concise
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More professional")}
                              className="cursor-pointer"
                              disabled={isRewriting}
                            >
                              More professional
                            </DropdownMenuItem>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            <Input
                              placeholder="e.g., sound like a friendly designer"
                              value={customRewritePrompt}
                              onChange={(e) => setCustomRewritePrompt(e.target.value)}
                              className="w-full text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customRewritePrompt.trim()) {
                                  rewriteText(undefined, customRewritePrompt)
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => rewriteText(undefined, customRewritePrompt)}
                              disabled={!customRewritePrompt.trim() || isRewriting}
                            >
                              {isRewriting ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                  Rewriting...
                                </>
                              ) : (
                                'Rewrite'
                              )}
                            </Button>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Light rewrite — quick and token-friendly.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
              {showUndo && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="text-xs"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Undo
                </Button>
              )}
            </div>
            {rewriteCount > 0 && (
              <p className="text-xs text-gray-500 text-center">
                Rewrites used: {rewriteCount}/3
              </p>
            )}
          </CardContent>
        </Card>

        {/* Live Preview Panel */}
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <div className="flex gap-2">
              <Button
                variant={previewPlatform === "twitter" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewPlatform("twitter")}
                className={previewPlatform === "twitter" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
              >
                X Preview
              </Button>
              <Button
                variant={previewPlatform === "linkedin" ? "default" : "ghost"}
                size="sm"
                onClick={() => setPreviewPlatform("linkedin")}
                className={previewPlatform === "linkedin" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
              >
                LinkedIn Preview
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`border rounded-lg p-4 ${
              previewPlatform === "twitter" ? "bg-white" : "bg-gray-50"
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback>YN</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Your Name</span>
                    <span className="text-gray-500 text-sm">@yourhandle</span>
                    <span className="text-gray-500 text-sm">• 2m</span>
                  </div>
                </div>
              </div>
              <p className="text-sm whitespace-pre-wrap mb-3">
                {postText || "Your post preview will appear here..."}
              </p>
              
              {/* Images Preview */}
              {localImages.length > 0 && (
                <div className={`mt-3 ${
                  localImages.length === 1 
                    ? 'w-full' 
                    : localImages.length === 2 
                    ? 'grid grid-cols-2 gap-2' 
                    : 'grid grid-cols-2 gap-2'
                }`}>
                  {localImages.map((item, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={item.preview}
                        alt={`Preview ${idx + 1}`}
                        className={`w-full object-cover rounded-lg ${
                          localImages.length === 1 
                            ? 'h-auto max-h-96' 
                            : 'h-32'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Post Tooltip Component for Month View
function PostTooltip({ 
  post, 
  isAI, 
  hasImages, 
  truncatedContent, 
  onPostClick 
}: { 
  post: any
  isAI: boolean
  hasImages: boolean
  truncatedContent: string
  onPostClick: (post: any) => void
}) {
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number } | null>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  
  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()
      setTooltipPos({
        left: rect.right + 8,
        top: rect.top
      })
    }
  }
  
  const handleMouseLeave = () => {
    // Small delay to allow moving cursor to tooltip
    setTimeout(() => {
      const tooltip = document.querySelector(`[data-tooltip-id="${post.id}"]`)
      if (!iconRef.current?.matches(':hover') && !tooltip?.matches(':hover')) {
        setTooltipPos(null)
      }
    }, 100)
  }
  
  return (
    <div 
      className="relative z-10"
      onClick={(e) => {
        e.stopPropagation()
        onPostClick(post)
      }}
    >
      <div 
        ref={iconRef}
        className="group/tooltip"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`p-[2px] rounded-full cursor-pointer ${isAI ? "bg-purple-200 ring-2 ring-purple-400" : "bg-blue-200 ring-2 ring-blue-400"}`}>
          <div className={`w-5 h-5 rounded flex items-center justify-center ${post.platform === "twitter" ? "bg-black" : "bg-blue-700"}`}>
            {post.platform === "twitter" ? <TwitterIcon className="h-3 w-3 text-white" /> : <Linkedin className="h-3 w-3 text-white" />}
          </div>
        </div>
      </div>
      
      {/* Tooltip positioned fixed to viewport - escapes grid constraints */}
      {tooltipPos && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          data-tooltip-id={post.id}
          style={{
            left: `${tooltipPos.left}px`,
            top: `${tooltipPos.top}px`
          }}
          onMouseEnter={() => setTooltipPos(tooltipPos)}
          onMouseLeave={handleMouseLeave}
        >
          <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80 pointer-events-auto">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`text-xs px-2 py-0.5 ${isAI ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                {isAI ? "AI Generated" : "Manual"}
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date(post.scheduled_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
            
            <div className="text-sm text-gray-800 mb-3 leading-relaxed whitespace-pre-wrap">
              {truncatedContent}
            </div>
            
            {hasImages && (
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                <ImageIcon className="h-4 w-4" />
                <span>{post.images.length} {post.images.length === 1 ? 'image' : 'images'}</span>
              </div>
            )}
            
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-3 text-xs w-full"
              onClick={(e) => {
                e.stopPropagation()
                onPostClick(post)
              }}
            >
              View Details
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// 📅 SCHEDULE TAB
function ScheduleTab({ view, setView }: { 
  view: "week" | "month" | "list" | "past"
  setView: (view: "week" | "month" | "list" | "past") => void
}) {
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
    const [editedContent, setEditedContent] = useState("")
    const [editedImages, setEditedImages] = useState<string[]>([])
    const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false)
    const [reschedulePostId, setReschedulePostId] = useState<string | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
    const [selectedTime, setSelectedTime] = useState<string>("09:00")
    
    // Confirm posted modal state
    const [confirmPostedModalOpen, setConfirmPostedModalOpen] = useState(false)
    const [pendingPostId, setPendingPostId] = useState<string | null>(null)
  
    // Fetch scheduled posts from database
  useEffect(() => {
    async function fetchScheduledPosts() {
      try {
        const response = await fetch('/api/grow/get-scheduled-posts')
        const result = await response.json()
        
        if (result.success) {
          setScheduledPosts(result.posts)
        } else {
          console.error('Failed to fetch scheduled posts:', result.error)
        }
      } catch (error) {
        console.error('Error fetching scheduled posts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchScheduledPosts()
  }, [])

  const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
  const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  const formatDateLabel = (date: Date) => date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const getWeekdayIndex = (date: Date) => {
    // We want Mon-Sun as columns 0-6
    const idx = date.getDay() // 0=Sun .. 6=Sat
    return idx === 0 ? 6 : idx - 1
  }
  const buildMonthMatrix = (date: Date) => {
    const start = startOfMonth(date)
    const end = endOfMonth(date)
    const daysInMonth = end.getDate()

    // Determine how many blank cells before the 1st (Mon=0..Sun=6)
    const leadingBlanks = getWeekdayIndex(start)
    const cells: Date[] = []
    // Add leading previous month days as placeholders
    for (let i = 0; i < leadingBlanks; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() - (leadingBlanks - i))
      cells.push(d)
    }
    // Add current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push(new Date(date.getFullYear(), date.getMonth(), i))
    }
    // Add trailing days to complete the last week row
    const trailing = (7 - (cells.length % 7)) % 7
    for (let i = 1; i <= trailing; i++) {
      const d = new Date(end)
      d.setDate(end.getDate() + i)
      cells.push(d)
    }
    // Chunk into weeks of 7
    const weeks: Date[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7))
    }
    return weeks
  }

  // Show all posts - don't filter by time
  const activeScheduledPosts = view === "past" 
    ? scheduledPosts.filter((p) => {
        if (!p.scheduled_at) return false // Exclude drafts from past posts
        if (p.status === 'posted') return true // Include posted posts
        const scheduledTime = new Date(p.scheduled_at)
        const now = new Date()
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        // Show posts that are at least 2 hours past their due time
        return scheduledTime < twoHoursAgo
      })
    : scheduledPosts.filter((p) => {
        if (!p.scheduled_at) return true // Keep posts without scheduled time (drafts)
        if (p.status === 'posted') return false // Hide posted posts from active views
        const scheduledTime = new Date(p.scheduled_at)
        const now = new Date()
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        // Show posts that haven't passed 2 hours yet
        return scheduledTime >= twoHoursAgo
      })
  
  // Check if a post is due now (within 15 minutes)
  const isPostDueNow = (post: any) => {
    if (!post.scheduled_at || post.platform !== 'twitter') return false
    const scheduledTime = new Date(post.scheduled_at)
    const now = new Date()
    const fifteenMinutes = 15 * 60 * 1000
    const timeDiff = scheduledTime.getTime() - now.getTime()
    return timeDiff <= fifteenMinutes && timeDiff > -fifteenMinutes
  }

  const postsOnDate = (d: Date) =>
    activeScheduledPosts.filter((p) => isSameDay(new Date(p.scheduled_at), d))

  const monthLabel = formatDateLabel(currentMonth)
  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  // Check if post can be edited (scheduled and time hasn't passed)
  const canEditPost = (post: any) => {
    if (!post.scheduled_at) return false
    const scheduledTime = new Date(post.scheduled_at)
    const now = new Date()
    return scheduledTime > now && post.status === 'scheduled'
  }

    // Open drawer with post
    const handlePostClick = (post: any, editMode: boolean = false) => {
      setSelectedPost(post)
      setEditedContent(post.content)
      setEditedImages(post.images || [])
      setIsEditing(editMode)
      setDrawerOpen(true)
    }

  // Remove image from edited images
  const handleRemoveImage = (index: number) => {
    setEditedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/grow/delete-post?id=${postId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        setScheduledPosts(prev => prev.filter(p => p.id !== postId))
        setDrawerOpen(false)
        toast.success('Post deleted successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post. Please try again.')
    }
  }

  // Open reschedule modal
  const handleRescheduleClick = (postId: string) => {
    const post = scheduledPosts.find(p => p.id === postId)
    if (post) {
      const scheduled = new Date(post.scheduled_at)
      setSelectedDate(scheduled)
      setSelectedTime(scheduled.toTimeString().slice(0, 5))
      setReschedulePostId(postId)
      setRescheduleModalOpen(true)
    }
  }

  // Save rescheduled date/time
  const handleSaveReschedule = async () => {
    if (!reschedulePostId || !selectedDate) return

    try {
      const [hours, minutes] = selectedTime.split(':')
      const scheduledDateTime = new Date(selectedDate)
      scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

      const response = await fetch('/api/grow/update-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reschedulePostId,
          scheduled_at: scheduledDateTime.toISOString(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScheduledPosts(prev => 
          prev.map(p => p.id === reschedulePostId ? { ...p, scheduled_at: scheduledDateTime.toISOString() } : p)
        )
        if (selectedPost?.id === reschedulePostId) {
          setSelectedPost({ ...selectedPost, scheduled_at: scheduledDateTime.toISOString() })
        }
        setRescheduleModalOpen(false)
        setReschedulePostId(null)
        toast.success('Post rescheduled successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error rescheduling post:', error)
      toast.error('Failed to reschedule post. Please try again.')
    }
  }

  // Save edited post
  const handleSaveEdit = async () => {
    if (!selectedPost) return

    try {
      const response = await fetch('/api/grow/update-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedPost.id,
          content: editedContent,
          images: editedImages,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setScheduledPosts(prev => 
          prev.map(p => p.id === selectedPost.id ? { ...p, content: editedContent, images: editedImages } : p)
        )
        setSelectedPost({ ...selectedPost, content: editedContent, images: editedImages })
        setIsEditing(false)
        toast.success('Post updated successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error updating post:', error)
      toast.error('Failed to update post. Please try again.')
    }
  }

  // Handle post now action
  const handlePostNow = async (post: any) => {
    // If it's an X/Twitter post, open intent URL and show confirmation modal
    if (post.platform === 'twitter') {
      const encodedText = encodeURIComponent(post.content)
      const intentUrl = `https://x.com/intent/tweet?text=${encodedText}`
      
      // Open X in new tab
      window.open(intentUrl, '_blank')
      
      // Show confirmation modal
      setPendingPostId(post.id)
      setConfirmPostedModalOpen(true)
      return
    }

    // For LinkedIn posts, mark as posted immediately (auto-posted)
    try {
      const response = await fetch('/api/grow/update-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: post.id,
          status: 'posted',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScheduledPosts(prev => 
          prev.map(p => p.id === post.id ? { ...p, status: 'posted' } : p)
        )
        if (selectedPost?.id === post.id) {
          setSelectedPost({ ...selectedPost, status: 'posted' })
        }
        toast.success('Post published to LinkedIn!')
        setDrawerOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error posting:', error)
      toast.error('Failed to mark post as posted. Please try again.')
    }
  }

  // Confirm X post was actually posted
  const handleConfirmPosted = async () => {
    if (!pendingPostId) return

    try {
      const response = await fetch('/api/grow/update-post', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pendingPostId,
          status: 'posted',
        }),
      })

      const result = await response.json()

      if (result.success) {
        setScheduledPosts(prev => 
          prev.map(p => p.id === pendingPostId ? { ...p, status: 'posted' } : p)
        )
        if (selectedPost?.id === pendingPostId) {
          setSelectedPost({ ...selectedPost, status: 'posted' })
        }
        setConfirmPostedModalOpen(false)
        setPendingPostId(null)
        toast.success('Nice! We\'ve marked this as posted on X.')
        setDrawerOpen(false)
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error marking post as posted:', error)
      toast.error('Failed to mark post as posted. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading scheduled posts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Friendly Banner */}
      <Card className="border-[#3C3CFF]/20 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Here's your week's posting plan, ready to go 🚀</h3>
              <p className="text-gray-600">
                Posting consistently builds your brand faster! Review and edit posts below.
              </p>
            </div>
            <Button variant="outline" className="flex-shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Planner Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border bg-white p-1">
            <Button
              variant={view === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={view === "week" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={view === "month" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
            >
              Month
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
              className={view === "list" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
            >
              List
            </Button>
            <Button
              variant={view === "past" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("past")}
              className={view === "past" ? "bg-[#3C3CFF] hover:bg-[#2D2DCC]" : ""}
            >
              Past Posts
            </Button>
            </div>
          </div>
        </div>

      {/* Week / Month / List Views */}
      {view === "week" && (
        <Card className="shadow-sm border-gray-100 animate-in fade-in duration-300">
          <CardContent className="p-6">
            {activeScheduledPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium mb-2">No scheduled posts yet</p>
                <p className="text-sm">Create posts in the AI Studio or Growth Plan tabs to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeScheduledPosts.map((post) => {
                  const d = new Date(post.scheduled_at)
                  const dayLabel = d.toLocaleDateString("en-US", { weekday: "long" })
                  const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                  const statusLabel = post.generation_method === 'ai' ? 'AI Generated' : 'Manually Created'
                  const statusColor = post.generation_method === 'ai' ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-blue-100 text-blue-700 border-blue-200'
                  
                  return (
                    <div 
                      key={post.id} 
                      className="border rounded-xl p-4 hover:border-[#3C3CFF]/50 transition-colors cursor-pointer"
                      onClick={() => handlePostClick(post)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-600">{dayLabel}</div>
                            <div className="text-lg font-bold text-gray-900">{timeLabel}</div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${post.platform === "twitter" ? "bg-black" : "bg-blue-700"}`}>
                              {post.platform === "twitter" ? (
                                <TwitterIcon className="h-4 w-4 text-white" />
                              ) : (
                                <Linkedin className="h-4 w-4 text-white" />
                              )}
                            </div>
                            <Badge className={`text-xs ${statusColor}`}>
                              {statusLabel}
                            </Badge>
                            {post.status === 'scheduled' && (
                              <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                Scheduled
                              </Badge>
                            )}
                            {isPostDueNow(post) && (
                              <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 animate-pulse">
                                🔔 Time to post!
                              </Badge>
                            )}
                          </div>
                          {/* Expandable text with focus border on hover */}
                          <div className="mb-3">
                            <div className="group border border-transparent hover:border-[#3C3CFF] rounded-md transition-colors">
                              <div className="max-h-16 overflow-hidden group-hover:max-h-[600px] transition-[max-height] duration-300 ease-out p-2">
                                <p className="text-sm text-gray-900 whitespace-pre-wrap">{post.content}</p>
                              </div>
                            </div>
                          </div>
                          {/* Show images if any */}
                          {post.images && post.images.length > 0 && (
                            <div className={`mb-3 ${post.images.length === 1 ? 'w-full' : 'grid grid-cols-2 gap-2'}`}>
                              {post.images.map((imageUrl: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={imageUrl}
                                  alt={`Post image ${idx + 1}`}
                                  className={`object-cover rounded-lg ${post.images.length === 1 ? 'w-full h-auto max-h-64' : 'w-full h-24'}`}
                                />
                              ))}
                            </div>
                          )}
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="ghost"
                               onClick={(e) => { e.stopPropagation(); handlePostClick(post, true) }}
                             >
                               <Edit3 className="h-3 w-3 mr-1" />Edit
                             </Button>
                             <Button 
                               size="sm" 
                               variant="ghost"
                               onClick={(e) => { e.stopPropagation(); handleRescheduleClick(post.id) }}
                             >
                               <Clock className="h-3 w-3 mr-1" />Reschedule
                             </Button>
                             <Button 
                               size="sm" 
                               variant="ghost"
                               onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id) }}
                             >
                               <Trash2 className="h-3 w-3 mr-1" />Delete
                             </Button>
                             <Button 
                               size="sm" 
                               variant="default"
                               className="bg-[#3C3CFF] hover:bg-[#2D2DCC] ml-auto"
                               onClick={(e) => { e.stopPropagation(); handlePostNow(post) }}
                             >
                               <Send className="h-3 w-3 mr-1" />Post Now
                             </Button>
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {view === "month" && (
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={goPrevMonth}>&lt;</Button>
              <div className="text-lg font-semibold">{monthLabel}</div>
              <Button variant="outline" size="sm" onClick={goNextMonth}>&gt;</Button>
            </div>
          
          </div>

          {activeScheduledPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="font-medium mb-2">No scheduled posts yet</p>
              <p className="text-sm">Create posts in the AI Studio or Growth Plan tabs to get started.</p>
            </div>
          ) : (
            <>
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 text-xs font-medium text-gray-600">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                  <div key={d} className="px-2 py-2">{d}</div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-purple-200 ring-2 ring-purple-400"></span>
                  <span>AI Generated</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-200 ring-2 ring-blue-400"></span>
                  <span>Manual</span>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-visible">
                {buildMonthMatrix(currentMonth).flat().map((cellDate, idx) => {
                  const inCurrent = cellDate.getMonth() === currentMonth.getMonth()
                  const today = isSameDay(cellDate, new Date())
                  const posts = postsOnDate(cellDate)
                  return (
                    <div key={idx} className={`relative bg-white min-h-[100px] p-2 ${!inCurrent ? "bg-gray-50 text-gray-400" : ""} ${today ? "bg-gradient-to-br from-blue-50 to-purple-50" : ""}`}>
                      <div className="text-xs font-medium">{cellDate.getDate()}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {posts.slice(0, 4).map((p) => {
                          const isAI = p.generation_method === 'ai'
                          const hasImages = p.images && p.images.length > 0
                          // Truncate content to ~100 characters
                          const truncatedContent = p.content.length > 100 ? p.content.substring(0, 100) + '...' : p.content
                          
                          return (
                            <PostTooltip
                              key={p.id}
                              post={p}
                              isAI={isAI}
                              hasImages={hasImages}
                              truncatedContent={truncatedContent}
                              onPostClick={handlePostClick}
                            />
                          )
                        })}
                        {posts.length > 4 && (
                          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-[10px] text-gray-600 font-medium">
                            +{posts.length - 4}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <p className="text-xs text-gray-600 mt-2">💡 Tip: Use Month view for planning ahead.</p>
            </>
          )}
        </div>
      )}

      {view === "list" && (
        <Card className="shadow-sm border-gray-100 animate-in fade-in duration-300">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">All Scheduled Posts</CardTitle>
              <div className="flex gap-2">
                {/* Filters */}
                <select className="text-sm border rounded-md px-2 py-1">
                  <option>All Platforms</option>
                  <option>X</option>
                  <option>LinkedIn</option>
                </select>
                <select className="text-sm border rounded-md px-2 py-1">
                  <option>All Types</option>
                  <option>AI Generated</option>
                  <option>Manual</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activeScheduledPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="font-medium mb-2">No scheduled posts yet</p>
                <p className="text-sm">Create posts in the AI Studio or Growth Plan tabs to get started.</p>
              </div>
            ) : (
              <>
                 <div className="max-h-[480px] overflow-auto">
                   <table className="w-full text-sm">
                     <thead className="sticky top-0 bg-white shadow-sm">
                       <tr className="text-left text-gray-600">
                         <th className="px-4 py-3 font-medium">Date / Time</th>
                         <th className="px-4 py-3 font-medium">Platform</th>
                         <th className="px-4 py-3 font-medium">Post Preview</th>
                         <th className="px-4 py-3 font-medium">Type</th>
                         <th className="px-4 py-3 font-medium">Actions</th>
                         <th className="px-4 py-3 font-medium">Delete</th>
                       </tr>
                     </thead>
                     <tbody>
                      {activeScheduledPosts
                        .slice()
                        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
                        .map((p) => {
                          const d = new Date(p.scheduled_at)
                          const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                          const isAI = p.generation_method === 'ai'
                          return (
                            <tr 
                              key={p.id} 
                              className="hover:bg-gray-50 transition-colors cursor-pointer"
                              onClick={() => handlePostClick(p)}
                            >
                               <td className="px-4 py-3 whitespace-nowrap">{dateLabel} {timeLabel}</td>
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.platform === "twitter" ? "bg-black" : "bg-blue-700"}`}>
                                     {p.platform === "twitter" ? (
                                       <TwitterIcon className="h-4 w-4 text-white" />
                                     ) : (
                                       <Linkedin className="h-4 w-4 text-white" />
                                     )}
                                   </div>
                                   <span className="text-gray-700">
                                     {p.platform === "twitter" ? "X (Twitter)" : "LinkedIn"}
                                   </span>
                                 </div>
                               </td>
                              <td className="px-4 py-3 text-gray-800">
                                {p.content.slice(0, 100)}
                                {p.images && p.images.length > 0 && (
                                  <span className="ml-2 text-xs text-gray-500">📷 {p.images.length}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={`text-xs ${isAI ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                                  {isAI ? "AI Generated" : "Manual"}
                                </Badge>
                                {isPostDueNow(p) && (
                                  <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200 animate-pulse ml-2">
                                    🔔 Time to post!
                                  </Badge>
                                )}
                              </td>
                               <td className="px-4 py-3">
                                 <div className="flex gap-2 opacity-80 hover:opacity-100">
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={(e) => { e.stopPropagation(); handlePostClick(p, true) }}
                                   >
                                     <Edit3 className="h-3 w-3 mr-1" />Edit
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="outline"
                                     onClick={(e) => { e.stopPropagation(); handleRescheduleClick(p.id) }}
                                   >
                                     <Clock className="h-3 w-3 mr-1" />Reschedule
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="default"
                                     className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                     onClick={(e) => { e.stopPropagation(); handlePostNow(p) }}
                                   >
                                     <Send className="h-3 w-3 mr-1" />Post Now
                                   </Button>
                                 </div>
                               </td>
                               <td className="px-4 py-3">
                                 <Button 
                                   size="sm" 
                                   variant="outline"
                                   className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                   onClick={(e) => { e.stopPropagation(); handleDeletePost(p.id) }}
                                 >
                                   <Trash2 className="h-3 w-3" />
                                 </Button>
                               </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 text-xs text-gray-600">Showing {activeScheduledPosts.length} scheduled post{activeScheduledPosts.length !== 1 ? 's' : ''}.</div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Post Details Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedPost && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-2xl">Post Details</SheetTitle>
                    <SheetDescription>
                      {format(new Date(selectedPost.scheduled_at), "PPP 'at' p")}
                    </SheetDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPost.platform === "twitter" ? "bg-black" : "bg-blue-700"}`}>
                      {selectedPost.platform === "twitter" ? (
                        <TwitterIcon className="h-5 w-5 text-white" />
                      ) : (
                        <Linkedin className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <Badge className={`${selectedPost.generation_method === 'ai' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>
                      {selectedPost.generation_method === 'ai' ? 'AI Generated' : 'Manual'}
                    </Badge>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Post Content - Editable if scheduled and time hasn't passed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Post Content</Label>
                    {canEditPost(selectedPost) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (isEditing) {
                            handleSaveEdit()
                          } else {
                            setIsEditing(true)
                          }
                        }}
                      >
                        {isEditing ? (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        ) : (
                          <>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Edit
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="min-h-[200px]"
                      placeholder="Enter your post content..."
                    />
                  ) : (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <p className="text-sm whitespace-pre-wrap text-gray-900">{selectedPost.content}</p>
                    </div>
                  )}
                  {!canEditPost(selectedPost) && (
                    <p className="text-xs text-gray-500">
                      {selectedPost.status === 'posted' 
                        ? 'This post has already been posted and cannot be edited.'
                        : 'This post cannot be edited because the scheduled time has passed.'}
                    </p>
                  )}
                </div>

                {/* Images */}
                {((isEditing ? editedImages : selectedPost.images) || []).length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Images ({isEditing ? editedImages.length : (selectedPost.images?.length || 0)})
                      {isEditing && canEditPost(selectedPost) && (
                        <span className="text-xs text-gray-500 ml-2">Click X to remove</span>
                      )}
                    </Label>
                    <div className={`grid gap-3 ${(isEditing ? editedImages : selectedPost.images || []).length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {(isEditing ? editedImages : selectedPost.images || []).map((imageUrl: string, idx: number) => (
                        <div key={idx} className="relative group">
                          <img
                            src={imageUrl}
                            alt={`Post image ${idx + 1}`}
                            className="w-full h-auto rounded-lg object-cover border"
                          />
                          {isEditing && canEditPost(selectedPost) && (
                            <button
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full p-1.5 transition-colors"
                              type="button"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Post Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className={`border rounded-lg p-4 ${
                    selectedPost.platform === "twitter" ? "bg-white" : "bg-gray-50"
                  }`}>
                    <div className="flex items-start gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder-avatar.jpg" />
                        <AvatarFallback>YN</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">Your Name</span>
                          <span className="text-gray-500 text-sm">@yourhandle</span>
                          <span className="text-gray-500 text-sm">• {format(new Date(selectedPost.scheduled_at), "MMM d")}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap mb-3">
                      {isEditing ? editedContent : selectedPost.content}
                    </p>
                    
                    {/* Images in preview */}
                    {((isEditing ? editedImages : selectedPost.images) || []).length > 0 && (
                      <div className={`mt-3 ${
                        (isEditing ? editedImages : selectedPost.images || []).length === 1 
                          ? 'w-full' 
                          : (isEditing ? editedImages : selectedPost.images || []).length === 2 
                          ? 'grid grid-cols-2 gap-2' 
                          : 'grid grid-cols-2 gap-2'
                      }`}>
                        {(isEditing ? editedImages : selectedPost.images || []).map((imageUrl: string, idx: number) => (
                          <div key={idx} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Preview ${idx + 1}`}
                              className={`w-full object-cover rounded-lg ${
                                (isEditing ? editedImages : selectedPost.images || []).length === 1 
                                  ? 'h-auto max-h-96' 
                                  : 'h-32'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Post Metadata */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Label className="text-xs text-gray-500">Status</Label>
                    <p className="text-sm font-medium mt-1">
                      <Badge className={selectedPost.status === 'scheduled' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                        {selectedPost.status.charAt(0).toUpperCase() + selectedPost.status.slice(1)}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Scheduled For</Label>
                    <p className="text-sm font-medium mt-1">
                      {format(new Date(selectedPost.scheduled_at), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t mt-4">
                    <Label className="text-sm font-medium">Actions</Label>
                    <div className="flex gap-2 flex-wrap">
                      {canEditPost(selectedPost) && (
                        <>
                          <Button 
                            variant="outline" 
                            onClick={() => handleRescheduleClick(selectedPost.id)}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Reschedule
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleDeletePost(selectedPost.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Post
                          </Button>
                        </>
                      )}
                      {selectedPost.status !== 'posted' && (
                        <Button 
                          variant="default"
                          className="bg-[#3C3CFF] hover:bg-[#2D2DCC] ml-auto"
                          onClick={() => handlePostNow(selectedPost)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Post Now
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>

        {/* Reschedule Modal */}
        <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Reschedule Post</DialogTitle>
              <DialogDescription>
                Choose a new date and time for this post.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="rounded-md border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-time">Time</Label>
                <Input
                  id="reschedule-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveReschedule}
                disabled={!selectedDate}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              >
                Reschedule Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Posted Modal for X Posts */}
        <Dialog open={confirmPostedModalOpen} onOpenChange={setConfirmPostedModalOpen}>
          <DialogContent className="sm:max-w-md">
            <div className="flex flex-col items-center text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl">🚀</span>
              </div>
              
              <DialogHeader>
                <DialogTitle className="text-xl">Did you post this on X?</DialogTitle>
                <DialogDescription className="text-sm text-slate-600 mt-2">
                  We just opened X with your post ready to go. Once you've hit Tweet, confirm below so Jolix can mark this as posted and add it to your streak.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="flex-row gap-2 w-full sm:justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setConfirmPostedModalOpen(false)
                    setPendingPostId(null)
                  }}
                  className="flex-1 sm:flex-none"
                >
                  Not yet
                </Button>
                <Button 
                  onClick={handleConfirmPosted}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC] flex-1 sm:flex-none"
                >
                  Yes, I posted it
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

// 📊 GROWTH INSIGHTS TAB
function GrowthInsightsTab() {
  return (
    <div className="space-y-6">
      {/* AI Summary Card */}
      <Card className="border-[#3C3CFF]/20 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3C3CFF]" />
            <CardTitle>Your Growth Summary</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-xl p-6 space-y-4">
            <p className="text-lg font-semibold">
              You grew 8% this week! 🎉
            </p>
            <p className="text-gray-600">
              Jolix recommends 2 more posts about <span className="font-semibold text-gray-900">client management</span> 
              {" "}and <span className="font-semibold text-gray-900">pricing strategies</span>. 
              Posts on Tuesdays at 10am get 34% more engagement.
            </p>
            <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              <Calendar className="h-4 w-4 mr-2" />
              Plan next week using these insights
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Followers Gained</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">+42</div>
            <p className="text-xs text-gray-500 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Impressions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24.8K</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">+24% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Engagement / Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUp className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">+18% vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Chart */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Engagement over time</CardTitle>
              <CardDescription>Daily engagement metrics</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">7d</Button>
              <Button size="sm" variant="outline">Month</Button>
              <Button size="sm" variant="outline">Year</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={engagementData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs fill-gray-600"
                />
                <YAxis 
                  className="text-xs fill-gray-600"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="engagement"
                  stroke="hsl(var(--chart-1))"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Impressions Chart */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Impressions over time</CardTitle>
              <CardDescription>Total impressions across platforms</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">7d</Button>
              <Button size="sm" variant="outline">Month</Button>
              <Button size="sm" variant="outline">Year</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={[
                  { day: "Mon", impressions: 1200 },
                  { day: "Tue", impressions: 1850 },
                  { day: "Wed", impressions: 1600 },
                  { day: "Thu", impressions: 2400 },
                  { day: "Fri", impressions: 2100 },
                  { day: "Sat", impressions: 1400 },
                  { day: "Sun", impressions: 1700 },
                ]}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="day" 
                  className="text-xs fill-gray-600"
                />
                <YAxis 
                  className="text-xs fill-gray-600"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="hsl(var(--chart-3))"
                  fill="hsl(var(--chart-3))"
                  fillOpacity={0.2}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Follower Growth Chart */}
      <Card className="shadow-sm border-gray-100">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Follower Growth</CardTitle>
              <CardDescription>Monthly follower count</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">7d</Button>
              <Button size="sm" variant="outline">Month</Button>
              <Button size="sm" variant="outline">Year</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={followerGrowthData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs fill-gray-600"
                />
                <YAxis 
                  className="text-xs fill-gray-600"
                />
                <Tooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="followers"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2.5}
                  dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Posts Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Top Posts 🎯</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TopPostCard 
            text="Client red flags you shouldn't ignore 🚩"
            platform="twitter"
            metrics={{ likes: 342, comments: 28, shares: 45 }}
          />
          <TopPostCard 
            text="How I tripled my freelance rate in 6 months"
            platform="linkedin"
            metrics={{ likes: 589, comments: 67, shares: 123 }}
          />
        </div>
      </div>
    </div>
  )
}

function TopPostCard({ text, platform, metrics }: {
  text: string
  platform: string
  metrics: { likes: number; comments: number; shares: number }
}) {
  return (
    <Card className="shadow-sm border-gray-100">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            platform === "twitter" ? "bg-black" : "bg-blue-700"
          }`}>
            {platform === "twitter" ? (
              <TwitterIcon className="h-4 w-4 text-white" />
            ) : (
              <Linkedin className="h-4 w-4 text-white" />
            )}
          </div>
          <p className="text-sm flex-1">{text}</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <span className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            {metrics.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            {metrics.comments}
          </span>
          <span className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            {metrics.shares}
          </span>
        </div>
        <Button size="sm" variant="outline" className="w-full">
          <Copy className="h-3 w-3 mr-2" />
          Repurpose
        </Button>
      </CardContent>
    </Card>
  )
}

// 🧠 BRAND PROFILE TAB
function BrandProfileTab() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [aboutBrand, setAboutBrand] = useState('')
  const [tone, setTone] = useState<'friendly' | 'professional' | 'casual' | 'expert'>('friendly')
  const [topics, setTopics] = useState<string[]>([])
  const [newTopic, setNewTopic] = useState('')
  const [thingsToAvoid, setThingsToAvoid] = useState('')
  const [website, setWebsite] = useState('')
  const [pinnedOffer, setPinnedOffer] = useState('')
  const [pinnedOffers, setPinnedOffers] = useState<string[]>([])
  const [newOffer, setNewOffer] = useState('')

  // Load brand profile on mount
  useEffect(() => {
    async function loadBrandProfile() {
      try {
        const response = await fetch('/api/grow/brand-profile')
        const result = await response.json()

        if (result.success && result.profile) {
          const profile = result.profile
          setBrandName(profile.brandName || '')
          setAboutBrand(profile.aboutBrand || '')
          setTone(profile.tone || 'friendly')
          setTopics(profile.topics || [])
          setThingsToAvoid(profile.thingsToAvoid || '')
          setWebsite(profile.website || '')
          setPinnedOffer(profile.pinnedOffer || '')
          setPinnedOffers(profile.pinnedOffers || [])
        }
      } catch (error) {
        console.error('Error loading brand profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadBrandProfile()
  }, [])

  const handleAddTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()])
      setNewTopic('')
    }
  }

  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(t => t !== topicToRemove))
  }

  const handleAddOffer = () => {
    if (newOffer.trim() && !pinnedOffers.includes(newOffer.trim())) {
      setPinnedOffers([...pinnedOffers, newOffer.trim()])
      setNewOffer('')
    }
  }

  const handleRemoveOffer = (offerToRemove: string) => {
    setPinnedOffers(pinnedOffers.filter(o => o !== offerToRemove))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/grow/brand-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName,
          aboutBrand,
          tone,
          topics,
          thingsToAvoid,
          website,
          pinnedOffer,
          pinnedOffers,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Brand profile saved successfully!')
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error saving brand profile:', error)
      toast.error('Failed to save brand profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading brand profile...</div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Understanding Panel */}
      <Card className="border-[#3C3CFF]/20 bg-gradient-to-br from-blue-50 to-purple-50 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3C3CFF]" />
            <CardTitle>This is how Jolix understands your brand</CardTitle>
          </div>
          <CardDescription>
            These settings influence what Jolix suggests in your Growth Plan
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Voice & Topics */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>About Your Brand</CardTitle>
              <CardDescription>Tell us about your brand to help generate better posts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand Name</label>
                <Input
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Your Brand Name"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">About Your Brand</label>
                <Textarea
                  value={aboutBrand}
                  onChange={(e) => setAboutBrand(e.target.value)}
                  placeholder="Describe your brand, what you do, your values, and target audience..."
                  className="min-h-[120px] resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Tone Selection</CardTitle>
              <CardDescription>Choose your communication style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {(['friendly', 'professional', 'casual', 'expert'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-4 py-3 rounded-lg border-2 font-medium transition-all capitalize ${
                      tone === t
                        ? 'border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 text-[#3C3CFF]'
                        : 'border-gray-200 hover:border-[#3C3CFF]/30 bg-white text-gray-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  {tone === 'friendly' && 'Sample: "Just shipped a new feature—clients are loving it! Here\'s what we built..."'}
                  {tone === 'professional' && 'Sample: "We are pleased to announce the launch of our latest feature..."'}
                  {tone === 'casual' && 'Sample: "Hey! So I just wrapped up this cool project and..."'}
                  {tone === 'expert' && 'Sample: "After analyzing the data patterns, I discovered three key insights..."'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Links & Info */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Links & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <Input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pinned Offers</label>
                <p className="text-xs text-gray-500 mb-2">
                  Add multiple offers - one will be randomly selected for promotional posts
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {pinnedOffers.map((offer) => (
                    <Badge
                      key={offer}
                      className="bg-green-600 text-white hover:bg-green-700 cursor-pointer max-w-full"
                      onClick={() => handleRemoveOffer(offer)}
                    >
                      <span className="truncate">{offer}</span>
                      <X className="h-3 w-3 ml-1 flex-shrink-0" />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newOffer}
                    onChange={(e) => setNewOffer(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddOffer()}
                    placeholder="e.g., Free consultation"
                    className="text-sm flex-1"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddOffer}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Topics</CardTitle>
              <CardDescription>What you want to talk about</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {topics.map((topic) => (
                  <Badge
                    key={topic}
                    className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC] cursor-pointer"
                    onClick={() => handleRemoveTopic(topic)}
                  >
                    {topic}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                    placeholder="Add a topic..."
                    className="h-7 text-xs w-32"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddTopic} className="h-7">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <label className="text-sm font-medium">Things to avoid</label>
                <Textarea
                  value={thingsToAvoid}
                  onChange={(e) => setThingsToAvoid(e.target.value)}
                  placeholder="e.g., Politics, controversial topics..."
                  className="min-h-[80px] resize-none text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            setBrandName('')
            setAboutBrand('')
            setTone('friendly')
            setTopics([])
            setThingsToAvoid('')
            setWebsite('')
            setPinnedOffer('')
          }}
        >
          Reset to defaults
        </Button>
        <Button
          className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
