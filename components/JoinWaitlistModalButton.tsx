"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import WaitlistForm from '@/components/WaitlistForm'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  label?: string
}

export default function JoinWaitlistModalButton({ className, size = 'lg', label = 'Join waitlist' }: Props) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="px-6 py-8">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-2xl">Join waitlist</DialogTitle>
            </DialogHeader>
            <p className="text-gray-600 mb-6">Be the first to know when Jolix opens up. Enter your email below.</p>
            <WaitlistForm />
          </div>
        </DialogContent>
      </Dialog>
      <Button size={size} className={cn(className)} onClick={() => setOpen(true)}>
        {label}
      </Button>
    </>
  )
}


