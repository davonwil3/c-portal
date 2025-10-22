"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { AlertTriangle, Zap, TrendingUp } from "lucide-react"

interface CreditsBannerProps {
  count: number
  lowThreshold?: number
}

export function CreditsBanner({ count, lowThreshold = 10 }: CreditsBannerProps) {
  const handleTopUp = () => {
    toast.success("Top Up clicked - would open payment modal")
  }

  const handleUpgrade = () => {
    toast.success("Upgrade clicked - would open pricing page")
  }

  if (count === 0) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">
                  You're out of credits
                </h3>
                <p className="text-sm text-red-700">
                  Top Up to keep viewing leads and growing your business
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTopUp}
                className="bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Top Up
              </Button>
              <Button
                onClick={handleUpgrade}
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                size="sm"
              >
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (count <= lowThreshold) {
    return (
      <Card className="mb-6 bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900">
                  Running low: {count} credits left
                </h3>
                <p className="text-sm text-orange-700">
                  Consider a Top Up to avoid interruption
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleTopUp}
                className="bg-orange-600 hover:bg-orange-700 text-white"
                size="sm"
              >
                Top Up
              </Button>
              <Button
                onClick={handleUpgrade}
                variant="outline"
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
                size="sm"
              >
                Upgrade
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
