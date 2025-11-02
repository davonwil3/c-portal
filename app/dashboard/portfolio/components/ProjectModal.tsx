"use client"

import { useState, useEffect } from "react"
import { Project } from "../page"
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
import { X, Upload } from "lucide-react"

interface ProjectModalProps {
  open: boolean
  onClose: () => void
  onSave: (project: any) => void
  editingProject?: Project | null
}

export function ProjectModal({ open, onClose, onSave, editingProject }: ProjectModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    coverImage: "",
    tags: [] as string[],
    link: ""
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (editingProject) {
      setFormData({
        title: editingProject.title,
        summary: editingProject.summary,
        coverImage: editingProject.coverImage || "",
        tags: editingProject.tags || [],
        link: editingProject.link || ""
      })
    } else {
      setFormData({
        title: "",
        summary: "",
        coverImage: "",
        tags: [],
        link: ""
      })
    }
  }, [editingProject, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingProject) {
      onSave({ ...editingProject, ...formData })
    } else {
      onSave(formData)
    }
    setFormData({
      title: "",
      summary: "",
      coverImage: "",
      tags: [],
      link: ""
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, coverImage: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
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
          <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          <DialogDescription>
            {editingProject ? "Update your project details" : "Add a new project to your portfolio"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., E-commerce Platform"
              required
            />
          </div>

          <div>
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Brief description of the project"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            {formData.coverImage && (
              <div className="mb-2">
                <img src={formData.coverImage} alt="Cover" className="h-32 w-full object-cover rounded" />
              </div>
            )}
            <label>
              <Button type="button" size="sm" variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Cover Image
                </span>
              </Button>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>

          <div>
            <Label htmlFor="link">Project Link (Optional)</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://example.com"
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
              {editingProject ? "Update" : "Add"} Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

