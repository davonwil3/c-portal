import { Invoice } from '@/lib/analytics'

// Generate realistic mock data for the last 12 months
const clients = [
  'Acme Corp', 'TechStart Inc', 'Design Studio', 'Marketing Agency', 'E-commerce Store',
  'Consulting Firm', 'Restaurant Chain', 'Healthcare Clinic', 'Law Firm', 'Nonprofit Org',
  'Real Estate Co', 'Fitness Center', 'Beauty Salon', 'Auto Repair', 'Construction Co'
]

const projects = [
  'Website Redesign', 'Mobile App Development', 'Brand Identity', 'SEO Optimization',
  'Social Media Management', 'Content Creation', 'Email Marketing', 'Analytics Setup',
  'E-commerce Integration', 'Database Migration', 'API Development', 'UI/UX Design',
  'Logo Design', 'Print Materials', 'Video Production', 'Photography', 'Copywriting',
  'Technical Writing', 'Project Management', 'Consulting'
]

const statuses: Invoice['status'][] = ['paid', 'sent', 'viewed', 'overdue', 'cancelled', 'partially_paid']

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return date.toISOString().split('T')[0]
}

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function generateInvoice(id: number): Invoice {
  const issueDate = new Date()
  issueDate.setMonth(issueDate.getMonth() - Math.floor(Math.random() * 12))
  
  const dueDate = new Date(issueDate)
  dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 15) // 15-45 days
  
  const status = randomElement(statuses)
  const amount = Math.floor(Math.random() * 5000) + 500 // $500-$5500
  
  let paidDate: string | undefined
  if (status === 'paid') {
    const paid = new Date(issueDate)
    paid.setDate(paid.getDate() + Math.floor(Math.random() * 45) + 1) // 1-45 days after issue
    paidDate = paid.toISOString().split('T')[0]
  }
  
  return {
    id: `inv-${id.toString().padStart(4, '0')}`,
    invoiceNumber: `INV-${id.toString().padStart(4, '0')}`,
    clientName: randomElement(clients),
    projectName: randomElement(projects),
    amount,
    status,
    issueDate: issueDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0],
    paidDate
  }
}

// Generate 50 invoices across the last 12 months
export const mockInvoices: Invoice[] = Array.from({ length: 50 }, (_, i) => generateInvoice(i + 1))

// Debug: Log first few invoices
console.log('First 3 mock invoices:', mockInvoices.slice(0, 3))
console.log('Total mock invoices:', mockInvoices.length)
