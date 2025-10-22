import { Package } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ProjectBreakdownProps {
  data: Array<{
    project: string
    total: number
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

export function ProjectBreakdown({ data }: ProjectBreakdownProps) {
  console.log('ProjectBreakdown received data:', data)
  
  // Add fallback test data
  const testData = [
    { project: 'Website Design', total: 5000 },
    { project: 'Mobile App', total: 8000 },
    { project: 'SEO', total: 3000 },
    { project: 'Marketing', total: 4000 }
  ]
  const safeData = data && data.length > 0 ? data : testData
  
  const topProjects = safeData.slice(0, 7)
  const totalRevenue = topProjects.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Project</CardTitle>
        <CardDescription>Top projects by revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topProjects.map((item, index) => {
            const percentage = ((item.total / totalRevenue) * 100).toFixed(1)
            return (
              <div key={item.project} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 flex-1">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.project}</p>
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
