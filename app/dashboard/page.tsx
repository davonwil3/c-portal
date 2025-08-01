"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Plus, ChevronRight, Clock, DollarSign, Activity, Users, CreditCard, FileText, LogOut } from "lucide-react"
import { getCurrentUser, getUserProfile, getAccount, signOut } from "@/lib/auth"
import { User } from "@supabase/supabase-js"
import { Profile, Account } from "@/lib/auth"

// Mock data
const recentActivity = [
  { id: 1, client: "Acme Corp", action: "uploaded new files", time: "2 hours ago", avatar: "AC" },
  { id: 2, client: "TechStart Inc", action: "paid invoice #1234", time: "4 hours ago", avatar: "TI" },
  { id: 3, client: "Design Co", action: "left a message", time: "1 day ago", avatar: "DC" },
]

const recentClients = [
  { id: 1, name: "Sarah Johnson", company: "Acme Corp", lastUpdate: "2 hours ago", avatar: "SJ", status: "active" },
  { id: 2, name: "Mike Chen", company: "TechStart Inc", lastUpdate: "4 hours ago", avatar: "MC", status: "active" },
  { id: 3, name: "Emma Wilson", company: "Design Co", lastUpdate: "1 day ago", avatar: "EW", status: "pending" },
  { id: 4, name: "David Brown", company: "Marketing Plus", lastUpdate: "2 days ago", avatar: "DB", status: "active" },
]

const upcomingTasks = [
  { id: 1, task: "Website redesign mockups", client: "Acme Corp", due: "Tomorrow" },
  { id: 2, task: "Brand guidelines delivery", client: "TechStart Inc", due: "Friday" },
  { id: 3, task: "Project kickoff meeting", client: "Design Co", due: "Next week" },
]

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#3C3CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be logged in to view this page.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    )
  }

  const userName = profile?.first_name || user.email || "User"

  // Debug logging
  console.log('User:', user)
  console.log('Profile:', profile)
  console.log('First name:', profile?.first_name)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.first_name ? profile.first_name : "there"}! 
            </h1>
            <p className="text-gray-600 mt-1">
              Here's what's happening with your clients today.
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Recent Activity</CardTitle>
              <Activity className="h-4 w-4 text-[#3C3CFF] group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">12</div>
              <p className="text-xs text-gray-600 mt-1">
                <span className="text-green-600">+2</span> from yesterday
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unpaid Invoices</CardTitle>
              <DollarSign className="h-4 w-4 text-[#3C3CFF] group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">$12,450</div>
              <p className="text-xs text-gray-600 mt-1">3 invoices pending</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Upcoming Tasks</CardTitle>
              <Clock className="h-4 w-4 text-[#3C3CFF] group-hover:scale-110 transition-transform duration-200" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">8</div>
              <p className="text-xs text-gray-600 mt-1">Due this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Clients - Takes up 2 columns */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Recent Clients</CardTitle>
                  <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                    View all
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium">
                          {client.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                          {client.name}
                        </p>
                        <p className="text-sm text-gray-600">{client.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={client.status === "active" ? "default" : "secondary"}
                        className={
                          client.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                        }
                      >
                        {client.status}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{client.lastUpdate}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions - Takes up 1 column */}
          <div className="space-y-6">
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-xl h-12">
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

            {/* Recent Activity Card */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                        {activity.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.client}</span> {activity.action}
                      </p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Tasks Card */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl border border-gray-100 hover:border-[#3C3CFF] hover:bg-[#F0F2FF] transition-all duration-200 cursor-pointer"
                  >
                    <p className="font-medium text-gray-900 text-sm">{task.task}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-600">{task.client}</p>
                      <Badge variant="outline" className="text-xs">
                        {task.due}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
