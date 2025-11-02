"use client"

import { useEffect } from 'react'
import type { PortfolioData } from '@/app/dashboard/portfolio/types'
import { PortfolioPreview } from '@/app/dashboard/portfolio/components/PortfolioPreview'

interface PublicPortfolioClientProps {
  domain: string
  data: PortfolioData
}

export function PublicPortfolioClient({ domain, data }: PublicPortfolioClientProps) {
  useEffect(() => {
    const increment = async () => {
      try {
        await fetch('/api/portfolios/increment-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ domain })
        })
      } catch (err) {
        console.error('Error incrementing view:', err)
      }
    }
    if (domain) increment()
  }, [domain, data])

  return (
    <PortfolioPreview
      data={data}
      editMode={false}
      onDataChange={() => {}}
      onManageServices={() => {}}
      onManageProjects={() => {}}
      onManageTestimonials={() => {}}
    />
  )
}


