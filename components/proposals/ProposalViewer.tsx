"use client"

import React, { useState, useCallback, useEffect, useMemo } from "react"
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
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { DashboardLayout } from "@/components/dashboard/layout"
import { createProposal, updateProposal, getProposalById, getProposalByIdPublic, submitClientSignature, type ProposalBuilderData } from "@/lib/proposals"
import { getClients } from "@/lib/clients"
import { getLeads } from "@/lib/leads"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { createClient } from '@/lib/supabase/client'
import { JolixFooter } from "@/components/JolixFooter"

type DocumentStatus = "Draft" | "Sent" | "Viewed" | "Accepted"

interface ProposalViewerProps {
  proposalId: string
  enableSignature?: boolean // Enable client signature functionality for live proposals
}

export default function ProposalViewer({ proposalId: initialProposalId, enableSignature = false }: ProposalViewerProps) {
  // Debug log to verify enableSignature prop
  React.useEffect(() => {
    console.log('ProposalViewer mounted/updated', { 
      proposalId: initialProposalId, 
      enableSignature,
      initialProposalId 
    })
  }, [initialProposalId, enableSignature])
  
  // Remove router and searchParams - we get proposalId as a prop
  const [proposalId, setProposalId] = useState<string | null>(initialProposalId || null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
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

  // Proposal blocks for rendering custom sections
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

  // Load existing proposal
  const loadProposal = useCallback(async (id: string, preserveSignatureDate?: string) => {
    try {
      setIsLoading(true) // Start loading
      // Use public function for live proposals (enableSignature), authenticated for builder
      const proposal = enableSignature 
        ? await getProposalByIdPublic(id)
        : await getProposalById(id)
      
      if (!proposal || !proposal.proposal_data) return

      const data = proposal.proposal_data
      
      // Load client info - prioritize proposal_data.client, then use recipient from proposal
      // The recipient object is always available from getProposalById/getProposalByIdPublic
      const clientNameFromData = data.client?.name || proposal.recipient?.name || ''
      const clientCompanyFromData = data.client?.company || proposal.recipient?.company || ''
      const clientEmailFromData = data.client?.email || proposal.recipient?.email || ''
      
      // Debug logging
      if (enableSignature) {
        console.log('Loading proposal for live view:', {
          proposalId: id,
          recipientName: proposal.recipient?.name,
          clientNameFromData: clientNameFromData,
          dataClientName: data.client?.name
        })
      }
      
      setClientName(clientNameFromData)
      setClientCompany(clientCompanyFromData)
      setClientEmail(clientEmailFromData)
      setClientAddress(data.client?.address || '')
      
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
        
        // Load blocks if available
        if (data.content.blocks && Array.isArray(data.content.blocks)) {
          // Sort blocks by order to ensure correct sequence
          const sortedBlocks = [...data.content.blocks].sort((a, b) => a.order - b.order)
          setProposalBlocks(sortedBlocks)
        } else {
          // Create blocks from legacy fields
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
        // If preserveSignatureDate is provided, use it (for immediate updates after signing)
        const signatureDate = preserveSignatureDate 
          ? preserveSignatureDate
          : (proposal.client_signed_at 
              ? proposal.client_signed_at.toISOString()
              : (data.contract.clientSignatureDate || data.contract.clientSignedAt || ''))
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
    } finally {
      setIsLoading(false) // Stop loading
    }
  }, [])

  // Load user's name and company info from database
  useEffect(() => {
    const loadUserAndCompanyInfo = async () => {
      try {
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
      }
    }
    
    loadUserAndCompanyInfo()
  }, [])

  // Load proposal data on mount
  useEffect(() => {
    if (proposalId) {
      loadProposal(proposalId)
    } else {
      setIsLoading(false) // No proposal to load
    }
  }, [proposalId, loadProposal])

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
  const [signatureConsent, setSignatureConsent] = useState(false)
  const [isSubmittingSignature, setIsSubmittingSignature] = useState(false)
  
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

  // Handle client signature submission
  const handleSignatureSubmit = async () => {
    console.log('handleSignatureSubmit called', {
      proposalId,
      clientSignatureName,
      signatureConsent,
      enableSignature,
      contractEnabled,
      status
    })
    
    if (!proposalId) {
      console.error('No proposalId found')
      toast.error('Proposal ID not found')
      return
    }

    // If contract is enabled, require signature fields
    if (contractEnabled) {
      if (!clientSignatureName || !clientSignatureName.trim()) {
        console.error('No client signature name')
        toast.error('Please enter your full name')
        return
      }

      if (!signatureConsent) {
        console.error('Signature consent not checked')
        toast.error('Please agree to the electronic signature terms')
        return
      }
    }

    try {
      setIsSubmittingSignature(true)
      console.log('Submitting signature...')
      
      // If contract is disabled, accept without signature
      if (!contractEnabled) {
        // Update proposal status to Accepted without signature
        const supabase = createClient()
        const { error: updateError } = await supabase
          .from('proposals')
          .update({
            status: 'Accepted',
            accepted_at: new Date().toISOString()
          })
          .eq('id', proposalId)
        
        if (updateError) {
          throw new Error('Failed to accept proposal')
        }
        
        console.log('Proposal accepted (no contract)')
        toast.success('Proposal accepted!')
        setStatus('Accepted')
        
        // Reload the proposal data
        if (proposalId) {
          setTimeout(async () => {
            await loadProposal(proposalId)
          }, 500)
        }
        return
      }
      
      // Contract is enabled, require signature
      const signatureDate = new Date().toISOString()
      
      await submitClientSignature(proposalId, {
        clientSignatureName: clientSignatureName.trim(),
        clientSignatureDate: signatureDate
      })

      console.log('Signature submitted successfully')
      toast.success('Proposal accepted! Thank you for your signature.')
      
      // Update local state immediately so the date shows right away
      setClientSignatureDate(signatureDate)
      setStatus('Accepted')
      
      // Reload the proposal data to show the accepted status and signature
      // Pass the signature date to preserve it during reload
      if (proposalId) {
        // Add a small delay to ensure database has updated, but preserve the date
        setTimeout(async () => {
          await loadProposal(proposalId, signatureDate)
        }, 500)
      }
      
    } catch (error) {
      console.error('Error submitting signature:', error)
      toast.error('Failed to submit signature. Please try again.')
    } finally {
      setIsSubmittingSignature(false)
    }
  }

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
      
      // Try to match from existing clients/leads using clientName or email
      if (clientEmail || clientName) {
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

  // Editable field component (read-only for preview)
  const EditableField = ({ 
    value,
    onChange,
    multiline = false,
    className = "",
    placeholder = "",
    fieldKey = "",
  }: any) => {
    // In preview mode, just display the value (empty if no value)
    return (
      <div className={`${multiline ? "whitespace-pre-wrap" : ""} ${className}`}>
        {value || ""}
      </div>
    )
  }

        return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
      `}</style>

      {isLoading ? (
        <div className="h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#3C3CFF] mb-4" />
            <p className="text-gray-600">Loading proposal...</p>
          </div>
        </div>
      ) : (
      <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-6xl mx-auto p-12">
                {/* Tabs rendered inside the document */}

                {/* PROPOSAL PREVIEW */}
                {activeDoc === "proposal" && proposalEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden" style={{ fontFamily: 'Georgia, serif' }} data-help="proposal-preview">
                    <DocumentTabs />
                    {/* Document Header with Logo */}
                    <div className="px-16 pt-16 pb-8">
                      <div className="flex justify-between items-start mb-12">
                        {/* Logo */}
                        {showLogo && logoUrl && (
                          <div className="w-20 h-20 rounded-lg flex items-center justify-center">
                            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                          </div>
                        )}
                        
                        {/* Company details */}
                        <div className={`text-right text-sm ${showLogo && logoUrl ? '' : 'ml-auto'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
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
                      {/* Render blocks dynamically in saved order */}
                      {proposalBlocks.sort((a, b) => a.order - b.order).map((block) => (
                        <div key={block.id}>
                          <div className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200">
                            {block.label}
                          </div>
                          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {block.content}
                          </div>
                        </div>
                      ))}

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
                              <tr key={item.id} className="border-b border-gray-100">
                                <td className="py-4">
                                  <div className="text-gray-900">{item.name}</div>
                        </td>
                                <td className="py-4">
                                  <div className="text-gray-600 text-xs">{item.description}</div>
                                </td>
                                <td className="py-4 text-right">
                                  <div className="font-medium text-gray-900">${parseFloat(item.price || "0").toLocaleString()}</div>
                        </td>
                                <td className="py-4"></td>
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
                        <div className="flex flex-col items-center gap-2">
                          {isLastDoc ? (
                            enableSignature ? (
                              <>
                                <Button 
                                  type="button"
                                  className="px-10" 
                                  style={{ backgroundColor: brandColor }}
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    console.log('Button clicked (proposal section)', { 
                                      clientSignatureName, 
                                      signatureConsent, 
                                      proposalId,
                                      isSubmittingSignature,
                                      trimmedName: clientSignatureName?.trim(),
                                      enableSignature,
                                      status
                                    })
                                    if (status === 'Accepted') {
                                      toast.info('This proposal has already been accepted')
                                      return
                                    }
                                    // Only require signature if contract is enabled
                                    if (contractEnabled) {
                                      if (!clientSignatureName?.trim()) {
                                        toast.error('Please enter your full name in the signature field above')
                                        return
                                      }
                                      if (!signatureConsent) {
                                        toast.error('Please check the consent box to agree to the electronic signature terms')
                                        return
                                      }
                                    }
                                    handleSignatureSubmit()
                                  }}
                                  disabled={isSubmittingSignature || status === 'Accepted'}
                                >
                                  {isSubmittingSignature ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      Submitting...
                                    </>
                                  ) : status === 'Accepted' ? (
                                    'Proposal Accepted ✓'
                                  ) : (
                                    'Accept Proposal'
                                  )}
                                </Button>
                                {status !== 'Accepted' && contractEnabled && (!clientSignatureName?.trim() || !signatureConsent) && (
                                  <p className="text-xs text-red-600 text-center">
                                    {!clientSignatureName?.trim() && 'Please enter your name above'}
                                    {!clientSignatureName?.trim() && !signatureConsent && ' and '}
                                    {!signatureConsent && 'Please check the consent box'}
                                  </p>
                                )}
                              </>
                            ) : (
                              <Button 
                                className="px-10" 
                                style={{ backgroundColor: brandColor }}
                                disabled={status === 'Accepted'}
                              >
                                {status === 'Accepted' ? 'Proposal Accepted ✓' : 'Accept Proposal'}
                              </Button>
                            )
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
                {activeDoc === "contract" && contractEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16 space-y-8 flex flex-col" style={{ fontFamily: 'Georgia, serif' }} data-help="contract-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                      {showLogo && logoUrl && (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className={`text-right text-sm ${showLogo && logoUrl ? '' : 'ml-auto'}`} style={{ fontFamily: 'Inter, sans-serif' }}>
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
                                {enableSignature && status !== 'Accepted' ? (
                                  <Input 
                                    value={clientSignatureName}
                                    onChange={(e) => {
                                      setClientSignatureName(e.target.value)
                                      // Auto-populate date when user starts typing
                                      if (e.target.value.trim() && !clientSignatureDate) {
                                        setClientSignatureDate(new Date().toISOString())
                                      }
                                    }}
                                    placeholder="Enter your full name"
                                    className="text-sm"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-900">{clientSignatureName || '—'}</div>
                                )}
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Date:</div>
                                <div className="text-sm text-gray-900">
                                  {clientSignatureDate 
                                    ? new Date(clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                                    : '—'}
                                </div>
                    </div>
                    
                    <div>
                                <div className="text-xs text-gray-600 mb-2">Signature:</div>
                                {enableSignature && status !== 'Accepted' ? (
                                  <Input
                                    value={clientSignatureName}
                                    onChange={(e) => {
                                      setClientSignatureName(e.target.value)
                                      // Auto-populate date when user starts typing
                                      if (e.target.value.trim() && !clientSignatureDate) {
                                        setClientSignatureDate(new Date().toISOString())
                                      }
                                    }}
                                    placeholder="Sign here"
                                    className="border-b-2 border-gray-400 border-t-0 border-l-0 border-r-0 rounded-none pb-1 min-h-[48px] bg-transparent focus-visible:ring-0 focus-visible:border-blue-500 focus-visible:border-b-2 px-0 h-auto"
                                    style={{ 
                                      fontFamily: "'Dancing Script', cursive",
                                      fontSize: '2rem',
                                      lineHeight: '1.2',
                                      color: clientSignatureName ? '#111827' : '#9CA3AF',
                                      fontStyle: clientSignatureName ? 'normal' : 'italic',
                                      paddingBottom: '0.25rem'
                                    }}
                                  />
                                ) : (
                                  <div className="border-b-2 border-gray-400 pb-1 min-h-[48px] flex items-end">
                                    <div 
                                      className={`text-3xl md:text-4xl ${clientSignatureName ? 'text-gray-900' : 'text-gray-400 italic'}`} 
                                      style={{ fontFamily: "'Dancing Script', cursive" }}
                                    >
                                      {clientSignatureName || '(Client will sign here)'}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {enableSignature && status !== 'Accepted' && (
                                <div className="flex items-start gap-2 pt-2">
                                  <Checkbox 
                                    id="sig-consent" 
                                    className="mt-1" 
                                    checked={signatureConsent}
                                    onCheckedChange={(checked) => setSignatureConsent(checked as boolean)}
                                  />
                                  <Label htmlFor="sig-consent" className="text-xs font-normal text-gray-600 leading-relaxed cursor-pointer">
                                    I agree that typing my name above constitutes a legal electronic signature
                                  </Label>
                                </div>
                              )}
                              {!enableSignature && (
                                <div className="flex items-start gap-2 pt-2">
                                  <Checkbox id="sig-consent" className="mt-1" disabled />
                                  <Label htmlFor="sig-consent" className="text-xs font-normal text-gray-600 leading-relaxed">
                                    I agree that typing my name above constitutes a legal electronic signature
                                  </Label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Footer Navigation - bottom of page */}
                    <div className="pt-8 border-t mt-16" style={{ borderColor: accentColor }}>
                      <div className="flex flex-col items-center gap-2">
                        {isLastDoc ? (
                          enableSignature ? (
                            <>
                              <Button 
                                type="button"
                                className="px-10" 
                                style={{ backgroundColor: brandColor }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('Button clicked (contract section)', { 
                                    clientSignatureName, 
                                    signatureConsent, 
                                    proposalId,
                                    isSubmittingSignature,
                                    trimmedName: clientSignatureName?.trim(),
                                    enableSignature,
                                    status
                                  })
                                  if (status === 'Accepted') {
                                    toast.info('This proposal has already been accepted')
                                    return
                                  }
                                  if (!clientSignatureName?.trim()) {
                                    toast.error('Please enter your full name in the signature field above')
                                    return
                                  }
                                  if (!signatureConsent) {
                                    toast.error('Please check the consent box to agree to the electronic signature terms')
                                    return
                                  }
                                  handleSignatureSubmit()
                                }}
                                disabled={isSubmittingSignature || status === 'Accepted'}
                              >
                                {isSubmittingSignature ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : status === 'Accepted' ? (
                                  'Proposal Accepted ✓'
                                ) : (
                                  'Accept Proposal'
                                )}
                              </Button>
                              {status !== 'Accepted' && (!clientSignatureName?.trim() || !signatureConsent) && (
                                <p className="text-xs text-red-600 text-center">
                                  {!clientSignatureName?.trim() && 'Please enter your name above'}
                                  {!clientSignatureName?.trim() && !signatureConsent && ' and '}
                                  {!signatureConsent && 'Please check the consent box'}
                                </p>
                              )}
                            </>
                          ) : (
                            <Button 
                              className="px-10" 
                              style={{ backgroundColor: brandColor }}
                              disabled={status === 'Accepted'}
                            >
                              {status === 'Accepted' ? 'Proposal Accepted ✓' : 'Accept Proposal'}
                            </Button>
                          )
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
                {activeDoc === "invoice" && invoiceEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16" style={{ fontFamily: 'Inter, sans-serif' }} data-help="invoice-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                      {showLogo && logoUrl && (
                        <div className="w-20 h-20 rounded-lg flex items-center justify-center">
                          <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                      <div className={`text-right ${showLogo && logoUrl ? '' : 'ml-auto'}`}>
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
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-4">
                              <div className="font-medium text-gray-900 mb-1">{item.name}</div>
                              <div className="text-xs text-gray-600">{item.description}</div>
                            </td>
                            <td className="py-4 text-center text-gray-700">1</td>
                            <td className="py-4 text-right">
                              <div className="font-medium text-gray-900">${parseFloat(item.price || "0").toLocaleString()}</div>
                            </td>
                            <td className="py-4"></td>
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
                      <div className="flex flex-col items-center gap-2">
                        {isLastDoc ? (
                          enableSignature ? (
                            <>
                              <Button 
                                type="button"
                                className="px-10" 
                                style={{ backgroundColor: brandColor }}
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  console.log('Button clicked (invoice section)', { 
                                    clientSignatureName, 
                                    signatureConsent, 
                                    proposalId,
                                    isSubmittingSignature,
                                    trimmedName: clientSignatureName?.trim(),
                                    enableSignature,
                                    status
                                  })
                                  if (status === 'Accepted') {
                                    toast.info('This proposal has already been accepted')
                                    return
                                  }
                                  if (!clientSignatureName?.trim()) {
                                    toast.error('Please enter your full name in the signature field above')
                                    return
                                  }
                                  if (!signatureConsent) {
                                    toast.error('Please check the consent box to agree to the electronic signature terms')
                                    return
                                  }
                                  handleSignatureSubmit()
                                }}
                                disabled={isSubmittingSignature || status === 'Accepted'}
                              >
                                {isSubmittingSignature ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Submitting...
                                  </>
                                ) : status === 'Accepted' ? (
                                  'Proposal Accepted ✓'
                                ) : (
                                  'Accept Proposal'
                                )}
                              </Button>
                              {status !== 'Accepted' && (!clientSignatureName?.trim() || !signatureConsent) && (
                                <p className="text-xs text-red-600 text-center">
                                  {!clientSignatureName?.trim() && 'Please enter your name above'}
                                  {!clientSignatureName?.trim() && !signatureConsent && ' and '}
                                  {!signatureConsent && 'Please check the consent box'}
                                </p>
                              )}
                            </>
                          ) : (
                            <Button 
                              className="px-10" 
                              style={{ backgroundColor: brandColor }}
                              disabled={status === 'Accepted'}
                            >
                              {status === 'Accepted' ? 'Proposal Accepted ✓' : 'Accept Proposal'}
                            </Button>
                          )
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

