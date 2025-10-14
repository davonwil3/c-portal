"use client"

import { useState, useEffect, useRef } from "react"
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
  Loader2,
  Trash2,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import SignatureCanvas from 'react-signature-canvas'
import { getContractTemplates, type ContractTemplate, createContract, updateContract, getContract, type Contract, createContractTemplate, getContractTemplateByNumber, updateContractTemplate } from "@/lib/contracts"
import { getClients as getClientsData } from "@/lib/clients"
import { getProjectsByClient as getProjectsByClientData } from "@/lib/projects"
import { toast } from "sonner"
import { createClient } from '@/lib/supabase/client'

export default function NewContractPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editContractId = searchParams.get('edit')
  const editMode = searchParams.get('mode')
  const isEditMode = !!editContractId
  const isEditingTemplate = editMode === 'template'

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [createNewProject, setCreateNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectDueDate, setNewProjectDueDate] = useState("")

  // Signature refs
  const companySignatureRef = useRef<SignatureCanvas>(null)
  const clientSignatureRef = useRef<SignatureCanvas>(null)

  // Data loading states
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)
  const [loadingClients, setLoadingClients] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingContract, setLoadingContract] = useState(false)

  // Email and saving states
  const [emailProvider, setEmailProvider] = useState<string>("")
  const [isEmailConnected, setIsEmailConnected] = useState(false)
  const [saveOnly, setSaveOnly] = useState(false)
  const [sending, setSending] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [documentName, setDocumentName] = useState("")

  // Contract form data
  const [contractData, setContractData] = useState({
    companyName: "Your Company",
    companyAddress: "",
    companyLogo: null as File | null,
    clientName: "",
    clientEmail: "",
    clientAddress: "",
    projectScope: "",
    milestones: "",
    paymentType: "fixed", // "fixed" or "hourly"
    paymentTerms: "",
    depositAmount: "",
    totalAmount: "",
    hourlyRate: "",
    estimatedHours: "",
    ipRights: "client",
    revisions: "3",
    terminationClause: "30-day notice",
    signatureOrder: "sequential",
    companySignature: null as string | null,
    clientSignature: null as string | null,
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
  const stepTitles = isEditingTemplate 
    ? ["Edit Template", "Link Context", "Fill Fields", "Review & Edit", "Save Template"]
    : ["Choose Template", "Link Context", "Fill Fields", "Review & Edit", "Send Contract"]

  // Load existing contract or template data if in edit mode
  useEffect(() => {
    if (isEditMode && editContractId) {
      if (isEditingTemplate) {
        loadExistingTemplate(editContractId)
      } else {
        loadExistingContract(editContractId)
      }
    }
  }, [isEditMode, editContractId, isEditingTemplate])

  // Load template data when a template is selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate !== "blank") {
      loadTemplateData(selectedTemplate)
    }
  }, [selectedTemplate])

  const loadExistingContract = async (contractId: string) => {
    try {
      setLoadingContract(true)
      const contract = await getContract(contractId)
      
      if (!contract) {
        toast.error('Contract not found')
        router.push('/dashboard/contracts')
        return
      }

      // Pre-fill contract data from existing contract
      if (contract.contract_content) {
        const content = contract.contract_content
        setContractData({
          companyName: content.companyName || "Your Company",
          companyAddress: content.companyAddress || "",
          companyLogo: null, // Logo would need to be re-uploaded
          clientName: content.clientName || "",
          clientEmail: content.clientEmail || "",
          clientAddress: content.clientAddress || "",
          projectScope: content.projectScope || "",
          milestones: content.milestones || "",
          paymentType: content.paymentType || "fixed",
          paymentTerms: content.paymentTerms || "",
          depositAmount: content.depositAmount || "",
          totalAmount: content.totalAmount || "",
          hourlyRate: content.hourlyRate || "",
          estimatedHours: content.estimatedHours || "",
          ipRights: content.ipRights || "client",
          revisions: content.revisions || "3",
          terminationClause: content.terminationClause || "30-day notice",
          signatureOrder: content.signatureOrder || "sequential",
          companySignature: content.companySignature || null,
          clientSignature: content.clientSignature || null,
        })
      }

      // Set client and project selections
      if (contract.client_id) {
        setSelectedClient(contract.client_id)
      }
      if (contract.project_id) {
        setSelectedProject(contract.project_id)
      }

      // Set document name
      setDocumentName(contract.name || "")

      // Set email settings
      setEmailSettings({
        subject: contract.email_subject || "Contract for Review and Signature",
        body: contract.email_body || "Please review and sign the attached contract.",
        ccEmails: contract.cc_emails?.join(', ') || "",
        bccEmails: contract.bcc_emails?.join(', ') || "",
        reminderSchedule: contract.reminder_schedule || "3-days",
        expirationDate: contract.expiration_date ? new Date(contract.expiration_date).toISOString().split('T')[0] : "",
      })

      // Skip to step 2 for editing (since template is already chosen)
      setCurrentStep(2)

      toast.success('Contract loaded for editing')
    } catch (error) {
      console.error('Error loading contract:', error)
      toast.error('Failed to load contract')
      router.push('/dashboard/contracts')
    } finally {
      setLoadingContract(false)
    }
  }

  const loadTemplateData = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId)
      if (template && template.template_content) {
        const content = template.template_content
        
        // Populate all form fields with template data
        setContractData({
          companyName: content.companyName || "Your Company",
          companyAddress: content.companyAddress || "",
          companyLogo: null, // Logo would need to be re-uploaded
          clientName: content.clientName || "",
          clientEmail: content.clientEmail || "",
          clientAddress: content.clientAddress || "",
          projectScope: content.projectScope || "",
          milestones: content.milestones || "",
          paymentType: content.paymentType || "fixed",
          paymentTerms: content.paymentTerms || "",
          depositAmount: content.depositAmount || "",
          totalAmount: content.totalAmount || "",
          hourlyRate: content.hourlyRate || "",
          estimatedHours: content.estimatedHours || "",
          ipRights: content.ipRights || "client",
          revisions: content.revisions || "3",
          terminationClause: content.terminationClause || "30-day notice",
          signatureOrder: content.signatureOrder || "sequential",
          companySignature: content.companySignature || null,
          clientSignature: content.clientSignature || null,
        })

        // Set document name from template
        setDocumentName(template.name || "")
        
        toast.success(`Template "${template.name}" loaded successfully!`)
      }
    } catch (error) {
      console.error('Error loading template data:', error)
      toast.error('Failed to load template data')
    }
  }

  const loadExistingTemplate = async (templateNumber: string) => {
    try {
      setLoadingContract(true)
      
      // Get template directly from database by template_number
      const template = await getContractTemplateByNumber(templateNumber)
      
      if (!template) {
        toast.error('Template not found')
        router.push('/dashboard/contracts/templates')
        return
      }

      // Set the template as selected
      setSelectedTemplate(template.id)

      // Pre-fill contract data from template
      if (template.template_content) {
        const content = template.template_content
        setContractData({
          companyName: content.companyName || "Your Company",
          companyAddress: content.companyAddress || "",
          companyLogo: null,
          clientName: content.clientName || "",
          clientEmail: content.clientEmail || "",
          clientAddress: content.clientAddress || "",
          projectScope: content.projectScope || "",
          milestones: content.milestones || "",
          paymentType: content.paymentType || "fixed",
          paymentTerms: content.paymentTerms || "",
          depositAmount: content.depositAmount || "",
          totalAmount: content.totalAmount || "",
          hourlyRate: content.hourlyRate || "",
          estimatedHours: content.estimatedHours || "",
          ipRights: content.ipRights || "client",
          revisions: content.revisions || "3",
          terminationClause: content.terminationClause || "30-day notice",
          signatureOrder: content.signatureOrder || "sequential",
          companySignature: content.companySignature || null,
          clientSignature: content.clientSignature || null,
        })
      }

      // Set document name from template
      setDocumentName(template.name || "")

      // Skip to step 2 for editing (since template is already chosen)
      setCurrentStep(2)

      toast.success('Template loaded for editing')
    } catch (error) {
      console.error('Error loading template:', error)
      toast.error('Failed to load template')
      router.push('/dashboard/contracts/templates')
    } finally {
      setLoadingContract(false)
    }
  }

  // Update client name when client is selected
  useEffect(() => {
    if (selectedClient) {
      const selectedClientData = clients.find(client => client.id === selectedClient)
      if (selectedClientData) {
        setContractData(prev => ({
          ...prev,
          clientName: selectedClientData.company || `${selectedClientData.first_name} ${selectedClientData.last_name}`,
          clientEmail: selectedClientData.email || ""
        }))
      }
    }
  }, [selectedClient, clients])

  // Set default document name
  useEffect(() => {
    if (contractData.clientName && !documentName.trim()) {
      setDocumentName(`${contractData.clientName} - Contract`)
    }
  }, [contractData.clientName]) // Remove documentName from dependencies to prevent interference

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setContractData(prev => ({ ...prev, companyLogo: file }))
    }
  }

  const removeLogo = () => {
    setContractData(prev => ({ ...prev, companyLogo: null }))
  }

  // Signature functions
  const clearCompanySignature = () => {
    companySignatureRef.current?.clear()
    setContractData(prev => ({ ...prev, companySignature: null }))
  }

  const clearClientSignature = () => {
    clientSignatureRef.current?.clear()
    setContractData(prev => ({ ...prev, clientSignature: null }))
  }

  const saveCompanySignature = () => {
    if (companySignatureRef.current?.isEmpty()) {
      toast.error("Please sign before saving")
      return
    }
    const signatureData = companySignatureRef.current?.getTrimmedCanvas().toDataURL('image/png')
    setContractData(prev => ({ ...prev, companySignature: signatureData || null }))
    toast.success("Company signature saved")
  }

  const saveClientSignature = () => {
    if (clientSignatureRef.current?.isEmpty()) {
      toast.error("Please sign before saving")
      return
    }
    const signatureData = clientSignatureRef.current?.getTrimmedCanvas().toDataURL('image/png')
    setContractData(prev => ({ ...prev, clientSignature: signatureData || null }))
    toast.success("Client signature saved")
  }

  useEffect(() => {
    loadTemplates()
    loadClients()
  }, [])

  useEffect(() => {
    if (selectedClient) {
      loadProjects(selectedClient)
    } else {
      setProjects([])
    }
  }, [selectedClient])

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true)
      const data = await getContractTemplates()
      setTemplates(data)
    } catch (error) {
      console.error('Error loading templates:', error)
      toast.error('Failed to load contract templates')
    } finally {
      setLoadingTemplates(false)
    }
  }

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const data = await getClientsData()
      setClients(data)
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadProjects = async (clientId: string) => {
    try {
      setLoadingProjects(true)
      const data = await getProjectsByClientData(clientId)
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

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

  // Connect email provider
  const connectEmailProvider = async (provider: string) => {
    try {
      // This would integrate with your email service (Gmail, Outlook, etc.)
      // For now, we'll simulate the connection
      setEmailProvider(provider)
      setIsEmailConnected(true)
      toast.success(`Connected to ${provider}`)
    } catch (error) {
      toast.error('Failed to connect email provider')
    }
  }

  // Save contract to database and optionally send email
  const handleSaveAndSend = async (saveAsDraft: boolean = false) => {
    if (!documentName.trim()) {
      toast.error("Please enter a document name")
      return
    }

    if (!saveOnly && !isEmailConnected) {
      toast.error("Please connect an email provider to send the contract")
      return
    }

    setSending(true)
    try {
      // Prepare contract data for database
      const contractContent = {
        companyName: contractData.companyName,
        companyAddress: contractData.companyAddress,
        clientName: contractData.clientName,
        clientEmail: contractData.clientEmail,
        clientAddress: contractData.clientAddress,
        projectScope: contractData.projectScope,
        paymentType: contractData.paymentType,
        paymentTerms: contractData.paymentTerms,
        depositAmount: contractData.depositAmount,
        totalAmount: contractData.totalAmount,
        hourlyRate: contractData.hourlyRate,
        estimatedHours: contractData.estimatedHours,
        milestones: contractData.milestones,
        ipRights: contractData.ipRights,
        revisions: contractData.revisions,
        terminationClause: contractData.terminationClause,
        signatureOrder: contractData.signatureOrder,
        companySignature: contractData.companySignature,
        clientSignature: contractData.clientSignature,
      }

      // Prepare data for database
      const contractDataForDB = {
        name: documentName,
        description: `Contract for ${contractData.clientName}`,
        contract_content: contractContent,
        contract_type: 'custom' as const,
        client_id: selectedClient || undefined,
        project_id: selectedProject || undefined,
        status: saveAsDraft ? ('draft' as const) : ('awaiting_signature' as const),
        total_value: contractData.paymentType === "fixed" ? parseFloat(contractData.totalAmount) || 0 : 
                    (parseFloat(contractData.hourlyRate) || 0) * (parseFloat(contractData.estimatedHours) || 0),
        currency: 'USD',
        payment_terms: contractData.paymentTerms,
        deposit_amount: parseFloat(contractData.depositAmount) || 0,
        signer_email: contractData.clientEmail,
        email_subject: emailSettings.subject,
        email_body: emailSettings.body,
        cc_emails: emailSettings.ccEmails ? [emailSettings.ccEmails] : [],
        bcc_emails: emailSettings.bccEmails ? [emailSettings.bccEmails] : [],
        reminder_schedule: emailSettings.reminderSchedule,
        expiration_date: emailSettings.expirationDate ? new Date(emailSettings.expirationDate).toISOString() : undefined,
      }

      let contract: Contract

      if (isEditMode && editContractId) {
        if (isEditingTemplate) {
          // Update existing template
          console.log('Updating template in database...')
          const templateData = {
            name: documentName,
            description: `Template: ${documentName}`,
            template_content: contractContent,
            template_html: generateContractDocument(contractContent),
            template_type: 'custom' as const,
            is_public: false,
            is_default: false,
            tags: ['template', 'custom'],
            metadata: {
              source: 'contract_creator',
              updated_from: 'edit_template'
            }
          }
          
          // Get the template by template_number to get its ID
          const template = await getContractTemplateByNumber(editContractId)
          if (template) {
            await updateContractTemplate(template.id, templateData)
            console.log('Template updated:', template.id)
            toast.success('Template updated successfully!')
            router.push('/dashboard/contracts/templates')
            return
          } else {
            toast.error('Template not found')
            return
          }
        } else {
          // Update existing contract
          console.log('Updating contract in database...')
          contract = await updateContract(editContractId, contractDataForDB)
          console.log('Contract updated:', contract.id)
        }
      } else {
        // Create new contract
        console.log('Creating contract in database...')
        contract = await createContract(contractDataForDB)
        console.log('Contract created:', contract.id)
      }

      const supabase = createClient()

      // Upload logo to unified storage if exists
      if (contractData.companyLogo) {
        console.log('Uploading company logo...')
        const fileExt = contractData.companyLogo.name.split('.').pop()
        const fileName = `contract-logos/${contract.id}.${fileExt}`
        
        // Get account and client info for unified storage path
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_id')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single()
        
        const { data: contractInfo } = await supabase
          .from('contracts')
          .select('client_id')
          .eq('id', contract.id)
          .single()
        
        if (profile && contractInfo) {
          const logoPath = `${profile.account_id}/clients/${contractInfo.client_id}/contracts/${contract.id}/logo.${fileExt}`
          
          const { data: logoData, error: uploadError } = await supabase.storage
            .from('client-portal-content')
            .upload(logoPath, contractData.companyLogo, {
              cacheControl: '3600',
              upsert: false
            })
          
          if (uploadError) {
            console.error('Error uploading logo:', uploadError)
            toast.error('Failed to upload company logo')
          } else {
            console.log('Logo uploaded successfully:', logoData)
            toast.success('Company logo uploaded')
          }
        }
      }

      // Generate and save contract document to storage (exactly as it appears in step 4)
      console.log('Generating contract document...')
      const contractDocument = generateContractDocument(contractContent)
      console.log('Contract document generated, length:', contractDocument.length)
      
      const contractBlob = new Blob([contractDocument], { type: 'text/html' })
      console.log('Contract blob created, size:', contractBlob.size)
      
      // Get account and client info for unified storage path
      const { data: profile } = await supabase
        .from('profiles')
        .select('account_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single()
      
      const { data: contractInfo } = await supabase
        .from('contracts')
        .select('client_id')
        .eq('id', contract.id)
        .single()
      
      let contractFileName = ''
      if (profile && contractInfo) {
        contractFileName = `${profile.account_id}/clients/${contractInfo.client_id}/contracts/${contract.id}/contract.html`
      } else {
        contractFileName = `contracts/${contract.id}/contract.html`
      }
      console.log('Contract file path:', contractFileName)
      
      console.log('Uploading contract document to unified storage...')
      
      const { data: uploadData, error: contractUploadError } = await supabase.storage
        .from('client-portal-content')
        .upload(contractFileName, contractBlob, {
          contentType: 'text/html',
          cacheControl: '3600',
          upsert: false
        })
      
      if (contractUploadError) {
        console.error('Error uploading contract document:', contractUploadError)
        console.error('Error details:', {
          message: contractUploadError.message,
          name: contractUploadError.name
        })
        toast.error(`Failed to upload contract document: ${contractUploadError.message}`)
      } else {
        console.log('Contract document uploaded successfully:', uploadData)
        toast.success('Contract document saved to unified storage')
      }

      // Update contract with file paths
      if (uploadData) {
        await updateContract(contract.id, {
          contract_html: contractFileName,
          contract_pdf_path: contractFileName.replace('.html', '.pdf') // For future PDF generation
        })
      }

      // Send email if not save only
      if (!saveOnly && isEmailConnected) {
        // This would integrate with your email service
        // For now, we'll simulate sending
        await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate email sending
        toast.success("Contract sent successfully!")
      } else {
        toast.success("Contract saved successfully!")
      }

      // Navigate back to contracts page
      router.push('/dashboard/contracts')
      
    } catch (error) {
      console.error('Error saving contract:', error)
      toast.error('Failed to save contract')
    } finally {
      setSending(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditMode ? "Edit Contract Template" : "Choose a Template"}
              </h2>
              <p className="text-gray-600">
                {isEditMode 
                  ? "This contract was created from a template. You can modify the template selection if needed."
                  : "Select a contract template to get started, or create from scratch."
                }
              </p>
            </div>

            {isEditMode && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Edit3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Editing Mode</p>
                      <p className="text-sm text-blue-700 mt-1">
                        You're editing an existing contract. All fields will be pre-filled with current data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Start from Blank Option */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedTemplate === "blank" ? "ring-2 ring-[#3C3CFF] bg-[#F0F2FF]" : "hover:shadow-md"
              }`}
              onClick={() => {
                setSelectedTemplate("blank")
                // Clear all form fields for blank template
                setContractData({
                  companyName: "Your Company",
                  companyAddress: "",
                  companyLogo: null,
                  clientName: "",
                  clientEmail: "",
                  clientAddress: "",
                  projectScope: "",
                  milestones: "",
                  paymentType: "fixed",
                  paymentTerms: "",
                  depositAmount: "",
                  totalAmount: "",
                  hourlyRate: "",
                  estimatedHours: "",
                  ipRights: "client",
                  revisions: "3",
                  terminationClause: "30-day notice",
                  signatureOrder: "sequential",
                  companySignature: null,
                  clientSignature: null,
                })
                setDocumentName("")
              }}
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

            {/* Saved Templates */}
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : templates.length > 0 ? (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Saved Templates</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select a template to automatically populate all fields including company details, payment terms, milestones, and more. 
                  You can then customize any field before proceeding.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((template) => (
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
                            {template.is_default && <Badge className="bg-green-100 text-green-800">Default</Badge>}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{template.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                            <Badge variant="outline" className="mt-2">
                              {template.template_type}
                            </Badge>
                            
                            {/* Show populated fields */}
                            {template.template_content && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-700 mb-2">Pre-filled fields:</p>
                                <div className="flex flex-wrap gap-1">
                                  {template.template_content.companyName && (
                                    <Badge variant="secondary" className="text-xs">Company</Badge>
                                  )}
                                  {template.template_content.clientName && (
                                    <Badge variant="secondary" className="text-xs">Client</Badge>
                                  )}
                                  {template.template_content.projectScope && (
                                    <Badge variant="secondary" className="text-xs">Scope</Badge>
                                  )}
                                  {template.template_content.paymentType && (
                                    <Badge variant="secondary" className="text-xs">Payment</Badge>
                                  )}
                                  {template.template_content.totalAmount && (
                                    <Badge variant="secondary" className="text-xs">Amount</Badge>
                                  )}
                                  {template.template_content.milestones && (
                                    <Badge variant="secondary" className="text-xs">Milestones</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved templates</h3>
                <p className="text-gray-600 mb-6">Create your first contract template to get started</p>
              </div>
            )}

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

            {/* Template Selection Info */}
            {selectedTemplate && selectedTemplate !== "blank" && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Template Selected</p>
                      <p className="text-sm text-green-700 mt-1">
                        All form fields will be automatically populated with the template data. 
                        You can customize any field before proceeding to the next step.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Context</h2>
              <p className="text-gray-600">
                {isEditMode 
                  ? "Review and modify the client and project assignments for this contract."
                  : "Assign this contract to a client and optionally link it to a project."
                }
              </p>
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
                  {loadingClients ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <Select value={selectedClient} onValueChange={setSelectedClient}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div>
                              <div className="font-medium">
                                {`${client.first_name} ${client.last_name}`}
                                {client.company && ` / ${client.company}`}
                              </div>
                              <div className="text-sm text-gray-500">{client.email}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                    loadingProjects ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                      </div>
                    ) : projects.length > 0 ? (
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div>
                                <div className="font-medium">{project.name}</div>
                                <div className="text-sm text-gray-500">
                                  {project.due_date ? `Due: ${new Date(project.due_date).toLocaleDateString()}` : 'No due date'}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No projects found for this client</p>
                      </div>
                    )
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditMode ? "Edit Contract Fields" : "Fill Contract Fields"}
              </h2>
              <p className="text-gray-600">
                {isEditMode 
                  ? "Modify the contract details and terms as needed."
                  : "Complete the contract details and terms."
                }
              </p>
            </div>

            {loadingContract && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading contract data...</span>
              </div>
            )}

            {!loadingContract && (
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
                    <div>
                      <Label htmlFor="company-logo">Company Logo</Label>
                      <Input
                        id="company-logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {contractData.companyLogo && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                          <span>{contractData.companyLogo.name}</span>
                          <Button variant="outline" size="sm" onClick={removeLogo}>
                            Remove
                          </Button>
                        </div>
                      )}
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
                    {/* Payment Type Toggle */}
                    <div>
                      <Label className="text-base font-medium">Payment Structure</Label>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="payment-fixed"
                            name="paymentType"
                            value="fixed"
                            checked={contractData.paymentType === "fixed"}
                            onChange={(e) => setContractData({ ...contractData, paymentType: e.target.value })}
                            className="h-4 w-4 text-[#3C3CFF] border-gray-300 focus:ring-[#3C3CFF]"
                          />
                          <Label htmlFor="payment-fixed" className="text-sm font-medium">
                            Fixed Price
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="payment-hourly"
                            name="paymentType"
                            value="hourly"
                            checked={contractData.paymentType === "hourly"}
                            onChange={(e) => setContractData({ ...contractData, paymentType: e.target.value })}
                            className="h-4 w-4 text-[#3C3CFF] border-gray-300 focus:ring-[#3C3CFF]"
                          />
                          <Label htmlFor="payment-hourly" className="text-sm font-medium">
                            Hourly Rate
                          </Label>
                        </div>
                      </div>
                    </div>

                    {contractData.paymentType === "fixed" ? (
                      /* Fixed Price Fields */
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
                    ) : (
                      /* Hourly Rate Fields */
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hourly-rate">Hourly Rate</Label>
                          <Input
                            id="hourly-rate"
                            value={contractData.hourlyRate}
                            onChange={(e) => setContractData({ ...contractData, hourlyRate: e.target.value })}
                            placeholder="$0.00/hour"
                          />
                        </div>
                        <div>
                          <Label htmlFor="estimated-hours">Estimated Hours</Label>
                          <Input
                            id="estimated-hours"
                            value={contractData.estimatedHours}
                            onChange={(e) => setContractData({ ...contractData, estimatedHours: e.target.value })}
                            placeholder="40 hours"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="payment-terms">Payment Terms</Label>
                      <Textarea
                        id="payment-terms"
                        value={contractData.paymentTerms}
                        onChange={(e) => setContractData({ ...contractData, paymentTerms: e.target.value })}
                        placeholder={contractData.paymentType === "fixed" ? "Net 30, payment due upon completion, etc." : "Weekly invoicing, monthly payments, etc."}
                        rows={3}
                      />
                    </div>

                    {/* Estimated Total for Hourly */}
                    {contractData.paymentType === "hourly" && contractData.hourlyRate && contractData.estimatedHours && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">Estimated Total</div>
                        <div className="text-lg font-semibold text-blue-800">
                          ${(parseFloat(contractData.hourlyRate) * parseFloat(contractData.estimatedHours)).toFixed(2)}
                        </div>
                        <div className="text-xs text-blue-600">
                          Based on {contractData.estimatedHours} hours at ${contractData.hourlyRate}/hour
                        </div>
                      </div>
                    )}
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
            )}
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Edit Contract</h2>
              <p className="text-gray-600">Review and edit your contract content. All fields from the previous steps are included.</p>
            </div>

            {/* Single Contract Editor */}
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Contract Editor</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Copy className="h-4 w-4 mr-2" />
                      Merge Tags
                    </Button>
                    <Button variant="outline" size="sm">
                      <MousePointer className="h-4 w-4 mr-2" />
                      Add Signature
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  <div className="max-w-4xl mx-auto p-8 bg-white">
                    {/* Contract Header with Logo */}
                    <div className="text-center space-y-6 mb-8">
                      {contractData.companyLogo && (
                        <div className="flex justify-center">
                          <img
                            src={URL.createObjectURL(contractData.companyLogo)}
                            alt="Company Logo"
                            className="h-20 w-auto max-w-48 object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">CONTRACT FOR SERVICES</h1>
                        <div className="text-lg text-gray-600">
                          This agreement is made and entered into as of{" "}
                          <span className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Parties Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">PARTIES</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border-l-4 border-[#3C3CFF] pl-4">
                          <h3 className="font-semibold text-gray-900 mb-2">COMPANY</h3>
                          <div className="space-y-1 text-gray-700">
                            <p className="font-medium">{contractData.companyName}</p>
                            {contractData.companyAddress && (
                              <p className="text-sm">{contractData.companyAddress}</p>
                            )}
                          </div>
                        </div>
                        <div className="border-l-4 border-[#3C3CFF] pl-4">
                          <h3 className="font-semibold text-gray-900 mb-2">CLIENT</h3>
                          <div className="space-y-1 text-gray-700">
                            <p className="font-medium">{contractData.clientName}</p>
                            {contractData.clientEmail && (
                              <p className="text-sm">{contractData.clientEmail}</p>
                            )}
                            {contractData.clientAddress && (
                              <p className="text-sm">{contractData.clientAddress}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Project Scope */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">1. PROJECT SCOPE</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border">
                        <Textarea
                          value={contractData.projectScope}
                          onChange={(e) => setContractData({ ...contractData, projectScope: e.target.value })}
                          placeholder="Describe the work to be performed, deliverables, and project objectives..."
                          className="min-h-[120px] border-0 bg-transparent resize-none focus:ring-0 text-gray-700"
                        />
                      </div>
                    </div>

                    {/* Payment Terms */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">2. PAYMENT TERMS</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                        {contractData.paymentType === "fixed" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                              <Input
                                value={contractData.totalAmount}
                                onChange={(e) => setContractData({ ...contractData, totalAmount: e.target.value })}
                                placeholder="$0.00"
                                className="border-0 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount</label>
                              <Input
                                value={contractData.depositAmount}
                                onChange={(e) => setContractData({ ...contractData, depositAmount: e.target.value })}
                                placeholder="$0.00"
                                className="border-0 bg-white"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Hourly Rate</label>
                              <Input
                                value={contractData.hourlyRate}
                                onChange={(e) => setContractData({ ...contractData, hourlyRate: e.target.value })}
                                placeholder="$0.00/hour"
                                className="border-0 bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Hours</label>
                              <Input
                                value={contractData.estimatedHours}
                                onChange={(e) => setContractData({ ...contractData, estimatedHours: e.target.value })}
                                placeholder="40 hours"
                                className="border-0 bg-white"
                              />
                            </div>
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                          <Textarea
                            value={contractData.paymentTerms}
                            onChange={(e) => setContractData({ ...contractData, paymentTerms: e.target.value })}
                            placeholder={contractData.paymentType === "fixed" ? "Net 30, payment due upon completion, etc." : "Weekly invoicing, monthly payments, etc."}
                            className="min-h-[80px] border-0 bg-white resize-none focus:ring-0"
                          />
                        </div>
                        {contractData.paymentType === "hourly" && contractData.hourlyRate && contractData.estimatedHours && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="text-sm font-medium text-blue-900">Estimated Total</div>
                            <div className="text-lg font-semibold text-blue-800">
                              ${(parseFloat(contractData.hourlyRate) * parseFloat(contractData.estimatedHours)).toFixed(2)}
                            </div>
                            <div className="text-xs text-blue-600">
                              Based on {contractData.estimatedHours} hours at ${contractData.hourlyRate}/hour
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deliverables & Milestones */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">3. DELIVERABLES & MILESTONES</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border">
                        <Textarea
                          value={contractData.milestones}
                          onChange={(e) => setContractData({ ...contractData, milestones: e.target.value })}
                          placeholder="List project milestones, deliverables, and deadlines..."
                          className="min-h-[120px] border-0 bg-transparent resize-none focus:ring-0 text-gray-700"
                        />
                      </div>
                    </div>

                    {/* Intellectual Property */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">4. INTELLECTUAL PROPERTY</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border">
                        <Select
                          value={contractData.ipRights}
                          onValueChange={(value) => setContractData({ ...contractData, ipRights: value })}
                        >
                          <SelectTrigger className="border-0 bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">Client owns all rights</SelectItem>
                            <SelectItem value="shared">Shared ownership</SelectItem>
                            <SelectItem value="contractor">Contractor retains rights</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Additional Terms */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">5. ADDITIONAL TERMS</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Included Revisions</label>
                            <Select
                              value={contractData.revisions}
                              onValueChange={(value) => setContractData({ ...contractData, revisions: value })}
                            >
                              <SelectTrigger className="border-0 bg-white">
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
                            <label className="block text-sm font-medium text-gray-700 mb-1">Termination Clause</label>
                            <Select
                              value={contractData.terminationClause}
                              onValueChange={(value) => setContractData({ ...contractData, terminationClause: value })}
                            >
                              <SelectTrigger className="border-0 bg-white">
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
                      </div>
                    </div>

                    {/* Signature Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">6. SIGNATURES</h2>
                      <div className="bg-gray-50 p-6 rounded-lg border">
                        <p className="text-gray-700 mb-4">
                          This contract requires signatures from both parties. 
                          {contractData.signatureOrder === "sequential" 
                            ? " Signatures will be collected sequentially (Company first, then Client)." 
                            : " Both parties may sign simultaneously."}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Company Signature */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">Company Signature</h3>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={clearCompanySignature}
                                  className="h-8 px-3"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={saveCompanySignature}
                                  className="h-8 px-3"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="border-2 border-gray-300 rounded-lg bg-white">
                              <SignatureCanvas
                                ref={companySignatureRef}
                                canvasProps={{
                                  className: 'w-full h-32 rounded-lg'
                                }}
                                backgroundColor="white"
                              />
                            </div>
                            {contractData.companySignature && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Company signature saved</span>
                              </div>
                            )}
                          </div>

                          {/* Client Signature */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-gray-900">Client Signature</h3>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={clearClientSignature}
                                  className="h-8 px-3"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={saveClientSignature}
                                  className="h-8 px-3"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="border-2 border-gray-300 rounded-lg bg-white">
                              <SignatureCanvas
                                ref={clientSignatureRef}
                                canvasProps={{
                                  className: 'w-full h-32 rounded-lg'
                                }}
                                backgroundColor="white"
                              />
                            </div>
                            {contractData.clientSignature && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                <span>Client signature saved</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contract Footer */}
                    <div className="text-center text-sm text-gray-500 border-t pt-6">
                      <p>This contract is valid and binding upon both parties upon signature.</p>
                      <p className="mt-1">Generated on {new Date().toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditingTemplate ? "Save Template" : "Save & Send Contract"}
              </h2>
              <p className="text-gray-600">
                {isEditingTemplate 
                  ? "Review and save your template changes."
                  : "Configure document settings and send your contract for signature."
                }
              </p>
            </div>

            {/* Document Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="document-name">Document Name</Label>
                  <Input
                    id="document-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="Enter document name"
                  />
                </div>
                {!isEditingTemplate && (
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="save-only"
                      checked={saveOnly}
                      onCheckedChange={setSaveOnly}
                    />
                    <Label htmlFor="save-only">Save to client portal and database (don't send email)</Label>
                  </div>
                )}
              </CardContent>
            </Card>

            {!isEditingTemplate && !saveOnly && (
              <>
                {/* Email Provider Connection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isEmailConnected ? (
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">Connect an email provider to send contracts directly to clients.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => connectEmailProvider('Gmail')}
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Connect Gmail
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => connectEmailProvider('Outlook')}
                            className="flex items-center gap-2"
                          >
                            <Mail className="h-4 w-4" />
                            Connect Outlook
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Connected to {emailProvider}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEmailConnected(false)}
                        >
                          Disconnect
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                        📎 Contract attached: {documentName || "Contract"}.pdf
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Save Options */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Save className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Document will be saved to:</p>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Database: Contract details and content</li>
                      
                      {saveOnly ? (
                        <li>• Portal: Ready for client access </li>
                      ) : (
                        <><li>• Email: Sent to client for signature</li><li>• Portal: Ready for client access </li></>
                      )}
                    </ul>
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

  // Generate contract document exactly as it appears in step 4
  const generateContractDocument = (content: any) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName}</title>
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
                        <p class="name">${content.companyName}</p>
                        ${content.companyAddress ? `<p>${content.companyAddress}</p>` : ''}
                    </div>
                    <div class="party">
                        <h3>CLIENT</h3>
                        <p class="name">${content.clientName}</p>
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
                    <p><strong>Included Revisions:</strong> ${content.revisions} revision${content.revisions !== "1" ? "s" : ""}</p>
                    <p><strong>Termination:</strong> Either party may terminate this agreement with ${content.terminationClause}</p>
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

  const saveAsTemplate = async () => {
    if (!documentName.trim()) {
      toast.error('Please enter a document name before saving as template')
      return
    }

    try {
      setSavingTemplate(true)
      
      // Generate contract HTML content
      const htmlContent = generateContractDocument(contractData)
      
      // Create template data
      const templateData = {
        name: documentName,
        description: `Template created from ${documentName}`,
        template_content: contractData,
        template_html: htmlContent,
        template_type: 'custom' as const,
        is_public: false,
        is_default: false,
        tags: ['template', 'custom'],
        metadata: {
          source: 'contract_creator',
          created_from: 'new_contract_page'
        }
      }

      // Save template to database
      const newTemplate = await createContractTemplate(templateData)
      
      toast.success('Template saved successfully!')
      
      // Refresh templates list so it appears in step 1
      await loadTemplates()
      
    } catch (error) {
      console.error('Error saving template:', error)
      toast.error('Failed to save template')
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleDownloadPDF = async () => {
    // Implement PDF download functionality
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
              {isEditMode 
                ? (isEditingTemplate ? "Editing Template" : "Editing Contract") 
                : `Step ${currentStep} of ${totalSteps}`}
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
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 bg-transparent"
                  onClick={saveAsTemplate}
                  disabled={savingTemplate}
                >
                  {savingTemplate ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Save as Template
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleSaveAndSend(true)} // true = save as draft
                  disabled={sending || !documentName.trim()}
                  className="flex items-center gap-2 bg-transparent"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save as Draft
                </Button>
                <Button 
                  onClick={() => handleSaveAndSend(false)} // false = save as pending
                  disabled={sending || !documentName.trim()}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isEditMode 
                    ? (isEditingTemplate ? "Save Template" : "Update Contract") 
                    : (saveOnly ? "Save Contract" : "Save & Send")}
                </Button>
                {!saveOnly && !isEditMode && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2 bg-transparent"
                    disabled={sending}
                  >
                    <Eye className="h-4 w-4" />
                    Send Test to Self
                  </Button>
                )}
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
