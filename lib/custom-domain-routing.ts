import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Normalize hostname by:
 * - Removing port number (e.g., example.com:3000 -> example.com)
 * - Removing leading www. (e.g., www.example.com -> example.com)
 * - Converting to lowercase
 */
export function normalizeHost(host: string): string {
  // Remove port if present
  let normalized = host.split(':')[0]
  
  // Remove leading www.
  if (normalized.toLowerCase().startsWith('www.')) {
    normalized = normalized.slice(4)
  }
  
  return normalized.toLowerCase().trim()
}

/**
 * Check if host is one of our own app domains
 */
export function isAppDomain(host: string): boolean {
  const normalized = normalizeHost(host)
  const appDomains = [
    'jolix.io',
    'app.jolix.io',
    'www.jolix.io',
    'localhost',
    '127.0.0.1'
  ]
  
  return appDomains.includes(normalized) || normalized.endsWith('.jolix.io')
}

/**
 * Get user ID and portfolio domain for a custom domain
 * Returns null if domain is not found or not verified
 */
export async function getCustomDomainUser(domain: string): Promise<{ userId: string; portfolioDomain: string } | null> {
  try {
    const supabase = createAdminClient()
    
    // Look up custom domain
    const { data: customDomain, error } = await supabase
      .from('custom_domains')
      .select('user_id, domain')
      .eq('domain', domain)
      .eq('status', 'verified')
      .single()
    
    if (error || !customDomain) {
      return null
    }
    
    // Get user's published portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', customDomain.user_id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (portfolioError || !portfolio) {
      return null
    }
    
    // Get portfolio domain from analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('portfolio_analytics')
      .select('domain')
      .eq('portfolio_id', portfolio.id)
      .single()
    
    if (analyticsError || !analytics) {
      return null
    }
    
    return {
      userId: customDomain.user_id,
      portfolioDomain: analytics.domain
    }
  } catch (error) {
    console.error('Error looking up custom domain:', error)
    return null
  }
}

/**
 * Get portfolio domain directly from user ID
 * This is a simpler lookup when we already have the user ID
 */
export async function getPortfolioDomainByUserId(userId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient()
    
    // Get user's published portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (portfolioError || !portfolio) {
      return null
    }
    
    // Get portfolio domain from analytics
    const { data: analytics, error: analyticsError } = await supabase
      .from('portfolio_analytics')
      .select('domain')
      .eq('portfolio_id', portfolio.id)
      .single()
    
    if (analyticsError || !analytics) {
      return null
    }
    
    return analytics.domain
  } catch (error) {
    console.error('Error getting portfolio domain by user ID:', error)
    return null
  }
}

