"use client"

export const dynamic = 'force-dynamic'

import { useRouter } from "next/navigation"
import { TemplateSelector } from "../components/TemplateSelector"
import { buildAuraMockData, buildMinimalistMockData, buildShiftMockData, buildInnovateMockData } from "../data/mockData"

export default function SelectTemplatePage() {
  const router = useRouter()

  const handleSelectTemplate = (templateId: string) => {
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

