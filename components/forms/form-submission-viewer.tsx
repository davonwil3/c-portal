"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Calendar, User, Mail } from "lucide-react"

interface FormSubmissionViewerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission: any
}

export function FormSubmissionViewer({
  open,
  onOpenChange,
  submission
}: FormSubmissionViewerProps) {
  if (!submission) return null

  const formatResponseValue = (field: any) => {
    if (field.response_value === null || field.response_value === undefined) {
      return <span className="text-gray-400 italic">No response</span>
    }

    if (Array.isArray(field.response_value)) {
      return field.response_value.join(', ')
    }

    return String(field.response_value)
  }

  const getFieldTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'text': 'Text Input',
      'email': 'Email',
      'tel': 'Phone',
      'url': 'URL',
      'textarea': 'Text Area',
      'select': 'Dropdown',
      'radio': 'Radio Buttons',
      'checkbox': 'Checkboxes',
      'number': 'Number',
      'date': 'Date'
    }
    return typeMap[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Form Submission - {submission.form_title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Submission Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Submitted by:</span>
                  <span className="font-medium">{submission.respondent_name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Submitted:</span>
                  <span className="font-medium">
                    {new Date(submission.completed_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600">Completion:</span>
                  <Badge variant="outline" className="text-green-600">
                    {submission.completion_percentage?.toFixed(1) || 0}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Description */}
          {submission.form_description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Form Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{submission.form_description}</p>
              </CardContent>
            </Card>
          )}

          {/* Form Instructions */}
          {submission.form_instructions && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{submission.form_instructions}</p>
              </CardContent>
            </Card>
          )}

          {/* Form Responses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Form Responses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {submission.detailed_responses?.map((field: any, index: number) => (
                  <div key={field.field_id || index} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 flex items-center gap-2">
                          {field.field_label}
                          {field.field_required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                        </h4>
                        {field.field_description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {field.field_description}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="text-sm text-gray-500">
                            Type: {getFieldTypeLabel(field.field_type)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-gray-900">
                        {formatResponseValue(field)}
                      </div>
                    </div>
                    
                    {field.field_options && field.field_options.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Available options: {field.field_options.join(', ')}
                      </div>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <p>No detailed responses available</p>
                    <p className="text-sm">This submission may have been created before detailed tracking was implemented.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {submission.total_fields || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Fields</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {submission.completed_fields || 0}
                  </div>
                  <div className="text-sm text-gray-600">Completed Fields</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {submission.completion_percentage?.toFixed(1) || 0}%
                  </div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
