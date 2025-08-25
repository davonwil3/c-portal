import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export interface ClientAuthResponse {
  success: boolean
  message: string
  data?: any
}

export interface SessionData {
  email: string
  companySlug: string
  clientSlug: string
  sessionToken: string
  refreshToken: string
  expiresAt: string
}

// Store session in localStorage
export function storeSession(sessionData: SessionData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('client_session', JSON.stringify(sessionData))
  }
}

// Get session from localStorage
export function getSession(): SessionData | null {
  if (typeof window !== 'undefined') {
    const session = localStorage.getItem('client_session')
    return session ? JSON.parse(session) : null
  }
  return null
}

// Clear session from localStorage
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('client_session')
  }
}

// Check if session is expired
export function isSessionExpired(sessionData: SessionData): boolean {
  return new Date(sessionData.expiresAt) < new Date()
} 