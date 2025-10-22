"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/layout"
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
  LineChart
} from "lucide-react"
import { getCurrentUser, getUserProfile, getAccount, signOut } from "@/lib/auth"
import { User } from "@supabase/supabase-js"
import { Profile, Account } from "@/lib/auth"

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
    change: "+12.5%", 
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
    title: "Portal Views", 
    value: "1,247", 
    change: "+8.2%", 
    trend: "up",
    icon: Eye,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  { 
    title: "Messages Sent", 
    value: "89", 
    change: "-2.1%", 
    trend: "down",
    icon: MessageSquare,
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

// Revenue Chart Component
function RevenueChart() {
  const maxRevenue = Math.max(...revenueData.map(d => d.revenue))
  
  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Last 6 months performance</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">+12.5% vs last month</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="flex items-end justify-between h-32 space-x-2">
            {revenueData.map((data, index) => (
              <div key={data.month} className="flex flex-col items-center space-y-2 flex-1">
                <div className="relative w-full">
                  <div 
                    className="bg-gradient-to-t from-[#3C3CFF] to-[#6366F1] rounded-t-lg transition-all duration-500 hover:from-[#2D2DCC] hover:to-[#4F46E5]"
                    style={{ 
                      height: `${(data.revenue / maxRevenue) * 100}%`,
                      minHeight: '20px'
                    }}
                  ></div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-600">
                    ${(data.revenue / 1000).toFixed(0)}k
                  </div>
                </div>
                <span className="text-xs text-gray-500 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">${(revenueData.reduce((sum, d) => sum + d.revenue, 0) / 1000).toFixed(0)}k</div>
              <div className="text-xs text-gray-600">Total Revenue</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">{revenueData[revenueData.length - 1].clients}</div>
              <div className="text-xs text-gray-600">Active Clients</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">${Math.round(revenueData.reduce((sum, d) => sum + d.revenue, 0) / revenueData.length / 1000)}k</div>
              <div className="text-xs text-gray-600">Avg Monthly</div>
            </div>
          </div>
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
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserData() {
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
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = '/auth'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

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
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
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
                  <div className="text-2xl font-bold">$28,450</div>
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
          {kpiData.map((kpi, index) => (
            <KPICard key={index} data={kpi} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Revenue Chart - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <RevenueChart />
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
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Portal
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
                  <FileText className="mr-2 h-4 w-4" />
                  Upload File
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start border-gray-200 hover:bg-[#F0F2FF] hover:border-[#3C3CFF] hover:text-[#3C3CFF] rounded-xl h-12 bg-transparent"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Add New Client
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
