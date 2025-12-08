"use client"

import React, { useState } from "react"
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
  Copy,
  Trash2,
  Upload,
  Plus,
  X,
  Palette,
  Building2,
  User,
  DollarSign,
  Settings,
  FileText,
  FileSignature,
  Receipt,
  Pencil,
  Check,
  Image as ImageIcon,
} from "lucide-react"
import { toast } from "sonner"
import { DashboardLayout } from "@/components/dashboard/layout"

type DocumentStatus = "Draft" | "Sent" | "Viewed" | "Accepted"

export default function DocumentSuitePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Suite-level state
  const [clientName, setClientName] = useState("")
  const [projectName, setProjectName] = useState("")
  const [status, setStatus] = useState<DocumentStatus>("Draft")
  
  // Document toggles
  const [proposalEnabled, setProposalEnabled] = useState(true)
  const [contractEnabled, setContractEnabled] = useState(true)
  const [invoiceEnabled, setInvoiceEnabled] = useState(true)
  
  // Active document
  const [activeDoc, setActiveDoc] = useState("proposal")
  
  // Branding
  const [brandColor, setBrandColor] = useState("#3C3CFF")
  const [accentColor, setAccentColor] = useState("#6366F1")
  const [logoUrl, setLogoUrl] = useState("")
  const [showLogo, setShowLogo] = useState(true)
  
  // Company info
  const [companyName, setCompanyName] = useState("")
  const [companyEmail, setCompanyEmail] = useState("")
  const [companyAddress, setCompanyAddress] = useState("")
  
  // Client info
  const [clientEmail, setClientEmail] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  
  // Payment settings
  const [currency, setCurrency] = useState("USD")
  const [taxRate, setTaxRate] = useState("10")
  const [paymentDueDays, setPaymentDueDays] = useState(30)
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
  
  // Proposal content
  const [proposalTitle, setProposalTitle] = useState("Proposal for Sarah Johnson")
  const [proposalSubtitle, setProposalSubtitle] = useState("")
  const [clientGoals, setClientGoals] = useState("")
  const [successOutcome, setSuccessOutcome] = useState("")
  const [deliverables, setDeliverables] = useState("")
  const [timeline, setTimeline] = useState("")
  // Editable section headings
  const [labelGoals, setLabelGoals] = useState("Your Goals")
  const [labelSuccess, setLabelSuccess] = useState("What Success Looks Like")
  const [labelScope, setLabelScope] = useState("Scope & Deliverables")
  const [labelTimeline, setLabelTimeline] = useState("Project Timeline")
  const [labelInvestment, setLabelInvestment] = useState("Investment")
  const [autoTitle, setAutoTitle] = useState(true)

  const openLogoPicker = () => {
    const el = document.getElementById("logoUpload") as HTMLInputElement | null
    el?.click()
  }

  // Prefill from query params when arriving from lead picker/custom details
  React.useEffect(() => {
    if (!searchParams) return
    const qClientName = searchParams.get("clientName")
    const qClientCompany = searchParams.get("clientCompany")
    const qClientEmail = searchParams.get("clientEmail")
    if (qClientName) setClientName(qClientName)
    if (qClientCompany) setClientCompany(qClientCompany)
    if (qClientEmail) setClientEmail(qClientEmail)
  }, [searchParams])

  // Keep title in sync with clientName until user edits it
  React.useEffect(() => {
    if (autoTitle) {
      setProposalTitle(`Proposal for ${clientName}`)
    }
  }, [clientName, autoTitle])
  
  // Pricing
  const [pricingItems, setPricingItems] = useState<Array<{ id: string; name: string; description: string; price: string }>>([])
  const [addons, setAddons] = useState([
    { id: "1", name: "", price: "", selected: false },
  ])
  
  // Contract
  const [revisionCount, setRevisionCount] = useState("2")
  const [hourlyRate, setHourlyRate] = useState("150")
  const [lateFee, setLateFee] = useState("5")
  const [lateDays, setLateDays] = useState("15")
  const [includeLateFee, setIncludeLateFee] = useState(true)
  const [includeHourlyClause, setIncludeHourlyClause] = useState(true)
  const [clientSignatureName, setClientSignatureName] = useState("")
  const [yourName, setYourName] = useState("")
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState<string>(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  
  // Invoice
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [invoiceIssueDate, setInvoiceIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceDueDate, setInvoiceDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  // Edit states
  const [editingField, setEditingField] = useState<string | null>(null)
  
  // Calculations
  const subtotal = pricingItems.reduce((sum, item) => sum + parseFloat(item.price || "0"), 0) +
    addons.filter(a => a.selected).reduce((sum, addon) => sum + parseFloat(addon.price || "0"), 0)
  const tax = subtotal * (parseFloat(taxRate) / 100)
  const total = subtotal + tax

  // Payment schedule helpers
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

  const firstPayment = React.useMemo(() => {
    const schedule = getPaymentSchedule()
    return schedule[0] || 0
  }, [getPaymentSchedule])

  // Date format helper to avoid timezone off-by-one
  const formatISODateLocal = (iso: string) => {
    try {
      const [y, m, d] = iso.split('-').map((n) => parseInt(n || '0', 10))
      const date = new Date(y, (m || 1) - 1, d || 1)
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return iso
    }
  }

  // Enabled docs and navigation helpers
  const enabledDocs = React.useMemo(() => {
    const docs: Array<{ id: string; label: string; enabled: boolean }> = [
      { id: "proposal", label: "Proposal", enabled: proposalEnabled },
      { id: "contract", label: "Contract", enabled: contractEnabled },
      { id: "invoice", label: "Invoice", enabled: invoiceEnabled },
    ]
    return docs.filter(d => d.enabled)
  }, [proposalEnabled, contractEnabled, invoiceEnabled])

  React.useEffect(() => {
    // If the current active doc is disabled, switch to the first enabled
    const stillEnabled = enabledDocs.find(d => d.id === activeDoc)
    if (!stillEnabled && enabledDocs.length > 0) {
      setActiveDoc(enabledDocs[0].id)
    }
  }, [enabledDocs, activeDoc])

  const getNextDocId = () => {
    const idx = enabledDocs.findIndex(d => d.id === activeDoc)
    if (idx === -1) return undefined
    return enabledDocs[idx + 1]?.id
  }
  const isLastDoc = enabledDocs.length > 0 && enabledDocs[enabledDocs.length - 1].id === activeDoc

  // In-document tabs (rendered inside document preview)
  const DocumentTabs = () => {
    const tabBase = "px-4 py-1.5 text-sm rounded-full cursor-pointer transition-colors"
    const inactive = "text-gray-600 hover:text-gray-900"
    return (
      <div className="w-full flex justify-center pt-6 pb-4" data-help="document-tabs-container">
        <div className="inline-flex items-center gap-1 rounded-full p-1" style={{ backgroundColor: `${accentColor}1A` }}>
          {enabledDocs.map(tab => (
            <span
              key={tab.id}
              data-help={`tab-${tab.id}`}
              className={`${tabBase} ${activeDoc === tab.id ? "text-white" : inactive}`}
              onClick={() => setActiveDoc(tab.id)}
              style={activeDoc === tab.id ? { backgroundColor: brandColor, boxShadow: "0 2px 6px rgba(0,0,0,0.08)" } : undefined}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>
    )
  }
  
  const getStatusColor = (s: DocumentStatus) => {
    const colors = {
      "Draft": "bg-gray-100 text-gray-700",
      "Sent": "bg-blue-100 text-blue-700",
      "Viewed": "bg-purple-100 text-purple-700",
      "Accepted": "bg-green-100 text-green-700",
    }
    return colors[s]
  }

  // Editable field component
  const EditableField = ({ 
    value,
    onChange,
    multiline = false,
    className = "",
    placeholder = "",
    fieldKey = "",
  }: any) => {
    const isEditing = editingField === fieldKey
    const editorRef = React.useRef<HTMLDivElement | null>(null)

    // Initialize editor content and caret when entering edit mode
    React.useEffect(() => {
      if (isEditing && editorRef.current) {
        // Set innerText to avoid HTML injection and preserve new lines
        editorRef.current.innerText = value || ""
        // Focus and move caret to end
        const range = document.createRange()
        range.selectNodeContents(editorRef.current)
        range.collapse(false)
        const sel = window.getSelection()
        sel?.removeAllRanges()
        sel?.addRange(range)
      }
    }, [isEditing])

    // Close editor when clicking outside
    React.useEffect(() => {
      if (!isEditing) return
      const handleClickOutside = (e: MouseEvent) => {
        if (editorRef.current && !editorRef.current.contains(e.target as Node)) {
          setEditingField(null)
        }
      }
      document.addEventListener("mousedown", handleClickOutside, true)
      return () => document.removeEventListener("mousedown", handleClickOutside, true)
    }, [isEditing])

    if (isEditing) {
      return (
        <div
          ref={editorRef}
          className={`relative ${className} outline outline-2 outline-blue-500/70 rounded-sm`}
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerText)}
          onBlur={() => setEditingField(null)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter commits and blurs
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault()
              ;(e.currentTarget as HTMLElement).blur()
            }
          }}
          style={{
            whiteSpace: multiline ? ("pre-wrap" as const) : ("pre-wrap" as const),
            minHeight: multiline ? 100 : undefined,
          }}
        />
      )
    }

        return (
          <div
        className={`group relative ${className}`}
        onClick={() => setEditingField(fieldKey)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setEditingField(fieldKey)
        }}
      >
        <div className={`${multiline ? "whitespace-pre-wrap" : ""} cursor-text hover:bg-blue-50/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors ${!value && placeholder ? "text-gray-400 italic" : ""}`}>
          {value || (placeholder ? `Example: ${placeholder}` : "")}
          <Pencil className="inline-block ml-2 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity align-text-top" />
            </div>
          </div>
        )
  }

        return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap');
      `}</style>
     
      <div className="h-screen flex flex-col bg-white">
        {/* Minimal Header */}
        <div className="border-b px-6 py-3 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" data-help="btn-back-proposals" onClick={() => router.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">{clientName || "Client Name"}</span>
              <span className="text-gray-300">•</span>
              <span className="text-sm font-medium text-gray-900">{projectName || "Project Name"}</span>
              <Badge className={getStatusColor(status)} variant="secondary">{status}</Badge>
                  </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => toast.success("Saved!")}>
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button variant="ghost" size="sm">
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button size="sm" className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Live Preview Panel - LEFT */}
          <div className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50/20 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="max-w-6xl mx-auto p-12">
                {/* Tabs rendered inside the document */}

                {/* PROPOSAL PREVIEW */}
                {activeDoc === "proposal" && proposalEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden" style={{ fontFamily: 'Georgia, serif' }} data-help="proposal-preview">
                    <DocumentTabs />
                    {/* Document Header with Logo */}
                    <div className="px-16 pt-16 pb-8">
                      <div className="flex justify-between items-start mb-12">
                        {/* Logo */}
                        {showLogo ? (
                          <div
                            className={`w-32 h-32 rounded-lg flex items-center justify-center transition-colors ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 cursor-pointer group'}` }
                            onClick={openLogoPicker}
                          >
                            {logoUrl ? (
                              <>
                                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                                <div className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow">
                                  <Pencil className="h-3 w-3 text-gray-700" />
                                </div>
                              </>
                            ) : (
                              <div className="text-center">
                                <ImageIcon className="h-8 w-8 mx-auto text-gray-400 mb-1 group-hover:text-gray-500" />
                                <span className="text-xs text-gray-500">Logo</span>
                  </div>
                            )}
                </div>
                        ) : (
                          <div className="w-32" />
                        )}
                        
                        {/* Company details */}
                        <div className="text-right text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                          <div className="font-semibold text-gray-900">{companyName || "{your_company_name}"}</div>
                          <div className="text-gray-600">{companyEmail || "{your_email}"}</div>
                          <div className="text-gray-600 text-xs mt-1">{companyAddress || "{your_address}"}</div>
            </div>
          </div>
                      
                      {/* Title section */}
                      <div className="text-center mb-12 pb-8 border-b" style={{ borderColor: accentColor }}>
                        <div className="text-sm uppercase tracking-wider text-gray-500 mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Proposal
                  </div>
                        <EditableField
                          value={proposalTitle}
                          onChange={(v: string) => { setProposalTitle(v); setAutoTitle(false) }}
                          fieldKey="proposalTitle"
                          className="text-3xl font-normal text-gray-900 mb-3"
                        />
                        <EditableField
                          value={proposalSubtitle}
                          onChange={setProposalSubtitle}
                          fieldKey="proposalSubtitle"
                          placeholder="A comprehensive website redesign to elevate your digital presence"
                          className="text-base text-gray-600 max-w-2xl mx-auto font-light"
                        />
                        <div className="mt-6 text-sm text-gray-500" style={{ fontFamily: 'Inter, sans-serif' }}>
                          Prepared for <span className="font-semibold text-gray-900">{clientName || "{client_name}"}</span> • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                      </div>
              </div>

                    <div className="px-16 pb-16 space-y-12" style={{ fontFamily: 'Inter, sans-serif' }}>
                      {/* Problem → Outcome */}
                      <div>
                        <EditableField
                          value={labelGoals}
                          onChange={setLabelGoals}
                          fieldKey="labelGoals"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        <EditableField
                          value={clientGoals}
                          onChange={setClientGoals}
                          multiline
                          fieldKey="clientGoals"
                          placeholder="Modernize outdated website design&#10;Improve user experience and conversion rates&#10;Mobile-responsive and fast loading"
                          className="text-sm text-gray-700 leading-relaxed"
                        />
                      </div>

                      <div>
                        <EditableField
                          value={labelSuccess}
                          onChange={setLabelSuccess}
                          fieldKey="labelSuccess"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        <EditableField
                          value={successOutcome}
                          onChange={setSuccessOutcome}
                          multiline
                          fieldKey="successOutcome"
                          placeholder="A beautiful, conversion-optimized website that engages visitors and drives measurable business results."
                          className="text-sm text-gray-700 leading-relaxed"
                        />
                </div>

                      {/* Deliverables */}
                      <div>
                        <EditableField
                          value={labelScope}
                          onChange={setLabelScope}
                          fieldKey="labelScope"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        <EditableField
                          value={deliverables}
                          onChange={setDeliverables}
                          multiline
                          fieldKey="deliverables"
                          placeholder="Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support"
                          className="text-sm text-gray-700 leading-relaxed"
                        />
            </div>

                      {/* Timeline */}
                      <div>
                        <EditableField
                          value={labelTimeline}
                          onChange={setLabelTimeline}
                          fieldKey="labelTimeline"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        <EditableField
                          value={timeline}
                          onChange={setTimeline}
                          multiline
                          fieldKey="timeline"
                          placeholder="Phase 1: Discovery & Strategy (Week 1-2)&#10;Phase 2: Design & Feedback (Week 3-4)&#10;Phase 3: Development (Week 5-7)&#10;Phase 4: Launch & Training (Week 8)"
                          className="text-sm text-gray-700 leading-relaxed"
                        />
          </div>

                      {/* Investment */}
                      <div>
                        <EditableField
                          value={labelInvestment}
                          onChange={setLabelInvestment}
                          fieldKey="labelInvestment"
                          className="text-xl font-normal text-gray-900 mb-4 pb-2 border-b border-gray-200"
                        />
                        
                        <table className="w-full text-sm">
                <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 font-semibold text-gray-700">Service</th>
                              <th className="text-left py-3 font-semibold text-gray-700">Details</th>
                              <th className="text-right py-3 font-semibold text-gray-700">Fee</th>
                              <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                            {pricingItems.map((item, idx) => (
                              <tr key={item.id} className="border-b border-gray-100 group">
                                <td className="py-4">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => {
                                      const updated = [...pricingItems]
                                      updated[idx].name = e.target.value
                                      setPricingItems(updated)
                                    }}
                                    placeholder="Service name"
                                    className="w-full bg-transparent text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                  />
                        </td>
                                <td className="py-4">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => {
                                      const updated = [...pricingItems]
                                      updated[idx].description = e.target.value
                                      setPricingItems(updated)
                                    }}
                                    placeholder="Description"
                                    className="w-full bg-transparent text-gray-600 text-xs border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                  />
                                </td>
                                <td className="py-4">
                                  <div className="flex items-center justify-end">
                                    <span className="text-gray-900">$</span>
                                    <input
                                      type="number"
                                      value={item.price}
                                      onChange={(e) => {
                                        const updated = [...pricingItems]
                                        updated[idx].price = e.target.value
                                        setPricingItems(updated)
                                      }}
                                      placeholder="0"
                                      className="w-24 bg-transparent text-right font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                    />
                                  </div>
                        </td>
                                <td className="py-4">
                                  <button
                                    onClick={() => setPricingItems(pricingItems.filter((_, i) => i !== idx))}
                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            
                            {addons.filter(a => a.selected).map((addon) => (
                              <tr key={addon.id} className="border-b border-gray-100">
                                <td className="py-4 text-gray-900">{addon.name}</td>
                                <td className="py-4 text-gray-600 text-xs">Optional add-on</td>
                                <td className="py-4 text-right font-medium text-gray-900">
                                  ${parseFloat(addon.price).toLocaleString()}
                                </td>
                                <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button
                onClick={() => setPricingItems([...pricingItems, { id: Date.now().toString(), name: "", description: "", price: "0" }])}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add line item
              </button>
                        
                        <div className="mt-6 pt-4 space-y-2 text-sm">
                          <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>${subtotal.toLocaleString()}</span>
            </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Tax ({taxRate}%)</span>
                            <span>${tax.toFixed(2)}</span>
          </div>
                        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t" style={{ borderColor: accentColor }}>
                            <span>Total Investment</span>
                          <span style={{ color: brandColor }}>${total.toLocaleString()}</span>
            </div>
          </div>

                        {paymentPlanEnabled && (
                          <div className="mt-6 p-4 bg-gray-50 border text-xs text-gray-700 space-y-2" style={{ borderColor: accentColor }}>
                            <div className="font-semibold">Payment Plan</div>
                            <div>
                              {paymentPlanType === "50-50" && "50% deposit upon acceptance, 50% upon project completion"}
                              {paymentPlanType === "33-33-33" && "Three equal monthly installments"}
                              {paymentPlanType === "milestone" && "Milestone-based: Invoices are issued at each milestone. No upfront payment due."}
                              {paymentPlanType === "custom" && (
                                customEqualSplit
                                  ? `${customPaymentsCount} equal payments of $${(Math.floor((total / customPaymentsCount) * 100) / 100).toLocaleString()}`
                                  : `${customPaymentsCount} payments: ${customPaymentAmounts.map(a => `$${Number(a || 0).toLocaleString()}`).join(', ')}`
                              )}
                            </div>
                            {paymentPlanType === "milestone" ? (
                              <div className="space-y-1 text-gray-700">
                                <p className="text-xs">Milestones below will be invoiced upon completion.</p>
                                <ul className="list-disc ml-5 text-xs space-y-1">
                                  {milestones.slice(0, milestonesCount).map((m, i) => (
                                    <li key={m.id}>{m.name || `Milestone ${i+1}`} → ${Number(m.amount || 0).toLocaleString()}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <ul className="list-disc ml-5 space-y-1">
                                {getPaymentSchedule().map((amt, idx) => (
                                  <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
              </div>

                      {/* Footer Navigation */}
                      <div className="pt-8 border-t" style={{ borderColor: accentColor }}>
                        <div className="flex justify-center">
                          {isLastDoc ? (
                            <Button className="px-10" style={{ backgroundColor: brandColor }}>
                              Accept Proposal
                            </Button>
                          ) : (
                            <Button
                              className="px-10"
                              style={{ backgroundColor: brandColor }}
                              onClick={() => {
                                const next = getNextDocId()
                                if (next) setActiveDoc(next)
                              }}
                            >
                              Next
                            </Button>
                          )}
            </div>
          </div>
              </div>
                  </div>
                )}

                {/* CONTRACT PREVIEW */}
                {activeDoc === "contract" && contractEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16 space-y-8 flex flex-col" style={{ fontFamily: 'Georgia, serif' }} data-help="contract-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                      {showLogo ? (
                        <div
                          className={`w-32 h-32 rounded-lg flex items-center justify-center ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer'}` }
                          onClick={openLogoPicker}
                        >
                          {logoUrl ? (
                            <>
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                              <div className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow">
                                <Pencil className="h-3 w-3 text-gray-700" />
            </div>
                            </>
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
                      <div className="text-right text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        <div className="font-semibold text-gray-900">{companyName}</div>
                        <div className="text-gray-600">{companyEmail}</div>
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
                          <EditableField
                            value={deliverables}
                            onChange={setDeliverables}
                            multiline
                            fieldKey="contractDeliverables"
                            placeholder="Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support"
                            className="text-gray-700 ml-4"
                          />
                          <p><strong>Start Date:</strong> {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                          <p><strong>Estimated Completion:</strong> {formatISODateLocal(estimatedCompletionDate)}</p>
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
                          <p><strong>Total Project Fee:</strong> ${total.toLocaleString()} {currency}</p>
                          <p><strong>Payment Schedule:</strong> {paymentPlanEnabled ? (
                            paymentPlanType === "50-50" ? "50% deposit upon signing, 50% upon project completion" :
                            paymentPlanType === "33-33-33" ? "Three equal monthly installments" :
                            "Payment due upon completion of each milestone"
                          ) : "Full payment due upon project completion"}</p>
                          <p>Client agrees to pay invoices by the due date shown on each invoice.</p>
                          {includeLateFee && (
                            <p>Late payments may incur a {"{late_fee_percentage}"}% fee after {"{late_days}"} days overdue.</p>
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
                          <p>This agreement includes {"{"}{revisionCount}{"}"} revision(s) per deliverable.</p>
                          {includeHourlyClause && (
                            <p>Additional revisions or changes in scope will be billed at ${"{hourly_rate}"} USD per hour or a mutually agreed rate.</p>
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
                            <div className="text-xs font-semibold text-gray-700 mb-4">Freelancer</div>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Name:</div>
                                <div className="text-sm text-gray-900">{yourName}</div>
                  </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Date:</div>
                                <div className="text-sm text-gray-900">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Signature:</div>
                                <div className="text-2xl text-gray-900" style={{ fontFamily: "'Dancing Script', cursive" }}>
                                  {yourName}
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
                                <div className="text-sm text-gray-900">{clientName}</div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 mb-1">Date:</div>
                        <Input
                                  type="date"
                                  className="h-8 text-sm"
                                  defaultValue={new Date().toISOString().split('T')[0]}
                                />
                    </div>
                    
                    <div>
                                <div className="text-xs text-gray-600 mb-2">Signature:</div>
                                <div className="border-b-2 border-gray-400 pb-1">
                                  <Input
                                    placeholder="Type your full legal name" 
                                    value={clientSignatureName}
                                    onChange={(e) => setClientSignatureName(e.target.value)}
                                    className="border-0 p-0 text-3xl md:text-4xl h-auto leading-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900" 
                                    style={{ fontFamily: "'Dancing Script', cursive", lineHeight: 1.15 }}
                                  />
                          </div>
                              </div>
                              <div className="flex items-start gap-2 pt-2">
                                <Checkbox id="sig-consent" className="mt-1" />
                                <Label htmlFor="sig-consent" className="text-xs font-normal text-gray-600 leading-relaxed">
                                  I agree that typing my name above constitutes a legal electronic signature
                                </Label>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Footer Navigation - bottom of page */}
                    <div className="pt-8 border-t mt-16" style={{ borderColor: accentColor }}>
                      <div className="flex justify-center">
                        {isLastDoc ? (
                          <Button className="px-10" style={{ backgroundColor: brandColor }}>
                            Accept Proposal
                </Button>
                        ) : (
                <Button
                            className="px-10"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => {
                              const next = getNextDocId()
                              if (next) setActiveDoc(next)
                            }}
                          >
                            Next
                </Button>
                        )}
              </div>
                    </div>
                  </div>
                )}

                {/* INVOICE PREVIEW */}
                {activeDoc === "invoice" && invoiceEnabled && (
                  <div className="bg-white shadow-sm overflow-hidden px-16 py-16" style={{ fontFamily: 'Inter, sans-serif' }} data-help="invoice-preview">
                    <DocumentTabs />
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12">
                      {showLogo ? (
                        <div
                          className={`w-32 h-32 rounded-lg flex items-center justify-center ${logoUrl ? 'relative cursor-pointer group' : 'border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer'}` }
                          onClick={openLogoPicker}
                        >
                          {logoUrl ? (
                            <>
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5" />
                              <div className="absolute top-1 right-1 bg-white/90 rounded p-1 shadow">
                                <Pencil className="h-3 w-3 text-gray-700" />
                  </div>
                            </>
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
                      <div className="text-right">
                        <div className="text-sm uppercase tracking-wider text-gray-500 mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                          Invoice
                        </div>
                        <div className="text-2xl font-semibold text-gray-900 mb-4">{invoiceNumber}</div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>Issue Date: {new Date(invoiceIssueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                          <div>Due Date: {new Date(invoiceDueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                        </div>
            </div>
              </div>

                    <div className="grid grid-cols-2 gap-12 mb-12 text-sm">
                    <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">From</div>
                        <div className="text-gray-900 space-y-1">
                          <p className="font-semibold">{companyName}</p>
                          <p className="text-xs text-gray-600">{companyEmail}</p>
                          <p className="text-xs text-gray-600">{companyAddress}</p>
                  </div>
                    </div>
                    <div>
                        <div className="text-xs uppercase tracking-wider text-gray-500 mb-3">Bill To</div>
                        <div className="text-gray-900 space-y-1">
                          <p className="font-semibold">{clientName}</p>
                          <p className="text-xs">{clientCompany}</p>
                          <p className="text-xs text-gray-600">{clientEmail}</p>
                          <p className="text-xs text-gray-600">{clientAddress}</p>
              </div>
            </div>
          </div>

                    <table className="w-full mb-8 text-sm">
                      <thead className="border-b border-gray-300">
                        <tr className="text-left">
                          <th className="pb-3 font-semibold text-gray-700">Description</th>
                          <th className="pb-3 font-semibold text-gray-700 text-center w-20">Qty</th>
                          <th className="pb-3 font-semibold text-gray-700 text-right w-32">Amount</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingItems.map((item, idx) => (
                          <tr key={item.id} className="border-b border-gray-100 group">
                            <td className="py-4">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => {
                                  const updated = [...pricingItems]
                                  updated[idx].name = e.target.value
                                  setPricingItems(updated)
                                }}
                                placeholder="Service name"
                                className="w-full bg-transparent font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 mb-1"
                              />
                              <input
                                type="text"
                                value={item.description}
                                onChange={(e) => {
                                  const updated = [...pricingItems]
                                  updated[idx].description = e.target.value
                                  setPricingItems(updated)
                                }}
                                placeholder="Description"
                                className="w-full bg-transparent text-xs text-gray-600 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                defaultValue="1"
                                className="w-12 bg-transparent text-center text-gray-700 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded"
                              />
                            </td>
                            <td className="py-4">
                              <div className="flex items-center justify-end">
                                <span className="text-gray-900">$</span>
                                <input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => {
                                    const updated = [...pricingItems]
                                    updated[idx].price = e.target.value
                                    setPricingItems(updated)
                                  }}
                                  placeholder="0"
                                  className="w-24 bg-transparent text-right font-medium text-gray-900 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                                />
                              </div>
                            </td>
                            <td className="py-4">
                              <button
                                onClick={() => setPricingItems(pricingItems.filter((_, i) => i !== idx))}
                                className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {addons.filter(a => a.selected).map((addon) => (
                          <tr key={addon.id} className="border-b border-gray-100">
                            <td className="py-4">
                              <div className="font-medium text-gray-900">{addon.name}</div>
                            </td>
                            <td className="py-4 text-center text-gray-700">1</td>
                            <td className="py-4 text-right font-medium text-gray-900">
                              ${parseFloat(addon.price).toLocaleString()}
                            </td>
                            <td></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <button
                      onClick={() => setPricingItems([...pricingItems, { id: Date.now().toString(), name: "", description: "", price: "0" }])}
                      className="mb-6 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Add line item
                    </button>

                    <div className="flex justify-end mb-12">
                      <div className="w-96 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span>${subtotal.toLocaleString()}</span>
                  </div>
                        <div className="flex justify-between text-gray-700">
                          <span>Tax ({taxRate}%)</span>
                          <span>${tax.toFixed(2)}</span>
              </div>
                        <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t" style={{ borderColor: accentColor }}>
                          <span>Amount Due Now</span>
                          <span style={{ color: brandColor }}>${(paymentPlanEnabled ? firstPayment : total).toLocaleString()}</span>
            </div>
          </div>
              </div>

                    <div className="border-t pt-8" style={{ borderColor: accentColor }}>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        <p className="mb-2"><strong>Payment Terms:</strong> Payment is due within {paymentDueDays} days of invoice date.</p>
                        <p>Thank you for your business. If you have any questions about this invoice, please contact {companyEmail}.</p>
                    </div>
                  </div>
                    {paymentPlanEnabled && (
                      <div className="mt-6 p-4 bg-gray-50 border text-xs text-gray-700" style={{ borderColor: accentColor }}>
                        <div className="font-semibold mb-2">Payment Plan</div>
                        {paymentPlanType === "milestone" ? (
              <div className="space-y-2">
                            <p className="text-xs text-gray-600">Milestone-based billing: You will be invoiced at each milestone; no full upfront payment is required.</p>
                            <ul className="list-disc ml-5">
                              {milestones.slice(0, milestonesCount).map((m, i) => (
                                <li key={m.id}>{m.name || `Milestone ${i+1}`} → ${Number(m.amount || 0).toLocaleString()}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <ul className="list-disc ml-5 space-y-1">
                            {getPaymentSchedule().map((amt, idx) => (
                              <li key={idx}>Payment {idx + 1}: ${amt.toLocaleString()}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                    {/* Footer Navigation */}
                    <div className="pt-8 border-t" style={{ borderColor: accentColor }}>
                      <div className="flex justify-center">
                        {isLastDoc ? (
                          <Button className="px-10" style={{ backgroundColor: brandColor }}>
                            Accept Proposal
                      </Button>
                        ) : (
                <Button
                            className="px-10"
                            style={{ backgroundColor: brandColor }}
                            onClick={() => {
                              const next = getNextDocId()
                              if (next) setActiveDoc(next)
                            }}
                          >
                            Next
                      </Button>
                        )}
                    </div>
                  </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            </div>

          {/* Settings Panel - RIGHT */}
          <div className="w-96 border-l bg-white overflow-hidden flex flex-col">
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="h-5 w-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">Document Settings</h2>
          </div>

              {/* Document Toggles */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Proposal</span>
                    </div>
                  <Switch checked={proposalEnabled} onCheckedChange={setProposalEnabled} />
                  </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Contract</span>
              </div>
                  <Switch checked={contractEnabled} onCheckedChange={setContractEnabled} />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium">Invoice</span>
                  </div>
                  <Switch checked={invoiceEnabled} onCheckedChange={setInvoiceEnabled} />
                </div>
            </div>
          </div>

            <ScrollArea className="flex-1">
              <div className="p-4">
                <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                  {/* Branding */}
                  <AccordionItem value="branding" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        <span className="font-medium">Branding</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      {/* Logo Selector */}
                      <div>
                        <Label className="text-xs">Logo</Label>
                        <div className="flex items-center gap-3 mt-2">
                          <div
                            className="w-14 h-14 rounded border bg-white flex items-center justify-center overflow-hidden cursor-pointer"
                            onClick={openLogoPicker}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") openLogoPicker() }}
                          >
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 flex items-center gap-2">
                            <Input
                              placeholder="Paste logo URL"
                              value={logoUrl}
                              onChange={(e) => setLogoUrl(e.target.value)}
                            />
                            <input
                              id="logoUpload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const url = URL.createObjectURL(file)
                                  setLogoUrl(url)
                                }
                              }}
                            />
                  <Button
                              variant="outline"
                              onClick={() => (document.getElementById("logoUpload") as HTMLInputElement)?.click()}
                  >
                              Upload
                  </Button>
                            {logoUrl && (
                              <Button variant="ghost" onClick={() => setLogoUrl("")}>Remove</Button>
                            )}
                </div>
              </div>
                        <div className="flex items-center justify-between mt-2">
                          <Label className="text-xs">Show Logo in document</Label>
                          <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                  <div>
                          <Label className="text-xs">Brand Color</Label>
                          <div className="flex gap-2 mt-1">
                      <Input
                              type="color" 
                              value={brandColor} 
                              onChange={(e) => setBrandColor(e.target.value)}
                              className="h-10 w-full"
                            />
                    </div>
                    </div>
                    <div>
                          <Label className="text-xs">Accent</Label>
                          <div className="flex gap-2 mt-1">
                            <Input 
                              type="color" 
                              value={accentColor} 
                              onChange={(e) => setAccentColor(e.target.value)}
                              className="h-10 w-full"
                            />
                      </div>
                    </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Company Info */}
                  <AccordionItem value="company" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">Company Info</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                  <div>
                        <Label className="text-xs">Name</Label>
                        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={companyEmail} onChange={(e) => setCompanyEmail(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label className="text-xs">Address</Label>
                    <Textarea
                          value={companyAddress} 
                          onChange={(e) => setCompanyAddress(e.target.value)} 
                          rows={2}
                          className="mt-1"
                    />
                  </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Client Info */}
                  <AccordionItem value="client" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">Client Info</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                    <div>
                        <Label className="text-xs">Name</Label>
                        <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label className="text-xs">Company</Label>
                        <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Email</Label>
                        <Input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                        <Label className="text-xs">Address</Label>
                        <Textarea 
                          value={clientAddress} 
                          onChange={(e) => setClientAddress(e.target.value)} 
                          rows={2}
                          className="mt-1"
                      />
                    </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Payment Settings */}
                  <AccordionItem value="payment" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">Payment</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                          <Label className="text-xs">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                          <Label className="text-xs">Tax (%)</Label>
                          <Input 
                            type="number" 
                            value={taxRate} 
                            onChange={(e) => setTaxRate(e.target.value)}
                            className="mt-1"
                          />
                      </div>
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Payment Due (days)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={paymentDueDays}
                            onChange={(e) => setPaymentDueDays(parseInt(e.target.value || '0', 10))}
                            className="mt-1"
                          />
                        </div>
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
                    </AccordionContent>
                  </AccordionItem>

                  {/* Contract Terms */}
                  <AccordionItem value="contract" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4" />
                        <span className="font-medium">Contract Terms</span>
                    </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                    <div>
                        <Label className="text-xs">Project Name</Label>
                      <Input
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          placeholder="e.g., Website Redesign Project"
                          className="mt-1"
                      />
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                          <Label className="text-xs">Revisions</Label>
                          <Input 
                            type="number" 
                            value={revisionCount} 
                            onChange={(e) => setRevisionCount(e.target.value)}
                            className="mt-1"
                          />
                    </div>
                    <div>
                          <Label className="text-xs">Hourly Rate</Label>
                          <Input 
                            type="number" 
                            value={hourlyRate} 
                            onChange={(e) => setHourlyRate(e.target.value)}
                            className="mt-1"
                            disabled={!includeHourlyClause}
                          />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Include Hourly Clause</Label>
                      <Switch checked={includeHourlyClause} onCheckedChange={setIncludeHourlyClause} />
                    </div>
                      <div className="grid grid-cols-2 gap-3">
                    <div>
                           <Label className="text-xs">Late Fee %</Label>
                           <Input 
                             type="number" 
                             value={lateFee} 
                             onChange={(e) => setLateFee(e.target.value)}
                             className="mt-1"
                             disabled={!includeLateFee}
                           />
                    </div>
                    <div>
                           <Label className="text-xs">Late Days</Label>
                           <Input 
                             type="number" 
                             value={lateDays} 
                             onChange={(e) => setLateDays(e.target.value)}
                             className="mt-1"
                             disabled={!includeLateFee}
                           />
                      </div>
                    </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Include Late Fee Clause</Label>
                        <Switch checked={includeLateFee} onCheckedChange={setIncludeLateFee} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs">Estimated Completion</Label>
                        <Input
                          type="date"
                          value={estimatedCompletionDate}
                          onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                <div>
                        <Label className="text-xs">Your Name (for signature)</Label>
                        <Input 
                          value={yourName} 
                          onChange={(e) => setYourName(e.target.value)}
                          className="mt-1"
                        />
                  </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Optional Extras (Add-ons) */}
                  <AccordionItem value="addons" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        <span className="font-medium">Optional Extras (Add-ons)</span>
                </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pt-4">
                      <p className="text-xs text-gray-500">Optional, nice-to-have items your client can choose to include in the proposal.</p>
                      {addons.map((addon, idx) => (
                        <div key={addon.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                          <Checkbox 
                            checked={addon.selected}
                            onCheckedChange={(checked) => {
                              const updated = [...addons]
                              updated[idx].selected = !!checked
                              setAddons(updated)
                            }}
                          />
                          <Input 
                            placeholder="ex. {example add on}" 
                            value={addon.name}
                            onChange={(e) => {
                              const updated = [...addons]
                              updated[idx].name = e.target.value
                              setAddons(updated)
                            }}
                            className="text-sm flex-1"
                          />
                          <Input 
                            type="number" 
                            placeholder="Price" 
                            value={addon.price}
                            onChange={(e) => {
                              const updated = [...addons]
                              updated[idx].price = e.target.value
                              setAddons(updated)
                            }}
                            className="text-sm w-24"
                      />
                      <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              setAddons(addons.filter((_, i) => i !== idx))
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                      className="w-full"
                        onClick={() => setAddons([...addons, { 
                          id: Date.now().toString(), 
                          name: "", 
                          price: "",
                          selected: false
                        }])}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add add-on
                    </Button>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                  </div>
            </ScrollArea>
                </div>
              </div>
            </div>
    
    </>
  )
}
