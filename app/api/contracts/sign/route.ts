import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { contractId, signatureData, clientId, projectId, contractContent, status } = await request.json()

    if (!contractId || !signatureData) {
      return NextResponse.json(
        { success: false, error: 'Contract ID and signature data are required' },
        { status: 400 }
      )
    }

    // Use service role for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the current contract to check existing signatures
    const { data: existingContract, error: fetchError } = await supabase
      .from('contracts')
      .select('client_signature_status, user_signature_status')
      .eq('id', contractId)
      .single()

    if (fetchError || !existingContract) {
      console.error('Error fetching contract:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Determine if this is a client or user signature based on clientId
    const isClientSignature = !!clientId
    
    // Determine the final status based on signatures
    let finalStatus = 'awaiting_signature'
    let finalSignatureStatus = 'pending'
    
    if (isClientSignature) {
      // Client is signing
      const userAlreadySigned = existingContract.user_signature_status === 'signed'
      
      if (userAlreadySigned) {
        // Both parties have signed
        finalStatus = 'signed'
        finalSignatureStatus = 'signed'
      } else {
        // Only client has signed, waiting for user
        finalStatus = 'partially_signed'
        finalSignatureStatus = 'pending'
      }
    } else {
      // User is signing
      const clientAlreadySigned = existingContract.client_signature_status === 'signed'
      
      if (clientAlreadySigned) {
        // Both parties have signed
        finalStatus = 'signed'
        finalSignatureStatus = 'signed'
      } else {
        // Only user has signed, waiting for client
        finalStatus = 'partially_signed'
        finalSignatureStatus = 'pending'
      }
    }
    
    // Parse signature data to get name and date if it's JSON
    let signatureName = 'Client'
    let signatureDate = new Date().toISOString()
    try {
      const parsedSignature = typeof signatureData === 'string' ? JSON.parse(signatureData) : signatureData
      if (parsedSignature && parsedSignature.name) {
        signatureName = parsedSignature.name
      }
      if (parsedSignature && parsedSignature.date) {
        // Convert date from YYYY-MM-DD to ISO string, preserving the local date
        // Date input gives us YYYY-MM-DD in local time, we need to keep it that way
        const dateStr = parsedSignature.date
        if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Create date at noon UTC to avoid timezone issues
          signatureDate = new Date(dateStr + 'T12:00:00.000Z').toISOString()
        } else {
          signatureDate = parsedSignature.date
        }
      }
    } catch (e) {
      // If not JSON, use as is
    }

    // Use provided contractContent or fetch from database
    let content = contractContent || {}
    if (!contractContent) {
      const { data: contractData } = await supabase
        .from('contracts')
        .select('contract_content')
        .eq('id', contractId)
        .single()
      content = contractData?.contract_content || {}
    }
    
    const terms = content.terms || {}
    
    if (isClientSignature) {
      terms.clientSignatureName = signatureName
      terms.clientSignatureDate = signatureDate
      // Update client name if provided in contractContent
      if (contractContent?.client?.name) {
        content.client = { ...content.client, name: contractContent.client.name }
      }
    } else {
      terms.yourName = signatureName
      terms.yourSignatureDate = signatureDate
    }

    // Always recalculate status based on actual signature statuses (don't trust provided status)
    // This ensures status is always correct regardless of what's passed in
    const finalStatusToUse = finalStatus
    const finalSignatureStatusToUse = finalSignatureStatus
    
    // Update the contract with signature data and status
    const updateData = isClientSignature ? {
      contract_content: { ...content, terms },
      client_signature_data: signatureData,
      client_signature_status: 'signed',
      client_signed_at: signatureDate,
      client_signer_name: signatureName,
      client_signer_email: null,
      status: finalStatusToUse,
      signature_status: finalSignatureStatusToUse,
      signed_at: finalStatusToUse === 'signed' ? signatureDate : null
    } : {
      contract_content: { ...content, terms },
      user_signature_data: signatureData,
      user_signature_status: 'signed', 
      user_signed_at: signatureDate,
      user_signer_name: signatureName,
      user_signer_email: null,
      status: finalStatusToUse,
      signature_status: finalSignatureStatusToUse,
      signed_at: finalStatusToUse === 'signed' ? signatureDate : null
    }

    const { data, error } = await supabase
      .from('contracts')
      .update(updateData)
      .eq('id', contractId)
      .select()

    if (error) {
      console.error('Error updating contract with signature:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to save signature' },
        { status: 500 }
      )
    }

    // Log activity if project is associated
    if (projectId) {
      const actionText = isClientSignature 
        ? 'Client signed contract'
        : 'User signed contract'
      
      await supabase
        .from('project_activities')
        .insert({
          project_id: projectId,
          activity_type: 'status_change',
          action: actionText,
          metadata: {
            contract_id: contractId,
            contract_status: finalStatus,
            signed_by: isClientSignature ? 'client' : 'user',
            both_signed: finalStatus === 'signed'
          }
        })
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Contract signed successfully',
      bothSigned: finalStatus === 'signed'
    })

  } catch (error) {
    console.error('Contract signature error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
