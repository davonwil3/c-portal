"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, CheckCircle, Edit } from "lucide-react"
import { hasFormBeenSubmitted, type Form, type FormSubmission } from "@/lib/forms"
import { JolixFooter } from "@/components/JolixFooter"

interface FormFillingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form | null
  clientEmail?: string
  clientName?: string
  onFormSubmitted?: () => void
  account?: any
}

export function FormFillingModal({
  open,
  onOpenChange,
  form,
  clientEmail,
  clientName,
  onFormSubmitted,
  account
}: FormFillingModalProps) {
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [existingSubmission, setExistingSubmission] = useState<FormSubmission | null>(null)

  // Load existing submission when form changes
  useEffect(() => {
    if (form && clientEmail) {
      checkExistingSubmission()
    }
  }, [form, clientEmail])

  const checkExistingSubmission = async () => {
    if (!form || !clientEmail) return

    try {
      const submitted = await hasFormBeenSubmitted(form.id, clientEmail)
      setHasSubmitted(submitted)
      
      if (submitted) {
        // Load existing submission data
        // This would need to be implemented to get the actual submission data
        // For now, we'll just show that it's been submitted
      }
    } catch (error) {
      console.error('Error checking existing submission:', error)
    }
  }

  const handleInputChange = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
  }

  const handleSubmit = async () => {
    if (!form) return

    // Validate required fields
    const fields = form.form_structure?.fields || []
    const requiredFields = fields.filter(field => field.required)
    const missingFields = requiredFields.filter(field => !responses[field.id])

    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`)
      return
    }

    try {
      setSubmitting(true)
      
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formId: form.id,
          responses,
          respondentName: clientName,
          respondentEmail: clientEmail
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit form')
      }

      toast.success('Form submitted successfully!')
      setHasSubmitted(true)
      onFormSubmitted?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: any) => {
    const fieldId = field.id
    const value = responses[fieldId] || ''

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'url':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={fieldId}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        )

      case 'textarea':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Textarea
              id={fieldId}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              required={field.required}
              rows={4}
            />
          </div>
        )

      case 'select':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Select value={value} onValueChange={(val) => handleInputChange(fieldId, val)}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case 'radio':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <RadioGroup value={value} onValueChange={(val) => handleInputChange(fieldId, val)}>
              {field.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${fieldId}-${index}`} />
                  <Label htmlFor={`${fieldId}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case 'checkbox':
        return (
          <div key={fieldId} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <div className="space-y-2">
              {field.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${fieldId}-${index}`}
                    checked={value.includes ? value.includes(option) : false}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (checked) {
                        handleInputChange(fieldId, [...currentValues, option])
                      } else {
                        handleInputChange(fieldId, currentValues.filter((v: string) => v !== option))
                      }
                    }}
                  />
                  <Label htmlFor={`${fieldId}-${index}`}>{option}</Label>
                </div>
              ))}
            </div>
          </div>
        )

      case 'number':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={fieldId}
              type="number"
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        )

      case 'date':
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={fieldId}
              type="date"
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        )

      default:
        return (
          <div key={fieldId} className="space-y-2">
            <Label htmlFor={fieldId}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={fieldId}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleInputChange(fieldId, e.target.value)}
              required={field.required}
            />
          </div>
        )
    }
  }

  if (!form) return null

  const fields = form.form_structure?.fields || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasSubmitted ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                {form.title} - Submitted
              </>
            ) : (
              <>
                <Edit className="h-5 w-5" />
                {form.title}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {form.description && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{form.description}</p>
            </div>
          )}

          {form.instructions && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Instructions</h4>
              <p className="text-blue-800">{form.instructions}</p>
            </div>
          )}

          {hasSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Form Already Submitted</h3>
              <p className="text-gray-600 mb-4">
                You have already submitted this form. If you need to make changes, please contact the form administrator.
              </p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {fields.map((field) => renderField(field))}
            </div>
          )}

          {/* Powered by Jolix Footer */}
          <JolixFooter planTier={account?.plan_tier} />
        </div>

        {!hasSubmitted && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Form'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
