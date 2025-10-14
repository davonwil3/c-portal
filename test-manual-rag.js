// Test manual RAG upload for an existing invoice
const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual values
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseServiceKey = 'YOUR_SERVICE_ROLE_KEY'
const openaiApiKey = 'YOUR_OPENAI_API_KEY'

if (supabaseUrl === 'YOUR_SUPABASE_URL') {
  console.log('Please update the script with your actual Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testManualRAGUpload() {
  console.log('Testing manual RAG upload...')
  
  try {
    // First, let's see what invoices exist
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .limit(1)
    
    if (invoiceError) {
      console.error('Error fetching invoices:', invoiceError)
      return
    }
    
    if (!invoices || invoices.length === 0) {
      console.log('No invoices found. Create an invoice first.')
      return
    }
    
    const invoice = invoices[0]
    console.log('Found invoice:', invoice.title)
    
    // Test the RAG upload API
    const ragData = {
      id: invoice.id,
      account_id: invoice.account_id,
      client_id: invoice.client_id,
      project_id: invoice.project_id,
      invoice_number: invoice.invoice_number,
      title: invoice.title,
      description: invoice.description,
      status: invoice.status,
      total_amount: invoice.total_amount,
      currency: invoice.currency,
      line_items: invoice.line_items
    }
    
    console.log('Uploading invoice to RAG...')
    
    const response = await fetch('http://localhost:3000/api/rag/upload-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ragData)
    })
    
    const result = await response.json()
    console.log('RAG upload result:', result)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testManualRAGUpload()
