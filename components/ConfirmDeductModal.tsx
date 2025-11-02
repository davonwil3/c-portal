"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Coins, Zap, CreditCard, AlertCircle } from "lucide-react"

interface ConfirmDeductModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  leadTitle: string
  currentBalance: number
  deductionAmount?: number
  source?: string
}

export function ConfirmDeductModal({ 
  open, 
  onClose, 
  onConfirm, 
  leadTitle, 
  currentBalance, 
  deductionAmount = 1, 
  source
}: ConfirmDeductModalProps) {
  const newBalance = currentBalance - deductionAmount
  const isOutOfCredits = currentBalance === 0

  const handleConfirm = () => {
    onConfirm()
    onClose()
    toast.success(`Opened lead: "${leadTitle}"`)
  }

  const handleTopUp = () => {
    toast.success("Top Up clicked - would open payment modal")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-[#3C3CFF]" />
            <span>Open Lead</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Lead Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                {leadTitle}
              </h4>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {source || 'Source'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Credit Deduction Info */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Credit Deduction</span>
            </div>
            <p className="text-sm text-blue-700 mb-3">
              Open this lead for {deductionAmount} credit{deductionAmount > 1 ? 's' : ''}?
            </p>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Current balance:</span>
                <Badge variant="outline" className="bg-white">
                  {currentBalance} credits
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">After:</span>
                <Badge 
                  variant="outline" 
                  className={`${
                    newBalance <= 0 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-white'
                  }`}
                >
                  {newBalance} credits
                </Badge>
              </div>
            </div>
          </div>

          {/* Out of Credits Warning */}
          {isOutOfCredits && (
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Zap className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-900">No Credits Available</span>
              </div>
              <p className="text-sm text-red-700 mb-3">
                You need credits to view lead details. Top up your account to continue.
              </p>
              <Button
                onClick={handleTopUp}
                className="bg-red-600 hover:bg-red-700 text-white w-full"
                size="sm"
              >
                <CreditCard className="h-3 w-3 mr-1" />
                Top Up Credits
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {!isOutOfCredits && (
            <Button 
              onClick={handleConfirm} 
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
            >
              <Coins className="h-3 w-3 mr-1" />
              Confirm ({deductionAmount} credit{deductionAmount > 1 ? 's' : ''})
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
