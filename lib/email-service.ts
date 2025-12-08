import { Resend } from 'resend'
import { createMagicLinkEmail } from './email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendMagicLinkEmailParams {
  to: string
  recipientName: string
  companyName: string
  magicLink: string
  from?: string
}

export async function sendMagicLinkEmail({
  to,
  recipientName,
  companyName,
  magicLink,
  from = 'noreply@app.jolix.io' // Update this with your verified domain
}: SendMagicLinkEmailParams) {
  try {
    // Import domain configuration to get proper URLs
    const { getPortalUrl } = await import('./domain-config')
    
    const emailContent = createMagicLinkEmail({
      recipientName,
      companyName,
      magicLink,
      expiresIn: '24 hours'
    })

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    if (error) {
      console.error('Resend email error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Email sent successfully:', data)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

// Optional: Add a function to send test emails
export async function sendTestEmail(to: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@yourdomain.com', // Update with your verified domain
      to: [to],
      subject: 'Test Email from Resend',
      html: '<h1>Test Email</h1><p>This is a test email to verify Resend is working.</p>',
    })

    if (error) {
      throw new Error(`Failed to send test email: ${error.message}`)
    }

    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Test email error:', error)
    throw error
  }
}

export interface SendWorkspaceInviteEmailParams {
  to: string
  inviterName: string
  workspaceName: string
  inviteUrl: string
  role: 'admin' | 'member'
  from?: string
}

export async function sendWorkspaceInviteEmail({
  to,
  inviterName,
  workspaceName,
  inviteUrl,
  role,
  from = process.env.FROM_EMAIL || 'noreply@yourdomain.com',
}: SendWorkspaceInviteEmailParams) {
  try {
    const { createWorkspaceInviteEmail } = await import('./email-templates')
    
    const emailContent = createWorkspaceInviteEmail({
      inviterName,
      workspaceName,
      inviteUrl,
      role,
    })

    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    })

    if (error) {
      console.error('Resend email error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Workspace invite email sent successfully:', data)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Email service error:', error)
    throw error
  }
}

export interface SendInvoiceEmailParams {
  to: string
  recipientName: string
  companyName: string
  invoiceNumber: string
  invoiceTitle: string
  invoiceAmount: number
  invoiceCurrency: string
  invoiceUrl: string
  emailSubject?: string
  emailBody?: string
  ccEmails?: string[]
  bccEmails?: string[]
  from?: string
}

export async function sendInvoiceEmail({
  to,
  recipientName,
  companyName,
  invoiceNumber,
  invoiceTitle,
  invoiceAmount,
  invoiceCurrency,
  invoiceUrl,
  emailSubject,
  emailBody,
  ccEmails,
  bccEmails,
  from = process.env.FROM_EMAIL || 'noreply@app.jolix.io',
}: SendInvoiceEmailParams) {
  try {
    const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(amount)
    }

    const subject = emailSubject || `Invoice ${invoiceNumber} from ${companyName}`
    
    // Create HTML email content
    const html = emailBody || `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 30px;">
            <h1 style="color: #111827; margin-top: 0;">Invoice ${invoiceNumber}</h1>
            
            <p>Hi ${recipientName},</p>
            
            <p>Please find your invoice from ${companyName} below:</p>
            
            <div style="background-color: #f9fafb; border-radius: 6px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${invoiceTitle}</p>
              <p style="margin: 10px 0 0 0; font-size: 24px; font-weight: 700; color: #3C3CFF;">${formatCurrency(invoiceAmount, invoiceCurrency)}</p>
            </div>
            
            <div style="margin: 30px 0;">
              <a href="${invoiceUrl}" style="display: inline-block; background-color: #3C3CFF; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600;">View & Pay Invoice</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This invoice is also viewable in your client portal.
            </p>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              If you have any questions, please don't hesitate to reach out.
            </p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              ${companyName}
            </p>
          </div>
        </body>
      </html>
    `

    const text = emailBody || `
Invoice ${invoiceNumber}

Hi ${recipientName},

Please find your invoice from ${companyName} below:

${invoiceTitle}
Amount: ${formatCurrency(invoiceAmount, invoiceCurrency)}

View & Pay Invoice: ${invoiceUrl}

This invoice is also viewable in your client portal.

If you have any questions, please don't hesitate to reach out.

Best regards,
${companyName}
    `

    const emailOptions: any = {
      from,
      to: [to],
      subject,
      html,
      text,
    }

    if (ccEmails && ccEmails.length > 0) {
      emailOptions.cc = ccEmails
    }

    if (bccEmails && bccEmails.length > 0) {
      emailOptions.bcc = bccEmails
    }

    const { data, error } = await resend.emails.send(emailOptions)

    if (error) {
      console.error('Resend email error:', error)
      throw new Error(`Failed to send invoice email: ${error.message}`)
    }

    console.log('✅ Invoice email sent successfully:', data)
    return { success: true, messageId: data?.id }
  } catch (error) {
    console.error('Invoice email service error:', error)
    throw error
  }
}
