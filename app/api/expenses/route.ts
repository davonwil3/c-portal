import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const { data: expenses, error } = await adminClient
      .from('expenses')
      .select('*')
      .eq('account_id', profile.account_id)
      .order('date', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({
      expenses: expenses?.map((exp) => ({
        id: exp.id,
        date: exp.date,
        description: exp.description,
        category: exp.category,
        amount: Number(exp.amount),
        aiCategorized: exp.ai_categorized || false,
      })) || [],
    })
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const body = await request.json()
    const { date, description, category, amount, aiCategorized } = body

    if (!date || !description || !category || amount === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const adminClient = createAdminClient()
    const { data: expense, error } = await adminClient
      .from('expenses')
      .insert({
        account_id: profile.account_id,
        date,
        description,
        category,
        amount: Number(amount),
        ai_categorized: aiCategorized || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      expense: {
        id: expense.id,
        date: expense.date,
        description: expense.description,
        category: expense.category,
        amount: Number(expense.amount),
        aiCategorized: expense.ai_categorized || false,
      },
    })
  } catch (error: any) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: error.message || 'Failed to create expense' }, { status: 500 })
  }
}

