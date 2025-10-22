import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  hintIcon?: LucideIcon
  trendBadge?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
  }
  className?: string
}

export function MetricCard({ 
  title, 
  value, 
  hintIcon: HintIcon, 
  trendBadge, 
  className 
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (!trendBadge) return null
    
    switch (trendBadge.direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />
      case 'down':
        return <TrendingDown className="h-3 w-3" />
      default:
        return null
    }
  }

  const getTrendColor = () => {
    if (!trendBadge) return ''
    
    switch (trendBadge.direction) {
      case 'up':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'down':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  return (
    <Card className={`bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        {HintIcon && <HintIcon className="h-4 w-4 text-[#3C3CFF]" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
        {trendBadge && (
          <Badge variant="outline" className={`text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">{trendBadge.value}</span>
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
