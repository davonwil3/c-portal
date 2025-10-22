'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'
import { SignaturePadComponent } from './signature-pad'
import { toast } from 'sonner'

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSignatureSave: (signatureData: string) => void
  contractTitle?: string
}

export function SignatureModal({ 
  isOpen, 
  onClose, 
  onSignatureSave,
  contractTitle = "Contract"
}: SignatureModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (signatureData: string) => {
    setIsLoading(true)
    try {
      await onSignatureSave(signatureData)
      toast.success("Signature saved successfully!")
      onClose()
    } catch (error) {
      toast.error("Failed to save signature. Please try again.")
      console.error('Signature save error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Sign {contractTitle}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <SignaturePadComponent
            onSave={handleSave}
            onCancel={handleCancel}
            width={600}
            height={200}
            className="w-full"
          />
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="text-sm text-gray-600">Saving signature...</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
