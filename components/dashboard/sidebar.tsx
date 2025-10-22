"use client"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Home,
  Users,
  Package,
  CreditCard,
  Settings,
  HelpCircle,
  Globe,
  Search,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Navigation items
const navigationItems = [
  { title: "Home", icon: Home, href: "/dashboard" },
  { title: "Client Workflow", icon: Users, href: "/dashboard/workflow" },
  { title: "Find Clients", icon: Search, href: "/dashboard/leads" },
  { title: "Billing", icon: CreditCard, href: "/dashboard/billing" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  { title: "Team", icon: Users, href: "/dashboard/team", planRequired: "agency" },
  { title: "Help & Docs", icon: HelpCircle, href: "/dashboard/help" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const userPlan = "pro" // This would come from user context/API

  return (
    <TooltipProvider delayDuration={300}>
      <div className="fixed left-0 top-20 w-16 bg-[#3C3CFF] rounded-r-3xl flex flex-col items-center py-8 space-y-6 shadow-xl z-50">
        {/* Navigation Items */}
        <div className="flex flex-col space-y-4">
          {navigationItems.map((item) => {
            // Hide team item if not on agency plan
            if (item.planRequired === "agency" && userPlan !== "agency") {
              return null
            }

            const isActive = pathname === item.href

            return (
              <Tooltip key={item.title}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${
                      isActive 
                        ? 'bg-white text-[#3C3CFF] shadow-md' 
                        : 'text-white/80 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-gray-900 text-white border-gray-700 shadow-lg">
                  <p className="font-medium">{item.title}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
