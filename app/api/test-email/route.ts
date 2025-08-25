import { NextRequest, NextResponse } from 'next/server'
import { sendTestEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, message: 'Test endpoint not available in production' },
        { status: 403 }
      )
    }

    const result = await sendTestEmail(email)

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      data: result
    })

  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send test email', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
