"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
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
} from "lucide-react"
import Link from "next/link"

// Mock data for invoices
const mockInvoices = [
  {
    id: "INV-0015",
    clientName: "Acme Corp",
    projectName: "Website Redesign",
    amount: 5500,
    issueDate: "2024-01-15",
    dueDate: "2024-02-15",
    status: "paid" as const,
  },
  {
    id: "INV-0014",
    clientName: "TechStart Inc",
    projectName: "Mobile App Development",
    amount: 12000,
    issueDate: "2024-01-10",
    dueDate: "2024-02-10",
    status: "unpaid" as const,
  },
  {
    id: "INV-0013",
    clientName: "Design Co",
    projectName: "Brand Identity",
    amount: 3200,
    issueDate: "2023-12-20",
    dueDate: "2024-01-20",
    status: "overdue" as const,
  },
  {
    id: "INV-0012",
    clientName: "Marketing Plus",
    projectName: "Unassigned",
    amount: 2800,
    issueDate: "2024-01-05",
    dueDate: "2024-02-05",
    status: "draft" as const,
  },
  {
    id: "INV-0011",
    clientName: "StartupXYZ",
    projectName: "E-commerce Platform",
    amount: 8900,
    issueDate: "2024-01-01",
    dueDate: "2024-02-01",
    status: "paid" as const,
  },
  {
    id: "INV-0010",
    clientName: "Global Enterprises",
    projectName: "CRM Integration",
    amount: 15000,
    issueDate: "2023-12-15",
    dueDate: "2024-01-15",
    status: "overdue" as const,
  },
]

const statusConfig = {
  paid: { label: "Paid", color: "bg-green-100 text-green-700 hover:bg-green-100" },
  unpaid: { label: "Unpaid", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" },
  overdue: { label: "Overdue", color: "bg-red-100 text-red-700 hover:bg-red-100" },
  draft: { label: "Draft", color: "bg-gray-100 text-gray-700 hover:bg-gray-100" },
}

export default function InvoicingPage() {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("all")

  // Calculate dashboard metrics
  const totalInvoiced = mockInvoices.reduce((sum, invoice) => sum + invoice.amount, 0)
  const totalCollected = mockInvoices
    .filter((invoice) => invoice.status === "paid")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const outstandingBalance = mockInvoices
    .filter((invoice) => invoice.status === "unpaid" || invoice.status === "overdue")
    .reduce((sum, invoice) => sum + invoice.amount, 0)
  const overdueCount = mockInvoices.filter((invoice) => invoice.status === "overdue").length

  // Filter invoices based on search and filters
  const filteredInvoices = mockInvoices.filter((invoice) => {
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.projectName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter
    const matchesClient = clientFilter === "all" || invoice.clientName === clientFilter

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

  // Get unique clients for filter dropdown
  const uniqueClients = Array.from(new Set(mockInvoices.map((invoice) => invoice.clientName)))

  if (mockInvoices.length === 0) {
    return (
      <DashboardLayout title="All Invoices" subtitle="Manage and track all your invoices in one place">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-[#F0F2FF] rounded-full flex items-center justify-center mb-6">
            <Receipt className="h-8 w-8 text-[#3C3CFF]" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices created yet</h3>
          <p className="text-gray-600 mb-8 text-center max-w-md">
            Start by creating your first invoice to track payments and manage your client billing.
          </p>
          <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Invoice
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="All Invoices" subtitle="Manage and track all your invoices in one place">
      <div className="space-y-8">
        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Invoiced</CardTitle>
              <DollarSign className="h-4 w-4 text-[#3C3CFF]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</div>
              <p className="text-xs text-gray-600 mt-1">{mockInvoices.length} total invoices</p>
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
                {mockInvoices.filter((i) => i.status === "paid").length} paid invoices
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
                {mockInvoices.filter((i) => i.status === "unpaid" || i.status === "overdue").length} pending
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
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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

          <Link href="/dashboard/invoicing/create">
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
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
                        <span className="font-medium text-gray-900">{invoice.id}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-900">{invoice.clientName}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-sm ${invoice.projectName === "Unassigned" ? "text-gray-500 italic" : "text-gray-900"}`}
                        >
                          {invoice.projectName}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{formatDate(invoice.issueDate)}</span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600">{formatDate(invoice.dueDate)}</span>
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
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Invoice
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && (
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {(invoice.status === "unpaid" || invoice.status === "overdue") && (
                              <DropdownMenuItem>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Reminder
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Download PDF
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
    </DashboardLayout>
  )
}
