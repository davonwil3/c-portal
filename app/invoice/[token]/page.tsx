"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface Invoice {
  id: string
  invoice_number: string
  title: string
  notes: string
  po_number: string
  issue_date: string
  due_date: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_value: number
  total_amount: number
  currency: string
  line_items: Array<{
    id: string
    name: string
    description: string
    quantity: number
    unit_rate: number
    total_amount: number
  }>
  client?: {
    first_name: string
    last_name: string
    company: string
    email: string
    phone: string
  }
  account?: {
    company_name: string
    address: string
    logo_url: string
  }
}

// Legacy route - redirects to new format
export default function LegacyInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  useEffect(() => {
    // Extract token from format: token.domain.com or just token
    const cleanToken = token.split('.')[0]
    
    // Determine if production based on hostname
    const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')
    const baseDomain = isProduction ? 'jolix.io' : 'localhost:3000'
    
    // Try to get company from the invoice
    fetch(`/api/invoices/public/${cleanToken}`)
      .then(res => res.json())
      .then(data => {
        if (data.invoice?.account?.company_name) {
          const companySlug = data.invoice.account.company_name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
          router.replace(`/${companySlug}/invoice/${cleanToken}.${baseDomain}`)
        } else {
          // Fallback to generic company
          router.replace(`/company/invoice/${cleanToken}.${baseDomain}`)
        }
      })
      .catch(() => {
        // If fetch fails, redirect to generic company
        router.replace(`/company/invoice/${cleanToken}.${baseDomain}`)
      })
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF] mx-auto mb-4" />
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}

