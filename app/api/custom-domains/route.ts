import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Domain validation and normalization
function normalizeDomain(domain: string): string {
  // Remove protocol if present
  let normalized = domain.replace(/^https?:\/\//i, '')
  
  // Remove trailing slash and paths
  normalized = normalized.split('/')[0]
  
  // Remove trailing dot
  normalized = normalized.replace(/\.$/, '')
  
  // Remove leading www. (store root domain)
  normalized = normalized.replace(/^www\./i, '')
  
  return normalized.trim().toLowerCase()
}

function validateDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Domain is required' }
  }
  
  const normalized = normalizeDomain(domain)
  
  // Basic hostname validation
  // Allow: example.com, subdomain.example.com
  // Disallow: invalid characters, empty parts, etc.
  const hostnameRegex = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  
  if (!hostnameRegex.test(normalized)) {
    return { valid: false, error: 'Invalid domain format. Please enter a valid domain (e.g., example.com)' }
  }
  
  // Check for localhost or reserved domains
  if (normalized.includes('localhost') || normalized.includes('127.0.0.1')) {
    return { valid: false, error: 'Localhost domains are not allowed' }
  }
  
  // Check length (max 253 characters for FQDN)
  if (normalized.length > 253) {
    return { valid: false, error: 'Domain is too long (max 253 characters)' }
  }
  
  return { valid: true }
}

// GET - Fetch current user's custom domain
export async function GET(request: NextRequest) {
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
    
    // Fetch custom domain for user
    const { data: customDomain, error } = await supabase
      .from('custom_domains')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching custom domain:', error)
      return NextResponse.json(
        { error: 'Failed to fetch custom domain' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      customDomain: customDomain || null
    })
  } catch (error) {
    console.error('Error in GET /api/custom-domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update custom domain
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
    
    const body = await request.json()
    const { domain } = body
    
    if (!domain || typeof domain !== 'string') {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }
    
    // Validate domain
    const validation = validateDomain(domain)
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    
    // Normalize domain
    const normalizedDomain = normalizeDomain(domain)
    
    // Check if domain is already used by another user
    const { data: existingDomain, error: checkError } = await supabase
      .from('custom_domains')
      .select('user_id, domain')
      .eq('domain', normalizedDomain)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing domain:', checkError)
      return NextResponse.json(
        { error: 'Failed to check domain availability' },
        { status: 500 }
      )
    }
    
    if (existingDomain && existingDomain.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This domain is already connected to another Jolix account. Please use a different domain or contact support if you believe this is an error.' },
        { status: 409 }
      )
    }
    
    // Upsert custom domain (insert or update)
    const { data: customDomain, error: upsertError } = await supabase
      .from('custom_domains')
      .upsert({
        user_id: user.id,
        domain: normalizedDomain,
        status: 'pending',
        verification_error: null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single()
    
    if (upsertError) {
      console.error('Error upserting custom domain:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save custom domain' },
        { status: 500 }
      )
    }
    
    // Return domain object and DNS records
    return NextResponse.json({
      customDomain,
      dnsRecords: {
        cname: {
          type: 'CNAME',
          name: 'www',
          value: 'cname.jolix.io',
          ttl: 'Auto'
        },
        a: {
          type: 'A',
          name: '@',
          value: '76.76.21.21',
          ttl: 'Auto'
        }
      }
    })
  } catch (error) {
    console.error('Error in POST /api/custom-domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Disconnect custom domain
export async function DELETE(request: NextRequest) {
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
    
    // Delete custom domain for user
    const { error } = await supabase
      .from('custom_domains')
      .delete()
      .eq('user_id', user.id)
    
    if (error) {
      console.error('Error deleting custom domain:', error)
      return NextResponse.json(
        { error: 'Failed to disconnect domain' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Domain disconnected successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/custom-domains:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

