import { Users } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ClientBreakdownProps {
  data: Array<{
    client: string
    total: number
    count: number
  }>
}

const COLORS = [
  'hsl(239, 84%, 67%)',
  'hsl(243, 75%, 59%)', 
  'hsl(262, 83%, 58%)',
  'hsl(270, 95%, 75%)',
  'hsl(280, 87%, 65%)',
  'hsl(290, 70%, 70%)',
  'hsl(250, 80%, 75%)'
]

export function ClientBreakdown({ data }: ClientBreakdownProps) {
  const safeData = data && data.length > 0 ? data : []
  const topClients = safeData.slice(0, 7)
  const totalRevenue = topClients.reduce((sum, item) => sum + item.total, 0)

  if (safeData.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Client</CardTitle>
          <CardDescription>Top clients by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No client data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Client</CardTitle>
        <CardDescription>Top clients by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topClients.map((item, index) => {
            const percentage = ((item.total / totalRevenue) * 100).toFixed(1)
            return (
              <div key={item.client} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.client}</p>
                    <p className="text-xs text-gray-500">{item.count} invoices</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-semibold text-gray-900">${item.total.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{percentage}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
