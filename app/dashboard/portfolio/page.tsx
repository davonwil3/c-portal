"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard/layout"
import { StatsCard } from "./overview/StatsCard"
import { PortfolioSettingsCard } from "./overview/PortfolioSettingsCard"
import { AnalyticsMiniChart } from "./overview/AnalyticsMiniChart"
import { CTASection } from "./overview/CTASection"
import { Eye, UserPlus, TrendingUp, Copy, Check } from "lucide-react"
import { useRouter } from "next/navigation"
import { getUserPortfolios, getPortfolioAnalytics } from "@/lib/portfolio"

export default function PortfolioMainPage() {
  const router = useRouter()
  const [handle, setHandle] = useState("yourname")
  const [title, setTitle] = useState("My Portfolio")
  const [description, setDescription] = useState("Explore my work and services")
  const [copiedLink, setCopiedLink] = useState(false)
  const [hasExistingPortfolio, setHasExistingPortfolio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)

  const portfolioUrl = `https://${handle}.jolix.io`
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  const copyLink = () => {
    navigator.clipboard.writeText(portfolioUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const shareOnX = () => {
    const text = `Check out my portfolio!`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(portfolioUrl)}`, '_blank')
  }

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(portfolioUrl)}`, '_blank')
  }

  // Check if user has existing portfolio and load analytics
  useEffect(() => {
    const checkExistingPortfolio = async () => {
      try {
        const portfolios = await getUserPortfolios()
        setHasExistingPortfolio(portfolios.length > 0)
        
        if (portfolios.length > 0) {
          const latestPortfolio = portfolios[0]
          setPortfolioId(latestPortfolio.id)
          
          // Get analytics if portfolio is published
          if (latestPortfolio.status === 'published') {
            const analytics = await getPortfolioAnalytics(latestPortfolio.id)
            if (analytics) {
              setViewCount(analytics.view_count || 0)
              setHandle(analytics.domain || handle)
              setTitle(analytics.title || latestPortfolio.name)
              setDescription(analytics.meta_description || description)
            }
          }
        }
      } catch (error) {
        console.error('Error checking portfolios:', error)
        setHasExistingPortfolio(false)
      } finally {
        setLoading(false)
      }
    }
    
    checkExistingPortfolio()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#3C3CFF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading valuations...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Portfolio</h1>
            <p className="text-lg text-gray-600">
              View performance, manage settings, and customize your public portfolio.
            </p>
          </div>
                <Button
            size="lg"
            onClick={() => {
              if (hasExistingPortfolio) {
                router.push('/dashboard/portfolio/customize')
              } else {
                // Navigate to template selector
                router.push('/dashboard/portfolio/select-template')
              }
            }}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
          >
            {hasExistingPortfolio ? (
              <>🪄 Customize Portfolio</>
            ) : (
              <>Make a Portfolio</>
            )}
                </Button>
            </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Portfolio Views"
            value={viewCount.toLocaleString()}
            icon={Eye}
            detailsLink="/dashboard/analytics"
          />
          <StatsCard
            title="Leads Collected"
            value="—"
            icon={UserPlus}
            detailsLink="/dashboard/leads"
          />
          <StatsCard
            title="Conversion Rate"
            value="—"
            icon={TrendingUp}
          />
        </div>

        {/* Portfolio Settings */}
        <PortfolioSettingsCard
          handle={handle}
          title={title}
          description={description}
          lastUpdated={lastUpdated}
          portfolioId={portfolioId}
          onHandleChange={setHandle}
          onTitleChange={setTitle}
          onDescriptionChange={setDescription}
          onSaveSuccess={async () => {
            // Reload analytics after save
            if (portfolioId) {
              const analytics = await getPortfolioAnalytics(portfolioId)
              if (analytics) {
                setViewCount(analytics.view_count || 0)
                setHandle(analytics.domain || handle)
                setTitle(analytics.title || title)
                setDescription(analytics.meta_description || description)
              }
            }
          }}
        />

        {/* Share Options */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Share Your Portfolio</h2>
          <p className="text-sm text-gray-600 mb-6">
            Share your portfolio across social media and professional networks
          </p>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={copyLink}>
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
                </Button>
            <Button variant="outline" onClick={shareOnX}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              Share on X
                </Button>
            <Button variant="outline" onClick={shareOnLinkedIn}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              Share on LinkedIn
              </Button>
          </div>
        </Card>

        {/* Analytics Snapshot */}
        <AnalyticsMiniChart />

        {/* Primary CTA */}
        <CTASection />
      </div>
    </DashboardLayout>
  )
}
