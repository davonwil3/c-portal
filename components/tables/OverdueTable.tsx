import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Invoice, formatCurrency } from "@/lib/analytics"
import { AlertTriangle, ExternalLink } from "lucide-react"

interface OverdueTableProps {
  items: Invoice[]
  onViewAll?: () => void
}

export function OverdueTable({ items, onViewAll }: OverdueTableProps) {
  if (items.length === 0) {
    return (
      <Card className="bg-white border-0 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Overdue Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No overdue invoices</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-gray-900">Overdue Invoices</CardTitle>
        {onViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((invoice) => {
            const daysOverdue = Math.ceil(
              (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            )
            
            return (
              <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                    <Badge variant="destructive" className="text-xs">
                      {invoice.clientName}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{invoice.projectName}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</div>
                  <div className="text-sm text-red-600">
                    {daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="ml-2">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
