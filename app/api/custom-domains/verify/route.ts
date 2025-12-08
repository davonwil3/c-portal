import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyDNSRecords, getVerificationErrorMessage } from '@/lib/dns-verification'

// POST - Verify DNS records for current user's custom domain
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Fetch current user's custom domain
    const { data: customDomain, error: fetchError } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (fetchError || !customDomain) {
      return NextResponse.json(
        { error: 'No custom domain found. Please add a domain first.' },
        { status: 404 }
      )
    }
    
    // Update status to 'verifying'
    await supabase
      .from('custom_domains')
      .update({ 
        status: 'verifying',
        updated_at: new Date().toISOString()
      })
      .eq('id', customDomain.id)
    
    // Verify DNS records
    let verificationResult
    let verificationError: string | null = null
    let newStatus: 'verified' | 'failed' = 'failed'
    
    try {
      verificationResult = await verifyDNSRecords(customDomain.domain)
      
      if (verificationResult.success) {
        newStatus = 'verified'
        verificationError = null
      } else {
        newStatus = 'failed'
        verificationError = getVerificationErrorMessage(verificationResult, customDomain.domain)
      }
    } catch (error: any) {
      // Handle DNS verification errors gracefully
      console.error('DNS verification error:', error)
      newStatus = 'failed'
      verificationError = 'Unable to verify DNS records at this time. Please try again in a few minutes.'
    }
    
    // Update custom domain with verification results
    const { data: updatedDomain, error: updateError } = await supabase
      .from('custom_domains')
      .update({
        status: newStatus,
        verification_error: verificationError,
        updated_at: new Date().toISOString()
      })
      .eq('id', customDomain.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error updating custom domain:', updateError)
      return NextResponse.json(
        { error: 'Failed to update domain status' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      customDomain: updatedDomain,
      verificationResult: verificationResult ? {
        success: verificationResult.success,
        details: verificationResult.details
      } : null
    })
  } catch (error) {
    console.error('Error in POST /api/custom-domains/verify:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

