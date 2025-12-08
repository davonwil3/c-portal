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
  plan_tier: 'free' | 'pro' | 'premium'
  stripe_customer_id: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  address?: string | null
  timezone?: string | null
  industry?: string | null
  logo_url?: string | null
  phone?: string | null
  email?: string | null
  stripe_connect_account_id?: string | null
  stripe_connect_enabled?: boolean | null
  paypal_merchant_id?: string | null
  paypal_connected?: boolean | null
  default_payout_provider?: 'stripe' | 'paypal' | null
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

// Get current user's account
export async function getCurrentAccount(): Promise<Account | null> {
  const supabase = createSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.account_id) return null

  return getAccount(profile.account_id)
}

// Upload company logo to storage
export async function uploadCompanyLogo(file: File, accountId: string): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createSupabaseClient()
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { url: null, error: new Error('Please upload a valid image file (JPEG, PNG, SVG, or WebP)') }
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return { url: null, error: new Error('File size must be less than 2MB') }
  }

  try {
    // Use account_id structure to match existing RLS policies
    // Use a fixed filename so old logos get replaced
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `logo.${fileExt}`
    const filePath = `${accountId}/company/logo/${fileName}`

    // Delete old logo if it exists (different extensions)
    const oldExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp']
    for (const ext of oldExtensions) {
      if (ext !== fileExt) {
        const oldPath = `${accountId}/company/logo/logo.${ext}`
        await supabase.storage
          .from('client-portal-content')
          .remove([oldPath])
          .catch(() => {
            // Ignore errors if file doesn't exist
          })
      }
    }

    // Upload to storage bucket with upsert to replace existing logo
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-portal-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // This will replace the existing logo
      })

    if (uploadError) {
      console.error('Error uploading company logo:', uploadError)
      return { url: null, error: new Error(uploadError.message) }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-portal-content')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading company logo:', error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload company logo') }
  }
}

// Update account
export async function updateAccount(accountId: string, updates: {
  company_name?: string | null
  address?: string | null
  timezone?: string | null
  industry?: string | null
  logo_url?: string | null
}): Promise<{ data: Account | null; error: Error | null }> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('accounts')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId)
    .select()
    .single()

  if (error) {
    console.error('Error updating account:', error)
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}

// Upload profile photo to storage
export async function uploadProfilePhoto(file: File, userId: string): Promise<{ url: string | null; error: Error | null }> {
  const supabase = createSupabaseClient()
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  if (!validTypes.includes(file.type)) {
    return { url: null, error: new Error('Please upload a valid image file (JPEG, PNG, or WebP)') }
  }

  // Validate file size (2MB max)
  const maxSize = 2 * 1024 * 1024 // 2MB
  if (file.size > maxSize) {
    return { url: null, error: new Error('File size must be less than 2MB') }
  }

  try {
    // Get user's account_id to match storage RLS policies
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { url: null, error: new Error('User not authenticated') }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', userId)
      .single()

    if (!profile || !profile.account_id) {
      return { url: null, error: new Error('Profile not found') }
    }

    // Use account_id structure to match existing RLS policies
    // Use a fixed filename so old photos get replaced
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `profile.${fileExt}`
    const filePath = `${profile.account_id}/profiles/${userId}/${fileName}`

    // Delete old profile photo if it exists (different extensions)
    const oldExtensions = ['jpg', 'jpeg', 'png', 'webp']
    for (const ext of oldExtensions) {
      if (ext !== fileExt) {
        const oldPath = `${profile.account_id}/profiles/${userId}/profile.${ext}`
        await supabase.storage
          .from('client-portal-content')
          .remove([oldPath])
          .catch(() => {
            // Ignore errors if file doesn't exist
          })
      }
    }

    // Upload to storage bucket with upsert to replace existing file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-portal-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // This will replace the existing profile photo
      })

    if (uploadError) {
      console.error('Error uploading profile photo:', uploadError)
      return { url: null, error: new Error(uploadError.message) }
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('client-portal-content')
      .getPublicUrl(filePath)

    return { url: publicUrl, error: null }
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return { url: null, error: error instanceof Error ? error : new Error('Failed to upload profile photo') }
  }
}

// Update user profile
export async function updateProfile(userId: string, updates: {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  profile_photo_url?: string | null
}): Promise<{ data: Profile | null; error: Error | null }> {
  const supabase = createSupabaseClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    return { data: null, error: new Error(error.message) }
  }

  // If email is being updated, also update auth user email
  if (updates.email) {
    const { error: authError } = await supabase.auth.updateUser({
      email: updates.email
    })
    
    if (authError) {
      console.error('Error updating auth email:', authError)
      return { data: null, error: new Error(authError.message) }
    }
  }

  return { data, error: null }
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ error: Error | null }> {
  const supabase = createSupabaseClient()
  
  // First, verify the current password by attempting to sign in
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) {
    return { error: new Error('User not found') }
  }

  // Verify current password
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword
  })

  if (signInError) {
    return { error: new Error('Current password is incorrect') }
  }

  // Update to new password
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (updateError) {
    console.error('Error updating password:', updateError)
    return { error: new Error(updateError.message) }
  }

  return { error: null }
} 