"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
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
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"

// Mock project data - in real app, this would be fetched based on the ID
const getProjectById = (id: string) => {
  const projects = {
    "1": {
      id: 1,
      name: "Website Redesign",
      client: { name: "Acme Corp", avatar: "AC", id: "acme-corp" },
      status: "active",
      progress: 65,
      lastUpdated: "2 hours ago",
      dueDate: "2024-03-15",
      tags: ["Urgent", "Design"],
      description: "Complete website redesign with modern UI/UX",
      milestones: [
        {
          id: 1,
          title: "Discovery & Research",
          status: "completed",
          dueDate: "2024-01-15",
          description: "User research and competitive analysis",
          completedDate: "2024-01-14",
          clientNote:
            "We had a great kickoff meeting where we discussed your vision for the new website. The main goals are to modernize the design, improve user experience, and increase conversion rates. We've documented all your requirements and will be using them as our north star throughout the project.",
          tasks: [
            {
              id: 1,
              title: "Conduct user interviews",
              status: "done",
              assignee: { name: "Sarah J", avatar: "SJ" },
              dueDate: "2024-01-05",
            },
            {
              id: 2,
              title: "Competitive analysis",
              status: "done",
              assignee: { name: "Mike R", avatar: "MR" },
              dueDate: "2024-01-10",
            },
            {
              id: 3,
              title: "Create user personas",
              status: "done",
              assignee: { name: "Sarah J", avatar: "SJ" },
              dueDate: "2024-01-12",
            },
          ],
        },
        {
          id: 2,
          title: "Wireframes & Prototypes",
          status: "completed",
          dueDate: "2024-02-01",
          description: "Low-fi and high-fi wireframes",
          completedDate: "2024-01-30",
          clientNote:
            "We've created detailed wireframes that map out the user journey and information architecture. These wireframes serve as the blueprint for your new website and ensure we're aligned on the structure before moving to visual design.",
          tasks: [
            {
              id: 4,
              title: "Create wireframes",
              status: "done",
              assignee: { name: "Alex K", avatar: "AK" },
              dueDate: "2024-01-25",
            },
            {
              id: 5,
              title: "Design system creation",
              status: "done",
              assignee: { name: "Sarah J", avatar: "SJ" },
              dueDate: "2024-01-30",
            },
          ],
        },
        {
          id: 3,
          title: "Visual Design",
          status: "in-progress",
          dueDate: "2024-02-20",
          description: "UI design and style guide creation",
          progress: 80,
          clientNote:
            "We're currently working on the visual design phase, incorporating your brand guidelines and feedback from the wireframe review. The design concepts will be ready for your review by the end of this week.",
          tasks: [
            {
              id: 6,
              title: "Homepage mockup",
              status: "done",
              assignee: { name: "Alex K", avatar: "AK" },
              dueDate: "2024-02-10",
            },
            {
              id: 7,
              title: "Inner pages design",
              status: "in-progress",
              assignee: { name: "Sarah J", avatar: "SJ" },
              dueDate: "2024-02-15",
            },
            {
              id: 8,
              title: "Mobile responsive design",
              status: "todo",
              assignee: { name: "Alex K", avatar: "AK" },
              dueDate: "2024-02-18",
            },
          ],
        },
        {
          id: 4,
          title: "Development",
          status: "upcoming",
          dueDate: "2024-03-10",
          description: "Frontend and backend development",
          clientNote:
            "Once the designs are approved, our development team will begin building your website using the latest technologies to ensure optimal performance and user experience.",
          tasks: [
            {
              id: 9,
              title: "Frontend development",
              status: "todo",
              assignee: { name: "Mike R", avatar: "MR" },
              dueDate: "2024-03-05",
            },
            {
              id: 10,
              title: "Backend integration",
              status: "todo",
              assignee: { name: "Alex K", avatar: "AK" },
              dueDate: "2024-03-08",
            },
          ],
        },
        {
          id: 5,
          title: "Testing & Launch",
          status: "upcoming",
          dueDate: "2024-03-15",
          description: "QA testing and production deployment",
          clientNote:
            "The final phase includes comprehensive testing, client training, and the official launch of your new website. We'll also provide ongoing support documentation.",
          tasks: [
            {
              id: 11,
              title: "Quality assurance testing",
              status: "todo",
              assignee: { name: "Sarah J", avatar: "SJ" },
              dueDate: "2024-03-12",
            },
            {
              id: 12,
              title: "Launch preparation",
              status: "todo",
              assignee: { name: "Mike R", avatar: "MR" },
              dueDate: "2024-03-15",
            },
          ],
        },
      ],
      messages: 12,
      files: 8,
      invoices: 3,
    },
  }
  return projects[id as keyof typeof projects]
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string
  const project = getProjectById(projectId)

  const [activeTab, setActiveTab] = useState("activity")
  const [isNewMilestoneOpen, setIsNewMilestoneOpen] = useState(false)
  const [newMilestone, setNewMilestone] = useState({
    title: "",
    dueDate: "",
    description: "",
    clientNote: "",
  })

  const [expandedSteps, setExpandedSteps] = useState<number[]>([])
  const [isNewTaskOpen, setIsNewTaskOpen] = useState<number | null>(null)
  const [newTask, setNewTask] = useState({
    title: "",
    assignee: "",
    dueDate: "",
  })

  const [milestones, setMilestones] = useState(project?.milestones || [])
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [editingNote, setEditingNote] = useState("")

  if (!project) {
    return <div>Project not found</div>
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
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Clock className="h-5 w-5 text-[#3C3CFF]" />
      case "upcoming":
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-400" />
    }
  }

  const handleAddMilestone = () => {
    const milestone = {
      id: milestones.length + 1,
      title: newMilestone.title,
      status: "upcoming" as const,
      dueDate: newMilestone.dueDate,
      description: newMilestone.description,
      clientNote: newMilestone.clientNote,
    }
    setMilestones([...milestones, milestone])
    setIsNewMilestoneOpen(false)
    setNewMilestone({ title: "", dueDate: "", description: "", clientNote: "" })
  }

  const handleEditNote = (milestoneId: number) => {
    const milestone = milestones.find((m) => m.id === milestoneId)
    if (milestone) {
      setEditingNoteId(milestoneId)
      setEditingNote(milestone.clientNote || "")
    }
  }

  const handleSaveNote = (milestoneId: number) => {
    setMilestones(milestones.map((m) => (m.id === milestoneId ? { ...m, clientNote: editingNote } : m)))
    setEditingNoteId(null)
    setEditingNote("")
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditingNote("")
  }

  const calculateStepProgress = (tasks: any[]) => {
    if (tasks.length === 0) return 0
    const completedTasks = tasks.filter((task) => task.status === "done").length
    return Math.round((completedTasks / tasks.length) * 100)
  }

  const toggleStepExpansion = (stepId: number) => {
    setExpandedSteps((prev) => (prev.includes(stepId) ? prev.filter((id) => id !== stepId) : [...prev, stepId]))
  }

  const handleAddTask = (stepId: number) => {
    console.log("Adding task to step:", stepId, newTask)
    setIsNewTaskOpen(null)
    setNewTask({ title: "", assignee: "", dueDate: "" })
  }

  const moveTask = (taskId: number, newStatus: string) => {
    console.log("Moving task:", taskId, "to status:", newStatus)
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700 border-green-200"
      case "in-progress":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "todo":
        return "bg-gray-100 text-gray-700 border-gray-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-[#F7F9FB]">
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <nav className="flex items-center space-x-2 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-[#3C3CFF] transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/dashboard/projects" className="hover:text-[#3C3CFF] transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{project.name}</span>
        </nav>
      </div>

      {/* Sticky Project Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                      {project.client.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-gray-600">{project.client.name}</span>
                  <div className="flex items-center space-x-1 text-sm text-gray-500 ml-4">
                    <Target className="h-4 w-4" />
                    <span>{project.progress}% Complete</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {project.status.replace("-", " ")}
              </Badge>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Portal
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-12 bg-transparent border-0 p-0 space-x-8">
              <TabsTrigger
                value="timeline"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                📅 Timeline
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                💬 Messages
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                📁 Files
              </TabsTrigger>
              <TabsTrigger
                value="forms"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                🧾 Forms
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                📄 Contracts
              </TabsTrigger>
              <TabsTrigger
                value="invoices"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                💸 Invoices
              </TabsTrigger>
              <TabsTrigger
                value="activity"
                className="h-12 px-0 bg-transparent border-0 border-b-2 border-transparent data-[state=active]:border-[#3C3CFF] data-[state=active]:bg-transparent rounded-none text-gray-600 data-[state=active]:text-[#3C3CFF] font-medium transition-all duration-200"
              >
                📜 Activity Log
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 h-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6 mt-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Project Timeline</h2>
                <p className="text-gray-600 mt-1">Track milestones and project progress</p>
              </div>
              <Dialog open={isNewMilestoneOpen} onOpenChange={setIsNewMilestoneOpen}>
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
                        value={newMilestone.dueDate}
                        onChange={(e) => setNewMilestone({ ...newMilestone, dueDate: e.target.value })}
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
                        value={newMilestone.clientNote}
                        onChange={(e) => setNewMilestone({ ...newMilestone, clientNote: e.target.value })}
                        placeholder="Optional note that will be visible to the client"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                      <Button variant="outline" onClick={() => setIsNewMilestoneOpen(false)}>
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

            <div className="space-y-4">
              {milestones.map((milestone, index) => {
                const progress = calculateStepProgress(milestone.tasks || [])
                const isExpanded = expandedSteps.includes(milestone.id)

                return (
                  <div key={milestone.id} className="relative">
                    {index < milestones.length - 1 && (
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
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Milestone
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleEditNote(milestone.id)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Edit Client Note
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Add Files
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    {milestone.status === "completed" ? "Mark Incomplete" : "Mark Complete"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                {milestone.dueDate && (
                                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                                    <CalendarDays className="h-4 w-4" />
                                    <span>Due {new Date(milestone.dueDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {milestone.tasks && milestone.tasks.length > 0 && (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-[#3C3CFF] transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-xs text-gray-600">{progress}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    milestone.status === "completed"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : milestone.status === "in-progress"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}
                                >
                                  {milestone.status.replace("-", " ")}
                                </Badge>
                                {milestone.tasks && milestone.tasks.length > 0 && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => toggleStepExpansion(milestone.id)}
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
                                )}
                              </div>
                            </div>

                            {/* Expandable Kanban Section */}
                            {isExpanded && milestone.tasks && (
                              <div className="mt-6 pt-6 border-t border-gray-100 bg-[#F9FAFB] rounded-xl p-4 transition-all duration-300">
                                <div className="flex items-center justify-between mb-4">
                                  <h5 className="font-medium text-gray-900">Tasks</h5>
                                  <Button
                                    size="sm"
                                    onClick={() => setIsNewTaskOpen(milestone.id)}
                                    className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Task
                                  </Button>
                                </div>

                                {/* Mini Kanban Board */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* To Do Column */}
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                                      <h6 className="text-sm font-medium text-gray-700">To Do</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task) => task.status === "todo").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task) => task.status === "todo")
                                        .map((task) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
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
                                                      >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                      <DropdownMenuItem
                                                        onClick={() => moveTask(task.id, "in-progress")}
                                                      >
                                                        Start Task
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => moveTask(task.id, "done")}>
                                                        Mark Complete
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem>
                                                        <Edit className="h-3 w-3 mr-2" />
                                                        Edit Task
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
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
                                                        {task.assignee.avatar}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.dueDate && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                    </div>
                                  </div>

                                  {/* In Progress Column */}
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-[#3C3CFF]"></div>
                                      <h6 className="text-sm font-medium text-gray-700">In Progress</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task) => task.status === "in-progress").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task) => task.status === "in-progress")
                                        .map((task) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm"
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
                                                      >
                                                        <MoreHorizontal className="h-3 w-3" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-40">
                                                      <DropdownMenuItem onClick={() => moveTask(task.id, "todo")}>
                                                        Move to To Do
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => moveTask(task.id, "done")}>
                                                        Mark Complete
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem>
                                                        <Edit className="h-3 w-3 mr-2" />
                                                        Edit Task
                                                      </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </div>
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
                                                        {task.assignee.avatar}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.dueDate && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Done Column */}
                                  <div className="space-y-3">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                      <h6 className="text-sm font-medium text-gray-700">Done</h6>
                                      <Badge variant="outline" className="text-xs">
                                        {milestone.tasks.filter((task) => task.status === "done").length}
                                      </Badge>
                                    </div>
                                    <div className="space-y-2">
                                      {milestone.tasks
                                        .filter((task) => task.status === "done")
                                        .map((task) => (
                                          <Card
                                            key={task.id}
                                            className="bg-white border border-gray-200 rounded-lg shadow-sm opacity-75"
                                          >
                                            <CardContent className="p-3">
                                              <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                  <h6 className="text-sm font-medium text-gray-900 leading-tight line-through">
                                                    {task.title}
                                                  </h6>
                                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                                </div>
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
                                                        {task.assignee.avatar}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                  )}
                                                </div>
                                                {task.dueDate && (
                                                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                                                    <CalendarDays className="h-3 w-3" />
                                                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </CardContent>
                                          </Card>
                                        ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Add Task Modal */}
                                {isNewTaskOpen === milestone.id && (
                                  <Dialog open={true} onOpenChange={() => setIsNewTaskOpen(null)}>
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
                                          <Label htmlFor="taskAssignee">Assignee</Label>
                                          <Input
                                            id="taskAssignee"
                                            value={newTask.assignee}
                                            onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                                            placeholder="Assign to team member"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="taskDueDate">Due Date</Label>
                                          <Input
                                            id="taskDueDate"
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                          />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                          <Button variant="outline" onClick={() => setIsNewTaskOpen(null)}>
                                            Cancel
                                          </Button>
                                          <Button
                                            onClick={() => handleAddTask(milestone.id)}
                                            className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                          >
                                            Add Task
                                          </Button>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                )}
                              </div>
                            )}

                            {/* Client Note Section */}
                            <div className="space-y-3 mt-4">
                              <div className="flex items-center justify-between">
                                <h5 className="text-sm font-medium text-gray-900">Note to Client</h5>
                                {editingNoteId !== milestone.id && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditNote(milestone.id)}
                                    className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs"
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                )}
                              </div>

                              {editingNoteId === milestone.id ? (
                                <div className="space-y-3">
                                  <Textarea
                                    value={editingNote}
                                    onChange={(e) => setEditingNote(e.target.value)}
                                    placeholder="Enter a note for the client..."
                                    className="min-h-[100px] border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                                  />
                                  <div className="flex justify-end space-x-2">
                                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleSaveNote(milestone.id)}
                                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      Save Note
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-gray-50 rounded-xl p-4">
                                  {milestone.clientNote ? (
                                    <p className="text-sm text-gray-700 leading-relaxed">{milestone.clientNote}</p>
                                  ) : (
                                    <p className="text-sm text-gray-500 italic">
                                      No note added yet. Click "Edit" to add a note that will be visible to the client.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>

                            {milestone.completedDate && (
                              <div className="mt-2 text-xs text-green-600">
                                Completed on {new Date(milestone.completedDate).toLocaleDateString()}
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

          {/* Messages Tab */}
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
                      {project.client.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{project.client.name}</span>
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
                      {project.client.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{project.client.name}</span>
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
                      {project.client.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 max-w-md">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">{project.client.name}</span>
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

          {/* Files Tab */}
          <TabsContent value="files" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Files</h2>
                  <p className="text-gray-600 mt-1">Manage and organize project files</p>
                </div>
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    id: 1,
                    name: "Initial Wireframes.pdf",
                    type: "pdf",
                    size: "3.2 MB",
                    uploadedAt: "3 days ago",
                    status: "approved",
                    uploadedBy: "Design Team",
                    comments: 5,
                  },
                  {
                    id: 2,
                    name: "Brand Assets.zip",
                    type: "zip",
                    size: "12.4 MB",
                    uploadedAt: "1 week ago",
                    status: "pending",
                    uploadedBy: "Sarah Johnson",
                    comments: 2,
                  },
                  {
                    id: 3,
                    name: "Homepage Mockup.png",
                    type: "image",
                    size: "2.1 MB",
                    uploadedAt: "2 days ago",
                    status: "approved",
                    uploadedBy: "Design Team",
                    comments: 8,
                  },
                  {
                    id: 4,
                    name: "Content Strategy.docx",
                    type: "document",
                    size: "456 KB",
                    uploadedAt: "5 days ago",
                    status: "pending",
                    uploadedBy: "Content Team",
                    comments: 1,
                  },
                  {
                    id: 5,
                    name: "Logo Variations.ai",
                    type: "design",
                    size: "8.7 MB",
                    uploadedAt: "1 week ago",
                    status: "approved",
                    uploadedBy: "Design Team",
                    comments: 12,
                  },
                ].map((file) => {
                  const getFileIcon = (type: string) => {
                    switch (type) {
                      case "pdf":
                        return "📄"
                      case "zip":
                        return "📦"
                      case "image":
                        return "🖼️"
                      case "document":
                        return "📝"
                      case "design":
                        return "🎨"
                      default:
                        return "📄"
                    }
                  }

                  return (
                    <Card key={file.id} className="bg-white border-0 shadow-sm rounded-2xl">
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className="text-3xl">{getFileIcon(file.type)}</div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{file.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{file.size}</span>
                                  <span>•</span>
                                  <span>Uploaded {file.uploadedAt}</span>
                                  <span>•</span>
                                  <span>by {file.uploadedBy}</span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              className={`${
                                file.status === "approved"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {file.status === "approved" ? "Approved" : "Pending Approval"}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                                <Eye className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                              <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                Comments ({file.comments})
                              </Button>
                            </div>

                            <div className="flex items-center space-x-2">
                              {file.status === "pending" && (
                                <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve
                                </Button>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Upload className="h-4 w-4 mr-2" />
                                    Replace
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600">Delete File</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Forms</h2>
                  <p className="text-gray-600 mt-1">Manage forms assigned to this project</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                      <Plus className="h-4 w-4 mr-2" />
                      Assign New Form
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Assign Forms to Project</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Available Form Templates</Label>
                        <div className="grid gap-3 max-h-96 overflow-y-auto">
                          {[
                            {
                              id: 1,
                              name: "Design Brief",
                              description: "Collect design requirements and preferences",
                              category: "Design",
                            },
                            {
                              id: 2,
                              name: "Client Intake",
                              description: "Initial client information and project details",
                              category: "Onboarding",
                            },
                            {
                              id: 3,
                              name: "Feedback Round 1",
                              description: "First round of design feedback",
                              category: "Feedback",
                            },
                            {
                              id: 4,
                              name: "Content Requirements",
                              description: "Gather content and copy requirements",
                              category: "Content",
                            },
                            {
                              id: 5,
                              name: "Final Approval",
                              description: "Final project approval and sign-off",
                              category: "Approval",
                            },
                            {
                              id: 6,
                              name: "Brand Guidelines",
                              description: "Brand assets and style guide collection",
                              category: "Design",
                            },
                          ].map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-[#3C3CFF] focus:ring-[#3C3CFF]"
                              />
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{template.name}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {template.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{template.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Assign To</Label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-[#3C3CFF]">
                          <option value="client">Client ({project.client.name})</option>
                          <option value="team">Internal Team</option>
                          <option value="both">Both Client & Team</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline">Cancel</Button>
                        <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">Assign Selected Forms</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Forms List */}
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    title: "Design Brief",
                    assignedTo: "Client",
                    status: "submitted",
                    lastUpdated: "3 days ago",
                    tag: "Required",
                    submittedBy: project.client.name,
                    submittedAt: "2024-01-15",
                  },
                  {
                    id: 2,
                    title: "Client Intake",
                    assignedTo: "Client",
                    status: "submitted",
                    lastUpdated: "1 week ago",
                    tag: "Required",
                    submittedBy: project.client.name,
                    submittedAt: "2024-01-08",
                  },
                  {
                    id: 3,
                    title: "Feedback Round 1",
                    assignedTo: "Client",
                    status: "in-progress",
                    lastUpdated: "2 days ago",
                    tag: "Required",
                  },
                  {
                    id: 4,
                    title: "Content Requirements",
                    assignedTo: "Client",
                    status: "not-started",
                    lastUpdated: "5 days ago",
                    tag: "Optional",
                  },
                  {
                    id: 5,
                    title: "Brand Guidelines Review",
                    assignedTo: "Internal Team",
                    status: "submitted",
                    lastUpdated: "4 days ago",
                    tag: "Required",
                    submittedBy: "Design Team",
                    submittedAt: "2024-01-12",
                  },
                ].map((form) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "submitted":
                        return "bg-green-100 text-green-700 border-green-200"
                      case "in-progress":
                        return "bg-blue-100 text-blue-700 border-blue-200"
                      case "not-started":
                        return "bg-gray-100 text-gray-700 border-gray-200"
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  }

                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case "submitted":
                        return <CheckCircle className="h-4 w-4 text-green-500" />
                      case "in-progress":
                        return <Clock className="h-4 w-4 text-blue-500" />
                      case "not-started":
                        return <Circle className="h-4 w-4 text-gray-400" />
                      default:
                        return <Circle className="h-4 w-4 text-gray-400" />
                    }
                  }

                  const getActionButton = (status: string, assignedTo: string) => {
                    if (status === "submitted") {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )
                    } else if (assignedTo === "Client") {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Fill Out
                        </Button>
                      )
                    } else {
                      return (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )
                    }
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
                                    form.tag === "Required"
                                      ? "bg-red-50 text-red-700 border-red-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  }`}
                                >
                                  {form.tag}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Assigned to:</span>
                                  <div className="flex items-center space-x-1">
                                    {form.assignedTo === "Client" ? (
                                      <>
                                        <Avatar className="h-5 w-5">
                                          <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                            {project.client.avatar}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-gray-900">{project.client.name}</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-5 h-5 bg-[#F0F2FF] rounded-full flex items-center justify-center">
                                          <span className="text-xs text-[#3C3CFF] font-medium">T</span>
                                        </div>
                                        <span className="text-sm font-medium text-gray-900">{form.assignedTo}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Status:</span>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(form.status)}
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(form.status)}`}>
                                      {form.status === "not-started"
                                        ? "Not Started"
                                        : form.status === "in-progress"
                                          ? "In Progress"
                                          : "Submitted"}
                                    </Badge>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-500">Last updated:</span>
                                  <span className="text-sm text-gray-900">{form.lastUpdated}</span>
                                </div>
                              </div>

                              {form.status === "submitted" && form.submittedBy && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">
                                      <span className="font-medium">Submitted by {form.submittedBy}</span> on{" "}
                                      {new Date(form.submittedAt!).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getActionButton(form.status, form.assignedTo)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Form
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send Reminder
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Remove from Project</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Empty State - uncomment this and comment out the forms list above to see the empty state */}
              {/* 
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardContent className="p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No forms have been added to this project yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Assign forms from your template library to collect information, feedback, and approvals from your client.
          </p>
          <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            <Plus className="h-4 w-4 mr-2" />
            Assign a Form
          </Button>
        </div>
      </CardContent>
    </Card>
    */}
            </div>
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Contracts</h2>
                  <p className="text-gray-600 mt-1">Manage contracts specific to this project</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                  >
                    Link Existing Contract
                  </Button>
                  <Link href={`/dashboard/contracts/new?clientId=${project.client.id}&projectId=${project.id}`}>
                    <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Contract
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Contracts List */}
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    name: "Website Design Agreement",
                    status: "signed",
                    lastActivity: "Signed 3 days ago",
                    signers: [
                      { name: "John Smith", avatar: "JS", signed: true },
                      { name: "Your Company", avatar: "YC", signed: true },
                    ],
                    value: "$15,000",
                    createdAt: "2024-01-15",
                  },
                  {
                    id: 2,
                    name: "Project Amendment #1",
                    status: "awaiting-signature",
                    lastActivity: "Sent 2 hours ago",
                    signers: [
                      { name: "John Smith", avatar: "JS", signed: false },
                      { name: "Your Company", avatar: "YC", signed: true },
                    ],
                    value: "$3,500",
                    createdAt: "2024-01-20",
                  },
                  {
                    id: 3,
                    name: "NDA - Website Project",
                    status: "sent",
                    lastActivity: "Viewed 1 day ago",
                    signers: [
                      { name: "John Smith", avatar: "JS", signed: false },
                      { name: "Your Company", avatar: "YC", signed: false },
                    ],
                    value: null,
                    createdAt: "2024-01-10",
                  },
                  {
                    id: 4,
                    name: "Final Payment Agreement",
                    status: "draft",
                    lastActivity: "Created 5 days ago",
                    signers: [
                      { name: "John Smith", avatar: "JS", signed: false },
                      { name: "Your Company", avatar: "YC", signed: false },
                    ],
                    value: "$7,500",
                    createdAt: "2024-01-18",
                  },
                ].map((contract) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "draft":
                        return "bg-gray-100 text-gray-700 border-gray-200"
                      case "sent":
                        return "bg-blue-100 text-blue-700 border-blue-200"
                      case "awaiting-signature":
                        return "bg-purple-100 text-purple-700 border-purple-200"
                      case "partially-signed":
                        return "bg-yellow-100 text-yellow-700 border-yellow-200"
                      case "signed":
                        return "bg-green-100 text-green-700 border-green-200"
                      case "declined":
                        return "bg-red-100 text-red-700 border-red-200"
                      case "expired":
                        return "bg-amber-100 text-amber-700 border-amber-200"
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  }

                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case "draft":
                        return <Edit className="h-4 w-4 text-gray-500" />
                      case "sent":
                        return <Send className="h-4 w-4 text-blue-500" />
                      case "awaiting-signature":
                        return <Clock className="h-4 w-4 text-purple-500" />
                      case "partially-signed":
                        return <AlertCircle className="h-4 w-4 text-yellow-500" />
                      case "signed":
                        return <CheckCircle className="h-4 w-4 text-green-500" />
                      case "declined":
                        return <AlertCircle className="h-4 w-4 text-red-500" />
                      case "expired":
                        return <AlertCircle className="h-4 w-4 text-amber-500" />
                      default:
                        return <Circle className="h-4 w-4 text-gray-400" />
                    }
                  }

                  const getStatusLabel = (status: string) => {
                    switch (status) {
                      case "awaiting-signature":
                        return "Awaiting Signature"
                      case "partially-signed":
                        return "Partially Signed"
                      default:
                        return status.charAt(0).toUpperCase() + status.slice(1)
                    }
                  }

                  const getActionButton = (status: string) => {
                    switch (status) {
                      case "draft":
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )
                      case "sent":
                      case "awaiting-signature":
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Resend
                          </Button>
                        )
                      case "signed":
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )
                      default:
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )
                    }
                  }

                  return (
                    <Card
                      key={contract.id}
                      className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className="text-2xl">📄</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <Link
                                  href={`/dashboard/contracts/${contract.id}`}
                                  className="font-semibold text-gray-900 hover:text-[#3C3CFF] transition-colors"
                                >
                                  {contract.name}
                                </Link>
                                <Badge variant="outline" className={`text-xs ${getStatusColor(contract.status)}`}>
                                  <div className="flex items-center space-x-1">
                                    {getStatusIcon(contract.status)}
                                    <span>{getStatusLabel(contract.status)}</span>
                                  </div>
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <span className="text-sm text-gray-500">Last Activity</span>
                                  <div className="text-sm font-medium text-gray-900 mt-1">{contract.lastActivity}</div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Signers</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {contract.signers.map((signer, index) => (
                                      <div key={index} className="relative">
                                        <Avatar className="h-6 w-6">
                                          <AvatarFallback
                                            className={`text-xs font-medium ${
                                              signer.signed
                                                ? "bg-green-100 text-green-700"
                                                : "bg-gray-200 text-gray-700"
                                            }`}
                                          >
                                            {signer.avatar}
                                          </AvatarFallback>
                                        </Avatar>
                                        {signer.signed && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                            <CheckCircle className="h-2 w-2 text-white" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Value</span>
                                  <div className="text-sm font-medium text-gray-900 mt-1">{contract.value || "—"}</div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Created</span>
                                  <div className="text-sm font-medium text-gray-900 mt-1">
                                    {new Date(contract.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>

                              {/* Smart Behavior Indicators */}
                              {contract.status === "signed" && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">
                                      <span className="font-medium">Contract completed!</span> Signed PDF saved to
                                      project files.
                                    </span>
                                  </div>
                                </div>
                              )}

                              {contract.status === "sent" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <Send className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm text-blue-700">
                                      <span className="font-medium">Action needed</span> added to client portal for
                                      signature.
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getActionButton(contract.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                  {contract.status !== "signed" && (
                                    <Badge className="ml-2 bg-gray-100 text-gray-600 text-xs">Watermark on Free</Badge>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Unlink from Project
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  <AlertCircle className="h-4 w-4 mr-2" />
                                  Delete Contract
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

              {/* Plan Features Notice */}
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 mb-1">Plan Features</p>
                      <ul className="text-amber-700 space-y-1">
                        <li>• Free: Watermark applied on PDF downloads</li>
                        <li>• Starter: Template editing and reminders locked</li>
                        <li>• Premium: Custom domain for e-sign links, no watermark</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State - uncomment this and comment out the contracts list above to see the empty state */}
              {/* 
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardContent className="p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create contracts for this project to manage agreements, signatures, and legal documents all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/dashboard/contracts/new?clientId=${project.client.id}&projectId=${project.id}`}>
              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                <Plus className="h-4 w-4 mr-2" />
                Create Contract
              </Button>
            </Link>
            <Button variant="outline" className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent">
              Link Existing Contract
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    */}
            </div>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Invoices</h2>
                  <p className="text-gray-600 mt-1">Manage billing and payments for this project</p>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Invoice Number</Label>
                          <Input placeholder="INV-0024" defaultValue="INV-0024" />
                        </div>
                        <div className="space-y-2">
                          <Label>Due Date</Label>
                          <Input type="date" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Billed To</Label>
                        <Input value={`${project.client.name}`} disabled className="bg-gray-50" />
                      </div>

                      <div className="space-y-2">
                        <Label>Invoice Items</Label>
                        <div className="space-y-3">
                          <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-700">
                            <div className="col-span-6">Description</div>
                            <div className="col-span-2">Quantity</div>
                            <div className="col-span-2">Rate</div>
                            <div className="col-span-2">Amount</div>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <Input className="col-span-6" placeholder="Website Design Phase 1" />
                            <Input className="col-span-2" placeholder="1" />
                            <Input className="col-span-2" placeholder="2500.00" />
                            <div className="col-span-2 flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                              $2,500.00
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2">
                            <Input className="col-span-6" placeholder="Additional revisions" />
                            <Input className="col-span-2" placeholder="2" />
                            <Input className="col-span-2" placeholder="150.00" />
                            <div className="col-span-2 flex items-center px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-600">
                              $300.00
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-fit bg-transparent">
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Invoice Type</Label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-[#3C3CFF]">
                          <option value="standard">Standard Invoice</option>
                          <option value="deposit">Deposit</option>
                          <option value="milestone">Milestone Payment</option>
                          <option value="final">Final Payment</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Textarea placeholder="Payment terms, additional notes..." rows={3} />
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center text-lg font-semibold">
                          <span>Total Amount:</span>
                          <span className="text-[#3C3CFF]">$2,800.00</span>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <Button variant="outline">Save as Draft</Button>
                        <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">Create & Send Invoice</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Invoices List */}
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    number: "INV-0023",
                    amount: 2500.0,
                    status: "paid",
                    issueDate: "2024-01-15",
                    dueDate: "2024-02-15",
                    paidDate: "2024-01-28",
                    type: "Deposit",
                    items: ["Website Design - Phase 1", "Initial Wireframes"],
                  },
                  {
                    id: 2,
                    number: "INV-0021",
                    amount: 1800.0,
                    status: "paid",
                    issueDate: "2024-01-01",
                    dueDate: "2024-01-31",
                    paidDate: "2024-01-25",
                    type: "Milestone Payment",
                    items: ["Design System Creation", "Brand Guidelines Review"],
                  },
                  {
                    id: 3,
                    number: "INV-0024",
                    amount: 3200.0,
                    status: "unpaid",
                    issueDate: "2024-01-20",
                    dueDate: "2024-02-20",
                    type: "Standard Invoice",
                    items: ["Visual Design Phase", "Mobile Responsive Design", "Additional Revisions"],
                  },
                  {
                    id: 4,
                    number: "INV-0025",
                    amount: 2000.0,
                    status: "overdue",
                    issueDate: "2024-01-05",
                    dueDate: "2024-01-25",
                    type: "Final Payment",
                    items: ["Development Phase", "Testing & QA", "Launch Support"],
                  },
                  {
                    id: 5,
                    number: "INV-0026",
                    amount: 1500.0,
                    status: "draft",
                    issueDate: "2024-01-25",
                    dueDate: "2024-02-25",
                    type: "Standard Invoice",
                    items: ["Additional Features", "Performance Optimization"],
                  },
                ].map((invoice) => {
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case "paid":
                        return "bg-green-100 text-green-700 border-green-200"
                      case "unpaid":
                        return "bg-yellow-100 text-yellow-700 border-yellow-200"
                      case "overdue":
                        return "bg-red-100 text-red-700 border-red-200"
                      case "draft":
                        return "bg-gray-100 text-gray-700 border-gray-200"
                      default:
                        return "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  }

                  const getStatusIcon = (status: string) => {
                    switch (status) {
                      case "paid":
                        return <CheckCircle className="h-4 w-4 text-green-500" />
                      case "unpaid":
                        return <Clock className="h-4 w-4 text-yellow-500" />
                      case "overdue":
                        return <AlertCircle className="h-4 w-4 text-red-500" />
                      case "draft":
                        return <Edit className="h-4 w-4 text-gray-400" />
                      default:
                        return <Circle className="h-4 w-4 text-gray-400" />
                    }
                  }

                  const getActionButton = (status: string) => {
                    switch (status) {
                      case "paid":
                        return (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Invoice
                          </Button>
                        )
                      case "unpaid":
                        return (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                              <Send className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          </div>
                        )
                      case "overdue":
                        return (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button size="sm" className="bg-red-600 hover:bg-red-700">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Follow Up
                            </Button>
                          </div>
                        )
                      case "draft":
                        return (
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                              <Send className="h-4 w-4 mr-1" />
                              Send
                            </Button>
                          </div>
                        )
                      default:
                        return null
                    }
                  }

                  return (
                    <Card
                      key={invoice.id}
                      className="bg-white border-0 shadow-sm rounded-2xl hover:shadow-md transition-all duration-200"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="flex-shrink-0 mt-1">
                              <div className="text-2xl">🧾</div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <h4 className="font-semibold text-gray-900 text-lg">{invoice.number}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${
                                    invoice.type === "Deposit"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : invoice.type === "Final Payment"
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : invoice.type === "Milestone Payment"
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                                  }`}
                                >
                                  {invoice.type}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div>
                                  <span className="text-sm text-gray-500">Billed To</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Avatar className="h-5 w-5">
                                      <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                        {project.client.avatar}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-gray-900">{project.client.name}</span>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Amount</span>
                                  <div className="text-lg font-semibold text-gray-900 mt-1">
                                    ${invoice.amount.toLocaleString()}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Issue Date</span>
                                  <div className="text-sm text-gray-900 mt-1">
                                    {new Date(invoice.issueDate).toLocaleDateString()}
                                  </div>
                                  <span className="text-sm text-gray-500">Due Date</span>
                                  <div className="text-sm text-gray-900">
                                    {new Date(invoice.dueDate).toLocaleDateString()}
                                  </div>
                                </div>

                                <div>
                                  <span className="text-sm text-gray-500">Status</span>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {getStatusIcon(invoice.status)}
                                    <Badge variant="outline" className={`text-xs ${getStatusColor(invoice.status)}`}>
                                      {invoice.status === "unpaid"
                                        ? "Unpaid"
                                        : invoice.status === "paid"
                                          ? "Paid"
                                          : invoice.status === "overdue"
                                            ? "Overdue"
                                            : "Draft"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {invoice.status === "paid" && invoice.paidDate && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-700">
                                      <span className="font-medium">Paid</span> on{" "}
                                      {new Date(invoice.paidDate).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {invoice.status === "overdue" && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-700">
                                      <span className="font-medium">Overdue</span> by{" "}
                                      {Math.ceil(
                                        (new Date().getTime() - new Date(invoice.dueDate).getTime()) /
                                          (1000 * 3600 * 24),
                                      )}{" "}
                                      days
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1">
                                <span className="text-sm text-gray-500">Items:</span>
                                <div className="flex flex-wrap gap-2">
                                  {invoice.items.map((item, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-gray-50">
                                      {item}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {getActionButton(invoice.status)}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Invoice
                                </DropdownMenuItem>
                                {invoice.status === "unpaid" && (
                                  <DropdownMenuItem>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Paid
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send Message
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete Invoice</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Empty State - uncomment this and comment out the invoices list above to see the empty state */}
              {/* 
    <Card className="bg-white border-0 shadow-sm rounded-2xl">
      <CardContent className="p-12">
        <div className="text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices have been created for this project yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create and send professional invoices to {project.client.name} for this project. Track payments and manage billing all in one place.
          </p>
          <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
            <Plus className="h-4 w-4 mr-2" />
            Create an Invoice
          </Button>
        </div>
      </CardContent>
    </Card>
    */}
            </div>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="mt-0">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Project Activity</h2>
                  <p className="text-gray-600 mt-1">Track all actions and changes within this project</p>
                </div>
                <div className="flex items-center space-x-3">
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-[#3C3CFF]">
                    <option value="all">All Activities</option>
                    <option value="messages">Messages</option>
                    <option value="forms">Forms</option>
                    <option value="files">Files</option>
                    <option value="invoices">Invoices</option>
                    <option value="timeline">Timeline</option>
                  </select>
                  <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-[#3C3CFF]">
                    <option value="all">All Users</option>
                    <option value="team">Team Only</option>
                    <option value="client">Client Only</option>
                  </select>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="bg-white border-0 shadow-sm rounded-2xl overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {/* Today Section */}
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="bg-[#3C3CFF] text-white px-3 py-1 rounded-full text-sm font-medium">Today</div>
                      <div className="text-sm text-gray-500">July 28, 2025</div>
                    </div>

                    <div className="space-y-6">
                      {/* Recent Activity Items */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Invoice INV-0024 marked as paid</span>
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">2:14 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Invoice
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">New message received from client</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                "The mockups look great! Just a few minor adjustments needed..."
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">1:45 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Message
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">File uploaded: Homepage_Mockup_v2.png</span>
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                      SJ
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">Sarah Johnson</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">11:30 AM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View File
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">
                                  Timeline milestone "Visual Design" marked as complete
                                </span>
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                      MR
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">Mike Rodriguez</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">10:15 AM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Timeline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Yesterday Section */}
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        Yesterday
                      </div>
                      <div className="text-sm text-gray-500">July 27, 2025</div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Upload className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Client submitted "Design Feedback Form"</span>
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">4:22 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Form
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Eye className="h-5 w-5 text-yellow-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Client viewed project portal</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Spent 12 minutes reviewing timeline and files
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">2:15 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Portal
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <Plus className="h-5 w-5 text-indigo-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">New task added: "Mobile responsive design"</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Assigned to Alex Kim • Due Feb 18, 2024</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                      SJ
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">Sarah Johnson</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">1:30 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Task
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Earlier This Week Section */}
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                        Earlier This Week
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">File approved: Initial_Wireframes.pdf</span>
                              </p>
                              <div className="flex items-center space-x-3 mt-1">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">July 25 • 3:45 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View File
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Send className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Invoice INV-0023 sent to client</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">Amount: $2,500.00 • Due: Feb 15, 2024</p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                      MR
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">Mike Rodriguez</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">July 24 • 11:20 AM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Invoice
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Comment added to wireframes file</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                "Love the navigation structure! Can we make the CTA button more prominent?"
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-gray-200 text-gray-700 text-xs font-medium">
                                      {project.client.avatar}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">{project.client.name}</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">July 23 • 4:10 PM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Comment
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <Target className="h-5 w-5 text-teal-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">Project created: Website Redesign</span>
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                Initial project setup and client onboarding completed
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                                      SJ
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-xs text-gray-600">Sarah Johnson</span>
                                </div>
                                <span className="text-xs text-[#3C3CFF]">July 22 • 9:00 AM</span>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] text-xs">
                              View Project
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Load More Section */}
                  <div className="p-6 text-center border-t border-gray-100">
                    <Button
                      variant="outline"
                      className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent"
                    >
                      Load Earlier Activities
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
