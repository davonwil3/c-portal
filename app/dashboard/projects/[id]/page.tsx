"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ChevronRight,
  Edit,
  ExternalLink,
  Archive,
  Plus,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Circle,
  CalendarDays,
  Target,
  Upload,
  MessageCircle,
  FileText,
  Eye,
  Download,
  Save,
  ChevronDown,
  ChevronUp,
  Send,
  AlertCircle,
  RefreshCw,
  Copy,
  Crown,
  Loader2,
  ArrowLeft,
  Users,
  CreditCard,
  Trash2,
  XCircle,
  X,
  Star,
  AlertTriangle,
  Clipboard,
  FileSignature,
  FolderOpen,
  DollarSign,
  Activity,
  CheckSquare,
  Sparkles,
  Lightbulb,
  Package,
  Video,
  Music,
  Image,
  File,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  getProjectWithClient,
  getProjectMilestones,
  getProjectTasks,
  createMilestone,
  updateMilestone,
  createTask,
  updateTask,
  getProjectTagColor,
  deleteMilestone,
  deleteTask,
  deleteProject,
  updateProject,
  getProjectTags,
  getAccountProjectTags,
  getClientsForProjects,
  standardProjectTags,
  type Project,
  type ProjectTag
} from "@/lib/projects"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getFiles, uploadFile, downloadFile, getFileUrl, approveFile, rejectFile, deleteFile, getFileComments, addFileComment, updateFile, type File } from "@/lib/files"
import { getProjectForms, deleteForm, getFormTemplates, type Form } from "@/lib/forms"
import { FormPreviewModal } from "@/components/forms/form-preview-modal"
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal"
import { ContractSignatureModal } from "@/components/contracts/contract-signature-modal"
import { getContracts, type Contract } from "@/lib/contracts"
import { getInvoicesByProject, updateInvoice, markInvoiceAsPaid, deleteInvoice, type Invoice } from "@/lib/invoices"
import { getCurrentUser, getUserProfile, getCurrentAccount, type Account } from "@/lib/auth"
import { DashboardMessageChat } from "@/components/messages/dashboard-message-chat"
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { DashboardLayout } from "@/components/dashboard/layout"
import { getProjectTimeEntries, calculateTotalDuration, calculateTotalBillable, formatDuration, type TimeEntry } from "@/lib/time-tracking"
import { useTour } from "@/contexts/TourContext"
import { dummyProjects, dummyClients as tourDummyClients } from "@/lib/tour-dummy-data"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { isTourRunning, currentTour } = useTour()
  const [activeTab, setActiveTab] = useState("tasks")

  // State for project data
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<{ id: string; first_name: string; last_name: string; company: string | null } | null>(null)
  const [tags, setTags] = useState<ProjectTag[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // State for user and account
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [accountId, setAccountId] = useState<string>('')
  const [account, setAccount] = useState<Account | null>(null)

  // State for modals and forms
  const [isAddMilestoneOpen, setIsAddMilestoneOpen] = useState(false)
  const [isEditMilestoneOpen, setIsEditMilestoneOpen] = useState(false)
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null)
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set<string>())
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [noteText, setNoteText] = useState("")
  const [editingMilestone, setEditingMilestone] = useState<any>(null)
  
  // Tasks view state
  const [tasksView, setTasksView] = useState<'milestones' | 'list' | 'board' | 'timeline'>('milestones')
  const [taskSearch, setTaskSearch] = useState('')
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [taskMilestoneFilter, setTaskMilestoneFilter] = useState('all')
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [taskForm, setTaskForm] = useState<any>({ title: "", description: "", status: "todo", assignee_id: "", start_date: "", due_date: "", milestone_id: "" })
  const [focusMode, setFocusMode] = useState(false)
  const [quickAddInput, setQuickAddInput] = useState('')
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set())
  const [expandedMilestonesInView, setExpandedMilestonesInView] = useState<Set<string>>(new Set())
  const [timelineViewMode, setTimelineViewMode] = useState<'week' | 'month' | 'full'>('week')

  // Board DnD helpers
  function getTaskStatus(task: any): 'todo' | 'in-progress' | 'review' | 'done' {
    if (task?.status) return task.status
    return task.completed ? 'done' : 'todo'
  }

  async function handleTaskStatusChange(taskId: string, newStatus: 'todo' | 'in-progress' | 'review' | 'done') {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, completed: newStatus === 'done' } : t)))
    try {
      await updateTask(taskId, { status: newStatus })
    } catch (e) {
      console.error(e)
      toast.error('Failed to update task status')
    }
  }

  function onBoardDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData('text/task-id', taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onBoardDrop(e: React.DragEvent, columnKey: 'todo' | 'in-progress' | 'review' | 'done') {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/task-id')
    if (id) handleTaskStatusChange(id, columnKey)
  }

  function onBoardDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  function openTaskDrawer(task: any) {
    setSelectedTask(task)
    setTaskForm({
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || getTaskStatus(task),
      assignee_id: task?.assignee_id || '',
      start_date: task?.start_date || '',
      due_date: task?.due_date || '',
      milestone_id: task?.milestone_id || ''
    })
    setIsTaskDrawerOpen(true)
  }

  async function saveTaskEdits() {
    if (!taskForm.title.trim() || !projectId) {
      toast.error('Task title is required')
      return
    }
    try {
      const taskData: any = {
        title: taskForm.title,
        description: taskForm.description,
        status: taskForm.status,
        assignee_id: taskForm.assignee_id || null,
        start_date: taskForm.start_date || null,
        due_date: taskForm.due_date || null,
        milestone_id: taskForm.milestone_id || null,
      }
      
      if (selectedTask) {
        // Update existing task
        await updateTask(selectedTask.id, taskData)
        setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, ...taskData } : t)))
        toast.success('Task updated')
      } else {
        // Create new task
        const newTask = await createTask({
          project_id: projectId,
          ...taskData
        })
        setTasks((prev) => [...prev, newTask])
        toast.success('Task created')
      }
      setIsTaskDrawerOpen(false)
      setSelectedTask(null)
      setTaskForm({
        title: "",
        description: "",
        status: "todo",
        assignee_id: "",
        start_date: "",
        due_date: "",
        milestone_id: ""
      })
    } catch (e) {
      console.error(e)
      toast.error(selectedTask ? 'Failed to update task' : 'Failed to create task')
    }
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!quickAddInput.trim() || !projectId) return
    try {
      const newTask = await createTask({
        project_id: projectId,
        title: quickAddInput.trim(),
        description: '',
      })
      setTasks((prev) => [...prev, newTask])
      setQuickAddInput('')
      toast.success('Task added')
    } catch (err) {
      console.error(err)
      toast.error('Failed to add task')
    }
  }

  function toggleTaskExpand(taskId: string) {
    setExpandedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = !taskSearch || t.title?.toLowerCase().includes(taskSearch.toLowerCase())
    const matchesStatus = taskStatusFilter === 'all' || getTaskStatus(t) === taskStatusFilter
    const matchesMilestone = taskMilestoneFilter === 'all' || t.milestone_id === taskMilestoneFilter
    return matchesSearch && matchesStatus && matchesMilestone
  })

  const taskStats = {
    total: tasks.length,
    dueSoon: tasks.filter((t) => {
      if (!t.due_date) return false
      if (getTaskStatus(t) === 'done') return false
      const diff = new Date(t.due_date).getTime() - Date.now()
      return diff > 0 && diff <= 3*24*60*60*1000
    }).length,
    overdue: tasks.filter((t) => {
      if (!t.due_date) return false
      if (getTaskStatus(t) === 'done') return false
      return new Date(t.due_date) < new Date()
    }).length
  }

  // Timeline (Gantt) basic interactions
  const timelineGridRef = useRef<HTMLDivElement>(null)
  const [draggingTimeline, setDraggingTimeline] = useState<null | { taskId: string; type: 'move' }>(null)

  // Get week days (7 days centered on today)
  function getWeekDays(): Date[] {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: Date[] = []
    // Start 3 days before today, end 3 days after (total 7 days with today in middle)
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d)
    }
    return days
  }

  // Get month days (current month)
  function getMonthDays(): Date[] {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []
    const current = new Date(firstDay)
    current.setHours(0, 0, 0, 0)
    while (current <= lastDay) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days
  }

  // Get all dates for full project view
  function getAllDates(): Date[] {
    const allDates = new Set<string>()
    filteredTasks.forEach((task) => {
      if (task.start_date) allDates.add(task.start_date)
      if (task.due_date) allDates.add(task.due_date)
    })
    milestones.forEach((m) => {
      if (m.due_date) allDates.add(m.due_date)
    })
    const sorted = Array.from(allDates).sort().map(d => new Date(d))
    if (sorted.length === 0) return getWeekDays()
    const minDate = sorted[0]
    const maxDate = sorted[sorted.length - 1]
    const days: Date[] = []
    const current = new Date(minDate)
    current.setHours(0, 0, 0, 0)
    while (current <= maxDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return days.length > 0 ? days : getWeekDays()
  }

  function getDaysForView(): Date[] {
    if (timelineViewMode === 'week') return getWeekDays()
    if (timelineViewMode === 'month') return getMonthDays()
    return getAllDates()
  }

  function getTodayIndex(): number {
    const days = getDaysForView()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < days.length; i++) {
      if (days[i].toDateString() === today.toDateString()) return i
    }
    return Math.floor(days.length / 2) // Center if today not found
  }

  // Calculate task bar position and width
  function getTaskBarPosition(task: any): { left: number; width: number } | null {
    const days = getDaysForView()
    if (days.length === 0) return null
    
    const startDate = task.start_date ? new Date(task.start_date) : (task.due_date ? new Date(task.due_date) : null)
    const endDate = task.due_date ? new Date(task.due_date) : startDate
    
    if (!startDate || !endDate) return null

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    let startIdx = -1
    let endIdx = -1

    for (let i = 0; i < days.length; i++) {
      const dayStart = new Date(days[i])
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(days[i])
      dayEnd.setHours(23, 59, 59, 999)
      
      if (startIdx === -1 && startDate <= dayEnd) {
        startIdx = i
      }
      if (endDate >= dayStart) {
        endIdx = i
      }
    }

    if (startIdx === -1 || endIdx === -1) return null

    const dayWidth = 100 / days.length
    return {
      left: startIdx * dayWidth,
      width: (endIdx - startIdx + 1) * dayWidth
    }
  }

  function handleTimelinePointerDown(taskId: string, e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDraggingTimeline({ taskId, type: 'move' })
  }

  function handleTimelinePointerMove(e: React.PointerEvent) {
    if (!draggingTimeline || !timelineGridRef.current) return
    // Timeline drag functionality can be enhanced later
    // For now, the new timeline view uses click-to-edit
  }

  async function handleTimelinePointerUp(e: React.PointerEvent) {
    if (!draggingTimeline) return
    try {
      const t = tasks.find((x) => x.id === draggingTimeline.taskId)
      if (t?.due_date) {
        await updateTask(t.id, { due_date: t.due_date })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDraggingTimeline(null)
    }
  }

  // Edit project form state
  const [editProjectForm, setEditProjectForm] = useState({
    name: "",
    client_id: "",
    due_date: "",
    description: "",
    status: "draft" as 'draft' | 'active' | 'on-hold' | 'completed' | 'archived',
    tags: [] as Array<{ name: string; color?: string }>,
  })
  const [availableClients, setAvailableClients] = useState<Array<{ id: string; first_name: string; last_name: string; company: string | null }>>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [projectTagColors, setProjectTagColors] = useState<Record<string, Record<string, string>>>({})
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>({})
  const [editNewTag, setEditNewTag] = useState("")
  const [editNewTagColor, setEditNewTagColor] = useState("#3B82F6")

  // Form states
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    description: "",
    due_date: "",
    client_note: "",
  })

  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: "",
    priority: "medium" as const,
  })

  // Files state
  const [projectFiles, setProjectFiles] = useState<File[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFilesForUpload, setSelectedFilesForUpload] = useState<globalThis.File[]>([])
  const [uploadForm, setUploadForm] = useState({
    description: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showClientFilesOnly, setShowClientFilesOnly] = useState(false)

  // Forms state
  const [projectForms, setProjectForms] = useState<Form[]>([])
  const [loadingForms, setLoadingForms] = useState(false)
  const [deletingForm, setDeletingForm] = useState<string | null>(null)
  const [selectedFormForPreview, setSelectedFormForPreview] = useState<Form | null>(null)
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false)

  // Form preview modal state
  const [showFormPreview, setShowFormPreview] = useState(false)
  const [previewForm, setPreviewForm] = useState<Form | null>(null)

  // Form template selection modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [formTemplates, setFormTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // File viewer modal state
  const [selectedFileForView, setSelectedFileForView] = useState<File | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [fileViewUrl, setFileViewUrl] = useState<string>("")

  // Comments modal state
  const [selectedFileForComments, setSelectedFileForComments] = useState<File | null>(null)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [fileComments, setFileComments] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [addingComment, setAddingComment] = useState(false)
  const [isInternalComment, setIsInternalComment] = useState(false)

  // State for contracts
  const [projectContracts, setProjectContracts] = useState<Contract[]>([])
  const [loadingContracts, setLoadingContracts] = useState(false)
  const [deletingContract, setDeletingContract] = useState<string | null>(null)

  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [contractToSign, setContractToSign] = useState<Contract | null>(null)

  // State for invoices
  const [projectInvoices, setProjectInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)

  // State for time tracking
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loadingTimeEntries, setLoadingTimeEntries] = useState(false)
  const [markingAsPaid, setMarkingAsPaid] = useState<string | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false)
  const [changingStatusInvoice, setChangingStatusInvoice] = useState<Invoice | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)

  // State for activities
  const [projectActivities, setProjectActivities] = useState<any[]>([])
  const [loadingActivities, setLoadingActivities] = useState(false)

  // Helper function to format activity time
  const formatActivityTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  // Helper function to get activity icon based on activity_type
  const getActivityIcon = (activityType: string, sourceTable: string) => {
    const type = activityType?.toLowerCase() || ''
    
    // Use activity_type from project_activities table
    switch (type) {
      case 'invoice':
        return <DollarSign className="h-4 w-4" />
      case 'contract':
        return <FileSignature className="h-4 w-4" />
      case 'file':
        return <FileText className="h-4 w-4" />
      case 'milestone':
        return <Target className="h-4 w-4" />
      case 'task':
        return <CheckCircle className="h-4 w-4" />
      case 'message':
        return <MessageCircle className="h-4 w-4" />
      case 'status_change':
        return <Edit className="h-4 w-4" />
      case 'form':
        return <FileText className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  // Helper function to get activity color based on activity_type
  const getActivityColor = (activityType: string, sourceTable: string) => {
    const type = activityType?.toLowerCase() || ''
    
    // Use activity_type from project_activities table
    switch (type) {
      case 'invoice':
        return 'bg-green-100 text-green-600'
      case 'contract':
        return 'bg-blue-100 text-blue-600'
      case 'file':
        return 'bg-purple-100 text-purple-600'
      case 'milestone':
        return 'bg-blue-100 text-blue-600'
      case 'task':
        return 'bg-green-100 text-green-600'
      case 'message':
        return 'bg-orange-100 text-orange-600'
      case 'status_change':
        return 'bg-gray-100 text-gray-600'
      case 'form':
        return 'bg-yellow-100 text-yellow-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // Comment functions
  const formatCommentTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const openCommentsModal = async (file: File) => {
    setSelectedFileForComments(file)
    setIsCommentsModalOpen(true)
    setLoadingComments(true)
    
    try {
      const comments = await getFileComments(file.id)
      setFileComments(comments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoadingComments(false)
    }
  }

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false)
    setSelectedFileForComments(null)
    setFileComments([])
    setNewComment('')
    setIsInternalComment(false)
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedFileForComments) return
    
    setAddingComment(true)
    try {
      const comment = await addFileComment(
        selectedFileForComments.id,
        newComment.trim(),
        isInternalComment
      )
      
      if (comment) {
        setFileComments([...fileComments, comment])
        setNewComment('')
        toast.success('Comment added successfully')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-50 text-green-700 border-green-200"
      case "on-hold":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "archived":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-50 text-gray-700 border-gray-200"
      case "in-progress":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "done":
        return "bg-green-50 text-green-700 border-green-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "No date set"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Unknown"
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Today'
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  }

  // Invoice helper functions
  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
      case "sent":
        return "bg-blue-100 text-blue-700 hover:bg-blue-100"
      case "viewed":
        return "bg-purple-100 text-purple-700 hover:bg-purple-100"
      case "paid":
        return "bg-green-100 text-green-700 hover:bg-green-100"
      case "partially_paid":
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
      case "overdue":
        return "bg-red-100 text-red-700 hover:bg-red-100"
      case "cancelled":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
      case "refunded":
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
      default:
        return "bg-gray-100 text-gray-700 hover:bg-gray-100"
    }
  }

  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft"
      case "sent":
        return "Sent"
      case "viewed":
        return "Viewed"
      case "paid":
        return "Paid"
      case "partially_paid":
        return "Partially Paid"
      case "overdue":
        return "Overdue"
      case "cancelled":
        return "Cancelled"
      case "refunded":
        return "Refunded"
      default:
        return "Unknown"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  // Contract status configuration
  const contractStatusConfig = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
    sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
    awaiting_signature: { label: "Awaiting Signature", color: "bg-purple-100 text-purple-800", icon: Clock },
    partially_signed: { label: "Partially Signed", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
    signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckCircle },
    declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: AlertCircle },
    expired: { label: "Expired", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
    archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: Archive },
  }

  // Generate contract document from contract content
  const generateContractDocument = (content: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.clientName || 'Contract'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 40px 20px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.125rem;
            color: #6b7280;
        }
        .content {
            padding: 0 40px 40px;
        }
        .section { 
            margin-bottom: 32px; 
        }
        .section h2 { 
            color: #111827; 
            border-bottom: 2px solid #3C3CFF; 
            padding-bottom: 8px; 
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .parties { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 24px; 
            margin-bottom: 32px; 
        }
        .party { 
            border-left: 4px solid #3C3CFF; 
            padding-left: 16px; 
        }
        .party h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .party p {
            color: #374151;
            margin-bottom: 4px;
        }
        .party .name {
            font-weight: 500;
            color: #111827;
        }
        .content-box {
            background-color: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .content-box p {
            color: #374151;
            margin: 0;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .payment-field {
            margin-bottom: 16px;
        }
        .payment-field label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
        }
        .payment-field input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
        }
        .payment-field textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
            resize: vertical;
            min-height: 80px;
        }
        .estimated-total {
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
        }
        .estimated-total .label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #1e40af;
        }
        .estimated-total .amount {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e3a8a;
        }
        .estimated-total .details {
            font-size: 0.75rem;
            color: #3b82f6;
        }
        .signature-section {
            margin-top: 32px;
        }
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .signature-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            background: white;
        }
        .signature-area h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .signature-area p {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
        }
        @media (max-width: 768px) {
            .parties, .payment-grid, .signature-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 0 20px 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONTRACT FOR SERVICES</h1>
            <p>This agreement is made and entered into as of ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>PARTIES</h2>
                <div class="parties">
                    <div class="party">
                        <h3>COMPANY</h3>
                        <p class="name">${content.companyName || 'Your Company'}</p>
                        ${content.companyAddress ? `<p>${content.companyAddress}</p>` : ''}
                    </div>
                    <div class="party">
                        <h3>CLIENT</h3>
                        <p class="name">${content.clientName || 'Client Name'}</p>
                        ${content.clientEmail ? `<p>${content.clientEmail}</p>` : ''}
                        ${content.clientAddress ? `<p>${content.clientAddress}</p>` : ''}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>1. PROJECT SCOPE</h2>
                <div class="content-box">
                    <p>${content.projectScope || 'Project scope to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>2. PAYMENT TERMS</h2>
                <div class="content-box">
                    ${content.paymentType === "fixed" ? `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Total Amount</label>
                                <input type="text" value="${content.totalAmount || '$0.00'}" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Deposit Amount</label>
                                <input type="text" value="${content.depositAmount || '$0.00'}" readonly />
                            </div>
                        </div>
                    ` : `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Hourly Rate</label>
                                <input type="text" value="${content.hourlyRate || '$0.00'}/hour" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Estimated Hours</label>
                                <input type="text" value="${content.estimatedHours || '0'} hours" readonly />
                            </div>
                        </div>
                        ${content.hourlyRate && content.estimatedHours ? `
                            <div class="estimated-total">
                                <div class="label">Estimated Total</div>
                                <div class="amount">$${(parseFloat(content.hourlyRate) * parseFloat(content.estimatedHours)).toFixed(2)}</div>
                                <div class="details">Based on ${content.estimatedHours} hours at $${content.hourlyRate}/hour</div>
                            </div>
                        ` : ''}
                    `}
                    <div class="payment-field" style="margin-top: 16px;">
                        <label>Payment Terms</label>
                        <textarea readonly>${content.paymentTerms || ''}</textarea>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>3. DELIVERABLES & MILESTONES</h2>
                <div class="content-box">
                    <p>${content.milestones || 'Project milestones to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>4. INTELLECTUAL PROPERTY</h2>
                <div class="content-box">
                    <p>${content.ipRights === "client" ? "All work product will be owned by the Client upon full payment." : 
                        content.ipRights === "shared" ? "Intellectual property will be shared between parties." : 
                        "Contractor retains all intellectual property rights."}</p>
                </div>
            </div>

            <div class="section">
                <h2>5. ADDITIONAL TERMS</h2>
                <div class="content-box">
                    <p><strong>Included Revisions:</strong> ${content.revisions || '3'} revision${(content.revisions || '3') !== "1" ? "s" : ""}</p>
                    <p><strong>Termination:</strong> Either party may terminate this agreement with ${content.terminationClause || '30-day notice'}</p>
                </div>
            </div>

            <div class="section signature-section">
                <h2>6. SIGNATURES</h2>
                <p style="margin-bottom: 16px; color: #374151;">
                    This contract requires signatures from both parties. 
                    ${content.signatureOrder === "sequential" 
                        ? " Signatures will be collected sequentially (Company first, then Client)." 
                        : " Both parties may sign simultaneously."}
                </p>
                
                <div class="signature-grid">
                    <div class="signature-area">
                        <h3>Company Signature</h3>
                        ${content.companySignature ? `<img src="${content.companySignature}" alt="Company Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                    </div>
                    
                    <div class="signature-area">
                        <h3>Client Signature</h3>
                        ${content.clientSignature ? `<img src="${content.clientSignature}" alt="Client Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This contract is valid and binding upon both parties upon signature.</p>
            <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>
    `
  }

  // Load project activities
  const loadProjectActivities = async () => {
    if (!projectId) return
    
    setLoadingActivities(true)
    try {
      console.log('Loading project activities for project:', projectId)
      const response = await fetch(`/api/projects/${projectId}/activities`)
      console.log('Activity API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Activities loaded:', data.activities?.length || 0, 'activities')
        console.log('Activities data:', data.activities)
        setProjectActivities(data.activities || [])
      } else {
        const errorText = await response.text()
        console.error('Failed to load project activities:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error loading project activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  // No auto-refresh - only refresh when there's new activity

  // Load project data
  const loadProjectData = async () => {
    try {
      setLoading(true)
      const projectId = params.id as string

      // Check if this is a tour dummy project
      const isDummyProject = (isTourRunning || currentTour?.id === "projects" || currentTour?.id === "contracts" || currentTour?.id === "tasks") && dummyProjects.some(dp => dp.id === projectId)
      
      if (isDummyProject) {
        // Load dummy data for tour
        const dummyProject = dummyProjects.find(dp => dp.id === projectId)!
        const dummyClient = tourDummyClients.find(dc => dc.name === dummyProject.client)!
        
        const tourProject: Project = {
          id: dummyProject.id,
          name: dummyProject.name,
          client_id: dummyClient.id,
          description: `${dummyProject.name} for ${dummyProject.client}`,
          status: dummyProject.status as 'draft' | 'active' | 'on-hold' | 'completed' | 'archived',
          due_date: dummyProject.dueDate,
          start_date: '2024-01-01',
          completed_date: dummyProject.status === 'completed' ? '2024-01-15' : null,
          portal_id: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-15',
          account_id: 'tour-account',
          progress: dummyProject.progress,
          total_messages: 12,
          total_files: 8,
          total_invoices: 2,
          last_activity_at: '2024-01-15',
          total_milestones: 3,
          completed_milestones: dummyProject.status === 'completed' ? 3 : 1
        }
        
        const tourClient = {
          id: dummyClient.id,
          first_name: dummyClient.name.split(' ')[0],
          last_name: dummyClient.name.split(' ').slice(1).join(' '),
          company: dummyClient.company,
        }
        
        setProject(tourProject)
        setClient(tourClient)
        setTags([])
        setExpandedMilestones(new Set())
        
        // Set dummy milestones
        setMilestones([
          {
            id: 'milestone-1',
            project_id: projectId,
            title: 'Phase 1: Planning & Design',
            description: 'Initial project setup and design phase',
            due_date: '2024-02-15',
            status: 'completed',
            order: 1,
          },
          {
            id: 'milestone-2',
            project_id: projectId,
            title: 'Phase 2: Development',
            description: 'Core development and implementation',
            due_date: '2024-03-30',
            status: 'in_progress',
            order: 2,
          },
          {
            id: 'milestone-3',
            project_id: projectId,
            title: 'Phase 3: Launch',
            description: 'Final testing and launch',
            due_date: dummyProject.dueDate,
            status: 'pending',
            order: 3,
          },
        ])
        
        // Set dummy tasks (reuse the existing mock tasks logic below)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const mockTasks = [
          {
            id: 'mock-1',
            project_id: projectId,
            title: 'Design homepage mockups',
            description: 'Create wireframes and initial designs',
            status: 'in-progress',
            start_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            due_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            milestone_id: 'milestone-1',
            completed: false,
          },
          {
            id: 'mock-2',
            project_id: projectId,
            title: 'Review client feedback',
            description: 'Gather and organize feedback',
            status: 'todo',
            start_date: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            due_date: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            milestone_id: 'milestone-2',
            completed: false,
          },
          {
            id: 'mock-3',
            project_id: projectId,
            title: 'Implement responsive layout',
            description: 'Build mobile and tablet views',
            status: 'todo',
            start_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            due_date: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            milestone_id: 'milestone-2',
            completed: false,
          },
          {
            id: 'mock-4',
            project_id: projectId,
            title: 'Write project documentation',
            description: 'Document API and components',
            status: 'review',
            start_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            due_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            milestone_id: 'milestone-2',
            completed: false,
          },
          {
            id: 'mock-5',
            project_id: projectId,
            title: 'Set up staging environment',
            description: 'Deploy to staging server',
            status: 'done',
            start_date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            due_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            milestone_id: 'milestone-1',
            completed: true,
          },
        ]
        
        setTasks(mockTasks)
        setProjectFiles([])
        setProjectForms([])
        setLoading(false)
        return
      }

      const [projectData, milestonesData, tasksData, filesData, formsData] = await Promise.all([
        getProjectWithClient(projectId),
        getProjectMilestones(projectId),
        getProjectTasks(projectId),
        getFiles(), // Get all files, we'll filter by project
        getProjectForms(projectId) // Get forms for this project
      ])

      if (projectData) {
        setProject(projectData.project)
        setClient(projectData.client)
        setTags(projectData.tags)
        setExpandedMilestones(new Set())
      }

      if (milestonesData) {
        setMilestones(milestonesData)
      }

      if (tasksData) {
        // Only use real tasks from database (no mock data in regular mode)
        setTasks(tasksData)
      }

      // Filter files for this specific project
      if (filesData) {
        const projectFiles = filesData.filter(file => file.project_id === projectId)
        setProjectFiles(projectFiles)
      }

      // Set project forms
      if (formsData) {
        setProjectForms(formsData)
      }

      // Load project contracts
      await loadProjectContracts()

      // Load project invoices
      await loadProjectInvoices()

      // Load project time entries
      await loadProjectTimeEntries()

      // Load clients and tags for edit modal
      const [clientsData, tagsData] = await Promise.all([
        getClientsForProjects(),
        getAccountProjectTags()
      ])

      setAvailableClients(clientsData)
      setAvailableTags(tagsData)

      // Initialize tag colors
      const tagColorsMap: Record<string, Record<string, string>> = {}
      tagColorsMap[projectId] = {}
      tagsData.forEach(tag => {
        tagColorsMap[projectId][tag] = getProjectTagColor(tag)
      })
      setProjectTagColors(tagColorsMap)

    } catch (error) {
      console.error('Error loading project data:', error)
      // Only show error toast if this is not a tour dummy project
      const isDummyProject = dummyProjects.some(dp => dp.id === projectId)
      if (!isDummyProject) {
        toast.error('Failed to load project data')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadProjectContracts = async () => {
    try {
      setLoadingContracts(true)
      const allContracts = await getContracts()
      // Filter contracts for this specific project
      const projectContracts = allContracts.filter(contract => contract.project_id === projectId)
      setProjectContracts(projectContracts)
    } catch (error) {
      console.error('Error loading project contracts:', error)
      toast.error('Failed to load project contracts')
    } finally {
      setLoadingContracts(false)
    }
  }

  const loadProjectInvoices = async () => {
    try {
      setLoadingInvoices(true)
      const projectInvoices = await getInvoicesByProject(projectId)
      setProjectInvoices(projectInvoices)
    } catch (error) {
      console.error('Error loading project invoices:', error)
      toast.error('Failed to load project invoices')
    } finally {
      setLoadingInvoices(false)
    }
  }

  const loadProjectTimeEntries = async () => {
    try {
      setLoadingTimeEntries(true)
      const entries = await getProjectTimeEntries(projectId)
      setTimeEntries(entries)
    } catch (error) {
      console.error('Error loading time entries:', error)
      // Fail silently if table doesn't exist yet
      if (error && typeof error === 'object' && 'code' in error && error.code !== '42P01') {
        toast.error('Failed to load time entries')
      }
    } finally {
      setLoadingTimeEntries(false)
    }
  }

  // Contract action functions
  const handleViewContract = (contract: Contract) => {
    router.push(`/dashboard/contracts/new?view=${contract.id}&project=${params.id}`)
  }
  
  // Check if contract is fully signed
  const isContractFullySigned = (contract: Contract) => {
    return contract.status === 'signed' && contract.signature_status === 'signed'
  }

  const handleSendContract = (contract: Contract) => {
    // Navigate to send contract page or open send modal
    router.push(`/dashboard/contracts/${contract.contract_number}`)
  }

  const handleStatusChange = async (contract: Contract, newStatus: string) => {
    try {
      // Import updateContract function
      const { updateContract } = await import('@/lib/contracts')
      await updateContract(contract.id, { status: newStatus as any })
      
      // Update local state
      setProjectContracts((prev: Contract[]) => 
        prev.map((c: Contract) => c.id === contract.id ? { ...c, status: newStatus as any } : c)
      )
      
      toast.success(`Contract status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating contract status:', error)
      toast.error('Failed to update contract status')
    }
  }

  // Invoice action functions
  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingPDF(invoice.id)
      
      // Create a temporary div with the invoice content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.padding = '40px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.lineHeight = '1.4'
      
      // Generate the HTML content that matches the preview modal
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
                ${invoice.title || 'Untitled Invoice'}
              </h1>
              <p style="color: #6B7280; margin: 0; font-size: 16px;">
                Invoice #${invoice.invoice_number}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0;">Invoice Date</p>
              <p style="font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                ${formatDate(invoice.issue_date)}
              </p>
              <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0;">Due Date</p>
              <p style="font-weight: 600; color: #111827; margin: 0;">
                ${invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}
              </p>
            </div>
          </div>

          <!-- Client Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-weight: 600; color: #111827; margin: 0 0 8px 0; font-size: 16px;">Bill To:</h3>
            <p style="color: #111827; margin: 0 0 4px 0; font-size: 16px;">
              ${invoice.client_name || "Unknown Client"}
            </p>
            ${invoice.project_name ? `<p style="color: #6B7280; margin: 0; font-size: 14px;">Project: ${invoice.project_name}</p>` : ''}
          </div>

          <!-- Line Items Table -->
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Item</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Qty</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Rate</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.line_items && invoice.line_items.length > 0 ? 
                  invoice.line_items.map(item => `
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #F3F4F6;">
                        <div>
                          <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">${item.name || "Untitled Item"}</p>
                          ${item.description ? `<p style="color: #6B7280; margin: 0; font-size: 13px;">${item.description}</p>` : ''}
                        </div>
                      </td>
                      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #F3F4F6; color: #111827;">${item.quantity}</td>
                      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #F3F4F6; color: #111827;">${formatCurrency(item.unit_rate)}</td>
                      <td style="text-align: right; padding: 12px; border-bottom: 12px; border-bottom: 1px solid #F3F4F6; color: #111827; font-weight: 600;">${formatCurrency(item.total_amount)}</td>
                    </tr>
                  `).join('') : 
                  `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6B7280;">No line items found</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 250px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">Subtotal:</span>
                <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax_rate > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6B7280;">Tax (${invoice.tax_rate}%):</span>
                  <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.tax_amount)}</span>
                </div>
              ` : ''}
              ${invoice.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6B7280;">Discount:</span>
                  <span style="color: #111827; font-weight: 600;">-${formatCurrency(invoice.discount_value)}</span>
              </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 2px solid #E5E7EB; padding-top: 12px; margin-top: 12px;">
                <span style="color: #111827;">Total:</span>
                <span style="color: #3C3CFF;">${formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${invoice.notes ? `
            <div style="margin-bottom: 30px;">
              <h3 style="font-weight: 600; color: #111827; margin: 0 0 8px 0; font-size: 16px;">Notes:</h3>
              <p style="color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.6;">${invoice.notes}</p>
            </div>
          ` : ''}

          <!-- Additional Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px;">
            <div>
              <span style="font-weight: 600; color: #374151;">Status:</span>
              <span style="margin-left: 8px; padding: 4px 8px; background-color: ${getInvoiceStatusColor(invoice.status).includes('bg-green') ? '#D1FAE5' : getInvoiceStatusColor(invoice.status).includes('bg-red') ? '#FEE2E2' : getInvoiceStatusColor(invoice.status).includes('bg-yellow') ? '#FEF3C7' : getInvoiceStatusColor(invoice.status).includes('bg-blue') ? '#DBEAFE' : '#F3F4F6'}; color: ${getInvoiceStatusColor(invoice.status).includes('text-green') ? '#065F46' : getInvoiceStatusColor(invoice.status).includes('text-red') ? '#991B1B' : getInvoiceStatusColor(invoice.status).includes('text-yellow') ? '#92400E' : getInvoiceStatusColor(invoice.status).includes('text-blue') ? '#1E40AF' : '#374151'}; border-radius: 4px; font-size: 12px;">
                ${getInvoiceStatusLabel(invoice.status)}
              </span>
            </div>
            <div>
              <span style="font-weight: 600; color: #374151;">Payment Terms:</span>
              <span style="margin-left: 8px;">${invoice.payment_terms || 'Not specified'}</span>
            </div>
            ${invoice.po_number ? `
              <div>
                <span style="font-weight: 600; color: #374151;">PO Number:</span>
                <span style="margin-left: 8px;">${invoice.po_number}</span>
              </div>
            ` : ''}
            <div>
              <span style="font-weight: 600; color: #374151;">Currency:</span>
              <span style="margin-left: 8px;">${invoice.currency || 'USD'}</span>
            </div>
          </div>
        </div>
      `
      
      // Add the temp div to the document
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // Remove the temp div
      document.body.removeChild(tempDiv)
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Download the PDF
      pdf.save(`invoice-${invoice.invoice_number}.pdf`)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingPDF(null)
    }
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      setMarkingAsPaid(invoiceId)
      console.log('Attempting to mark invoice as paid:', invoiceId)
      
      // Try the specific markInvoiceAsPaid function first
      let result
      try {
        result = await markInvoiceAsPaid(invoiceId)
        console.log('Invoice marked as paid successfully:', result)
      } catch (markError) {
        console.log('markInvoiceAsPaid failed, trying updateInvoice:', markError)
        // Fallback to updateInvoice if markInvoiceAsPaid fails
        result = await updateInvoice(invoiceId, { 
          status: 'paid', 
          paid_date: new Date().toISOString() 
        })
        console.log('Invoice updated via fallback:', result)
      }
      
      // Update local state instead of reloading
      setProjectInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'paid' as any, paid_date: new Date().toISOString() }
            : invoice
        )
      )
      
      toast.success('Invoice marked as paid successfully')
      
      // Activity is automatically logged by database trigger (log_invoice_status_change)
      // No need to manually log here to avoid duplicates
      
      // Refresh activities
      loadProjectActivities()
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      })
      toast.error(`Failed to mark invoice as paid: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setMarkingAsPaid(null)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        setDeletingInvoice(invoiceId)
        await deleteInvoice(invoiceId)
        
        // Update local state instead of reloading
        setProjectInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId))
        
        toast.success('Invoice deleted successfully')
      } catch (error) {
        console.error('Error deleting invoice:', error)
        toast.error('Failed to delete invoice')
      } finally {
        setDeletingInvoice(null)
      }
    }
  }

  const openStatusChangeModal = (invoice: Invoice) => {
    setChangingStatusInvoice(invoice)
    setChangingStatus(invoice.status)
    setStatusChangeModalOpen(true)
  }

  const handleChangeStatus = async () => {
    if (!changingStatusInvoice || !changingStatus) return

    try {
      setChangingStatus(null)
      // Update the invoice status in the local state
      setProjectInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === changingStatusInvoice.id 
            ? { ...invoice, status: changingStatus as any }
            : invoice
        )
      )
      
      // Update in database
      await updateInvoice(changingStatusInvoice.id, { status: changingStatus as any })
      
      toast.success('Invoice status updated successfully')
      setStatusChangeModalOpen(false)
      setChangingStatusInvoice(null)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast.error('Failed to update invoice status')
      // Revert the local state change on error
      setProjectInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === changingStatusInvoice.id 
            ? { ...invoice, status: changingStatusInvoice.status }
            : invoice
        )
      )
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice)
    setPreviewModalOpen(true)
  }

  const handleDuplicateContract = async (contract: Contract) => {
    try {
      // Create new contract with same data
      const newContractData = {
        name: `${contract.name} - Copy`,
        contract_content: contract.contract_content,
        contract_html: contract.contract_html,
        contract_type: contract.contract_type,
        client_id: contract.client_id,
        project_id: contract.project_id,
        total_value: contract.total_value,
        currency: contract.currency,
        payment_terms: contract.payment_terms,
        deposit_amount: contract.deposit_amount,
        start_date: contract.start_date,
        end_date: contract.end_date,
        due_date: contract.due_date,
        expiration_date: contract.expiration_date,
        status: 'draft' as const
      }
      
      const { createContract } = await import('@/lib/contracts')
      const newContract = await createContract(newContractData)
      toast.success('Contract duplicated successfully')
     
    } catch (error) {
      console.error('Error duplicating contract:', error)
      toast.error('Failed to duplicate contract')
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    if (confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      try {
        setDeletingContract(contractId)
        // Import deleteContract function
        const { deleteContract } = await import('@/lib/contracts')
        await deleteContract(contractId)
        
        // Remove from local state
        setProjectContracts((prev: Contract[]) => prev.filter((c: Contract) => c.id !== contractId))
        toast.success('Contract deleted successfully')
        
        // Log contract deletion activity
        // Activity logging for contract deletion is handled by database triggers
        // No need to manually log here to avoid duplicates
        loadProjectActivities()
      } catch (error) {
        console.error('Error deleting contract:', error)
        toast.error('Failed to delete contract')
      } finally {
        setDeletingContract(null)
      }
    }
  }

  // Handle contract signing
  const handleSignContract = (contract: Contract) => {
    setContractToSign(contract)
    setIsSignatureModalOpen(true)
  }

  // Generate contract HTML exactly as shown in preview
  const generateContractHTML = (contract: Contract) => {
    const content = contract.contract_content || {}
    const branding = content.branding || {}
    const company = content.company || {}
    const client = content.client || {}
    const terms = content.terms || {}
    const paymentPlan = content.paymentPlan || {}
    const scope = content.scope || {}
    
    // Helper to get payment schedule
    const getPaymentSchedule = () => {
      if (paymentPlan.schedule && Array.isArray(paymentPlan.schedule)) {
        return paymentPlan.schedule
      }
      const total = parseFloat(terms.projectTotal || "0") || 0
      return [total]
    }
    
    const paymentSchedule = getPaymentSchedule()
    const totalPayment = paymentSchedule.reduce((sum: number, amount: number) => sum + amount, 0)
    
    return `
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; padding: 64px; font-family: Georgia, serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
          ${branding.showLogo && branding.logoUrl ? `
            <div style="width: 128px; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #d1d5db; background: #f9fafb;">
              <img src="${branding.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;" />
            </div>
          ` : '<div style="width: 128px;"></div>'}
          <div style="text-align: right; font-size: 14px; font-family: Inter, sans-serif;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${company.name || "{your_company_name}"}</div>
            <div style="color: #4b5563;">${company.email || "{your_email}"}</div>
            ${branding.showAddress && company.address ? `<div style="color: #4b5563; font-size: 12px; margin-top: 4px;">${company.address}</div>` : ''}
          </div>
        </div>

        <div style="text-align: center; border-bottom: 1px solid ${branding.accentColor || '#6366F1'}; padding-bottom: 24px; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 400; color: #111827; margin-bottom: 8px;">Freelance Service Agreement</h1>
          <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-bottom: 8px;">
            This Agreement is between <strong>${company.name || "{your_company_name}"}</strong> ("Freelancer") and <strong>${client.name || "{client_name}"}</strong> ("Client") for the project described below.
          </p>
          <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-top: 8px;">
            Both parties agree to the following terms.
          </p>
        </div>

        <div style="font-size: 14px; font-family: Inter, sans-serif; line-height: 1.75;">
          <!-- 1. Project Summary -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              1️⃣ Project Summary
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 12px;">
              Freelancer agrees to perform the following services for Client:
            </p>
            <div style="margin-left: 16px; margin-bottom: 12px;">
              <p style="color: #374151; margin-bottom: 4px;"><strong>Project:</strong> ${content.projectName || "{project_name}"}</p>
              <p style="color: #374151; margin-bottom: 4px;"><strong>Deliverables:</strong></p>
              ${scope.deliverables ? `
                <div style="white-space: pre-wrap; margin-left: 16px; color: #374151;">${scope.deliverables}</div>
              ` : `
                <p style="color: #6b7280; font-style: italic; margin-left: 16px;">Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support</p>
              `}
              <p style="color: #374151; margin-top: 8px; margin-bottom: 4px;"><strong>Start Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style="color: #374151; margin-bottom: 4px;"><strong>Estimated Completion:</strong> ${terms.estimatedCompletionDate ? new Date(terms.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <p style="color: #374151; line-height: 1.75; margin-top: 12px;">
              Any additional work outside this scope will require a new written agreement or change order.
            </p>
          </div>

          <!-- 2. Payment Terms -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              2️⃣ Payment Terms
            </h2>
            <div style="color: #374151; line-height: 1.75;">
              <p style="margin-bottom: 12px;"><strong>Total Project Fee:</strong> $${totalPayment.toLocaleString()} USD</p>
              ${paymentPlan.enabled ? `
                ${paymentPlan.type === "milestone" ? `
                  <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> Milestone-based billing. You will be invoiced at each milestone; no full upfront payment is required.</p>
                  <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                    ${(paymentPlan.milestones || []).slice(0, paymentPlan.milestonesCount || 4).map((m: any, i: number) => 
                      `<li style="margin-bottom: 4px;">${m.name || `Milestone ${i+1}`}: $${Number(m.amount || 0).toLocaleString()} USD</li>`
                    ).join('')}
                  </ul>
                ` : `
                  <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> The total fee will be paid in ${paymentSchedule.length} payment(s) as follows:</p>
                  <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                    ${paymentSchedule.map((amt: number, idx: number) => 
                      `<li style="margin-bottom: 4px;">Payment ${idx + 1}: $${amt.toLocaleString()} USD</li>`
                    ).join('')}
                  </ul>
                `}
              ` : `
                <p style="margin-bottom: 12px;"><strong>Payment Schedule:</strong> Full payment due upon project completion.</p>
              `}
              <p style="margin-bottom: 8px;">Client agrees to pay invoices by the due date shown on each invoice.</p>
              ${terms.includeLateFee ? `
                <p style="margin-bottom: 8px;">Late payments may incur a ${terms.lateFee}% fee after ${terms.lateDays || 15} days overdue.</p>
              ` : ''}
              <p>Ownership of deliverables transfers to Client only after full payment has been received.</p>
            </div>
          </div>

          <!-- 3. Revisions & Changes -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              3️⃣ Revisions & Changes
            </h2>
            <div style="color: #374151; line-height: 1.75;">
              <p style="margin-bottom: 8px;">This agreement includes ${terms.revisionCount || 2} revision(s) per deliverable.</p>
              ${terms.includeHourlyClause ? `
                <p>Additional revisions or changes in scope will be billed at $${terms.hourlyRate || 150} USD per hour or a mutually agreed rate.</p>
              ` : ''}
            </div>
          </div>

          <!-- 4. Intellectual Property -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              4️⃣ Intellectual Property
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 8px;">After full payment:</p>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Client owns final approved deliverables.</li>
              <li>Freelancer retains the right to display completed work for portfolio and marketing purposes, unless Client requests otherwise in writing.</li>
            </ul>
          </div>

          <!-- 5. Confidentiality -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              5️⃣ Confidentiality
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Freelancer will not share or disclose Client's confidential information without written consent.</li>
              <li>Client will not share Freelancer's proprietary methods or materials without consent.</li>
            </ul>
          </div>

          <!-- 6. Termination -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              6️⃣ Termination
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Either party may end this Agreement with written notice.</li>
              <li style="margin-bottom: 8px;">Client agrees to pay for all work completed up to the termination date.</li>
              <li>Deposits and completed milestone payments are non-refundable once work has begun.</li>
            </ul>
          </div>

          <!-- 7. Liability -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              7️⃣ Liability
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Freelancer provides services in good faith but cannot guarantee specific results or outcomes.</li>
              <li>Freelancer's total liability is limited to the amount Client has paid under this Agreement.</li>
            </ul>
          </div>

          <!-- 8. Acceptance & Signatures -->
          <div style="border-top: 1px solid ${branding.accentColor || '#6366F1'}; padding-top: 48px; margin-top: 48px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; font-family: Georgia, serif;">
              8️⃣ Acceptance & Signatures
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 24px;">
              By signing below, both parties agree to the terms of this Agreement.<br />
              Typing your full legal name acts as your electronic signature.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px;">
              <!-- Service Provider Signature -->
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Service Provider</div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                  <div style="font-size: 14px; color: #111827;">${terms.yourName || "Your Name"}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                  <div style="font-size: 14px; color: #111827;">
                    ${terms.yourSignatureDate ? new Date(terms.yourSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                  <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                    ${terms.yourName || "Your Name"}
                  </div>
                </div>
              </div>

              <!-- Client Signature -->
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Client</div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                  <div style="font-size: 14px; color: #111827;">${client.name || "Client Name"}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                  <div style="font-size: 14px; color: #111827;">
                    ${terms.clientSignatureDate ? new Date(terms.clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                  ${(contract.client_signature_status === 'signed' || (terms.clientSignatureName && terms.clientSignatureName.trim() !== '')) ? `
                    <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                      ${terms.clientSignatureName || ''}
                    </div>
                  ` : `
                    <div style="font-size: 24px; color: #111827; border-bottom: 2px solid #9ca3af; padding-bottom: 4px; min-height: 32px;">
                      &nbsp;
                    </div>
                  `}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  // Handle contract PDF download
  const handleDownloadContractPDF = async (contract: Contract) => {
    try {
      setDownloadingPDF(contract.id)
      
      // Create a temporary div with the contract content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.backgroundColor = '#f8fafc'
      tempDiv.style.fontFamily = 'Georgia, serif'
      
      // Generate contract HTML exactly as shown in preview
      const htmlContent = generateContractHTML(contract)
      
      tempDiv.innerHTML = htmlContent
      document.body.appendChild(tempDiv)
      
      // Generate PDF
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Clean up
      document.body.removeChild(tempDiv)
      
      // Download PDF
      pdf.save(`${contract.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_contract.pdf`)
      
      toast.success('Contract PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating contract PDF:', error)
      toast.error('Failed to generate contract PDF')
    } finally {
      setDownloadingPDF(null)
    }
  }

  // Auto-switch to contracts tab when contracts tour is running
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "contracts" && activeTab !== "contracts") {
      // Use setInterval to wait for tour hint indicating contracts tab
      let hasSwitched = false
      
      const checkForTabSwitch = () => {
        if (hasSwitched) return
        
        const allElements = document.querySelectorAll('*')
        for (const el of allElements) {
          const text = el.textContent || ''
          // If we see hints about Contracts tab, switch to contracts tab
          if (text.includes("Contracts") && text.includes("tab") && text.includes("agreements")) {
            setActiveTab("contracts")
            hasSwitched = true
            break
          }
        }
      }
      
      const interval = setInterval(checkForTabSwitch, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  // Auto-switch to tasks tab when tasks tour is running
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "tasks" && activeTab !== "tasks") {
      // Use setInterval to wait for tour hint indicating tasks tab
      let hasSwitched = false
      
      const checkForTabSwitch = () => {
        if (hasSwitched) return
        
        const allElements = document.querySelectorAll('*')
        for (const el of allElements) {
          const text = el.textContent || ''
          // If we see hints about Tasks tab, switch to tasks tab
          if (text.includes("Tasks") && text.includes("tab") && text.includes("Track")) {
            setActiveTab("tasks")
            hasSwitched = true
            break
          }
        }
      }
      
      const interval = setInterval(checkForTabSwitch, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  useEffect(() => {
    if (projectId) {
      loadProjectData()
      if (!dummyProjects.some(dp => dp.id === projectId)) {
        // Only load activities for real projects
        loadProjectActivities()
      }
    }
  }, [projectId, isTourRunning, currentTour?.id])

  // Load user and account data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          const profile = await getUserProfile(currentUser.id)
          if (profile) {
            setUserProfile(profile)
            setAccountId(profile.account_id)
          }
          
          // Load account information
          const userAccount = await getCurrentAccount()
          if (userAccount) {
            setAccount(userAccount)
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  const handleAddMilestone = async () => {
    if (!newMilestone.title.trim()) {
      toast.error('Please enter a milestone title')
      return
    }

    try {
      setSaving(true)
      const createdMilestone = await createMilestone({
        project_id: projectId,
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim() || undefined,
        due_date: newMilestone.due_date || undefined,
        client_note: newMilestone.client_note.trim() || undefined,
      })

      toast.success('Milestone created successfully')
      setIsAddMilestoneOpen(false)
      setNewMilestone({ title: "", description: "", due_date: "", client_note: "" })

      // Add to local state instead of reloading
      if (createdMilestone) {
        setMilestones(prevMilestones => [...prevMilestones, createdMilestone])

        // Update project milestone count
        if (project) {
          setProject(prevProject => prevProject ? {
            ...prevProject,
            total_milestones: prevProject.total_milestones + 1
          } : null)
        }
      }
    } catch (error) {
      console.error('Error creating milestone:', error)
      toast.error('Failed to create milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!selectedMilestoneId || !newTask.title.trim()) return

    try {
      setSaving(true)
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        due_date: newTask.due_date || undefined,
        priority: newTask.priority,
        status: "todo",
        milestone_id: selectedMilestoneId,
        project_id: projectId,
      }

      const newTaskData = await createTask(taskData)

      // Add the new task to the local state
      setTasks(prev => [...prev, newTaskData])

      // Reset form
      setNewTask({ title: "", description: "", due_date: "", priority: "medium" })
      setIsAddTaskOpen(false)
      setSelectedMilestoneId(null)

      toast.success("Task created successfully!")
    } catch (error) {
      console.error("Error creating task:", error)
      toast.error("Failed to create task")
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      // Update the database
      await updateTask(taskId, { status: newStatus as any })

      // Update local state immediately for instant feedback
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, status: newStatus }
            : task
        )
      )

      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status')
    }
  }

  const handleUpdateMilestoneStatus = async (milestoneId: string, newStatus: string) => {
    try {
      // Update the database
      await updateMilestone(milestoneId, { status: newStatus as any })

      // Update local state immediately for instant feedback
      setMilestones(prevMilestones =>
        prevMilestones.map(milestone =>
          milestone.id === milestoneId
            ? { ...milestone, status: newStatus }
            : milestone
        )
      )

      toast.success(`Milestone marked as ${newStatus.replace("-", " ")}`)
    } catch (error) {
      console.error('Error updating milestone status:', error)
      toast.error('Failed to update milestone status')
    }
  }

  const toggleMilestoneExpansion = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones)
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId)
    } else {
      newExpanded.add(milestoneId)
    }
    setExpandedMilestones(newExpanded)
  }

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone)
    setNewMilestone({
      title: milestone.title,
      description: milestone.description || "",
      due_date: milestone.due_date ? new Date(milestone.due_date).toISOString().split('T')[0] : "",
      client_note: milestone.client_note || "",
    })
    setIsEditMilestoneOpen(true)
  }

  const handleUpdateMilestone = async () => {
    if (!editingMilestone || !newMilestone.title.trim()) {
      toast.error('Please enter a milestone title')
      return
    }

    try {
      setSaving(true)
      await updateMilestone(editingMilestone.id, {
        title: newMilestone.title.trim(),
        description: newMilestone.description.trim() || undefined,
        due_date: newMilestone.due_date || undefined,
        client_note: newMilestone.client_note.trim() || undefined,
      })

      toast.success('Milestone updated successfully')
      setIsEditMilestoneOpen(false)
      setEditingMilestone(null)

      // Update local state instead of reloading
      setMilestones(prevMilestones =>
        prevMilestones.map(milestone =>
          milestone.id === editingMilestone.id
            ? {
              ...milestone,
              title: newMilestone.title.trim(),
              description: newMilestone.description.trim() || null,
              due_date: newMilestone.due_date || null,
              client_note: newMilestone.client_note.trim() || null,
            }
            : milestone
        )
      )

      setNewMilestone({ title: "", description: "", due_date: "", client_note: "" })
    } catch (error) {
      console.error('Error updating milestone:', error)
      toast.error('Failed to update milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone? This will also delete all associated tasks.')) {
      return
    }

    try {
      setSaving(true)
      await deleteMilestone(milestoneId)

      // Update local state immediately
      setMilestones(prevMilestones =>
        prevMilestones.filter(milestone => milestone.id !== milestoneId)
      )

      toast.success('Milestone deleted successfully')
    } catch (error) {
      console.error('Error deleting milestone:', error)
      toast.error('Failed to delete milestone')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      setSaving(true)
      await deleteTask(taskId)

      // Update local state immediately
      setTasks(prevTasks =>
        prevTasks.filter(task => task.id !== taskId)
      )

      toast.success('Task deleted successfully')
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingNote(null)
    setNoteText("")
  }

  const calculateStepProgress = (tasks: any[]) => {
    if (!tasks || tasks.length === 0) return 0
    const completedTasks = tasks.filter(task => task.status === "done").length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  // Tag management functions for edit project modal
  const addTagToEditProject = (tagName: string) => {
    if (!editProjectForm.tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
      setEditProjectForm({
        ...editProjectForm,
        tags: [...editProjectForm.tags, { name: tagName, color: standardTag?.color }]
      })
    }
  }

  const removeTagFromEditProject = (tagName: string) => {
    setEditProjectForm({
      ...editProjectForm,
      tags: editProjectForm.tags.filter(tag => tag.name !== tagName)
    })
  }

  const createCustomTagForEdit = () => {
    if (!editNewTag.trim()) {
      toast.error('Please enter a tag name')
      return
    }

    if (editProjectForm.tags.find(tag => tag.name.toLowerCase() === editNewTag.trim().toLowerCase())) {
      toast.error('Tag already exists')
      return
    }

    setEditProjectForm({
      ...editProjectForm,
      tags: [...editProjectForm.tags, { name: editNewTag.trim(), color: editNewTagColor }]
    })
    setCustomTagColors(prev => ({ ...prev, [editNewTag.trim()]: editNewTagColor }))
    setEditNewTag("")
    setEditNewTagColor("#6B7280")
  }

  const getTagDisplayColor = (tagName: string): string => {
    // First check database colors
    const projectColors = projectTagColors[projectId]
    if (projectColors && projectColors[tagName]) {
      return projectColors[tagName]
    }

    // Then check if it's a custom tag with saved color
    if (customTagColors[tagName]) {
      return customTagColors[tagName]
    }

    // Then check standard tags
    const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }

    // Default color
    return '#6B7280'
  }

  const handleEditProject = () => {
    if (!project) return

    // Format the date for the input field (YYYY-MM-DD format)
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }

    // Get project tags with colors
    const projectTagNames = tags.map(tag => tag.tag_name)
    const projectTagColorsData = projectTagColors[projectId] || {}

    setEditProjectForm({
      name: project.name,
      client_id: project.client_id,
      due_date: formatDateForInput(project.due_date),
      description: project.description || "",
      status: project.status,
      tags: projectTagNames.map(tagName => ({
        name: tagName,
        color: projectTagColorsData[tagName] || getProjectTagColor(tagName)
      })),
    })
    setIsEditProjectOpen(true)
  }

  const handleUpdateProject = async () => {
    if (!project) return

    if (!editProjectForm.name.trim()) {
      toast.error('Please enter a project name')
      return
    }

    if (!editProjectForm.client_id) {
      toast.error('Please select a client')
      return
    }

    try {
      setSaving(true)
      const loadingToast = toast.loading('Updating project...')

      await updateProject(project.id, {
        client_id: editProjectForm.client_id,
        name: editProjectForm.name.trim(),
        description: editProjectForm.description.trim() || undefined,
        status: editProjectForm.status,
        due_date: editProjectForm.due_date || undefined,
        tags: editProjectForm.tags
      })

      toast.dismiss(loadingToast)
      toast.success('Project updated successfully')
      setIsEditProjectOpen(false)

      // Update local state immediately without reloading the page
      const updatedProject = {
        ...project,
        name: editProjectForm.name.trim(),
        description: editProjectForm.description.trim() || null,
        status: editProjectForm.status,
        due_date: editProjectForm.due_date || null,
        client_id: editProjectForm.client_id
      }
      setProject(updatedProject)

      // Update client info if it changed
      if (editProjectForm.client_id !== project.client_id) {
        const newClient = availableClients.find(c => c.id === editProjectForm.client_id)
        if (newClient) {
          setClient(newClient)
        }
      }

      // Update tags
      const updatedTags = editProjectForm.tags.map(tag => ({
        id: `temp-${tag.name}`,
        project_id: project.id,
        tag_name: tag.name,
        color: tag.color || getProjectTagColor(tag.name),
        created_at: new Date().toISOString()
      }))
      setTags(updatedTags)

      // Reset form
      setEditProjectForm({
        name: "",
        client_id: "",
        due_date: "",
        description: "",
        status: "draft",
        tags: [],
      })
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project) return

    try {
      await deleteProject(project.id)
      toast.success('Project deleted successfully')
      router.push('/dashboard/projects')
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    }
  }

  // Files functionality
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setSelectedFilesForUpload(selectedFiles)
  }

  const handleUploadFiles = async () => {
    if (selectedFilesForUpload.length === 0) {
      toast.error('Please select at least one file to upload')
      return
    }

    try {
      setUploading(true)

      // Filter tag colors to only include colors for tags that are actually being used
      const fileTagColors: Record<string, string> = {}
      uploadForm.tags.forEach(tag => {
        if (customTagColors[tag]) {
          fileTagColors[tag] = customTagColors[tag]
        }
      })

      for (const file of selectedFilesForUpload) {
        const uploadedFile = await uploadFile(
          file,
          undefined, // No client
          project?.id, // Link to this project
          uploadForm.description || undefined,
          uploadForm.tags,
          fileTagColors
        )
        
        // Update approval status based on checkbox
        if (uploadedFile) {
          const approvalStatus = uploadForm.requireApproval ? 'pending' : 'approved'
          await updateFile(uploadedFile.id, { approval_status: approvalStatus })
        }
      }

      toast.success(`${selectedFilesForUpload.length} file(s) uploaded successfully`)
      setIsUploadDialogOpen(false)
      setSelectedFilesForUpload([])
      setUploadForm({
        description: "",
        tags: [],
        requireApproval: false,
      })

      // Reload project data to get updated files
      await loadProjectData()
      
      // File upload activities are automatically logged by database trigger (log_file_upload)
      // No need to manually log here to avoid duplicates
      
      // Refresh activities immediately
      loadProjectActivities()
    } catch (error) {
      console.error('Error uploading files:', error)
      toast.error('Failed to upload files')
    } finally {
      setUploading(false)
    }
  }

  const removeFileFromUpload = (index: number) => {
    setSelectedFilesForUpload(prev => prev.filter((_, i) => i !== index))
  }

  const removeTagFromUpload = (tag: string) => {
    setUploadForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addTagToUpload = (tag: string) => {
    if (!uploadForm.tags.includes(tag)) {
      setUploadForm(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  const createCustomTag = () => {
    if (newTag.trim() && !uploadForm.tags.includes(newTag.trim())) {
      const tagName = newTag.trim()
      addTagToUpload(tagName)
      setCustomTagColors(prev => ({
        ...prev,
        [tagName]: newTagColor
      }))
      setNewTag("")
      setNewTagColor("#3B82F6")
    }
  }

  const getFileIcon = (type: string) => {
    const fileType = type.toLowerCase()
    
    // Video files - Purple
    if (['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'].includes(fileType)) {
      return <Video className="h-5 w-5 text-purple-500" />
    }
    
    // Audio files - Pink
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(fileType)) {
      return <Music className="h-5 w-5 text-pink-500" />
    }
    
    // Image files - Green
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'ico', 'ai', 'psd', 'fig'].includes(fileType)) {
      return <Image className="h-5 w-5 text-green-500" />
    }
    
    // PDF - Red
    if (fileType === 'pdf') {
      return <FileText className="h-5 w-5 text-red-500" />
    }
    
    // Document files - Blue
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(fileType)) {
      return <FileText className="h-5 w-5 text-blue-500" />
    }
    
    // Spreadsheet files - Emerald
    if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) {
      return <FileText className="h-5 w-5 text-emerald-500" />
    }
    
    // Presentation files - Orange
    if (['ppt', 'pptx', 'odp'].includes(fileType)) {
      return <FileText className="h-5 w-5 text-orange-500" />
    }
    
    // Archive files - Amber
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(fileType)) {
      return <Archive className="h-5 w-5 text-amber-500" />
    }
    
    // Code files - Cyan
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'py', 'java', 'cpp', 'c', 'php', 'rb', 'go', 'rs', 'swift'].includes(fileType)) {
      return <FileText className="h-5 w-5 text-cyan-500" />
    }
    
    // Default - Gray
    return <File className="h-5 w-5 text-gray-500" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }



  const handleFileAction = async (action: string, file: File) => {
    try {
      switch (action) {
        case "download":
          const downloadUrl = await downloadFile(file.id)
          if (downloadUrl) {
            window.open(downloadUrl, '_blank')
            toast.success('Download started')
          }
          break
        case "approve":
          await approveFile(file.id)
          toast.success('File approved successfully')
          await loadProjectData()
          
          // Activity is automatically logged by database trigger (log_file_approval_change)
          // No need to manually log here to avoid duplicates
          loadProjectActivities()
          break
        case "reject":
          await rejectFile(file.id)
          toast.success('File rejected successfully')
          await loadProjectData()
          
          // Activity is automatically logged by database trigger (log_file_approval_change)
          // No need to manually log here to avoid duplicates
          loadProjectActivities()
          break
        case "pending":
          await updateFile(file.id, { approval_status: 'pending' })
          toast.success('File marked as pending')
          await loadProjectData()
          
          // Activity is automatically logged by database trigger (log_file_approval_change)
          // No need to manually log here to avoid duplicates
          loadProjectActivities()
          break
        case "delete":
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            await deleteFile(file.id)
            toast.success('File deleted successfully')
            await loadProjectData()
            
            // Activity logging for file deletion is handled by database triggers
            // No need to manually log here to avoid duplicates
            loadProjectActivities()
          }
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on file:`, error)
      toast.error(`Failed to ${action} file`)
    }
  }

  // File viewer functions
  const handleViewFile = async (file: File) => {
    try {
      setSelectedFileForView(file)
      setIsViewModalOpen(true)

      const url = await getFileUrl(file.id)
      if (url) {
        setFileViewUrl(url)
      } else {
        toast.error('Unable to load file preview')
        setIsViewModalOpen(false)
      }
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast.error('Failed to load file preview')
      setIsViewModalOpen(false)
    }
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedFileForView(null)
    setFileViewUrl("")
  }

  // Comments functions
  const handleOpenComments = async (file: File) => {
    try {
      setSelectedFileForComments(file)
      setIsCommentsModalOpen(true)
      setLoadingComments(true)

      // Load comments for this file
      const comments = await getFileComments(file.id)
      setFileComments(comments)
    } catch (error) {
      console.error('Error loading comments:', error)
      toast.error('Failed to load comments')
    } finally {
      setLoadingComments(false)
    }
  }

  // Form action functions
  const handleViewForm = (form: Form) => {
    setPreviewForm(form)
    setShowFormPreview(true)
  }

  const handleEditForm = (form: Form) => {
    const formData = {
      id: form.id,
      title: form.title,
      fields: form.form_structure?.fields || [],
      client_id: form.client_id,
      project_id: form.project_id,
      instructions: form.instructions
    }
    
    const encodedData = encodeURIComponent(JSON.stringify(formData))
    router.push(`/dashboard/forms/builder?edit=${encodedData}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)
  }

  const handleDeleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      return
    }

    setDeletingForm(formId)
    try {
      await deleteForm(formId)
      toast.success('Form deleted successfully')
      // Reload project data to refresh the forms list
      await loadProjectData()
    } catch (error) {
      console.error('Error deleting form:', error)
      toast.error('Failed to delete form')
    } finally {
      setDeletingForm(null)
    }
  }

  // Template modal functions
  const handleOpenTemplateModal = async () => {
    setShowTemplateModal(true)
    setLoadingTemplates(true)
    
    try {
      const templates = await getFormTemplates()
      console.log('Loaded templates:', templates)
      setFormTemplates(templates)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load form templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSelectTemplate = (template: any) => {
    // Navigate to form builder with template data
    const templateData = {
      templateId: template.id,
      title: template.name,
      fields: template.template_data?.fields || [],
      instructions: template.description || '',
      client_id: client?.id,
      project_id: projectId
    }
    
    const encodedData = encodeURIComponent(JSON.stringify(templateData))
    router.push(`/dashboard/forms/builder?template=${encodedData}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)
  }

  const closeFormPreview = () => {
    setShowFormPreview(false)
    setPreviewForm(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push('/dashboard/projects')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    )
  }

  const milestoneTasks = milestones.map(milestone => ({
    ...milestone,
    tasks: tasks.filter(task => task.milestone_id === milestone.id)
  }))

  return (
    <DashboardLayout>
      {/* Enhanced Header with Stats */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] mt-6 mb-8" data-help="project-details-header">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 p-6">
          {/* Top Row: Back Button + Actions */}
          <div className="flex items-center justify-between mb-4">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/dashboard/workflow')}
              className="text-white/90 hover:text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Client Workflow
            </Button>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/20 bg-white/10">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Portal
              </Button>
              <Button onClick={handleEditProject} className="bg-white text-[#3C3CFF] hover:bg-white/90">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteProject}
                className="text-red-500 border-red-400/50 hover:bg-red-500/20 hover:text-red-600 hover:border-red-500"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          {/* Project Title */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-3">{project.name}</h1>
              <div className="flex items-center space-x-4">
                <Badge 
                  variant="outline" 
                  className="bg-white/20 text-white border-white/30 font-medium px-3 py-1"
                >
                  {project.status.replace("-", " ").toUpperCase()}
                </Badge>
                {tags.length > 0 && (
                  <div className="flex space-x-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs font-medium px-2.5 py-1 bg-white/20 text-white border-white/30"
                      >
                        {tag.tag_name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      <Dialog open={isEditProjectOpen} onOpenChange={setIsEditProjectOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editProjectName">Project Name *</Label>
                <Input
                  id="editProjectName"
                  value={editProjectForm.name}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, name: e.target.value })}
                  placeholder="Enter project name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProjectClient">Client *</Label>
                <Select
                  value={editProjectForm.client_id}
                  onValueChange={(value) => setEditProjectForm({ ...editProjectForm, client_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.first_name} {client.last_name}
                        {client.company && ` (${client.company})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProjectStatus">Status</Label>
                <Select
                  value={editProjectForm.status}
                  onValueChange={(value: any) => setEditProjectForm({ ...editProjectForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editProjectDescription">Description</Label>
                <Textarea
                  id="editProjectDescription"
                  value={editProjectForm.description}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, description: e.target.value })}
                  placeholder="Optional project description"
                  rows={4}
                />
              </div>
            </div>

            {/* Right Column - Dates and Tags */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editProjectDueDate">Due Date</Label>
                <Input
                  id="editProjectDueDate"
                  type="date"
                  value={editProjectForm.due_date}
                  onChange={(e) => setEditProjectForm({ ...editProjectForm, due_date: e.target.value })}
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <Label>Tags</Label>

                {/* Selected Tags */}
                {editProjectForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editProjectForm.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{
                          backgroundColor: `${tag.color || getProjectTagColor(tag.name)}20`,
                          borderColor: tag.color || getProjectTagColor(tag.name),
                          color: tag.color || getProjectTagColor(tag.name)
                        }}
                        onClick={() => removeTagFromEditProject(tag.name)}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Standard Tags */}
                <div>
                  <Label className="text-sm text-gray-600">Standard Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {standardProjectTags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => addTagToEditProject(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Custom Tag */}
                <div>
                  <Label className="text-sm text-gray-600">Custom Tag</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Tag name"
                      value={editNewTag}
                      onChange={(e) => setEditNewTag(e.target.value)}
                      className="flex-1"
                    />
                    <input
                      type="color"
                      value={editNewTagColor}
                      onChange={(e) => setEditNewTagColor(e.target.value)}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                    />
                    <Button
                      onClick={createCustomTagForEdit}
                      disabled={!editNewTag.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  {editNewTag.trim() && (
                    <div className="mt-2">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${editNewTagColor}20`,
                          borderColor: editNewTagColor,
                          color: editNewTagColor
                        }}
                      >
                        {editNewTag}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
            <Button variant="outline" onClick={() => setIsEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Update Project
            </Button>
          </div>
        </DialogContent>
      </Dialog>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex w-full mb-12 mt-4 h-auto p-2 bg-white border border-gray-200 rounded-xl shadow-sm" data-help="project-details-tabs">
           
            <TabsTrigger value="tasks" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1" data-help="tasks-tab">
              <CheckSquare className="h-5 w-5 mb-1" />
              <span className="font-medium">Tasks</span>
              <span className="text-xs opacity-75">{tasks.length} tasks</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <MessageCircle className="h-5 w-5 mb-1" />
              <span className="font-medium">Messages</span>
              <span className="text-xs opacity-75">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <FolderOpen className="h-5 w-5 mb-1" />
              <span className="font-medium">Files</span>
              <span className="text-xs opacity-75">{projectFiles.length} files</span>
            </TabsTrigger>
            <TabsTrigger value="forms" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <Clipboard className="h-5 w-5 mb-1" />
              <span className="font-medium">Forms</span>
              <span className="text-xs opacity-75">{projectForms.length} forms</span>
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1" data-help="contracts-tab">
              <FileSignature className="h-5 w-5 mb-1" />
              <span className="font-medium">Contracts</span>
              <span className="text-xs opacity-75">{projectContracts.length} contracts</span>
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <DollarSign className="h-5 w-5 mb-1" />
              <span className="font-medium">Invoices</span>
              <span className="text-xs opacity-75">{projectInvoices.length} invoices</span>
            </TabsTrigger>
            <TabsTrigger value="time" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <Clock className="h-5 w-5 mb-1" />
              <span className="font-medium">Time Tracked</span>
              <span className="text-xs opacity-75">{timeEntries.length} entries</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#3C3CFF] data-[state=active]:to-[#5252FF] data-[state=active]:text-white rounded-lg py-3 px-4 transition-all duration-200 flex flex-col items-center gap-1">
              <Activity className="h-5 w-5 mb-1" />
              <span className="font-medium">Activity</span>
              <span className="text-xs opacity-75">Log</span>
            </TabsTrigger>
          </TabsList>


          <TabsContent value="messages" className="mt-0 flex flex-col h-full">
            {accountId && project ? (
              <DashboardMessageChat
                projectId={project.id}
                accountId={accountId}
                projectName={project.name}
                clientName={client ? `${client.first_name} ${client.last_name}` : undefined}
                brandColor="#3C3CFF"
              />
            ) : (
              <div className="flex-1 bg-white border-0 shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-0">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C3CFF] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading messages...</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Files</h2>
                  <p className="text-gray-600 mt-1">Manage and organize project files</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Client Files Filter Toggle */}
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="client-files-only"
                      checked={showClientFilesOnly}
                      onCheckedChange={setShowClientFilesOnly}
                    />
                    <label htmlFor="client-files-only" className="text-sm text-gray-600">
                      Show client uploads only
                    </label>
                  </div>
                  
                  <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Files
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload Files</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      {/* File Selection */}
                      <div>
                        <Label htmlFor="file-upload">Select Files</Label>
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            id="file-upload"
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose Files
                          </Button>
                        </div>

                        {/* Selected Files List */}
                        {selectedFilesForUpload.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <Label>Selected Files:</Label>
                            {selectedFilesForUpload.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div className="flex items-center">
                                  {getFileIcon(file.name.split('.').pop()?.toUpperCase() || '')}
                                  <span className="ml-2 text-sm">{file.name}</span>
                                  <span className="ml-2 text-xs text-gray-500">({formatFileSize(file.size)})</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFileFromUpload(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                          id="description"
                          placeholder="Add a description for these files..."
                          value={uploadForm.description}
                          onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="requireApproval"
                            checked={uploadForm.requireApproval}
                            onChange={(e) => setUploadForm(prev => ({ ...prev, requireApproval: e.target.checked }))}
                            className="w-4 h-4 text-[#3C3CFF] border-gray-300 rounded focus:ring-[#3C3CFF]"
                          />
                          <Label htmlFor="requireApproval" className="cursor-pointer font-medium text-sm">
                            Require client approval before file is accessible
                          </Label>
                        </div>
                      </div>

                      <div>
                        <Label>Tags (Optional)</Label>
                        <div className="mt-2 space-y-2">
                          <div className="flex flex-wrap gap-2">
                            {uploadForm.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="cursor-pointer"
                                onClick={() => removeTagFromUpload(tag)}
                                style={{
                                  backgroundColor: `${customTagColors[tag] || '#3B82F6'}20`,
                                  borderColor: customTagColors[tag] || '#3B82F6',
                                  color: customTagColors[tag] || '#3B82F6'
                                }}
                              >
                                {tag} ×
                              </Badge>
                            ))}
                          </div>

                          {/* Tag Preview */}
                          {newTag.trim() && (
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <span className="text-sm text-gray-600">Preview:</span>
                              <Badge
                                variant="outline"
                                style={{
                                  backgroundColor: `${newTagColor}20`,
                                  borderColor: newTagColor,
                                  color: newTagColor
                                }}
                              >
                                {newTag}
                              </Badge>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a tag"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  createCustomTag()
                                }
                              }}
                            />
                            <input
                              type="color"
                              value={newTagColor}
                              onChange={(e) => setNewTagColor(e.target.value)}
                              className="w-12 h-10 rounded border cursor-pointer"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={createCustomTag}
                              disabled={!newTag.trim()}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUploadFiles}
                        disabled={selectedFilesForUpload.length === 0 || uploading}
                      >
                        {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Upload {selectedFilesForUpload.length > 0 ? `(${selectedFilesForUpload.length} files)` : ''}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

              <div className="grid gap-4">
                {(() => {
                  const filteredFiles = showClientFilesOnly 
                    ? projectFiles.filter(file => file.sent_by_client === true)
                    : projectFiles;
                  
                  if (filteredFiles.length === 0) {
                    return (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <div className="text-gray-500">
                            <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2">
                              {showClientFilesOnly ? "No client uploads yet" : "No files uploaded yet"}
                            </h3>
                            <p className="mb-4">
                              {showClientFilesOnly 
                                ? "Files uploaded by clients will appear here" 
                                : "Upload files to get started with your project"
                              }
                            </p>
                            {!showClientFilesOnly && (
                              <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                                <Upload className="h-4 w-4 mr-2" />
                                Upload Files
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                  
                  return filteredFiles.map((file) => (
                    <Card key={file.id} className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="text-3xl">{getFileIcon(file.file_type)}</div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{file.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{formatFileSize(file.file_size)}</span>
                                  <span>•</span>
                                  <span>Uploaded {formatTimeAgo(file.created_at)}</span>
                                  <span>•</span>
                                  <span>by {file.uploaded_by_name || 'Unknown'}</span>
                                </div>
                                {/* Tags */}
                                {file.tags && file.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {file.tags.map((tag: any, index: number) => (
                                      <Badge
                                        key={index}
                                        variant="outline"
                                        className="text-xs"
                                        style={{
                                          backgroundColor: `${tag.color}20`,
                                          borderColor: tag.color,
                                          color: tag.color
                                        }}
                                      >
                                        {tag.name}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge
                              className={`${file.approval_status === "approved"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : file.approval_status === "rejected"
                                  ? "bg-red-100 text-red-700 border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                }`}
                            >
                              {file.approval_status === "approved" ? "Approved" :
                                file.approval_status === "rejected" ? "Rejected" : "Pending Approval"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#3C3CFF] hover:bg-[#F0F2FF]"
                                onClick={() => handleViewFile(file)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#3C3CFF] hover:bg-[#F0F2FF]"
                                onClick={() => handleFileAction("download", file)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[#3C3CFF] hover:bg-[#F0F2FF]"
                                onClick={() => handleOpenComments(file)}
                              >
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Comments
                              </Button>
                            </div>

                            <div className="flex items-center space-x-2">
                              {file.approval_status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                                    onClick={() => handleFileAction("approve", file)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={() => handleFileAction("reject", file)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">

                                  {file.approval_status !== "approved" && (
                                    <DropdownMenuItem
                                      onClick={() => handleFileAction("approve", file)}
                                      className="text-green-600"
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  {file.approval_status !== "rejected" && (
                                    <DropdownMenuItem
                                      onClick={() => handleFileAction("reject", file)}
                                      className="text-red-600"
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                                  {file.approval_status !== "pending" && (
                                    <DropdownMenuItem
                                      onClick={() => handleFileAction("pending", file)}
                                      className="text-yellow-600"
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Mark as Pending
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleFileAction("delete", file)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete File
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ));
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Project Forms</h2>
                <p className="text-gray-600 mt-1">Manage forms assigned to this project</p>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  className="border-[#3C3CFF] text-[#3C3CFF] hover:bg-[#F0F2FF]"
                  onClick={handleOpenTemplateModal}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Choose from your templates
                </Button>
                <Button 
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                  onClick={() => {
                    if (project?.client_id && projectId) {
                      router.push(`/dashboard/forms/builder?client_id=${project.client_id}&project_id=${projectId}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)
                    } else {
                      router.push('/dashboard/forms/builder')
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Form
                </Button>
              </div>
            </div>

            {/* Forms List */}
            <div className="space-y-4">
              {loadingForms ? (
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Loading forms...</p>
                  </CardContent>
                </Card>
              ) : projectForms.length === 0 ? (
                /* Empty State */
                <Card className="bg-white border-0 shadow-sm rounded-2xl">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No forms have been added to this project yet</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        Create forms to collect information, feedback, and approvals from your client.
                      </p>
                      <Button 
                        className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                        onClick={() => {
                    if (project?.client_id && projectId) {
                      router.push(`/dashboard/forms/builder?client_id=${project.client_id}&project_id=${projectId}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)
                    } else {
                      router.push('/dashboard/forms/builder')
                    }
                  }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* Forms List */
                projectForms.map((form) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "published":
                        return "bg-green-100 text-green-700 border-green-200"
                      case "draft":
                        return "bg-yellow-100 text-yellow-700 border-yellow-200"
                      case "archived":
                        return "bg-gray-100 text-gray-700 border-gray-200"
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  }

                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case "published":
                        return <CheckCircle className="h-4 w-4 text-green-500" />
                      case "draft":
                        return <Clock className="h-4 w-4 text-yellow-500" />
                      case "archived":
                        return <Archive className="h-4 w-4 text-gray-400" />
                      default:
                        return <Circle className="h-4 w-4 text-gray-400" />
                    }
                  }

                  const getActionButtons = (status: string) => {
                    const buttons = []
                    
                    if (status === "published") {
                      buttons.push(
                        <Button
                          key="view"
                          variant="outline"
                          size="sm"
                          className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          onClick={() => handleViewForm(form)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )
                      
                      // Add "See Submissions" button if form has submissions
                      if (form.total_submissions > 0) {
                        buttons.push(
                          <Button
                            key="submissions"
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-600 hover:bg-green-50 bg-transparent"
                            onClick={() => router.push(`/dashboard/forms/${form.id}/submissions`)}
                          >
                            <Clipboard className="h-4 w-4 mr-1" />
                            See Submissions
                          </Button>
                        )
                      }
                    } else {
                      buttons.push(
                        <Button
                          key="edit"
                          variant="outline"
                          size="sm"
                          className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          onClick={() => router.push(`/dashboard/forms/builder?edit=${encodeURIComponent(JSON.stringify({
                            id: form.id,
                            title: form.title,
                            fields: form.form_structure?.fields || [],
                            client_id: form.client_id,
                            project_id: form.project_id,
                            instructions: form.instructions
                          }))}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )
                    }
                    
                    return buttons
                  }

                  return (
                    <Card
                      key={form.id}
                      className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className="text-2xl">📝</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{form.title}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    form.status === "published"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : form.status === "draft"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {form.status === "published" ? "Published" : 
                                   form.status === "draft" ? "Draft" : 
                                   form.status === "archived" ? "Archived" : form.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Status:</span>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(form.status)}
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(form.status)}`}>
                                      {form.status === "draft" ? "Draft" : 
                                       form.status === "published" ? "Published" : 
                                       form.status === "archived" ? "Archived" : form.status}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Submissions:</span>
                                  <span className="text-sm text-gray-900">{form.total_submissions || 0}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Last updated:</span>
                                  <span className="text-sm text-gray-900">{formatTimeAgo(form.updated_at)}</span>
                                </div>
                              </div>

                              {form.description && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                  <p className="text-sm text-gray-700">{form.description}</p>
                                </div>
                              )}

                              {form.status === "published" && form.total_submissions > 0 && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">
                                      <span className="font-medium">{form.total_submissions} submission{form.total_submissions !== 1 ? 's' : ''}</span>
                                      {form.last_submission_at && ` • Last submitted ${formatTimeAgo(form.last_submission_at)}`}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getActionButtons(form.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewForm(form)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditForm(form)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Form
                                </DropdownMenuItem>
                                {form.status === "published" && form.total_submissions > 0 && (
                                  <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}/submissions`)}>
                                    <Clipboard className="h-4 w-4 mr-2" />
                                    View Submissions
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteForm(form.id)}
                                  disabled={deletingForm === form.id}
                                >
                                  {deletingForm === form.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete Form
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6" data-help="contracts-tab-content">
            <div className="flex items-center justify-between" data-help="contracts-header">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Project Contracts</h2>
                <p className="text-gray-600 mt-1">Manage contracts associated with this project</p>
              </div>
              <Button 
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                onClick={() => router.push(`/dashboard/contracts/new?project=${projectId}`)}
                data-help="btn-new-contract"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Contract
              </Button>
            </div>

            {/* Contract Summary Cards */}
            {!loadingContracts && projectContracts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Contracts */}
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Contracts</p>
                        <p className="text-2xl font-bold text-blue-900">{projectContracts.length}</p>
                      </div>
                      <div className="p-2 bg-blue-200 rounded-lg">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Signed Contracts */}
                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600">Signed</p>
                        <p className="text-2xl font-bold text-emerald-900">
                          {projectContracts.filter(c => c.status === 'signed').length}
                        </p>
                      </div>
                      <div className="p-2 bg-emerald-200 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pending Contracts */}
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Pending</p>
                        <p className="text-2xl font-bold text-orange-900">
                          {projectContracts.filter(c => ['awaiting_signature', 'sent'].includes(c.status)).length}
                        </p>
                      </div>
                      <div className="p-2 bg-orange-200 rounded-lg">
                        <Clock className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Draft Contracts */}
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Draft</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {projectContracts.filter(c => c.status === 'draft').length}
                        </p>
                      </div>
                      <div className="p-2 bg-gray-200 rounded-lg">
                        <FileText className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {loadingContracts ? (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading contracts...</p>
                </CardContent>
              </Card>
            ) : projectContracts.length === 0 ? (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No contracts for this project yet</h3>
                    <p className="mb-4">Create contracts to manage agreements and legal documents for this project</p>
                    <Button 
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                      onClick={() => router.push(`/dashboard/contracts/new?project=${projectId}`)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Contract
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {projectContracts.map((contract) => {
                  const StatusIcon = contractStatusConfig[contract.status as keyof typeof contractStatusConfig]?.icon || FileText
                  const statusLabel = contractStatusConfig[contract.status as keyof typeof contractStatusConfig]?.label || contract.status
                  const statusColor = contractStatusConfig[contract.status as keyof typeof contractStatusConfig]?.color || "bg-gray-100 text-gray-800"

                  return (
                    <Card key={contract.id} className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className="text-2xl">📄</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{contract.name}</h4>
                                <Badge className={statusColor}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusLabel}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Contract #:</span>
                                  <span className="text-sm text-gray-900 font-mono">{contract.contract_number}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Value:</span>
                                  <span className="text-sm text-gray-900">
                                    {(() => {
                                      // Calculate total from payment_terms
                                      if (contract.payment_terms) {
                                        const amounts = contract.payment_terms.match(/\$[\d,]+\.?\d*/g)
                                        if (amounts && amounts.length > 0) {
                                          const total = amounts.reduce((sum: number, amount: string) => {
                                            return sum + parseFloat(amount.replace(/[$,]/g, ''))
                                          }, 0)
                                          return `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        }
                                      }
                                      // Fallback to total_value if payment_terms doesn't have amounts
                                      return contract.total_value ? `$${contract.total_value.toLocaleString()}` : 'Not specified'
                                    })()}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Created:</span>
                                  <span className="text-sm text-gray-900">{formatTimeAgo(contract.created_at)}</span>
                                </div>
                              </div>

                              {contract.description && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                                  <p className="text-sm text-gray-700">{contract.description}</p>
                                </div>
                              )}

                              {contract.client_name && (
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Users className="h-4 w-4" />
                                  <span>Client: {contract.client_name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  {isContractFullySigned(contract) ? "View Signed Contract" : "View"}
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/contracts/new?edit=${contract.id}&project=${params.id}`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSendContract(contract)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send/Resend
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(contract, 'draft')}>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Make Draft
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(contract, 'awaiting_signature')}>
                                  <Clock className="h-4 w-4 mr-2" />
                                  Make Pending
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(contract, 'signed')}>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark as Signed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleSignContract(contract)}>
                                  <FileSignature className="h-4 w-4 mr-2" />
                                  Sign Contract
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(contract, 'archived')}>
                                  <Archive className="h-4 w-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownloadContractPDF(contract)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateContract(contract)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteContract(contract.id)}
                                  disabled={deletingContract === contract.id}
                                >
                                  {deletingContract === contract.id ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4 mr-2" />
                                  )}
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Project Invoices</h3>
                  <p className=" text-gray-600">Manage and track all invoices for this project</p>
                </div>
                <Button 
                  className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                  onClick={() => router.push(`/dashboard/billing/create?project_id=${projectId}${project?.client_id ? `&client_id=${project.client_id}` : ''}`)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </div>

              {/* Loading State */}
              {loadingInvoices && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
                </div>
              )}

              {/* Empty State */}
              {!loadingInvoices && projectInvoices.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No invoices yet</h3>
                      <p className="mb-4">Create your first invoice for this project to get started</p>
                      <Button 
                        className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                        onClick={() => router.push(`/dashboard/billing/create?project_id=${projectId}${project?.client_id ? `&client_id=${project.client_id}` : ''}`)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Summary Cards */}
              {!loadingInvoices && projectInvoices.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {/* Total Invoices */}
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Invoices</p>
                          <p className="text-2xl font-bold text-blue-900">{projectInvoices.length}</p>
                        </div>
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Total Amount */}
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Amount</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(projectInvoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0))}
                          </p>
                        </div>
                        <div className="p-2 bg-green-200 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Paid Amount */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-600">Paid Amount</p>
                          <p className="text-2xl font-bold text-emerald-900">
                            {formatCurrency(projectInvoices
                              .filter(invoice => invoice.status === 'paid')
                              .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
                            )}
                          </p>
                        </div>
                        <div className="p-2 bg-emerald-200 rounded-lg">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Outstanding Amount */}
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Outstanding</p>
                          <p className="text-2xl font-bold text-orange-900">
                            {formatCurrency(projectInvoices
                              .filter(invoice => invoice.status !== 'paid')
                              .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
                            )}
                          </p>
                        </div>
                        <div className="p-2 bg-orange-200 rounded-lg">
                          <Clock className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Invoices List */}
              {!loadingInvoices && projectInvoices.length > 0 && (
                <div className="space-y-4">
                  {projectInvoices.map((invoice) => (
                    <Card key={invoice.id} className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div>
                                <h4 className="font-semibold text-gray-900 text-lg">
                                  {invoice.title || 'Untitled Invoice'}
                                </h4>
                                <p className="text-sm text-gray-600">#{invoice.invoice_number}</p>
                              </div>
                              <Badge className={getInvoiceStatusColor(invoice.status)}>
                                {getInvoiceStatusLabel(invoice.status)}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Client:</span>
                                <p className="font-medium text-gray-900">{invoice.client_name || 'Unknown'}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Amount:</span>
                                <p className="font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Issue Date:</span>
                                <p className="font-medium text-gray-900">{formatDate(invoice.issue_date)}</p>
                              </div>
                              <div>
                                <span className="text-gray-500">Due Date:</span>
                                <p className="font-medium text-gray-900">
                                  {invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/billing/create?edit=${invoice.id}`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Invoice
                              </DropdownMenuItem>
                              {invoice.status !== "paid" && (
                                <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => openStatusChangeModal(invoice)}>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                Change Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(invoice)}>
                                {downloadingPDF === invoice.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="mr-2 h-4 w-4" />
                                )}
                                {downloadingPDF === invoice.id ? "Generating PDF..." : "Download PDF"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)}>
                                <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                                Delete Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Time Tracked</h3>
                  <p className="text-gray-600">View all time entries logged for this project</p>
                </div>
                <Link href="/dashboard/time-tracking">
                  <Button className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white">
                    <Clock className="mr-2 h-4 w-4" />
                    Track Time
                  </Button>
                </Link>
              </div>

              {/* Loading State */}
              {loadingTimeEntries && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
                </div>
              )}

              {/* Empty State */}
              {!loadingTimeEntries && timeEntries.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">No time tracked yet</h3>
                      <p className="mb-4">Start tracking time for this project to see your entries here</p>
                      <Link href="/dashboard/time-tracking">
                        <Button className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white">
                          <Clock className="mr-2 h-4 w-4" />
                          Start Tracking
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Time Summary Cards */}
              {!loadingTimeEntries && timeEntries.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Time */}
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-600">Total Time</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                              {formatDuration(calculateTotalDuration(timeEntries))}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Entries */}
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-600">Total Entries</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">
                              {timeEntries.length}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Activity className="h-6 w-6 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Billable */}
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-600">Total Billable</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                              ${calculateTotalBillable(timeEntries).toFixed(2)}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Average Duration */}
                    <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-amber-600">Avg per Entry</p>
                            <p className="text-2xl font-bold text-amber-900 mt-1">
                              {formatDuration(Math.round(calculateTotalDuration(timeEntries) / timeEntries.length))}
                            </p>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Target className="h-6 w-6 text-amber-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Time Entries Table */}
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Note</TableHead>
                            <TableHead>Rate</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                    {timeEntries.map((entry) => {
                      const startDate = new Date(entry.start_time)
                      const isToday = startDate.toDateString() === new Date().toDateString()
                      const isYesterday = startDate.toDateString() === new Date(Date.now() - 86400000).toDateString()
                      
                      return (
                              <TableRow key={entry.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-blue-600" />
                                    <span>
                                    {isToday ? 'Today' : isYesterday ? 'Yesterday' : startDate.toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric',
                                      year: startDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                                    })}
                                  </span>
                                </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <span>{startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <span>→</span>
                                  <span>
                                    {entry.end_time 
                                      ? new Date(entry.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                      : 'Running...'}
                                  </span>
                                </div>
                                </TableCell>
                                <TableCell>
                              <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                                {entry.duration_seconds ? formatDuration(entry.duration_seconds) : '-'}
                              </Badge>
                                </TableCell>
                                <TableCell>
                                  {entry.note ? (
                                    <p className="text-sm text-gray-600 max-w-xs truncate" title={entry.note}>
                                {entry.note}
                              </p>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {entry.hourly_rate ? (
                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                    <DollarSign className="h-3 w-3" />
                                      <span>${entry.hourly_rate}/hr</span>
                              </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  {entry.billable_amount ? (
                                <div className="text-sm font-semibold text-green-600">
                                  ${entry.billable_amount.toFixed(2)}
                                </div>
                                  ) : (
                                    <span className="text-sm text-gray-400">—</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>


          {/* Task Drawer */}
          <Sheet open={isTaskDrawerOpen} onOpenChange={setIsTaskDrawerOpen}>
            <SheetContent className="sm:max-w-md">
              <SheetHeader>
                <SheetTitle>{selectedTask ? 'Edit Task' : 'New Task'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Title</Label>
                  <Input id="task-title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-desc">Description</Label>
                  <Textarea id="task-desc" rows={4} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="review">Needs Review</SelectItem>
                        <SelectItem value="done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due date</Label>
                    <Input type="date" value={taskForm.due_date ? new Date(taskForm.due_date).toISOString().slice(0,10) : ""} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Input placeholder="Assign user ID"
                      value={taskForm.assignee_id || ""}
                      onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Milestone</Label>
                    <Select value={taskForm.milestone_id || "none"} onValueChange={(v) => setTaskForm({ ...taskForm, milestone_id: v === 'none' ? null : v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select milestone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {milestones.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Subtasks</Label>
                  <Input placeholder="Add a subtask (coming soon)" />
                </div>
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <Button variant="outline" className="w-full">Upload file</Button>
                </div>
              </div>
              <SheetFooter className="mt-6">
                <Button variant="outline" onClick={() => setIsTaskDrawerOpen(false)}>Cancel</Button>
                <Button onClick={saveTaskEdits} className="bg-[#4647E0] hover:bg-[#3637C0]">Save</Button>
                {selectedTask && (
                  <Button variant="destructive" onClick={() => selectedTask && deleteTask(selectedTask.id).then(() => { setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id)); setIsTaskDrawerOpen(false) })}>Delete</Button>
                )}
              </SheetFooter>
            </SheetContent>
          </Sheet>
          <TabsContent value="tasks" className="space-y-6 transition-all duration-200" data-help="tasks-tab-content">
            {/* Header */}
            <div className="flex items-center justify-between" data-help="tasks-header">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tasks for {project?.name}</h2>
                <p className="text-gray-600 mt-1">Track everything you need to deliver this project — all in one view.</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    setNewMilestone({
                      title: "",
                      description: "",
                      due_date: "",
                      client_note: "",
                    })
                    setIsAddMilestoneOpen(true)
                  }}
                  variant="outline"
                  className="border-[#4647E0] text-[#4647E0] hover:bg-[#4647E0]/10"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
                <Button
                  onClick={() => {
                    setSelectedTask(null)
                    setTaskForm({
                      title: "",
                      description: "",
                      status: "todo",
                      assignee_id: "",
                      start_date: "",
                      due_date: "",
                      milestone_id: ""
                    })
                    setIsTaskDrawerOpen(true)
                  }}
                  className="bg-[#4647E0] hover:bg-[#3637C0]"
                  data-help="btn-add-task"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </div>
            </div>

            {/* View Toggle & Filters */}
            <div className="flex items-center justify-between gap-4">
              {/* View Toggle */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setTasksView('milestones')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    tasksView === 'milestones'
                      ? 'bg-[#4647E0] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Milestones
                </button>
                <button
                  onClick={() => setTasksView('list')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    tasksView === 'list'
                      ? 'bg-[#4647E0] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setTasksView('board')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    tasksView === 'board'
                      ? 'bg-[#4647E0] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Board
                </button>
                <button
                  onClick={() => setTasksView('timeline')}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    tasksView === 'timeline'
                      ? 'bg-[#4647E0] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Timeline
                </button>
              </div>

              {/* Filter Bar & Stats */}
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="font-medium">{taskStats.total} tasks</span>
                  {taskStats.dueSoon > 0 && <span className="text-yellow-600"> · {taskStats.dueSoon} due soon</span>}
                  {taskStats.overdue > 0 && <span className="text-red-600"> · {taskStats.overdue} overdue</span>}
                </div>
                <Input
                  placeholder="Search tasks…"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-48"
                />
                <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={taskMilestoneFilter} onValueChange={setTaskMilestoneFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Milestones</SelectItem>
                    {milestones.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Milestones View - Accordion Style */}
            {tasksView === 'milestones' && (
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-200">
                    <CardContent className="p-12 text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-900 font-medium mb-2">No milestones yet</p>
                      <p className="text-gray-500 text-sm mb-4">Create your first milestone to organize tasks</p>
                      <Button
                        onClick={() => setIsAddMilestoneOpen(true)}
                        className="bg-[#4647E0] hover:bg-[#3637C0]"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Milestone
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  milestones.map((milestone) => {
                    const isExpanded = expandedMilestonesInView.has(milestone.id)
                    const milestoneTasks = tasks.filter(t => t.milestone_id === milestone.id)
                    const completedTasks = milestoneTasks.filter(t => getTaskStatus(t) === 'done').length
                    const progressPercent = milestoneTasks.length > 0 ? Math.round((completedTasks / milestoneTasks.length) * 100) : 0
                    
                    return (
                      <Card key={milestone.id} className="border border-gray-200 overflow-hidden">
                        <div 
                          className="bg-gray-50 border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            const newExpanded = new Set(expandedMilestonesInView)
                            if (isExpanded) {
                              newExpanded.delete(milestone.id)
                            } else {
                              newExpanded.add(milestone.id)
                            }
                            setExpandedMilestonesInView(newExpanded)
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                              </div>
                              <Target className={`h-5 w-5 ${milestone.status === 'completed' ? 'text-green-600' : 'text-[#4647E0]'}`} />
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-semibold text-gray-900">{milestone.title}</h3>
                                  <Badge variant={
                                    milestone.status === 'completed' ? 'default' :
                                    milestone.status === 'in-progress' ? 'secondary' :
                                    'outline'
                                  } className={
                                    milestone.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    milestone.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }>
                                    {milestone.status === 'completed' ? 'Completed' :
                                     milestone.status === 'in-progress' ? 'In Progress' :
                                     milestone.status === 'cancelled' ? 'Cancelled' :
                                     'Pending'}
                                  </Badge>
                                </div>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2 w-32">
                                      <div 
                                        className={`h-2 rounded-full transition-all ${
                                          progressPercent === 100 ? 'bg-green-600' : 'bg-[#4647E0]'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-gray-600 font-medium">{progressPercent}%</span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {completedTasks}/{milestoneTasks.length} tasks
                                  </span>
                                  {milestone.due_date && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <CalendarDays className="h-3 w-3" />
                                      {new Date(milestone.due_date).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingMilestone(milestone)
                                setIsEditMilestoneOpen(true)
                              }}
                              className="opacity-0 group-hover:opacity-100"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <CardContent className="p-4 space-y-2">
                            {milestoneTasks.length === 0 ? (
                              <div className="text-center py-8 text-gray-500 text-sm">
                                <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No tasks in this milestone yet</p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-3"
                                  onClick={() => {
                                    setTaskForm({
                                      title: "",
                                      description: "",
                                      status: "todo",
                                      assignee_id: "",
                                      start_date: "",
                                      due_date: "",
                                      milestone_id: milestone.id
                                    })
                                    setIsTaskDrawerOpen(true)
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Task
                                </Button>
                              </div>
                            ) : (
                              milestoneTasks.map((task) => {
                                const isDone = getTaskStatus(task) === 'done'
                                const due = task.due_date ? new Date(task.due_date) : null
                                const overdue = !!(due && !isDone && due < new Date())
                                const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 2)
                                
                                return (
                                  <div 
                                    key={task.id}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-100 group"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isDone}
                                      onChange={() => handleTaskStatusChange(task.id, isDone ? 'todo' : 'done')}
                                      className="w-4 h-4 rounded border-gray-300 text-[#4647E0] focus:ring-[#4647E0] cursor-pointer"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-sm font-medium ${isDone ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                          {task.title}
                                        </span>
                                        {overdue && !isDone && (
                                          <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                        )}
                                        {dueSoon && !isDone && (
                                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">Due Soon</Badge>
                                        )}
                                      </div>
                                      {task.description && (
                                        <p className="text-xs text-gray-500 mt-1">{task.description}</p>
                                      )}
                                      {due && (
                                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                                          <CalendarDays className="h-3 w-3" />
                                          {due.toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openTaskDrawer(task)}
                                      className="opacity-0 group-hover:opacity-100 h-7"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )
                              })
                            )}
                          </CardContent>
                        )}
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            {/* List View - Simple Checklist */}
            {tasksView === 'list' && (
              <div className="space-y-2">
                {filteredTasks.length === 0 ? (
                  <Card className="border-2 border-dashed border-gray-200">
                    <CardContent className="p-12 text-center">
                      <CheckSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-900 font-medium mb-2">No tasks yet. Let's get started!</p>
                      <p className="text-gray-500 text-sm">Add your first task above or let Jolix generate a plan for you.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredTasks.map((task) => {
                    const isExpanded = expandedTasks.has(task.id)
                    const isDone = getTaskStatus(task) === 'done'
                    const due = task.due_date ? new Date(task.due_date) : null
                    const overdue = !!(due && !isDone && due < new Date())
                    const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 2)
                    return (
                      <Card
                        key={task.id}
                        className="border border-gray-200 hover:shadow-md hover:border-[#4647E0]/30 transition-all duration-200 ease-in-out cursor-pointer"
                        onClick={() => openTaskDrawer(task)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={getTaskStatus(task) === 'done'}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleTaskStatusChange(task.id, getTaskStatus(task) === 'done' ? 'todo' : 'done')
                              }}
                              className="w-5 h-5 rounded border-gray-300 text-[#4647E0] focus:ring-[#4647E0] cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`font-medium text-gray-900 ${getTaskStatus(task) === 'done' ? 'line-through text-gray-500' : ''}`}>
                                  {task.title}
                                </span>
                                {due && (
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      overdue
                                        ? 'bg-red-50 text-red-700 border-red-200'
                                        : dueSoon
                                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : 'bg-gray-50 text-gray-600 border-gray-200'
                                    }`}
                                  >
                                    <CalendarDays className="h-3 w-3 mr-1" />
                                    {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </Badge>
                                )}
                                {task.milestone_id && (
                                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                    {milestones.find(m => m.id === task.milestone_id)?.title}
                                  </Badge>
                                )}
                              </div>
                              {isExpanded && task.description && (
                                <p className="text-sm text-gray-600 mt-2">{task.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {task.assignee && (
                                <Avatar className="h-7 w-7">
                                  <AvatarFallback className="bg-[#4647E0]/10 text-[#4647E0] text-xs">
                                    {task.assignee?.first_name?.[0]}{task.assignee?.last_name?.[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleTaskExpand(task.id)
                                }}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openTaskDrawer(task)
                                }}
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    openTaskDrawer(task)
                                  }}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Suggest next step
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Comment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600" onClick={() => { deleteTask(task.id); setTasks(prev => prev.filter(t => t.id !== task.id)) }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })
                )}
              </div>
            )}

            {/* Board View - 3 Columns */}
            {tasksView === 'board' && (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {[
                  { key: 'todo', label: 'To Do', color: 'gray' },
                  { key: 'in-progress', label: 'Doing', color: 'blue' },
                  { key: 'done', label: 'Done', color: 'green' },
                ].map((col) => {
                  const colTasks = filteredTasks.filter((t) => getTaskStatus(t) === col.key)
                  return (
                    <div key={col.key} className="flex-shrink-0 w-80" onDragOver={onBoardDragOver} onDrop={(e) => onBoardDrop(e, col.key as any)}>
                      <Card className="bg-gray-50/50 border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                {col.label}
                                <span className="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full">{colTasks.length}</span>
                              </h4>
                            </div>
                          </div>

                          <div className="space-y-3 mb-3 min-h-[100px]">
                            {colTasks.map((task) => {
                              const isDone = getTaskStatus(task) === 'done'
                              const due = task.due_date ? new Date(task.due_date) : null
                              const overdue = !!(due && !isDone && due < new Date())
                              const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 2)
                              return (
                                <Card
                                  key={task.id}
                                  className="bg-white hover:shadow-lg transition-all duration-200 ease-in-out cursor-move border border-gray-200 hover:border-[#4647E0]/50"
                                  draggable
                                  onDragStart={(e) => onBoardDragStart(e, task.id)}
                                  onClick={() => openTaskDrawer(task)}
                                >
                                  <CardContent className="p-3">
                                    <h5 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">{task.title}</h5>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        {due && (
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${
                                              overdue
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : dueSoon
                                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                  : 'bg-gray-50 text-gray-600 border-gray-200'
                                            }`}
                                          >
                                            {due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                          </Badge>
                                        )}
                                      </div>
                                      <Avatar className="h-6 w-6">
                                        <AvatarFallback className="bg-[#4647E0]/10 text-[#4647E0] text-xs">
                                          {task.assignee?.first_name?.[0] || 'U'}{task.assignee?.last_name?.[0] || ''}
                                        </AvatarFallback>
                                      </Avatar>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-white"
                            size="sm"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add task
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Timeline View */}
            {tasksView === 'timeline' && (() => {
              const days = getDaysForView()
              const todayIndex = getTodayIndex()
              const tasksWithDates = filteredTasks.filter(t => t.due_date || t.start_date)
              const tasksWithoutDates = filteredTasks.filter(t => !t.due_date && !t.start_date)
              
              // Get range label for timeline
              const getWeekLabel = () => {
                if (days.length === 0) return ''
                const firstDay = days[0]
                const lastDay = days[days.length - 1]
                if (timelineViewMode === 'week') {
                  return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }
                if (timelineViewMode === 'month') {
                  return firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                }
                return `${firstDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${lastDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
              }
              
              // Check if day is weekend
              const isWeekend = (day: Date) => {
                const dayOfWeek = day.getDay()
                return dayOfWeek === 0 || dayOfWeek === 6
              }
              
              // Get task bar color and style based on status
              const getTaskBarStyle = (task: any) => {
                const isDone = getTaskStatus(task) === 'done'
                if (isDone) return 'bg-gray-300 opacity-60'
                
                const due = task.due_date ? new Date(task.due_date) : null
                const overdue = !!(due && !isDone && due < new Date())
                const dueSoon = !!(due && !isDone && !overdue && (due.getTime() - Date.now()) / (1000*60*60*24) <= 3)
                
                if (overdue) return 'bg-[#4647E0] border-2 border-red-500'
                if (dueSoon) return 'bg-yellow-400 border border-yellow-600'
                return 'bg-[#4647E0]'
              }
              
              return (
                <div className="space-y-4 transition-all duration-300 ease-in-out">
                  <Card>
                    <CardContent className="p-6">
                      {/* Header Controls */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Button
                            variant={timelineViewMode === 'week' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTimelineViewMode('week')}
                            className={`transition-all duration-200 ${timelineViewMode === 'week' ? 'bg-[#4647E0] hover:bg-[#3637C0]' : ''}`}
                          >
                            This Week
                          </Button>
                          <Button
                            variant={timelineViewMode === 'month' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTimelineViewMode('month')}
                            className={`transition-all duration-200 ${timelineViewMode === 'month' ? 'bg-[#4647E0] hover:bg-[#3637C0]' : ''}`}
                          >
                            This Month
                          </Button>
                          <Button
                            variant={timelineViewMode === 'full' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setTimelineViewMode('full')}
                            className={`transition-all duration-200 ${timelineViewMode === 'full' ? 'bg-[#4647E0] hover:bg-[#3637C0]' : ''}`}
                          >
                            Full Project
                          </Button>
                          <span className="text-xs text-gray-500 ml-2">{getWeekLabel()}</span>
            </div>
                      </div>

                      {/* Horizontal Timeline Grid */}
                      {tasksWithDates.length > 0 && (
                        <div className="space-y-6">
                          {/* Date Header Row */}
                          <div className="relative">
                            <div className="flex border-b-2 border-gray-300">
                              {days.map((day, idx) => {
                                const isToday = idx === todayIndex
                                const isWeekendDay = isWeekend(day)
                                return (
                                  <div
                                    key={idx}
                                    className={`flex-1 min-w-[60px] text-center py-2 border-r border-gray-200 ${
                                      isWeekendDay ? 'bg-gray-50/50' : 'bg-white'
                                    } ${isToday ? 'bg-red-50/80' : ''}`}
                                  >
                                    <div className={`text-[10px] uppercase tracking-wide ${isToday ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                    </div>
                                    <div className={`text-xs font-medium mt-0.5 ${isToday ? 'text-red-600' : 'text-gray-900'}`}>
                                      {day.getDate()}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          {/* Milestone Rows with Task Bars */}
                          {milestones.map((milestone, milestoneIdx) => {
                            const milestoneTasks = tasksWithDates.filter(t => t.milestone_id === milestone.id)
                            if (milestoneTasks.length === 0) return null
                            
                            return (
                              <div key={milestone.id} className={`${milestoneIdx % 2 === 0 ? 'bg-white' : 'bg-purple-50/20'} rounded-lg overflow-hidden`}>
                                {/* Milestone Section */}
                                <div className="flex">
                                  {/* Milestone Label (Left Column) */}
                                  <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 bg-white">
                                    <h4 className="font-semibold text-sm text-gray-900">{milestone.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{milestoneTasks.length} {milestoneTasks.length === 1 ? 'task' : 'tasks'}</p>
                                  </div>
                                  
                                  {/* Timeline Grid for this Milestone */}
                                  <div className="flex-1 relative min-h-[120px]">
                                    {/* Vertical Grid Lines */}
                                    <div className="absolute inset-0 flex pointer-events-none">
                                      {days.map((day, idx) => {
                                        const isWeekendDay = isWeekend(day)
                                        return (
                                          <div
                                            key={idx}
                                            className={`flex-1 min-w-[60px] border-r border-gray-200 ${
                                              isWeekendDay ? 'bg-gray-50/30' : ''
                                            }`}
                                          />
                                        )
                                      })}
                                    </div>
                                    
                                    {/* Today Line */}
                                    {todayIndex >= 0 && todayIndex < days.length && (
                                      <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                        style={{
                                          left: `${((todayIndex + 0.5) / days.length) * 100}%`
                                        }}
                                      />
                                    )}
                                    
                                    {/* Task Bars */}
                                    <div className="relative p-4 space-y-2">
                                      {milestoneTasks.map((task, taskIdx) => {
                                        const pos = getTaskBarPosition(task)
                                        if (!pos) return null
                                        
                                        const barStyle = getTaskBarStyle(task)
                                        const isDone = getTaskStatus(task) === 'done'
                                        
                                        return (
                                          <TooltipProvider key={task.id}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div
                                                  className={`absolute h-8 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${barStyle} z-10`}
                                                  style={{
                                                    left: `${pos.left}%`,
                                                    width: `${pos.width}%`,
                                                    top: `${16 + taskIdx * 36}px`
                                                  }}
                                                  onClick={() => openTaskDrawer(task)}
                                                >
                                                  <div className="h-full flex items-center px-2">
                                                    <span className={`text-xs font-medium truncate ${isDone ? 'text-gray-600' : 'text-white'}`}>
                                                      {task.title}
                                                    </span>
                                                  </div>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-xs">
                                                <div className="space-y-1">
                                                  <div className="font-semibold">{task.title}</div>
                                                  <div className="text-xs text-gray-400">
                                                    <div>Milestone: {milestone.title}</div>
                                                    {task.start_date && task.due_date && (
                                                      <div>
                                                        {new Date(task.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                      </div>
                                                    )}
                                                    {task.due_date && !task.start_date && (
                                                      <div>Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                    )}
                                                  </div>
                                                </div>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}

                          {/* Unassigned Tasks */}
                          {tasksWithDates.filter(t => !t.milestone_id).length > 0 && (
                            <div className="bg-gray-50/30 rounded-lg overflow-hidden">
                              <div className="flex">
                                {/* Unassigned Label (Left Column) */}
                                <div className="w-48 flex-shrink-0 p-4 border-r border-gray-200 bg-white">
                                  <h4 className="font-semibold text-sm text-gray-700">Unassigned</h4>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {tasksWithDates.filter(t => !t.milestone_id).length} {tasksWithDates.filter(t => !t.milestone_id).length === 1 ? 'task' : 'tasks'}
                                  </p>
                                </div>
                                
                                {/* Timeline Grid for Unassigned */}
                                <div className="flex-1 relative min-h-[120px]">
                                  {/* Vertical Grid Lines */}
                                  <div className="absolute inset-0 flex pointer-events-none">
                                    {days.map((day, idx) => {
                                      const isWeekendDay = isWeekend(day)
                                      return (
                                        <div
                                          key={idx}
                                          className={`flex-1 min-w-[60px] border-r border-gray-200 ${
                                            isWeekendDay ? 'bg-gray-50/30' : ''
                                          }`}
                                        />
                                      )
                                    })}
                                  </div>
                                  
                                  {/* Today Line */}
                                  {todayIndex >= 0 && todayIndex < days.length && (
                                    <div
                                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                                      style={{
                                        left: `${((todayIndex + 0.5) / days.length) * 100}%`
                                      }}
                                    />
                                  )}
                                  
                                  {/* Task Bars */}
                                  <div className="relative p-4 space-y-2">
                                    {tasksWithDates.filter(t => !t.milestone_id).map((task, taskIdx) => {
                                      const pos = getTaskBarPosition(task)
                                      if (!pos) return null
                                      
                                      const barStyle = getTaskBarStyle(task)
                                      const isDone = getTaskStatus(task) === 'done'
                                      
                                      return (
                                        <TooltipProvider key={task.id}>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <div
                                                className={`absolute h-8 rounded-md shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 ${barStyle} z-10`}
                                                style={{
                                                  left: `${pos.left}%`,
                                                  width: `${pos.width}%`,
                                                  top: `${16 + taskIdx * 36}px`
                                                }}
                                                onClick={() => openTaskDrawer(task)}
                                              >
                                                <div className="h-full flex items-center px-2">
                                                  <span className={`text-xs font-medium truncate ${isDone ? 'text-gray-600' : 'text-white'}`}>
                                                    {task.title}
                                                  </span>
                                                </div>
                                              </div>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs">
                                              <div className="space-y-1">
                                                <div className="font-semibold">{task.title}</div>
                                                <div className="text-xs text-gray-400">
                                                  <div>No milestone assigned</div>
                                                  {task.start_date && task.due_date && (
                                                    <div>
                                                      {new Date(task.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                    </div>
                                                  )}
                                                  {task.due_date && !task.start_date && (
                                                    <div>Due: {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                                  )}
                                                </div>
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      )
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Empty State */}
                      {tasksWithDates.length === 0 && (
                        <div className="text-center py-12">
                          <CalendarDays className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-gray-900 font-medium mb-2">No tasks with dates yet</p>
                          <p className="text-gray-500 text-sm mb-4">Add dates to visualize your project timeline.</p>
                          <Button
                            variant="outline"
                            onClick={() => setIsAddTaskOpen(true)}
                            className="border-[#4647E0] text-[#4647E0] hover:bg-[#4647E0]/10"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Dates to Tasks
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )
            })()}

            {/* Add Milestone Drawer */}
            <Sheet open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Add Milestone</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="milestone-title">Title *</Label>
                    <Input 
                      id="milestone-title" 
                      placeholder="e.g., Initial Design Phase"
                      value={newMilestone.title} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone-desc">Description</Label>
                    <Textarea 
                      id="milestone-desc" 
                      rows={4}
                      placeholder="Describe what this milestone includes..."
                      value={newMilestone.description} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone-due">Due Date</Label>
                    <Input 
                      id="milestone-due" 
                      type="date"
                      value={newMilestone.due_date} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="milestone-client-note">Client Note</Label>
                    <Textarea 
                      id="milestone-client-note" 
                      rows={3}
                      placeholder="Note visible to the client..."
                      value={newMilestone.client_note} 
                      onChange={(e) => setNewMilestone({ ...newMilestone, client_note: e.target.value })} 
                    />
                    <p className="text-xs text-gray-500">This note will be visible to the client in their portal</p>
                  </div>
                </div>
                <SheetFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleAddMilestone} 
                    className="bg-[#4647E0] hover:bg-[#3637C0]"
                    disabled={!newMilestone.title.trim()}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            {/* Task Drawer */}
            <Sheet open={isTaskDrawerOpen} onOpenChange={setIsTaskDrawerOpen}>
              <SheetContent className="sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>{selectedTask ? 'Edit Task' : 'New Task'}</SheetTitle>
                </SheetHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Title</Label>
                    <Input id="task-title" value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-desc">Description</Label>
                    <Textarea id="task-desc" rows={4} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={taskForm.status} onValueChange={(v) => setTaskForm({ ...taskForm, status: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="todo">To Do</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="review">Needs Review</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Start date</Label>
                      <Input type="date" value={taskForm.start_date ? new Date(taskForm.start_date).toISOString().slice(0,10) : ''} onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Due date</Label>
                      <Input type="date" value={taskForm.due_date ? new Date(taskForm.due_date).toISOString().slice(0,10) : ''} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Assignee</Label>
                      <Input placeholder="Assign user ID"
                        value={taskForm.assignee_id || ''}
                        onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Milestone</Label>
                      <Select value={taskForm.milestone_id || 'none'} onValueChange={(v) => setTaskForm({ ...taskForm, milestone_id: v === 'none' ? null : v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select milestone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {milestones.map((m) => (
                            <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Subtasks</Label>
                    <Input placeholder="Add a subtask (coming soon)" />
                  </div>
                  <div className="space-y-2">
                    <Label>Attachments</Label>
                    <Button variant="outline" className="w-full">Upload file</Button>
                  </div>
                </div>
                <SheetFooter className="mt-6">
                  <Button variant="outline" onClick={() => setIsTaskDrawerOpen(false)}>Cancel</Button>
                  <Button onClick={saveTaskEdits} className="bg-[#4647E0] hover:bg-[#3637C0]">Save</Button>
                  <Button variant="destructive" onClick={() => selectedTask && deleteTask(selectedTask.id).then(() => { setTasks((prev) => prev.filter((t) => t.id !== selectedTask.id)); setIsTaskDrawerOpen(false) })}>Delete</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </TabsContent>


          <TabsContent value="activity" className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Project Activity</h2>
            <p className="text-gray-600 mt-1">Track all activities and changes for this project. Refreshes automatically when new activities occur.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadProjectActivities}
            disabled={loadingActivities}
          >
            {loadingActivities ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
        </div>

            {loadingActivities ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Loading activities...</p>
                </CardContent>
              </Card>
            ) : projectActivities.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-gray-500">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">No activities yet</h3>
                    <p className="mb-4">Project activities will appear here as they happen</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {projectActivities.map((activity, index) => (
                  <Card key={activity.id} className="bg-white border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-lg ${getActivityColor(activity.activity_type, activity.source_table)}`}>
                          {getActivityIcon(activity.activity_type, activity.source_table)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatActivityTime(activity.created_at)}
                            </p>
                          </div>
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.source_table.replace('_activities', '').replace('_', ' ')}
                            </Badge>
                        {activity.user_name && activity.user_name !== 'System' && (
                          <span className="text-xs text-gray-500">
                            by {activity.user_name}
                          </span>
                        )}
                        {(!activity.user_name || activity.user_name === 'System') && (
                          <span className="text-xs text-gray-400">
                            by System
                          </span>
                        )}
                          </div>
                          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              {activity.metadata.description && (
                                <p>{activity.metadata.description}</p>
                              )}
                              {activity.metadata.file_name && (
                                <p>File: {activity.metadata.file_name}</p>
                              )}
                              {activity.metadata.contract_name && (
                                <p>Contract: {activity.metadata.contract_name}</p>
                              )}
                              {activity.metadata.invoice_number && (
                                <p>Invoice: {activity.metadata.invoice_number}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

      {/* File Viewer Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-7xl h-[95vh] max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <span>{selectedFileForView?.name}</span>
              {selectedFileForView && (
                <Badge variant="outline" className="text-xs">
                  {selectedFileForView.file_type.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {selectedFileForView && (
              <div className="w-full h-full">
                {/* Image files */}
                {['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <img
                      src={fileViewUrl}
                      alt={selectedFileForView.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                      onError={() => { toast.error('Unable to load image preview') }}
                    />
                  </div>
                )}

                {/* PDF files */}
                {selectedFileForView.file_type.toUpperCase() === 'PDF' && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <iframe
                      src={`${fileViewUrl}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                      title={`PDF Viewer - ${selectedFileForView.name}`}
                      className="w-full h-full border-0 rounded-lg shadow-lg"
                      style={{ minHeight: 'calc(100vh - 200px)' }}
                      onError={() => { toast.error('Unable to load PDF preview') }}
                    />
                  </div>
                )}

                {/* Video files */}
                {['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <video
                      controls
                      className="max-w-full max-h-full rounded-lg shadow-lg"
                      style={{ maxHeight: 'calc(100vh - 200px)' }}
                    >
                      <source src={fileViewUrl} type={`video/${selectedFileForView.file_type.toLowerCase()}`} />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}

                {/* Audio files */}
                {['MP3', 'WAV', 'OGG', 'AAC', 'FLAC'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex items-center justify-center p-4">
                    <audio
                      controls
                      className="w-full max-w-md"
                    >
                      <source src={fileViewUrl} type={`audio/${selectedFileForView.file_type.toLowerCase()}`} />
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                )}

                {/* Text files */}
                {['TXT', 'MD', 'JSON', 'XML', 'CSV', 'LOG'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Text File Preview</h3>
                      <p className="text-gray-600 mb-4">Text files can be downloaded and viewed in your preferred text editor.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Document files */}
                {['DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Document Preview</h3>
                      <p className="text-gray-600 mb-4">Office documents can be downloaded and opened in their respective applications.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Code files */}
                {['JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'SASS', 'PY', 'JAVA', 'CPP', 'C', 'PHP', 'RB', 'GO', 'RS', 'SWIFT', 'KT'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Code File Preview</h3>
                      <p className="text-gray-600 mb-4">Code files can be downloaded and viewed in your preferred code editor.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Archive files */}
                {['ZIP', 'RAR', '7Z', 'TAR', 'GZ'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Archive File</h3>
                      <p className="text-gray-600 mb-4">Archive files can be downloaded and extracted using your preferred archiver.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Design files */}
                {['AI', 'PSD', 'FIG', 'SKETCH', 'XD'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">Design File</h3>
                      <p className="text-gray-600 mb-4">Design files can be downloaded and opened in their respective design applications.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}

                {/* Default for unsupported files */}
                {!['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP', 'PDF', 'MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MP3', 'WAV', 'OGG', 'AAC', 'FLAC', 'TXT', 'MD', 'JSON', 'XML', 'CSV', 'LOG', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'SASS', 'PY', 'JAVA', 'CPP', 'C', 'PHP', 'RB', 'GO', 'RS', 'SWIFT', 'KT', 'ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'AI', 'PSD', 'FIG', 'SKETCH', 'XD'].includes(selectedFileForView.file_type.toUpperCase()) && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4">
                    <div className="bg-gray-100 rounded-lg p-6 text-center max-w-md">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-medium mb-2">File Preview Unavailable</h3>
                      <p className="text-gray-600 mb-4">This file type cannot be previewed. You can download it to view on your device.</p>
                      <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                        <Download className="h-4 w-4 mr-2" />
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Modal */}
      <Dialog open={isCommentsModalOpen} onOpenChange={setIsCommentsModalOpen}>
        <DialogContent className="sm:max-w-2xl h-[80vh] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center space-x-2">
              <span>Comments - {selectedFileForComments?.name}</span>
              {selectedFileForComments && (
                <Badge variant="outline" className="text-xs">
                  {selectedFileForComments.file_type.toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
            {loadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading comments...</span>
              </div>
            ) : fileComments.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No comments yet</h3>
                <p className="text-gray-600">Be the first to add a comment on this file.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {fileComments.map((comment) => (
                  <div key={comment.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <div className="flex items-start space-x-3">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-sm font-medium">
                          {comment.author_name ? comment.author_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {comment.author_name || 'Unknown User'}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {formatCommentTimeAgo(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                          {comment.content}
                        </p>
                        {comment.is_internal && (
                          <Badge variant="outline" className="mt-2 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            Internal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4 flex-shrink-0">
            <div className="space-y-3">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[80px] max-h-[120px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="internal-comment"
                    checked={isInternalComment}
                    onChange={(e) => setIsInternalComment(e.target.checked)}
                    className="rounded border-gray-300 text-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                  <Label htmlFor="internal-comment" className="text-sm text-gray-600">
                    Internal comment (not visible to client)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    onClick={closeCommentsModal}
                    disabled={addingComment}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addingComment}
                    className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                  >
                    {addingComment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Adding...
                      </>
                    ) : (
                      'Add Comment'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form Preview Modal */}
      <FormPreviewModal
        open={showFormPreview}
        onOpenChange={setShowFormPreview}
        form={previewForm}
        account={account}
      />

      {/* Status Change Modal */}
      <Dialog open={statusChangeModalOpen} onOpenChange={setStatusChangeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
          </DialogHeader>
          {changingStatusInvoice && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Current Status: <Badge className={getInvoiceStatusColor(changingStatusInvoice.status)}>
                    {getInvoiceStatusLabel(changingStatusInvoice.status)}
                  </Badge>
                </p>
                <p className="text-sm text-gray-600">
                  Invoice: {changingStatusInvoice.invoice_number}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select value={changingStatus || ""} onValueChange={setChangingStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusChangeModalOpen(false)
                    setChangingStatusInvoice(null)
                    setChangingStatus(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangeStatus}
                  disabled={!changingStatus || changingStatus === changingStatusInvoice.status}
                  className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                >
                  {changingStatus ? "Update Status" : "Select Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        invoice={previewInvoice}
        account={account}
        projects={[]}
      />

      {/* Form Template Selection Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-[#3C3CFF]/5 to-[#5252FF]/5">
          <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Choose from your saved templates</DialogTitle>
              <p className="text-gray-600 mt-2 text-sm">
                Select a template to quickly create a new form for this project
            </p>
          </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-[#3C3CFF] mx-auto mb-4" />
                  <p className="text-gray-600">Loading your templates...</p>
                </div>
              </div>
            ) : formTemplates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#3C3CFF]/10 to-[#5252FF]/10 flex items-center justify-center">
                  <Clipboard className="h-10 w-10 text-[#3C3CFF]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No saved templates yet</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Create and save forms to use them as templates for future projects.
                </p>
                <Button 
                  onClick={() => {
                    setShowTemplateModal(false)
                    if (project?.client_id && projectId) {
                      router.push(`/dashboard/forms/builder?client_id=${project.client_id}&project_id=${projectId}&return_to=project&project_url=${encodeURIComponent(`/dashboard/projects/${projectId}`)}`)
                    } else {
                      router.push('/dashboard/forms/builder')
                    }
                  }}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Form
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formTemplates.map((template) => (
                  <Card 
                    key={template.id}
                    className="border border-gray-200 hover:border-[#3C3CFF] hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden"
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent className="p-0">
                      {/* Header with icon */}
                      <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-[#3C3CFF]/5 to-[#5252FF]/5">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors mb-1 truncate">
                            {template.name}
                          </h3>
                          {template.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                          <div className="ml-3 h-10 w-10 rounded-lg bg-gradient-to-br from-[#3C3CFF] to-[#5252FF] flex items-center justify-center flex-shrink-0 shadow-sm">
                            <Clipboard className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-5 py-4 space-y-4">
                      {/* Template Stats */}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <div className="flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                          <span>{template.template_data?.fields?.length || 0} fields</span>
                        </div>
                        {template.created_at && (
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                            <span>
                              {new Date(template.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                  day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Field Preview */}
                      {template.template_data?.fields && template.template_data.fields.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Includes</p>
                            <div className="flex flex-wrap gap-1.5">
                              {template.template_data.fields.slice(0, 4).map((field: any, idx: number) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                  className="text-[10px] px-2 py-0.5 bg-[#F0F2FF] text-[#3C3CFF] border-[#3C3CFF]/30 font-medium"
                              >
                                {field.label || field.type}
                              </Badge>
                            ))}
                              {template.template_data.fields.length > 4 && (
                                <Badge variant="outline" className="text-[10px] px-2 py-0.5 text-gray-600 border-gray-300">
                                  +{template.template_data.fields.length - 4}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Use Button */}
                        <Button 
                          className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white shadow-sm hover:shadow-md transition-all duration-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectTemplate(template)
                          }}
                        >
                          Use Template
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Signature Modal */}
      <ContractSignatureModal
        open={isSignatureModalOpen}
        onOpenChange={setIsSignatureModalOpen}
        contract={contractToSign}
        brandColor="#3C3CFF"
        isClient={false}
        onSign={async (signatureName: string, signatureDate: string) => {
          if (!contractToSign) return

          // Update contract content with signature
          const content = contractToSign.contract_content || {}
          const terms = content.terms || {}
          const updatedContent = {
            ...content,
            terms: {
              ...terms,
              yourName: signatureName,
              yourSignatureDate: signatureDate
            }
          }

          // Don't pass status - let API calculate it based on actual signature statuses
          const response = await fetch('/api/contracts/sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contractId: contractToSign.id,
              signatureData: JSON.stringify({ name: signatureName, type: 'typed', date: signatureDate }),
              projectId: projectId,
              contractContent: updatedContent
            })
          })

          if (response.ok) {
            const result = await response.json()
            
            // Update the contract in local state
            setProjectContracts(prev => 
              prev.map(contract => {
                if (contract.id === contractToSign.id) {
                  return {
                    ...contract,
                    ...result.data
                  }
                }
                return contract
              })
            )
            
            // Refresh contracts to get latest data from database
            await loadProjectContracts()
            
            toast.success('Contract signed successfully!')
          } else {
            const error = await response.json()
            toast.error(error.error || 'Failed to sign contract')
            throw new Error(error.error || 'Failed to sign contract')
          }
        }}
      />
    </DashboardLayout>
  )
}