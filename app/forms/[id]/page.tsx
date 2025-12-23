"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
  CheckCircle,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import type { Form } from "@/lib/forms"
import type { LeadForm } from "@/lib/lead-forms"
import { JolixFooter } from "@/components/JolixFooter"

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

export default function FormPage() {
  const params = useParams()
  const formId = params.id as string
  const [form, setForm] = useState<Form | LeadForm | null>(null)
  const [loading, setLoading] = useState(true)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [planTier, setPlanTier] = useState<string>('free')

  useEffect(() => {
    loadForm()
  }, [formId])

  const loadForm = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Try to get from lead_forms first
      let { data: leadForm, error: leadError } = await supabase
        .from('lead_forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'published')
        .single()

      if (leadForm && !leadError) {
        setForm(leadForm as LeadForm)
        
        // Fetch account plan tier
        const { data: accountData } = await supabase
          .from('accounts')
          .select('plan_tier')
          .eq('id', leadForm.account_id)
          .single()
        
        if (accountData?.plan_tier) {
          setPlanTier(accountData.plan_tier)
        }
        
        setLoading(false)
        return
      }

      // If not found, try forms table
      const { data: regularForm, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('status', 'published')
        .single()

      if (regularForm && !formError) {
        setForm(regularForm as Form)
        
        // Fetch account plan tier
        const { data: accountData } = await supabase
          .from('accounts')
          .select('plan_tier')
          .eq('id', regularForm.account_id)
          .single()
        
        if (accountData?.plan_tier) {
          setPlanTier(accountData.plan_tier)
        }
      } else {
        toast.error('Form not found or not published')
      }
    } catch (error) {
      console.error('Error loading form:', error)
      toast.error('Failed to load form')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form) return

    try {
      setIsSubmitting(true)

      const fields = form.form_structure?.fields || []
      const requiredFields = fields.filter((f: any) => f.required)
      const missingFields = requiredFields.filter(
        (f: any) => !formResponses[f.id] || (Array.isArray(formResponses[f.id]) && formResponses[f.id].length === 0)
      )

      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields')
        setIsSubmitting(false)
        return
      }

      // Determine which API endpoint to use based on form type
      const isLeadForm = 'form_type' in form
      const endpoint = isLeadForm ? '/api/forms/submit' : '/api/forms/submit'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          responses: formResponses,
          formType: isLeadForm ? 'lead' : 'regular',
        }),
      })

      if (response.ok) {
        toast.success('Form submitted successfully!')
        setHasSubmitted(true)
        setFormResponses({})
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Error submitting form')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#3C3CFF] mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">This form doesn't exist or is not available.</p>
        </div>
      </div>
    )
  }

  const fields = form.form_structure?.fields || []
  const formStructure = form.form_structure || {}
  const brandColor = formStructure.brand_color || "#3C3CFF"
  const logoUrl = formStructure.logo_url || ""
  const companyName = formStructure.company_name || "Your Company"
  const companyAddress = formStructure.company_address || ""
  const companyPhone = formStructure.company_phone || ""
  const companyEmail = formStructure.company_email || ""
  const formDate = formStructure.form_date || new Date().toISOString().split('T')[0]
  const footerLine1 = formStructure.footer_line1 || "Thank you for taking the time to complete this form."
  const footerLine2 = formStructure.footer_line2 || "We will review your submission and get back to you soon."

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
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
            {hasSubmitted ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
                <p className="text-lg text-gray-600 mb-4">{footerLine1}</p>
                <p className="text-gray-600">{footerLine2}</p>
              </div>
            ) : (
              <>
                {/* Form Title and Description */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{form.title}</h1>
                  {form.description && (
                    <p className="text-gray-600 mb-2">{form.description}</p>
                  )}
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
                          {/* Text inputs */}
                          {(['short-text', 'text', 'email', 'tel', 'phone', 'url'].includes(field.type)) && (
                            <Input
                              id={field.id}
                              type={field.type === 'email' ? 'email' : field.type === 'tel' || field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text'}
                              value={formResponses[field.id] || ''}
                              onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              required={field.required}
                              className="w-full"
                            />
                          )}

                          {/* Textarea */}
                          {(['paragraph', 'textarea'].includes(field.type)) && (
                            <Textarea
                              id={field.id}
                              value={formResponses[field.id] || ''}
                              onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                              rows={4}
                              required={field.required}
                              className="w-full"
                            />
                          )}

                          {/* Dropdown/Select */}
                          {(['dropdown', 'select'].includes(field.type)) && field.options && (
                            <Select
                              value={formResponses[field.id] || ''}
                              onValueChange={(value) => setFormResponses({ ...formResponses, [field.id]: value })}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((option: string, optIdx: number) => (
                                  <SelectItem key={optIdx} value={option}>{option}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}

                          {/* Checkboxes */}
                          {field.type === 'checkbox' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option: string, optIdx: number) => {
                                const currentValues = Array.isArray(formResponses[field.id]) ? formResponses[field.id] : []
                                const isChecked = currentValues.includes(option)
                                return (
                                  <div key={optIdx} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${field.id}-${optIdx}`}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        const current = Array.isArray(formResponses[field.id]) ? formResponses[field.id] : []
                                        if (checked) {
                                          setFormResponses({ ...formResponses, [field.id]: [...current, option] })
                                        } else {
                                          setFormResponses({ ...formResponses, [field.id]: current.filter((v: string) => v !== option) })
                                        }
                                      }}
                                    />
                                    <Label htmlFor={`${field.id}-${optIdx}`} className="text-sm text-gray-700 font-normal cursor-pointer">{option}</Label>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          {/* Radio/Multiple Choice */}
                          {(['radio', 'multiple-choice'].includes(field.type)) && field.options && (
                            <RadioGroup
                              value={formResponses[field.id] || ''}
                              onValueChange={(value) => setFormResponses({ ...formResponses, [field.id]: value })}
                            >
                              {field.options.map((option: string, optIdx: number) => (
                                <div key={optIdx} className="flex items-center space-x-2">
                                  <RadioGroupItem value={option} id={`${field.id}-${optIdx}`} />
                                  <Label htmlFor={`${field.id}-${optIdx}`} className="text-sm text-gray-700 font-normal cursor-pointer">{option}</Label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}

                          {/* Date */}
                          {field.type === 'date' && (
                            <Input
                              id={field.id}
                              type="date"
                              value={formResponses[field.id] || ''}
                              onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                              required={field.required}
                              className="w-full"
                            />
                          )}

                          {/* Rating */}
                          {field.type === 'rating' && (
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  type="button"
                                  onClick={() => setFormResponses({ ...formResponses, [field.id]: rating })}
                                  className={`p-2 rounded transition-colors ${
                                    formResponses[field.id] >= rating
                                      ? 'text-yellow-400'
                                      : 'text-gray-300 hover:text-yellow-300'
                                  }`}
                                >
                                  <Star className="h-6 w-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Budget */}
                          {field.type === 'budget' && (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">$</span>
                              <Input
                                id={field.id}
                                type="number"
                                value={formResponses[field.id] || ''}
                                onChange={(e) => setFormResponses({ ...formResponses, [field.id]: e.target.value })}
                                placeholder="0.00"
                                required={field.required}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Submit Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-6 text-lg"
                    style={{ backgroundColor: brandColor }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Form'
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Powered by Jolix Footer */}
            <JolixFooter planTier={planTier} />
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 text-center text-sm text-gray-600">
            <p>{footerLine1}</p>
            <p className="mt-1">{footerLine2}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
