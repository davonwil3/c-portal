"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { X, Edit3 } from "lucide-react"

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

const serviceOptions = [
  'Web Dev',
  'Design', 
  'Copywriting',
  'SEO',
  'Marketing',
  'Video'
]

const budgetOptions = ['$', '$$', '$$$']
const regionOptions = ['Global', 'US', 'EU']

const exampleIntents = [
  'SaaS startups needing web design',
  'E-commerce brands needing copywriting', 
  'Local businesses needing SEO help',
  'Tech companies needing marketing',
  'Startups needing video content'
]

export function RefinePreferencesModal({ 
  open, 
  onClose, 
  preferences, 
  onSave 
}: RefinePreferencesModalProps) {
  const [localPreferences, setLocalPreferences] = useState<Preferences>(preferences)
  const [customService, setCustomService] = useState('')

  const handleServiceToggle = (service: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }))
  }

  const handleAddCustomService = () => {
    if (customService.trim()) {
      setLocalPreferences(prev => ({
        ...prev,
        services: [...prev.services, customService.trim()]
      }))
      setCustomService('')
    }
  }

  const handleExampleClick = (example: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      intentText: example
    }))
  }

  const handleSave = () => {
    onSave(localPreferences)
    toast.success('Preferences updated')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit3 className="h-5 w-5 text-[#3C3CFF]" />
            <span>Refine Your Preferences</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Services */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-800">What do you do?</Label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map((service) => (
                <Button
                  key={service}
                  size="sm"
                  variant={localPreferences.services.includes(service) ? "default" : "outline"}
                  onClick={() => handleServiceToggle(service)}
                  className={`text-xs font-medium transition-all duration-200 ${
                    localPreferences.services.includes(service)
                      ? 'bg-[#3C3CFF] text-white shadow-md hover:bg-[#2D2DCC]'
                      : 'hover:bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {service}
                </Button>
              ))}
            </div>
            
            {/* Custom Service Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Other (type here)"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                className="text-sm"
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomService()}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCustomService}
                disabled={!customService.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          {/* Intent Text */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-800">
              Who do you want to work with?
            </Label>
            <div className="space-y-3">
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent"
                rows={3}
                placeholder="Describe the types of clients and projects you want to work with..."
                value={localPreferences.intentText}
                onChange={(e) => setLocalPreferences(prev => ({ ...prev, intentText: e.target.value }))}
              />
              
              {/* Helper Note */}
              <p className="text-sm text-gray-500 italic">
                We'll match what you describe as closely as possible, and may also show adjacent or relevant leads that fit your goals.
              </p>
              
              {/* Example Intents */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Click to insert examples:</Label>
                <div className="flex flex-wrap gap-2">
                  {exampleIntents.map((example) => (
                    <Button
                      key={example}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleExampleClick(example)}
                      className="text-xs text-gray-600 hover:text-[#3C3CFF] hover:bg-[#3C3CFF]/10"
                    >
                      "{example}"
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Budget */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-800">Budget</Label>
              <Select
                value={localPreferences.budget}
                onValueChange={(value) => setLocalPreferences(prev => ({ ...prev, budget: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {budgetOptions.map((budget) => (
                    <SelectItem key={budget} value={budget}>
                      {budget}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-800">Region</Label>
              <Select
                value={localPreferences.region}
                onValueChange={(value) => setLocalPreferences(prev => ({ ...prev, region: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((region) => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Remote and Saved Leads Toggles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Remote */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-800">Work Type</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch
                  checked={localPreferences.remoteOnly}
                  onCheckedChange={(checked) => setLocalPreferences(prev => ({ ...prev, remoteOnly: checked }))}
                  className="data-[state=checked]:bg-[#3C3CFF]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Remote Only</div>
                </div>
              </div>
            </div>

            {/* Show Saved Leads */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-800">Saved Leads</Label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Switch
                  checked={localPreferences.showSavedLeads || false}
                  onCheckedChange={(checked) => setLocalPreferences(prev => ({ ...prev, showSavedLeads: checked }))}
                  className="data-[state=checked]:bg-[#3C3CFF]"
                />
                <div>
                  <div className="text-sm font-medium text-gray-900">Show Saved Leads</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
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
