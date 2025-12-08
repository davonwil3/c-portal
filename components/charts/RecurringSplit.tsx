import { Users } from "lucide-react"
import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface RecurringSplitProps {
  data: {
    returningCount: number
    newCount: number
  }
}

const chartConfig = {
  value: {
    label: "Clients",
  },
} satisfies ChartConfig

const COLORS = ['hsl(239, 84%, 67%)', 'hsl(243, 75%, 59%)']

export function RecurringSplit({ data }: RecurringSplitProps) {
  console.log('RecurringSplit received data:', data)
  
  // Use actual data, show empty state if no data
  const safeData = data || { returningCount: 0, newCount: 0 }
  
  const chartData = [
    { name: 'Returning Clients', value: safeData.returningCount, fill: COLORS[0] },
    { name: 'New Clients', value: safeData.newCount, fill: COLORS[1] }
  ]
  
  console.log('RecurringSplit chartData:', chartData)

  const total = safeData.returningCount + safeData.newCount
  
  if (total === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Client Types</CardTitle>
          <CardDescription>Breakdown of returning vs new clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No client type data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Client Types</CardTitle>
        <CardDescription>Breakdown of returning vs new clients</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart accessibilityLayer>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                content={<ChartTooltipContent />}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 space-y-2 text-sm">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-gray-600">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}