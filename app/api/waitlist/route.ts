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

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('waitlist')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ message: 'Already on the waitlist' }, { status: 200 })
    }

    // Insert new email
    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase(), source: 'landing', ip })

    if (error) {
      console.error('Supabase insert error:', error)
      // If it's a unique violation that we somehow missed, still return success
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already on the waitlist' }, { status: 200 })
      }
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Successfully joined waitlist' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}


