'use client'

import { useRef, useEffect, useState } from 'react'
import SignaturePad from 'signature_pad'
import { Button } from './button'
import { RotateCcw, Check } from 'lucide-react'

interface SignaturePadProps {
  onSave: (signatureData: string) => void
  onCancel: () => void
  width?: number
  height?: number
  className?: string
}

export function SignaturePadComponent({ 
  onSave, 
  onCancel, 
  width = 600, 
  height = 200,
  className = ""
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePad = useRef<SignaturePad | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      signaturePad.current = new SignaturePad(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        velocityFilterWeight: 0.7,
        onBegin: () => {
          console.log('Signature pad onBegin fired')
          setIsDrawing(true)
        },
      })

      // Add event listener for endStroke (this is the correct event)
      const handleEndStroke = () => {
        console.log('endStroke event fired')
        setIsDrawing(false)
        // Check if signature pad has content using isEmpty()
        if (signaturePad.current && !signaturePad.current.isEmpty()) {
          console.log('Signature pad is not empty, setting hasSignature to true')
          setHasSignature(true)
        } else {
          console.log('Signature pad is empty')
        }
      }

      // Add the event listener
      signaturePad.current.addEventListener('endStroke', handleEndStroke)

      return () => {
        if (signaturePad.current) {
          signaturePad.current.removeEventListener('endStroke', handleEndStroke)
          signaturePad.current.off()
        }
      }
    }
  }, [])

  const handleSave = () => {
    if (hasSignature && signaturePad.current) {
      const signatureData = signaturePad.current.toDataURL('image/png')
      onSave(signatureData)
    }
  }

  const handleClear = () => {
    signaturePad.current?.clear()
    setHasSignature(false)
  }

  const handleCancel = () => {
    onCancel()
  }

  // Check if signature pad is empty using the library's method
  const isEmpty = () => {
    if (signaturePad.current) {
      const isEmptyResult = signaturePad.current.isEmpty()
      console.log('isEmpty() result:', isEmptyResult)
      return isEmptyResult
    }
    return true
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Instructions */}
      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <p className="font-medium mb-1">Please sign your name in the box below:</p>
        <p>• Use your mouse or touch to draw your signature</p>
        <p>• Click "Clear" to start over if needed</p>
        <p>• Click "Save Signature" when you're satisfied</p>
      </div>

      {/* Signature Canvas */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white p-4 relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="w-full h-full cursor-crosshair touch-none"
          style={{ 
            maxWidth: '100%', 
            height: `${height}px`,
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: isDrawing ? '#f0f9ff' : 'white'
          }}
        />
        {isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              ✍️ Drawing...
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={isEmpty()}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Clear
          </Button>
          
          {/* Debug info */}
          <div className="text-xs text-gray-500">
            Debug: hasSignature={hasSignature.toString()}, isEmpty()={isEmpty().toString()}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isEmpty()}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Check className="h-4 w-4" />
            Save Signature
          </Button>
        </div>
      </div>
    </div>
  )
}
