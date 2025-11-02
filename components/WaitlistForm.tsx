"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

export default function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast({ title: 'Enter a valid email', description: 'Please check the format and try again.' })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value }),
      })
      if (res.ok) {
        toast({ title: 'You\'re on the list!', description: 'We\'ll be in touch soon.' })
        setEmail('')
      } else {
        toast({ title: 'Something went wrong', description: 'Please try again in a moment.' })
      }
    } catch {
      toast({ title: 'Network error', description: 'Please try again.' })
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


