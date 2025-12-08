"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

// Mock data for the chart
const mockData = [
  { day: 'Mon', views: 45, leads: 3 },
  { day: 'Tue', views: 52, leads: 4 },
  { day: 'Wed', views: 38, leads: 2 },
  { day: 'Thu', views: 65, leads: 5 },
  { day: 'Fri', views: 58, leads: 4 },
  { day: 'Sat', views: 42, leads: 3 },
  { day: 'Sun', views: 48, leads: 3 }
]

export function AnalyticsMiniChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Analytics Snapshot</h2>
          <p className="text-sm text-gray-600 mt-1">Views vs Leads — Last 7 Days</p>
        </div>
        <Button variant="outline" size="sm">
          <BarChart3 className="w-4 h-4 mr-2" />
          View Full Analytics
        </Button>
      </div>

      {/* Recharts Bar Chart */}
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="day" 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px'
            }} 
          />
          <Legend 
            wrapperStyle={{ fontSize: '14px' }}
            iconType="circle"
          />
          <Bar 
            dataKey="views" 
            fill="#3B82F6" 
            radius={[8, 8, 0, 0]}
            name="Views"
          />
          <Line 
            type="monotone" 
            dataKey="leads" 
            stroke="#8B5CF6" 
            strokeWidth={3}
            dot={{ fill: '#8B5CF6', r: 4 }}
            name="Leads"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}

