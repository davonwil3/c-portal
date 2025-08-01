"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { getClients, type Client } from "@/lib/clients"
import { getProjectsByClient, type Project } from "@/lib/projects"

interface CreateFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateFormModal({ open, onOpenChange }: CreateFormModalProps) {
  const router = useRouter()
  const [formName, setFormName] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [availableProjects, setAvailableProjects] = useState<Project[]>([])
  const [enableNotifications, setEnableNotifications] = useState(true)
  const [dueDate, setDueDate] = useState<Date>()
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [loading, setLoading] = useState(true)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const loadClients = async () => {
      if (!open) return // Only load when modal is open
      
      setLoading(true)
      try {
        const clientsData = await getClients()
        setClients(clientsData)
      } catch (error) {
        console.error("Error loading clients:", error)
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [open])

  const handleClose = () => {
    // Reset form
    setFormName("")
    setSelectedClient("")
    setSelectedProject("")
    setAvailableProjects([])
    setEnableNotifications(true)
    setDueDate(undefined)
    setDatePickerOpen(false)
    setErrors({})
    onOpenChange(false)
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formName.trim()) {
      newErrors.formName = "Form name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (validateForm()) {
      setSubmitting(true)
      
      // Prepare form data
      const formData = {
        title: formName,
        client_id: selectedClient === "none" ? null : selectedClient,
        project_id: selectedProject === "none" ? null : selectedProject,
        notify_on_submission: enableNotifications,
        submission_deadline: dueDate ? dueDate.toISOString() : null,
      }
      
      console.log("Form data to be created:", formData)
      
      // TODO: Create form in database
      // await createForm(formData)
      
      // Navigate to form builder with form data
      const searchParams = new URLSearchParams({
        title: formName,
        client_id: selectedClient === "none" ? "" : selectedClient,
        project_id: selectedProject === "none" ? "" : selectedProject,
        notify_on_submission: enableNotifications.toString(),
        submission_deadline: dueDate ? dueDate.toISOString() : "",
      })
      
      router.push(`/dashboard/forms/builder?${searchParams.toString()}`)
      handleClose()
    }
  }

  const handleClientChange = async (clientId: string) => {
    setSelectedClient(clientId)
    setSelectedProject("") // Clear project selection when client changes
    
    if (clientId === "none") {
      setAvailableProjects([])
    } else {
      // Load projects for the selected client from database
      setLoadingProjects(true)
      try {
        const projects = await getProjectsByClient(clientId)
        setAvailableProjects(projects)
      } catch (error) {
        console.error("Error loading projects:", error)
        setAvailableProjects([])
      } finally {
        setLoadingProjects(false)
      }
    }
  }

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

          {/* Client and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="client">Link to Client (Optional)</Label>
              <Select value={selectedClient} onValueChange={handleClientChange}>
                <SelectTrigger className="rounded-xl border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]">
                  <SelectValue placeholder={loading ? "Loading clients..." : "Select a client"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {loading ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading clients...
                      </div>
                    </SelectItem>
                  ) : (
                    clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company || `${client.first_name} ${client.last_name}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="project">Link to Project (Optional)</Label>
              <Select 
                value={selectedProject} 
                onValueChange={setSelectedProject}
                disabled={selectedClient === "none" || selectedClient === ""}
              >
                <SelectTrigger className={cn(
                  "rounded-xl border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]",
                  (selectedClient === "none" || selectedClient === "") && "opacity-50 cursor-not-allowed"
                )}>
                  <SelectValue placeholder={
                    selectedClient === "none" || selectedClient === ""
                      ? "Select a client first" 
                      : loadingProjects
                        ? "Loading projects..."
                        : availableProjects.length === 0 
                          ? "No projects for this client" 
                          : "Select a project"
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project</SelectItem>
                  {loadingProjects ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading projects...
                      </div>
                    </SelectItem>
                  ) : (
                    availableProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedClient === "none" || selectedClient === "" ? (
                <p className="text-sm text-gray-500 mt-1">
                  Select a client first to see available projects
                </p>
              ) : loadingProjects ? (
                <p className="text-sm text-gray-500 mt-1">
                  Loading projects...
                </p>
              ) : availableProjects.length === 0 && selectedClient !== "none" ? (
                <p className="text-sm text-gray-500 mt-1">
                  No projects found for this client
                </p>
              ) : null}
            </div>
          </div>

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
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                <PopoverContent className="w-auto p-0 z-[60]" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setDatePickerOpen(false)
                    }}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              "Continue to Form Builder"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
