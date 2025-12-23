"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileSpreadsheet, Check, X, Loader2, AlertCircle } from "lucide-react"
import { createLead, type Lead } from "@/lib/leads"
import { getStatusNames } from "@/lib/pipeline-stages"
import { toast } from "sonner"

interface ImportLeadsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImportComplete: () => void
}

interface ParsedRow {
  name?: string
  company?: string
  email?: string
  phone?: string
  value?: string
  notes?: string
  [key: string]: string | undefined
}

interface ColumnMapping {
  csvColumn: string
  leadField: string
}

const LEAD_FIELDS = [
  { value: 'name', label: 'Name' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'value', label: 'Lead Value' },
  { value: 'notes', label: 'Notes' },
  { value: 'ignore', label: 'Ignore' },
]

export function ImportLeadsModal({ open, onOpenChange, onImportComplete }: ImportLeadsModalProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<ParsedRow[]>([])
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
  const [importProgress, setImportProgress] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [errorCount, setErrorCount] = useState(0)
  const [defaultStatus, setDefaultStatus] = useState<string>(getStatusNames()[0] || "New")
  const [defaultSource, setDefaultSource] = useState<Lead['source']>("Manual Import")

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    
    // Parse CSV
    try {
      const text = await selectedFile.text()
      const rows = text.split('\n').filter(row => row.trim())
      
      if (rows.length < 2) {
        toast.error('CSV file must have a header row and at least one data row')
        return
      }

      // Parse headers
      const headers = parseCSVRow(rows[0])
      setCsvHeaders(headers)

      // Parse data rows
      const data: ParsedRow[] = []
      for (let i = 1; i < Math.min(rows.length, 101); i++) { // Limit to 100 rows + header
        const values = parseCSVRow(rows[i])
        const row: ParsedRow = {}
        headers.forEach((header, index) => {
          row[header] = values[index]?.trim() || ''
        })
        data.push(row)
      }
      setCsvData(data)

      // Auto-detect column mappings
      const autoMappings = autoDetectColumns(headers)
      setColumnMappings(autoMappings)
      
      setStep('mapping')
      toast.success(`Loaded ${data.length} rows from CSV`)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      toast.error('Failed to parse CSV file')
    }
  }

  const parseCSVRow = (row: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < row.length; i++) {
      const char = row[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const autoDetectColumns = (headers: string[]): Record<string, string> => {
    const mappings: Record<string, string> = {}
    
    headers.forEach(header => {
      const lower = header.toLowerCase()
      
      // Name detection
      if ((lower.includes('name') || lower.includes('contact') || lower.includes('lead')) 
          && !lower.includes('company') && !lower.includes('first') && !lower.includes('last')) {
        mappings[header] = 'name'
      }
      // First/Last name combined
      else if (lower.includes('first') && lower.includes('name')) {
        mappings[header] = 'name'
      }
      // Company detection
      else if (lower.includes('company') || lower.includes('organization') || lower.includes('business')) {
        mappings[header] = 'company'
      }
      // Email detection
      else if (lower.includes('email') || lower.includes('e-mail')) {
        mappings[header] = 'email'
      }
      // Phone detection
      else if (lower.includes('phone') || lower.includes('tel') || lower.includes('mobile') || lower.includes('cell')) {
        mappings[header] = 'phone'
      }
      // Value detection
      else if (lower.includes('value') || lower.includes('amount') || lower.includes('budget') || lower.includes('price')) {
        mappings[header] = 'value'
      }
      // Notes detection
      else if (lower.includes('note') || lower.includes('comment') || lower.includes('description') || lower.includes('message')) {
        mappings[header] = 'notes'
      }
      // Default to ignore
      else {
        mappings[header] = 'ignore'
      }
    })

    return mappings
  }

  const handleImport = async () => {
    setStep('importing')
    setImportedCount(0)
    setErrorCount(0)

    const validRows = csvData.filter(row => {
      // Must have at least name or email
      const name = getFieldValue(row, 'name')
      const email = getFieldValue(row, 'email')
      return name || email
    })

    if (validRows.length === 0) {
      toast.error('No valid rows found. Each row must have at least a name or email.')
      setStep('mapping')
      return
    }

    let imported = 0
    let errors = 0

    for (let i = 0; i < validRows.length; i++) {
      try {
        const row = validRows[i]
        const name = getFieldValue(row, 'name') || getFieldValue(row, 'email') || 'Unknown'
        const company = getFieldValue(row, 'company')
        const email = getFieldValue(row, 'email')
        const phone = getFieldValue(row, 'phone')
        const valueStr = getFieldValue(row, 'value')
        const notes = getFieldValue(row, 'notes')

        const leadData = {
          name,
          company: company || undefined,
          email: email || undefined,
          phone: phone || undefined,
          value: valueStr ? parseFloat(valueStr.replace(/[^0-9.-]/g, '')) : undefined,
          notes: notes || undefined,
          source: defaultSource,
          status: defaultStatus as Lead['status'],
          social_media: {},
        }

        await createLead(leadData)
        imported++
        setImportedCount(imported)
        setImportProgress((imported / validRows.length) * 100)
      } catch (error) {
        console.error('Error importing row:', error)
        errors++
        setErrorCount(errors)
      }
    }

    setStep('complete')
    
    if (errors === 0) {
      toast.success(`Successfully imported ${imported} leads!`)
    } else {
      toast.warning(`Imported ${imported} leads with ${errors} errors`)
    }
  }

  const getFieldValue = (row: ParsedRow, field: string): string | undefined => {
    // Find the CSV column that maps to this field
    const csvColumn = Object.keys(columnMappings).find(key => columnMappings[key] === field)
    if (!csvColumn) return undefined
    return row[csvColumn]
  }

  const handleClose = () => {
    setFile(null)
    setStep('upload')
    setCsvHeaders([])
    setCsvData([])
    setColumnMappings({})
    setImportProgress(0)
    setImportedCount(0)
    setErrorCount(0)
    onOpenChange(false)
  }

  const handleComplete = () => {
    handleClose()
    onImportComplete()
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Leads from CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="py-8">
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Status</Label>
                  <Select value={defaultStatus} onValueChange={setDefaultStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getStatusNames().map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Source</Label>
                  <Select value={defaultSource} onValueChange={(v) => setDefaultSource(v as Lead['source'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead Engine">Lead Engine</SelectItem>
                      <SelectItem value="Portfolio">Portfolio</SelectItem>
                      <SelectItem value="Website form">Website form</SelectItem>
                      <SelectItem value="Social">Social</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Manual Import">Manual Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#3C3CFF] transition-colors cursor-pointer"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {file ? file.name : 'Click to select CSV file'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                CSV should include columns like: Name, Email, Company, Phone, etc.
              </p>
              <Button 
                type="button" 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  document.getElementById('csv-upload')?.click()
                }}
                className="cursor-pointer"
              >
                Choose File
              </Button>
            </div>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-6 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Review and adjust column mappings
                  </p>
                  <p className="text-sm text-blue-700">
                    We've automatically detected the fields. Verify the mappings are correct before importing.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Column Mappings</Label>
              {csvHeaders.map((header) => (
                <div key={header} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{header}</p>
                    <p className="text-xs text-gray-500">
                      Sample: {csvData[0]?.[header] || '(empty)'}
                    </p>
                  </div>
                  <div className="w-48">
                    <Select
                      value={columnMappings[header] || 'ignore'}
                      onValueChange={(value) => setColumnMappings({ ...columnMappings, [header]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_FIELDS.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Preview:</strong> {csvData.length} rows will be imported as leads with status "<strong>{defaultStatus}</strong>" and source "<strong>{defaultSource}</strong>".
              </p>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-12 space-y-6">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="h-16 w-16 animate-spin text-[#3C3CFF] mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Importing leads...</p>
              <p className="text-sm text-gray-600">
                {importedCount} of {csvData.length} leads imported
              </p>
              <div className="w-full max-w-md mt-4 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-[#3C3CFF] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="py-12 space-y-6">
            <div className="flex flex-col items-center justify-center">
              {errorCount === 0 ? (
                <>
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Import Complete!</p>
                  <p className="text-sm text-gray-600">
                    Successfully imported {importedCount} leads
                  </p>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-yellow-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 mb-2">Import Completed with Errors</p>
                  <p className="text-sm text-gray-600">
                    Successfully imported {importedCount} leads
                  </p>
                  <p className="text-sm text-red-600">
                    {errorCount} leads failed to import
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}
          
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
                onClick={handleImport}
                disabled={!Object.values(columnMappings).includes('name') && !Object.values(columnMappings).includes('email')}
              >
                Import {csvData.length} Leads
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              onClick={handleComplete}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
