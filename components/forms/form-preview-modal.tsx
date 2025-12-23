"use client"

// Import Google Font for signature
if (typeof document !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&display=swap'
  link.rel = 'stylesheet'
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link)
  }
}

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  ChevronDown,
  CheckSquare,
  Square,
  Upload,
  PenTool,
  Star,
  Image as ImageIcon,
} from "lucide-react"
import { type Form } from "@/lib/forms"
import { type Account } from "@/lib/auth"
import Image from "next/image"
import { JolixFooter } from "@/components/JolixFooter"

interface FormPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form | null
  account?: Account | null
  submission?: any // Optional submission data to show filled values
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "short-text":
    case "text":
      return Type
    case "paragraph":
    case "textarea":
      return AlignLeft
    case "email":
      return Mail
    case "tel":
    case "phone":
      return Phone
    case "dropdown":
    case "select":
      return ChevronDown
    case "multiple-choice":
    case "radio":
      return CheckSquare
    case "checkbox":
      return Square
    case "file-upload":
    case "file":
      return Upload
    case "signature":
      return PenTool
    case "rating":
      return Star
    default:
      return Type
  }
}

export function FormPreviewModal({ open, onOpenChange, form, account, submission }: FormPreviewModalProps) {
  // If submission is provided, use its responses, otherwise use empty values
  const responses = submission?.responses || {}
  
  if (!form) return null

  const fields = form.form_structure?.fields || []
  const formStructure = form.form_structure || {}
  const brandColor = formStructure.brand_color || "#3C3CFF"
  const logoUrl = formStructure.logo_url || account?.logo_url || ""
  const companyName = formStructure.company_name || account?.company_name || "Your Company"
  const companyAddress = formStructure.company_address || account?.address || ""
  const companyPhone = formStructure.company_phone || account?.phone || ""
  const companyEmail = formStructure.company_email || account?.email || ""
  const formDate = formStructure.form_date || new Date().toISOString().split('T')[0]
  const footerLine1 = formStructure.footer_line1 || "Thank you for taking the time to complete this form."
  const footerLine2 = formStructure.footer_line2 || "We will review your submission and get back to you soon."
  
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {submission ? "Form Submission" : "Form Preview"}
          </DialogTitle>
          <div className="text-sm text-gray-600">
            {submission ? "View your completed form submission" : "This is how your form will appear to users"}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-6">
          {/* Professional Form Document */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Company Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                {/* Logo and Company Info */}
                <div className="flex items-start space-x-6">
                  {/* Logo */}
                  {logoUrl && (
                    <div className="flex-shrink-0">
                      <img 
                        src={logoUrl} 
                        alt="Company Logo" 
                        className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  
                  {/* Company Details */}
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
                
                {/* Form Date */}
                <div className="text-right text-sm">
                  <div className="text-gray-500 mb-1">Form Date:</div>
                  <div className="font-medium text-gray-900">{formatDateDisplay(formDate)}</div>
                </div>
              </div>
            </div>
            
            {/* Form Content */}
            <div className="px-8 py-8">
              {/* Form Title and Description */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
                {form.instructions && (
                  <p className="text-gray-600 mb-4 max-w-2xl mx-auto leading-relaxed">
                    {form.instructions}
                  </p>
                )}
                <div className="w-24 h-1 mx-auto rounded-full" style={{ backgroundColor: brandColor }}></div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                {fields.map((field: any, idx: number) => {
                  const FieldIcon = getFieldIcon(field.type)
                  const value = responses[field.id]
                  
                  return (
                    <div key={field.id || idx} className="border-b border-gray-100 pb-6 last:border-b-0">
                      <div className="flex items-start space-x-3 mb-3">
                        <FieldIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <Label className="text-base font-semibold text-gray-900">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {field.description && (
                            <p className="text-sm text-gray-600 mt-1">{field.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-8">
                        {/* Text inputs - Read-only */}
                        {(['short-text', 'text', 'email', 'tel', 'phone', 'url'].includes(field.type)) && (
                          <Input 
                            id={field.id}
                            type={field.type === 'email' ? 'email' : field.type === 'tel' || field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
                            value={value || ''}
                            disabled
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            className="w-full bg-gray-50 cursor-not-allowed"
                          />
                        )}
                        
                        {/* Textarea - Read-only */}
                        {(['paragraph', 'textarea'].includes(field.type)) && (
                          <Textarea 
                            id={field.id}
                            value={value || ''}
                            disabled
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            rows={4}
                            className="w-full bg-gray-50 cursor-not-allowed"
                          />
                        )}
                        
                        {/* Dropdown/Select - Read-only */}
                        {(['dropdown', 'select'].includes(field.type)) && field.options && (
                          <Select 
                            value={value || ''}
                            disabled
                          >
                            <SelectTrigger className="w-full bg-gray-50 cursor-not-allowed">
                              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {field.options.map((option: string, optIdx: number) => (
                                <SelectItem key={optIdx} value={option}>{option}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        
                        {/* Checkboxes - Read-only */}
                        {field.type === 'checkbox' && field.options && (
                          <div className="space-y-2">
                            {field.options.map((option: string, optIdx: number) => {
                              const currentValues = Array.isArray(value) ? value : []
                              const isChecked = currentValues.includes(option)
                              return (
                                <div key={optIdx} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`${field.id}-${optIdx}`}
                                    checked={isChecked}
                                    disabled
                                  />
                                  <Label htmlFor={`${field.id}-${optIdx}`} className="text-sm text-gray-700 font-normal">{option}</Label>
                                </div>
                              )
                            })}
                          </div>
                        )}
                        
                        {/* Radio/Multiple Choice - Read-only */}
                        {(['radio', 'multiple-choice'].includes(field.type)) && field.options && (
                          <RadioGroup 
                            value={value || ''} 
                            disabled
                          >
                            {field.options.map((option: string, optIdx: number) => (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${field.id}-${optIdx}`} disabled />
                                <Label htmlFor={`${field.id}-${optIdx}`} className="text-sm text-gray-700 font-normal">{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        
                        {/* Number - Read-only */}
                        {field.type === 'number' && (
                          <Input 
                            id={field.id}
                            type="number"
                            value={value || ''}
                            disabled
                            placeholder={field.placeholder || 'Enter number'}
                            className="w-full bg-gray-50 cursor-not-allowed"
                          />
                        )}
                        
                        {/* Date - Read-only */}
                        {field.type === 'date' && (
                          <Input 
                            id={field.id}
                            type="date"
                            value={value || ''}
                            disabled
                            className="w-full bg-gray-50 cursor-not-allowed"
                          />
                        )}
                        
                        {/* File Upload - Read-only */}
                        {(['file-upload', 'file'].includes(field.type)) && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                            {value ? (
                              <div className="space-y-2">
                                {Array.isArray(value) ? (
                                  value.map((file: any, fileIdx: number) => (
                                    <div key={fileIdx} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                      <Upload className="h-4 w-4" />
                                      <span>{file.name || file || `File ${fileIdx + 1}`}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                    <Upload className="h-4 w-4" />
                                    <span>{value.name || value}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm text-gray-500">No file uploaded</p>
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Signature - Read-only */}
                        {field.type === 'signature' && (
                          <div className="space-y-3 max-w-md">
                            <div className="border-2 border-gray-200 rounded-md p-3 bg-white flex items-center justify-center">
                              {value ? (
                                <div className="text-center py-2 w-full">
                                  {typeof value === 'string' && value.startsWith('data:image') ? (
                                    <img src={value} alt="Signature" className="max-w-xs border border-gray-300 rounded" />
                                  ) : (
                                    <div 
                                      className="text-2xl md:text-3xl text-gray-900"
                                      style={{ fontFamily: "'Dancing Script', cursive", lineHeight: 1.15 }}
                                    >
                                      {value}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-center py-2">
                                  <PenTool className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                                  <div className="text-sm text-gray-600">No signature</div>
                                </div>
                              )}
                            </div>
                            <Input
                              placeholder="Type your full legal name"
                              value={value || ''}
                              disabled
                              className="w-full bg-gray-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500">
                              By typing your name above, you agree that this constitutes a legal signature
                            </p>
                          </div>
                        )}
                        
                        {/* Rating - Read-only */}
                        {field.type === 'rating' && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-6 w-6 ${
                                  value && star <= Number(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                            {value && <span className="ml-2 text-sm text-gray-600">({value}/5)</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Form Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600 mb-2">{footerLine1}</p>
                <p className="text-sm text-gray-600">{footerLine2}</p>
              </div>

              {/* Powered by Jolix Footer - Free Plan Only */}
              <div className="px-8">
                <JolixFooter planTier={account?.plan_tier} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
