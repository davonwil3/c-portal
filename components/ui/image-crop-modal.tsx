"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crop, Check, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import ReactCrop, { Crop as CropType, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  onCrop: (croppedImageUrl: string) => void
  aspectRatio?: number
  recommendedSize?: { width: number; height: number }
}

export function ImageCropModal({
  isOpen,
  onClose,
  imageUrl,
  onCrop,
  aspectRatio = 6, // Default 6:1 aspect ratio for banners (half height)
  recommendedSize = { width: 1200, height: 200 }
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<CropType>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotate, setRotate] = useState(0)
  const [aspect, setAspect] = useState<number | undefined>(aspectRatio)
  
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
  const blobUrlRef = useRef<string>()

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          width,
          height,
        ),
        width,
        height,
      ))
    }
    setImageLoaded(true)
  }, [aspect])

  const onDownloadCropClick = useCallback(() => {
    if (!previewCanvasRef.current || !completedCrop || !imgRef.current) {
      throw new Error('Crop canvas or image does not exist')
    }

    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('No 2d context')
    }

    const { width, height } = completedCrop
    const { naturalWidth, naturalHeight } = imgRef.current

    // Set canvas size to recommended size
    canvas.width = recommendedSize.width
    canvas.height = recommendedSize.height

    // Calculate scale factors
    const scaleX = naturalWidth / imgRef.current.width
    const scaleY = naturalHeight / imgRef.current.height

    // Calculate crop coordinates in natural image space
    const cropX = completedCrop.x * scaleX
    const cropY = completedCrop.y * scaleY
    const cropWidth = completedCrop.width * scaleX
    const cropHeight = completedCrop.height * scaleY

    // Draw the cropped image
    ctx.drawImage(
      imgRef.current,
      cropX, cropY, cropWidth, cropHeight,
      0, 0, recommendedSize.width, recommendedSize.height
    )

    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob')
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
      blobUrlRef.current = URL.createObjectURL(blob)
      onCrop(blobUrlRef.current)
      onClose()
    }, 'image/jpeg', 0.9)
  }, [completedCrop, onCrop, onClose, recommendedSize.width, recommendedSize.height])

  const handleToggleAspectClick = () => {
    if (aspect) {
      setAspect(undefined)
    } else {
      setAspect(aspectRatio)
    }
  }

  const resetCrop = () => {
    if (imgRef.current && aspect) {
      const { width, height } = imgRef.current
      setCrop(centerCrop(
        makeAspectCrop(
          {
            unit: '%',
            width: 90,
          },
          aspect,
          width,
          height,
        ),
        width,
        height,
      ))
    }
  }

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
    }
  }, [])

  // Reset crop when modal opens
  useEffect(() => {
    if (isOpen) {
      setImageLoaded(false)
      setScale(1)
      setRotate(0)
      setAspect(aspectRatio)
    }
  }, [isOpen, aspectRatio])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5" />
            Crop Banner Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Image Crop Container */}
          <div className="flex justify-center">
            <div className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 p-4">
              {!imageLoaded && (
                <div className="flex items-center justify-center w-[600px] h-[300px]">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading image...</p>
                  </div>
                </div>
              )}
              
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                minWidth={200}
                minHeight={200 / aspectRatio}
                className="max-w-full max-h-[300px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imageUrl}
                  style={{ 
                    transform: `scale(${scale}) rotate(${rotate}deg)`,
                    maxWidth: '100%',
                    maxHeight: '400px'
                  }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
          </div>
          
          {/* Controls */}
          <div className="space-y-6">
            {/* Crop Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  Crop Controls
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleAspectClick}
                    className="text-xs"
                  >
                    {aspect ? 'Free Crop' : `${aspectRatio}:1 Ratio`}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetCrop}
                    className="text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
              
              {/* Zoom Controls */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Zoom: {Math.round(scale * 100)}%
                </label>
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.max(0.5, scale - 0.1))}
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={scale}
                      onChange={(e) => setScale(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setScale(Math.min(2, scale + 0.1))}
                    disabled={scale >= 2}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-blue-600">ℹ</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 mb-1">Banner Dimensions</p>
                    <p className="text-blue-700">
                      Final size: <strong>{recommendedSize.width}×{recommendedSize.height}px</strong><br/>
                      Aspect ratio: <strong>{aspectRatio}:1</strong>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-green-600">✓</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Professional Crop</p>
                    <p className="text-green-700">
                      Drag corners to resize, drag center to move. Maintains perfect aspect ratio for banners.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onDownloadCropClick} className="bg-blue-600 hover:bg-blue-700">
              <Check className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
          </div>
        </div>
        
        {/* Hidden canvas for preview */}
        <canvas
          ref={previewCanvasRef}
          className="hidden"
          style={{
            border: '1px solid black',
            objectFit: 'contain',
            width: recommendedSize.width,
            height: recommendedSize.height,
          }}
        />
        
        {/* Hidden anchor for download */}
        <a
          ref={hiddenAnchorRef}
          download
          style={{
            position: 'absolute',
            top: '-200vh',
            visibility: 'hidden',
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
