"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  MoreHorizontal,
  Send,
  Download,
  Copy,
  Edit,
  DollarSign,
  Users,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Mail,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"

// Mock contract data
const contractData = {
  id: "1",
  name: "Website Redesign Contract",
  status: "awaiting_signature",
  client: {
    id: "1",
    name: "Acme Corp",
    email: "john@acme.com",
    avatar: "/placeholder.svg?height=40&width=40&text=AC",
  },
  project: {
    id: "1",
    name: "Website Redesign",
    status: "in_progress",
  },
  value: "$15,000",
  createdAt: "2024-01-20",
  sentAt: "2024-01-21",
  expiresAt: "2024-02-21",
  signers: [
    {
      id: "1",
      name: "John Smith",
      email: "john@acme.com",
      role: "Client",
      status: "pending",
      signedAt: null,
      avatar: "/placeholder.svg?height=32&width=32&text=JS",
    },
    {
      id: "2",
      name: "ClientPortalHQ",
      email: "contracts@clientportalhq.com",
      role: "Service Provider",
      status: "pending",
      signedAt: null,
      avatar: "/placeholder.svg?height=32&width=32&text=CP",
    },
  ],
  activity: [
    {
      id: "1",
      type: "sent",
      description: "Contract sent to client",
      timestamp: "2024-01-21T10:30:00Z",
      user: "You",
    },
    {
      id: "2",
      type: "viewed",
      description: "Contract viewed by John Smith",
      timestamp: "2024-01-21T14:15:00Z",
      user: "John Smith",
    },
    {
      id: "3",
      type: "viewed",
      description: "Contract viewed by John Smith",
      timestamp: "2024-01-22T09:45:00Z",
      user: "John Smith",
    },
  ],
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Mail },
  awaiting_signature: { label: "Awaiting Signature", color: "bg-purple-100 text-purple-800", icon: Clock },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: AlertCircle },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
}

export default function ContractDetailsPage({ params }: { params: { id: string } }) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 3

  const StatusIcon = statusConfig[contractData.status as keyof typeof statusConfig].icon

  return (
    <DashboardLayout title={contractData.name} subtitle="Contract details and signature status">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/contracts">Contracts</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contractData.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Sticky Header */}
        <Card className="sticky top-4 z-10 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{contractData.name}</h1>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {contractData.client.name}
                    </div>
                    {contractData.project && (
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <Link
                          href={`/dashboard/projects/${contractData.project.id}`}
                          className="hover:text-[#3C3CFF] transition-colors"
                        >
                          {contractData.project.name}
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {contractData.value}
                    </div>
                  </div>
                </div>
                <Badge className={statusConfig[contractData.status as keyof typeof statusConfig].color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig[contractData.status as keyof typeof statusConfig].label}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send/Resend
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in New Tab
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Package className="h-4 w-4 mr-2" />
                      Move to Project
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Preview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-8 min-h-[800px] shadow-sm">
                  {/* Page 1 Content */}
                  {currentPage === 1 && (
                    <div className="space-y-6">
                      <div className="text-center border-b pb-6">
                        <h1 className="text-2xl font-bold mb-2">Website Redesign Contract</h1>
                        <p className="text-gray-600">Service Agreement between ClientPortalHQ and Acme Corp</p>
                        <p className="text-sm text-gray-500 mt-2">Date: January 20, 2024</p>
                      </div>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">1. Parties</h3>
                        <p className="text-gray-700 leading-relaxed">
                          This agreement is between ClientPortalHQ, a software company ("Service Provider") and Acme
                          Corp, a technology company ("Client").
                        </p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">2. Scope of Work</h3>
                        <p className="text-gray-700 leading-relaxed mb-3">
                          Service Provider will design and develop a new responsive website for Client, including the
                          following deliverables:
                        </p>
                        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                          <li>User experience research and wireframing</li>
                          <li>Visual design mockups for desktop and mobile</li>
                          <li>Frontend development with responsive design</li>
                          <li>Content management system integration</li>
                          <li>Search engine optimization setup</li>
                          <li>30 days of post-launch support</li>
                        </ul>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">3. Timeline & Milestones</h3>
                        <div className="space-y-2 text-gray-700">
                          <p>
                            <strong>Phase 1:</strong> Discovery & Wireframes (Weeks 1-2)
                          </p>
                          <p>
                            <strong>Phase 2:</strong> Visual Design (Weeks 3-4)
                          </p>
                          <p>
                            <strong>Phase 3:</strong> Development (Weeks 5-8)
                          </p>
                          <p>
                            <strong>Phase 4:</strong> Testing & Launch (Week 9)
                          </p>
                        </div>
                      </section>
                    </div>
                  )}

                  {/* Page 2 Content */}
                  {currentPage === 2 && (
                    <div className="space-y-6">
                      <section>
                        <h3 className="text-lg font-semibold mb-3">4. Payment Terms</h3>
                        <div className="space-y-3 text-gray-700">
                          <p>
                            <strong>Total Project Value:</strong> $15,000
                          </p>
                          <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="font-medium mb-2">Payment Schedule:</p>
                            <ul className="space-y-1">
                              <li>• 50% deposit ($7,500) - Due upon contract signing</li>
                              <li>• 25% milestone payment ($3,750) - Due upon design approval</li>
                              <li>• 25% final payment ($3,750) - Due upon project completion</li>
                            </ul>
                          </div>
                          <p>Payment terms: Net 15 days. Late payments subject to 1.5% monthly fee.</p>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">5. Intellectual Property</h3>
                        <p className="text-gray-700 leading-relaxed">
                          Upon final payment, Client will own all deliverables created specifically for this project.
                          Service Provider retains the right to use the work in portfolio and marketing materials. Any
                          pre-existing intellectual property remains with the respective owner.
                        </p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">6. Revisions Policy</h3>
                        <p className="text-gray-700 leading-relaxed">
                          This project includes up to 3 rounds of revisions per milestone. Additional revisions will be
                          billed at $150 per hour. Major scope changes may require a separate agreement.
                        </p>
                      </section>

                      <section>
                        <h3 className="text-lg font-semibold mb-3">7. Termination</h3>
                        <p className="text-gray-700 leading-relaxed">
                          Either party may terminate this agreement with 14 days written notice. Client will pay for all
                          work completed up to the termination date. Any deposits are non-refundable.
                        </p>
                      </section>
                    </div>
                  )}

                  {/* Page 3 - Signatures */}
                  {currentPage === 3 && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-lg font-semibold mb-3">8. Additional Terms</h3>
                        <div className="space-y-3 text-gray-700 text-sm">
                          <p>
                            This agreement constitutes the entire agreement between the parties and supersedes all prior
                            negotiations, representations, or agreements relating to the subject matter.
                          </p>
                          <p>
                            Any modifications must be in writing and signed by both parties. This agreement shall be
                            governed by the laws of [State/Province].
                          </p>
                        </div>
                      </section>

                      <section className="pt-8 border-t">
                        <h3 className="text-lg font-semibold mb-6">Signatures</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div>
                            <p className="font-medium mb-4">Client</p>
                            <div className="space-y-4">
                              <div className="border-2 border-purple-200 bg-purple-50 h-20 rounded-lg flex items-center justify-center">
                                <div className="text-center text-purple-600">
                                  <Clock className="h-6 w-6 mx-auto mb-1" />
                                  <p className="text-sm font-medium">Signature Required</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">John Smith</p>
                                <p className="text-sm text-gray-600">CEO, Acme Corp</p>
                                <p className="text-sm text-gray-600">john@acme.com</p>
                              </div>
                              <div className="border-b border-gray-300 w-32">
                                <p className="text-xs text-gray-500 mb-1">Date</p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <p className="font-medium mb-4">Service Provider</p>
                            <div className="space-y-4">
                              <div className="border-2 border-gray-200 bg-gray-50 h-20 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <Clock className="h-6 w-6 mx-auto mb-1" />
                                  <p className="text-sm font-medium">Awaiting Client Signature</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium">ClientPortalHQ</p>
                                <p className="text-sm text-gray-600">Service Provider</p>
                                <p className="text-sm text-gray-600">contracts@clientportalhq.com</p>
                              </div>
                              <div className="border-b border-gray-300 w-32">
                                <p className="text-xs text-gray-500 mb-1">Date</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Metadata Panel */}
          <div className="space-y-6">
            {/* Contract Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Client</p>
                  <Link
                    href={`/dashboard/clients/${contractData.client.id}`}
                    className="flex items-center gap-2 mt-1 hover:text-[#3C3CFF] transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={contractData.client.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {contractData.client.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{contractData.client.name}</span>
                  </Link>
                </div>

                {contractData.project && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project</p>
                    <Link
                      href={`/dashboard/projects/${contractData.project.id}`}
                      className="text-sm text-[#3C3CFF] hover:underline mt-1 block"
                    >
                      {contractData.project.name}
                    </Link>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">Value</p>
                  <p className="text-sm mt-1">{contractData.value}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm mt-1">{new Date(contractData.createdAt).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Expires</p>
                  <p className="text-sm mt-1 text-amber-600">{new Date(contractData.expiresAt).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>

            {/* Signers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contractData.signers.map((signer) => (
                  <div key={signer.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={signer.avatar || "/placeholder.svg"} />
                      <AvatarFallback>
                        {signer.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{signer.name}</p>
                      <p className="text-xs text-gray-600">{signer.role}</p>
                    </div>
                    <div className="text-right">
                      {signer.status === "signed" ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-xs">Signed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span className="text-xs">Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contractData.activity.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="w-2 h-2 bg-[#3C3CFF] rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">{activity.user}</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-600">
                            {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                            {new Date(activity.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
