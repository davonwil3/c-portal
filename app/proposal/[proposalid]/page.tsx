"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import ProposalViewer from "@/components/proposals/ProposalViewer"
import { Loader2 } from "lucide-react"

export default function LiveProposalPage() {
  const params = useParams()
  const proposalId = params.proposalid as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [proposalExists, setProposalExists] = useState(false)

  useEffect(() => {
    const checkProposal = async () => {
      try {
        const supabase = createClient()
        
        // Check if proposal exists and is accessible (not draft)
        const { data: proposal, error: proposalError } = await supabase
          .from('proposals')
          .select('id, status')
          .eq('id', proposalId)
          .single()

        if (proposalError) {
          console.error('Error fetching proposal:', proposalError)
          setError('Proposal not found')
          setLoading(false)
          return
        }

        if (!proposal) {
          setError('Proposal not found')
          setLoading(false)
          return
        }

        // Allow viewing proposals that are Sent, Accepted, or Declined
        // Don't allow Draft proposals to be viewed publicly
        if (proposal.status === 'Draft') {
          setError('This proposal is not yet available')
          setLoading(false)
          return
        }

        setProposalExists(true)
        setLoading(false)
      } catch (err) {
        console.error('Error checking proposal:', err)
        setError('Failed to load proposal')
        setLoading(false)
      }
    }

    if (proposalId) {
      checkProposal()
    }
  }, [proposalId])

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-[#3C3CFF] mb-4" />
          <p className="text-gray-600">Loading proposal...</p>
        </div>
      </div>
    )
  }

  if (error || !proposalExists) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50/20">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-4 text-6xl">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {error || 'Proposal Not Found'}
          </h1>
          <p className="text-gray-600">
            This proposal link may be invalid or the proposal may no longer be available.
          </p>
        </div>
      </div>
    )
  }

  return <ProposalViewer proposalId={proposalId} enableSignature={true} />
}

