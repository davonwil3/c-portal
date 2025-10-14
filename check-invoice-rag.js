// Check if invoices have RAG data
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Environment check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInvoiceRAGData() {
  console.log('🔍 Checking invoice RAG data...')
  
  try {
    // Check invoices with RAG columns
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, title, account_id, client_id, rag_file_path, rag_file_url, rag_updated_at')
      .limit(5)
    
    if (invoiceError) {
      console.error('❌ Error fetching invoices:', invoiceError)
      return
    }
    
    console.log(`📄 Found ${invoices?.length || 0} invoices`)
    
    if (invoices && invoices.length > 0) {
      console.log('\n📋 Invoice RAG status:')
      invoices.forEach((invoice, index) => {
        console.log(`${index + 1}. ${invoice.title}`)
        console.log(`   - ID: ${invoice.id}`)
        console.log(`   - Account: ${invoice.account_id}`)
        console.log(`   - Client: ${invoice.client_id}`)
        console.log(`   - RAG File Path: ${invoice.rag_file_path || 'NULL'}`)
        console.log(`   - RAG File URL: ${invoice.rag_file_url || 'NULL'}`)
        console.log(`   - RAG Updated: ${invoice.rag_updated_at || 'NULL'}`)
        console.log('')
      })
    }
    
    // Check documents table
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, file_name, account_id, client_id, project_id, processing_status')
      .limit(10)
    
    if (docError) {
      console.error('❌ Error fetching documents:', docError)
    } else {
      console.log(`📚 Found ${documents?.length || 0} documents in RAG system`)
      if (documents && documents.length > 0) {
        console.log('\n📋 Document details:')
        documents.forEach((doc, index) => {
          console.log(`${index + 1}. ${doc.file_name}`)
          console.log(`   - ID: ${doc.id}`)
          console.log(`   - Account: ${doc.account_id}`)
          console.log(`   - Client: ${doc.client_id}`)
          console.log(`   - Project: ${doc.project_id}`)
          console.log(`   - Status: ${doc.processing_status}`)
          console.log('')
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkInvoiceRAGData()
