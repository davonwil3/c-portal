import { NextRequest, NextResponse } from 'next/server'
import { parseDomainFromHost } from './lib/domain-config'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const url = request.nextUrl.clone()
  
  // Parse domain to extract company and client slugs
  const domainConfig = parseDomainFromHost(host)
  
  // Handle custom domain routing
  if (domainConfig.isProduction) {
    if (domainConfig.clientSlug) {
      // Route: company.client.flowtrack.works -> /[company]/[client]
      url.pathname = `/${domainConfig.companySlug}/${domainConfig.clientSlug}`
    } else {
      // Route: company.flowtrack.works -> /[company]
      url.pathname = `/${domainConfig.companySlug}`
    }
    
    // Rewrite the URL to the internal route
    return NextResponse.rewrite(url)
  }
  
  // For development, continue with normal routing
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except for the ones starting with:
    // - api (API routes)
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 