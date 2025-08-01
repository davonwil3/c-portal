import { DashboardLayout } from "@/components/dashboard/layout"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function InvoicingLoading() {
  return (
    <DashboardLayout title="All Invoices" subtitle="Manage and track all your invoices in one place">
      <div className="space-y-8">
        {/* Dashboard Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls Skeleton */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            <Skeleton className="h-10 w-80 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-40 rounded-xl" />
            </div>
          </div>
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>

        {/* Table Skeleton */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 w-12">
                      <Skeleton className="h-4 w-4" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-20" />
                    </th>
                    <th className="text-left p-4">
                      <Skeleton className="h-4 w-16" />
                    </th>
                    <th className="text-left p-4 w-20">
                      <Skeleton className="h-4 w-16" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="p-4">
                        <Skeleton className="h-4 w-4" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </td>
                      <td className="p-4">
                        <Skeleton className="h-8 w-8 rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
