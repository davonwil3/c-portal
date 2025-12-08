"use client"

import React, { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface TourStep {
  target: string
  content: string
  placement?: "top" | "bottom" | "left" | "right" | "auto"
}

interface TourOverlayProps {
  steps: TourStep[]
  currentStep: number
  isRunning: boolean
  isNavigating?: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onClose: () => void
}

export function TourOverlay({
  steps,
  currentStep,
  isRunning,
  isNavigating = false,
  onNext,
  onBack,
  onSkip,
  onClose,
}: TourOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [placement, setPlacement] = useState<"top" | "bottom" | "left" | "right">("bottom")
  const [hasOpenModal, setHasOpenModal] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const currentStepData = steps[currentStep]

  // Check for open modals periodically
  useEffect(() => {
    if (!isRunning) return

    const checkModal = () => {
      const modal = document.querySelector('[role="dialog"][data-state="open"]') ||
                   document.querySelector('[data-help="lead-picker-modal"]')
      setHasOpenModal(!!modal)
    }

    // Check immediately
    checkModal()

    // Check periodically
    const interval = setInterval(checkModal, 200)

    // Also listen for mutations
    const observer = new MutationObserver(checkModal)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state'] })

    return () => {
      clearInterval(interval)
      observer.disconnect()
    }
  }, [isRunning, currentStep])

  // Disable user scroll when tour is running (but allow programmatic scroll)
  useEffect(() => {
    if (isRunning) {
      // Store original overflow value
      const originalOverflow = document.body.style.overflow
      
      // Prevent user scrolling with overflow hidden
      document.body.style.overflow = "hidden"
      
      // Prevent scroll on wheel events
      const preventScroll = (e: WheelEvent) => {
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Prevent scroll on touch events (mobile)
      const preventTouchScroll = (e: TouchEvent) => {
        if (e.touches.length > 1) return // Allow pinch zoom
        e.preventDefault()
        e.stopPropagation()
      }
      
      // Prevent keyboard scrolling
      const preventKeyScroll = (e: KeyboardEvent) => {
        const scrollKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' ']
        if (scrollKeys.includes(e.key)) {
          e.preventDefault()
        }
      }
      
      window.addEventListener("wheel", preventScroll, { passive: false })
      window.addEventListener("touchmove", preventTouchScroll, { passive: false })
      window.addEventListener("keydown", preventKeyScroll)
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalOverflow
        window.removeEventListener("wheel", preventScroll)
        window.removeEventListener("touchmove", preventTouchScroll)
        window.removeEventListener("keydown", preventKeyScroll)
      }
    }
  }, [isRunning])

  useEffect(() => {
    if (!isRunning || !currentStepData || isNavigating) return

    const element = document.querySelector(currentStepData.target) as HTMLElement
    if (!element) {
      // Try again after a short delay
      const timer = setTimeout(() => {
        const retryElement = document.querySelector(currentStepData.target) as HTMLElement
        if (retryElement) {
          setTargetElement(retryElement)
        }
      }, 100)
      return () => clearTimeout(timer)
    }

    setTargetElement(element)

    // Scroll element into view if needed (programmatic scroll is allowed)
    const scrollIntoView = () => {
      const rect = element.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const viewportWidth = window.innerWidth
      
      // Check if element top is visible with some padding (for tooltip space)
      const topPadding = 120 // Space from top for tooltip
      const bottomPadding = 100 // Minimum space at bottom
      const sidePadding = 20
      const isFullyVisible = 
        rect.top >= topPadding &&
        rect.left >= sidePadding &&
        rect.bottom <= viewportHeight - bottomPadding &&
        rect.right <= viewportWidth - sidePadding
      
      if (!isFullyVisible) {
        // Scroll so element top is near the top of viewport with padding
        const currentScrollY = window.scrollY || window.pageYOffset
        const currentScrollX = window.scrollX || window.pageXOffset
        const elementTop = rect.top + currentScrollY
        const elementLeft = rect.left + currentScrollX
        
        // Calculate target scroll position: element top minus padding
        const targetScrollY = elementTop - topPadding
        const targetScrollX = elementLeft - sidePadding
        
        window.scrollTo({
          top: Math.max(0, targetScrollY),
          left: Math.max(0, targetScrollX),
          behavior: 'smooth'
        })
      }
    }
    
    // Scroll into view immediately, then again after elements settle
    scrollIntoView()
    setTimeout(scrollIntoView, 100)
    setTimeout(scrollIntoView, 300)

    const updatePosition = () => {
      // Get the bounding rect in viewport coordinates (for fixed positioning)
      const rect = element.getBoundingClientRect()
      
      // Use viewport coordinates for fixed positioning based on target element bounds only
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })

      // Calculate tooltip position based on placement
      // Use actual tooltip dimensions if available, otherwise use estimates
      const tooltipWidth = tooltipRef.current?.offsetWidth || 384 // max-w-sm = 384px
      const tooltipHeight = tooltipRef.current?.offsetHeight || 250 // Estimate based on content
      const spacing = 16

      let tooltipTop = 0
      let tooltipLeft = 0
      let finalPlacement: "top" | "bottom" | "left" | "right" = "bottom"

      const stepPlacement = currentStepData.placement || "auto"

      // Use viewport coordinates (rect is already in viewport coords)
      if (stepPlacement === "auto" || stepPlacement === "bottom") {
        // Try bottom first
        if (rect.bottom + spacing + tooltipHeight < window.innerHeight) {
          tooltipTop = rect.bottom + spacing
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
          finalPlacement = "bottom"
        } else if (rect.top - spacing - tooltipHeight > 0) {
          // Try top
          tooltipTop = rect.top - spacing - tooltipHeight
          tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
          finalPlacement = "top"
        } else {
          // Fallback to right
          tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
          tooltipLeft = rect.right + spacing
          finalPlacement = "right"
        }
      } else {
        finalPlacement = stepPlacement
        switch (stepPlacement) {
          case "top":
            tooltipTop = rect.top - spacing - tooltipHeight
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case "bottom":
            tooltipTop = rect.bottom + spacing
            tooltipLeft = rect.left + rect.width / 2 - tooltipWidth / 2
            break
          case "left":
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
            tooltipLeft = rect.left - spacing - tooltipWidth
            break
          case "right":
            tooltipTop = rect.top + rect.height / 2 - tooltipHeight / 2
            tooltipLeft = rect.right + spacing
            break
        }
      }

      // Keep tooltip fully within viewport with padding
      const padding = 16
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      
      // Ensure tooltip doesn't go off screen horizontally
      if (tooltipLeft < padding) {
        tooltipLeft = padding
      } else if (tooltipLeft + tooltipWidth > viewportWidth - padding) {
        tooltipLeft = viewportWidth - tooltipWidth - padding
      }
      
      // Ensure tooltip doesn't go off screen vertically
      if (tooltipTop < padding) {
        tooltipTop = padding
      } else if (tooltipTop + tooltipHeight > viewportHeight - padding) {
        tooltipTop = viewportHeight - tooltipHeight - padding
      }

      setTooltipPosition({ top: tooltipTop, left: tooltipLeft })
      setPlacement(finalPlacement)
    }

    // Initial position calculation
    updatePosition()
    
    const handleResize = () => updatePosition()
    const handleScroll = () => updatePosition()

    window.addEventListener("resize", handleResize)
    window.addEventListener("scroll", handleScroll, true)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [isRunning, currentStep, currentStepData, isNavigating])

  if (!isRunning || !currentStepData) return null

  // Show loading state only when explicitly navigating
  // Don't show loader if element doesn't exist - let it find the element naturally
  if (isNavigating) {
    return createPortal(
      <div
        className="fixed inset-0 z-[9998] bg-black/70 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm pointer-events-auto">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#3C3CFF]" />
            <div>
              <p className="text-sm font-medium text-gray-900">Navigating...</p>
              <p className="text-xs text-gray-500">Please wait while we load the next step</p>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  }

  if (!targetElement) return null

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  // Calculate overlay regions to create a cutout effect
  // Position is in viewport coordinates (for fixed positioning)
  const top = position.top
  const left = position.left
  const bottom = top + position.height
  const right = left + position.width

  return createPortal(
    <>
      {/* Overlay with cutout - creates dimmed areas around the target */}
      {/* This overlay blocks all clicks except on the tooltip and modals */}
      <div
        className="fixed inset-0 z-[9998]"
        style={{
          pointerEvents: hasOpenModal ? 'none' : 'auto'
        }}
        onClick={(e) => {
          if (hasOpenModal) {
            // When modal is open, don't block clicks - let them pass through
            return
          }
          
          // Allow clicks on tooltip
          const target = e.target as HTMLElement
          const isTooltip = tooltipRef.current?.contains(target)
          
          if (!isTooltip) {
            // Prevent all other clicks
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {/* Top overlay */}
        <div
          className="absolute bg-black/70"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: `${Math.max(0, top)}px`,
            pointerEvents: hasOpenModal ? 'none' : 'auto'
          }}
          onClick={(e) => {
            if (!hasOpenModal) e.stopPropagation()
          }}
        />
        {/* Bottom overlay */}
        <div
          className="absolute bg-black/70"
          style={{
            top: `${bottom}px`,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: hasOpenModal ? 'none' : 'auto'
          }}
          onClick={(e) => {
            if (!hasOpenModal) e.stopPropagation()
          }}
        />
        {/* Left overlay */}
        <div
          className="absolute bg-black/70"
          style={{
            top: `${top}px`,
            left: 0,
            width: `${Math.max(0, left)}px`,
            height: `${position.height}px`,
            pointerEvents: hasOpenModal ? 'none' : 'auto'
          }}
          onClick={(e) => {
            if (!hasOpenModal) e.stopPropagation()
          }}
        />
        {/* Right overlay */}
        <div
          className="absolute bg-black/70"
          style={{
            top: `${top}px`,
            left: `${right}px`,
            right: 0,
            height: `${position.height}px`,
            pointerEvents: hasOpenModal ? 'none' : 'auto'
          }}
          onClick={(e) => {
            if (!hasOpenModal) e.stopPropagation()
          }}
        />
      </div>

      {/* Click blocker over the highlighted element - prevents clicks on the target */}
      {!hasOpenModal && (
        <div
          className="fixed z-[9999] pointer-events-auto"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${position.width}px`,
            height: `${position.height}px`,
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        />
      )}

      {/* Highlight border - shows around the target element */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{
          top: `${position.top - 4}px`,
          left: `${position.left - 4}px`,
          width: `${position.width + 8}px`,
          height: `${position.height + 8}px`,
          border: "4px solid #3C3CFF",
          borderRadius: "12px",
          boxShadow: "0 0 0 4px rgba(60, 60, 255, 0.2), 0 4px 12px rgba(60, 60, 255, 0.3)",
          transition: "top 0.4s cubic-bezier(0.4, 0, 0.2, 1), left 0.4s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s cubic-bezier(0.4, 0, 0.2, 1), height 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-[10000] bg-white rounded-xl shadow-2xl p-6 max-w-sm pointer-events-auto"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
        onClick={(e) => {
          // Only allow clicks on buttons - prevent clicks on tooltip background
          const target = e.target as HTMLElement
          const isButton = target.closest('button')
          if (!isButton) {
            e.preventDefault()
            e.stopPropagation()
          }
        }}
      >
        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-gray-500">
            Step {currentStep + 1} of {steps.length}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">
          {currentStepData.content}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-gray-600 hover:text-gray-900"
          >
            Skip
          </Button>
          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="border-gray-300"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={isLastStep ? onClose : onNext}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
            >
              {isLastStep ? "Finish" : "Next"}
              {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

