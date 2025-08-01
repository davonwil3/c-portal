"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
  Upload,
  Search,
  File as FileIcon,
  FileText,
  ImageIcon,
  Calendar,
  MoreHorizontal,
  Eye,
  Download,
  MessageSquare,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
  Archive,
  RotateCcw,
  X,
  Plus,
} from "lucide-react"
import { 
  getFiles, 
  getFileStats, 
  deleteFile, 
  approveFile, 
  rejectFile, 
  archiveFile, 
  restoreFile,
  addFileComment,
  uploadFile,
  downloadFile,
  getAllFileTags,
  updateFile,
  type File,
  getFileUrl
} from "@/lib/files"
import { getClients } from "@/lib/clients"
import { getProjects, getProjectsByClient } from "@/lib/projects"

export default function FilesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [stats, setStats] = useState({
    totalFiles: 0,
    pendingApproval: 0,
    recentFiles: 0
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false)
  const [selectedFileForComment, setSelectedFileForComment] = useState<File | null>(null)
  const [commentContent, setCommentContent] = useState("")
  const [isInternalComment, setIsInternalComment] = useState(false)
  
  // View modal state
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedFileForView, setSelectedFileForView] = useState<File | null>(null)
  const [fileViewUrl, setFileViewUrl] = useState<string | null>(null)
  
  // Upload modal state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFilesForUpload, setSelectedFilesForUpload] = useState<globalThis.File[]>([])
  const [uploadForm, setUploadForm] = useState({
    clientId: "none",
    projectId: "none",
    tags: [] as string[],
  })
  
  // Edit modal state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingFile, setEditingFile] = useState<File | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    clientId: "none",
    projectId: "none",
    tags: [] as string[],
  })
  const [editFilteredProjects, setEditFilteredProjects] = useState<any[]>([])
  const [availableClients, setAvailableClients] = useState<any[]>([])
  const [availableProjects, setAvailableProjects] = useState<any[]>([])
  const [filteredProjects, setFilteredProjects] = useState<any[]>([])
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>({})
  const [newTag, setNewTag] = useState("")
  const [newTagColor, setNewTagColor] = useState("#3B82F6")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load files and stats on component mount
  useEffect(() => {
    loadFiles()
    loadStats()
    loadClientsAndProjects()
  }, [])

  const loadFiles = async () => {
    try {
      setLoading(true)
      const [filesData, allTagsData] = await Promise.all([
        getFiles(),
        getAllFileTags()
      ])
      setFiles(filesData)
      
      // Initialize custom tag colors for existing tags
      const tagColors: Record<string, string> = {}
      allTagsData.forEach(tag => {
        // If we don't have a color for this tag yet, generate one
        if (!customTagColors[tag]) {
          tagColors[tag] = getTagColor(tag)
        } else {
          tagColors[tag] = customTagColors[tag]
        }
      })
      setCustomTagColors(prev => ({ ...prev, ...tagColors }))
    } catch (error) {
      console.error('Error loading files:', error)
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getFileStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadClientsAndProjects = async () => {
    try {
      const [clientsData, projectsData] = await Promise.all([
        getClients(),
        getProjects()
      ])
      setAvailableClients(clientsData)
      setAvailableProjects(projectsData)
    } catch (error) {
      console.error('Error loading clients and projects:', error)
    }
  }

  const filteredFiles = files.filter((file) => {
    const matchesSearch =
      file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (file.clients?.company && file.clients.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.projects?.name && file.projects.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (file.uploaded_by_name && file.uploaded_by_name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = typeFilter === "all" || file.file_type.toLowerCase() === typeFilter.toLowerCase()
    const matchesStatus = statusFilter === "all" || file.approval_status === statusFilter
    const matchesTag = tagFilter === "all" || (file.tags && file.tags.some(tag => tag.name.toLowerCase() === tagFilter.toLowerCase()))

    return matchesSearch && matchesType && matchesStatus && matchesTag
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFiles(filteredFiles.map((file) => file.id))
    } else {
      setSelectedFiles([])
    }
  }

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId))
    }
  }

  const handleViewFile = async (file: File) => {
    try {
      setSelectedFileForView(file)
      const url = await getFileUrl(file.id)
      setFileViewUrl(url)
      setIsViewDialogOpen(true)
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast.error('Failed to load file for viewing')
    }
  }

  const handleFileAction = async (action: string, file: File) => {
    try {
      setActionLoading(file.id)
      
      switch (action) {
        case "view":
          await handleViewFile(file)
          break
        case "delete":
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            await deleteFile(file.id)
            toast.success('File deleted successfully')
            setFiles(prev => prev.filter(f => f.id !== file.id))
            setSelectedFiles(prev => prev.filter(id => id !== file.id))
            // Update stats immediately
            await loadStats()
          }
          break
        case "download":
          const downloadUrl = await downloadFile(file.id)
          if (downloadUrl) {
            // Open download in new tab
            window.open(downloadUrl, '_blank')
            toast.success('Download started')
          } else {
            toast.error('Failed to get download URL')
          }
          break
        case "approve":
          await approveFile(file.id)
          toast.success('File approved successfully')
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, approval_status: 'approved' as const } : f
          ))
          // Update stats immediately
          await loadStats()
          break
        case "reject":
          await rejectFile(file.id)
          toast.success('File rejected successfully')
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, approval_status: 'rejected' as const } : f
          ))
          // Update stats immediately
          await loadStats()
          break
        case "pending":
          await updateFile(file.id, { approval_status: 'pending' })
          toast.success('File marked as pending')
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, approval_status: 'pending' as const } : f
          ))
          // Update stats immediately
          await loadStats()
          break
        case "comment":
          setSelectedFileForComment(file)
          setIsCommentDialogOpen(true)
          break
        case "edit":
          handleEditFile(file)
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on file:`, error)
      toast.error(`Failed to ${action} file`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddComment = async () => {
    if (!selectedFileForComment || !commentContent.trim()) {
      toast.error('Please enter a comment')
      return
    }

    try {
      setActionLoading(selectedFileForComment.id)
      await addFileComment(selectedFileForComment.id, commentContent.trim(), isInternalComment)
      toast.success('Comment added successfully')
      setIsCommentDialogOpen(false)
      setSelectedFileForComment(null)
      setCommentContent("")
      setIsInternalComment(false)
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditFile = async (file: File) => {
    setEditingFile(file)
    
    // Set initial form values based on the file
    const initialClientId = file.client_id || "none"
    const initialProjectId = file.project_id || "none"
    
    setEditForm({
      clientId: initialClientId,
      projectId: initialProjectId,
      tags: file.tags ? file.tags.map(tag => tag.name) : [],
    })
    
    // Load projects for the client if one is selected
    if (initialClientId !== "none") {
      try {
        const projectsForClient = await getProjectsByClient(initialClientId)
        setEditFilteredProjects(projectsForClient)
      } catch (error) {
        console.error('Error loading projects for client:', error)
        setEditFilteredProjects([])
      }
    } else {
      setEditFilteredProjects([])
    }
    
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingFile) return

    try {
      setEditing(true)
      
      // Prepare tag objects with colors
      const tagObjects = editForm.tags.map(tag => ({
        name: tag,
        color: customTagColors[tag] || getTagColor(tag)
      }))
      
      // Update the file
      await updateFile(editingFile.id, {
        tags: tagObjects
      })
      
      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === editingFile.id 
          ? { 
              ...f, 
              tags: tagObjects,
              client_id: editForm.clientId !== "none" ? editForm.clientId : null,
              project_id: editForm.projectId !== "none" ? editForm.projectId : null,
              clients: editForm.clientId !== "none" 
                ? availableClients.find(c => c.id === editForm.clientId) || null
                : null,
              projects: editForm.projectId !== "none"
                ? editFilteredProjects.find(p => p.id === editForm.projectId) || null
                : null
            }
          : f
      ))
      
      toast.success('File updated successfully')
      setIsEditDialogOpen(false)
      setEditingFile(null)
      resetEditForm()
    } catch (error) {
      console.error('Error updating file:', error)
      toast.error('Failed to update file')
    } finally {
      setEditing(false)
    }
  }

  const resetEditForm = () => {
    setEditForm({
      clientId: "none",
      projectId: "none",
      tags: [],
    })
    setEditFilteredProjects([])
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    setSelectedFilesForUpload(selectedFiles)
  }

  const handleUpload = async () => {
    if (selectedFilesForUpload.length === 0) {
      toast.error('Please select at least one file to upload')
      return
    }

    try {
      setUploading(true)
      
      for (const file of selectedFilesForUpload) {
        // Filter tag colors to only include colors for tags that are actually being used
        const fileTagColors: Record<string, string> = {}
        uploadForm.tags.forEach(tag => {
          if (customTagColors[tag]) {
            fileTagColors[tag] = customTagColors[tag]
          }
        })
        
        console.log('=== UPLOAD DEBUG ===')
        console.log('File:', file.name)
        console.log('Tags being uploaded:', uploadForm.tags)
        console.log('All customTagColors:', customTagColors)
        console.log('Filtered fileTagColors:', fileTagColors)
        
        const result = await uploadFile(
          file,
          uploadForm.clientId !== "none" ? uploadForm.clientId : undefined,
          uploadForm.projectId !== "none" ? uploadForm.projectId : undefined,
          undefined, // description parameter
          uploadForm.tags,
          fileTagColors // Pass only the colors for tags used on this file
        )
        console.log('Upload result:', result) // Debug log
      }

      toast.success(`${selectedFilesForUpload.length} file(s) uploaded successfully`)
      setIsUploadDialogOpen(false)
      setSelectedFilesForUpload([])
      resetUploadForm()
      
      // Reload files, stats, and tags
      await loadFiles()
      await loadStats()
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

  const resetUploadForm = () => {
    setUploadForm({
      clientId: "none",
      projectId: "none",
      tags: [],
    })
    setFilteredProjects([])
    setNewTag("")
    setNewTagColor("#3B82F6")
  }

  const removeTagFromUpload = (tag: string) => {
    setUploadForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addTagToUpload = (tag: string) => {
    console.log('addTagToUpload called with:', tag) // Debug log
    console.log('Current uploadForm.tags:', uploadForm.tags) // Debug log
    if (!uploadForm.tags.includes(tag)) {
      setUploadForm(prev => {
        const newTags = [...prev.tags, tag]
        console.log('Setting new tags:', newTags) // Debug log
        return {
          ...prev,
          tags: newTags
        }
      })
    } else {
      console.log('Tag already exists:', tag) // Debug log
    }
  }

  const createCustomTag = () => {
    console.log('createCustomTag called with:', { newTag: newTag.trim(), currentTags: uploadForm.tags }) // Debug log
    if (newTag.trim() && !uploadForm.tags.includes(newTag.trim())) {
      console.log('Adding tag:', newTag.trim()) // Debug log
      const tagName = newTag.trim()
      addTagToUpload(tagName)
      // Add the new tag color to the customTagColors state
      setCustomTagColors(prev => ({
        ...prev,
        [tagName]: newTagColor
      }))
      setNewTag("")
      setNewTagColor("#3B82F6")
      console.log('Tag added, new tags:', [...uploadForm.tags, tagName]) // Debug log
    } else {
      console.log('Tag not added - already exists or empty') // Debug log
    }
  }

  const getTagDisplayColor = (tag: string, file?: File): string => {
    // If we have a file, look for the tag object and get its color
    if (file?.tags) {
      const tagObject = file.tags.find(t => t.name === tag)
      if (tagObject) {
        return tagObject.color
      }
    }
    // Fallback to custom tag colors or generated color
    if (customTagColors[tag]) {
      return customTagColors[tag]
    }
    return getTagColor(tag)
  }

const getFileIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case "pdf":
      return <FileText className="h-5 w-5 text-red-500" />
    case "png":
    case "jpg":
    case "jpeg":
      case "gif":
      case "svg":
      return <ImageIcon className="h-5 w-5 text-blue-500" />
      case "doc":
      case "docx":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "xls":
      case "xlsx":
        return <FileText className="h-5 w-5 text-green-600" />
      case "ppt":
      case "pptx":
        return <FileText className="h-5 w-5 text-orange-600" />
      case "fig":
        return <FileText className="h-5 w-5 text-purple-600" />
    default:
      return <FileIcon className="h-5 w-5 text-gray-500" />
  }
}

  const getFileTypeColor = (fileType: string): string => {
    const colorMap: Record<string, string> = {
      'PDF': '#DC2626',
      'DOC': '#2563EB',
      'DOCX': '#2563EB',
      'XLS': '#059669',
      'XLSX': '#059669',
      'PPT': '#DC2626',
      'PPTX': '#DC2626',
      'TXT': '#6B7280',
      'RTF': '#6B7280',
      'PNG': '#7C3AED',
      'JPG': '#7C3AED',
      'JPEG': '#7C3AED',
      'GIF': '#7C3AED',
      'SVG': '#7C3AED',
      'MP4': '#EA580C',
      'AVI': '#EA580C',
      'MOV': '#EA580C',
      'MP3': '#DB2777',
      'WAV': '#DB2777',
      'ZIP': '#6B7280',
      'RAR': '#6B7280',
      '7Z': '#6B7280',
      'FIG': '#F59E0B'
    }
    
    return colorMap[fileType.toUpperCase()] || '#6B7280'
  }

  const getTagColor = (tag: string): string => {
    // Use a hash function to generate consistent colors for tags
    let hash = 0
    for (let i = 0; i < tag.length; i++) {
      const char = tag.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    // Generate a color from the hash
    const hue = Math.abs(hash) % 360
    return `hsl(${hue}, 70%, 50%)`
  }

  const getAllTags = (): string[] => {
    const allTags = new Set<string>()
    files.forEach(file => {
      if (file.tags && Array.isArray(file.tags)) {
        file.tags.forEach(tag => allTags.add(tag.name))
      }
    })
    return Array.from(allTags).sort()
}

  const getTagColorForFilter = (tagName: string): string => {
    // Look through all files to find the actual color used for this tag
    for (const file of files) {
      if (file.tags && Array.isArray(file.tags)) {
        const tag = file.tags.find(t => t.name === tagName)
        if (tag) {
          return tag.color
        }
      }
    }
    // Fallback to custom tag colors or generated color
    if (customTagColors[tagName]) {
      return customTagColors[tagName]
    }
    return getTagColor(tagName)
  }

const getApprovalBadge = (status: string) => {
  switch (status) {
    case "approved":
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approved
        </Badge>
      )
    case "pending":
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case "rejected":
      return (
        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      )
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

  const getLinkedToText = (file: File) => {
    if (file.clients) {
      return file.clients.company || `${file.clients.first_name} ${file.clients.last_name}`
    }
    if (file.projects) {
      return file.projects.name
    }
    return "—"
  }

  const getLinkedType = (file: File) => {
    if (file.clients) return "client"
    if (file.projects) return "project"
    return "—"
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleBulkAction = async (action: string) => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files first')
      return
    }

    try {
      setActionLoading('bulk')
      
      switch (action) {
        case "download":
          // Download each selected file in new tabs
          for (const fileId of selectedFiles) {
            const file = files.find(f => f.id === fileId)
            if (file) {
              const downloadUrl = await downloadFile(file.id)
              if (downloadUrl) {
                window.open(downloadUrl, '_blank')
              }
            }
          }
          toast.success(`Downloading ${selectedFiles.length} file(s)`)
          break
          
        case "approve":
          // Approve all selected files
          for (const fileId of selectedFiles) {
            await approveFile(fileId)
          }
          toast.success(`Approved ${selectedFiles.length} file(s)`)
          // Update local state
          setFiles(prev => prev.map(f => 
            selectedFiles.includes(f.id) ? { ...f, approval_status: 'approved' as const } : f
          ))
          break
          
        case "delete":
          if (confirm(`Are you sure you want to delete ${selectedFiles.length} file(s)?`)) {
            // Delete all selected files
            for (const fileId of selectedFiles) {
              await deleteFile(fileId)
            }
            toast.success(`Deleted ${selectedFiles.length} file(s)`)
            // Update local state
            setFiles(prev => prev.filter(f => !selectedFiles.includes(f.id)))
          }
          break
      }
      
      // Clear selection
      setSelectedFiles([])
      
      // Update stats immediately
      await loadStats()
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error)
      toast.error(`Failed to ${action} files`)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Files</h1>
            <p className="text-gray-600 mt-1">
              Manage and search through all uploaded files across projects and clients
            </p>
          </div>
          <Button 
            className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload New File
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files Uploaded</CardTitle>
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFiles}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Files Awaiting Approval</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApproval}</div>
              <p className="text-xs text-muted-foreground">Needs review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recently Added (Last 7 Days)</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentFiles}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search files by name, project, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpg">JPG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="mp4">MP4</SelectItem>
                  <SelectItem value="avi">AVI</SelectItem>
                  <SelectItem value="mov">MOV</SelectItem>
                  <SelectItem value="mp3">MP3</SelectItem>
                  <SelectItem value="wav">WAV</SelectItem>
                  <SelectItem value="docx">DOCX</SelectItem>
                  <SelectItem value="xlsx">XLSX</SelectItem>
                  <SelectItem value="pptx">PPTX</SelectItem>
                  <SelectItem value="zip">ZIP</SelectItem>
                  <SelectItem value="fig">Figma</SelectItem>
                  <SelectItem value="txt">TXT</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="js">JavaScript</SelectItem>
                  <SelectItem value="ts">TypeScript</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  {getAllTags().map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: getTagColorForFilter(tag) }}
                        />
                        {tag}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("download")}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("approve")}
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Approve
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleBulkAction("delete")} 
                    className="text-red-600 hover:text-red-700 bg-transparent"
                    disabled={actionLoading === 'bulk'}
                  >
                    {actionLoading === 'bulk' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files Table */}
        <Card>
          <CardContent className="p-0">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No files uploaded yet</h3>
                <p className="text-gray-600 mb-4">Get started by uploading your first file</p>
                <Button 
                  className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First File
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">
                        <Checkbox
                          checked={selectedFiles.length === filteredFiles.length && filteredFiles.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="text-left p-4 font-medium text-gray-900">File Name</th>
                      <th className="text-left p-4 font-medium text-gray-900">File Type</th>
                      <th className="text-left p-4 font-medium text-gray-900">Client</th>
                      <th className="text-left p-4 font-medium text-gray-900">Uploaded By</th>
                      <th className="text-left p-4 font-medium text-gray-900">Upload Date</th>
                      <th className="text-left p-4 font-medium text-gray-900">Project</th>
                      <th className="text-left p-4 font-medium text-gray-900">Approval Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedFiles.includes(file.id)}
                            onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center">
                            {getFileIcon(file.file_type)}
                            <div className="ml-3">
                              <div className="font-medium text-gray-900">{file.name}</div>
                              <div className="text-sm text-gray-500">{file.file_size_formatted}</div>
                              {/* Display tags */}
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {file.tags.map((tag, index) => (
                                    <Badge
                                      key={index}
                                      variant="outline"
                                      className="text-xs"
                                      style={{ 
                                        backgroundColor: `${getTagDisplayColor(tag.name, file)}20`,
                                        borderColor: getTagDisplayColor(tag.name, file),
                                        color: getTagDisplayColor(tag.name, file)
                                      }}
                                    >
                                      {tag.name}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="outline">{file.file_type.toUpperCase()}</Badge>
                        </td>
                        <td className="p-4 text-gray-900">
                          {file.clients ? (
                            file.clients.company || `${file.clients.first_name} ${file.clients.last_name}`
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-gray-900">{file.uploaded_by_name || "Unknown"}</td>
                        <td className="p-4 text-gray-600">{new Date(file.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <span className="text-gray-900">
                              {file.projects ? file.projects.name : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">{getApprovalBadge(file.approval_status)}</td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleFileAction("view", file)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction("edit", file)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction("download", file)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleFileAction("comment", file)}>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Comment
                              </DropdownMenuItem>
                              
                              {/* Approval Status Options */}
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
                                onClick={() => handleFileAction("delete", file)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {actionLoading === file.id && (
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
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

              {/* Upload Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client">Link to Client (Optional)</Label>
                  <Select value={uploadForm.clientId} onValueChange={async (value) => {
                    setUploadForm(prev => ({ ...prev, clientId: value }));
                    // Clear project selection when client changes
                    setUploadForm(prev => ({ ...prev, projectId: "none" }));
                    
                    if (value === "none") {
                      setFilteredProjects([]);
                    } else {
                      try {
                        const projectsForClient = await getProjectsByClient(value);
                        setFilteredProjects(projectsForClient);
                      } catch (error) {
                        console.error('Error loading projects for client:', error);
                        toast.error('Failed to load projects for selected client');
                        setFilteredProjects([]);
                      }
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company || `${client.first_name} ${client.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project">Link to Project (Optional)</Label>
                  <Select 
                    value={uploadForm.projectId} 
                    onValueChange={(value) => setUploadForm(prev => ({ ...prev, projectId: value }))}
                    disabled={uploadForm.clientId === "none"}
                  >
                    <SelectTrigger className={uploadForm.clientId === "none" ? "opacity-50 cursor-not-allowed" : ""}>
                      <SelectValue placeholder={
                        uploadForm.clientId === "none" 
                          ? "Select a client first" 
                          : filteredProjects.length === 0 
                            ? "No projects for this client" 
                            : "Select a project"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {filteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {uploadForm.clientId === "none" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Select a client first to see available projects
                    </p>
                  )}
                  {uploadForm.clientId !== "none" && filteredProjects.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No projects found for this client
                    </p>
                  )}
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
                          backgroundColor: `${customTagColors[tag] || getTagColor(tag)}20`,
                          borderColor: customTagColors[tag] || getTagColor(tag),
                          color: customTagColors[tag] || getTagColor(tag)
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
              <Button variant="outline" onClick={() => {
                setIsUploadDialogOpen(false)
                setSelectedFilesForUpload([])
                resetUploadForm()
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleUpload}
                disabled={selectedFilesForUpload.length === 0 || uploading}
              >
                {uploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Upload {selectedFilesForUpload.length > 0 ? `(${selectedFilesForUpload.length} files)` : ''}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit File: {editingFile?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* File Info Display */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  {editingFile && getFileIcon(editingFile.file_type)}
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{editingFile?.name}</div>
                    <div className="text-sm text-gray-500">{editingFile?.file_size_formatted}</div>
                  </div>
                </div>
              </div>

              {/* Edit Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-client">Link to Client (Optional)</Label>
                  <Select value={editForm.clientId} onValueChange={async (value) => {
                    setEditForm(prev => ({ ...prev, clientId: value }));
                    // Clear project selection when client changes
                    setEditForm(prev => ({ ...prev, projectId: "none" }));
                    
                    if (value === "none") {
                      setEditFilteredProjects([]);
                    } else {
                      try {
                        const projectsForClient = await getProjectsByClient(value);
                        setEditFilteredProjects(projectsForClient);
                      } catch (error) {
                        console.error('Error loading projects for client:', error);
                        toast.error('Failed to load projects for selected client');
                        setEditFilteredProjects([]);
                      }
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No client</SelectItem>
                      {availableClients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company || `${client.first_name} ${client.last_name}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-project">Link to Project (Optional)</Label>
                  <Select 
                    value={editForm.projectId} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, projectId: value }))}
                    disabled={editForm.clientId === "none"}
                  >
                    <SelectTrigger className={editForm.clientId === "none" ? "opacity-50 cursor-not-allowed" : ""}>
                      <SelectValue placeholder={
                        editForm.clientId === "none" 
                          ? "Select a client first" 
                          : editFilteredProjects.length === 0 
                            ? "No projects for this client" 
                            : "Select a project"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {editFilteredProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {editForm.clientId === "none" && (
                    <p className="text-sm text-gray-500 mt-1">
                      Select a client first to see available projects
                    </p>
                  )}
                  {editForm.clientId !== "none" && editFilteredProjects.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      No projects found for this client
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>Tags (Optional)</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {editForm.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => setEditForm(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tag)
                        }))}
                        style={{ 
                          backgroundColor: `${customTagColors[tag] || getTagColor(tag)}20`,
                          borderColor: customTagColors[tag] || getTagColor(tag),
                          color: customTagColors[tag] || getTagColor(tag)
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
                          if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
                            setEditForm(prev => ({
                              ...prev,
                              tags: [...prev.tags, newTag.trim()]
                            }))
                            setCustomTagColors(prev => ({
                              ...prev,
                              [newTag.trim()]: newTagColor
                            }))
                            setNewTag("")
                            setNewTagColor("#3B82F6")
                          }
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
                      onClick={() => {
                        if (newTag.trim() && !editForm.tags.includes(newTag.trim())) {
                          setEditForm(prev => ({
                            ...prev,
                            tags: [...prev.tags, newTag.trim()]
                          }))
                          setCustomTagColors(prev => ({
                            ...prev,
                            [newTag.trim()]: newTagColor
                          }))
                          setNewTag("")
                          setNewTagColor("#3B82F6")
                        }
                      }}
                      disabled={!newTag.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditDialogOpen(false)
                setEditingFile(null)
                resetEditForm()
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={editing}
              >
                {editing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Comment Dialog */}
        <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Comment to {selectedFileForComment?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Enter your comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internal"
                  checked={isInternalComment}
                  onCheckedChange={(checked) => setIsInternalComment(checked as boolean)}
                />
                <Label htmlFor="internal">Internal comment (not visible to clients)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAddComment}
                disabled={!commentContent.trim() || actionLoading === selectedFileForComment?.id}
              >
                {actionLoading === selectedFileForComment?.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Comment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dialog */}
        {selectedFileForView && (
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-7xl h-[95vh] max-h-[95vh]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {selectedFileForView.name}
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col h-full">
                <div className="flex-1 overflow-hidden">
                  {fileViewUrl ? (
                    <div className="w-full h-full">
                       {/* Image files */}
                       {['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-4">
                           <img 
                             src={fileViewUrl} 
                             alt={selectedFileForView.name}
                             className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                             style={{ maxHeight: 'calc(100vh - 200px)' }}
                             onError={() => {
                               toast.error('Unable to load image preview')
                             }}
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
                             onError={() => {
                               toast.error('Unable to load PDF preview')
                             }}
                           />
                         </div>
                       )}
                       
                       {/* Video files */}
                       {['MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MKV', 'M4V'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-4">
                           <video 
                             src={fileViewUrl}
                             controls
                             className="max-w-full max-h-full rounded-lg shadow-lg"
                             style={{ maxHeight: 'calc(100vh - 200px)' }}
                             onError={() => {
                               toast.error('Unable to load video preview')
                             }}
                           >
                             Your browser does not support the video tag.
                           </video>
                         </div>
                       )}
                       
                       {/* Audio files */}
                       {['MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', 'WMA'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-4">
                           <div className="text-center max-w-md">
                             <div className="mb-4">
                               <FileText className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                               <p className="text-gray-600 mb-4">{selectedFileForView.name}</p>
                             </div>
                             <audio 
                               src={fileViewUrl}
                               controls
                               className="w-full"
                               onError={() => {
                                 toast.error('Unable to load audio preview')
                               }}
                             >
                               Your browser does not support the audio tag.
                             </audio>
                           </div>
                         </div>
                       )}
                       
                       {/* Text files */}
                       {['TXT', 'CSV', 'JSON', 'XML', 'MD', 'LOG', 'RTF'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <p className="text-gray-600 mb-4">
                               Text files can be downloaded and opened in your preferred text editor
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to View
                             </Button>
                           </div>
                         </div>
                       )}
                       
                       {/* Document files */}
                       {['DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'ODT', 'ODS', 'ODP'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <p className="text-gray-600 mb-4">
                               Office documents can be downloaded and opened in Microsoft Office, Google Docs, or LibreOffice
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to View
                             </Button>
                           </div>
                         </div>
                       )}
                       
                       {/* Code files */}
                       {['JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'SASS', 'LESS', 'PY', 'JAVA', 'CPP', 'C', 'PHP', 'RUBY', 'GO', 'RUST', 'SWIFT', 'KOTLIN', 'SCALA', 'R', 'MATLAB', 'SQL', 'SH', 'BAT', 'PS1'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <p className="text-gray-600 mb-4">
                               Code files can be downloaded and opened in your preferred code editor
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to View
                             </Button>
                           </div>
                         </div>
                       )}
                       
                       {/* Archive files */}
                       {['ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'XZ'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <p className="text-gray-600 mb-4">
                               Archive files can be downloaded and extracted using your preferred compression tool
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to Extract
                             </Button>
                           </div>
                         </div>
                       )}
                       
                       {/* Design files */}
                       {['FIG', 'SKETCH', 'XD', 'AI', 'PSD', 'EPS', 'SVG'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                             <p className="text-gray-600 mb-4">
                               Design files can be downloaded and opened in their respective design applications
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to View
                             </Button>
                           </div>
                         </div>
                       )}
                       
                       {/* Other file types */}
                       {!['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'BMP', 'WEBP', 'PDF', 'MP4', 'AVI', 'MOV', 'WMV', 'FLV', 'WEBM', 'MKV', 'M4V', 'MP3', 'WAV', 'AAC', 'OGG', 'FLAC', 'M4A', 'WMA', 'TXT', 'CSV', 'JSON', 'XML', 'MD', 'LOG', 'RTF', 'DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX', 'ODT', 'ODS', 'ODP', 'JS', 'TS', 'JSX', 'TSX', 'HTML', 'CSS', 'SCSS', 'SASS', 'LESS', 'PY', 'JAVA', 'CPP', 'C', 'PHP', 'RUBY', 'GO', 'RUST', 'SWIFT', 'KOTLIN', 'SCALA', 'R', 'MATLAB', 'SQL', 'SH', 'BAT', 'PS1', 'ZIP', 'RAR', '7Z', 'TAR', 'GZ', 'BZ2', 'XZ', 'FIG', 'SKETCH', 'XD', 'AI', 'PSD', 'EPS'].includes(selectedFileForView.file_type.toUpperCase()) && (
                         <div className="w-full h-full flex items-center justify-center p-8">
                           <div className="text-center max-w-md">
                             {getFileIcon(selectedFileForView.file_type)}
                             <p className="text-gray-600 mt-4 mb-4">
                               Preview not available for {selectedFileForView.file_type} files
                             </p>
                             <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                               <Download className="h-4 w-4 mr-2" />
                               Download to View
                             </Button>
                           </div>
                         </div>
                       )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                      <p className="text-gray-600">Loading file for viewing...</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => handleFileAction("download", selectedFileForView)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </DialogFooter>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  )
}
