/**
 * Domain configuration for client portals
 * This handles both development and production environments
 */

export function getMagicLinkUrl(
  companySlug: string, 
  clientSlug: string, 
  token: string, 
  isProduction: boolean = false
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (isProduction) {
    // Production: Use your custom domain
    // You can set PORTAL_DOMAIN env var to your actual domain
    const portalDomain = process.env.PORTAL_DOMAIN || 'clientportalhq.com'
    return `https://${companySlug}.${clientSlug}.${portalDomain}?token=${token}`
  } else {
    // Development: Use localhost with slug structure
    return `${baseUrl}/${companySlug}?client=${clientSlug}&token=${token}`
  }
}

export function getPortalUrl(
  companySlug: string, 
  clientSlug: string, 
  isProduction: boolean = false
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (isProduction) {
    // Production: Use your custom domain
    const portalDomain = process.env.PORTAL_DOMAIN || 'clientportalhq.com'
    return `https://${companySlug}.${clientSlug}.${portalDomain}`
  } else {
    // Development: Use localhost with slug structure
    return `${baseUrl}/${companySlug}/${clientSlug}`
  }
}

export function getCompanyLoginUrl(
  companySlug: string, 
  isProduction: boolean = false
): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (isProduction) {
    // Production: Use your custom domain
    const portalDomain = process.env.PORTAL_DOMAIN || 'clientportalhq.com'
    return `https://${companySlug}.${portalDomain}`
  } else {
    // Development: Use localhost with slug structure
    return `${baseUrl}/${companySlug}`
  }
}

/**
 * Parse domain from host to extract company and client slugs
 * Used by middleware for custom domain routing
 */
export function parseDomainFromHost(host: string) {
  const isProduction = process.env.NODE_ENV === 'production'
  const portalDomain = process.env.PORTAL_DOMAIN || 'clientportalhq.com'
  
  // In development, don't parse domains - use normal routing
  if (!isProduction) {
    return {
      isProduction: false,
      companySlug: null,
      clientSlug: null
    }
  }
  
  // In production, parse the custom domain
  // Expected formats:
  // - company.client.yourdomain.com (client portal)
  // - company.yourdomain.com (company login)
  
  const parts = host.split('.')
  
  // Check if this is a custom domain request
  // Split the portal domain to get the base domain parts
  const portalDomainParts = portalDomain.split('.')
  const baseDomain = portalDomainParts[portalDomainParts.length - 1] // e.g., 'com'
  const domainName = portalDomainParts[portalDomainParts.length - 2] // e.g., 'yourdomain'
  
  // Check if the host ends with our domain
  if (parts.length >= 2 && 
      parts[parts.length - 1] === baseDomain && 
      parts[parts.length - 2] === domainName) {
    
    if (parts.length === 3) {
      // company.client.yourdomain.com
      return {
        isProduction: true,
        companySlug: parts[0],
        clientSlug: parts[1]
      }
    } else if (parts.length === 2) {
      // company.yourdomain.com
      return {
        isProduction: true,
        companySlug: parts[0],
        clientSlug: null
      }
    }
  }
  
  // Not a custom domain request
  return {
    isProduction: false,
    companySlug: null,
    clientSlug: null
  }
}