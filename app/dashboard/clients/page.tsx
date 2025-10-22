"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardLayout } from "@/components/dashboard/layout"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  MessageCircle,
  CreditCard,
  Edit,
  Archive,
  ExternalLink,
  FileText,
  Upload,
  Grid3X3,
  List,
  Phone,
  Mail,
  Building2,
  Tag,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2,
  CalendarDays,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Settings } from "lucide-react"
import { 
  getClients, 
  createClient, 
  updateClient, 
  deleteClient, 
  archiveClient,
  restoreClient,
  getClientTags,
  getAccountTags,
  standardTags,
  getTagColor,
  getClientActivities,
  getClientInvoices,
  getClientProjects,
  getClientFiles,
  type Client 
} from "@/lib/clients"
import { getInvoicesByClient } from "@/lib/invoices"
import { getProjectsByClient } from "@/lib/projects"
import { getFiles } from "@/lib/files"
import { createClient as createSupabaseClient } from "@/lib/supabase/client"

const tagOptions = ["VIP", "Enterprise", "Startup", "Design", "Marketing", "Retainer", "Completed"]

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isAddClientOpen, setIsAddClientOpen] = useState(false)
  const [isEditClientOpen, setIsEditClientOpen] = useState(false)
  const [isClientDetailOpen, setIsClientDetailOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [clientTags, setClientTags] = useState<Record<string, string[]>>({})
  const [clientTagColors, setClientTagColors] = useState<Record<string, Record<string, string>>>({})
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  
  // Additional client data state
  const [clientActivities, setClientActivities] = useState<Record<string, any[]>>({})
  const [clientInvoices, setClientInvoices] = useState<Record<string, any[]>>({})
  const [clientProjects, setClientProjects] = useState<Record<string, any[]>>({})
  const [clientFiles, setClientFiles] = useState<Record<string, any[]>>({})
  const [loadingClientData, setLoadingClientData] = useState<Record<string, boolean>>({})
  
  const [newClient, setNewClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    portalUrl: "",
    tags: [] as Array<{ name: string; color?: string }>,
  })

  const [editClient, setEditClient] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    phone: "",
    portalUrl: "",
    tags: [] as Array<{ name: string; color?: string }>,
  })

  const [newTag, setNewTag] = useState("")
  const [newTagColor, setNewTagColor] = useState("#6B7280")
  const [addNewTag, setAddNewTag] = useState("")
  const [editNewTag, setEditNewTag] = useState("")
  const [addNewTagColor, setAddNewTagColor] = useState("#6B7280")
  const [editNewTagColor, setEditNewTagColor] = useState("#6B7280")
  const [customTagColors, setCustomTagColors] = useState<Record<string, string>>({})

  const router = useRouter()

  // Load clients on component mount
  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      setLoading(true)
      
      
      const clientsData = await getClients()
      setClients(clientsData)
      
      // Load tags for each client
      const tagsData: Record<string, string[]> = {}
      const tagColorsData: Record<string, Record<string, string>> = {}
      for (const client of clientsData) {
        try {
          const tags = await getClientTags(client.id)
          tagsData[client.id] = tags.map(tag => tag.tag_name)
          tagColorsData[client.id] = tags.reduce((acc, tag) => {
            acc[tag.tag_name] = tag.color
            return acc
          }, {} as Record<string, string>)
        } catch (error) {
          console.error(`Error loading tags for client ${client.id}:`, error)
          tagsData[client.id] = []
          tagColorsData[client.id] = {}
        }
      }
      setClientTags(tagsData)
      setClientTagColors(tagColorsData)
      
      // Load available tags for filtering
      const accountTags = await getAccountTags()
      setAvailableTags(accountTags)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoading(false)
    }
  }

  const loadClientData = async (clientId: string) => {
    if (loadingClientData[clientId]) return // Prevent duplicate loading
    
    try {
      setLoadingClientData(prev => ({ ...prev, [clientId]: true }))
      
      const [activities, invoices, projects, files] = await Promise.all([
        getClientActivities(clientId),
        getInvoicesByClient(clientId),
        getProjectsByClient(clientId),
        getFiles().then(allFiles => allFiles.filter(file => file.client_id === clientId))
      ])
      
      console.log(`Loaded data for client ${clientId}:`, {
        activities: activities?.length || 0,
        invoices: invoices?.length || 0,
        projects: projects?.length || 0,
        files: files?.length || 0
      })
      
      setClientActivities(prev => ({ ...prev, [clientId]: activities || [] }))
      setClientInvoices(prev => ({ ...prev, [clientId]: invoices || [] }))
      setClientProjects(prev => ({ ...prev, [clientId]: projects || [] }))
      setClientFiles(prev => ({ ...prev, [clientId]: files || [] }))
      
    } catch (error) {
      console.error(`Error loading data for client ${clientId}:`, error)
      toast.error('Failed to load client data')
      
      // Set empty arrays on error to prevent undefined states
      setClientActivities(prev => ({ ...prev, [clientId]: [] }))
      setClientInvoices(prev => ({ ...prev, [clientId]: [] }))
      setClientProjects(prev => ({ ...prev, [clientId]: [] }))
      setClientFiles(prev => ({ ...prev, [clientId]: [] }))
    } finally {
      setLoadingClientData(prev => ({ ...prev, [clientId]: false }))
    }
  }

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || client.status === statusFilter
    
    const clientTagsList = clientTags[client.id] || []
    const matchesTag = tagFilter === "all" || clientTagsList.some(tag => tag.toLowerCase() === tagFilter.toLowerCase())

    return matchesSearch && matchesStatus && matchesTag
  })

  const handleAddClient = async () => {
    if (!newClient.firstName || !newClient.lastName || !newClient.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const createdClient = await createClient({
        first_name: newClient.firstName,
        last_name: newClient.lastName,
        email: newClient.email,
        company: newClient.company || undefined,
        phone: newClient.phone || undefined,
        portal_url: newClient.portalUrl || undefined,
        tags: newClient.tags,
      })

      if (createdClient) {
        toast.success('Client created successfully')
    setIsAddClientOpen(false)
        
        // Add the new client to local state instead of reloading
        setClients(prevClients => [createdClient, ...prevClients])
        
        // Add client tags to local state
        const newClientTags = newClient.tags.map(tag => tag.name)
        setClientTags(prev => ({
          ...prev,
          [createdClient.id]: newClientTags
        }))
        
        // Add client tag colors to local state
        const newClientTagColors: Record<string, string> = {}
        newClient.tags.forEach(tag => {
          newClientTagColors[tag.name] = tag.color || getTagDisplayColor(tag.name)
        })
        setClientTagColors(prev => ({
          ...prev,
          [createdClient.id]: newClientTagColors
        }))
        
    setNewClient({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      phone: "",
          portalUrl: "",
      tags: [],
    })
  }
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Failed to create client')
    } finally {
      setSaving(false)
    }
  }

  const handleEditClient = async () => {
    if (!selectedClient || !editClient.firstName || !editClient.lastName || !editClient.email) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      const updatedClient = await updateClient(selectedClient.id, {
        first_name: editClient.firstName,
        last_name: editClient.lastName,
        email: editClient.email,
        company: editClient.company || undefined,
        phone: editClient.phone || undefined,
        portal_url: editClient.portalUrl || undefined,
        tags: editClient.tags,
      })

      if (updatedClient) {
        toast.success('Client updated successfully')
        setIsEditClientOpen(false)
        
        // Update local state instead of reloading
        setClients(prevClients => 
          prevClients.map(client => 
            client.id === selectedClient.id 
              ? {
                  ...client,
                  first_name: editClient.firstName,
                  last_name: editClient.lastName,
                  email: editClient.email,
                  company: editClient.company || null,
                  phone: editClient.phone || null,
                  portal_url: editClient.portalUrl || null,
                }
              : client
          )
        )
        
        // Update client tags locally
        const updatedTags = editClient.tags.map(tag => tag.name)
        setClientTags(prev => ({
          ...prev,
          [selectedClient.id]: updatedTags
        }))
        
        // Update client tag colors locally
        const updatedTagColors: Record<string, string> = {}
        editClient.tags.forEach(tag => {
          updatedTagColors[tag.name] = tag.color || getTagDisplayColor(tag.name)
        })
        setClientTagColors(prev => ({
          ...prev,
          [selectedClient.id]: updatedTagColors
        }))
      }
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selectedClient) return

    try {
      setDeleting(true)
      console.log('Starting delete process for client:', selectedClient.id)
      await deleteClient(selectedClient.id)
      toast.success('Client deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedClient(null) // Clear the selected client
      
      // Remove from local state instead of reloading
      setClients(prevClients => 
        prevClients.filter(client => client.id !== selectedClient.id)
      )
      
      // Clean up client tags
      setClientTags(prev => {
        const newTags = { ...prev }
        delete newTags[selectedClient.id]
        return newTags
      })
      
      // Clean up client tag colors
      setClientTagColors(prev => {
        const newColors = { ...prev }
        delete newColors[selectedClient.id]
        return newColors
      })
    } catch (error) {
      console.error('Error deleting client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client'
      toast.error(errorMessage)
    } finally {
      setDeleting(false)
    }
  }

  const handleArchiveClient = async (client: Client) => {
    try {
      await archiveClient(client.id)
      toast.success('Client archived successfully')
      
      // Update local state instead of reloading
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id 
            ? { ...c, status: 'archived' as const }
            : c
        )
      )
    } catch (error) {
      console.error('Error archiving client:', error)
      toast.error('Failed to archive client')
    }
  }

  const handleRestoreClient = async (client: Client) => {
    try {
      await restoreClient(client.id)
      toast.success('Client restored successfully')
      
      // Update local state instead of reloading
      setClients(prevClients => 
        prevClients.map(c => 
          c.id === client.id 
            ? { ...c, status: 'active' as const }
            : c
        )
      )
    } catch (error) {
      console.error('Error restoring client:', error)
      toast.error('Failed to restore client')
    }
  }

  const handleClientAction = (action: string, client: Client) => {
    setSelectedClient(client)
    
    switch (action) {
      case "view":
        setIsClientDetailOpen(true)
        loadClientData(client.id)
        break
      case "edit":
        setNewClient({
          firstName: client.first_name || "",
          lastName: client.last_name || "",
          email: client.email || "",
          company: client.company || "",
          phone: client.phone || "",
          portalUrl: client.portal_url || "",
          tags: (clientTags[client.id] || []).map(tagName => ({
            name: tagName,
            color: clientTagColors[client.id]?.[tagName] || getTagDisplayColor(tagName, client.id)
          })),
        })
        setIsEditClientOpen(true)
        break
      case "delete":
        setIsDeleteDialogOpen(true)
        break
      case "archive":
        handleArchiveClient(client)
        break
      case "restore":
        handleRestoreClient(client)
        break
    }
  }


  const getActivityIcon = (type: string) => {
    switch (type) {
      case "file":
        return <Upload className="h-4 w-4 text-blue-500" />
      case "payment":
        return <DollarSign className="h-4 w-4 text-green-500" />
      case "message":
        return <MessageCircle className="h-4 w-4 text-purple-500" />
      case "form":
        return <FileText className="h-4 w-4 text-orange-500" />
      case "login":
        return <Eye className="h-4 w-4 text-indigo-500" />
      case "portal_access":
        return <ExternalLink className="h-4 w-4 text-teal-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const addTagToClient = (clientId: string, tagName: string) => {
    const currentTags = clientTags[clientId] || []
    if (!currentTags.includes(tagName)) {
      setClientTags(prev => ({
        ...prev,
        [clientId]: [...currentTags, tagName]
      }))
    }
  }

  const removeTagFromClient = (clientId: string, tagName: string) => {
    const currentTags = clientTags[clientId] || []
    setClientTags(prev => ({
      ...prev,
      [clientId]: currentTags.filter(tag => tag !== tagName)
    }))
  }

  const addTagToNewClient = (tagName: string) => {
    if (!newClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const tagColor = addNewTagColor || getTagDisplayColor(tagName)
      setNewClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: tagColor }]
      }))
    }
  }

  const addTagToNewClientWithColor = (tagName: string, color: string) => {
    if (!newClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setNewClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: color }]
      }))
    }
  }

  const removeTagFromNewClient = (tagName: string) => {
    setNewClient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }))
  }

  const addTagToEditClient = (tagName: string) => {
    if (!editClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      const tagColor = editNewTagColor || getTagDisplayColor(tagName)
      setEditClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: tagColor }]
      }))
    }
  }

  const addTagToEditClientWithColor = (tagName: string, color: string) => {
    if (!editClient.tags.some(tag => tag.name.toLowerCase() === tagName.toLowerCase())) {
      setEditClient(prev => ({
        ...prev,
        tags: [...prev.tags, { name: tagName, color: color }]
      }))
    }
  }

  const removeTagFromEditClient = (tagName: string) => {
    setEditClient(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag.name !== tagName)
    }))
  }

  const createCustomTag = (dialogType: 'add' | 'edit') => {
    const tagValue = dialogType === 'add' ? addNewTag : editNewTag
    const tagColor = dialogType === 'add' ? addNewTagColor : editNewTagColor
    
    if (tagValue.trim()) {
      // Check if tag already exists for this client
      const currentTags = dialogType === 'add' ? newClient.tags : editClient.tags
      if (currentTags.some(tag => tag.name.toLowerCase() === tagValue.trim().toLowerCase())) {
        toast.error('This tag is already added to this client')
        return
      }
      
      // Store the custom tag color
      setCustomTagColors(prev => ({
        ...prev,
        [tagValue.trim()]: tagColor
      }))
      
      // Add to available tags if it's a new tag
      if (!availableTags.includes(tagValue.trim())) {
        setAvailableTags(prev => [...prev, tagValue.trim()])
      }
      
      // Add to the current client's tags with the custom color
      if (dialogType === 'add') {
        addTagToNewClient(tagValue.trim())
        setAddNewTag("")
        setAddNewTagColor("#6B7280")
        toast.success(`Added tag "${tagValue.trim()}"`)
      } else {
        addTagToEditClient(tagValue.trim())
        setEditNewTag("")
        setEditNewTagColor("#6B7280")
        toast.success(`Added tag "${tagValue.trim()}"`)
      }
    } else {
      toast.error('Please enter a tag name')
    }
  }

  const handleEnterKey = (dialogType: 'add' | 'edit', e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      createCustomTag(dialogType)
    }
  }

  // Helper function to get tag color for display
  const getTagDisplayColor = (tagName: string, clientId?: string) => {
    // First check if we have a stored color for this tag from the database
    if (clientId && clientTagColors[clientId] && clientTagColors[clientId][tagName]) {
      return clientTagColors[clientId][tagName]
    }
    
    // Check if it's a standard tag
    const standardTag = standardTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Check if it's a custom tag with stored color
    if (customTagColors[tagName]) {
      return customTagColors[tagName]
    }
    
    // Default color
    return '#6B7280'
  }

  // Helper function to get the most common color for a tag across all clients
  const getTagFilterColor = (tagName: string) => {
    // First check if it's a standard tag
    const standardTag = standardTags.find(tag => tag.name.toLowerCase() === tagName.toLowerCase())
    if (standardTag) {
      return standardTag.color
    }
    
    // Check if we have any stored colors for this tag across all clients
    const colors: string[] = []
    Object.values(clientTagColors).forEach(clientColors => {
      if (clientColors[tagName]) {
        colors.push(clientColors[tagName])
      }
    })
    
    // Return the most common color, or the first one found
    if (colors.length > 0) {
      // Count occurrences of each color
      const colorCounts = colors.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      // Find the most common color
      const mostCommonColor = Object.entries(colorCounts).reduce((a, b) => 
        colorCounts[a[0]] > colorCounts[b[0]] ? a : b
      )[0]
      
      return mostCommonColor
    }
    
    // Check if it's a custom tag with stored color
    if (customTagColors[tagName]) {
      return customTagColors[tagName]
    }
    
    // Default color
    return '#6B7280'
  }

  const formatFileSize = (bytes: number, decimalPoint = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimalPoint < 0 ? 0 : decimalPoint;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  if (loading) {
  return (
      <DashboardLayout>
        <div className="bg-gray-50 min-h-screen -m-6 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gray-50 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-2">Manage all your clients from one place</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("table")}
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => setIsAddClientOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                      Add Client
                    </Button>
          </div>
        </div>

        {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
                />
              </div>
          <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-[180px]">
                    <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
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
              </div>
            </div>

        {/* Client Count */}
        <div className="text-sm text-gray-600">
          {loading ? (
            <span>Loading clients...</span>
          ) : (
            `${filteredClients.length} client${filteredClients.length !== 1 ? "s" : ""} found`
          )}
        </div>

        {/* Clients Table */}
        {viewMode === "table" && (
          <Card>
            <CardContent className="p-0">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
                  <span className="ml-2 text-gray-600">Loading clients...</span>
                </div>
              ) : (
              <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-4 font-medium text-gray-900">Client</th>
                      <th className="text-left p-4 font-medium text-gray-900">Company</th>
                      <th className="text-left p-4 font-medium text-gray-900">Status</th>
                      <th className="text-left p-4 font-medium text-gray-900">Projects</th>
                      <th className="text-left p-4 font-medium text-gray-900">Invoices</th>
                      <th className="text-left p-4 font-medium text-gray-900">Last Activity</th>
                      <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                        className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleClientAction("view", client)}
                    >
                        <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {client.avatar_initials || `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                              <div className="font-medium text-gray-900">
                                {client.first_name} {client.last_name}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </div>
                      </td>
                        <td className="p-4">
                          <span className="text-gray-900">{client.company || "—"}</span>
                      </td>
                        <td className="p-4">
                          <Badge
                            variant={client.status === "active" ? "default" : "secondary"}
                            className={
                              client.status === "active"
                                ? "bg-green-100 text-green-800"
                                : client.status === "archived"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-yellow-100 text-yellow-800"
                            }
                          >
                            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                          </Badge>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(clientTags[client.id] || []).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                                style={{ 
                                  backgroundColor: `${getTagDisplayColor(tag, client.id)}20`,
                                  borderColor: getTagDisplayColor(tag, client.id),
                                  color: getTagDisplayColor(tag, client.id)
                                }}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-gray-900">{client.project_count}</span>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="text-gray-900">{client.total_invoices} total</div>
                            <div className="text-gray-500">{client.paid_invoices} paid</div>
                        </div>
                      </td>
                        <td className="p-4">
                          <span className="text-gray-600">
                            {client.last_activity_at ? formatDate(client.last_activity_at) : "Never"}
                          </span>
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                          <Button
                                variant="ghost" 
                            size="sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                                  handleClientAction("view", client)
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClientAction("edit", client)
                            }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Client
                              </DropdownMenuItem>
                              {client.portal_url && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleClientAction("portal", client)
                                  }}
                          >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                            View Portal
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                                  handleClientAction("archive", client)
                                }}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              {client.status === "archived" && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleClientAction("restore", client)
                            }}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Make Active
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClientAction("delete", client)
                                }}
                                className="text-red-600"
                          >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            </CardContent>
          </Card>
        )}

        {/* Clients Grid */}
        {viewMode === "grid" && (
          <>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
                <span className="ml-2 text-gray-600">Loading clients...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                  <Card
                    key={client.id}
                    className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-200 rounded-2xl cursor-pointer group hover:border-[#3C3CFF]/20"
                    onClick={() => handleClientAction("view", client)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium text-lg">
                              {client.avatar_initials || `${client.first_name.charAt(0)}${client.last_name.charAt(0)}`}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900 group-hover:text-[#3C3CFF] transition-colors">
                              {client.first_name} {client.last_name}
                            </p>
                            <p className="text-sm text-gray-600">{client.company || "No company"}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClientAction("view", client)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClientAction("edit", client)
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Client
                            </DropdownMenuItem>
                            {client.portal_url && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClientAction("portal", client)
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View Portal
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClientAction("archive", client)
                              }}
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            {client.status === "archived" && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleClientAction("restore", client)
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Make Active
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleClientAction("delete", client)
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Status</span>
                          <Badge
                            variant={client.status === "active" ? "default" : "secondary"}
                            className={
                              client.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                            }
                          >
                            {client.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {(clientTags[client.id] || []).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${getTagDisplayColor(tag, client.id)}20`,
                                borderColor: getTagDisplayColor(tag, client.id),
                                color: getTagDisplayColor(tag, client.id)
                              }}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Projects</span>
                          <span className="text-sm text-gray-900 font-medium">{client.project_count}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Invoices</span>
                          <span className="text-sm text-gray-900 font-medium">{client.total_invoices} total</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Files</span>
                          <span className="text-sm text-gray-900 font-medium">{client.files_uploaded}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Last Activity</span>
                          <span className="text-sm text-gray-500">
                            {client.last_activity_at ? formatDate(client.last_activity_at) : "Never"}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                            handleClientAction("view", client)
                            }}
                            className="flex-1 text-[#3C3FF] border-[#3C3FF] hover:bg-[#F0F2FF]"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                          View
                          </Button>
                        {client.portal_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleClientAction("portal", client)
                            }}
                            className="flex-1 text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF]"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Portal
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* Add Client Dialog */}
        <Dialog open={isAddClientOpen} onOpenChange={setIsAddClientOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newClient.firstName}
                    onChange={(e) => setNewClient({ ...newClient, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newClient.lastName}
                    onChange={(e) => setNewClient({ ...newClient, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={newClient.company}
                  onChange={(e) => setNewClient({ ...newClient, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="portalUrl">Portal URL</Label>
                <Input
                  id="portalUrl"
                  value={newClient.portalUrl}
                  onChange={(e) => setNewClient({ ...newClient, portalUrl: e.target.value })}
                  placeholder="company-name"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {newClient.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => removeTagFromNewClient(tag.name)}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Standard Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {standardTags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          className="cursor-pointer hover:opacity-80"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          }}
                          onClick={() => addTagToNewClientWithColor(tag.name, tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Custom Tag:</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom tag"
                        value={addNewTag}
                        onChange={(e) => setAddNewTag(e.target.value)}
                        onKeyPress={(e) => handleEnterKey('add', e)}
                      />
                      <input
                        type="color"
                        value={addNewTagColor}
                        onChange={(e) => setAddNewTagColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title="Choose tag color"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createCustomTag('add')}
                        disabled={!addNewTag.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {addNewTag.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Preview:</span>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddClient} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Client Dialog */}
        <Dialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={editClient.firstName}
                    onChange={(e) => setEditClient({ ...editClient, firstName: e.target.value })}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={editClient.lastName}
                    onChange={(e) => setEditClient({ ...editClient, lastName: e.target.value })}
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editEmail">Email *</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editClient.email}
                  onChange={(e) => setEditClient({ ...editClient, email: e.target.value })}
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <Label htmlFor="editCompany">Company</Label>
                <Input
                  id="editCompany"
                  value={editClient.company}
                  onChange={(e) => setEditClient({ ...editClient, company: e.target.value })}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone</Label>
                <Input
                  id="editPhone"
                  value={editClient.phone}
                  onChange={(e) => setEditClient({ ...editClient, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="editPortalUrl">Portal URL</Label>
                <Input
                  id="editPortalUrl"
                  value={editClient.portalUrl}
                  onChange={(e) => setEditClient({ ...editClient, portalUrl: e.target.value })}
                  placeholder="company-name"
                />
              </div>
              <div>
                <Label>Tags</Label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {editClient.tags.map((tag) => (
                      <Badge
                        key={tag.name}
                        variant="outline"
                        className="cursor-pointer"
                        style={{ 
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color
                        }}
                        onClick={() => removeTagFromEditClient(tag.name)}
                      >
                        {tag.name} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Standard Tags:</div>
                    <div className="flex flex-wrap gap-2">
                      {standardTags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="outline"
                          className="cursor-pointer hover:opacity-80"
                          style={{ 
                            backgroundColor: `${tag.color}20`,
                            borderColor: tag.color,
                            color: tag.color
                          }}
                          onClick={() => addTagToEditClientWithColor(tag.name, tag.color)}
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">Custom Tag:</div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter custom tag"
                        value={editNewTag}
                        onChange={(e) => setEditNewTag(e.target.value)}
                        onKeyPress={(e) => handleEnterKey('edit', e)}
                      />
                      <input
                        type="color"
                        value={editNewTagColor}
                        onChange={(e) => setEditNewTagColor(e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        title="Choose tag color"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createCustomTag('edit')}
                        disabled={!editNewTag.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    {editNewTag.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Preview:</span>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditClientOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditClient} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Client</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete{" "}
                <span className="font-medium">
                  {selectedClient?.first_name} {selectedClient?.last_name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteClient} disabled={deleting}>
                {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Client
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Client Detail Sheet */}
        <Sheet open={isClientDetailOpen} onOpenChange={setIsClientDetailOpen}>
          <SheetContent className="w-full sm:max-w-2xl">
            {selectedClient && (
              <div>
                <SheetHeader className="pb-6">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium text-xl">
                        {selectedClient.avatar_initials || `${selectedClient.first_name.charAt(0)}${selectedClient.last_name.charAt(0)}`}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-2xl">
                        {selectedClient.first_name} {selectedClient.last_name}
                      </SheetTitle>
                      <p className="text-gray-600">{selectedClient.company}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={selectedClient.status === "active" ? "default" : "secondary"}
                          className={
                            selectedClient.status === "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }
                        >
                          {selectedClient.status}
                        </Badge>
                        {(clientTags[selectedClient.id] || []).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="text-xs"
                            style={{ 
                              backgroundColor: `${getTagDisplayColor(tag, selectedClient.id)}20`,
                              borderColor: getTagDisplayColor(tag, selectedClient.id),
                              color: getTagDisplayColor(tag, selectedClient.id)
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetHeader>

                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="invoices">Invoices</TabsTrigger>
                    <TabsTrigger value="projects">Projects</TabsTrigger>
                    <TabsTrigger value="files">Files</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.email}</p>
                            <p className="text-sm text-gray-600">Email</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.phone || "No phone number"}</p>
                            <p className="text-sm text-gray-600">Phone</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{selectedClient.company || "No company"}</p>
                            <p className="text-sm text-gray-600">Company</p>
                          </div>
                        </div>
                        {selectedClient.portal_url && (
                        <div className="flex items-center space-x-3">
                          <ExternalLink className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-[#3C3CFF] cursor-pointer hover:underline">
                                {selectedClient.portal_url}
                            </p>
                            <p className="text-sm text-gray-600">Portal URL</p>
                          </div>
                        </div>
                        )}
                        <div className="flex items-center space-x-3">
                          <CalendarDays className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{formatDate(selectedClient.joined_date)}</p>
                            <p className="text-sm text-gray-600">Joined Date</p>
                          </div>
                        </div>
                        {selectedClient.last_activity_at && (
                          <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="font-medium">{formatDate(selectedClient.last_activity_at)}</p>
                              <p className="text-sm text-gray-600">Last Activity</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.total_invoices || 0}</p>
                              <p className="text-sm text-gray-600">Total Invoices</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-[#3C3CFF]" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">
                                ${(selectedClient.unpaid_amount || 0).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-600">Unpaid Amount</p>
                            </div>
                            <DollarSign className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.files_uploaded || 0}</p>
                              <p className="text-sm text-gray-600">Files Uploaded</p>
                            </div>
                            <Upload className="h-8 w-8 text-blue-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-gray-900">{selectedClient.forms_submitted || 0}</p>
                              <p className="text-sm text-gray-600">Forms Submitted</p>
                            </div>
                            <FileText className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading activities...</span>
                          </div>
                        ) : clientActivities[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientActivities[selectedClient.id].map((activity) => (
                              <div key={activity.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                                <div className="flex-shrink-0">
                                  {getActivityIcon(activity.activity_type || 'default')}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{activity.action || 'Unknown action'}</p>
                                  <p className="text-xs text-gray-600">{formatDate(activity.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No recent activity found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="invoices" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-green-600">{selectedClient.paid_invoices}</p>
                              <p className="text-sm text-gray-600">Paid Invoices</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-white border-0 shadow-sm rounded-2xl">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-red-600">
                                {selectedClient.total_invoices - selectedClient.paid_invoices}
                              </p>
                              <p className="text-sm text-gray-600">Unpaid Invoices</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Invoice History</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading invoices...</span>
                          </div>
                        ) : clientInvoices[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientInvoices[selectedClient.id].map((invoice) => (
                              <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div>
                                  <p className="font-medium">{invoice.title || `Invoice #${invoice.invoice_number}`}</p>
                                  <p className="text-sm text-gray-600">{formatDate(invoice.issue_date)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${(invoice.total_amount || 0).toLocaleString()}</p>
                                  <Badge 
                                    className={
                                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                                      invoice.status === 'overdue' ? 'bg-red-100 text-red-700' :
                                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                      invoice.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                      'bg-blue-100 text-blue-700'
                                    }
                                  >
                                    {invoice.status || 'unknown'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No invoices found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Client Projects</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading projects...</span>
                          </div>
                        ) : clientProjects[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientProjects[selectedClient.id].map((project) => (
                              <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div>
                                  <p className="font-medium">{project.name || 'Unnamed Project'}</p>
                                  <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
                                </div>
                                <div className="text-right">
                                  <Badge 
                                    className={
                                      project.status === 'completed' ? 'bg-green-100 text-green-700' :
                                      project.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                      project.status === 'on-hold' ? 'bg-yellow-100 text-yellow-700' :
                                      project.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                      'bg-gray-100 text-gray-700'
                                    }
                                  >
                                    {project.status || 'unknown'}
                                  </Badge>
                                  <p className="text-sm text-gray-600 mt-1">{formatDate(project.created_at)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No projects found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="files" className="space-y-4">
                    <Card className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardHeader>
                        <CardTitle className="text-lg">Files & Documents</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loadingClientData[selectedClient.id] ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                            <span className="ml-2 text-gray-600">Loading files...</span>
                          </div>
                        ) : clientFiles[selectedClient.id]?.length > 0 ? (
                          <div className="space-y-3">
                            {clientFiles[selectedClient.id].map((file) => (
                              <div key={file.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <FileText className="h-5 w-5 text-gray-400" />
                                  <div>
                                    <p className="font-medium">{file.name || 'Unnamed File'}</p>
                                    <p className="text-sm text-gray-600">{file.file_type || 'Unknown'} • {formatFileSize(file.file_size || 0)}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600">{formatDate(file.created_at)}</p>
                                  <Badge 
                                    className={
                                      file.approval_status === 'approved' ? 'bg-green-100 text-green-700' :
                                      file.approval_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                      file.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }
                                  >
                                    {file.approval_status || 'unknown'}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-600 text-center py-8">No files found for this client.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </SheetContent>
        </Sheet>

      </div>
    </DashboardLayout>
  )
}
