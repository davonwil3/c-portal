import { differenceInCalendarDays } from 'date-fns'
import { createClient } from '@/lib/supabase/client'
import type { Invoice as DBInvoice } from '@/lib/invoices'

export interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  projectName: string
  amount: number
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled' | 'refunded'
  issueDate: string
  dueDate: string
  paidDate?: string
}

// Utility functions for analytics calculations
export function sumTotal(invoices: Invoice[]): number {
  return invoices.reduce((sum, invoice) => sum + invoice.amount, 0)
}

export function sumCollected(invoices: Invoice[]): number {
  return invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amount, 0)
}

export function sumOutstanding(invoices: Invoice[]): number {
  return invoices
    .filter(invoice => 
      invoice.status === 'sent' || 
      invoice.status === 'viewed' || 
      invoice.status === 'overdue' ||
      invoice.status === 'partially_paid'
    )
    .reduce((sum, invoice) => sum + invoice.amount, 0)
}

export function conversionRate(invoices: Invoice[]): number {
  if (invoices.length === 0) return 0
  const paidCount = invoices.filter(invoice => invoice.status === 'paid').length
  return (paidCount / invoices.length) * 100
}

export function avgInvoiceAmount(invoices: Invoice[]): number {
  if (invoices.length === 0) return 0
  return sumTotal(invoices) / invoices.length
}

export function avgPaymentDays(invoices: Invoice[]): number {
  const paidInvoices = invoices.filter(invoice => 
    invoice.status === 'paid' && invoice.paidDate
  )
  
  if (paidInvoices.length === 0) return 0
  
  const totalDays = paidInvoices.reduce((sum, invoice) => {
    const issueDate = new Date(invoice.issueDate)
    const paidDate = new Date(invoice.paidDate!)
    return sum + differenceInCalendarDays(paidDate, issueDate)
  }, 0)
  
  return totalDays / paidInvoices.length
}

export function collectionRate(invoices: Invoice[]): number {
  const paidInvoices = invoices.filter(invoice => invoice.status === 'paid')
  if (paidInvoices.length === 0) return 0
  
  // Calculate how many were paid on time (before or on due date)
  const paidOnTime = paidInvoices.filter(invoice => {
    if (!invoice.paidDate) return false
    const paidDate = new Date(invoice.paidDate)
    const dueDate = new Date(invoice.dueDate)
    return paidDate <= dueDate
  })
  
  return (paidOnTime.length / paidInvoices.length) * 100
}

export function momGrowth(invoices: Invoice[]): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  // Revenue for current month
  const currentMonthRevenue = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && inv.status === 'paid'
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Revenue for last month
  const lastMonthRevenue = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear && inv.status === 'paid'
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  if (lastMonthRevenue === 0) return currentMonthRevenue > 0 ? 100 : 0
  
  return ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
}

// Calculate MoM growth for total invoiced
export function momGrowthTotalInvoiced(invoices: Invoice[]): { value: number | null; hasData: boolean } {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  // Total invoiced for current month
  const currentMonthTotal = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Total invoiced for last month
  const lastMonthTotal = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Need at least 2 months of data to calculate trend
  if (lastMonthTotal === 0 && currentMonthTotal === 0) {
    return { value: null, hasData: false }
  }
  
  if (lastMonthTotal === 0) {
    return { value: currentMonthTotal > 0 ? 100 : 0, hasData: true }
  }
  
  return { value: ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100, hasData: true }
}

// Calculate MoM growth for total collected
export function momGrowthTotalCollected(invoices: Invoice[]): { value: number | null; hasData: boolean } {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  // Total collected for current month
  const currentMonthCollected = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear && inv.status === 'paid'
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Total collected for last month
  const lastMonthCollected = invoices
    .filter(inv => {
      const date = new Date(inv.issueDate)
      return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear && inv.status === 'paid'
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Need at least 2 months of data to calculate trend
  if (lastMonthCollected === 0 && currentMonthCollected === 0) {
    return { value: null, hasData: false }
  }
  
  if (lastMonthCollected === 0) {
    return { value: currentMonthCollected > 0 ? 100 : 0, hasData: true }
  }
  
  return { value: ((currentMonthCollected - lastMonthCollected) / lastMonthCollected) * 100, hasData: true }
}

// Calculate MoM growth for outstanding balance
// This compares outstanding balance at end of current month vs end of last month
export function momGrowthOutstanding(invoices: Invoice[]): { value: number | null; hasData: boolean } {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  
  // Outstanding balance as of end of current month (all outstanding invoices issued up to end of current month)
  const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
  const currentMonthOutstanding = invoices
    .filter(inv => {
      const issueDate = new Date(inv.issueDate)
      const isOutstanding = inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue' || inv.status === 'partially_paid'
      // Include all outstanding invoices issued up to end of current month
      return issueDate <= endOfCurrentMonth && isOutstanding
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Outstanding balance as of end of last month (all outstanding invoices issued up to end of last month)
  const endOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59)
  const lastMonthOutstanding = invoices
    .filter(inv => {
      const issueDate = new Date(inv.issueDate)
      const isOutstanding = inv.status === 'sent' || inv.status === 'viewed' || inv.status === 'overdue' || inv.status === 'partially_paid'
      // Include all outstanding invoices issued up to end of last month
      return issueDate <= endOfLastMonth && isOutstanding
    })
    .reduce((sum, inv) => sum + inv.amount, 0)
  
  // Need at least 2 months of data to calculate trend
  if (lastMonthOutstanding === 0 && currentMonthOutstanding === 0) {
    return { value: null, hasData: false }
  }
  
  if (lastMonthOutstanding === 0) {
    return { value: currentMonthOutstanding > 0 ? 100 : 0, hasData: true }
  }
  
  return { value: ((currentMonthOutstanding - lastMonthOutstanding) / lastMonthOutstanding) * 100, hasData: true }
}

export function newClientsThisMonth(invoices: Invoice[]): number {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Group invoices by client and find their first invoice date
  const clientFirstInvoice = new Map<string, Date>()
  
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.issueDate)
    const existingDate = clientFirstInvoice.get(invoice.clientName)
    
    if (!existingDate || invoiceDate < existingDate) {
      clientFirstInvoice.set(invoice.clientName, invoiceDate)
    }
  })
  
  // Count clients whose first invoice was this month
  let newClients = 0
  clientFirstInvoice.forEach(firstInvoiceDate => {
    if (firstInvoiceDate.getMonth() === currentMonth && firstInvoiceDate.getFullYear() === currentYear) {
      newClients++
    }
  })
  
  return newClients
}

export function groupByMonth(invoices: Invoice[], dateRange?: 'all' | '6m' | '12m' | 'year' | 'lastYear' | string) {
  if (invoices.length === 0) {
    return []
  }

  // Determine date range - use local time, not UTC
  const now = new Date()
  const localYear = now.getFullYear()
  const localMonth = now.getMonth() // 0-11
  const localDate = now.getDate()
  
  let startDate: Date
  let endDate: Date

  console.log('=== GROUP BY MONTH START ===')
  console.log('dateRange:', dateRange)
  console.log('Local date:', `${localYear}-${String(localMonth + 1).padStart(2, '0')}-${String(localDate).padStart(2, '0')}`)
  console.log('Local month:', localMonth, '(0=Jan, 9=Oct)')
  console.log('Current month key should be:', `${localYear}-${String(localMonth + 1).padStart(2, '0')}`)
  console.log('Total invoices:', invoices.length)

  if (dateRange === '6m') {
    // Last 6 months = go back 5 months from current month (6 months total including current)
    startDate = new Date(localYear, localMonth - 5, 1)
    endDate = new Date(localYear, localMonth + 1, 0) // End of current month
  } else if (dateRange === '12m') {
    // Last 12 months = go back 11 months from current month (12 months total including current)
    startDate = new Date(localYear, localMonth - 11, 1)
    endDate = new Date(localYear, localMonth + 1, 0) // End of current month
  } else if (dateRange === 'year') {
    // Year to date
    startDate = new Date(localYear, 0, 1) // Jan 1 of current year
    endDate = new Date(localYear, localMonth + 1, 0) // End of current month
  } else if (dateRange?.match(/^\d{4}$/)) {
    // Specific year (e.g., "2024")
    const year = parseInt(dateRange)
    startDate = new Date(year, 0, 1)
    // If it's current year, go through current month; otherwise full year
    if (year === localYear) {
      endDate = new Date(year, localMonth + 1, 0) // End of current month
    } else {
      endDate = new Date(year, 11, 31)
    }
  } else {
    // 'all' or default: use first and last invoice dates
    const issueDates = invoices.map(inv => new Date(inv.issueDate))
    const minDate = new Date(Math.min(...issueDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...issueDates.map(d => d.getTime())))
    
    // Start at beginning of first month
    startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    // End at end of last invoice month or current month, whichever is later
    const lastInvoiceMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    const currentMonth = new Date(localYear, localMonth, 1)
    
    if (currentMonth > lastInvoiceMonth) {
      endDate = new Date(localYear, localMonth + 1, 0) // End of current month
    } else {
      endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0)
    }
  }

  // Collect data by month (don't filter by date - use all invoices and group them)
  const months = new Map<string, { paidRevenue: number, createdCount: number }>()
  
  invoices.forEach(invoice => {
    const invoiceDate = new Date(invoice.issueDate)
    // Use local time for month key to avoid timezone issues
    const invYear = invoiceDate.getFullYear()
    const invMonth = invoiceDate.getMonth() + 1 // 1-12
    const monthKey = `${invYear}-${String(invMonth).padStart(2, '0')}`
    
    // Only include invoices within our date range
    const invoiceMonthStart = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1)
    const rangeMonthStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    const rangeMonthEnd = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
    
    if (invoiceMonthStart >= rangeMonthStart && invoiceMonthStart <= rangeMonthEnd) {
      if (!months.has(monthKey)) {
        months.set(monthKey, { paidRevenue: 0, createdCount: 0 })
      }
      
      const month = months.get(monthKey)!
      month.createdCount++
      
      if (invoice.status === 'paid') {
        month.paidRevenue += invoice.amount
      }
    }
  })

  // Fill in missing months with zeros for continuity
  const result: Array<{ month: string, paidRevenue: number, createdCount: number, isCurrentMonth?: boolean }> = []
  const currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  
  // Get current month key for comparison - use local time!
  const currentMonthKey = `${localYear}-${String(localMonth + 1).padStart(2, '0')}`
  
  console.log('Date range:', {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
    startMonth: currentMonth.toISOString().slice(0, 7),
    endMonth: endMonth.toISOString().slice(0, 7),
    currentMonthKey
  })
  
  while (currentMonth <= endMonth) {
    // Generate month key using local time to avoid timezone issues
    const monthYear = currentMonth.getFullYear()
    const monthNum = currentMonth.getMonth() + 1 // 1-12
    const monthKey = `${monthYear}-${String(monthNum).padStart(2, '0')}`
    
    const data = months.get(monthKey) || { paidRevenue: 0, createdCount: 0 }
    
    result.push({
      month: monthKey,
      paidRevenue: data.paidRevenue,
      createdCount: data.createdCount,
      isCurrentMonth: monthKey === currentMonthKey
    })
    
    currentMonth.setMonth(currentMonth.getMonth() + 1)
  }
  
  console.log('Result months:', result.map(r => `${r.month}${r.isCurrentMonth ? ' (current)' : ''}`))
  console.log('Result data points:', result.length)
  console.log('=== GROUP BY MONTH END ===')
  
  return result
}

export function getAvailableYears(invoices: Invoice[]): number[] {
  if (invoices.length === 0) return []
  
  const years = new Set<number>()
  invoices.forEach(invoice => {
    const year = new Date(invoice.issueDate).getFullYear()
    years.add(year)
  })
  
  return Array.from(years).sort((a, b) => b - a) // Most recent first
}

export function revenueByClient(invoices: Invoice[]) {
  const clientMap = new Map<string, { total: number, count: number }>()
  
  invoices.forEach(invoice => {
    if (!clientMap.has(invoice.clientName)) {
      clientMap.set(invoice.clientName, { total: 0, count: 0 })
    }
    
    const client = clientMap.get(invoice.clientName)!
    client.total += invoice.amount
    client.count++
  })
  
  return Array.from(clientMap.entries()).map(([client, data]) => ({
    client,
    total: data.total,
    count: data.count
  })).sort((a, b) => b.total - a.total)
}

export function revenueByProject(invoices: Invoice[]) {
  const projectMap = new Map<string, number>()
  
  invoices.forEach(invoice => {
    const project = invoice.projectName || 'Unassigned'
    projectMap.set(project, (projectMap.get(project) || 0) + invoice.amount)
  })
  
  return Array.from(projectMap.entries()).map(([project, total]) => ({
    project,
    total
  })).sort((a, b) => b.total - a.total)
}

export function statusCounts(invoices: Invoice[]) {
  const counts = { paid: 0, pending: 0, overdue: 0, void: 0 }
  
  invoices.forEach(invoice => {
    // Map actual invoice statuses to chart categories
    if (invoice.status === 'paid' || invoice.status === 'partially_paid') {
      counts.paid++
    } else if (invoice.status === 'sent' || invoice.status === 'viewed') {
      counts.pending++ // "sent" and "viewed" are pending payment
    } else if (invoice.status === 'overdue') {
      counts.overdue++
    } else if (invoice.status === 'cancelled' || invoice.status === 'refunded' || invoice.status === 'draft') {
      counts.void++ // Group cancelled, refunded, and draft as "void"
    }
  })
  
  return counts
}

export function paymentBuckets(invoices: Invoice[]) {
  const buckets = {
    '0-7': 0,
    '8-14': 0,
    '15-30': 0,
    '31-60': 0,
    '60+': 0
  }
  
  invoices
    .filter(invoice => invoice.status === 'paid' && invoice.paidDate)
    .forEach(invoice => {
      const issueDate = new Date(invoice.issueDate)
      const paidDate = new Date(invoice.paidDate!)
      const days = differenceInCalendarDays(paidDate, issueDate)
      
      if (days <= 7) buckets['0-7']++
      else if (days <= 14) buckets['8-14']++
      else if (days <= 30) buckets['15-30']++
      else if (days <= 60) buckets['31-60']++
      else buckets['60+']++
    })
  
  return buckets
}

export function recurringSplit(invoices: Invoice[]) {
  // Group all invoices by client and sort by issue date to find first invoice
  const clientInvoices = new Map<string, Invoice[]>()
  
  invoices.forEach(invoice => {
    if (!clientInvoices.has(invoice.clientName)) {
      clientInvoices.set(invoice.clientName, [])
    }
    clientInvoices.get(invoice.clientName)!.push(invoice)
  })
  
  let returningCount = 0
  let newCount = 0
  
  // For each client, sort invoices by issue date and check if they have more than one
  clientInvoices.forEach((clientInvoiceList, clientName) => {
    // Sort by issue date to find chronological order
    const sortedInvoices = clientInvoiceList.sort((a, b) => 
      new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime()
    )
    
    // If client has more than one invoice, they are returning
    // Otherwise they are new (first invoice)
    if (sortedInvoices.length > 1) {
      returningCount++
    } else {
      newCount++
    }
  })
  
  return { returningCount, newCount }
}

export function dueSoon(invoices: Invoice[], limit = 3) {
  const now = new Date()
  
  return invoices
    .filter(invoice => 
      (invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'partially_paid') && 
      new Date(invoice.dueDate) > now
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit)
}

export function overdue(invoices: Invoice[], limit = 5) {
  return invoices
    .filter(invoice => invoice.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, limit)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

// Convert database invoice to analytics invoice format
function convertDBInvoiceToAnalytics(dbInvoice: DBInvoice): Invoice {
  // Use the actual database status directly (no conversion needed)
  const status = dbInvoice.status as Invoice['status']

  return {
    id: dbInvoice.id,
    invoiceNumber: dbInvoice.invoice_number,
    clientName: dbInvoice.client_name || 'Unknown Client',
    projectName: dbInvoice.project_name || dbInvoice.title || 'Unnamed Project',
    amount: dbInvoice.total_amount,
    status,
    issueDate: dbInvoice.issue_date,
    dueDate: dbInvoice.due_date || dbInvoice.issue_date,
    paidDate: dbInvoice.paid_date
  }
}

// Fetch real invoices from database
export async function fetchRealInvoices(): Promise<Invoice[]> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.warn('No user authenticated, returning empty array')
      return []
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('account_id')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_id) {
      console.warn('No account found for user, returning empty array')
      return []
    }

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        clients:client_id(first_name, last_name, company),
        projects:project_id(name)
      `)
      .eq('account_id', profile.account_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invoices:', error)
      return []
    }

    const invoices = data?.map(invoice => ({
      ...invoice,
      client_name: invoice.clients ? 
        (invoice.clients.company || `${invoice.clients.first_name} ${invoice.clients.last_name}`) : 
        null,
      project_name: invoice.projects?.name || null
    })) || []

    return invoices.map(convertDBInvoiceToAnalytics)
  } catch (error) {
    console.error('Error in fetchRealInvoices:', error)
    return []
  }
}
