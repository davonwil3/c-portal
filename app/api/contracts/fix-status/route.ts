import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API endpoint to fix contract statuses based on signature states
 * This will update contracts where the status doesn't match the actual signature statuses
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the user to verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get account_id from user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get all contracts for this account
    const { data: contracts, error: fetchError } = await supabase
      .from('contracts')
      .select('id, status, client_signature_status, user_signature_status')
      .eq('account_id', profile.account_id)
      .neq('status', 'draft') // Don't update drafts

    if (fetchError) {
      console.error('Error fetching contracts:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch contracts' }, { status: 500 })
    }

    const updates: Array<{ id: string; oldStatus: string; newStatus: string }> = []

    // Check each contract and fix status if needed
    for (const contract of contracts || []) {
      let correctStatus = contract.status

      // Determine what the status should be
      const clientSigned = contract.client_signature_status === 'signed'
      const userSigned = contract.user_signature_status === 'signed'

      if (clientSigned && userSigned) {
        correctStatus = 'signed'
      } else if (clientSigned || userSigned) {
        correctStatus = 'partially_signed'
      } else if (contract.status === 'signed' || contract.status === 'partially_signed') {
        // If neither signed but status says signed, set to awaiting_signature
        correctStatus = 'awaiting_signature'
      }

      // Update if status is incorrect
      if (correctStatus !== contract.status) {
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            status: correctStatus,
            signature_status: correctStatus === 'signed' ? 'signed' : correctStatus === 'partially_signed' ? 'signed' : 'pending'
          })
          .eq('id', contract.id)

        if (updateError) {
          console.error(`Error updating contract ${contract.id}:`, updateError)
        } else {
          updates.push({
            id: contract.id,
            oldStatus: contract.status,
            newStatus: correctStatus
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updates.length} contract(s)`,
      updates
    })

  } catch (error) {
    console.error('Error in fix-status endpoint:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

