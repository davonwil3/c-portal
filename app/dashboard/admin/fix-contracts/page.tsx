"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardLayout } from "@/components/dashboard/layout"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function FixContractsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message?: string
    updates?: Array<{ id: string; oldStatus: string; newStatus: string }>
    error?: string
  } | null>(null)

  const handleFixStatuses = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch('/api/contracts/fix-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        if (data.updates && data.updates.length > 0) {
          toast.success(`Fixed ${data.updates.length} contract(s)`)
        } else {
          toast.info('All contracts are already correctly status-coded')
        }
      } else {
        setResult({ success: false, error: data.error || 'Failed to fix statuses' })
        toast.error(data.error || 'Failed to fix statuses')
      }
    } catch (error) {
      console.error('Error fixing statuses:', error)
      setResult({ success: false, error: 'An unexpected error occurred' })
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8">
        <Card>
          <CardHeader>
            <CardTitle>Fix Contract Statuses</CardTitle>
            <CardDescription>
              This utility will scan all your contracts and update their status based on actual signature data.
              Use this if you notice contracts showing incorrect status (e.g., "Awaiting Signature" when both parties have signed).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What this does:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Checks all non-draft contracts in your account</li>
                    <li>Compares the status field with actual signature statuses</li>
                    <li>Updates status to "signed" if both parties signed</li>
                    <li>Updates status to "partially_signed" if only one party signed</li>
                    <li>Updates status to "awaiting_signature" if no signatures but status says signed</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleFixStatuses}
              disabled={loading}
              className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fixing Statuses...
                </>
              ) : (
                'Fix Contract Statuses'
              )}
            </Button>

            {result && (
              <div className={`rounded-lg p-4 ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium mb-2 ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.success ? 'Success!' : 'Error'}
                    </p>
                    <p className={`text-sm mb-3 ${
                      result.success ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {result.message || result.error}
                    </p>
                    
                    {result.updates && result.updates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Updated Contracts:
                        </p>
                        <div className="bg-white rounded border border-green-200 divide-y divide-green-100">
                          {result.updates.map((update) => (
                            <div key={update.id} className="p-3 text-sm">
                              <div className="font-mono text-xs text-gray-600 mb-1">
                                Contract ID: {update.id.slice(0, 8)}...
                              </div>
                              <div className="text-green-700">
                                Changed from <span className="font-semibold">{update.oldStatus}</span> to <span className="font-semibold">{update.newStatus}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}

