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
  Home,
  Users,
  Package,
  CreditCard,
  FileText,
  FolderOpen,
  Settings,
  HelpCircle,
  Bot,
  FileSignature,
  Globe,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Navigation items
const navigationItems = [
  { title: "Home", icon: Home, href: "/dashboard" },
  { title: "Clients", icon: Users, href: "/dashboard/clients" },
  { title: "Projects", icon: Package, href: "/dashboard/projects" },
  { title: "Portals", icon: Globe, href: "/dashboard/portals" },
  { title: "Files", icon: FolderOpen, href: "/dashboard/files" },
  { title: "Forms", icon: FileText, href: "/dashboard/forms" },
  { title: "Contracts", icon: FileSignature, href: "/dashboard/contracts" },
  { title: "Invoicing", icon: CreditCard, href: "/dashboard/invoicing" },
  { title: "AI Assistant", icon: Bot, href: "/dashboard/ai-assistant" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  { title: "Team", icon: Users, href: "/dashboard/team", planRequired: "agency" },
  { title: "Help & Docs", icon: HelpCircle, href: "/dashboard/help" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const userPlan = "pro" // This would come from user context/API

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200 p-6">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="text-xl font-bold text-gray-900 group-data-[collapsible=icon]:hidden">ClientPortalHQ</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarMenu className="space-y-2">
          {navigationItems.map((item) => {
            // Hide team item if not on agency plan
            if (item.planRequired === "agency" && userPlan !== "agency") {
              return null
            }

            const isActive = pathname === item.href

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className="w-full justify-start px-3 py-2.5 text-gray-700 hover:bg-[#F0F2FF] hover:text-[#3C3CFF] data-[active=true]:bg-[#F0F2FF] data-[active=true]:text-[#3C3CFF] data-[active=true]:font-medium rounded-xl transition-all duration-200"
                >
                  <Link href={item.href} className="flex items-center space-x-3">
                    <item.icon className="h-5 w-5" />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
