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

    // Get user's profile and account
    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const adminClient = createAdminClient()
    const accountId = profile.account_id

    // Get current year
    const currentYear = new Date().getFullYear()
    const startOfYear = new Date(currentYear, 0, 1).toISOString()
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()

    // Calculate income from paid invoices this year
    const { data: invoices } = await adminClient
      .from('invoices')
      .select('total_amount, issue_date, paid_date')
      .eq('account_id', accountId)
      .in('status', ['paid', 'partially_paid'])
      .gte('issue_date', startOfYear)
      .lte('issue_date', endOfYear)

    // Calculate YTD income (from paid invoices)
    const incomeYtd = invoices?.reduce((sum, inv) => {
      // Only count if paid this year
      if (inv.paid_date && new Date(inv.paid_date).getFullYear() === currentYear) {
        return sum + Number(inv.total_amount || 0)
      }
      // Or if status is paid and issued this year
      return sum + Number(inv.total_amount || 0)
    }, 0) || 0

    // Get expenses for this year
    const { data: expenses } = await adminClient
      .from('expenses')
      .select('*')
      .eq('account_id', accountId)
      .gte('date', startOfYear.split('T')[0])
      .lte('date', endOfYear.split('T')[0])
      .order('date', { ascending: false })

    const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount || 0), 0) || 0

    // Calculate quarterly breakdown
    const quarters = [
      { quarter: 'Q1', start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
      { quarter: 'Q2', start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
      { quarter: 'Q3', start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
      { quarter: 'Q4', start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) },
    ]

    const quarterlyData = quarters.map((q) => {
      const qStart = q.start.toISOString()
      const qEnd = q.end.toISOString()

      // Income for this quarter
      const quarterInvoices = invoices?.filter((inv) => {
        const issueDate = new Date(inv.issue_date)
        return issueDate >= q.start && issueDate <= q.end
      }) || []
      const quarterIncome = quarterInvoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0)

      // Expenses for this quarter
      const quarterExpenses = expenses?.filter((exp) => {
        const expDate = new Date(exp.date)
        return expDate >= q.start && expDate <= q.end
      }) || []
      const quarterExpensesTotal = quarterExpenses.reduce((sum, exp) => sum + Number(exp.amount || 0), 0)

      // Estimated tax (25% default, will be adjusted by frontend)
      const estimatedTax = Math.round(quarterIncome * 0.25)

      return {
        quarter: q.quarter,
        income: Math.round(quarterIncome),
        expenses: Math.round(quarterExpensesTotal),
        estimatedTax,
      }
    })

    // Calculate next tax deadline (quarterly deadlines: Jan 15, Apr 15, Jun 15, Sep 15)
    const now = new Date()
    const currentMonth = now.getMonth()
    let nextDeadline: Date
    if (currentMonth < 3) {
      // Q1 deadline: April 15
      nextDeadline = new Date(currentYear, 3, 15)
    } else if (currentMonth < 5) {
      // Q2 deadline: June 15
      nextDeadline = new Date(currentYear, 5, 15)
    } else if (currentMonth < 8) {
      // Q3 deadline: September 15
      nextDeadline = new Date(currentYear, 8, 15)
    } else {
      // Q4 deadline: January 15 next year
      nextDeadline = new Date(currentYear + 1, 0, 15)
    }

    return NextResponse.json({
      incomeYtd: Math.round(incomeYtd),
      totalExpenses: Math.round(totalExpenses),
      quarterlyData,
      nextDeadline: nextDeadline.toISOString().split('T')[0],
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
    console.error('Error fetching tax summary:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch tax summary' }, { status: 500 })
  }
}

