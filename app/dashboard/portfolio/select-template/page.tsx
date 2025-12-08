"use client"

export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation"
import { TemplateSelector } from "../components/TemplateSelector"
import { buildAuraMockData, buildMinimalistMockData, buildShiftMockData, buildInnovateMockData } from "../data/mockData"
import { useTour } from "@/contexts/TourContext"

export default function SelectTemplatePage() {
  const router = useRouter()
  const { isTourRunning, currentTour } = useTour()

  const handleSelectTemplate = (templateId: string) => {
    // During tour, allow navigation but won't actually change template (handled in customize page)
    // Store the selected template choice, then navigate to customize
    // The customize page will load the appropriate template based on this
    router.push(`/dashboard/portfolio/customize?template=${templateId}`)
  }

  const handleBack = () => {
    router.push('/dashboard/portfolio')
  }

  return (
    <div className="min-h-screen bg-white">
      <TemplateSelector
        currentTemplate=""
        onSelectTemplate={handleSelectTemplate}
        onBack={handleBack}
      />
    </div>
  )
}

