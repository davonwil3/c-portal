import { NextRequest, NextResponse } from 'next/server'
import { processDueRecurringInvoices } from '@/lib/recurring-invoice-processor'

/**
 * API endpoint for processing due recurring invoices
 * This endpoint should be called by an external cron service (e.g., cron-job.org, EasyCron)
 * 
 * Authentication: Requires CRON_SECRET query parameter or header
 * 
 * Usage:
 * - Query param: GET /api/recurring/process?cron_secret=your_secret
 * - Header: X-Cron-Secret: your_secret
 */
export async function POST(request: NextRequest) {
  try {
    // Check for cron secret in query params or header
    const { searchParams } = new URL(request.url)
    const querySecret = searchParams.get('cron_secret')
    const headerSecret = request.headers.get('x-cron-secret')
    const cronSecret = querySecret || headerSecret

    const expectedSecret = process.env.CRON_SECRET

    if (!expectedSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!cronSecret || cronSecret !== expectedSecret) {
      console.warn('Unauthorized cron request - invalid or missing secret')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Processing due recurring invoices...')
    const result = await processDueRecurringInvoices()

    return NextResponse.json({
      success: result.success,
      message: `Processed recurring invoices. Created ${result.invoicesCreated} invoice(s).`,
      invoicesCreated: result.invoicesCreated,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error processing recurring invoices:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process recurring invoices',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Also support GET for easier cron job setup
export async function GET(request: NextRequest) {
  return POST(request)
}

