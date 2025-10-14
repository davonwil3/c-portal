// Test RAG database content
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRAGDatabase() {
  console.log('Testing RAG database content...')
  
  try {
    // Check documents table
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .limit(5)
    
    if (docError) {
      console.error('Error fetching documents:', docError)
    } else {
      console.log('Documents found:', documents?.length || 0)
      if (documents && documents.length > 0) {
        console.log('Sample document:', documents[0])
      }
    }
    
    // Check document_chunks table
    const { data: chunks, error: chunkError } = await supabase
      .from('document_chunks')
      .select('*')
      .limit(5)
    
    if (chunkError) {
      console.error('Error fetching chunks:', chunkError)
    } else {
      console.log('Chunks found:', chunks?.length || 0)
      if (chunks && chunks.length > 0) {
        console.log('Sample chunk:', chunks[0])
      }
    }
    
    // Check invoices table for RAG data
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, title, rag_file_path, rag_file_url, rag_updated_at')
      .limit(5)
    
    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError)
    } else {
      console.log('Invoices found:', invoices?.length || 0)
      if (invoices && invoices.length > 0) {
        console.log('Sample invoice RAG data:', invoices[0])
      }
    }
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testRAGDatabase()
