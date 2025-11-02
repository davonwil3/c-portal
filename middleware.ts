import { NextRequest, NextResponse } from 'next/server'
import { parseDomainFromHost } from './lib/domain-config'

export function middleware(request: NextRequest) {
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
      url.pathname = `/portfolio/${subdomain}`
      return NextResponse.rewrite(url)
    }
  }
  
  // Parse domain to extract company and client slugs
  const domainConfig = parseDomainFromHost(host)
  
  // Handle custom domain routing (only in production)
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
  
  // For development or non-custom domains, continue with normal routing
  // Block access to auth routes
  if (pathname.startsWith('/auth')) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

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