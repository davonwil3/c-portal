// Test script to verify Supabase storage bucket configuration
// Run this in your browser console to test storage access

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Test storage bucket access
async function testStorage() {
  try {
    // List files in the bucket
    const { data, error } = await supabase.storage
      .from('files')
      .list('', {
        limit: 10,
        offset: 0
      })
    
    if (error) {
      console.error('Storage access error:', error)
      return false
    }
    
    console.log('Storage bucket accessible:', data)
    return true
  } catch (err) {
    console.error('Storage test failed:', err)
    return false
  }
}

// Test file upload
async function testUpload() {
  try {
    const testContent = 'Test file content'
    const testBlob = new Blob([testContent], { type: 'text/plain' })
    
    const { data, error } = await supabase.storage
      .from('files')
      .upload('test/test.txt', testBlob, {
        contentType: 'text/plain',
        upsert: true
      })
    
    if (error) {
      console.error('Upload test failed:', error)
      return false
    }
    
    console.log('Upload test successful:', data)
    return true
  } catch (err) {
    console.error('Upload test failed:', err)
    return false
  }
}

// Run tests
testStorage().then(success => {
  if (success) {
    testUpload()
  }
}) 