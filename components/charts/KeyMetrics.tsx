import { TrendingUp, TrendingDown, Clock, Percent, DollarSign, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface KeyMetricsProps {
  collectionRate: number // percentage (0-100)
  avgPaymentDays: number // days
  momGrowth: number // percentage change (can be negative)
  newClients: number // count
}

export function KeyMetrics({ collectionRate, avgPaymentDays, momGrowth, newClients }: KeyMetricsProps) {
  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">Key Metrics</CardTitle>
        <CardDescription>Important performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Collection Rate */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Percent className="h-4 w-4 text-green-600" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">{collectionRate.toFixed(1)}%</p>
              </div>
              {collectionRate >= 90 ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                  Excellent
                </div>
              ) : collectionRate >= 70 ? (
                <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold bg-blue-100 px-2 py-1 rounded-full">
                  Good
                </div>
              ) : collectionRate >= 50 ? (
                <div className="flex items-center gap-1 text-amber-600 text-xs font-semibold bg-amber-100 px-2 py-1 rounded-full">
                  Fair
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-100 px-2 py-1 rounded-full">
                  <TrendingDown className="h-3 w-3" />
                  Poor
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Invoices paid on time</p>
          </div>

          {/* Average Payment Time */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">Avg Payment Time</p>
                <p className="text-2xl font-bold text-gray-900">{avgPaymentDays.toFixed(0)} <span className="text-sm font-normal text-gray-600">days</span></p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Time to receive payment</p>
          </div>

          {/* MoM Growth */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-50 to-violet-50 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-purple-600" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">MoM Growth</p>
                <p className="text-2xl font-bold text-gray-900">
                  {momGrowth > 0 ? '+' : ''}{momGrowth.toFixed(1)}%
                </p>
              </div>
              {momGrowth > 0 ? (
                <div className="flex items-center gap-1 text-green-600 text-xs font-semibold bg-green-100 px-2 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" />
                </div>
              ) : momGrowth < 0 ? (
                <div className="flex items-center gap-1 text-red-600 text-xs font-semibold bg-red-100 px-2 py-1 rounded-full">
                  <TrendingDown className="h-3 w-3" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-600 text-xs font-semibold bg-gray-100 px-2 py-1 rounded-full">
                  Stable
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Revenue vs last month</p>
          </div>

          {/* New Clients This Month */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-600 mb-1">New Clients</p>
                <p className="text-2xl font-bold text-gray-900">{newClients}</p>
              </div>
              {newClients > 0 && (
                <div className="flex items-center gap-1 text-orange-600 text-xs font-semibold bg-orange-100 px-2 py-1 rounded-full">
                  This month
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">First invoice this month</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

