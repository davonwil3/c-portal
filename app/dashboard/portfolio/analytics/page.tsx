"use client"

import { useState, useEffect, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { MetricCard } from "@/components/MetricCard"
import { Section } from "@/components/Section"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { getUserPortfolios, getPortfolioAnalytics } from "@/lib/portfolio"
import {
  ArrowLeft,
  Eye,
  Users,
  Calendar,
  MousePointer,
  Clock,
  TrendingUp,
  Globe,
  Mail,
  Share2,
  MessageSquare,
  FileText
} from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

export default function PortfolioAnalyticsPage() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState("6m")
  const [viewType, setViewType] = useState<"week" | "month" | "all">("all")
  const [loading, setLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const portfolios = await getUserPortfolios()
        if (portfolios.length > 0) {
          const latestPortfolio = portfolios[0]
          const analytics = await getPortfolioAnalytics(latestPortfolio.id)
          setAnalyticsData(analytics)
        }
      } catch (error) {
        console.error('[Analytics Page] Error loading analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [])
  
  // Extract data from analytics_data JSONB or use defaults - memoize to prevent re-renders
  const analytics = useMemo(() => {
    const data = analyticsData?.analytics_data || {}
    console.log('[ANALYTICS DATA] Raw analyticsData:', analyticsData)
    console.log('[ANALYTICS DATA] Extracted analytics:', data)
    return data
  }, [analyticsData])
  const overview = useMemo(() => analytics.overview || {
    totalViews: 0,
    uniqueVisitors: 0,
    appointmentsBooked: 0,
    avgTimeOnPage: 0,
    bounceRate: 0,
    totalBounces: 0
  }, [analytics])
  const allViewsOverTime = useMemo(() => {
    const data = analytics.viewsOverTime || []
    console.log('[ANALYTICS DATA] allViewsOverTime:', data)
    return data
  }, [analytics])
  const dailyViews = useMemo(() => {
    // dailyViews might not exist yet - initialize it if missing
    let data = analytics.dailyViews || []
    
    // If dailyViews is empty but we have viewsOverTime, we can't generate daily data
    // The tracking code should be creating dailyViews, but if it doesn't exist, return empty
    if (!data || data.length === 0) {
      console.log('[ANALYTICS DATA] dailyViews is empty or missing - this is expected if no daily tracking yet')
      data = []
    }
    
    return data
  }, [analytics])
  const engagement = useMemo(() => analytics.engagement || [], [analytics])
  const engagementOverTime = useMemo(() => analytics.engagementOverTime || [], [analytics])
  
  // Filter engagement data based on view type - same logic as viewsOverTime
  const filteredEngagement = useMemo(() => {
    if (viewType === "week") {
      // For week view, show last 7 days of engagement
      // Engagement data uses day names (Mon, Tue, etc.) so we need to map to actual dates
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekData = []
      
      // Create a map of engagement by day name
      const engagementMap = new Map<string, any>()
      engagement.forEach((entry: any) => {
        if (entry && entry.day) {
          engagementMap.set(entry.day, entry)
        }
      })
      
      // Generate last 7 days and match with engagement data
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = engagementMap.get(dayName)
        
        weekData.push(existing || { 
          day: dateStr, 
          avgTime: 0, 
          bounceRate: 0,
          count: 0,
          bounceCount: 0
        })
      }
      
      return weekData
    } else if (viewType === "month") {
      console.log('[ENGAGEMENT MONTH VIEW] Starting month view processing')
      console.log('[ENGAGEMENT MONTH VIEW] Raw engagement data:', engagement)
      
      // For month view, show all weeks like views graph does
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      // Create a map of dailyViews by date to know which dates have activity
      const dailyViewsMap = new Map<string, any>()
      if (dailyViews && Array.isArray(dailyViews) && dailyViews.length > 0) {
        dailyViews.forEach((entry: any) => {
          if (entry && entry.date) {
            const dateStr = String(entry.date)
            dailyViewsMap.set(dateStr, entry)
            // Also store normalized version
            try {
              const parsed = new Date(dateStr)
              if (!isNaN(parsed.getTime())) {
                const normalized = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (normalized !== dateStr) {
                  dailyViewsMap.set(normalized, entry)
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        })
      }
      
      console.log('[ENGAGEMENT MONTH VIEW] dailyViewsMap size:', dailyViewsMap.size)
      console.log('[ENGAGEMENT MONTH VIEW] dailyViewsMap keys:', Array.from(dailyViewsMap.keys()))
      
      // Create a map of engagement by day name
      const engagementMap = new Map<string, any>()
      engagement.forEach((entry: any) => {
        if (entry && entry.day) {
          engagementMap.set(entry.day, entry)
        }
      })
      
      console.log('[ENGAGEMENT MONTH VIEW] engagementMap:', Array.from(engagementMap.entries()))
      
      // Get all days in current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      
      // Group ALL days into weeks (like views graph) - show all weeks even with 0 data
      const weekData: { [key: string]: { week: string; avgTime: number; bounceRate: number; count: number; startDate: Date; endDate: Date } } = {}
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day)
        date.setHours(0, 0, 0, 0)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
        
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = date.getDay()
        
        // Calculate week start (Sunday of this week)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - dayOfWeek)
        
        // Calculate week end (Saturday of this week, but not beyond month end)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        if (weekEnd.getMonth() !== currentMonth) {
          weekEnd.setDate(daysInMonth)
        }
        
        // Format week label (e.g., "Jan 1-7")
        const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        
        if (!weekData[weekLabel]) {
          weekData[weekLabel] = {
            week: weekLabel,
            avgTime: 0,
            bounceRate: 0,
            count: 0,
            startDate: new Date(weekStart),
            endDate: new Date(weekEnd)
          }
        }
        
        // Only add engagement data if this day has dailyViews data (actual activity)
        const hasDailyView = dailyViewsMap.has(dateStr)
        const engagementEntry = engagementMap.get(dayName)
        
        if (hasDailyView && engagementEntry) {
          console.log(`[ENGAGEMENT MONTH VIEW] Day ${day} (${dateStr}, ${dayName}):`, {
            hasDailyView,
            hasEngagement: !!engagementEntry,
            engagementEntry
          })
          
          // Aggregate: calculate weighted average for avgTime and bounceRate
          const totalCount = weekData[weekLabel].count + (engagementEntry.count || 0)
          if (totalCount > 0) {
            weekData[weekLabel].avgTime = ((weekData[weekLabel].avgTime * weekData[weekLabel].count) + ((engagementEntry.avgTime || 0) * (engagementEntry.count || 0))) / totalCount
            weekData[weekLabel].bounceRate = ((weekData[weekLabel].bounceRate * weekData[weekLabel].count) + ((engagementEntry.bounceRate || 0) * (engagementEntry.count || 0))) / totalCount
          }
          weekData[weekLabel].count = totalCount
        }
      }
      
      console.log('[ENGAGEMENT MONTH VIEW] weekData before sorting:', Object.values(weekData))
      
      // Convert to array and sort by start date - show ALL weeks (like views graph)
      const result = Object.values(weekData).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      
      console.log('[ENGAGEMENT MONTH VIEW] Final result:', result)
      return result
    } else {
      // For "all" view, use engagementOverTime (monthly data) - same structure as viewsOverTime
      const now = new Date()
      let startMonth: number
      let startYear: number
      let numMonths: number
      
      if (dateRange === '6m') {
        numMonths = 6
        startMonth = now.getMonth() - 5
        startYear = now.getFullYear()
        while (startMonth < 0) {
          startMonth += 12
          startYear -= 1
        }
      } else if (dateRange === '12m') {
        numMonths = 12
        startMonth = now.getMonth() - 11
        startYear = now.getFullYear()
        while (startMonth < 0) {
          startMonth += 12
          startYear -= 1
        }
      } else {
        numMonths = now.getMonth() + 1
        startMonth = 0
        startYear = now.getFullYear()
      }
      
      // Create a map of existing engagementOverTime data
      const engagementMap = new Map<string, any>()
      engagementOverTime.forEach((entry: any) => {
        if (entry && entry.month) {
          engagementMap.set(entry.month, entry)
        }
      })
      
      // Generate all months in range
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const result = []
      
      for (let i = 0; i < numMonths; i++) {
        const monthIndex = (startMonth + i) % 12
        const year = startYear + Math.floor((startMonth + i) / 12)
        const monthName = monthNames[monthIndex]
        
        const existing = engagementMap.get(monthName)
        result.push(existing || {
          month: monthName,
          avgTime: 0,
          bounceRate: 0,
          count: 0
        })
      }
      
      return result
    }
  }, [viewType, dateRange, engagement, engagementOverTime, dailyViews])
  
  
  
  // Filter views over time based on view type - memoize to prevent re-renders
  const viewsOverTime = useMemo(() => {
    console.log('[VIEWS OVER TIME] viewType:', viewType)
    console.log('[VIEWS OVER TIME] dailyViews:', dailyViews)
    console.log('[VIEWS OVER TIME] dailyViews length:', dailyViews?.length)
    
    if (viewType === "week") {
      // Create a map of all dailyViews by date string
      const dailyViewsMap = new Map<string, any>()
      
      if (dailyViews && Array.isArray(dailyViews) && dailyViews.length > 0) {
        dailyViews.forEach((entry: any) => {
          if (entry && entry.date) {
            const dateStr = String(entry.date)
            dailyViewsMap.set(dateStr, entry)
            // Also store normalized version
            try {
              const parsed = new Date(dateStr)
              if (!isNaN(parsed.getTime())) {
                const normalized = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (normalized !== dateStr) {
                  dailyViewsMap.set(normalized, entry)
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        })
      }
      
      // Generate last 7 days (today backwards) and match with data
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekData = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = dailyViewsMap.get(dateStr)
        weekData.push(existing || { date: dateStr, views: 0, uniqueVisitors: 0 })
      }
      
      return weekData
    } else if (viewType === "month") {
      // Create a map of existing daily views for quick lookup
      const dailyViewsMap = new Map<string, any>()
      
      if (dailyViews && Array.isArray(dailyViews) && dailyViews.length > 0) {
        dailyViews.forEach((entry: any) => {
          if (entry && entry.date) {
            const dateStr = String(entry.date)
            dailyViewsMap.set(dateStr, entry)
            // Also store normalized version
            try {
              const parsed = new Date(dateStr)
              if (!isNaN(parsed.getTime())) {
                const normalized = parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                if (normalized !== dateStr) {
                  dailyViewsMap.set(normalized, entry)
                }
              }
            } catch (e) {
              // Ignore
            }
          }
        })
      }
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()
      
      // Get all days in current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
      
      // Group days into weeks (Sunday to Saturday)
      const weekData: { [key: string]: { week: string; views: number; uniqueVisitors: number; startDate: Date; endDate: Date } } = {}
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day)
        date.setHours(0, 0, 0, 0)
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const existing = dailyViewsMap.get(dateStr)
        
        // Get the day of week (0 = Sunday, 6 = Saturday)
        const dayOfWeek = date.getDay()
        
        // Calculate week start (Sunday of this week)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - dayOfWeek)
        
        // Calculate week end (Saturday of this week, but not beyond month end)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        if (weekEnd.getMonth() !== currentMonth) {
          weekEnd.setDate(daysInMonth)
        }
        
        // Format week label (e.g., "Jan 1-7")
        const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        
        if (!weekData[weekLabel]) {
          weekData[weekLabel] = {
            week: weekLabel,
            views: 0,
            uniqueVisitors: 0,
            startDate: new Date(weekStart),
            endDate: new Date(weekEnd)
          }
        }
        
        if (existing) {
          weekData[weekLabel].views += existing.views || 0
          weekData[weekLabel].uniqueVisitors += existing.uniqueVisitors || 0
        }
      }
      
      // Convert to array and sort by start date
      const monthData = Object.values(weekData).sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      
      return monthData
    } else {
      // For "all" view, show all months in date range (even if 0 data)
      const now = new Date()
      let startMonth: number
      let startYear: number
      let numMonths: number
      
      if (dateRange === '6m') {
        numMonths = 6
        startMonth = now.getMonth() - 5 // Include current month, so 6 months total
        startYear = now.getFullYear()
        // Handle year rollover
        while (startMonth < 0) {
          startMonth += 12
          startYear -= 1
        }
      } else if (dateRange === '12m') {
        numMonths = 12
        startMonth = now.getMonth() - 11 // Include current month, so 12 months total
        startYear = now.getFullYear()
        // Handle year rollover
        while (startMonth < 0) {
          startMonth += 12
          startYear -= 1
        }
      } else {
        // Year YTD - from January to current month
        numMonths = now.getMonth() + 1
        startMonth = 0 // January
        startYear = now.getFullYear()
      }
      
      // Create a map of existing data
      const existingDataMap = new Map<string, any>()
      allViewsOverTime.forEach((entry: any) => {
        if (entry && entry.month) {
          existingDataMap.set(entry.month, entry)
        }
      })
      
      // Generate all months in range
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const result = []
      
      for (let i = 0; i < numMonths; i++) {
        const monthIndex = (startMonth + i) % 12
        const year = startYear + Math.floor((startMonth + i) / 12)
        const monthName = monthNames[monthIndex]
        
        const existing = existingDataMap.get(monthName)
        result.push(existing || {
          month: monthName,
          views: 0,
          uniqueVisitors: 0
        })
      }
      
      return result
    }
  }, [viewType, dateRange, dailyViews, allViewsOverTime])
  
  // Filter traffic sources to only show those with values > 0 and sort by value
  const allTrafficSources = analytics.trafficSources || [
    { name: "Direct", value: 0, color: "#4647E0" },
    { name: "Social Media", value: 0, color: "#6366F1" },
    { name: "Search", value: 0, color: "#8B5CF6" },
    { name: "Referral", value: 0, color: "#A855F7" },
  ]
  const trafficSources = allTrafficSources
    .filter((s: any) => (s.value || 0) > 0)
    .sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
  const mostViewedSections = analytics.mostViewedSections || []
  const visitorActions = analytics.visitorActions || { ctaClicks: 0, formSubmissions: 0, contactRequests: 0 }
  const deviceBreakdown = analytics.deviceBreakdown || [
    { device: "Desktop", icon: "💻", percentage: 0 },
    { device: "Mobile", icon: "📱", percentage: 0 },
    { device: "Tablet", icon: "📱", percentage: 0 },
  ]
  const topLocations = analytics.topLocations || []
  
  // Format numbers for display
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
    return num.toString()
  }
  
  const totalViews = overview.totalViews || analyticsData?.view_count || 0
  const uniqueVisitors = overview.uniqueVisitors || 0
  const avgTimeOnPage = overview.avgTimeOnPage || 0

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="text-white hover:bg-white/20 mb-4 -ml-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <h1 className="text-4xl font-bold mb-2">
                  Portfolio Analytics 📈
                </h1>
                <p className="text-blue-100 text-lg">
                  Track your portfolio performance and visitor insights
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{loading ? '...' : formatNumber(totalViews)}</div>
                  <div className="text-blue-100 text-sm">Total Views</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Eye className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Summary Cards */}
        <Section title="Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Views"
              value={loading ? "..." : totalViews.toLocaleString()}
              hintIcon={Eye}
            />
            <MetricCard
              title="Unique Visitors"
              value={loading ? "..." : uniqueVisitors.toLocaleString()}
              hintIcon={Users}
            />
            <MetricCard
              title="Appointments Booked"
              value={loading ? "..." : (overview.appointmentsBooked || 0).toString()}
              hintIcon={Calendar}
            />
            <MetricCard
              title="Avg. Time on Page"
              value={loading ? "..." : `${avgTimeOnPage.toFixed(1)} min`}
              hintIcon={Clock}
            />
          </div>
        </Section>

        {/* Views Over Time Chart */}
        <Section title="Views Over Time">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* View Type Selector */}
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
                className={viewType === 'week' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                Week
              </Button>
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
                className={viewType === 'month' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                Month
              </Button>
              <Button
                variant={viewType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('all')}
                className={viewType === 'all' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                All Time
              </Button>
            </div>
            
            {/* Date Range Filter (only show when viewType is "all") */}
            {viewType === 'all' && (
              <>
                <Button
                  variant={dateRange === '6m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('6m')}
                  className={dateRange === '6m' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  Last 6 Months
                </Button>
                <Button
                  variant={dateRange === '12m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('12m')}
                  className={dateRange === '12m' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  Last 12 Months
                </Button>
                <Button
                  variant={dateRange === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('year')}
                  className={dateRange === 'year' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  {new Date().getFullYear()} YTD
                </Button>
              </>
            )}
          </div>
          
          <Card className="p-6">
            {viewsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={viewsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey={viewType === 'week' ? 'date' : viewType === 'month' ? 'week' : 'month'} 
                    stroke="#6b7280"
                    angle={viewType === 'week' ? -45 : viewType === 'month' ? -45 : 0}
                    textAnchor={viewType === 'week' ? 'end' : viewType === 'month' ? 'end' : 'middle'}
                    height={viewType === 'week' ? 60 : viewType === 'month' ? 60 : 30}
                  />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any) => [value, '']}
                    labelFormatter={(label) => {
                      if (viewType === 'week') return `Day: ${label}`
                      if (viewType === 'month') return `Week: ${label}`
                      return `Month: ${label}`
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#4647E0" 
                    strokeWidth={2}
                    name="Total Views"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="#8B5CF6" 
                    strokeWidth={2}
                    name="Unique Visitors"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No data available yet. Start sharing your portfolio to see analytics!
              </div>
            )}
          </Card>
        </Section>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Traffic Sources */}
          <Section title="Traffic Sources">
            <Card className="p-6">
              {trafficSources.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={trafficSources}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {trafficSources.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value} visits`, 'Visits']}
                        labelFormatter={(label) => label}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {trafficSources.map((source: any) => {
                      const total = trafficSources.reduce((sum: number, s: any) => sum + (s.value || 0), 0)
                      const percentage = total > 0 ? Math.round(((source.value || 0) / total) * 100) : 0
                      return (
                        <div key={source.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: source.color }}
                            />
                            <span className="text-sm text-gray-600">{source.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {source.value} ({percentage}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No traffic source data yet. Share your portfolio to see where visitors come from!
                </div>
              )}
            </Card>
          </Section>

          {/* Most Viewed Sections */}
          <Section title="Most Viewed Sections">
            <Card className="p-6">
              {mostViewedSections.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mostViewedSections}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="page" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }} 
                    />
                    <Bar dataKey="views" fill="#4647E0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No section views yet. Visitors need to scroll through your portfolio.
                </div>
              )}
            </Card>
          </Section>
        </div>

        {/* Engagement Metrics */}
        <Section title="Engagement Metrics">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {/* View Type Selector - same as Views Over Time */}
            <div className="flex items-center gap-2 mr-4">
              <span className="text-sm text-gray-600 font-medium">View:</span>
              <Button
                variant={viewType === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('week')}
                className={viewType === 'week' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                Week
              </Button>
              <Button
                variant={viewType === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('month')}
                className={viewType === 'month' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                Month
              </Button>
              <Button
                variant={viewType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewType('all')}
                className={viewType === 'all' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
              >
                All Time
              </Button>
            </div>
            
            {/* Date Range Filter (only show when viewType is "all") */}
            {viewType === 'all' && (
              <>
                <Button
                  variant={dateRange === '6m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('6m')}
                  className={dateRange === '6m' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  Last 6 Months
                </Button>
                <Button
                  variant={dateRange === '12m' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('12m')}
                  className={dateRange === '12m' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  Last 12 Months
                </Button>
                <Button
                  variant={dateRange === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDateRange('year')}
                  className={dateRange === 'year' ? 'bg-[#4647E0] hover:bg-[#3c3dd0]' : ''}
                >
                  {new Date().getFullYear()} YTD
                </Button>
              </>
            )}
          </div>
          
          <Card className="p-6">
            {filteredEngagement.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredEngagement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey={viewType === 'week' ? 'day' : viewType === 'month' ? 'week' : 'month'} 
                    stroke="#6b7280"
                    angle={viewType === 'week' ? -45 : viewType === 'month' ? -45 : 0}
                    textAnchor={viewType === 'week' ? 'end' : viewType === 'month' ? 'end' : 'middle'}
                    height={viewType === 'week' ? 60 : viewType === 'month' ? 60 : 30}
                  />
                  {/* Left Y-axis for Avg Time (minutes) */}
                  <YAxis 
                    yAxisId="left"
                    stroke="#4647E0"
                    label={{ value: 'Avg Time (min)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4647E0' } }}
                  />
                  {/* Right Y-axis for Bounce Rate (percentage) */}
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#F59E0B"
                    domain={[0, 100]}
                    label={{ value: 'Bounce Rate (%)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#F59E0B' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'Avg Time (min)') {
                        return [`${typeof value === 'number' ? value.toFixed(1) : value} min`, name]
                      }
                      if (name === 'Bounce Rate (%)') {
                        return [`${typeof value === 'number' ? value.toFixed(1) : value}%`, name]
                      }
                      return [value, name]
                    }}
                    labelFormatter={(label) => {
                      if (viewType === 'week') return `Day: ${label}`
                      if (viewType === 'month') return `Week: ${label}`
                      return `Month: ${label}`
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="avgTime" 
                    stroke="#4647E0" 
                    strokeWidth={2}
                    name="Avg Time (min)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bounceRate" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Bounce Rate (%)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No engagement data yet. Keep visitors on your portfolio longer to see metrics.
              </div>
            )}
          </Card>
        </Section>

        {/* Key Actions */}
        <Section title="Visitor Actions">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full p-3 bg-purple-100">
                  <MousePointer className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{loading ? '...' : visitorActions.ctaClicks || 0}</div>
              </div>
              <p className="text-sm font-medium text-gray-600">CTA Clicks</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full p-3 bg-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{loading ? '...' : visitorActions.formSubmissions || 0}</div>
              </div>
              <p className="text-sm font-medium text-gray-600">Form Submissions</p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full p-3 bg-orange-100">
                  <MessageSquare className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{loading ? '...' : visitorActions.contactRequests || 0}</div>
              </div>
              <p className="text-sm font-medium text-gray-600">Contact Requests</p>
            </Card>
          </div>
        </Section>

        {/* Geographic & Device Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Section title="Top Locations">
            <Card className="p-6">
              {topLocations.length > 0 ? (
                <div className="space-y-4">
                  {topLocations.map((location: any) => (
                    <div key={location.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{location.flag || '🌍'}</span>
                        <span className="text-sm font-medium text-gray-700">{location.country}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#4647E0]" 
                            style={{ width: `${location.percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                          {location.percentage || 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No location data yet. Location tracking requires real visitor IP addresses.
                </div>
              )}
            </Card>
          </Section>

          <Section title="Device Breakdown">
            <Card className="p-6">
              <div className="space-y-4">
                {deviceBreakdown.length > 0 ? (
                  deviceBreakdown.map((device: any) => (
                    <div key={device.device} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{device.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{device.device}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600" 
                            style={{ width: `${device.percentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-10 text-right">
                          {device.percentage || 0}%
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">No device data yet</div>
                )}
              </div>
            </Card>
          </Section>
        </div>
      </div>
    </DashboardLayout>
  )
}

