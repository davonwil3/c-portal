"use client"

import { useState, useEffect } from "react"
import { Testimonial } from "../page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"
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
    quote: "",
    avatar: ""
  })

  useEffect(() => {
    if (editingTestimonial) {
      setFormData({
        author: editingTestimonial.author,
        role: editingTestimonial.role,
        quote: editingTestimonial.quote,
        avatar: (editingTestimonial as any).avatar || ""
      })
    } else {
      setFormData({
        author: "",
        role: "",
        quote: "",
        avatar: ""
      })
    }
  }, [editingTestimonial, open])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

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
      quote: "",
      avatar: ""
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

          <div>
            <Label htmlFor="avatar">Avatar (Optional)</Label>
            {formData.avatar && (
              <div className="mb-2">
                <img src={formData.avatar} alt="Avatar" className="h-20 w-20 rounded-full object-cover" />
              </div>
            )}
            <label>
              <Button type="button" size="sm" variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {formData.avatar ? "Change Avatar" : "Upload Avatar"}
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {formData.avatar && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="mt-2 text-red-600 hover:text-red-700"
                onClick={() => setFormData({ ...formData, avatar: "" })}
              >
                Remove Avatar
              </Button>
            )}
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

