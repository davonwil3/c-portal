"use client"

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  Save,
  Eye,
  Send,
  Download,
  Copy,
  Trash2,
  Upload,
  Plus,
  X,
  Palette,
  Building2,
  User,
  DollarSign,
  Settings,
  FileText,
  FileSignature,
  Receipt,
  Pencil,
  Check,
  Image as ImageIcon,
  Loader2,
  Package,
  Search,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { DashboardLayout } from "@/components/dashboard/layout"
import { createProposal, updateProposal, getProposalById, type ProposalBuilderData } from "@/lib/proposals"
import { getClients } from "@/lib/clients"
import { getLeads } from "@/lib/leads"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createClient } from '@/lib/supabase/client'
import { JolixFooter } from "@/components/JolixFooter"

type DocumentStatus = "Draft" | "Sent" | "Viewed" | "Accepted"

export default function DocumentSuitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [proposalId, setProposalId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  
  // Suite-level state
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [status, setStatus] = useState<DocumentStatus>("Draft")
  
  // Document toggles
  const [proposalEnabled, setProposalEnabled] = useState(true)
  const [contractEnabled, setContractEnabled] = useState(true)
  const [invoiceEnabled, setInvoiceEnabled] = useState(true)
  
  // Active document
  const [activeDoc, setActiveDoc] = useState("proposal")
  
  // Branding
  const [brandColor, setBrandColor] = useState("#3C3CFF")
  const [accentColor, setAccentColor] = useState("#6366F1")
  const [logoUrl, setLogoUrl] = useState("")
  const [showLogo, setShowLogo] = useState(true)
  
  // Company info
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  const [showAddress, setShowAddress] = useState(true)
  const [planTier, setPlanTier] = useState<string>('free')
  
  // Client info
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  
  // Payment settings
  const [currency, setCurrency] = useState("USD")
  const [taxRate, setTaxRate] = useState("10")
  const [paymentDueDays, setPaymentDueDays] = useState(30)
  const [paymentPlanEnabled, setPaymentPlanEnabled] = useState(false)
  const [paymentPlanType, setPaymentPlanType] = useState("50-50")
  // Custom plan state
  const [customPaymentsCount, setCustomPaymentsCount] = useState(3)
  const [customEqualSplit, setCustomEqualSplit] = useState(true)
  const [customPaymentAmounts, setCustomPaymentAmounts] = useState<string[]>(["0", "0", "0"]) 
  // Milestone plan state
  const [milestonesCount, setMilestonesCount] = useState(4)
  const [milestonesEqualSplit, setMilestonesEqualSplit] = useState(true)
  const [milestones, setMilestones] = useState<Array<{ id: string; name: string; amount: string }>>([
    { id: "m1", name: "Discovery", amount: "0" },
    { id: "m2", name: "Design", amount: "0" },
    { id: "m3", name: "Development", amount: "0" },
    { id: "m4", name: "Launch", amount: "0" },
  ])
  
  // Proposal content
  const [proposalTitle, setProposalTitle] = useState("Proposal for Sarah Johnson")
  const [proposalSubtitle, setProposalSubtitle] = useState("")
  const [clientGoals, setClientGoals] = useState("")
  const [successOutcome, setSuccessOutcome] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [timeline, setTimeline] = useState("")
  // Editable section headings
  const [labelGoals, setLabelGoals] = useState("Your Goals")
  const [labelSuccess, setLabelSuccess] = useState("What Success Looks Like")
  const [labelScope, setLabelScope] = useState("Scope & Deliverables")
  const [labelTimeline, setLabelTimeline] = useState("Project Timeline")
  const [labelInvestment, setLabelInvestment] = useState("Investment")
  const [autoTitle, setAutoTitle] = useState(true)

  // Proposal blocks structure for reorderable sections
  interface ProposalBlock {
    id: string
    type: 'goals' | 'success' | 'deliverables' | 'timeline' | 'custom'
    label: string
    content: string
    order: number
  }

  const [proposalBlocks, setProposalBlocks] = useState<ProposalBlock[]>([
    { id: '1', type: 'goals', label: 'Your Goals', content: '', order: 0 },
    { id: '2', type: 'success', label: 'What Success Looks Like', content: '', order: 1 },
    { id: '3', type: 'deliverables', label: 'Scope & Deliverables', content: '', order: 2 },
    { id: '4', type: 'timeline', label: 'Project Timeline', content: '', order: 3 },
  ])

  const openLogoPicker = () => {
    const el = document.getElementById("logoUpload") as HTMLInputElement | null
    el?.click()
  }

  // Upload logo to storage
  const handleLogoUpload = async (file: File) => {
    try {
      const supabase = createClient()
      
      // Get user's account ID
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please log in to upload logo')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', user.id)
        .single()

      if (!profile?.account_id) {
        toast.error('Account not found')
        return
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `proposal-logo-${Date.now()}.${fileExt}`
      const filePath = `${profile.account_id}/${fileName}`

      // Upload to storage (using portal-logos bucket or create proposal-logos)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('portal-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast.error('Failed to upload logo')
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('portal-logos')
        .getPublicUrl(filePath)

      setLogoUrl(urlData.publicUrl)
      toast.success('Logo uploaded successfully')
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo')
    }
  }

  // Block management functions
  const moveBlockUp = (blockId: string) => {
    // Ensure we work with sorted blocks
    const sortedBlocks = [...proposalBlocks].sort((a, b) => a.order - b.order)
    const blockIndex = sortedBlocks.findIndex(b => b.id === blockId)
    if (blockIndex <= 0) return // Already at top
    
    const newBlocks = [...sortedBlocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex - 1]
    newBlocks[blockIndex - 1] = temp
    
    // Update order numbers
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    
    setProposalBlocks(newBlocks)
  }

  const moveBlockDown = (blockId: string) => {
    // Ensure we work with sorted blocks
    const sortedBlocks = [...proposalBlocks].sort((a, b) => a.order - b.order)
    const blockIndex = sortedBlocks.findIndex(b => b.id === blockId)
    if (blockIndex < 0 || blockIndex >= sortedBlocks.length - 1) return // Already at bottom
    
    const newBlocks = [...sortedBlocks]
    const temp = newBlocks[blockIndex]
    newBlocks[blockIndex] = newBlocks[blockIndex + 1]
    newBlocks[blockIndex + 1] = temp
    
    // Update order numbers
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    
    setProposalBlocks(newBlocks)
  }

  const deleteBlock = (blockId: string) => {
    // Ensure we work with sorted blocks
    const sortedBlocks = [...proposalBlocks].sort((a, b) => a.order - b.order)
    const newBlocks = sortedBlocks.filter(b => b.id !== blockId)
    // Update order numbers
    newBlocks.forEach((block, idx) => {
      block.order = idx
    })
    setProposalBlocks(newBlocks)
  }

  const addCustomBlock = () => {
    const newBlock: ProposalBlock = {
      id: Date.now().toString(),
      type: 'custom',
      label: 'New Section',
      content: '',
      order: proposalBlocks.length
    }
    setProposalBlocks([...proposalBlocks, newBlock])
  }

  const updateBlockLabel = (blockId: string, newLabel: string) => {
    const newBlocks = proposalBlocks.map(block =>
      block.id === blockId ? { ...block, label: newLabel } : block
    )
    setProposalBlocks(newBlocks)
  }

  const updateBlockContent = (blockId: string, newContent: string) => {
    const newBlocks = proposalBlocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    )
    setProposalBlocks(newBlocks)
  }

  // Load existing proposal
  const loadProposal = useCallback(async (id: string) => {
    try {
      setIsLoading(true) // Start loading
      const proposal = await getProposalById(id)
      if (!proposal || !proposal.proposal_data) return

      const data = proposal.proposal_data
      
      // Load client info
      if (data.client) {
        setClientName(data.client.name || '')
        setClientCompany(data.client.company || '')
        setClientEmail(data.client.email || '')
        setClientAddress(data.client.address || '')
      }
      
      // Load company info (only if values exist in saved proposal)
      if (data.company) {
        if (data.company.name) setCompanyName(data.company.name)
        if (data.company.email) setCompanyEmail(data.company.email)
        if (data.company.address) setCompanyAddress(data.company.address)
        if (data.company.showAddress !== undefined) {
          setShowAddress(data.company.showAddress)
        }
      }
      
      // Load branding (only if values exist in saved proposal)
      if (data.branding) {
        if (data.branding.brandColor) setBrandColor(data.branding.brandColor)
        if (data.branding.accentColor) setAccentColor(data.branding.accentColor)
        if (data.branding.logoUrl) setLogoUrl(data.branding.logoUrl)
        if (data.branding.showLogo !== undefined) setShowLogo(data.branding.showLogo)
      }
      
      // Load content
      if (data.content) {
        setProposalTitle(data.content.title || '')
        setProposalSubtitle(data.content.subtitle || '')
        
        // Load blocks if available, otherwise create from legacy format
        if (data.content.blocks && Array.isArray(data.content.blocks)) {
          // Sort blocks by order to ensure correct sequence
          const sortedBlocks = [...data.content.blocks].sort((a, b) => a.order - b.order)
          setProposalBlocks(sortedBlocks)
        } else {
          // Create blocks from legacy individual fields
          const blocks: ProposalBlock[] = []
          let order = 0
          
          if (data.content.goals !== undefined || data.content.labels?.goals) {
            blocks.push({
              id: '1',
              type: 'goals',
              label: data.content.labels?.goals || 'Your Goals',
              content: data.content.goals || '',
              order: order++
            })
          }
          
          if (data.content.successOutcome !== undefined || data.content.labels?.success) {
            blocks.push({
              id: '2',
              type: 'success',
              label: data.content.labels?.success || 'What Success Looks Like',
              content: data.content.successOutcome || '',
              order: order++
            })
          }
          
          if (data.content.deliverables !== undefined || data.content.labels?.scope) {
            blocks.push({
              id: '3',
              type: 'deliverables',
              label: data.content.labels?.scope || 'Scope & Deliverables',
              content: data.content.deliverables || '',
              order: order++
            })
          }
          
          if (data.content.timeline !== undefined || data.content.labels?.timeline) {
            blocks.push({
              id: '4',
              type: 'timeline',
              label: data.content.labels?.timeline || 'Project Timeline',
              content: data.content.timeline || '',
              order: order++
            })
          }
          
          if (blocks.length > 0) {
            setProposalBlocks(blocks)
          }
        }
        
        // Keep legacy states for backward compatibility
        setClientGoals(data.content.goals || '')
        setSuccessOutcome(data.content.successOutcome || '')
        setDeliverables(data.content.deliverables || '')
        setTimeline(data.content.timeline || '')
        if (data.content.labels) {
          setLabelGoals(data.content.labels.goals || 'Your Goals')
          setLabelSuccess(data.content.labels.success || 'What Success Looks Like')
          setLabelScope(data.content.labels.scope || 'Scope & Deliverables')
          setLabelTimeline(data.content.labels.timeline || 'Project Timeline')
          setLabelInvestment(data.content.labels.investment || 'Investment')
        }
      }
      
      // Load pricing
      if (data.pricing) {
        setPricingItems(data.pricing.items || [])
        setAddons(data.pricing.addons || [{ id: "1", name: "", description: "", price: "", selected: false }])
        setCurrency(data.pricing.currency || 'USD')
        setTaxRate(data.pricing.taxRate || '10')
      }
      
      // Load payment plan
      if (data.paymentPlan) {
        setPaymentPlanEnabled(data.paymentPlan.enabled || false)
        setPaymentPlanType(data.paymentPlan.type || '50-50')
        setCustomPaymentsCount(data.paymentPlan.customPaymentsCount || 3)
        setCustomEqualSplit(data.paymentPlan.customEqualSplit !== false)
        setCustomPaymentAmounts(data.paymentPlan.customPaymentAmounts || ['0', '0', '0'])
        setMilestonesCount(data.paymentPlan.milestonesCount || 4)
        setMilestonesEqualSplit(data.paymentPlan.milestonesEqualSplit !== false)
        setMilestones(data.paymentPlan.milestones || [
          { id: "m1", name: "Discovery", amount: "0" },
          { id: "m2", name: "Design", amount: "0" },
          { id: "m3", name: "Development", amount: "0" },
          { id: "m4", name: "Launch", amount: "0" },
        ])
      }
      
      // Load contract
      if (data.contract) {
        setProjectName(data.contract.projectName || '')
        setRevisionCount(data.contract.revisionCount || '2')
        setHourlyRate(data.contract.hourlyRate || '150')
        setLateFee(data.contract.lateFee || '5')
        setLateDays(data.contract.lateDays || '15')
        setIncludeLateFee(data.contract.includeLateFee !== false)
        setIncludeHourlyClause(data.contract.includeHourlyClause !== false)
        setClientSignatureName(data.contract.clientSignatureName || '')
        // Prioritize database column, then fall back to JSONB
        const signatureDate = proposal.client_signed_at 
          ? proposal.client_signed_at.toISOString()
          : (data.contract.clientSignatureDate || data.contract.clientSignedAt || '')
        setClientSignatureDate(signatureDate)
        setYourName(data.contract.yourName || '')
        setEstimatedCompletionDate(data.contract.estimatedCompletionDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      }
      
      // Load invoice
      if (data.invoice) {
        setInvoiceNumber(data.invoice.number || '')
        setInvoiceIssueDate(data.invoice.issueDate || new Date().toISOString().split('T')[0])
        setInvoiceDueDate(data.invoice.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
      }
      
      // Load document toggles
      if (data.documents) {
        setProposalEnabled(data.documents.proposalEnabled !== false)
        setContractEnabled(data.documents.contractEnabled !== false)
        setInvoiceEnabled(data.documents.invoiceEnabled !== false)
      }
      
      // Load status
      setStatus(proposal.status as DocumentStatus)
    } catch (error: any) {
      console.error('Error loading proposal:', error)
      toast.error('Failed to load proposal')
    }
  }, [])

  // Load user's name and company info from database
  useEffect(() => {
    const loadUserAndCompanyInfo = async () => {
      try {
        setIsLoading(true) // Start loading
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Auth error:', authError)
          return
        }
        
        if (user) {
          console.log('Loading user info for:', user.id)
          
          // Get user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('first_name, last_name, account_id')
            .eq('user_id', user.id)
            .single()
          
          if (profileError) {
            console.error('Profile error:', profileError)
            return
          }
          
          console.log('Profile loaded:', profile)
          
          if (profile) {
            // Set user name
            if (profile.first_name && profile.last_name) {
              const fullName = `${profile.first_name} ${profile.last_name}`
              console.log('Setting user name:', fullName)
              setYourName(fullName)
            }
            
            // Get account info - load ALL fields from accounts table
            if (profile.account_id) {
              console.log('Loading account info for:', profile.account_id)
              
              const { data: account, error: accountError } = await supabase
                .from('accounts')
                .select('*')
                .eq('id', profile.account_id)
                .single()
              
              if (accountError) {
                console.error('Account error:', accountError)
                return
              }
              
              console.log('Account loaded:', account)
              
              if (account) {
                if (account.company_name) {
                  console.log('Setting company name:', account.company_name)
                  setCompanyName(account.company_name)
                }
                if (account.email) {
                  console.log('Setting company email:', account.email)
                  setCompanyEmail(account.email)
                }
                if (account.address) {
                  console.log('Setting company address:', account.address)
                  setCompanyAddress(account.address)
                }
                if (account.logo_url) {
                  console.log('Setting logo URL:', account.logo_url)
                  setLogoUrl(account.logo_url)
                }
                if (account.plan_tier) {
                  setPlanTier(account.plan_tier)
                }
              }
            } else {
              console.log('No account_id found in profile')
            }
          }
        }
      } catch (error) {
        console.error('Error loading user and company info:', error)
      } finally {
        setIsLoading(false) // Stop loading when done
      }
    }
    
    loadUserAndCompanyInfo()
  }, [])

  // Prefill from query params when arriving from lead picker/custom details
  useEffect(() => {
    if (!searchParams) return
    const qClientName = searchParams.get("clientName")
    const qClientCompany = searchParams.get("clientCompany")
    const qClientEmail = searchParams.get("clientEmail")
    const qProposalId = searchParams.get("id")
    if (qClientName) setClientName(qClientName)
    if (qClientCompany) setClientCompany(qClientCompany)
    if (qClientEmail) setClientEmail(qClientEmail)
    if (qProposalId) {
      setProposalId(qProposalId)
      loadProposal(qProposalId) // This will handle loading state
    } else {
      setIsLoading(false) // No proposal to load, stop loading
    }
  }, [searchParams, loadProposal])

  // Load saved services
  const loadSavedServices = async () => {
    try {
      setServicesLoading(true)
      const response = await fetch('/api/services')
      const result = await response.json()
      
      if (result.success) {
        setSavedServices(result.data || [])
      } else {
        console.error('Error loading services:', result.error)
        toast.error('Failed to load saved services')
      }
    } catch (error) {
      console.error('Error loading services:', error)
      toast.error('Failed to load saved services')
    } finally {
      setServicesLoading(false)
    }
  }

  // Import service as add-on
  const importService = (service: any) => {
    const newAddon = {
      id: `service-${service.id}-${Date.now()}`,
      name: service.name,
      description: service.description || "",
      price: service.rate?.toString() || "0",
      selected: false,
    }
    setAddons([...addons, newAddon])
    
    // Also add to pricing items
    const newPricingItem = {
      id: `pricing-${service.id}-${Date.now()}`,
      name: service.name,
      description: service.description || "",
      price: service.rate?.toString() || "0",
    }
    setPricingItems([...pricingItems, newPricingItem])
    
    toast.success(`Added ${service.name} to proposal`)
    setServiceModalOpen(false)
  }

  // Keep title in sync with clientName until user edits it
  React.useEffect(() => {
    if (autoTitle) {
      setProposalTitle(`Proposal for ${clientName}`)
    }
  }, [clientName, autoTitle])
  
  // Pricing
  const [pricingItems, setPricingItems] = useState<Array<{ id: string; name: string; description: string; price: string }>>([])
  const [addons, setAddons] = useState([
    { id: "1", name: "", description: "", price: "", selected: false },
  ])
  
  // Contract
  const [revisionCount, setRevisionCount] = useState("2")
  const [hourlyRate, setHourlyRate] = useState("150")
  const [lateFee, setLateFee] = useState("5")
  const [lateDays, setLateDays] = useState("15")
  const [includeLateFee, setIncludeLateFee] = useState(true)
  const [includeHourlyClause, setIncludeHourlyClause] = useState(true)
  const [clientSignatureName, setClientSignatureName] = useState("")
  const [clientSignatureDate, setClientSignatureDate] = useState<string>("")
  const [yourName, setYourName] = useState("")
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  
  // Invoice
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceIssueDate, setInvoiceIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null)
  
  // Service import
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [savedServices, setSavedServices] = useState<any[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [serviceSearch, setServiceSearch] = useState("")
  
  // Calculations
  const subtotal = pricingItems.reduce((sum, item) => sum + parseFloat(item.price || "0"), 0) +
    addons.filter(a => a.selected).reduce((sum, addon) => sum + parseFloat(addon.price || "0"), 0)
  const tax = subtotal * (parseFloat(taxRate) / 100)
  const total = subtotal + tax

  // Payment schedule helpers
  const getEqualAmounts = (sum: number, count: number): number[] => {
    const base = Math.floor((sum / count) * 100) / 100
    const amounts = Array.from({ length: count }, () => base)
    // distribute remainder cents
    const remainder = Math.round(sum * 100) - Math.round(base * 100) * count
    for (let i = 0; i < remainder; i++) {
      amounts[i] = Math.round((amounts[i] + 0.01) * 100) / 100
    }
    return amounts
  }

  const getPaymentSchedule = useCallback((): number[] => {
    if (!paymentPlanEnabled) return [total]
    if (paymentPlanType === "50-50") return getEqualAmounts(total, 2)
    if (paymentPlanType === "33-33-33") return getEqualAmounts(total, 3)
    if (paymentPlanType === "custom") {
      if (customEqualSplit) return getEqualAmounts(total, customPaymentsCount)
      // use user-entered amounts
      const nums = Array.from({ length: customPaymentsCount }).map((_, i) => Number(customPaymentAmounts[i] || 0))
      return nums
    }
    // milestone based – use milestone amounts
    const amounts = milestones.slice(0, milestonesCount).map(m => Number(m.amount || 0))
    return amounts
  }, [paymentPlanEnabled, paymentPlanType, total, customEqualSplit, customPaymentsCount, customPaymentAmounts, milestones, milestonesCount])

  const firstPayment = React.useMemo(() => {
    const schedule = getPaymentSchedule()
    return schedule[0] || 0
  }, [getPaymentSchedule])

  // Save proposal function
  const handleSave = async (saveStatus: 'Draft' | 'Sent' = 'Draft') => {
    try {
      setIsSaving(true)

      // Validate required fields
      if (!proposalTitle || !proposalTitle.trim()) {
        toast.error('Please enter a proposal title before saving')
        setIsSaving(false)
        return
      }

      if (!clientName || !clientName.trim()) {
        toast.error('Please enter a client/recipient name before saving')
        setIsSaving(false)
        return
      }

      // Only require email when sending, not when saving as draft
      if (saveStatus === 'Sent' && (!clientEmail || !clientEmail.trim())) {
        toast.error('Please enter a client/recipient email before sending')
        setIsSaving(false)
        return
      }

      // Try to find client_id or lead_id from URL params or clientName/email
      let clientId: string | undefined = undefined
      let leadId: string | undefined = undefined
      let recipientType: 'Client' | 'Lead' = 'Lead' // Default to Lead
      
      // Check URL params first
      const urlClientId = searchParams?.get('clientId')
      const urlLeadId = searchParams?.get('leadId')
      
      if (urlClientId) {
        clientId = urlClientId
        recipientType = 'Client'
      } else if (urlLeadId) {
        leadId = urlLeadId
        recipientType = 'Lead'
      } else if (clientEmail || clientName) {
        // Try to match from existing clients/leads
        try {
          // First check leads
          const leads = await getLeads()
          const matchingLead = leads.find(l => 
            l.email === clientEmail || 
            l.name === clientName
          )
          if (matchingLead) {
            leadId = matchingLead.id
            recipientType = 'Lead'
          } else {
            // Then check clients
            const clients = await getClients()
            const matchingClient = clients.find(c => 
              c.email === clientEmail || 
              `${c.first_name} ${c.last_name}`.trim() === clientName
            )
            if (matchingClient) {
              clientId = matchingClient.id
              recipientType = 'Client'
            }
          }
        } catch (err) {
          console.error('Error finding client/lead:', err)
        }
      }

      // Build proposal data object
      // Ensure blocks are sorted by order before saving
      const sortedBlocks = [...proposalBlocks].sort((a, b) => a.order - b.order)
      
      const proposalData: ProposalBuilderData = {
        client: {
          name: clientName,
          email: clientEmail,
          company: clientCompany,
          address: clientAddress,
        },
        company: {
          name: companyName,
          email: companyEmail,
          address: companyAddress,
          showAddress,
        },
        branding: {
          brandColor,
          accentColor,
          logoUrl,
          showLogo,
        },
        content: {
          title: proposalTitle,
          subtitle: proposalSubtitle,
          goals: clientGoals,
          successOutcome,
          deliverables,
          timeline,
          blocks: sortedBlocks,
          labels: {
            goals: labelGoals,
            success: labelSuccess,
            scope: labelScope,
            timeline: labelTimeline,
            investment: labelInvestment,
          },
        },
        pricing: {
          items: pricingItems,
          addons,
          currency,
          taxRate,
        },
        paymentPlan: {
          enabled: paymentPlanEnabled,
          type: paymentPlanType,
          customPaymentsCount,
          customEqualSplit,
          customPaymentAmounts,
          milestonesCount,
          milestonesEqualSplit,
          milestones,
          schedule: getPaymentSchedule(),
        },
        contract: {
          projectName,
          revisionCount,
          hourlyRate,
          lateFee,
          lateDays,
          includeLateFee,
          includeHourlyClause,
          clientSignatureName,
          clientSignatureDate,
          yourName,
          estimatedCompletionDate,
        },
        invoice: {
          number: invoiceNumber,
          issueDate: invoiceIssueDate,
          dueDate: invoiceDueDate,
        },
        documents: {
          proposalEnabled,
          contractEnabled,
          invoiceEnabled,
        },
      }

      let currentProposalId = proposalId

      if (proposalId) {
        // Update existing proposal
        console.log('Updating proposal with ID:', proposalId)
        const updateData: any = {
          title: proposalTitle.trim(),
          description: proposalSubtitle?.trim() || undefined,
          proposal_data: proposalData,
          recipient_name: clientName.trim(),
          recipient_email: clientEmail?.trim() || undefined,
          recipient_company: clientCompany?.trim() || undefined,
          recipient_type: clientId ? 'Client' : 'Lead',
          client_id: clientId,
          lead_id: leadId,
          status: saveStatus,
          total_value: total,
          currency,
          subtotal,
          tax_amount: tax,
        }
        
        // If sending, add sent_at timestamp
        if (saveStatus === 'Sent') {
          updateData.sent_at = new Date().toISOString()
        }
        
        await updateProposal(proposalId, updateData)
        
        toast.success(saveStatus === 'Sent' ? 'Proposal sent!' : 'Proposal updated successfully!')
      } else {
        // Create new proposal
        console.log('Creating new proposal (no proposalId)')
        const createData: any = {
          title: proposalTitle.trim(),
          description: proposalSubtitle?.trim() || undefined,
          proposal_data: proposalData,
          recipient_name: clientName.trim(),
          recipient_email: clientEmail?.trim() || undefined,
          recipient_company: clientCompany?.trim() || undefined,
          recipient_type: recipientType,
          client_id: clientId,
          lead_id: leadId,
          status: saveStatus,
          total_value: total,
          currency,
          subtotal,
          tax_amount: tax,
        }
        
        // If sending, add sent_at timestamp
        if (saveStatus === 'Sent') {
          createData.sent_at = new Date().toISOString()
        }
        
        const newProposal = await createProposal(createData)
        currentProposalId = newProposal.id
        setProposalId(currentProposalId)
        
        toast.success(saveStatus === 'Sent' ? 'Proposal sent!' : 'Proposal saved successfully!')
      }
    } catch (error: any) {
      console.error('Error saving proposal:', error)
      toast.error('Failed to save proposal: ' + (error?.message || 'Unknown error'))
    } finally {
      setIsSaving(false)
    }
  }

  // PDF Download function
  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true)
      toast.info('Generating PDF...')

      const pdf = new jsPDF('p', 'mm', 'a4')
      let isFirstPage = true

      // Helper to capture and add section to PDF
      const captureSectionForPDF = async (sectionSelector: string) => {
        const section = document.querySelector(sectionSelector) as HTMLElement
        if (!section) {
          console.warn(`Section not found: ${sectionSelector}`)
          return
        }

        // Make sure section is visible for capture (should already be visible from previous step)
        const originalVisibility = section.style.visibility
        section.style.visibility = 'visible'

        // Clone the section to manipulate without affecting UI
        const clone = section.cloneNode(true) as HTMLElement
        
        // Remove navigation tabs, buttons, and interactive elements
        const elementsToRemove = clone.querySelectorAll(
          '[data-help="document-tabs-container"], button, input, textarea, [contenteditable="true"], .absolute.group'
        )
        elementsToRemove.forEach(el => el.remove())

        // Replace signature placeholders with lines
        const signatureFields = clone.querySelectorAll('[data-pdf-signature]')
        signatureFields.forEach((el) => {
          const htmlEl = el as HTMLElement
          if (htmlEl.textContent?.includes('—') || htmlEl.textContent?.includes('sign here')) {
            htmlEl.textContent = '_______________________________'
          }
        })

        // Create temporary container
        const tempContainer = document.createElement('div')
        tempContainer.style.position = 'fixed'
        tempContainer.style.left = '-9999px'
        tempContainer.style.top = '0'
        tempContainer.style.width = '210mm'
        tempContainer.style.backgroundColor = 'white'
        tempContainer.style.visibility = 'visible'
        tempContainer.style.opacity = '1'
        tempContainer.appendChild(clone)
        document.body.appendChild(tempContainer)

        // Wait for rendering
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Wait for images to load
        const images = tempContainer.querySelectorAll('img')
        await Promise.all(
          Array.from(images).map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve()
            return new Promise((resolve) => {
              img.onload = () => resolve(undefined)
              img.onerror = () => resolve(undefined)
              setTimeout(() => resolve(undefined), 5000)
            })
          })
        )

        // Verify container has content
        if (tempContainer.offsetHeight === 0 && tempContainer.offsetWidth === 0) {
          console.warn(`Container has no dimensions for ${sectionSelector}`)
          document.body.removeChild(tempContainer)
          section.style.visibility = originalVisibility
          return
        }

        // Capture with html2canvas
        let canvas: HTMLCanvasElement
        try {
          canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            logging: false,
            width: tempContainer.scrollWidth,
            height: tempContainer.scrollHeight,
          })
        } catch (error) {
          console.error('html2canvas error:', error)
          document.body.removeChild(tempContainer)
          section.style.visibility = originalVisibility
          return
        }

        // Validate canvas
        if (!canvas || canvas.width === 0 || canvas.height === 0) {
          console.warn(`Invalid canvas for ${sectionSelector}`)
          document.body.removeChild(tempContainer)
          section.style.visibility = originalVisibility
          return
        }

        // Remove temporary container
        document.body.removeChild(tempContainer)
        
        // Restore original section visibility
        section.style.visibility = originalVisibility

        // Get image data and validate
        let imgData: string
        try {
          imgData = canvas.toDataURL('image/png', 1.0)
          if (!imgData || imgData === 'data:,') {
            console.warn(`Invalid image data for ${sectionSelector}`)
            return
          }
        } catch (error) {
          console.error('Error converting canvas to data URL:', error)
          return
        }

        const imgWidth = 210
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        const pageHeight = 297

        if (imgHeight <= 0) {
          console.warn(`Invalid image height for ${sectionSelector}`)
          return
        }

        if (!isFirstPage) {
          pdf.addPage()
        }
        isFirstPage = false

        let position = 0
        let heightLeft = imgHeight

        try {
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft > 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }
        } catch (error) {
          console.error('Error adding image to PDF:', error)
          throw error
        }
      }

      // Temporarily show all enabled sections for capture
      const sectionsToShow: Array<{el: HTMLElement, originalDisplay: string}> = []
      
      if (proposalEnabled) {
        const section = document.querySelector('[data-help="proposal-preview"]') as HTMLElement
        if (section) {
          sectionsToShow.push({ el: section, originalDisplay: section.style.display })
          section.style.display = 'block'
        }
      }
      if (contractEnabled) {
        const section = document.querySelector('[data-help="contract-preview"]') as HTMLElement
        if (section) {
          sectionsToShow.push({ el: section, originalDisplay: section.style.display })
          section.style.display = 'flex'
        }
      }
      if (invoiceEnabled) {
        const section = document.querySelector('[data-help="invoice-preview"]') as HTMLElement
        if (section) {
          sectionsToShow.push({ el: section, originalDisplay: section.style.display })
          section.style.display = 'block'
        }
      }

      // Wait for sections to render
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Capture enabled sections
      if (proposalEnabled) {
        await captureSectionForPDF('[data-help="proposal-preview"]')
      }
      if (contractEnabled) {
        await captureSectionForPDF('[data-help="contract-preview"]')
      }
      if (invoiceEnabled) {
        await captureSectionForPDF('[data-help="invoice-preview"]')
      }

      // Restore original display states
      sectionsToShow.forEach(({ el, originalDisplay }) => {
        el.style.display = originalDisplay
      })

      // Download PDF
      const filename = `proposal-${clientName.replace(/\s+/g, '-').toLowerCase() || 'document'}.pdf`
      pdf.save(filename)
      
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  // Date format helper to avoid timezone off-by-one
  const formatISODateLocal = (iso: string) => {
    try {
      const [y, m, d] = iso.split('-').map((n) => parseInt(n || '0', 10))
      const date = new Date(y, (m || 1) - 1, d || 1)
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return iso
    }
  }

  // Enabled docs and navigation helpers
  const enabledDocs = useMemo(() => {
    const docs: Array<{ id: string; label: string; enabled: boolean }> = [
      { id: "proposal", label: "Proposal", enabled: proposalEnabled },
      { id: "contract", label: "Contract", enabled: contractEnabled },
      { id: "invoice", label: "Invoice", enabled: invoiceEnabled },
    ]
    return docs.filter(d => d.enabled)
  }, [proposalEnabled, contractEnabled, invoiceEnabled])

  React.useEffect(() => {
    // If the current active doc is disabled, switch to the first enabled
    const stillEnabled = enabledDocs.find(d => d.id === activeDoc)
    if (!stillEnabled && enabledDocs.length > 0) {
      setActiveDoc(enabledDocs[0].id)
    }
  }, [enabledDocs, activeDoc])

  const getNextDocId = () => {
    const idx = enabledDocs.findIndex(d => d.id === activeDoc)
    if (idx === -1) return undefined
    return enabledDocs[idx + 1]?.id
  }
  const isLastDoc = enabledDocs.length > 0 && enabledDocs[enabledDocs.length - 1].id === activeDoc

  // In-document tabs (rendered inside document preview)
  const DocumentTabs = () => {
    const tabBase = "px-4 py-1.5 text-sm rounded-full cursor-pointer transition-colors"
    const inactive = "text-gray-600 hover:text-gray-900"
    return (
      <div className="w-full flex justify-center pt-6 pb-4" data-help="document-tabs-container">
        <div className="inline-flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: `${accentColor}1A` }}>
          {enabledDocs.map(tab => (
            <span
              key={tab.id}
              data-help={`tab-${tab.id}`}
              className={`${tabBase} ${activeDoc === tab.id ? "text-white" : inactive}`}
              onClick={() => setActiveDoc(tab.id)}
              style={activeDoc === tab.id ? { backgroundColor: brandColor, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" } : undefined}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>
    )
  }
  
  const getStatusColor = (s: DocumentStatus) => {
    const colors = {
      "Draft": "bg-gray-100 text-gray-700",
      "Sent": "bg-blue-100 text-blue-700",
      "Viewed": "bg-purple-100 text-purple-700",
      "Accepted": "bg-green-100 text-green-700",
    }
    return colors[s]
  }

  // Editable field component
  const EditableField = ({ 
    value,
    onChange,
    multiline = false,
    className = "",
    placeholder = "",
    fieldKey = "",
  }: any) => {
    const isEditing = editingField === fieldKey
    const editorRef = React.useRef<HTMLDivElement | null>(null)

    // Initialize editor content and caret when entering edit mode
    React.useEffect(() => {
      if (isEditing && editorRef.current) {
        // Set innerText to avoid HTML injection and preserve new lines
        editorRef.current.innerText = value || ""
        // Focus and move caret to end
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, [isEditing])

    // Close editor when clicking outside
    React.useEffect(() => {
      if (!isEditing) return
      const handleClickOutside = (e: MouseEvent) => {
        if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
          setEditingField(null)
        }
      }
      document.addEventListener("mousedown", handleClickOutside, true)
      return () => document.removeEventListener("mousedown", handleClickOutside, true)
    }, [isEditing])

    if (isEditing) {
      return (
        <div
          ref={editorRef}
          className={`relative ${className} outline outline-2 outline-blue-500/70 rounded-sm`}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerText)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter commits and blurs
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).blur()
            }
          }}
          style={{
            whiteSpace: multiline ? ("pre-wrap" as const) : ("pre-wrap" as const),
            minHeight: multiline ? 100 : undefined,
          }}
        />
      )
    }

        return (
          <div
        className={`group relative ${className}`}
        onClick={() => setEditingField(fieldKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setEditingField(fieldKey)
        }}
      >
        <div className={`${multiline ? "whitespace-pre-wrap" : ""} cursor-text hover:bg-blue-50/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${!value && placeholder ? "text-gray-400 italic" : ""}`}>
          {value || (placeholder ? `Example: ${placeholder}` : "")}
          <Pencil className="inline-block ml-2 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity align-text-top" />
            </div>
          </div>
        )
  }

        return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
      `}</style>

      {isLoading ? (
        <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#3C3CFF] mb-4" />
            <p className="text-gray-600">Loading proposal...</p>
          </div>
        </div>
      ) : (
      <div className="h-screen flex flex-col bg-white">
        {/* Minimal Header */}
        <div className="border-b px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" data-help="btn-back-proposals" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">{clientName || "Client Name"}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-gray-900">{projectName || "Project Name"}</span>
              <Badge className={getStatusColor(status)} variant="secondary">{status}</Badge>
                  </div>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => {
                // If already published (Sent), keep it as Sent, otherwise save as Draft
                const saveStatus = status === 'Sent' ? 'Sent' : 'Draft'
                handleSave(saveStatus)
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                if (proposalId) {
                  window.open(`/dashboard/proposals/preview/${proposalId}`, '_blank')
                } else {
                  toast.error('Please save the proposal first')
                }
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
            >
              {downloadingPDF ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  PDF
                </>
              )}
            </Button>
            <Button 
              size="sm" 
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              onClick={() => handleSave('Sent')}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Live Preview Panel - LEFT */}
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-6xl mx-auto p-12">
                {/* Tabs rendered inside the document */}

                {/* PROPOSAL PREVIEW */}
                {proposalEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden" style={{ fontFamily: 'Georgia, serif', display: activeDoc === "proposal" ? 'block' : 'none' }} data-help="proposal-preview">
                    <DocumentTabs />
                    {/* Document Header with Logo */}
                    <div className="px-16 pt-16 pb-8">
                      <div className="flex justify-between items-start mb-12">
                        {/* Logo */}
                        {showLogo ? (
                          <div
                            className={`w-20 h-20 rounded-lg flex items-center justify-center transition-colors ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 cursor-pointer group'}` }
                            onClick={openLogoPicker}
                          >
                            {logoUrl ? (
                              <>
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow">
                                  <Pencil className="h-3 w-3 text-gray-700" />
                                </div>
                              </>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1 group-hover:text-gray-500" />
                                <span className="text-xs text-gray-500">Logo</span>
                  </div>
                            )}
                </div>
                        ) : (
                          <div className="w-32" />
                        )}
                        
                        {/* Company details */}
                        <div className="text-right text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="font-semibold text-gray-900">{companyName || "{your_company_name}"}</div>
                          <div className="text-gray-600">{companyEmail || "{your_email}"}</div>
                          {showAddress && (
                            <div className="text-gray-600 text-xs mt-1">{companyAddress || "{your_address}"}</div>
                          )}
            </div>
          </div>
                      
                      {/* Title section */}
                      <div className="text-center mb-12 pb-8 border-b" style={{ borderColor: accentColor }}>
                        <div className="text-sm uppercase tracking-wider text-gray-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Proposal
                  </div>
                        <EditableField
                          value={proposalTitle}
                          onChange={(v: string) => { setProposalTitle(v); setAutoTitle(false) }}
                          fieldKey="proposalTitle"
                          className="text-3xl font-normal text-gray-900 mb-3"
                        />
                        <EditableField
                          value={proposalSubtitle}
                          onChange={setProposalSubtitle}
                          fieldKey="proposalSubtitle"
                          placeholder="A comprehensive website redesign to elevate your digital presence"
                          className="text-base text-gray-600 max-w-2xl mx-auto font-light"
                        />
                        <div className="mt-6 text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Prepared for <span className="font-semibold text-gray-900">{clientName || "{client_name}"}</span> • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                      </div>
              </div>

                    <div className="px-16 pb-16 space-y-12" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {/* Render blocks dynamically */}
                      {proposalBlocks.sort((a, b) => a.order - b.order).map((block, index) => {
                        const placeholder = block.type === 'goals' ? "Modernize outdated website design&#10;Improve user experience and conversion rates&#10;Mobile-responsive and fast loading" :
                          block.type === 'success' ? "A beautiful, conversion-optimized website that engages visitors and drives measurable business results." :
                          block.type === 'deliverables' ? "Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support" :
                          block.type === 'timeline' ? "Phase 1: Discovery & Strategy (Week 1-2)&#10;Phase 2: Design & Feedback (Week 3-4)&#10;Phase 3: Development (Week 5-7)&#10;Phase 4: Launch & Training (Week 8)" :
                          "Add your content here..."
                        
                        return (
                          <div key={block.id} className="relative group">
                            {/* Reorder and delete controls */}
                            <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                              <button
                                onClick={() => moveBlockUp(block.id)}
                                disabled={index === 0}
                                className={`p-1 rounded hover:bg-gray-200 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title="Move up"
                              >
                                <ChevronUp className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => moveBlockDown(block.id)}
                                disabled={index === proposalBlocks.length - 1}
                                className={`p-1 rounded hover:bg-gray-200 ${index === proposalBlocks.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                                title="Move down"
                              >
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              </button>
                              <button
                                onClick={() => deleteBlock(block.id)}
                                className="p-1 rounded hover:bg-red-100 text-red-600"
                                title="Delete block"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div>
                              <EditableField
                                value={block.label}
                                onChange={(val: string) => updateBlockLabel(block.id, val)}
                                fieldKey={`label-${block.id}`}
                                className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                              />
                              <EditableField
                                value={block.content}
                                onChange={(val: string) => updateBlockContent(block.id, val)}
                                multiline
                                fieldKey={`content-${block.id}`}
                                placeholder={placeholder}
                                className="text-sm text-gray-700 leading-relaxed"
                              />
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Add new block button */}
                      <button
                        onClick={addCustomBlock}
                        className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-gray-600"
                      >
                        <Plus className="h-5 w-5" />
                        <span>Add Custom Section</span>
                      </button>

                      {/* Investment */}
                      <div>
                        <EditableField
                          value={labelInvestment}
                          onChange={setLabelInvestment}
                          fieldKey="labelInvestment"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        
                        <table className="w-full text-sm">
                <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 font-semibold text-gray-700">Service</th>
                              <th className="text-left py-3 font-semibold text-gray-700">Details</th>
                              <th className="text-right py-3 font-semibold text-gray-700">Fee</th>
                              <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                            {pricingItems.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-100 group">
                                <td className="py-4">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...pricingItems]
                                      updated[idx].name = e.target.value
                                      setPricingItems(updated)
                                    }}
                                    placeholder="Service name"
                                    className="w-full bg-transparent text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                  />
                        </td>
                                <td className="py-4">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                      const updated = [...pricingItems]
                                      updated[idx].description = e.target.value
                                      setPricingItems(updated)
                                    }}
                                    placeholder="Description"
                                    className="w-full bg-transparent text-gray-600 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                  />
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center justify-end">
                                    <span className="text-gray-900">$</span>
                                    <input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => {
                                        const updated = [...pricingItems]
                                        updated[idx].price = e.target.value
                                        setPricingItems(updated)
                                      }}
                                      placeholder="0"
                                      className="w-24 bg-transparent text-right font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                    />
                                  </div>
                        </td>
                                <td className="py-4">
                                  <button
                                    onClick={() => setPricingItems(pricingItems.filter((_, i) => i !== idx))}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            
                            {addons.filter(a => a.selected).map((addon) => (
                              <tr key={addon.id} className="border-b border-gray-100">
                                <td className="py-4">
                                  <div className="text-gray-900 font-medium">{addon.name}</div>
                                  {addon.description && (
                                    <div className="text-gray-600 text-xs mt-1">{addon.description}</div>
                                  )}
                                </td>
                                <td className="py-4 text-gray-600 text-xs">Service add-on</td>
                                <td className="py-4 text-right font-medium text-gray-900">
                                  ${parseFloat(addon.price || "0").toLocaleString()}
                                </td>
                                <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => setPricingItems([...pricingItems, { id: Date.now().toString(), name: "", description: "", price: "0" }])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add line item
              </button>
                        
                        <div className="mt-6 pt-4 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Tax ({taxRate}%)</span>
                            <span>${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
                        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t" style={{ borderColor: accentColor }}>
                            <span>Total Investment</span>
                          <span style={{ color: brandColor }}>${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

                        {paymentPlanEnabled && (
                          <div className="mt-6 p-4 bg-gray-50 border text-xs text-gray-700 space-y-2" style={{ borderColor: accentColor }}>
                            <div className="font-semibold">Payment Plan</div>
                            <div>
                              {paymentPlanType === "50-50" && "50% deposit upon acceptance, 50% upon project completion"}
                              {paymentPlanType === "33-33-33" && "Three equal monthly installments"}
                              {paymentPlanType === "milestone" && "Milestone-based: Invoices are issued at each milestone. No upfront payment due."}
                              {paymentPlanType === "custom" && (
                                customEqualSplit
                                  ? `${customPaymentsCount} equal payments of $${(Math.floor((total / customPaymentsCount) * 100) / 100).toLocaleString()}`
                                  : `${customPaymentsCount} payments: ${customPaymentAmounts.map(a => `$${Number(a || 0).toLocaleString()}`).join(', ')}`
                              )}
                            </div>
                            {paymentPlanType === "milestone" ? (
                              <div className="space-y-1 text-gray-700">
                                <p className="text-xs">Milestones below will be invoiced upon completion.</p>
                                <ul className="list-disc ml-5 text-xs space-y-1">
                                  {milestones.slice(0, milestonesCount).map((m, i) => (
                                    <li key={m.id}>{m.name || `Milestone ${i+1}`} → ${Number(m.amount || 0).toLocaleString()}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <ul className="list-disc ml-5 space-y-1">
                                {getPaymentSchedule().map((amt, idx) => (
                                  <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
              </div>

                      {/* Footer Navigation */}
                      <div className="pt-8 border-t" style={{ borderColor: accentColor }}>
                        <div className="flex justify-center">
                          {isLastDoc ? (
                            <Button className="px-10" style={{ backgroundColor: brandColor }}>
                              Accept Proposal
                            </Button>
                          ) : (
                            <Button
                              className="px-10"
                              style={{ backgroundColor: brandColor }}
                              onClick={() => {
                                const next = getNextDocId()
                                if (next) setActiveDoc(next)
                              }}
                            >
                              Next
                            </Button>
                          )}
            </div>
          </div>

                      <JolixFooter planTier={planTier} />
              </div>
                  </div>
                )}

                {/* CONTRACT PREVIEW */}
                {contractEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16 space-y-8 flex flex-col" style={{ fontFamily: 'Georgia, serif', display: activeDoc === "contract" ? 'flex' : 'none' }} data-help="contract-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                      {showLogo ? (
                        <div
                          className={`w-20 h-20 rounded-lg flex items-center justify-center ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer'}` }
                          onClick={openLogoPicker}
                        >
                          {logoUrl ? (
                            <>
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow">
                                <Pencil className="h-3 w-3 text-gray-700" />
            </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">Logo</span>
          </div>
                          )}
          </div>
                      ) : (
                        <div className="w-32" />
                      )}
                      <div className="text-right text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <div className="font-semibold text-gray-900">{companyName}</div>
                        <div className="text-gray-600">{companyEmail}</div>
            </div>
          </div>

                    <div className="text-center border-b pb-6 mb-8" style={{ borderColor: accentColor }}>
                      <h1 className="text-2xl font-normal text-gray-900 mb-2">Freelance Service Agreement</h1>
                      <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                        This Agreement is between <strong>{companyName || "{your_company_name}"}</strong> ("Freelancer") and <strong>{clientName || "{client_name}"}</strong> ("Client") for the project described below.
                      </p>
                      <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Both parties agree to the following terms.
                      </p>
                </div>

                    <div className="space-y-8 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {/* 1. Project Summary */}
            <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          1️⃣ Project Summary
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-3">
                          Freelancer agrees to perform the following services for Client:
                        </p>
                        <div className="ml-4 space-y-2 text-gray-700">
                          <p><strong>Project:</strong> {projectName || "{project_name}"}</p>
                          <p><strong>Deliverables:</strong></p>
                          <EditableField
                            value={deliverables}
                            onChange={setDeliverables}
                            multiline
                            fieldKey="contractDeliverables"
                            placeholder="Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support"
                            className="text-gray-700 ml-4"
                          />
                          <p><strong>Start Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          <p><strong>Estimated Completion:</strong> {formatISODateLocal(estimatedCompletionDate)}</p>
            </div>
                        <p className="text-gray-700 mt-3 leading-relaxed">
                          Any additional work outside this scope will require a new written agreement or change order.
                        </p>
          </div>

                      {/* 2. Payment Terms */}
                  <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          2️⃣ Payment Terms
                        </h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed">
                          <p><strong>Total Project Fee:</strong> ${total.toLocaleString()} {currency}</p>
                          <p><strong>Payment Schedule:</strong> {paymentPlanEnabled ? (
                            paymentPlanType === "50-50" ? "50% deposit upon signing, 50% upon project completion" :
                            paymentPlanType === "33-33-33" ? "Three equal monthly installments" :
                            "Payment due upon completion of each milestone"
                          ) : "Full payment due upon project completion"}</p>
                          <p>Client agrees to pay invoices by the due date shown on each invoice.</p>
                          {includeLateFee && (
                            <p>Late payments may incur a {lateFee}% fee after {lateDays} days overdue.</p>
                          )}
                          <p>Ownership of deliverables transfers to Client only after full payment has been received.</p>
          </div>
        </div>

                      {/* 3. Revisions & Changes */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          3️⃣ Revisions & Changes
                        </h2>
                        <div className="space-y-3 text-gray-700 leading-relaxed">
                          <p>This agreement includes {revisionCount} revision(s) per deliverable.</p>
                          {includeHourlyClause && (
                            <p>Additional revisions or changes in scope will be billed at ${hourlyRate} USD per hour or a mutually agreed rate.</p>
                          )}
                        </div>
            </div>

                      {/* 4. Intellectual Property */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          4️⃣ Intellectual Property
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-2">After full payment:</p>
                        <ul className="ml-4 space-y-2 text-gray-700 list-disc">
                          <li>Client owns final approved deliverables.</li>
                          <li>Freelancer retains the right to display completed work for portfolio and marketing purposes, unless Client requests otherwise in writing.</li>
                        </ul>
                  </div>

                      {/* 5. Confidentiality */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          5️⃣ Confidentiality
                        </h2>
                        <ul className="ml-4 space-y-2 text-gray-700 list-disc">
                          <li>Freelancer will not share or disclose Client's confidential information without written consent.</li>
                          <li>Client will not share Freelancer's proprietary methods or materials without consent.</li>
                        </ul>
                  </div>

                      {/* 6. Termination */}
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          6️⃣ Termination
                        </h2>
                        <ul className="ml-4 space-y-2 text-gray-700 list-disc">
                          <li>Either party may end this Agreement with written notice.</li>
                          <li>Client agrees to pay for all work completed up to the termination date.</li>
                          <li>Deposits and completed milestone payments are non-refundable once work has begun.</li>
                        </ul>
                  </div>

                      {/* 7. Liability */}
                  <div>
                        <h2 className="text-base font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                          7️⃣ Liability
                        </h2>
                        <ul className="ml-4 space-y-2 text-gray-700 list-disc">
                          <li>Freelancer provides services in good faith but cannot guarantee specific results or outcomes.</li>
                          <li>Freelancer's total liability is limited to the amount Client has paid under this Agreement.</li>
                        </ul>
              </div>

                      {/* 8. Acceptance & Signatures */}
                      <div className="border-t pt-12 mt-12" style={{ borderColor: accentColor }}>
                        <h2 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                          8️⃣ Acceptance & Signatures
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-6">
                          By signing below, both parties agree to the terms of this Agreement.<br />
                          Typing your full legal name acts as your electronic signature.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-12 mt-8">
                          {/* Freelancer Signature */}
                    <div>
                            <div className="text-xs font-semibold text-gray-700 mb-4">Freelancer</div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Name:</div>
                                <div className="text-sm text-gray-900">{yourName}</div>
                  </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Date:</div>
                                <div className="text-sm text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Signature:</div>
                                <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                                  {yourName}
                  </div>
                  </div>
                            </div>
              </div>

                          {/* Client Signature */}
                    <div>
                            <div className="text-xs font-semibold text-gray-700 mb-4">Client</div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Name:</div>
                                <div className="text-sm text-gray-900" data-pdf-signature>{clientSignatureName || '—'}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Date:</div>
                                <div className="text-sm text-gray-900" data-pdf-signature>—</div>
                    </div>
                    
                    <div>
                                <div className="text-xs text-gray-600 mb-2">Signature:</div>
                                <div className="border-b-2 border-gray-400 pb-1 min-h-[48px] flex items-end">
                                  <div className="text-3xl md:text-4xl text-gray-400 italic" style={{ fontFamily: "'Dancing Script', cursive" }} data-pdf-signature>
                                    {clientSignatureName || '(Client will sign here)'}
                                  </div>
                          </div>
                              </div>
                              <div className="flex items-start gap-2 pt-2">
                                <Checkbox id="sig-consent" className="mt-1" />
                                <Label htmlFor="sig-consent" className="text-xs font-normal text-gray-600 leading-relaxed">
                                  I agree that typing my name above constitutes a legal electronic signature
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Footer Navigation - bottom of page */}
                    <div className="pt-8 border-t mt-16" style={{ borderColor: accentColor }}>
                      <div className="flex justify-center">
                        {isLastDoc ? (
                          <Button className="px-10" style={{ backgroundColor: brandColor }}>
                            Accept Proposal
                </Button>
                        ) : (
                <Button
                            className="px-10"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => {
                              const next = getNextDocId()
                              if (next) setActiveDoc(next)
                            }}
                          >
                            Next
                </Button>
                        )}
              </div>
                    </div>

                    <JolixFooter planTier={planTier} />
                  </div>
                )}

                {/* INVOICE PREVIEW */}
                {invoiceEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16" style={{ fontFamily: 'Inter, sans-serif', display: activeDoc === "invoice" ? 'block' : 'none' }} data-help="invoice-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                      {showLogo ? (
                        <div
                          className={`w-20 h-20 rounded-lg flex items-center justify-center ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer'}` }
                          onClick={openLogoPicker}
                        >
                          {logoUrl ? (
                            <>
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1 shadow">
                                <Pencil className="h-3 w-3 text-gray-700" />
                  </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                              <span className="text-xs text-gray-500">Logo</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-32" />
                      )}
                      <div className="text-right">
                        <div className="text-sm uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                          Invoice
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 mb-4">{invoiceNumber}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Issue Date: {new Date(invoiceIssueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                          <div>Due Date: {new Date(invoiceDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
            </div>
              </div>

                    <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">From</div>
                        <div className="text-gray-900 space-y-1">
                          <p className="font-semibold">{companyName}</p>
                          <p className="text-xs text-gray-600">{companyEmail}</p>
                          {showAddress && (
                            <p className="text-xs text-gray-600">{companyAddress}</p>
                          )}
                  </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Bill To</div>
                        <div className="text-gray-900 space-y-1">
                          <p className="font-semibold">{clientName}</p>
                          <p className="text-xs">{clientCompany}</p>
                          <p className="text-xs text-gray-600">{clientEmail}</p>
                          <p className="text-xs text-gray-600">{clientAddress}</p>
              </div>
            </div>
          </div>

                    <table className="w-full mb-8 text-sm">
                      <thead className="border-b border-gray-300">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-700">Description</th>
                          <th className="pb-3 font-semibold text-gray-700 text-center w-20">Qty</th>
                          <th className="pb-3 font-semibold text-gray-700 text-right w-32">Amount</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingItems.map((item, idx) => (
                          <tr key={item.id} className="border-b border-gray-100 group">
                            <td className="py-4">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...pricingItems]
                                  updated[idx].name = e.target.value
                                  setPricingItems(updated)
                                }}
                                placeholder="Service name"
                                className="w-full bg-transparent font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 mb-1"
                              />
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...pricingItems]
                                  updated[idx].description = e.target.value
                                  setPricingItems(updated)
                                }}
                                placeholder="Description"
                                className="w-full bg-transparent text-xs text-gray-600 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                defaultValue="1"
                                className="w-12 bg-transparent text-center text-gray-700 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                              />
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-end">
                                <span className="text-gray-900">$</span>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    const updated = [...pricingItems]
                                    updated[idx].price = e.target.value
                                    setPricingItems(updated)
                                  }}
                                  placeholder="0"
                                  className="w-24 bg-transparent text-right font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                />
                              </div>
                            </td>
                            <td className="py-4">
                              <button
                                onClick={() => setPricingItems(pricingItems.filter((_, i) => i !== idx))}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {addons.filter(a => a.selected).map((addon) => (
                          <tr key={addon.id} className="border-b border-gray-100">
                            <td className="py-4">
                              <div className="font-medium text-gray-900">{addon.name}</div>
                              {addon.description && (
                                <div className="text-gray-600 text-xs mt-1">{addon.description}</div>
                              )}
                            </td>
                            <td className="py-4 text-center text-gray-700">1</td>
                            <td className="py-4 text-right font-medium text-gray-900">
                              ${parseFloat(addon.price || "0").toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={() => setPricingItems([...pricingItems, { id: Date.now().toString(), name: "", description: "", price: "0" }])}
                      className="mb-6 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add line item
                    </button>

                    <div className="flex justify-end mb-12">
                      <div className="w-96 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span>${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Tax ({taxRate}%)</span>
                          <span>${tax.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
                        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t" style={{ borderColor: accentColor }}>
                          <span>Amount Due Now</span>
                          <span style={{ color: brandColor }}>${(paymentPlanEnabled ? firstPayment : total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>
              </div>

                    <div className="border-t pt-8" style={{ borderColor: accentColor }}>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        <p className="mb-2"><strong>Payment Terms:</strong> Payment is due within {paymentDueDays} days of invoice date.</p>
                        <p>Thank you for your business. If you have any questions about this invoice, please contact {companyEmail}.</p>
                    </div>
                  </div>
                    {paymentPlanEnabled && (
                      <div className="mt-6 p-4 bg-gray-50 border text-xs text-gray-700" style={{ borderColor: accentColor }}>
                        <div className="font-semibold mb-2">Payment Plan</div>
                        {paymentPlanType === "milestone" ? (
              <div className="space-y-2">
                            <p className="text-xs text-gray-600">Milestone-based billing: You will be invoiced at each milestone; no full upfront payment is required.</p>
                            <ul className="list-disc ml-5">
                              {milestones.slice(0, milestonesCount).map((m, i) => (
                                <li key={m.id}>{m.name || `Milestone ${i+1}`} → ${Number(m.amount || 0).toLocaleString()}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <ul className="list-disc ml-5 space-y-1">
                            {getPaymentSchedule().map((amt, idx) => (
                              <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {/* Footer Navigation */}
                    <div className="pt-8 border-t" style={{ borderColor: accentColor }}>
                      <div className="flex justify-center">
                        {isLastDoc ? (
                          <Button className="px-10" style={{ backgroundColor: brandColor }}>
                            Accept Proposal
                      </Button>
                        ) : (
                <Button
                            className="px-10"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => {
                              const next = getNextDocId()
                              if (next) setActiveDoc(next)
                            }}
                          >
                            Next
                      </Button>
                        )}
                    </div>
                  </div>

                    <JolixFooter planTier={planTier} />
                  </div>
                )}
              </div>
            </ScrollArea>
            </div>

          {/* Settings Panel - RIGHT */}
          <div className="w-96 border-l bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Document Settings</h2>
          </div>

              {/* Document Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Proposal</span>
                    </div>
                  <Switch checked={proposalEnabled} onCheckedChange={setProposalEnabled} />
                  </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Contract</span>
              </div>
                  <Switch checked={contractEnabled} onCheckedChange={setContractEnabled} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Invoice</span>
                  </div>
                  <Switch checked={invoiceEnabled} onCheckedChange={setInvoiceEnabled} />
                </div>
            </div>
          </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                  {/* Branding */}
                  <AccordionItem value="branding" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="font-medium">Branding</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Logo Selector */}
                      <div>
                        <Label className="text-xs">Logo</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className="w-14 h-14 rounded border bg-white flex items-center justify-center overflow-hidden cursor-pointer"
                            onClick={openLogoPicker}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openLogoPicker() }}
                          >
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              id="logoUpload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleLogoUpload(file)
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => (document.getElementById("logoUpload") as HTMLInputElement)?.click()}
                            >
                              Upload
                            </Button>
                            {logoUrl && (
                              <Button variant="ghost" onClick={() => setLogoUrl("")}>Remove</Button>
                            )}
                          </div>
              </div>
                        <div className="flex items-center justify-between mt-2">
                          <Label className="text-xs">Show Logo in document</Label>
                          <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                  <div>
                          <Label className="text-xs">Brand Color</Label>
                          <div className="flex gap-2 mt-1">
                      <Input
                              type="color" 
                              value={brandColor} 
                              onChange={(e) => setBrandColor(e.target.value)}
                              className="h-10 w-full"
                            />
                    </div>
                    </div>
                    <div>
                          <Label className="text-xs">Accent</Label>
                          <div className="flex gap-2 mt-1">
                            <Input 
                              type="color" 
                              value={accentColor} 
                              onChange={(e) => setAccentColor(e.target.value)}
                              className="h-10 w-full"
                            />
                      </div>
                    </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Company Info */}
                  <AccordionItem value="company" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Company Info</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                  <div>
                        <Label className="text-xs">Name</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs">Address</Label>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs text-gray-500">Show</Label>
                            <Switch checked={showAddress} onCheckedChange={setShowAddress} />
                          </div>
                        </div>
                    <Textarea
                          value={companyAddress} 
                          onChange={(e) => setCompanyAddress(e.target.value)} 
                          rows={2}
                          className="mt-1"
                    />
                  </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Client Info */}
                  <AccordionItem value="client" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Client Info</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                    <div>
                        <Label className="text-xs">Name</Label>
                        <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label className="text-xs">Company</Label>
                        <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label className="text-xs">Address</Label>
                        <Textarea 
                          value={clientAddress} 
                          onChange={(e) => setClientAddress(e.target.value)} 
                          rows={2}
                          className="mt-1"
                      />
                    </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Settings */}
                  <AccordionItem value="payment" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Payment</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                          <Label className="text-xs">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                          <Label className="text-xs">Tax (%)</Label>
                          <Input 
                            type="number" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(e.target.value)}
                            className="mt-1"
                          />
                      </div>
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Payment Due (days)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={paymentDueDays}
                            onChange={(e) => setPaymentDueDays(parseInt(e.target.value || '0', 10))}
                            className="mt-1"
                          />
                        </div>
                      </div>

                  <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs">Payment Plans</Label>
                          <Switch checked={paymentPlanEnabled} onCheckedChange={setPaymentPlanEnabled} />
                        </div>
                        {paymentPlanEnabled && (
                          <Select value={paymentPlanType} onValueChange={(v) => {
                            setPaymentPlanType(v)
                            if (v === "custom") {
                              // initialize custom amounts
                              const count = customPaymentsCount
                              const equal = Math.max(Math.floor((total / count) * 100) / 100, 0)
                              setCustomPaymentAmounts(Array.from({ length: count }, () => equal.toString()))
                            } else if (v === "milestone") {
                              // initialize milestones
                              const count = milestonesCount
                              const eq = getEqualAmounts(total, count)
                              setMilestones(prev => Array.from({ length: count }).map((_, i) => ({
                                id: `m${i+1}`,
                                name: prev[i]?.name || ["Discovery", "Design", "Development", "Launch"][i] || `Milestone ${i+1}`,
                                amount: eq[i]?.toString() || "0"
                              })))
                              setMilestonesEqualSplit(true)
                            }
                          }}>
                            <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                              <SelectItem value="50-50">50/50 Split</SelectItem>
                              <SelectItem value="33-33-33">3 Equal Payments</SelectItem>
                              <SelectItem value="milestone">Milestone Based</SelectItem>
                              <SelectItem value="custom">Custom Plan</SelectItem>
                      </SelectContent>
                    </Select>
                        )}
                </div>
                      {/* Custom payment plan editor */}
                      {paymentPlanEnabled && paymentPlanType === "custom" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                    <div>
                              <Label className="text-xs">Number of Payments</Label>
                              <Input
                                type="number"
                                min={1}
                                value={customPaymentsCount}
                                onChange={(e) => {
                                  const next = Math.max(1, parseInt(e.target.value || "1"))
                                  setCustomPaymentsCount(next)
                                  const equal = Math.max(Math.floor((total / next) * 100) / 100, 0)
                                  if (customEqualSplit) {
                                    setCustomPaymentAmounts(Array.from({ length: next }, () => equal.toString()))
                                  } else {
                                    setCustomPaymentAmounts(Array.from({ length: next }, (_, i) => customPaymentAmounts[i] || "0"))
                                  }
                                }}
                                className="mt-1"
                              />
                      </div>
                            <div className="flex items-end gap-2">
                              <div className="flex items-center justify-between w-full">
                                <Label className="text-xs">Equal Split</Label>
                                <Switch
                                  checked={customEqualSplit}
                                  onCheckedChange={(checked) => {
                                    setCustomEqualSplit(!!checked)
                                    const next = customPaymentsCount
                                    const equal = Math.max(Math.floor((total / next) * 100) / 100, 0)
                                    if (checked) {
                                      setCustomPaymentAmounts(Array.from({ length: next }, () => equal.toString()))
                                    }
                                  }}
                                />
                    </div>
                            </div>
                          </div>
                          {!customEqualSplit && (
                            <div className="space-y-2">
                              <Label className="text-xs">Amounts</Label>
                              {Array.from({ length: customPaymentsCount }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className="text-xs text-gray-600 w-16">Payment {i + 1}</span>
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    value={customPaymentAmounts[i] || ""}
                            onChange={(e) => {
                                      const next = [...customPaymentAmounts]
                                      next[i] = e.target.value
                                      setCustomPaymentAmounts(next)
                                    }}
                          />
                        </div>
                      ))}
                    </div>
                          )}
                        </div>
                      )}
                      {/* Milestone payment plan editor */}
                      {paymentPlanEnabled && paymentPlanType === "milestone" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                    <div>
                              <Label className="text-xs">Number of Milestones</Label>
                        <Input
                                type="number"
                                min={1}
                                value={milestonesCount}
                          onChange={(e) => {
                                  const next = Math.max(1, parseInt(e.target.value || "1"))
                                  setMilestonesCount(next)
                                  const eq = getEqualAmounts(total, next)
                                  if (milestonesEqualSplit) {
                                    setMilestones(Array.from({ length: next }).map((_, i) => ({
                                      id: `m${i+1}`,
                                      name: milestones[i]?.name || `Milestone ${i+1}`,
                                      amount: eq[i]?.toString() || "0"
                                    })))
                                  } else {
                                    setMilestones(Array.from({ length: next }).map((_, i) => ({
                                      id: `m${i+1}`,
                                      name: milestones[i]?.name || `Milestone ${i+1}`,
                                      amount: milestones[i]?.amount || "0"
                                    })))
                                  }
                                }}
                                className="mt-1"
                              />
                    </div>
                            <div className="flex items-end gap-2">
                              <div className="flex items-center justify-between w-full">
                                <Label className="text-xs">Equal Split</Label>
                                <Switch
                                  checked={milestonesEqualSplit}
                                  onCheckedChange={(checked) => {
                                    setMilestonesEqualSplit(!!checked)
                                    if (checked) {
                                      const eq = getEqualAmounts(total, milestonesCount)
                                      setMilestones(prev => prev.map((m, i) => ({ ...m, amount: eq[i]?.toString() || "0" })))
                                    }
                                  }}
                                />
                      </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Milestones</Label>
                            {Array.from({ length: milestonesCount }).map((_, i) => (
                              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                              <Input
                                  className="col-span-7"
                                  placeholder={`Milestone ${i+1} name`}
                                  value={milestones[i]?.name || ""}
                                  onChange={(e) => setMilestones(prev => {
                                    const next = [...prev]
                                    next[i] = next[i] || { id: `m${i+1}`, name: "", amount: "0" }
                                    next[i].name = e.target.value
                                    return next
                                  })}
                                />
                                <Input
                                  className="col-span-5"
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9]*\.?[0-9]*"
                                  placeholder="Amount"
                                  value={milestones[i]?.amount || ""}
                                  disabled={milestonesEqualSplit}
                                  onChange={(e) => setMilestones(prev => {
                                    const next = [...prev]
                                    next[i] = next[i] || { id: `m${i+1}`, name: `Milestone ${i+1}`, amount: "0" }
                                    next[i].amount = e.target.value
                                    return next
                                  })}
                                />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                    </AccordionContent>
                  </AccordionItem>

                  {/* Contract Terms */}
                  <AccordionItem value="contract" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        <span className="font-medium">Contract Terms</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                    <div>
                        <Label className="text-xs">Project Name</Label>
                      <Input
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g., Website Redesign Project"
                          className="mt-1"
                      />
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                          <Label className="text-xs">Revisions</Label>
                          <Input 
                            type="number" 
                            value={revisionCount} 
                            onChange={(e) => setRevisionCount(e.target.value)}
                            className="mt-1"
                          />
                    </div>
                    <div>
                          <Label className="text-xs">Hourly Rate</Label>
                          <Input 
                            type="number" 
                            value={hourlyRate} 
                            onChange={(e) => setHourlyRate(e.target.value)}
                            className="mt-1"
                            disabled={!includeHourlyClause}
                          />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Include Hourly Clause</Label>
                      <Switch checked={includeHourlyClause} onCheckedChange={setIncludeHourlyClause} />
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                           <Label className="text-xs">Late Fee %</Label>
                           <Input 
                             type="number" 
                             value={lateFee} 
                             onChange={(e) => setLateFee(e.target.value)}
                             className="mt-1"
                             disabled={!includeLateFee}
                           />
                    </div>
                    <div>
                           <Label className="text-xs">Late Days</Label>
                           <Input 
                             type="number" 
                             value={lateDays} 
                             onChange={(e) => setLateDays(e.target.value)}
                             className="mt-1"
                             disabled={!includeLateFee}
                           />
                      </div>
                    </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Include Late Fee Clause</Label>
                        <Switch checked={includeLateFee} onCheckedChange={setIncludeLateFee} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Estimated Completion</Label>
                        <Input
                          type="date"
                          value={estimatedCompletionDate}
                          onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                <div>
                        <Label className="text-xs">Your Name (for signature)</Label>
                        <Input 
                          value={yourName} 
                          onChange={(e) => setYourName(e.target.value)}
                          className="mt-1"
                        />
                  </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Service Add-ons */}
                  <AccordionItem value="addons" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        <span className="font-medium">Service Add-ons</span>
                </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">Service Add-ons</p>
                          <p className="text-xs text-gray-500">Add optional services that clients can include.</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            loadSavedServices()
                            setServiceModalOpen(true)
                          }}
                          className="text-xs"
                        >
                          <Package className="mr-2 h-3 w-3" />
                          Import
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {addons.map((addon, idx) => (
                          <div key={addon.id} className="border border-gray-200 rounded-lg p-3 bg-white space-y-2">
                            <div className="flex items-start gap-2">
                              <Checkbox 
                                checked={addon.selected}
                                onCheckedChange={(checked) => {
                                  const updated = [...addons]
                                  updated[idx].selected = !!checked
                                  setAddons(updated)
                                }}
                                className="mt-1"
                              />
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Input 
                                    placeholder="Add-on name" 
                                    value={addon.name}
                                    onChange={(e) => {
                                      const updated = [...addons]
                                      updated[idx].name = e.target.value
                                      setAddons(updated)
                                    }}
                                    className="text-sm flex-1"
                                  />
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                    <Input 
                                      type="number" 
                                      placeholder="0.00" 
                                      value={addon.price}
                                      onChange={(e) => {
                                        const updated = [...addons]
                                        updated[idx].price = e.target.value
                                        setAddons(updated)
                                      }}
                                      className="text-sm w-28 pl-7"
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setAddons(addons.filter((_, i) => i !== idx))
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Textarea
                                  placeholder="Description (optional)"
                                  value={addon.description || ""}
                                  onChange={(e) => {
                                    const updated = [...addons]
                                    updated[idx].description = e.target.value
                                    setAddons(updated)
                                  }}
                                  className="text-sm min-h-[60px] resize-none"
                                  rows={2}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed"
                        onClick={() => setAddons([...addons, { 
                          id: Date.now().toString(), 
                          name: "", 
                          description: "",
                          price: "",
                          selected: false
                        }])}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Service Add-on
                      </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Service Import Modal */}
        <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Saved Services</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search services..."
                className="pl-10"
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
              />
            </div>
            <div className="max-h-96 overflow-auto border rounded-lg">
              {servicesLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#3C3CFF] mb-2" />
                  <p className="text-sm text-gray-600">Loading services...</p>
                </div>
              ) : savedServices.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No saved services found</p>
                  <p className="text-xs text-gray-400 mt-1">Create services in the Billing section first</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Rate</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedServices
                      .filter(service => {
                        const searchLower = serviceSearch.toLowerCase()
                        return (
                          service.name?.toLowerCase().includes(searchLower) ||
                          service.description?.toLowerCase().includes(searchLower)
                        )
                      })
                      .map((service) => (
                        <tr key={service.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{service.name}</td>
                          <td className="px-4 py-3 text-gray-600 text-xs">{service.description || '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-900">
                            ${service.rate?.toLocaleString() || '0'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => importService(service)}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Add
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>
      )}
    </>
  )
}
