"use client"

import { useState, useEffect } from "react"
import { Service } from "../page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { X, Database, Plus } from "lucide-react"
import { toast } from "sonner"

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  onSave: (service: any) => void
  editingService?: Service | null
}

interface SavedService {
  id: string
  name: string
  description: string
  rate: number
  rate_type: 'hourly' | 'fixed' | 'monthly' | 'yearly'
  is_active: boolean
}

export function ServiceModal({ open, onClose, onSave, editingService }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    blurb: "",
    priceLabel: "",
    tags: [] as string[],
  })
  const [tagInput, setTagInput] = useState("")
  const [useSavedService, setUseSavedService] = useState(false)
  const [savedServices, setSavedServices] = useState<SavedService[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [selectedSavedService, setSelectedSavedService] = useState<SavedService | null>(null)

  // Load saved services when modal opens
  useEffect(() => {
    if (open && !editingService) {
      loadSavedServices()
    }
  }, [open, editingService])

  // Reset form when editing or modal opens
  useEffect(() => {
    if (editingService) {
      setFormData({
        title: editingService.title,
        blurb: editingService.blurb,
        priceLabel: editingService.priceLabel,
        tags: editingService.tags || [],
      })
      setUseSavedService(false)
      setSelectedSavedService(null)
    } else {
      setFormData({
        title: "",
        blurb: "",
        priceLabel: "",
        tags: [],
      })
      setUseSavedService(false)
      setSelectedSavedService(null)
    }
  }, [editingService, open])

  const loadSavedServices = async () => {
    try {
      setLoadingServices(true)
      const response = await fetch('/api/services')
      const result = await response.json()
      
      if (result.success) {
        setSavedServices(result.data || [])
      } else {
        console.error('Error loading services:', result.error)
        toast.error('Failed to load saved services')
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load saved services')
    } finally {
      setLoadingServices(false)
    }
  }

  const handleSelectSavedService = (service: SavedService) => {
    setSelectedSavedService(service)
    
    // Map saved service to portfolio service format
    const rateLabel = service.rate_type === 'hourly' 
      ? `$${service.rate}/hr`
      : service.rate_type === 'fixed'
      ? `$${service.rate}`
      : service.rate_type === 'monthly'
      ? `$${service.rate}/mo`
      : `$${service.rate}/yr`
    
    setFormData({
      title: service.name,
      blurb: service.description || "",
      priceLabel: rateLabel,
      tags: [], // Start with empty tags, user can add more
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingService) {
      onSave({ ...editingService, ...formData })
    } else {
      onSave(formData)
    }
    setFormData({
      title: "",
      blurb: "",
      priceLabel: "",
      tags: [],
    })
    setUseSavedService(false)
    setSelectedSavedService(null)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] })
      setTagInput("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {editingService ? "Update your service details" : "Add a new service to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-2">
          {/* Use Saved Service Toggle */}
          {!editingService && (
            <div className="mb-4">
              <Button
                type="button"
                variant={useSavedService ? "default" : "outline"}
                onClick={() => {
                  setUseSavedService(!useSavedService)
                  if (!useSavedService) {
                    loadSavedServices()
                  }
                }}
                className="w-full"
              >
                {useSavedService ? (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Service
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Use a Saved Service
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Saved Services List */}
          {!editingService && useSavedService && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50 max-h-60 overflow-y-auto">
              <Label className="text-sm font-semibold mb-3 block sticky top-0 bg-gray-50 pb-2">Select a Saved Service</Label>
              {loadingServices ? (
                <p className="text-sm text-gray-500">Loading services...</p>
              ) : savedServices.length === 0 ? (
                <p className="text-sm text-gray-500">No saved services found. Create one in the Services section first.</p>
              ) : (
                <div className="space-y-2">
                  {savedServices.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => handleSelectSavedService(service)}
                      className={`w-full text-left p-3 border rounded-lg transition-all ${
                        selectedSavedService?.id === service.id
                          ? "border-[#3C3CFF] bg-[#3C3CFF]/10"
                          : "border-gray-200 hover:border-[#3C3CFF] hover:bg-[#3C3CFF]/5"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm font-bold text-[#3C3CFF]">
                            ${service.rate}
                            {service.rate_type === 'hourly' && '/hr'}
                            {service.rate_type === 'fixed' && ' fixed'}
                            {service.rate_type === 'monthly' && '/mo'}
                            {service.rate_type === 'yearly' && '/yr'}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <Label htmlFor="title">Service Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Web Development"
              required
            />
          </div>

          <div>
            <Label htmlFor="blurb">Description *</Label>
            <Textarea
              id="blurb"
              value={formData.blurb}
              onChange={(e) => setFormData({ ...formData, blurb: e.target.value })}
              placeholder="Brief description of the service"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="priceLabel">Price Label *</Label>
            <Input
              id="priceLabel"
              value={formData.priceLabel}
              onChange={(e) => setFormData({ ...formData, priceLabel: e.target.value })}
              placeholder="e.g., Starting at $999"
              required
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (Optional)</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
                placeholder="Add a tag"
              />
              <Button type="button" onClick={addTag} variant="outline">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingService ? "Update" : "Add"} Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

