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
import { X } from "lucide-react"

interface ServiceModalProps {
  open: boolean
  onClose: () => void
  onSave: (service: any) => void
  editingService?: Service | null
}

export function ServiceModal({ open, onClose, onSave, editingService }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    blurb: "",
    priceLabel: "",
    tags: [] as string[],
    ctaLabel: "Learn More"
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (editingService) {
      setFormData({
        title: editingService.title,
        blurb: editingService.blurb,
        priceLabel: editingService.priceLabel,
        tags: editingService.tags || [],
        ctaLabel: editingService.ctaLabel || "Learn More"
      })
    } else {
      setFormData({
        title: "",
        blurb: "",
        priceLabel: "",
        tags: [],
        ctaLabel: "Learn More"
      })
    }
  }, [editingService, open])

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
      ctaLabel: "Learn More"
    })
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingService ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {editingService ? "Update your service details" : "Add a new service to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="ctaLabel">CTA Button Label</Label>
            <Input
              id="ctaLabel"
              value={formData.ctaLabel}
              onChange={(e) => setFormData({ ...formData, ctaLabel: e.target.value })}
              placeholder="e.g., Learn More"
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

