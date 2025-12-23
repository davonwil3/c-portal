"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, Mail, Lock, User, Building2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { signUpWithEmail, signInWithEmail, signInWithOAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function AuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    companyName: "",
    email: "",
    password: "",
    agreeToTerms: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateForm = (isSignUp: boolean) => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (isSignUp) {
      if (!formData.firstName) {
        newErrors.firstName = "First name is required"
      }
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = "You must agree to the terms"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (isSignUp: boolean) => {
    if (!validateForm(isSignUp)) return

    setIsLoading(true)

    try {
      if (isSignUp) {
        const loadingToast = toast.loading("Creating your account...")
        
        const { error } = await signUpWithEmail(
          formData.email,
          formData.password,
          {
            first_name: formData.firstName,
            last_name: "", // You might want to add a last name field
            company_name: formData.companyName
          }
        )

        toast.dismiss(loadingToast)

        if (error) {
          toast.error(error.message)
          setErrors({ submit: error.message })
        } else {
          toast.success("Account created successfully! Welcome to ClientPortalHQ!")
          // Redirect to dashboard
          router.push('/dashboard')
        }
      } else {
        const loadingToast = toast.loading("Signing you in...")
        
        const { error } = await signInWithEmail(formData.email, formData.password)

        toast.dismiss(loadingToast)

        if (error) {
          toast.error(error.message)
          setErrors({ submit: error.message })
        } else {
          toast.success("Welcome back!")
          // Redirect to dashboard
          router.push('/dashboard')
        }
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again."
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: 'google' | 'apple') => {
    setIsLoading(true)
    
    try {
      const loadingToast = toast.loading(`Signing you in with ${provider}...`)
      
      const { error } = await signInWithOAuth(provider)
      
      toast.dismiss(loadingToast)
      
      if (error) {
        toast.error(error.message)
        setErrors({ submit: error.message })
        setIsLoading(false)
      }
      // OAuth redirect will happen automatically
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again."
      toast.error(errorMessage)
      setErrors({ submit: errorMessage })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-[#4647E0] to-[#6B5CFF] relative overflow-hidden px-12">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/30 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/25 rounded-full blur-xl"></div>
          <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-white/20 rounded-full blur-xl"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 w-full max-w-lg space-y-10">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-white/30 shadow-sm">
               {/* Using text placeholder as requested if image not handy, or I can try to use Image if I import it. 
                   The user said "use the Jolix logo mark (or a simple “J” placeholder...)" 
                   I will use the text J for simplicity and robustness as I am not sure if I can import Image without checking imports at top, 
                   Wait, I should check imports. 'lucide-react' is there. 'next/image' is NOT imported in the read file above.
                   I will use a simple J text or SVG to be safe, or just the J text as requested.
               */}
              <Image
                src="/jolixlogo.png"
                alt="Jolix Logo"
                width={52}
                height={52}
                className="w-10 h-10"
                quality={90}
              />
            </div>
            <span className="text-2xl font-medium text-white tracking-tight">Jolix</span>
          </div>

          {/* Main Headline & Subheadline */}
          <div className="space-y-7">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight text-white text-left">
              Run your freelance business like a pro.
            </h1>

            <p className="text-lg text-blue-100 leading-relaxed font-normal text-left max-w-full">
              Find clients, manage projects, and get paid in one place.
            </p>
          </div>

          {/* Bullet List */}
          <div className="space-y-4 text-left">
            <div className="flex items-start space-x-3 text-lg text-blue-50/90">
              <div className="flex-shrink-0 mt-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Daily curated leads matched to your skills</span>
            </div>

            <div className="flex items-start space-x-3 text-lg text-blue-50/90">
              <div className="flex-shrink-0 mt-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>Projects, invoices, and client portals all connected</span>
            </div>

            <div className="flex items-start space-x-3 text-lg text-blue-50/90">
              <div className="flex-shrink-0 mt-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>XP levels and challenges that reward consistent progress</span>
            </div>
          </div>

          {/* Footer Line */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-blue-200/70 text-sm font-medium">
              Built for ambitious freelancers who want to run their business like a pro.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-[#F9FAFB] to-[#F4EFFE]/30 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="lg:hidden flex justify-center mb-6">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-[#1A1A1A]">ClientPortalHQ</span>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100">
                <TabsTrigger
                  value="signin"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3C3CFF] data-[state=active]:shadow-sm"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="data-[state=active]:bg-white data-[state=active]:text-[#3C3CFF] data-[state=active]:shadow-sm"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                          errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className={`pl-10 pr-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                          errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}

                    <div className="flex justify-end">
                      <Link
                        href="/auth/forgot-password"
                        className="text-sm text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isLoading}
                  className="w-full h-12 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 bg-transparent"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 bg-transparent"
                      onClick={() => handleOAuthSignIn('apple')}
                      disabled={isLoading}
                    >
                      <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                        />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>

                {/* Error Display */}
                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup" className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-firstname" className="text-sm font-medium text-gray-700">
                      First Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-firstname"
                        type="text"
                        placeholder="Enter your first name"
                        className={`pl-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                          errors.firstName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                      />
                    </div>
                    {errors.firstName && <p className="text-sm text-red-600">{errors.firstName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-company" className="text-sm font-medium text-gray-700">
                      Company Name <span className="text-gray-400">(optional)</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-company"
                        type="text"
                        placeholder="Enter your company name"
                        className="pl-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF]"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        className={`pl-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                          errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                   
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        className={`pl-10 pr-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                          errors.password ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                        }`}
                        value={formData.password}
                        onChange={(e) => handleInputChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="terms"
                        checked={formData.agreeToTerms}
                        onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                        className="mt-1 data-[state=checked]:bg-[#3C3CFF] data-[state=checked]:border-[#3C3CFF]"
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                        I agree to the{" "}
                        <Link href="/terms" className="text-[#3C3CFF] hover:text-[#2D2DCC] underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-[#3C3CFF] hover:text-[#2D2DCC] underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                    {errors.agreeToTerms && <p className="text-sm text-red-600">{errors.agreeToTerms}</p>}
                  </div>
                </div>

                <Button
                  onClick={() => handleSubmit(true)}
                  disabled={isLoading}
                  className="w-full h-12 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-medium"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating account...</span>
                    </div>
                  ) : (
                    <>
                      Create My Account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* OAuth Buttons */}
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 bg-transparent"
                      onClick={() => handleOAuthSignIn('google')}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12 border-gray-300 bg-transparent"
                      onClick={() => handleOAuthSignIn('apple')}
                      disabled={isLoading}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"
                        />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
