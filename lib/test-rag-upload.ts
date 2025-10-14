import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

/**
 * Test function to manually upload an existing invoice to RAG
 * Use this to test if the RAG upload is working
 */
export async function testUploadInvoiceToRAG(invoiceId: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('🔍 Testing RAG upload for invoice:', invoiceId)
    
    // Fetch invoice data
    const { data: invoice, error: fetchError } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:clients(first_name, last_name, company),
        projects:projects(name)
      `)
      .eq('id', invoiceId)
      .single()

    if (fetchError || !invoice) {
      return { success: false, error: 'Invoice not found', details: fetchError }
    }

    console.log('📄 Invoice found:', invoice.invoice_number)
    console.log('👤 Client:', invoice.clients)
    console.log('🏢 Account ID:', invoice.account_id)

    // Create text representation
    const invoiceText = createInvoiceText(invoice)
    console.log('📝 Generated text length:', invoiceText.length)
    
    // Generate unified storage path
    const timestamp = Date.now()
    const fileName = `invoice-${invoiceId}-${timestamp}.txt`
    const filePath = `${invoice.account_id}/clients/${invoice.client_id}/invoices/${invoiceId}/${fileName}`
    
    console.log('📁 File path:', filePath)

    // Create text blob
    const textBlob = new Blob([invoiceText], { type: 'text/plain' })
    console.log('📦 Blob size:', textBlob.size)

    // Upload to unified storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-portal-content')
      .upload(filePath, textBlob, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return { success: false, error: uploadError.message, details: uploadError }
    }

    console.log('✅ Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('client-portal-content')
      .getPublicUrl(filePath)
    
    console.log('🔗 Public URL:', urlData.publicUrl)

    // Create document record for RAG
    const { error: docError } = await supabase
      .from('documents')
      .upsert({
        account_id: invoice.account_id,
        client_id: invoice.client_id,
        project_id: invoice.project_id || null,
        file_name: `Invoice ${invoice.invoice_number}`,
        file_type: 'txt',
        file_size: textBlob.size,
        file_url: urlData.publicUrl,
        file_path: filePath,
        raw_content: invoiceText,
        processed_content: invoiceText,
        processing_status: 'completed',
        visibility_scope: 'client',
        metadata: {
          source: 'invoice',
          invoice_id: invoiceId,
          invoice_number: invoice.invoice_number,
          invoice_type: invoice.invoice_type,
          status: invoice.status,
          total_amount: invoice.total_amount,
          currency: invoice.currency
        }
      }, {
        onConflict: 'account_id,client_id,file_path'
      })

    if (docError) {
      console.error('❌ Document creation error:', docError)
      return { success: false, error: docError.message, details: docError }
    }

    console.log('✅ Document record created successfully')
    return { success: true, details: { filePath, url: urlData.publicUrl } }

  } catch (error) {
    console.error('❌ Test upload error:', error)
    return { success: false, error: 'Failed to upload invoice to RAG', details: error }
  }
}

/**
 * Test function to manually upload an existing form to RAG
 */
export async function testUploadFormToRAG(formId: string): Promise<{ success: boolean; error?: string; details?: any }> {
  try {
    console.log('🔍 Testing RAG upload for form:', formId)
    
    // Fetch form data
    const { data: form, error: fetchError } = await supabase
      .from('forms')
      .select(`
        *,
        clients:clients(first_name, last_name, company),
        projects:projects(name)
      `)
      .eq('id', formId)
      .single()

    if (fetchError || !form) {
      return { success: false, error: 'Form not found', details: fetchError }
    }

    console.log('📄 Form found:', form.title)
    console.log('👤 Client:', form.clients)
    console.log('🏢 Account ID:', form.account_id)

    // Create text representation
    const formText = createFormText(form)
    console.log('📝 Generated text length:', formText.length)
    
    // Generate unified storage path
    const timestamp = Date.now()
    const fileName = `form-${formId}-${timestamp}.txt`
    const filePath = `${form.account_id}/clients/${form.client_id}/forms/${formId}/${fileName}`
    
    console.log('📁 File path:', filePath)

    // Create text blob
    const textBlob = new Blob([formText], { type: 'text/plain' })
    console.log('📦 Blob size:', textBlob.size)

    // Upload to unified storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-portal-content')
      .upload(filePath, textBlob, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('❌ Upload error:', uploadError)
      return { success: false, error: uploadError.message, details: uploadError }
    }

    console.log('✅ Upload successful:', uploadData)

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('client-portal-content')
      .getPublicUrl(filePath)
    
    console.log('🔗 Public URL:', urlData.publicUrl)

    // Create document record for RAG
    const { error: docError } = await supabase
      .from('documents')
      .upsert({
        account_id: form.account_id,
        client_id: form.client_id,
        project_id: form.project_id || null,
        file_name: `Form: ${form.title}`,
        file_type: 'txt',
        file_size: textBlob.size,
        file_url: urlData.publicUrl,
        file_path: filePath,
        raw_content: formText,
        processed_content: formText,
        processing_status: 'completed',
        visibility_scope: 'client',
        metadata: {
          source: 'form',
          form_id: formId,
          form_title: form.title,
          form_status: form.status,
          form_type: 'form_builder',
          total_submissions: form.total_submissions || 0
        }
      }, {
        onConflict: 'account_id,client_id,file_path'
      })

    if (docError) {
      console.error('❌ Document creation error:', docError)
      return { success: false, error: docError.message, details: docError }
    }

    console.log('✅ Document record created successfully')
    return { success: true, details: { filePath, url: urlData.publicUrl } }

  } catch (error) {
    console.error('❌ Test upload error:', error)
    return { success: false, error: 'Failed to upload form to RAG', details: error }
  }
}

/**
 * Creates a text representation of an invoice for RAG processing
 */
function createInvoiceText(invoice: any): string {
  const clientName = invoice.clients ? 
    `${invoice.clients.first_name} ${invoice.clients.last_name}` : 
    'Unknown Client'
  
  const projectName = invoice.projects?.name || 'No Project'
  
  let text = `INVOICE DOCUMENT\n\n`
  text += `Invoice Number: ${invoice.invoice_number}\n`
  text += `Invoice Type: ${invoice.invoice_type}\n`
  text += `Status: ${invoice.status}\n`
  text += `Client: ${clientName}\n`
  text += `Project: ${projectName}\n`
  text += `Issue Date: ${new Date(invoice.issue_date).toLocaleDateString()}\n`
  
  if (invoice.due_date) {
    text += `Due Date: ${new Date(invoice.due_date).toLocaleDateString()}\n`
  }
  
  text += `\nINVOICE DETAILS:\n`
  text += `Title: ${invoice.title || 'No Title'}\n`
  
  if (invoice.description) {
    text += `Description: ${invoice.description}\n`
  }
  
  if (invoice.notes) {
    text += `Notes: ${invoice.notes}\n`
  }
  
  if (invoice.po_number) {
    text += `PO Number: ${invoice.po_number}\n`
  }
  
  text += `\nFINANCIAL INFORMATION:\n`
  text += `Subtotal: $${invoice.subtotal}\n`
  text += `Tax Rate: ${invoice.tax_rate}%\n`
  text += `Tax Amount: $${invoice.tax_amount}\n`
  text += `Discount: $${invoice.discount_value}\n`
  text += `Total Amount: $${invoice.total_amount} ${invoice.currency}\n`
  
  text += `\nPAYMENT TERMS:\n`
  text += `Payment Terms: ${invoice.payment_terms}\n`
  text += `Allow Online Payment: ${invoice.allow_online_payment ? 'Yes' : 'No'}\n`
  
  if (invoice.line_items && invoice.line_items.length > 0) {
    text += `\nLINE ITEMS:\n`
    invoice.line_items.forEach((item: any, index: number) => {
      text += `${index + 1}. ${item.name}\n`
      if (item.description) {
        text += `   Description: ${item.description}\n`
      }
      text += `   Quantity: ${item.quantity}\n`
      text += `   Unit Rate: $${item.unit_rate}\n`
      text += `   Total: $${item.total_amount}\n`
      if (item.is_taxable) {
        text += `   Taxable: Yes\n`
      }
      text += `\n`
    })
  }
  
  if (invoice.tags && invoice.tags.length > 0) {
    text += `Tags: ${invoice.tags.join(', ')}\n`
  }
  
  return text
}

/**
 * Creates a text representation of a form for RAG processing
 */
function createFormText(form: any): string {
  const clientName = form.clients ? 
    `${form.clients.first_name} ${form.clients.last_name}` : 
    'No Client Assigned'
  
  const projectName = form.projects?.name || 'No Project'
  
  let text = `FORM DOCUMENT\n\n`
  text += `Form Title: ${form.title}\n`
  text += `Status: ${form.status}\n`
  text += `Client: ${clientName}\n`
  text += `Project: ${projectName}\n`
  text += `Created: ${new Date(form.created_at).toLocaleDateString()}\n`
  
  if (form.description) {
    text += `Description: ${form.description}\n`
  }
  
  if (form.instructions) {
    text += `Instructions: ${form.instructions}\n`
  }
  
  text += `\nFORM SETTINGS:\n`
  text += `Access Level: ${form.access_level}\n`
  text += `Max Submissions: ${form.max_submissions || 'Unlimited'}\n`
  text += `Notify on Submission: ${form.notify_on_submission ? 'Yes' : 'No'}\n`
  text += `Total Submissions: ${form.total_submissions || 0}\n`
  text += `Total Views: ${form.total_views || 0}\n`
  text += `Completion Rate: ${form.completion_rate || 0}%\n`
  
  if (form.submission_deadline) {
    text += `Submission Deadline: ${new Date(form.submission_deadline).toLocaleDateString()}\n`
  }
  
  if (form.form_structure && form.form_structure.fields) {
    text += `\nFORM FIELDS:\n`
    form.form_structure.fields.forEach((field: any, index: number) => {
      text += `${index + 1}. ${field.label} (${field.type})\n`
      if (field.description) {
        text += `   Description: ${field.description}\n`
      }
      text += `   Required: ${field.required ? 'Yes' : 'No'}\n`
      if (field.placeholder) {
        text += `   Placeholder: ${field.placeholder}\n`
      }
      if (field.options && field.options.length > 0) {
        text += `   Options: ${field.options.join(', ')}\n`
      }
      text += `\n`
    })
  }
  
  if (form.notify_emails && form.notify_emails.length > 0) {
    text += `Notification Emails: ${form.notify_emails.join(', ')}\n`
  }
  
  return text
}
