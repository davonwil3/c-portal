import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  // Check if this is a proposal subdomain
  // Format: proposal.[proposalid].jolix.io
  // Also handle localhost in development
  if (hostname.startsWith('proposal.') && (hostname.includes('.jolix.io') || hostname.includes('localhost'))) {
    let proposalId = ''
    
    if (hostname.includes('.jolix.io')) {
      // Production: proposal.[proposalid].jolix.io -> extract [proposalid]
      const parts = hostname.split('.')
      if (parts.length >= 3 && parts[0] === 'proposal') {
        proposalId = parts[1] // Get the proposalId between 'proposal' and 'jolix'
      }
    } else if (hostname.includes('localhost')) {
      // Development: localhost:3000 - proposalId will be in the path, handled by Next.js routing
      return NextResponse.next()
    }
    
    if (proposalId) {
      // Rewrite to /proposal/[proposalid]
      const url = request.nextUrl.clone()
      url.pathname = `/proposal/${proposalId}${url.pathname === '/' ? '' : url.pathname}`
      
      return NextResponse.rewrite(url)
    }
  }
  
  // Check if this is a client portal subdomain
  // Format: portal.[company-name].jolix.io or portal.[username].jolix.io
  // Also handle localhost in development
  if (hostname.startsWith('portal.') && (hostname.includes('.jolix.io') || hostname.includes('localhost'))) {
    let slug = ''
    
    if (hostname.includes('.jolix.io')) {
      // Production: portal.[slug].jolix.io -> extract [slug]
      const parts = hostname.split('.')
      if (parts.length >= 3 && parts[0] === 'portal') {
        slug = parts[1] // Get the slug between 'portal' and 'jolix'
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
