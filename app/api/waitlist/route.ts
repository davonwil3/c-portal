import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    if (!email || typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const supabase = await createClient()
    const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase(), source: 'landing', ip })

    if (error) {
      // Unique violation (already joined) — return ok to avoid leaking existence
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already on the waitlist' }, { status: 200 })
      }
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Joined waitlist' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}


