"use client"
import React, { useState } from "react"
import {
  Home,
  Search,
  TrendingUp,
  Users,
  MessageSquare,
  Calendar,
  Zap,
  Briefcase,
  Clock,
  CreditCard,
  BarChart3,
  Trophy,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Custom question mark icon (just the ? without circle)
const QuestionMark = React.forwardRef<SVGSVGElement, { className?: string }>(
  ({ className }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  )
)
QuestionMark.displayName = "QuestionMark"

// Navigation items
const navigationItems = [
  { title: "Home", icon: Home, href: "/dashboard" },
  { title: "Lead Workflow", icon: Search, href: "/dashboard/lead-workflow" },
  { title: "Grow", icon: TrendingUp, href: "/dashboard/grow", dataHelp: "sidebar-grow" },
  { title: "Client Workflow", icon: Users, href: "/dashboard/workflow" },
  { title: "Messages", icon: MessageSquare, href: "/dashboard/messages" },
  { title: "Scheduler", icon: Calendar, href: "/dashboard/schedule" },
  { title: "Automations", icon: Zap, href: "/dashboard/automations" },
  { title: "Portfolio", icon: Briefcase, href: "/dashboard/portfolio" },
  { title: "Time Tracker", icon: Clock, href: "/dashboard/time-tracking" },
  { title: "Billing", icon: CreditCard, href: "/dashboard/billing" },
  { title: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
  { title: "Achievements", icon: Trophy, href: "/dashboard/achievements" },
  { title: "Settings", icon: Settings, href: "/dashboard/settings" },
  { title: "Help", icon: QuestionMark, href: "/dashboard/help" },
]

export function AppSidebar({ onHoverChange }: { onHoverChange?: (isHovered: boolean) => void }) {
  const pathname = usePathname()
  const [isHovered, setIsHovered] = useState(false)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHoverChange?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHoverChange?.(false)
  }

  return (
    <div 
      className="fixed left-0 top-20 bottom-4 bg-[#3C3CFF] rounded-r-3xl flex flex-col items-center py-6 shadow-xl z-50 overflow-hidden"
      style={{
        width: isHovered ? '180px' : '64px',
        transition: 'width 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: 'calc(100vh - 6rem)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Navigation Items */}
      <div className="flex flex-col space-y-3 w-full items-center overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent px-1">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link
              key={item.title}
              href={item.href}
              data-help={
                item.title === "Lead Workflow" ? "sidebar-lead-workflow" :
                item.title === "Client Workflow" ? "sidebar-client-workflow" :
                item.title === "Billing" ? "sidebar-billing" :
                item.title === "Time Tracker" ? "sidebar-time-tracking" :
                item.title === "Portfolio" ? "sidebar-portfolio" :
                item.title === "Automations" ? "sidebar-automations" :
                item.title === "Scheduler" ? "sidebar-scheduler" :
                item.title === "Messages" ? "sidebar-messages" :
                item.title === "Grow" ? "sidebar-grow" :
                item.title === "Achievements" ? "sidebar-achievements" :
                item.dataHelp || undefined
              }
              className={`relative flex items-center rounded-xl transition-colors duration-200 h-10 ${
                isActive 
                  ? 'bg-white text-[#3C3CFF] shadow-md' 
                  : 'text-white/80 hover:bg-white/20 hover:text-white'
              }`}
              style={{
                width: isHovered ? 'calc(100% - 16px)' : '40px',
                marginLeft: isHovered ? '8px' : '0',
                marginRight: isHovered ? '8px' : '0',
                paddingLeft: isHovered ? '12px' : '0',
                paddingRight: isHovered ? '12px' : '0',
                justifyContent: isHovered ? 'flex-start' : 'center',
                alignItems: 'center',
                display: 'flex',
                transition: 'width 150ms cubic-bezier(0.4, 0, 0.2, 1), margin 150ms cubic-bezier(0.4, 0, 0.2, 1), padding 150ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <div 
                className="flex items-center justify-center"
                style={{
                  width: isHovered ? 'auto' : '100%',
                  height: '100%',
                }}
              >
                <item.icon className={`flex-shrink-0 ${item.title === "Help" ? "h-7 w-7" : "h-5 w-5"}`} />
              </div>
              <span 
                className={`font-medium text-sm whitespace-nowrap ${
                  isHovered 
                    ? 'opacity-100' 
                    : 'opacity-0 w-0 overflow-hidden'
                }`}
                style={{
                  marginLeft: isHovered ? '12px' : '0',
                  transition: 'opacity 120ms cubic-bezier(0.4, 0, 0.2, 1), width 150ms cubic-bezier(0.4, 0, 0.2, 1), margin-left 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: isHovered ? '40ms' : '0ms',
                }}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
