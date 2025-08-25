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
  from = 'noreply@yourdomain.com' // Update this with your verified domain
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
