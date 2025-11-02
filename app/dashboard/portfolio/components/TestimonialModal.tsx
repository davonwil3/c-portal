"use client"

import { useState, useEffect } from "react"
import { Testimonial } from "../page"
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

interface TestimonialModalProps {
  open: boolean
  onClose: () => void
  onSave: (testimonial: any) => void
  editingTestimonial?: Testimonial | null
}

export function TestimonialModal({ open, onClose, onSave, editingTestimonial }: TestimonialModalProps) {
  const [formData, setFormData] = useState({
    author: "",
    role: "",
    quote: ""
  })

  useEffect(() => {
    if (editingTestimonial) {
      setFormData({
        author: editingTestimonial.author,
        role: editingTestimonial.role,
        quote: editingTestimonial.quote
      })
    } else {
      setFormData({
        author: "",
        role: "",
        quote: ""
      })
    }
  }, [editingTestimonial, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingTestimonial) {
      onSave({ ...editingTestimonial, ...formData })
    } else {
      onSave(formData)
    }
    setFormData({
      author: "",
      role: "",
      quote: ""
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}</DialogTitle>
          <DialogDescription>
            {editingTestimonial ? "Update the testimonial" : "Add a new testimonial to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="author">Author Name *</Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              placeholder="e.g., John Smith"
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role/Title *</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., CEO at Company Inc."
              required
            />
          </div>

          <div>
            <Label htmlFor="quote">Quote *</Label>
            <Textarea
              id="quote"
              value={formData.quote}
              onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
              placeholder="The testimonial text"
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingTestimonial ? "Update" : "Add"} Testimonial
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

