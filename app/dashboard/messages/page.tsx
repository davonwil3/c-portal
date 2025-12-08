"use client"

import React, { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTour } from "@/contexts/TourContext"
import { dummyMessages, dummyClients, dummyProjects } from "@/lib/tour-dummy-data"
import { getProjectsWithMessages, getProjectMessages, sendMessage, getStarredConversations, starConversation, unstarConversation, markProjectMessagesAsRead, type ProjectWithMessages, type FormattedMessage } from "@/lib/messages"
import { getProject } from "@/lib/projects"
import { getCurrentAccount } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  MessageSquare,
  Mail,
  Search,
  Star,
  Paperclip,
  Sparkles,
  Send,
  ExternalLink,
  Check,
  ChevronDown,
  Reply,
  ReplyAll,
  Forward,
  Plus,
  Edit,
  Copy,
  Trash2,
  X,
  Users,
  Download,
  Loader2,
} from "lucide-react"

export default function MessagesPage() {
  const { isTourRunning, currentTour } = useTour()
  const [activeTab, setActiveTab] = useState("portal")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [isNewEmail, setIsNewEmail] = useState(false)
  const [portalComposer, setPortalComposer] = useState("")
  const [emailComposer, setEmailComposer] = useState({ 
    to: [] as Array<{ email: string; name?: string; type?: 'to' | 'cc' }>, 
    cc: [] as Array<{ email: string; name?: string }>,
    subject: "", 
    body: "",
    selectedClient: null as string | null,
    selectedProject: null as string | null
  })
  const [toInputValue, setToInputValue] = useState("")
  const [toInputOpen, setToInputOpen] = useState(false)
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | null>(null)
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerTab, setDrawerTab] = useState<"templates" | "ai">("templates")
  const [templatesModalOpen, setTemplatesModalOpen] = useState(false)
  const [templateType, setTemplateType] = useState<"premade" | "saved">("premade")
  const [templateEditorModalOpen, setTemplateEditorModalOpen] = useState(false)
  const [aiHelpOpen, setAiHelpOpen] = useState(false)
  const [aiHelpInput, setAiHelpInput] = useState("")
  const [portalAiHelpOpen, setPortalAiHelpOpen] = useState(false)
  const [portalAiHelpInput, setPortalAiHelpInput] = useState("")
  
  // Real data state
  const [realProjects, setRealProjects] = useState<ProjectWithMessages[]>([])
  const [realMessages, setRealMessages] = useState<FormattedMessage[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const portalFileInputRef = React.useRef<HTMLInputElement>(null)
  
  // Search and filter state
  const [projectSearchQuery, setProjectSearchQuery] = useState("")
  const [starredProjects, setStarredProjects] = useState<Set<string>>(new Set())
  const [projectFilter, setProjectFilter] = useState<"all" | "unread" | "starred">("all")
  
  // Refs for scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const messagesScrollAreaRef = React.useRef<HTMLDivElement>(null)

  // Load projects and starred conversations on mount
  useEffect(() => {
    if (!isTourRunning) {
      loadProjects()
      loadStarredConversations()
    } else {
      // During tour, set mock project as selected
      setSelectedProject("p1")
    }
  }, [isTourRunning])

  // Load messages when project changes
  useEffect(() => {
    if (!isTourRunning && selectedProject) {
      // Only load if it's a real project (not a mock project ID)
      if (selectedProject !== "p1" && selectedProject !== "p2" && selectedProject !== "p3") {
        loadMessages(selectedProject)
      } else if (isTourRunning) {
        // During tour, use mock data
        setRealMessages([])
      }
    }
  }, [selectedProject, isTourRunning])

  // Mark messages as read when messages are loaded and visible
  useEffect(() => {
    if (realMessages.length > 0 && selectedProject && selectedProject !== "p1" && selectedProject !== "p2" && selectedProject !== "p3" && !isTourRunning && !loadingMessages) {
      // Small delay to ensure messages are rendered before marking as read
      const timer = setTimeout(() => {
        markMessagesAsReadOnView(selectedProject)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [realMessages.length, selectedProject, isTourRunning, loadingMessages])

  const loadProjects = async () => {
    try {
      setLoadingProjects(true)
      const projects = await getProjectsWithMessages()
      setRealProjects(projects)
      // Auto-select first project if available and no project is selected
      if (projects.length > 0 && !selectedProject) {
        setSelectedProject(projects[0].id)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadStarredConversations = async () => {
    try {
      const starred = await getStarredConversations()
      setStarredProjects(starred)
    } catch (error) {
      console.error('Error loading starred conversations:', error)
    }
  }

  const loadMessages = async (projectId: string) => {
    try {
      setLoadingMessages(true)
      const messages = await getProjectMessages(projectId)
      setRealMessages(messages)
      
      // Mark messages as read when viewing the conversation
      await markMessagesAsReadOnView(projectId)
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Mark messages as read when viewed and update badge
  const markMessagesAsReadOnView = async (projectId: string) => {
    try {
      // Immediately update local state to remove badge
      setRealProjects(prevProjects => 
        prevProjects.map(p => 
          p.id === projectId ? { ...p, unread: 0 } : p
        )
      )

      // Mark messages as read in the background
      await markProjectMessagesAsRead(projectId)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Upload file attachment
  const uploadAttachment = async (file: File, projectId: string): Promise<string | null> => {
    setIsUploading(true)
    try {
      // Get project to find client_id and account_id
      const project = await getProject(projectId)
      const account = await getCurrentAccount()
      
      if (!project || !account) {
        toast.error('Failed to get project or account information')
        return null
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('isPreview', 'false')
      formData.append('clientId', project.client_id)
      formData.append('accountId', account.id)
      formData.append('projectId', projectId)

      const uploadResponse = await fetch('/api/client-portal/upload-file', {
        method: 'POST',
        body: formData
      })

      const uploadResult = await uploadResponse.json()
      if (!uploadResponse.ok) {
        toast.error(uploadResult.message || 'Failed to upload attachment')
        return null
      }

      return uploadResult.data?.publicUrl || null
    } catch (error) {
      console.error('Error uploading attachment:', error)
      toast.error('Error uploading attachment')
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (fileName: string, fileType: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext || '')) return '🖼️'
    if (['pdf'].includes(ext || '')) return '📄'
    if (['doc', 'docx'].includes(ext || '')) return '📝'
    if (['xls', 'xlsx'].includes(ext || '')) return '📊'
    return '📎'
  }

  const handleSendPortalMessage = async () => {
    if (!portalComposer.trim() && !selectedFile) {
      toast.error("Please enter a message or attach a file")
      return
    }
    
    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }
    
    if (isTourRunning) {
      // During tour, just simulate sending
      toast.info("Message sent (tour mode)")
      setPortalComposer("")
      setSelectedFile(null)
      // Scroll to bottom in tour mode too
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
      return
    }

    // Don't send if selected project is a mock project
    if (selectedProject === "p1" || selectedProject === "p2" || selectedProject === "p3") {
      toast.info("Please select a real project to send messages")
      return
    }

    try {
      setSendingMessage(true)
      
      let attachmentUrl: string | null = null
      let attachmentName: string | null = null
      let attachmentType: string | null = null
      let attachmentSize: number | null = null

      // Upload file if one is selected
      if (selectedFile) {
        attachmentUrl = await uploadAttachment(selectedFile, selectedProject)
        if (!attachmentUrl) {
          setSendingMessage(false)
          return
        }
        attachmentName = selectedFile.name
        attachmentType = selectedFile.type
        attachmentSize = selectedFile.size
      }

      const message = await sendMessage(
        selectedProject, 
        portalComposer || (selectedFile ? `Sent ${selectedFile.name}` : ''),
        'You',
        attachmentUrl,
        attachmentName,
        attachmentType,
        attachmentSize
      )
      
      if (message) {
        // Reload messages to get the new one
        await loadMessages(selectedProject)
        // No need to reload projects - we sent the message, not receiving unread messages
        setPortalComposer("")
        setSelectedFile(null)
        if (portalFileInputRef.current) {
          portalFileInputRef.current.value = ''
        }
        toast.success("Message sent")
        
        // Scroll to bottom after message is sent
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
        }, 100)
      } else {
        toast.error("Failed to send message")
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const toggleStarProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent project selection when clicking star
    
    if (isTourRunning) {
      // During tour, just update local state
      setStarredProjects(prev => {
        const newSet = new Set(prev)
        if (newSet.has(projectId)) {
          newSet.delete(projectId)
        } else {
          newSet.add(projectId)
        }
        return newSet
      })
      return
    }

    const isStarred = starredProjects.has(projectId)
    
    // Optimistically update UI
    setStarredProjects(prev => {
      const newSet = new Set(prev)
      if (isStarred) {
        newSet.delete(projectId)
      } else {
        newSet.add(projectId)
      }
      return newSet
    })

    try {
      if (isStarred) {
        const success = await unstarConversation(projectId)
        if (!success) {
          // Revert on error
          setStarredProjects(prev => {
            const newSet = new Set(prev)
            newSet.add(projectId)
            return newSet
          })
          toast.error('Failed to unstar conversation')
        }
      } else {
        const success = await starConversation(projectId)
        if (!success) {
          // Revert on error
          setStarredProjects(prev => {
            const newSet = new Set(prev)
            newSet.delete(projectId)
            return newSet
          })
          toast.error('Failed to star conversation')
        }
      }
    } catch (error) {
      console.error('Error toggling star:', error)
      // Revert on error
      setStarredProjects(prev => {
        const newSet = new Set(prev)
        if (isStarred) {
          newSet.add(projectId)
        } else {
          newSet.delete(projectId)
        }
        return newSet
      })
      toast.error('Failed to update starred status')
    }
  }

  // Auto-show composer when switching to email tab with no thread selected
  useEffect(() => {
    if (activeTab === "email" && !selectedEmail && !isNewEmail) {
      setIsNewEmail(true)
      setEmailComposer({ 
        to: [], 
        cc: [],
        subject: "", 
        body: "",
        selectedClient: null,
        selectedProject: null
      })
      setToInputValue("")
    }
  }, [activeTab, selectedEmail, isNewEmail])

  // Ensure we start on portal tab when tour starts
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "messages" && activeTab !== "portal") {
      setActiveTab("portal")
    }
  }, [isTourRunning, currentTour?.id])

  // Auto-switch tabs when tour explicitly asks
  useEffect(() => {
    if (isTourRunning && currentTour?.id === "messages") {
      let hasSwitchedToEmail = false
      
      const checkForTabSwitch = () => {
        // Look for the tour hint that indicates we should switch to email tab
        if (!hasSwitchedToEmail && activeTab === "portal") {
          const allElements = document.querySelectorAll('*')
          for (const el of allElements) {
            const text = el.textContent || ''
            // If we see hints about Emails tab, switch to email tab
            if (text.includes("Emails") && text.includes("tab") && text.includes("email communication")) {
              setActiveTab("email")
              hasSwitchedToEmail = true
              break
            }
          }
        }
      }
      
      const interval = setInterval(checkForTabSwitch, 300)
      return () => clearInterval(interval)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  // Use dummy data during tours, real data otherwise
  const projects = useMemo(() => {
    if (isTourRunning) {
      return dummyProjects.map((dp, i) => ({
        id: dp.id,
        name: dp.name,
        client: dp.client,
        unread: i === 0 ? 1 : 0,
        last: dummyMessages[i]?.lastMessage || "No messages yet",
        time: "2h ago",
        client_id: ""
      }))
    }
    // Only return real projects, don't fall back to mock data
    return realProjects
  }, [isTourRunning, realProjects])

  // Filter projects based on search and filter
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Apply search filter
    if (projectSearchQuery.trim()) {
      const query = projectSearchQuery.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.client.toLowerCase().includes(query)
      )
    }

    // Apply filter (all, unread, starred)
    if (projectFilter === "unread") {
      filtered = filtered.filter(p => p.unread > 0)
    } else if (projectFilter === "starred") {
      filtered = filtered.filter(p => starredProjects.has(p.id))
    }

    return filtered
  }, [projects, projectSearchQuery, projectFilter, starredProjects])

  // Mock clients with contacts and stakeholders
  const clients = [
    {
      id: "c1",
      name: "Acme Co",
      primaryContact: { email: "sarah@acme.com", name: "Sarah Johnson" },
      stakeholders: [
        { email: "mike@acme.com", name: "Mike Chen" },
        { email: "lisa@acme.com", name: "Lisa Park" }
      ],
      projects: ["p1"]
    },
    {
      id: "c2",
      name: "Glow Studio",
      primaryContact: { email: "emma@glow.studio", name: "Emma Wilson" },
      stakeholders: [
        { email: "david@glow.studio", name: "David Brown" }
      ],
      projects: ["p2"]
    },
    {
      id: "c3",
      name: "Nova Labs",
      primaryContact: { email: "ryan@nova.io", name: "Ryan Martinez" },
      stakeholders: [],
      projects: ["p3"]
    }
  ]

  // All contacts (primary + stakeholders)
  const allContacts = clients.flatMap(client => [
    { email: client.primaryContact.email, name: client.primaryContact.name, clientId: client.id, clientName: client.name },
    ...client.stakeholders.map(s => ({ email: s.email, name: s.name, clientId: client.id, clientName: client.name }))
  ])

  // Use dummy data during tours, real data otherwise
  const portalThread = useMemo(() => {
    if (isTourRunning) {
      return [
        { id: "m1", who: "Client" as const, name: "Dana (Acme)", time: "10:12 AM", day: "Today" as const, text: "Could we push the launch to next Tuesday?" },
        { id: "m2", who: "You" as const, name: "You", time: "10:25 AM", day: "Today" as const, text: "Yes, that works. I'll update the plan and send an invoice adjustment." },
        { id: "m3", who: "Client" as const, name: "Dana (Acme)", time: "11:00 AM", day: "Today" as const, text: "Perfect! Also, can we add a dark mode toggle to the settings page? I think our users would really appreciate that feature." },
        { id: "m4", who: "You" as const, name: "You", time: "11:15 AM", day: "Today" as const, text: "Absolutely! I'll add that to the roadmap. Should I prioritize it for the next sprint?" },
        { id: "m5", who: "Client" as const, name: "Dana (Acme)", time: "11:30 AM", day: "Today" as const, text: "Yes, that would be great. Let me know when you have a rough timeline." },
        { id: "m6", who: "You" as const, name: "You", time: "2:30 PM", day: "Today" as const, text: "I've updated the project timeline. Dark mode should be ready by next Friday. I'll send you a preview build once it's done." },
        { id: "m7", who: "Client" as const, name: "Dana (Acme)", time: "2:30 PM", day: "Yesterday" as const, text: "Shared the latest copy here: https://docs.example.com/..." },
        { id: "m8", who: "You" as const, name: "You", time: "3:00 PM", day: "Yesterday" as const, text: "Thanks for sharing! I've reviewed the copy and it looks great. Just a few minor suggestions in the document." },
        { id: "m9", who: "Client" as const, name: "Dana (Acme)", time: "3:45 PM", day: "Yesterday" as const, text: "Got it! I'll review your suggestions and get back to you by end of day." },
        { id: "m10", who: "You" as const, name: "You", time: "4:00 PM", day: "Yesterday" as const, text: "Sounds good. Also, I wanted to check in about the payment schedule. Should we proceed with the milestone-based payments we discussed?" },
        { id: "m11", who: "Client" as const, name: "Dana (Acme)", time: "4:30 PM", day: "Yesterday" as const, text: "Yes, milestone-based works perfectly for us. Let me know when the first milestone is ready for review." },
      ]
    }
    return realMessages
  }, [isTourRunning, realMessages])

  const emailThreads = [
    { id: "t1", subject: "Invoice #1042", snippet: "Quick heads up: due next week…", client: "sarah@acme.com", unread: true, time: "9:31 AM", starred: false },
    { id: "t2", subject: "Project kickoff agenda", snippet: "Here's the plan for Monday…", client: "ryan@nova.io", unread: false, time: "Yesterday", starred: true },
  ]

  const emailConversation = [
    { id: "e1", from: { name: "You", email: "you@jolix.app" }, to: { name: "Sarah", email: "sarah@acme.com" }, time: "9:31 AM", subject: "Invoice #1042", body: "Hi Sarah — attaching the invoice due next week. Let me know if you need anything else." },
    { id: "e2", from: { name: "Sarah", email: "sarah@acme.com" }, to: { name: "You", email: "you@jolix.app" }, time: "9:44 AM", subject: "Re: Invoice #1042", body: "Thanks! We'll process this by Friday." },
    { id: "e3", from: { name: "You", email: "you@jolix.app" }, to: { name: "Sarah", email: "sarah@acme.com" }, time: "10:00 AM", subject: "Re: Invoice #1042", body: "Perfect! Also, I wanted to follow up on the project proposal we sent last week. Have you had a chance to review it?" },
    { id: "e4", from: { name: "Sarah", email: "sarah@acme.com" }, to: { name: "You", email: "you@jolix.app" }, time: "10:15 AM", subject: "Re: Invoice #1042", body: "Yes, I've reviewed it and it looks great! We're planning to discuss it in our team meeting tomorrow. I'll get back to you with any questions or feedback." },
    { id: "e5", from: { name: "You", email: "you@jolix.app" }, to: { name: "Sarah", email: "sarah@acme.com" }, time: "10:30 AM", subject: "Re: Invoice #1042", body: "That sounds perfect. Looking forward to hearing your thoughts!" },
  ]

  const templates = [
    { id: "t1", name: "Friendly Follow-up", category: "Follow-up", preview: "Just checking in on the proposal I sent…" },
    { id: "t2", name: "Invoice Reminder", category: "Invoice", preview: "Quick reminder that your invoice is due…" },
  ]

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden -m-6">
        {/* Header */}
        <div className="flex-none mx-6 mt-6 mb-4" data-help="messages-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Messages
              </h1>
              <p className="text-base text-gray-600">
                See and send all client communication in one place.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                className="border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  toast.info("Connect your email account to sync messages")
                }}
                data-help="btn-connect-email"
              >
                <Mail className="h-4 w-4 mr-2" />
                Connect Email
              </Button>
              <Button 
                className="bg-[#4647E0] hover:bg-[#3637C0] text-white"
                data-help="btn-new-message"
                onClick={() => {
                  if (activeTab === "portal") {
                    // Switch to email tab and open new email composer
                    setActiveTab("email")
                    setIsNewEmail(true)
                    setSelectedEmail(null)
                    setEmailComposer({ 
                      to: [], 
                      cc: [],
                      subject: "", 
                      body: "",
                      selectedClient: null,
                      selectedProject: null
                    })
                    setToInputValue("")
                    setTimeout(() => {
                      const toInput = document.querySelector('input[placeholder="Type email or name…"]') as HTMLInputElement
                      toInput?.focus()
                    }, 100)
                  } else {
                    // Switch to new email mode
                    setIsNewEmail(true)
                    setSelectedEmail(null)
                    setEmailComposer({ 
                      to: [], 
                      cc: [],
                      subject: "", 
                      body: "",
                      selectedClient: null,
                      selectedProject: null
                    })
                    setToInputValue("")
                    setTimeout(() => {
                      const toInput = document.querySelector('input[placeholder="Type email or name…"]') as HTMLInputElement
                      toInput?.focus()
                    }, 100)
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-none bg-white border-b border-gray-200 mx-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent p-0 h-auto border-0 grid grid-cols-2 gap-4">
              <TabsTrigger 
                value="portal" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4647E0] data-[state=active]:to-[#5757FF] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 rounded-xl py-4 px-6 transition-all duration-200 border-0 shadow-sm"
                data-help="portal-messages-tab"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Portal Messages
              </TabsTrigger>
              <TabsTrigger 
                value="email" 
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#4647E0] data-[state=active]:to-[#5757FF] data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 rounded-xl py-4 px-6 transition-all duration-200 border-0 shadow-sm"
                data-help="emails-tab"
              >
                <Mail className="h-5 w-5 mr-2" />
                Emails
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Area - Messages Panel */}
        <div className="flex-1 min-h-0 overflow-hidden mx-6 mt-6 mb-6">
          <div className="h-full flex flex-col">
            <Tabs value={activeTab} className="flex-1 flex flex-col min-h-0 h-full">
              {/* PORTAL MESSAGES TAB */}
              <TabsContent value="portal" className="data-[state=active]:flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:min-h-0" data-help="portal-messages-content">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 flex-1 min-h-0 h-full items-stretch">
                  {/* Left Sidebar - Projects */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full min-h-0" data-help="portal-projects-sidebar">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">By Project</h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="Search projects…" 
                          className="pl-9 h-10 rounded-xl border-gray-200 focus-visible:ring-[#4647E0]"
                          value={projectSearchQuery}
                          onChange={(e) => setProjectSearchQuery(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Badge 
                          variant={projectFilter === "all" ? "default" : "secondary"} 
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => setProjectFilter("all")}
                        >
                          All
                        </Badge>
                        <Badge 
                          variant={projectFilter === "unread" ? "default" : "secondary"} 
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => setProjectFilter("unread")}
                        >
                          Unread
                        </Badge>
                        <Badge 
                          variant={projectFilter === "starred" ? "default" : "secondary"} 
                          className="cursor-pointer hover:bg-gray-200"
                          onClick={() => setProjectFilter("starred")}
                        >
                          <Star className={`h-3 w-3 mr-1 ${projectFilter === "starred" ? "fill-current" : ""}`} /> Starred
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-2 space-y-1">
                        {loadingProjects ? (
                          <div className="p-4 text-center text-sm text-gray-500">Loading projects...</div>
                        ) : filteredProjects.length === 0 ? (
                          <div className="p-4 text-center text-sm text-gray-500">
                            {projectSearchQuery || projectFilter !== "all" 
                              ? "No projects match your filters" 
                              : "No projects found"}
                          </div>
                        ) : (
                          filteredProjects.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedProject(p.id)}
                              className={`w-full text-left p-3 rounded-xl transition-all duration-200 relative group ${
                                selectedProject === p.id
                                  ? "bg-[#F5F5FF] border border-[#E0E0FF] shadow-sm"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="font-medium text-gray-900 text-sm pr-8">{p.name}</div>
                                <div className="flex items-center gap-2">
                                  {p.unread > 0 && (
                                    <Badge className="bg-[#4647E0] text-white text-xs h-5">{p.unread}</Badge>
                                  )}
                                  <button
                                    onClick={(e) => toggleStarProject(p.id, e)}
                                    className={`transition-opacity p-1 hover:bg-gray-200 rounded ${
                                      starredProjects.has(p.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                                    }`}
                                    title={starredProjects.has(p.id) ? "Unstar conversation" : "Star conversation"}
                                  >
                                    <Star 
                                      className={`h-4 w-4 ${
                                        starredProjects.has(p.id) 
                                          ? "fill-yellow-400 text-yellow-400" 
                                          : "text-gray-400"
                                      }`} 
                                    />
                                  </button>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mb-1">{p.client}</div>
                              <div className="text-xs text-gray-600 truncate">{p.last}</div>
                              <div className="text-xs text-gray-400 mt-1">{p.time}</div>
                            </button>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Middle Column - Thread */}
                  <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full min-h-[700px]" data-help="portal-thread-view">
                    {/* Thread Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-end gap-2" data-help="portal-thread-header">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg"
                        onClick={async () => {
                          if (selectedProject && selectedProject !== "p1" && selectedProject !== "p2" && selectedProject !== "p3") {
                            try {
                              // Immediately update local state to remove badge
                              setRealProjects(prevProjects => 
                                prevProjects.map(p => 
                                  p.id === selectedProject ? { ...p, unread: 0 } : p
                                )
                              )

                              // Mark messages as read in the background
                              const marked = await markProjectMessagesAsRead(selectedProject)
                              if (marked) {
                                toast.success("All messages marked as read")
                              } else {
                                toast.error("Failed to mark messages as read")
                              }
                            } catch (error) {
                              console.error('Error marking messages as read:', error)
                              toast.error("Failed to mark messages as read")
                            }
                          }
                        }}
                        disabled={!selectedProject || selectedProject === "p1" || selectedProject === "p2" || selectedProject === "p3" || isTourRunning}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark all read
                      </Button>
                      <Button variant="outline" size="sm" className="rounded-lg">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in Portal
                      </Button>
                    </div>

                    {/* Thread Messages */}
                    <ScrollArea ref={messagesScrollAreaRef} className="flex-1 min-h-0 p-4">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-sm text-gray-500">Loading messages...</div>
                        </div>
                      ) : portalThread.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500">No messages yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start a conversation by sending a message</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8">
                          {Array.from(new Set(portalThread.map(m => m.day))).map((day) => (
                            <div key={day}>
                              <div className="flex items-center justify-center my-6">
                                <div className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                  {day}
                                </div>
                              </div>
                              <div className="space-y-6">
                                {portalThread
                                  .filter((m) => m.day === day)
                                  .map((m) => (
                                    <div
                                      key={m.id}
                                      className={`flex gap-4 ${
                                        m.who === "You" ? "flex-row-reverse" : ""
                                      }`}
                                    >
                                      <Avatar className="h-8 w-8 flex-shrink-0">
                                        <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-xs">
                                          {m.name[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className={`max-w-[70%] ${m.who === "You" ? "items-end" : ""}`}>
                                        <div className="flex items-center gap-2 mb-2">
                                          <span className="text-xs font-medium text-gray-700">{m.name}</span>
                                          <span className="text-xs text-gray-400">{m.time}</span>
                                        </div>
                                        <div
                                          className={`rounded-2xl px-5 py-4 ${
                                            m.who === "You"
                                              ? "bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white"
                                              : "bg-gray-50 border border-gray-100 text-gray-800"
                                          }`}
                                        >
                                          {m.text && (
                                            <p className="text-sm leading-relaxed">{m.text}</p>
                                          )}
                                          
                                          {/* Attachment Display */}
                                          {m.attachment_url && (
                                            <div className={`mt-2 ${m.text ? 'mt-3' : ''}`}>
                                              <a
                                                href={m.attachment_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`inline-flex items-center gap-2 p-2 rounded-lg transition-colors ${
                                                  m.who === "You"
                                                    ? 'bg-white/20 hover:bg-white/30 text-white'
                                                    : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
                                                }`}
                                              >
                                                <span className="text-lg">{getFileIcon(m.attachment_name || '', m.attachment_type || '')}</span>
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-xs font-medium truncate">{m.attachment_name || 'Attachment'}</p>
                                                  {m.attachment_size && (
                                                    <p className={`text-xs ${m.who === "You" ? 'text-white/70' : 'text-gray-500'}`}>
                                                      {formatFileSize(m.attachment_size)}
                                                    </p>
                                                  )}
                                                </div>
                                                <Download className={`h-3 w-3 ${m.who === "You" ? 'text-white/80' : 'text-gray-400'}`} />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          ))}
                          {/* Scroll anchor */}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    {/* Selected File Preview */}
                    {selectedFile && (
                      <div className="p-3 border-t border-gray-100 bg-white">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <span className="text-lg">{getFileIcon(selectedFile.name, selectedFile.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFile(null)
                              if (portalFileInputRef.current) {
                                portalFileInputRef.current.value = ''
                              }
                            }}
                            className="h-7 w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Composer */}
                    <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0" data-help="portal-composer">
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        <Textarea
                          id="portal-composer"
                          value={portalComposer}
                          onChange={(e) => setPortalComposer(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendPortalMessage()
                            }
                          }}
                          placeholder="Write a message…"
                          className="min-h-[60px] max-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                          data-help="portal-composer-textarea"
                          disabled={sendingMessage || isUploading}
                        />
                        <div className="flex items-center justify-between p-2 bg-white border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <input
                              ref={portalFileInputRef}
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setSelectedFile(file)
                                }
                              }}
                              disabled={sendingMessage || isUploading}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => portalFileInputRef.current?.click()}
                              disabled={sendingMessage || isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Paperclip className="h-4 w-4" />
                              )}
                            </Button>
                            <Popover open={portalAiHelpOpen} onOpenChange={setPortalAiHelpOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  AI Help
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-[400px] p-4 rounded-xl" 
                                align="end"
                                side="top"
                                sideOffset={8}
                              >
                                <div className="space-y-4">
                                  {/* Input Field */}
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Explain what you want to write…"
                                        value={portalAiHelpInput}
                                        onChange={(e) => setPortalAiHelpInput(e.target.value)}
                                        className="rounded-xl flex-1"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && portalAiHelpInput.trim()) {
                                            // Handle AI generation
                                            console.log("Generate AI content:", portalAiHelpInput)
                                            setPortalAiHelpInput("")
                                            setPortalAiHelpOpen(false)
                                          }
                                        }}
                                      />
                                      {portalAiHelpInput.trim() && (
                                        <Button
                                          className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl whitespace-nowrap"
                                          onClick={() => {
                                            // Handle AI generation
                                            console.log("Generate AI content:", portalAiHelpInput)
                                            setPortalAiHelpInput("")
                                            setPortalAiHelpOpen(false)
                                          }}
                                        >
                                          Generate
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700">Choose a quick action</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {["Summarize thread", "Draft reply", "Polish tone", "Make concise"].map((action) => (
                                        <Button
                                          key={action}
                                          variant="outline"
                                          size="sm"
                                          className="justify-start h-auto py-2.5 rounded-lg hover:border-[#4647E0] hover:text-[#4647E0] text-xs"
                                          onClick={() => {
                                            // Handle quick action
                                            console.log("Quick action:", action)
                                            setPortalAiHelpOpen(false)
                                          }}
                                        >
                                          <Sparkles className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                          <span className="text-xs">{action}</span>
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Button 
                            className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                            onClick={handleSendPortalMessage}
                            disabled={(!portalComposer.trim() && !selectedFile) || sendingMessage || isUploading}
                          >
                            {sendingMessage || isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                {isUploading ? "Uploading..." : "Sending..."}
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Send
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* EMAILS TAB */}
              <TabsContent value="email" className="data-[state=active]:flex-1 mt-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:min-h-0" data-help="emails-content">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 flex-1 min-h-0 h-full items-stretch">
                  {/* Left Sidebar - Email Threads */}
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full min-h-0" data-help="email-threads-sidebar">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Threads</h3>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search emails…"
                          className="pl-9 h-10 rounded-xl border-gray-200 focus-visible:ring-[#4647E0]"
                        />
                      </div>
                      {/* Client Filter (Primary) */}
                      <Select value={selectedClientFilter || "all"} onValueChange={(v) => {
                        setSelectedClientFilter(v === "all" ? null : v)
                        setSelectedProjectFilter(null) // Reset project when client changes
                      }}>
                        <SelectTrigger className="h-9 rounded-xl mb-3">
                          <SelectValue placeholder="All Clients" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all">All Clients</SelectItem>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {/* Project Filter (Secondary - only shows after client selected) */}
                      {selectedClientFilter && (
                        <Select value={selectedProjectFilter || "all"} onValueChange={(v) => {
                          setSelectedProjectFilter(v === "all" ? null : v)
                        }}>
                          <SelectTrigger className="h-9 rounded-xl mb-3">
                            <SelectValue placeholder="All Projects" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.filter(p => {
                              const client = clients.find(c => c.id === selectedClientFilter)
                              return client?.projects.includes(p.id)
                            }).map((project) => (
                              <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {/* Status Filters */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">All</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">Unread</Badge>
                        <Badge variant="secondary" className="cursor-pointer hover:bg-gray-200">
                          <Star className="h-3 w-3 mr-1" /> Starred
                        </Badge>
                      </div>
                    </div>
                    <ScrollArea className="flex-1 min-h-0">
                      <div className="p-2 space-y-1">
                        {emailThreads.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              setSelectedEmail(t.id)
                              setIsNewEmail(false)
                              // Auto-fill To and Subject from thread
                              const thread = emailThreads.find(thread => thread.id === t.id)
                              if (thread) {
                                // Find contact by email
                                const contact = allContacts.find(c => c.email === thread.client)
                                setEmailComposer({
                                  to: contact ? [{ email: contact.email, name: contact.name }] : [{ email: thread.client }],
                                  cc: [],
                                  subject: thread.subject.startsWith("Re: ") ? thread.subject : `Re: ${thread.subject}`,
                                  body: "",
                                  selectedClient: contact?.clientId || null,
                                  selectedProject: null
                                })
                              }
                            }}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                              selectedEmail === t.id
                                ? "bg-[#F5F5FF] border border-[#E0E0FF] shadow-sm"
                                : "hover:bg-gray-50 border border-transparent"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <div className={`font-medium text-sm truncate flex-1 ${t.unread ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
                                {t.subject}
                              </div>
                              {t.starred && <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 ml-2" />}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">{t.client}</div>
                            <div className="text-xs text-gray-600 truncate mb-1">{t.snippet}</div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-400">{t.time}</span>
                              {t.unread && <Badge className="bg-[#4647E0] text-white text-xs h-5">Unread</Badge>}
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Middle Column - Email Thread View */}
                  <div className="min-w-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden h-full min-h-[700px]" data-help="email-thread-view">
                    {/* Toolbar */}
                    {!isNewEmail && selectedEmail && (
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between" data-help="email-thread-toolbar">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Reply className="h-4 w-4 mr-2" />
                            Reply
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <ReplyAll className="h-4 w-4 mr-2" />
                            Reply all
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Forward className="h-4 w-4 mr-2" />
                            Forward
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button variant="outline" size="sm" className="rounded-lg">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Open in Gmail
                        </Button>
                      </div>
                    )}

                    {/* Thread Messages */}
                    <ScrollArea className="flex-1 min-h-0 p-4">
                      {isNewEmail ? (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
                            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">Compose your new email below</p>
                          </div>
                        </div>
                      ) : selectedEmail ? (
                        <>
                          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
                            Filtering inbox to Client: Acme / Project: Website Redesign
                          </div>
                          <div className="space-y-8">
                            {emailConversation.map((m, idx) => (
                          <Card key={m.id} className="overflow-hidden rounded-2xl">
                            <CardContent className="p-5">
                              {idx === 0 && (
                                <div className="text-base font-semibold text-gray-900 mb-4">
                                  {m.subject}
                                </div>
                              )}
                              <div className="flex items-start gap-4 mb-4">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-xs">
                                    {m.from.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium text-gray-900">
                                      {m.from.name} &lt;{m.from.email}&gt;
                                    </span>
                                    <Badge variant="secondary" className="text-xs">Email</Badge>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    To: {m.to.name} &lt;{m.to.email}&gt; • {m.time}
                                  </div>
                                </div>
                              </div>
                              <div className="prose prose-sm max-w-none text-gray-800 mt-4">
                                {m.body}
                              </div>
                            </CardContent>
                          </Card>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full min-h-[400px]">
                          <div className="text-center">
                            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-sm">Select an email thread to view</p>
                          </div>
                        </div>
                      )}
                    </ScrollArea>

                    {/* Composer */}
                    <div className="p-3 border-t border-gray-100 bg-white flex-shrink-0" data-help="email-composer">
                      <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
                        {isNewEmail && (
                          <div className="p-3 space-y-3 bg-white border-b border-gray-200" data-help="email-composer-fields">
                            {/* To Field with Chips */}
                            <div className="space-y-2" data-help="email-to-field">
                              <div className="flex items-center gap-2">
                                <label className="text-xs font-medium text-gray-700 w-12">To:</label>
                                <div className="flex-1 flex flex-wrap gap-1.5 min-h-[32px] p-1.5 rounded-lg border border-gray-200 bg-white focus-within:ring-2 focus-within:ring-[#4647E0] focus-within:border-transparent">
                                  {/* Chips */}
                                  {emailComposer.to.map((recipient, idx) => (
                                    <Badge
                                      key={idx}
                                      variant="secondary"
                                      className="h-6 px-2 text-xs bg-[#F5F5FF] text-[#4647E0] border-[#E0E0FF] hover:bg-[#E8E8FF]"
                                    >
                                      {recipient.name || recipient.email}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setEmailComposer(prev => ({
                                            ...prev,
                                            to: prev.to.filter((_, i) => i !== idx)
                                          }))
                                        }}
                                        className="ml-1.5 hover:bg-[#4647E0]/20 rounded-full p-0.5"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  
                                  {/* Autocomplete Input */}
                                  <div className="flex-1 relative">
                                    <Popover open={toInputOpen} onOpenChange={setToInputOpen} modal={false}>
                                      <PopoverTrigger asChild>
                                        <input
                                          type="text"
                                          placeholder={emailComposer.to.length === 0 ? "Type email or name…" : ""}
                                          value={toInputValue}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setToInputValue(value)
                                            // Only open if there's a match
                                            if (value.trim()) {
                                              const searchValue = value.toLowerCase().trim()
                                              // require at least 2 chars to match to avoid single-letter matches
                                              if (searchValue.length < 2) {
                                                setToInputOpen(false)
                                              } else {
                                                const match = allContacts.find(c => {
                                                  if (emailComposer.to.some(r => r.email === c.email)) return false
                                                  // Match email
                                                  if (c.email.toLowerCase().includes(searchValue)) return true
                                                  // Match full name
                                                  if (c.name?.toLowerCase().includes(searchValue)) return true
                                                  // Match first or last name separately
                                                  if (c.name) {
                                                    const nameParts = c.name.toLowerCase().split(' ')
                                                    if (nameParts.some(part => part.startsWith(searchValue))) return true
                                                  }
                                                  return false
                                                })
                                                setToInputOpen(!!match)
                                              }
                                            } else {
                                              setToInputOpen(false)
                                            }
                                          }}
                                          onFocus={() => {
                                            // Only open if there's a match
                                            if (toInputValue.trim()) {
                                              const searchValue = toInputValue.toLowerCase().trim()
                                              if (searchValue.length < 2) {
                                                setToInputOpen(false)
                                              } else {
                                                const match = allContacts.find(c => {
                                                  if (emailComposer.to.some(r => r.email === c.email)) return false
                                                  // Match email
                                                  if (c.email.toLowerCase().includes(searchValue)) return true
                                                  // Match full name
                                                  if (c.name?.toLowerCase().includes(searchValue)) return true
                                                  // Match first or last name separately
                                                  if (c.name) {
                                                    const nameParts = c.name.toLowerCase().split(' ')
                                                    if (nameParts.some(part => part.startsWith(searchValue))) return true
                                                  }
                                                  return false
                                                })
                                                setToInputOpen(!!match)
                                              }
                                            } else {
                                              setToInputOpen(false)
                                            }
                                          }}
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter" && toInputValue.trim()) {
                                          e.preventDefault()
                                          // Find first matching contact (only if input >= 2 chars)
                                          const searchValue = toInputValue.toLowerCase().trim()
                                          let match = null
                                          if (searchValue.length >= 2) {
                                            match = allContacts.find(c => {
                                              if (emailComposer.to.some(r => r.email === c.email)) return false
                                              // Match email
                                              if (c.email.toLowerCase().includes(searchValue)) return true
                                              // Match full name
                                              if (c.name?.toLowerCase().includes(searchValue)) return true
                                              // Match first or last name separately
                                              if (c.name) {
                                                const nameParts = c.name.toLowerCase().split(' ')
                                                if (nameParts.some(part => part.startsWith(searchValue))) return true
                                              }
                                              return false
                                            })
                                          }

                                          if (match) {
                                            // Add matched contact
                                            setEmailComposer(prev => ({
                                              ...prev,
                                              to: [...prev.to, { email: match.email, name: match.name }]
                                            }))
                                            setToInputValue("")
                                            setToInputOpen(false)
                                          } else {
                                            // Check if it's a valid email format and add as raw email
                                            const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toInputValue.trim())
                                            if (isEmail && !emailComposer.to.some(r => r.email === toInputValue.trim())) {
                                              setEmailComposer(prev => ({
                                                ...prev,
                                                to: [...prev.to, { email: toInputValue.trim() }]
                                              }))
                                              setToInputValue("")
                                              setToInputOpen(false)
                                            }
                                          }
                                        } else if (e.key === "Backspace" && toInputValue === "" && emailComposer.to.length > 0) {
                                          setEmailComposer(prev => ({
                                            ...prev,
                                            to: prev.to.slice(0, -1)
                                          }))
                                        }
                                      }}
                                          className="w-full min-w-[120px] outline-none text-sm bg-transparent"
                                        />
                                      </PopoverTrigger>
                                      {(() => {
                                        // Find first matching contact
                                        if (!toInputValue.trim()) return null
                                        const searchValue = toInputValue.toLowerCase().trim()
                                        if (searchValue.length < 2) return null
                                        const match = allContacts.find(c => {
                                          if (emailComposer.to.some(r => r.email === c.email)) return false
                                          // Match email
                                          if (c.email.toLowerCase().includes(searchValue)) return true
                                          // Match full name
                                          if (c.name?.toLowerCase().includes(searchValue)) return true
                                          // Match first or last name separately
                                          if (c.name) {
                                            const nameParts = c.name.toLowerCase().split(' ')
                                            if (nameParts.some(part => part.startsWith(searchValue))) return true
                                          }
                                          return false
                                        })

                                        return match && (
                                          <PopoverContent 
                                            className="w-[320px] p-2" 
                                            align="start"
                                            side="bottom"
                                            sideOffset={4}
                                            onOpenAutoFocus={(e) => e.preventDefault()}
                                            onInteractOutside={(e) => {
                                              // Don't close when clicking on the input
                                              const target = e.target as HTMLElement
                                              if (target.closest('input[type="text"]')) {
                                                e.preventDefault()
                                              }
                                            }}
                                          >
                                            <div
                                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                                              onClick={() => {
                                                setEmailComposer(prev => ({
                                                  ...prev,
                                                  to: [...prev.to, { email: match.email, name: match.name }]
                                                }))
                                                setToInputValue("")
                                                setToInputOpen(false)
                                              }}
                                            >
                                              <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-xs">
                                                  {match.name?.[0] || match.email[0]}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 truncate">
                                                  {match.name || match.email}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">{match.email}</div>
                                              </div>
                                              <span className="text-xs text-gray-400 whitespace-nowrap">{match.clientName}</span>
                                            </div>
                                          </PopoverContent>
                                        )
                                      })()}
                                    </Popover>
                                  </div>
                                </div>
                                
                                {/* Choose Client Button */}
                                <Popover open={clientPickerOpen} onOpenChange={setClientPickerOpen}>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 text-xs whitespace-nowrap">
                                      <Users className="h-3 w-3 mr-1.5" />
                                      Choose client
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[280px] p-2" align="end">
                                    <Command>
                                      <CommandInput placeholder="Search clients…" />
                                      <CommandList>
                                        <CommandEmpty>No clients found</CommandEmpty>
                                        <CommandGroup>
                                          {clients.map((client) => (
                                            <CommandItem
                                              key={client.id}
                                              onSelect={() => {
                                                // Add primary contact to To, stakeholders to CC
                                                const primaryInTo = emailComposer.to.some(r => r.email === client.primaryContact.email)
                                                if (!primaryInTo) {
                                                  setEmailComposer(prev => ({
                                                    ...prev,
                                                    to: [...prev.to, { 
                                                      email: client.primaryContact.email, 
                                                      name: client.primaryContact.name 
                                                    }],
                                                    cc: [
                                                      ...prev.cc.filter(cc => !client.stakeholders.some(s => s.email === cc.email)),
                                                      ...client.stakeholders.map(s => ({ email: s.email, name: s.name }))
                                                    ],
                                                    selectedClient: client.id
                                                  }))
                                                }
                                                setClientPickerOpen(false)
                                              }}
                                            >
                                              <div className="flex items-center gap-2 w-full">
                                                <Avatar className="h-6 w-6">
                                                  <AvatarFallback className="bg-gradient-to-br from-[#4647E0] to-[#5757FF] text-white text-xs">
                                                    {client.name[0]}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                  <div className="text-sm font-medium">{client.name}</div>
                                                  <div className="text-xs text-gray-500">{client.primaryContact.name}</div>
                                                </div>
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              
                              {/* CC Field (if any) */}
                              {emailComposer.cc.length > 0 && (
                                <div className="flex items-center gap-2">
                                  <label className="text-xs font-medium text-gray-700 w-12">CC:</label>
                                  <div className="flex-1 flex flex-wrap gap-1.5">
                                    {emailComposer.cc.map((recipient, idx) => (
                                      <Badge
                                        key={idx}
                                        variant="secondary"
                                        className="h-6 px-2 text-xs bg-gray-100 text-gray-700"
                                      >
                                        {recipient.name || recipient.email}
                                        <button
                                          onClick={() => {
                                            setEmailComposer(prev => ({
                                              ...prev,
                                              cc: prev.cc.filter((_, i) => i !== idx)
                                            }))
                                          }}
                                          className="ml-1.5 hover:bg-gray-200 rounded-full p-0.5"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            {/* Subject Field */}
                            <div className="flex items-center gap-2" data-help="email-subject-field">
                              <label className="text-xs font-medium text-gray-700 w-12">Subject:</label>
                              <Input
                                placeholder="Subject"
                                value={emailComposer.subject}
                                onChange={(e) => setEmailComposer((s) => ({ ...s, subject: e.target.value }))}
                                className="h-8 rounded-lg border-gray-200 text-sm flex-1"
                              />
                            </div>
                          </div>
                        )}
                        <Textarea
                          id="email-body"
                          value={emailComposer.body}
                          onChange={(e) => setEmailComposer((s) => ({ ...s, body: e.target.value }))}
                          placeholder="Write your email…"
                          className="min-h-[60px] max-h-[120px] border-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                        />
                        <div className="flex items-center justify-between p-2 bg-white border-t border-gray-200">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900"
                              onClick={() => {
                                setTemplatesModalOpen(true)
                              }}
                            >
                              🧩 Use Template
                            </Button>
                            <Popover open={aiHelpOpen} onOpenChange={setAiHelpOpen}>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <Sparkles className="h-4 w-4 mr-1" />
                                  AI Help
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-[400px] p-4 rounded-xl" 
                                align="end"
                                side="top"
                                sideOffset={8}
                              >
                                <div className="space-y-4">
                                  {/* Input Field */}
                                  <div className="space-y-2">
                                    <div className="flex gap-2">
                                      <Input
                                        placeholder="Explain what you want to write…"
                                        value={aiHelpInput}
                                        onChange={(e) => setAiHelpInput(e.target.value)}
                                        className="rounded-xl flex-1"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter" && aiHelpInput.trim()) {
                                            // Handle AI generation
                                            console.log("Generate AI content:", aiHelpInput)
                                            setAiHelpInput("")
                                            setAiHelpOpen(false)
                                          }
                                        }}
                                      />
                                      {aiHelpInput.trim() && (
                                        <Button
                                          className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl whitespace-nowrap"
                                          onClick={() => {
                                            // Handle AI generation
                                            console.log("Generate AI content:", aiHelpInput)
                                            setAiHelpInput("")
                                            setAiHelpOpen(false)
                                          }}
                                        >
                                          Generate
                                        </Button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Divider */}
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                    <span className="text-xs text-gray-500">or</span>
                                    <div className="flex-1 h-px bg-gray-200"></div>
                                  </div>

                                  {/* Quick Actions */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-medium text-gray-700">Choose a quick action</p>
                                    <div className="grid grid-cols-2 gap-2">
                                      {["Summarize thread", "Draft reply", "Polish tone", "Make concise"].map((action) => (
                                        <Button
                                          key={action}
                                          variant="outline"
                                          size="sm"
                                          className="justify-start h-auto py-2.5 rounded-lg hover:border-[#4647E0] hover:text-[#4647E0] text-xs"
                                          onClick={() => {
                                            // Handle quick action
                                            console.log("Quick action:", action)
                                            setAiHelpOpen(false)
                                          }}
                                        >
                                          <Sparkles className="h-3 w-3 mr-1.5 flex-shrink-0" />
                                          <span className="text-xs">{action}</span>
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Button 
                            className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                            onClick={() => {
                              // Check for non-CRM emails
                              const nonCRMEmails = emailComposer.to.filter(r => {
                                const isCRM = allContacts.some(c => c.email === r.email)
                                return !isCRM
                              })
                              
                              // Save context (client + project)
                              const emailData = {
                                to: emailComposer.to,
                                cc: emailComposer.cc,
                                subject: emailComposer.subject,
                                body: emailComposer.body,
                                clientId: emailComposer.selectedClient,
                                projectId: emailComposer.selectedProject
                              }
                              
                              // Here you would send the email via API
                              console.log("Sending email:", emailData)
                              
                              // Show suggestion for non-CRM emails
                              if (nonCRMEmails.length > 0) {
                                toast.info(
                                  `Sent to ${nonCRMEmails.length} new contact(s). Would you like to add them to your client list?`,
                                  {
                                    duration: 5000,
                                    action: {
                                      label: "Add to Client",
                                      onClick: () => {
                                        // Handle adding to client
                                        console.log("Add to client:", nonCRMEmails)
                                      }
                                    }
                                  }
                                )
                              } else {
                                toast.success("Email sent successfully")
                              }
                              
                              // Reset composer
                              setEmailComposer({
                                to: [],
                                cc: [],
                                subject: "",
                                body: "",
                                selectedClient: null,
                                selectedProject: null
                              })
                              setToInputValue("")
                              setIsNewEmail(false)
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Templates Modal */}
      <Dialog open={templatesModalOpen} onOpenChange={setTemplatesModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] rounded-2xl flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold">Templates</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTemplateEditorModalOpen(true)}
                className="rounded-xl"
              >
                <Plus className="h-4 w-4 mr-1" />
                New Template
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col min-h-0 space-y-4 mt-4">
            {/* Search and Toggle */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search templates…" className="pl-9 rounded-xl" />
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="template-toggle" className="text-sm text-gray-700 cursor-pointer">
                  Pre-made templates
                </Label>
                <Switch
                  id="template-toggle"
                  checked={templateType === "saved"}
                  onCheckedChange={(checked: boolean) => setTemplateType(checked ? "saved" : "premade")}
                />
                <Label htmlFor="template-toggle" className="text-sm text-gray-700 cursor-pointer">
                  Saved templates
                </Label>
              </div>
            </div>

            {/* Template List */}
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pr-4">
                {templateType === "saved" ? (
                  // Saved templates
                  templates.map((t) => (
                    <Card key={t.id} className="overflow-hidden rounded-2xl hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="font-medium text-sm text-gray-900 mb-1">{t.name}</div>
                        <div className="text-xs text-gray-500 mb-1">
                          <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2 mb-3">{t.preview}</div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setTemplatesModalOpen(false)}>
                            Insert
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Pre-made templates
                  [
                    { id: "pm1", name: "Project Proposal", category: "Proposal", preview: "Thank you for considering our proposal for..." },
                    { id: "pm2", name: "Invoice Follow-up", category: "Invoice", preview: "I wanted to follow up on invoice #..." },
                    { id: "pm3", name: "Milestone Update", category: "Follow-up", preview: "Great progress on the project! Here's an update..." },
                    { id: "pm4", name: "Payment Reminder", category: "Reminder", preview: "This is a friendly reminder that payment is due..." },
                  ].map((t) => (
                    <Card key={t.id} className="overflow-hidden rounded-2xl hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="font-medium text-sm text-gray-900 mb-1">{t.name}</div>
                        <div className="text-xs text-gray-500 mb-1">
                          <Badge variant="secondary" className="text-xs">{t.category}</Badge>
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2 mb-3">{t.preview}</div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setTemplatesModalOpen(false)}>
                            Insert
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Editor Modal */}
      <Dialog open={templateEditorModalOpen} onOpenChange={setTemplateEditorModalOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
              <Input placeholder="e.g., Friendly Follow-up" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Subject</label>
              <Input placeholder="e.g., Following up on our proposal" className="rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Body{" "}
                <span className="text-xs text-gray-500">
                  (use variables like {"{"}
                  {"{"}ClientName{"}"}{"}"}, {"{"}
                  {"{"}ProjectName{"}"}{"}"}, {"{"}
                  {"{"}Amount{"}"}{"}"}, {"{"}
                  {"{"}DueDate{"}"}{"}"}){" "}
                </span>
              </label>
              <Textarea
                placeholder="Write your template…"
                className="min-h-[200px] rounded-xl"
              />
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <div className="text-xs font-medium text-gray-700 mb-2">Preview</div>
              <div className="text-sm text-gray-800">
                Hi {"{"}
                {"{"}ClientName{"}"}{"}"}
                , just a friendly reminder your invoice for{" "}
                {"{"}
                {"{"}ProjectName{"}"}{"}"}
                {" "}is due on{" "}
                {"{"}
                {"{"}DueDate{"}"}{"}"}
                {" "}for{" "}
                {"{"}
                {"{"}Amount{"}"}{"}"}
                .
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTemplateEditorModalOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
