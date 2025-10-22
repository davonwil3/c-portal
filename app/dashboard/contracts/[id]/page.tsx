"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
  Loader2,
  Trash2,
} from "lucide-react"
import Link from "next/link"
import { getContractByNumber, createContract, updateContract, deleteContract } from "@/lib/contracts"
import { createClient } from '@/lib/supabase/client'
import { toast } from "sonner"
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: FileText },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Mail },
  awaiting_signature: { label: "Awaiting Signature", color: "bg-purple-100 text-purple-800", icon: Clock },
  partially_signed: { label: "Partially Signed", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  signed: { label: "Signed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800", icon: AlertCircle },
  expired: { label: "Expired", color: "bg-amber-100 text-amber-800", icon: AlertCircle },
  archived: { label: "Archived", color: "bg-gray-100 text-gray-800", icon: FileText },
}

export default function ContractDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [contract, setContract] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [contractHtml, setContractHtml] = useState<string | null>(null)
  const [projectId, setProjectId] = useState<string | null>(null)

  // Generate contract document from contract content as fallback
  const generateContractDocument = (content: any, contractData?: any) => {
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
                        ${contractData?.user_signature_data ? `<img src="${contractData.user_signature_data}" alt="Company Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                        ${contractData?.user_signed_at ? `<p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">Signed on ${new Date(contractData.user_signed_at).toLocaleDateString()}</p>` : ''}
                    </div>
                    
                    <div class="signature-area">
                        <h3>Client Signature</h3>
                        ${contractData?.client_signature_data ? `<img src="${contractData.client_signature_data}" alt="Client Signature" style="max-width: 200px; margin-top: 8px;" />` : '<p>Signature required</p>'}
                        ${contractData?.client_signed_at ? `<p style="font-size: 0.75rem; color: #6b7280; margin-top: 4px;">Signed on ${new Date(contractData.client_signed_at).toLocaleDateString()}</p>` : ''}
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

  // Fetch contract data by contract_number (slug)
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true)
        const contractData = await getContractByNumber(params.id as string)
        if (!contractData) {
          toast.error('Contract not found')
          router.push('/dashboard/contracts')
          return
        }
        setContract(contractData)
        setProjectId(contractData.project_id)
        
        // Always generate contract HTML with current signature data
        if (contractData.contract_content) {
          setContractHtml(generateContractDocument(contractData.contract_content, contractData))
        } else {
          // If no contract content, try to load from storage as fallback
          if (contractData.contract_html) {
            try {
              const supabase = createClient()
              const { data, error } = await supabase.storage
                .from('files')
                .download(contractData.contract_html)
              
              if (!error && data) {
                const htmlText = await data.text()
                setContractHtml(htmlText)
              }
            } catch (storageError) {
              console.error('Error accessing storage:', storageError)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching contract:', error)
        toast.error('Failed to load contract')
        router.push('/dashboard/contracts')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchContract()
    }
  }, [params.id, router])

  const handleDownload = async () => {
    if (!contract) return
    
    try {
      setDownloading(true)
      
      // Generate PDF from the contract HTML content
      if (contractHtml) {
        // Create a temporary div to render the HTML content
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = contractHtml
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
          pdf.save(`${contract.name || 'contract'}.pdf`)
          toast.success('Contract downloaded as PDF successfully!')
        } finally {
          // Clean up temporary div
          document.body.removeChild(tempDiv)
        }
      } else {
        toast.error('No contract content available for download')
      }
    } catch (error) {
      console.error('Error downloading contract:', error)
      toast.error('Failed to download contract as PDF')
    } finally {
      setDownloading(false)
    }
  }

  const handleDuplicate = async () => {
    if (!contract) return
    
    try {
      setDuplicating(true)
      
      // Create new contract with same data
      const newContractData = {
        name: `${contract.name} - Copy`,
        contract_content: contract.contract_content,
        contract_html: contract.contract_html,
        contract_type: contract.contract_type,
        client_id: contract.client_id,
        project_id: contract.project_id,
        total_value: contract.total_value,
        currency: contract.currency,
        payment_terms: contract.payment_terms,
        deposit_amount: contract.deposit_amount,
        start_date: contract.start_date,
        end_date: contract.end_date,
        due_date: contract.due_date,
        expiration_date: contract.expiration_date,
        status: 'draft' as const
      }
      
      const newContract = await createContract(newContractData)
      toast.success('Contract duplicated successfully')
      router.push(`/dashboard/contracts/${newContract.contract_number}`)
    } catch (error) {
      console.error('Error duplicating contract:', error)
      toast.error('Failed to duplicate contract')
    } finally {
      setDuplicating(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!contract) return
    
    try {
      // Update contract status in database
      await updateContract(contract.id, { status: newStatus as any })
      
      // Update local state
      setContract((prev: any) => prev ? { ...prev, status: newStatus } : null)
      
      toast.success(`Contract status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating contract status:', error)
      toast.error('Failed to update contract status')
    }
  }

  const handleDelete = async () => {
    if (!contract) return
    
    if (confirm('Are you sure you want to delete this contract? This action cannot be undone.')) {
      try {
        // Import deleteContract function
        const { deleteContract } = await import('@/lib/contracts')
        await deleteContract(contract.id)
        toast.success('Contract deleted successfully')
        router.push('/dashboard/contracts')
      } catch (error) {
        console.error('Error deleting contract:', error)
        toast.error('Failed to delete contract')
      }
    }
  }

  const handleEdit = () => {
    if (!contract) return
    router.push(`/dashboard/contracts/new?edit=${contract.id}`)
  }

  if (loading) {
    return (
      <DashboardLayout title="Loading..." subtitle="Loading contract details">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading contract...</span>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!contract) {
    return (
      <DashboardLayout title="Contract Not Found" subtitle="The requested contract could not be found">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">The contract you're looking for doesn't exist or you don't have access to it.</p>
          <Button onClick={() => router.push('/dashboard/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const StatusIcon = statusConfig[contract.status as keyof typeof statusConfig]?.icon || FileText
  const statusLabel = statusConfig[contract.status as keyof typeof statusConfig]?.label || "Unknown"
  const statusColor = statusConfig[contract.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800"

  return (
    <DashboardLayout title={contract.name} subtitle="Contract details and signature status">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={projectId ? `/dashboard/projects/${projectId}` : '/dashboard/contracts'}>
                {projectId ? 'Project' : 'Contracts'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{contract.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Sticky Header */}
        <Card className="sticky top-4 z-10 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{contract.name}</h1>
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
                        <Link
                          href={`/dashboard/projects/${contract.project_id}`}
                          className="hover:text-[#3C3CFF] transition-colors"
                        >
                          {contract.project_name}
                        </Link>
                      </div>
                    )}
                    {contract.total_value && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${contract.total_value.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <Badge className={statusColor}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusLabel}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send/Resend
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDuplicate}
                  disabled={duplicating}
                >
                  {duplicating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Duplicate
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Contract
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Make Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('awaiting_signature')}>
                      <Clock className="h-4 w-4 mr-2" />
                      Make Pending
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('signed')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Signed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {/* TODO: Add user signature modal */}}>
                      <Edit className="h-4 w-4 mr-2" />
                      Sign Contract (Company)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                      <Package className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={handleDelete}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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
                <CardTitle>Contract Document</CardTitle>
              </CardHeader>
              <CardContent>
                {contractHtml ? (
                  <div 
                    className="bg-white border rounded-lg shadow-sm overflow-auto"
                    style={{ minHeight: '800px' }}
                    dangerouslySetInnerHTML={{ __html: contractHtml }}
                  />
                ) : (
                  <div className="bg-white border rounded-lg p-8 min-h-[800px] shadow-sm text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No contract content available</p>
                    <p className="text-sm">The contract HTML content could not be loaded.</p>
                  </div>
                )}
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
                {contract.client_name && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Client</p>
                  <Link
                      href={`/dashboard/clients/${contract.client_id}`}
                    className="flex items-center gap-2 mt-1 hover:text-[#3C3CFF] transition-colors"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                          {contract.client_name
                          .split(" ")
                            .map((n: string) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                      <span className="text-sm">{contract.client_name}</span>
                  </Link>
                </div>
                )}

                {contract.project_name && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Project</p>
                    <Link
                      href={`/dashboard/projects/${contract.project_id}`}
                      className="text-sm text-[#3C3CFF] hover:underline mt-1 block"
                    >
                      {contract.project_name}
                    </Link>
                  </div>
                )}

                {contract.total_value && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Value</p>
                    <p className="text-sm mt-1">${contract.total_value.toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-700">Contract Number</p>
                  <p className="text-sm mt-1 font-mono">{contract.contract_number}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700">Created</p>
                  <p className="text-sm mt-1">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>

                {contract.expiration_date && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Expires</p>
                    <p className="text-sm mt-1 text-amber-600">
                      {new Date(contract.expiration_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {contract.sent_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Sent</p>
                    <p className="text-sm mt-1">
                      {new Date(contract.sent_at).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {contract.signed_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Signed</p>
                    <p className="text-sm mt-1 text-green-600">
                      {new Date(contract.signed_at).toLocaleDateString()}
                    </p>
                </div>
                )}
              </CardContent>
            </Card>

            {/* Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-[#3C3CFF] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">Contract created</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-600">You</p>
                        <span className="text-xs text-gray-400">•</span>
                        <p className="text-xs text-gray-600">
                          {new Date(contract.created_at).toLocaleDateString()} at{" "}
                          {new Date(contract.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {contract.sent_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-[#3C3CFF] rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Contract sent to client</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">You</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-600">
                            {new Date(contract.sent_at).toLocaleDateString()} at{" "}
                            {new Date(contract.sent_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contract.client_signed_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Contract signed by client</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">Client</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-600">
                            {new Date(contract.client_signed_at).toLocaleDateString()} at{" "}
                            {new Date(contract.client_signed_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contract.user_signed_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Contract signed by company</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">Company</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-600">
                            {new Date(contract.user_signed_at).toLocaleDateString()} at{" "}
                            {new Date(contract.user_signed_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {contract.declined_at && (
                    <div className="flex gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">Contract declined</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-600">Client</p>
                          <span className="text-xs text-gray-400">•</span>
                          <p className="text-xs text-gray-600">
                            {new Date(contract.declined_at).toLocaleDateString()} at{" "}
                            {new Date(contract.declined_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {contract.total_value && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Value</p>
                    <p className="text-lg font-semibold text-green-600">
                      ${contract.total_value.toLocaleString()}
                    </p>
                  </div>
                  {contract.currency && contract.currency !== 'USD' && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Currency</p>
                      <p className="text-sm">{contract.currency}</p>
                    </div>
                  )}
                  {contract.payment_terms && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Payment Terms</p>
                      <p className="text-sm">{contract.payment_terms}</p>
                    </div>
                  )}
                  {contract.deposit_amount && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Deposit Amount</p>
                      <p className="text-sm">${contract.deposit_amount.toLocaleString()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Signers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Signers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {contract.created_by_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "CP"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{contract.created_by_name || "ClientPortalHQ"}</p>
                    <p className="text-xs text-gray-600">Service Provider</p>
                  </div>
                  <div className="text-right">
                    {contract.user_signature_status === "signed" ? (
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
                
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {contract.signer_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{contract.signer_name || contract.client_name || "Client"}</p>
                    <p className="text-xs text-gray-600">Client</p>
                    {contract.signer_email && (
                      <p className="text-xs text-gray-500">{contract.signer_email}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {contract.client_signature_status === "signed" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Signed</span>
                      </div>
                    ) : contract.client_signature_status === "declined" ? (
                      <div className="flex items-center gap-1 text-red-600">
                        <AlertCircle className="h-4 w-4" />
                        <span className="text-xs">Declined</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
