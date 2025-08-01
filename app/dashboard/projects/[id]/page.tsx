"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Copy,
  Crown,
  Loader2,
  ArrowLeft,
  Users,
  CreditCard,
  TrendingUp,
  Trash2,
  XCircle,
  X,
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

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  // State for project data
  const [project, setProject] = useState<Project | null>(null)
  const [client, setClient] = useState<{ id: string; first_name: string; last_name: string; company: string | null } | null>(null)
  const [tags, setTags] = useState<ProjectTag[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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

  // Load project data
  const loadProjectData = async () => {
    try {
      setLoading(true)
      const projectId = params.id as string

      const [projectData, milestonesData, tasksData, filesData] = await Promise.all([
        getProjectWithClient(projectId),
        getProjectMilestones(projectId),
        getProjectTasks(projectId),
        getFiles() // Get all files, we'll filter by project
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
        setTasks(tasksData)
      }

      // Filter files for this specific project
      if (filesData) {
        const projectFiles = filesData.filter(file => file.project_id === projectId)
        setProjectFiles(projectFiles)
      }

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
      toast.error('Failed to load project data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
  }, [projectId])

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
        await uploadFile(
          file,
          undefined, // No client
          project?.id, // Link to this project
          uploadForm.description || undefined,
          uploadForm.tags,
          fileTagColors
        )
      }

      toast.success(`${selectedFilesForUpload.length} file(s) uploaded successfully`)
      setIsUploadDialogOpen(false)
      setSelectedFilesForUpload([])
      setUploadForm({
        description: "",
        tags: [],
      })

      // Reload project data to get updated files
      await loadProjectData()
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
    switch (type.toLowerCase()) {
      case "pdf":
        return "📄"
      case "zip":
      case "rar":
      case "7z":
        return "📦"
      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "svg":
        return "🖼️"
      case "doc":
      case "docx":
        return "📝"
      case "ai":
      case "psd":
      case "fig":
        return "🎨"
      default:
        return "📄"
    }
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
          break
        case "reject":
          await rejectFile(file.id)
          toast.success('File rejected successfully')
          await loadProjectData()
          break
        case "pending":
          await updateFile(file.id, { approval_status: 'pending' })
          toast.success('File marked as pending')
          await loadProjectData()
          break
        case "delete":
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            await deleteFile(file.id)
            toast.success('File deleted successfully')
            await loadProjectData()
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

  const handleAddComment = async () => {
    if (!selectedFileForComments || !newComment.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      setAddingComment(true)
      const comment = await addFileComment(selectedFileForComments.id, newComment.trim(), isInternalComment)

      if (comment) {
        setFileComments(prev => [comment, ...prev])
        setNewComment("")
        setIsInternalComment(false)
        toast.success('Comment added successfully')
      }
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setAddingComment(false)
    }
  }

  const closeCommentsModal = () => {
    setIsCommentsModalOpen(false)
    setSelectedFileForComments(null)
    setFileComments([])
    setNewComment("")
    setIsInternalComment(false)
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                        {client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-gray-600">
                      {client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'}
                    </span>
                  </div>
                  <Badge variant="outline" className={getStatusColor(project.status)}>
                    {project.status.replace("-", " ")}
                  </Badge>
                  {tags.length > 0 && (
                    <div className="flex space-x-1">
                      {tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          }}
                        >
                          {tag.tag_name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Portal
              </Button>
              <Button onClick={handleEditProject}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
              <Button
                variant="outline"
                onClick={handleDeleteProject}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Main Content */}
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 mb-12 mt-4">
            <TabsTrigger value="timeline">📅 Timeline</TabsTrigger>
            <TabsTrigger value="messages">💬 Messages</TabsTrigger>
            <TabsTrigger value="files">📁 Files</TabsTrigger>
            <TabsTrigger value="forms">🧾 Forms</TabsTrigger>
            <TabsTrigger value="contracts">📄 Contracts</TabsTrigger>
            <TabsTrigger value="invoices">💸 Invoices</TabsTrigger>
            <TabsTrigger value="activity">📜 Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
                <p className="text-gray-600 mt-1">Track milestones and project progress</p>
              </div>
              <Dialog open={isAddMilestoneOpen} onOpenChange={setIsAddMilestoneOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Milestone
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Milestone</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="milestoneTitle">Milestone Title *</Label>
                      <Input
                        id="milestoneTitle"
                        value={newMilestone.title}
                        onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                        placeholder="Enter milestone title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="milestoneDueDate">Due Date</Label>
                      <Input
                        id="milestoneDueDate"
                        type="date"
                        value={newMilestone.due_date}
                        onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="milestoneDescription">Description</Label>
                      <Textarea
                        id="milestoneDescription"
                        value={newMilestone.description}
                        onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                        placeholder="Optional milestone description"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="milestoneClientNote">Note to Client</Label>
                      <Textarea
                        id="milestoneClientNote"
                        value={newMilestone.client_note}
                        onChange={(e) => setNewMilestone({ ...newMilestone, client_note: e.target.value })}
                        placeholder="Optional note that will be visible to the client"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsAddMilestoneOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddMilestone} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                        Add Milestone
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Edit Milestone Modal */}
            <Dialog open={isEditMilestoneOpen} onOpenChange={setIsEditMilestoneOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Edit Milestone</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="editMilestoneTitle">Milestone Title *</Label>
                    <Input
                      id="editMilestoneTitle"
                      value={newMilestone.title}
                      onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
                      placeholder="Enter milestone title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMilestoneDueDate">Due Date</Label>
                    <Input
                      id="editMilestoneDueDate"
                      type="date"
                      value={newMilestone.due_date}
                      onChange={(e) => setNewMilestone({ ...newMilestone, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMilestoneDescription">Description</Label>
                    <Textarea
                      id="editMilestoneDescription"
                      value={newMilestone.description}
                      onChange={(e) => setNewMilestone({ ...newMilestone, description: e.target.value })}
                      placeholder="Optional milestone description"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editMilestoneClientNote">Note to Client</Label>
                    <Textarea
                      id="editMilestoneClientNote"
                      value={newMilestone.client_note}
                      onChange={(e) => setNewMilestone({ ...newMilestone, client_note: e.target.value })}
                      placeholder="Optional note that will be visible to the client"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => {
                      setIsEditMilestoneOpen(false)
                      setEditingMilestone(null)
                      setNewMilestone({ title: "", description: "", due_date: "", client_note: "" })
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateMilestone} disabled={saving} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Update Milestone
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="space-y-4">
              {milestoneTasks.map((milestone, index) => {
                const progress = calculateStepProgress(milestone.tasks || [])
                const isExpanded = expandedMilestones.has(milestone.id)

                return (
                  <div key={milestone.id} className="relative">
                    {index < milestoneTasks.length - 1 && (
                      <div className="absolute left-6 top-16 w-0.5 h-20 bg-gray-200"></div>
                    )}
                    <Card className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 mt-1">{getMilestoneIcon(milestone.status)}</div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-1">{milestone.title}</h4>
                                {milestone.description && (
                                  <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                {milestone.status === "completed" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateMilestoneStatus(milestone.id, "pending")}
                                    className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                                    disabled={saving}
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Mark as Pending
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateMilestoneStatus(milestone.id, "completed")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                    disabled={saving}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Mark Complete
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditMilestone(milestone)}
                                  className="text-gray-600 hover:text-gray-800"
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteMilestone(milestone.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={saving}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>



                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                {milestone.due_date && (
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Due {formatDate(milestone.due_date)}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${milestone.status === "completed"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : milestone.status === "in-progress"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                    }`}
                                >
                                  {milestone.status.replace("-", " ")}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleMilestoneExpansion(milestone.id)}
                                  className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF]"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Hide Tasks
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      Show Tasks
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Expandable Kanban Section */}
                            {isExpanded && milestone.tasks && (
                              <div className="mt-6 pt-6 border-t border-gray-100 bg-[#F9FAFB] rounded-xl p-4 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-gray-900">Tasks</h5>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMilestoneId(milestone.id)
                                      setIsAddTaskOpen(true)
                                    }}
                                    className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Task
                                  </Button>
                                </div>

                                {/* Mini Kanban Board */}
                                <div
                                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                  onDragOver={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                  }}
                                >
                                  {/* To Do Column */}
                                  <div
                                    className="space-y-3 min-h-[200px] p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onDrop={async (e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const taskId = e.dataTransfer.getData('taskId')
                                      if (taskId) {
                                        try {
                                          await handleUpdateTaskStatus(taskId, "todo")
                                        } catch (error) {
                                          console.error("Error updating task status:", error)
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                      <h6 className="text-sm font-medium text-gray-700">To Do</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task: any) => task.status === "todo").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task: any) => task.status === "todo")
                                        .map((task: any) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200"
                                            draggable
                                            onDragStart={(e) => {
                                              e.stopPropagation()
                                              e.dataTransfer.setData('taskId', task.id)
                                              e.dataTransfer.effectAllowed = 'move'
                                            }}
                                            onDragEnd={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                            }}
                                          >
                                            <CardContent className="p-3">
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <h6 className="text-sm font-medium text-gray-900 leading-tight">
                                                    {task.title}
                                                  </h6>
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleUpdateTaskStatus(task.id, "in-progress")
                                                        }}
                                                      >
                                                        Start Task
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleUpdateTaskStatus(task.id, "done")
                                                        }}
                                                      >
                                                        Mark Complete
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                        <Edit className="h-3 w-3 mr-2" />
                                                        Edit Task
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
                                                {task.description && (
                                                  <p className="text-xs text-gray-600 leading-relaxed">
                                                    {task.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getTaskStatusColor(task.status)}`}
                                                  >
                                                    To Do
                                                  </Badge>
                                                  {task.assignee && (
                                                    <Avatar className="h-5 w-5">
                                                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                                        {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.due_date && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {formatDate(task.due_date)}</span>
                                                  </div>
                                                )}
                                                <div className="flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleDeleteTask(task.id)
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    disabled={saving}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      {milestone.tasks.filter((task: any) => task.status === "todo").length === 0 && (
                                        <div className="text-center py-6">
                                          <Target className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                          <p className="text-xs text-gray-500">No tasks yet</p>
                                          <p className="text-xs text-gray-400 mt-1">Add a task to get started</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* In Progress Column */}
                                  <div
                                    className="space-y-3 min-h-[200px] p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onDrop={async (e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const taskId = e.dataTransfer.getData('taskId')
                                      if (taskId) {
                                        try {
                                          await handleUpdateTaskStatus(taskId, "in-progress")
                                        } catch (error) {
                                          console.error("Error updating task status:", error)
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-[#3C3CFF]"></div>
                                      <h6 className="text-sm font-medium text-gray-700">In Progress</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task: any) => task.status === "in-progress").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task: any) => task.status === "in-progress")
                                        .map((task: any) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm cursor-move hover:shadow-md transition-all duration-200"
                                            draggable
                                            onDragStart={(e) => {
                                              e.stopPropagation()
                                              e.dataTransfer.setData('taskId', task.id)
                                              e.dataTransfer.effectAllowed = 'move'
                                            }}
                                            onDragEnd={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                            }}
                                          >
                                            <CardContent className="p-3">
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <h6 className="text-sm font-medium text-gray-900 leading-tight">
                                                    {task.title}
                                                  </h6>
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleUpdateTaskStatus(task.id, "todo")
                                                        }}
                                                      >
                                                        Move to To Do
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                        onClick={(e) => {
                                                          e.stopPropagation()
                                                          handleUpdateTaskStatus(task.id, "done")
                                                        }}
                                                      >
                                                        Mark Complete
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                                        <Edit className="h-3 w-3 mr-2" />
                                                        Edit Task
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
                                                {task.description && (
                                                  <p className="text-xs text-gray-600 leading-relaxed">
                                                    {task.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getTaskStatusColor(task.status)}`}
                                                  >
                                                    In Progress
                                                  </Badge>
                                                  {task.assignee && (
                                                    <Avatar className="h-5 w-5">
                                                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                                        {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.due_date && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {formatDate(task.due_date)}</span>
                                                  </div>
                                                )}
                                                <div className="flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleDeleteTask(task.id)
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    disabled={saving}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      {milestone.tasks.filter((task: any) => task.status === "in-progress").length === 0 && (
                                        <div className="text-center py-6">
                                          <Clock className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                          <p className="text-xs text-gray-500">No tasks in progress</p>
                                          <p className="text-xs text-gray-400 mt-1">Move tasks here to start working</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Done Column */}
                                  <div
                                    className="space-y-3 min-h-[200px] p-3 rounded-lg border-2 border-dashed border-gray-200 hover:border-gray-300 transition-colors"
                                    onDragOver={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                    }}
                                    onDrop={async (e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const taskId = e.dataTransfer.getData('taskId')
                                      if (taskId) {
                                        try {
                                          await handleUpdateTaskStatus(taskId, "done")
                                        } catch (error) {
                                          console.error("Error updating task status:", error)
                                        }
                                      }
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h6 className="text-sm font-medium text-gray-700">Done</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task: any) => task.status === "done").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task: any) => task.status === "done")
                                        .map((task: any) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm opacity-75 cursor-move hover:shadow-md transition-all duration-200"
                                            draggable
                                            onDragStart={(e) => {
                                              e.stopPropagation()
                                              e.dataTransfer.setData('taskId', task.id)
                                              e.dataTransfer.effectAllowed = 'move'
                                            }}
                                            onDragEnd={(e) => {
                                              e.preventDefault()
                                              e.stopPropagation()
                                            }}
                                          >
                                            <CardContent className="p-3">
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <h6 className="text-sm font-medium text-gray-900 leading-tight line-through">
                                                    {task.title}
                                                  </h6>
                                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                </div>
                                                {task.description && (
                                                  <p className="text-xs text-gray-600 leading-relaxed line-through">
                                                    {task.description}
                                                  </p>
                                                )}
                                                <div className="flex items-center justify-between">
                                                  <Badge
                                                    variant="outline"
                                                    className={`text-xs ${getTaskStatusColor(task.status)}`}
                                                  >
                                                    Done
                                                  </Badge>
                                                  {task.assignee && (
                                                    <Avatar className="h-5 w-5">
                                                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                                        {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.due_date && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {formatDate(task.due_date)}</span>
                                                  </div>
                                                )}
                                                <div className="flex justify-end">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                      e.stopPropagation()
                                                      handleDeleteTask(task.id)
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    disabled={saving}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                      {milestone.tasks.filter((task: any) => task.status === "done").length === 0 && (
                                        <div className="text-center py-6">
                                          <CheckCircle className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                          <p className="text-xs text-gray-500">No completed tasks</p>
                                          <p className="text-xs text-gray-400 mt-1">Complete tasks to see them here</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Add Task Modal */}
                                <Dialog open={isAddTaskOpen && selectedMilestoneId === milestone.id} onOpenChange={setIsAddTaskOpen}>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Add New Task</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="taskTitle">Task Title *</Label>
                                        <Input
                                          id="taskTitle"
                                          value={newTask.title}
                                          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                          placeholder="Enter task title"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="taskDescription">Description</Label>
                                        <Textarea
                                          id="taskDescription"
                                          value={newTask.description}
                                          onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                          placeholder="Optional task description"
                                          rows={3}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="taskDueDate">Due Date</Label>
                                        <Input
                                          id="taskDueDate"
                                          type="date"
                                          value={newTask.due_date}
                                          onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                                        />
                                      </div>
                                      <div className="flex justify-end gap-3 pt-4">
                                        <Button variant="outline" onClick={() => {
                                          setIsAddTaskOpen(false)
                                          setSelectedMilestoneId(null)
                                          setNewTask({ title: "", description: "", due_date: "", priority: "medium" })
                                        }}>
                                          Cancel
                                        </Button>
                                        <Button
                                          onClick={handleAddTask}
                                          disabled={saving || !newTask.title.trim()}
                                          className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                        >
                                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                          Add Task
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}

                            {/* Client Note Section */}
                            <div className="space-y-3 mt-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-gray-900">Note to Client</h5>
                              </div>

                              <div className="space-y-3">
                                <Textarea
                                  value={milestone.client_note || ""}
                                  onChange={(e) => {
                                    // Update local state immediately for instant feedback
                                    setMilestones(prevMilestones =>
                                      prevMilestones.map(m =>
                                        m.id === milestone.id
                                          ? { ...m, client_note: e.target.value }
                                          : m
                                      )
                                    )
                                  }}
                                  onBlur={async (e) => {
                                    // Save to database when user finishes editing
                                    try {
                                      await updateMilestone(milestone.id, { client_note: e.target.value })
                                    } catch (error) {
                                      console.error('Error saving note:', error)
                                      toast.error('Failed to save note')
                                    }
                                  }}
                                  placeholder="Enter a note for the client..."
                                  className="min-h-[100px] border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                                />
                                <div className="text-xs text-gray-500">
                                  Note will be automatically saved when you finish typing
                                </div>
                              </div>
                            </div>

                            {milestone.completed_date && (
                              <div className="mt-2 text-xs text-green-600">
                                Completed on {formatDate(milestone.completed_date)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="mt-0 flex flex-col h-full">
            <div className="flex-1 bg-white border-0 shadow-sm rounded-2xl flex flex-col overflow-hidden min-h-0">
              {/* Messages Header */}
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-[#3C3CFF]" />
                    <span className="text-xl font-semibold text-gray-900">Project Messages</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {/* Day Divider */}
                <div className="flex items-center justify-center">
                  <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
                    <span className="text-sm text-gray-600 font-medium">Today</span>
                  </div>
                </div>

                {/* System Message */}
                <div className="flex justify-center">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 max-w-md">
                    <p className="text-sm text-blue-700 text-center">
                      <span className="font-medium">Timeline updated:</span> Visual Design milestone marked as in
                      progress
                    </p>
                    <p className="text-xs text-blue-600 text-center mt-1">2 hours ago</p>
                  </div>
                </div>

                {/* Client Message */}
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                      {client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{client ? `${client.first_name} ${client.last_name}` : 'Client'}</span>
                      <span className="text-xs text-gray-500">10:30 AM</span>
                    </div>
                    <div className="bg-[#F1F2F7] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-gray-800">
                        Hi team! I just reviewed the wireframes and they look fantastic. I have a few minor suggestions
                        for the homepage layout. Could we schedule a quick call to discuss?
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Message */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1 justify-end">
                      <span className="text-xs text-gray-500">10:45 AM</span>
                      <span className="text-sm font-medium text-gray-900">You</span>
                    </div>
                    <div className="bg-[#3C3CFF] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-white">
                        Absolutely! I'm glad you like the direction we're heading. Let's schedule a call for tomorrow
                        afternoon. I'll send you a calendar invite shortly.
                      </p>
                    </div>
                  </div>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-sm font-medium">YU</AvatarFallback>
                  </Avatar>
                </div>

                {/* File Attachment Message */}
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                      {client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{client ? `${client.first_name} ${client.last_name}` : 'Client'}</span>
                      <span className="text-xs text-gray-500">11:15 AM</span>
                    </div>
                    <div className="bg-[#F1F2F7] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-gray-800 mb-3">
                        Here are the brand guidelines and logo files you requested:
                      </p>
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">📄</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Brand_Guidelines_2024.pdf</p>
                            <p className="text-xs text-gray-500">2.4 MB</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* User Message with Multiple Lines */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1 justify-end">
                      <span className="text-xs text-gray-500">11:20 AM</span>
                      <span className="text-sm font-medium text-gray-900">You</span>
                    </div>
                    <div className="bg-[#3C3CFF] rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-white">Perfect! Thank you for sharing the brand guidelines.</p>
                      <p className="text-sm text-white mt-2">
                        Our design team will incorporate these into the visual design phase. We'll have the first round
                        of mockups ready by Friday for your review.
                      </p>
                    </div>
                  </div>
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-sm font-medium">YU</AvatarFallback>
                  </Avatar>
                </div>

                {/* New Messages Divider */}
                <div className="flex items-center justify-center py-2">
                  <div className="bg-[#3C3CFF] text-white px-4 py-1 rounded-full shadow-sm">
                    <span className="text-xs font-medium">New messages</span>
                  </div>
                </div>

                {/* Recent Client Message */}
                <div className="flex items-start space-x-3 animate-in fade-in duration-300">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-gray-200 text-gray-700 text-sm font-medium">
                      {client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{client ? `${client.first_name} ${client.last_name}` : 'Client'}</span>
                      <span className="text-xs text-gray-500">Just now</span>
                    </div>
                    <div className="bg-[#F1F2F7] rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                      <p className="text-sm text-gray-800">
                        Sounds great! Looking forward to seeing the mockups. The timeline is looking good so far.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Input Area */}
              <div className="border-t border-gray-200 p-4 bg-white">
                <div className="flex items-end space-x-3">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                    <Upload className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type your message..."
                      className="min-h-[44px] max-h-32 resize-none border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] rounded-2xl pr-12"
                      rows={1}
                    />
                    <Button
                      size="sm"
                      className="absolute right-2 bottom-2 bg-[#3C3CFF] hover:bg-[#2D2DCC] rounded-xl h-8 w-8 p-0"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>Online</span>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Files</h2>
                  <p className="text-gray-600 mt-1">Manage and organize project files</p>
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

              <div className="grid gap-4">
                {projectFiles.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <div className="text-gray-500">
                        <Upload className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No files uploaded yet</h3>
                        <p className="mb-4">Upload files to get started with your project</p>
                        <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Files
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  projectFiles.map((file) => (
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
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="forms" className="space-y-6">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Forms coming soon</h3>
                  <p className="mb-4">Form management functionality will be available soon</p>
                  <Button disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Forms
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="space-y-6">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Contracts coming soon</h3>
                  <p className="mb-4">Contract management functionality will be available soon</p>
                  <Button disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Manage Contracts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Invoices coming soon</h3>
                  <p className="mb-4">Invoice management functionality will be available soon</p>
                  <Button disabled>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Activity coming soon</h3>
                  <p className="mb-4">Activity tracking and history will be available soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

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
                            {formatTimeAgo(comment.created_at)}
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
    </div>
  )
}