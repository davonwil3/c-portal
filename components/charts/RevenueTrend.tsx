import { TrendingUp } from "lucide-react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface RevenueTrendProps {
  data: Array<{
    month: string
    paidRevenue: number
    createdCount: number
    isCurrentMonth?: boolean
  }>
}

const chartConfig = {
  paidRevenue: {
    label: "Paid Revenue",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function RevenueTrend({ data }: RevenueTrendProps) {
  const chartData = data && data.length > 0 ? data : []
  
  // Show empty state if no data
  if (chartData.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue and invoice creation trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No revenue trend data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  // Find the index of the current month for the tooltip and note
  const currentMonthIndex = chartData.findIndex(d => d.isCurrentMonth)
  
  console.log('=== REVENUE TREND DEBUG ===')
  console.log('Data received:', chartData)
  console.log('Data points:', chartData.length)
  console.log('Current month index:', currentMonthIndex)
  console.log('Months:', chartData.map(d => d.month))
  console.log('Current month flag:', chartData.map(d => ({ month: d.month, isCurrent: d.isCurrentMonth })))
  console.log('==========================')
  
  // Custom tooltip that shows "(incomplete)" for current month
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const item = chartData.find(d => d.month === label)
      
      // Parse the month key correctly: "2025-08" -> August 2025
      const [year, month] = label.split('-')
      const date = new Date(parseInt(year), parseInt(month) - 1, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      const displayLabel = item?.isCurrentMonth ? `${monthName} (incomplete)` : monthName
      
      // Filter payload to only show revenue
      const filteredPayload = payload.filter((p: any) => p.dataKey === 'paidRevenue')
      
      return (
        <ChartTooltipContent 
          active={active} 
          payload={filteredPayload} 
          label={displayLabel}
        />
      )
    }
    return null
  }
  
  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trend</CardTitle>
        <CardDescription>Monthly revenue and invoice creation trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={chartData} 
              accessibilityLayer
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis 
                dataKey="month" 
                className="text-xs fill-gray-600"
                tickFormatter={(value) => {
                  // value is "YYYY-MM" format like "2025-08"
                  const [year, month] = value.split('-')
                  // Create date using local time - month is 1-indexed in the string but 0-indexed in Date
                  const date = new Date(parseInt(year), parseInt(month) - 1, 1)
                  return date.toLocaleDateString('en-US', { month: 'short' })
                }}
              />
              <YAxis 
                className="text-xs fill-gray-600"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="linear"
                dataKey="paidRevenue"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      {currentMonthIndex > -1 && (
        <CardFooter className="pt-0">
          <div className="flex w-full items-start gap-2 text-sm">
            <div className="flex items-center gap-2 leading-none text-muted-foreground">
              <span className="text-xs">
                * Current month data is incomplete
              </span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}