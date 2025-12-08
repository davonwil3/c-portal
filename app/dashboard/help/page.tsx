"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CircleHelp,
  Sparkles,
  Mail,
} from "lucide-react"
import { GuidedToursPage } from "@/components/help/GuidedToursPage"

export default function HelpPage() {
  const [showGuidedTours, setShowGuidedTours] = useState(false)

  // Show Guided Tours page if requested
  if (showGuidedTours) {
    return (
      <DashboardLayout>
        <GuidedToursPage onBack={() => setShowGuidedTours(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3C3CFF]/10 mb-4">
            <CircleHelp className="h-8 w-8 text-[#3C3CFF]" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">How can we help?</h1>
          <p className="text-lg text-gray-600">
            Get answers to your questions and learn how to make the most of Jolix
          </p>
        </div>

        {/* Help Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 max-w-md mx-auto">
          <Card 
            className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
            onClick={() => setShowGuidedTours(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Guided Tours</h3>
              <p className="text-sm text-gray-600">Step-by-step walkthroughs</p>
            </CardContent>
          </Card>
        </div>

        {/* Email Support Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              window.location.href = "mailto:support@jolix.io?subject=Support Request"
            }}
            variant="outline"
            className="border-2 border-[#3C3CFF] text-[#3C3CFF] hover:bg-[#3C3CFF] hover:text-white transition-all duration-200 px-6 py-6 h-auto"
          >
            <Mail className="h-5 w-5 mr-2" />
            <span className="font-semibold">Email Support</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

