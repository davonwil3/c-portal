"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface CreateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Mock data for clients and projects
const mockClients = [
  { id: "1", name: "Acme Corp" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "Design Co" },
  { id: "4", name: "Marketing Plus" },
  { id: "5", name: "StartupXYZ" },
]

const mockProjects = {
  "1": [
    { id: "p1", name: "Website Redesign" },
    { id: "p2", name: "Brand Identity" },
  ],
  "2": [
    { id: "p3", name: "Mobile App Development" },
    { id: "p4", name: "API Integration" },
  ],
  "3": [
    { id: "p5", name: "Logo Design" },
    { id: "p6", name: "Marketing Materials" },
  ],
  "4": [
    { id: "p7", name: "SEO Campaign" },
    { id: "p8", name: "Social Media Strategy" },
  ],
  "5": [
    { id: "p9", name: "E-commerce Platform" },
    { id: "p10", name: "Payment Integration" },
  ],
}

export function CreateFormModal({ open, onOpenChange }: CreateFormModalProps) {
  const router = useRouter()
  const [formName, setFormName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [visibility, setVisibility] = useState<"specific" | "all">("specific")
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [dueDate, setDueDate] = useState<Date>()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleClose = () => {
    // Reset form
    setFormName("")
    setDescription("")
    setSelectedClients([])
    setSelectedProjects([])
    setVisibility("specific")
    setEnableNotifications(true)
    setDueDate(undefined)
    setErrors({})
    onOpenChange(false)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formName.trim()) {
      newErrors.formName = "Form name is required"
    }

    if (visibility === "specific" && selectedClients.length === 0) {
      newErrors.clients = "Please select at least one client"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // Navigate to form builder
      router.push("/dashboard/forms/builder")
      handleClose()
    }
  }

  const handleClientToggle = (clientId: string) => {
    setSelectedClients((prev) => (prev.includes(clientId) ? prev.filter((id) => id !== clientId) : [...prev, clientId]))
    // Clear projects when clients change
    setSelectedProjects([])
  }

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  // Get available projects based on selected clients
  const availableProjects = selectedClients.flatMap(
    (clientId) => mockProjects[clientId as keyof typeof mockProjects] || [],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Form</DialogTitle>
          <DialogDescription>Set up your form details and choose who can access it.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Form Name */}
          <div className="space-y-2">
            <Label htmlFor="form-name">
              Form Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="form-name"
              placeholder="e.g., Client Onboarding Form"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value)
                if (errors.formName) {
                  setErrors((prev) => ({ ...prev, formName: "" }))
                }
              }}
              className={cn(
                "rounded-xl border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]",
                errors.formName && "border-red-500 focus:border-red-500 focus:ring-red-500",
              )}
            />
            {errors.formName && <p className="text-sm text-red-600">{errors.formName}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of what this form is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] resize-none"
              rows={3}
            />
          </div>

          {/* Form Visibility */}
          <div className="space-y-3">
            <Label>Form Visibility</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="specific-clients"
                  name="visibility"
                  value="specific"
                  checked={visibility === "specific"}
                  onChange={(e) => setVisibility(e.target.value as "specific" | "all")}
                  className="text-[#3C3CFF] focus:ring-[#3C3CFF]"
                />
                <Label htmlFor="specific-clients" className="font-normal">
                  Specific clients and projects
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all-clients"
                  name="visibility"
                  value="all"
                  checked={visibility === "all"}
                  onChange={(e) => setVisibility(e.target.value as "specific" | "all")}
                  className="text-[#3C3CFF] focus:ring-[#3C3CFF]"
                />
                <Label htmlFor="all-clients" className="font-normal">
                  All current and future clients
                </Label>
              </div>
            </div>
          </div>

          {/* Client Selection */}
          {visibility === "specific" && (
            <div className="space-y-3">
              <Label>
                Select Clients <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                {mockClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`client-${client.id}`}
                      checked={selectedClients.includes(client.id)}
                      onCheckedChange={() => handleClientToggle(client.id)}
                      className="data-[state=checked]:bg-[#3C3CFF] data-[state=checked]:border-[#3C3CFF]"
                    />
                    <Label htmlFor={`client-${client.id}`} className="text-sm font-normal">
                      {client.name}
                    </Label>
                  </div>
                ))}
              </div>
              {errors.clients && <p className="text-sm text-red-600">{errors.clients}</p>}

              {/* Selected Clients Display */}
              {selectedClients.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedClients.map((clientId) => {
                    const client = mockClients.find((c) => c.id === clientId)
                    return (
                      <Badge
                        key={clientId}
                        variant="secondary"
                        className="bg-[#F0F2FF] text-[#3C3CFF] hover:bg-[#E6E9FF]"
                      >
                        {client?.name}
                        <button onClick={() => handleClientToggle(clientId)} className="ml-2 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Project Selection */}
          {visibility === "specific" && selectedClients.length > 0 && availableProjects.length > 0 && (
            <div className="space-y-3">
              <Label>Select Projects (Optional)</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-xl">
                {availableProjects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => handleProjectToggle(project.id)}
                      className="data-[state=checked]:bg-[#3C3CFF] data-[state=checked]:border-[#3C3CFF]"
                    />
                    <Label htmlFor={`project-${project.id}`} className="text-sm font-normal">
                      {project.name}
                    </Label>
                  </div>
                ))}
              </div>

              {/* Selected Projects Display */}
              {selectedProjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProjects.map((projectId) => {
                    const project = availableProjects.find((p) => p.id === projectId)
                    return (
                      <Badge key={projectId} variant="outline" className="border-[#3C3CFF] text-[#3C3CFF]">
                        {project?.name}
                        <button onClick={() => handleProjectToggle(projectId)} className="ml-2 hover:text-red-600">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Additional Options */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            {/* Notifications Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-600">Get notified when clients submit responses</p>
              </div>
              <Switch
                checked={enableNotifications}
                onCheckedChange={setEnableNotifications}
                className="data-[state=checked]:bg-[#3C3CFF]"
              />
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xl border-gray-200",
                      !dueDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
            Continue to Form Builder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
