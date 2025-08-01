import { createClient } from './supabase/client'

export interface File {
  id: string
  account_id: string
  name: string
  original_name: string
  file_type: string
  mime_type: string | null
  storage_path: string
  storage_bucket: string
  file_size: number
  file_size_formatted: string | null
  client_id: string | null
  project_id: string | null
  portal_id: string | null
  uploaded_by: string | null
  uploaded_by_name: string | null
  status: 'active' | 'archived' | 'deleted'
  approval_status: 'pending' | 'approved' | 'rejected'
  approval_required: boolean
  description: string | null
  tags: Array<{name: string, color: string}> // Array of tag objects with name and color
  metadata: any
  is_public: boolean
  access_level: 'private' | 'team' | 'client' | 'public'
  download_count: number
  view_count: number
  created_at: string
  updated_at: string
  last_accessed_at: string | null
  clients?: {
    first_name: string
    last_name: string
    company: string
  } | null
  projects?: {
    name: string
  } | null
}

export interface FileTag {
  id: string
  file_id: string
  tag_name: string
  created_at: string
}

export interface FileComment {
  id: string
  file_id: string
  content: string
  author_id: string | null
  author_name: string | null
  is_internal: boolean
  parent_comment_id: string | null
  created_at: string
  updated_at: string
}

export interface FileVersion {
  id: string
  file_id: string
  version_number: number
  version_name: string | null
  storage_path: string
  file_size: number
  file_size_formatted: string | null
  uploaded_by: string | null
  upload_reason: string | null
  created_at: string
}

export interface FileActivity {
  id: string
  file_id: string
  account_id: string
  user_id: string | null
  activity_type: 'upload' | 'download' | 'view' | 'comment' | 'approve' | 'reject' | 'delete' | 'restore' | 'version_created'
  action: string
  metadata: any
  created_at: string
}

// Upload a file to Supabase Storage
export async function uploadFile(
  file: globalThis.File,
  clientId?: string,
  projectId?: string,
  description?: string,
  tags?: string[],
  tagColors?: Record<string, string>
): Promise<File | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Generate a unique file path
  const timestamp = Date.now()
  const fileExtension = file.name.split('.').pop() || ''
  
  // Sanitize the filename to remove spaces and special characters
  const sanitizedFileName = file.name
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace special characters with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single underscore
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
  
  // Fallback if sanitized filename is empty
  const finalFileName = sanitizedFileName || `file_${timestamp}`
  const fileName = `${timestamp}-${finalFileName}`
  const filePath = `${profile.account_id}/${fileName}`

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading file to storage:', uploadError)
    throw uploadError
  }

  // Get the public URL for the file
  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(filePath)

  // Create tag objects with name and color
  const tagObjects = (tags || []).map(tagName => ({
    name: tagName,
    color: tagColors?.[tagName] || getTagColor(tagName)
  }))

  // Create file record in database with tag objects
  const fileData = {
    name: file.name,
    original_name: file.name,
    file_type: fileExtension.toUpperCase(),
    mime_type: file.type,
    storage_path: filePath,
    file_size: file.size,
    client_id: clientId || null,
    project_id: projectId || null,
    description: description || null,
    tags: tagObjects, // Array of tag objects with name and color
  }

  return await createFile(fileData)
}

// Get all files for the current account
export async function getFiles(): Promise<File[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data: files, error } = await supabase
    .from('files')
    .select(`
      *,
      clients!files_client_id_fkey(first_name, last_name, company),
      projects!files_project_id_fkey(name)
    `)
    .eq('account_id', profile.account_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching files:', error)
    throw error
  }

  // Tags are already in the files.tags array column, no transformation needed
  return files || []
}

// Get file statistics
export async function getFileStats(): Promise<{
  totalFiles: number
  pendingApproval: number
  recentFiles: number
}> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Get total files
  const { count: totalFiles } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', profile.account_id)

  // Get pending approval files
  const { count: pendingApproval } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', profile.account_id)
    .eq('approval_status', 'pending')

  // Get recent files (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const { count: recentFiles } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', profile.account_id)
    .gte('created_at', sevenDaysAgo.toISOString())

  return {
    totalFiles: totalFiles || 0,
    pendingApproval: pendingApproval || 0,
    recentFiles: recentFiles || 0
  }
}

// Get file comments
export async function getFileComments(fileId: string): Promise<FileComment[]> {
  const supabase = createClient()
  
  const { data: comments, error } = await supabase
    .from('file_comments')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching file comments:', error)
    throw error
  }

  return comments || []
}

// Get file versions
export async function getFileVersions(fileId: string): Promise<FileVersion[]> {
  const supabase = createClient()
  
  const { data: versions, error } = await supabase
    .from('file_versions')
    .select('*')
    .eq('file_id', fileId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('Error fetching file versions:', error)
    throw error
  }

  return versions || []
}

// Get file activities
export async function getFileActivities(fileId: string): Promise<FileActivity[]> {
  const supabase = createClient()
  
  const { data: activities, error } = await supabase
    .from('file_activities')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching file activities:', error)
    throw error
  }

  return activities || []
}

// Create a new file
export async function createFile(fileData: {
  name: string
  original_name: string
  file_type: string
  mime_type?: string
  storage_path: string
  file_size: number
  client_id?: string
  project_id?: string
  description?: string
  tags?: Array<{name: string, color: string}>
  access_level?: 'private' | 'team' | 'client' | 'public'
}): Promise<File | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id, first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  // Format file size
  const fileSizeFormatted = formatFileSize(fileData.file_size)

  console.log('Creating file with tags:', fileData.tags) // Debug log

  // Create the file with tag objects
  const { data: file, error: fileError } = await supabase
    .from('files')
    .insert({
      account_id: profile.account_id,
      name: fileData.name,
      original_name: fileData.original_name,
      file_type: fileData.file_type,
      mime_type: fileData.mime_type || null,
      storage_path: fileData.storage_path,
      file_size: fileData.file_size,
      file_size_formatted: fileSizeFormatted,
      client_id: fileData.client_id || null,
      project_id: fileData.project_id || null,
      uploaded_by: user.id,
      uploaded_by_name: `${profile.first_name} ${profile.last_name}`,
      description: fileData.description || null,
      tags: fileData.tags || [], // Array of tag objects with name and color
      access_level: fileData.access_level || 'team',
    })
    .select()
    .single()

  if (fileError) {
    console.error('Error creating file:', fileError)
    throw fileError
  }

  console.log('File created successfully:', file) // Debug log

  // Log activity
  await logFileActivity(file.id, 'upload', 'uploaded file')

  return file
}

// Update a file
export async function updateFile(fileId: string, updates: Partial<{
  name: string
  description: string
  tags: Array<{name: string, color: string}>
  access_level: 'private' | 'team' | 'client' | 'public'
  approval_status: 'pending' | 'approved' | 'rejected'
}>): Promise<File | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating file:', error)
    throw error
  }

  // Tags are updated directly in the files.tags array column
  // No need to manage file_tags table separately

  return data
}

// Delete a file
export async function deleteFile(fileId: string): Promise<void> {
  const supabase = createClient()
  
  // First get the file to get the storage path
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single()

  if (fetchError) {
    console.error('Error fetching file for deletion:', fetchError)
    throw fetchError
  }

  // Delete from storage
  if (file?.storage_path) {
    const { error: storageError } = await supabase.storage
      .from('files')
      .remove([file.storage_path])

    if (storageError) {
      console.error('Error deleting file from storage:', storageError)
      // Don't throw here, continue with database deletion
    }
  }

  // Delete from database
  const { error } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)

  if (error) {
    console.error('Error deleting file from database:', error)
    throw error
  }
}

// Archive a file
export async function archiveFile(fileId: string): Promise<File | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .update({ 
      status: 'archived',
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error archiving file:', error)
    throw error
  }

  return data
}

// Restore a file
export async function restoreFile(fileId: string): Promise<File | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .update({ 
      status: 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error restoring file:', error)
    throw error
  }

  return data
}

// Approve a file
export async function approveFile(fileId: string): Promise<File | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .update({ 
      approval_status: 'approved',
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error approving file:', error)
    throw error
  }

  // Log activity
  await logFileActivity(fileId, 'approve', 'approved file')

  return data
}

// Reject a file
export async function rejectFile(fileId: string): Promise<File | null> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('files')
    .update({ 
      approval_status: 'rejected',
      updated_at: new Date().toISOString()
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting file:', error)
    throw error
  }

  // Log activity
  await logFileActivity(fileId, 'reject', 'rejected file')

  return data
}

// Add a comment to a file
export async function addFileComment(fileId: string, content: string, isInternal: boolean = false): Promise<FileComment | null> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data: comment, error } = await supabase
    .from('file_comments')
    .insert({
      file_id: fileId,
      content,
      author_id: user.id,
      author_name: `${profile.first_name} ${profile.last_name}`,
      is_internal: isInternal
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding file comment:', error)
    throw error
  }

  // Log activity
  await logFileActivity(fileId, 'comment', 'added comment')

  return comment
}

// Download a file
export async function downloadFile(fileId: string): Promise<string | null> {
  const supabase = createClient()
  
  // Get the file to get the storage path
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('storage_path, name')
    .eq('id', fileId)
    .single()

  if (fetchError) {
    console.error('Error fetching file for download:', fetchError)
    throw fetchError
  }

  if (!file?.storage_path) {
    throw new Error('File not found or no storage path')
  }

  // Get the download URL
  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(file.storage_path)

  // Log download activity
  await logFileActivity(fileId, 'download', 'downloaded file')

  return publicUrl
}

// Get file download URL (for preview/download)
export async function getFileUrl(fileId: string): Promise<string | null> {
  const supabase = createClient()
  
  const { data: file, error } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single()

  if (error || !file?.storage_path) {
    console.error('Error getting file URL:', error)
    return null
  }

  const { data: { publicUrl } } = supabase.storage
    .from('files')
    .getPublicUrl(file.storage_path)

  return publicUrl
}

// Log file activity
async function logFileActivity(fileId: string, activityType: FileActivity['activity_type'], action: string, metadata?: any): Promise<void> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return

  await supabase
    .from('file_activities')
    .insert({
      file_id: fileId,
      account_id: profile.account_id,
      user_id: user.id,
      activity_type: activityType,
      action,
      metadata: metadata || null
    })
}

// Format file size
function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return sizeBytes + ' B'
  } else if (sizeBytes < 1024 * 1024) {
    return (sizeBytes / 1024).toFixed(1) + ' KB'
  } else if (sizeBytes < 1024 * 1024 * 1024) {
    return (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB'
  } else {
    return (sizeBytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
  }
}

// Get file icon based on file type
export function getFileIcon(fileType: string): string {
  const iconMap: Record<string, string> = {
    'PDF': '📄',
    'DOC': '📝',
    'DOCX': '📝',
    'XLS': '📊',
    'XLSX': '📊',
    'PPT': '📽️',
    'PPTX': '📽️',
    'TXT': '📄',
    'RTF': '📄',
    'PNG': '🖼️',
    'JPG': '🖼️',
    'JPEG': '🖼️',
    'GIF': '🖼️',
    'SVG': '🖼️',
    'MP4': '🎥',
    'AVI': '🎥',
    'MOV': '🎥',
    'MP3': '🎵',
    'WAV': '🎵',
    'ZIP': '📦',
    'RAR': '📦',
    '7Z': '📦',
    'FIG': '🎨'
  }
  
  return iconMap[fileType.toUpperCase()] || '📄'
}

// Get file type color
export function getFileTypeColor(fileType: string): string {
  const colorMap: Record<string, string> = {
    'PDF': '#DC2626',
    'DOC': '#2563EB',
    'DOCX': '#2563EB',
    'XLS': '#059669',
    'XLSX': '#059669',
    'PPT': '#DC2626',
    'PPTX': '#DC2626',
    'TXT': '#6B7280',
    'RTF': '#6B7280',
    'PNG': '#7C3AED',
    'JPG': '#7C3AED',
    'JPEG': '#7C3AED',
    'GIF': '#7C3AED',
    'SVG': '#7C3AED',
    'MP4': '#EA580C',
    'AVI': '#EA580C',
    'MOV': '#EA580C',
    'MP3': '#DB2777',
    'WAV': '#DB2777',
    'ZIP': '#6B7280',
    'RAR': '#6B7280',
    '7Z': '#6B7280',
    'FIG': '#F59E0B'
  }
  
  return colorMap[fileType.toUpperCase()] || '#6B7280'
} 

// Get all unique tags from files in the account
export async function getAllFileTags(): Promise<string[]> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_id')
    .eq('user_id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  const { data: files, error } = await supabase
    .from('files')
    .select('tags')
    .eq('account_id', profile.account_id)
    .not('tags', 'is', null)

  if (error) {
    console.error('Error fetching file tags:', error)
    throw error
  }

  // Extract all unique tag names from all files
  const allTags = new Set<string>()
  files?.forEach(file => {
    if (file.tags && Array.isArray(file.tags)) {
      file.tags.forEach(tag => {
        if (typeof tag === 'object' && tag.name) {
          allTags.add(tag.name)
        }
      })
    }
  })

  return Array.from(allTags).sort()
} 