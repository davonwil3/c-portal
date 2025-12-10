import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  let email: string = '', slug: string = ''
  
  try {
    const body = await request.json()
    email = body.email || ''
    slug = body.slug || body.companySlug || '' // Support both for backward compatibility

    if (!email || !slug) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: email and slug' },
        { status: 400 }
      )
    }

    // Find account by matching slug to company name or user name
    console.log('🔍 Looking up account for slug:', slug)
    
    // First try matching by company name
    const { data: accounts } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
    
    let accountData = null
    if (accounts) {
      accountData = accounts.find(a => {
        if (!a.company_name) return false
        const accountSlug = a.company_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        return accountSlug === slug
      })
    }

    // If not found, try matching by user name
    if (!accountData) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('account_id, first_name, last_name')
      
      if (profiles) {
        const matchingProfile = profiles.find(p => {
          const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
          if (!fullName) return false
          const nameSlug = fullName
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
          return nameSlug === slug
        })
        
        if (matchingProfile) {
          const { data: account } = await supabaseAdmin
            .from('accounts')
            .select('id, company_name')
            .eq('id', matchingProfile.account_id)
      .single()
          accountData = account
        }
      }
    }

    if (!accountData) {
      console.log('❌ Account not found for slug:', slug)
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      )
    }

    // Generate company slug from account
    let companySlug = slug
    if (accountData.company_name) {
      companySlug = accountData.company_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    console.log('✅ Account found:', {
      id: accountData.id,
      name: accountData.company_name,
      slug: companySlug
    })

    // Check if email is in allowlist for this account
    const { data: allowlistData, error: allowlistError } = await supabaseAdmin
      .from('client_allowlist')
      .select('email, name, role, is_active')
      .eq('account_id', accountData.id)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (allowlistError || !allowlistData) {
      console.log('❌ Email not in allowlist:', {
        email: email.toLowerCase(),
        accountId: accountData.id
      })
      return NextResponse.json(
        { success: false, message: 'Email not authorized for this portal. Please contact your administrator.' },
        { status: 403 }
      )
    }

    console.log('✅ Email authorized in allowlist:', allowlistData)

    // Get account holder's name if no company name
    let accountHolderName = null
    if (!accountData.company_name) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('account_id', accountData.id)
        .limit(1)
        .single()
      
      if (profile) {
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
        if (fullName) {
          accountHolderName = fullName
        }
      }
    }

    // Generate magic link token
    let tokenData: string
    try {
      const { data, error: tokenError } = await supabaseAdmin.rpc('generate_magic_link_token', {
        p_email: email.toLowerCase(),
        p_company_slug: slug
      })

      if (tokenError) {
        console.error('Error generating magic link token:', tokenError)
        return NextResponse.json(
          { success: false, message: 'Failed to generate magic link: ' + tokenError.message },
          { status: 500 }
        )
      }

      if (!data) {
        return NextResponse.json(
          { success: false, message: 'No token generated' },
          { status: 500 }
        )
      }

      tokenData = data
    } catch (rpcError) {
      console.error('RPC Error:', rpcError)
      return NextResponse.json(
        { success: false, message: 'Database function error: ' + (rpcError as Error).message },
        { status: 500 }
        )
    }

    // Generate magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const isProduction = process.env.NODE_ENV === 'production'
    
    let magicLink: string
    if (isProduction) {
      // Production: Use clientportal.[slug].jolix.io format
      // Middleware will rewrite this to /portal/[slug]/login
      magicLink = `https://clientportal.${companySlug}.jolix.io/login?token=${tokenData}`
    } else {
      // Development: Use localhost with direct path
      magicLink = `${baseUrl}/portal/${companySlug}/login?token=${tokenData}`
    }
    
    console.log('🔗 Generated magic link:', magicLink)
    
    try {
      // Import the email service
      const { sendMagicLinkEmail } = await import('@/lib/email-service')
      
      // Prepare portal name for email
      let portalName = accountData.company_name
      if (!portalName && accountHolderName) {
        // Format name with proper apostrophe (e.g., "Davon Wilson's client portal")
        portalName = `${accountHolderName}'s client portal`
      } else if (!portalName) {
        portalName = 'your client portal'
      }
      
      // Send the magic link email via Resend
      await sendMagicLinkEmail({
        to: email.toLowerCase(),
        recipientName: allowlistData.name || 'there',
        companyName: portalName,
        magicLink,
        from: process.env.FROM_EMAIL || 'noreply@yourdomain.com' // Update with your verified domain
      })
      
      console.log('✅ Magic link email sent successfully to:', email.toLowerCase())
    } catch (emailError) {
      console.error('❌ Failed to send magic link email:', emailError)
      // For development, just log the magic link instead of failing
      if (process.env.NODE_ENV === 'development') {
        console.log('🔗 Development Magic Link:', magicLink)
      }
      // Don't fail the entire request if email fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email!',
      data: {
        email: allowlistData.email,
        name: allowlistData.name,
        role: allowlistData.role
      }
    })

  } catch (error) {
    console.error('Error in magic link API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      email,
      slug
    })
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
} 