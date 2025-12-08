"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface ContractSignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: any
  onSign: (signatureName: string, signatureDate: string, clientName?: string) => Promise<void>
  brandColor?: string
  clientName?: string
  onClientNameChange?: (name: string) => void
  isClient?: boolean // Whether this is a client signing (vs freelancer)
}

export function ContractSignatureModal({
  open,
  onOpenChange,
  contract,
  onSign,
  brandColor = "#3C3CFF",
  clientName: initialClientName = "",
  onClientNameChange,
  isClient = false
}: ContractSignatureModalProps) {
  const [signatureName, setSignatureName] = useState("")
  const [clientName, setClientName] = useState("")
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0])
  const [isSigning, setIsSigning] = useState(false)

  const handleSign = async () => {
    if (!signatureName.trim()) {
      toast.error('Please enter your full name')
      return
    }

    if (!signatureDate) {
      toast.error('Please enter a date')
      return
    }

    if (isClient && !clientName.trim()) {
      toast.error('Please enter client name')
      return
    }

    try {
      setIsSigning(true)
      await onSign(signatureName.trim(), signatureDate, isClient ? clientName.trim() : undefined)
      setSignatureName("")
      setClientName("")
      setSignatureDate(new Date().toISOString().split('T')[0])
      onOpenChange(false)
    } catch (error) {
      console.error('Error signing contract:', error)
      // Error handling is done in the onSign callback
    } finally {
      setIsSigning(false)
    }
  }

  const handleCancel = () => {
    setSignatureName("")
    setClientName("")
    setSignatureDate(new Date().toISOString().split('T')[0])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Sign {contract?.name || 'Contract'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <p className="text-sm text-gray-600">
            Type your full legal name below. This will act as your electronic signature.
          </p>
          
          {/* Client Name Field - Only shown for clients */}
          {isClient && (
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="signatureName">Your Full Name *</Label>
            <Input
              id="signatureName"
              value={signatureName}
              onChange={(e) => setSignatureName(e.target.value)}
              placeholder="Enter your full legal name"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && signatureName.trim() && signatureDate) {
                  handleSign()
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signatureDate">Date *</Label>
            <Input
              id="signatureDate"
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
            />
          </div>

          {signatureName && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <p className="text-xs text-gray-600 mb-2">Your signature will appear as:</p>
              <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                {signatureName}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSign}
            disabled={!signatureName.trim() || !signatureDate || (isClient && !clientName.trim()) || isSigning}
            style={{ backgroundColor: brandColor }}
          >
            {isSigning ? 'Signing...' : 'Sign Contract'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

