"use client"

export const dynamic = 'force-dynamic'

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Calendar,
  Eye,
  Edit,
  Archive,
  ExternalLink,
  Users,
  MessageCircle,
  FileText,
  CreditCard,
  Trash2,
  Loader2,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { 
  getProjects, 
  createProject, 
  deleteProject, 
  archiveProject, 
  restoreProject,
  updateProject,
  getProjectTags,
  getAccountProjectTags,
  getClientsForProjects,
  standardProjectTags,
  getProjectTagColor,
  type Project,
  type ProjectTag
} from "@/lib/projects"

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on-hold", label: "On Hold" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
]

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Array<{ id: string; first_name: string; last_name: string; company: string | null }>>([])
  const [projectTags, setProjectTags] = useState<Record<string, string[]>>({})
  const [projectTagColors, setProjectTagColors] = useState<Record<string, Record<string, string>>>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [clientFilter, setClientFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false)
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [newProject, setNewProject] = useState({
    name: "",
    client_id: "",
    due_date: "",
    description: "",
    status: "draft" as 'draft' | 'active' | 'on-hold' | 'completed' | 'archived',
    tags: [] as Array<{ name: string; color?: string }>,
  })
  const [addNewTag, setAddNewTag] = useState("")
  const [addNewTagColor, setAddNewTagColor] = useState("#6B7280")
  const [editNewTag, setEditNewTag] = useState("")
  const [editNewTagColor, setEditNewTagColor] = useState("#6B7280")
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>({})

  // Load projects and related data
  const loadProjects = async () => {
    try {
      setLoading(true)
      const [projectsData, clientsData, tagsData] = await Promise.all([
        getProjects(),
        getClientsForProjects(),
        getAccountProjectTags()
      ])
      
      setProjects(projectsData)
      setClients(clientsData)
      setAvailableTags(tagsData)

      // Load tags for each project
      const tagsMap: Record<string, string[]> = {}
      const tagColorsMap: Record<string, Record<string, string>> = {}
      for (const project of projectsData) {
        try {
          const tags = await getProjectTags(project.id)
          tagsMap[project.id] = tags.map(tag => tag.tag_name)
          tagColorsMap[project.id] = {}
          tags.forEach(tag => {
            tagColorsMap[project.id][tag.tag_name] = tag.color
          })
        } catch (error) {
          console.error(`Error loading tags for project ${project.id}:`, error)
          tagsMap[project.id] = []
          tagColorsMap[project.id] = {}
        }
      }
      setProjectTags(tagsMap)
      setProjectTagColors(tagColorsMap)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    
    // Get client name for filtering
    const client = clients.find(c => c.id === project.client_id)
    const clientName = client ? `${client.first_name} ${client.last_name}`.toLowerCase() : ""
    const matchesClient = clientFilter === "all" || clientName.includes(clientFilter.toLowerCase())
    
    // Get project tags for filtering
    const projectTagNames = projectTags[project.id] || []
    const matchesTag = tagFilter === "all" || projectTagNames.includes(tagFilter)
    
    return matchesSearch && matchesStatus && matchesClient && matchesTag
  })

  const handleProjectClick = (projectId: string) => {
    router.push(`/dashboard/projects/${projectId}`)
  }

  const handleProjectAction = async (action: string, project: Project, e: React.MouseEvent) => {
    e.stopPropagation()
    
    switch (action) {
      case "view":
        handleProjectClick(project.id)
        break
      case "edit":
        handleEditProject(project)
        break
      case "portal":
        // TODO: Implement portal view
        toast.info('Portal view coming soon')
        break
      case "archive":
        await handleArchiveProject(project.id)
        break
      case "restore":
        await handleRestoreProject(project.id)
        break
      case "delete":
        await handleDeleteProject(project.id)
        break
    }
  }

  const handleEditProject = (project: Project) => {
    const projectTagNames = projectTags[project.id] || []
    const projectTagColorsData = projectTagColors[project.id] || {}
    
    // Format the date for the input field (YYYY-MM-DD format)
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return ""
      const date = new Date(dateString)
      return date.toISOString().split('T')[0]
    }
    
    setEditProject(project)
    setNewProject({
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
    if (!editProject) return
    
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name')
      return
    }
    
    if (!newProject.client_id) {
      toast.error('Please select a client')
      return
    }
    
    try {
      setSaving(true)
      const loadingToast = toast.loading('Updating project...')
      
      await updateProject(editProject.id, {
        client_id: newProject.client_id,
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        status: newProject.status,
        due_date: newProject.due_date || undefined,
        tags: newProject.tags
      })
      
      toast.dismiss(loadingToast)
      toast.success('Project updated successfully')
      setIsEditProjectOpen(false)
      setEditProject(null)
      
      // Update local state immediately instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === editProject.id 
            ? {
                ...project,
                name: newProject.name.trim(),
                description: newProject.description.trim() || null,
                status: newProject.status,
                due_date: newProject.due_date || null,
                client_id: newProject.client_id
              }
            : project
        )
      )
      
      // Update project tags locally
      const updatedTags = newProject.tags.map(tag => tag.name)
      setProjectTags(prev => ({
        ...prev,
        [editProject.id]: updatedTags
      }))
      
      // Update project tag colors locally
      const updatedTagColors: Record<string, string> = {}
      newProject.tags.forEach(tag => {
        updatedTagColors[tag.name] = tag.color || getProjectTagColor(tag.name)
      })
      setProjectTagColors(prev => ({
        ...prev,
        [editProject.id]: updatedTagColors
      }))
      
      setNewProject({
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

  const handleArchiveProject = async (projectId: string) => {
    try {
      setDeleting(true)
      await archiveProject(projectId)
      toast.success('Project archived successfully')
      
      // Update local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: 'archived' as const }
            : project
        )
      )
    } catch (error) {
      console.error('Error archiving project:', error)
      toast.error('Failed to archive project')
    } finally {
      setDeleting(false)
    }
  }

  const handleRestoreProject = async (projectId: string) => {
    try {
      setDeleting(true)
      await restoreProject(projectId)
      toast.success('Project restored successfully')
      
      // Update local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.map(project => 
          project.id === projectId 
            ? { ...project, status: 'active' as const }
            : project
        )
      )
    } catch (error) {
      console.error('Error restoring project:', error)
      toast.error('Failed to restore project')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeleting(true)
      await deleteProject(projectId)
      toast.success('Project deleted successfully')
      
      // Remove from local state instead of reloading
      setProjects(prevProjects => 
        prevProjects.filter(project => project.id !== projectId)
      )
      
      // Clean up project tags
      setProjectTags(prev => {
        const newTags = { ...prev }
        delete newTags[projectId]
        return newTags
      })
      
      // Clean up project tag colors
      setProjectTagColors(prev => {
        const newColors = { ...prev }
        delete newColors[projectId]
        return newColors
      })
    } catch (error) {
      console.error('Error deleting project:', error)
      toast.error('Failed to delete project')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700 border-green-200"
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "on-hold":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "draft":
        return "bg-gray-100 text-gray-700 border-gray-200"
      case "archived":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const addTagToNewProject = (tagName: string) => {
    if (!newProject.tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
      setNewProject({
        ...newProject,
        tags: [...newProject.tags, { name: tagName, color: standardTag?.color }]
      })
    }
  }

  const removeTagFromNewProject = (tagName: string) => {
    setNewProject({
      ...newProject,
      tags: newProject.tags.filter(tag => tag.name !== tagName)
    })
  }

  const createCustomTag = () => {
    if (!addNewTag.trim()) {
      toast.error('Please enter a tag name')
      return
    }
    
    if (newProject.tags.find(tag => tag.name.toLowerCase() === addNewTag.trim().toLowerCase())) {
      toast.error('Tag already exists')
      return
    }
    
    setNewProject({
      ...newProject,
      tags: [...newProject.tags, { name: addNewTag.trim(), color: addNewTagColor }]
    })
    setCustomTagColors(prev => ({ ...prev, [addNewTag.trim()]: addNewTagColor }))
    setAddNewTag("")
    setAddNewTagColor("#6B7280")
  }

  const addTagToEditProject = (tagName: string) => {
    if (!newProject.tags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
      setNewProject({
        ...newProject,
        tags: [...newProject.tags, { name: tagName, color: standardTag?.color }]
      })
    }
  }

  const removeTagFromEditProject = (tagName: string) => {
    setNewProject({
      ...newProject,
      tags: newProject.tags.filter(tag => tag.name !== tagName)
    })
  }

  const createCustomTagForEdit = () => {
    if (!editNewTag.trim()) {
      toast.error('Please enter a tag name')
      return
    }
    
    if (newProject.tags.find(tag => tag.name.toLowerCase() === editNewTag.trim().toLowerCase())) {
      toast.error('Tag already exists')
      return
    }
    
    setNewProject({
      ...newProject,
      tags: [...newProject.tags, { name: editNewTag.trim(), color: editNewTagColor }]
    })
    setCustomTagColors(prev => ({ ...prev, [editNewTag.trim()]: editNewTagColor }))
    setEditNewTag("")
    setEditNewTagColor("#6B7280")
  }

  const handleAddProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Please enter a project name')
      return
    }
    
    if (!newProject.client_id) {
      toast.error('Please select a client')
      return
    }
    
    try {
      setSaving(true)
      const loadingToast = toast.loading('Creating project...')
      
      const createdProject = await createProject({
        client_id: newProject.client_id,
        name: newProject.name.trim(),
        description: newProject.description.trim() || undefined,
        status: newProject.status,
        due_date: newProject.due_date || undefined,
        tags: newProject.tags
      })
      
      toast.dismiss(loadingToast)
      
      if (!createdProject) {
        toast.error('Failed to create project')
        return
      }
      
      toast.success('Project created successfully')
    setIsNewProjectOpen(false)
      
      // Add the new project to local state instead of reloading
      setProjects(prevProjects => [createdProject, ...prevProjects])
      
      // Add project tags to local state
      const newProjectTags = newProject.tags.map(tag => tag.name)
      setProjectTags(prev => ({
        ...prev,
        [createdProject.id]: newProjectTags
      }))
      
      // Add project tag colors to local state
      const newProjectTagColors: Record<string, string> = {}
      newProject.tags.forEach(tag => {
        newProjectTagColors[tag.name] = tag.color || getProjectTagColor(tag.name)
      })
      setProjectTagColors(prev => ({
        ...prev,
        [createdProject.id]: newProjectTagColors
      }))
      
      setNewProject({
        name: "",
        client_id: "",
        due_date: "",
        description: "",
        status: "draft",
        tags: [],
      })
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const getTagDisplayColor = (tagName: string, projectId: string): string => {
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

  const getTagFilterColor = (tagName: string): string => {
    // First check if this tag exists in any project with a saved color
    for (const projectId in projectTagColors) {
      const projectColors = projectTagColors[projectId]
      if (projectColors && projectColors[tagName]) {
        return projectColors[tagName]
      }
    }
    
    // Then check standard tags
    const standardTag = standardProjectTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Then check custom tag colors
    if (customTagColors[tagName]) {
      return customTagColors[tagName]
    }
    
    // Default color
    return '#6B7280'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    // Add one day to fix the timezone offset issue
    date.setDate(date.getDate() + 1)
    return date.toLocaleDateString()
  }

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const date = new Date(dateString)
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays < 7) return `${diffInDays} days ago`
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage and track all your client projects</p>
          </div>
        </div>

        {/* Header with Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                />
              </div>
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-10 border-gray-200">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-[140px] h-10 border-gray-200">
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map((client) => (
                  <SelectItem key={client.id} value={`${client.first_name} ${client.last_name}`}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[140px] h-10 border-gray-200">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {availableTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getTagFilterColor(tag) }}
                      />
                      {tag}
                    </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isNewProjectOpen} onOpenChange={setIsNewProjectOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Button>
                  </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Create New Project</DialogTitle>
                    </DialogHeader>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Basic Information */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="projectName">Project Name *</Label>
                        <Input
                          id="projectName"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          placeholder="Enter project name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectClient">Client *</Label>
                        <Select
                        value={newProject.client_id}
                        onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select client" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.first_name} {client.last_name}
                              {client.company && ` (${client.company})`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="projectStatus">Status</Label>
                      <Select
                        value={newProject.status}
                        onValueChange={(value: any) => setNewProject({ ...newProject, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="projectDescription">Description</Label>
                        <Textarea
                          id="projectDescription"
                          value={newProject.description}
                          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                          placeholder="Optional project description"
                        rows={4}
                      />
                    </div>
                  </div>

                  {/* Right Column - Dates and Tags */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectDueDate">Due Date</Label>
                      <Input
                        id="projectDueDate"
                        type="date"
                        value={newProject.due_date}
                        onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                      />
                    </div>
                    
                    {/* Tags Section */}
                    <div className="space-y-3">
                      <Label>Tags</Label>
                      
                      {/* Selected Tags */}
                      {newProject.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newProject.tags.map((tag) => (
                            <Badge
                              key={tag.name}
                              variant="outline"
                              className="cursor-pointer"
                              style={{
                                backgroundColor: `${tag.color || getProjectTagColor(tag.name)}20`,
                                borderColor: tag.color || getProjectTagColor(tag.name),
                                color: tag.color || getProjectTagColor(tag.name)
                              }}
                              onClick={() => removeTagFromNewProject(tag.name)}
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
                              onClick={() => addTagToNewProject(tag.name)}
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
                            value={addNewTag}
                            onChange={(e) => setAddNewTag(e.target.value)}
                            className="flex-1"
                          />
                          <input
                            type="color"
                            value={addNewTagColor}
                            onChange={(e) => setAddNewTagColor(e.target.value)}
                            className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
                          />
                          <Button 
                            onClick={createCustomTag}
                            disabled={!addNewTag.trim()}
                            size="sm"
                          >
                            Add
                          </Button>
                        </div>
                        {addNewTag.trim() && (
                          <div className="mt-2">
                            <Badge
                              variant="outline"
                              style={{
                                backgroundColor: `${addNewTagColor}20`,
                                borderColor: addNewTagColor,
                                color: addNewTagColor
                              }}
                            >
                              {addNewTag}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
                        <Button variant="outline" onClick={() => setIsNewProjectOpen(false)}>
                          Cancel
                        </Button>
                  <Button 
                    onClick={handleAddProject} 
                    className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Create Project
                        </Button>
                </div>
              </DialogContent>
            </Dialog>

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
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                        placeholder="Enter project name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editProjectClient">Client *</Label>
                      <Select
                        value={newProject.client_id}
                        onValueChange={(value) => setNewProject({ ...newProject, client_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((client) => (
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
                        value={newProject.status}
                        onValueChange={(value: any) => setNewProject({ ...newProject, status: value })}
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
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
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
                        value={newProject.due_date}
                        onChange={(e) => setNewProject({ ...newProject, due_date: e.target.value })}
                      />
                    </div>
                    
                    {/* Tags Section */}
                    <div className="space-y-3">
                      <Label>Tags</Label>
                      
                      {/* Selected Tags */}
                      {newProject.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {newProject.tags.map((tag) => (
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
              </div>
            </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">No projects found</h3>
                <p className="mb-4">Get started by creating your first project</p>
                <Button 
                  onClick={() => setIsNewProjectOpen(true)}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const client = clients.find(c => c.id === project.client_id)
              const clientName = client ? `${client.first_name} ${client.last_name}` : 'Unknown Client'
              const clientInitials = client ? `${client.first_name[0]}${client.last_name[0]}` : 'UC'
              const projectTagNames = projectTags[project.id] || []
              
              return (
            <Card
              key={project.id}
                  className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl cursor-pointer group"
              onClick={() => handleProjectClick(project.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors mb-2">
                      {project.name}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                              {clientInitials}
                        </AvatarFallback>
                      </Avatar>
                          <span className="text-sm text-gray-600">{clientName}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                        className="text-gray-500 hover:text-gray-800 opacity-60 hover:opacity-100 transition-all duration-200"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleProjectAction("view", project, e)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleProjectAction("edit", project, e)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleProjectAction("portal", project, e)}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Portal
                      </DropdownMenuItem>
                          {project.status === "archived" ? (
                            <DropdownMenuItem onClick={(e) => handleProjectAction("restore", project, e)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Make Active
                            </DropdownMenuItem>
                          ) : (
                      <DropdownMenuItem onClick={(e) => handleProjectAction("archive", project, e)}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={(e) => handleProjectAction("delete", project, e)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-medium text-gray-900">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ")}
                    </Badge>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(project.last_activity_at)}
                        </span>
                  </div>

                      {projectTagNames.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                          {projectTagNames.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                              className="text-xs"
                              style={{
                                backgroundColor: `${getTagDisplayColor(tag, project.id)}20`,
                                borderColor: getTagDisplayColor(tag, project.id),
                                color: getTagDisplayColor(tag, project.id)
                              }}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                            <span>{project.total_messages}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                            <span>{project.total_files}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CreditCard className="h-3 w-3" />
                            <span>{project.total_invoices}</span>
                      </div>
                    </div>
                        {project.due_date && (
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                            <span>{formatDate(project.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
              )
            })}
        </div>
        )}
      </div>
    </DashboardLayout>
  )
}
