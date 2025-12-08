"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Timer, Play, Pause, Square, DollarSign } from "lucide-react"
import { toast } from "sonner"
import { getProjects, type Project } from "@/lib/projects"
import {
  getRunningTimer,
  getPausedTimer,
  startTimeEntry,
  pauseTimeEntry,
  resumeTimeEntry,
  stopTimeEntry,
  updateTimeEntry,
  formatTimeDisplay,
  type TimeEntry,
} from "@/lib/time-tracking"
import { useTour } from "@/contexts/TourContext"
import { dummyProjects, dummyClients } from "@/lib/tour-dummy-data"

export function TimerWidget() {
  const { isTourRunning } = useTour()
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [hourlyRate, setHourlyRate] = useState<number | "">("")
  const [note, setNote] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [currentProjectName, setCurrentProjectName] = useState<string>("")
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load projects and check for running timer
  useEffect(() => {
    loadData()
    
    // Skip timer checks during tours
    if (isTourRunning) {
      return
    }
    
    // Check for running timer periodically - sync state changes, not elapsed time
    const checkInterval = setInterval(() => {
      checkRunningTimer()
    }, 2000) // Check every 2 seconds for state changes

    // Periodic drift correction - every 10 seconds when running
    const driftCorrectionInterval = setInterval(async () => {
      if (isRunning && currentEntryId) {
        try {
          const runningTimer = await getRunningTimer()
          if (runningTimer && runningTimer.id === currentEntryId) {
            const start = new Date(runningTimer.start_time)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
            // Only correct if there's a significant drift (more than 2 seconds)
            setElapsedTime((prev) => {
              if (Math.abs(elapsed - prev) > 2) {
                return elapsed
              }
              return prev
            })
          }
        } catch (error) {
          // Silently fail
        }
      }
    }, 10000) // Every 10 seconds

    return () => {
      clearInterval(checkInterval)
      clearInterval(driftCorrectionInterval)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, currentEntryId, isTourRunning])

  // Timer interval - only increment if running, otherwise sync from DB
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  const loadData = async () => {
    try {
      // Use dummy data during tours
      if (isTourRunning) {
        const tourProjects = dummyProjects.map(dp => {
          const client = dummyClients.find(c => c.name === dp.client)
          return {
            id: dp.id,
            account_id: 'tour-account',
            client_id: client?.id || `client-${dp.id}`,
            name: dp.name,
            description: null,
            status: dp.status === 'completed' ? 'completed' : dp.status === 'in_progress' ? 'active' : 'draft' as any,
            progress: dp.progress,
            start_date: null,
            due_date: dp.dueDate,
            completed_date: dp.status === 'completed' ? dp.dueDate : null,
            portal_id: null,
            total_messages: 0,
            total_files: 0,
            total_invoices: 0,
            total_milestones: 0,
            completed_milestones: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_activity_at: null,
          } as Project
        })
        setProjects(tourProjects)
        return
      }

      const projectsData = await getProjects()
      setProjects(projectsData)
      await checkRunningTimer()
    } catch (error) {
      console.error('Error loading timer widget data:', error)
    }
  }

  const checkRunningTimer = async () => {
    // Skip during tours - no real timer state
    if (isTourRunning) {
      return
    }

    try {
      const runningTimer = await getRunningTimer()
      if (runningTimer) {
        // Timer is running in DB
        const shouldUpdate = currentEntryId !== runningTimer.id || !isRunning
        
        if (shouldUpdate) {
          setCurrentEntryId(runningTimer.id)
          setSelectedProject(runningTimer.project_id || "")
          setNote(runningTimer.note || "")
          setHourlyRate(runningTimer.hourly_rate || "")
          setCurrentProjectName(runningTimer.project_name || "")
          
          // Only sync elapsed time when state changes
          const start = new Date(runningTimer.start_time)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
          setElapsedTime(elapsed)
        }
        
        setIsRunning(true)
        // Don't constantly update elapsed time when already running - let local increment handle it
      } else {
        // No running timer in DB - check if there's a paused timer
        if (currentEntryId) {
          const pausedTimer = await getPausedTimer(currentEntryId)
          if (pausedTimer) {
            // Timer is paused - preserve state but don't set isRunning
            if (isRunning) {
              // Timer was just paused elsewhere, sync immediately
              setIsRunning(false)
              
              // Calculate elapsed time from paused timer's original start_time
              // Use updated_at as the pause timestamp
              const start = new Date(pausedTimer.start_time)
              const pausedAt = new Date(pausedTimer.updated_at || pausedTimer.start_time)
              // This is the elapsed time at the moment of pause
              const elapsed = Math.floor((pausedAt.getTime() - start.getTime()) / 1000)
              setElapsedTime(elapsed)
            }
            
            // Sync state from paused timer
            setSelectedProject(pausedTimer.project_id || "")
            setNote(pausedTimer.note || "")
            setHourlyRate(pausedTimer.hourly_rate || "")
            setCurrentProjectName(pausedTimer.project_name || "")
            setIsRunning(false)
            // Don't constantly update elapsed time when already paused
          } else {
            // No paused timer either - timer was stopped/saved, completely reset
            setIsRunning(false)
            setElapsedTime(0)
            setCurrentEntryId(null)
            setSelectedProject("")
            setNote("")
            setHourlyRate("")
            setCurrentProjectName("")
          }
        } else {
          // No current entry ID - no timer at all, ensure everything is reset
          if (isRunning || elapsedTime > 0 || currentProjectName) {
            setIsRunning(false)
            setElapsedTime(0)
            setCurrentEntryId(null)
            setSelectedProject("")
            setNote("")
            setHourlyRate("")
            setCurrentProjectName("")
          }
        }
      }
    } catch (error) {
      // Silently fail - timer table might not exist
    }
  }

  const handleStartPause = async () => {
    // During tours, don't perform real operations
    if (isTourRunning) {
      if (!selectedProject && !currentEntryId) {
        toast.error("Please select a project first")
        setIsOpen(true)
        return
      }
      toast.success(isRunning ? "Timer paused" : "Timer started")
      setIsRunning(!isRunning)
      return
    }

    if (!selectedProject && !currentEntryId) {
      toast.error("Please select a project first")
      setIsOpen(true)
      return
    }

    try {
      if (isRunning && currentEntryId) {
        // Pause - update database
        await pauseTimeEntry(currentEntryId)
        setIsRunning(false)
        // Immediately sync to update elapsed time from pause timestamp
        await checkRunningTimer()
        toast.success("Timer paused")
      } else {
        // Start or Resume
        if (elapsedTime === 0 && !currentEntryId) {
          // Starting new
          const projectName = projects.find(p => p.id === selectedProject)?.name || "Unknown Project"
          const entry = await startTimeEntry({
            project_id: selectedProject,
            project_name: projectName,
            hourly_rate: hourlyRate === "" ? undefined : (typeof hourlyRate === "number" ? hourlyRate : parseFloat(hourlyRate.toString()) || undefined),
            note: note || undefined,
          })
          
          setCurrentEntryId(entry.id)
          setCurrentProjectName(projectName)
          setElapsedTime(0)
          setIsRunning(true)
          // Immediately sync
          await checkRunningTimer()
          toast.success("Timer started")
        } else if (currentEntryId) {
          // Resuming - update database and adjust start_time to account for pause delay
          await resumeTimeEntry(currentEntryId, elapsedTime)
          setIsRunning(true)
          // Immediately sync to get updated start_time
          await checkRunningTimer()
          toast.success("Timer resumed")
        }
      }
    } catch (error) {
      console.error('Error starting/pausing timer:', error)
      toast.error('Failed to start/pause timer')
    }
  }

  const handleStop = async () => {
    // During tours, don't perform real operations
    if (isTourRunning) {
      toast.success("Timer stopped and saved")
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      setCurrentProjectName("")
      setIsRunning(false)
      setIsOpen(false)
      return
    }

    if (!currentEntryId) return

    try {
      setIsRunning(false)
      
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // Update entry with current note and hourly rate before stopping
      await updateTimeEntry(currentEntryId, {
        note: note || undefined,
        hourly_rate: hourlyRate === "" ? undefined : (typeof hourlyRate === "number" ? hourlyRate : parseFloat(hourlyRate.toString()) || undefined),
      })
      
      await stopTimeEntry(currentEntryId)
      
      // Completely reset all state
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      setCurrentProjectName("")
      
      toast.success("Timer stopped and saved")
      setIsOpen(false)
    } catch (error) {
      console.error('Error stopping timer:', error)
      toast.error('Failed to stop timer')
    }
  }

  // Refresh timer state when popover opens
  useEffect(() => {
    if (isOpen) {
      checkRunningTimer()
    }
  }, [isOpen])

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative h-9 px-3 gap-2 text-gray-600 hover:text-gray-900 ${
            isRunning ? "text-[#3C3CFF] hover:text-[#3C3CFF]" : currentEntryId ? "text-gray-500" : ""
          }`}
          data-help="timer-widget"
        >
          <Timer className={`h-4 w-4 ${isRunning ? "animate-pulse" : ""}`} />
          {isRunning || currentEntryId ? (
            <span className="text-sm font-medium">{formatTimeDisplay(elapsedTime)}</span>
          ) : (
            <span className="text-sm">Timer</span>
          )}
          {isRunning && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-[#3C3CFF] rounded-full animate-pulse"></span>
          )}
          {!isRunning && currentEntryId && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-gray-400 rounded-full"></span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          {/* Timer Display */}
          {(isRunning || (currentEntryId && !isRunning)) && (
            <div className="text-center py-2 border-b border-gray-200">
              <div className={`text-2xl font-bold mb-1 ${isRunning ? "text-[#3C3CFF]" : "text-gray-600"}`}>
                {formatTimeDisplay(elapsedTime)}
              </div>
              <div className="text-sm text-gray-600">
                {currentProjectName || "No project"}
                {!isRunning && currentEntryId && (
                  <span className="ml-2 text-xs text-gray-500">(Paused)</span>
                )}
              </div>
            </div>
          )}

          {/* Project Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">Project</Label>
            <Select
              value={selectedProject}
              onValueChange={setSelectedProject}
              disabled={isRunning && !!currentEntryId} // Only disable when actively running
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hourly Rate */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">Hourly Rate (Optional)</Label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                type="number"
                placeholder="$0.00"
                value={hourlyRate === "" ? "" : hourlyRate}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    setHourlyRate("")
                    // Update running timer's hourly rate in real-time
                    if (isRunning && currentEntryId) {
                      updateTimeEntry(currentEntryId, {
                        hourly_rate: undefined,
                      }).catch(console.error)
                    }
                  } else {
                    const numValue = parseFloat(value)
                    if (!isNaN(numValue) && numValue >= 0) {
                      setHourlyRate(numValue)
                      // Update running timer's hourly rate in real-time
                      if (isRunning && currentEntryId) {
                        updateTimeEntry(currentEntryId, {
                          hourly_rate: numValue,
                        }).catch(console.error)
                      }
                    }
                  }
                }}
                className="h-8 pl-7 text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">Note (Optional)</Label>
            <Input
              placeholder="What are you working on?"
              value={note}
              onChange={(e) => {
                setNote(e.target.value)
                // Update running timer's note in real-time
                if (isRunning && currentEntryId) {
                  updateTimeEntry(currentEntryId, {
                    note: e.target.value || undefined,
                  }).catch(console.error)
                }
              }}
              className="h-8 text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isRunning ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStartPause}
                  className="flex-1 h-8"
                >
                  <Pause className="h-3 w-3 mr-1" />
                  Pause
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="flex-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </>
            ) : currentEntryId ? (
              // Paused state - show Resume and Stop buttons
              <>
                <Button
                  onClick={handleStartPause}
                  className="flex-1 h-8 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                >
                  <Play className="h-3 w-3 mr-1" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                  className="flex-1 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Square className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </>
            ) : (
              // No timer - show Start button
              <Button
                onClick={handleStartPause}
                className="flex-1 h-8 bg-[#3C3CFF] hover:bg-[#3C3CFF]/90 text-white"
                disabled={!selectedProject}
              >
                <Play className="h-3 w-3 mr-1" />
                Start
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

