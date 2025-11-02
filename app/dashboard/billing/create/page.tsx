"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Plus, Trash2, Eye, Calendar, DollarSign, Save, Send, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createInvoice, getInvoice, updateInvoice, type Invoice } from "@/lib/invoices"
import { getClients, type Client } from "@/lib/clients"
import { getProjects, type Project } from "@/lib/projects"

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

export default function CreateInvoicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [clients, setClients] = useState<Client[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
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
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage")
  const [notes, setNotes] = useState("")
  const [poNumber, setPoNumber] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("net-30")
  const [allowOnlinePayment, setAllowOnlinePayment] = useState(true)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Check if we're editing an existing invoice
  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      setIsEditing(true)
      setEditingInvoiceId(editId)
      loadExistingInvoice(editId)
    }
  }, [searchParams])

  // Load clients and projects
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [clientsData, projectsData] = await Promise.all([
        getClients(),
        getProjects()
      ])
      setClients(clientsData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load clients and projects')
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
        setTaxRate(invoice.tax_rate || 0)
        setDiscountAmount(invoice.discount_amount || 0)
        setDiscountType(invoice.discount_type || "percentage")
        setNotes(invoice.notes || "")
        setPoNumber(invoice.po_number || "")
        setPaymentTerms(invoice.payment_terms || "net-30")
        setAllowOnlinePayment(invoice.allow_online_payment !== false)
      }
    } catch (error) {
      console.error('Error loading existing invoice:', error)
      toast.error('Failed to load existing invoice')
    } finally {
      setLoading(false)
    }
  }

  // Set default due date (30 days from invoice date)
  useEffect(() => {
    const invoiceDateObj = new Date(invoiceDate)
    const defaultDueDate = new Date(invoiceDateObj)
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    setDueDate(defaultDueDate.toISOString().split("T")[0])
  }, [invoiceDate])

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total_amount, 0)
  const taxAmount = (subtotal * taxRate) / 100
  const discountValue = discountType === "percentage" ? (subtotal * discountAmount) / 100 : discountAmount
  const totalDue = subtotal + taxAmount - discountValue

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
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

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
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
      
      const invoiceData = {
        client_id: selectedClient,
        project_id: selectedProject ? selectedProject : undefined,
        title: title,
        description: notes,
        notes: notes,
        po_number: poNumber,
        line_items: mappedLineItems,
        status: 'draft' as const,
        issue_date: new Date(invoiceDate).toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        tax_rate: Number(taxRate) || 0,
        discount_type: discountType,
        discount_amount: Number(discountAmount) || 0,
        currency: 'USD',
        payment_terms: paymentTerms,
        allow_online_payment: Boolean(allowOnlinePayment),
        reminder_schedule: '3-days',
        auto_reminder: true,
        tags: ['invoice', 'draft'],
        metadata: {
          source: 'invoice_creator',
          created_from: 'create_page'
        }
      }

      if (isEditing && editingInvoiceId) {
        await updateInvoice(editingInvoiceId, invoiceData)
        toast.success('Invoice updated successfully')
      } else {
        await createInvoice(invoiceData)
        toast.success('Invoice saved as draft successfully')
      }
      router.push("/dashboard/invoicing")
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
      
      const invoiceData = {
        client_id: selectedClient,
        project_id: selectedProject ? selectedProject : undefined,
        title: title,
        description: notes,
        notes: notes,
        po_number: poNumber,
        line_items: mappedLineItems,
        status: 'sent' as const,
        issue_date: new Date(invoiceDate).toISOString(),
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined,
        sent_date: new Date().toISOString(),
        tax_rate: Number(taxRate) || 0,
        discount_type: discountType,
        discount_amount: Number(discountAmount) || 0,
        currency: 'USD',
        payment_terms: paymentTerms,
        allow_online_payment: Boolean(allowOnlinePayment),
        reminder_schedule: '3-days',
        auto_reminder: true,
        tags: ['invoice', 'sent'],
        metadata: {
          source: 'invoice_creator',
          created_from: 'create_page'
        }
      }

      if (isEditing && editingInvoiceId) {
        await updateInvoice(editingInvoiceId, invoiceData)
        toast.success('Invoice updated and sent successfully')
      } else {
        await createInvoice(invoiceData)
        toast.success('Invoice sent successfully')
      }
      router.push("/dashboard/invoicing")
    } catch (error: any) {
      console.error('Error sending invoice:', error)
      toast.error('Failed to send invoice')
    } finally {
      setIsSaving(false)
    }
  }

  const availableProjects = selectedClient ? projects.filter(p => p.client_id === selectedClient) : []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/invoicing">Invoicing</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{isEditing ? 'Edit Invoice' : 'New Invoice'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{isEditing ? 'Edit Invoice' : 'New Invoice'}</h1>
              <p className="text-gray-600">{isEditing ? 'Update your invoice details' : 'Create and send an invoice to your client'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Invoice ID</p>
            <p className="text-lg font-semibold text-gray-900">{/* Invoice ID will be generated on save */}</p>
          </div>
        </div>

        {/* Invoice Header Form */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Invoice Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Website Development - Phase 1"
                  className="rounded-xl border-gray-200"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project">Project</Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject} disabled={!selectedClient}>
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableProjects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invoice-date">Invoice Date</Label>
                  <div className="relative">
                    <Input
                      id="invoice-date"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="rounded-xl border-gray-200"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="due-date">Due Date</Label>
                  <div className="relative">
                    <Input
                      id="due-date"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="rounded-xl border-gray-200"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Line Items */}
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Invoice Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Desktop Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 text-sm font-medium text-gray-600 pb-2 border-b border-gray-100">
                    <div className="col-span-3">Item Name</div>
                    <div className="col-span-3">Description</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-2">Rate</div>
                    <div className="col-span-1">Total</div>
                    <div className="col-span-1"></div>
                  </div>

                  {/* Line Items */}
                  {lineItems.map((item, index) => (
                    <div key={item.id} className="space-y-4 md:space-y-0">
                      {/* Desktop Layout */}
                      <div className="hidden md:grid grid-cols-12 gap-4 items-start">
                        <div className="col-span-3">
                          <Input
                            placeholder="Item name"
                            value={item.name}
                            onChange={(e) => updateLineItem(item.id, "name", e.target.value)}
                            className="rounded-lg border-gray-200"
                          />
                        </div>
                        <div className="col-span-3">
                          <Input
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                            className="rounded-lg border-gray-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)}
                            className="rounded-lg border-gray-200"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_rate}
                              onChange={(e) => updateLineItem(item.id, "unit_rate", Number.parseFloat(e.target.value) || 0)}
                              className="pl-10 rounded-lg border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm font-medium text-gray-900 py-2">{formatCurrency(item.total_amount)}</div>
                        </div>
                        <div className="col-span-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-3 p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-gray-900">Item {index + 1}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(item.id)}
                            disabled={lineItems.length === 1}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-gray-600">Item Name</Label>
                            <Input
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateLineItem(item.id, "name", e.target.value)}
                              className="rounded-lg border-gray-200"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-gray-600">Description</Label>
                            <Input
                              placeholder="Description"
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, "description", e.target.value)}
                              className="rounded-lg border-gray-200"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-gray-600">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateLineItem(item.id, "quantity", Number.parseInt(e.target.value) || 1)
                                }
                                className="rounded-lg border-gray-200"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600">Rate</Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_rate}
                                  onChange={(e) =>
                                    updateLineItem(item.id, "unit_rate", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="pl-10 rounded-lg border-gray-200"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">Total: </span>
                            <span className="font-medium text-gray-900">{formatCurrency(item.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Item Button */}
                  <Button
                    variant="outline"
                    onClick={addLineItem}
                    className="w-full rounded-lg border-dashed border-gray-300 hover:border-[#3C3CFF] hover:text-[#3C3CFF] bg-transparent"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary & Actions */}
          <div className="space-y-6">
            {/* Invoice Summary */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Tax */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Tax</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number.parseFloat(e.target.value) || 0)}
                          className="w-16 h-6 text-xs rounded border-gray-200"
                        />
                        <span className="text-xs text-gray-500">%</span>
                      </div>
                    </div>
                    <span className="font-medium">{formatCurrency(taxAmount)}</span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Discount</span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={discountAmount}
                          onChange={(e) => setDiscountAmount(Number.parseFloat(e.target.value) || 0)}
                          className="w-16 h-6 text-xs rounded border-gray-200"
                        />
                        <Select
                          value={discountType}
                          onValueChange={(value: "percentage" | "fixed") => setDiscountType(value)}
                        >
                          <SelectTrigger className="w-12 h-6 text-xs border-gray-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">%</SelectItem>
                            <SelectItem value="fixed">$</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <span className="font-medium">-{formatCurrency(discountValue)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total Due</span>
                      <span className="text-xl font-bold text-[#3C3CFF]">{formatCurrency(totalDue)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Options */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Additional Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes to Client</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any additional notes or payment instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-lg border-gray-200 resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="po-number">PO Number</Label>
                  <Input
                    id="po-number"
                    placeholder="Purchase order number"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="rounded-lg border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-terms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger className="rounded-lg border-gray-200">
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

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="online-payment"
                    checked={allowOnlinePayment}
                    onCheckedChange={(checked) => setAllowOnlinePayment(checked as boolean)}
                  />
                  <Label htmlFor="online-payment" className="text-sm">
                    Allow online payment
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                className="w-full rounded-lg border-gray-200 hover:border-[#3C3CFF] hover:text-[#3C3CFF]"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview Invoice
              </Button>

              <Button
                onClick={handleSaveDraft}
                disabled={isSaving}
                variant="outline"
                className="w-full rounded-lg border-gray-200 bg-transparent"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : (isEditing ? "Update Draft" : "Save as Draft")}
              </Button>

              <Button
                onClick={handleSendInvoice}
                disabled={isSaving || !selectedClient || !title.trim()}
                className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white rounded-lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSaving ? "Sending..." : (isEditing ? "Update & Send" : "Send Invoice")}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-2">
          <div className="flex gap-2">
            <Button
              onClick={handleSaveDraft}
              disabled={isSaving}
              variant="outline"
              className="flex-1 rounded-lg bg-transparent"
            >
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Draft" : "Save Draft"}
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={isSaving || !selectedClient || !title.trim()}
              className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white rounded-lg"
            >
              <Send className="mr-2 h-4 w-4" />
              {isEditing ? "Update & Send" : "Send Invoice"}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-8 border border-gray-200 rounded-lg">
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{title || 'Untitled Invoice'}</h2>
                  <p className="text-gray-600">Invoice will be generated on save</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Invoice Date</p>
                  <p className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 mt-2">Due Date</p>
                  <p className="font-medium">{new Date(dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                <p className="text-gray-900">
                  {selectedClient ? clients.find(c => c.id === selectedClient)?.company : "Select a client"}
                </p>
                {selectedProject && (
                  <p className="text-gray-600">
                    Project: {availableProjects.find(p => p.id === selectedProject)?.name}
                  </p>
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
                    {lineItems.map((item) => (
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {taxRate > 0 && (
                    <div className="flex justify-between">
                      <span>Tax ({taxRate}%):</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatCurrency(discountValue)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(totalDue)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes:</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
