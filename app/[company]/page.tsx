"use client"

import { useState, useEffect, use, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Mail, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { getPortalThemeClasses, getContrastTextColor, isLightColor } from "@/lib/color-utils"
import { getPortalLogoUrl } from "@/lib/storage"

interface CompanyPortalProps {
  params: Promise<{
    company: string
  }>
}

export default function CompanyPortal({ params }: CompanyPortalProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [allowlistError, setAllowlistError] = useState("")
  const [portalSettings, setPortalSettings] = useState<any>(null)
  const [brandColor, setBrandColor] = useState('#3C3CFF')
  const [logoUrl, setLogoUrl] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Unwrap params Promise for Next.js 15 compatibility
  const unwrappedParams = use(params)
  const companySlug = unwrappedParams.company
  const clientSlug = searchParams.get('client') || 'default' // Default client
  const token = searchParams.get('token') // Magic link token
  
  // Get host for domain detection
  const [host, setHost] = useState('')
  
  // Dynamic brand color styles and theme classes
  const themeClasses = getPortalThemeClasses(brandColor)
  const isLight = isLightColor(brandColor)
  const textColor = getContrastTextColor(brandColor)
  
  useEffect(() => {
    // Only set host once on mount
    if (typeof window !== 'undefined') {
      setHost(window.location.host)
    }
  }, []) // Empty dependency array - only run once

  // Format company name for display
  const formatCompanyName = (slug: string) => {
    return slug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
  
  // Check if we're on a custom domain
  const isCustomDomain = host.includes('.flowtrack.works')
  const displayCompanyName = isCustomDomain ? host.split('.')[0] : formatCompanyName(companySlug)
  
  // Fetch portal settings for theming
  useEffect(() => {
    const fetchPortalSettings = async () => {
      try {
        const response = await fetch(`/api/test-portal-data?clientSlug=${clientSlug}&companySlug=${companySlug}&preview=false`)
        const result = await response.json()
        
        if (result.success && result.data.portalSettings) {
          const settings = result.data.portalSettings
          setBrandColor(settings.brandColor || '#3C3CFF')
          setLogoUrl(settings.logoUrl || '')
          setPortalSettings(settings)
        }
      } catch (error) {
        console.error('Error fetching portal settings:', error)
      }
    }

    fetchPortalSettings()
  }, [companySlug, clientSlug])

  // Debug logging
  useEffect(() => {
    console.log('🔍 Portal Debug Info:', {
      companySlug,
      clientSlug,
      host,
      isCustomDomain,
      displayCompanyName,
      formatCompanyName: formatCompanyName(companySlug)
    })
  }, [companySlug, clientSlug, host, isCustomDomain]) // Removed displayCompanyName from dependencies

  // Handle magic link token validation
  const handleTokenValidation = useCallback(async (token: string) => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch('/api/client-portal/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          companySlug,
          clientSlug
        }),
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        // Store session and redirect to portal
        localStorage.setItem('client_session', JSON.stringify(result.data))
        toast.success("Login successful!")
        
        // Use the actual client slug from the response data
        const actualClientSlug = result.data.clientSlug
        if (actualClientSlug) {
          router.push(`/${companySlug}/${actualClientSlug}`)
        } else {
          setError("Invalid client data received")
          toast.error("Invalid client data received")
        }
      } else {
        setError(result.message)
        toast.error(result.message)
      }
    } catch (error) {
      setError("Failed to validate magic link")
      toast.error("Failed to validate magic link")
    } finally {
      setLoading(false)
    }
  }, [companySlug, clientSlug, router])

  // Handle magic link request
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setLoading(true)
    setError("")
    setAllowlistError("")

    try {
      // First, check if a portal exists for this company and client AND if email is authorized
      const portalCheckResponse = await fetch('/api/client-portal/check-portal-exists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySlug,
          clientSlug,
          email
        }),
      })

      if (!portalCheckResponse.ok) {
        setError("Portal not found. Please contact your administrator.")
        toast.error("Portal not found")
        return
      }

      const portalCheckData = await portalCheckResponse.json()
      if (!portalCheckData.exists) {
        setError("Portal not found. Please contact your administrator.")
        toast.error("Portal not found")
        return
      }

      // Check if email is authorized for this portal
      if (portalCheckData.authorized === false) {
        setAllowlistError("This email is not authorized to access this portal. Please contact your administrator.")
        toast.error("Email not authorized for this portal")
        return
      }

      // Get the actual client slug from the portal check response
      const actualClientSlug = portalCheckData.data?.clientSlug || clientSlug

      const response = await fetch('/api/client-portal/magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          companySlug,
          clientSlug: actualClientSlug
        }),
      })

      const result = await response.json()

      if (result.success) {
        setMagicLinkSent(true)
        toast.success("Magic link sent to your email!")
        
        // In a real implementation, the email would be sent here
        // For development, check the server console for the magic link
        console.log('🔗 Development: Check server console for magic link')
      } else {
        if (result.message.includes('not authorized')) {
          setAllowlistError("This email is not authorized to access this portal. Please contact your administrator.")
        } else {
          setError(result.message)
        }
        toast.error(result.message)
      }
    } catch (error) {
      setError("Failed to send magic link. Please try again.")
      toast.error("Failed to send magic link")
    } finally {
      setLoading(false)
    }
  }

  // Handle direct access (for development)
  const handleDirectAccess = () => {
    router.push(`/${companySlug}/${clientSlug}`)
  }

  // Check for magic link token on component mount
  useEffect(() => {
    if (token && !magicLinkSent) {
      handleTokenValidation(token)
    }
  }, [token, magicLinkSent]) // Only run when token or magicLinkSent changes

  if (token && !magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[${brandColor}] mx-auto mb-4" />
          <p className="text-gray-600">Validating magic link...</p>
        </div>
      </div>
    )
  }

  if (magicLinkSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Company Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
              {logoUrl ? (
                <img 
                  src={getPortalLogoUrl(logoUrl)} 
                  alt="Company Logo" 
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-[${brandColor}]" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {displayCompanyName}
            </h1>
            <p className="text-gray-600">
              Check Your Email
            </p>
          </div>

          {/* Success Card */}
          <Card className="shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Magic Link Sent!
              </h2>
              
              <p className="text-gray-600 mb-6">
                We've sent a secure login link to <strong>{email}</strong>. 
                Check your email and click the link to access your portal.
              </p>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <Mail className="h-8 w-8 text-[${brandColor}]" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Can't find the email? Check your spam folder or contact support.
                  </p>
                </div>

                <Button
                  onClick={handleDirectAccess}
                  variant="outline"
                  className="w-full"
                >
                  Access Portal Directly
                </Button>
                
                <Button
                  onClick={() => setMagicLinkSent(false)}
                  variant="ghost"
                  className="w-full"
                >
                  Send Another Link
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">
              Powered by ClientPortalHQ
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Company Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
            {logoUrl ? (
              <img 
                src={getPortalLogoUrl(logoUrl)} 
                alt="Company Logo" 
                className="h-8 w-8 object-contain"
              />
            ) : (
              <Building2 className="h-8 w-8 text-[${brandColor}]" />
            )}
          </div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {displayCompanyName}
            </h1>
          <p className="text-gray-600">
            Client Portal Access
          </p>
        </div>

        {/* Magic Link Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Sign In with Magic Link
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Enter your email to receive a secure login link
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSendMagicLink} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {allowlistError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{allowlistError}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-medium shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Magic Link
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a href="#" className="text-[${brandColor}] hover:text-blue-700 font-medium">
                  Contact Support
                </a>
              </p>
            </div>

            {/* Development Access */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                onClick={handleDirectAccess}
                variant="ghost"
                size="sm"
                className="w-full text-gray-500 hover:text-gray-700"
              >
                Development: Access Portal Directly
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">
            Powered by ClientPortalHQ
          </p>
        </div>
      </div>
    </div>
  )
} 