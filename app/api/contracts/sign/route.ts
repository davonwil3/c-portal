import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { contractId, signatureData, clientId, projectId } = await request.json()

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

    // Determine if this is a client or user signature based on clientId
    const isClientSignature = !!clientId
    
    // Update the contract with signature data
    const updateData = isClientSignature ? {
      client_signature_data: signatureData,
      client_signature_status: 'signed',
      client_signed_at: new Date().toISOString(),
      client_signer_name: 'Client',
      client_signer_email: null
    } : {
      user_signature_data: signatureData,
      user_signature_status: 'signed', 
      user_signed_at: new Date().toISOString(),
      user_signer_name: 'Company',
      user_signer_email: null
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

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Contract signed successfully'
    })

  } catch (error) {
    console.error('Contract signature error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
