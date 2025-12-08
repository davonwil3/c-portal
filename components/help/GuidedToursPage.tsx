"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Sparkles,
  Play,
  Clock,
  Target,
  BookOpen,
  Zap,
} from "lucide-react"
import { useTour } from "@/contexts/TourContext"
import actionsData from "@/lib/help/actions.json"

type Tour = {
  id: string
  title: string
  keywords: string[]
  steps: any[]
}

// Tour descriptions and logical ordering
const tourDescriptions: Record<string, string> = {
  "find-leads": "Learn how to discover new business opportunities that match your services.",
  "manage-leads": "Learn how to organize and track your lead pipeline.",
  "forms": "Learn how to create custom forms to capture leads and project information.",
  "clients": "Learn how to add and manage your client relationships.",
  "projects": "Learn how to set up and track client projects from start to finish.",
  "contracts": "Learn how to create professional contracts for your clients.",
  "tasks": "Learn how to organize project work with tasks and to-do lists.",
  "portals": "Learn how to set up client portals for seamless collaboration.",
  "create-invoice": "Learn how to generate and send professional invoices quickly.",
  "create-service": "Learn how to define the services you offer to clients.",
  "time-tracking": "Learn how to track time spent on projects and view timesheets.",
  "calendar": "Learn how to manage your schedule, bookings, and availability.",
  "messages": "Learn how to communicate with clients through messages and email.",
  "proposals": "Learn how to create winning proposals for potential clients.",
  "portfolio": "Learn how to showcase your work with a professional portfolio.",
  "grow": "Learn how to build your brand with content strategy and AI tools.",
  "automations": "Learn how to automate repetitive tasks and workflows."
}

// Logical tour ordering
const tourOrder = [
  "find-leads",
  "manage-leads",
  "forms",
  "clients",
  "projects",
  "contracts",
  "tasks",
  "portals",
  "create-invoice",
  "create-service",
  "time-tracking",
  "calendar",
  "messages",
  "proposals",
  "portfolio",
  "grow",
  "automations"
]

export function GuidedToursPage({ onBack }: { onBack: () => void }) {
  const [tours, setTours] = useState<Tour[]>([])
  const { startTour } = useTour()

  useEffect(() => {
    // Load tours from lib/help/actions.json
    setTours(actionsData as Tour[])
  }, [])

  // Sort tours according to logical order
  const sortedTours = useMemo(() => {
    const tourMap = new Map(tours.map(tour => [tour.id, tour]))
    return tourOrder
      .map(id => tourMap.get(id))
      .filter((tour): tour is Tour => tour !== undefined)
      .concat(tours.filter(tour => !tourOrder.includes(tour.id)))
  }, [tours])

  const handleStartTour = async (tourId: string) => {
    try {
      console.log('Starting tour:', tourId)
      // Start the tour first
      await startTour(tourId)
      console.log('Tour started successfully')
      // Wait a moment to ensure tour state is set, then close the tours page
      setTimeout(() => {
        onBack()
      }, 100)
    } catch (error) {
      console.error('Error starting tour:', error)
    }
  }

  const getStepCount = (steps: any[]) => {
    return steps.filter(step => step.type === "hint").length
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help
        </Button>
      </div>

      {/* Page Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#3C3CFF] to-[#6366F1] mb-4">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Guided Tours</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Step-by-step walkthroughs to help you master Jolix. Follow along and learn how to use key features.
        </p>
      </div>

      {/* Tours Grid */}
      {tours.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tours available</h3>
            <p className="text-gray-600">Check back soon for new guided tours!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTours.map((tour) => {
            const stepCount = getStepCount(tour.steps)
            const description = tourDescriptions[tour.id] || `Learn how to ${tour.title.toLowerCase()} with our interactive step-by-step guide.`

            return (
              <Card
                key={tour.id}
                className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden"
              >
                <CardContent className="p-6">
                  {/* Icon and Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-[#3C3CFF]/10 rounded-xl flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-[#3C3CFF]" />
                    </div>
                    <Badge variant="outline" className="bg-[#3C3CFF]/10 text-[#3C3CFF] border-[#3C3CFF]/20">
                      {stepCount} steps
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#3C3CFF] transition-colors">
                    {tour.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-6 line-clamp-3">
                    {description}
                  </p>

                  {/* Start Button */}
                  <Button
                    onClick={() => handleStartTour(tour.id)}
                    className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Tour
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Info Section */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-[#3C3CFF]/5 to-purple-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#3C3CFF]/10 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-[#3C3CFF]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">How Guided Tours Work</h3>
              <p className="text-sm text-gray-600 mb-4">
                Each tour will guide you through a specific feature or workflow. You can pause, skip steps, or exit at any time. Tours are interactive and will highlight the relevant parts of the interface as you go.
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>2-5 minutes</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  <span>Interactive</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

