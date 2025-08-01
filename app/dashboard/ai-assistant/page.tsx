"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bot, Upload, FileText, Trash2, Edit3, Info, RotateCcw, Eye, Plus, X } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/layout"

export default function AIAssistantPage() {
  const [assistantName, setAssistantName] = useState("Ava")
  const [assistantRole, setAssistantRole] = useState("project-manager")
  const [showBranding, setShowBranding] = useState(true)
  const [tone, setTone] = useState("friendly")
  const [customTone, setCustomTone] = useState("")
  const [summarizeDocs, setSummarizeDocs] = useState(true)
  const [provideNextSteps, setProvideNextSteps] = useState(true)
  const [askFollowUp, setAskFollowUp] = useState(false)
  const [trustedSources, setTrustedSources] = useState(true)
  const [clientAwareness, setClientAwareness] = useState(true)
  const [portalMessages, setPortalMessages] = useState(false)
  const [customInstructions, setCustomInstructions] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState([
    { id: 1, name: "Company Guidelines.pdf", type: "PDF", tags: ["General"], lastUpdated: "2 days ago" },
    { id: 2, name: "Project Templates.docx", type: "DOCX", tags: ["Projects"], lastUpdated: "1 week ago" },
    { id: 3, name: "Billing Policies.txt", type: "TXT", tags: ["Billing"], lastUpdated: "3 days ago" },
  ])
  const [clientMemories, setClientMemories] = useState([
    { id: 1, client: "Acme Corp", fact: "Prefers invoices sent on Fridays", editable: false },
    { id: 2, client: "TechStart Inc", fact: "Often requests design previews in PDF format", editable: false },
    { id: 3, client: "Global Solutions", fact: "Requires detailed project timelines", editable: false },
  ])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      // Handle file upload logic here
      console.log("Files uploaded:", files)
    }
  }

  const deleteFile = (id: number) => {
    setUploadedFiles(uploadedFiles.filter((file) => file.id !== id))
  }

  const resetMemory = (clientId: number) => {
    setClientMemories(clientMemories.filter((memory) => memory.id !== clientId))
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* All the existing content remains exactly the same */}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>AI Assistant Settings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#3C3CFF]/10 rounded-lg">
                <Bot className="h-6 w-6 text-[#3C3CFF]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Assistant Settings</h1>
                <p className="text-gray-600">Configure how your AI assistant behaves and what it knows</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
              <Eye className="h-4 w-4" />
              <span>Preview Response Style</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              <span>Reset to Default</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Assistant Behavior & Personality */}
          <div className="space-y-6">
            {/* Assistant Name & Role */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Assistant Name & Role</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Set your assistant's identity and primary function</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="assistant-name">Assistant Name</Label>
                  <Input
                    id="assistant-name"
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    placeholder="e.g., Ava, Client Concierge"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="assistant-role">Assistant Role</Label>
                  <Select value={assistantRole} onValueChange={setAssistantRole}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project-manager">Project Manager</SelectItem>
                      <SelectItem value="billing-assistant">Billing Assistant</SelectItem>
                      <SelectItem value="creative-partner">Creative Partner</SelectItem>
                      <SelectItem value="client-success">Client Success Manager</SelectItem>
                      <SelectItem value="technical-support">Technical Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show assistant branding to clients</Label>
                    <p className="text-sm text-gray-500">Display name & avatar in messages</p>
                  </div>
                  <Switch checked={showBranding} onCheckedChange={setShowBranding} />
                </div>
              </CardContent>
            </Card>

            {/* Tone & Personality */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Tone & Personality</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Define how your assistant communicates</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="professional"
                      name="tone"
                      value="professional"
                      checked={tone === "professional"}
                      onChange={(e) => setTone(e.target.value)}
                      className="text-[#3C3CFF]"
                    />
                    <Label htmlFor="professional">Professional & Concise</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="friendly"
                      name="tone"
                      value="friendly"
                      checked={tone === "friendly"}
                      onChange={(e) => setTone(e.target.value)}
                      className="text-[#3C3CFF]"
                    />
                    <Label htmlFor="friendly">Friendly & Supportive</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="direct"
                      name="tone"
                      value="direct"
                      checked={tone === "direct"}
                      onChange={(e) => setTone(e.target.value)}
                      className="text-[#3C3CFF]"
                    />
                    <Label htmlFor="direct">Bold & Direct</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="custom"
                      name="tone"
                      value="custom"
                      checked={tone === "custom"}
                      onChange={(e) => setTone(e.target.value)}
                      className="text-[#3C3CFF]"
                    />
                    <Label htmlFor="custom">Custom</Label>
                  </div>

                  {tone === "custom" && (
                    <Textarea
                      value={customTone}
                      onChange={(e) => setCustomTone(e.target.value)}
                      placeholder="Describe the tone in your own words..."
                      className="mt-2"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Response Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Response Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Summarize long documents automatically</Label>
                    <p className="text-sm text-gray-500">Provide concise summaries of lengthy files</p>
                  </div>
                  <Switch checked={summarizeDocs} onCheckedChange={setSummarizeDocs} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Provide next steps when answering</Label>
                    <p className="text-sm text-gray-500">Include actionable recommendations</p>
                  </div>
                  <Switch checked={provideNextSteps} onCheckedChange={setProvideNextSteps} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ask follow-up questions if unsure</Label>
                    <p className="text-sm text-gray-500">Clarify ambiguous requests</p>
                  </div>
                  <Switch checked={askFollowUp} onCheckedChange={setAskFollowUp} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Only answer from trusted sources</Label>
                    <p className="text-sm text-gray-500">Use only uploaded knowledge base</p>
                  </div>
                  <Switch checked={trustedSources} onCheckedChange={setTrustedSources} />
                </div>
              </CardContent>
            </Card>

            {/* Client Awareness Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Client Awareness Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Make assistant aware of project status, invoices, and documents</Label>
                    <p className="text-sm text-gray-500">Access real-time client data for context</p>
                  </div>
                  <Switch checked={clientAwareness} onCheckedChange={setClientAwareness} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Allow assistant to respond in shared portal</Label>
                    <p className="text-sm text-gray-500">Coming soon - Direct client interaction</p>
                  </div>
                  <Switch checked={portalMessages} onCheckedChange={setPortalMessages} disabled />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Training Data & Memory */}
          <div className="space-y-6">
            {/* Knowledge Base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>Knowledge Base</span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Upload documents for your assistant to reference</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>
                  Upload documents to train your assistant. Accepted formats: PDF, DOCX, TXT, CSV
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#3C3CFF] transition-colors">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()}>
                    Choose Files
                  </Button>
                </div>

                {/* Uploaded Files */}
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">Updated {file.lastUpdated}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {file.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        <Button variant="ghost" size="sm">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Custom Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Instructions</CardTitle>
                <CardDescription>What should your assistant always remember?</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="We always deliver projects within 10 business days. We offer Net 30 billing terms. Our design process includes 3 revision rounds..."
                  rows={6}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Conversation Memory */}
            <Card>
              <CardHeader>
                <CardTitle>Conversation Memory (per client)</CardTitle>
                <CardDescription>Auto-generated facts your assistant remembers about each client</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {clientMemories.map((memory) => (
                  <div key={memory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{memory.client}</p>
                      <p className="text-sm text-gray-600">{memory.fact}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => resetMemory(memory.id)}>
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" className="w-full mt-4 bg-transparent">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Memory
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Mobile Sticky Footer */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button className="flex-1 bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
