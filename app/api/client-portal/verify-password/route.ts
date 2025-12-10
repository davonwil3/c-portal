import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, slug } = await request.json()

    if (!email || !password || !slug) {
      return NextResponse.json(
        { success: false, message: 'Email, password, and slug are required' },
        { status: 400 }
      )
    }

    // Find account by slug
    let accountId = null
    const { data: accounts } = await supabaseAdmin
      .from('accounts')
      .select('id, company_name')
    
    if (accounts) {
      const matchingAccount = accounts.find(a => {
        if (!a.company_name) return false
        const accountSlug = a.company_name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()
        return accountSlug === slug
      })
      accountId = matchingAccount?.id
    }

    if (!accountId) {
      // Try matching by user name
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
        accountId = matchingProfile?.account_id || null
      }
    }

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account not found' },
        { status: 404 }
      )
    }

    // Get allowlist entry with password hash
    const { data: allowlistEntry } = await supabaseAdmin
      .from('client_allowlist')
      .select('id, email, password_hash, is_active, has_password_setup')
      .eq('account_id', accountId)
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single()

    if (!allowlistEntry) {
      return NextResponse.json(
        { success: false, message: 'Email not authorized for this portal' },
        { status: 403 }
      )
    }

    // Check if password is set up
    if (!allowlistEntry.password_hash) {
      return NextResponse.json(
        { success: false, message: 'Password not set up. Please set up your password first.' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await bcrypt.compare(password, allowlistEntry.password_hash)

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Update has_password_setup flag if not already set
    if (!allowlistEntry.has_password_setup) {
      await supabaseAdmin
        .from('client_allowlist')
        .update({ has_password_setup: true })
        .eq('id', allowlistEntry.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified successfully',
      data: {
        email: allowlistEntry.email
      }
    })

  } catch (error) {
    console.error('Error in verify password API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
