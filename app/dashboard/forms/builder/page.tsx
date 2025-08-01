"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Type,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Square,
  Calendar,
  Upload,
  PenTool,
  Star,
  Mail,
  Phone,
  GripVertical,
  Trash2,
  Eye,
  Save,
  Zap,
  Rocket,
  Plus,
  ChevronRight,
  Settings,
  Loader2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Field types
const basicFields = [
  { id: "short-text", name: "Short Text", icon: Type, description: "Single line text input" },
  { id: "paragraph", name: "Paragraph", icon: AlignLeft, description: "Multi-line text area" },
  { id: "dropdown", name: "Dropdown", icon: ChevronDown, description: "Select from options" },
  { id: "multiple-choice", name: "Multiple Choice", icon: CheckSquare, description: "Radio buttons" },
  { id: "checkbox", name: "Checkbox", icon: Square, description: "Multiple selections" },
  { id: "date", name: "Date Picker", icon: Calendar, description: "Date selection" },
  { id: "file-upload", name: "File Upload", icon: Upload, description: "File attachment" },
  { id: "signature", name: "Signature", icon: PenTool, description: "Digital signature" },
]

const advancedFields = [
  { id: "rating", name: "Rating", icon: Star, description: "Star or number rating" },
  { id: "email", name: "Email", icon: Mail, description: "Email validation" },
  { id: "phone", name: "Phone", icon: Phone, description: "Phone number input" },
]

interface FormField {
  id: string
  type: string
  label: string
  description?: string
  required: boolean
  placeholder?: string
  options?: string[]
  settings?: Record<string, any>
}

export default function FormBuilderPage() {
  const searchParams = useSearchParams()
  const [formTitle, setFormTitle] = useState("Untitled Form")
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date>(new Date())
  const [draggedField, setDraggedField] = useState<string | null>(null)

  // Initialize form data from URL parameters
  useEffect(() => {
    const title = searchParams.get('title')
    if (title) {
      setFormTitle(title)
    }
  }, [searchParams])

  // Auto-save simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAutoSaving(true)
      setTimeout(() => {
        setIsAutoSaving(false)
        setLastSaved(new Date())
      }, 1000)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const addField = (fieldType: any) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: fieldType.id,
      label: fieldType.name,
      required: false,
      placeholder: `Enter ${fieldType.name.toLowerCase()}...`,
      options:
        fieldType.id === "dropdown" || fieldType.id === "multiple-choice" || fieldType.id === "checkbox"
          ? ["Option 1", "Option 2", "Option 3"]
          : undefined,
    }
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
  }

  const deleteField = (fieldId: string) => {
    setFields(fields.filter((field) => field.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    setFields(newFields)
  }

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault()
    if (!draggedField) return

    const draggedIndex = fields.findIndex((f) => f.id === draggedField)
    const targetIndex = fields.findIndex((f) => f.id === targetFieldId)

    if (draggedIndex !== -1 && targetIndex !== -1) {
      moveField(draggedIndex, targetIndex)
    }
    setDraggedField(null)
  }

  const getFieldIcon = (type: string) => {
    const allFields = [...basicFields, ...advancedFields]
    const field = allFields.find((f) => f.id === type)
    return field?.icon || Type
  }

  const selectedFieldData = fields.find((f) => f.id === selectedField)

  const handleSaveTemplate = () => {
    // Save template logic here
    console.log("Saving template:", { templateName, templateDescription, fields })
    setShowSaveTemplate(false)
    setTemplateName("")
    setTemplateDescription("")
  }

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/dashboard/forms" className="text-gray-600 hover:text-gray-900">
                      Forms
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-gray-900 font-medium">{formTitle}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              <div className="flex items-center text-sm text-gray-500">
                {isAutoSaving ? (
                  <div className="flex items-center">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Check className="h-3 w-3 text-green-500 mr-1" />
                    All changes saved
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Draft
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowSaveTemplate(true)}>
                <Zap className="h-4 w-4 mr-2" />
                Save as Template
              </Button>
              <Button className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90" size="sm">
                <Rocket className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Field Library */}
          <div className="w-80 border-r bg-gray-50 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Add a Field</h2>

              {/* Basic Fields */}
              <div className="space-y-2 mb-6">
                {basicFields.map((field) => {
                  const Icon = field.icon
                  return (
                    <Card
                      key={field.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => addField(field)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{field.name}</div>
                            <div className="text-sm text-gray-500">{field.description}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Advanced Fields Toggle */}
              <div className="mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-between p-0 h-auto text-gray-700 hover:text-gray-900"
                >
                  <span className="font-medium">Advanced Fields</span>
                  <ChevronRight className={cn("h-4 w-4 transition-transform", showAdvanced && "rotate-90")} />
                </Button>
              </div>

              {/* Advanced Fields */}
              {showAdvanced && (
                <div className="space-y-2">
                  {advancedFields.map((field) => {
                    const Icon = field.icon
                    return (
                      <Card
                        key={field.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => addField(field)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{field.name}</div>
                              <div className="text-sm text-gray-500">{field.description}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Center - Form Canvas */}
          <div className="flex-1 overflow-y-auto bg-white">
            <div className="max-w-2xl mx-auto p-8">
              {/* Form Title */}
              <div className="mb-8">
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="text-2xl font-bold border-none p-0 focus-visible:ring-0 bg-transparent"
                  placeholder="Enter form title..."
                />
              </div>

              {/* Form Fields */}
              {fields.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-gray-500 mb-2">Start building your form by adding fields on the left</div>
                  <div className="text-sm text-gray-400">Drag and drop or click to add fields</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const Icon = getFieldIcon(field.type)
                    const isSelected = selectedField === field.id

                    return (
                      <Card
                        key={field.id}
                        className={cn("cursor-pointer transition-all", isSelected && "ring-2 ring-[#3C3CFF] shadow-md")}
                        onClick={() => setSelectedField(field.id)}
                        draggable
                        onDragStart={(e) => handleDragStart(e, field.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, field.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex items-center space-x-2">
                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                              <Icon className="h-4 w-4 text-gray-600" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <Input
                                  value={field.label}
                                  onChange={(e) => updateField(field.id, { label: e.target.value })}
                                  className="font-medium border-none p-0 focus-visible:ring-0 bg-transparent"
                                  placeholder="Field label"
                                />
                                <div className="flex items-center space-x-2">
                                  {field.required && (
                                    <Badge variant="secondary" className="text-xs">
                                      Required
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      deleteField(field.id)
                                    }}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              {field.description && (
                                <div className="text-sm text-gray-500 mb-2">{field.description}</div>
                              )}

                              {/* Field Preview */}
                              <div className="mt-2">
                                {field.type === "short-text" && <Input placeholder={field.placeholder} disabled />}
                                {field.type === "paragraph" && (
                                  <Textarea placeholder={field.placeholder} disabled rows={3} />
                                )}
                                {(field.type === "dropdown" ||
                                  field.type === "multiple-choice" ||
                                  field.type === "checkbox") &&
                                  field.options && (
                                    <div className="space-y-2">
                                      {field.options.map((option, idx) => (
                                        <div key={idx} className="flex items-center space-x-2">
                                          {field.type === "multiple-choice" && (
                                            <div className="w-4 h-4 border border-gray-300 rounded-full" />
                                          )}
                                          {field.type === "checkbox" && (
                                            <div className="w-4 h-4 border border-gray-300 rounded" />
                                          )}
                                          <span className="text-sm text-gray-600">{option}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                {field.type === "date" && <Input type="date" disabled />}
                                {field.type === "file-upload" && (
                                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <Upload className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                                    <div className="text-sm text-gray-500">Click to upload or drag and drop</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Field Settings */}
          {selectedFieldData && (
            <div className="w-80 border-l bg-gray-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <Settings className="h-5 w-5 text-gray-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Field Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Field Label */}
                  <div>
                    <Label htmlFor="field-label" className="text-sm font-medium text-gray-700 mb-2 block">
                      Field Label
                    </Label>
                    <Input
                      id="field-label"
                      value={selectedFieldData.label}
                      onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                      placeholder="Enter field label"
                    />
                  </div>

                  {/* Field Description */}
                  <div>
                    <Label htmlFor="field-description" className="text-sm font-medium text-gray-700 mb-2 block">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="field-description"
                      value={selectedFieldData.description || ""}
                      onChange={(e) => updateField(selectedFieldData.id, { description: e.target.value })}
                      placeholder="Add helpful text for this field"
                      rows={3}
                    />
                  </div>

                  {/* Required Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Required Field</Label>
                      <div className="text-xs text-gray-500 mt-1">Users must fill this field</div>
                    </div>
                    <Switch
                      checked={selectedFieldData.required}
                      onCheckedChange={(checked) => updateField(selectedFieldData.id, { required: checked })}
                    />
                  </div>

                  {/* Placeholder Text */}
                  {(selectedFieldData.type === "short-text" || selectedFieldData.type === "paragraph") && (
                    <div>
                      <Label htmlFor="field-placeholder" className="text-sm font-medium text-gray-700 mb-2 block">
                        Placeholder Text
                      </Label>
                      <Input
                        id="field-placeholder"
                        value={selectedFieldData.placeholder || ""}
                        onChange={(e) => updateField(selectedFieldData.id, { placeholder: e.target.value })}
                        placeholder="Enter placeholder text"
                      />
                    </div>
                  )}

                  {/* Options for dropdown/multiple choice/checkbox */}
                  {(selectedFieldData.type === "dropdown" ||
                    selectedFieldData.type === "multiple-choice" ||
                    selectedFieldData.type === "checkbox") && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Options</Label>
                      <div className="space-y-2">
                        {selectedFieldData.options?.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...(selectedFieldData.options || [])]
                                newOptions[index] = e.target.value
                                updateField(selectedFieldData.id, { options: newOptions })
                              }}
                              placeholder={`Option ${index + 1}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOptions = selectedFieldData.options?.filter((_, i) => i !== index)
                                updateField(selectedFieldData.id, { options: newOptions })
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newOptions = [
                              ...(selectedFieldData.options || []),
                              `Option ${(selectedFieldData.options?.length || 0) + 1}`,
                            ]
                            updateField(selectedFieldData.id, { options: newOptions })
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Sticky Footer */}
        <div className="md:hidden border-t bg-white p-4">
          <div className="flex space-x-3">
            <Button variant="outline" className="flex-1 bg-transparent">
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button className="flex-1 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90">
              <Rocket className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Form Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <h2 className="text-2xl font-bold">{formTitle}</h2>
            {fields.map((field) => {
              const Icon = getFieldIcon(field.type)
              return (
                <div key={field.id} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-gray-600" />
                    <Label className="font-medium">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                  </div>
                  {field.description && <div className="text-sm text-gray-600">{field.description}</div>}
                  {field.type === "short-text" && <Input placeholder={field.placeholder} />}
                  {field.type === "paragraph" && <Textarea placeholder={field.placeholder} rows={3} />}
                  {field.type === "date" && <Input type="date" />}
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save as Template Modal */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save This Form as a Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="template-name" className="text-sm font-medium text-gray-700 mb-2 block">
                Template Name *
              </Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Client Onboarding Template"
              />
            </div>
            <div>
              <Label htmlFor="template-description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description (Optional)
              </Label>
              <Textarea
                id="template-description"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe when to use this template..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="bg-[#3C3CFF] hover:bg-[#3C3CFF]/90"
            >
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
