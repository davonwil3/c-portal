"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Edit3 } from "lucide-react"

interface Preferences {
  services: string[]
  intentText: string
  budget: string
  remoteOnly: boolean
  region: string
  showSavedLeads?: boolean
}

interface RefinePreferencesModalProps {
  open: boolean
  onClose: () => void
  preferences: Preferences
  onSave: (preferences: Preferences) => void
}

const categoryExamples = [
  'UX Designer',
  'Copywriter',
  'Web Developer',
  'Graphic Designer',
  'SEO Specialist',
  'Social Media Manager'
]

export function RefinePreferencesModal({ 
  open, 
  onClose, 
  preferences, 
  onSave 
}: RefinePreferencesModalProps) {
  const [categoryText, setCategoryText] = useState(preferences.intentText)

  const handleExampleClick = (example: string) => {
    setCategoryText(example)
  }

  const handleSave = () => {
    onSave({
      ...preferences,
      intentText: categoryText
    })
    toast.success('Preferences updated')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-[#3C3CFF]" />
            <span>Refine Your Preferences</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-800">
              Enter Your Freelance Category
            </Label>
            <Textarea
              className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent min-h-[100px]"
              placeholder="e.g. UX Designer, Copywriter, Web Developer..."
              value={categoryText}
              onChange={(e) => setCategoryText(e.target.value)}
            />
          </div>

          {/* Examples */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-500 font-normal">Examples:</Label>
            <div className="flex flex-wrap gap-2">
              {categoryExamples.map((example) => (
                <Button
                  key={example}
                  size="sm"
                  variant="ghost"
                  onClick={() => handleExampleClick(example)}
                  className="text-xs text-gray-600 hover:text-[#3C3CFF] hover:bg-[#3C3CFF]/10"
                >
                  {example}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
