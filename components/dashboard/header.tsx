"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Moon, Sun, LogOut, User, Settings } from "lucide-react"
import { signOut } from "@/lib/auth"
import { toast } from "sonner"
import Image from "next/image"
import { TimerWidget } from "./TimerWidget"

interface DashboardHeaderProps {
  title?: string
  subtitle?: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)

  const handleSignOut = async () => {
    try {
      const loadingToast = toast.loading("Signing you out...")
      
      const { error } = await signOut()
      
      toast.dismiss(loadingToast)
      
      if (error) {
        toast.error("Error signing out. Please try again.")
      } else {
        toast.success("Signed out successfully")
        window.location.href = '/auth'
      }
    } catch (error) {
      toast.error("Error signing out. Please try again.")
    }
  }

  return (
    <header className="z-40">
      <div className="flex items-center justify-between py-4 w-full px-8 mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Image 
              src="/jolixlogo.png" 
              alt="Jolix Logo" 
              width={48} 
              height={48}
              className="w-12 h-12"
            />
            <span className="text-2xl font-bold text-gray-900">Jolix</span>
          </div>
          {(title || subtitle) && (
            <div className="hidden md:block">
              {title && <h1 className="text-2xl font-bold text-gray-900">{title}</h1>}
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <TimerWidget />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-gray-600 hover:text-gray-900"
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-[#3C3CFF] rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                  <AvatarFallback className="bg-[#3C3CFF] text-white">SJ</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
