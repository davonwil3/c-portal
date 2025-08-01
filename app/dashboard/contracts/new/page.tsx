"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Users,
  Package,
  Edit3,
  Eye,
  Send,
  Save,
  Mail,
  Settings,
  Crown,
  ExternalLink,
  Plus,
  Copy,
  MousePointer,
} from "lucide-react"
import Link from "next/link"

const contractTemplates = [
  {
    id: "web-design",
    name: "Web Design Contract",
    description: "Complete web design and development agreement",
    category: "Design",
    popular: true,
  },
  {
    id: "social-media",
    name: "Social Media Management",
    description: "Ongoing social media management services",
    category: "Marketing",
    popular: true,
  },
  {
    id: "consulting",
    name: "Consulting Agreement",
    description: "Professional consulting services contract",
    category: "Consulting",
    popular: true,
  },
  {
    id: "contractor",
    name: "Independent Contractor",
    description: "Standard independent contractor agreement",
    category: "Legal",
    popular: false,
  },
  {
    id: "retainer",
    name: "Retainer Agreement",
    description: "Ongoing retainer-based services",
    category: "Business",
    popular: true,
  },
  {
    id: "sow",
    name: "Statement of Work",
    description: "Detailed project scope and deliverables",
    category: "Project",
    popular: false,
  },
  {
    id: "nda",
    name: "Non-Disclosure Agreement",
    description: "Confidentiality and non-disclosure terms",
    category: "Legal",
    popular: false,
  },
]

const mockClients = [
  { id: 1, name: "Acme Corp", email: "contact@acme.com" },
  { id: 2, name: "TechStart Inc", email: "hello@techstart.com" },
  { id: 3, name: "Local Bakery", email: "info@localbakery.com" },
  { id: 4, name: "Enterprise Solutions", email: "team@enterprise.com" },
]

const mockProjects = [
  { id: 1, name: "Website Redesign", clientId: 1, dueDate: "2024-03-15" },
  { id: 2, name: "Social Media Campaign", clientId: 2, dueDate: "2024-02-28" },
  { id: 3, name: "Brand Identity", clientId: 3, dueDate: "2024-04-10" },
]

export default function NewContractPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [createNewProject, setCreateNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDueDate, setNewProjectDueDate] = useState("")

  // Contract form data
  const [contractData, setContractData] = useState({
    companyName: "Your Company",
    companyAddress: "",
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    projectScope: "",
    milestones: "",
    paymentTerms: "",
    depositAmount: "",
    totalAmount: "",
    ipRights: "client",
    revisions: "3",
    terminationClause: "30-day notice",
    signatureOrder: "sequential",
  })

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    subject: "Contract for Review and Signature",
    body: "Please review and sign the attached contract.",
    ccEmails: "",
    bccEmails: "",
    reminderSchedule: "3-days",
    expirationDate: "",
  })

  const totalSteps = 5
  const stepTitles = ["Choose Template", "Link Context", "Fill Fields", "Review & Edit", "Send Contract"]

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const filteredProjects = selectedClient
    ? mockProjects.filter((project) => project.clientId === Number.parseInt(selectedClient))
    : []

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose a Template</h2>
              <p className="text-gray-600">Select a contract template to get started, or create from scratch.</p>
            </div>

            {/* Start from Blank Option */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedTemplate === "blank" ? "ring-2 ring-[#3C3CFF] bg-[#F0F2FF]" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedTemplate("blank")}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Edit3 className="h-6 w-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Start from Blank</h3>
                    <p className="text-sm text-gray-600">Create a custom contract from scratch</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contractTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id ? "ring-2 ring-[#3C3CFF] bg-[#F0F2FF]" : "hover:shadow-md"
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 bg-[#3C3CFF] bg-opacity-10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-[#3C3CFF]" />
                        </div>
                        {template.popular && <Badge className="bg-green-100 text-green-800">Popular</Badge>}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <Badge variant="outline" className="mt-2">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Manage Templates Link */}
            <div className="text-center">
              <Link
                href="/dashboard/contracts/templates"
                className="inline-flex items-center gap-2 text-[#3C3CFF] hover:text-[#2D2DCC] font-medium"
              >
                <Settings className="h-4 w-4" />
                Manage Templates
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Context</h2>
              <p className="text-gray-600">Assign this contract to a client and optionally link it to a project.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assign Client
                    <Badge variant="outline" className="text-red-600 border-red-200">
                      Required
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockClients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" className="w-full bg-transparent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Client
                  </Button>
                </CardContent>
              </Card>

              {/* Project Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Link Project
                    <Badge variant="outline" className="text-gray-600 border-gray-200">
                      Optional
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedClient ? (
                    <>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-sm text-gray-500">Due: {project.dueDate}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="create-project"
                            checked={createNewProject}
                            onCheckedChange={setCreateNewProject}
                          />
                          <Label htmlFor="create-project">Create new project</Label>
                        </div>

                        {createNewProject && (
                          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <Label htmlFor="project-name">Project Name</Label>
                              <Input
                                id="project-name"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder="Enter project name"
                              />
                            </div>
                            <div>
                              <Label htmlFor="project-due">Due Date</Label>
                              <Input
                                id="project-due"
                                type="date"
                                value={newProjectDueDate}
                                onChange={(e) => setNewProjectDueDate(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Select a client first to see available projects</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Fill Contract Fields</h2>
              <p className="text-gray-600">Complete the contract details and terms.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={contractData.companyName}
                      onChange={(e) => setContractData({ ...contractData, companyName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-address">Company Address</Label>
                    <Textarea
                      id="company-address"
                      value={contractData.companyAddress}
                      onChange={(e) => setContractData({ ...contractData, companyAddress: e.target.value })}
                      placeholder="Enter your business address"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Client Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="client-name">Client Name</Label>
                    <Input
                      id="client-name"
                      value={contractData.clientName}
                      onChange={(e) => setContractData({ ...contractData, clientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-email">Client Email</Label>
                    <Input
                      id="client-email"
                      type="email"
                      value={contractData.clientEmail}
                      onChange={(e) => setContractData({ ...contractData, clientEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="client-address">Client Address</Label>
                    <Textarea
                      id="client-address"
                      value={contractData.clientAddress}
                      onChange={(e) => setContractData({ ...contractData, clientAddress: e.target.value })}
                      placeholder="Enter client address"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Scope & Deliverables */}
              <Card>
                <CardHeader>
                  <CardTitle>Scope & Deliverables</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="project-scope">Project Scope</Label>
                    <Textarea
                      id="project-scope"
                      value={contractData.projectScope}
                      onChange={(e) => setContractData({ ...contractData, projectScope: e.target.value })}
                      placeholder="Describe the work to be performed"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="milestones">Milestones</Label>
                    <Textarea
                      id="milestones"
                      value={contractData.milestones}
                      onChange={(e) => setContractData({ ...contractData, milestones: e.target.value })}
                      placeholder="List project milestones and deadlines"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Payment Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="deposit-amount">Deposit Amount</Label>
                      <Input
                        id="deposit-amount"
                        value={contractData.depositAmount}
                        onChange={(e) => setContractData({ ...contractData, depositAmount: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="total-amount">Total Amount</Label>
                      <Input
                        id="total-amount"
                        value={contractData.totalAmount}
                        onChange={(e) => setContractData({ ...contractData, totalAmount: e.target.value })}
                        placeholder="$0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="payment-terms">Payment Terms</Label>
                    <Textarea
                      id="payment-terms"
                      value={contractData.paymentTerms}
                      onChange={(e) => setContractData({ ...contractData, paymentTerms: e.target.value })}
                      placeholder="Net 30, payment due upon completion, etc."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Additional Terms */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Additional Terms</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="ip-rights">IP/Usage Rights</Label>
                      <Select
                        value={contractData.ipRights}
                        onValueChange={(value) => setContractData({ ...contractData, ipRights: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client owns all rights</SelectItem>
                          <SelectItem value="shared">Shared ownership</SelectItem>
                          <SelectItem value="contractor">Contractor retains rights</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="revisions">Included Revisions</Label>
                      <Select
                        value={contractData.revisions}
                        onValueChange={(value) => setContractData({ ...contractData, revisions: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 revision</SelectItem>
                          <SelectItem value="2">2 revisions</SelectItem>
                          <SelectItem value="3">3 revisions</SelectItem>
                          <SelectItem value="unlimited">Unlimited</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="termination">Termination Clause</Label>
                      <Select
                        value={contractData.terminationClause}
                        onValueChange={(value) => setContractData({ ...contractData, terminationClause: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30-day notice">30-day notice</SelectItem>
                          <SelectItem value="14-day notice">14-day notice</SelectItem>
                          <SelectItem value="immediate">Immediate termination</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="signature-order">Signature Order</Label>
                    <Select
                      value={contractData.signatureOrder}
                      onValueChange={(value) => setContractData({ ...contractData, signatureOrder: value })}
                    >
                      <SelectTrigger className="w-full md:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sequential">Sequential (You first, then client)</SelectItem>
                        <SelectItem value="simultaneous">Simultaneous (Both can sign anytime)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Edit</h2>
              <p className="text-gray-600">Review your contract and add signature fields.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
              {/* Editor Panel */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Contract Editor</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Copy className="h-4 w-4 mr-2" />
                        Merge Tags
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <Textarea
                    className="h-full resize-none border-0 focus:ring-0"
                    placeholder="Your contract content will appear here..."
                    value={`CONTRACT FOR SERVICES

This agreement is between ${contractData.companyName} ("Company") and ${contractData.clientName} ("Client").

PROJECT SCOPE:
${contractData.projectScope}

PAYMENT TERMS:
Total Amount: ${contractData.totalAmount}
Deposit: ${contractData.depositAmount}
${contractData.paymentTerms}

DELIVERABLES & MILESTONES:
${contractData.milestones}

INTELLECTUAL PROPERTY:
${contractData.ipRights === "client" ? "All work product will be owned by the Client upon full payment." : contractData.ipRights === "shared" ? "Intellectual property will be shared between parties." : "Contractor retains all intellectual property rights."}

REVISIONS:
This project includes ${contractData.revisions} revision${contractData.revisions !== "1" ? "s" : ""}.

TERMINATION:
Either party may terminate this agreement with ${contractData.terminationClause}.

SIGNATURES:
This contract requires signatures from both parties.`}
                    readOnly
                  />
                </CardContent>
              </Card>

              {/* Preview Panel */}
              <Card className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Live Preview</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <MousePointer className="h-4 w-4 mr-2" />
                        Add Signature
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 bg-white border rounded-lg p-6 overflow-auto">
                  <div className="space-y-4 text-sm">
                    <div className="text-center">
                      <h3 className="text-xl font-bold">CONTRACT FOR SERVICES</h3>
                    </div>

                    <p>
                      This agreement is between <strong>{contractData.companyName}</strong> ("Company") and{" "}
                      <strong>{contractData.clientName}</strong> ("Client").
                    </p>

                    <div>
                      <h4 className="font-semibold">PROJECT SCOPE:</h4>
                      <p>{contractData.projectScope || "Project scope will be defined here..."}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">PAYMENT TERMS:</h4>
                      <p>Total Amount: {contractData.totalAmount}</p>
                      <p>Deposit: {contractData.depositAmount}</p>
                      <p>{contractData.paymentTerms}</p>
                    </div>

                    {/* Signature Fields */}
                    <div className="mt-8 space-y-6">
                      <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                        <div className="text-center text-gray-500">
                          <p className="font-medium">Company Signature</p>
                          <p className="text-sm">Drag signature field here</p>
                        </div>
                      </div>
                      <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg">
                        <div className="text-center text-gray-500">
                          <p className="font-medium">Client Signature</p>
                          <p className="text-sm">Drag signature field here</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Branding Notice */}
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Free Plan Notice</p>
                    <p className="text-sm text-amber-700">
                      Contracts on the free plan include a "Powered by ClientPortalHQ" watermark.
                      <Link href="/pricing" className="underline ml-1">
                        Upgrade to remove
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Contract</h2>
              <p className="text-gray-600">Configure email settings and send your contract for signature.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Email Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email-subject">Email Subject</Label>
                    <Input
                      id="email-subject"
                      value={emailSettings.subject}
                      onChange={(e) => setEmailSettings({ ...emailSettings, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email-body">Email Body</Label>
                    <Textarea
                      id="email-body"
                      value={emailSettings.body}
                      onChange={(e) => setEmailSettings({ ...emailSettings, body: e.target.value })}
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="cc-emails">CC Emails</Label>
                      <Input
                        id="cc-emails"
                        value={emailSettings.ccEmails}
                        onChange={(e) => setEmailSettings({ ...emailSettings, ccEmails: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bcc-emails">BCC Emails</Label>
                      <Input
                        id="bcc-emails"
                        value={emailSettings.bccEmails}
                        onChange={(e) => setEmailSettings({ ...emailSettings, bccEmails: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Advanced Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="reminder-schedule">
                      Reminder Schedule
                      <Badge className="ml-2 bg-purple-100 text-purple-800">Premium</Badge>
                    </Label>
                    <Select
                      value={emailSettings.reminderSchedule}
                      onValueChange={(value) => setEmailSettings({ ...emailSettings, reminderSchedule: value })}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-day">Daily reminders</SelectItem>
                        <SelectItem value="3-days">Every 3 days</SelectItem>
                        <SelectItem value="weekly">Weekly reminders</SelectItem>
                        <SelectItem value="none">No reminders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expiration-date">Expiration Date</Label>
                    <Input
                      id="expiration-date"
                      type="date"
                      value={emailSettings.expirationDate}
                      onChange={(e) => setEmailSettings({ ...emailSettings, expirationDate: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Email Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">To: {contractData.clientEmail || "client@example.com"}</span>
                    <span className="text-gray-500">From: you@yourcompany.com</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Subject: </span>
                    {emailSettings.subject}
                  </div>
                  <Separator />
                  <div className="text-sm whitespace-pre-wrap">{emailSettings.body}</div>
                  <div className="text-sm text-gray-500">
                    📎 Contract attached:{" "}
                    {selectedTemplate === "blank"
                      ? "Custom Contract"
                      : contractTemplates.find((t) => t.id === selectedTemplate)?.name || "Contract"}
                    .pdf
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard/contracts" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4" />
              Back to Contracts
            </Link>
            <div className="text-sm text-gray-500">
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-[#3C3CFF] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between">
            {stepTitles.map((title, index) => (
              <div
                key={index}
                className={`flex flex-col items-center ${
                  index + 1 <= currentStep ? "text-[#3C3CFF]" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    index + 1 <= currentStep ? "bg-[#3C3CFF] text-white" : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs font-medium hidden sm:block">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">{renderStepContent()}</div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="flex gap-3">
            {currentStep === totalSteps ? (
              <>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Eye className="h-4 w-4" />
                  Send Test to Self
                </Button>
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Contract
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                disabled={currentStep === 1 && !selectedTemplate}
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
