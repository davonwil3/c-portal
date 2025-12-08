"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/layout"
import { RevenueTrend } from "@/components/charts/RevenueTrend"
import { 
  Plus, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Activity, 
  Users, 
  CreditCard, 
  FileText, 
  LogOut,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MessageSquare,
  Calendar,
  Target,
  Zap,
  Star,
  Globe,
  BarChart3,
  PieChart,
  LineChart,
  UserPlus,
  Briefcase
} from "lucide-react"
import { getCurrentUser, getUserProfile, getAccount, signOut } from "@/lib/auth"
import { User } from "@supabase/supabase-js"
import { Profile, Account } from "@/lib/auth"
import { fetchRealInvoices, groupByMonth } from "@/lib/analytics"
import { useTour } from "@/contexts/TourContext"
import { dummyClients, dummyProjects, dummyAnalytics } from "@/lib/tour-dummy-data"

// Enhanced mock data
const revenueData = [
  { month: 'Jan', revenue: 12000, clients: 8 },
  { month: 'Feb', revenue: 15000, clients: 12 },
  { month: 'Mar', revenue: 18000, clients: 15 },
  { month: 'Apr', revenue: 22000, clients: 18 },
  { month: 'May', revenue: 25000, clients: 22 },
  { month: 'Jun', revenue: 28000, clients: 25 },
]

const kpiData = [
  { 
    title: "Monthly Revenue", 
    value: "$28,450", 
    change: "+12.5% this month", 
    trend: "up",
    icon: DollarSign,
    color: "text-green-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  },
  { 
    title: "Active Clients", 
    value: "25", 
    change: "+3 this month", 
    trend: "up",
    icon: Users,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  { 
    title: "Total Leads", 
    value: "142", 
    change: "+18 this month", 
    trend: "up",
    icon: UserPlus,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  { 
    title: "Followers", 
    value: "1,247", 
    change: "+128 this month", 
    trend: "up",
    icon: Users,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600"
  }
]

const recentActivity = [
  { 
    id: 1, 
    client: "Acme Corp", 
    action: "uploaded new files", 
    time: "2 hours ago", 
    avatar: "AC",
    type: "file",
    status: "success"
  },
  { 
    id: 2, 
    client: "TechStart Inc", 
    action: "paid invoice #1234", 
    time: "4 hours ago", 
    avatar: "TI",
    type: "payment",
    status: "success"
  },
  { 
    id: 3, 
    client: "Design Co", 
    action: "left a message", 
    time: "1 day ago", 
    avatar: "DC",
    type: "message",
    status: "pending"
  },
  { 
    id: 4, 
    client: "Marketing Plus", 
    action: "signed contract", 
    time: "2 days ago", 
    avatar: "MP",
    type: "contract",
    status: "success"
  },
]

const topClients = [
  { id: 1, name: "Sarah Johnson", company: "Acme Corp", revenue: "$8,500", growth: "+15%", avatar: "SJ", status: "active" },
  { id: 2, name: "Mike Chen", company: "TechStart Inc", revenue: "$6,200", growth: "+8%", avatar: "MC", status: "active" },
  { id: 3, name: "Emma Wilson", company: "Design Co", revenue: "$4,800", growth: "+22%", avatar: "EW", status: "active" },
  { id: 4, name: "David Brown", company: "Marketing Plus", revenue: "$3,900", growth: "+5%", avatar: "DB", status: "pending" },
]

const upcomingTasks = [
  { id: 1, task: "Website redesign mockups", client: "Acme Corp", due: "Tomorrow", priority: "high" },
  { id: 2, task: "Brand guidelines delivery", client: "TechStart Inc", due: "Friday", priority: "medium" },
  { id: 3, task: "Project kickoff meeting", client: "Design Co", due: "Next week", priority: "low" },
  { id: 4, task: "Invoice #1235 follow-up", client: "Marketing Plus", due: "Today", priority: "high" },
]

// Quick Stat Card Component
function QuickStatCard({ title, value, change, icon: Icon, trend, color }: {
  title: string
  value: string
  change: string
  icon: any
  trend: "up" | "down"
  color: string
}) {
  return (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 ${color} bg-opacity-10 rounded-xl flex items-center justify-center`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <Badge variant={trend === "up" ? "default" : "secondary"} className={`${
            trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            <div className="flex items-center gap-1">
              {trend === "up" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </div>
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

// KPI Card Component
function KPICard({ data }: { data: typeof kpiData[0] }) {
  const Icon = data.icon
  
  return (
    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-8 h-8 ${data.bgColor} rounded-lg flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${data.iconColor}`} />
              </div>
              <span className="text-sm font-medium text-gray-600">{data.title}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{data.value}</div>
            <div className="flex items-center space-x-1">
              {data.trend === "up" ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${data.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                {data.change}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Item Component
function ActivityItem({ activity }: { activity: typeof recentActivity[0] }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'file': return FileText
      case 'payment': return CreditCard
      case 'message': return MessageSquare
      case 'contract': return FileText
      default: return Activity
    }
  }
  
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'file': return 'text-blue-600 bg-blue-50'
      case 'payment': return 'text-green-600 bg-green-50'
      case 'message': return 'text-purple-600 bg-purple-50'
      case 'contract': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const Icon = getActivityIcon(activity.type)
  
  return (
    <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200">
      <div className={`w-8 h-8 ${getActivityColor(activity.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{activity.client}</span> {activity.action}
        </p>
        <p className="text-xs text-gray-500">{activity.time}</p>
      </div>
      <Badge 
        variant={activity.status === "success" ? "default" : "secondary"}
        className={`text-xs ${
          activity.status === "success" 
            ? "bg-green-100 text-green-700" 
            : "bg-yellow-100 text-yellow-700"
        }`}
      >
        {activity.status}
      </Badge>
    </div>
  )
}

export default function DashboardPage() {
  const { isTourRunning } = useTour()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<any[]>([])

  useEffect(() => {
    async function loadUserData() {
      // Skip loading real data during tours
      if (isTourRunning) {
        setLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          
          const userProfile = await getUserProfile(currentUser.id)
          if (userProfile) {
            setProfile(userProfile)
            
            const userAccount = await getAccount(userProfile.account_id)
            if (userAccount) {
              setAccount(userAccount)
            }

            // Fetch invoices
            try {
              const invoiceData = await fetchRealInvoices()
              setInvoices(invoiceData)
            } catch (error) {
              console.error('Error fetching invoices:', error)
              setInvoices([])
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [isTourRunning])

  // Calculate revenue trend data
  const revenueChartData = useMemo(() => {
    return groupByMonth(invoices, "6m")
  }, [invoices])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Use dummy data for KPIs during tours
  const displayKpiData = useMemo(() => {
    if (isTourRunning) {
      return [
        { 
          title: "Monthly Revenue", 
          value: `$${dummyAnalytics.revenue.monthly.toLocaleString()}`, 
          change: `+${dummyAnalytics.revenue.growth}% this month`, 
          trend: "up" as const,
          icon: DollarSign,
          color: "text-green-600",
          bgColor: "bg-green-50",
          iconColor: "text-green-600"
        },
        { 
          title: "Active Clients", 
          value: dummyAnalytics.clients.active.toString(), 
          change: `+${dummyAnalytics.clients.new} this month`, 
          trend: "up" as const,
          icon: Users,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          iconColor: "text-blue-600"
        },
        { 
          title: "Active Projects", 
          value: dummyAnalytics.projects.active.toString(), 
          change: `${dummyAnalytics.projects.total} total projects`, 
          trend: "up" as const,
          icon: Briefcase,
          color: "text-purple-600",
          bgColor: "bg-purple-50",
          iconColor: "text-purple-600"
        },
        { 
          title: "Outstanding", 
          value: `$${dummyAnalytics.invoices.outstanding.toLocaleString()}`, 
          change: `$${dummyAnalytics.invoices.overdue.toLocaleString()} overdue`, 
          trend: "down" as const,
          icon: CreditCard,
          color: "text-orange-600",
          bgColor: "bg-orange-50",
          iconColor: "text-orange-600"
        }
      ]
    }
    return kpiData
  }, [isTourRunning])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3C3CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/30">
        <div className="text-center">
          <p className="text-gray-600 mb-4 font-medium">You need to be logged in to view this page.</p>
          <Button onClick={() => window.location.href = '/auth'} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  const userName = profile?.first_name || user.email || "User"

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {profile?.first_name ? profile.first_name : "there"}! 👋
                </h1>
                <p className="text-blue-100 text-lg">
                  Here's what's happening with your business today.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {isTourRunning ? `$${dummyAnalytics.revenue.monthly.toLocaleString()}` : "$28,450"}
                  </div>
                  <div className="text-blue-100 text-sm">This month's revenue</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayKpiData.map((kpi, index) => (
            <KPICard key={index} data={kpi} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart - Takes up 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <RevenueTrend data={revenueChartData} />
            
            {/* Quick Stats under chart */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <QuickStatCard
                title="New Leads"
                value="12"
                change="+18%"
                icon={UserPlus}
                trend="up"
                color="text-blue-600"
              />
              <QuickStatCard
                title="New Clients"
                value="5"
                change="+25%"
                icon={Users}
                trend="up"
                color="text-green-600"
              />
              <QuickStatCard
                title="Billed Hours"
                value="127"
                change="+8%"
                icon={Clock}
                trend="up"
                color="text-purple-600"
              />
              <QuickStatCard
                title="Projects"
                value="18"
                change="+12%"
                icon={Briefcase}
                trend="up"
                color="text-orange-600"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Zap className="h-5 w-5 text-[#3C3CFF] mr-2" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white rounded-xl h-12 shadow-lg">
                  <Users className="mr-2 h-4 w-4" />
                  Add New Client
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-[#F0F2FF] hover:border-[#3C3CFF] hover:text-[#3C3CFF] rounded-xl h-12 bg-transparent"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Send Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-[#F0F2FF] hover:border-[#3C3CFF] hover:text-[#3C3CFF] rounded-xl h-12 bg-transparent"
                >
                  <Briefcase className="mr-2 h-4 w-4" />
                  Create a Project
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-[#F0F2FF] hover:border-[#3C3CFF] hover:text-[#3C3CFF] rounded-xl h-12 bg-transparent"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule a Meeting
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Activity className="h-5 w-5 text-[#3C3CFF] mr-2" />
                    Recent Activity
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Clients */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 text-[#3C3CFF] mr-2" />
                  Top Clients
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {topClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] text-white font-semibold">
                        {client.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                        {client.name}
                      </p>
                      <p className="text-sm text-gray-600">{client.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{client.revenue}</div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">{client.growth}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 text-[#3C3CFF] mr-2" />
                  Upcoming Tasks
                </CardTitle>
                <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-gray-100 hover:border-[#3C3CFF] hover:bg-[#F0F2FF] transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm group-hover:text-[#3C3CFF] transition-colors">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">{task.client}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          task.priority === 'high' 
                            ? 'border-red-200 text-red-700 bg-red-50' 
                            : task.priority === 'medium'
                            ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                            : 'border-gray-200 text-gray-700 bg-gray-50'
                        }`}
                      >
                        {task.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {task.due}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
