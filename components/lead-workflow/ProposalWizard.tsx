"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Search,
  X,
  Check,
  ChevronRight,
  FileText,
  Mail,
  Building2,
  Upload,
  Trash2,
  Send,
  DollarSign,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Image as ImageIcon,
  Type,
  Columns,
  LayoutGrid,
  Eye,
  Zap,
  Star,
  TrendingUp,
  Edit3,
  EyeOff,
  Users,
  Clock,
  Calendar,
  AlignLeft,
  List,
  Quote,
  ImagePlus,
} from "lucide-react"
import { toast } from "sonner"

// Mock data
const mockContacts = [
  { id: "1", name: "Sarah Johnson", company: "Tech Corp", email: "sarah@techcorp.com", type: "Client", avatar: "SJ" },
  { id: "2", name: "Michael Chen", company: "Design Studio", email: "michael@design.com", type: "Lead", avatar: "MC" },
  { id: "3", name: "Emily Davis", company: "Marketing Agency", email: "emily@marketing.com", type: "Client", avatar: "ED" },
  { id: "4", name: "David Miller", company: "Startup Inc", email: "david@startup.com", type: "Lead", avatar: "DM" },
]

// Block types - Expanded!
type BlockType = 
  | "cover" 
  | "intro" 
  | "heading" 
  | "text" 
  | "quote"
  | "features-3col" 
  | "columns-2" 
  | "columns-3" 
  | "team"
  | "process-timeline"
  | "image-full"
  | "image-text-left"
  | "image-text-right"
  | "image-grid"
  | "pricing-table"
  | "pricing-simple"
  | "testimonial"
  | "divider"
  | "cta"
  | "contact-info"

interface Block {
  id: string
  type: BlockType
  title: string
  visible: boolean
  content?: string
  subtitle?: string
  imageUrl?: string
  images?: string[]
  columns?: { title?: string; content: string }[]
  features?: { icon: string; title: string; description: string }[]
  teamMembers?: { name: string; role: string; imageUrl?: string }[]
  timeline?: { stage: string; duration: string }[]
  items?: { name: string; price: number; qty: number }[]
  author?: string
  company?: string
  phone?: string
  email?: string
  address?: string
}

// Professional Template based on the images
const createInitialTemplate = (recipientName: string = "Client", companyName: string = "Your Company"): Block[] => [
  {
    id: "cover-1",
    type: "cover",
    title: "Cover Page",
    visible: true,
    content: "Graphic Design Proposal Template",
    subtitle: `Prepared for: ${recipientName}, ${companyName}`,
  },
  {
    id: "intro-1",
    type: "intro",
    title: "Introduction",
    visible: true,
    content: `Dear ${recipientName},\n\nThank you for considering our services for this graphic design project. We've reviewed the project brief and we confirm that we'll be able to deliver our work within the specified time frame and budget.\n\nIn this proposal, you'll find information about our creative process and the project costs. In case you need any further information, please email us directly or book a time for a call.\n\nThank you!`,
    author: "[Your Name]"
  },
  {
    id: "team-1",
    type: "team",
    title: "The Creative Team",
    visible: true,
    content: "Established in 2001 by John Smith, we have developed as a boutique creative agency, which puts client success before everything.\n\nOur main focus is on graphic design and we know our craft inside out. Along with that, we have a strong team of digital experts with years of active experience in digital marketing, advertising, and programming.",
    teamMembers: [
      { name: "John Smith", role: "Creative Director", imageUrl: "" },
      { name: "Jane Doe", role: "Lead Designer", imageUrl: "" },
      { name: "Mike Johnson", role: "Project Manager", imageUrl: "" }
    ]
  },
  {
    id: "process-1",
    type: "process-timeline",
    title: "Process & Timeline",
    visible: true,
    content: "Creative ideas need time to come to fruition. However, years of experience taught us how to be efficient with our time and always deliver before the client deadline.",
    timeline: [
      { stage: "Client Goals/Expectations", duration: "5 days" },
      { stage: "Industry Analysis", duration: "5 days" },
      { stage: "Clearing Project Details", duration: "4 days" },
      { stage: "Preparing Mock-ups", duration: "6 days" },
      { stage: "Design Drafts", duration: "10 days" },
      { stage: "Final Touches", duration: "10 days" },
      { stage: "Programming and Printing", duration: "20 days" }
    ]
  },
  {
    id: "features-1",
    type: "features-3col",
    title: "What We Deliver",
    visible: true,
    features: [
      { icon: "⚡", title: "Fast Turnaround", description: "Quick delivery without compromising on quality" },
      { icon: "🎨", title: "Creative Excellence", description: "Award-winning designs that stand out" },
      { icon: "💼", title: "Professional Service", description: "White-glove service from start to finish" }
    ]
  },
  {
    id: "pricing-1",
    type: "pricing-table",
    title: "Investment",
    visible: true,
    items: [
      { name: "Brand Identity Design", price: 5000, qty: 1 },
      { name: "Marketing Collateral (10 pieces)", price: 3000, qty: 1 },
      { name: "Website Graphics Package", price: 2500, qty: 1 },
      { name: "Social Media Templates", price: 1500, qty: 1 }
    ]
  },
  {
    id: "cta-1",
    type: "cta",
    title: "Call to Action",
    visible: true,
    content: "Let's Create Something Amazing Together",
    subtitle: "Ready to get started? Accept this proposal and let's bring your vision to life."
  }
]

interface ProposalWizardProps {
  onClose: () => void
  onComplete: () => void
}

export function ProposalWizard({ onClose, onComplete }: ProposalWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [blocks, setBlocks] = useState<Block[]>([])
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const loadTemplate = () => {
    setBlocks(createInitialTemplate(selectedRecipient?.name || "Client", selectedRecipient?.company || "Your Company"))
    setCurrentStep(3)
  }

  const toggleBlockVisibility = (id: string) => {
    setBlocks(blocks.map(block => block.id === id ? { ...block, visible: !block.visible } : block))
  }

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(block => block.id === id ? { ...block, ...updates } : block))
  }

  const addBlock = (type: BlockType) => {
    const blockConfigs: Record<BlockType, Partial<Block>> = {
      "cover": { content: "Your Proposal Title", subtitle: "Prepared for: [Client Name]" },
      "intro": { content: "Dear [Client Name],\n\nYour introduction text here...", author: "[Your Name]" },
      "heading": { content: "Section Heading" },
      "text": { content: "Add your paragraph text here. This is a text block that you can use for detailed explanations, descriptions, or any written content." },
      "quote": { content: "Add an inspiring quote or testimonial here.", author: "Author Name" },
      "features-3col": { 
        features: [
          { icon: "⭐", title: "Feature 1", description: "Description of feature 1" },
          { icon: "✨", title: "Feature 2", description: "Description of feature 2" },
          { icon: "🎯", title: "Feature 3", description: "Description of feature 3" }
        ]
      },
      "columns-2": { 
        columns: [
          { title: "Column 1", content: "Content for first column" },
          { title: "Column 2", content: "Content for second column" }
        ]
      },
      "columns-3": { 
        columns: [
          { title: "Column 1", content: "Content for first column" },
          { title: "Column 2", content: "Content for second column" },
          { title: "Column 3", content: "Content for third column" }
        ]
      },
      "team": {
        content: "Meet our talented team of professionals.",
        teamMembers: [
          { name: "Team Member 1", role: "Role", imageUrl: "" },
          { name: "Team Member 2", role: "Role", imageUrl: "" }
        ]
      },
      "process-timeline": {
        content: "Our proven process ensures quality results.",
        timeline: [
          { stage: "Phase 1", duration: "5 days" },
          { stage: "Phase 2", duration: "7 days" },
          { stage: "Phase 3", duration: "10 days" }
        ]
      },
      "image-full": { imageUrl: "", content: "Optional caption" },
      "image-text-left": { imageUrl: "", content: "Add your text content here. This will appear next to the image." },
      "image-text-right": { imageUrl: "", content: "Add your text content here. This will appear next to the image." },
      "image-grid": { images: ["", "", ""], content: "Optional caption for image grid" },
      "pricing-table": {
        items: [
          { name: "Service Item 1", price: 1000, qty: 1 },
          { name: "Service Item 2", price: 1500, qty: 1 }
        ]
      },
      "pricing-simple": { content: "Starting at", subtitle: "$5,000" },
      "testimonial": { content: "Add client testimonial here...", author: "Client Name", company: "Company Name" },
      "divider": {},
      "cta": { content: "Call to Action Heading", subtitle: "Supporting text for your CTA" },
      "contact-info": { 
        phone: "(555) 123-4567", 
        email: "hello@company.com", 
        address: "123 Business St, City, State 12345" 
      }
    }

    const config = blockConfigs[type]
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      title: `New ${type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`,
      visible: true,
      ...config
    }
    
    setBlocks([...blocks, newBlock])
    setEditingBlockId(newBlock.id)
  }

  const deleteBlock = (id: string) => {
    setBlocks(blocks.filter(block => block.id !== id))
    if (editingBlockId === id) setEditingBlockId(null)
  }

  const calculateTotal = () => {
    const pricingBlocks = blocks.filter(b => b.type === "pricing-table" && b.visible)
    let subtotal = 0
    pricingBlocks.forEach(block => {
      if (block.items) {
        subtotal += block.items.reduce((sum, item) => sum + (item.price * item.qty), 0)
      }
    })
    const tax = subtotal * 0.1
    return { subtotal, tax, total: subtotal + tax }
  }

  const renderBlock = (block: Block) => {
    if (!block.visible) return null

    switch (block.type) {
      case "cover":
        return (
          <div key={block.id} className="min-h-screen py-32 px-12 bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-600 text-white flex items-center justify-center relative overflow-hidden">
            {/* Geometric shapes */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 transform skew-x-12"></div>
              <div className="absolute bottom-0 left-0 w-1/3 h-2/3 bg-purple-700 transform -skew-y-6"></div>
            </div>
            <div className="relative z-10 text-center max-w-4xl">
              <div className="mb-12 text-sm tracking-wider opacity-90">htmlBurger ®</div>
              <h1 className="text-7xl font-black mb-8 leading-tight">{block.content}</h1>
              <div className="mt-16 space-y-4 text-lg">
                <p className="font-semibold">Prepared for:</p>
                <p>{block.subtitle}</p>
                <p className="mt-8 font-semibold">Prepared by:</p>
                <p>[Your Company Name]</p>
                <p className="mt-8">Prepared on: {new Date().toLocaleDateString()}</p>
                <p>Valid until: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )

      case "intro":
        return (
          <div key={block.id} className="py-20 px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full mb-12"></div>
                <h2 className="text-5xl font-black text-purple-600 mb-8">Intro</h2>
              </div>
              <div className="text-gray-800 text-lg leading-relaxed space-y-6 whitespace-pre-wrap">
                {block.content}
              </div>
              {block.author && (
                <div className="mt-12">
                  <div className="text-4xl font-script text-gray-600 mb-2">Sender Signature</div>
                  <div className="text-gray-800 font-medium">{block.author}</div>
                </div>
              )}
            </div>
          </div>
        )

      case "heading":
        return (
          <div key={block.id} className="py-12 px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-5xl font-black text-purple-600">{block.content}</h2>
            </div>
          </div>
        )

      case "text":
        return (
          <div key={block.id} className="py-8 px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{block.content}</p>
            </div>
          </div>
        )

      case "quote":
        return (
          <div key={block.id} className="py-16 px-12 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="h-16 w-16 mx-auto mb-6 text-purple-600 opacity-30" />
              <blockquote className="text-3xl font-bold text-gray-800 leading-relaxed mb-6">
                "{block.content}"
              </blockquote>
              {block.author && (
                <cite className="text-lg text-gray-600 not-italic">— {block.author}</cite>
              )}
            </div>
          </div>
        )

      case "team":
        return (
          <div key={block.id} className="py-20 px-12 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="mb-12">
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full mb-8"></div>
                <h2 className="text-5xl font-black text-purple-600 mb-8">The Creative Team</h2>
              </div>
              <p className="text-lg text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap">{block.content}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Left: Large Image */}
                <div className="space-y-6">
                  <div className="aspect-[3/4] bg-gradient-to-br from-yellow-200 to-pink-200 rounded-2xl"></div>
                </div>
                
                {/* Right: Smaller Images */}
                <div className="space-y-6">
                  <div className="aspect-video bg-gradient-to-br from-blue-200 to-purple-200 rounded-2xl"></div>
                  <div className="aspect-video bg-gradient-to-br from-pink-200 to-orange-200 rounded-2xl"></div>
                </div>
              </div>

              {block.teamMembers && block.teamMembers.length > 0 && (
                <div className="mt-12 grid grid-cols-3 gap-6">
                  {block.teamMembers.map((member, idx) => (
                    <div key={idx} className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                      <div className="font-bold text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-600">{member.role}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "process-timeline":
        return (
          <div key={block.id} className="py-20 px-12 bg-white">
            <div className="max-w-5xl mx-auto">
              <div className="mb-12">
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full mb-8"></div>
                <h2 className="text-5xl font-black text-purple-600 mb-8">Process</h2>
              </div>
              <p className="text-lg text-gray-800 leading-relaxed mb-12 whitespace-pre-wrap">{block.content}</p>

              {block.timeline && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b-2 border-purple-600">
                    <div className="text-2xl font-black text-purple-600">Stages</div>
                    <div className="text-2xl font-black text-purple-600">Timeline</div>
                  </div>
                  {block.timeline.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-4 py-4 border-b border-gray-200">
                      <div className="text-lg text-gray-800">{item.stage}</div>
                      <div className="text-lg font-semibold text-gray-900">{item.duration}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )

      case "features-3col":
        return (
          <div key={block.id} className="py-20 px-12 bg-gray-50">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-3 gap-8">
                {block.features?.map((feature, idx) => (
                  <div key={idx} className="text-center p-8 bg-white rounded-2xl shadow-sm">
                    <div className="text-6xl mb-6">{feature.icon}</div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "columns-2":
      case "columns-3":
        const colCount = block.type === "columns-2" ? 2 : 3
        return (
          <div key={block.id} className="py-16 px-12 bg-gray-50">
            <div className={`max-w-6xl mx-auto grid grid-cols-${colCount} gap-8`}>
              {block.columns?.map((col, idx) => (
                <div key={idx} className="p-8 bg-white rounded-xl">
                  {col.title && <h3 className="text-2xl font-bold mb-4 text-purple-600">{col.title}</h3>}
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{col.content}</p>
                </div>
              ))}
            </div>
          </div>
        )

      case "image-full":
        return (
          <div key={block.id} className="py-12 px-12 bg-white">
            <div className="max-w-6xl mx-auto">
              {block.imageUrl ? (
                <img src={block.imageUrl} alt="Full width" className="w-full rounded-2xl shadow-xl" />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <ImageIcon className="h-20 w-20 mx-auto mb-4" />
                    <p>Click to upload image</p>
                  </div>
                </div>
              )}
              {block.content && (
                <p className="mt-6 text-center text-gray-600 italic">{block.content}</p>
              )}
            </div>
          </div>
        )

      case "image-text-left":
      case "image-text-right":
        const imageLeft = block.type === "image-text-left"
        return (
          <div key={block.id} className="py-16 px-12 bg-white">
            <div className="max-w-6xl mx-auto grid grid-cols-2 gap-12 items-center">
              {imageLeft && (
                <div>
                  {block.imageUrl ? (
                    <img src={block.imageUrl} alt="Content" className="w-full rounded-2xl shadow-lg" />
                  ) : (
                    <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
              <div>
                <p className="text-lg text-gray-800 leading-relaxed whitespace-pre-wrap">{block.content}</p>
              </div>
              {!imageLeft && (
                <div>
                  {block.imageUrl ? (
                    <img src={block.imageUrl} alt="Content" className="w-full rounded-2xl shadow-lg" />
                  ) : (
                    <div className="w-full h-80 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                      <ImageIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )

      case "image-grid":
        return (
          <div key={block.id} className="py-16 px-12 bg-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-3 gap-6">
                {(block.images || ["", "", ""]).map((img, idx) => (
                  <div key={idx}>
                    {img ? (
                      <img src={img} alt={`Grid ${idx + 1}`} className="w-full aspect-square object-cover rounded-xl shadow-lg" />
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                        <ImagePlus className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {block.content && (
                <p className="mt-8 text-center text-gray-600 italic">{block.content}</p>
              )}
            </div>
          </div>
        )

      case "pricing-table":
        return (
          <div key={block.id} className="py-20 px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="mb-12">
                <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full mb-8"></div>
                <h2 className="text-5xl font-black text-purple-600 mb-8">Investment</h2>
              </div>

              <div className="space-y-4">
                {block.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-6 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-semibold text-xl text-gray-900">{item.name}</div>
                      <div className="text-sm text-gray-500 mt-1">Quantity: {item.qty}</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-600">${(item.price * item.qty).toLocaleString()}</div>
                  </div>
                ))}
                
                <div className="mt-8 p-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xl">Subtotal</span>
                    <span className="text-2xl font-semibold">${calculateTotal().subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-6 opacity-90">
                    <span className="text-lg">Tax (10%)</span>
                    <span className="text-xl">${calculateTotal().tax.toLocaleString()}</span>
                  </div>
                  <Separator className="my-4 opacity-30" />
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold">Total Investment</span>
                    <span className="text-5xl font-bold">${calculateTotal().total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "pricing-simple":
        return (
          <div key={block.id} className="py-20 px-12 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="max-w-2xl mx-auto text-center">
              <div className="text-2xl text-gray-600 mb-4">{block.content}</div>
              <div className="text-7xl font-black text-purple-600">{block.subtitle}</div>
            </div>
          </div>
        )

      case "testimonial":
        return (
          <div key={block.id} className="py-20 px-12 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white p-12 rounded-2xl shadow-xl">
                <Quote className="h-12 w-12 mb-6 text-purple-600 opacity-30" />
                <p className="text-2xl text-gray-800 leading-relaxed mb-8 italic">
                  "{block.content}"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400"></div>
                  <div>
                    <div className="font-bold text-gray-900">{block.author}</div>
                    {block.company && <div className="text-gray-600">{block.company}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case "divider":
        return (
          <div key={block.id} className="py-8 px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full"></div>
            </div>
          </div>
        )

      case "cta":
        return (
          <div key={block.id} className="py-24 px-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-6xl font-black mb-6">{block.content}</h3>
              {block.subtitle && (
                <p className="text-2xl mb-12 opacity-90">{block.subtitle}</p>
              )}
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 text-xl px-16 py-8 shadow-2xl">
                <CheckCircle2 className="mr-3 h-7 w-7" />
                Accept This Proposal
              </Button>
            </div>
          </div>
        )

      case "contact-info":
        return (
          <div key={block.id} className="py-16 px-12 bg-gray-50">
            <div className="max-w-4xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {block.phone && (
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Phone</div>
                      <div className="text-gray-600">{block.phone}</div>
                    </div>
                  </div>
                )}
                {block.email && (
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Email</div>
                      <div className="text-gray-600">{block.email}</div>
                    </div>
                  </div>
                )}
                {block.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 mb-1">Address</div>
                      <div className="text-gray-600">{block.address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const editingBlock = blocks.find(b => b.id === editingBlockId)

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: "1s" }}></div>
      </div>

      {/* Header */}
      <div className="relative border-b bg-white/90 backdrop-blur-xl sticky top-0 z-20 shadow-sm">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] flex items-center justify-center shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] bg-clip-text text-transparent">
                    Create Proposal
                  </h2>
                  <p className="text-sm text-gray-600">
                    {currentStep === 1 && "Select recipient"}
                    {currentStep === 2 && "Choose template"}
                    {currentStep === 3 && "Customize content"}
                    {currentStep === 4 && "Review & send"}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                    currentStep > step ? "bg-green-500 text-white shadow-lg scale-105" :
                    currentStep === step ? "bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] text-white shadow-lg scale-110" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {currentStep > step ? <Check className="h-5 w-5" /> : step}
                  </div>
                  {step < 4 && <div className={`w-16 h-1 mx-2 rounded-full transition-all duration-300 ${currentStep > step ? "bg-green-500" : "bg-gray-200"}`} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative h-[calc(100vh-160px)] overflow-y-auto">
        {/* Step 1: Recipient (keeping existing code) */}
        {currentStep === 1 && (
          <div className="max-w-5xl mx-auto px-8 py-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-purple-500 mb-6 shadow-2xl animate-bounce">
                <Mail className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-3">Who's this proposal for?</h3>
              <p className="text-gray-600 text-xl">Select the recipient of your professional proposal</p>
            </div>

            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400" />
              <Input
                placeholder="Search by name, company, or email..."
                className="pl-14 h-16 text-lg border-2 border-gray-200 focus:border-[#3C3CFF] rounded-2xl shadow-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredContacts.map((contact) => (
                <Card
                  key={contact.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    selectedRecipient?.id === contact.id
                      ? "ring-4 ring-[#3C3CFF] shadow-2xl bg-gradient-to-br from-blue-50 to-purple-50 scale-105"
                      : "hover:ring-2 hover:ring-gray-300"
                  }`}
                  onClick={() => setSelectedRecipient(contact)}
                >
                  <CardContent className="p-7">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                        <AvatarFallback className={`text-xl font-bold ${
                          selectedRecipient?.id === contact.id
                            ? "bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] text-white"
                            : "bg-gray-100"
                        }`}>
                          {contact.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-lg truncate">{contact.name}</h4>
                          <Badge variant={contact.type === "Client" ? "default" : "secondary"} className="text-xs shrink-0">
                            {contact.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {contact.company}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          {contact.email}
                        </p>
                      </div>
                      {selectedRecipient?.id === contact.id && (
                        <CheckCircle2 className="h-8 w-8 text-[#3C3CFF] shrink-0 animate-in zoom-in duration-200" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Template (keeping existing) */}
        {currentStep === 2 && (
          <div className="max-w-6xl mx-auto px-8 py-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-2xl animate-pulse">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Template</h3>
              <p className="text-gray-600 text-xl">Start with our professionally designed proposal inspired by industry leaders</p>
            </div>

            <Card className="max-w-5xl mx-auto cursor-pointer transition-all duration-500 hover:shadow-2xl overflow-hidden hover:-translate-y-2" onClick={loadTemplate}>
              <div className="relative h-[500px] bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-600 p-10 overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600 transform skew-x-12"></div>
                </div>
                
                <div className="relative bg-white rounded-2xl shadow-2xl p-10 h-full overflow-hidden border border-gray-100">
                  <div className="text-center space-y-4">
                    <div className="text-sm text-gray-500 mb-2">htmlBurger ®</div>
                    <div className="text-4xl font-black text-gray-900">Graphic Design</div>
                    <div className="text-4xl font-black text-gray-900">Proposal Template</div>
                    <div className="mt-8 space-y-2 text-sm text-gray-600">
                      <p>Prepared for: [Client Name]</p>
                      <p>Prepared by: [Your Company]</p>
                    </div>
                  </div>

                  <div className="mt-12 space-y-4">
                    <div className="h-3 w-full bg-gradient-to-r from-purple-600 to-pink-500 rounded"></div>
                    <div className="space-y-2">
                      <div className="h-2 w-3/4 bg-gray-200 rounded"></div>
                      <div className="h-2 w-5/6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] text-white text-sm px-3 py-1">
                        <Star className="h-3.5 w-3.5 mr-1" />
                        Professional Template
                      </Badge>
                      <Badge variant="secondary" className="text-sm">
                        <TrendingUp className="h-3.5 w-3.5 mr-1" />
                        Industry Standard
                      </Badge>
                    </div>
                    <h4 className="text-3xl font-bold text-gray-900 mb-3">Graphic Design Proposal</h4>
                    <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
                      A comprehensive, visually stunning template with bold gradients and professional layouts. 
                      Perfect for creative agencies, designers, and service providers.
                    </p>
                  </div>
                </div>

                <Separator className="my-8" />

                <div>
                  <h5 className="font-semibold text-gray-900 mb-4 text-lg">Pre-built Sections:</h5>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      "Eye-catching Cover Page",
                      "Professional Introduction",
                      "Team Showcase with Images",
                      "Process & Timeline Table",
                      "Feature Highlights",
                      "Detailed Pricing Breakdown",
                      "Compelling Call-to-Action",
                      "20+ Additional Block Types"
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-gray-700">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                          <Check className="h-4 w-4 text-green-600" />
                        </div>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button size="lg" onClick={loadTemplate} className="w-full mt-8 bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white text-lg py-7 shadow-xl">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Use This Template
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Editor with ALL block types */}
        {currentStep === 3 && (
          <div className="flex h-full animate-in fade-in duration-300">
            {/* Left Sidebar - Enhanced Block List */}
            <div className="w-96 border-r bg-white/80 backdrop-blur-xl overflow-y-auto shadow-lg">
              <div className="p-6 border-b bg-gradient-to-r from-[#3C3CFF]/5 to-[#6366F1]/5 sticky top-0 z-10">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-[#3C3CFF]" />
                  Content Blocks
                </h3>
                <p className="text-sm text-gray-600">Click to edit, toggle to show/hide</p>
              </div>

              <div className="p-4 space-y-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      editingBlockId === block.id
                        ? "border-[#3C3CFF] bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => setEditingBlockId(block.id)}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          block.visible ? "bg-gradient-to-br from-[#3C3CFF] to-[#6366F1]" : "bg-gray-300"
                        }`}>
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{block.title}</div>
                          <div className="text-xs text-gray-500 capitalize">{block.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={block.visible}
                          onCheckedChange={() => toggleBlockVisibility(block.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        {block.visible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {editingBlockId === block.id && block.visible && (
                      <div className="pt-3 border-t space-y-3 animate-in slide-in-from-top-2 duration-200">
                        {/* Dynamic content editing based on block type */}
                        {(block.type === "cover" || block.type === "heading" || block.type === "cta") && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Title</Label>
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {(block.type === "cover" || block.type === "cta" || block.type === "pricing-simple") && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Subtitle</Label>
                            <Input
                              value={block.subtitle}
                              onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {(block.type === "intro" || block.type === "text" || block.type === "quote" || block.type === "team" || block.type === "process-timeline" || block.type === "testimonial") && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Content</Label>
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              rows={6}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {(block.type === "intro" || block.type === "quote" || block.type === "testimonial") && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                              {block.type === "testimonial" ? "Client Name" : "Author"}
                            </Label>
                            <Input
                              value={block.author}
                              onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {block.type === "testimonial" && (
                          <div>
                            <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Company</Label>
                            <Input
                              value={block.company}
                              onChange={(e) => updateBlock(block.id, { company: e.target.value })}
                              className="text-sm"
                            />
                          </div>
                        )}

                        {block.type === "features-3col" && (
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-700 block">Features ({block.features?.length})</Label>
                            {block.features?.map((feature, idx) => (
                              <div key={idx} className="p-3 bg-white rounded-lg border space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    value={feature.icon}
                                    onChange={(e) => {
                                      const newFeatures = [...(block.features || [])]
                                      newFeatures[idx].icon = e.target.value
                                      updateBlock(block.id, { features: newFeatures })
                                    }}
                                    className="w-16 text-center text-sm"
                                    placeholder="🎯"
                                  />
                                  <Input
                                    value={feature.title}
                                    onChange={(e) => {
                                      const newFeatures = [...(block.features || [])]
                                      newFeatures[idx].title = e.target.value
                                      updateBlock(block.id, { features: newFeatures })
                                    }}
                                    className="flex-1 text-sm"
                                    placeholder="Title"
                                  />
                                </div>
                                <Textarea
                                  value={feature.description}
                                  onChange={(e) => {
                                    const newFeatures = [...(block.features || [])]
                                    newFeatures[idx].description = e.target.value
                                    updateBlock(block.id, { features: newFeatures })
                                  }}
                                  rows={2}
                                  className="text-sm"
                                  placeholder="Description"
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {(block.type === "columns-2" || block.type === "columns-3") && (
                          <div className="space-y-3">
                            <Label className="text-xs font-semibold text-gray-700 block">Columns ({block.columns?.length})</Label>
                            {block.columns?.map((col, idx) => (
                              <div key={idx} className="space-y-2">
                                <Input
                                  value={col.title}
                                  onChange={(e) => {
                                    const newColumns = [...(block.columns || [])]
                                    newColumns[idx].title = e.target.value
                                    updateBlock(block.id, { columns: newColumns })
                                  }}
                                  className="text-sm font-semibold"
                                  placeholder={`Column ${idx + 1} Title (optional)`}
                                />
                                <Textarea
                                  value={col.content}
                                  onChange={(e) => {
                                    const newColumns = [...(block.columns || [])]
                                    newColumns[idx].content = e.target.value
                                    updateBlock(block.id, { columns: newColumns })
                                  }}
                                  rows={3}
                                  className="text-sm"
                                  placeholder={`Column ${idx + 1} content`}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {block.type === "process-timeline" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-gray-700">Timeline ({block.timeline?.length})</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newTimeline = [...(block.timeline || []), { stage: "New Stage", duration: "5 days" }]
                                  updateBlock(block.id, { timeline: newTimeline })
                                }}
                                className="h-7 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {block.timeline?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white rounded-lg border space-y-2">
                                  <Input
                                    value={item.stage}
                                    onChange={(e) => {
                                      const newTimeline = [...(block.timeline || [])]
                                      newTimeline[idx].stage = e.target.value
                                      updateBlock(block.id, { timeline: newTimeline })
                                    }}
                                    placeholder="Stage name"
                                    className="text-sm"
                                  />
                                  <Input
                                    value={item.duration}
                                    onChange={(e) => {
                                      const newTimeline = [...(block.timeline || [])]
                                      newTimeline[idx].duration = e.target.value
                                      updateBlock(block.id, { timeline: newTimeline })
                                    }}
                                    placeholder="Duration"
                                    className="text-sm"
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newTimeline = block.timeline?.filter((_, i) => i !== idx)
                                      updateBlock(block.id, { timeline: newTimeline })
                                    }}
                                    className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {block.type === "pricing-table" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-gray-700">Line Items ({block.items?.length})</Label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const newItems = [...(block.items || []), { name: "New Item", price: 1000, qty: 1 }]
                                  updateBlock(block.id, { items: newItems })
                                }}
                                className="h-7 text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            </div>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {block.items?.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white rounded-lg border space-y-2">
                                  <Input
                                    value={item.name}
                                    onChange={(e) => {
                                      const newItems = [...(block.items || [])]
                                      newItems[idx].name = e.target.value
                                      updateBlock(block.id, { items: newItems })
                                    }}
                                    placeholder="Item name"
                                    className="text-sm"
                                  />
                                  <div className="grid grid-cols-3 gap-2">
                                    <Input
                                      type="number"
                                      value={item.qty}
                                      onChange={(e) => {
                                        const newItems = [...(block.items || [])]
                                        newItems[idx].qty = parseInt(e.target.value) || 1
                                        updateBlock(block.id, { items: newItems })
                                      }}
                                      placeholder="Qty"
                                      className="text-sm"
                                    />
                                    <Input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => {
                                        const newItems = [...(block.items || [])]
                                        newItems[idx].price = parseFloat(e.target.value) || 0
                                        updateBlock(block.id, { items: newItems })
                                      }}
                                      placeholder="Price"
                                      className="text-sm col-span-2"
                                    />
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      const newItems = block.items?.filter((_, i) => i !== idx)
                                      updateBlock(block.id, { items: newItems })
                                    }}
                                    className="w-full text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {block.type === "contact-info" && (
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Phone</Label>
                              <Input
                                value={block.phone}
                                onChange={(e) => updateBlock(block.id, { phone: e.target.value })}
                                className="text-sm"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Email</Label>
                              <Input
                                value={block.email}
                                onChange={(e) => updateBlock(block.id, { email: e.target.value })}
                                className="text-sm"
                                placeholder="hello@company.com"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700 mb-1.5 block">Address</Label>
                              <Textarea
                                value={block.address}
                                onChange={(e) => updateBlock(block.id, { address: e.target.value })}
                                rows={2}
                                className="text-sm"
                                placeholder="123 Business St, City, State"
                              />
                            </div>
                          </div>
                        )}

                        {block.type !== "divider" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteBlock(block.id)}
                            className="w-full text-xs mt-2"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete Block
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Block Section - ALL BLOCKS */}
              <div className="p-4 border-t bg-gray-50 sticky bottom-0">
                <Label className="text-xs font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add New Block
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                  {[
                    { type: "cover" as BlockType, icon: Sparkles, label: "Cover" },
                    { type: "intro" as BlockType, icon: Mail, label: "Intro" },
                    { type: "heading" as BlockType, icon: Type, label: "Heading" },
                    { type: "text" as BlockType, icon: FileText, label: "Text" },
                    { type: "quote" as BlockType, icon: Quote, label: "Quote" },
                    { type: "features-3col" as BlockType, icon: Star, label: "Features" },
                    { type: "columns-2" as BlockType, icon: Columns, label: "2 Columns" },
                    { type: "columns-3" as BlockType, icon: Columns, label: "3 Columns" },
                    { type: "team" as BlockType, icon: Users, label: "Team" },
                    { type: "process-timeline" as BlockType, icon: Clock, label: "Timeline" },
                    { type: "image-full" as BlockType, icon: ImageIcon, label: "Image Full" },
                    { type: "image-text-left" as BlockType, icon: ImagePlus, label: "Image+Text" },
                    { type: "image-grid" as BlockType, icon: LayoutGrid, label: "Image Grid" },
                    { type: "pricing-table" as BlockType, icon: DollarSign, label: "Pricing" },
                    { type: "pricing-simple" as BlockType, icon: DollarSign, label: "Price Tag" },
                    { type: "testimonial" as BlockType, icon: Star, label: "Testimonial" },
                    { type: "divider" as BlockType, icon: LayoutGrid, label: "Divider" },
                    { type: "cta" as BlockType, icon: Zap, label: "CTA" },
                    { type: "contact-info" as BlockType, icon: Building2, label: "Contact" },
                  ].map(({ type, icon: Icon, label }) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => addBlock(type)}
                      className="justify-start gap-2 h-9"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="text-xs">{label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Live Preview */}
            <div className="flex-1 overflow-y-auto bg-gray-100">
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between shadow-sm">
                <Badge variant="secondary" className="text-sm px-4 py-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Live Preview
                </Badge>
                <Badge variant="outline" className="text-sm px-4 py-2">
                  {blocks.filter(b => b.visible).length} of {blocks.length} blocks visible
                </Badge>
              </div>
              <div className="bg-white shadow-2xl">
                {blocks.length === 0 ? (
                  <div className="p-20 text-center">
                    <FileText className="h-20 w-20 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Building</h3>
                    <p className="text-gray-600">Select a template to get started</p>
                  </div>
                ) : (
                  blocks.map(block => renderBlock(block))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review (keeping existing) */}
        {currentStep === 4 && (
          <div className="max-w-5xl mx-auto px-8 py-16 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-500 mb-6 shadow-2xl">
                <Send className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-3">Ready to Send!</h3>
              <p className="text-gray-600 text-xl">Your beautiful proposal is ready</p>
            </div>

            <Card className="border-2 shadow-xl">
              <CardContent className="p-10">
                <h4 className="text-xl font-bold mb-6">Sending To:</h4>
                {selectedRecipient && (
                  <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-2xl">
                    <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] text-white">
                        {selectedRecipient.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{selectedRecipient.name}</div>
                      <div className="text-lg text-gray-700">{selectedRecipient.company}</div>
                      <div className="text-gray-600">{selectedRecipient.email}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2 shadow-xl">
              <CardContent className="p-10">
                <h4 className="text-xl font-bold mb-6">Proposal Summary:</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Value</div>
                    <div className="text-3xl font-bold text-[#3C3CFF]">${calculateTotal().total.toLocaleString()}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl text-center">
                    <div className="text-sm text-gray-600 mb-1">Total Blocks</div>
                    <div className="text-3xl font-bold text-purple-600">{blocks.length}</div>
                  </div>
                  <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-center">
                    <div className="text-sm text-gray-600 mb-1">Visible</div>
                    <div className="text-3xl font-bold text-green-600">{blocks.filter(b => b.visible).length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 shadow-xl max-h-[500px] overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-y-auto max-h-[500px]">
                  {blocks.map(block => renderBlock(block))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t bg-white/90 backdrop-blur-xl sticky bottom-0 z-20 shadow-lg">
        <div className="px-8 py-5 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 1 && currentStep !== 3 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="gap-2"
                >
                  <ChevronRight className="h-5 w-5 rotate-180" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-4">
              <Button variant="outline" size="lg" onClick={onClose} className="px-8">
                Save Draft
              </Button>
              {currentStep < 4 ? (
                <Button
                  size="lg"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !selectedRecipient) ||
                    (currentStep === 2 && blocks.length === 0)
                  }
                  className="bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] hover:from-[#2D2DCC] hover:to-[#4F46E5] text-white shadow-lg gap-2 px-10"
                >
                  Continue
                  <ArrowRight className="h-5 w-5" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  onClick={onComplete}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg gap-2 px-10"
                >
                  <Send className="h-5 w-5" />
                  Send Proposal
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
