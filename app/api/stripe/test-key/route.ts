import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// Test endpoint to verify Stripe API key is working
export async function GET(request: NextRequest) {
  try {
    // Try to retrieve account info (lightweight operation to test key)
    const account = await stripe.account.retrieve()
    
    return NextResponse.json({ 
      success: true,
      message: 'Stripe API key is valid!',
      accountId: account.id,
      country: account.country
    })
  } catch (error: any) {
    console.error('Stripe key test error:', error)
    
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid Stripe API key',
          message: 'Your STRIPE_SECRET_KEY is invalid. Please:',
          steps: [
            '1. Go to https://dashboard.stripe.com/test/apikeys',
            '2. Make sure you\'re in TEST mode (toggle in top right)',
            '3. Click "Reveal test key" next to "Secret key"',
            '4. Copy the entire key (starts with sk_test_)',
            '5. Add it to .env.local as STRIPE_SECRET_KEY=sk_test_...',
            '6. Make sure there are NO quotes or extra spaces',
            '7. Restart your dev server (npm run dev)'
          ]
        },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Unknown error testing Stripe key'
      },
      { status: 500 }
    )
  }
}

