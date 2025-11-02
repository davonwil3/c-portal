import { NextRequest, NextResponse } from 'next/server'
import { incrementPortfolioView } from '@/lib/portfolio'

export async function POST(request: NextRequest) {
  try {
    const { domain } = await request.json()
    
    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      )
    }
    
    const result = await incrementPortfolioView(domain)
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error incrementing portfolio view:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to increment view' },
      { status: 500 }
    )
  }
}

