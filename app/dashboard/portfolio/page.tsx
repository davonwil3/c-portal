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
import { Eye, UserPlus, TrendingUp, Copy, Check, Calendar, BarChart3, Info, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { getUserPortfolios, getPortfolioAnalytics } from "@/lib/portfolio"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { useTour } from "@/contexts/TourContext"

export default function PortfolioMainPage() {
  const router = useRouter()
  const { isTourRunning, currentTour } = useTour()
  const [handle, setHandle] = useState("yourname")
  const [title, setTitle] = useState("My Portfolio")
  const [description, setDescription] = useState("Explore my work and services")
  const [copiedLink, setCopiedLink] = useState(false)
  const [hasExistingPortfolio, setHasExistingPortfolio] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewCount, setViewCount] = useState(0)
  const [appointmentsBooked, setAppointmentsBooked] = useState(0)
  const [portfolioId, setPortfolioId] = useState<string | null>(null)
  // Custom domain state
  const [customDomain, setCustomDomain] = useState<string>("")
  const [domainStatus, setDomainStatus] = useState<"connected" | "waiting" | "not_connected">("not_connected")
  const [domainStatusDetail, setDomainStatusDetail] = useState<"pending" | "verifying" | "verified" | "failed" | null>(null)
  const [sslActive, setSslActive] = useState<boolean>(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [showConnectModal, setShowConnectModal] = useState<boolean>(false)
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1) // 1: Enter domain, 2: Setup DNS, 3: Verify
  const [modalDomain, setModalDomain] = useState<string>("")
  const [validatingDomain, setValidatingDomain] = useState<boolean>(false)
  const [verifyMessage, setVerifyMessage] = useState<{ type: "waiting" | "success" | "error"; text: string } | null>(null)
  const [verifying, setVerifying] = useState<boolean>(false)

  const portfolioUrl = `https://${handle}.jolix.io`
  const publicUrl = domainStatus === "connected" && customDomain ? `https://${customDomain}` : portfolioUrl
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  const copyLink = () => {
    // Use publicUrl which already handles custom domain vs portfolio URL
    navigator.clipboard.writeText(publicUrl)
    setCopiedLink(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const shareOnX = () => {
    // Create a nice share message with portfolio title if available
    const shareText = title && title !== "My Portfolio"
      ? `Check out my portfolio: ${title}`
      : "Check out my portfolio!"
    
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(publicUrl)}`
    window.open(tweetUrl, '_blank', 'noopener,noreferrer')
  }

  const shareOnLinkedIn = () => {
    // LinkedIn share URL with summary
    const shareText = title && title !== "My Portfolio"
      ? `Check out my portfolio: ${title}`
      : "Check out my portfolio!"
    
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(publicUrl)}&summary=${encodeURIComponent(shareText)}`
    window.open(linkedInUrl, '_blank', 'noopener,noreferrer')
  }

  // Simple domain format validation (no protocol, allow subdomain)
  const isValidDomain = (value: string) => {
    const domainRegex = /^(?!https?:\/\/)(?!\-)([a-zA-Z0-9\-]{1,63}\.)+[a-zA-Z]{2,63}$|^[a-zA-Z0-9\-]{1,63}\.[a-zA-Z]{2,63}$/
    return domainRegex.test(value.trim())
  }

  // Verify custom domain via API
  const verifyCustomDomain = async (domain: string) => {
    setVerifying(true)
    setVerifyMessage(null)
    try {
      // Call verification API
      const response = await fetch('/api/custom-domains/verify', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify domain')
      }
      
      const customDomain = data.customDomain
      
        if (customDomain) {
          // Update local state with domain
          setCustomDomain(customDomain.domain)
          setDomainStatusDetail(customDomain.status)
          setLastChecked(new Date().toISOString())
          
          if (customDomain.status === 'verified') {
            setDomainStatus("connected")
            setSslActive(true)
            setVerifyMessage({ 
              type: "success", 
              text: "Domain verified successfully! SSL will be provisioned automatically." 
            })
            toast.success("Domain verified and connected")
            return true
          } else if (customDomain.status === 'failed') {
            setDomainStatus("not_connected")
            const errorMsg = customDomain.verification_error || "Verification failed. Make sure the DNS records match exactly."
            
            // Check if it's a propagation delay message
            if (errorMsg.includes('not found yet') || errorMsg.includes('propagate') || errorMsg.includes('15 minutes')) {
              setVerifyMessage({ 
                type: "waiting", 
                text: errorMsg 
              })
              toast.message("DNS records not found yet - this is normal. DNS changes can take up to 15 minutes.")
            } else {
              setVerifyMessage({ 
                type: "error", 
                text: errorMsg 
              })
              toast.error("Verification failed")
            }
            return false
          } else {
            // verifying or pending
            setDomainStatus("waiting")
            const waitingMsg = customDomain.status === 'pending' 
              ? "DNS changes can take up to 15 minutes to take effect. Please wait a few minutes and try again."
              : "Verifying DNS records..."
            setVerifyMessage({ 
              type: "waiting", 
              text: waitingMsg
            })
            toast.message("Checking DNS records...")
            return false
          }
        } else {
        setDomainStatus("not_connected")
        setVerifyMessage({ type: "error", text: "No domain found. Please add a domain first." })
        toast.error("No domain found")
        return false
      }
    } catch (e: any) {
      setDomainStatus("not_connected")
      setVerifyMessage({ 
        type: "error", 
        text: e.message || "Couldn't verify. Make sure the records match exactly." 
      })
      toast.error(e.message || "Verification failed")
      return false
    } finally {
      setVerifying(false)
    }
  }

  const handleRecheck = async () => {
    if (!customDomain) return
    setVerifying(true)
    const ok = await verifyCustomDomain(customDomain)
    if (ok) {
      setShowConnectModal(false)
    }
  }

  const handleDisconnect = async () => {
    if (!customDomain) return
    const confirm = window.confirm("Are you sure you want to disconnect this domain? Your portfolio will no longer be accessible at this custom domain.")
    if (!confirm) return
    
    try {
      const response = await fetch('/api/custom-domains', {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect domain')
      }
      
      // Clear all domain-related state
      setCustomDomain("")
      setDomainStatus("not_connected")
      setDomainStatusDetail(null)
      setSslActive(false)
      setLastChecked(null)
      toast.success("Domain disconnected successfully")
    } catch (e: any) {
      toast.error(e.message || "Failed to disconnect domain")
    }
  }

  // Step 1: Validate domain format and save via API
  const handleValidateDomain = async () => {
    if (!modalDomain || !isValidDomain(modalDomain)) {
      toast.error("Enter a valid domain (example.com or www.example.com)")
      return
    }
    
    setValidatingDomain(true)
    
    try {
      const response = await fetch('/api/custom-domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ domain: modalDomain })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        // Handle specific error cases - show the full error message from API
        throw new Error(data.error || 'Failed to save domain')
      }
      
      // Update local state with normalized domain
      const normalizedDomain = data.customDomain.domain
      setCustomDomain(normalizedDomain)
      setDomainStatus("waiting") // pending maps to waiting in UI
      
      // Move to step 2 (DNS setup)
      setModalStep(2)
      toast.success("Domain validated and saved")
    } catch (e: any) {
      toast.error(e.message || "Failed to save domain")
    } finally {
      setValidatingDomain(false)
    }
  }

  // Reset modal when opening
  const handleOpenModal = () => {
    setModalDomain(customDomain || "")
    setModalStep(1)
    setVerifyMessage(null)
    setShowConnectModal(true)
  }

  const relativeLastChecked = lastChecked
    ? (() => {
        const diffMs = Date.now() - new Date(lastChecked).getTime()
        const mins = Math.max(1, Math.round(diffMs / 60000))
        return `${mins}m ago`
      })()
    : null

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
        
        // Load custom domain from API
        try {
          const domainResponse = await fetch('/api/custom-domains')
          const domainData = await domainResponse.json()
          
          if (domainResponse.ok && domainData.customDomain) {
            const customDomainData = domainData.customDomain
            setCustomDomain(customDomainData.domain)
            setDomainStatusDetail(customDomainData.status)
            
            if (customDomainData.status === 'verified') {
              setDomainStatus("connected")
              setSslActive(true)
            } else if (customDomainData.status === 'failed') {
              setDomainStatus("not_connected")
            } else {
              setDomainStatus("waiting")
            }
            
            if (customDomainData.updated_at) {
              setLastChecked(customDomainData.updated_at)
            }
          }
        } catch (domainError) {
          console.error('Error loading custom domain:', domainError)
          // Don't fail the whole page load if domain fetch fails
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
        <div className="flex items-start justify-between" data-help="portfolio-overview-header">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">My Portfolio</h1>
            <p className="text-lg text-gray-600">
              View performance, manage settings, and customize your public portfolio.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => router.push('/dashboard/portfolio/analytics')}
              className="font-semibold"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Portfolio Analytics
            </Button>
            <Button
              size="lg"
              onClick={() => {
                // During portfolio tour, always go to template selector
                if (isTourRunning && currentTour?.id === "portfolio") {
                  router.push('/dashboard/portfolio/select-template')
                } else if (hasExistingPortfolio) {
                  router.push('/dashboard/portfolio/customize')
                } else {
                  // Navigate to template selector
                  router.push('/dashboard/portfolio/select-template')
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
              data-help="btn-create-portfolio"
            >
              {hasExistingPortfolio && !(isTourRunning && currentTour?.id === "portfolio") ? (
                <>🪄 Customize Portfolio</>
              ) : (
                <>Make a Portfolio</>
              )}
            </Button>
          </div>
        </div>

        {/* Appointments Booked Card */}
        <Card className="p-6 rounded-2xl shadow-sm border-0 bg-gradient-to-br from-purple-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-full p-4 bg-white shadow-sm">
                <Calendar className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Appointments Booked</p>
                <p className="text-4xl font-bold text-gray-900">{appointmentsBooked}</p>
                <p className="text-sm text-gray-500 mt-1">From your portfolio page</p>
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-600">+{appointmentsBooked > 0 ? '12%' : '0%'}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">vs last 7 days</p>
            </div>
          </div>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-help="portfolio-stats">
          <StatsCard
            title="Portfolio Views"
            value={viewCount.toLocaleString()}
            icon={Eye}
          />
          <StatsCard
            title="Leads Collected"
            value="—"
            icon={UserPlus}
          />
          <StatsCard
            title="Conversion Rate"
            value="—"
            icon={TrendingUp}
          />
        </div>

        {/* Portfolio Settings */}
        <div data-help="portfolio-settings-card">
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
                  if (analytics.domain && isValidDomain(analytics.domain)) {
                    setCustomDomain(analytics.domain)
                    setDomainStatus("connected")
                    setSslActive(true)
                  } else {
                    setHandle(analytics.domain || handle)
                  }
                  setTitle(analytics.title || title)
                  setDescription(analytics.meta_description || description)
                }
              }
            }}
          />
        </div>

        {/* Custom Domain */}
        <Card className="p-6 rounded-2xl shadow-sm border-0" data-help="custom-domain-card">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">Custom Domain</h2>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Connect your own domain (like example.com) to your portfolio. You'll need to add DNS records at your domain registrar.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-sm text-gray-600">
                Use your own domain name instead of the default Jolix subdomain.
              </p>
            </div>
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Label htmlFor="custom-domain" className="text-sm text-gray-700">Custom Domain</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-sm">
                        Enter your domain (e.g., example.com). You can add www.example.com or example.com - both will work.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <Input
                  id="custom-domain"
                  placeholder="example.com"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  disabled={domainStatus === "connected"}
                  className="flex-1"
                />
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    domainStatus === "connected"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : domainStatus === "waiting"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}
                >
                  {domainStatus === "connected" 
                    ? "🟢 Connected" 
                    : domainStatus === "waiting" 
                    ? (domainStatusDetail === "pending" ? "🟡 Pending" : "🟡 Verifying")
                    : "🔴 Not connected"}
                </span>
              </div>
              {domainStatus === "connected" && (
                <p className="text-xs text-gray-600 mt-2">
                  SSL: {sslActive ? "✅ Active" : "⏳ Provisioning"} · Last checked: {relativeLastChecked || "just now"}
                </p>
              )}
              {domainStatus === "waiting" && (
                <p className="text-xs text-gray-500 mt-2">
                  ⏳ DNS changes can take up to 15 minutes to apply. Click "Recheck Connection" to verify.
                </p>
              )}
              {domainStatus === "not_connected" && customDomain && (
                <p className="text-xs text-gray-500 mt-2">
                  Add the DNS records at your domain registrar, then click "Recheck Connection" to verify.
                </p>
              )}
              {domainStatus === "not_connected" && !customDomain && (
                <p className="text-xs text-gray-500 mt-2">
                  Connect your domain to make your portfolio accessible at your own domain name.
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {domainStatus !== "connected" ? (
                <>
                  <Button
                    className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                    onClick={handleOpenModal}
                  >
                    Connect Domain
                  </Button>
                  {customDomain && (
                    <Button variant="outline" onClick={handleRecheck} disabled={verifying} className="rounded-xl">
                      Recheck Connection
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={handleRecheck} disabled={verifying} className="rounded-xl">
                    Recheck Connection
                  </Button>
                  <Button variant="destructive" onClick={handleDisconnect} className="rounded-xl">
                    Disconnect
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Share Options */}
        <Card className="p-6" data-help="share-portfolio-card">
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

      {/* Connect Domain Modal */}
      <Dialog open={showConnectModal} onOpenChange={(open) => {
        setShowConnectModal(open)
        if (!open) {
          setModalStep(1)
          setModalDomain("")
          setVerifyMessage(null)
        }
      }}>
        <DialogContent className="sm:max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Connect your domain</DialogTitle>
          </DialogHeader>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                modalStep >= 1 ? "bg-[#4647E0] text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {modalStep > 1 ? <Check className="w-4 h-4" /> : "1"}
              </div>
              <div className={`flex-1 h-1 ${modalStep >= 2 ? "bg-[#4647E0]" : "bg-gray-200"}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                modalStep >= 2 ? "bg-[#4647E0] text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {modalStep > 2 ? <Check className="w-4 h-4" /> : "2"}
              </div>
              <div className={`flex-1 h-1 ${modalStep >= 3 ? "bg-[#4647E0]" : "bg-gray-200"}`} />
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm transition-all ${
                modalStep >= 3 ? "bg-[#4647E0] text-white" : "bg-gray-200 text-gray-500"
              }`}>
                3
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mb-8 -mt-4">
            <span className={`text-xs ${modalStep >= 1 ? "text-[#4647E0] font-medium" : "text-gray-500"}`}>Validate</span>
            <span className={`text-xs ${modalStep >= 2 ? "text-[#4647E0] font-medium" : "text-gray-500"}`}>Setup DNS</span>
            <span className={`text-xs ${modalStep >= 3 ? "text-[#4647E0] font-medium" : "text-gray-500"}`}>Verify</span>
          </div>

          <div className="space-y-6">
            {/* Step 1: Validate Domain */}
            {modalStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Enter your domain</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Enter the domain you want to use for your portfolio. You can enter it with or without "www" (e.g., example.com or www.example.com).
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Domain</Label>
                  <Input
                    placeholder="example.com"
                    value={modalDomain}
                    onChange={(e) => setModalDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && isValidDomain(modalDomain)) {
                        handleValidateDomain()
                      }
                    }}
                    className="text-base"
                    disabled={validatingDomain}
                  />
                  {!isValidDomain(modalDomain) && modalDomain.length > 0 && (
                    <p className="text-xs text-red-600">Please enter a valid domain name (e.g., example.com)</p>
                  )}
                </div>
                {validatingDomain && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-4 h-4 border-2 border-[#4647E0] border-t-transparent rounded-full animate-spin" />
                    Validating domain...
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Setup DNS */}
            {modalStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Add DNS records</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Add these DNS records at your domain registrar (where you bought your domain) to connect <strong>{modalDomain}</strong> to your portfolio.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-800 font-medium">Add these DNS records at your domain registrar:</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-600 border-b border-gray-300">
                          <th className="py-3 pr-4 font-semibold">Type</th>
                          <th className="py-3 pr-4 font-semibold">Name</th>
                          <th className="py-3 pr-4 font-semibold">Value</th>
                          <th className="py-3 pr-4 font-semibold">TTL</th>
                          <th className="py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-sm">
                        <tr className="border-b border-gray-200">
                          <td className="py-3 pr-4 font-semibold">CNAME</td>
                          <td className="py-3 pr-4">www</td>
                          <td className="py-3 pr-4 select-text text-[#4647E0]">cname.jolix.io</td>
                          <td className="py-3 pr-4">Auto</td>
                          <td className="py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText("cname.jolix.io")
                                toast.success("Copied to clipboard")
                              }}
                              className="rounded-lg"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-3 pr-4 font-semibold">A</td>
                          <td className="py-3 pr-4">@</td>
                          <td className="py-3 pr-4 select-text text-[#4647E0]">76.76.21.21</td>
                          <td className="py-3 pr-4">Auto</td>
                          <td className="py-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText("76.76.21.21")
                                toast.success("Copied to clipboard")
                              }}
                              className="rounded-lg"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-gray-600 pt-2">
                    <strong>Note:</strong> If you only want to use www.yourdomain.com, you can skip the A record. Most domain registrars prefer using the CNAME record.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-blue-800 font-medium mb-1">What to do next:</p>
                      <p className="text-xs text-blue-800">
                        After adding these records at your domain registrar, wait a few minutes for the changes to take effect, then click "Continue to Verification" below to check if everything is set up correctly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Verify Connection */}
            {modalStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Verify your connection</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    We'll check if your DNS records are set up correctly for <strong>{modalDomain}</strong>. This usually takes just a few seconds.
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 text-center">
                  {verifying ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 border-4 border-[#4647E0] border-t-transparent rounded-full animate-spin mx-auto" />
                      <p className="text-sm font-medium text-gray-700">Checking DNS records...</p>
                      <p className="text-xs text-gray-500">This may take a few seconds</p>
                    </div>
                  ) : verifyMessage ? (
                    <div className="space-y-3">
                      <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        verifyMessage.type === "success" ? "bg-green-100" : 
                        verifyMessage.type === "error" ? "bg-red-100" : "bg-yellow-100"
                      }`}>
                        {verifyMessage.type === "success" ? (
                          <Check className="w-6 h-6 text-green-600" />
                        ) : verifyMessage.type === "error" ? (
                          <span className="text-2xl">❌</span>
                        ) : (
                          <span className="text-2xl">🟡</span>
                        )}
                      </div>
                      <p className={`text-sm font-medium ${
                        verifyMessage.type === "success" ? "text-green-700" : 
                        verifyMessage.type === "error" ? "text-red-700" : "text-yellow-700"
                      }`}>
                        {verifyMessage.text}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Ready to verify</p>
                      <p className="text-xs text-gray-500">Click "Check Connection" to verify your DNS setup</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 mt-6">
            {modalStep === 1 && (
              <>
                <Button
                  onClick={handleValidateDomain}
                  disabled={!isValidDomain(modalDomain) || validatingDomain}
                  className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                >
                  {validatingDomain ? "Validating..." : "Continue"}
                </Button>
                <Button variant="outline" onClick={() => setShowConnectModal(false)} className="rounded-xl">
                  Cancel
                </Button>
              </>
            )}
            {modalStep === 2 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalStep(1)}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setModalStep(3)}
                  className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                >
                  Continue to Verification
                </Button>
              </>
            )}
            {modalStep === 3 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalStep(2)}
                  disabled={verifying}
                  className="rounded-xl"
                >
                  Back
                </Button>
                <Button
                  onClick={async () => {
                    setVerifyMessage(null)
                    const ok = await verifyCustomDomain(modalDomain)
                    if (ok) {
                      setTimeout(() => {
                        setShowConnectModal(false)
                        setModalStep(1)
                      }, 1500)
                    }
                  }}
                  disabled={verifying}
                  className="bg-[#4647E0] hover:bg-[#3c3dd0] text-white rounded-xl"
                >
                  {verifying ? "Checking..." : "Check Connection"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
