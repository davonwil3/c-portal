import { NextRequest, NextResponse } from 'next/server'
import { parseDomainFromHost } from './lib/domain-config'
import { normalizeHost, isAppDomain, getCustomDomainUser } from './lib/custom-domain-routing'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  const pathname = request.nextUrl.pathname
  
  // Handle jolix.io portfolio subdomains (production)
  // Route: subdomain.jolix.io -> /portfolio/[subdomain]
  if (host.endsWith('.jolix.io')) {
    const subdomain = host.replace('.jolix.io', '')
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      url.pathname = `/portfolio/${subdomain}`
      return NextResponse.rewrite(url)
    }
  }
  
  // Handle localhost portfolio subdomains (development)
  // Route: subdomain.localhost:3000 or subdomain.localhost -> /portfolio/[subdomain]
  if (host.includes('.localhost')) {
    const subdomain = host.split('.localhost')[0]
    if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
      // Log localhost subdomain request for debugging
      console.log(`[Localhost Subdomain] Serving ${host} -> portfolio/${subdomain}${pathname !== '/' ? ` (path: ${pathname})` : ''}`)
      url.pathname = `/portfolio/${subdomain}`
      return NextResponse.rewrite(url)
    }
  }
  
  // Check if this is one of our own app domains - skip custom domain lookup
  // But still handle jolix.io subdomains and company/client routing
  if (isAppDomain(host)) {
    // Parse domain to extract company and client slugs for existing routing
    const domainConfig = parseDomainFromHost(host)
    
    // Handle custom domain routing for company/client portals (only in production)
    if (domainConfig.isProduction && domainConfig.companySlug) {
      if (domainConfig.clientSlug) {
        // Route: company.client.yourdomain.com -> /[company]/[client]
        url.pathname = `/${domainConfig.companySlug}/${domainConfig.clientSlug}`
      } else {
        // Route: company.yourdomain.com -> /[company]
        url.pathname = `/${domainConfig.companySlug}`
      }
      
      // Rewrite the URL to the internal route
      return NextResponse.rewrite(url)
    }
    
    // For our own domains (jolix.io subdomains already handled above), continue with normal routing
    return NextResponse.next()
  }
  
  // Check for custom domain routing (portfolio custom domains)
  // Only check if it's not one of our app domains
  const normalizedHost = normalizeHost(host)
  const customDomainInfo = await getCustomDomainUser(normalizedHost)
  
  if (customDomainInfo) {
    // Log custom domain request for debugging
    console.log(`[Custom Domain] Serving ${normalizedHost} -> portfolio/${customDomainInfo.portfolioDomain}${pathname !== '/' ? ` (path: ${pathname})` : ''}`)
    
    // Route to portfolio page using the portfolio domain
    // This reuses the existing /portfolio/[domain] route
    // Note: Portfolio uses hash-based navigation (#contact, #projects, etc.)
    // so we route to the root portfolio page
    url.pathname = `/portfolio/${customDomainInfo.portfolioDomain}`
    return NextResponse.rewrite(url)
  }
  
  // For development or non-custom domains, continue with normal routing
  // Allow access to auth routes
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - static assets (.jpg, .jpeg, .png, .svg, .gif, .webp, .ico, .pdf, etc.)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.jpg|.*\\.jpeg|.*\\.png|.*\\.svg|.*\\.gif|.*\\.webp|.*\\.ico|.*\\.pdf|.*\\.woff|.*\\.woff2).*)',
  ],
} 