"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Settings,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react"
import {
  getPipelineStages,
  savePipelineStages,
  getPipelineStagesFromDB,
  type PipelineStage,
} from "@/lib/pipeline-stages"
import { getLeads, updateLead, type Lead } from "@/lib/leads"
import { toast } from "sonner"

interface PipelineSettingsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  followUpInterval?: number
  setFollowUpInterval?: (value: number) => void
  autoArchive?: boolean
  setAutoArchive?: (value: boolean) => void
  defaultCurrency?: string
  setDefaultCurrency?: (value: string) => void
}

export function PipelineSettingsDrawer({
  open,
  onOpenChange,
  followUpInterval = 3,
  setFollowUpInterval,
  autoArchive = false,
  setAutoArchive,
  defaultCurrency = "USD",
  setDefaultCurrency,
}: PipelineSettingsDrawerProps) {
  const [workingStages, setWorkingStages] = useState<PipelineStage[]>([])
  const [workingFollowUp, setWorkingFollowUp] = useState(followUpInterval)
  const [workingAutoArchive, setWorkingAutoArchive] = useState(autoArchive)
  const [workingCurrency, setWorkingCurrency] = useState(defaultCurrency)

  // Load stages when drawer opens
  useEffect(() => {
    if (open) {
      // Load from database first, fallback to localStorage
      const loadStages = async () => {
        try {
          const dbStages = await getPipelineStagesFromDB()
          setWorkingStages(dbStages)
          // Also update localStorage for fast access
          if (typeof window !== 'undefined') {
            localStorage.setItem('pipeline_stages', JSON.stringify(dbStages))
          }
        } catch (error) {
          console.error('Error loading stages from DB, using cached:', error)
          setWorkingStages(getPipelineStages())
        }
      }
      loadStages()
      setWorkingFollowUp(followUpInterval)
      setWorkingAutoArchive(autoArchive)
      setWorkingCurrency(defaultCurrency)
    }
  }, [open, followUpInterval, autoArchive, defaultCurrency])

  const handleUpdateStageName = (stageId: string, newName: string) => {
    // Prevent editing locked stages
    if (stageId === "new" || stageId === "won" || stageId === "lost") {
      return
    }
    setWorkingStages(stages =>
      stages.map(stage =>
        stage.id === stageId ? { ...stage, name: newName } : stage
      )
    )
  }

  const handleMoveStageUp = (index: number) => {
    if (index === 0) return
    const currentStage = workingStages[index]
    // Prevent moving locked stages
    if (currentStage.id === "new" || currentStage.id === "won" || currentStage.id === "lost") {
      return
    }
    const prevStage = workingStages[index - 1]
    // Prevent moving past locked stages
    if (prevStage.id === "new" || prevStage.id === "won" || prevStage.id === "lost") {
      return
    }
    const newStages = [...workingStages]
    ;[newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]]
    setWorkingStages(newStages)
  }

  const handleMoveStageDown = (index: number) => {
    if (index === workingStages.length - 1) return
    const currentStage = workingStages[index]
    // Prevent moving locked stages
    if (currentStage.id === "new" || currentStage.id === "won" || currentStage.id === "lost") {
      return
    }
    const nextStage = workingStages[index + 1]
    // Prevent moving past locked stages
    if (nextStage.id === "new" || nextStage.id === "won" || nextStage.id === "lost") {
      return
    }
    const newStages = [...workingStages]
    ;[newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]]
    setWorkingStages(newStages)
  }

  const handleDeleteStage = async (stageId: string) => {
    if (stageId === "new" || stageId === "won" || stageId === "lost") {
      toast.error("Cannot delete locked stages (New, Won, and Lost)")
      return
    }
    
    const stageToDelete = workingStages.find(s => s.id === stageId)
    if (!stageToDelete) return
    
    // Find the first stage (usually "New") to move leads to
    const firstStage = workingStages.find(s => s.id === "new") || workingStages[0]
    
    // Update leads in database that have this status
    try {
      const allLeads = await getLeads()
      const leadsToUpdate = allLeads.filter(lead => lead.status === stageToDelete.name)
      
      if (leadsToUpdate.length > 0) {
        const updatePromises = leadsToUpdate.map(lead =>
          updateLead(lead.id, { status: firstStage.name as Lead['status'] })
        )
        await Promise.all(updatePromises)
        toast.success(`Moved ${leadsToUpdate.length} lead(s) to "${firstStage.name}"`)
      }
    } catch (error) {
      console.error('Error updating leads:', error)
      toast.error('Failed to update leads, but stage will be deleted')
    }
    
    setWorkingStages(stages => stages.filter(stage => stage.id !== stageId))
    toast.success("Stage deleted")
  }

  const handleAddStage = () => {
    const newId = `stage-${Date.now()}`
    const newStage = {
      id: newId,
      name: "New Stage",
      color: "bg-gray-100 text-gray-700"
    }
    
    // Find the index of "won" stage to insert before it
    const wonIndex = workingStages.findIndex(stage => stage.id === "won")
    
    if (wonIndex !== -1) {
      // Insert before "won"
      const newStages = [...workingStages]
      newStages.splice(wonIndex, 0, newStage)
      setWorkingStages(newStages)
    } else {
      // Fallback: if "won" not found, add at the end
      setWorkingStages([...workingStages, newStage])
    }
  }

  const handleSave = async () => {
    try {
      const oldStages = getPipelineStages()
      const statusMapping: Record<string, string> = {}
      
      // Create mapping from old status names to new status names
      // Match by stage ID to handle renames
      oldStages.forEach(oldStage => {
        const newStage = workingStages.find(s => s.id === oldStage.id)
        if (newStage && oldStage.name !== newStage.name) {
          statusMapping[oldStage.name] = newStage.name
        }
      })
      
      // Update leads in database if status names changed
      if (Object.keys(statusMapping).length > 0) {
        try {
          const allLeads = await getLeads()
          const updatePromises = allLeads
            .filter(lead => statusMapping[lead.status])
            .map(lead => 
              updateLead(lead.id, { status: statusMapping[lead.status] as Lead['status'] })
            )
          
          await Promise.all(updatePromises)
          toast.success(`Updated ${updatePromises.length} lead(s) with renamed statuses`)
        } catch (error) {
          console.error('Error updating leads:', error)
          toast.error('Failed to update some leads, but stages were saved')
        }
      }
      
      // Save new stages
      savePipelineStages(workingStages)
      if (setFollowUpInterval) setFollowUpInterval(workingFollowUp)
      if (setAutoArchive) setAutoArchive(workingAutoArchive)
      if (setDefaultCurrency) setDefaultCurrency(workingCurrency)
      toast.success("Pipeline settings saved successfully")
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save pipeline settings')
    }
  }

  const handleCancel = () => {
    setWorkingStages(getPipelineStages())
    setWorkingFollowUp(followUpInterval)
    setWorkingAutoArchive(autoArchive)
    setWorkingCurrency(defaultCurrency)
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#3C3CFF]" />
            <SheetTitle className="text-2xl">Pipeline Settings</SheetTitle>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          {/* Pipeline Stages Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Pipeline Stages</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Customize the stages your leads move through.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {workingStages.map((stage, index) => {
                const isLocked = stage.id === "new" || stage.id === "won" || stage.id === "lost"
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isLocked 
                        ? "bg-gray-100 border-gray-300" 
                        : "bg-gray-50 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <GripVertical 
                      className={`h-4 w-4 ${isLocked ? "text-gray-300 cursor-not-allowed" : "text-gray-400 cursor-move"}`} 
                    />
                    <Input
                      value={stage.name}
                      onChange={(e) => handleUpdateStageName(stage.id, e.target.value)}
                      className="flex-1 bg-white"
                      disabled={isLocked}
                      readOnly={isLocked}
                    />
                    {isLocked && (
                      <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-200 rounded">
                        Locked
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveStageUp(index)}
                        disabled={index === 0 || isLocked}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMoveStageDown(index)}
                        disabled={index === workingStages.length - 1 || isLocked}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      {!isLocked && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteStage(stage.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddStage}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Stage
            </Button>
          </div>

          <Separator />

          {/* Lead Preferences Section */}
          {setFollowUpInterval && setAutoArchive && setDefaultCurrency && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Preferences</h3>
                
                <div className="space-y-6">
                  {/* Follow-up Interval */}
                  <div className="space-y-2">
                    <Label htmlFor="follow-up">
                      Default Follow-up Interval
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="follow-up"
                        type="number"
                        min="1"
                        value={workingFollowUp}
                        onChange={(e) => setWorkingFollowUp(parseInt(e.target.value) || 3)}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">
                        Remind me after X days if no response
                      </span>
                    </div>
                  </div>

                  {/* Auto-Archive */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <Label htmlFor="auto-archive" className="text-base font-medium">
                        Auto-Archive Inactive Leads
                      </Label>
                    </div>
                    <Switch
                      id="auto-archive"
                      checked={workingAutoArchive}
                      onCheckedChange={setWorkingAutoArchive}
                    />
                  </div>

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={workingCurrency} onValueChange={setWorkingCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 mt-8 pt-4 pb-2 -mx-6 px-6">
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
