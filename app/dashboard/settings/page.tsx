"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import {
  User,
  Building2,
  CreditCard,
  Users,
  Upload,
  Download,
  Trash2,
  Plus,
  X,
  Loader2,
  Check,
  Info,
  Plug,
  RefreshCw,
  Wallet,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import { getCurrentUser, getUserProfile, updateProfile, uploadProfilePhoto, changePassword, getCurrentAccount, updateAccount, uploadCompanyLogo, type Profile, type Account } from "@/lib/auth"
import { useRouter, useSearchParams } from "next/navigation"
import { getWorkspacePlanLimits } from "@/lib/workspace"

export default function SettingsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "account")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [companyData, setCompanyData] = useState({
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    address: "",
    timezone: "est",
    industry: "copywriting",
    otherIndustry: "",
  })
  const [notifications, setNotifications] = useState({
    email: true,
    inApp: true,
    marketing: false,
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [showPlanDetailsModal, setShowPlanDetailsModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [showManagePlanModal, setShowManagePlanModal] = useState(false)
  const [showPlanChangeConfirmModal, setShowPlanChangeConfirmModal] = useState(false)
  const [showDowngradeConfirmModal, setShowDowngradeConfirmModal] = useState(false)
  const [pendingPlanChange, setPendingPlanChange] = useState<'free' | 'pro' | 'premium' | null>(null)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [cancelingSubscription, setCancelingSubscription] = useState(false)
  const [resumingSubscription, setResumingSubscription] = useState(false)
  const [changingPlan, setChangingPlan] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)
  const [loadingBillingPortal, setLoadingBillingPortal] = useState(false)
  const [loadingStripeConnect, setLoadingStripeConnect] = useState(false)
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [loadingBillingHistory, setLoadingBillingHistory] = useState(false)
  const [subscriptionDetails, setSubscriptionDetails] = useState<{
    cancelAtPeriodEnd: boolean
    currentPeriodEnd: string | null
    subscriptionStatus: string | null
  } | null>(null)
  const [loadingSubscriptionDetails, setLoadingSubscriptionDetails] = useState(false)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  const [loadingTeam, setLoadingTeam] = useState(false)
  const [showInviteDialog, setShowInviteDialog] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member")
  const [sendingInvite, setSendingInvite] = useState(false)
  const [payoutSummary, setPayoutSummary] = useState<{
    stripe: {
      connected: boolean
      available: { amount: number; currency: string } | null
      pending: { amount: number; currency: string } | null
    }
    paypal: {
      connected: boolean
    }
    defaultPayoutProvider: 'stripe' | 'paypal' | null
  } | null>(null)
  const [loadingPayoutSummary, setLoadingPayoutSummary] = useState(false)
  const [updatingDefaultProvider, setUpdatingDefaultProvider] = useState(false)
  const [loadingManageLink, setLoadingManageLink] = useState<string | null>(null)

  // Load subscription details
  const loadSubscriptionDetails = async () => {
    try {
      setLoadingSubscriptionDetails(true)
      const response = await fetch('/api/stripe/subscription-details')
      if (response.ok) {
        const data = await response.json()
        console.log('Subscription details loaded:', data)
        setSubscriptionDetails(data)
      } else {
        const error = await response.json()
        console.error('Error loading subscription details:', error)
      }
    } catch (error) {
      console.error('Error loading subscription details:', error)
    } finally {
      setLoadingSubscriptionDetails(false)
    }
  }

  // Load payout summary
  const loadPayoutSummary = async () => {
    try {
      setLoadingPayoutSummary(true)
      const response = await fetch('/api/payouts/summary')
      if (response.ok) {
        const data = await response.json()
        setPayoutSummary(data)
      } else {
        const error = await response.json()
        console.error('Error loading payout summary:', error)
        toast.error('Failed to load payout information')
      }
    } catch (error) {
      console.error('Error loading payout summary:', error)
      toast.error('Failed to load payout information')
    } finally {
      setLoadingPayoutSummary(false)
    }
  }

  // Handle set default payout provider
  const handleSetDefaultProvider = async (provider: 'stripe' | 'paypal') => {
    try {
      setUpdatingDefaultProvider(true)
      const response = await fetch('/api/payouts/default-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update default provider')
      }

      // Update local state
      if (payoutSummary) {
        setPayoutSummary({
          ...payoutSummary,
          defaultPayoutProvider: provider,
        })
      }

      toast.success(`Default payout provider set to ${provider === 'stripe' ? 'Stripe' : 'PayPal'}`)
    } catch (error: any) {
      console.error('Error setting default provider:', error)
      toast.error(error.message || 'Failed to update default provider')
    } finally {
      setUpdatingDefaultProvider(false)
    }
  }

  // Handle manage Stripe
  const handleManageStripe = async () => {
    try {
      setLoadingManageLink('stripe')
      const response = await fetch('/api/payouts/stripe/manage-link', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create manage link')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error opening Stripe dashboard:', error)
      toast.error(error.message || 'Failed to open Stripe dashboard')
      setLoadingManageLink(null)
    }
  }

  // Handle manage PayPal
  const handleManagePayPal = async () => {
    try {
      setLoadingManageLink('paypal')
      const response = await fetch('/api/payouts/paypal/manage-link', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create manage link')
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error opening PayPal dashboard:', error)
      toast.error(error.message || 'Failed to open PayPal dashboard')
      setLoadingManageLink(null)
    }
  }

  // Load user profile and account data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const user = await getCurrentUser()
        if (user) {
          const userProfile = await getUserProfile(user.id)
          if (userProfile) {
            setProfile(userProfile)
            setFormData({
              firstName: userProfile.first_name || "",
              lastName: userProfile.last_name || "",
              email: userProfile.email || "",
              phone: userProfile.phone || "",
            })
          }

          // Load account data
          const userAccount = await getCurrentAccount()
          if (userAccount) {
            setAccount(userAccount)
            setCompanyData({
              companyName: userAccount.company_name || "",
              companyEmail: userAccount.email || "",
              companyPhone: userAccount.phone || "",
              address: userAccount.address || "",
              timezone: userAccount.timezone || "est",
              industry: userAccount.industry || "copywriting",
              otherIndustry: "",
            })
            
            // Load subscription details if user is on a paid plan
            if (userAccount.plan_tier && userAccount.plan_tier !== 'free') {
              await loadSubscriptionDetails()
            }
          }

          // Load payment methods
          await loadPaymentMethods()
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Failed to load data")
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Sync subscription status on page load
  useEffect(() => {
    async function syncSubscription() {
      try {
        const response = await fetch('/api/stripe/verify-session')
        if (response.ok) {
          const data = await response.json()
          // Reload account data to reflect any changes
          const updatedAccount = await getCurrentAccount()
          if (updatedAccount) setAccount(updatedAccount)
        }
      } catch (error) {
        console.error('Error syncing subscription:', error)
      }
    }
    
    if (activeTab === 'billing') {
      syncSubscription()
      loadBillingHistory() // Load billing history when billing tab is active
      loadSubscriptionDetails() // Load subscription details
    } else if (activeTab === 'payouts') {
      loadPayoutSummary() // Load payout summary when payouts tab is active
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')
    const stripeConnected = searchParams.get('stripe_connected')
    const stripeRefresh = searchParams.get('stripe_refresh')
    
    if (success === 'true' && sessionId) {
      // Verify and update subscription
      fetch('/api/stripe/verify-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success('Subscription activated successfully!')
            // Reload account data
            getCurrentAccount().then(account => {
              if (account) setAccount(account)
            })
            // Wait a moment for Stripe to process, then refresh billing history
            // Retry a few times in case Stripe needs more time to process
            const retryRefresh = (attempts = 0) => {
              if (attempts < 3) {
                setTimeout(() => {
                  loadBillingHistory()
                  if (attempts < 2) {
                    retryRefresh(attempts + 1)
                  }
                }, attempts === 0 ? 2000 : 3000) // First retry after 2s, then every 3s
              }
            }
            retryRefresh()
          } else {
            toast.error('Failed to verify subscription. Please refresh the page.')
          }
        })
        .catch(error => {
          console.error('Error verifying subscription:', error)
          toast.error('Failed to verify subscription. Please refresh the page.')
        })
      
      setActiveTab('billing')
      router.replace('/dashboard/settings?tab=billing')
    } else if (canceled === 'true') {
      toast.info('Checkout was canceled')
      setActiveTab('billing')
      router.replace('/dashboard/settings?tab=billing')
    } else if (stripeConnected === 'true') {
      // Verify and update Stripe Connect status
      fetch('/api/stripe/connect/status', {
        method: 'POST',
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast.success('Stripe connected successfully!')
            // Reload account data
            getCurrentAccount().then(account => {
              if (account) setAccount(account)
            })
          } else {
            toast.info('Please complete the Stripe onboarding process')
          }
        })
        .catch(error => {
          console.error('Error verifying Stripe Connect status:', error)
          toast.info('Please complete the Stripe onboarding process')
        })
      setActiveTab('integrations')
      router.replace('/dashboard/settings?tab=integrations')
    } else if (stripeRefresh === 'true') {
      toast.info('Please complete the Stripe onboarding process')
      setActiveTab('integrations')
    }
    
    const stripeError = searchParams.get('stripe_error')
    if (stripeError) {
      toast.error(`Stripe connection error: ${decodeURIComponent(stripeError)}`)
      setActiveTab('integrations')
      router.replace('/dashboard/settings?tab=integrations')
    }
  }, [searchParams, router])

  // Load payment methods
  const loadPaymentMethods = async () => {
    try {
      setLoadingPaymentMethods(true)
      const user = await getCurrentUser()
      if (!user) return

      const response = await fetch('/api/stripe/payment-methods')

      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error loading payment methods:', error)
    } finally {
      setLoadingPaymentMethods(false)
    }
  }

  // Load billing history
  const loadBillingHistory = async () => {
    try {
      setLoadingBillingHistory(true)
      const response = await fetch('/api/stripe/invoices')

      if (response.ok) {
        const data = await response.json()
        setBillingHistory(data.invoices || [])
      } else {
        const error = await response.json()
        console.error('Error loading billing history:', error)
        // Set empty array on error
        setBillingHistory([])
      }
    } catch (error) {
      console.error('Error loading billing history:', error)
      setBillingHistory([])
    } finally {
      setLoadingBillingHistory(false)
    }
  }

  // Download invoice PDF
  const handleDownloadInvoice = (invoicePdf: string | null, invoiceNumber: string) => {
    if (!invoicePdf) {
      toast.error('Invoice PDF not available')
      return
    }
    // Open PDF in new tab
    window.open(invoicePdf, '_blank')
  }

  // Open billing portal for payment method management
  const handleManagePaymentMethods = async () => {
    try {
      setLoadingBillingPortal(true)
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error opening billing portal:', error)
      toast.error(error.message || 'Failed to open billing portal')
      setLoadingBillingPortal(false)
    }
  }

  // Handle Stripe Connect connection
  const handleStripeConnect = async (useOAuth: boolean = false) => {
    try {
      setLoadingStripeConnect(true)
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ useOAuth }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect Stripe')
      }

      if (data.url) {
        // Redirect to Stripe Connect onboarding or OAuth
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error connecting Stripe:', error)
      toast.error(error.message || 'Failed to connect Stripe')
      setLoadingStripeConnect(false)
    }
  }

  // Handle cancel subscription
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? Your subscription will remain active until the end of the current billing period.')) {
      return
    }

    try {
      setCancelingSubscription(true)
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      console.log('Subscription cancellation confirmed by Stripe:', data)
      toast.success(data.message || 'Subscription canceled successfully')
      
      // Reload account data
      const updatedAccount = await getCurrentAccount()
      if (updatedAccount) setAccount(updatedAccount)
      
      // Wait a moment for Stripe to update, then reload subscription details
      setTimeout(async () => {
        await loadSubscriptionDetails()
      }, 1000)
    } catch (error: any) {
      console.error('Error canceling subscription:', error)
      toast.error(error.message || 'Failed to cancel subscription')
    } finally {
      setCancelingSubscription(false)
    }
  }

  // Handle resume subscription
  const handleResumeSubscription = async () => {
    if (!confirm('Are you sure you want to resume your subscription? Your subscription will continue after the current billing period.')) {
      return
    }

    try {
      setResumingSubscription(true)
      const response = await fetch('/api/stripe/resume-subscription', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resume subscription')
      }

      console.log('Subscription resumed successfully:', data)
      toast.success(data.message || 'Subscription resumed successfully')
      
      // Reload account data
      const updatedAccount = await getCurrentAccount()
      if (updatedAccount) setAccount(updatedAccount)
      
      // Reload subscription details
      await loadSubscriptionDetails()
    } catch (error: any) {
      console.error('Error resuming subscription:', error)
      toast.error(error.message || 'Failed to resume subscription')
    } finally {
      setResumingSubscription(false)
    }
  }

  // Handle plan change (upgrade or downgrade)
  const handleChangePlan = async (planTier: 'free' | 'pro' | 'premium') => {
    if (planTier === currentPlan.planTier) {
      toast.info('You are already on this plan')
      return
    }

    try {
      setChangingPlan(true)
      setLoadingCheckout(true)

      // If changing to free, use change-plan endpoint
      if (planTier === 'free') {
        const response = await fetch('/api/stripe/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planTier }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to change plan')
        }

        toast.success(data.message || 'Plan changed successfully')
        setShowUpgradeModal(false)
        
        // Reload account data
        const updatedAccount = await getCurrentAccount()
        if (updatedAccount) setAccount(updatedAccount)
        
        // Reload subscription details
        await loadSubscriptionDetails()
        
        // Wait a moment for Stripe to finalize the invoice, then refresh billing history once
        setTimeout(() => {
          loadBillingHistory()
        }, 3000)
        
        return
      }

      // For pro/premium, check if user has an active subscription
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please sign in to continue')
        return
      }

      // Check if user has an active subscription
      const verifyResponse = await fetch('/api/stripe/verify-session')
      const verifyData = await verifyResponse.json()
      
      // If user has an active subscription with payment method, show confirmation
      if (verifyData.subscriptionStatus === 'active' || verifyData.subscriptionStatus === 'trialing') {
        // Check if they have a payment method
        if (paymentMethods.length > 0) {
          // Show confirmation modal
          setPendingPlanChange(planTier)
          setShowPlanChangeConfirmModal(true)
          setChangingPlan(false)
          setLoadingCheckout(false)
          return
        }
        
        // No payment method, proceed with plan change
        const response = await fetch('/api/stripe/change-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planTier }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to change plan')
        }

        toast.success(data.message || 'Plan changed successfully')
        setShowUpgradeModal(false)
        
        // Reload account data
        const updatedAccount = await getCurrentAccount()
        if (updatedAccount) setAccount(updatedAccount)
        
        // Reload subscription details
        await loadSubscriptionDetails()
        
        // Wait a moment for Stripe to finalize the invoice, then refresh billing history once
        setTimeout(() => {
          loadBillingHistory()
        }, 3000)
        
        return
      }

      // No active subscription, use checkout flow
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planTier }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect directly to Stripe Checkout URL
      if (data.url) {
        window.location.href = data.url
      } else if (data.sessionId) {
        // Fallback: construct URL if only sessionId is provided
        window.location.href = `https://checkout.stripe.com/c/pay/${data.sessionId}`
      } else {
        throw new Error('No checkout URL or session ID received')
      }
    } catch (error: any) {
      console.error('Error changing plan:', error)
      toast.error(error.message || 'Failed to change plan')
    } finally {
      setChangingPlan(false)
      setLoadingCheckout(false)
    }
  }

  // Handle checkout (for new subscriptions)
  const handleCheckout = async (planTier: 'pro' | 'premium') => {
    await handleChangePlan(planTier)
  }

  // Get current plan based on account data
  const getCurrentPlan = () => {
    if (!account) {
      return { name: "Free", price: 0, planTier: "free" }
    }
    
    const planTier = account.plan_tier || "free"
    
    switch (planTier) {
      case "pro":
        return { name: "Pro", price: 25, planTier: "pro" }
      case "premium":
        return { name: "Premium", price: 39, planTier: "premium" }
      default:
        return { name: "Free", price: 0, planTier: "free" }
    }
  }

  const currentPlan = getCurrentPlan()

  // Load team members and invites
  const loadTeamData = async () => {
    if (!account) return

    try {
      setLoadingTeam(true)
      const response = await fetch(`/api/team/members?workspaceId=${account.id}`)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTeamMembers(data.data.members || [])
          setPendingInvites(data.data.pendingInvites || [])
        }
      }
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoadingTeam(false)
    }
  }

  // Load team data when account is available and on team tab
  useEffect(() => {
    if (account && activeTab === 'team') {
      loadTeamData()
    }
  }, [account, activeTab])

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!account || !inviteEmail) return

    try {
      setSendingInvite(true)
      const response = await fetch('/api/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId: account.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      toast.success('Invitation sent successfully!')
      setShowInviteDialog(false)
      setInviteEmail("")
      setInviteRole("member")
      loadTeamData() // Reload team data
    } catch (error: any) {
      console.error('Error sending invite:', error)
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setSendingInvite(false)
    }
  }

  // Handle canceling invite
  const handleCancelInvite = async (inviteId: string) => {
    try {
      const response = await fetch('/api/team/invite/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inviteId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel invitation')
      }

      toast.success('Invitation canceled')
      loadTeamData() // Reload team data
    } catch (error: any) {
      console.error('Error canceling invite:', error)
      toast.error(error.message || 'Failed to cancel invitation')
    }
  }

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleUpdateAccount = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const { data, error } = await updateProfile(profile.user_id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
      })

      if (error) {
        toast.error(error.message || "Failed to update account")
        return
      }

      if (data) {
        setProfile(data)
        toast.success("Account updated successfully")
      }
    } catch (error) {
      console.error("Error updating account:", error)
      toast.error("Failed to update account")
    } finally {
      setSaving(false)
    }
  }

  const getInitials = () => {
    if (profile) {
      const first = profile.first_name?.[0] || ""
      const last = profile.last_name?.[0] || ""
      return (first + last).toUpperCase() || "U"
    }
    return "U"
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !profile) return

    try {
      setUploadingPhoto(true)
      const { url, error } = await uploadProfilePhoto(file, profile.user_id)

      if (error) {
        toast.error(error.message || "Failed to upload photo")
        return
      }

      if (url) {
        // Update profile with new photo URL
        const { data, error: updateError } = await updateProfile(profile.user_id, {
          profile_photo_url: url,
        })

        if (updateError) {
          toast.error(updateError.message || "Failed to update profile")
          return
        }

        if (data) {
          setProfile(data)
          toast.success("Profile photo updated successfully")
        }
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast.error("Failed to upload photo")
    } finally {
      setUploadingPhoto(false)
      // Reset file input
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long")
      return
    }

    try {
      setChangingPassword(true)
      const { error } = await changePassword(passwordData.currentPassword, passwordData.newPassword)

      if (error) {
        toast.error(error.message || "Failed to change password")
        return
      }

      toast.success("Password changed successfully")
      setShowPasswordDialog(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !account) return

    try {
      setUploadingLogo(true)
      const { url, error } = await uploadCompanyLogo(file, account.id)

      if (error) {
        toast.error(error.message || "Failed to upload logo")
        return
      }

      if (url) {
        // Update account with new logo URL
        const { data, error: updateError } = await updateAccount(account.id, {
          logo_url: url,
        })

        if (updateError) {
          toast.error(updateError.message || "Failed to update logo")
          return
        }

        if (data) {
          setAccount(data)
          toast.success("Company logo updated successfully")
        }
      }
    } catch (error) {
      console.error("Error uploading logo:", error)
      toast.error("Failed to upload logo")
    } finally {
      setUploadingLogo(false)
      // Reset file input
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleUpdateCompany = async () => {
    if (!account) return

    try {
      setSavingCompany(true)
      const { data, error } = await updateAccount(account.id, {
        company_name: companyData.companyName || null,
        email: companyData.companyEmail || null,
        phone: companyData.companyPhone || null,
        address: companyData.address || null,
        timezone: companyData.timezone || null,
        industry: companyData.industry === "other" ? companyData.otherIndustry : companyData.industry || null,
      })

      if (error) {
        toast.error(error.message || "Failed to update company")
        return
      }

      if (data) {
        setAccount(data)
        toast.success("Company information updated successfully")
      }
    } catch (error) {
      console.error("Error updating company:", error)
      toast.error("Failed to update company")
    } finally {
      setSavingCompany(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:flex">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Company</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              <span className="hidden sm:inline">Integrations</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Payouts</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Update your personal account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3C3CFF]" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={profile?.profile_photo_url || undefined} />
                        <AvatarFallback>{getInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="profile-photo-upload"
                          disabled={uploadingPhoto || saving}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("profile-photo-upload")?.click()}
                          disabled={uploadingPhoto || saving}
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Photo
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-1">JPG, PNG, WebP up to 2MB</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          disabled={saving}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        disabled={saving}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        disabled={saving}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                        onClick={handleUpdateAccount}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Account"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowPasswordDialog(true)}
                        disabled={saving}
                      >
                        Change Password
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>In-App Notifications</Label>
                    <p className="text-sm text-gray-500">Show notifications in the dashboard</p>
                  </div>
                  <Switch
                    checked={notifications.inApp}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, inApp: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Updates</Label>
                    <p className="text-sm text-gray-500">Receive product updates and tips</p>
                  </div>
                  <Switch
                    checked={notifications.marketing}
                    onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, marketing: checked }))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3C3CFF]" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {account?.logo_url ? (
                          <img
                            src={account.logo_url}
                            alt="Company logo"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="company-logo-upload"
                          disabled={uploadingLogo || savingCompany}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("company-logo-upload")?.click()}
                          disabled={uploadingLogo || savingCompany}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                        <p className="text-sm text-gray-500 mt-1">PNG, SVG, JPG, WebP up to 2MB</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={companyData.companyName}
                        onChange={(e) => setCompanyData({ ...companyData, companyName: e.target.value })}
                        disabled={savingCompany}
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Company Email</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companyData.companyEmail}
                        onChange={(e) => setCompanyData({ ...companyData, companyEmail: e.target.value })}
                        disabled={savingCompany}
                        placeholder="company@example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Company Phone</Label>
                      <Input
                        id="companyPhone"
                        type="tel"
                        value={companyData.companyPhone}
                        onChange={(e) => setCompanyData({ ...companyData, companyPhone: e.target.value })}
                        disabled={savingCompany}
                        placeholder="(555) 123-4567"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={companyData.address}
                        onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                        disabled={savingCompany}
                        placeholder="Enter company address"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timezone">Time Zone</Label>
                      <Select
                        value={companyData.timezone}
                        onValueChange={(value) => setCompanyData({ ...companyData, timezone: value })}
                        disabled={savingCompany}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="est">Eastern Time (EST)</SelectItem>
                          <SelectItem value="cst">Central Time (CST)</SelectItem>
                          <SelectItem value="mst">Mountain Time (MST)</SelectItem>
                          <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry</Label>
                      <Select
                        value={companyData.industry}
                        onValueChange={(value) => setCompanyData({ ...companyData, industry: value })}
                        disabled={savingCompany}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="copywriting">Copywriting</SelectItem>
                          <SelectItem value="web_design">Web Design</SelectItem>
                          <SelectItem value="graphic_design">Graphic Design</SelectItem>
                          <SelectItem value="video_editing">Video Editing</SelectItem>
                          <SelectItem value="photography">Photography</SelectItem>
                          <SelectItem value="seo">SEO</SelectItem>
                          <SelectItem value="social_media">Social Media Management</SelectItem>
                          <SelectItem value="marketing">Marketing</SelectItem>
                          <SelectItem value="ux_ui">UX/UI Design</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {companyData.industry === "other" && (
                        <div className="pt-2">
                          <Label className="text-xs text-gray-500">Specify Industry</Label>
                          <Input
                            placeholder="Type your industry"
                            value={companyData.otherIndustry}
                            onChange={(e) => setCompanyData({ ...companyData, otherIndustry: e.target.value })}
                            className="mt-1"
                            disabled={savingCompany}
                          />
                        </div>
                      )}
                    </div>

                    <Button
                      className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                      onClick={handleUpdateCompany}
                      disabled={savingCompany}
                    >
                      {savingCompany ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Company"
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrations</h2>
              <p className="text-gray-600">
                Connect your favorite tools to accept payments, sync calendars, and speed up your workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Stripe */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#635BFF] flex items-center justify-center text-white font-bold text-sm">
                        S
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Stripe</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Let clients pay your invoices using Stripe.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {account?.stripe_connect_account_id && account?.stripe_connect_enabled ? (
                        <>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Connected
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStripeConnect(false)}
                            disabled={loadingStripeConnect}
                          >
                            {loadingStripeConnect ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              'Manage'
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                            Not connected
                          </Badge>
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                            onClick={() => handleStripeConnect(false)}
                            disabled={loadingStripeConnect}
                          >
                            {loadingStripeConnect ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              'Create New Account'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    {!account?.stripe_connect_account_id && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleStripeConnect(true)}
                        disabled={loadingStripeConnect}
                      >
                        {loadingStripeConnect ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          'Connect Existing Stripe Account'
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* PayPal */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0070BA] flex items-center justify-center text-white font-bold text-sm">
                        P
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">PayPal</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Let clients pay your invoices using PayPal.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QuickBooks Online */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0077C5] flex items-center justify-center text-white font-bold text-xs">
                        QB
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">QuickBooks Online</h3>
                          <Badge variant="outline" className="text-xs">Pro & Premium</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Sync invoices and payments to your QuickBooks account.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Resend - Connected */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-sm">
                        R
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Resend</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Send transactional emails for client activity and notifications.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Connected
                    </Badge>
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gmail */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EA4335] flex items-center justify-center text-white font-bold text-sm">
                        G
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Gmail</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Send messages to clients from your Gmail address.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Outlook */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center text-white font-bold text-sm">
                        O
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Outlook</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Send messages to clients from your Outlook account.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Google Calendar */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#4285F4] flex items-center justify-center text-white font-bold text-sm">
                        C
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Google Calendar</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sync your bookings and events with Google Calendar.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* X (Twitter) */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white font-bold text-sm">
                        X
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">X (Twitter)</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Schedule posts directly to your X profile.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* LinkedIn */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0077B5] flex items-center justify-center text-white font-bold text-sm">
                        in
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">LinkedIn</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Schedule posts to your LinkedIn profile.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Google Drive */}
              <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#0F9D58] flex items-center justify-center text-white font-bold text-sm">
                        D
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Google Drive</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Import contracts, assets, and files from Google Drive.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                      Not connected
                    </Badge>
                    <Button variant="default" size="sm" className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Billing & Subscription */}
          <TabsContent value="billing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Manage your subscription and billing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{currentPlan.name} Plan</h3>
                      <Badge 
                        variant={subscriptionDetails?.cancelAtPeriodEnd || account?.subscription_status === 'cancel_at_period_end' ? 'secondary' : 'default'}
                        className={subscriptionDetails?.cancelAtPeriodEnd || account?.subscription_status === 'cancel_at_period_end' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}
                      >
                        {subscriptionDetails?.cancelAtPeriodEnd || account?.subscription_status === 'cancel_at_period_end' ? 'Cancels at period end' : 'Active'}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">
                      ${currentPlan.price}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </p>
                    {subscriptionDetails?.currentPeriodEnd && (
                      <p className="text-sm text-gray-600 mt-2">
                        Renewal date: {subscriptionDetails.currentPeriodEnd ? formatDate(subscriptionDetails.currentPeriodEnd) : 'N/A'}
                      </p>
                    )}
                    {subscriptionDetails?.cancelAtPeriodEnd && subscriptionDetails?.currentPeriodEnd ? (
                      <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                        <Info className="h-4 w-4" />
                        You'll keep {currentPlan.name} features until {formatDate(subscriptionDetails.currentPeriodEnd)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowPlanDetailsModal(true)}>View Plan Details</Button>
                    {currentPlan.planTier === 'free' ? (
                      <Button 
                        className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                        onClick={() => setShowUpgradeModal(true)}
                        disabled={loadingCheckout || changingPlan}
                      >
                        {loadingCheckout || changingPlan ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Upgrade'
                        )}
                      </Button>
                    ) : (
                      <>
                        {subscriptionDetails?.cancelAtPeriodEnd || account?.subscription_status === 'cancel_at_period_end' ? (
                          <Button 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={handleResumeSubscription}
                            disabled={resumingSubscription}
                          >
                            {resumingSubscription ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Resuming...
                              </>
                            ) : (
                              'Resume Subscription'
                            )}
                          </Button>
                        ) : (
                          <Button 
                            className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                            onClick={() => setShowManagePlanModal(true)}
                            disabled={loadingCheckout || changingPlan}
                          >
                            Manage Plan
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-4">Payment Method</h4>
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your payment methods, update billing information, and view invoices in the Stripe billing portal.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleManagePaymentMethods}
                      disabled={loadingBillingPortal}
                    >
                      {loadingBillingPortal ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Manage Payment Methods
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Billing History</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        loadBillingHistory()
                      }}
                      disabled={loadingBillingHistory}
                    >
                      {loadingBillingHistory ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Refresh
                        </>
                      )}
                    </Button>
                  </div>
                  {loadingBillingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-[#3C3CFF]" />
                    </div>
                  ) : billingHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm mb-2">No billing history found</p>
                      <p className="text-xs text-gray-400">
                        {currentPlan.planTier === 'free' 
                          ? 'Billing history will appear here once you subscribe to a plan.'
                          : 'Invoices will appear here after your first payment or plan change.'}
                      </p>
                    </div>
                  ) : (
                    <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                      <div className="space-y-0 divide-y">
                        {billingHistory.map((invoice) => (
                          <div key={invoice.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                              <span className="font-medium text-sm">{invoice.invoiceNumber}</span>
                              <span className="text-sm text-gray-500 whitespace-nowrap">{formatDate(invoice.date)}</span>
                              <Badge 
                                variant={invoice.status === "Paid" ? "default" : "secondary"}
                                className="whitespace-nowrap"
                              >
                                {invoice.status}
                              </Badge>
                              {invoice.description && (
                                <span className="text-sm text-gray-500 truncate hidden sm:block">{invoice.description}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className="font-medium text-sm whitespace-nowrap">
                                {formatCurrency(invoice.amount, invoice.currency)}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice.invoicePdf, invoice.invoiceNumber)}
                                disabled={!invoice.invoicePdf}
                                className="h-8 w-8 p-0"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {currentPlan.planTier !== 'free' && (
                  <div className="pt-4">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleCancelSubscription}
                      disabled={cancelingSubscription}
                    >
                      {cancelingSubscription ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Canceling...
                        </>
                      ) : (
                        'Cancel Subscription'
                      )}
                    </Button>
                    <p className="text-sm text-gray-500 mt-2">
                      Your subscription will remain active until the end of the current billing period.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payouts */}
          <TabsContent value="payouts" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payouts</h2>
              <p className="text-gray-600 mt-2">
                View your balance and manage payouts for your connected payment providers.
              </p>
            </div>

            {loadingPayoutSummary ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF]" />
              </div>
            ) : (
              <>
                {account && (account.plan_tier !== 'premium' && account.plan_tier !== 'pro') && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 mb-1">Payouts are available on the Premium plan</h3>
                          <p className="text-sm text-amber-700 mb-4">
                            Upgrade to Premium to access payout management and view your balances.
                          </p>
                          <Button
                            onClick={() => setActiveTab('billing')}
                            className="bg-amber-600 hover:bg-amber-700"
                          >
                            Upgrade Plan
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!payoutSummary?.stripe.connected && !payoutSummary?.paypal.connected ? (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-12">
                        <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          You haven't connected any payout provider yet
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">
                          Connect Stripe or PayPal from the Integrations page to receive payouts.
                        </p>
                        <Button
                          onClick={() => setActiveTab('integrations')}
                          className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                        >
                          Go to Integrations
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {/* Default Payout Provider Selection */}
                    {payoutSummary?.stripe.connected && payoutSummary?.paypal.connected && (
                      <Card>
                        <CardHeader>
                          <CardTitle>Default Payout Provider</CardTitle>
                          <CardDescription>
                            New invoices will default to this payout provider (you can still override per invoice).
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <RadioGroup
                            value={payoutSummary.defaultPayoutProvider || ''}
                            onValueChange={(value) => {
                              if (value === 'stripe' || value === 'paypal') {
                                handleSetDefaultProvider(value)
                              }
                            }}
                            disabled={updatingDefaultProvider}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="stripe" id="stripe-default" />
                              <Label htmlFor="stripe-default" className="cursor-pointer">
                                Stripe
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="paypal" id="paypal-default" />
                              <Label htmlFor="paypal-default" className="cursor-pointer">
                                PayPal
                              </Label>
                            </div>
                          </RadioGroup>
                          {updatingDefaultProvider && (
                            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Updating...
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stripe Card */}
                      {payoutSummary?.stripe.connected ? (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Stripe Payouts
                              </CardTitle>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {account && (account.plan_tier === 'premium' || account.plan_tier === 'pro') && (
                              <>
                                {payoutSummary.stripe.available !== null && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Available Balance</p>
                                    <p className="text-2xl font-bold">
                                      {formatCurrency(
                                        payoutSummary.stripe.available.amount / 100,
                                        payoutSummary.stripe.available.currency
                                      )}
                                    </p>
                                  </div>
                                )}
                                {payoutSummary.stripe.pending !== null && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Pending Balance</p>
                                    <p className="text-xl font-semibold text-amber-600">
                                      {formatCurrency(
                                        payoutSummary.stripe.pending.amount / 100,
                                        payoutSummary.stripe.pending.currency
                                      )}
                                    </p>
                                  </div>
                                )}
                                {payoutSummary.stripe.available === null && payoutSummary.stripe.pending === null && (
                                  <p className="text-sm text-gray-500">
                                    We couldn't load your Stripe balance right now. Try again later.
                                  </p>
                                )}
                              </>
                            )}
                            <div>
                              <p className="text-sm text-gray-600 mb-3">
                                {payoutSummary.defaultPayoutProvider === 'stripe'
                                  ? 'Stripe is your active payout provider.'
                                  : payoutSummary.paypal.connected
                                  ? 'Stripe is connected but not set as default.'
                                  : 'Stripe is your active payout provider.'}
                              </p>
                              <Button
                                onClick={handleManageStripe}
                                disabled={loadingManageLink === 'stripe'}
                                className="w-full"
                                variant="outline"
                              >
                                {loadingManageLink === 'stripe' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Opening...
                                  </>
                                ) : (
                                  <>
                                    Manage Payouts on Stripe
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="opacity-60">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              Stripe Payouts
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 mb-4">
                              Not Connected
                            </Badge>
                            <p className="text-sm text-gray-600 mb-4">
                              Connect Stripe from the Integrations page to enable Stripe payouts.
                            </p>
                            <Button
                              onClick={() => setActiveTab('integrations')}
                              variant="outline"
                              className="w-full"
                            >
                              Go to Integrations
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* PayPal Card */}
                      {payoutSummary?.paypal.connected ? (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="flex items-center gap-2">
                                <Wallet className="h-5 w-5" />
                                PayPal Payouts
                              </CardTitle>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Connected
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-600 mb-3">
                                {payoutSummary.defaultPayoutProvider === 'paypal'
                                  ? 'PayPal is your active payout provider.'
                                  : payoutSummary.stripe.connected
                                  ? 'PayPal is connected but not set as default.'
                                  : 'PayPal is your active payout provider.'}
                              </p>
                              <Button
                                onClick={handleManagePayPal}
                                disabled={loadingManageLink === 'paypal'}
                                className="w-full"
                                variant="outline"
                              >
                                {loadingManageLink === 'paypal' ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Opening...
                                  </>
                                ) : (
                                  <>
                                    Manage Payouts on PayPal
                                    <ExternalLink className="h-4 w-4 ml-2" />
                                  </>
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ) : (
                        <Card className="opacity-60">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Wallet className="h-5 w-5" />
                              PayPal Payouts
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 mb-4">
                              Not Connected
                            </Badge>
                            <p className="text-sm text-gray-600 mb-4">
                              Connect PayPal from the Integrations page to enable PayPal payouts.
                            </p>
                            <Button
                              onClick={() => setActiveTab('integrations')}
                              variant="outline"
                              className="w-full"
                            >
                              Go to Integrations
                            </Button>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team and their permissions</CardDescription>
                  </div>
                  {account && (() => {
                    const limits = getWorkspacePlanLimits(account.plan_tier)
                    const canInvite = limits.allowsTeamInvites && (teamMembers.length + pendingInvites.length) < limits.maxTeamMembers
                    const userMembership = teamMembers.find(m => m.userId === profile?.user_id)
                    const canManage = userMembership && ['owner', 'admin'].includes(userMembership.role)
                    
                    return canManage && (
                      <Button 
                        className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                        onClick={() => setShowInviteDialog(true)}
                        disabled={!canInvite}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Invite Member
                      </Button>
                    )
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                {account && (() => {
                  const limits = getWorkspacePlanLimits(account.plan_tier)
                  const totalUsed = teamMembers.length + pendingInvites.length
                  const canInvite = limits.allowsTeamInvites && totalUsed < limits.maxTeamMembers
                  
                  return (
                    <div className={`mb-4 p-3 rounded-lg ${canInvite ? 'bg-blue-50' : 'bg-yellow-50'}`}>
                      <p className={`text-sm ${canInvite ? 'text-blue-800' : 'text-yellow-800'}`}>
                        <strong>{totalUsed} of {limits.maxTeamMembers}</strong> team seats used
                        {!limits.allowsTeamInvites && (
                          <span className="block mt-1">Upgrade to Premium to invite team members</span>
                        )}
                      </p>
                    </div>
                  )
                })()}

                {loadingTeam ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#3C3CFF]" />
                  </div>
                ) : (
                  <>
                    {/* Current Members */}
                    {teamMembers.length > 0 && (
                      <div className="space-y-3 mb-6">
                        <h4 className="font-semibold text-sm text-gray-700">Members</h4>
                        {teamMembers.map((member) => (
                          <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                {member.profilePhotoUrl ? (
                                  <AvatarImage src={member.profilePhotoUrl} />
                                ) : null}
                                <AvatarFallback>
                                  {member.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="capitalize">
                                {member.role}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pending Invites */}
                    {pendingInvites.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-gray-700">Pending Invitations</h4>
                        {pendingInvites.map((invite) => (
                          <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback>
                                  {invite.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{invite.email}</p>
                                <p className="text-sm text-gray-500">
                                  Expires {new Date(invite.expiresAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="capitalize">
                                {invite.role}
                              </Badge>
                              <Badge variant="outline">Pending</Badge>
                              {(() => {
                                const userMembership = teamMembers.find(m => m.userId === profile?.user_id)
                                const canManage = userMembership && ['owner', 'admin'].includes(userMembership.role)
                                return canManage && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleCancelInvite(invite.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {teamMembers.length === 0 && pendingInvites.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p>No team members yet.</p>
                        {account && (() => {
                          const limits = getWorkspacePlanLimits(account.plan_tier)
                          const userMembership = teamMembers.find(m => m.userId === profile?.user_id)
                          const canManage = userMembership && ['owner', 'admin'].includes(userMembership.role)
                          return canManage && limits.allowsTeamInvites && (
                            <Button 
                              variant="outline" 
                              className="mt-4"
                              onClick={() => setShowInviteDialog(true)}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Invite Your First Team Member
                            </Button>
                          )
                        })()}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Team Member Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                disabled={sendingInvite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteRole">Role</Label>
              <Select value={inviteRole} onValueChange={(value: "admin" | "member") => setInviteRole(value)} disabled={sendingInvite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {inviteRole === 'admin' 
                  ? 'Admins can invite members and manage team settings'
                  : 'Members have access to workspace features'}
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSendInvite}
                disabled={!inviteEmail || sendingInvite}
                className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
              >
                {sendingInvite ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Invitation'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteDialog(false)
                  setInviteEmail("")
                  setInviteRole("member")
                }}
                disabled={sendingInvite}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, currentPassword: e.target.value })
                }
                disabled={changingPassword}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, newPassword: e.target.value })
                }
                disabled={changingPassword}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                disabled={changingPassword}
                placeholder="Confirm new password"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordDialog(false)
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  })
                }}
                disabled={changingPassword}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  "Change Password"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Plan Details Modal */}
      <Dialog open={showPlanDetailsModal} onOpenChange={setShowPlanDetailsModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="pb-6">
            <DialogTitle>Plan Details</DialogTitle>
            <DialogDescription>View and compare all available plans</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <Card className={`border-2 ${currentPlan.planTier === "free" ? "border-[#3C3CFF]" : "border-gray-200"} hover:border-[#3C3CFF] transition-all relative`}>
                {currentPlan.planTier === "free" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#3C3CFF] text-white px-4 py-1">Current Plan</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                  <p className="text-gray-600 mb-4 text-sm">For freelancers building their first momentum</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$0</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Full access to core tools</span></li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700">2 active clients/projects per month</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-600 hover:text-gray-700 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archived clients and completed projects don't count toward your limit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">3 live forms</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Scheduler + time tracking</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal with Jolix branding</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 editable portfolio (with Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 scheduled posts / month (X only)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Basic analytics dashboard</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 automation rule</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Tax tools (basic)</span></li>
                  </ul>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className={`${currentPlan.planTier === "pro" ? "border-4 border-[#3C3CFF]" : "border-2 border-gray-200"} hover:border-[#3C3CFF] transition-all relative`}>
                {currentPlan.planTier === "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#3C3CFF] text-white px-4 py-1">Current Plan</Badge>
                  </div>
                )}
                {currentPlan.planTier !== "pro" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#3C3CFF] text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-4 text-sm">Best for growing freelancers</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$25</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Free</span></li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700">Manage up to 20 active clients/projects simultaneously</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-600 hover:text-gray-700 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archived clients and completed projects don't count toward your limit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 live forms</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal with custom domain (no Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 editable portfolio (custom domain support)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 scheduled posts / month (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Full analytics dashboard (revenue + engagement)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">5 automation rules</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Tax tools (pro)</span></li>
                  </ul>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className={`border-2 ${currentPlan.planTier === "premium" ? "border-[#3C3CFF]" : "border-gray-200"} hover:border-[#3C3CFF] transition-all relative`}>
                {currentPlan.planTier === "premium" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[#3C3CFF] text-white px-4 py-1">Current Plan</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <p className="text-gray-600 mb-4 text-sm">For freelancers ready to grow into a brand</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$39</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Pro</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited clients & projects</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited lead credits</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Up to 5 team members</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited scheduled posts (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals & invoices</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited forms</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">White label Client Portal with custom domain</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Advanced analytics + brand performance insights</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Portfolio analytics + engagement tracking</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited automations</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Tax tools (premium)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Priority support</span></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal (for free users) */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="pb-6">
            <DialogTitle>Upgrade Your Plan</DialogTitle>
            <DialogDescription>Choose a plan that works best for you</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pro Plan */}
              <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#3C3CFF] text-white px-4 py-1">Most Popular</Badge>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro</h3>
                  <p className="text-gray-600 mb-4 text-sm">Best for growing freelancers</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$25</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Free</span></li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-700">Manage up to 20 active clients/projects simultaneously</span>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3 w-3 text-gray-600 hover:text-gray-700 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Archived clients and completed projects don't count toward your limit.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals, and invoices</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 live forms</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Client Portal with custom domain (no Jolix branding)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">1 editable portfolio (custom domain support)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 lead credits / month</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 scheduled posts / month (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Full analytics dashboard (revenue + engagement)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">5 automation rules</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">10 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Tax tools (pro)</span></li>
                  </ul>
                  <Button
                    className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                    onClick={() => handleChangePlan('pro')}
                    disabled={loadingCheckout || changingPlan}
                  >
                    {loadingCheckout || changingPlan ? 'Processing...' : 'Upgrade to Pro'}
                  </Button>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all relative">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Premium</h3>
                  <p className="text-gray-600 mb-4 text-sm">For freelancers ready to grow into a brand</p>
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">$39</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 text-sm">
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Everything in Pro</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited clients & projects</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited lead credits</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Up to 5 team members</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited scheduled posts (X + LinkedIn)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited contracts, proposals & invoices</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited forms</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">White label Client Portal with custom domain</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Advanced analytics + brand performance insights</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Portfolio analytics + engagement tracking</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Unlimited automations</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">100 GB file storage</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">QuickBooks integration</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Tax tools (premium)</span></li>
                    <li className="flex items-start"><Check className="h-4 w-4 text-[#3C3CFF] mr-2 flex-shrink-0 mt-0.5" /><span className="text-gray-700">Priority support</span></li>
                  </ul>
                  <Button
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                    onClick={() => handleChangePlan('premium')}
                    disabled={loadingCheckout || changingPlan}
                  >
                    {loadingCheckout || changingPlan ? 'Processing...' : 'Upgrade to Premium'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Plan Modal (for paid users) */}
      <Dialog open={showManagePlanModal} onOpenChange={setShowManagePlanModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-8">
          <DialogHeader className="pb-6">
            <DialogTitle>Manage Your Plan</DialogTitle>
            <DialogDescription>Upgrade your plan or downgrade to Free</DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-8">
            {/* Upgrade Plan Section */}
            {currentPlan.planTier !== 'premium' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Upgrade Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {currentPlan.planTier === 'free' && (
                    <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all">
                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Pro</h4>
                        <p className="text-gray-600 mb-4 text-sm">Best for growing freelancers</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">$25</span>
                          <span className="text-gray-600">/month</span>
                        </div>
                        <Button
                          className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
                          onClick={() => {
                            setShowManagePlanModal(false)
                            handleChangePlan('pro')
                          }}
                          disabled={loadingCheckout || changingPlan}
                        >
                          Upgrade to Pro
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  {currentPlan.planTier !== 'premium' && (
                    <Card className="border-2 border-gray-200 hover:border-[#3C3CFF] transition-all">
                      <CardContent className="p-6">
                        <h4 className="text-xl font-bold text-gray-900 mb-2">Premium</h4>
                        <p className="text-gray-600 mb-4 text-sm">For freelancers ready to grow into a brand</p>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-gray-900">$39</span>
                          <span className="text-gray-600">/month</span>
                        </div>
                        <Button
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                          onClick={() => {
                            setShowManagePlanModal(false)
                            handleChangePlan('premium')
                          }}
                          disabled={loadingCheckout || changingPlan}
                        >
                          Upgrade to Premium
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* Downgrade Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Downgrade</h3>
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-2">Downgrade to Free</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        Your subscription will be canceled at the end of your current billing period. You'll keep all {currentPlan.name} features until then.
                      </p>
                      {subscriptionDetails?.currentPeriodEnd && (
                        <p className="text-sm text-amber-600 flex items-center gap-1">
                          <Info className="h-4 w-4" />
                          You'll keep {currentPlan.name} features until {formatDate(subscriptionDetails.currentPeriodEnd || '')}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowManagePlanModal(false)
                        setShowDowngradeConfirmModal(true)
                      }}
                      disabled={loadingCheckout || changingPlan}
                    >
                      Downgrade to Free
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Confirmation Modal */}
      <Dialog open={showPlanChangeConfirmModal} onOpenChange={setShowPlanChangeConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Plan Upgrade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              You're about to upgrade to <strong>{pendingPlanChange ? pendingPlanChange.charAt(0).toUpperCase() + pendingPlanChange.slice(1) : ''}</strong>.
            </p>
            <p className="text-sm text-gray-600">
              This will immediately charge your payment method on file. You'll be charged the full amount for the new plan.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> You will be charged immediately for the plan upgrade.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPlanChangeConfirmModal(false)
                setPendingPlanChange(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!pendingPlanChange) return
                
                setShowPlanChangeConfirmModal(false)
                const planToChange = pendingPlanChange
                setPendingPlanChange(null)
                
                try {
                  setChangingPlan(true)
                  setLoadingCheckout(true)

                  const response = await fetch('/api/stripe/change-plan', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ planTier: planToChange }),
                  })

                  const data = await response.json()

                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to change plan')
                  }

                  toast.success(data.message || 'Plan changed successfully')
                  setShowUpgradeModal(false)
                  
                  // Reload account data
                  const updatedAccount = await getCurrentAccount()
                  if (updatedAccount) setAccount(updatedAccount)
                  
                  // Reload subscription details
                  await loadSubscriptionDetails()
                  
                  // Wait a moment for Stripe to finalize the invoice, then refresh billing history once
                  setTimeout(() => {
                    loadBillingHistory()
                  }, 3000)
                } catch (error: any) {
                  console.error('Error changing plan:', error)
                  toast.error(error.message || 'Failed to change plan')
                } finally {
                  setChangingPlan(false)
                  setLoadingCheckout(false)
                }
              }}
              disabled={changingPlan || loadingCheckout}
            >
              {changingPlan || loadingCheckout ? 'Processing...' : 'Confirm Plan Change'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Confirmation Modal */}
      <Dialog open={showDowngradeConfirmModal} onOpenChange={setShowDowngradeConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Downgrade to Free</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              You're about to downgrade to the Free plan.
            </p>
            <p className="text-sm text-gray-600">
              Your subscription will be canceled at the end of your current billing period. You'll keep all {currentPlan.name} features until then.
            </p>
            {subscriptionDetails?.currentPeriodEnd && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>You'll keep {currentPlan.name} features until {formatDate(subscriptionDetails.currentPeriodEnd || '')}</strong>
                </p>
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> No refunds will be issued. You'll continue to have access until your billing period ends.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDowngradeConfirmModal(false)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setShowDowngradeConfirmModal(false)
                
                try {
                  setChangingPlan(true)
                  setLoadingCheckout(true)

                  const response = await fetch('/api/stripe/change-plan', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ planTier: 'free' }),
                  })

                  const data = await response.json()

                  if (!response.ok) {
                    throw new Error(data.error || 'Failed to downgrade plan')
                  }

                  toast.success(data.message || 'Plan downgrade scheduled successfully')
                  setShowManagePlanModal(false)
                  
                  // Reload account data
                  const updatedAccount = await getCurrentAccount()
                  if (updatedAccount) setAccount(updatedAccount)
                  
                  // Reload subscription details
                  await loadSubscriptionDetails()
                  
                  // Wait a moment for Stripe to finalize, then refresh billing history
                  setTimeout(() => {
                    loadBillingHistory()
                  }, 3000)
                } catch (error: any) {
                  console.error('Error downgrading plan:', error)
                  toast.error(error.message || 'Failed to downgrade plan')
                } finally {
                  setChangingPlan(false)
                  setLoadingCheckout(false)
                }
              }}
              disabled={changingPlan || loadingCheckout}
              variant="destructive"
            >
              {changingPlan || loadingCheckout ? 'Processing...' : 'Confirm Downgrade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
