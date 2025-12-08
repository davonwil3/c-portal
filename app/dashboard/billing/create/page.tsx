"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DashboardLayout } from "@/components/dashboard/layout"
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Upload, 
  X, 
  Plus,
  Trash2,
  Loader2,
  Package,
  Eye,
  Download,
  Copy
} from "lucide-react"
import { toast } from "sonner"
import { createInvoice, getInvoice, updateInvoice } from "@/lib/invoices"
import { getClients, type Client } from "@/lib/clients"
import { getProjects, type Project } from "@/lib/projects"
import { getCurrentAccount } from "@/lib/auth"
import Image from "next/image"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import { InvoicePreviewModal } from "@/components/invoices/invoice-preview-modal"

interface LineItem {
  id: string
  name: string
  description: string
  item_type: 'service' | 'product' | 'expense' | 'time'
  quantity: number
  unit_rate: number
  total_amount: number
  is_taxable: boolean
  sort_order: number
}

interface Service {
  id: string
  name: string
  description: string
  rate: number
  rate_type: 'hourly' | 'fixed' | 'monthly' | 'yearly'
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [planTier, setPlanTier] = useState<'free' | 'pro' | 'premium'>('free')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successShareLink, setSuccessShareLink] = useState<string>("")
  const [account, setAccount] = useState<any>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  
  // Invoice fields
  const [logoUrl, setLogoUrl] = useState<string>("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [companyName, setCompanyName] = useState("Your Company Name")
  const [companyAddress, setCompanyAddress] = useState("")
  const [companyPhone, setCompanyPhone] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`)
  const [title, setTitle] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [poNumber, setPoNumber] = useState("")
  
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      name: "",
      description: "",
      item_type: 'service',
      quantity: 1,
      unit_rate: 0,
      total_amount: 0,
      is_taxable: true,
      sort_order: 1,
    },
  ])
  
  const [taxRate, setTaxRate] = useState<number | "">("")
  const [discountAmount, setDiscountAmount] = useState<number | "">("")
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [notes, setNotes] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("net-30")
  
  // Additional invoice options
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringIntervalValue, setRecurringIntervalValue] = useState<number | "">(1)
  const [recurringIntervalType, setRecurringIntervalType] = useState<'weekly' | 'monthly'>('monthly')
  const [recurringAutoSend, setRecurringAutoSend] = useState<'draft' | 'auto-send'>('draft')
  const [showBilledByHour, setShowBilledByHour] = useState(false)
  const [totalHours, setTotalHours] = useState(0)
  
  // Service selector modal
  const [serviceModalOpen, setServiceModalOpen] = useState(false)

  // Load data
  useEffect(() => {
    loadData()
  }, [])


  // Check if editing
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditing(true)
      setEditingInvoiceId(editId)
      loadExistingInvoice(editId)
    }
  }, [searchParams])

  // Set default due date
  useEffect(() => {
    if (!dueDate) {
      const invoiceDateObj = new Date(invoiceDate)
      const defaultDueDate = new Date(invoiceDateObj)
      defaultDueDate.setDate(defaultDueDate.getDate() + 30)
      setDueDate(defaultDueDate.toISOString().split("T")[0])
    }
  }, [invoiceDate])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientsData, projectsData, accountData] = await Promise.all([
        getClients(),
        getProjects(),
        getCurrentAccount()
      ])
      setClients(clientsData)
      setProjects(projectsData)
      setAccount(accountData)
      
      // Load company info from account
      if (accountData) {
        if (accountData.company_name) {
          setCompanyName(accountData.company_name)
        }
        if (accountData.address) {
          setCompanyAddress(accountData.address)
        }
        if (accountData.phone) {
          setCompanyPhone(accountData.phone)
        }
        if (accountData.email) {
          setCompanyEmail(accountData.email)
        }
        if (accountData.logo_url) {
          setLogoUrl(accountData.logo_url)
        }
        // Set plan tier
        if (accountData.plan_tier) {
          setPlanTier(accountData.plan_tier)
        }
      } else {
        // Default to free if no account data
        setPlanTier('free')
      }
      
      // Fetch services from API
      try {
        const servicesResponse = await fetch('/api/services')
        const servicesResult = await servicesResponse.json()
        if (servicesResult.success) {
          setServices(servicesResult.data || [])
        }
      } catch (error) {
        console.error('Error loading services:', error)
        setServices([])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadExistingInvoice = async (invoiceId: string) => {
    try {
      setLoading(true)
      const invoice = await getInvoice(invoiceId)
      if (invoice) {
        setTitle(invoice.title || "")
        setInvoiceNumber(invoice.invoice_number || `INV-${Date.now().toString().slice(-6)}`)
        setSelectedClient(invoice.client_id || "")
        setSelectedProject(invoice.project_id || "")
        setInvoiceDate(new Date(invoice.issue_date).toISOString().split("T")[0])
        setDueDate(invoice.due_date ? new Date(invoice.due_date).toISOString().split("T")[0] : "")
        setLineItems(invoice.line_items ? invoice.line_items.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || "",
          item_type: item.item_type,
          quantity: item.quantity,
          unit_rate: item.unit_rate,
          total_amount: item.total_amount,
          is_taxable: item.is_taxable,
          sort_order: item.sort_order
        })) : [{
          id: "1",
          name: "",
          description: "",
          item_type: 'service',
          quantity: 1,
          unit_rate: 0,
          total_amount: 0,
          is_taxable: true,
          sort_order: 1,
        }])
        setTaxRate(invoice.tax_rate || "")
        setDiscountAmount(invoice.discount_amount || "")
        setDiscountType(invoice.discount_type || "percentage")
        setNotes(invoice.notes || "")
        setPoNumber(invoice.po_number || "")
        setPaymentTerms(invoice.payment_terms || "net-30")
        setIsRecurring(invoice.is_recurring || false)
        // Parse recurring schedule if it exists (format: "monthly-1" or "weekly-2")
        if (invoice.recurring_schedule) {
          const parts = invoice.recurring_schedule.split('-')
          if (parts.length === 2) {
            setRecurringIntervalType(parts[0] as 'weekly' | 'monthly')
            setRecurringIntervalValue(parseInt(parts[1]) || 1)
          }
        }
        if (invoice.metadata?.show_billed_by_hour) {
          setShowBilledByHour(true)
          setTotalHours(invoice.metadata?.total_hours || 0)
        }

        // Load share link if invoice exists and is not draft
        if (invoice.id && invoice.status !== 'draft') {
          try {
            const shareResponse = await fetch(`/api/invoices/${invoice.id}/share-token`, {
              method: 'POST',
            })
            if (shareResponse.ok) {
              const shareData = await shareResponse.json()
              setShareLink(shareData.share_url)
            }
          } catch (error) {
            console.error('Error loading share link:', error)
          }
        }
      }
    } catch (error) {
      console.error('Error loading existing invoice:', error)
      toast.error('Failed to load existing invoice')
    } finally {
      setLoading(false)
    }
  }


  const handleCopySuccessLink = async () => {
    if (!successShareLink) return

    try {
      await navigator.clipboard.writeText(successShareLink)
      toast.success('Share link copied to clipboard!')
    } catch (error) {
      console.error('Error copying link:', error)
      toast.error('Failed to copy link')
    }
  }

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false)
    setSuccessShareLink("")
    router.push("/dashboard/billing")
  }

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB')
        return
      }
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setLogoUrl("")
    setLogoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total_amount, 0)
  const taxRateNum = typeof taxRate === 'number' ? taxRate : 0
  const discountAmountNum = typeof discountAmount === 'number' ? discountAmount : 0
  const taxAmount = (subtotal * taxRateNum) / 100
  const discountValue = discountType === "percentage" ? (subtotal * discountAmountNum) / 100 : discountAmountNum
  const totalDue = subtotal + taxAmount - discountValue

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: "",
      description: "",
      item_type: 'service',
      quantity: 1,
      unit_rate: 0,
      total_amount: 0,
      is_taxable: true,
      sort_order: lineItems.length + 1,
    }
    setLineItems([...lineItems, newItem])
  }
  
  // Helper to handle number input changes
  const handleNumberChange = (value: string, setter: (val: number | "") => void) => {
    if (value === "" || value === null || value === undefined) {
      setter("")
    } else {
      const num = parseFloat(value)
      setter(isNaN(num) ? "" : num)
    }
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    } else {
      toast.error("You must have at least one line item")
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number | boolean) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "unit_rate") {
            updatedItem.total_amount = updatedItem.quantity * updatedItem.unit_rate
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const addServiceToInvoice = (service: Service) => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      name: service.name,
      description: service.description,
      item_type: 'service',
      quantity: 1,
      unit_rate: service.rate,
      total_amount: service.rate,
      is_taxable: true,
      sort_order: lineItems.length + 1,
    }
    setLineItems([...lineItems, newItem])
    setServiceModalOpen(false)
    toast.success(`Added ${service.name} to invoice`)
  }

  // Helper function to create recurring invoice in the background
  const createRecurringInvoiceInBackground = async (savedInvoice: any) => {
    try {
      const intervalValue = typeof recurringIntervalValue === 'number' ? recurringIntervalValue : 1
      // Use due date or invoice date as start date
      const startDate = dueDate || invoiceDate
      const autoSend = recurringAutoSend === 'auto-send'

      const mappedLineItems = lineItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        item_type: item.item_type,
        quantity: Number(item.quantity) || 0,
        unit_rate: Number(item.unit_rate) || 0,
        total_amount: Number(item.total_amount) || 0,
        is_taxable: Boolean(item.is_taxable),
        sort_order: Number(item.sort_order) || 0
      }))

      // Calculate financial totals
      const calculatedSubtotal = mappedLineItems.reduce((sum, item) => sum + item.total_amount, 0)
      const taxRateNum = typeof taxRate === 'number' ? taxRate : parseFloat(taxRate as string) || 0
      const discountAmountNum = typeof discountAmount === 'number' ? discountAmount : parseFloat(discountAmount as string) || 0
      const calculatedTaxAmount = (calculatedSubtotal * taxRateNum) / 100
      const calculatedDiscountValue = discountType === "percentage" ? (calculatedSubtotal * discountAmountNum) / 100 : discountAmountNum
      const calculatedTotal = calculatedSubtotal + calculatedTaxAmount - calculatedDiscountValue

      const response = await fetch('/api/recurring-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: title || `Recurring: ${savedInvoice.invoice_number}`,
          client_id: selectedClient || undefined,
          project_id: selectedProject || undefined,
          title: title,
          description: notes,
          notes: notes,
          po_number: poNumber || undefined,
          line_items: mappedLineItems,
          subtotal: calculatedSubtotal,
          tax_rate: taxRateNum,
          tax_amount: calculatedTaxAmount,
          discount_type: discountType,
          discount_amount: discountAmountNum,
          discount_value: calculatedDiscountValue,
          total_amount: calculatedTotal,
          currency: 'USD',
          payment_terms: paymentTerms,
          allow_online_payment: true,
          interval_type: recurringIntervalType,
          interval_value: intervalValue,
          start_date: new Date(startDate).toISOString(),
          auto_send: autoSend,
          days_until_due: dueDate ? Math.ceil((new Date(dueDate).getTime() - new Date(invoiceDate).getTime()) / (1000 * 60 * 60 * 24)) : 30,
          metadata: {
            source: 'invoice_creator',
            created_from: 'create_page',
            base_invoice_id: savedInvoice.id,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create recurring invoice template')
      }

      const recurringInvoice = await response.json()
      console.log('Recurring invoice template created:', recurringInvoice)
      toast.success('Saved recurring invoice')
    } catch (error: any) {
      console.error('Error creating recurring invoice template:', error)
      toast.error(`Failed to create recurring template: ${error.message || 'Unknown error'}`)
    }
  }

  const handleSaveDraft = async () => {
    if (!selectedClient) {
      toast.error('Please select a client')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter an invoice title')
      return
    }

    try {
      setIsSaving(true)
      
      const mappedLineItems = lineItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        item_type: item.item_type,
        quantity: Number(item.quantity) || 0,
        unit_rate: Number(item.unit_rate) || 0,
        total_amount: Number(item.total_amount) || 0,
        is_taxable: Boolean(item.is_taxable),
        sort_order: Number(item.sort_order) || 0
      }))
      
      // Calculate financial totals
      const calculatedSubtotal = mappedLineItems.reduce((sum, item) => sum + item.total_amount, 0)
      const taxRateNum = typeof taxRate === 'number' ? taxRate : parseFloat(taxRate as string) || 0
      const discountAmountNum = typeof discountAmount === 'number' ? discountAmount : parseFloat(discountAmount as string) || 0
      const calculatedTaxAmount = (calculatedSubtotal * taxRateNum) / 100
      const calculatedDiscountValue = discountType === "percentage" ? (calculatedSubtotal * discountAmountNum) / 100 : discountAmountNum
      const calculatedTotal = calculatedSubtotal + calculatedTaxAmount - calculatedDiscountValue

      const invoiceData = {
        client_id: selectedClient,
        project_id: selectedProject ? selectedProject : undefined,
        invoice_number: invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : undefined, // Let trigger generate if empty
        invoice_type: 'standard' as const,
        title: title,
        description: notes,
        notes: notes,
        po_number: poNumber || undefined,
        line_items: mappedLineItems,
        status: 'draft' as const,
        is_recurring: isRecurring,
        recurring_schedule: isRecurring ? `${recurringIntervalType}-${typeof recurringIntervalValue === 'number' ? recurringIntervalValue : 1}` : undefined,
        issue_date: new Date(invoiceDate).toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        subtotal: calculatedSubtotal,
        tax_rate: taxRateNum,
        tax_amount: calculatedTaxAmount,
        discount_type: discountType,
        discount_amount: discountAmountNum,
        discount_value: calculatedDiscountValue,
        total_amount: calculatedTotal,
        currency: 'USD',
        payment_terms: paymentTerms,
        allow_online_payment: true,
        reminder_schedule: '3-days',
        auto_reminder: true,
        tags: ['invoice', 'draft'],
        metadata: {
          source: 'invoice_creator',
          created_from: 'create_page',
          show_billed_by_hour: showBilledByHour,
          total_hours: showBilledByHour ? totalHours : undefined,
          company_email: companyEmail || undefined,
          company_phone: companyPhone || undefined,
          company_name: companyName || undefined,
          company_address: companyAddress || undefined,
          logo_url: logoUrl || undefined
        }
      }

      let savedInvoice
      if (isEditing && editingInvoiceId) {
        savedInvoice = await updateInvoice(editingInvoiceId, invoiceData)
        toast.success('Invoice updated successfully')
      } else {
        savedInvoice = await createInvoice(invoiceData)
        toast.success('Invoice saved as draft successfully')
      }

      // Create recurring invoice template in the background (non-blocking)
      if (isRecurring && savedInvoice) {
        createRecurringInvoiceInBackground(savedInvoice)
      }

      router.push("/dashboard/billing")
    } catch (error: any) {
      console.error('Error saving invoice:', error)
      toast.error('Failed to save invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!selectedClient) {
      toast.error('Please select a client')
      return
    }

    if (!title.trim()) {
      toast.error('Please enter an invoice title')
      return
    }

    try {
      setIsSaving(true)
      
      const mappedLineItems = lineItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        item_type: item.item_type,
        quantity: Number(item.quantity) || 0,
        unit_rate: Number(item.unit_rate) || 0,
        total_amount: Number(item.total_amount) || 0,
        is_taxable: Boolean(item.is_taxable),
        sort_order: Number(item.sort_order) || 0
      }))
      
      // Calculate financial totals
      const calculatedSubtotal = mappedLineItems.reduce((sum, item) => sum + item.total_amount, 0)
      const taxRateNum = typeof taxRate === 'number' ? taxRate : parseFloat(taxRate as string) || 0
      const discountAmountNum = typeof discountAmount === 'number' ? discountAmount : parseFloat(discountAmount as string) || 0
      const calculatedTaxAmount = (calculatedSubtotal * taxRateNum) / 100
      const calculatedDiscountValue = discountType === "percentage" ? (calculatedSubtotal * discountAmountNum) / 100 : discountAmountNum
      const calculatedTotal = calculatedSubtotal + calculatedTaxAmount - calculatedDiscountValue

      const invoiceData = {
        client_id: selectedClient,
        project_id: selectedProject ? selectedProject : undefined,
        invoice_number: invoiceNumber && invoiceNumber.trim() ? invoiceNumber.trim() : undefined, // Let trigger generate if empty
        invoice_type: 'standard' as const,
        title: title,
        description: notes,
        notes: notes,
        po_number: poNumber || undefined,
        line_items: mappedLineItems,
        status: 'sent' as const,
        is_recurring: isRecurring,
        recurring_schedule: isRecurring ? `${recurringIntervalType}-${typeof recurringIntervalValue === 'number' ? recurringIntervalValue : 1}` : undefined,
        issue_date: new Date(invoiceDate).toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        sent_date: new Date().toISOString(),
        subtotal: calculatedSubtotal,
        tax_rate: taxRateNum,
        tax_amount: calculatedTaxAmount,
        discount_type: discountType,
        discount_amount: discountAmountNum,
        discount_value: calculatedDiscountValue,
        total_amount: calculatedTotal,
        currency: 'USD',
        payment_terms: paymentTerms,
        allow_online_payment: true,
        reminder_schedule: '3-days',
        auto_reminder: true,
        tags: ['invoice', 'sent'],
        metadata: {
          source: 'invoice_creator',
          created_from: 'create_page',
          show_billed_by_hour: showBilledByHour,
          total_hours: showBilledByHour ? totalHours : undefined,
          company_email: companyEmail || undefined,
          company_phone: companyPhone || undefined
        }
      }

      let savedInvoice
      if (isEditing && editingInvoiceId) {
        savedInvoice = await updateInvoice(editingInvoiceId, invoiceData)
        toast.success('Invoice updated and sent successfully')
      } else {
        savedInvoice = await createInvoice(invoiceData)
        toast.success('Invoice saved and sent successfully')
      }

      // Show modal immediately, then generate share link in background
      if (savedInvoice?.id) {
        // Show modal immediately with empty link (will update when ready)
        setSuccessShareLink("")
        setShowSuccessModal(true)
        
        // Generate share link in background (non-blocking)
        fetch(`/api/invoices/${savedInvoice.id}/share-token`, {
          method: 'POST',
        })
          .then(async (shareResponse) => {
            if (shareResponse.ok) {
              const shareData = await shareResponse.json()
              setSuccessShareLink(shareData.share_url)
            }
          })
          .catch((error) => {
            console.error('Error generating share link:', error)
          })
        
        // Create recurring invoice template in the background (non-blocking)
        if (isRecurring) {
          createRecurringInvoiceInBackground(savedInvoice)
        }
        
        // Don't redirect yet - show modal first
        return
      }

      // If no invoice ID, still try to create recurring invoice
      if (isRecurring && savedInvoice) {
        createRecurringInvoiceInBackground(savedInvoice)
      }

      router.push("/dashboard/billing")
    } catch (error: any) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedClientData = clients.find(c => c.id === selectedClient)

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true)
      
      // Get the preview element from ref
      const previewElement = previewRef.current
      if (!previewElement) {
        toast.error('Invoice preview not found')
        return
      }

      // Temporarily make it visible for html2canvas
      const originalVisibility = previewElement.style.visibility
      const originalPosition = previewElement.style.position
      const originalLeft = previewElement.style.left
      const originalOpacity = previewElement.style.opacity
      const originalPointerEvents = previewElement.style.pointerEvents
      
      previewElement.style.visibility = 'visible'
      previewElement.style.opacity = '1'
      previewElement.style.pointerEvents = 'auto'
      previewElement.style.position = 'absolute'
      previewElement.style.left = '0'
      previewElement.style.top = '0'
      previewElement.style.zIndex = '9999'

      // Wait for images to load and rendering to complete
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Ensure all images are loaded
      const images = previewElement.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve()
          return new Promise((resolve) => {
            img.onload = resolve
            img.onerror = resolve
            // Timeout after 2 seconds
            setTimeout(resolve, 2000)
          })
        })
      )

      // Convert to canvas with better settings
      const canvas = await html2canvas(previewElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: previewElement.scrollWidth,
        height: previewElement.scrollHeight,
        windowWidth: previewElement.scrollWidth,
        windowHeight: previewElement.scrollHeight,
      })

      // Restore original styles
      previewElement.style.visibility = originalVisibility
      previewElement.style.opacity = originalOpacity
      previewElement.style.pointerEvents = originalPointerEvents
      previewElement.style.position = originalPosition
      previewElement.style.left = originalLeft
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const pageHeight = 295
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      
      let position = 0
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
      
      // Download the PDF
      pdf.save(`invoice-${invoiceNumber || 'draft'}.pdf`)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingPDF(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 -m-6 p-6">
        {/* Header Actions */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/billing")}
            className="gap-2"
            data-help="btn-back-invoices"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="gap-2"
            >
              {downloadingPDF ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              className="gap-2"
              data-help="btn-save-draft"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={isSaving}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white gap-2"
              data-help="btn-send-invoice"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save and Send
            </Button>
          </div>
        </div>

        {/* Invoice Document */}
        <div id="invoice-document" className="max-w-[1000px] mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          {/* Invoice Paper */}
          <div className="p-12 space-y-12">
            {/* Header Section */}
            <div className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
              {/* Company Logo & Info */}
              <div className="space-y-4">
                {logoUrl ? (
                  <div className="relative group">
                    <Image 
                      src={logoUrl} 
                      alt="Company Logo" 
                      width={200}
                      height={80}
                      className="h-20 w-auto object-contain"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#3C3CFF] hover:bg-[#3C3CFF]/5 transition-colors"
                  >
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">Upload Logo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                
                <div className="space-y-1">
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="text-xl font-bold border-0 focus-visible:ring-0 p-0 h-auto"
                    placeholder="Your Company Name"
                  />
                  <Input
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="text-sm text-gray-600 border-0 focus-visible:ring-0 p-0 h-auto"
                    placeholder="Company Address"
                  />
                  <Input
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    className="text-sm text-gray-600 border-0 focus-visible:ring-0 p-0 h-auto"
                    placeholder="Phone Number"
                  />
                  <Input
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="text-sm text-gray-600 border-0 focus-visible:ring-0 p-0 h-auto"
                    placeholder="Email Address"
                  />
                </div>
              </div>

              {/* Invoice Title & Number */}
              <div className="text-right space-y-2">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                  {isRecurring && (
                    <p className="text-sm text-[#3C3CFF] font-medium mt-1">
                      Recurring {recurringIntervalType.charAt(0).toUpperCase() + recurringIntervalType.slice(1)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-gray-600">#</span>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="text-right font-mono text-sm border-0 focus-visible:ring-1 focus-visible:ring-[#3C3CFF] p-1 h-auto w-32"
                      placeholder="INV-000001"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details & Client Info */}
            <div className="grid grid-cols-2 gap-8">
              {/* Bill To */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bill To</h3>
                <div className="space-y-2">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="border-gray-300 focus:ring-[#3C3CFF]" data-help="invoice-client-selector">
                      <SelectValue placeholder="Select Client" />
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
                  
                  {selectedClientData && (
                    <div className="text-sm text-gray-700 space-y-1 pl-3 border-l-2 border-gray-200">
                      <p className="font-medium">{selectedClientData.company || `${selectedClientData.first_name} ${selectedClientData.last_name}`}</p>
                    </div>
                  )}
                  
                  {/* Project Selector - Always visible when client is selected */}
                  {selectedClient && (
                    <div className="pt-2">
                      <Label className="text-xs text-gray-500">Project (Optional)</Label>
                      <Select value={selectedProject || "none"} onValueChange={(value) => setSelectedProject(value === "none" ? "" : value)}>
                        <SelectTrigger className="mt-1 border-gray-300" data-help="invoice-project-selector">
                          <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Project</SelectItem>
                          {projects
                            .filter(p => p.client_id === selectedClient)
                            .map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {projects.filter(p => p.client_id === selectedClient).length === 0 && (
                        <p className="text-xs text-gray-400 mt-1">No projects found for this client</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-gray-500">Invoice Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Web Design Services - March 2024"
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-500">Invoice Date</Label>
                      <Input
                        type="date"
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Due Date</Label>
                      <Input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">PO Number (Optional)</Label>
                    <Input
                      value={poNumber}
                      onChange={(e) => setPoNumber(e.target.value)}
                      placeholder="PO-12345"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Payment Terms</Label>
                    <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="due-on-receipt">Due on Receipt</SelectItem>
                        <SelectItem value="net-15">Net 15</SelectItem>
                        <SelectItem value="net-30">Net 30</SelectItem>
                        <SelectItem value="net-60">Net 60</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Recurring Invoice Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Recurring Invoice</Label>
                        <p className="text-xs text-gray-500">Make this a recurring invoice</p>
                      </div>
                      <Switch
                        checked={isRecurring}
                        onCheckedChange={setIsRecurring}
                      />
                    </div>
                    
                    {isRecurring && (
                      <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                        {/* Repeat Every */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Repeat every</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={recurringIntervalValue === "" ? "" : recurringIntervalValue}
                              onChange={(e) => {
                                const val = e.target.value
                                setRecurringIntervalValue(val === "" ? "" : parseInt(val) || 1)
                              }}
                              className="w-20"
                            />
                            <Select 
                              value={recurringIntervalType} 
                              onValueChange={(value: 'weekly' | 'monthly') => setRecurringIntervalType(value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weekly">week{recurringIntervalValue !== 1 ? 's' : ''}</SelectItem>
                                <SelectItem value="monthly">month{recurringIntervalValue !== 1 ? 's' : ''}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Auto-send Options */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">When due</Label>
                          <RadioGroup
                            value={recurringAutoSend}
                            onValueChange={(value: 'draft' | 'auto-send') => setRecurringAutoSend(value)}
                          >
                            <div className="flex items-start space-x-2 space-y-0">
                              <RadioGroupItem value="draft" id="draft" className="mt-1" />
                              <div className="space-y-1">
                                <Label htmlFor="draft" className="text-sm font-medium cursor-pointer">
                                  Create as draft when due
                                </Label>
                                <p className="text-xs text-gray-500">
                                  We'll auto-create the invoice as a draft so you can review and send it.
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start space-x-2 space-y-0">
                              <RadioGroupItem value="auto-send" id="auto-send" className="mt-1" />
                              <div className="space-y-1">
                                <Label htmlFor="auto-send" className="text-sm font-medium cursor-pointer">
                                  Auto-send when due
                                </Label>
                                <p className="text-xs text-gray-500">
                                  We'll create and email the invoice automatically on each billing date.
                                </p>
                              </div>
                            </div>
                          </RadioGroup>
                        </div>

                        {/* Info Text */}
                        <p className="text-xs text-gray-500">
                          You can pause or stop this recurring invoice later from the invoice details.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Billed by Hour Option */}
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Show Hours Worked</Label>
                      <p className="text-xs text-gray-500">Display total hours on invoice</p>
                    </div>
                    <Switch
                      checked={showBilledByHour}
                      onCheckedChange={setShowBilledByHour}
                    />
                  </div>
                  
                  {showBilledByHour && (
                    <div>
                      <Label className="text-xs text-gray-500">Total Hours</Label>
                      <Input
                        type="number"
                        value={totalHours === 0 ? "" : totalHours}
                        onChange={(e) => {
                          const val = e.target.value
                          setTotalHours(val === "" ? 0 : parseFloat(val) || 0)
                        }}
                        placeholder="0.00"
                        className="mt-1"
                        min="0"
                        step="0.25"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Items</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setServiceModalOpen(true)}
                    className="gap-2"
                  >
                    <Package className="h-4 w-4" />
                    Add from Services
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[35%]">
                        Description
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[15%]">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">
                        Rate
                      </th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">
                        Amount
                      </th>
                      <th className="w-[10%]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100" data-help="invoice-line-items">
                    {lineItems.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Input
                            value={item.name}
                            onChange={(e) => updateLineItem(item.id, "name", e.target.value)}
                            placeholder="Item name"
                            className="mb-2 font-medium"
                          />
                          <Textarea
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                            placeholder="Description (optional)"
                            className="text-sm resize-none"
                            rows={2}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={item.quantity === 0 ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value
                              updateLineItem(item.id, "quantity", val === "" ? 0 : parseFloat(val) || 0)
                            }}
                            className="text-right"
                            min="0"
                            step="0.01"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <Input
                            type="number"
                            value={item.unit_rate === 0 ? "" : item.unit_rate}
                            onChange={(e) => {
                              const val = e.target.value
                              updateLineItem(item.id, "unit_rate", val === "" ? 0 : parseFloat(val) || 0)
                            }}
                            className="text-right font-mono"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">
                          {formatCurrency(item.total_amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex justify-between items-center text-gray-700">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">Tax</span>
                    <Input
                      type="number"
                      value={taxRate === "" ? "" : taxRate}
                      onChange={(e) => handleNumberChange(e.target.value, setTaxRate)}
                      className="w-20 h-8 text-sm"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="0"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                  <span className="font-mono font-semibold text-gray-700">{formatCurrency(taxAmount)}</span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700">Discount</span>
                    <Input
                      type="number"
                      value={discountAmount === "" ? "" : discountAmount}
                      onChange={(e) => handleNumberChange(e.target.value, setDiscountAmount)}
                      className="w-20 h-8 text-sm"
                      min="0"
                      step="0.01"
                      placeholder="0"
                    />
                    <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                      <SelectTrigger className="w-16 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">%</SelectItem>
                        <SelectItem value="fixed">$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <span className="font-mono font-semibold text-gray-700">-{formatCurrency(discountValue)}</span>
                </div>

                <div className="h-px bg-gray-200 my-3"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-[#3C3CFF] font-mono">{formatCurrency(totalDue)}</span>
                </div>
                
                {/* Hours Worked */}
                {showBilledByHour && totalHours > 0 && (
                  <div className="pt-3 mt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span className="font-medium">Total Hours Worked</span>
                      <span className="font-semibold">{totalHours.toFixed(2)} hours</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-6 border-t border-gray-200">
              <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes, payment instructions, or terms..."
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Footer */}
            <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
              <p>Thank you for your business!</p>
            </div>

            {/* Powered by Jolix Footer - Free Plan Only */}
            {planTier === 'free' && (
              <div className="pt-6 mt-6 border-t border-gray-100">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <span>Powered by</span>
                  <a 
                    href="https://jolix.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors font-medium"
                  >
                    <Image 
                      src="/jolixlogo.png" 
                      alt="Jolix" 
                      width={18} 
                      height={18} 
                      className="object-contain"
                    />
                    <span>Jolix</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Service Selector Modal */}
      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Service to Invoice</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 mt-4">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => addServiceToInvoice(service)}
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:border-[#3C3CFF] hover:bg-[#3C3CFF]/5 transition-all text-left"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-lg font-bold text-[#3C3CFF]">{formatCurrency(service.rate)}</p>
                  <p className="text-xs text-gray-500">
                    {service.rate_type === 'hourly' && '/hr'}
                    {service.rate_type === 'fixed' && 'fixed'}
                    {service.rate_type === 'monthly' && '/mo'}
                    {service.rate_type === 'yearly' && '/yr'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden static invoice for PDF generation */}
      <div id="invoice-preview-static" className="fixed -left-[9999px] top-0 w-[1000px] bg-white" style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div className="p-12 space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-start pb-8 border-b-2 border-gray-200">
            {/* Company Logo & Info */}
            <div className="space-y-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Company Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
              ) : (
                <div className="h-20 w-[200px] rounded-lg bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm">
                  Logo
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xl font-bold">{companyName || "Your Company Name"}</p>
                {companyAddress && <p className="text-sm text-gray-600">{companyAddress}</p>}
                {companyPhone && <p className="text-sm text-gray-600">{companyPhone}</p>}
                {companyEmail && <p className="text-sm text-gray-600">{companyEmail}</p>}
              </div>
            </div>
            
            {/* Invoice Title & Number */}
            <div className="text-right space-y-2">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                {isRecurring && (
                  <p className="text-sm text-[#3C3CFF] font-medium mt-1">
                    Recurring {recurringIntervalType.charAt(0).toUpperCase() + recurringIntervalType.slice(1)}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-end gap-2">
                  <span className="text-sm font-medium text-gray-600">#</span>
                  <span className="font-mono text-sm">{invoiceNumber}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details & Client Info */}
          <div className="grid grid-cols-2 gap-8">
            {/* Bill To */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bill To</h3>
              {selectedClientData ? (
                <div className="text-sm text-gray-700 space-y-1 pl-3 border-l-2 border-gray-200">
                  <p className="font-medium">{selectedClientData.company || `${selectedClientData.first_name} ${selectedClientData.last_name}`}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No client selected</p>
              )}
            </div>

            {/* Invoice Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</h3>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{title || "(Untitled Invoice)"}</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Invoice Date</span>
                    <p className="font-medium">{invoiceDate ? new Date(invoiceDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date</span>
                    <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                {poNumber && <p className="text-sm text-gray-700">PO: {poNumber}</p>}
                {selectedProject && (
                  <p className="text-sm text-gray-700">Project: {projects.find(p => p.id === selectedProject)?.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[35%]">Description</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[15%]">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">Rate</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">Amount</th>
                    <th className="w-[10%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        <p className="mb-1 font-medium text-gray-900">{item.name || "(Item)"}</p>
                        {item.description && (
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.unit_rate)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">{formatCurrency(item.total_amount)}</td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between items-center text-gray-700">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-gray-700">
                <span>Tax</span>
                <span className="font-mono font-semibold">{formatCurrency(taxAmount)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between items-center text-gray-700">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">-{formatCurrency(discountValue)}</span>
                </div>
              )}
              <div className="h-px bg-gray-200 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-[#3C3CFF] font-mono">{formatCurrency(totalDue)}</span>
              </div>
              
              {/* Hours Worked */}
              {showBilledByHour && totalHours > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="font-medium">Total Hours Worked</span>
                    <span className="font-semibold">{totalHours.toFixed(2)} hours</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="space-y-2 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</p>
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 pt-8 border-t border-gray-200">
            <p>Thank you for your business!</p>
          </div>

          {/* Powered by Jolix Footer - Free Plan Only */}
          {planTier === 'free' && (
            <div style={{ paddingTop: '24px', marginTop: '24px', borderTop: '1px solid #F3F4F6' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', color: '#9CA3AF' }}>
                <span>Powered by</span>
                <a 
                  href="https://jolix.io" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    color: '#3C3CFF', 
                    textDecoration: 'none',
                    fontWeight: '500'
                  }}
                >
                  <img 
                    src="/jolixlogo.png" 
                    alt="Jolix" 
                    width={18} 
                    height={18} 
                    style={{ objectFit: 'contain' }}
                  />
                  <span>Jolix</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      <InvoicePreviewModal
        ref={previewRef}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        invoice={{
          id: editingInvoiceId || 'preview',
          invoice_number: invoiceNumber,
          title: title,
          issue_date: invoiceDate,
          due_date: dueDate,
          po_number: poNumber,
          project_id: selectedProject,
          line_items: lineItems,
          subtotal: subtotal,
          tax_amount: taxAmount,
          discount_value: discountValue,
          total_amount: totalDue,
          notes: notes,
          is_recurring: isRecurring,
          recurring_schedule: isRecurring ? `${recurringIntervalType}-${recurringIntervalValue}` : null,
          client_name: selectedClientData ? (selectedClientData.company || `${selectedClientData.first_name} ${selectedClientData.last_name}`) : null,
          client_email: selectedClientData?.email || null,
          client_phone: selectedClientData?.phone || null,
          metadata: {
            logo_url: logoUrl,
            company_name: companyName,
            company_address: companyAddress,
            company_phone: companyPhone,
            company_email: companyEmail,
            show_billed_by_hour: showBilledByHour,
            total_hours: totalHours,
          },
        }}
        account={account}
        projects={projects}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-green-600">Success!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-gray-700">
              Your invoice has been sent as a PDF and payment link. The invoice will also be viewable to the client in their client portal. Here is the shareable link we sent to the client:
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <input
                type="text"
                readOnly
                value={successShareLink || "Generating share link..."}
                className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                placeholder="Generating share link..."
              />
              <Button
                onClick={handleCopySuccessLink}
                size="sm"
                variant="outline"
                className="gap-2"
                disabled={!successShareLink}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseSuccessModal} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
