"use client"

import type React from "react"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "./sidebar"
import { DashboardHeader } from "./header"

interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 w-full">
        <AppSidebar />
        <div className="pl-32 pr-8">
          <DashboardHeader title={title} subtitle={subtitle} />
          <main className="py-8">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
