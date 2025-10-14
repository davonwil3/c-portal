// Upload all existing invoices to RAG
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function uploadInvoicesToRAG() {
  console.log('🚀 Uploading all invoices to RAG...')
  
  try {
    // Get all invoices
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
    
    if (invoiceError) {
      console.error('❌ Error fetching invoices:', invoiceError)
      return
    }
    
    console.log(`📄 Found ${invoices?.length || 0} invoices to upload`)
    
    for (const invoice of invoices || []) {
      console.log(`\n📤 Uploading invoice: ${invoice.title}`)
      
      try {
        const response = await fetch('http://localhost:3000/api/rag/upload-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            invoiceId: invoice.id,
            accountId: invoice.account_id,
            clientId: invoice.client_id,
            projectId: invoice.project_id,
            invoiceData: invoice
          })
        })
        
        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ Successfully uploaded: ${invoice.title}`)
        } else {
          console.log(`❌ Failed to upload: ${invoice.title} - ${result.error}`)
        }
        
      } catch (error) {
        console.log(`❌ Error uploading ${invoice.title}:`, error.message)
      }
    }
    
    console.log('\n🎉 Upload process completed!')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

uploadInvoicesToRAG()
