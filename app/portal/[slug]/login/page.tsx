"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Mail, ArrowLeft, Building2, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getPortalLogoUrl } from "@/lib/storage"

interface Client {
  company: string
}

export default function PortalLoginPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params.slug as string
  const token = searchParams.get('token')
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [magicLinkStatus, setMagicLinkStatus] = useState<"idle" | "success" | "error">("idle")
  const [magicLinkError, setMagicLinkError] = useState("")
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const [currentMode, setCurrentMode] = useState<"magic" | "password">("magic")
  const [loadingSettings, setLoadingSettings] = useState(true)
  
  // Portal settings from database - matching exact variable names from portal settings
  const [brandColor, setBrandColor] = useState("#4647E0")
  const [logoUrl, setLogoUrl] = useState("")
  const [loginLogoUrl, setLoginLogoUrl] = useState("")
  const [welcomeHeadline, setWelcomeHeadline] = useState("Welcome")
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("Login to access your portal")
  const [loginBgMode, setLoginBgMode] = useState<"solid" | "gradient" | "image">("solid")
  const [loginBgColor, setLoginBgColor] = useState("#F3F4F6")
  const [loginBgGradientFrom, setLoginBgGradientFrom] = useState("#EEF2FF")
  const [loginBgGradientTo, setLoginBgGradientTo] = useState("#F5F7FF")
  const [loginBgGradientAngle, setLoginBgGradientAngle] = useState(135)
  const [loginBgImageUrl, setLoginBgImageUrl] = useState("")
  const [loginImageFit, setLoginImageFit] = useState<"cover" | "contain">("cover")
  const [loginOverlayOpacity, setLoginOverlayOpacity] = useState(20)
  const [loginBlur, setLoginBlur] = useState(false)
  const [loginMagicLinkEnabled, setLoginMagicLinkEnabled] = useState(true)
  const [loginPasswordEnabled, setLoginPasswordEnabled] = useState(false)
  const [loginActiveAuthMode, setLoginActiveAuthMode] = useState<"magic" | "password">("magic")
  const [loginMagicLinkButtonLabel, setLoginMagicLinkButtonLabel] = useState("Send Magic Link")
  const [loginPasswordButtonLabel, setLoginPasswordButtonLabel] = useState("Sign In")
  const [loginShowResend, setLoginShowResend] = useState(false)
  const [client, setClient] = useState<Client | null>(null)

  // Load portal settings from global_portal_settings table
  useEffect(() => {
    const loadPortalSettings = async () => {
      try {
        const supabase = createClient()
        
        // Find account by matching slug to account owner's company/name
        let accountId = null
        
        // First try matching by company name
        const { data: accounts } = await supabase
          .from('accounts')
          .select('id, company_name')
        
        if (accounts) {
          const matchingAccount = accounts.find(a => {
            if (!a.company_name) return false
            const accountSlug = a.company_name
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return accountSlug === slug
          })
          accountId = matchingAccount?.id || null
        }

        // If not found, try matching by user name
        if (!accountId) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('account_id, first_name, last_name')
          
          if (profiles) {
            const matchingProfile = profiles.find(p => {
              const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
              if (!fullName) return false
              const nameSlug = fullName
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim()
              return nameSlug === slug
            })
            accountId = matchingProfile?.account_id || null
          }
        }

        if (!accountId) {
          console.error('Account not found for slug:', slug)
          setLoadingSettings(false)
          return
        }

        // Get account info for company name
        const { data: account } = await supabase
          .from('accounts')
          .select('company_name')
          .eq('id', accountId)
          .single()

        const clientCompany = account?.company_name || 'Client'
        setClient({
          company: clientCompany
        })

        // Load global portal settings
        const { data: globalSettings, error: globalError } = await supabase
          .from('global_portal_settings')
          .select('settings')
          .eq('account_id', accountId)
          .single()

        if (globalError || !globalSettings) {
          console.error('Global portal settings not found:', globalError)
          setLoadingSettings(false)
          return
        }

        // Load settings from global_portal_settings
        const settings = globalSettings.settings || {}
        setBrandColor(settings.brandColor || "#4647E0")
        setLogoUrl(settings.logoUrl || "")
        
        // Load login settings - matching exact structure from portal settings
        const login = settings.login || {}
        setLoginLogoUrl(login.logoUrl || '')
        setWelcomeHeadline(login.welcomeHeadline || 'Welcome')
        setWelcomeSubtitle((login.welcomeSubtitle || 'Login to access your portal').replace('{{PortalName}}', clientCompany || 'your'))
        setLoginBgMode(login.bgMode || 'solid')
        setLoginBgColor(login.bgColor || '#F3F4F6')
        setLoginBgGradientFrom(login.bgGradientFrom || '#EEF2FF')
        setLoginBgGradientTo(login.bgGradientTo || '#F5F7FF')
        setLoginBgGradientAngle(typeof login.bgGradientAngle === 'number' ? login.bgGradientAngle : 135)
        setLoginBgImageUrl(login.bgImageUrl || '')
        setLoginImageFit(login.imageFit || 'cover')
        setLoginOverlayOpacity(typeof login.overlayOpacity === 'number' ? login.overlayOpacity : 20)
        setLoginBlur(!!login.blur)
        setLoginMagicLinkEnabled(login.magicLinkEnabled !== false)
        setLoginPasswordEnabled(login.passwordEnabled || false)
        setLoginActiveAuthMode(login.activeAuthMode || 'magic')
        setLoginMagicLinkButtonLabel(login.magicLinkButtonLabel || 'Send Magic Link')
        setLoginPasswordButtonLabel(login.passwordButtonLabel || 'Sign In')
        setLoginShowResend(login.showResend || false)
        
        // Set initial mode
        setCurrentMode(login.activeAuthMode || (login.passwordEnabled && !login.magicLinkEnabled ? 'password' : 'magic'))

      } catch (error) {
        console.error('Error loading portal settings:', error)
      } finally {
        setLoadingSettings(false)
      }
    }

    loadPortalSettings()
  }, [slug])

  // Handle magic link token validation
  useEffect(() => {
    if (token) {
      validateToken(token)
    }
  }, [token])

  const validateToken = async (token: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/client-portal/validate-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, slug })
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Login successful!")
        sessionStorage.setItem(`portal_auth_${slug}`, 'true')
        sessionStorage.setItem(`portal_email_${slug}`, data.email || '')
        router.push(`/portal/${slug}`)
      } else {
        toast.error(data.message || "Invalid or expired link")
      }
    } catch (error) {
      console.error('Token validation error:', error)
      toast.error("Failed to validate login link")
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error("Please enter your email")
      return
    }

    try {
      setLoading(true)
      setMagicLinkStatus("idle")
      setMagicLinkError("")
      const response = await fetch('/api/client-portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, slug })
      })

      const data = await response.json()

      if (data.success) {
        setMagicLinkStatus("success")
        setEmailSent(true)
      } else {
        setMagicLinkStatus("error")
        setMagicLinkError(data.message || "Failed to send magic link")
        // Show toast as well for immediate feedback
        toast.error(data.message || "Failed to send magic link")
      }
    } catch (error) {
      console.error('Magic link error:', error)
      setMagicLinkStatus("error")
      setMagicLinkError("Unable to send magic link. Please try again later.")
      toast.error("Failed to send magic link")
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setMagicLinkStatus("idle")
    setMagicLinkError("")
    setEmailSent(false)
  }

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      // First, find the account by slug
      let accountId = null
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, company_name')
      
      if (accounts) {
        const matchingAccount = accounts.find(a => {
          if (!a.company_name) return false
          const accountSlug = a.company_name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
          return accountSlug === slug
        })
        accountId = matchingAccount?.id
      }

      if (!accountId) {
        // Try matching by user name
        const { data: profiles } = await supabase
          .from('profiles')
          .select('account_id, first_name, last_name')
        
        if (profiles) {
          const matchingProfile = profiles.find(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
            if (!fullName) return false
            const nameSlug = fullName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return nameSlug === slug
          })
          accountId = matchingProfile?.account_id || null
        }
      }

      if (!accountId) {
        toast.error("Account not found")
        return
      }

      // Verify password using our custom API
      const response = await fetch('/api/client-portal/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          slug
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.message || "Invalid email or password")
        return
      }

      toast.success("Login successful!")
      sessionStorage.setItem(`portal_auth_${slug}`, 'true')
      sessionStorage.setItem(`portal_email_${slug}`, email.toLowerCase())
      router.push(`/portal/${slug}`)
    } catch (error) {
      console.error('Password login error:', error)
      toast.error("Failed to login")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error("Please enter email and password")
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      
      // First, find the account by slug
      let accountId = null
      const { data: accounts } = await supabase
        .from('accounts')
        .select('id, company_name')
      
      if (accounts) {
        const matchingAccount = accounts.find(a => {
          if (!a.company_name) return false
          const accountSlug = a.company_name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim()
          return accountSlug === slug
        })
        accountId = matchingAccount?.id
      }

      if (!accountId) {
        // Try matching by user name
        const { data: profiles } = await supabase
          .from('profiles')
          .select('account_id, first_name, last_name')
        
        if (profiles) {
          const matchingProfile = profiles.find(p => {
            const fullName = `${p.first_name || ''} ${p.last_name || ''}`.trim()
            if (!fullName) return false
            const nameSlug = fullName
              .toLowerCase()
              .replace(/[^a-z0-9\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim()
            return nameSlug === slug
          })
          accountId = matchingProfile?.account_id || null
        }
      }

      if (!accountId) {
        toast.error("Account not found")
        return
      }

      // Set up password using our custom API
      const response = await fetch('/api/client-portal/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          slug
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.message || "Failed to set up password")
        return
      }

      // After setting up password, automatically log them in
      const loginResponse = await fetch('/api/client-portal/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
          slug
        }),
      })

      const loginResult = await loginResponse.json()

      if (loginResult.success) {
        toast.success("Password set up and logged in successfully!")
        sessionStorage.setItem(`portal_auth_${slug}`, 'true')
        sessionStorage.setItem(`portal_email_${slug}`, email.toLowerCase())
        setShowCreateAccount(false)
        router.push(`/portal/${slug}`)
      } else {
        toast.success("Password set up successfully! Please log in.")
        setShowCreateAccount(false)
      }
    } catch (error) {
      console.error('Create account error:', error)
      toast.error("Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  // Sync currentMode with loginActiveAuthMode when it changes
  useEffect(() => {
    setCurrentMode(loginActiveAuthMode)
  }, [loginActiveAuthMode])

  const isBoth = loginMagicLinkEnabled && loginPasswordEnabled
  const mode = isBoth ? currentMode : (loginMagicLinkEnabled ? "magic" : "password")

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#4647E0] mx-auto mb-4" />
          <p className="text-gray-600">Loading login page...</p>
        </div>
      </div>
    )
  }

  // Exact copy of the background rendering from portal settings
  return (
    <div
      className="h-screen flex items-center justify-center p-8"
      style={{
        background:
          loginBgMode === 'solid'
            ? loginBgColor
            : loginBgMode === 'gradient'
              ? `linear-gradient(${loginBgGradientAngle}deg, ${loginBgGradientFrom}, ${loginBgGradientTo})`
              : undefined,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {loginBgMode === 'image' && loginBgImageUrl && (
        <div
          className={`absolute inset-0 ${loginBlur ? 'backdrop-blur-sm' : ''}`}
          style={{
            backgroundImage: `url(${loginBgImageUrl})`,
            backgroundSize: loginImageFit,
            backgroundPosition: 'center',
            filter: loginBlur ? 'blur(2px)' : 'none'
          }}
        />
      )}
      {loginBgMode === 'image' && loginOverlayOpacity > 0 && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${loginOverlayOpacity / 100})` }}
        />
      )}
      <div className="relative w-full flex items-center justify-center">
        {/* Exact copy of LoginPreview component but functional */}
        <div className="w-full max-w-md">
          <Card className="w-full shadow-2xl rounded-3xl overflow-hidden">
            <CardContent className="p-8 relative">
              {showCreateAccount && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateAccount(false)}
                  className="absolute top-4 left-0 text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Login
                </Button>
              )}
              <div className="text-center mb-8">
                {loginLogoUrl || logoUrl ? (
                  <>
                    <img 
                      src={getPortalLogoUrl(loginLogoUrl || logoUrl)} 
                      alt="Logo" 
                      className="h-12 mx-auto mb-6 object-contain" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                        if (placeholder) placeholder.style.display = 'flex'
                      }} 
                    />
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-6 hidden items-center justify-center" style={{ backgroundColor: brandColor }}>
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: brandColor }}>
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{welcomeHeadline}</h2>
                <p className="text-gray-600">{welcomeSubtitle}</p>
              </div>

              {isBoth && (
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'magic' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setCurrentMode('magic')}
                  >
                    Magic Link
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${mode === 'password' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    onClick={() => setCurrentMode('password')}
                  >
                    Password
                  </button>
                </div>
              )}

              {mode === 'magic' ? (
                magicLinkStatus === 'success' ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-green-100 p-4">
                        <CheckCircle2 className="h-12 w-12 text-green-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Check your email!</h3>
                      <p className="text-sm text-gray-600">
                        We've sent a secure login link to <span className="font-medium text-gray-900">{email}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-4">
                        Click the link in the email to access your portal. The link will expire in 24 hours.
                      </p>
                    </div>
                    {loginShowResend && (
                      <div className="pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleBackToLogin}
                          className="text-sm"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Send another link
                        </Button>
                      </div>
                    )}
                  </div>
                ) : magicLinkStatus === 'error' ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center mb-4">
                      <div className="rounded-full bg-red-100 p-4">
                        <XCircle className="h-12 w-12 text-red-600" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-900">Unable to send link</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-800">
                          {magicLinkError.includes('not authorized') || magicLinkError.includes('not found') 
                            ? "This email address is not authorized to access this portal. Please contact your administrator to be added to the portal members list."
                            : magicLinkError || "We couldn't send the magic link. Please try again or contact support if the problem persists."}
                        </p>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToLogin}
                        className="text-sm"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Try again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email Address</Label>
                      <Input 
                        id="login-email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="mt-1"
                        disabled={loading}
                      />
                    </div>
                    <Button 
                      type="submit"
                      className="w-full" 
                      style={{ backgroundColor: brandColor }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          {loginMagicLinkButtonLabel}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">We'll email you a secure link to access your portal</p>
                  </form>
                )
              ) : showCreateAccount ? (
                <form onSubmit={handleCreateAccount} className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-xs text-blue-800">
                      Use the email you provided to your freelancer
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email Address</Label>
                    <Input 
                      id="create-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-password">Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="create-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    style={{ backgroundColor: brandColor }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email Address</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Password</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Forgot password?</span>
                  </div>
                  <Button 
                    type="submit"
                    className="w-full" 
                    style={{ backgroundColor: brandColor }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      loginPasswordButtonLabel
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowCreateAccount(true)}
                    disabled={loading}
                  >
                    Create your account
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
