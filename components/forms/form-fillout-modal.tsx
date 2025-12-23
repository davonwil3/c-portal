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
import { useState } from "react"
import { toast } from "sonner"
import { JolixFooter } from "@/components/JolixFooter"

interface FormFilloutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form | null
  account?: Account | null
  client?: any
  onSubmit?: () => void
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

export function FormFilloutModal({ open, onOpenChange, form, account, client, onSubmit }: FormFilloutModalProps) {
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate required fields
      const requiredFields = fields.filter((f: any) => f.required)
      const missingFields = requiredFields.filter((f: any) => !formResponses[f.id] || (Array.isArray(formResponses[f.id]) && formResponses[f.id].length === 0))
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields`)
        setIsSubmitting(false)
        return
      }

      // Submit form
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formId: form.id,
          responses: formResponses,
          respondentName: client?.firstName && client?.lastName 
            ? `${client.firstName} ${client.lastName}` 
            : 'Client',
          respondentEmail: client?.email || ''
        })
      })

      if (response.ok) {
        toast.success('Form submitted successfully!')
        setFormResponses({})
        onOpenChange(false)
        if (onSubmit) onSubmit()
      } else {
        toast.error('Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Error submitting form')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open)
      if (!open) setFormResponses({})
    }}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Fill Out Form</DialogTitle>
          <div className="text-sm text-gray-600">Please complete all required fields</div>
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
                            onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})}
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
                            onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})}
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
                            onValueChange={(value) => setFormResponses({...formResponses, [field.id]: value})}
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
                                        setFormResponses({...formResponses, [field.id]: [...current, option]})
                                      } else {
                                        setFormResponses({...formResponses, [field.id]: current.filter((v: string) => v !== option)})
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
                            onValueChange={(value) => setFormResponses({...formResponses, [field.id]: value})}
                          >
                            {field.options.map((option: string, optIdx: number) => (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <RadioGroupItem value={option} id={`${field.id}-${optIdx}`} />
                                <Label htmlFor={`${field.id}-${optIdx}`} className="text-sm text-gray-700 font-normal cursor-pointer">{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                        )}
                        
                        {/* Number */}
                        {field.type === 'number' && (
                          <Input 
                            id={field.id}
                            type="number"
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})}
                            placeholder={field.placeholder || 'Enter number'}
                            required={field.required}
                            className="w-full"
                          />
                        )}
                        
                        {/* Date */}
                        {field.type === 'date' && (
                          <Input 
                            id={field.id}
                            type="date"
                            value={formResponses[field.id] || ''}
                            onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})}
                            required={field.required}
                            className="w-full"
                          />
                        )}
                        
                        {/* File Upload */}
                        {(['file-upload', 'file'].includes(field.type)) && (
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                            <Input 
                              type="file"
                              className="mt-2"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setFormResponses({...formResponses, [field.id]: file.name})
                                }
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Signature */}
                        {field.type === 'signature' && (
                          <div className="space-y-3 max-w-md">
                            <div className="border-2 border-gray-200 rounded-md p-3 bg-white flex items-center justify-center">
                              {!formResponses[field.id] ? (
                                <div className="text-center py-2">
                                  <PenTool className="h-5 w-5 text-gray-400 mx-auto mb-1" />
                                  <div className="text-sm text-gray-600">Type your full legal name below</div>
                                </div>
                              ) : (
                                <div className="text-center py-2 w-full">
                                  <div 
                                    className="text-2xl md:text-3xl text-gray-900"
                                    style={{ fontFamily: "'Dancing Script', cursive", lineHeight: 1.15 }}
                                  >
                                    {formResponses[field.id]}
                                  </div>
                                </div>
                              )}
                            </div>
                            <Input
                              placeholder="Type your full legal name"
                              value={formResponses[field.id] || ''}
                              onChange={(e) => setFormResponses({...formResponses, [field.id]: e.target.value})}
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500">
                              By typing your name above, you agree that this constitutes a legal signature
                            </p>
                          </div>
                        )}
                        
                        {/* Rating */}
                        {field.type === 'rating' && (
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`h-6 w-6 cursor-pointer transition-colors ${
                                  formResponses[field.id] >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                }`}
                                onClick={() => setFormResponses({...formResponses, [field.id]: star})}
                              />
                            ))}
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

              {/* Powered by Jolix Footer */}
              <div className="px-8">
                <JolixFooter planTier={account?.plan_tier} />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => {
              onOpenChange(false)
              setFormResponses({})
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            style={{ backgroundColor: brandColor }}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Form'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 

