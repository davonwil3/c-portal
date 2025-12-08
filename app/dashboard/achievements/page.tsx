"use client"

import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

export default function AchievementsPage() {
  return (
    <DashboardLayout title="Achievements" subtitle="Track your progress and unlock achievements">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Achievements & Progress</CardTitle>
                <CardDescription>
                  Level up and unlock achievements as you use the platform
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Coming Soon</p>
              <p className="text-sm">Achievements and progress tracking will be available here.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
