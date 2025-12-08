"use client"

import { useState, useEffect } from "react"
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
  Linkedin,
  Image as ImageIcon,
  Link as LinkIcon,
  Hash,
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
  ChevronDown
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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
  const [plannerView, setPlannerView] = useState<"week" | "month" | "list">("week")
  
  // Wizard state
  const [wizardActive, setWizardActive] = useState(true)
  const [wizardStep, setWizardStep] = useState(1)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [customFocusTopic, setCustomFocusTopic] = useState<string>("")
  const [platformMode, setPlatformMode] = useState<"both" | "x" | "linkedin">("both")
  const [postsPerWeek, setPostsPerWeek] = useState<number>(4)
  const [selectedSchedule, setSelectedSchedule] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [planGenerated, setPlanGenerated] = useState(false)

  // Mock data
  const userName = "Alex"
  const weeklyGoal = 3
  const postsThisWeek = 2

  const handleGeneratePlan = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setPlanGenerated(true)
      setWizardActive(false)
    }, 3000)
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
    setPlanGenerated(false)
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
      let hasSwitchedToAnalytics = false
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
        
        // Check if growth-insights-tab is the current target
        if (!hasSwitchedToAnalytics && activeTab === "planner") {
          const insightsTab = document.querySelector('[data-help="growth-insights-tab"]')
          const tourTooltip = document.querySelector('div[class*="bg-white"][class*="rounded-xl"]')
          if (insightsTab && tourTooltip) {
            const tooltipText = tourTooltip.textContent || ''
            // Only switch if tooltip text starts with "The Growth Insights tab" (specific hint about this tab)
            if (tooltipText.includes("The Growth Insights tab is where you track")) {
              setActiveTab("analytics")
              hasSwitchedToAnalytics = true
              return
            }
          }
        }
        
        // Check if brand-profile-tab is the current target
        if (!hasSwitchedToBrand && activeTab === "analytics") {
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
                  AI Studio
                </TabsTrigger>
                <TabsTrigger 
                  value="planner"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="schedule-tab"
                >
                  Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-[#3C3CFF] rounded-none bg-transparent data-[state=active]:bg-transparent px-4"
                  data-help="growth-insights-tab"
                >
                  Growth Insights
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
                />
              </TabsContent>

              {/* Schedule Tab */}
              <TabsContent value="planner" className="mt-0" data-help="schedule-content">
                <ScheduleTab view={plannerView} setView={setPlannerView} />
              </TabsContent>

              {/* Growth Insights Tab */}
              <TabsContent value="analytics" className="mt-0" data-help="growth-insights-content">
                <GrowthInsightsTab />
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
  onContinue
}: {
  platformMode: "both" | "x" | "linkedin"
  setPlatformMode: (mode: "both" | "x" | "linkedin") => void
  postsPerWeek: number
  setPostsPerWeek: (count: number) => void
  onBack: () => void
  onContinue: () => void
}) {
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
        <CardDescription>We'll balance quality and reach while matching your goals.</CardDescription>
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
  weeklyGoal
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
}) {
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
                  Hey {userName}, let's design your growth plan for this week 🚀
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

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header with Regenerate */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Your Growth Plan for This Week 🌱</h2>
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
              <h4 className="font-semibold text-lg">🗓️ 3 posts this week</h4>
            </div>
            <p className="text-gray-700 leading-relaxed">
              <span className="font-semibold text-gray-900">Tue 10 AM</span> • <span className="font-semibold text-gray-900">Thu 11 AM</span> • <span className="font-semibold text-gray-900">Sat 9 AM</span> — (best engagement windows)
            </p>
            <div className="flex items-center gap-2 text-sm text-[#3C3CFF] bg-blue-50 rounded-lg px-3 py-2 w-fit">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">Avg reach +18% at these times.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* B. Topics & Ideas */}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-[#3C3CFF]" />
          <h3 className="text-xl font-bold text-gray-900">💡 Jolix suggests:</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {[
            { 
              num: "1️⃣",
              date: "Tue 10 AM",
              platform: "twitter",
              tweet: "Red flag I wish I caught earlier: clients who say 'just make it pop' without explaining what that means 🚩\n\nGreat clients give context. They say things like 'more vibrant colors for a younger audience' or 'increase contrast for accessibility.'\n\nClear feedback = better work. Always ask: 'Can you show me an example of what you mean?'",
              category: "Freelancing tip"
            },
            { 
              num: "2️⃣",
              date: "Thu 11 AM",
              platform: "linkedin",
              tweet: "Just wrapped a brand identity project that changed everything for this client.\n\nBefore: Generic, forgettable logo\nAfter: Distinctive identity that tells their story\n\n3 things that made the difference:\n\n1. Deep discovery session (not just 'what colors do you like?')\n2. Competitive audit to find whitespace\n3. Brand guidelines they can actually use\n\nSometimes clients don't know what they need until you show them.\n\nWhat's been your biggest client transformation story? 👇",
              category: "Client story"
            },
            { 
              num: "3️⃣",
              date: "Sat 9 AM",
              platform: "twitter",
              tweet: "3 lessons from my latest design project:\n\n1. Start with constraints\nInstead of unlimited options, I gave myself: max 3 colors, 2 fonts, mobile-first. Creativity exploded.\n\n2. Client feedback ≠ design direction\n'Make it bigger' often means 'make it more prominent.' Sometimes that's hierarchy, not size.\n\n3. Document decisions as you go\nWhat seems obvious today won't be in 6 months. Screenshot the 'why' behind every choice.\n\nWhat have you learned recently?",
              category: "Portfolio post"
            },
          ].map((post, idx) => (
            <Card key={idx} className="shadow-md border-[#3C3CFF]/20 hover:shadow-lg hover:border-[#3C3CFF]/40 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Post Number Badge */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg">
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
                            <span className="text-xs font-medium">X</span>
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
                      <p className="text-gray-900 leading-relaxed whitespace-pre-line text-sm">
                        {post.tweet}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                        Schedule
                      </Button>
                      <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                        <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* C. Engagement Boosters */}
      <Card className="shadow-sm border-gray-100 animate-in slide-in-from-bottom-4 duration-1000">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#3C3CFF]" />
            <CardTitle>🚀 Simple Actions:</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-[#3C3CFF] mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">Reply to <span className="font-semibold">2 comments</span> within 30 min of posting</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-[#3C3CFF] mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">Comment on <span className="font-semibold">3 posts from your niche</span> daily</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-[#3C3CFF] mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">Re-share <span className="font-semibold">a successful post</span> mid-week</p>
            </div>
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
              This week's plan is designed to help you <span className="font-semibold text-[#3C3CFF]">{goalLabels[selectedGoal].toLowerCase()}</span> through strategic content that resonates with your audience. You'll post <span className="font-semibold">3 times</span> at optimal engagement windows, focusing on <span className="font-semibold">freelancing expertise</span> and <span className="font-semibold">client management insights</span>.
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
                <span className="font-semibold text-gray-900">Tue, Thu, Sat</span> at peak engagement times (10 AM, 11 AM, 9 AM)
              </p>
              <div className="mt-2 flex items-center gap-1 text-xs text-[#3C3CFF]">
                <TrendingUp className="h-3 w-3" />
                <span>+18% expected reach</span>
              </div>
            </div>

            <div className="p-4 bg-white/60 backdrop-blur rounded-xl border border-white/50">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-[#3C3CFF]" />
                <h4 className="font-semibold text-sm text-gray-700">Content Focus</h4>
              </div>
              <p className="text-sm text-gray-600">
                Mix of <span className="font-semibold text-gray-900">practical tips</span>, <span className="font-semibold text-gray-900">client stories</span>, and <span className="font-semibold text-gray-900">portfolio showcases</span>
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
  setPostText
}: {
  mode: "manual" | "ai"
  setMode: (mode: "manual" | "ai") => void
  autoPlanEnabled: boolean
  setAutoPlanEnabled: (enabled: boolean) => void
  selectedPlatforms: string[]
  setSelectedPlatforms: (platforms: string[]) => void
  postText: string
  setPostText: (text: string) => void
}) {
  const [previewPlatform, setPreviewPlatform] = useState<"twitter" | "linkedin">("twitter")
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [promptText, setPromptText] = useState<string>("")
  const [rewriteCount, setRewriteCount] = useState<number>(0)
  const [undoText, setUndoText] = useState<string>("")
  const [showUndo, setShowUndo] = useState<boolean>(false)
  const [customRewritePrompt, setCustomRewritePrompt] = useState<string>("")
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)
  const maxChars = previewPlatform === "twitter" ? 280 : 3000

  const togglePlatform = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
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

  const generateSuggestions = () => {
    // Always generate 3-5 random posts
    const count = Math.floor(Math.random() * 3) + 3 // 3-5 posts
    const shuffled = [...dummyPosts].sort(() => 0.5 - Math.random())
    setAiSuggestions(shuffled.slice(0, count))
  }

  // Dummy rewrite function
  const rewriteText = (preset?: string, customPrompt?: string) => {
    if (rewriteCount >= 3) {
      return // Limit reached
    }
    
    if (!postText.trim()) {
      return // No text to rewrite
    }

    // Store current text for undo
    setUndoText(postText)
    
    // Dummy rewrite logic (in real app, this would call an API)
    let rewritten = postText
    
    if (preset === "Make clearer") {
      rewritten = postText.replace(/\./g, '. ').replace(/\s+/g, ' ').trim()
    } else if (preset === "More engaging") {
      rewritten = postText + " 🚀"
    } else if (preset === "More concise") {
      rewritten = postText.split(' ').slice(0, Math.ceil(postText.split(' ').length * 0.7)).join(' ')
    } else if (preset === "More professional") {
      rewritten = postText.charAt(0).toUpperCase() + postText.slice(1)
    } else if (customPrompt) {
      rewritten = `[Rewritten: ${customPrompt}] ${postText}`
    }
    
    setPostText(rewritten)
    setRewriteCount(rewriteCount + 1)
    setDropdownOpen(false)
    setCustomRewritePrompt("")
    
    // Show undo for 10 seconds
    setShowUndo(true)
    setTimeout(() => {
      setShowUndo(false)
      setUndoText("")
    }, 10000)
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
          
          <Input
            type="text"
            placeholder='Try: "Share a client tip about..." or "Hot take on pricing"'
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full p-4 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent text-lg"
          />
          
          <div className="flex justify-end mt-4">
            <Button 
              onClick={generateSuggestions}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Posts
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions (after generating) */}
      {aiSuggestions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#3C3CFF]" />
            <h3 className="text-xl font-bold text-gray-900">Jolix Suggestions</h3>
          </div>
          
          {aiSuggestions.length > 1 && (
            <div className="flex justify-end">
              <Button className="bg-green-600 hover:bg-green-700">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve All & Add to Plan
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6">
            {aiSuggestions.map((post, index) => (
              <Card key={index} className="shadow-md border-[#3C3CFF]/20 hover:shadow-lg hover:border-[#3C3CFF]/40 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Post Number Badge */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center text-white font-bold text-lg">
                        {index + 1}
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
                              <span className="text-xs font-medium">X</span>
                            </>
                          ) : (
                            <>
                              <Linkedin className="h-3 w-3" />
                              <span className="text-xs font-medium">LinkedIn</span>
                            </>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">•</span>
                        <Badge 
                          className={`text-xs ${
                            post.impact === "High" 
                              ? "bg-green-100 text-green-700 border-green-200" 
                              : "bg-blue-100 text-blue-700 border-blue-200"
                          }`}
                        >
                          {post.impact} impact
                        </Badge>
                      </div>
                      
                      {/* Post Text */}
                      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mb-4">
                        <p className="text-gray-900 leading-relaxed whitespace-pre-line text-sm">
                          {post.text}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                          Schedule
                        </Button>
                        <Button size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                          Preview
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
              <p className="text-xs text-gray-500">
                Select one or both platforms to post your content to
              </p>
            </div>

            {/* Text Area */}
            <div className="space-y-2">
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full min-h-[200px] p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent"
                maxLength={maxChars}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Auto-saved • Just now</span>
                <span className={postText.length > maxChars * 0.9 ? "text-red-600 font-medium" : ""}>
                  {postText.length}/{maxChars}
                </span>
              </div>
            </div>

            {/* Attachments Row */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline">
                <ImageIcon className="h-4 w-4 mr-2" />
                Add image
              </Button>
              <Button size="sm" variant="outline">
                <LinkIcon className="h-4 w-4 mr-2" />
                Add link
              </Button>
              <Button size="sm" variant="outline">
                <Hash className="h-4 w-4 mr-2" />
                Hashtags
              </Button>
            </div>

            {/* Footer Actions */}
            <Separator />
            <div className="flex gap-2 items-center">
              <Button className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                <Send className="h-4 w-4 mr-2" />
                Post now
              </Button>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Let's Schedule It
              </Button>
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline"
                          disabled={rewriteCount >= 3 || !postText.trim()}
                        >
                          <Wand2 className="h-4 w-4 mr-2" />
                          Refine with AI
                          <ChevronDown className="h-4 w-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64 p-3">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <DropdownMenuItem
                              onClick={() => rewriteText("Make clearer")}
                              className="cursor-pointer"
                            >
                              Make clearer
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More engaging")}
                              className="cursor-pointer"
                            >
                              More engaging
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More concise")}
                              className="cursor-pointer"
                            >
                              More concise
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => rewriteText("More professional")}
                              className="cursor-pointer"
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
                              disabled={!customRewritePrompt.trim()}
                            >
                              Rewrite
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
              <Button variant="outline">
                <Save className="h-4 w-4" />
              </Button>
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
              <p className="text-sm whitespace-pre-wrap">
                {postText || "Your post preview will appear here..."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// 📅 SCHEDULE TAB
function ScheduleTab({ view, setView }: { 
  view: "week" | "month" | "list"
  setView: (view: "week" | "month" | "list") => void
}) {
  // Mock scheduled posts with ISO dates for week/month/list views
  // Added multiple posts on same days to test UX
  const scheduledPosts = [
    { id: 1, date: "2025-11-03T10:00:00", text: "Just wrapped a client project—here's what I learned about scope creep 💡", platform: "twitter", status: "ai-suggested" },
    { id: 7, date: "2025-11-03T14:00:00", text: "Quick tip: Always send a brief before starting any design project", platform: "linkedin", status: "user-approved" },
    { id: 8, date: "2025-11-03T18:00:00", text: "Client testimonial: 'This was the smoothest collaboration ever' 🎉", platform: "twitter", status: "ai-suggested" },
    { id: 2, date: "2025-11-06T10:00:00", text: "3 red flags when a potential client emails you", platform: "linkedin", status: "user-approved" },
    { id: 9, date: "2025-11-06T16:00:00", text: "Portfolio update: Just added 3 new case studies", platform: "twitter", status: "user-approved" },
    { id: 3, date: "2025-11-08T09:00:00", text: "Why I stopped charging hourly and never looked back", platform: "twitter", status: "ai-suggested" },
    { id: 4, date: "2025-11-12T10:00:00", text: "Client onboarding checklist I wish I had sooner", platform: "twitter", status: "ai-suggested" },
    { id: 10, date: "2025-11-12T15:00:00", text: "Behind the scenes: My design process from concept to delivery", platform: "linkedin", status: "ai-suggested" },
    { id: 5, date: "2025-11-18T11:00:00", text: "Before/After: subtle typography changes that 2x readability", platform: "linkedin", status: "user-approved" },
    { id: 11, date: "2025-11-18T14:00:00", text: "5 tools that transformed my freelance workflow this year", platform: "twitter", status: "ai-suggested" },
    { id: 6, date: "2025-11-22T09:00:00", text: "3 things I automate as a solo designer", platform: "twitter", status: "ai-suggested" },
  ]

  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState(new Date())

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

  const postsOnDate = (d: Date) =>
    scheduledPosts.filter((p) => isSameDay(new Date(p.date), d))

  const monthLabel = formatDateLabel(currentMonth)
  const goPrevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const goNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

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
          </div>
        </div>
        <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
          <Plus className="h-4 w-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Week / Month / List Views */}
      {view === "week" && (
        <Card className="shadow-sm border-gray-100 animate-in fade-in duration-300">
          <CardContent className="p-6">
            <div className="space-y-4">
              {scheduledPosts.map((post) => {
                const d = new Date(post.date)
                const dayLabel = d.toLocaleDateString("en-US", { weekday: "long" })
                const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                return (
                  <div key={post.id} className="border rounded-xl p-4 hover:border-[#3C3CFF]/50 transition-colors">
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
                          <Badge className={`text-xs ${post.status === "ai-suggested" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                            {post.status === "ai-suggested" ? "AI Suggested" : "User Approved"}
                          </Badge>
                        </div>
                        {/* Expandable text with focus border on hover */}
                        <div className="mb-3">
                          <div className="group border border-transparent hover:border-[#3C3CFF] rounded-md transition-colors">
                            <div className="max-h-16 overflow-hidden group-hover:max-h-[600px] transition-[max-height] duration-300 ease-out p-2">
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">{post.text}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost"><Edit3 className="h-3 w-3 mr-1" />Edit</Button>
                          <Button size="sm" variant="ghost"><Clock className="h-3 w-3 mr-1" />Reschedule</Button>
                          <Button size="sm" variant="ghost"><Send className="h-3 w-3 mr-1" />Post now</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
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
              <span>AI Suggested</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-200 ring-2 ring-green-400"></span>
              <span>User Approved</span>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {buildMonthMatrix(currentMonth).flat().map((cellDate, idx) => {
              const inCurrent = cellDate.getMonth() === currentMonth.getMonth()
              const today = isSameDay(cellDate, new Date())
              const posts = postsOnDate(cellDate)
              return (
                <div key={idx} className={`relative bg-white min-h-[100px] p-2 ${!inCurrent ? "bg-gray-50 text-gray-400" : ""} ${today ? "bg-gradient-to-br from-blue-50 to-purple-50" : ""}`}>
                  <div className="text-xs font-medium">{cellDate.getDate()}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {posts.slice(0, 4).map((p) => (
                      <div key={p.id} className="relative group/item">
                        <div className={`p-[2px] rounded-full ${p.status === "ai-suggested" ? "bg-purple-200 ring-2 ring-purple-400" : "bg-green-200 ring-2 ring-green-400"}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center ${p.platform === "twitter" ? "bg-black" : "bg-blue-700"}`}>
                            {p.platform === "twitter" ? <TwitterIcon className="h-3 w-3 text-white" /> : <Linkedin className="h-3 w-3 text-white" />}
                          </div>
                        </div>
                        {/* Tooltip to the right of the icon - stays visible when hovering over it */}
                        <div className="absolute left-full top-0 ml-2 z-30 opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible hover:opacity-100 hover:visible transition-opacity duration-150 pointer-events-none group-hover/item:pointer-events-auto hover:pointer-events-auto">
                          {/* Invisible bridge area to maintain hover */}
                          <div className="absolute -left-4 -top-2 -bottom-2 w-4"></div>
                          <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-lg shadow-lg p-2 w-64 pointer-events-auto">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-[10px] ${p.status === "ai-suggested" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                                {p.status === "ai-suggested" ? "AI Suggested" : "User Approved"}
                              </Badge>
                              <span className="text-[10px] text-gray-500">{new Date(p.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                            </div>
                            <div className="text-xs text-gray-800 line-clamp-4 mb-2">{p.text}</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">View</Button>
                              <Button size="sm" variant="outline" className="h-7 px-2 text-[11px]">Reschedule</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  <option>All Status</option>
                  <option>AI Suggested</option>
                  <option>User Approved</option>
                  <option>Draft</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[480px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white shadow-sm">
                  <tr className="text-left text-gray-600">
                    <th className="px-4 py-3 font-medium">Date / Time</th>
                    <th className="px-4 py-3 font-medium">Platform</th>
                    <th className="px-4 py-3 font-medium">Post Preview</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduledPosts
                    .slice()
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((p) => {
                      const d = new Date(p.date)
                      const dateLabel = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      const timeLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
                      return (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">{dateLabel} {timeLabel}</td>
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center gap-2 ${p.platform === "twitter" ? "text-black" : "text-blue-700"}`}>
                              {p.platform === "twitter" ? (
                                <TwitterIcon className="h-4 w-4" />
                              ) : (
                                <>
                                  <Linkedin className="h-4 w-4" />
                                  <span>LinkedIn</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-800">{p.text.slice(0, 100)}</td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${p.status === "ai-suggested" ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-green-100 text-green-700 border-green-200"}`}>
                              {p.status === "ai-suggested" ? "AI Suggested" : "User Approved"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 opacity-80 hover:opacity-100">
                              <Button size="sm" variant="outline"><Edit3 className="h-3 w-3 mr-1" />Edit</Button>
                              <Button size="sm" variant="outline"><Clock className="h-3 w-3 mr-1" />Reschedule</Button>
                              <Button size="sm" variant="outline"><Send className="h-3 w-3 mr-1" />Post now</Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 text-xs text-gray-600">Showing {scheduledPosts.length} posts from your current Growth Plan.</div>
          </CardContent>
        </Card>
      )}
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
              <CardTitle>Tone Selection</CardTitle>
              <CardDescription>Choose your communication style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                <button className="px-4 py-3 rounded-lg border-2 border-[#3C3CFF] bg-gradient-to-br from-blue-50/80 to-purple-50/50 text-[#3C3CFF] font-medium transition-all">
                  Friendly
                </button>
                <button className="px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-[#3C3CFF]/30 bg-white text-gray-700 font-medium transition-all">
                  Professional
                </button>
                <button className="px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-[#3C3CFF]/30 bg-white text-gray-700 font-medium transition-all">
                  Casual
                </button>
                <button className="px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-[#3C3CFF]/30 bg-white text-gray-700 font-medium transition-all">
                  Expert
                </button>
              </div>
              <Button variant="outline" className="w-full">
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze voice from my posts
              </Button>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-900">
                  Sample: "Just shipped a new feature—clients are loving it! Here's what we built..."
                </p>
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
                <Badge className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC]">Freelancing</Badge>
                <Badge className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC]">Design</Badge>
                <Badge className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC]">Client Management</Badge>
                <Badge className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC]">Pricing</Badge>
                <Badge className="bg-[#3C3CFF] text-white hover:bg-[#2D2DCC]">Tools</Badge>
                <Button size="sm" variant="outline">
                  <Plus className="h-3 w-3 mr-1" />
                  Add topic
                </Button>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <label className="text-sm font-medium">Things to avoid</label>
                <textarea
                  placeholder="e.g., Politics, controversial topics..."
                  className="w-full p-2 border rounded-lg text-sm min-h-[80px] resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Links & Goals */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Links & Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Website</label>
                <input
                  type="url"
                  placeholder="https://yourwebsite.com"
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Portfolio</label>
                <input
                  type="url"
                  placeholder="https://yourportfolio.com"
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pinned Offers</label>
                <textarea
                  placeholder="e.g., Free consultation, Portfolio review..."
                  className="w-full p-2 border rounded-lg text-sm min-h-[60px] resize-none"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-gray-100">
            <CardHeader>
              <CardTitle>Posting Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="text-sm font-medium">Posts per week</label>
                <input
                  type="number"
                  defaultValue="3"
                  min="1"
                  max="10"
                  className="w-full p-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500">We recommend 3-10 posts per week for optimal growth</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3">
        <Button variant="outline">Reset to defaults</Button>
        <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Save changes
        </Button>
      </div>
    </div>
  )
}
