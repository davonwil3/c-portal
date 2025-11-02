"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface WaitlistFormProps {
  onSuccess?: () => void
}

export default function WaitlistForm({ onSuccess }: WaitlistFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error('Invalid email', {
        description: 'Please enter a valid email address.',
      })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        // Check if it's already on waitlist or new signup
        if (data.message?.includes('Already')) {
          toast.info('You\'re already on the list! 🎉', {
            description: 'We\'ll notify you when Jolix launches.',
          })
        } else {
          toast.success('You\'re on the list! 🎉', {
            description: 'We\'ll notify you when Jolix launches.',
          })
        }
        setEmail('')
        // Call onSuccess callback to close modal if provided
        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast.error('Something went wrong', {
          description: data.error || 'Please try again in a moment.',
        })
      }
    } catch (error) {
      toast.error('Network error', {
        description: 'Please check your connection and try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 w-full max-w-xl">
      <input
        type="email"
        inputMode="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-4 text-base text-gray-900 placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent"
        aria-label="Email address"
        disabled={loading}
      />
      <Button type="submit" disabled={loading} className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white px-7 py-6 rounded-lg shadow-sm hover:shadow-md transition-all">
        {loading ? 'Joining…' : 'Join waitlist'}
      </Button>
    </form>
  )
}


