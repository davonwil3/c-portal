import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { trackPortfolioAnalytics } from '@/lib/portfolio-analytics'
import { getLocationFromIP } from '@/lib/ip-geolocation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      domain, 
      eventType, 
      data 
    } = body
    
    if (!domain || !eventType) {
      return NextResponse.json(
        { success: false, error: 'Domain and eventType are required' },
        { status: 400 }
      )
    }
    
    // Get request headers for additional data
    const referer = request.headers.get('referer') || ''
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    // Determine traffic source
    let trafficSource = 'Direct'
    const currentUrl = new URL(request.url)
    const currentHostname = currentUrl.hostname.toLowerCase()
    
    console.log(`[Analytics] Traffic source detection - Referer: ${referer || 'none'}, Current hostname: ${currentHostname}`)
    
    // Only check referer if it exists and is not empty
    if (referer && referer.trim() !== '') {
      try {
        const refererUrl = new URL(referer)
        const refererHostname = refererUrl.hostname.toLowerCase()
        
        console.log(`[Analytics] Referer hostname: ${refererHostname}`)
        
        // If referer is from the same domain, it's still Direct (internal navigation)
        if (refererHostname === currentHostname || 
            refererHostname === `www.${currentHostname}` || 
            currentHostname === `www.${refererHostname}` ||
            refererHostname.endsWith(`.${currentHostname}`) ||
            currentHostname.endsWith(`.${refererHostname}`)) {
          trafficSource = 'Direct'
          console.log(`[Analytics] Same domain referer - marking as Direct`)
        } else if (refererHostname.includes('google') || refererHostname.includes('bing') || 
                   refererHostname.includes('yahoo') || refererHostname.includes('duckduckgo')) {
          trafficSource = 'Search'
          console.log(`[Analytics] Search engine referer - marking as Search`)
        } else if (refererHostname.includes('facebook') || refererHostname.includes('twitter') || 
                   refererHostname.includes('x.com') || refererHostname.includes('linkedin') || 
                   refererHostname.includes('instagram') || refererHostname.includes('tiktok') ||
                   refererHostname.includes('pinterest') || refererHostname.includes('reddit')) {
          trafficSource = 'Social Media'
          console.log(`[Analytics] Social media referer - marking as Social Media`)
        } else {
          // Different domain that's not search or social = Referral
          trafficSource = 'Referral'
          console.log(`[Analytics] External referer - marking as Referral`)
        }
      } catch (e) {
        // Invalid referer URL, keep as Direct
        console.log('[Analytics] Invalid referer URL, defaulting to Direct:', referer, e)
      }
    } else {
      console.log(`[Analytics] No referer - marking as Direct`)
    }
    // If no referer, it's Direct (user typed URL or bookmarked)
    
    // Determine device type
    let deviceType = 'Desktop'
    if (userAgent) {
      const ua = userAgent.toLowerCase()
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        deviceType = 'Tablet'
      } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = 'Mobile'
      }
    }
    
    // Get location from IP (only for page_view events to avoid too many API calls)
    let location = null
    if (eventType === 'page_view' && ip && ip !== 'unknown') {
      try {
        location = await getLocationFromIP(ip)
      } catch (error) {
        console.error('Error getting location:', error)
        // Continue without location if geolocation fails
      }
    }
    
    // Create a visitor fingerprint for unique visitor tracking (IP + User Agent hash)
    let visitorFingerprint = null
    if (eventType === 'page_view') {
      // Always create a fingerprint, even if IP is unknown (use a combination of available data)
      const fingerprintString = ip && ip !== 'unknown' 
        ? `${ip}-${userAgent || 'unknown'}`
        : `${userAgent || 'unknown'}-${Date.now().toString().slice(0, -3)}` // Use timestamp if no IP
      
      // Simple hash function
      let hash = 0
      for (let i = 0; i < fingerprintString.length; i++) {
        const char = fingerprintString.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // Convert to 32bit integer
      }
      visitorFingerprint = Math.abs(hash).toString(36)
      console.log(`[Analytics] Created visitor fingerprint: ${visitorFingerprint} from IP: ${ip}`)
    }
    
    // Track the analytics event
    const result = await trackPortfolioAnalytics({
      domain,
      eventType,
      data: {
        ...data,
        referer,
        userAgent,
        ip,
        trafficSource,
        deviceType,
        location,
        visitorFingerprint,
        timestamp: new Date().toISOString()
      }
    })
    
    if (!result.success) {
      console.error(`[Analytics Tracking] Failed for domain: ${domain}, error: ${result.error}`)
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }
    
    console.log(`[Analytics Tracking] Successfully tracked ${eventType} for domain: ${domain}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error tracking portfolio analytics:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to track analytics' },
      { status: 500 }
    )
  }
}

