"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
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
  Loader2,
  X,
  Clock,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { getContracts, deleteContract, type Contract, createContract, updateContract } from "@/lib/contracts"
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useRouter } from "next/navigation"

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800" },
  awaiting_signature: { label: "Awaiting Signature", color: "bg-purple-100 text-purple-800" },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-100 text-yellow-800" },
  signed: { label: "Signed", color: "bg-green-100 text-green-800" },
  declined: { label: "Declined", color: "bg-red-100 text-red-800" },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-800" },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800" },
}

export default function ContractsPage() {
  const router = useRouter()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedContracts, setSelectedContracts] = useState<string[]>([])
  const [deletingContract, setDeletingContract] = useState<string | null>(null)
  
  // Modal states
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  
  // Send/Resend modal states
  const [emailSettings, setEmailSettings] = useState({
    to: "",
    subject: "",
    body: "",
    ccEmails: "",
    bccEmails: "",
  })
  const [sending, setSending] = useState(false)

  const [duplicating, setDuplicating] = useState(false)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const data = await getContracts()
      setContracts(data)
    } catch (error) {
      console.error('Error loading contracts:', error)
      toast.error('Failed to load contracts')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async (contractId: string) => {
    try {
      setDeletingContract(contractId)
      await deleteContract(contractId)
      setContracts(contracts.filter(c => c.id !== contractId))
      setSelectedContracts(selectedContracts.filter(id => id !== contractId))
      toast.success('Contract deleted successfully')
    } catch (error) {
      console.error('Error deleting contract:', error)
      toast.error('Failed to delete contract')
    } finally {
      setDeletingContract(null)
    }
  }

  const handleViewContract = async (contract: Contract) => {
    // Navigate to contract details page using contract number
    router.push(`/dashboard/contracts/${contract.contract_number}`)
  }

  const handleStatusChange = async (contract: Contract, newStatus: string) => {
    try {
      // Update contract status in database
      await updateContract(contract.id, { status: newStatus as any })
      
      // Update local state
      setContracts(prev => prev.map(c => 
        c.id === contract.id ? { ...c, status: newStatus as any } : c
      ))
      
      toast.success(`Contract status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating contract status:', error)
      toast.error('Failed to update contract status')
    }
  }

  const handleSendContract = async (contract: Contract) => {
    setSelectedContract(contract)
    setEmailSettings({
      to: contract.signer_email || "",
      subject: contract.email_subject || `Contract for Review: ${contract.name}`,
      body: contract.email_body || `Please review and sign the attached contract: ${contract.name}`,
      ccEmails: contract.cc_emails?.join(', ') || "",
      bccEmails: contract.bcc_emails?.join(', ') || "",
    })
    
    setSendModalOpen(true)
  }

  const handleDuplicateContract = async (contract: Contract) => {
    try {
      setDuplicating(true)
      
      // Create new contract data based on the original
      const newContractData = {
        account_id: contract.account_id,
        name: `${contract.name} (Copy)`,
        description: contract.description,
        contract_content: contract.contract_content,
        contract_type: contract.contract_type,
        client_id: contract.client_id,
        project_id: contract.project_id,
        portal_id: contract.portal_id,
        status: 'draft' as const, // Always start as draft
        total_value: contract.total_value,
        currency: contract.currency,
        payment_terms: contract.payment_terms,
        deposit_amount: contract.deposit_amount,
        deposit_percentage: contract.deposit_percentage,
        start_date: contract.start_date,
        end_date: contract.end_date,
        due_date: contract.due_date,
        expiration_date: contract.expiration_date,
        signer_name: contract.signer_name,
        signer_email: contract.signer_email,
        signer_role: contract.signer_role,
        email_subject: contract.email_subject,
        email_body: contract.email_body,
        cc_emails: contract.cc_emails,
        bcc_emails: contract.bcc_emails,
        reminder_schedule: contract.reminder_schedule,
        auto_reminder: contract.auto_reminder,
        tags: contract.tags,
        metadata: contract.metadata,
        created_by: contract.created_by,
        created_by_name: contract.created_by_name
      }

      // Create the new contract in the database
      const newContract = await createContract(newContractData)
      
      // If the original contract has an HTML file, duplicate it in storage
      if (contract.contract_html) {
        const supabase = createClient()
        
        // Download the original file
        const { data: originalFile, error: downloadError } = await supabase.storage
          .from('files')
          .download(contract.contract_html)
        
        if (!downloadError && originalFile) {
          // Generate new filename for the duplicate
          const fileExtension = contract.contract_html.split('.').pop()
          const newFileName = `contracts/${newContract.id}/contract.${fileExtension}`
          
          // Upload the duplicate file
          const { error: uploadError } = await supabase.storage
            .from('files')
            .upload(newFileName, originalFile, {
              contentType: originalFile.type || 'text/html',
              cacheControl: '3600'
            })
          
          if (!uploadError) {
            // Update the new contract with the new file path
            await updateContract(newContract.id, {
              contract_html: newFileName
            })
          }
        }
      }
      
      // Refresh the contracts list
      await loadContracts()
      
      toast.success('Contract duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating contract:', error)
      toast.error('Failed to duplicate contract')
    } finally {
      setDuplicating(false)
    }
  }

  const handleSendSubmit = async () => {
    if (!selectedContract) return

    try {
      setSending(true)
      
      // Generate PDF for email attachment or download
      let pdfBlob: Blob | null = null
      try {
        let htmlContent = ""
        if (selectedContract.contract_html) {
          const supabase = createClient()
          const { data, error } = await supabase.storage
            .from('files')
            .download(selectedContract.contract_html)
          
          if (!error && data) {
            htmlContent = await data.text()
          }
        }
        
        if (!htmlContent && selectedContract.contract_content) {
          htmlContent = generateContractDocument(selectedContract.contract_content)
        }

        if (htmlContent) {
          // Create temporary div for PDF generation
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = htmlContent
          tempDiv.style.position = 'absolute'
          tempDiv.style.left = '-9999px'
          tempDiv.style.top = '-9999px'
          tempDiv.style.width = '800px'
          tempDiv.style.backgroundColor = 'white'
          tempDiv.style.padding = '40px'
          document.body.appendChild(tempDiv)

          try {
            const canvas = await html2canvas(tempDiv, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
              width: 800,
              height: tempDiv.scrollHeight,
            })

            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('p', 'mm', 'a4')
            const imgWidth = 210
            const pageHeight = 295
            const imgHeight = (canvas.height * imgWidth) / canvas.width
            let heightLeft = imgHeight
            let position = 0

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight

            while (heightLeft >= 0) {
              position = heightLeft - imgHeight
              pdf.addPage()
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
              heightLeft -= pageHeight
            }

            pdfBlob = pdf.output('blob')
          } finally {
            document.body.removeChild(tempDiv)
          }
        }
      } catch (error) {
        console.error('Error generating PDF:', error)
        toast.error('Failed to generate PDF')
        return
      }

      // If email provider is configured, send email
      if (emailSettings.to) {
        let mailtoUrl = `mailto:${emailSettings.to}?subject=${encodeURIComponent(emailSettings.subject)}&body=${encodeURIComponent(emailSettings.body)}`;
        if (emailSettings.ccEmails) {
          mailtoUrl += `&cc=${encodeURIComponent(emailSettings.ccEmails)}`;
        }
        if (emailSettings.bccEmails) {
          mailtoUrl += `&bcc=${encodeURIComponent(emailSettings.bccEmails)}`;
        }
        if (pdfBlob) {
          mailtoUrl += `&attachment=${encodeURIComponent(`${selectedContract.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`)}`;
          mailtoUrl += `&data=${encodeURIComponent(await pdfBlob.text())}`;
        }

        window.open(mailtoUrl, '_blank');
        toast.success('Contract sent successfully via mailto!');
      } else {
        // No email provider configured, just download the PDF
        if (pdfBlob) {
          const url = window.URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${selectedContract.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          toast.success('Contract PDF downloaded successfully! You can now send it manually.')
        }
      }
      
      setSendModalOpen(false)
      
      // Refresh contracts to show updated status
      loadContracts()
    } catch (error) {
      console.error('Error processing contract:', error)
      toast.error('Failed to process contract')
    } finally {
      setSending(false)
    }
  }

  const handleDownloadPDF = async (contract: Contract) => {
    try {
      // Generate HTML content
      let htmlContent = ""
      if (contract.contract_html) {
        const supabase = createClient()
        const { data, error } = await supabase.storage
          .from('files')
          .download(contract.contract_html)
        
        if (!error && data) {
          htmlContent = await data.text()
        }
      }
      
      if (!htmlContent && contract.contract_content) {
        htmlContent = generateContractDocument(contract.contract_content)
      }

      if (!htmlContent) {
        toast.error('No contract content available for download')
        return
      }

      // Create a temporary div to render the HTML content
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = htmlContent
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.backgroundColor = 'white'
      tempDiv.style.padding = '40px'
      document.body.appendChild(tempDiv)

      try {
        // Convert HTML to canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 800,
          height: tempDiv.scrollHeight,
        })

        // Create PDF
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const imgWidth = 210 // A4 width in mm
        const pageHeight = 295 // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width
        let heightLeft = imgHeight

        let position = 0

        // Add first page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight

        // Add additional pages if content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight
          pdf.addPage()
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight
        }

        // Download the PDF
        pdf.save(`${contract.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`)
        toast.success('Contract downloaded as PDF successfully!')
      } finally {
        // Clean up temporary div
        document.body.removeChild(tempDiv)
      }
    } catch (error) {
      console.error('Error downloading contract:', error)
      toast.error('Failed to download contract as PDF')
    }
  }

  const generateContractDocument = (content: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.clientName || 'Contract'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            margin-bottom: 40px; 
            padding: 40px 20px 20px;
            border-bottom: 1px solid #e5e7eb;
        }
        .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 10px;
        }
        .header p {
            font-size: 1.125rem;
            color: #6b7280;
        }
        .content {
            padding: 0 40px 40px;
        }
        .section { 
            margin-bottom: 32px; 
        }
        .section h2 { 
            color: #111827; 
            border-bottom: 2px solid #3C3CFF; 
            padding-bottom: 8px; 
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .parties { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 24px; 
            margin-bottom: 32px; 
        }
        .party { 
            border-left: 4px solid #3C3CFF; 
            padding-left: 16px; 
        }
        .party h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .party p {
            color: #374151;
            margin-bottom: 4px;
        }
        .party .name {
            font-weight: 500;
            color: #111827;
        }
        .content-box {
            background-color: #f9fafb;
            padding: 24px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
        }
        .content-box p {
            color: #374151;
            margin: 0;
        }
        .payment-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .payment-field {
            margin-bottom: 16px;
        }
        .payment-field label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
        }
        .payment-field input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
        }
        .payment-field textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: white;
            font-size: 0.875rem;
            resize: vertical;
            min-height: 80px;
        }
        .estimated-total {
            background-color: #dbeafe;
            border: 1px solid #93c5fd;
            border-radius: 8px;
            padding: 12px;
            margin-top: 16px;
        }
        .estimated-total .label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #1e40af;
        }
        .estimated-total .amount {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1e3a8a;
        }
        .estimated-total .details {
            font-size: 0.75rem;
            color: #3b82f6;
        }
        .signature-section {
            margin-top: 32px;
        }
        .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .signature-area {
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 24px;
            text-align: center;
            background: white;
        }
        .signature-area h3 {
            font-weight: 600;
            color: #111827;
            margin-bottom: 8px;
        }
        .signature-area p {
            color: #6b7280;
            font-size: 0.875rem;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 24px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 0.875rem;
        }
        @media (max-width: 768px) {
            .parties, .payment-grid, .signature-grid {
                grid-template-columns: 1fr;
            }
            .content {
                padding: 0 20px 40px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CONTRACT FOR SERVICES</h1>
            <p>This agreement is made and entered into as of ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        </div>

        <div class="content">
            <div class="section">
                <h2>PARTIES</h2>
                <div class="parties">
                    <div class="party">
                        <h3>COMPANY</h3>
                        <p class="name">${content.companyName || 'Your Company'}</p>
                        ${content.companyAddress ? `<p>${content.companyAddress}</p>` : ''}
                    </div>
                    <div class="party">
                        <h3>CLIENT</h3>
                        <p class="name">${content.clientName || 'Client Name'}</p>
                        ${content.clientEmail ? `<p>${content.clientEmail}</p>` : ''}
                        ${content.clientAddress ? `<p>${content.clientAddress}</p>` : ''}
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>1. PROJECT SCOPE</h2>
                <div class="content-box">
                    <p>${content.projectScope || 'Project scope to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>2. PAYMENT TERMS</h2>
                <div class="content-box">
                    ${content.paymentType === "fixed" ? `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Total Amount</label>
                                <input type="text" value="${content.totalAmount || '$0.00'}" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Deposit Amount</label>
                                <input type="text" value="${content.depositAmount || '$0.00'}" readonly />
                            </div>
                        </div>
                    ` : `
                        <div class="payment-grid">
                            <div class="payment-field">
                                <label>Hourly Rate</label>
                                <input type="text" value="${content.hourlyRate || '$0.00'}/hour" readonly />
                            </div>
                            <div class="payment-field">
                                <label>Estimated Hours</label>
                                <input type="text" value="${content.estimatedHours || '0'} hours" readonly />
                            </div>
                        </div>
                        ${content.hourlyRate && content.estimatedHours ? `
                            <div class="estimated-total">
                                <div class="label">Estimated Total</div>
                                <div class="amount">$${(parseFloat(content.hourlyRate) * parseFloat(content.estimatedHours)).toFixed(2)}</div>
                                <div class="details">Based on ${content.estimatedHours} hours at $${content.hourlyRate}/hour</div>
                            </div>
                        ` : ''}
                    `}
                    <div class="payment-field" style="margin-top: 16px;">
                        <label>Payment Terms</label>
                        <textarea readonly>${content.paymentTerms || ''}</textarea>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>3. DELIVERABLES & MILESTONES</h2>
                <div class="content-box">
                    <p>${content.milestones || 'Project milestones to be defined...'}</p>
                </div>
            </div>

            <div class="section">
                <h2>4. INTELLECTUAL PROPERTY</h2>
                <div class="content-box">
                    <p>${content.ipRights === "client" ? "All work product will be owned by the Client upon full payment." : 
                        content.ipRights === "shared" ? "Intellectual property will be shared between parties." : 
                        "Contractor retains all intellectual property rights."}</p>
                </div>
            </div>

            <div class="section">
                <h2>5. ADDITIONAL TERMS</h2>
                <div class="content-box">
                    <p><strong>Included Revisions:</strong> ${content.revisions || '3'} revision${(content.revisions || '3') !== "1" ? "s" : ""}</p>
                    <p><strong>Termination:</strong> Either party may terminate this agreement with ${content.terminationClause || '30-day notice'}</p>
                </div>
            </div>

            <div class="section signature-section">
                <h2>6. SIGNATURES</h2>
                <p style="margin-bottom: 16px; color: #374151;">
                    This contract requires signatures from both parties. 
                    ${content.signatureOrder === "sequential" 
                        ? " Signatures will be collected sequentially (Company first, then Client)." 
                        : " Both parties may sign simultaneously."}
                </p>
                
                <div class="signature-grid">
                    <div class="signature-area">
                        <h3>Company Signature</h3>
                        ${content.companySignature ? `<img src="${content.companySignature}" alt="Company Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                    </div>
                    
                    <div class="signature-area">
                        <h3>Client Signature</h3>
                        ${content.clientSignature ? `<img src="${content.clientSignature}" alt="Client Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>This contract is valid and binding upon both parties upon signature.</p>
            <p style="margin-top: 4px;">Generated on ${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}</p>
        </div>
    </div>
</body>
</html>
    `
  }

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contract.client_name && contract.client_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contract.project_name && contract.project_name.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus = statusFilter === "all" || contract.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleSelectContract = (contractId: string) => {
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

  const formatCurrency = (value?: number, currency = 'USD') => {
    if (!value) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(value)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getLastActivity = (contract: Contract) => {
    if (contract.signed_at) return `Signed ${formatDate(contract.signed_at)}`
    if (contract.sent_at) return `Sent ${formatDate(contract.sent_at)}`
    if (contract.declined_at) return `Declined ${formatDate(contract.declined_at)}`
    if (contract.last_activity_at) return `Updated ${formatDate(contract.last_activity_at)}`
    return `Created ${formatDate(contract.created_at)}`
  }

  if (loading) {
    return (
      <DashboardLayout title="Contracts" subtitle="Manage contracts, templates, and e-signatures">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    )
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
                  <SelectItem value="archived">Archived</SelectItem>
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
                            href={`/dashboard/contracts/${contract.contract_number}`}
                            className="text-lg font-semibold text-gray-900 hover:text-[#3C3CFF] transition-colors"
                          >
                            {contract.name}
                          </Link>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            {contract.client_name && (
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {contract.client_name}
                              </div>
                            )}
                            {contract.project_name && (
                              <div className="flex items-center gap-1">
                                <Package className="h-4 w-4" />
                                {contract.project_name}
                              </div>
                            )}
                            {contract.total_value && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(contract.total_value, contract.currency)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={statusConfig[contract.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800"}>
                            {statusConfig[contract.status as keyof typeof statusConfig]?.label || contract.status}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewContract(contract)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/contracts/new?edit=${contract.id}`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendContract(contract)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send/Resend
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract, 'draft')}>
                                <FileText className="h-4 w-4 mr-2" />
                                Make Draft
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract, 'awaiting_signature')}>
                                <Clock className="h-4 w-4 mr-2" />
                                Make Pending
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract, 'signed')}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Signed
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(contract, 'archived')}>
                                <Package className="h-4 w-4 mr-2" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadPDF(contract)}>
                                <Download className="h-4 w-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateContract(contract)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteContract(contract.id)}
                                disabled={deletingContract === contract.id}
                              >
                                {deletingContract === contract.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4 mr-2" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {getLastActivity(contract)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Contract Modal */}
      <Dialog open={sendModalOpen} onOpenChange={setSendModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Send Contract</span>
              <Button variant="ghost" size="sm" onClick={() => setSendModalOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="send-to">To</Label>
              <Input
                id="send-to"
                type="email"
                value={emailSettings.to}
                onChange={(e) => setEmailSettings({ ...emailSettings, to: e.target.value })}
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <Label htmlFor="send-subject">Subject</Label>
              <Input
                id="send-subject"
                value={emailSettings.subject}
                onChange={(e) => setEmailSettings({ ...emailSettings, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="send-body">Body</Label>
              <Textarea
                id="send-body"
                value={emailSettings.body}
                onChange={(e) => setEmailSettings({ ...emailSettings, body: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="send-cc">CC (comma-separated)</Label>
              <Input
                id="send-cc"
                value={emailSettings.ccEmails}
                onChange={(e) => setEmailSettings({ ...emailSettings, ccEmails: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="send-bcc">BCC (comma-separated)</Label>
              <Input
                id="send-bcc"
                value={emailSettings.bccEmails}
                onChange={(e) => setEmailSettings({ ...emailSettings, bccEmails: e.target.value })}
              />
            </div>
            <Button onClick={handleSendSubmit} disabled={sending} className="w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sending ? 'Sending...' : emailSettings.to ? 'Send Contract' : 'Enter Recipient Email'}
            </Button>
            
            {!emailSettings.to && (
              <p className="text-xs text-gray-500 text-center">
                Please enter an email address to send the contract.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
