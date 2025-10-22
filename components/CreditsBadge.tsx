"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CreditsPanel } from "./CreditsPanel"
import { Coins, Zap } from "lucide-react"

interface CreditsBadgeProps {
  count: number
  lowThreshold?: number
}

export function CreditsBadge({ count, lowThreshold = 10 }: CreditsBadgeProps) {
  const [open, setOpen] = useState(false)

  const getVariant = () => {
    if (count === 0) return "destructive"
    if (count <= lowThreshold) return "secondary"
    return "default"
  }

  const getIcon = () => {
    if (count === 0) return <Zap className="h-3 w-3" />
    if (count <= lowThreshold) return <Zap className="h-3 w-3" />
    return <Coins className="h-3 w-3" />
  }

  const getTextColor = () => {
    if (count === 0) return "text-red-600"
    if (count <= lowThreshold) return "text-orange-600"
    return "text-gray-700"
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center space-x-2 transition-all hover:shadow-md border-0 shadow-sm ${
            count === 0 
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700' 
              : count <= lowThreshold 
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700'
                : 'bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] text-white hover:from-[#2D2DCC] hover:to-[#4F46E5]'
          }`}
        >
          {getIcon()}
          <span className="text-sm font-semibold">
            {count} Credits
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <CreditsPanel 
          count={count} 
          onClose={() => setOpen(false)}
          lowThreshold={lowThreshold}
        />
      </PopoverContent>
    </Popover>
  )
}
