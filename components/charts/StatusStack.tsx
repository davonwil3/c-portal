import { BarChart3 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, Tooltip, ResponsiveContainer } from "recharts"
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

interface StatusStackProps {
  data: {
    paid: number
    pending: number
    overdue: number
    void: number
  }
}

const chartConfig = {
  count: {
    label: "Count",
  },
} satisfies ChartConfig

export function StatusStack({ data }: StatusStackProps) {
  try {
    console.log('StatusStack received data:', data)
    
    // Use actual data, show empty state if no data
    const safeData = data || { paid: 0, pending: 0, overdue: 0, void: 0 }
    
    const chartData = [
      { status: 'Paid', count: safeData.paid, color: 'hsl(142, 71%, 45%)' }, // Green
      { status: 'Pending', count: safeData.pending, color: 'hsl(45, 93%, 47%)' }, // Yellow
      { status: 'Overdue', count: safeData.overdue, color: 'hsl(0, 84%, 60%)' }, // Red
      { status: 'Void', count: safeData.void, color: 'hsl(220, 9%, 46%)' } // Gray
    ]
    
    console.log('StatusStack chartData:', chartData)

    const total = Object.values(safeData).reduce((sum, count) => sum + count, 0)
    
    if (total === 0) {
      return (
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Payment Status</CardTitle>
            <CardDescription>Distribution of invoice payment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <p>No payment status data available</p>
            </div>
          </CardContent>
        </Card>
      )
    }

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Payment Status</CardTitle>
        <CardDescription>Distribution of invoice payment statuses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} accessibilityLayer margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
              <XAxis dataKey="status" className="text-xs fill-gray-600" />
              <YAxis className="text-xs fill-gray-600" domain={[0, 'dataMax']} />
              <Tooltip 
                content={<ChartTooltipContent />}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.status}:</span>
              <span className="font-medium">{item.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
  } catch (error) {
    console.error('StatusStack error:', error)
    return (
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Payment Status</CardTitle>
          <CardDescription>Distribution of invoice payment statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full flex items-center justify-center text-red-500">
            Error loading chart: {error.message}
          </div>
        </CardContent>
      </Card>
    )
  }
}