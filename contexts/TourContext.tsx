"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import actionsData from "@/lib/help/actions.json"
import { Tour, convertTourToJoyrideSteps, executeTourActions } from "@/lib/help/tour-runner"
import { TourOverlay } from "@/components/tour/TourOverlay"

interface TourStep {
  target: string
  content: string
  placement?: "top" | "bottom" | "left" | "right" | "auto"
}

interface TourContextType {
  startTour: (tourId: string) => Promise<void>
  stopTour: () => void
  isRunning: boolean
  isTourRunning: boolean // Alias for easier component usage
  currentTour: Tour | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0) // Track position in full steps array
  const [currentTour, setCurrentTour] = useState<Tour | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const startTour = useCallback(
    async (tourId: string) => {
      const tours = actionsData as Tour[]
      const tour = tours.find((t) => t.id === tourId)

      if (!tour) {
        console.error(`Tour not found: ${tourId}`)
        console.log('Available tours:', tours.map(t => t.id))
        return
      }

      console.log('Starting tour:', tourId, tour.title)
      setCurrentTour(tour)
      setCurrentStepIndex(0)
      setIsNavigating(false)

      // Execute initial non-hint steps (route, waitFor, etc.) up to first hint
      let initialIndex = 0
      for (const step of tour.steps) {
        if (step.type === "hint") {
          break // Stop at first hint
        }
        initialIndex++
      }

      if (initialIndex > 0) {
        const initialSteps = tour.steps.slice(0, initialIndex)
        
        // Check if initial steps will actually change the route (not just tabs/components)
        const currentPath = pathname || ""
        const routeSteps = initialSteps.filter(step => step.type === "route")
        const hasRouteChange = routeSteps.some(step => {
          if (step.path) {
            const targetPath = step.path.split("?")[0]
            const currentPathClean = currentPath.split("?")[0]
            return targetPath !== currentPathClean
          }
          return false
        })
        
        // Show loader if we're actually navigating to a different route
        if (hasRouteChange) {
          setIsNavigating(true)
        }
        
        await executeTourActions(
          { ...tour, steps: initialSteps },
          router.push.bind(router),
          currentPath
        )
        
        // Wait for navigation/rendering - longer wait for route changes
        if (hasRouteChange) {
          // Wait for route to actually change
          await new Promise((resolve) => {
            let attempts = 0
            const maxAttempts = 20 // 1 second max (20 * 25ms = 500ms typical, 1s worst case)
            
            if (routeSteps.length > 0) {
              const targetPath = routeSteps[routeSteps.length - 1].path?.split("?")[0]
              
              if (!targetPath) {
                resolve(true)
                return
              }
              
              // Handle dynamic routes
              let checkPath = targetPath
              let isDynamicRoute = false
              if (targetPath.includes('[') && targetPath.includes(']')) {
                const basePath = targetPath.substring(0, targetPath.indexOf('['))
                checkPath = basePath
                isDynamicRoute = true
              }
              
              const checkRoute = () => {
                attempts++
                const currentPath = window.location.pathname
                
                let routeMatched = false
                if (isDynamicRoute) {
                  const currentSegments = currentPath.split('/').filter(s => s)
                  const baseSegments = checkPath.split('/').filter(s => s)
                  routeMatched = currentSegments.length > baseSegments.length && 
                                 currentPath.startsWith(checkPath + '/')
                } else {
                  routeMatched = currentPath === checkPath || currentPath.startsWith(checkPath + '/')
                }
                
                if (routeMatched) {
                  // Route changed! Resolve immediately - no delay needed
                  resolve(true)
                  return
                }
                
                if (attempts >= maxAttempts) {
                  resolve(true) // Timeout, continue anyway
                  return
                }
                // Check more frequently - every 25ms for faster detection
                setTimeout(checkRoute, 25)
              }
              
              // Check immediately (synchronous first check)
              checkRoute()
            } else {
              resolve(true)
            }
          })
          setIsNavigating(false)
        } else {
          // No route change, just wait a bit for any UI updates
          await new Promise((resolve) => setTimeout(resolve, 300))
        }
      }

      // Convert tour steps to our format (only hints)
      const tourSteps = convertTourToJoyrideSteps(tour)
      setSteps(tourSteps)
      setCurrentStep(0)
      setCurrentStepIndex(initialIndex)

      // Start the tour
      setIsRunning(true)
    },
    [router, pathname]
  )

  const stopTour = useCallback(() => {
    setIsRunning(false)
    setSteps([])
    setCurrentStep(0)
    setCurrentStepIndex(0)
    setCurrentTour(null)
    setIsNavigating(false)
  }, [])

  const handleNext = useCallback(async () => {
    if (!currentTour) return

    const allSteps = currentTour.steps
    const hintSteps = allSteps.filter((s) => s.type === "hint")
    
    if (currentStep < steps.length - 1) {
      // Find current hint in full steps array
      const currentHint = hintSteps[currentStep]
      const currentHintPos = allSteps.findIndex((s) => s === currentHint)
      
      // Find next hint in full steps array
      const nextHint = hintSteps[currentStep + 1]
      const nextHintPos = allSteps.findIndex((s) => s === nextHint)
      
      // Execute all non-hint steps between current and next hint
      if (nextHintPos > currentHintPos + 1) {
        const stepsToExecute = allSteps.slice(currentHintPos + 1, nextHintPos)
        
        if (stepsToExecute.length > 0) {
          // Check if any step will actually change the route (not just tabs/components)
          const currentPath = window.location.pathname
          const routeSteps = stepsToExecute.filter(step => step.type === "route")
          const waitForRouteSteps = stepsToExecute.filter(step => step.type === "waitForRoute")
          
          // Check if route path will actually change
          let hasRouteChange = false
          
          // If there's a waitForRoute step, it almost always means we're changing routes
          // This is especially important for dynamic routes like /dashboard/projects/[id]
          if (waitForRouteSteps.length > 0) {
            hasRouteChange = waitForRouteSteps.some(step => {
              if (step.path) {
                const targetPath = step.path.split("?")[0]
                const currentPathClean = currentPath.split("?")[0]
                
                // Handle dynamic routes - if target contains [id] or similar
                if (targetPath.includes('[') && targetPath.includes(']')) {
                  const basePath = targetPath.substring(0, targetPath.indexOf('['))
                  // If we're on the base path, we're navigating to a dynamic route
                  if (currentPathClean === basePath) {
                    return true
                  }
                  // If current path has more segments than base, check if it's different
                  const currentSegments = currentPathClean.split('/').filter(s => s)
                  const baseSegments = basePath.split('/').filter(s => s)
                  // If we're going from one dynamic route to another, check if they're different
                  if (currentSegments.length > baseSegments.length) {
                    // We're already on a dynamic route, check if target is different
                    return !currentPathClean.startsWith(basePath + '/') || currentPathClean === basePath
                  }
                  // We're navigating to a dynamic route
                  return true
                }
                
                // For static routes, check if paths are different
                return targetPath !== currentPathClean
              }
              return true // If waitForRoute exists without path, assume route change
            })
          }
          
          // Also check route steps
          if (!hasRouteChange && routeSteps.length > 0) {
            hasRouteChange = routeSteps.some(step => {
              if (step.path) {
                const targetPath = step.path.split("?")[0]
                const currentPathClean = currentPath.split("?")[0]
                
                // Handle dynamic routes
                if (targetPath.includes('[') && targetPath.includes(']')) {
                  const basePath = targetPath.substring(0, targetPath.indexOf('['))
                  // If current path is exactly the base path, it's a route change
                  if (currentPathClean === basePath) {
                    return true
                  }
                  // Check if current path matches the dynamic pattern
                  const currentSegments = currentPathClean.split('/').filter(s => s)
                  const baseSegments = basePath.split('/').filter(s => s)
                  if (currentSegments.length > baseSegments.length) {
                    // Already on a dynamic route, check if it's different
                    return !currentPathClean.startsWith(basePath + '/')
                  }
                  return true
                }
                
                // For static routes, check if paths are different
                return targetPath !== currentPathClean
              }
              return false
            })
          }
          
          // If we're navigating to a different route, immediately advance to next step
          // This hides the current hint and shows the navigation loader
          if (hasRouteChange) {
            setCurrentStep(currentStep + 1)
            setCurrentStepIndex(nextHintPos)
            setIsNavigating(true)
          }
          
          await executeTourActions(
            { ...currentTour, steps: stepsToExecute },
            router.push.bind(router),
            window.location.pathname
          )
          
          // Wait for navigation/rendering - longer wait for route changes, shorter for clicks/tabs
          if (hasRouteChange) {
            // Get target path info
            const targetStep = waitForRouteSteps.length > 0 
              ? waitForRouteSteps[waitForRouteSteps.length - 1]
              : routeSteps[routeSteps.length - 1]
            
            const targetPath = targetStep?.path?.split("?")[0]
            
            if (targetPath) {
              // Handle dynamic routes - extract base path
              let checkPath = targetPath
              let isDynamicRoute = false
              if (targetPath.includes('[') && targetPath.includes(']')) {
                const basePath = targetPath.substring(0, targetPath.indexOf('['))
                checkPath = basePath
                isDynamicRoute = true
              }
              
              // Check if we're ALREADY on the target route (navigation might have already happened)
              const currentPathNow = window.location.pathname
              let alreadyOnTarget = false
              
              if (isDynamicRoute) {
                const currentSegments = currentPathNow.split('/').filter(s => s)
                const baseSegments = checkPath.split('/').filter(s => s)
                alreadyOnTarget = currentSegments.length > baseSegments.length && 
                               currentPathNow.startsWith(checkPath + '/')
              } else {
                alreadyOnTarget = currentPathNow === checkPath || currentPathNow.startsWith(checkPath + '/')
              }
              
              if (alreadyOnTarget) {
                // Already on target, no need to wait
                setIsNavigating(false)
              } else {
                // Wait for route to change
                await new Promise((resolve) => {
                  let attempts = 0
                  const maxAttempts = 20 // 1 second max
                  
                  const checkRoute = () => {
                    attempts++
                    const currentPath = window.location.pathname
                    
                    // Check if route has changed
                    let routeMatched = false
                    if (isDynamicRoute) {
                      const currentSegments = currentPath.split('/').filter(s => s)
                      const baseSegments = checkPath.split('/').filter(s => s)
                      routeMatched = currentSegments.length > baseSegments.length && 
                                     currentPath.startsWith(checkPath + '/')
                    } else {
                      routeMatched = currentPath === checkPath || currentPath.startsWith(checkPath + '/')
                    }
                    
                    if (routeMatched) {
                      resolve(true)
                      return
                    }
                    
                    if (attempts >= maxAttempts) {
                      resolve(true)
                      return
                    }
                    setTimeout(checkRoute, 25)
                  }
                  
                  checkRoute()
                })
                setIsNavigating(false)
              }
            } else {
              setIsNavigating(false)
            }
          } else {
            // No route change, just wait a bit for any UI updates
            await new Promise((resolve) => setTimeout(resolve, 300))
            // Advance step after non-route actions complete
            setCurrentStep(currentStep + 1)
            setCurrentStepIndex(nextHintPos)
          }
        } else {
          // No steps to execute, just advance
          setCurrentStep(currentStep + 1)
          setCurrentStepIndex(nextHintPos)
        }
      } else {
        // Next hint is immediately after current, just advance
        setCurrentStep(currentStep + 1)
        setCurrentStepIndex(nextHintPos)
      }
    } else {
      stopTour()
    }
  }, [currentStep, steps.length, stopTour, currentTour, router])

  const handleBack = useCallback(async () => {
    if (!currentTour || currentStep === 0) return

    const allSteps = currentTour.steps
    const hintSteps = allSteps.filter((s) => s.type === "hint")
    
    // Find previous hint in full steps array
    const prevHint = hintSteps[currentStep - 1]
    const prevHintPos = allSteps.findIndex((s) => s === prevHint)
    
    // Find current hint in full steps array
    const currentHint = hintSteps[currentStep]
    const currentHintPos = allSteps.findIndex((s) => s === currentHint)
    
    // Execute all non-hint steps between previous and current hint (in reverse order)
    if (currentHintPos > prevHintPos + 1) {
      const stepsToExecute = allSteps.slice(prevHintPos + 1, currentHintPos).reverse()
      
      // For back navigation, we might need to reverse route changes
      // For now, just navigate to the route before the previous hint
      for (const step of stepsToExecute) {
        if (step.type === "route") {
          // Find the route step before the previous hint
          const routeBeforePrev = allSteps
            .slice(0, prevHintPos)
            .reverse()
            .find((s) => s.type === "route")
          if (routeBeforePrev?.path) {
            router.push(routeBeforePrev.path)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            break
          }
        }
      }
    }
    
    setCurrentStep(currentStep - 1)
    setCurrentStepIndex(prevHintPos)
  }, [currentStep, currentTour, router])

  const handleSkip = useCallback(() => {
    stopTour()
  }, [stopTour])

  return (
    <TourContext.Provider
      value={{
        startTour,
        stopTour,
        isRunning,
        isTourRunning: isRunning, // Expose for components to check
        currentTour,
      }}
    >
      {children}
      {isRunning && steps.length > 0 && (
        <TourOverlay
          steps={steps}
          currentStep={currentStep}
          isRunning={isRunning}
          isNavigating={isNavigating}
          onNext={handleNext}
          onBack={handleBack}
          onSkip={handleSkip}
          onClose={stopTour}
        />
      )}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}

