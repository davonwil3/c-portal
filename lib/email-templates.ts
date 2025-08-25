export const createMagicLinkEmail = ({
  recipientName,
  companyName,
  magicLink,
  expiresIn = '24 hours'
}: {
  recipientName: string
  companyName: string
  magicLink: string
  expiresIn?: string
}) => {
  return {
    subject: `Access Your ${companyName} Portal`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Your Portal</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 600px; 
              margin: 0 auto; 
              padding: 20px;
              background-color: #f9fafb;
            }
            .container { 
              background: white; 
              padding: 40px; 
              border-radius: 12px; 
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .logo { 
              font-size: 24px; 
              font-weight: bold; 
              color: #2563eb; 
              margin-bottom: 10px; 
            }
            .button { 
              display: inline-block; 
              background: #2563eb; 
              color: white; 
              padding: 16px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600; 
              margin: 20px 0; 
              text-align: center;
            }
            .button:hover { 
              background: #1d4ed8; 
            }
            .footer { 
              margin-top: 30px; 
              padding-top: 20px; 
              border-top: 1px solid #e5e7eb; 
              font-size: 14px; 
              color: #6b7280; 
              text-align: center; 
            }
            .warning { 
              background: #fef3c7; 
              border: 1px solid #f59e0b; 
              border-radius: 8px; 
              padding: 16px; 
              margin: 20px 0; 
              color: #92400e; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">${companyName}</div>
              <h1>Welcome to Your Portal</h1>
            </div>
            
            <p>Hi ${recipientName},</p>
            
            <p>You've been invited to access the <strong>${companyName}</strong> client portal. Click the button below to sign in securely:</p>
            
            <div style="text-align: center;">
              <a href="${magicLink}" class="button">Access Your Portal</a>
            </div>
            
            <div class="warning">
              <strong>Security Note:</strong> This link will expire in ${expiresIn}. If you didn't request this access, please ignore this email.
            </div>
            
            <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #6b7280; font-size: 14px;">${magicLink}</p>
            
            <div class="footer">
              <p>This is an automated message from ${companyName}. Please do not reply to this email.</p>
              <p>If you have any questions, please contact your account manager.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
Welcome to Your Portal

Hi ${recipientName},

You've been invited to access the ${companyName} client portal. 

Click this link to sign in securely:
${magicLink}

Security Note: This link will expire in ${expiresIn}. If you didn't request this access, please ignore this email.

If you have any questions, please contact your account manager.

Best regards,
The ${companyName} Team
    `
  }
}
