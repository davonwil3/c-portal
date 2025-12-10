import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Check if this is a client portal subdomain
  // Format: clientportal.[company-name].jolix.io or clientportal.[username].jolix.io
  // Also handle localhost in development
  if (hostname.includes('clientportal') && (hostname.includes('.jolix.io') || hostname.includes('localhost'))) {
    let slug = ''
    
    if (hostname.includes('.jolix.io')) {
      // Production: clientportal.[slug].jolix.io -> extract [slug]
    const parts = hostname.split('.')
      if (parts.length >= 3 && parts[0] === 'clientportal') {
        slug = parts[1] // Get the slug between 'clientportal' and 'jolix'
      }
    } else if (hostname.includes('localhost')) {
      // Development: localhost:3000 - slug will be in the path, handled by Next.js routing
      return NextResponse.next()
    }
    
    if (slug) {
      // Rewrite to /portal/[slug]
      const url = request.nextUrl.clone()
      url.pathname = `/portal/${slug}${url.pathname === '/' ? '' : url.pathname}`
      
      return NextResponse.rewrite(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
