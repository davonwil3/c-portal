"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Check, Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { updatePortfolioAnalytics } from "@/lib/portfolio"

interface PortfolioSettingsCardProps {
  handle: string
  title: string
  description: string
  lastUpdated: string
  portfolioId: string | null
  onHandleChange: (handle: string) => void
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onSaveSuccess?: () => void
}

export function PortfolioSettingsCard({
  handle,
  title,
  description,
  lastUpdated,
  portfolioId,
  onHandleChange,
  onTitleChange,
  onDescriptionChange,
  onSaveSuccess
}: PortfolioSettingsCardProps) {
  const [copied, setCopied] = useState(false)
  const [localHandle, setLocalHandle] = useState(handle)
  const [localTitle, setLocalTitle] = useState(title)
  const [localDescription, setLocalDescription] = useState(description)
  const [originalHandle, setOriginalHandle] = useState(handle)
  const [originalTitle, setOriginalTitle] = useState(title)
  const [originalDescription, setOriginalDescription] = useState(description)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const fullUrl = `${localHandle}.jolix.io`

  // Sync original values when props change - but only if we don't have unsaved changes
  // This prevents resetting local state while user is actively typing
  useEffect(() => {
    // Check if we have unsaved local changes by comparing current local state to props
    const hasLocalChanges = localHandle !== handle || localTitle !== title || localDescription !== description
    
    // Only sync if there are no local changes (props match local state or this is external update)
    // This allows external updates (like after save/refresh) to sync, but prevents resetting while typing
    if (!hasLocalChanges) {
      setOriginalHandle(handle)
      setOriginalTitle(title)
      setOriginalDescription(description)
      setLocalHandle(handle)
      setLocalTitle(title)
      setLocalDescription(description)
    }
  }, [handle, title, description, localHandle, localTitle, localDescription])

  // Track changes against original values
  useEffect(() => {
    const changed = localHandle !== originalHandle || localTitle !== originalTitle || localDescription !== originalDescription
    setHasChanges(changed)
    if (!changed) {
      setSaveSuccess(false)
    }
  }, [localHandle, localTitle, localDescription, originalHandle, originalTitle, originalDescription])

  // Handle input changes - only update local state, don't call parent callbacks
  // Parent callbacks will be called on save instead
  const handleHandleChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    setLocalHandle(sanitized)
    // Don't call onHandleChange here - save it for when user actually saves
  }

  const handleTitleChange = (value: string) => {
    setLocalTitle(value)
    // Don't call onTitleChange here - save it for when user actually saves
  }

  const handleDescriptionChange = (value: string) => {
    setLocalDescription(value)
    // Don't call onDescriptionChange here - save it for when user actually saves
  }

  const handleSave = async () => {
    if (!portfolioId || !hasChanges) return

    setIsSaving(true)
    try {
      const result = await updatePortfolioAnalytics(portfolioId, {
        domain: localHandle,
        title: localTitle,
        meta_description: localDescription
      })

      if (result.success) {
        // Update original values to current values after successful save
        setOriginalHandle(localHandle)
        setOriginalTitle(localTitle)
        setOriginalDescription(localDescription)
        // Now call parent callbacks to update parent state
        onHandleChange(localHandle)
        onTitleChange(localTitle)
        onDescriptionChange(localDescription)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        if (onSaveSuccess) {
          onSaveSuccess()
        }
      } else {
        alert(result.error || 'Failed to save settings')
      }
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(error.message || 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`https://${fullUrl}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const openInNewTab = () => {
    window.open(`https://${fullUrl}`, '_blank')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">Portfolio Settings</h2>
        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        )}
      </div>
      
      <div className="space-y-6">
        {/* Public URL */}
        <div>
          <Label className="text-sm font-semibold mb-2">Portfolio Link</Label>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 flex items-center border rounded-lg overflow-hidden">
              <Input
                value={localHandle}
                onChange={(e) => handleHandleChange(e.target.value)}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="your-handle"
              />
              <span className="px-3 py-2 bg-gray-50 text-sm text-gray-600 border-l whitespace-nowrap">
                .jolix.io
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={copyLink}>
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={openInNewTab}>
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Portfolio Title */}
        <div>
          <Label className="text-sm font-semibold mb-2">Portfolio Title</Label>
          <Input
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="My Portfolio"
            className="mt-2"
          />
        </div>

        {/* Meta Description */}
        <div>
          <Label className="text-sm font-semibold mb-2">Meta Description</Label>
          <Textarea
            value={localDescription}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="A brief description for search engines..."
            maxLength={160}
            rows={3}
            className="mt-2 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{localDescription.length}/160 characters</p>
        </div>

        {/* Last Updated */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Last Updated:</span> {lastUpdated}
          </p>
        </div>
      </div>
    </Card>
  )
}
