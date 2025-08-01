import { createClient as createSupabaseClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export interface Profile {
  user_id: string
  account_id: string
  email: string
  first_name: string
  last_name: string
  role: 'owner' | 'member'
  phone: string | null
  profile_photo_url: string | null
  last_login_at: string | null
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  company_name: string | null
  plan_tier: 'free' | 'starter' | 'premium'
  stripe_customer_id: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  created_at: string
  updated_at: string
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, userData: {
  first_name: string
  last_name: string
  company_name?: string
}) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_name: userData.company_name || 'My Company'
      }
    }
  })

  return { data, error }
}

// Sign in with email and password
export async function signInWithEmail(email: string, password: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  return { data, error }
}

// Sign in with OAuth provider
export async function signInWithOAuth(provider: 'google' | 'apple') {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  return { data, error }
}

// Sign out
export async function signOut() {
  const supabase = createSupabaseClient()
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

// Reset password (forgot password)
export async function resetPassword(email: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })

  return { data, error }
}

// Update password (after reset)
export async function updatePassword(newPassword: string) {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  return { data, error }
}

// Get current user
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Get user profile
export async function getUserProfile(userId: string): Promise<Profile | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Get account
export async function getAccount(accountId: string): Promise<Account | null> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .single()

  if (error) {
    console.error('Error fetching account:', error)
    return null
  }

  return data
} 