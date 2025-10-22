"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  Coins, 
  Clock, 
  CreditCard, 
  Settings, 
  X,
  TrendingUp,
  Zap
} from "lucide-react"

interface CreditsPanelProps {
  count: number
  onClose: () => void
  lowThreshold?: number
}

export function CreditsPanel({ count, onClose, lowThreshold = 10 }: CreditsPanelProps) {
  // Mock data
  const resetsIn = "12d"
  const recentUsage = [
    { action: "Viewed r/forhire post", credits: -1, time: "2h ago" },
    { action: "Opened lead details", credits: -1, time: "4h ago" },
    { action: "Viewed r/DesignJobs post", credits: -1, time: "6h ago" },
    { action: "Opened lead details", credits: -1, time: "1d ago" },
    { action: "Viewed r/freelance post", credits: -1, time: "2d ago" }
  ]

  const handleTopUp = () => {
    toast.success("Top Up clicked - would open payment modal")
    onClose()
  }

  const handleManagePlan = () => {
    toast.success("Manage Plan clicked - would open billing page")
    onClose()
  }

  const getStatusColor = () => {
    if (count === 0) return "text-red-600"
    if (count <= lowThreshold) return "text-orange-600"
    return "text-green-600"
  }

  const getStatusIcon = () => {
    if (count === 0) return <Zap className="h-4 w-4 text-red-600" />
    if (count <= lowThreshold) return <Zap className="h-4 w-4 text-orange-600" />
    return <TrendingUp className="h-4 w-4 text-green-600" />
  }

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-[#3C3CFF]" />
          <h3 className="font-semibold text-gray-900">Credits</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Balance Section */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-3xl font-bold text-gray-900">{count}</div>
            <div className="text-sm text-gray-500">credits remaining</div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Resets in {resetsIn}</span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {getStatusIcon()}
              <span className={`text-xs font-medium ${getStatusColor()}`}>
                {count === 0 ? "Out of credits" : count <= lowThreshold ? "Running low" : "Good"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            onClick={handleTopUp}
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
            size="sm"
          >
            <CreditCard className="h-3 w-3 mr-1" />
            Top Up
          </Button>
          <Button
            onClick={handleManagePlan}
            variant="outline"
            size="sm"
          >
            <Settings className="h-3 w-3 mr-1" />
            Manage Plan
          </Button>
        </div>
      </div>

      <Separator />

      {/* Recent Usage */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">Recent Usage</h4>
        <div className="space-y-3">
          {recentUsage.map((usage, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex-1">
                <div className="text-gray-900">{usage.action}</div>
                <div className="text-gray-500 text-xs">{usage.time}</div>
              </div>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  usage.credits < 0 
                    ? 'border-red-200 text-red-700 bg-red-50' 
                    : 'border-green-200 text-green-700 bg-green-50'
                }`}
              >
                {usage.credits > 0 ? '+' : ''}{usage.credits}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
