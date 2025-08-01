import { DashboardLayout } from "@/components/dashboard/layout"
import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and portal preferences">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Tabs skeleton */}
        <div className="flex space-x-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-20" />
          ))}
        </div>

        {/* Content skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    </DashboardLayout>
  )
}
