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
  const subject = `Access your ${companyName} portal`
  
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
          <h1 style="color: white; margin: 0; font-size: 24px;">Portal Access</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; margin-bottom: 20px;">
            Hi ${recipientName},
          </p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Click the button below to access your ${companyName} portal:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" style="display: inline-block; background: #3C3CFF; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
              Access Portal
            </a>
          </div>
          <p style="font-size: 14px; color: #6b7280; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            This link will expire in ${expiresIn}.
          </p>
        </div>
      </body>
    </html>
  `
  
  const text = `
Hi ${recipientName},

Click the link below to access your ${companyName} portal:
${magicLink}

This link will expire in ${expiresIn}.
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
