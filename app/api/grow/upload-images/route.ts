import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentAccount } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get account ID
    const account = await getCurrentAccount()
    if (!account) {
      return NextResponse.json(
        { success: false, error: 'Account not found' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []

    for (const file of files) {
      // Generate unique filename
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(7)
      const fileExt = file.name.split('.').pop()
      const fileName = `${account.id}/social-posts/${user.id}/${timestamp}-${randomString}.${fileExt}`

      // Upload to Supabase storage using admin client to bypass RLS
      const { data, error } = await supabaseAdmin.storage
        .from('client-portal-content')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Error uploading file:', error)
        continue
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('client-portal-content')
        .getPublicUrl(fileName)

      uploadedUrls.push(publicUrl)
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to upload any files' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      urls: uploadedUrls,
    })
  } catch (error) {
    console.error('Error in upload-images route:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload images',
      },
      { status: 500 }
    )
  }
}

