"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Copy,
  Edit,
  Trash2,
  Zap,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  FolderOpen,
  Bell,
  Globe,
  Users,
  Briefcase,
  ChevronRight,
  Sparkles,
  Check,
  X as XIcon,
  ArrowRight,
  Settings,
  ExternalLink,
  Activity,
} from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useTour } from "@/contexts/TourContext"
import { dummyAutomations, dummyRunLogs } from "@/lib/tour-dummy-data"
import { 
  getAutomations, 
  createAutomation, 
  updateAutomation, 
  deleteAutomation,
  getRunLogs,
  type Automation as AutomationType,
  type CreateAutomationInput,
  type UpdateAutomationInput,
  type RunLog as RunLogType
} from "@/lib/automations"

// Types
interface Automation {
  id: string
  name: string
  description: string
  trigger: string
  triggerGroup: string
  conditions: string[]
  filters: Array<{ field: string; operator: string; value: string }>
  actions: ActionConfig[]
  scope: "global" | "client" | "project"
  targetId?: string
  targetName?: string
  enabled: boolean
  lastRun?: string
  successRate: number
  totalRuns: number
}

interface ActionConfig {
  type: "email" | "portal_notice" | "action_needed" | "create_task" | "schedule_reminder"
  config?: {
    // Email fields
    emailTo?: string[]
    emailSubject?: string
    emailBody?: string
    emailTemplate?: string
    // Portal Notice / Action Needed fields
    noticeType?: "notice" | "action_needed"
    noticeTitle?: string
    noticeMessage?: string
    noticeButtonLabel?: string
    noticeDeepLink?: string
    noticeExpireDays?: number
    // Task fields
    taskTitle?: string
    taskAssignee?: string
    taskDueInDays?: number
    taskNotes?: string
    // Reminder fields
    reminderWaitAmount?: number
    reminderWaitUnit?: "hours" | "days"
    reminderAction?: ActionConfig
  }
}

interface Template {
  id: string
  name: string
  description: string
  benefit: string
  trigger: string
  triggerGroup: string
  filters: Array<{ field: string; operator: string; value: string }>
  actions: ActionConfig[]
}

interface RunLog {
  id: string
  automationName: string
  timestamp: string
  target: string
  status: "success" | "failed"
  duration: string
  details?: string
}

// Trigger groups and options
const triggerGroups = [
  {
    label: "Leads & Proposals",
    options: [
      { value: "lead_created", label: "Lead created" },
      { value: "proposal_sent", label: "Proposal sent" },
      { value: "proposal_viewed", label: "Proposal viewed" },
      { value: "proposal_accepted", label: "Proposal accepted" },
      { value: "proposal_declined", label: "Proposal declined" },
    ],
  },
  {
    label: "Contracts",
    options: [
      { value: "contract.created", label: "Contract created" },
      { value: "contract.sent", label: "Contract sent" },
      { value: "contract.viewed", label: "Contract viewed" },
      { value: "contract.signed", label: "Contract signed" },
      { value: "contract.declined", label: "Contract declined" },
      { value: "contract.expired", label: "Contract expired" },
    ],
  },
  {
    label: "Invoices & Payments",
    options: [
      { value: "invoice.created", label: "Invoice created" },
      { value: "invoice.sent", label: "Invoice sent" },
      { value: "invoice.viewed", label: "Invoice viewed" },
      { value: "invoice.paid", label: "Invoice paid" },
      { value: "invoice.partially_paid", label: "Partial payment received" },
      { value: "invoice.overdue", label: "Invoice overdue" },
      { value: "invoice.due_soon", label: "Invoice due soon (≤ N days)" },
    ],
  },
  {
    label: "Forms & Files",
    options: [
      { value: "form.assigned", label: "Form assigned" },
      { value: "form.completed", label: "Form completed" },
      { value: "file.uploaded", label: "File uploaded by client" },
      { value: "file.request_overdue", label: "File request overdue" },
    ],
  },
  {
    label: "Messages",
    options: [
      { value: "portal_message", label: "New portal message from client" },
      { value: "email_received", label: "New email received from client" },
      { value: "no_reply", label: "No reply from client after N days" },
    ],
  },
  {
    label: "Tasks & Milestones",
    options: [
      { value: "task_needs_review", label: "Task status changes to \"Needs review\"" },
      { value: "task_overdue", label: "Task overdue" },
      { value: "phase_completed", label: "All tasks in phase completed" },
      { value: "milestone_reached", label: "Milestone reached" },
    ],
  },
  {
    label: "Appointments",
    options: [
      { value: "meeting_booked", label: "Meeting booked" },
      { value: "meeting_rescheduled", label: "Meeting rescheduled" },
      { value: "no_show", label: "No-show detected" },
      { value: "meeting_soon", label: "Next meeting in ≤ N hours" },
    ],
  },
  {
    label: "Portal",
    options: [
      { value: "first_login", label: "Client first login" },
      { value: "inactive_client", label: "Client hasn't logged in N days" },
      { value: "action_needed_created", label: "Action Needed created" },
      { value: "action_needed_resolved", label: "Action Needed resolved" },
    ],
  },
]

// Mock data
const mockAutomations: Automation[] = [
  {
    id: "1",
    name: "Overdue Invoice Reminder",
    description: "Automatically remind clients about overdue invoices",
    trigger: "invoice.overdue",
    triggerGroup: "Invoices & Payments",
    conditions: [],
    filters: [{ field: "totalAmount", operator: ">", value: "100" }],
    actions: [
      { type: "email", config: { emailTo: ["client"], emailSubject: "Invoice overdue", emailBody: "Your invoice is overdue" } },
      { type: "portal_notice", config: { noticeType: "notice", noticeTitle: "Payment reminder", noticeMessage: "Please review your overdue invoice" } }
    ],
    scope: "global",
    enabled: true,
    lastRun: "2 hours ago",
    successRate: 98,
    totalRuns: 127,
  },
  {
    id: "2",
    name: "New Message Alert",
    description: "Get notified when clients reply on the portal",
    trigger: "portal_message",
    triggerGroup: "Messages",
    conditions: [],
    filters: [],
    actions: [{ type: "email", config: { emailTo: ["me"], emailSubject: "New client message", emailBody: "A client has sent you a message" } }],
    scope: "global",
    enabled: true,
    lastRun: "15 minutes ago",
    successRate: 100,
    totalRuns: 43,
  },
  {
    id: "3",
    name: "Task Assignment",
    description: "Create task when form is completed",
    trigger: "form_completed",
    triggerGroup: "Forms & Files",
    conditions: [],
    filters: [],
    actions: [{ type: "create_task", config: { taskTitle: "Review form submission", taskAssignee: "me", taskDueInDays: 2 } }],
    scope: "client",
    targetId: "client-1",
    targetName: "Acme Corp",
    enabled: false,
    lastRun: "3 days ago",
    successRate: 95,
    totalRuns: 21,
  },
]

const mockTemplates: Template[] = [
  {
    id: "t1",
    name: "Invoice Overdue → Email + Notice",
    description: "When invoice overdue and amount ≥ $500 → Send Email (client) + Portal Notice",
    benefit: "Automatically remind clients about high-value overdue invoices",
    trigger: "invoice.overdue",
    triggerGroup: "Invoices & Payments",
    filters: [{ field: "totalAmount", operator: ">=", value: "500" }],
    actions: [
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Payment Overdue - Action Required",
          emailBody: "Your invoice is overdue. Please review and make payment at your earliest convenience.",
        },
      },
      {
        type: "portal_notice",
        config: {
          noticeType: "action_needed",
          noticeTitle: "Payment Overdue",
          noticeMessage: "Your invoice is overdue. Please review and make payment.",
          noticeButtonLabel: "View Invoice",
          noticeExpireDays: 7,
        },
      },
    ],
  },
  {
    id: "t2",
    name: "Contract Signed → Kickoff",
    description: "When contract signed → Create Task + Send Email",
    benefit: "Automatically kick off new projects when contracts are signed",
    trigger: "contract_signed",
    triggerGroup: "Contracts",
    filters: [],
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Kickoff call prep",
          taskAssignee: "me",
          taskDueInDays: 2,
          taskNotes: "Prepare agenda and materials for client kickoff call",
        },
      },
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Welcome! Your project is starting",
          emailBody: "Thank you for signing the contract! We're excited to get started. Here's your portal link: {{PortalURL}}",
        },
      },
    ],
  },
  {
    id: "t3",
    name: "Proposal Accepted → Convert",
    description: "When proposal accepted → Create Task + Add Timeline Note + Send Email",
    benefit: "Streamline the conversion from proposal to active project",
    trigger: "proposal_accepted",
    triggerGroup: "Leads & Proposals",
    filters: [],
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Setup project & invoice",
          taskAssignee: "me",
          taskDueInDays: 1,
          taskNotes: "Create project workspace and generate initial invoice",
        },
      },
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Next Steps - Your Proposal Was Accepted",
          emailBody: "Great news! We're moving forward. Here's what happens next: {{ProjectName}}",
        },
      },
    ],
  },
  {
    id: "t4",
    name: "Form Completed → Review",
    description: "When form completed → Create Task + Send Email",
    benefit: "Ensure forms are reviewed promptly and clients are thanked",
    trigger: "form_completed",
    triggerGroup: "Forms & Files",
    filters: [],
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Review intake",
          taskAssignee: "me",
          taskDueInDays: 1,
          taskNotes: "Review completed form and process accordingly",
        },
      },
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Thank You - Form Received",
          emailBody: "We've received your form submission. We'll review it and get back to you soon with next steps.",
        },
      },
    ],
  },
  {
    id: "t5",
    name: "Meeting Booked → Prep",
    description: "When meeting booked and type is Video → Create Task + Send Email",
    benefit: "Automatically prepare for video meetings with clients",
    trigger: "meeting_booked",
    triggerGroup: "Appointments",
    filters: [{ field: "type", operator: "=", value: "Video" }],
    actions: [
      {
        type: "create_task",
        config: {
          taskTitle: "Draft agenda",
          taskAssignee: "me",
          taskDueInDays: 1,
          taskNotes: "Prepare meeting agenda and discussion points",
        },
      },
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Meeting Prep Checklist",
          emailBody: "Looking forward to our video call on {{MeetingDate}} at {{MeetingTime}}. Here's a quick prep checklist to help you prepare.",
        },
      },
    ],
  },
  {
    id: "t6",
    name: "No Reply in 3 days → Bump",
    description: "When no reply from client after N days → Send Email + Schedule Reminder",
    benefit: "Gently follow up with clients who haven't responded",
    trigger: "no_reply",
    triggerGroup: "Messages",
    filters: [],
    actions: [
      {
        type: "email",
        config: {
          emailTo: ["client"],
          emailSubject: "Friendly Follow-Up",
          emailBody: "Just wanted to follow up on my previous message. Let me know if you have any questions!",
        },
      },
      {
        type: "schedule_reminder",
        config: {
          reminderWaitAmount: 3,
          reminderWaitUnit: "days",
          reminderAction: {
            type: "portal_notice",
            config: {
              noticeType: "action_needed",
              noticeTitle: "Follow-Up Needed",
              noticeMessage: "We haven't heard from you. Please let us know if you need anything.",
            },
          },
        },
      },
    ],
  },
]

// Mock run logs (kept for reference, but not used - we use real data from database)
const mockRunLogs: RunLog[] = [
  {
    id: "r1",
    automationName: "Overdue Invoice Reminder",
    timestamp: "2024-01-15 14:32:15",
    target: "Acme Corp",
    status: "success",
    duration: "1.2s",
    details: "Email sent successfully",
  },
  {
    id: "r2",
    automationName: "New Message Alert",
    timestamp: "2024-01-15 14:15:42",
    target: "TechStart Inc",
    status: "success",
    duration: "0.8s",
    details: "Notification delivered",
  },
  {
    id: "r3",
    automationName: "Task Assignment",
    timestamp: "2024-01-15 12:05:33",
    target: "Global",
    status: "failed",
    duration: "2.1s",
    details: "Failed to create task: Invalid assignee",
  },
]

export default function AutomationsPage() {
  const { isTourRunning, currentTour } = useTour()
  const [activeTab, setActiveTab] = useState("automations")
  const [scope, setScope] = useState("global")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [showBuilder, setShowBuilder] = useState(false)
  const [showRunLogDetails, setShowRunLogDetails] = useState(false)
  const [selectedLog, setSelectedLog] = useState<RunLog | null>(null)
  const [editingAutomation, setEditingAutomation] = useState<Automation | null>(null)
  const [loading, setLoading] = useState(true)
  const [runLogs, setRunLogs] = useState<RunLog[]>([])
  const [runLogsLoading, setRunLogsLoading] = useState(false)
  
  // Use dummy data during tours, otherwise use real data from database
  const [automations, setAutomations] = useState<Automation[]>([])

  // Load automations from database (skip if tour is running)
  useEffect(() => {
    const loadAutomations = async () => {
      if (isTourRunning && currentTour?.id === "automations") {
        // Use dummy data during tour
        setAutomations(dummyAutomations)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getAutomations()
        setAutomations(data)
      } catch (error) {
        console.error('Error loading automations:', error)
        toast.error('Failed to load automations')
      } finally {
        setLoading(false)
      }
    }

    loadAutomations()
  }, [isTourRunning, currentTour?.id])

  // Load run logs from database (skip if tour is running)
  useEffect(() => {
    const loadRunLogs = async () => {
      if (isTourRunning && currentTour?.id === "automations") {
        // Use dummy data during tour
        setRunLogs(dummyRunLogs.map(log => ({
          ...log,
          timestamp: log.timestamp.replace('T', ' ').replace('Z', '')
        })))
        return
      }

      try {
        setRunLogsLoading(true)
        const data = await getRunLogs()
        setRunLogs(data.map(log => ({
          ...log,
          timestamp: log.timestamp.replace('T', ' ').replace('Z', '')
        })))
      } catch (error) {
        console.error('Error loading run logs:', error)
        toast.error('Failed to load run logs')
      } finally {
        setRunLogsLoading(false)
      }
    }

    loadRunLogs()
  }, [isTourRunning, currentTour?.id])

  // Auto-close modal when tour explicitly asks
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "automations" && showBuilder) {
      let hasClosed = false
      
      const checkForCloseSignal = () => {
        if (hasClosed) return
        
        // Look for the tour hint/overlay that indicates we're done with the modal
        const allElements = document.querySelectorAll('*')
        for (const el of allElements) {
          const text = el.textContent || ''
          // If we see hints about templates tab or main automations page, close the modal
          if (text.includes("Templates") && text.includes("tab") && text.includes("pre-built")) {
            setShowBuilder(false)
            hasClosed = true
            break
          }
        }
        
        // Also check if tour is waiting for automations-tab-content (means modal should be closed)
        const automationsTabContent = document.querySelector("[data-help='automations-tab-content']")
        const tourOverlay = document.querySelector('[class*="react-joyride"], [class*="tour-overlay"]')
        if (automationsTabContent && tourOverlay && !hasClosed) {
          setShowBuilder(false)
          hasClosed = true
        }
      }
      
      const interval = setInterval(checkForCloseSignal, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, showBuilder])

  // Ensure we start on automations tab when tour starts
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "automations" && activeTab !== "automations") {
      setActiveTab("automations")
    }
  }, [isTourRunning, currentTour?.id])

  // Auto-switch tabs when tour explicitly asks
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "automations") {
      let hasSwitchedToTemplates = false
      let hasSwitchedToRunlog = false
      
      const checkForTabSwitch = () => {
        // Look for the tour hint that indicates we should switch to templates
        if (!hasSwitchedToTemplates && activeTab === "automations") {
          const allElements = document.querySelectorAll('*')
          for (const el of allElements) {
            const text = el.textContent || ''
            // If we see the templates hint, switch to templates tab
            if (text.includes("Templates") && text.includes("tab") && text.includes("pre-built")) {
              setActiveTab("templates")
              hasSwitchedToTemplates = true
              break
            }
          }
        }
        
        // Look for the tour hint that indicates we should switch to runlog
        if (!hasSwitchedToRunlog && activeTab === "templates") {
          const allElements = document.querySelectorAll('*')
          for (const el of allElements) {
            const text = el.textContent || ''
            // If we see the run log hint, switch to runlog tab
            if (text.includes("Run Log") && text.includes("tab") && text.includes("history")) {
              setActiveTab("runlog")
              hasSwitchedToRunlog = true
              break
            }
          }
        }
      }
      
      const interval = setInterval(checkForTabSwitch, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  // Builder state
  const [builderName, setBuilderName] = useState("")
  const [builderDescription, setBuilderDescription] = useState("")
  const [builderTrigger, setBuilderTrigger] = useState("")
  const [builderTriggerGroup, setBuilderTriggerGroup] = useState("")
  const [builderActions, setBuilderActions] = useState<ActionConfig[]>([])
  const [builderScope, setBuilderScope] = useState<"global" | "client" | "project">("global")
  const [builderEnabled, setBuilderEnabled] = useState(true)
  const [builderFilters, setBuilderFilters] = useState<Array<{ field: string; operator: string; value: string }>>([])
  const [showFilters, setShowFilters] = useState(false)
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null)

  const filteredAutomations = automations.filter((automation) => {
    const matchesSearch = automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      automation.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "enabled" && automation.enabled) ||
      (statusFilter === "disabled" && !automation.enabled)
    const matchesScope = scope === "global" || automation.scope === scope
    return matchesSearch && matchesStatus && matchesScope
  })

  const filteredTemplates = mockTemplates

  const handleToggleAutomation = async (id: string) => {
    if (isTourRunning && currentTour?.id === "automations") {
      // During tour, just update local state
      setAutomations(automations.map(auto =>
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      ))
      toast.success("Automation updated (tour mode)")
      return
    }

    try {
      const automation = automations.find(a => a.id === id)
      if (!automation) return

      await updateAutomation(id, { enabled: !automation.enabled })
      setAutomations(automations.map(auto =>
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      ))
      toast.success("Automation updated")
    } catch (error) {
      console.error('Error toggling automation:', error)
      toast.error('Failed to update automation')
    }
  }

  const handleDeleteAutomation = async (id: string) => {
    if (isTourRunning && currentTour?.id === "automations") {
      // During tour, just update local state
      setAutomations(automations.filter(auto => auto.id !== id))
      toast.success("Automation deleted (tour mode)")
      return
    }

    try {
      await deleteAutomation(id)
      setAutomations(automations.filter(auto => auto.id !== id))
      toast.success("Automation deleted")
    } catch (error) {
      console.error('Error deleting automation:', error)
      toast.error('Failed to delete automation')
    }
  }

  const handleDuplicateAutomation = async (automation: Automation) => {
    if (isTourRunning && currentTour?.id === "automations") {
      // During tour, just update local state
      const newAutomation = {
        ...automation,
        id: `${automation.id}-copy`,
        name: `${automation.name} (Copy)`,
      }
      setAutomations([...automations, newAutomation])
      toast.success("Automation duplicated (tour mode)")
      return
    }

    try {
      const input: CreateAutomationInput = {
        name: `${automation.name} (Copy)`,
        description: automation.description,
        trigger: automation.trigger,
        triggerGroup: automation.triggerGroup,
        conditions: automation.conditions,
        filters: automation.filters,
        actions: automation.actions,
        scope: automation.scope,
        targetId: automation.targetId,
        targetName: automation.targetName,
        enabled: automation.enabled,
      }
      const newAutomation = await createAutomation(input)
      setAutomations([...automations, newAutomation])
      toast.success("Automation duplicated")
    } catch (error) {
      console.error('Error duplicating automation:', error)
      toast.error('Failed to duplicate automation')
    }
  }

  const handleUseTemplate = (template: Template) => {
    setBuilderName(template.name)
    setBuilderDescription(template.description)
    setBuilderTrigger(template.trigger)
    setBuilderTriggerGroup(template.triggerGroup)
    setBuilderFilters(template.filters || [])
    setShowFilters(template.filters && template.filters.length > 0)
    setBuilderActions(template.actions || [])
    setBuilderScope("global")
    setBuilderEnabled(true)
    setEditingAutomation(null)
    setShowBuilder(true)
  }

  const handleSaveAutomation = async () => {
    if (!builderName || !builderTrigger || builderActions.length === 0) {
      toast.error("Please complete all required fields")
      return
    }

    // Validate filters if present
    if (builderFilters.length > 0) {
      const hasIncomplete = builderFilters.some(f => {
        const isSpecial = f.field === "has_attachment"
        return !f.field || !f.operator || (!isSpecial && !f.value)
      })
      if (hasIncomplete) {
        toast.error("Please complete all filter fields")
        return
      }
    }

    if (isTourRunning && currentTour?.id === "automations") {
      // During tour, just update local state
      if (editingAutomation) {
        setAutomations(automations.map(auto =>
          auto.id === editingAutomation.id
            ? {
              ...auto,
              name: builderName,
              description: builderDescription,
              trigger: builderTrigger,
              triggerGroup: builderTriggerGroup,
              filters: builderFilters,
              actions: builderActions,
              scope: builderScope,
              enabled: builderEnabled,
            }
            : auto
        ))
        toast.success("Automation updated (tour mode)")
      } else {
        const newAutomation: Automation = {
          id: `auto-${Date.now()}`,
          name: builderName,
          description: builderDescription,
          trigger: builderTrigger,
          triggerGroup: builderTriggerGroup,
          conditions: [],
          filters: builderFilters,
          actions: builderActions,
          scope: builderScope,
          enabled: builderEnabled,
          successRate: 0,
          totalRuns: 0,
        }
        setAutomations([...automations, newAutomation])
        toast.success("Automation created (tour mode)")
      }
      resetBuilder()
      return
    }

    try {
      if (editingAutomation) {
        const input: UpdateAutomationInput = {
          name: builderName,
          description: builderDescription,
          trigger: builderTrigger,
          triggerGroup: builderTriggerGroup,
          filters: builderFilters,
          actions: builderActions,
          scope: builderScope,
          enabled: builderEnabled,
        }
        const updated = await updateAutomation(editingAutomation.id, input)
        setAutomations(automations.map(auto =>
          auto.id === editingAutomation.id ? updated : auto
        ))
        toast.success("Automation updated")
      } else {
        const input: CreateAutomationInput = {
          name: builderName,
          description: builderDescription,
          trigger: builderTrigger,
          triggerGroup: builderTriggerGroup,
          filters: builderFilters,
          actions: builderActions,
          scope: builderScope,
          enabled: builderEnabled,
        }
        const newAutomation = await createAutomation(input)
        setAutomations([...automations, newAutomation])
        toast.success("Automation created")
      }
      resetBuilder()
    } catch (error) {
      console.error('Error saving automation:', error)
      toast.error('Failed to save automation')
    }
  }

  // Helper functions for filters
  const getFilterFields = (trigger: string) => {
    const commonFields = [
      { value: "client", label: "Client" },
      { value: "project", label: "Project" },
      { value: "tag", label: "Tag" },
    ]

    // Proposals
    if (trigger.includes("proposal")) {
      return [
        ...commonFields,
        { value: "amount", label: "Amount" },
        { value: "template", label: "Template" },
      ]
    }

    // Contracts
    if (trigger.includes("contract")) {
      return [
        ...commonFields,
        { value: "status", label: "Status" },
      ]
    }

    // Invoices
    if (trigger.includes("invoice") || trigger.includes("payment")) {
      return [
        ...commonFields,
        { value: "status", label: "Status" },
        { value: "amount", label: "Amount" },
        { value: "due_in", label: "Due in (days)" },
        { value: "days_overdue", label: "Days overdue" },
      ]
    }

    // Tasks
    if (trigger.includes("task") || trigger.includes("milestone") || trigger.includes("phase")) {
      return [
        ...commonFields,
        { value: "status", label: "Status" },
        { value: "assignee", label: "Assignee" },
        { value: "due_in", label: "Due in (days)" },
      ]
    }

    // Messages
    if (trigger.includes("message") || trigger.includes("email") || trigger.includes("reply")) {
      return [
        ...commonFields,
        { value: "source", label: "Source (Portal/Email)" },
        { value: "has_attachment", label: "Has attachment" },
      ]
    }

    // Appointments
    if (trigger.includes("meeting") || trigger.includes("show") || trigger === "meeting_soon") {
      return [
        ...commonFields,
        { value: "type", label: "Type" },
        { value: "start_in", label: "Start in (hours)" },
      ]
    }

    // Portal
    if (trigger.includes("login") || trigger === "inactive_client" || trigger === "first_login") {
      return [
        ...commonFields,
        { value: "last_login", label: "Last login (days)" },
      ]
    }

    return commonFields
  }

  const getFilterOperators = (field: string) => {
    if (field === "amount" || field === "due_in" || field === "days_overdue" || field === "last_login" || field === "start_in") {
      return [
        { value: ">", label: ">" },
        { value: "<", label: "<" },
        { value: ">=", label: "≥" },
        { value: "<=", label: "≤" },
        { value: "=", label: "is" },
      ]
    }
    if (field === "has_attachment") {
      return [
        { value: "=", label: "is" },
        { value: "!=", label: "is not" },
      ]
    }
    return [
      { value: "=", label: "is" },
      { value: "!=", label: "is not" },
      { value: "includes", label: "includes" },
    ]
  }

  const resetBuilder = () => {
    setBuilderName("")
    setBuilderDescription("")
    setBuilderTrigger("")
    setBuilderTriggerGroup("")
    setBuilderActions([])
    setBuilderScope("global")
    setBuilderEnabled(true)
    setBuilderFilters([])
    setShowFilters(false)
    setEditingActionIndex(null)
    setEditingAutomation(null)
    setShowBuilder(false)
  }

  const handleEditAutomation = (automation: Automation) => {
    setEditingAutomation(automation)
    setBuilderName(automation.name)
    setBuilderDescription(automation.description)
    setBuilderTrigger(automation.trigger)
    setBuilderTriggerGroup(automation.triggerGroup)
    setBuilderFilters(automation.filters)
    setShowFilters(automation.filters.length > 0)
    setBuilderActions(automation.actions)
    setBuilderScope(automation.scope)
    setBuilderEnabled(automation.enabled)
    setShowBuilder(true)
  }

  const getTriggerLabel = (triggerValue: string) => {
    for (const group of triggerGroups) {
      const option = group.options.find(opt => opt.value === triggerValue)
      if (option) return option.label
    }
    return triggerValue
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner - Full Width */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-5 text-white mb-4">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-1">
                  Automations
                </h1>
                <p className="text-blue-100 text-base">
                  Automate your routine tasks - let Jolix handle the busy work.
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{automations.length}</div>
                  <div className="text-blue-100 text-sm">Total Automations</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Zap className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-6">
              <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
                <TabsTrigger
                  value="automations"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4647E0] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                  data-help="automations-tab"
                >
                  My Automations
                </TabsTrigger>
                <TabsTrigger
                  value="templates"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4647E0] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                  data-help="templates-tab"
                >
                  Templates
                </TabsTrigger>
                <TabsTrigger
                  value="runlog"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#4647E0] data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-3"
                  data-help="runlog-tab"
                >
                  Run Log
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setShowBuilder(true)}
                  className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                  data-help="btn-new-automation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Automation
                </Button>
              </div>
            </div>

            {/* My Automations Tab */}
            <TabsContent value="automations" className="mt-0 space-y-6" data-help="automations-tab-content">
              {/* Scope & Filters */}
              <Card className="border-0 shadow-sm rounded-2xl" data-help="automations-filters">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Scope Selector */}
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-gray-600">Scope:</Label>
                      <div className="flex gap-2">
                        {["global", "client", "project"].map((scopeOption) => (
                          <button
                            key={scopeOption}
                            onClick={() => setScope(scopeOption)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${scope === scopeOption
                              ? "bg-[#4647E0] text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                          >
                            {scopeOption.charAt(0).toUpperCase() + scopeOption.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <Separator orientation="vertical" className="h-8" />

                    {/* Search */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search automations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Helper Banner */}
              <Card className="border-0 shadow-sm rounded-2xl bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-xs font-bold">i</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        {scope === "global" && "Global Automations"}
                        {scope === "client" && "Client Automations"}
                        {scope === "project" && "Project Automations"}
                      </h3>
                      <p className="text-sm text-blue-800">
                        {scope === "global" && (
                          <>Global automations run for <strong>every client and every situation</strong> that matches the trigger conditions. Use these for universal workflows like invoice reminders, message alerts, or scheduled reports that apply across your entire business.</>
                        )}
                        {scope === "client" && (
                          <>Client automations run only for <strong>specific clients</strong> you select. Use these for personalized workflows tailored to individual client needs, such as custom onboarding sequences or client-specific communication rules.</>
                        )}
                        {scope === "project" && (
                          <>Project automations run only for <strong>specific projects</strong> you select. Use these for project-specific workflows like task assignments, milestone notifications, or project-based reporting that only apply to certain work.</>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Automation Cards */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-gray-500">Loading automations...</div>
                </div>
              ) : filteredAutomations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-help="automations-grid">
                  {filteredAutomations.map((automation) => (
                    <Card
                      key={automation.id}
                      className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200 group"
                    >
                      <CardContent className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Zap className="h-5 w-5 text-[#4647E0]" />
                              <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{automation.description}</p>

                            {/* When → Then Summary */}
                            <div className="bg-gray-50 rounded-xl p-3 mb-3">
                              <div className="flex items-start gap-2 text-xs">
                                <span className="font-medium text-gray-700">When</span>
                                <ArrowRight className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">{getTriggerLabel(automation.trigger)}</span>
                              </div>
                              {automation.filters && automation.filters.length > 0 && (
                                <div className="flex items-start gap-2 text-xs mt-1">
                                  <span className="font-medium text-gray-700">And</span>
                                  <span className="text-gray-600">
                                    {automation.filters.map((f, idx) => {
                                      const fieldLabel = getFilterFields(automation.trigger).find(field => field.value === f.field)?.label || f.field
                                      return `${fieldLabel} ${f.operator} ${f.value}${idx < automation.filters.length - 1 ? ", " : ""}`
                                    })}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-start gap-2 text-xs mt-1">
                                <span className="font-medium text-gray-700">Then</span>
                                <ArrowRight className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-600">
                                  {automation.actions.map((action: any, idx: number) => {
                                    let label = ""
                                    switch (action.type) {
                                      case "email":
                                        label = `Email ${action.config?.emailTo?.join(" & ") || "..."}`
                                        break
                                      case "portal_notice":
                                        label = "Action Needed"
                                        break
                                      case "create_task":
                                        label = "Create task"
                                        break
                                      case "schedule_reminder":
                                        label = `Wait ${action.config?.reminderWaitAmount || 1} ${action.config?.reminderWaitUnit || "days"}`
                                        break
                                    }
                                    return `${label}${idx < automation.actions.length - 1 ? " → " : ""}`
                                  }).join("")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleEditAutomation(automation)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateAutomation(automation)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteAutomation(automation.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 mb-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {automation.lastRun || "Never"}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {automation.successRate}%
                          </div>
                          <div>{automation.totalRuns} runs</div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-2">
                            <Badge variant={automation.enabled ? "default" : "secondary"} className={automation.enabled ? "bg-green-100 text-green-700 border-green-200" : ""}>
                              {automation.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {automation.scope !== "global" && (
                              <Badge variant="outline" className="text-xs">
                                {automation.scope === "client" ? <Users className="h-3 w-3 mr-1" /> : <Briefcase className="h-3 w-3 mr-1" />}
                                {automation.targetName || automation.scope}
                              </Badge>
                            )}
                          </div>
                          <Switch
                            checked={automation.enabled}
                            onCheckedChange={() => handleToggleAutomation(automation.id)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No automations yet</h3>
                    <p className="text-gray-600 mb-6">Start with a template or create your own.</p>
                    <Button
                      onClick={() => setActiveTab("templates")}
                      className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                    >
                      Browse Templates
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="mt-0 space-y-6" data-help="templates-tab-content">
              {/* Template Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-help="templates-grid">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 bg-[#4647E0]/10 rounded-lg">
                          <Sparkles className="h-5 w-5 text-[#4647E0]" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                        <p className="text-xs text-green-800 font-medium">{template.benefit}</p>
                      </div>

                      <Button
                        onClick={() => handleUseTemplate(template)}
                        className="w-full bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                      >
                        Use Template
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Run Log Tab */}
            <TabsContent value="runlog" className="mt-0 space-y-6" data-help="runlog-tab-content">
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-6">
                  <div className="overflow-x-auto" data-help="runlog-table">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Timestamp</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Automation</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Target</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Result</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Duration</th>
                          <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runLogsLoading ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              Loading run logs...
                            </td>
                          </tr>
                        ) : runLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gray-500">
                              No run logs yet
                            </td>
                          </tr>
                        ) : (
                          runLogs.map((log) => (
                          <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4 text-sm text-gray-900">{log.timestamp}</td>
                            <td className="py-4 px-4 text-sm text-gray-900">{log.automationName}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{log.target}</td>
                            <td className="py-4 px-4">
                              {log.status === "success" ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Success
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="py-4 px-4 text-sm text-gray-600">{log.duration}</td>
                            <td className="py-4 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedLog(log)
                                  setShowRunLogDetails(true)
                                }}
                              >
                                View Details
                              </Button>
                            </td>
                          </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Builder Sheet */}
      <Sheet 
        open={showBuilder} 
        onOpenChange={(open) => {
          // During tours, prevent accidental closing from overlay/escape
          if (isTourRunning && !open) {
            return
          }
          setShowBuilder(open)
        }}
        modal={!isTourRunning}
      >
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto [&>button]:hidden" data-help="automation-builder-modal">
          <SheetHeader className="relative">
            <SheetTitle data-help="automation-modal-title">{editingAutomation ? "Edit Automation" : "New Automation"}</SheetTitle>
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
              data-help="btn-close-automation-modal"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </SheetHeader>

          <div className="space-y-6 py-6" data-help="automation-builder-content">
            {/* Name */}
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={builderName}
                onChange={(e) => setBuilderName(e.target.value)}
                placeholder="e.g., Overdue Invoice Reminder"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={builderDescription}
                onChange={(e) => setBuilderDescription(e.target.value)}
                placeholder="Brief description of what this automation does..."
                rows={2}
              />
            </div>

            <Separator />

            {/* Sentence Builder */}
            <div className="space-y-4" data-help="automation-builder-sections">
              <Label className="text-lg font-semibold">Build Your Automation</Label>

              {/* When */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3" data-help="automation-when-section">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-700">When</span>
                  <Select 
                    value={builderTrigger} 
                    onValueChange={(value) => {
                      setBuilderTrigger(value)
                      // Find and set trigger group
                      for (const group of triggerGroups) {
                        const option = group.options.find(opt => opt.value === value)
                        if (option) {
                          setBuilderTriggerGroup(group.label)
                          break
                        }
                      }
                      // Pre-seed sensible filter defaults for certain triggers
                      if (value === "inactive_client") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "last_login", operator: ">=", value: "" }])
                      } else if (value === "invoice.due_soon") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "daysUntilDue", operator: "<=", value: "" }])
                      } else if (value === "invoice.overdue") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "daysOverdue", operator: ">=", value: "" }])
                      } else if (value === "invoice.partially_paid") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "paidAmount", operator: ">", value: "" }])
                      } else if (value === "invoice.created" || value === "invoice.sent" || value === "invoice.viewed" || value === "invoice.paid") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "totalAmount", operator: ">", value: "" }])
                      } else if (value === "contract.created" || value === "contract.sent" || value === "contract.viewed" || value === "contract.signed" || value === "contract.declined" || value === "contract.expired") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "totalValue", operator: ">", value: "" }])
                      } else if (value === "form.assigned" || value === "form.completed") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "clientId", operator: "equals", value: "" }])
                      } else if (value === "file.uploaded") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "uploadedByClient", operator: "equals", value: "true" }])
                      } else if (value === "file.request_overdue") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "daysOverdue", operator: ">=", value: "" }])
                      } else if (value === "meeting_soon") {
                        setShowFilters(true)
                        setBuilderFilters([{ field: "start_in", operator: "<=", value: "" }])
                      } else {
                        setShowFilters(false)
                        setBuilderFilters([])
                      }
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select trigger..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[400px]">
                      {triggerGroups.map((group) => (
                        <div key={group.label}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase">
                            {group.label}
                          </div>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filters Section (replaces old Conditions) */}
                {builderTrigger && (
                  <div className="flex items-start gap-3" data-help="automation-and-section">
                    <span className="text-sm font-semibold text-gray-700 mt-2">And</span>
                    <div className="flex-1 space-y-3">
                      {!showFilters && builderFilters.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowFilters(true)
                            setBuilderFilters([{ field: "", operator: "", value: "" }])
                          }}
                          className="text-sm text-[#4647E0] hover:text-[#3c3dd0] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add a filter (optional)
                        </button>
                      ) : (
                        <>
                          {builderFilters.map((filter, index) => {
                            const availableFields = getFilterFields(builderTrigger)
                            const availableOperators = filter.field ? getFilterOperators(filter.field) : []
                            const isSpecialField = filter.field === "date" || filter.field === "has_attachment"
                            const isIncomplete = !filter.field || !filter.operator || (!isSpecialField && !filter.value)

                            return (
                              <div key={index} className="flex items-start gap-2">
                                {index > 0 && (
                                  <span className="text-sm text-gray-500 mt-2.5">and</span>
                                )}
                                <div className="flex-1 grid grid-cols-3 gap-2">
                                  <Select
                                    value={filter.field}
                                    onValueChange={(value) => {
                                      const newFilters = [...builderFilters]
                                      newFilters[index] = { field: value, operator: "", value: "" }
                                      setBuilderFilters(newFilters)
                                    }}
                                  >
                                    <SelectTrigger className={isIncomplete && filter.field === "" ? "border-red-300" : ""}>
                                      <SelectValue placeholder="Field" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableFields.map((field) => (
                                        <SelectItem key={field.value} value={field.value}>
                                          {field.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <Select
                                    value={filter.operator}
                                    onValueChange={(value) => {
                                      const newFilters = [...builderFilters]
                                      // Auto-set value for special fields
                                      if (filter.field === "date" || filter.field === "has_attachment") {
                                        newFilters[index] = { ...newFilters[index], operator: value, value: value }
                                      } else {
                                        newFilters[index] = { ...newFilters[index], operator: value }
                                      }
                                      setBuilderFilters(newFilters)
                                    }}
                                    disabled={!filter.field}
                                  >
                                    <SelectTrigger className={isIncomplete && filter.operator === "" ? "border-red-300" : ""}>
                                      <SelectValue placeholder="Operator" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableOperators.map((op) => (
                                        <SelectItem key={op.value} value={op.value}>
                                          {op.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>

                                  <div className="flex items-center gap-2">
                                    {filter.field === "date" || filter.field === "has_attachment" ? (
                                      <div className="flex-1 px-3 py-2 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                                        {filter.field === "date" 
                                          ? (filter.operator === "is_today" ? "Today" : filter.operator === "next_7_days" ? "Next 7 days" : "")
                                          : (filter.operator === "=" ? "Yes" : filter.operator === "!=" ? "No" : "")
                                        }
                                      </div>
                                    ) : (
                                      <Input
                                        value={filter.value}
                                        onChange={(e) => {
                                          const newFilters = [...builderFilters]
                                          newFilters[index] = { ...newFilters[index], value: e.target.value }
                                          setBuilderFilters(newFilters)
                                        }}
                                        placeholder="Value"
                                        className={isIncomplete && filter.value === "" ? "border-red-300" : ""}
                                      />
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newFilters = builderFilters.filter((_, i) => i !== index)
                                        setBuilderFilters(newFilters)
                                        if (newFilters.length === 0) {
                                          setShowFilters(false)
                                        }
                                      }}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {builderFilters.length < 2 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setBuilderFilters([...builderFilters, { field: "", operator: "", value: "" }])}
                              className="text-xs"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add another
                            </Button>
                          )}

                          {builderFilters.some(f => {
                            const isSpecial = f.field === "date" || f.field === "has_attachment"
                            return !f.field || !f.operator || (!isSpecial && !f.value)
                          }) && (
                            <p className="text-xs text-red-600">Please complete all filter fields</p>
                          )}

                          <p className="text-xs text-gray-500">Filters narrow where this runs—totally optional.</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Then */}
                <div className="flex items-start gap-3" data-help="automation-then-section">
                  <span className="text-sm font-semibold text-gray-700 mt-2">Then</span>
                  <div className="flex-1 space-y-3">
                    {/* Action List */}
                    {builderActions.length > 0 && (
                      <div className="space-y-2">
                        {builderActions.map((action, index) => {
                          const getActionLabel = () => {
                            switch (action.type) {
                              case "email":
                                return `Send email to ${action.config?.emailTo?.join(", ") || "..."}`
                              case "portal_notice":
                                return "Create Action Needed"
                              case "create_task":
                                return `Create task: ${action.config?.taskTitle || "..."}`
                              case "schedule_reminder":
                                return `Wait ${action.config?.reminderWaitAmount || "..."} ${action.config?.reminderWaitUnit || "days"} then ${action.config?.reminderAction?.type || "..."}`
                              default:
                                return "Configure action"
                            }
                          }

                          return (
                            <div key={index} className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl p-3">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{getActionLabel()}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingActionIndex(index)}
                                className="text-[#4647E0] hover:text-[#3c3dd0]"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setBuilderActions(builderActions.filter((_, i) => i !== index))}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add Action Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Action
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem 
                          onClick={() => {
                            setBuilderActions([...builderActions, { 
                              type: "email", 
                              config: { emailTo: ["client"], emailSubject: "", emailBody: "" } 
                            }])
                            setEditingActionIndex(builderActions.length)
                          }}
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setBuilderActions([...builderActions, { 
                              type: "portal_notice", 
                              config: { noticeType: "action_needed", noticeTitle: "", noticeMessage: "", noticeButtonLabel: "", noticeExpireDays: undefined } 
                            }])
                            setEditingActionIndex(builderActions.length)
                          }}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Portal Notice
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setBuilderActions([...builderActions, { 
                              type: "create_task", 
                              config: { taskTitle: "", taskAssignee: "me", taskDueInDays: 3 } 
                            }])
                            setEditingActionIndex(builderActions.length)
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Create Task
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setBuilderActions([...builderActions, { 
                              type: "schedule_reminder", 
                              config: { reminderWaitAmount: 1, reminderWaitUnit: "days", reminderAction: { type: "email", config: {} } } 
                            }])
                            setEditingActionIndex(builderActions.length)
                          }}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Schedule Reminder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Configuration Panel */}
            {editingActionIndex !== null && builderActions[editingActionIndex] && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-blue-900">
                    Configure Action
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingActionIndex(null)}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>

                {(() => {
                  const action = builderActions[editingActionIndex]
                  const updateConfig = (updates: any) => {
                    const newActions = [...builderActions]
                    newActions[editingActionIndex] = {
                      ...action,
                      config: { ...action.config, ...updates }
                    }
                    setBuilderActions(newActions)
                  }

                  switch (action.type) {
                    case "email":
                      return (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">To</Label>
                            <div className="flex flex-wrap gap-2">
                              {["client", "me", "team"].map(recipient => (
                                <button
                                  key={recipient}
                                  type="button"
                                  onClick={() => {
                                    const current = action.config?.emailTo || []
                                    const updated = current.includes(recipient)
                                      ? current.filter((r: string) => r !== recipient)
                                      : [...current, recipient]
                                    updateConfig({ emailTo: updated })
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    action.config?.emailTo?.includes(recipient)
                                      ? "bg-[#4647E0] text-white"
                                      : "bg-white border border-gray-300 text-gray-700 hover:border-[#4647E0]"
                                  }`}
                                >
                                  {recipient === "client" ? "Client primary" : recipient === "me" ? "Me" : "Team"}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Subject</Label>
                            <Input
                              value={action.config?.emailSubject || ""}
                              onChange={(e) => updateConfig({ emailSubject: e.target.value })}
                              placeholder="e.g., Invoice Overdue - Action Required"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Body</Label>
                            <Textarea
                              value={action.config?.emailBody || ""}
                              onChange={(e) => updateConfig({ emailBody: e.target.value })}
                              placeholder="Email message..."
                              rows={4}
                              className="text-sm"
                            />
                            <p className="text-xs text-gray-600">
                              Variables: {'{{ClientName}}'}, {'{{ProjectName}}'}, {'{{InvoiceAmount}}'}
                            </p>
                          </div>
                        </div>
                      )

                    case "portal_notice":
                      // Always treat as Action Needed
                      if (action.config?.noticeType !== "action_needed") {
                        updateConfig({ noticeType: "action_needed" })
                      }
                      return (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={action.config?.noticeTitle || ""}
                              onChange={(e) => updateConfig({ noticeTitle: e.target.value })}
                              placeholder="e.g., Payment Reminder"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Message</Label>
                            <Textarea
                              value={action.config?.noticeMessage || ""}
                              onChange={(e) => updateConfig({ noticeMessage: e.target.value })}
                              placeholder="Notice message..."
                              rows={3}
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Button Label (optional)</Label>
                            <Input
                              value={action.config?.noticeButtonLabel || ""}
                              onChange={(e) => updateConfig({ noticeButtonLabel: e.target.value })}
                              placeholder="e.g., View Invoice"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Auto-expire after (days)</Label>
                            <Input
                              type="number"
                              value={action.config?.noticeExpireDays || ""}
                              onChange={(e) => updateConfig({ noticeExpireDays: parseInt(e.target.value) })}
                              placeholder="7"
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )

                    case "create_task":
                      return (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Task Title</Label>
                            <Input
                              value={action.config?.taskTitle || ""}
                              onChange={(e) => updateConfig({ taskTitle: e.target.value })}
                              placeholder="e.g., Review proposal submission"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Assignee</Label>
                            <Select 
                              value={action.config?.taskAssignee || "me"} 
                              onValueChange={(value) => updateConfig({ taskAssignee: value })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="me">Me</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Due in (days)</Label>
                            <Input
                              type="number"
                              value={action.config?.taskDueInDays || ""}
                              onChange={(e) => updateConfig({ taskDueInDays: parseInt(e.target.value) })}
                              placeholder="3"
                              className="text-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Notes (optional)</Label>
                            <Textarea
                              value={action.config?.taskNotes || ""}
                              onChange={(e) => updateConfig({ taskNotes: e.target.value })}
                              placeholder="Task notes..."
                              rows={2}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )

                    case "schedule_reminder":
                      return (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Wait</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                value={action.config?.reminderWaitAmount || ""}
                                onChange={(e) => updateConfig({ reminderWaitAmount: parseInt(e.target.value) })}
                                placeholder="1"
                                className="text-sm w-20"
                              />
                              <Select 
                                value={action.config?.reminderWaitUnit || "days"} 
                                onValueChange={(value: "hours" | "days") => updateConfig({ reminderWaitUnit: value })}
                              >
                                <SelectTrigger className="text-sm flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hours">Hours</SelectItem>
                                  <SelectItem value="days">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Then</Label>
                            <Select 
                              value={action.config?.reminderAction?.type || "email"} 
                              onValueChange={(value: "email" | "portal_notice") => updateConfig({ 
                                reminderAction: { type: value, config: {} } 
                              })}
                            >
                              <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Send Email</SelectItem>
                                <SelectItem value="portal_notice">Portal Notice</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {/* Nested action config for the reminder */}
                          {action.config?.reminderAction?.type === "email" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Reminder Email - Subject</Label>
                              <Input
                                value={action.config?.reminderAction?.config?.emailSubject || ""}
                                onChange={(e) => {
                                  const current = action.config?.reminderAction || { type: "email", config: {} }
                                  updateConfig({ reminderAction: { ...current, config: { ...current.config, emailSubject: e.target.value } } })
                                }}
                                placeholder="Subject"
                                className="text-sm"
                              />
                              <Label className="text-xs">Reminder Email - Body</Label>
                              <Textarea
                                value={action.config?.reminderAction?.config?.emailBody || ""}
                                onChange={(e) => {
                                  const current = action.config?.reminderAction || { type: "email", config: {} }
                                  updateConfig({ reminderAction: { ...current, config: { ...current.config, emailBody: e.target.value } } })
                                }}
                                placeholder="Your reminder message..."
                                rows={3}
                                className="text-sm"
                              />
                            </div>
                          )}
                          {action.config?.reminderAction?.type === "portal_notice" && (
                            <div className="space-y-2">
                              <Label className="text-xs">Reminder Notice - Title</Label>
                              <Input
                                value={action.config?.reminderAction?.config?.noticeTitle || ""}
                                onChange={(e) => {
                                  const current = action.config?.reminderAction || { type: "portal_notice", config: {} }
                                  updateConfig({ reminderAction: { ...current, config: { ...current.config, noticeTitle: e.target.value } } })
                                }}
                                placeholder="Title"
                                className="text-sm"
                              />
                              <Label className="text-xs">Reminder Notice - Message</Label>
                              <Textarea
                                value={action.config?.reminderAction?.config?.noticeMessage || ""}
                                onChange={(e) => {
                                  const current = action.config?.reminderAction || { type: "portal_notice", config: {} }
                                  updateConfig({ reminderAction: { ...current, config: { ...current.config, noticeMessage: e.target.value } } })
                                }}
                                placeholder="Your reminder message..."
                                rows={3}
                                className="text-sm"
                              />
                            </div>
                          )}
                          <p className="text-xs text-gray-600">
                            Note: The reminder will not send if the condition is already resolved.
                          </p>
                        </div>
                      )

                    default:
                      return null
                  }
                })()}
              </div>
            )}

            <Separator />

            {/* Scope */}
            <div className="space-y-2" data-help="automation-scope-section">
              <Label>Scope</Label>
              <Select value={builderScope} onValueChange={(value: any) => setBuilderScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (all clients)</SelectItem>
                  <SelectItem value="client">Specific Client</SelectItem>
                  <SelectItem value="project">Specific Project</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Scope Helper Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-[10px] font-bold">i</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-800">
                    {builderScope === "global" && (
                      <>This automation will run for <strong>every client and every situation</strong> that matches the trigger. Perfect for universal workflows.</>
                    )}
                    {builderScope === "client" && (
                      <>This automation will run only for the <strong>specific client</strong> you select. Perfect for personalized workflows.</>
                    )}
                    {builderScope === "project" && (
                      <>This automation will run only for the <strong>specific project</strong> you select. Perfect for project-specific workflows.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Enabled */}
            <div className="flex items-center justify-between">
              <Label>Enable immediately</Label>
              <Switch
                checked={builderEnabled}
                onCheckedChange={setBuilderEnabled}
              />
            </div>

            {/* Preview */}
            {builderTrigger && builderActions.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <Label className="text-sm font-semibold text-green-900 mb-2 block">Preview</Label>
                <div className="text-sm text-green-800">
                  <p className="leading-relaxed">
                    <strong>When</strong> {getTriggerLabel(builderTrigger)}
                    {builderFilters.length > 0 && builderFilters.every(f => {
                      const isSpecial = f.field === "has_attachment"
                      return f.field && f.operator && (isSpecial || f.value)
                    }) && (
                      <>
                        {" and "}
                        {builderFilters.map((filter, index) => {
                          const fieldLabel = getFilterFields(builderTrigger).find(f => f.value === filter.field)?.label || filter.field
                          const operatorLabel = getFilterOperators(filter.field).find(op => op.value === filter.operator)?.label || filter.operator
                          const valueDisplay = filter.field === "has_attachment"
                            ? (filter.operator === "=" ? "has attachment" : "doesn't have attachment")
                            : filter.value
                          return (
                            <span key={index}>
                              {fieldLabel.toLowerCase()} {operatorLabel} {valueDisplay}
                              {index < builderFilters.length - 1 && " and "}
                            </span>
                          )
                        })}
                      </>
                    )}
                    {" "}<strong>then</strong>{" "}
                    {builderActions.map((action, idx) => {
                      let label = ""
                      switch (action.type) {
                        case "email":
                          label = `email ${action.config?.emailTo?.join(" & ") || "..."}`
                          break
                        case "portal_notice":
                          label = "create action needed"
                          break
                        case "create_task":
                          label = "create task"
                          break
                        case "schedule_reminder":
                          label = `wait ${action.config?.reminderWaitAmount || "..."} ${action.config?.reminderWaitUnit || "days"}`
                          break
                      }
                      return (
                        <span key={idx}>
                          {label}
                          {idx < builderActions.length - 1 && " + "}
                        </span>
                      )
                    })}.
                  </p>
                  <div className="mt-2 pt-2 border-t border-green-200 space-y-1 text-xs text-green-700">
                    <p><strong>Scope:</strong> {builderScope}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={resetBuilder}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAutomation}
              className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
            >
              {editingAutomation ? "Update" : "Create"} Automation
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Run Log Details Sheet */}
      <Sheet open={showRunLogDetails} onOpenChange={setShowRunLogDetails}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Run Details</SheetTitle>
          </SheetHeader>

          {selectedLog && (
            <div className="space-y-4 py-6">
              <div>
                <Label className="text-xs text-gray-600">Automation</Label>
                <p className="text-sm font-medium text-gray-900">{selectedLog.automationName}</p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Timestamp</Label>
                <p className="text-sm font-medium text-gray-900">{selectedLog.timestamp}</p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Target</Label>
                <p className="text-sm font-medium text-gray-900">{selectedLog.target}</p>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Status</Label>
                <div className="mt-1">
                  {selectedLog.status === "success" ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-600">Duration</Label>
                <p className="text-sm font-medium text-gray-900">{selectedLog.duration}</p>
              </div>

              {selectedLog.details && (
                <div>
                  <Label className="text-xs text-gray-600">Details</Label>
                  <p className="text-sm text-gray-900 bg-gray-50 rounded-xl p-3 mt-1">{selectedLog.details}</p>
                </div>
              )}

              {selectedLog.status === "failed" && (
                <Button className="w-full bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl">
                  <Play className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  )
}

