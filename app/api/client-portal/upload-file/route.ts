import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionToken = formData.get('sessionToken') as string
    const companySlug = formData.get('companySlug') as string
    const clientSlug = formData.get('clientSlug') as string
    const description = formData.get('description') as string
    const isPreview = formData.get('isPreview') === 'true'
    const clientId = formData.get('clientId') as string
    const accountId = formData.get('accountId') as string
    const projectId = formData.get('projectId') as string

    console.log('Received upload request:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      sessionToken: sessionToken ? 'present' : 'missing',
      companySlug,
      clientSlug,
      description,
      isPreview,
      clientId,
      accountId,
      projectId
    })

    // Check for missing required fields with specific error messages
    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file provided' },
        { status: 400 }
      )
    }

    // Handle preview mode - use passed client data (no slugs or session token needed)
    if (isPreview) {
      console.log('Processing preview mode upload')
      
      if (!clientId || !accountId) {
        return NextResponse.json(
          { success: false, message: 'Client ID and Account ID required for preview mode' },
          { status: 400 }
        )
      }

      // Generate a unique file path
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || ''
      
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
      
      const finalFileName = sanitizedFileName || `file_${timestamp}`
      const fileName = `${timestamp}-${finalFileName}`
      
      const filePath = `${accountId}/clients/${clientId}/files/client-uploads/${fileName}`

      // Upload file to storage bucket
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('client-portal-content')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Error uploading file to storage:', uploadError)
        return NextResponse.json(
          { success: false, message: 'Failed to upload file to storage' },
          { status: 500 }
        )
      }

      // Get the public URL for the file
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('client-portal-content')
        .getPublicUrl(filePath)

      // Format file size
      const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
      }

      // Create file record in database with "uploaded by client" tag
      const { data: fileRecord, error: fileError } = await supabaseAdmin
        .from('files')
        .insert({
          account_id: accountId,
          name: file.name,
          original_name: file.name,
          file_type: fileExtension.toUpperCase(),
          mime_type: file.type,
          storage_path: filePath,
          storage_bucket: 'client-portal-content',
          file_size: file.size,
          file_size_formatted: formatFileSize(file.size),
          client_id: clientId,
          project_id: projectId || null,
          uploaded_by: null, // Client uploads don't have a user_id
          uploaded_by_name: 'Preview User',
          description: description || null,
          tags: [{ name: 'uploaded by client', color: '#10B981' }], // Green tag for client uploads
          access_level: 'client',
          approval_status: 'approved', // Client uploads are auto-approved
          approval_required: false,
          sent_by_client: true // New column to track client uploads
        })
        .select()
        .single()

      if (fileError) {
        console.error('Error creating file record:', fileError)
        return NextResponse.json(
          { success: false, message: 'Failed to create file record' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          fileId: fileRecord.id,
          fileName: fileRecord.name,
          fileSize: fileRecord.file_size_formatted,
          publicUrl: publicUrl
        }
      })
    }

    // Regular session validation for non-preview uploads
    // For non-preview mode, we can use session token if provided, but also support direct clientId/accountId
    // If session token is provided, validate it; otherwise use clientId/accountId directly
    let allowlistData: any = null
    let clientData: any = null
    let uploadedByName = 'Client'

    if (sessionToken && companySlug && clientSlug) {
      // Validate session token if provided
      const { data, error } = await supabaseAdmin.rpc('validate_client_session', {
        p_session_token: sessionToken,
        p_company_slug: companySlug,
        p_client_slug: clientSlug
      })

      if (error || !data || !data[0]?.is_valid) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Invalid or expired session' 
          },
          { status: 401 }
        )
      }

      const email = data[0].email

      // Get user info from allowlist
      const { data: allowlist, error: allowlistError } = await supabaseAdmin
        .from('client_allowlist')
        .select('email, name, role, account_id')
        .eq('email', email)
        .eq('company_slug', companySlug)
        .eq('client_slug', clientSlug)
        .eq('is_active', true)
        .single()

      if (allowlistError || !allowlist) {
        return NextResponse.json(
          { success: false, message: 'User not found in allowlist' },
          { status: 404 }
        )
      }

      allowlistData = allowlist
      uploadedByName = allowlist.name || email

      // Get client ID from client slug
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('slug', clientSlug)
        .eq('account_id', allowlistData.account_id)
        .single()

      if (clientError || !client) {
        return NextResponse.json(
          { success: false, message: 'Client not found' },
          { status: 404 }
        )
      }

      clientData = client
    } else if (clientId && accountId) {
      // Use direct clientId and accountId if provided (no session validation needed)
      allowlistData = { account_id: accountId }
      
      const { data: client, error: clientError } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .eq('account_id', accountId)
        .single()

      if (clientError || !client) {
        return NextResponse.json(
          { success: false, message: 'Client not found' },
          { status: 404 }
        )
      }

      clientData = client
    } else {
      return NextResponse.json(
        { success: false, message: 'Either session token with slugs, or clientId and accountId are required' },
        { status: 400 }
      )
    }

    // Generate a unique file path
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || ''
    
    // Sanitize the filename
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
    
    const finalFileName = sanitizedFileName || `file_${timestamp}`
    const fileName = `${timestamp}-${finalFileName}`
    
    // Use client-specific storage path
    const filePath = `${allowlistData.account_id}/clients/${clientData.id}/files/client-uploads/${fileName}`

    // Upload file to storage bucket
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('client-portal-content')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file to storage:', uploadError)
      return NextResponse.json(
        { success: false, message: 'Failed to upload file to storage' },
        { status: 500 }
      )
    }

    // Get the public URL for the file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('client-portal-content')
      .getPublicUrl(filePath)

    // Format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Create file record in database with "uploaded by client" tag
    const { data: fileRecord, error: fileError } = await supabaseAdmin
      .from('files')
      .insert({
        account_id: allowlistData.account_id,
        name: file.name,
        original_name: file.name,
        file_type: fileExtension.toUpperCase(),
        mime_type: file.type,
        storage_path: filePath,
        storage_bucket: 'client-portal-content',
        file_size: file.size,
        file_size_formatted: formatFileSize(file.size),
        client_id: clientData.id,
        project_id: projectId || null,
        uploaded_by: null, // Client uploads don't have a user_id
        uploaded_by_name: uploadedByName,
        description: description || null,
        tags: [{ name: 'uploaded by client', color: '#10B981' }], // Green tag for client uploads
        access_level: 'client',
        approval_status: 'approved', // Client uploads are auto-approved
        approval_required: false,
        sent_by_client: true // New column to track client uploads
      })
      .select()
      .single()

    if (fileError) {
      console.error('Error creating file record:', fileError)
      return NextResponse.json(
        { success: false, message: 'Failed to create file record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId: fileRecord.id,
        fileName: fileRecord.name,
        fileSize: fileRecord.file_size_formatted,
        publicUrl: publicUrl
      }
    })

  } catch (error) {
    console.error('Error in upload-file API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
