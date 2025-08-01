"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Download,
  Upload,
  CreditCard,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  PenTool,
  DollarSign,
  Menu,
  X,
  MessageCircle,
  MoreHorizontal,
  Sparkles,
  Paperclip,
} from "lucide-react"
import { useParams } from "next/navigation"

// Mock data based on client slug
const getClientData = (slug: string) => {
  const clientData = {
    "acme-co": {
      clientName: "Sarah Johnson",
      companyName: "Acme Corp",
      avatar: "SJ",
      // Branding settings
      branding: {
        logo: "/placeholder.svg?height=60&width=200&text=Acme+Corp+Logo",
        primaryColor: "#3C3CFF",
        headerBackgroundImage: "/placeholder.svg?height=300&width=1200&text=Header+Background",
        useBackgroundImage: true, // Toggle for using background image vs solid color
      },
      projects: [
        {
          id: 1,
          name: "Website Redesign",
          status: "In Progress",
          progress: 65,
          lastUpdated: "2 days ago",
        },
        {
          id: 2,
          name: "Brand Guidelines",
          status: "Review",
          progress: 90,
          lastUpdated: "1 week ago",
        },
      ],
      actionItems: [
        {
          id: 1,
          type: "contract",
          title: "Sign Contract",
          description: "Sign the service agreement for Website Redesign project",
          icon: PenTool,
          buttonText: "Sign Now",
          urgent: true,
        },
        {
          id: 2,
          type: "invoice",
          title: "Pay Invoice",
          description: "Invoice #102 is due ($2,500)",
          icon: DollarSign,
          buttonText: "Pay Now",
          urgent: true,
        },
        {
          id: 3,
          type: "upload",
          title: "Upload Files",
          description: "Upload logo files for branding project",
          icon: Upload,
          buttonText: "Upload",
          urgent: false,
        },
        {
          id: 4,
          type: "approval",
          title: "Review and approve Website Mockups.zip",
          description: "Please review and approve the latest website mockups",
          icon: Eye,
          buttonText: "Review",
          urgent: false,
        },
        {
          id: 5,
          type: "approval",
          title: "Review and approve Logo Concepts.png",
          description: "Please review and approve the logo concept designs",
          icon: Eye,
          buttonText: "Review",
          urgent: false,
        },
      ],
      files: [
        {
          id: 1,
          name: "Brand Guidelines v2.pdf",
          type: "pdf",
          size: "2.4 MB",
          uploadedAt: "2 days ago",
          url: "#",
          status: "approved",
          comments: [
            {
              id: 1,
              author: "Design Team",
              avatar: "DT",
              message: "Updated brand guidelines with your feedback. Please review the color palette section.",
              timestamp: "2 days ago",
              isClient: false,
            },
            {
              id: 2,
              author: "Sarah Johnson",
              avatar: "SJ",
              message: "Looks great! I love the new color scheme. Approved!",
              timestamp: "1 day ago",
              isClient: true,
            },
          ],
        },
        {
          id: 2,
          name: "Website Mockups.zip",
          type: "zip",
          size: "15.8 MB",
          uploadedAt: "1 week ago",
          url: "#",
          status: "pending",
          comments: [
            {
              id: 1,
              author: "Design Team",
              avatar: "DT",
              message: "Here are the latest website mockups. Please review and let us know your thoughts.",
              timestamp: "1 week ago",
              isClient: false,
            },
          ],
        },
        {
          id: 3,
          name: "Logo Concepts.png",
          type: "image",
          size: "890 KB",
          uploadedAt: "3 days ago",
          url: "#",
          status: "pending",
          comments: [],
        },
      ],
      invoices: [
        {
          id: 1,
          number: "INV-102",
          amount: 2500,
          status: "due",
          dueDate: "2024-02-15",
          description: "Website Redesign - Phase 1",
        },
        {
          id: 2,
          number: "INV-101",
          amount: 1500,
          status: "paid",
          paidDate: "2024-01-20",
          description: "Brand Guidelines Development",
        },
      ],
      timeline: [
        {
          id: 1,
          title: "Project Kickoff",
          date: "2024-01-10",
          status: "complete",
          description: "Initial meeting and project scope discussion",
          note: "We had a great kickoff meeting where we discussed your vision for the new website. The main goals are to modernize the design, improve user experience, and increase conversion rates. We've documented all your requirements and will be using them as our north star throughout the project.",
          uploads: [
            {
              id: 1,
              name: "Project Brief.pdf",
              size: "1.2 MB",
              type: "pdf",
            },
            {
              id: 2,
              name: "Meeting Notes.docx",
              size: "456 KB",
              type: "document",
            },
          ],
        },
        {
          id: 2,
          title: "Design Concepts",
          date: "2024-01-25",
          status: "complete",
          description: "First round of design concepts delivered",
          note: "We've created three distinct design concepts for your review. Each concept takes a different approach to your brand identity while maintaining the professional look you requested. Concept A focuses on minimalism, Concept B emphasizes bold typography, and Concept C balances both approaches. Please review and let us know which direction resonates most with your vision.",
          uploads: [
            {
              id: 3,
              name: "Design Concepts A-C.pdf",
              size: "8.4 MB",
              type: "pdf",
            },
            {
              id: 4,
              name: "Style Guide Draft.pdf",
              size: "2.1 MB",
              type: "pdf",
            },
          ],
        },
        {
          id: 3,
          title: "Client Feedback",
          date: "2024-02-05",
          status: "in-progress",
          description: "Awaiting client feedback on latest designs",
          note: "We're currently waiting for your feedback on the design concepts. Once we receive your input, we'll refine the chosen direction and move forward with detailed wireframes. Please take your time to review with your team and don't hesitate to reach out if you have any questions about the concepts.",
          uploads: [],
        },
        {
          id: 4,
          title: "Final Delivery",
          date: "2024-02-20",
          status: "pending",
          description: "Final website delivery and launch",
          note: "This will be the final step where we deliver the completed website and handle the launch process. We'll provide you with all necessary documentation, training materials, and ongoing support information.",
          uploads: [],
        },
      ],
      messages: [
        {
          id: 1,
          sender: "team",
          senderName: "Design Team",
          message:
            "Hi Sarah! We've uploaded the latest design concepts for your review. Please let us know your thoughts.",
          timestamp: "2 hours ago",
          avatar: "DT",
        },
        {
          id: 2,
          sender: "client",
          senderName: "Sarah Johnson",
          message: "Thanks! I'll review them today and get back to you with feedback.",
          timestamp: "1 hour ago",
          avatar: "SJ",
        },
        {
          id: 3,
          sender: "team",
          senderName: "Project Manager",
          message: "Perfect! Also, don't forget to sign the updated contract when you have a moment.",
          timestamp: "45 minutes ago",
          avatar: "PM",
        },
      ],
    },
  }

  return clientData[slug as keyof typeof clientData] || null
}

export default function ClientPortalPage() {
  const params = useParams()
  const clientSlug = params["client-slug"] as string
  const clientData = getClientData(clientSlug)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(clientData?.messages || [])

  const [selectedFile, setSelectedFile] = useState<any>(null)
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [files, setFiles] = useState(clientData?.files || [])

  const [selectedTimelineStep, setSelectedTimelineStep] = useState<any>(null)
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false)
  const [aiMessages, setAiMessages] = useState([
    {
      id: 1,
      sender: "assistant",
      message:
        "Hi! I'm your AI assistant. I can help you with questions about your projects, invoices, files, and more. What would you like to know?",
      timestamp: "Just now",
    },
  ])
  const [aiInput, setAiInput] = useState("")
  const [isAiTyping, setIsAiTyping] = useState(false)

  if (!clientData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portal Not Found</h1>
          <p className="text-gray-600">The requested client portal could not be found.</p>
        </div>
      </div>
    )
  }

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        sender: "client" as const,
        senderName: clientData.clientName,
        message: newMessage,
        timestamp: "Just now",
        avatar: clientData.avatar,
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

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
      default:
        return "📄"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "bg-green-100 text-green-700"
      case "in-progress":
        return "bg-blue-100 text-blue-700"
      case "pending":
        return "bg-gray-100 text-gray-700"
      case "due":
        return "bg-red-100 text-red-700"
      case "paid":
        return "bg-green-100 text-green-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const handleApproveFile = (fileId: number) => {
    setFiles(files.map((file) => (file.id === fileId ? { ...file, status: "approved" } : file)))
  }

  const handleAddComment = (fileId: number) => {
    if (newComment.trim()) {
      const comment = {
        id: Date.now(),
        author: clientData.clientName,
        avatar: clientData.avatar,
        message: newComment,
        timestamp: "Just now",
        isClient: true,
      }

      setFiles(files.map((file) => (file.id === fileId ? { ...file, comments: [...file.comments, comment] } : file)))
      setNewComment("")
    }
  }

  const openCommentsModal = (file: any) => {
    setSelectedFile(file)
    setIsCommentsOpen(true)
  }

  const openTimelineModal = (step: any) => {
    setSelectedTimelineStep(step)
    setIsTimelineModalOpen(true)
  }

  const handleSendAiMessage = async () => {
    if (!aiInput.trim()) return

    const userMessage = {
      id: aiMessages.length + 1,
      sender: "user",
      message: aiInput,
      timestamp: "Just now",
    }

    setAiMessages([...aiMessages, userMessage])
    setAiInput("")
    setIsAiTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "Based on your project timeline, the Website Redesign is currently 65% complete. The next milestone is client feedback review, which is due this week.",
        "You have 1 unpaid invoice (INV-102) for $2,500 that's due on February 15th. You can pay it directly from your invoices section.",
        "Your next action items include signing the service agreement and uploading logo files for the branding project. Both are marked as urgent.",
        "I can see you have 3 files pending approval: Website Mockups.zip and Logo Concepts.png. Would you like me to show you the approval workflow?",
      ]

      const aiResponse = {
        id: aiMessages.length + 2,
        sender: "assistant",
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: "Just now",
      }

      setAiMessages((prev) => [...prev, aiResponse])
      setIsAiTyping(false)
    }, 1500)
  }

  const handleQuickSuggestion = (suggestion: string) => {
    setAiInput(suggestion)
  }

  const quickSuggestions = [
    "What's the project status?",
    "What's my next action?",
    "Show unpaid invoices",
    "When is my next deadline?",
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="font-semibold text-gray-900">ClientPortalHQ</span>
              </div>
              <div className="hidden md:block h-6 w-px bg-gray-300" />
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium text-sm">
                    {clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{clientData.clientName}</p>
                  <p className="text-xs text-gray-600">{clientData.companyName}</p>
                </div>
              </div>
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] font-medium">
                    {clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900">{clientData.clientName}</p>
                  <p className="text-sm text-gray-600">{clientData.companyName}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Branded Header Section */}
      <div
        className="relative w-full min-h-[160px] shadow-lg"
        style={{
          background: clientData.branding.useBackgroundImage
            ? `linear-gradient(135deg, rgba(60, 60, 255, 0.1) 0%, rgba(245, 247, 255, 0.9) 100%), url('${clientData.branding.headerBackgroundImage}') center/cover`
            : "#F5F7FF",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center lg:justify-start">
            <img
              src={clientData.branding.logo || "/placeholder.svg"}
              alt={`${clientData.companyName} Logo`}
              className="h-12 md:h-16 w-auto object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      </div>

      {/* Welcome Message Section - Below Banner */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              Welcome, {clientData.clientName} 👋
            </h1>
            <p className="text-base md:text-lg text-gray-700 font-medium">Everything you need, all in one place.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Projects Overview */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Projects</h2>
              <div className="grid gap-4">
                {clientData.projects.map((project) => (
                  <Card key={project.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600">Last updated {project.lastUpdated}</p>
                        </div>
                        <Badge className={getStatusColor(project.status.toLowerCase())}>{project.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Action Needed Section */}
            {clientData.actionItems.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">📝 Action Needed</h2>
                <div className="grid gap-4">
                  {clientData.actionItems.map((item) => {
                    const IconComponent = item.icon
                    return (
                      <Card
                        key={item.id}
                        className={`border-0 shadow-sm rounded-2xl ${
                          item.urgent ? "ring-2 ring-red-200 bg-red-50" : ""
                        }`}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`p-3 rounded-xl ${item.urgent ? "bg-red-100" : "bg-[#F0F2FF]"}`}>
                                <IconComponent
                                  className={`h-5 w-5 ${item.urgent ? "text-red-600" : "text-[#3C3CFF]"}`}
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                                <p className="text-gray-600">{item.description}</p>
                              </div>
                            </div>
                            <Button
                              className={`${
                                item.urgent ? "bg-red-600 hover:bg-red-700" : "bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                              } text-white`}
                            >
                              {item.buttonText}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Files Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">📂 Files</h2>
                <Button variant="outline" className="text-[#3C3CFF] border-[#3C3CFF] hover:bg-[#F0F2FF] bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
                </Button>
              </div>
              <div className="grid gap-3">
                {files.map((file) => (
                  <Card key={file.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getFileIcon(file.type)}</span>
                            <div>
                              <p className="font-medium text-gray-900">{file.name}</p>
                              <p className="text-sm text-gray-600">
                                {file.size} • {file.uploadedAt}
                              </p>
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
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF]">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#3C3CFF] hover:bg-[#F0F2FF]"
                              onClick={() => openCommentsModal(file)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Comments ({file.comments.length})
                            </Button>
                          </div>

                          {file.status === "pending" && (
                            <Button
                              size="sm"
                              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                              onClick={() => handleApproveFile(file.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Timeline Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">🗂 Project Timeline</h2>
              <div className="space-y-4">
                {clientData.timeline.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === "complete"
                            ? "bg-green-100"
                            : item.status === "in-progress"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                        }`}
                      >
                        {item.status === "complete" ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : item.status === "in-progress" ? (
                          <Clock className="h-5 w-5 text-blue-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      {index < clientData.timeline.length - 1 && <div className="w-px h-12 bg-gray-200 mt-2" />}
                    </div>
                    <div className="flex-1 pb-8 cursor-pointer group" onClick={() => openTimelineModal(item)}>
                      <div className="bg-white rounded-xl p-4 border border-gray-100 hover:border-[#3C3CFF] hover:shadow-md transition-all duration-200 group-hover:bg-gradient-to-r group-hover:from-[#F8F9FF] group-hover:to-white">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-[#3C3CFF] transition-colors duration-200">
                            {item.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">{item.date}</span>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <MoreHorizontal className="h-4 w-4 text-[#3C3CFF]" />
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 group-hover:text-gray-700 transition-colors duration-200">
                          {item.description}
                        </p>
                        <div className="mt-2 text-xs text-[#3C3CFF] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Click to view details →
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Invoices Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">💳 Invoices</h2>
              <div className="space-y-3">
                {clientData.invoices.map((invoice) => (
                  <Card key={invoice.id} className="border-0 shadow-sm rounded-2xl">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{invoice.number}</span>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status === "due" ? "Due" : "Paid"}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">${invoice.amount.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">{invoice.description}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          {invoice.status === "due" ? <p>Due: {invoice.dueDate}</p> : <p>Paid: {invoice.paidDate}</p>}
                        </div>
                        <Button
                          className={`w-full ${
                            invoice.status === "due"
                              ? "bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          disabled={invoice.status === "paid"}
                        >
                          {invoice.status === "due" ? (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Messages Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">💬 Messages</h2>
              <Card className="border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === "client" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex items-start space-x-2 max-w-xs ${
                            message.sender === "client" ? "flex-row-reverse space-x-reverse" : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={`text-xs font-medium ${
                                message.sender === "client"
                                  ? "bg-[#F0F2FF] text-[#3C3CFF]"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {message.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`rounded-2xl px-3 py-2 ${
                              message.sender === "client" ? "bg-[#3C3CFF] text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender === "client" ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {message.timestamp}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex space-x-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 min-h-[40px] max-h-[120px] border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Details Modal */}
      {isTimelineModalOpen && selectedTimelineStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{selectedTimelineStep.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTimelineModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Date and Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedTimelineStep.status === "complete"
                        ? "bg-green-100"
                        : selectedTimelineStep.status === "in-progress"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                    }`}
                  >
                    {selectedTimelineStep.status === "complete" ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : selectedTimelineStep.status === "in-progress" ? (
                      <Clock className="h-4 w-4 text-blue-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedTimelineStep.date}</p>
                    <Badge
                      className={`text-xs ${
                        selectedTimelineStep.status === "complete"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : selectedTimelineStep.status === "in-progress"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      {selectedTimelineStep.status.replace("-", " ")}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Note from Admin */}
              {selectedTimelineStep.note && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Project Update</h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">{selectedTimelineStep.note}</p>
                  </div>
                </div>
              )}

              {/* Associated Files */}
              {selectedTimelineStep.uploads && selectedTimelineStep.uploads.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Associated Files</h4>
                  <div className="space-y-2">
                    {selectedTimelineStep.uploads.map((upload: any) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getFileIcon(upload.type)}</span>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{upload.name}</p>
                            <p className="text-xs text-gray-600">{upload.size}</p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] p-2">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-[#3C3CFF] hover:bg-[#F0F2FF] p-2">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <Button
                onClick={() => setIsTimelineModalOpen(false)}
                className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {isCommentsOpen && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Comments - {selectedFile.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCommentsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedFile.comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                selectedFile.comments.map((comment: any) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback
                        className={`text-xs font-medium ${
                          comment.isClient ? "bg-[#F0F2FF] text-[#3C3CFF]" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {comment.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.timestamp}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{comment.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-gray-200 p-6">
              <div className="flex space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#F0F2FF] text-[#3C3CFF] text-xs font-medium">
                    {clientData.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px] border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => handleAddComment(selectedFile.id)}
                      disabled={!newComment.trim()}
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Button */}
      {!isAiAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsAiAssistantOpen(true)}
            className="group relative w-14 h-14 bg-gradient-to-r from-[#3C3CFF] to-[#4A4AFF] hover:from-[#2D2DCC] hover:to-[#3A3AE6] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 ease-out flex items-center justify-center transform hover:scale-110"
            title="Ask AI Assistant"
          >
            {/* Subtle pulse ring */}
            <div className="absolute inset-0 bg-[#3C3CFF] rounded-full animate-ping opacity-10"></div>
            <div className="absolute inset-0 bg-[#3C3CFF] rounded-full animate-pulse opacity-20"></div>

            {/* Icon container */}
            <div className="relative flex items-center justify-center transform transition-transform duration-200 group-hover:scale-110">
              <MessageCircle className="h-6 w-6" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
            </div>
          </button>
        </div>
      )}

      {/* AI Assistant Panel */}
      {isAiAssistantOpen && (
        <>
          {/* Mobile Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden"
            onClick={() => setIsAiAssistantOpen(false)}
          />

          {/* AI Assistant Panel */}
          <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white shadow-2xl rounded-2xl z-50 flex flex-col transform transition-all duration-300 ease-out scale-100 opacity-100 md:block hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-2xl">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-[#3C3CFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-xs text-gray-600">Ask questions about your project, invoices, or tasks.</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAiAssistantOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg transition-colors duration-200"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {aiMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 transform transition-all duration-200 ease-out ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-[#3C3CFF] to-[#4A4AFF] text-white shadow-lg"
                        : "bg-white text-gray-900 shadow-md border border-gray-100 hover:shadow-lg"
                    }`}
                  >
                    {message.sender === "assistant" && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                          <Sparkles className="h-2 w-2 text-[#3C3CFF]" />
                        </div>
                        <span className="text-xs font-medium text-[#3C3CFF]">AI</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 shadow-md border border-gray-100 rounded-2xl px-4 py-3 transform animate-pulse">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-[#3C3CFF]" />
                      </div>
                      <span className="text-xs font-medium text-[#3C3CFF]">AI</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-60"></div>
                      <div
                        className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-80"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-100"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-xs px-3 py-2 bg-gray-100 hover:bg-gradient-to-r hover:from-[#F0F2FF] hover:to-[#E8ECFF] hover:text-[#3C3CFF] text-gray-600 rounded-full transition-all duration-200 ease-out transform hover:scale-105 hover:shadow-sm"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Type your question…"
                    className="min-h-[44px] max-h-[120px] pr-12 border-gray-200 focus:border-[#3C3CFF] focus:ring-2 focus:ring-[#3C3CFF] focus:ring-opacity-20 resize-none rounded-xl transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendAiMessage()
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 bottom-2 text-gray-400 hover:text-[#3C3CFF] hover:bg-[#F0F2FF] p-1 rounded-lg transition-all duration-200"
                    title="Upload file (Premium feature)"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendAiMessage}
                  disabled={!aiInput.trim() || isAiTyping}
                  className="bg-gradient-to-r from-[#3C3CFF] to-[#4A4AFF] hover:from-[#2D2DCC] hover:to-[#3A3AE6] text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Full Screen Modal */}
          <div className="fixed inset-0 bg-white z-50 flex flex-col md:hidden transform transition-all duration-300 ease-out">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#3C3CFF]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">AI Assistant</h3>
                  <p className="text-sm text-gray-600">Ask questions about your project</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAiAssistantOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Mobile Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
              {aiMessages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 transform transition-all duration-200 ease-out ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-[#3C3CFF] to-[#4A4AFF] text-white shadow-lg"
                        : "bg-white text-gray-900 shadow-md border border-gray-100"
                    }`}
                  >
                    {message.sender === "assistant" && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                          <Sparkles className="h-2 w-2 text-[#3C3CFF]" />
                        </div>
                        <span className="text-xs font-medium text-[#3C3CFF]">AI</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <p className={`text-xs mt-2 ${message.sender === "user" ? "text-blue-100" : "text-gray-500"}`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}

              {/* Mobile Typing Indicator */}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 shadow-md border border-gray-100 rounded-2xl px-4 py-3 transform animate-pulse">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-4 h-4 bg-gradient-to-br from-[#F0F2FF] to-[#E8ECFF] rounded-full flex items-center justify-center">
                        <Sparkles className="h-2 w-2 text-[#3C3CFF]" />
                      </div>
                      <span className="text-xs font-medium text-[#3C3CFF]">AI</span>
                    </div>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-60"></div>
                      <div
                        className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-80"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[#3C3CFF] rounded-full animate-bounce opacity-100"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Quick Suggestions */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white">
              <div className="flex flex-wrap gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion)}
                    className="text-sm px-4 py-2 bg-gray-100 hover:bg-gradient-to-r hover:from-[#F0F2FF] hover:to-[#E8ECFF] hover:text-[#3C3CFF] text-gray-600 rounded-full transition-all duration-200 ease-out transform hover:scale-105"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Input Area */}
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Type your question…"
                    className="min-h-[48px] max-h-[120px] pr-12 border-gray-200 focus:border-[#3C3CFF] focus:ring-2 focus:ring-[#3C3CFF] focus:ring-opacity-20 resize-none rounded-xl transition-all duration-200"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSendAiMessage()
                      }
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 bottom-2 text-gray-400 hover:text-[#3C3CFF] hover:bg-[#F0F2FF] p-1 rounded-lg transition-all duration-200"
                    title="Upload file (Premium feature)"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleSendAiMessage}
                  disabled={!aiInput.trim() || isAiTyping}
                  className="bg-gradient-to-r from-[#3C3CFF] to-[#4A4AFF] hover:from-[#2D2DCC] hover:to-[#3A3AE6] text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img
                src={clientData.branding.logo || "/placeholder.svg"}
                alt={`${clientData.companyName} Logo`}
                className="h-8 w-auto object-contain"
                crossOrigin="anonymous"
              />
            </div>
            <div className="text-sm text-gray-500">
              Powered by <span className="text-[#3C3CFF] font-medium">ClientPortalHQ</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
