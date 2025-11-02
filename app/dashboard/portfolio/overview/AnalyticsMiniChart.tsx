"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3 } from "lucide-react"

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
  const maxValue = Math.max(...mockData.map(d => Math.max(d.views, d.leads)))

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

      {/* Simple Bar Chart */}
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-2 h-48">
          {mockData.map((data, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col gap-1 items-center h-full justify-end">
                {/* Views Bar */}
                <div 
                  className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer group relative"
                  style={{ height: `${(data.views / maxValue) * 100}%` }}
                  title={`${data.views} views`}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.views} views
                  </div>
                </div>
                {/* Leads Bar */}
                <div 
                  className="w-full bg-purple-500 rounded-t hover:bg-purple-600 transition-all cursor-pointer group relative"
                  style={{ height: `${(data.leads / maxValue) * 100}%`, minHeight: '8px' }}
                  title={`${data.leads} leads`}
                >
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.leads} leads
                  </div>
                </div>
              </div>
              <span className="text-xs text-gray-600 font-medium">{data.day}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Views</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Leads</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

