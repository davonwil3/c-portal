import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { type Form, type FormField } from "@/lib/forms"

interface FormPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  form: Form | null
}

const getFieldIcon = (type: string) => {
  switch (type) {
    case "short-text":
      return Type
    case "paragraph":
      return AlignLeft
    case "email":
      return Mail
    case "phone":
      return Phone
    case "dropdown":
      return ChevronDown
    case "multiple-choice":
      return CheckSquare
    case "checkbox":
      return Square
    case "file-upload":
      return Upload
    case "signature":
      return PenTool
    case "rating":
      return Star
    default:
      return Type
  }
}

export function FormPreviewModal({ open, onOpenChange, form }: FormPreviewModalProps) {
  if (!form) return null

  // Extract fields from form structure
  const fields: FormField[] = form.form_structure?.fields || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Form Preview</DialogTitle>
          <div className="text-sm text-gray-600">This is how your form appears to users</div>
        </DialogHeader>
        
        <div className="py-6">
          {/* Form Header */}
          <div className="text-center mb-8 pb-6 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600 mb-2">{form.description}</p>
            )}
            {form.instructions && (
              <p className="text-sm text-gray-500">{form.instructions}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {fields.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Type className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No fields added yet</h3>
                <p className="text-gray-600">This form doesn't have any fields</p>
              </div>
            ) : (
              fields.map((field, index) => {
                const Icon = getFieldIcon(field.type)
                
                return (
                  <div key={field.id} className="space-y-3">
                    {/* Field Label */}
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium text-gray-900">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                    </div>
                    
                    {/* Field Description */}
                    {field.description && (
                      <div className="text-sm text-gray-600">{field.description}</div>
                    )}
                    
                    {/* Field Input */}
                    <div>
                      {field.type === "short-text" && (
                        <Input 
                          placeholder={field.placeholder} 
                          className="max-w-md"
                        />
                      )}
                      
                      {field.type === "paragraph" && (
                        <Textarea 
                          placeholder={field.placeholder} 
                          rows={4}
                          className="max-w-md resize-none"
                        />
                      )}
                      
                      {field.type === "email" && (
                        <Input 
                          type="email" 
                          placeholder="Enter email address" 
                          className="max-w-md"
                        />
                      )}
                      
                      {field.type === "phone" && (
                        <Input 
                          type="tel" 
                          placeholder="Enter phone number" 
                          className="max-w-md"
                        />
                      )}
                      
                      {field.type === "date" && (
                        <Input 
                          type="date" 
                          className="max-w-md"
                        />
                      )}
                      
                      {field.type === "dropdown" && field.options && (
                        <select className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:border-transparent">
                          <option value="">Select an option</option>
                          {field.options.map((option, idx) => (
                            <option key={idx} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                      
                      {field.type === "multiple-choice" && field.options && (
                        <div className="space-y-2 max-w-md">
                          {field.options.map((option, idx) => (
                            <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input type="radio" name={`field-${field.id}`} className="w-4 h-4 text-[#3C3CFF] border-gray-300 focus:ring-[#3C3CFF]" />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === "checkbox" && field.options && (
                        <div className="space-y-2 max-w-md">
                          {field.options.map((option, idx) => (
                            <label key={idx} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 text-[#3C3CFF] border-gray-300 rounded focus:ring-[#3C3CFF]" />
                              <span className="text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      
                      {field.type === "rating" && (
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button key={star} className="text-gray-300 hover:text-yellow-400 transition-colors">
                              <Star className="h-6 w-6" />
                            </button>
                          ))}
                          <span className="ml-3 text-sm text-gray-500">Click to rate</span>
                        </div>
                      )}
                      
                      {field.type === "file-upload" && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                          <Upload className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                          <div className="text-sm font-medium text-gray-700 mb-2">Click to upload or drag and drop</div>
                          <div className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</div>
                        </div>
                      )}
                      
                      {field.type === "signature" && (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer">
                          <PenTool className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                          <div className="text-sm font-medium text-gray-700 mb-2">Click to sign</div>
                          <div className="text-xs text-gray-500">Draw your signature in the box above</div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Form Footer */}
          {fields.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <Button variant="outline">Cancel</Button>
                <Button className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
                  Submit Form
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 