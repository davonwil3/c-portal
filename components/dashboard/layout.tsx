"use client"

import type React from "react"
import { useState } from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./sidebar"
import { DashboardHeader } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [isSidebarHovered, setIsSidebarHovered] = useState(false)
  
  // Sidebar: 64px collapsed, 180px expanded. Gap: 48px
  // Padding = sidebar width + gap
  const paddingLeft = isSidebarHovered ? '228px' : '112px' // 180px + 48px = 228px, 64px + 48px = 112px
  // Header uses collapsed width + gap + p-8 padding (32px) to align with main content's left edge
  const headerPaddingLeft = '144px' // 112px (collapsed) + 32px (p-8) = 144px

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 w-full">
        <AppSidebar onHoverChange={setIsSidebarHovered} />
        {/* Header - fixed padding, not affected by sidebar expansion, aligns with main content */}
      
          <DashboardHeader title={title} subtitle={subtitle} />
       
        {/* Main content - animated padding */}
        <div 
          className="pr-8"
          style={{
            paddingLeft,
            transition: 'padding-left 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <main className="py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
