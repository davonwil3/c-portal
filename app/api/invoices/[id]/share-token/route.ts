import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate or get share token for an invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    
    // Get account info for company slug
    const { data: account } = await adminClient
      .from('accounts')
      .select('id, company_name')
      .eq('id', profile.account_id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Get user profile for fallback name
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .single()

    // Generate company slug from company_name or user name
    let companySlug = 'company'
    if (account.company_name) {
      companySlug = account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    } else if (userProfile?.first_name || userProfile?.last_name) {
      const fullName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim()
      companySlug = fullName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }

    // Verify invoice belongs to user's account
    const { data: invoice } = await adminClient
      .from('invoices')
      .select('id, share_token')
      .eq('id', id)
      .eq('account_id', profile.account_id)
      .single()

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // If share_token already exists, return it
    if (invoice.share_token) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shareUrl = `${baseUrl}/${companySlug}/invoice/${invoice.share_token}`
      return NextResponse.json({ share_token: invoice.share_token, share_url: shareUrl })
    }

    // Generate new share token
    const { data: tokenData, error: tokenError } = await adminClient.rpc('generate_invoice_share_token')
    
    if (tokenError || !tokenData) {
      // Fallback: generate short token in JavaScript if RPC fails
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      const fallbackToken = Array.from(crypto.getRandomValues(new Uint8Array(8)))
        .map(b => chars[b % chars.length])
        .join('')
      
      const { error: updateError } = await adminClient
        .from('invoices')
        .update({ share_token: fallbackToken })
        .eq('id', id)
        .eq('account_id', profile.account_id)

      if (updateError) {
        throw updateError
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const shareUrl = `${baseUrl}/${companySlug}/invoice/${fallbackToken}`
      return NextResponse.json({ share_token: fallbackToken, share_url: shareUrl })
    }

    // Update invoice with share token
    const { error: updateError } = await adminClient
      .from('invoices')
      .update({ share_token: tokenData })
      .eq('id', id)
      .eq('account_id', profile.account_id)

    if (updateError) {
      throw updateError
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/${companySlug}/invoice/${tokenData}`
    return NextResponse.json({ share_token: tokenData, share_url: shareUrl })
  } catch (error: any) {
    console.error('Error generating share token:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate share token' }, { status: 500 })
  }
}

