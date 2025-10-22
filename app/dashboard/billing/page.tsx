"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DashboardLayout } from "@/components/dashboard/layout"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  CheckCircle,
  Mail,
  Download,
  Receipt,
  DollarSign,
  Clock,
  AlertTriangle,
  FileText,
  Loader2,
  Trash2,
  BarChart3,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { getInvoices, getInvoiceStats, type Invoice, markInvoiceAsPaid, deleteInvoice, updateInvoice } from "@/lib/invoices"
import { Label } from "@/components/ui/label"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700 hover:bg-blue-100" },
  viewed: { label: "Viewed", color: "bg-purple-100 text-purple-700 hover:bg-purple-100" },
  paid: { label: "Paid", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  partially_paid: { label: "Partially Paid", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
  refunded: { label: "Refunded", color: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
}

export default function InvoicingPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")
  const [deletingInvoice, setDeletingInvoice] = useState<string | null>(null)
  const [markingAsPaid, setMarkingAsPaid] = useState<string | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [statusChangeModalOpen, setStatusChangeModalOpen] = useState(false)
  const [changingStatusInvoice, setChangingStatusInvoice] = useState<Invoice | null>(null)
  const [changingStatus, setChangingStatus] = useState<string | null>(null)
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null)

  // Load invoices from database
  useEffect(() => {
    loadInvoices()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await getInvoices()
      setInvoices(data)
    } catch (error) {
      console.error('Error loading invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // Calculate dashboard metrics
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const totalCollected = invoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const outstandingBalance = invoices
    .filter((invoice) => invoice.status === "sent" || invoice.status === "viewed" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.total_amount, 0)
  const overdueCount = invoices.filter((invoice) => invoice.status === "overdue").length

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (invoice.client_name && invoice.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.project_name && invoice.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (invoice.title && invoice.title.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesClient = clientFilter === "all" || invoice.client_name === clientFilter

    return matchesSearch && matchesStatus && matchesClient
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedInvoices(filteredInvoices.map((invoice) => invoice.id))
    } else {
      setSelectedInvoices([])
    }
  }

  const handleSelectInvoice = (invoiceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInvoices([...selectedInvoices, invoiceId])
    } else {
      setSelectedInvoices(selectedInvoices.filter((id) => id !== invoiceId))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      setMarkingAsPaid(invoiceId)
      await markInvoiceAsPaid(invoiceId)
      
      // Update local state instead of reloading
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === invoiceId 
            ? { ...invoice, status: 'paid' as any, paid_date: new Date().toISOString() }
            : invoice
        )
      )
      
      toast.success('Invoice marked as paid successfully')
    } catch (error) {
      console.error('Error marking invoice as paid:', error)
      toast.error('Failed to mark invoice as paid')
    } finally {
      setMarkingAsPaid(null)
    }
  }

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      try {
        setDeletingInvoice(invoiceId)
        await deleteInvoice(invoiceId)
        
        // Update local state instead of reloading
        setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId))
        
        toast.success('Invoice deleted successfully')
      } catch (error) {
        console.error('Error deleting invoice:', error)
        toast.error('Failed to delete invoice')
      } finally {
        setDeletingInvoice(null)
      }
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    setPreviewInvoice(invoice)
    setPreviewModalOpen(true)
  }

  const handleEditInvoice = (invoiceId: string) => {
    router.push(`/dashboard/billing/create?edit=${invoiceId}`)
  }

  const openStatusChangeModal = (invoice: Invoice) => {
    setChangingStatusInvoice(invoice)
    setChangingStatus(invoice.status)
    setStatusChangeModalOpen(true)
  }

  const handleChangeStatus = async () => {
    if (!changingStatusInvoice || !changingStatus) return

    try {
      setChangingStatus(null)
      // Update the invoice status in the local state
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === changingStatusInvoice.id 
            ? { ...invoice, status: changingStatus as any }
            : invoice
        )
      )
      
      // Update in database
      await updateInvoice(changingStatusInvoice.id, { status: changingStatus as any })
      
      toast.success('Invoice status updated successfully')
      setStatusChangeModalOpen(false)
      setChangingStatusInvoice(null)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      toast.error('Failed to update invoice status')
      // Revert the local state change on error
      setInvoices(prevInvoices => 
        prevInvoices.map(invoice => 
          invoice.id === changingStatusInvoice.id 
            ? { ...invoice, status: changingStatusInvoice.status }
            : invoice
        )
      )
    }
  }

  const handleDownloadPDF = async (invoice: Invoice) => {
    try {
      setDownloadingPDF(invoice.id)
      
      // Create a temporary div with the invoice content
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.padding = '40px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.fontFamily = 'Arial, sans-serif'
      tempDiv.style.fontSize = '14px'
      tempDiv.style.lineHeight = '1.4'
      
      // Generate the HTML content that matches the preview modal
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          <!-- Invoice Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 style="font-size: 28px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">
                ${invoice.title || 'Untitled Invoice'}
              </h1>
              <p style="color: #6B7280; margin: 0; font-size: 16px;">
                Invoice #${invoice.invoice_number}
              </p>
            </div>
            <div style="text-align: right;">
              <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0;">Invoice Date</p>
              <p style="font-weight: 600; color: #111827; margin: 0 0 16px 0;">
                ${formatDate(invoice.issue_date)}
              </p>
              <p style="font-size: 14px; color: #6B7280; margin: 0 0 4px 0;">Due Date</p>
              <p style="font-weight: 600; color: #111827; margin: 0;">
                ${invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}
              </p>
            </div>
          </div>

          <!-- Client Info -->
          <div style="margin-bottom: 30px;">
            <h3 style="font-weight: 600; color: #111827; margin: 0 0 8px 0; font-size: 16px;">Bill To:</h3>
            <p style="color: #111827; margin: 0 0 4px 0; font-size: 16px;">
              ${invoice.client_name || "Unknown Client"}
            </p>
            ${invoice.project_name ? `<p style="color: #6B7280; margin: 0; font-size: 14px;">Project: ${invoice.project_name}</p>` : ''}
          </div>

          <!-- Line Items Table -->
          <div style="margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #E5E7EB;">
              <thead>
                <tr style="background-color: #F9FAFB;">
                  <th style="text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Item</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Qty</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Rate</th>
                  <th style="text-align: right; padding: 12px; border-bottom: 1px solid #E5E7EB; font-weight: 600; color: #374151;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.line_items && invoice.line_items.length > 0 ? 
                  invoice.line_items.map(item => `
                    <tr>
                      <td style="padding: 12px; border-bottom: 1px solid #F3F4F6;">
                        <div>
                          <p style="font-weight: 600; color: #111827; margin: 0 0 4px 0;">${item.name || "Untitled Item"}</p>
                          ${item.description ? `<p style="color: #6B7280; margin: 0; font-size: 13px;">${item.description}</p>` : ''}
                        </div>
                      </td>
                      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #F3F4F6; color: #111827;">${item.quantity}</td>
                      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #F3F4F6; color: #111827;">${formatCurrency(item.unit_rate)}</td>
                      <td style="text-align: right; padding: 12px; border-bottom: 1px solid #F3F4F6; color: #111827; font-weight: 600;">${formatCurrency(item.total_amount)}</td>
                    </tr>
                  `).join('') : 
                  `<tr><td colspan="4" style="text-align: center; padding: 20px; color: #6B7280;">No line items found</td></tr>`
                }
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
            <div style="width: 250px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">Subtotal:</span>
                <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.subtotal)}</span>
              </div>
              ${invoice.tax_rate > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6B7280;">Tax (${invoice.tax_rate}%):</span>
                  <span style="color: #111827; font-weight: 600;">${formatCurrency(invoice.tax_amount)}</span>
                </div>
              ` : ''}
              ${invoice.discount_amount > 0 ? `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="color: #6B7280;">Discount:</span>
                  <span style="color: #111827; font-weight: 600;">-${formatCurrency(invoice.discount_value)}</span>
                </div>
              ` : ''}
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 2px solid #E5E7EB; padding-top: 12px; margin-top: 12px;">
                <span style="color: #111827;">Total:</span>
                <span style="color: #3C3CFF;">${formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          ${invoice.notes ? `
            <div style="margin-bottom: 30px;">
              <h3 style="font-weight: 600; color: #111827; margin: 0 0 8px 0; font-size: 16px;">Notes:</h3>
              <p style="color: #374151; margin: 0; white-space: pre-wrap; line-height: 1.6;">${invoice.notes}</p>
            </div>
          ` : ''}

          <!-- Additional Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 20px;">
            <div>
              <span style="font-weight: 600; color: #374151;">Status:</span>
              <span style="margin-left: 8px; padding: 4px 8px; background-color: ${statusConfig[invoice.status].color.includes('bg-green') ? '#D1FAE5' : statusConfig[invoice.status].color.includes('bg-red') ? '#FEE2E2' : statusConfig[invoice.status].color.includes('bg-yellow') ? '#FEF3C7' : statusConfig[invoice.status].color.includes('bg-blue') ? '#DBEAFE' : '#F3F4F6'}; color: ${statusConfig[invoice.status].color.includes('text-green') ? '#065F46' : statusConfig[invoice.status].color.includes('text-red') ? '#991B1B' : statusConfig[invoice.status].color.includes('text-yellow') ? '#92400E' : statusConfig[invoice.status].color.includes('text-blue') ? '#1E40AF' : '#374151'}; border-radius: 4px; font-size: 12px;">
                ${statusConfig[invoice.status].label}
              </span>
            </div>
            <div>
              <span style="font-weight: 600; color: #374151;">Payment Terms:</span>
              <span style="margin-left: 8px;">${invoice.payment_terms || 'Not specified'}</span>
            </div>
            ${invoice.po_number ? `
              <div>
                <span style="font-weight: 600; color: #374151;">PO Number:</span>
                <span style="margin-left: 8px;">${invoice.po_number}</span>
              </div>
            ` : ''}
            <div>
              <span style="font-weight: 600; color: #374151;">Currency:</span>
              <span style="margin-left: 8px;">${invoice.currency || 'USD'}</span>
            </div>
          </div>
        </div>
      `
      
      // Add the temp div to the document
      document.body.appendChild(tempDiv)
      
      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })
      
      // Remove the temp div
      document.body.removeChild(tempDiv)
      
      // Create PDF
      const imgData = canvas.toDataURL('image/png')
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
      pdf.save(`invoice-${invoice.invoice_number}.pdf`)
      
      toast.success('PDF downloaded successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF')
    } finally {
      setDownloadingPDF(null)
    }
  }

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(invoices.map((invoice) => invoice.client_name).filter(Boolean) as string[]))

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Invoice Management 💰
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Track payments, manage billing, and grow your revenue
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (invoices.length === 0) {
    return (
      <DashboardLayout>
        <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Invoice Management 💰
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Track payments, manage billing, and grow your revenue
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-[#F0F2FF] rounded-full flex items-center justify-center mb-6">
              <Receipt className="h-8 w-8 text-[#3C3CFF]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices created yet</h3>
            <p className="text-gray-600 mb-8 text-center max-w-md">
              Start by creating your first invoice to track payments and manage your client billing.
            </p>
            <Link href="/dashboard/invoicing/create">
              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Invoice
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Invoice Management 💰
                </h1>
                <p className="text-blue-100 text-lg">
                  Track payments, manage billing, and grow your revenue
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</div>
                  <div className="text-blue-100 text-sm">Total Invoiced</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
              <DollarSign className="h-4 w-4 text-[#3C3CFF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</div>
              <p className="text-xs text-gray-600 mt-1">{invoices.length} total invoices</p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCollected)}</div>
              <p className="text-xs text-gray-600 mt-1">
                {invoices.filter((i) => i.status === "paid").length} paid invoices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Outstanding Balance</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(outstandingBalance)}</div>
              <p className="text-xs text-gray-600 mt-1">
                {invoices.filter((i) => i.status === "sent" || i.status === "viewed" || i.status === "overdue").length} pending
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overdue Invoices</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{overdueCount}</div>
              <p className="text-xs text-gray-600 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Controls and Filters */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search invoices, clients, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-gray-200 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 rounded-xl border-gray-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partially_paid">Partially Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-40 rounded-xl border-gray-200">
                  <SelectValue placeholder="Client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {uniqueClients.map((client) => (
                    <SelectItem key={client} value={client}>
                      {client}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard/billing/create">
              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-xl">
                <Plus className="mr-2 h-4 w-4" />
                Create Invoice
              </Button>
            </Link>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedInvoices.length > 0 && (
          <div className="bg-[#F0F2FF] border border-[#3C3CFF]/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {selectedInvoices.length} invoice{selectedInvoices.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminders
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Paid
                </Button>
                <Button variant="outline" size="sm" className="rounded-lg bg-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-100">
                  <tr>
                    <th className="text-left p-4 w-12">
                      <Checkbox
                        checked={selectedInvoices.length === filteredInvoices.length && filteredInvoices.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Invoice #</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Client</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Project</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Issue Date</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Due Date</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-600 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <Checkbox
                          checked={selectedInvoices.includes(invoice.id)}
                          onCheckedChange={(checked) => handleSelectInvoice(invoice.id, checked as boolean)}
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{invoice.invoice_number}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{invoice.client_name}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-sm ${!invoice.project_name ? "text-gray-500 italic" : "text-gray-900"}`}
                        >
                          {invoice.project_name || "Unassigned"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{formatCurrency(invoice.total_amount)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{formatDate(invoice.issue_date)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{invoice.due_date ? formatDate(invoice.due_date) : 'No due date'}</span>
                      </td>
                      <td className="p-4">
                        <Badge className={statusConfig[invoice.status].color}>
                          {statusConfig[invoice.status].label}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleViewInvoice(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditInvoice(invoice.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && (
                              <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => openStatusChangeModal(invoice)}>
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              Change Status
                            </DropdownMenuItem>
                            {(invoice.status === "sent" || invoice.status === "viewed" || invoice.status === "overdue") && (
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)}>
                              <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                              Delete Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDownloadPDF(invoice)}
                              disabled={downloadingPDF === invoice.id}
                            >
                              {downloadingPDF === invoice.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="mr-2 h-4 w-4" />
                              )}
                              {downloadingPDF === invoice.id ? "Generating PDF..." : "Download PDF"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredInvoices.length === 0 && (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="bg-white p-8 border border-gray-200 rounded-lg">
              <div className="space-y-6">
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{previewInvoice.title || 'Untitled Invoice'}</h2>
                    <p className="text-gray-600">Invoice #{previewInvoice.invoice_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Invoice Date</p>
                    <p className="font-medium">{formatDate(previewInvoice.issue_date)}</p>
                    <p className="text-sm text-gray-600 mt-2">Due Date</p>
                    <p className="font-medium">{previewInvoice.due_date ? formatDate(previewInvoice.due_date) : 'No due date'}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                  <p className="text-gray-900">{previewInvoice.client_name || "Unknown Client"}</p>
                  {previewInvoice.project_name && (
                    <p className="text-gray-600">Project: {previewInvoice.project_name}</p>
                  )}
                </div>

                {/* Line Items */}
                <div>
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2">Item</th>
                        <th className="text-right py-2">Qty</th>
                        <th className="text-right py-2">Rate</th>
                        <th className="text-right py-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewInvoice.line_items && previewInvoice.line_items.length > 0 ? (
                        previewInvoice.line_items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{item.name || "Untitled Item"}</p>
                                {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                              </div>
                            </td>
                            <td className="text-right py-3">{item.quantity}</td>
                            <td className="text-right py-3">{formatCurrency(item.unit_rate)}</td>
                            <td className="text-right py-3">{formatCurrency(item.total_amount)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="text-center py-4 text-gray-500">No line items found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(previewInvoice.subtotal)}</span>
                    </div>
                    {previewInvoice.tax_rate > 0 && (
                      <div className="flex justify-between">
                        <span>Tax ({previewInvoice.tax_rate}%):</span>
                        <span>{formatCurrency(previewInvoice.tax_amount)}</span>
                      </div>
                    )}
                    {previewInvoice.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span>Discount:</span>
                        <span>-{formatCurrency(previewInvoice.discount_value)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(previewInvoice.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {previewInvoice.notes && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">{previewInvoice.notes}</p>
                  </div>
                )}

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Status:</span>
                    <Badge className={`ml-2 ${statusConfig[previewInvoice.status].color}`}>
                      {statusConfig[previewInvoice.status].label}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Payment Terms:</span>
                    <span className="ml-2">{previewInvoice.payment_terms || 'Not specified'}</span>
                  </div>
                  {previewInvoice.po_number && (
                    <div>
                      <span className="font-medium">PO Number:</span>
                      <span className="ml-2">{previewInvoice.po_number}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Currency:</span>
                    <span className="ml-2">{previewInvoice.currency || 'USD'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Change Modal */}
      <Dialog open={statusChangeModalOpen} onOpenChange={setStatusChangeModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Invoice Status</DialogTitle>
          </DialogHeader>
          {changingStatusInvoice && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Current Status: <Badge className={statusConfig[changingStatusInvoice.status].color}>
                    {statusConfig[changingStatusInvoice.status].label}
                  </Badge>
                </p>
                <p className="text-sm text-gray-600">
                  Invoice: {changingStatusInvoice.invoice_number}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new-status">New Status</Label>
                <Select value={changingStatus || ""} onValueChange={setChangingStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="viewed">Viewed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStatusChangeModalOpen(false)
                    setChangingStatusInvoice(null)
                    setChangingStatus(null)
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangeStatus}
                  disabled={!changingStatus || changingStatus === changingStatusInvoice.status}
                  className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                >
                  {changingStatus ? "Update Status" : "Select Status"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
