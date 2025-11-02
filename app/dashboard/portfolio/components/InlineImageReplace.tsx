"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { ImageCropModal } from "./ImageCropModal"

interface InlineImageReplaceProps {
  src: string
  alt: string
  className?: string
  onReplace: (newSrc: string) => void
  editMode: boolean
  aspectRatio?: number
  cropWidth?: number
  cropHeight?: number
}

export function InlineImageReplace({ src, alt, className = "", onReplace, editMode, aspectRatio, cropWidth, cropHeight }: InlineImageReplaceProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const [showCropModal, setShowCropModal] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uniqueId = useRef(`image-upload-${Math.random().toString(36).substring(7)}`)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      setImageToCrop(result)
      setShowCropModal(true)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (croppedImageUrl: string) => {
    setCurrentSrc(croppedImageUrl)
    onReplace(croppedImageUrl)
    setShowCropModal(false)
    setImageToCrop(null)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (editMode && !showCropModal) {
      e.stopPropagation()
      fileInputRef.current?.click()
    }
  }

  if (!editMode) {
    const imageSrc = currentSrc || src || ""
    
    if (!imageSrc) {
      return (
        <div className={className} style={{ backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <p className="text-gray-400">No image</p>
        </div>
      )
    }
    
    return (
      <img 
        src={imageSrc} 
        alt={alt} 
        className={className}
      />
    )
  }

  return (
    <div 
      className="relative cursor-pointer group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      <img 
        key={currentSrc}
        src={currentSrc} 
        alt={alt} 
        className={className}
      />
      
      <div 
        className={`absolute inset-0 bg-black transition-opacity duration-200 flex items-center justify-center pointer-events-none ${
          isHovering ? 'opacity-60' : 'opacity-0'
        }`}
      >
        <div className="pointer-events-auto">
          <Button 
            size="sm" 
            variant="secondary"
            type="button"
          >
            <Upload className="w-4 h-4 mr-2" />
            Replace Image
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        id={uniqueId.current}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <ImageCropModal
        open={showCropModal}
        imageSrc={imageToCrop}
        onClose={() => {
          setShowCropModal(false)
          setImageToCrop(null)
        }}
        onCropComplete={handleCropComplete}
        aspectRatio={aspectRatio}
        cropWidth={cropWidth}
        cropHeight={cropHeight}
      />
    </div>
  )
}
