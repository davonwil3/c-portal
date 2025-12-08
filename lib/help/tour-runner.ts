export type TourStep = {
  type: "hint" | "route" | "waitForRoute" | "waitFor" | "click" | "fill"
  target?: string
  content?: string
  path?: string
  timeout?: number
  optional?: boolean
  value?: string
}

export type Tour = {
  id: string
  title: string
  keywords: string[]
  steps: TourStep[]
}

/**
 * Converts tour steps to our custom tour format
 * Only includes "hint" type steps
 */
export function convertTourToJoyrideSteps(tour: Tour) {
  return tour.steps
    .filter((step) => step.type === "hint" && step.target && step.content)
    .map((step) => ({
      target: step.target!,
      content: step.content!,
      placement: "auto" as const,
    }))
}

/**
 * Processes tour steps and executes actions
 */
export async function processTourStep(
  step: TourStep,
  pushRoute: (path: string) => void,
  currentPath: string
): Promise<boolean> {
  switch (step.type) {
    case "route":
      if (step.path) {
        const targetPath = step.path.split("?")[0] // Remove query params
        const currentPathClean = currentPath.split("?")[0] // Remove query params from current path
        
        // Only navigate if we're actually changing routes
        if (targetPath !== currentPathClean) {
          pushRoute(step.path)
          return true
        }
        // Already on the target route, skip navigation
        return true
      }
      return false

    case "waitForRoute":
      // Wait for route to match
      if (step.path) {
        const targetPath = step.path.split("?")[0] // Remove query params
        
        // Convert dynamic route patterns to regex
        // e.g., /dashboard/projects/[id] becomes /^\/dashboard\/projects\/[^\/]+$/
        const isDynamicRoute = targetPath.includes('[')
        const regexPattern = isDynamicRoute
          ? targetPath
              .replace(/\[.*?\]/g, '[^/]+') // Replace [id], [slug], etc. with regex pattern
              .replace(/\//g, '\\/') // Escape forward slashes
          : null
        
        return new Promise((resolve) => {
          let attempts = 0
          const maxAttempts = 100 // 10 seconds max
          const checkRoute = () => {
            attempts++
            const currentPath = window.location.pathname
            
            let matches = false
            if (isDynamicRoute && regexPattern) {
              // For dynamic routes, use regex matching
              const regex = new RegExp(`^${regexPattern}$`)
              matches = regex.test(currentPath)
            } else {
              // For static routes, use startsWith
              matches = currentPath.startsWith(targetPath)
            }
            
            if (matches) {
              resolve(true)
            } else if (attempts >= maxAttempts) {
              resolve(false) // Timeout
            } else {
              setTimeout(checkRoute, 100)
            }
          }
          checkRoute()
        })
      }
      return false

    case "waitFor":
      // Wait for element to appear
      if (step.target) {
        const timeout = step.timeout || 5000
        return new Promise((resolve) => {
          const startTime = Date.now()
          const checkElement = () => {
            const element = document.querySelector(step.target!)
            if (element) {
              resolve(true)
            } else if (Date.now() - startTime > timeout) {
              // Optional step failed, continue anyway
              resolve(step.optional !== false)
            } else {
              setTimeout(checkElement, 100)
            }
          }
          checkElement()
        })
      }
      return false

    case "click":
      // Click an element
      if (step.target) {
        const element = document.querySelector(step.target) as HTMLElement
        if (element) {
          // For radio buttons and checkboxes, ensure we trigger the change event
          if (element instanceof HTMLInputElement && (element.type === "radio" || element.type === "checkbox")) {
            // Set checked state
            element.checked = true
            // Trigger change event for React (use InputEvent for better compatibility)
            const inputEvent = new Event('input', { bubbles: true })
            element.dispatchEvent(inputEvent)
            // Trigger change event
            const changeEvent = new Event('change', { bubbles: true })
            element.dispatchEvent(changeEvent)
            // Also trigger click for good measure
            element.click()
            // Small delay to ensure React state updates
            await new Promise(resolve => setTimeout(resolve, 100))
          } else {
            // For Radix UI TabsTrigger, check if it has a value attribute
            const value = element.getAttribute('value')
            if (value) {
              // Try to find the parent Tabs component and trigger its onValueChange
              const tabsElement = element.closest('[role="tablist"]')?.parentElement
              if (tabsElement) {
                // Create pointer events that Radix UI will recognize
                const pointerDownEvent = new PointerEvent('pointerdown', {
                  bubbles: true,
                  cancelable: true,
                  pointerId: 1,
                  pointerType: 'mouse',
                  button: 0,
                  buttons: 1
                })
                
                const pointerUpEvent = new PointerEvent('pointerup', {
                  bubbles: true,
                  cancelable: true,
                  pointerId: 1,
                  pointerType: 'mouse',
                  button: 0,
                  buttons: 0
                })
                
                // Dispatch pointer events in sequence
                element.dispatchEvent(pointerDownEvent)
                await new Promise(resolve => setTimeout(resolve, 50))
                element.dispatchEvent(pointerUpEvent)
                await new Promise(resolve => setTimeout(resolve, 50))
              }
            }
            
            // For React components (like TabsTrigger), we need to trigger React's synthetic events
            // First, try to find a button or clickable element within
            const clickableElement = element.closest('button') || element.querySelector('button') || element
            
            // Create a proper mouse event that React will recognize
            const mouseEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true,
              buttons: 1
            })
            
            // Dispatch the event
            clickableElement.dispatchEvent(mouseEvent)
            
            // Also call click() as fallback
            if (clickableElement instanceof HTMLElement) {
              clickableElement.click()
            }
            
            // Small delay to ensure React state updates
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          return true
        }
        return step.optional !== false
      }
      return false

    case "fill":
      // Fill an input field
      if (step.target && step.value !== undefined) {
        const element = document.querySelector(step.target) as HTMLInputElement | HTMLTextAreaElement
        if (element) {
          // Focus the element
          element.focus()
          
          // Set the value using the native setter to trigger React's onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            "value"
          )?.set
          
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(element, step.value)
          } else {
            element.value = step.value
          }
          
          // Create and dispatch input event (React listens to this)
          const inputEvent = new Event('input', { bubbles: true })
          element.dispatchEvent(inputEvent)
          
          // Also dispatch change event for compatibility
          const changeEvent = new Event('change', { bubbles: true })
          element.dispatchEvent(changeEvent)
          
          return true
        }
        return step.optional !== false
      }
      return false

    case "hint":
      // Handled by react-joyride
      return true

    default:
      return false
  }
}

/**
 * Executes all non-hint steps before showing hints
 */
export async function executeTourActions(
  tour: Tour,
  pushRoute: (path: string) => void,
  currentPath: string
): Promise<void> {
  for (const step of tour.steps) {
    if (step.type !== "hint") {
      await processTourStep(step, pushRoute, currentPath)
      // Small delay between actions
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }
}

