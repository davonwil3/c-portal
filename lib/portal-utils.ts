/**
 * Portal utility functions for generating portal URLs and handling portal logic
 */

interface Account {
  company_name?: string | null
}

interface User {
  first_name?: string | null
  last_name?: string | null
}

/**
 * Generate a slug from company name or user name
 * Converts to lowercase, removes special characters, replaces spaces with hyphens
 */
export function generatePortalSlug(account: Account, user: User): string {
  // Prefer company name if available
  if (account?.company_name) {
    return account.company_name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim()
  }

  // Fall back to user name
  const firstName = user?.first_name || ''
  const lastName = user?.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()

  if (fullName) {
    return fullName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Default fallback
  return 'portal'
}

/**
 * Generate the full live portal URL
 * Format: clientportal.[slug].jolix.io (e.g., clientportal.acme.jolix.io)
 * In dev mode: http://localhost:3000/portal/[slug]
 */
export function generateLivePortalUrl(slug: string): string {
  // Check if we're in development mode (either via NODE_ENV or hostname)
  const isDevelopment = 
    process.env.NODE_ENV === 'development' ||
    (typeof window !== 'undefined' && 
     (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  
  // In development, use localhost with the slug as path
  if (isDevelopment) {
    return `http://localhost:3000/portal/${slug}`
  }

  // In production, use subdomain format: clientportal.[slug].jolix.io
  return `https://clientportal.${slug}.jolix.io`
}

/**
 * Generate the portal URL from account and user data
 */
export function getPortalUrl(account: Account, user: User, portalUrlSlug?: string): string {
  const slug = portalUrlSlug || generatePortalSlug(account, user)
  return generateLivePortalUrl(slug)
}
