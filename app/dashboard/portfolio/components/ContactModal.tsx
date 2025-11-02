"use client"

import { useState, useEffect } from "react"
import { ContactItem } from "../page"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as LucideIcons from "lucide-react"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: ContactItem) => void
  editingItem?: ContactItem | null
}

const iconCategories = {
  Contact: ["Mail", "Phone", "MapPin", "Globe", "MessageCircle", "Send"],
  Social: ["Linkedin", "Twitter", "Github", "Instagram", "Facebook", "Youtube"],
  Business: ["Calendar", "Clock", "Briefcase", "Building", "Users", "User"],
  Achievement: ["Award", "Target", "TrendingUp", "Star", "Zap", "Rocket"],
  Creative: ["Code", "Palette", "Camera", "Music", "Video", "Headphones"],
  Misc: ["Heart", "Sparkles", "Coffee", "Book", "Pencil", "FileText", "Folder"],
}

export function ContactModal({ isOpen, onClose, onSave, editingItem }: ContactModalProps) {
  const [formData, setFormData] = useState<ContactItem>({
    id: "",
    icon: "Mail",
    label: "",
    value: ""
  })
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (editingItem) {
      setFormData(editingItem)
    } else {
      setFormData({
        id: `contact-${Date.now()}`,
        icon: "Mail",
        label: "",
        value: ""
      })
    }
  }, [editingItem, isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  const filteredIcons = Object.entries(iconCategories).reduce((acc, [category, icons]) => {
    const filtered = icons.filter(icon =>
      icon.toLowerCase().includes(searchTerm.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[category] = filtered
    }
    return acc
  }, {} as typeof iconCategories)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Edit Contact Item" : "Add Contact Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div>
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Email, Phone, Location"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                placeholder="e.g., hello@example.com, +1 234 567 890"
                required
                className="mt-2"
              />
            </div>

            <div>
              <Label>Icon *</Label>
              <div className="mt-2 mb-4">
                <Input
                  placeholder="Search icons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[300px] border rounded-lg p-4">
                {Object.entries(filteredIcons).map(([category, icons]) => (
                  <div key={category} className="mb-6">
                    <h3 className="text-sm font-semibold mb-3 text-gray-700">{category}</h3>
                    <div className="grid grid-cols-6 gap-3">
                      {icons.map((iconName) => {
                        const IconComponent = LucideIcons[iconName as keyof typeof LucideIcons]
                        if (!IconComponent) return null
                        return (
                          <button
                            key={iconName}
                            type="button"
                            className={`flex flex-col h-20 items-center justify-center text-xs rounded-lg border-2 transition-all hover:border-gray-400 ${
                              formData.icon === iconName
                                ? "border-black bg-gray-100"
                                : "border-gray-200"
                            }`}
                            onClick={() => setFormData({ ...formData, icon: iconName })}
                          >
                            <IconComponent className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">{iconName}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingItem ? "Save Changes" : "Add Contact Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

