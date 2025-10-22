import { ReactNode } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SectionProps {
  title: string
  children: ReactNode
  actions?: ReactNode
  showDateRange?: boolean
  className?: string
}

export function Section({ 
  title, 
  children, 
  actions, 
  showDateRange = false, 
  className 
}: SectionProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <div className="flex items-center space-x-4">
          {showDateRange && (
            <Select defaultValue="12m">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          )}
          {actions}
        </div>
      </div>
      {children}
    </div>
  )
}
