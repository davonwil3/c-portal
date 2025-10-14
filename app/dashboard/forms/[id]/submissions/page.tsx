"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Calendar, User, Mail, CheckCircle } from "lucide-react"
import { getForm, getFormSubmissionsForForm } from "@/lib/forms"

export default function FormSubmissionsPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string

  const [form, setForm] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [formId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load form details
      const formData = await getForm(formId)
      setForm(formData)

      // Load submissions
      const submissionsData = await getFormSubmissionsForForm(formId)
      setSubmissions(submissionsData)
    } catch (error) {
      console.error('Error loading form submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatResponseValue = (field: any) => {
    if (field.response_value === null || field.response_value === undefined) {
      return <span className="text-gray-400 italic">No response</span>
    }

    if (Array.isArray(field.response_value)) {
      return field.response_value.join(', ')
    }

    return String(field.response_value)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!form) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Form Not Found</h2>
          <p className="text-gray-600 mb-4">The form you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/dashboard/forms')}>
            Back to Forms
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/forms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{form.title} - Submission</h1>
            <p className="text-gray-600 mt-1">
              {submissions.length > 0 ? 'Form submission received' : 'No submission yet'}
            </p>
          </div>
        </div>

        {/* Form Info */}
        <Card>
          <CardHeader>
            <CardTitle>Form Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Form Title</p>
                <p className="font-medium text-lg">{form.title}</p>
              </div>
              {form.description && (
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="text-gray-900">{form.description}</p>
                </div>
              )}
              {form.instructions && (
                <div>
                  <p className="text-sm text-gray-600">Instructions</p>
                  <p className="text-gray-900">{form.instructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Submissions */}
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">No one has submitted this form yet.</p>
              </CardContent>
            </Card>
          ) : (
            submissions.map((submission, index) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Form Submission
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-700">
                      {submission.completion_percentage?.toFixed(1) || 0}% Complete
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {submission.respondent_name || 'Anonymous'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(submission.completed_at).toLocaleString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {submission.detailed_responses?.map((field: any, fieldIndex: number) => (
                      <div key={field.field_id || fieldIndex} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {field.field_label}
                            {field.field_required && (
                              <Badge variant="destructive" className="ml-2 text-xs">
                                Required
                              </Badge>
                            )}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {field.field_type}
                          </span>
                        </div>
                        {field.field_description && (
                          <p className="text-sm text-gray-600">
                            {field.field_description}
                          </p>
                        )}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-gray-900">
                            {formatResponseValue(field)}
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        <p>No detailed responses available</p>
                        <p className="text-sm">This submission may have been created before detailed tracking was implemented.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
