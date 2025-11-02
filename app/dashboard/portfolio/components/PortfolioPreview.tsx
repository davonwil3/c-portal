"use client"

import type { PortfolioData } from "../types"
import { AuraTemplate } from "./AuraTemplate"
import { MinimalistTemplate } from "./MinimalistTemplate"
import { ShiftTemplate } from "./ShiftTemplate"
import { InnovateTemplate } from "./InnovateTemplate"

interface PortfolioPreviewProps {
  data: PortfolioData
  editMode: boolean
  onDataChange: (data: Partial<PortfolioData>) => void
  onManageServices: () => void
  onManageProjects: () => void
  onManageTestimonials: () => void
}

export function PortfolioPreview({
  data,
  editMode,
  onDataChange,
  onManageServices,
  onManageProjects,
  onManageTestimonials
}: PortfolioPreviewProps) {
  // Get the selected template from data (default to 'aura')
  const selectedTemplate = data.appearance?.layoutStyle || 'aura'

  // Render the appropriate template
  if (selectedTemplate === 'minimalist') {
    return (
      <MinimalistTemplate
        data={data}
        editMode={editMode}
        onDataChange={onDataChange}
        onManageServices={onManageServices}
        onManageProjects={onManageProjects}
        onManageTestimonials={onManageTestimonials}
      />
    )
  }

  if (selectedTemplate === 'shift') {
    return (
      <ShiftTemplate
        data={data}
        editMode={editMode}
        onDataChange={onDataChange}
        onManageServices={onManageServices}
        onManageProjects={onManageProjects}
        onManageTestimonials={onManageTestimonials}
      />
    )
  }

  if (selectedTemplate === 'innovate') {
    return (
      <InnovateTemplate
        data={data}
        editMode={editMode}
        onDataChange={onDataChange}
        onManageServices={onManageServices}
        onManageProjects={onManageProjects}
        onManageTestimonials={onManageTestimonials}
      />
    )
  }

  // Default to Aura template
  return (
    <AuraTemplate
      data={data}
      editMode={editMode}
      onDataChange={onDataChange}
      onManageServices={onManageServices}
      onManageProjects={onManageProjects}
      onManageTestimonials={onManageTestimonials}
    />
  )
}
