"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Image from "next/image"
import { type Account } from "@/lib/auth"
import { forwardRef } from "react"

interface InvoicePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoice: any // Invoice data
  account?: Account | null
  projects?: any[] // Optional projects array for project name lookup
  brandColor?: string // Optional brand color, defaults to #3C3CFF
}

export const InvoicePreviewModal = forwardRef<HTMLDivElement, InvoicePreviewModalProps>(({ 
  open, 
  onOpenChange, 
  invoice, 
  account,
  projects = [],
  brandColor = "#3C3CFF"
}, ref) => {
  if (!invoice) return null

  const formatCurrency = (amount: number | string | null | undefined) => {
    if (amount === null || amount === undefined || amount === '') return '$0.00'
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD',
    }).format(numAmount)
  }

  // Extract invoice data - prioritize metadata, then invoice fields, then account
  const logoUrl = invoice.metadata?.logo_url || invoice.logo_url || account?.logo_url || ""
  const companyName = invoice.metadata?.company_name || invoice.company_name || account?.company_name || "Your Company Name"
  const companyAddress = invoice.metadata?.company_address || invoice.company_address || account?.address || ""
  const companyPhone = invoice.metadata?.company_phone || invoice.company_phone || account?.phone || ""
  const companyEmail = invoice.metadata?.company_email || invoice.company_email || account?.email || ""
  
  const invoiceNumber = invoice.invoice_number || `INV-${invoice.id?.slice(0, 8) || '000000'}`
  const title = invoice.title || "(Untitled Invoice)"
  const issueDate = invoice.issue_date
  const dueDate = invoice.due_date
  const poNumber = invoice.po_number
  const projectId = invoice.project_id
  const projectName = projectId && projects.length > 0 
    ? projects.find((p: any) => p.id === projectId)?.name 
    : invoice.project_name || null
  
  const lineItems = invoice.line_items || []
  const subtotal = invoice.subtotal || lineItems.reduce((sum: number, item: any) => sum + (item.total_amount || (item.quantity || 1) * (item.unit_rate || item.rate || 0)), 0)
  const taxAmount = invoice.tax_amount || 0
  const discountValue = invoice.discount_value || invoice.discount_amount || 0
  const totalAmount = invoice.total_amount || subtotal + taxAmount - discountValue
  const notes = invoice.notes
  
  const isRecurring = invoice.is_recurring || false
  const recurringSchedule = invoice.recurring_schedule || ""
  const recurringType = recurringSchedule ? recurringSchedule.split('-')[0] : ""
  
  const showBilledByHour = invoice.metadata?.show_billed_by_hour || false
  const totalHours = invoice.metadata?.total_hours || 0
  
  const clientName = invoice.client_name || "Client Name"
  const clientEmail = invoice.client_email
  const clientPhone = invoice.client_phone

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Preview</DialogTitle>
        </DialogHeader>
        <div ref={ref} className="max-w-[1000px] mx-auto bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
          {/* Company Header */}
          <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
            <div className="flex items-start justify-between">
              {/* Logo and Company Info */}
              <div className="flex items-start space-x-6">
                {logoUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={logoUrl}
                      alt="Company Logo"
                      width={200}
                      height={80}
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{companyName}</h2>
                  <div className="text-sm text-gray-600 space-y-1">
                    {companyAddress && <p>{companyAddress}</p>}
                    <div className="flex space-x-4">
                      {companyPhone && <span>{companyPhone}</span>}
                      {companyEmail && <span>{companyEmail}</span>}
                    </div>
                  </div>
                </div>
              </div>
              {/* Invoice Title & Number */}
              <div className="text-right space-y-2">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900">INVOICE</h1>
                  {isRecurring && recurringType && (
                    <p className="text-sm font-medium mt-1" style={{ color: brandColor }}>
                      Recurring {recurringType.charAt(0).toUpperCase() + recurringType.slice(1)}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-medium text-gray-600">#</span>
                    <span className="font-mono text-sm">{invoiceNumber}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details & Client Info */}
          <div className="grid grid-cols-2 gap-8 p-12">
            {/* Bill To */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Bill To</h3>
              <div className="text-sm text-gray-700 space-y-1 pl-3 border-l-2 border-gray-200">
                <p className="font-medium">{clientName}</p>
                {clientEmail && <p>{clientEmail}</p>}
                {clientPhone && <p>{clientPhone}</p>}
              </div>
            </div>

            {/* Invoice Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Invoice Details</h3>
              <div className="space-y-2">
                <p className="text-gray-900 font-medium">{title}</p>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-500">Invoice Date</span>
                    <p className="font-medium">{issueDate ? new Date(issueDate).toLocaleDateString() : "-"}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Due Date</span>
                    <p className="font-medium">{dueDate ? new Date(dueDate).toLocaleDateString() : "-"}</p>
                  </div>
                </div>
                {poNumber && <p className="text-sm text-gray-700">PO: {poNumber}</p>}
                {projectName && (
                  <p className="text-sm text-gray-700">Project: {projectName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4 px-12 mt-10">
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[35%]">Description</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[15%]">Quantity</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">Rate</th>
                    <th className="text-right py-3 px-4 text-xs font-semibold text-gray-600 uppercase tracking-wide w-[20%]">Amount</th>
                    <th className="w-[10%]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lineItems && lineItems.length > 0 ? (
                    lineItems.map((item: any, idx: number) => (
                      <tr key={item.id || idx} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <p className="mb-1 font-medium text-gray-900">{item.name || item.description || "(Item)"}</p>
                          {item.description && item.description !== item.name && (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.description}</p>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">{item.quantity || 1}</td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(item.unit_rate || item.rate || 0)}</td>
                        <td className="py-3 px-4 text-right font-mono font-semibold text-gray-900">{formatCurrency(item.total_amount || (item.quantity || 1) * (item.unit_rate || item.rate || 0))}</td>
                        <td className="py-3 px-4"></td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 px-4 text-center text-gray-500 text-sm">No line items</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end px-12 mt-10">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between items-center text-gray-700">
                <span>Subtotal</span>
                <span className="font-mono font-semibold">{formatCurrency(subtotal)}</span>
              </div>
              {taxAmount && taxAmount > 0 && (
                <div className="flex justify-between items-center text-gray-700">
                  <span>Tax</span>
                  <span className="font-mono font-semibold">{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {discountValue && discountValue > 0 && (
                <div className="flex justify-between items-center text-gray-700">
                  <span>Discount</span>
                  <span className="font-mono font-semibold">-{formatCurrency(discountValue)}</span>
                </div>
              )}
              <div className="h-px bg-gray-200 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold font-mono" style={{ color: brandColor }}>{formatCurrency(totalAmount)}</span>
              </div>

              {/* Hours Worked */}
              {showBilledByHour && totalHours > 0 && (
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span className="font-medium">Total Hours Worked</span>
                    <span className="font-semibold">{totalHours.toFixed(2)} hours</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="space-y-2 pt-10 mt-10 border-t border-gray-200 px-12">
              <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</Label>
              <p className="text-gray-700 whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 pt-10 mt-10 border-t border-gray-200 px-12">
            <p>Thank you for your business!</p>
          </div>

          {/* Powered by Jolix Footer - Free Plan Only */}
          {account?.plan_tier === 'free' && (
            <div className="pt-10 mt-10 border-t border-gray-100 px-12">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                <span>Powered by</span>
                <a
                  href="https://jolix.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#3C3CFF] hover:text-[#2D2DCC] transition-colors font-medium"
                >
                  <Image
                    src="/jolixlogo.png"
                    alt="Jolix"
                    width={18}
                    height={18}
                    className="object-contain"
                  />
                  <span>Jolix</span>
                </a>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
})

InvoicePreviewModal.displayName = "InvoicePreviewModal"

