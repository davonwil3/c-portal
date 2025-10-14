import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/**
 * Uploads a file to the portal-logos bucket
 */
export async function uploadPortalLogo(
  file: File,
  portalId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `logo.${fileExt}`
    const filePath = `${portalId}/${fileName}`

    // Upload the file
    const { data, error } = await supabase.storage
      .from('portal-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // This will overwrite existing files
      })

    if (error) {
      console.error('Error uploading logo:', error)
      return { success: false, error: error.message }
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('portal-logos')
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Error uploading logo:', error)
    return { success: false, error: 'Failed to upload logo' }
  }
}

/**
 * Deletes a portal logo from the bucket
 */
export async function deletePortalLogo(portalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from('portal-logos')
      .remove([`${portalId}/logo.png`, `${portalId}/logo.jpg`, `${portalId}/logo.jpeg`, `${portalId}/logo.svg`])

    if (error) {
      console.error('Error deleting logo:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting logo:', error)
    return { success: false, error: 'Failed to delete logo' }
  }
}

/**
 * Gets the public URL for a portal logo
 */
export function getPortalLogoUrl(logoPath: string): string {
  if (!logoPath) return ''
  
  // If it's already a full URL, return it
  if (logoPath.startsWith('http')) {
    return logoPath
  }
  
  // If it's a bucket path, get the public URL
  const { data } = supabase.storage
    .from('portal-logos')
    .getPublicUrl(logoPath)
  
  return data.publicUrl
}

/**
 * Uploads a background image to the portal-backgrounds bucket
 */
export async function uploadPortalBackground(
  file: File,
  portalId: string
): Promise<string> {
  try {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `background.${fileExt}`
    const filePath = `${portalId}/${fileName}`

    // Upload the file
    const { data, error } = await supabase.storage
      .from('portal-backgrounds')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // This will overwrite existing files
      })

    if (error) {
      console.error('Error uploading background:', error)
      throw new Error(error.message)
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('portal-backgrounds')
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    console.error('Error uploading background:', error)
    throw error
  }
}

/**
 * Gets the public URL for a portal background
 */
export function getPortalBackgroundUrl(backgroundPath: string): string {
  if (!backgroundPath) return ''
  
  // If it's already a full URL, return it
  if (backgroundPath.startsWith('http')) {
    return backgroundPath
  }
  
  // If it's a bucket path, get the public URL
  const { data } = supabase.storage
    .from('portal-backgrounds')
    .getPublicUrl(backgroundPath)
  
  return data.publicUrl
}

/**
 * Validates file type for logo uploads
 */
export function validateLogoFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, SVG, or WebP)' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' }
  }

  return { valid: true }
}
