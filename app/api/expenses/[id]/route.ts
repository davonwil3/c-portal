import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const adminClient = createAdminClient()
    
    // Verify expense belongs to user's account
    const { data: existingExpense } = await adminClient
      .from('expenses')
      .select('account_id')
      .eq('id', params.id)
      .single()

    if (!existingExpense || existingExpense.account_id !== profile.account_id) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (date !== undefined) updateData.date = date
    if (description !== undefined) updateData.description = description
    if (category !== undefined) updateData.category = category
    if (amount !== undefined) updateData.amount = Number(amount)
    if (aiCategorized !== undefined) updateData.ai_categorized = aiCategorized

    const { data: expense, error } = await adminClient
      .from('expenses')
      .update(updateData)
      .eq('id', params.id)
      .eq('account_id', profile.account_id)
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
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: error.message || 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // Verify expense belongs to user's account
    const { data: existingExpense } = await adminClient
      .from('expenses')
      .select('account_id')
      .eq('id', params.id)
      .single()

    if (!existingExpense || existingExpense.account_id !== profile.account_id) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    const { error } = await adminClient
      .from('expenses')
      .delete()
      .eq('id', params.id)
      .eq('account_id', profile.account_id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: error.message || 'Failed to delete expense' }, { status: 500 })
  }
}

