"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [loading, setLoading] = useState(true)
  const [invite, setInvite] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [accepting, setAccepting] = useState(false)
  const [signingUp, setSigningUp] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })
  
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  })

  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    async function loadInvite() {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        // Check if user is logged in
        const supabase = createClient()
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        // Fetch invite details
        const response = await fetch(`/api/team/invite/verify?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          setInvite(null)
          setLoading(false)
          return
        }

        setInvite(data.data)
        if (data.data?.email) {
          setSignupData(prev => ({ ...prev, email: data.data.email }))
          setLoginData(prev => ({ ...prev, email: data.data.email }))
        }
      } catch (error) {
        console.error('Error loading invite:', error)
        setInvite(null)
      } finally {
        setLoading(false)
      }
    }

    loadInvite()
  }, [token])

  const handleAcceptInvite = async () => {
    if (!token) return

    try {
      setAccepting(true)
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Successfully joined workspace!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error accepting invite:', error)
      toast.error(error.message || 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      setSigningUp(true)
      const supabase = createClient()

      // Sign up the user with invite metadata
      const { data: signupResult, error: signupError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            via_invite: true, // Flag to indicate this is an invite signup
            invite_token: token, // Store token to process after signup
          },
        },
      })

      if (signupError) {
        throw signupError
      }

      if (!signupResult.user) {
        throw new Error('Failed to create user')
      }

      // Accept the invite
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Account created and workspace joined!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error signing up:', error)
      toast.error(error.message || 'Failed to create account')
    } finally {
      setSigningUp(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return

    try {
      setLoggingIn(true)
      const supabase = createClient()

      // Log in the user
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      if (loginError) {
        throw loginError
      }

      // Accept the invite
      const response = await fetch('/api/team/invite/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      toast.success('Successfully joined workspace!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Error logging in:', error)
      toast.error(error.message || 'Failed to log in')
    } finally {
      setLoggingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3C3CFF]" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (!invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Invitation Invalid or Expired</CardTitle>
            <CardDescription className="text-center">
              This invitation link is no longer valid. It may have expired or already been used.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is logged in - show confirmation
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-center">You've been invited!</CardTitle>
            <CardDescription className="text-center">
              You've been invited to join <strong>{invite.workspaceName}</strong> as a <strong>{invite.role === 'admin' ? 'Admin' : 'Member'}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleAcceptInvite}
              disabled={accepting}
              className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              {accepting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join Workspace'
              )}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // User is not logged in - show signup/login
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Join {invite.workspaceName}</CardTitle>
          <CardDescription className="text-center">
            {showLogin
              ? 'Log in to accept the invitation'
              : 'Create an account to accept the invitation'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showLogin ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={signupData.firstName}
                  onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                  required
                  disabled={signingUp}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={signupData.lastName}
                  onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                  required
                  disabled={signingUp}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  minLength={6}
                  disabled={signingUp}
                />
              </div>
              <Button
                type="submit"
                disabled={signingUp}
                className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
              >
                {signingUp ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Join'
                )}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowLogin(true)}
                  className="text-[#3C3CFF] hover:underline"
                >
                  Already have an account? Log in instead
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Email</Label>
                <Input
                  id="loginEmail"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginPassword">Password</Label>
                <Input
                  id="loginPassword"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  disabled={loggingIn}
                />
              </div>
              <Button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging In...
                  </>
                ) : (
                  'Log In & Join'
                )}
              </Button>
              <div className="text-center text-sm">
                <button
                  type="button"
                  onClick={() => setShowLogin(false)}
                  className="text-[#3C3CFF] hover:underline"
                >
                  Don't have an account? Sign up instead
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#3C3CFF]" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}

