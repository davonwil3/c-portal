// Check if you have invoices that need RAG upload
const { createClient } = require('@supabase/supabase-js')

// You'll need to set these environment variables or replace with your values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.log('Please set your Supabase environment variables or update the script')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkInvoices() {
  console.log('🔍 Checking invoices in your database...')
  
  try {
    // Check invoices table
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, title, account_id, client_id, rag_file_path, rag_file_url')
      .limit(10)
    
    if (invoiceError) {
      console.error('❌ Error fetching invoices:', invoiceError)
      return
    }
    
    console.log(`📄 Found ${invoices?.length || 0} invoices`)
    
    if (invoices && invoices.length > 0) {
      console.log('\n📋 Invoice details:')
      invoices.forEach((invoice, index) => {
        console.log(`${index + 1}. ${invoice.title}`)
        console.log(`   - ID: ${invoice.id}`)
        console.log(`   - Account: ${invoice.account_id}`)
        console.log(`   - Client: ${invoice.client_id}`)
        console.log(`   - RAG File: ${invoice.rag_file_path || 'NOT UPLOADED'}`)
        console.log('')
      })
      
      // Check documents table
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .limit(5)
      
      if (docError) {
        console.error('❌ Error fetching documents:', docError)
      } else {
        console.log(`📚 Found ${documents?.length || 0} documents in RAG system`)
        if (documents && documents.length > 0) {
          console.log('Sample document:', documents[0])
        }
      }
    } else {
      console.log('❌ No invoices found. Create an invoice first.')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

checkInvoices()
