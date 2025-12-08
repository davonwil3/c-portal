"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Loader2 } from "lucide-react"
import { getFileUrl } from "@/lib/files"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface FileReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: any | null
  brandColor?: string
  showReviewActions?: boolean // If true, shows approve/reject buttons. If false, just shows view/download
  onApproved?: () => void
  onRejected?: () => void
}

export function FileReviewModal({
  open,
  onOpenChange,
  file,
  brandColor = "#3C3CFF",
  showReviewActions = false,
  onApproved,
  onRejected
}: FileReviewModalProps) {
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
  const [filePreviewLoading, setFilePreviewLoading] = useState(false)
  const [reviewComment, setReviewComment] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  // Fetch file URL when modal opens
  useEffect(() => {
    const fetchFileUrl = async () => {
      if (open && file?.id) {
        setFilePreviewLoading(true)
        setFilePreviewUrl(null)
        setReviewComment("")
        try {
          // Try using getFileUrl function first
          const url = await getFileUrl(file.id)
          if (url) {
            setFilePreviewUrl(url)
          } else {
            // Fallback: construct URL directly from file data
            const supabase = createClient()
            const bucket = file.storage_bucket || 'client-portal-content'
            const storagePath = file.storage_path || file.path
            if (storagePath) {
              const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(storagePath)
              setFilePreviewUrl(publicUrl)
            } else {
              toast.error('File path not found')
            }
          }
        } catch (error) {
          console.error('Error fetching file URL:', error)
          toast.error('Failed to load file preview')
        } finally {
          setFilePreviewLoading(false)
        }
      } else {
        setFilePreviewUrl(null)
        setFilePreviewLoading(false)
        setReviewComment("")
      }
    }
    
    fetchFileUrl()
  }, [open, file])

  const handleApprove = async () => {
    if (!file?.id) return
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/files/${file.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: 'approved',
          comment: reviewComment
        })
      })

      if (response.ok) {
        toast.success('File approved successfully!')
        setReviewComment("")
        onOpenChange(false)
        onApproved?.()
      } else {
        toast.error('Failed to approve file')
      }
    } catch (error) {
      console.error('Error approving file:', error)
      toast.error('Error approving file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!file?.id) return
    
    setIsProcessing(true)
    try {
      const response = await fetch(`/api/files/${file.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approval_status: 'rejected',
          comment: reviewComment
        })
      })

      if (response.ok) {
        toast.success('File rejected')
        setReviewComment("")
        onOpenChange(false)
        onRejected?.()
      } else {
        toast.error('Failed to reject file')
      }
    } catch (error) {
      console.error('Error rejecting file:', error)
      toast.error('Error rejecting file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (filePreviewUrl) {
      window.open(filePreviewUrl, '_blank')
    }
  }

  if (!file) return null

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!isProcessing) {
        onOpenChange(newOpen)
        if (!newOpen) {
          setReviewComment("")
          setFilePreviewUrl(null)
        }
      }
    }}>
      <DialogContent className="sm:max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{file.name}</span>
            <Badge variant="outline" className="text-xs">
              {file.file_type?.toUpperCase() || 'FILE'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          {filePreviewLoading ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500">Loading file preview...</p>
              </div>
            </div>
          ) : filePreviewUrl ? (
            <div className="w-full h-full">
              {/* Image files */}
              {['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP'].includes(file.file_type?.toUpperCase() || '') && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img
                    src={filePreviewUrl}
                    alt={file.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ maxHeight: 'calc(100vh - 200px)' }}
                    onError={() => { toast.error('Unable to load image preview') }}
                  />
                </div>
              )}

              {/* PDF files */}
              {file.file_type?.toUpperCase() === 'PDF' && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <iframe
                    src={`${filePreviewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                    title={`PDF Viewer - ${file.name}`}
                    className="w-full h-full border-0 rounded-lg shadow-lg"
                    style={{ minHeight: 'calc(100vh - 200px)' }}
                    onError={() => { toast.error('Unable to load PDF preview') }}
                  />
                </div>
              )}

              {/* Video files */}
              {['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM'].includes(file.file_type?.toUpperCase() || '') && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <video
                    controls
                    className="max-w-full max-h-full rounded-lg shadow-lg"
                    style={{ maxHeight: 'calc(100vh - 200px)' }}
                  >
                    <source src={filePreviewUrl} type={`video/${file.file_type?.toLowerCase() || 'mp4'}`} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Audio files */}
              {['MP3', 'WAV', 'OGG', 'AAC', 'FLAC'].includes(file.file_type?.toUpperCase() || '') && (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <audio
                    controls
                    className="w-full max-w-md"
                  >
                    <source src={filePreviewUrl} type={`audio/${file.file_type?.toLowerCase() || 'mp3'}`} />
                    Your browser does not support the audio tag.
                  </audio>
                </div>
              )}

              {/* Other file types */}
              {!['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP', 'PDF', 'MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MP3', 'WAV', 'OGG', 'AAC', 'FLAC'].includes(file.file_type?.toUpperCase() || '') && (
                <div className="w-full h-full flex flex-col items-center justify-center p-4">
                  <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">File Preview Unavailable</h3>
                    <p className="text-gray-600 mb-4">This file type cannot be previewed. You can download it to view on your device.</p>
                    <Button onClick={handleDownload}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4">
              <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Unable to Load File</h3>
                <p className="text-gray-600 mb-4">The file could not be loaded. Please try again later.</p>
              </div>
            </div>
          )}
        </div>

        {/* Comment Section and Actions */}
        <div className="border-t pt-4 px-6 pb-6 space-y-4">
          {showReviewActions && (
            <div>
              <Label htmlFor="review-comment">Comments (optional)</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add comments about this file..."
                rows={3}
                className="mt-1"
              />
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                if (!isProcessing) {
                  onOpenChange(false)
                  setReviewComment("")
                }
              }}
              disabled={isProcessing}
            >
              {showReviewActions ? 'Cancel' : 'Close'}
            </Button>
            <Button 
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            {showReviewActions && (
              <>
                <Button 
                  variant="outline" 
                  className="bg-red-50 text-red-600 hover:bg-red-100"
                  onClick={handleReject}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Reject
                </Button>
                <Button 
                  style={{ backgroundColor: brandColor }}
                  onClick={handleApprove}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

