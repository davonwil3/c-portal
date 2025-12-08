"use client"

import { useEffect, useRef, useCallback } from 'react'
import type { PortfolioData } from '@/app/dashboard/portfolio/types'
import { PortfolioPreview } from '@/app/dashboard/portfolio/components/PortfolioPreview'

interface PublicPortfolioClientProps {
  domain: string
  data: PortfolioData
}

export function PublicPortfolioClient({ domain, data }: PublicPortfolioClientProps) {
  const startTimeRef = useRef<number>(Date.now())
  const trackedSectionsRef = useRef<Set<string>>(new Set())
  const pageViewTrackedRef = useRef<boolean>(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Track analytics event
  const trackEvent = useCallback(async (eventType: string, eventData: any = {}) => {
    try {
      console.log(`[Analytics] Tracking ${eventType} for domain: ${domain}`, eventData)
      const response = await fetch('/api/portfolios/track-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          eventType,
          data: eventData
        })
      })
      
      const result = await response.json()
      if (!result.success) {
        console.error(`[Analytics] Tracking failed:`, result.error)
      } else {
        console.log(`[Analytics] Successfully tracked ${eventType}`)
      }
    } catch (err) {
      console.error('[Analytics] Error tracking analytics:', err)
    }
  }, [domain])

  // Track page view on mount
  useEffect(() => {
    if (!domain || pageViewTrackedRef.current) return
    
    // Check if this is a unique visitor (using localStorage)
    const visitorKey = `portfolio_visitor_${domain}`
    const isUniqueVisitor = !localStorage.getItem(visitorKey)
    
    if (isUniqueVisitor) {
      localStorage.setItem(visitorKey, Date.now().toString())
    }
    
    // Track page view
    trackEvent('page_view', {
      isUniqueVisitor
    })
    pageViewTrackedRef.current = true
  }, [domain, trackEvent])

  // Track time on page periodically and when user leaves
  useEffect(() => {
    // Track time every 30 seconds while user is on page
    const intervalId = setInterval(() => {
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000 / 60 // in minutes
      if (timeOnPage > 0) {
        trackEvent('time_on_page', { timeOnPage: Math.round(timeOnPage * 10) / 10 })
      }
    }, 30000) // Every 30 seconds

    const handleBeforeUnload = () => {
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000 / 60 // in minutes
      if (timeOnPage > 0) {
        // Use sendBeacon for reliable tracking on page unload
        const data = JSON.stringify({
          domain,
          eventType: 'time_on_page',
          data: { timeOnPage: Math.round(timeOnPage * 10) / 10 }
        })
        navigator.sendBeacon('/api/portfolios/track-analytics', new Blob([data], { type: 'application/json' }))
      }
    }

    // Track visibility change (when user switches tabs)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const timeOnPage = (Date.now() - startTimeRef.current) / 1000 / 60 // in minutes
        if (timeOnPage > 0) {
          trackEvent('time_on_page', { timeOnPage: Math.round(timeOnPage * 10) / 10 })
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      
      // Also track on component unmount
      const timeOnPage = (Date.now() - startTimeRef.current) / 1000 / 60 // in minutes
      if (timeOnPage > 0) {
        trackEvent('time_on_page', { timeOnPage: Math.round(timeOnPage * 10) / 10 })
      }
    }
  }, [domain, trackEvent])

  // Track section views using Intersection Observer
  useEffect(() => {
    if (typeof window === 'undefined') return

    const sectionMap: { [key: string]: string } = {
      'hero': 'Home',
      'about': 'About',
      'services': 'Services',
      'projects': 'Projects',
      'testimonials': 'Testimonials',
      'contact': 'Contact'
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.id || entry.target.getAttribute('data-section') || ''
            const sectionName = sectionMap[sectionId] || sectionId
            
            if (sectionName && !trackedSectionsRef.current.has(sectionName)) {
              trackedSectionsRef.current.add(sectionName)
              trackEvent('section_view', { section: sectionName })
            }
          }
        })
      },
      { threshold: 0.5 }
    )

    // Observe all sections
    const sections = document.querySelectorAll('[data-section], #hero, #about, #services, #projects, #testimonials, #contact')
    sections.forEach((section) => {
      observerRef.current?.observe(section)
    })

    return () => {
      observerRef.current?.disconnect()
    }
  }, [trackEvent])

  // Track CTA clicks, form submissions, and other interactions
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Track CTA clicks
      const ctaButton = target.closest('button[data-cta], a[data-cta], button.cta-button, a.cta-button')
      if (ctaButton) {
        const ctaLabel = ctaButton.textContent?.trim() || 'CTA'
        trackEvent('cta_click', { ctaLabel })
      }
      
      // Track social share clicks
      const socialLink = target.closest('a[href*="twitter"], a[href*="x.com"], a[href*="linkedin"], a[href*="facebook"], a[href*="share"]')
      if (socialLink) {
        const href = socialLink.getAttribute('href') || ''
        let platform = 'Unknown'
        if (href.includes('twitter') || href.includes('x.com')) platform = 'X'
        else if (href.includes('linkedin')) platform = 'LinkedIn'
        else if (href.includes('facebook')) platform = 'Facebook'
        trackEvent('social_share', { socialPlatform: platform })
      }
    }

    // Track form submissions
    const handleSubmit = (e: Event) => {
      const form = e.target as HTMLFormElement
      if (form.tagName === 'FORM') {
        const formType = form.getAttribute('data-form-type') || 'contact'
        trackEvent('form_submit', { formType })
        
        // Also track as contact request if it's a contact form
        if (formType === 'contact' || form.id === 'contact-form') {
          trackEvent('contact_request', {})
        }
      }
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('submit', handleSubmit)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('submit', handleSubmit)
    }
  }, [trackEvent])

  return (
    <PortfolioPreview
      data={data}
      editMode={false}
      onDataChange={() => {}}
      onManageServices={() => {}}
      onManageProjects={() => {}}
      onManageTestimonials={() => {}}
    />
  )
}


