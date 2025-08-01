"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Copy,
  Download,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Package,
} from "lucide-react"
import Link from "next/link"

// Mock data for contracts
const contracts = [
  {
    id: 1,
    name: "Website Redesign Contract",
    client: "Acme Corp",
    project: "Website Redesign",
    status: "signed",
    lastActivity: "Signed 2 days ago",
    value: "$15,000",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "Social Media Management Agreement",
    client: "TechStart Inc",
    project: "Social Media Campaign",
    status: "awaiting_signature",
    lastActivity: "Sent 1 day ago",
    value: "$3,500",
    createdAt: "2024-01-20",
  },
  {
    id: 3,
    name: "Brand Identity Package",
    client: "Local Bakery",
    project: null,
    status: "draft",
    lastActivity: "Created 3 days ago",
    value: "$8,000",
    createdAt: "2024-01-18",
  },
  {
    id: 4,
    name: "Consulting Services NDA",
    client: "Enterprise Solutions",
    project: "Strategy Consulting",
    status: "sent",
    lastActivity: "Viewed 5 hours ago",
    value: null,
    createdAt: "2024-01-22",
  },
  {
    id: 5,
    name: "Retainer Agreement",
    client: "Growth Agency",
    project: "Ongoing Support",
    status: "partially_signed",
    lastActivity: "Client signed 1 day ago",
    value: "$5,000/mo",
    createdAt: "2024-01-10",
  },
  {
    id: 6,
    name: "Web Development SOW",
    client: "Startup Hub",
    project: "MVP Development",
    status: "declined",
    lastActivity: "Declined 1 week ago",
    value: "$25,000",
    createdAt: "2024-01-05",
  },
]

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800" },
  awaiting_signature: { label: "Awaiting Signature", color: "bg-purple-100 text-purple-800" },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-100 text-yellow-800" },
  signed: { label: "Signed", color: "bg-green-100 text-green-800" },
  declined: { label: "Declined", color: "bg-red-100 text-red-800" },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-800" },
}

export default function ContractsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedContracts, setSelectedContracts] = useState<number[]>([])

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.project && contract.project.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || contract.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSelectContract = (contractId: number) => {
    setSelectedContracts((prev) =>
      prev.includes(contractId) ? prev.filter((id) => id !== contractId) : [...prev, contractId],
    )
  }

  const handleSelectAll = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([])
    } else {
      setSelectedContracts(filteredContracts.map((c) => c.id))
    }
  }

  return (
    <DashboardLayout title="Contracts" subtitle="Manage contracts, templates, and e-signatures">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search contracts, clients, projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="awaiting_signature">Awaiting Signature</SelectItem>
                  <SelectItem value="partially_signed">Partially Signed</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Primary CTA */}
          <Link href="/dashboard/contracts/new">
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Contract
            </Button>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedContracts.length > 0 && (
          <Card className="border-[#3C3CFF] bg-[#F0F2FF]">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#3C3CFF]">
                  {selectedContracts.length} contract{selectedContracts.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Send className="h-4 w-4 mr-2" />
                    Send Reminder
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button variant="outline" size="sm">
                    Archive
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contracts List */}
        {filteredContracts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== "all" ? "No contracts found" : "No contracts yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first contract to get started with client agreements"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Link href="/dashboard/contracts/new">
                  <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Contract
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Select All Header */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
              <Checkbox
                checked={selectedContracts.length === filteredContracts.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium text-gray-700">Select All ({filteredContracts.length})</span>
            </div>

            {/* Contract Cards */}
            {filteredContracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedContracts.includes(contract.id)}
                      onCheckedChange={() => handleSelectContract(contract.id)}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-[#3C3CFF] transition-colors"
                          >
                            {contract.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {contract.client}
                            </div>
                            {contract.project && (
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                {contract.project}
                              </div>
                            )}
                            {contract.value && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {contract.value}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig[contract.status as keyof typeof statusConfig].color}>
                            {statusConfig[contract.status as keyof typeof statusConfig].label}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Send className="h-4 w-4 mr-2" />
                                Send/Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {contract.lastActivity}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
