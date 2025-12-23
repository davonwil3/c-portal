"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { JolixFooter } from "@/components/JolixFooter"

interface ContractPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contract: any // Contract data
  account?: { plan_tier?: string } | null // Account data to check plan tier
}

export function ContractPreviewModal({ open, onOpenChange, contract, account }: ContractPreviewModalProps) {
  if (!contract) return null

  // Generate contract HTML
  const generateContractHTML = (contract: any) => {
    const content = contract.contract_content || {}
    const branding = content.branding || {}
    const company = content.company || {}
    const client = content.client || {}
    const terms = content.terms || {}
    const paymentPlan = content.paymentPlan || {}
    const scope = content.scope || {}
    
    // Helper to get payment schedule
    const getPaymentSchedule = () => {
      if (paymentPlan.schedule && Array.isArray(paymentPlan.schedule)) {
        return paymentPlan.schedule
      }
      const total = parseFloat(terms.projectTotal || "0") || 0
      return [total]
    }
    
    const paymentSchedule = getPaymentSchedule()
    const totalPayment = paymentSchedule.reduce((sum: number, amount: number) => sum + amount, 0)
    
    // Check if client has signed (for client portal view)
    const clientHasSigned = contract.client_signature_status === 'signed' || (terms.clientSignatureName && terms.clientSignatureName.trim() !== '')
    
    return `
      <div style="background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; padding: 64px; font-family: Georgia, serif;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
          ${branding.showLogo && branding.logoUrl ? `
            <div style="width: 128px; height: 128px; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 2px solid #d1d5db; background: #f9fafb;">
              <img src="${branding.logoUrl}" alt="Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;" />
            </div>
          ` : '<div style="width: 128px;"></div>'}
          <div style="text-align: right; font-size: 14px; font-family: Inter, sans-serif;">
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${company.name || "{your_company_name}"}</div>
            <div style="color: #4b5563;">${company.email || "{your_email}"}</div>
            ${branding.showAddress && company.address ? `<div style="color: #4b5563; font-size: 12px; margin-top: 4px;">${company.address}</div>` : ''}
          </div>
        </div>

        <div style="text-align: center; border-bottom: 1px solid ${branding.accentColor || '#6366F1'}; padding-bottom: 24px; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 400; color: #111827; margin-bottom: 8px;">Freelance Service Agreement</h1>
          <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-bottom: 8px;">
            This Agreement is between <strong>${company.name || "{your_company_name}"}</strong> ("Freelancer") and <strong>${client.name || "{client_name}"}</strong> ("Client") for the project described below.
          </p>
          <p style="font-size: 14px; color: #4b5563; font-family: Inter, sans-serif; margin-top: 8px;">
            Both parties agree to the following terms.
          </p>
        </div>

        <div style="font-size: 14px; font-family: Inter, sans-serif; line-height: 1.75;">
          <!-- 1. Project Summary -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              1️⃣ Project Summary
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 12px;">
              Freelancer agrees to perform the following services for Client:
            </p>
            <div style="margin-left: 16px; margin-bottom: 12px;">
              <p style="color: #374151; margin-bottom: 4px;"><strong>Project:</strong> ${content.projectName || "{project_name}"}</p>
              <p style="color: #374151; margin-bottom: 4px;"><strong>Deliverables:</strong></p>
              ${scope.deliverables ? `
                <div style="white-space: pre-wrap; margin-left: 16px; color: #374151;">${scope.deliverables}</div>
              ` : `
                <p style="color: #6b7280; font-style: italic; margin-left: 16px;">Custom website design (10 pages)&#10;Mobile-responsive development&#10;CMS integration&#10;SEO optimization&#10;30 days post-launch support</p>
              `}
              <p style="color: #374151; margin-top: 8px; margin-bottom: 4px;"><strong>Start Date:</strong> ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style="color: #374151; margin-bottom: 4px;"><strong>Estimated Completion:</strong> ${terms.estimatedCompletionDate ? new Date(terms.estimatedCompletionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</p>
            </div>
            <p style="color: #374151; line-height: 1.75; margin-top: 12px;">
              Any additional work outside this scope will require a new written agreement or change order.
            </p>
          </div>

          <!-- 2. Payment Terms -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              2️⃣ Payment Terms
            </h2>
            <div style="color: #374151; line-height: 1.75;">
              <p style="margin-bottom: 12px;"><strong>Total Project Fee:</strong> $${totalPayment.toLocaleString()} USD</p>
              ${paymentPlan.enabled ? `
                ${paymentPlan.type === "milestone" ? `
                  <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> Milestone-based billing. You will be invoiced at each milestone; no full upfront payment is required.</p>
                  <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                    ${(paymentPlan.milestones || []).slice(0, paymentPlan.milestonesCount || 4).map((m: any, i: number) => 
                      `<li style="margin-bottom: 4px;">${m.name || `Milestone ${i+1}`}: $${Number(m.amount || 0).toLocaleString()} USD</li>`
                    ).join('')}
                  </ul>
                ` : `
                  <p style="margin-bottom: 8px;"><strong>Payment Schedule:</strong> The total fee will be paid in ${paymentSchedule.length} payment(s) as follows:</p>
                  <ul style="margin-left: 16px; list-style-type: disc; margin-bottom: 12px;">
                    ${paymentSchedule.map((amt: number, idx: number) => 
                      `<li style="margin-bottom: 4px;">Payment ${idx + 1}: $${amt.toLocaleString()} USD</li>`
                    ).join('')}
                  </ul>
                `}
              ` : `
                <p style="margin-bottom: 12px;"><strong>Payment Schedule:</strong> Full payment due upon project completion.</p>
              `}
              <p style="margin-bottom: 8px;">Client agrees to pay invoices by the due date shown on each invoice.</p>
              ${terms.includeLateFee ? `
                <p style="margin-bottom: 8px;">Late payments may incur a ${terms.lateFee}% fee after ${terms.lateDays || 15} days overdue.</p>
              ` : ''}
              <p>Ownership of deliverables transfers to Client only after full payment has been received.</p>
            </div>
          </div>

          <!-- 3. Revisions & Changes -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              3️⃣ Revisions & Changes
            </h2>
            <div style="color: #374151; line-height: 1.75;">
              <p style="margin-bottom: 8px;">This agreement includes ${terms.revisionCount || 2} revision(s) per deliverable.</p>
              ${terms.includeHourlyClause ? `
                <p>Additional revisions or changes in scope will be billed at $${terms.hourlyRate || 150} USD per hour or a mutually agreed rate.</p>
              ` : ''}
            </div>
          </div>

          <!-- 4. Intellectual Property -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              4️⃣ Intellectual Property
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 8px;">After full payment:</p>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Client owns final approved deliverables.</li>
              <li>Freelancer retains the right to display completed work for portfolio and marketing purposes, unless Client requests otherwise in writing.</li>
            </ul>
          </div>

          <!-- 5. Confidentiality -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              5️⃣ Confidentiality
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Freelancer will not share or disclose Client's confidential information without written consent.</li>
              <li>Client will not share Freelancer's proprietary methods or materials without consent.</li>
            </ul>
          </div>

          <!-- 6. Termination -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              6️⃣ Termination
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Either party may end this Agreement with written notice.</li>
              <li style="margin-bottom: 8px;">Client agrees to pay for all work completed up to the termination date.</li>
              <li>Deposits and completed milestone payments are non-refundable once work has begun.</li>
            </ul>
          </div>

          <!-- 7. Liability -->
          <div style="margin-bottom: 32px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 12px; font-family: Georgia, serif;">
              7️⃣ Liability
            </h2>
            <ul style="margin-left: 16px; list-style-type: disc; color: #374151;">
              <li style="margin-bottom: 8px;">Freelancer provides services in good faith but cannot guarantee specific results or outcomes.</li>
              <li>Freelancer's total liability is limited to the amount Client has paid under this Agreement.</li>
            </ul>
          </div>

          <!-- 8. Acceptance & Signatures -->
          <div style="border-top: 1px solid ${branding.accentColor || '#6366F1'}; padding-top: 48px; margin-top: 48px;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin-bottom: 16px; font-family: Georgia, serif;">
              8️⃣ Acceptance & Signatures
            </h2>
            <p style="color: #374151; line-height: 1.75; margin-bottom: 24px;">
              By signing below, both parties agree to the terms of this Agreement.<br />
              Typing your full legal name acts as your electronic signature.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px;">
              <!-- Service Provider Signature -->
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Service Provider</div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                  <div style="font-size: 14px; color: #111827;">${terms.yourName || "Your Name"}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                  <div style="font-size: 14px; color: #111827;">
                    ${terms.yourSignatureDate ? new Date(terms.yourSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                  <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                    ${terms.yourName || "Your Name"}
                  </div>
                </div>
              </div>

              <!-- Client Signature -->
              <div>
                <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 16px;">Client</div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Name:</div>
                  <div style="font-size: 14px; color: #111827;">${client.name || "Client Name"}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Date:</div>
                  <div style="font-size: 14px; color: #111827;">
                    ${terms.clientSignatureDate ? new Date(terms.clientSignatureDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '_______________'}
                  </div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #4b5563; margin-bottom: 4px;">Signature:</div>
                  ${clientHasSigned ? `
                    <div style="font-size: 24px; color: #111827; font-family: 'Dancing Script', cursive;">
                      ${terms.clientSignatureName}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>{contract.name}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto min-h-0 p-12">
          <div dangerouslySetInnerHTML={{ __html: generateContractHTML(contract) }} />
          
          <JolixFooter planTier={account?.plan_tier} />
        </div>
        <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

