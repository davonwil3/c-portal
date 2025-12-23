"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Loader2 } from "lucide-react"
import { getProposalById } from "@/lib/proposals"
import { toast } from "sonner"
import ProposalViewer from "@/components/proposals/ProposalViewer"

export default function ProposalPreviewPage() {
  const params = useParams()
  const router = useRouter()
  const proposalId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [proposalData, setProposalData] = useState<any>(null)
  const [activeDoc, setActiveDoc] = useState<"proposal" | "contract" | "invoice">("proposal")

  useEffect(() => {
    const loadProposal = async () => {
      try {
        setLoading(true)
        const proposal = await getProposalById(proposalId)
        if (!proposal || !proposal.proposal_data) {
          toast.error("Proposal not found")
          router.push("/dashboard/proposals/create")
          return
        }
        
        // Set initial active doc
        let initialDoc = "proposal"
        if (proposal.proposal_data.documents?.proposalEnabled) {
          initialDoc = "proposal"
        } else if (proposal.proposal_data.documents?.contractEnabled) {
          initialDoc = "contract"
        } else if (proposal.proposal_data.documents?.invoiceEnabled) {
          initialDoc = "invoice"
        }
        setActiveDoc(initialDoc as any)
        
        // Combine proposal data with active doc state
        setProposalData({
          ...proposal.proposal_data,
          activeDoc: initialDoc,
        })
      } catch (error) {
        console.error("Error loading proposal:", error)
        toast.error("Failed to load proposal")
        router.push("/dashboard/proposals/create")
      } finally {
        setLoading(false)
      }
    }

    if (proposalId) {
      loadProposal()
    }
  }, [proposalId, router])
  
  const handleFieldChange = (field: string, value: any) => {
    if (field === 'activeDoc') {
      setActiveDoc(value)
      setProposalData((prev: any) => ({ ...prev, activeDoc: value }))
    }
  }
  
  const handleClientSign = (signatureData: { name: string; date: string }) => {
    console.log('Client signed:', signatureData)
    toast.success('Contract signed successfully!')
    // In the future, this would save to database
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#3C3CFF] mb-4" />
          <p className="text-gray-600">Loading proposal preview...</p>
        </div>
      </div>
    )
  }

  if (!proposalData) {
    return null
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50/20">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Proposal Preview</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.close()}
        >
          <X className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>

      {/* Preview Content - Using ProposalViewer */}
      <div className="flex-1 overflow-hidden">
        <ProposalViewer proposalId={proposalId} />
      </div>
    </div>
  )
}

