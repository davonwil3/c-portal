"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  FileSignature,
  Settings,
  Pencil,
  Image as ImageIcon,
  Building2,
  User,
  DollarSign,
  Mail,
  Link as LinkIcon,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/layout"
import { getProjectWithClient } from "@/lib/projects"
import { createContract, getContract, updateContract } from "@/lib/contracts"
import { getClients } from "@/lib/clients"
import { getCurrentAccount } from "@/lib/auth"
import Image from "next/image"
import { JolixFooter } from "@/components/JolixFooter"

export default function NewContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams?.get("project")
  const editContractId = searchParams?.get("edit")
  const viewContractId = searchParams?.get("view")
  const isViewMode = !!viewContractId
  const isEditMode = !!editContractId
  
  // Contract state
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [contractTitle, setContractTitle] = useState("Service Agreement")
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState<{ plan_tier?: string } | null>(null)
  
  // Load project data if coming from a project
  useEffect(() => {
    if (projectId) {
      loadProjectData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // Load account data
  useEffect(() => {
    const loadAccount = async () => {
      try {
        const accountData = await getCurrentAccount()
        if (accountData) {
          setAccount(accountData)
        }
      } catch (error) {
        console.error('Error loading account:', error)
      }
    }
    loadAccount()
  }, [])

  // Load contract data if editing or viewing
  useEffect(() => {
    if (editContractId || viewContractId) {
      loadContractData(editContractId || viewContractId!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editContractId, viewContractId])
  
  const loadProjectData = async () => {
    if (!projectId) return
    
    try {
      setLoading(true)
      const { project, client } = await getProjectWithClient(projectId)
      
      if (project) {
        // Pre-fill project name with the actual project name from database
        setProjectName(project.name || "")
      }
    } catch (error) {
      console.error("Error loading project data:", error)
      toast.error("Failed to load project data")
    } finally {
      setLoading(false)
    }
  }

  const loadContractData = async (contractId: string) => {
    try {
      setLoading(true)
      const contract = await getContract(contractId)
      
      if (!contract) {
        toast.error("Contract not found")
        router.push("/dashboard/contracts")
        return
      }

      const content = contract.contract_content || {}
      
      // Load all contract data into state
      setContractTitle(contract.name || "Service Agreement")
      setProjectName(content.projectName || "")
      setClientName(content.clientName || "")
      
      // Branding
      if (content.branding) {
        setBrandColor(content.branding.brandColor || "#3C3CFF")
        setAccentColor(content.branding.accentColor || "#6366F1")
        setLogoUrl(content.branding.logoUrl || "")
        setShowLogo(content.branding.showLogo ?? true)
        setShowAddress(content.branding.showAddress ?? true)
      }
      
      // Company info
      if (content.company) {
        setCompanyName(content.company.name || "")
        setCompanyEmail(content.company.email || "")
        setCompanyAddress(content.company.address || "")
      }
      
      // Client info
      if (content.client) {
        setClientEmail(content.client.email || "")
        setClientCompany(content.client.company || "")
        setClientAddress(content.client.address || "")
        setLoadedClientName(content.client.name || "")
      }
      
      // Contract specifics
      if (content.terms) {
        setRevisionCount(content.terms.revisionCount || "2")
        setHourlyRate(content.terms.hourlyRate || "150")
        setLateFee(content.terms.lateFee || "5")
        setLateDays(content.terms.lateDays || "15")
        setIncludeLateFee(content.terms.includeLateFee ?? true)
        setIncludeHourlyClause(content.terms.includeHourlyClause ?? true)
        setClientSignatureName(content.terms.clientSignatureName || "")
        setYourName(content.terms.yourName || "")
        setYourSignatureDate(content.terms.yourSignatureDate || "")
        setClientSignatureDate(content.terms.clientSignatureDate || "")
        setEstimatedCompletionDate(content.terms.estimatedCompletionDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        setProjectTotal(content.terms.projectTotal || "0")
        setPaymentSchedule(content.terms.paymentSchedule || "single")
      }
      
      // Payment plan
      if (content.paymentPlan) {
        setPaymentPlanEnabled(content.paymentPlan.enabled || false)
        setPaymentPlanType(content.paymentPlan.type || "50-50")
        setCustomPaymentsCount(content.paymentPlan.customPaymentsCount || 3)
        setCustomEqualSplit(content.paymentPlan.customEqualSplit ?? true)
        setCustomPaymentAmounts(content.paymentPlan.customPaymentAmounts || ["0", "0", "0"])
        setMilestonesCount(content.paymentPlan.milestonesCount || 4)
        setMilestonesEqualSplit(content.paymentPlan.milestonesEqualSplit ?? true)
        setMilestones(content.paymentPlan.milestones || [
          { id: "m1", name: "Discovery", amount: "0" },
          { id: "m2", name: "Design", amount: "0" },
          { id: "m3", name: "Development", amount: "0" },
          { id: "m4", name: "Launch", amount: "0" },
        ])
      }
      
      // Scope
      if (content.scope) {
        setDeliverables(content.scope.deliverables || "")
        setTimeline(content.scope.timeline || "")
      }
      
    } catch (error) {
      console.error("Error loading contract data:", error)
      toast.error("Failed to load contract data")
      router.push("/dashboard/contracts")
    } finally {
      setLoading(false)
    }
  }
  
  // Branding
  const [brandColor, setBrandColor] = useState("#3C3CFF")
  const [accentColor, setAccentColor] = useState("#6366F1")
  const [logoUrl, setLogoUrl] = useState("")
  const [showLogo, setShowLogo] = useState(true)
  const [showAddress, setShowAddress] = useState(true)
  
  // Company info
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  
  // Client info
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  
  // Contract specifics
  const [revisionCount, setRevisionCount] = useState("2")
  const [hourlyRate, setHourlyRate] = useState("150")
  const [lateFee, setLateFee] = useState("5")
  const [lateDays, setLateDays] = useState("15")
  const [includeLateFee, setIncludeLateFee] = useState(true)
  const [includeHourlyClause, setIncludeHourlyClause] = useState(true)
  const [clientSignatureName, setClientSignatureName] = useState("")
  const [yourName, setYourName] = useState("")
  const [yourSignatureDate, setYourSignatureDate] = useState<string>("")
  const [clientSignatureDate, setClientSignatureDate] = useState<string>("")
  const [loadedClientName, setLoadedClientName] = useState<string>("")
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [projectTotal, setProjectTotal] = useState("0")
  const [paymentSchedule, setPaymentSchedule] = useState("single")
  
  // Payment plan settings (matching proposal page)
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
  
  // Scope & deliverables
  const [deliverables, setDeliverables] = useState("")
  const [timeline, setTimeline] = useState("")
  const [showPreview, setShowPreview] = useState(false)
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendMethod, setSendMethod] = useState<"portal" | "email" | "link" | null>(null)
  
  const openLogoPicker = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const el = document.getElementById("logoUpload") as HTMLInputElement | null
    if (el) {
      el.click()
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const saveContract = async (status: "draft" | "sent" = "draft") => {
    // If in view mode, don't save
    if (isViewMode) {
      toast.info("View mode - contract cannot be saved")
      return
    }
    // Build contract content JSON from all state
    const contractContent = {
      // Basic info
      title: contractTitle,
      projectName,
      clientName,
      
      // Branding
      branding: {
        brandColor,
        accentColor,
        logoUrl,
        showLogo,
        showAddress,
      },
      
      // Company info
      company: {
        name: companyName,
        email: companyEmail,
        address: companyAddress,
      },
      
      // Client info
      client: {
        name: clientName,
        email: clientEmail,
        company: clientCompany,
        address: clientAddress,
      },
      
      // Contract specifics
      terms: {
        revisionCount,
        hourlyRate,
        lateFee,
        lateDays,
        includeLateFee,
        includeHourlyClause,
        clientSignatureName,
        yourName,
        estimatedCompletionDate,
        projectTotal,
        paymentSchedule,
      },
      
      // Payment plan
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
      
      // Scope
      scope: {
        deliverables,
        timeline,
      },
    }

    // Try to find client_id from clientName
    let clientId: string | undefined = undefined
    if (clientName) {
      try {
        const clients = await getClients()
        const matchingClient = clients.find(client => {
          const fullName = `${client.first_name} ${client.last_name}`.trim()
          const company = client.company || ""
          return fullName === clientName || company === clientName || 
                 client.email === clientEmail
        })
        if (matchingClient) {
          clientId = matchingClient.id
        }
      } catch (error) {
        console.warn("Could not find client:", error)
      }
    }

    // Calculate total value
    const totalValue = parseFloat(projectTotal || "0") || 0

    // Build payment terms string
    const paymentScheduleArray = getPaymentSchedule()
    const paymentTerms = paymentPlanEnabled
      ? paymentScheduleArray.map((amount, index) => 
          `Payment ${index + 1}: $${amount.toFixed(2)}`
        ).join(", ")
      : `Single payment: $${totalValue.toFixed(2)}`

    // Create contract data
    const contractData = {
      name: contractTitle || "Service Agreement",
      description: deliverables || `Contract for ${clientName || "client"}`,
      contract_content: contractContent,
      contract_type: "custom" as const,
      client_id: clientId,
      project_id: projectId || undefined,
      status: status,
      total_value: totalValue > 0 ? totalValue : undefined,
      currency: "USD",
      payment_terms: paymentTerms,
      start_date: estimatedCompletionDate ? new Date(estimatedCompletionDate).toISOString() : undefined,
      metadata: {
        revisionCount,
        hourlyRate,
        lateFee,
        lateDays,
        includeLateFee,
        includeHourlyClause,
      },
    }

    // Update existing contract if editing, otherwise create new
    if (isEditMode && editContractId) {
      const contract = await updateContract(editContractId, contractData)
      return contract
    } else {
      const contract = await createContract(contractData)
      return contract
    }
  }

  const handleSaveDraft = async () => {
    try {
      setLoading(true)
      await saveContract("draft")
      toast.success("Contract saved as draft")
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save contract draft")
    } finally {
      setLoading(false)
    }
  }

  const handleSendContract = () => {
    setShowSendModal(true)
  }

  const handleConfirmSend = async () => {
    try {
      setLoading(true)
      
      if (sendMethod === "portal") {
        await saveContract("sent")
        toast.success("Contract saved to client portal")
      } else if (sendMethod === "email") {
        await saveContract("sent")
        toast.success("Contract sent to client via email")
      } else if (sendMethod === "link") {
        await saveContract("sent")
        toast.success("Contract link generated and copied to clipboard")
      }
      
      // Navigate back to project details page if we came from a project, otherwise go to contracts page
      if (projectId) {
        router.push(`/dashboard/projects/${projectId}`)
      } else {
        router.push("/dashboard/contracts")
      }
    } catch (error) {
      console.error("Error saving contract:", error)
      toast.error("Failed to save contract")
    } finally {
      setLoading(false)
      setShowSendModal(false)
      setSendMethod(null)
    }
  }

  // Payment schedule helpers (from proposal page)
  const total = parseFloat(projectTotal || "0")
  
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

  const getPaymentSchedule = React.useCallback((): number[] => {
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

        return (
    <DashboardLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Header - Top */}
        <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-50 flex items-center justify-between px-6" data-help="contract-builder-header">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
              data-help="btn-back"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div>
              <h1 className="font-semibold text-gray-900">
                {isViewMode ? "View Contract" : isEditMode ? "Edit Contract" : "New Contract"}
              </h1>
              <p className="text-xs text-gray-500">
                {projectId ? `For ${projectName || "project"}` : isViewMode ? "View contract details" : isEditMode ? "Edit contract details" : "Create a service agreement"}
              </p>
            </div>
            </div>

          <div className="flex items-center gap-2" data-help="contract-actions">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            {!isViewMode && (
              <>
                <Button variant="outline" size="sm" onClick={handleSaveDraft}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={handleSendContract}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Contract
                </Button>
              </>
            )}
                    </div>
                  </div>

        {/* Contract Preview - CENTER */}
        <div className="flex-1 pt-16" data-help="contract-preview">
          <ScrollArea className="h-full">
            <div className="max-w-6xl mx-auto p-12">
              <div className="bg-white shadow-sm overflow-hidden px-16 py-16 space-y-8 flex flex-col" style={{ fontFamily: 'Georgia, serif' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  {showLogo ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-32 h-32 rounded-lg flex items-center justify-center transition-all ${
                              logoUrl 
                                ? 'relative cursor-pointer group border-2 border-transparent hover:border-gray-300 hover:shadow-md' 
                                : 'border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400 hover:bg-gray-100'
                            }`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              openLogoPicker(e)
                            }}
                          >
                            {logoUrl ? (
                              <>
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/10 rounded-lg" />
                                <div className="absolute top-1 right-1 bg-white/95 rounded p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Pencil className="h-3.5 w-3.5 text-gray-700" />
                  </div>
                              </>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1 group-hover:text-gray-500 transition-colors" />
                                <span className="text-xs text-gray-500">Logo</span>
                  </div>
                            )}
                </div>
                        </TooltipTrigger>
                        {logoUrl && (
                          <TooltipContent>
                            <p>Click to replace logo</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="w-32" />
                  )}
                  {/* Hidden file input for logo upload */}
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="text-right text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="font-semibold text-gray-900">{companyName || "{your_company_name}"}</div>
                    <div className="text-gray-600">{companyEmail || "{your_email}"}</div>
                    {showAddress && (
                      <div className="text-gray-600 text-xs">{companyAddress || "{your_address}"}</div>
                                  )}
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
                      {deliverables ? (
                        <div className="whitespace-pre-wrap ml-4">{deliverables}</div>
                      ) : (
                        <p className="text-gray-500 italic ml-4">Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support</p>
                      )}
                      <p><strong>Start Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p><strong>Estimated Completion:</strong> {new Date(estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
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
                      <p><strong>Total Project Fee:</strong> ${parseFloat(projectTotal || "0").toLocaleString()} USD</p>
                      {paymentPlanEnabled ? (
                        <>
                          {paymentPlanType === "milestone" ? (
                            <>
                              <p><strong>Payment Schedule:</strong> Milestone-based billing. You will be invoiced at each milestone; no full upfront payment is required.</p>
                              <ul className="ml-4 space-y-1 list-disc">
                                {milestones.slice(0, milestonesCount).map((m, i) => (
                                  <li key={m.id}>{m.name || `Milestone ${i+1}`}: ${Number(m.amount || 0).toLocaleString()} USD</li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <>
                              <p><strong>Payment Schedule:</strong> The total fee will be paid in {getPaymentSchedule().length} payment(s) as follows:</p>
                              <ul className="ml-4 space-y-1 list-disc">
                                {getPaymentSchedule().map((amt, idx) => (
                                  <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()} USD</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      ) : (
                        <p><strong>Payment Schedule:</strong> Full payment due upon project completion.</p>
                      )}
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
                        <div className="text-xs font-semibold text-gray-700 mb-4">Service Provider</div>
                        <div className="space-y-3">
                    <div>
                            <div className="text-xs text-gray-600 mb-1">Name:</div>
                            <div className="text-sm text-gray-900">{yourName || "Your Name"}</div>
                    </div>
                    <div>
                            <div className="text-xs text-gray-600 mb-1">Date:</div>
                            <div className="text-sm text-gray-900">
                              {yourSignatureDate ? new Date(yourSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                            </div>
                    </div>
                    <div>
                            <div className="text-xs text-gray-600 mb-1">Signature:</div>
                            <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                              {yourName || "Your Name"}
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
                            <div className="text-sm text-gray-900">
                              {loadedClientName && loadedClientName !== "{client_name}" ? loadedClientName : '_______________'}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600 mb-1">Date:</div>
                            <div className="text-sm text-gray-900">
                              {clientSignatureDate ? new Date(clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                            </div>
                        </div>
                          
                        <div>
                            <div className="text-xs text-gray-600 mb-2">Signature:</div>
                            <div className="text-2xl text-gray-900 pb-1" style={{ fontFamily: "'Dancing Script', cursive", minHeight: '32px' }}>
                              {clientSignatureName && clientSignatureName.trim() !== '' ? clientSignatureName : <>&nbsp;</>}
                            </div>
                      </div>
                        </div>
                        </div>
                </div>
            </div>
                    </div>
                    <JolixFooter planTier={account?.plan_tier} />
                </div>
            </div>
          </ScrollArea>
                    </div>

        {/* Settings Panel - RIGHT */}
        {!isViewMode && (
        <div className="w-96 border-l bg-white overflow-hidden flex flex-col pt-16" data-help="contract-settings">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Contract Settings Header */}
                    <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileSignature className="h-5 w-5 text-[#3C3CFF]" />
                  <h2 className="font-semibold text-gray-900">Contract Settings</h2>
                    </div>
              </div>

              {/* Basic Info */}
              <Accordion type="single" collapsible defaultValue="basic">
                <AccordionItem value="basic">
                  <AccordionTrigger className="text-sm font-medium">
                  <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Basic Information
                  </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="contractTitle">Contract Title</Label>
                      <Input
                        id="contractTitle"
                        value={contractTitle}
                        onChange={(e) => setContractTitle(e.target.value)}
                        placeholder="Service Agreement"
                      />
                </div>
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="John Doe"
                          />
                        </div>
                    {projectId && (
                      <div className="space-y-2">
                        <Label htmlFor="projectNameBasic">Project Name</Label>
                        <Input
                          id="projectNameBasic"
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="Enter project name"
                        />
                        <p className="text-xs text-gray-500">Project name from the connected project (editable)</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Company Info */}
                <AccordionItem value="company">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Your Company
                          </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                              <Input
                        id="companyName"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your Company LLC"
                              />
                        </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                              <Input
                        id="companyEmail"
                        type="email"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        placeholder="hello@yourcompany.com"
                              />
                          </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Company Address</Label>
                        <Textarea
                        id="companyAddress"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        placeholder="456 Business Ave, City, State ZIP"
                        rows={2}
                        />
                      </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showAddress">Show Address on Contract</Label>
                      <Switch
                        id="showAddress"
                        checked={showAddress}
                        onCheckedChange={setShowAddress}
                              />
                            </div>
                    <div className="space-y-2">
                      <Label htmlFor="yourName">Your Full Name</Label>
                              <Input
                        id="yourName"
                        value={yourName}
                        onChange={(e) => setYourName(e.target.value)}
                        placeholder="Jane Smith"
                              />
                            </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Scope & Deliverables */}
                <AccordionItem value="scope">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <FileSignature className="h-4 w-4" />
                      Scope & Deliverables
                          </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Project Name</Label>
                              <Input
                        id="projectName"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Enter project name"
                      />
                      <p className="text-xs text-gray-500">This will appear in the Project Summary section</p>
                            </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliverables">Deliverables</Label>
                          <Textarea
                        id="deliverables"
                        value={deliverables}
                        onChange={(e) => setDeliverables(e.target.value)}
                        placeholder="List all deliverables..."
                        rows={6}
                              />
                            </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline Details</Label>
                          <Textarea
                        id="timeline"
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        placeholder="Describe the timeline..."
                        rows={4}
                          />
                        </div>
                    <div className="space-y-2">
                      <Label htmlFor="completionDate">Estimated Completion</Label>
                      <Input
                        id="completionDate"
                        type="date"
                        value={estimatedCompletionDate}
                        onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                        />
                      </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Payment Terms */}
                <AccordionItem value="payment">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Payment Terms
                      </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectTotal">Project Total ($)</Label>
                      <Input
                        id="projectTotal"
                        type="number"
                        value={projectTotal}
                        onChange={(e) => setProjectTotal(e.target.value)}
                        placeholder="5000"
                      />
                    </div>

                          <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs">Payment Plans</Label>
                        <Switch checked={paymentPlanEnabled} onCheckedChange={setPaymentPlanEnabled} />
                          </div>
                      {paymentPlanEnabled && (
                        <Select value={paymentPlanType} onValueChange={(v) => {
                          setPaymentPlanType(v)
                          if (v === "custom") {
                            // initialize custom amounts
                            const count = customPaymentsCount
                            const equal = Math.max(Math.floor((total / count) * 100) / 100, 0)
                            setCustomPaymentAmounts(Array.from({ length: count }, () => equal.toString()))
                          } else if (v === "milestone") {
                            // initialize milestones
                            const count = milestonesCount
                            const eq = getEqualAmounts(total, count)
                            setMilestones(prev => Array.from({ length: count }).map((_, i) => ({
                              id: `m${i+1}`,
                              name: prev[i]?.name || ["Discovery", "Design", "Development", "Launch"][i] || `Milestone ${i+1}`,
                              amount: eq[i]?.toString() || "0"
                            })))
                            setMilestonesEqualSplit(true)
                          }
                        }}>
                          <SelectTrigger className="text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                            <SelectItem value="50-50">50/50 Split</SelectItem>
                            <SelectItem value="33-33-33">3 Equal Payments</SelectItem>
                            <SelectItem value="milestone">Milestone Based</SelectItem>
                            <SelectItem value="custom">Custom Plan</SelectItem>
                              </SelectContent>
                            </Select>
                      )}
                    </div>

                    {/* Custom payment plan editor */}
                    {paymentPlanEnabled && paymentPlanType === "custom" && (
                          <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Number of Payments</Label>
                            <Input
                              type="number"
                              min={1}
                              value={customPaymentsCount}
                              onChange={(e) => {
                                const next = Math.max(1, parseInt(e.target.value || "1"))
                                setCustomPaymentsCount(next)
                                const equal = Math.max(Math.floor((total / next) * 100) / 100, 0)
                                if (customEqualSplit) {
                                  setCustomPaymentAmounts(Array.from({ length: next }, () => equal.toString()))
                                } else {
                                  setCustomPaymentAmounts(Array.from({ length: next }, (_, i) => customPaymentAmounts[i] || "0"))
                                }
                              }}
                              className="mt-1"
                            />
                              </div>
                          <div className="flex items-end gap-2">
                            <div className="flex items-center justify-between w-full">
                              <Label className="text-xs">Equal Split</Label>
                              <Switch
                                checked={customEqualSplit}
                                onCheckedChange={(checked) => {
                                  setCustomEqualSplit(!!checked)
                                  const next = customPaymentsCount
                                  const equal = Math.max(Math.floor((total / next) * 100) / 100, 0)
                                  if (checked) {
                                    setCustomPaymentAmounts(Array.from({ length: next }, () => equal.toString()))
                                  }
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        {!customEqualSplit && (
                          <div className="space-y-2">
                            <Label className="text-xs">Amounts</Label>
                            {Array.from({ length: customPaymentsCount }).map((_, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-16">Payment {i + 1}</span>
                                <Input
                                  type="text"
                                  inputMode="decimal"
                                  pattern="[0-9]*\.?[0-9]*"
                                  value={customPaymentAmounts[i] || ""}
                                  onChange={(e) => {
                                    const next = [...customPaymentAmounts]
                                    next[i] = e.target.value
                                    setCustomPaymentAmounts(next)
                                  }}
                              />
                            </div>
                            ))}
                              </div>
                            )}
                          </div>
                    )}

                    {/* Milestone payment plan editor */}
                    {paymentPlanEnabled && paymentPlanType === "milestone" && (
                          <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Number of Milestones</Label>
                            <Input
                              type="number"
                              min={1}
                              value={milestonesCount}
                              onChange={(e) => {
                                const next = Math.max(1, parseInt(e.target.value || "1"))
                                setMilestonesCount(next)
                                const eq = getEqualAmounts(total, next)
                                if (milestonesEqualSplit) {
                                  setMilestones(Array.from({ length: next }).map((_, i) => ({
                                    id: `m${i+1}`,
                                    name: milestones[i]?.name || `Milestone ${i+1}`,
                                    amount: eq[i]?.toString() || "0"
                                  })))
                                } else {
                                  setMilestones(Array.from({ length: next }).map((_, i) => ({
                                    id: `m${i+1}`,
                                    name: milestones[i]?.name || `Milestone ${i+1}`,
                                    amount: milestones[i]?.amount || "0"
                                  })))
                                }
                              }}
                              className="mt-1"
                            />
                              </div>
                          <div className="flex items-end gap-2">
                            <div className="flex items-center justify-between w-full">
                              <Label className="text-xs">Equal Split</Label>
                              <Switch
                                checked={milestonesEqualSplit}
                                onCheckedChange={(checked) => {
                                  setMilestonesEqualSplit(!!checked)
                                  if (checked) {
                                    const eq = getEqualAmounts(total, milestonesCount)
                                    setMilestones(prev => prev.map((m, i) => ({ ...m, amount: eq[i]?.toString() || "0" })))
                                  }
                                }}
                              />
                            </div>
                              </div>
                          </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Milestones</Label>
                          {Array.from({ length: milestonesCount }).map((_, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center">
                              <Input
                                className="col-span-7"
                                placeholder={`Milestone ${i+1} name`}
                                value={milestones[i]?.name || ""}
                                onChange={(e) => setMilestones(prev => {
                                  const next = [...prev]
                                  next[i] = next[i] || { id: `m${i+1}`, name: "", amount: "0" }
                                  next[i].name = e.target.value
                                  return next
                                })}
                              />
                              <Input
                                className="col-span-5"
                                type="text"
                                inputMode="decimal"
                                pattern="[0-9]*\.?[0-9]*"
                                placeholder="Amount"
                                value={milestones[i]?.amount || ""}
                                disabled={milestonesEqualSplit}
                                onChange={(e) => setMilestones(prev => {
                                  const next = [...prev]
                                  next[i] = next[i] || { id: `m${i+1}`, name: `Milestone ${i+1}`, amount: "0" }
                                  next[i].amount = e.target.value
                                  return next
                                })}
                              />
                        </div>
                          ))}
                      </div>
                    </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeLateFee">Include Late Fee</Label>
                      <Switch
                        id="includeLateFee"
                        checked={includeLateFee}
                        onCheckedChange={setIncludeLateFee}
                      />
                    </div>
                    {includeLateFee && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="lateFee">Late Fee (%)</Label>
                          <Input
                            id="lateFee"
                            type="number"
                            value={lateFee}
                            onChange={(e) => setLateFee(e.target.value)}
                            placeholder="5"
                          />
                  </div>
                        <div className="space-y-2">
                          <Label htmlFor="lateDays">Grace Period (days)</Label>
                          <Input
                            id="lateDays"
                            type="number"
                            value={lateDays}
                            onChange={(e) => setLateDays(e.target.value)}
                            placeholder="15"
                          />
                </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Revisions & Changes */}
                <AccordionItem value="revisions">
                  <AccordionTrigger className="text-sm font-medium">
                    Revisions & Rates
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="revisionCount">Included Revisions</Label>
                  <Input
                        id="revisionCount"
                        type="number"
                        value={revisionCount}
                        onChange={(e) => setRevisionCount(e.target.value)}
                        placeholder="2"
                  />
                </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="includeHourlyClause">Include Hourly Rate Clause</Label>
                    <Switch
                        id="includeHourlyClause"
                        checked={includeHourlyClause}
                        onCheckedChange={setIncludeHourlyClause}
                      />
                    </div>
                    {includeHourlyClause && (
                      <div className="space-y-2">
                        <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(e.target.value)}
                          placeholder="150"
                        />
                  </div>
                )}
                  </AccordionContent>
                </AccordionItem>

                {/* Branding */}
                <AccordionItem value="branding">
                  <AccordionTrigger className="text-sm font-medium">
                    Branding & Logo
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="showLogo">Show Logo</Label>
                      <Switch
                        id="showLogo"
                        checked={showLogo}
                        onCheckedChange={setShowLogo}
                      />
                        </div>
                    <div className="space-y-2">
                      <Label>Upload Logo</Label>
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                        <Button
                          variant="outline"
                          size="sm"
                        onClick={openLogoPicker}
                        className="w-full"
                        >
                        Choose File
                        </Button>
                      </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
                    </div>
          </ScrollArea>
                    </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle>Contract Preview</DialogTitle>
          </DialogHeader>
          
          {/* Banner */}
          <div className="px-6 pt-4 pb-2 bg-blue-50 border-b border-blue-200 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Eye className="h-4 w-4" />
              <p className="font-medium">This is how it will look to the client</p>
                      </div>
                      </div>

          {/* Contract Preview Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            <div className="p-12">
              <div className="bg-white shadow-sm overflow-hidden px-16 py-16 space-y-8 flex flex-col" style={{ fontFamily: 'Georgia, serif' }}>
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  {showLogo ? (
                    <div className="w-32 h-32 rounded-lg flex items-center justify-center border-2 border-gray-300 bg-gray-50">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1" />
                          <span className="text-xs text-gray-500">Logo</span>
                      </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-32" />
                  )}
                  <div className="text-right text-sm space-y-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="font-semibold text-gray-900">{companyName || "{your_company_name}"}</div>
                    <div className="text-gray-600">{companyEmail || "{your_email}"}</div>
                    {showAddress && (
                      <div className="text-gray-600 text-xs">{companyAddress || "{your_address}"}</div>
                    )}
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
                      {deliverables ? (
                        <div className="whitespace-pre-wrap ml-4">{deliverables}</div>
                      ) : (
                        <p className="text-gray-500 italic ml-4">Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support</p>
                      )}
                      <p><strong>Start Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      <p><strong>Estimated Completion:</strong> {new Date(estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
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
                      <p><strong>Total Project Fee:</strong> ${parseFloat(projectTotal || "0").toLocaleString()} USD</p>
                      {paymentPlanEnabled ? (
                        <>
                          {paymentPlanType === "milestone" ? (
                            <>
                              <p><strong>Payment Schedule:</strong> Milestone-based billing. You will be invoiced at each milestone; no full upfront payment is required.</p>
                              <ul className="ml-4 space-y-1 list-disc">
                                {milestones.slice(0, milestonesCount).map((m, i) => (
                                  <li key={m.id}>{m.name || `Milestone ${i+1}`}: ${Number(m.amount || 0).toLocaleString()} USD</li>
                                ))}
                              </ul>
                            </>
                          ) : (
                            <>
                              <p><strong>Payment Schedule:</strong> The total fee will be paid in {getPaymentSchedule().length} payment(s) as follows:</p>
                              <ul className="ml-4 space-y-1 list-disc">
                                {getPaymentSchedule().map((amt, idx) => (
                                  <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()} USD</li>
                                ))}
                              </ul>
                            </>
                          )}
                        </>
                      ) : (
                        <p><strong>Payment Schedule:</strong> Full payment due upon project completion.</p>
                      )}
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
                        <div className="text-xs font-semibold text-gray-700 mb-4">Service Provider</div>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Name:</div>
                            <div className="text-sm text-gray-900">{yourName || "Your Name"}</div>
                            </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Date:</div>
                            <div className="text-sm text-gray-900">
                              {yourSignatureDate ? new Date(yourSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                            </div>
                        </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Signature:</div>
                            <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                              {yourName || "Your Name"}
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
                            <div className="text-sm text-gray-900">
                              {loadedClientName && loadedClientName !== "{client_name}" ? loadedClientName : '_______________'}
                            </div>
                </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Date:</div>
                            <div className="text-sm text-gray-900">
                              {clientSignatureDate ? new Date(clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                            </div>
            </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">Signature:</div>
                            <div className="text-2xl text-gray-900 pb-1" style={{ fontFamily: "'Dancing Script', cursive", minHeight: '32px' }}>
                              {clientSignatureName && clientSignatureName.trim() !== '' ? clientSignatureName : <>&nbsp;</>}
                </div>
            </div>
                </div>
            </div>
                    </div>
                    </div>
                    <JolixFooter planTier={account?.plan_tier} />
                </div>
            </div>
        </div>
        </div>
        </DialogContent>
      </Dialog>

      {/* Send Contract Modal */}
      <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Send Contract</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              All contracts will be saved to client portal automatically.
            </p>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSendMethod("portal")}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  sendMethod === "portal"
                    ? "border-[#3C3CFF] bg-[#3C3CFF]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  sendMethod === "portal" ? "bg-[#3C3CFF]" : "bg-gray-100"
                }`}>
                  <LinkIcon className={`h-5 w-5 ${
                    sendMethod === "portal" ? "text-white" : "text-gray-600"
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Send to Client Portal only</div>
                  <div className="text-sm text-gray-500">Contract will be available in the client portal</div>
              </div>
              </button>

              <button
                type="button"
                onClick={() => setSendMethod("email")}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  sendMethod === "email"
                    ? "border-[#3C3CFF] bg-[#3C3CFF]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  sendMethod === "email" ? "bg-[#3C3CFF]" : "bg-gray-100"
                }`}>
                  <Mail className={`h-5 w-5 ${
                    sendMethod === "email" ? "text-white" : "text-gray-600"
                  }`} />
            </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Send by Email</div>
                  <div className="text-sm text-gray-500">Contract will be sent directly to the client's email</div>
          </div>
              </button>

              <button
                type="button"
                onClick={() => setSendMethod("link")}
                className={`w-full flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  sendMethod === "link"
                    ? "border-[#3C3CFF] bg-[#3C3CFF]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  sendMethod === "link" ? "bg-[#3C3CFF]" : "bg-gray-100"
                }`}>
                  <LinkIcon className={`h-5 w-5 ${
                    sendMethod === "link" ? "text-white" : "text-gray-600"
                  }`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">Send a Link</div>
                  <div className="text-sm text-gray-500">Generate a shareable link for the contract</div>
              </div>
              </button>
          </div>
        </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
              onClick={() => {
                setShowSendModal(false)
                setSendMethod(null)
              }}
            >
              Cancel
          </Button>
                <Button 
              onClick={handleConfirmSend}
              disabled={!sendMethod}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
                    <Send className="h-4 w-4 mr-2" />
              Send
                </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
