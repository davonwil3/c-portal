"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"
import { resetPassword } from "@/lib/auth"
import { toast } from "sonner"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Please enter your email address")
      return
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const loadingToast = toast.loading("Sending reset email...")
      
      const { error } = await resetPassword(email)
      
      toast.dismiss(loadingToast)
      
      if (error) {
        toast.error(error.message)
        setError(error.message)
      } else {
        toast.success("Reset email sent! Check your inbox.")
        setIsSubmitted(true)
      }
    } catch (error) {
      const errorMessage = "An unexpected error occurred. Please try again."
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#F9FAFB] to-[#F4EFFE]/30 p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-bold text-[#1A1A1A]">ClientPortalHQ</span>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <Button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
                className="w-full h-12 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-medium"
              >
                Send another email
              </Button>

              <Link
                href="/auth"
                className="inline-flex items-center text-sm text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gradient-to-br from-[#F9FAFB] to-[#F4EFFE]/30 p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
        <CardHeader className="space-y-1 pb-6">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#3C3CFF] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-[#1A1A1A]">ClientPortalHQ</span>
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
            <p className="text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className={`pl-10 h-12 border-gray-300 focus:border-[#3C3CFF] focus:ring-[#3C3CFF] ${
                    error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""
                  }`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError("")
                  }}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white font-medium"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Sending...</span>
                </div>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href="/auth"
              className="inline-flex items-center text-sm text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 