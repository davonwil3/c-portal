"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Plus, Trash2, Eye, Calendar, DollarSign, Save, Send, ArrowLeft } from "lucide-react"

// Mock data
const mockClients = [
  { id: "1", name: "Acme Corp", email: "billing@acme.com" },
  { id: "2", name: "TechStart Inc", email: "finance@techstart.com" },
  { id: "3", name: "Design Co", email: "accounts@designco.com" },
  { id: "4", name: "Marketing Plus", email: "billing@marketingplus.com" },
  { id: "5", name: "StartupXYZ", email: "admin@startupxyz.com" },
]

const mockProjects = {
  "1": [
    { id: "p1", name: "Website Redesign" },
    { id: "p2", name: "Brand Identity" },
  ],
  "2": [
    { id: "p3", name: "Mobile App Development" },
    { id: "p4", name: "API Integration" },
  ],
  "3": [
    { id: "p5", name: "Logo Design" },
    { id: "p6", name: "Marketing Materials" },
  ],
  "4": [
    { id: "p7", name: "SEO Campaign" },
    { id: "p8", name: "Social Media Strategy" },
  ],
  "5": [
    { id: "p9", name: "E-commerce Platform" },
    { id: "p10", name: "Payment Integration" },
  ],
}

interface LineItem {
  id: string
  name: string
  description: string
  quantity: number
  rate: number
  total: number
}

export default function CreateInvoicePage() {
  const router = useRouter()
  const [selectedClient, setSelectedClient] = useState("")
  const [selectedProject, setSelectedProject] = useState("")
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      name: "",
      description: "",
      quantity: 1,
      rate: 0,
      total: 0,
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

  // Auto-generate invoice ID
  const invoiceId = "INV-1024"

  // Set default due date (30 days from invoice date)
  useEffect(() => {
    const invoiceDateObj = new Date(invoiceDate)
    const defaultDueDate = new Date(invoiceDateObj)
    defaultDueDate.setDate(defaultDueDate.getDate() + 30)
    setDueDate(defaultDueDate.toISOString().split("T")[0])
  }, [invoiceDate])

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0)
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
      quantity: 1,
      rate: 0,
      total: 0,
    }
    setLineItems([...lineItems, newItem])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((item) => item.id !== id))
    }
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value }
          if (field === "quantity" || field === "rate") {
            updatedItem.total = updatedItem.quantity * updatedItem.rate
          }
          return updatedItem
        }
        return item
      }),
    )
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    router.push("/dashboard/invoicing")
  }

  const handleSendInvoice = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    router.push("/dashboard/invoicing")
  }

  const availableProjects = selectedClient ? mockProjects[selectedClient as keyof typeof mockProjects] || [] : []

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
              <BreadcrumbPage>New Invoice</BreadcrumbPage>
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
              <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
              <p className="text-gray-600">Create and send an invoice to your client</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Invoice ID</p>
            <p className="text-lg font-semibold text-gray-900">{invoiceId}</p>
          </div>
        </div>

        {/* Invoice Header Form */}
        <Card className="bg-white border-0 shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockClients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
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
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)}
                              className="pl-10 rounded-lg border-gray-200"
                            />
                          </div>
                        </div>
                        <div className="col-span-1">
                          <div className="text-sm font-medium text-gray-900 py-2">{formatCurrency(item.total)}</div>
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
                                  value={item.rate}
                                  onChange={(e) =>
                                    updateLineItem(item.id, "rate", Number.parseFloat(e.target.value) || 0)
                                  }
                                  className="pl-10 rounded-lg border-gray-200"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm text-gray-600">Total: </span>
                            <span className="font-medium text-gray-900">{formatCurrency(item.total)}</span>
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
                {isSaving ? "Saving..." : "Save as Draft"}
              </Button>

              <Button
                onClick={handleSendInvoice}
                disabled={isSaving || !selectedClient}
                className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white rounded-lg"
              >
                <Send className="mr-2 h-4 w-4" />
                {isSaving ? "Sending..." : "Send Invoice"}
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
              Save Draft
            </Button>
            <Button
              onClick={handleSendInvoice}
              disabled={isSaving || !selectedClient}
              className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white rounded-lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
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
                  <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
                  <p className="text-gray-600">{invoiceId}</p>
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
                  {selectedClient ? mockClients.find((c) => c.id === selectedClient)?.name : "Select a client"}
                </p>
                {selectedProject && (
                  <p className="text-gray-600">
                    Project: {availableProjects.find((p) => p.id === selectedProject)?.name}
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
                        <td className="text-right py-3">{formatCurrency(item.rate)}</td>
                        <td className="text-right py-3">{formatCurrency(item.total)}</td>
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
