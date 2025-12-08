import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function createAdminClient() {
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for admin operations')
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

interface AnalyticsEvent {
  domain: string
  eventType: 'page_view' | 'section_view' | 'cta_click' | 'form_submit' | 'social_share' | 'contact_request' | 'time_on_page'
  data: {
    section?: string
    ctaLabel?: string
    formType?: string
    socialPlatform?: string
    timeOnPage?: number
    referer?: string
    userAgent?: string
    ip?: string
    trafficSource?: string
    deviceType?: string
    location?: {
      country: string
      countryCode: string
      flag: string
    }
    visitorFingerprint?: string
    timestamp?: string
    [key: string]: any
  }
}

export async function trackPortfolioAnalytics(event: AnalyticsEvent): Promise<{ success: boolean; error?: string }> {
  try {
    // Use admin client for public analytics tracking (bypasses RLS)
    const supabase = createAdminClient()
    
    // Get analytics record for this domain
    const { data: analytics, error: fetchError } = await supabase
      .from('portfolio_analytics')
      .select('id, portfolio_id, analytics_data, view_count, domain')
      .eq('domain', event.domain)
      .single()
    
    if (fetchError) {
      console.error(`[Analytics] Error fetching analytics for domain "${event.domain}":`, fetchError)
      // Try to find any analytics records to see what domains exist
      const { data: allAnalytics } = await supabase
        .from('portfolio_analytics')
        .select('domain')
        .limit(5)
      console.log(`[Analytics] Available domains in DB:`, allAnalytics?.map(a => a.domain))
      return { success: false, error: `Portfolio analytics not found for domain: ${event.domain}. Error: ${fetchError.message}` }
    }
    
    if (!analytics) {
      console.error(`[Analytics] No analytics record found for domain: ${event.domain}`)
      return { success: false, error: `Portfolio analytics not found for domain: ${event.domain}` }
    }
    
    console.log(`[Analytics] Found analytics record for domain: ${event.domain}, ID: ${analytics.id}`)
    
    // Get or initialize analytics_data
    let analyticsData = analytics.analytics_data || {}
    if (!analyticsData || typeof analyticsData !== 'object') {
      analyticsData = {}
    }
    
    // Initialize structure if needed
    if (!analyticsData.overview) {
      analyticsData.overview = {
        totalViews: 0,
        uniqueVisitors: 0,
        appointmentsBooked: 0,
        avgTimeOnPage: 0,
        trends: {}
      }
    }
    // Initialize unique visitor fingerprints tracking
    if (!analyticsData.uniqueVisitorFingerprints) {
      analyticsData.uniqueVisitorFingerprints = []
    }
    if (!analyticsData.viewsOverTime) {
      analyticsData.viewsOverTime = []
    }
    if (!analyticsData.dailyViews) {
      analyticsData.dailyViews = []
    }
    if (!analyticsData.trafficSources) {
      analyticsData.trafficSources = [
        { name: 'Direct', value: 0, color: '#4647E0' },
        { name: 'Social Media', value: 0, color: '#6366F1' },
        { name: 'Search', value: 0, color: '#8B5CF6' },
        { name: 'Referral', value: 0, color: '#A855F7' }
      ]
    }
    if (!analyticsData.mostViewedSections) {
      analyticsData.mostViewedSections = []
    }
    if (!analyticsData.engagement) {
      analyticsData.engagement = []
    }
    if (!analyticsData.engagementOverTime) {
      analyticsData.engagementOverTime = []
    }
    if (!analyticsData.visitorActions) {
      analyticsData.visitorActions = {
        ctaClicks: 0,
        formSubmissions: 0,
        socialShares: 0,
        contactRequests: 0
      }
    }
    if (!analyticsData.topLocations) {
      analyticsData.topLocations = []
    }
    if (!analyticsData.deviceBreakdown) {
      analyticsData.deviceBreakdown = [
        { device: 'Desktop', icon: '💻', percentage: 0, value: 0 },
        { device: 'Mobile', icon: '📱', percentage: 0, value: 0 },
        { device: 'Tablet', icon: '📱', percentage: 0, value: 0 }
      ]
    }
    
    const now = new Date()
    const currentMonth = now.toLocaleDateString('en-US', { month: 'short' })
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' })
    
    // Handle different event types
    switch (event.eventType) {
      case 'page_view':
        // Increment total views
        analyticsData.overview.totalViews = (analyticsData.overview.totalViews || 0) + 1
        
        // Track unique visitors using fingerprint (server-side) or client-side flag
        let isUnique = false
        if (event.data.visitorFingerprint) {
          // Server-side unique visitor tracking using fingerprint
          console.log(`[Analytics] Checking fingerprint: ${event.data.visitorFingerprint}, existing: ${analyticsData.uniqueVisitorFingerprints.length} fingerprints`)
          if (!analyticsData.uniqueVisitorFingerprints.includes(event.data.visitorFingerprint)) {
            analyticsData.uniqueVisitorFingerprints.push(event.data.visitorFingerprint)
            isUnique = true
            analyticsData.overview.uniqueVisitors = (analyticsData.overview.uniqueVisitors || 0) + 1
            console.log(`[Analytics] New unique visitor! Total unique visitors: ${analyticsData.overview.uniqueVisitors}`)
            
            // Limit fingerprint array size to prevent it from growing too large (keep last 10,000)
            if (analyticsData.uniqueVisitorFingerprints.length > 10000) {
              analyticsData.uniqueVisitorFingerprints = analyticsData.uniqueVisitorFingerprints.slice(-10000)
            }
          } else {
            console.log(`[Analytics] Returning visitor (fingerprint exists)`)
          }
        } else if (event.data.isUniqueVisitor) {
          // Fallback to client-side tracking
          isUnique = true
          analyticsData.overview.uniqueVisitors = (analyticsData.overview.uniqueVisitors || 0) + 1
          console.log(`[Analytics] Unique visitor (client-side tracking), Total: ${analyticsData.overview.uniqueVisitors}`)
        } else {
          console.log(`[Analytics] No fingerprint or unique visitor flag - this should not happen for page_view`)
        }
        
        // Initialize bounce tracking if needed
        if (!analyticsData.overview.totalBounces) {
          analyticsData.overview.totalBounces = 0
        }
        
        // Update views over time (monthly)
        const monthEntry = analyticsData.viewsOverTime.find((entry: any) => entry.month === currentMonth)
        if (monthEntry) {
          monthEntry.views = (monthEntry.views || 0) + 1
          if (isUnique) {
            monthEntry.uniqueVisitors = (monthEntry.uniqueVisitors || 0) + 1
          }
        } else {
          analyticsData.viewsOverTime.push({
            month: currentMonth,
            views: 1,
            uniqueVisitors: isUnique ? 1 : 0
          })
        }
        
        // Update daily views (for week view)
        const currentDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const dayEntry = analyticsData.dailyViews.find((entry: any) => entry.date === currentDate)
        if (dayEntry) {
          dayEntry.views = (dayEntry.views || 0) + 1
          if (isUnique) {
            dayEntry.uniqueVisitors = (dayEntry.uniqueVisitors || 0) + 1
          }
        } else {
          analyticsData.dailyViews.push({
            date: currentDate,
            views: 1,
            uniqueVisitors: isUnique ? 1 : 0
          })
        }
        
        // Keep only last 90 days of daily data to prevent database bloat
        if (analyticsData.dailyViews.length > 90) {
          analyticsData.dailyViews = analyticsData.dailyViews.slice(-90)
        }
        
        // Update traffic sources
        const trafficSource = event.data.trafficSource || 'Direct'
        console.log(`[Analytics] Updating traffic source: ${trafficSource}`)
        const sourceEntry = analyticsData.trafficSources.find((s: any) => s.name === trafficSource)
        if (sourceEntry) {
          sourceEntry.value = (sourceEntry.value || 0) + 1
          console.log(`[Analytics] Updated existing traffic source ${trafficSource} to ${sourceEntry.value}`)
        } else {
          // Add new traffic source if it doesn't exist
          const colors: { [key: string]: string } = {
            'Direct': '#4647E0',
            'Social Media': '#6366F1',
            'Search': '#8B5CF6',
            'Referral': '#A855F7'
          }
          analyticsData.trafficSources.push({
            name: trafficSource,
            value: 1,
            color: colors[trafficSource] || '#8884d8'
          })
          console.log(`[Analytics] Added new traffic source: ${trafficSource}`)
        }
        
        // Recalculate traffic source percentages for pie chart
        const totalTraffic = analyticsData.trafficSources.reduce((sum: number, s: any) => sum + (s.value || 0), 0)
        analyticsData.trafficSources.forEach((s: any) => {
          s.percentage = totalTraffic > 0 ? Math.round(((s.value || 0) / totalTraffic) * 100) : 0
        })
        console.log(`[Analytics] Traffic sources after update:`, analyticsData.trafficSources.map((s: any) => `${s.name}: ${s.value} (${s.percentage}%)`))
        
        // Update device breakdown
        const deviceType = event.data.deviceType || 'Desktop'
        const deviceEntry = analyticsData.deviceBreakdown.find((d: any) => d.device === deviceType)
        if (deviceEntry) {
          deviceEntry.value = (deviceEntry.value || 0) + 1
        } else {
          // Add new device type if it doesn't exist
          analyticsData.deviceBreakdown.push({
            device: deviceType,
            icon: deviceType === 'Mobile' ? '📱' : deviceType === 'Tablet' ? '📱' : '💻',
            percentage: 0,
            value: 1
          })
        }
        
        // Recalculate device percentages
        const totalDevices = analyticsData.deviceBreakdown.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
        analyticsData.deviceBreakdown.forEach((d: any) => {
          d.percentage = totalDevices > 0 ? Math.round(((d.value || 0) / totalDevices) * 100) : 0
        })
        
        // Update location tracking
        if (event.data.location && event.data.location.country) {
          const locationEntry = analyticsData.topLocations.find((l: any) => l.country === event.data.location.country)
          if (locationEntry) {
            locationEntry.value = (locationEntry.value || 0) + 1
          } else {
            analyticsData.topLocations.push({
              country: event.data.location.country,
              flag: event.data.location.flag || '🌍',
              value: 1
            })
          }
          
          // Recalculate percentages for all locations
          const totalLocationViews = analyticsData.topLocations.reduce((sum: number, l: any) => sum + (l.value || 0), 0)
          analyticsData.topLocations.forEach((l: any) => {
            l.percentage = totalLocationViews > 0 ? Math.round(((l.value || 0) / totalLocationViews) * 100) : 0
          })
          
          // Sort by value (descending) and keep top 10
          analyticsData.topLocations.sort((a: any, b: any) => (b.value || 0) - (a.value || 0))
          analyticsData.topLocations = analyticsData.topLocations.slice(0, 10)
        }
        
        // Update view_count column for backward compatibility
        await supabase
          .from('portfolio_analytics')
          .update({ view_count: (analytics.view_count || 0) + 1 })
          .eq('id', analytics.id)
        break
        
      case 'section_view':
        const sectionName = event.data.section || 'Unknown'
        const sectionEntry = analyticsData.mostViewedSections.find((s: any) => s.page === sectionName)
        if (sectionEntry) {
          sectionEntry.views = (sectionEntry.views || 0) + 1
        } else {
          analyticsData.mostViewedSections.push({
            page: sectionName,
            views: 1
          })
        }
        break
        
      case 'cta_click':
        analyticsData.visitorActions.ctaClicks = (analyticsData.visitorActions.ctaClicks || 0) + 1
        break
        
      case 'form_submit':
        analyticsData.visitorActions.formSubmissions = (analyticsData.visitorActions.formSubmissions || 0) + 1
        break
        
      case 'social_share':
        analyticsData.visitorActions.socialShares = (analyticsData.visitorActions.socialShares || 0) + 1
        break
        
      case 'contact_request':
        analyticsData.visitorActions.contactRequests = (analyticsData.visitorActions.contactRequests || 0) + 1
        break
        
      case 'time_on_page':
        const timeOnPage = event.data.timeOnPage || 0
        
        // Calculate if this is a bounce (left in less than 30 seconds or 0.5 minutes)
        const isBounce = timeOnPage < 0.5
        if (isBounce) {
          analyticsData.overview.totalBounces = (analyticsData.overview.totalBounces || 0) + 1
        }
        
        // Update engagement data (by day of week)
        const engagementDayEntry = analyticsData.engagement.find((e: any) => e.day === currentDay)
        if (engagementDayEntry) {
          // Calculate average time
          const totalTime = (engagementDayEntry.avgTime || 0) * (engagementDayEntry.count || 0) + timeOnPage
          engagementDayEntry.count = (engagementDayEntry.count || 0) + 1
          engagementDayEntry.avgTime = Math.round((totalTime / engagementDayEntry.count) * 10) / 10
          
          // Update bounce count for this day
          engagementDayEntry.bounceCount = (engagementDayEntry.bounceCount || 0) + (isBounce ? 1 : 0)
          // Calculate bounce rate for this day
          engagementDayEntry.bounceRate = engagementDayEntry.count > 0 ? Math.round((engagementDayEntry.bounceCount / engagementDayEntry.count) * 100) : 0
        } else {
          analyticsData.engagement.push({
            day: currentDay,
            avgTime: timeOnPage,
            bounceRate: isBounce ? 100 : 0,
            bounceCount: isBounce ? 1 : 0,
            count: 1
          })
        }
        
        // Update engagement over time (monthly) - similar to viewsOverTime
        const engagementMonthEntry = analyticsData.engagementOverTime.find((entry: any) => entry.month === currentMonth)
        if (engagementMonthEntry) {
          // Calculate weighted average for avgTime
          const totalTime = (engagementMonthEntry.avgTime || 0) * (engagementMonthEntry.count || 0) + timeOnPage
          engagementMonthEntry.count = (engagementMonthEntry.count || 0) + 1
          engagementMonthEntry.avgTime = Math.round((totalTime / engagementMonthEntry.count) * 10) / 10
          
          // Update bounce count and calculate bounce rate
          engagementMonthEntry.bounceCount = (engagementMonthEntry.bounceCount || 0) + (isBounce ? 1 : 0)
          engagementMonthEntry.bounceRate = engagementMonthEntry.count > 0 ? Math.round((engagementMonthEntry.bounceCount / engagementMonthEntry.count) * 100) : 0
        } else {
          analyticsData.engagementOverTime.push({
            month: currentMonth,
            avgTime: timeOnPage,
            bounceRate: isBounce ? 100 : 0,
            bounceCount: isBounce ? 1 : 0,
            count: 1
          })
        }
        
        // Update overall average time on page
        const allTimes = analyticsData.engagement.map((e: any) => e.avgTime || 0).filter(t => t > 0)
        if (allTimes.length > 0) {
          const totalAvgTime = allTimes.reduce((sum: number, t: number) => sum + t, 0) / allTimes.length
          analyticsData.overview.avgTimeOnPage = Math.round(totalAvgTime * 10) / 10
        }
        
        // Calculate overall bounce rate
        const totalViews = analyticsData.overview.totalViews || 1
        const totalBounces = analyticsData.overview.totalBounces || 0
        analyticsData.overview.bounceRate = Math.round((totalBounces / totalViews) * 100)
        break
    }
    
    // Update analytics_data in database
    const { error: updateError } = await supabase
      .from('portfolio_analytics')
      .update({ analytics_data: analyticsData })
      .eq('id', analytics.id)
    
    if (updateError) {
      console.error('[Analytics] Error updating analytics data:', updateError)
      return { success: false, error: updateError.message }
    }
    
    console.log(`[Analytics] Successfully saved ${event.eventType} for domain: ${event.domain}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error tracking portfolio analytics:', error)
    return { success: false, error: error.message || 'Failed to track analytics' }
  }
}

