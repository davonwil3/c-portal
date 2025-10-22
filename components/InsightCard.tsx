import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

interface InsightCardProps {
  text: string
  className?: string
}

export function InsightCard({ text, className }: InsightCardProps) {
  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Lightbulb className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Insight</h3>
            <p className="text-gray-700 leading-relaxed">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
