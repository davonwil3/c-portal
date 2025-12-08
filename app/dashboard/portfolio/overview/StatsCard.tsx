"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface StatsCardProps {
  title: string
  value: string | number
  change?: number
  icon: LucideIcon
}

export function StatsCard({ title, value, change, icon: Icon }: StatsCardProps) {
  const isPositive = change && change >= 0
  
  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500 ml-1">vs last 7 days</span>
            </div>
          )}
        </div>
        <div className="rounded-full p-3 bg-gradient-to-br from-purple-100 to-blue-100">
          <Icon className="w-6 h-6 text-purple-600" />
        </div>
      </div>
    </Card>
  )
}

