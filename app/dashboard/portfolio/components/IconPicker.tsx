"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Mail, Phone, MapPin, Globe, Linkedin, Twitter, Github, Instagram,
  Facebook, Youtube, MessageCircle, Send, Calendar, Clock, User,
  Users, Building, Briefcase, Award, Target, TrendingUp, Heart,
  Star, Zap, Sparkles, Rocket, Code, Palette, Camera, Music,
  Video, Headphones, Coffee, Book, Pencil, FileText, Folder,
  Download, Upload, Share2, Link, ExternalLink, ChevronRight
} from "lucide-react"

interface IconPickerProps {
  open: boolean
  onClose: () => void
  onSelect: (iconName: string) => void
  currentIcon?: string
}

const icons = [
  { name: "Mail", icon: Mail, category: "Contact" },
  { name: "Phone", icon: Phone, category: "Contact" },
  { name: "MapPin", icon: MapPin, category: "Contact" },
  { name: "Globe", icon: Globe, category: "Contact" },
  { name: "MessageCircle", icon: MessageCircle, category: "Contact" },
  { name: "Send", icon: Send, category: "Contact" },
  
  { name: "Linkedin", icon: Linkedin, category: "Social" },
  { name: "Twitter", icon: Twitter, category: "Social" },
  { name: "Github", icon: Github, category: "Social" },
  { name: "Instagram", icon: Instagram, category: "Social" },
  { name: "Facebook", icon: Facebook, category: "Social" },
  { name: "Youtube", icon: Youtube, category: "Social" },
  
  { name: "Calendar", icon: Calendar, category: "Business" },
  { name: "Clock", icon: Clock, category: "Business" },
  { name: "Briefcase", icon: Briefcase, category: "Business" },
  { name: "Building", icon: Building, category: "Business" },
  { name: "Users", icon: Users, category: "Business" },
  { name: "User", icon: User, category: "Business" },
  
  { name: "Award", icon: Award, category: "Achievement" },
  { name: "Target", icon: Target, category: "Achievement" },
  { name: "TrendingUp", icon: TrendingUp, category: "Achievement" },
  { name: "Star", icon: Star, category: "Achievement" },
  { name: "Zap", icon: Zap, category: "Achievement" },
  { name: "Rocket", icon: Rocket, category: "Achievement" },
  
  { name: "Code", icon: Code, category: "Creative" },
  { name: "Palette", icon: Palette, category: "Creative" },
  { name: "Camera", icon: Camera, category: "Creative" },
  { name: "Music", icon: Music, category: "Creative" },
  { name: "Video", icon: Video, category: "Creative" },
  { name: "Headphones", icon: Headphones, category: "Creative" },
  
  { name: "Heart", icon: Heart, category: "Misc" },
  { name: "Sparkles", icon: Sparkles, category: "Misc" },
  { name: "Coffee", icon: Coffee, category: "Misc" },
  { name: "Book", icon: Book, category: "Misc" },
  { name: "Pencil", icon: Pencil, category: "Misc" },
  { name: "FileText", icon: FileText, category: "Misc" },
  { name: "Folder", icon: Folder, category: "Misc" },
  
  { name: "Download", icon: Download, category: "Action" },
  { name: "Upload", icon: Upload, category: "Action" },
  { name: "Share2", icon: Share2, category: "Action" },
  { name: "Link", icon: Link, category: "Action" },
  { name: "ExternalLink", icon: ExternalLink, category: "Action" },
  { name: "ChevronRight", icon: ChevronRight, category: "Action" },
]

const categories = ["Contact", "Social", "Business", "Achievement", "Creative", "Misc", "Action"]

export function IconPicker({ open, onClose, onSelect, currentIcon }: IconPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose an Icon</DialogTitle>
          <DialogDescription>
            Select an icon for your contact information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {categories.map((category) => {
            const categoryIcons = icons.filter(icon => icon.category === category)
            return (
              <div key={category}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{category}</h3>
                <div className="grid grid-cols-8 gap-2">
                  {categoryIcons.map((iconData) => {
                    const Icon = iconData.icon
                    const isSelected = currentIcon === iconData.name
                    return (
                      <button
                        key={iconData.name}
                        onClick={() => {
                          onSelect(iconData.name)
                          onClose()
                        }}
                        className={`p-3 rounded-lg border-2 transition-all hover:border-blue-500 hover:bg-blue-50 ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        title={iconData.name}
                      >
                        <Icon className="w-5 h-5 mx-auto" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Export icon components for use in templates
export const iconComponents = {
  Mail, Phone, MapPin, Globe, Linkedin, Twitter, Github, Instagram,
  Facebook, Youtube, MessageCircle, Send, Calendar, Clock, User,
  Users, Building, Briefcase, Award, Target, TrendingUp, Heart,
  Star, Zap, Sparkles, Rocket, Code, Palette, Camera, Music,
  Video, Headphones, Coffee, Book, Pencil, FileText, Folder,
  Download, Upload, Share2, Link, ExternalLink, ChevronRight
}

