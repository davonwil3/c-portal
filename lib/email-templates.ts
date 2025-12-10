export interface MagicLinkEmailParams {
  recipientName: string
  companyName: string
  magicLink: string
  expiresIn: string
}

export function createMagicLinkEmail({
  recipientName,
  companyName,
  magicLink,
  expiresIn,
}: MagicLinkEmailParams) {
  const subject = `Access your portal`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #4647E0 0%, #3C3CFF 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      Portal Access
                    </h1>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.6; color: #111827; font-weight: 500;">
            Hi ${recipientName},
          </p>
                    <p style="margin: 0 0 30px 0; font-size: 16px; line-height: 1.7; color: #4b5563;">
                      You've been granted access to <strong style="color: #111827;">${companyName}</strong>. Click the button below to securely access your portal.
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td align="center" style="padding: 0;">
                          <a href="${magicLink}" style="display: inline-block; background-color: #4647E0; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 6px -1px rgba(70, 71, 224, 0.3);">
              Access Portal
            </a>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Alternative Link -->
                    <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                      Or copy and paste this link into your browser:<br>
                      <a href="${magicLink}" style="color: #4647E0; text-decoration: none; word-break: break-all; font-size: 13px;">${magicLink}</a>
                    </p>
                    
                    <!-- Security Notice -->
                    <div style="margin-top: 40px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; font-size: 13px; color: #6b7280; line-height: 1.6;">
                        <strong style="color: #374151;">🔒 Security Notice:</strong>
                      </p>
                      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #6b7280; line-height: 1.8;">
                        <li>This link will expire in <strong>${expiresIn}</strong></li>
                        <li>For your security, never share this link with anyone</li>
                        <li>If you didn't request this link, please ignore this email</li>
                      </ul>
          </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6;">
                      This is an automated message. Please do not reply to this email.<br>
                      If you have questions, contact your portal administrator.
          </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
  
  const text = `
Hi ${recipientName},

You've been granted access to ${companyName}. Click the link below to securely access your portal:

${magicLink}

Security Notice:
- This link will expire in ${expiresIn}
- For your security, never share this link with anyone
- If you didn't request this link, please ignore this email

This is an automated message. Please do not reply to this email.
If you have questions, contact your portal administrator.
  `.trim()
  
  return { subject, html, text }
}

export interface WorkspaceInviteEmailParams {
  inviterName: string
  workspaceName: string
  inviteUrl: string
  role: 'admin' | 'member'
}

export function createWorkspaceInviteEmail({
  inviterName,
  workspaceName,
  inviteUrl,
  role,
}: WorkspaceInviteEmailParams) {
  const roleLabel = role === 'admin' ? 'Admin' : 'Member'
  
  const subject = `You've been invited to join ${workspaceName} on Jolix`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">You've been invited!</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi there,
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on Jolix as a <strong>${roleLabel}</strong>.
          </p>
          <p style="font-size: 16px; margin-bottom: 30px;">
            Click the button below to accept the invitation and get started:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background: #3C3CFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #3C3CFF; word-break: break-all;">${inviteUrl}</a>
          </p>
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            This invitation will expire in 7 days.
          </p>
        </div>
        <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
          <p>This is an automated message from Jolix. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `
  
  const text = `
You've been invited!

Hi there,

${inviterName} has invited you to join ${workspaceName} on Jolix as a ${roleLabel}.

Click the link below to accept the invitation:
${inviteUrl}

This invitation will expire in 7 days.

This is an automated message from Jolix. Please do not reply to this email.
  `.trim()
  
  return { subject, html, text }
}
