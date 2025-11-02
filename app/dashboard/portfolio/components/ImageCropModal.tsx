"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { X, ZoomIn, ZoomOut, Move } from "lucide-react"

interface ImageCropModalProps {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onCropComplete: (croppedImageUrl: string) => void
  aspectRatio?: number
  cropLabel?: string
  cropWidth?: number
  cropHeight?: number
}

export function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
  aspectRatio,
  cropLabel = "Crop Image",
  cropWidth,
  cropHeight
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0, naturalWidth: 0, naturalHeight: 0 })
  const [isLoading, setIsLoading] = useState(false)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const targetAspect = cropWidth && cropHeight ? cropWidth / cropHeight : aspectRatio || 1

  // Reset when modal opens/closes
  useEffect(() => {
    if (!open) {
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setIsDragging(false)
    }
  }, [open])

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const container = containerRef.current
    if (!container) return

    const containerWidth = container.clientWidth
    const containerHeight = container.clientHeight
    const imageAspect = img.naturalWidth / img.naturalHeight

    let displayWidth, displayHeight

    // Fit image to container
    if (imageAspect > containerWidth / containerHeight) {
      displayWidth = containerWidth
      displayHeight = containerWidth / imageAspect
    } else {
      displayHeight = containerHeight  
      displayWidth = containerHeight * imageAspect
    }

    setImageDimensions({
      width: displayWidth,
      height: displayHeight,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    })

    // Center the image initially
    setCrop({
      x: (containerWidth - displayWidth) / 2,
      y: (containerHeight - displayHeight) / 2
    })
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    let newX = e.clientX - dragStart.x
    let newY = e.clientY - dragStart.y

    // Get crop box dimensions
    const cropBoxWidth = Math.min(imageDimensions.width * zoom, containerRect.width)
    const cropBoxHeight = cropBoxWidth / targetAspect

    // Constrain to container
    const minX = -(imageDimensions.width * zoom - cropBoxWidth) / 2
    const maxX = containerRect.width - cropBoxWidth - minX
    const minY = -(imageDimensions.height * zoom - cropBoxHeight) / 2
    const maxY = containerRect.height - cropBoxHeight - minY

    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    setCrop({ x: newX, y: newY })
  }, [isDragging, dragStart, imageDimensions, zoom, targetAspect])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.1, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.1, 0.5))
  }

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return
    
    setIsLoading(true)

    try {
      const container = containerRef.current.getBoundingClientRect()
      const img = imageRef.current
      
      // Calculate crop box dimensions
      const cropBoxWidth = Math.min(imageDimensions.width * zoom, container.width)
      const cropBoxHeight = cropBoxWidth / targetAspect
      
      // Center of container
      const centerX = container.width / 2
      const centerY = container.height / 2
      
      // Image position relative to container
      const imgX = crop.x
      const imgY = crop.y
      
      // Crop box position (centered in container)
      const cropBoxX = centerX - cropBoxWidth / 2
      const cropBoxY = centerY - cropBoxHeight / 2
      
      // Calculate which part of the image is inside the crop box
      const sourceX = (cropBoxX - imgX) / zoom
      const sourceY = (cropBoxY - imgY) / zoom
      const sourceWidth = cropBoxWidth / zoom
      const sourceHeight = cropBoxHeight / zoom
      
      // Scale to natural image dimensions
      const scaleX = imageDimensions.naturalWidth / imageDimensions.width
      const scaleY = imageDimensions.naturalHeight / imageDimensions.height
      
      const naturalSourceX = sourceX * scaleX
      const naturalSourceY = sourceY * scaleY
      const naturalSourceWidth = sourceWidth * scaleX
      const naturalSourceHeight = sourceHeight * scaleY
      
      // Set output dimensions
      const outputWidth = cropWidth || naturalSourceWidth
      const outputHeight = cropHeight || naturalSourceHeight
      
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = outputWidth
      canvas.height = outputHeight
      
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw the cropped portion
      ctx.drawImage(
        img,
        naturalSourceX,
        naturalSourceY,
        naturalSourceWidth,
        naturalSourceHeight,
        0,
        0,
        outputWidth,
        outputHeight
      )
      // Return a persistent base64 data URL instead of a temporary blob URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
      onCropComplete(dataUrl)
      setIsLoading(false)
      
    } catch (error) {
      console.error('Crop error:', error)
      setIsLoading(false)
    }
  }

  console.log('🎨 ImageCropModal render - open:', open, 'imageSrc:', !!imageSrc)
  
  if (!open || !imageSrc) return null

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[99999] p-4"
      onClick={(e) => {
        e.stopPropagation() // Prevent clicks from bubbling to elements behind
        if (e.target === e.currentTarget) onClose()
      }}
      onMouseDown={(e) => e.stopPropagation()} // Prevent mouse down from bubbling
    >
      <div 
        className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent any clicks inside from bubbling out
        onMouseDown={(e) => e.stopPropagation()} // Prevent mouse down from bubbling
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{cropLabel}</h2>
            {cropWidth && cropHeight && (
              <p className="text-sm text-gray-500 mt-1">Output size: {cropWidth} × {cropHeight}px</p>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col lg:flex-row gap-6">
          {/* Crop Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Move className="w-4 h-4" />
                <span>Drag to reposition • Scroll or use buttons to zoom</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium w-16 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={containerRef}
              className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden"
              style={{ minHeight: '400px', maxHeight: '600px' }}
              onWheel={(e) => {
                e.preventDefault()
                const delta = e.deltaY * -0.001
                setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
              }}
            >
              {/* Image */}
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop"
                className="absolute select-none"
                style={{
                  left: `${crop.x}px`,
                  top: `${crop.y}px`,
                  width: `${imageDimensions.width * zoom}px`,
                  height: `${imageDimensions.height * zoom}px`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                }}
                onLoad={onImageLoad}
                onMouseDown={handleMouseDown}
                draggable={false}
              />
              
              {/* Crop Box Overlay */}
              {imageDimensions.width > 0 && (
                <>
                  {/* Dark overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <svg width="100%" height="100%" className="absolute inset-0">
                      <defs>
                        <mask id="cropMask">
                          <rect width="100%" height="100%" fill="white" />
                          <rect 
                            x="50%" 
                            y="50%" 
                            width={Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0)}
                            height={Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0) / targetAspect}
                            transform={`translate(-${Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0) / 2}, -${Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0) / targetAspect / 2})`}
                            fill="black"
                          />
                        </mask>
                      </defs>
                      <rect width="100%" height="100%" fill="black" opacity="0.5" mask="url(#cropMask)" />
                    </svg>
                  </div>
                  
                  {/* Crop box border */}
                  <div 
                    className="absolute border-2 border-white pointer-events-none"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: `${Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0)}px`,
                      height: `${Math.min(imageDimensions.width * zoom, containerRef.current?.clientWidth || 0) / targetAspect}px`,
                      transform: 'translate(-50%, -50%)',
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCrop} disabled={isLoading || imageDimensions.width === 0}>
            {isLoading ? 'Processing...' : 'Apply Crop'}
          </Button>
        </div>
      </div>
    </div>
  )
}
