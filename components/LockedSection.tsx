import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, LucideIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Plan, getUpgradeTarget } from "@/lib/analytics-plan"

interface LockedSectionProps {
  title: string
  description: string
  icon?: LucideIcon
  children?: ReactNode // Optional blurred preview content
  plan: Plan
  upgradeMessage?: string
  className?: string
}

export function LockedSection({
  title,
  description,
  icon: Icon,
  children,
  plan,
  upgradeMessage,
  className
}: LockedSectionProps) {
  const router = useRouter()
  const upgradeTarget = getUpgradeTarget(plan)
  const targetPlanName = upgradeTarget === 'pro' ? 'Pro' : 'Premium'

  const handleUpgrade = () => {
    router.push('/dashboard/settings?tab=billing')
  }

  return (
    <Card className={`bg-white border-0 shadow-sm rounded-2xl relative overflow-hidden ${className}`}>
      {children && (
        <div className="absolute inset-0 blur-sm opacity-30 pointer-events-none z-0">
          {children}
        </div>
      )}
      <div className="relative z-10 bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className="h-5 w-5 text-gray-400" />
            ) : (
              <Lock className="h-5 w-5 text-gray-400" />
            )}
            <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Lock className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">
                {upgradeMessage || `${targetPlanName} unlocks ${title.toLowerCase()}.`}
              </p>
              <Button
                onClick={handleUpgrade}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
              >
                Upgrade to {targetPlanName}
              </Button>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}

