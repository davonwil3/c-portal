"use client"

import React from "react"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/dashboard/layout"
import { FindLeadsSection } from "@/components/lead-workflow/FindLeadsSection"
import { ManageLeadsSection } from "@/components/lead-workflow/ManageLeadsSection"
import { ProposalsSection } from "@/components/lead-workflow/ProposalsSection"
import { FormsSection } from "@/components/lead-workflow/FormsSection"
import { 
  Search, 
  UserPlus,
  FileText,
  CheckCircle,
  ArrowRight,
  ClipboardList
} from "lucide-react"

// Lead Workflow Steps
const leadWorkflowSteps = [
  {
    id: "find-leads",
    title: "Find Leads",
    description: "Discover and import potential clients",
    icon: Search,
    stepNumber: 1
  },
  {
    id: "forms",
    title: "Forms",
    description: "Capture leads and collect details",
    icon: ClipboardList,
    stepNumber: 2
  },
  {
    id: "manage-leads", 
    title: "Manage Leads",
    description: "Track and convert leads to clients",
    icon: UserPlus,
    stepNumber: 3
  },
  {
    id: "proposals",
    title: "Proposals",
    description: "Create and send professional proposals",
    icon: FileText,
    stepNumber: 4
  }
]

// Step Navigation Component
function StepNavigation({ activeStep, onStepChange }: { activeStep: string, onStepChange: (step: string) => void }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-8">
          {leadWorkflowSteps.map((step, index) => {
            const Icon = step.icon
            const isActive = activeStep === step.id
            const isCompleted = leadWorkflowSteps.findIndex(s => s.id === activeStep) > index
            
            return (
              <div key={step.id} className="flex items-center space-x-4">
                <button
                  data-help={step.id === "find-leads" ? "tab-find-leads" : step.id === "forms" ? "tab-forms" : step.id === "manage-leads" ? "tab-manage-leads" : step.id === "proposals" ? "tab-proposals" : undefined}
                  onClick={() => onStepChange(step.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] text-white shadow-lg' 
                      : isCompleted
                      ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive 
                      ? 'bg-white/20' 
                      : isCompleted
                      ? 'bg-green-100'
                      : 'bg-gray-200'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                        {step.stepNumber}. {step.title}
                      </span>
                      {isCompleted && !isActive && (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      )}
                    </div>
                    <p className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                      {step.description}
                    </p>
                  </div>
                </button>
                
                {index < leadWorkflowSteps.length - 1 && (
                  <ArrowRight className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-gray-300'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function LeadWorkflowPage() {
  const [activeStep, setActiveStep] = useState<string>("find-leads")
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const active = searchParams?.get("active")
    if (active && ["find-leads", "forms", "manage-leads", "proposals"].includes(active)) {
      setActiveStep(active)
    }
  }, [searchParams])

  const handleStepChange = (stepId: string) => {
    setActiveStep(stepId)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <h1 className="text-4xl font-bold mb-2">
              Lead Workflow 🎯
            </h1>
            <p className="text-blue-100 text-lg">
              Your step-by-step system for discovering, tracking, and converting leads into paying clients
            </p>
          </div>
        </div>

        {/* Step Navigation */}
        <StepNavigation activeStep={activeStep} onStepChange={handleStepChange} />

        {/* Render Active Step Content */}
        {activeStep === "find-leads" && <FindLeadsSection />}
        {activeStep === "forms" && <FormsSection />}
        {activeStep === "manage-leads" && <ManageLeadsSection />}
        {activeStep === "proposals" && <ProposalsSection />}
      </div>
    </DashboardLayout>
  )
}

