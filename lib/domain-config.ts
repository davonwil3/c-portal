export interface DomainConfig {
  companySlug: string
  clientSlug?: string
  customDomain?: string
  isProduction: boolean
}

export function parseDomainFromHost(host: string): DomainConfig {
  // Remove port if present
  const cleanHost = host.split(':')[0]
  
  // Check if it's a custom domain (flowtrack.works)
  if (cleanHost.endsWith('.flowtrack.works')) {
    const parts = cleanHost.split('.')
    
    if (parts.length === 3) {
      // Format: company.flowtrack.works
      return {
        companySlug: parts[0],
        isProduction: true
      }
    } else if (parts.length === 4) {
      // Format: company.client.flowtrack.works
      return {
        companySlug: parts[0],
        clientSlug: parts[1],
        isProduction: true
      }
    }
  }
  
  // Check if it's localhost or development
  if (cleanHost === 'localhost' || cleanHost.includes('localhost')) {
    return {
      companySlug: 'demo', // Default for development
      isProduction: false
    }
  }
  
  // Check if it's a vercel preview or custom domain
  if (cleanHost.includes('vercel.app') || cleanHost.includes('netlify.app')) {
    // Extract company slug from path or use default
    return {
      companySlug: 'demo',
      isProduction: false
    }
  }
  
  // Default fallback
  return {
    companySlug: 'demo',
    isProduction: false
  }
}

export function getPortalUrl(companySlug: string, clientSlug?: string, isProduction = false): string {
  if (isProduction) {
    if (clientSlug) {
      return `https://${companySlug}.${clientSlug}.flowtrack.works`
    } else {
      return `https://${companySlug}.flowtrack.works`
    }
  }
  
  // Development URLs
  if (clientSlug) {
    return `http://localhost:3000/${companySlug}?client=${clientSlug}`
  } else {
    return `http://localhost:3000/${companySlug}`
  }
}

export function getMagicLinkUrl(companySlug: string, clientSlug: string, token: string, isProduction = false): string {
  if (isProduction) {
    return `https://${companySlug}.${clientSlug}.flowtrack.works?token=${token}`
  }
  
  // Development URL
  return `http://localhost:3000/${companySlug}?client=${clientSlug}&token=${token}`
}
