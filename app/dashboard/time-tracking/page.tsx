"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  RotateCcw,
  Save,
  Play,
  Pause,
  FileText,
  Timer,
  FileSpreadsheet,
  Filter,
  Download,
  Search,
} from "lucide-react"
import { toast } from "sonner"
import { getProjects, type Project } from "@/lib/projects"
import {
  getTimeEntries,
  getRunningTimer,
  getPausedTimer,
  startTimeEntry,
  pauseTimeEntry,
  resumeTimeEntry,
  stopTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
  getTodayTimeEntries,
  getWeekTimeEntries,
  getRecentTimeEntries,
  calculateTotalDuration,
  calculateTotalBillable,
  formatDuration,
  formatTimeDisplay,
  type TimeEntry,
} from "@/lib/time-tracking"
import { useTour } from "@/contexts/TourContext"
import { dummyTimeEntries, dummyProjects, dummyClients } from "@/lib/tour-dummy-data"

export default function TimeTrackingPage() {
  const { isTourRunning, currentTour } = useTour()
  const [activeTab, setActiveTab] = useState<"tracking" | "timesheets">("tracking")
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // seconds
  const [note, setNote] = useState("")
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [hourlyRate, setHourlyRate] = useState<number | "">("")
  
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([])
  
  // Pre-load tour dummy data immediately when tour starts or page loads during tour
  useEffect(() => {
    // Load dummy data immediately when tour is running
    if (isTourRunning) {
      // Verify dummy data exists
      if (!dummyProjects || dummyProjects.length === 0) {
        console.error('dummyProjects is empty or undefined!', dummyProjects)
        return
      }
      if (!dummyTimeEntries || dummyTimeEntries.length === 0) {
        console.error('dummyTimeEntries is empty or undefined!', dummyTimeEntries)
        return
      }
      
      // Map dummy projects to Project type - match the Project interface structure
      const tourProjects = dummyProjects.map(dp => {
        // Find matching client ID from dummyClients
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
      
      // Use dummy time entries
      const tourEntries = dummyTimeEntries as TimeEntry[]
      setEntries(tourEntries)
      
      // Filter today's entries
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      setTodayEntries(todayEntries)
      
      // Filter week's entries
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        return entryDate >= weekAgo
      })
      setWeekEntries(weekEntries)
      
      setLoading(false)
    }
  }, [isTourRunning])
  
  // Also check on mount if tour is already running
  useEffect(() => {
    if (isTourRunning && projects.length === 0 && entries.length === 0) {
      // Tour is running but data hasn't loaded yet - force load
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
      const tourEntries = dummyTimeEntries as TimeEntry[]
      setEntries(tourEntries)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      setTodayEntries(todayEntries)
      
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        return entryDate >= weekAgo
      })
      setWeekEntries(weekEntries)
      
      setLoading(false)
    }
  }, [])
  
  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<{ note: string; project: string; date: string } | null>(null)
  
  // Timesheets filters
  const [filterProject, setFilterProject] = useState<string>("all")
  const [filterDateRange, setFilterDateRange] = useState<string>("this_month")
  const [searchQuery, setSearchQuery] = useState<string>("")
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Listen for tour clicks on timesheets tab and auto-switch
  useEffect(() => {
    if (!isTourRunning || currentTour?.id !== "time-tracking") return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const timesheetsTab = target.closest("[data-help='timesheets-tab']")
      
      if (timesheetsTab && activeTab === "tracking") {
        // Tour clicked the timesheets tab - switch to it
        setActiveTab("timesheets")
      }
    }

    // Use capture phase to catch clicks before they're prevented
    document.addEventListener('click', handleClick, true)
    
    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [isTourRunning, currentTour?.id, activeTab])

  // Load projects and entries on mount (skip if tour is running - tour data loads separately)
  useEffect(() => {
    // Don't load real data if tour is running - tour data is loaded in separate useEffect
    if (!isTourRunning) {
      loadData()
    }
  }, [isTourRunning])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Skip loading real data if tour is running
      if (isTourRunning) {
        return
      }
      
      // Load projects first
      const projectsData = await getProjects()
      setProjects(projectsData)

      // Only try to load time entries if table exists (will fail gracefully if not)
      try {
        const [recentEntriesData, runningTimer, today, week] = await Promise.all([
          getRecentTimeEntries(7, 20), // Last 7 days, max 20 entries
          getRunningTimer(),
          getTodayTimeEntries(),
          getWeekTimeEntries(),
        ])

        setEntries(recentEntriesData)
        setTodayEntries(today)
        setWeekEntries(week)

        // If there's a running timer, restore it
        if (runningTimer) {
          setCurrentEntryId(runningTimer.id)
          setSelectedProject(runningTimer.project_id || "")
          setNote(runningTimer.note || "")
          setHourlyRate(runningTimer.hourly_rate || "")
          setIsRunning(true)
          
          // Calculate elapsed time
          const start = new Date(runningTimer.start_time)
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
          setElapsedTime(elapsed)
        }
      } catch (timeError: any) {
        // If time_entries table doesn't exist, show a helpful message
        if (timeError?.code === '42P01' || timeError?.message?.includes('does not exist')) {
          console.warn('Time entries table not found. Please run the SQL schema.')
          toast.error('Database not set up. Please run the SQL schema first.', {
            description: 'Check supabase/time_tracking_schema.sql'
          })
        } else {
          console.error('Error loading time entries:', timeError)
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load time tracking data')
    } finally {
      setLoading(false)
    }
  }

  // Timer logic - only increment if running, otherwise sync from DB
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

  // Sync with database timer state periodically - sync state changes, not elapsed time when running
  useEffect(() => {
    if (isTourRunning) return // Skip sync during tour
    
    // Sync function - only syncs state changes, not elapsed time when running
    const syncTimer = async () => {
      try {
        const runningTimer = await getRunningTimer()
        if (runningTimer) {
          // Timer is running in DB
          const shouldSync = !isRunning || currentEntryId !== runningTimer.id
          
          if (shouldSync) {
            // Sync state from DB immediately
            setCurrentEntryId(runningTimer.id)
            setSelectedProject(runningTimer.project_id || "")
            setNote(runningTimer.note || "")
            setHourlyRate(runningTimer.hourly_rate || "")
            setIsRunning(true)
            
            // Calculate elapsed time from DB start_time only when syncing state
            const start = new Date(runningTimer.start_time)
            const now = new Date()
            const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000)
            setElapsedTime(elapsed)
          }
          // Don't sync elapsed time when already running - let local increment handle it
        } else {
          // Check if there's a paused timer (same entry ID but not running)
          if (currentEntryId) {
            const pausedTimer = await getPausedTimer(currentEntryId)
            if (pausedTimer) {
              // Timer is paused - preserve state but don't set isRunning
              if (isRunning) {
                // Timer was just paused elsewhere, sync state immediately
                setIsRunning(false)
                setSelectedProject(pausedTimer.project_id || "")
                setNote(pausedTimer.note || "")
                setHourlyRate(pausedTimer.hourly_rate || "")
                
                // Calculate elapsed time from paused timer's original start_time
                // Use updated_at as the pause timestamp
                const start = new Date(pausedTimer.start_time)
                const pausedAt = new Date(pausedTimer.updated_at || pausedTimer.start_time)
                // Use the paused_at time (updated_at) to calculate elapsed time at pause
                const elapsed = Math.floor((pausedAt.getTime() - start.getTime()) / 1000)
                setElapsedTime(elapsed)
              }
              // Don't constantly update elapsed time when already paused
            } else {
              // No paused timer either - timer was stopped
              if (isRunning || currentEntryId) {
                setIsRunning(false)
                setCurrentEntryId(null)
                setElapsedTime(0)
              }
            }
          } else {
            // No current entry ID - no timer at all
            if (isRunning) {
              setIsRunning(false)
            }
          }
        }
      } catch (error) {
        // Silently fail - timer table might not exist
      }
    }

    // Initial sync
    syncTimer()
    
    // Sync every 2 seconds - only for state changes, not elapsed time
    const syncInterval = setInterval(syncTimer, 2000)

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
      clearInterval(syncInterval)
      clearInterval(driftCorrectionInterval)
    }
  }, [isRunning, currentEntryId, isTourRunning])

  const handleStartPause = async () => {
    // During tours, don't perform real operations - just show dummy data
    if (isTourRunning) {
      toast.success(isRunning ? "Timer paused" : "Timer started")
      setIsRunning(!isRunning)
      return
    }

    if (!selectedProject && !currentEntryId) {
      toast.error("Please select a project first")
      return
    }

    try {
      if (isRunning && currentEntryId) {
        // Pause - update database
        await pauseTimeEntry(currentEntryId)
        setIsRunning(false)
        // Immediately sync to update elapsed time from pause timestamp
        // The sync interval will pick this up, but we can also manually trigger
        toast.success("Timer paused")
      } else {
        // Start or Resume
        if (elapsedTime === 0 && !currentEntryId) {
          // Starting new
          const projectName = projects.find(p => p.id === selectedProject)?.name || "Unknown Project"
          const entry = await startTimeEntry({
            project_id: selectedProject,
            project_name: projectName,
            hourly_rate: hourlyRate === "" ? undefined : (typeof hourlyRate === "number" ? hourlyRate : undefined),
            note: note || undefined,
          })
          
          setCurrentEntryId(entry.id)
          setElapsedTime(0)
          setIsRunning(true)
          toast.success("Timer started")
        } else if (currentEntryId) {
          // Resuming - update database and adjust start_time to account for pause delay
          await resumeTimeEntry(currentEntryId, elapsedTime)
          setIsRunning(true)
          toast.success("Timer resumed")
        }
      }
    } catch (error) {
      console.error('Error starting/pausing timer:', error)
      toast.error('Failed to start/pause timer')
    }
  }

  const handleSave = async () => {
    // During tours, don't perform real operations - just show dummy data
    if (isTourRunning) {
      toast.success("Time entry saved")
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      setIsRunning(false)
      // Reset to dummy data to maintain tour experience
      const tourEntries = dummyTimeEntries as TimeEntry[]
      setEntries(tourEntries)
      return
    }

    if (elapsedTime === 0 && !currentEntryId) {
      toast.error("No time to save")
      return
    }

    if (!selectedProject) {
      toast.error("Please select a project")
      return
    }

    try {
      // Stop the timer first
      setIsRunning(false)
      
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // If we have a current entry, update it with note and hourly rate, then stop it
      if (currentEntryId) {
        // Update the entry with current note and hourly rate before stopping
        await updateTimeEntry(currentEntryId, {
          note: note || undefined,
          hourly_rate: hourlyRate === "" ? undefined : (typeof hourlyRate === "number" ? hourlyRate : parseFloat(String(hourlyRate)) || undefined),
        })
        await stopTimeEntry(currentEntryId)
      }

      // Reload data first to refresh entries list
      await loadData()
      
      // Completely reset all state AFTER reloading
      // This ensures we start fresh for the next timer
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      setIsRunning(false)
      
      // Clear interval one more time to be sure
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      toast.success("Time entry saved")
    } catch (error) {
      console.error('Error saving time entry:', error)
      toast.error('Failed to save time entry')
    }
  }

  const handleReset = async () => {
    // During tours, don't perform real operations - just show dummy data
    if (isTourRunning) {
      toast.success("Timer reset")
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      setIsRunning(false)
      return
    }

    if (elapsedTime === 0 && !isRunning && !currentEntryId) {
      return
    }
    
    try {
      // Stop the timer first
      setIsRunning(false)
      
      // Clear the interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      // If there's a current entry running, delete it
      if (currentEntryId) {
        await deleteTimeEntry(currentEntryId)
      }
      
      // Completely reset all state
      setElapsedTime(0)
      setNote("")
      setHourlyRate("")
      setCurrentEntryId(null)
      setSelectedProject("")
      toast.success("Timer reset")
    } catch (error) {
      console.error('Error resetting timer:', error)
      toast.error('Failed to reset timer')
    }
  }

  const handleDeleteEntry = async (id: string) => {
    // During tours, don't perform real operations - just show dummy data
    if (isTourRunning) {
      toast.success("Entry deleted")
      // Reset to dummy data to maintain tour experience
      const tourEntries = dummyTimeEntries as TimeEntry[]
      setEntries(tourEntries)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })
      setTodayEntries(todayEntries)
      const weekAgo = new Date(today)
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekEntries = tourEntries.filter(entry => {
        const entryDate = new Date(entry.start_time)
        return entryDate >= weekAgo
      })
      setWeekEntries(weekEntries)
      return
    }

    try {
      await deleteTimeEntry(id)
      await loadData()
      toast.success("Entry deleted")
    } catch (error) {
      console.error('Error deleting entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const handleNoteClick = (entry: TimeEntry) => {
    if (!entry.note) return
    
    const startDate = new Date(entry.start_time)
    const isToday = startDate.toDateString() === new Date().toDateString()
    const isYesterday = startDate.toDateString() === new Date(Date.now() - 86400000).toDateString()
    
    const dateStr = isToday 
      ? 'Today' 
      : isYesterday 
        ? 'Yesterday' 
        : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    setSelectedNote({
      note: entry.note,
      project: entry.project_name,
      date: dateStr,
    })
    setNoteDialogOpen(true)
  }

  // Calculate stats
  const totalToday = calculateTotalDuration(todayEntries) + (isRunning ? elapsedTime : 0)
  const totalWeek = calculateTotalDuration(weekEntries) + (isRunning ? elapsedTime : 0)
  const billableAmount = calculateTotalBillable(weekEntries) + (isRunning && hourlyRate !== "" && typeof hourlyRate === "number" ? (elapsedTime / 3600) * hourlyRate : 0)

  // Get entries for timesheets (use tour dummy data or real entries)
  const timesheetEntries = isTourRunning ? (dummyTimeEntries as TimeEntry[]) : entries
  
  // Get all available projects for filter (use tour dummy projects or real projects)
  const allProjects = isTourRunning 
    ? (dummyProjects.map(dp => {
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
      }))
    : projects
  
  // Filter entries for timesheets
  const filteredEntries = timesheetEntries.filter(entry => {
    // Project filter
    if (filterProject !== "all" && entry.project_id !== filterProject) return false
    
    // Search filter
    if (searchQuery && !entry.note?.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !entry.project_name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    
    // Date range filter
    const entryDate = new Date(entry.start_time)
    const now = new Date()
    
    switch (filterDateRange) {
      case "today":
        return entryDate.toDateString() === now.toDateString()
      case "yesterday":
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        return entryDate.toDateString() === yesterday.toDateString()
      case "this_week":
        const weekStart = new Date(now)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return entryDate >= weekStart
      case "last_week":
        const lastWeekStart = new Date(now)
        lastWeekStart.setDate(lastWeekStart.getDate() - lastWeekStart.getDay() - 7)
        const lastWeekEnd = new Date(lastWeekStart)
        lastWeekEnd.setDate(lastWeekEnd.getDate() + 6)
        return entryDate >= lastWeekStart && entryDate <= lastWeekEnd
      case "this_month":
        return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
      case "last_month":
        const lastMonth = new Date(now)
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        return entryDate.getMonth() === lastMonth.getMonth() && entryDate.getFullYear() === lastMonth.getFullYear()
      default:
        return true
    }
  })

  // Calculate totals for filtered entries
  const filteredTotalDuration = calculateTotalDuration(filteredEntries)
  const filteredTotalBillable = calculateTotalBillable(filteredEntries)

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Time Tracking</h1>
            </div>
            <p className="text-blue-100 text-lg">Track your project hours and manage time entries</p>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tracking" | "timesheets")} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white shadow-sm border-0">
            <TabsTrigger value="tracking" className="data-[state=active]:bg-[#3C3CFF] data-[state=active]:text-white" data-help="time-tracking-tab">
              <Timer className="w-4 h-4 mr-2" />
              Time Tracking
            </TabsTrigger>
            <TabsTrigger value="timesheets" className="data-[state=active]:bg-[#3C3CFF] data-[state=active]:text-white" data-help="timesheets-tab">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Timesheets
            </TabsTrigger>
          </TabsList>

          {/* Time Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">

        {/* Main Timer Card */}
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg relative" data-help="timer-card">
          {projects.length === 0 && !loading && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <Clock className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Projects Yet</h3>
                <p className="text-gray-600 mb-4 max-w-md">
                  Create a project first in <span className="font-medium text-[#3C3CFF]">Client Workflow</span> to start tracking time for your projects.
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard/workflow'}
                  className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
                >
                  Go to Client Workflow
                </Button>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Active Timer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Selector */}
            <div className="space-y-2">
              <Label>Select Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject} disabled={isRunning || loading}>
                <SelectTrigger className="w-full" data-help="project-selector">
                  <SelectValue placeholder="Choose a project..." />
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

            {/* Stopwatch Display */}
            <div className="text-center py-8">
              <div className="text-6xl font-mono font-bold text-gray-900 tracking-wider mb-4">
                {formatTimeDisplay(elapsedTime)}
              </div>
              {selectedProject && (
                <p className="text-sm text-gray-500">
                  Tracking: <span className="font-medium text-gray-700">
                    {projects.find(p => p.id === selectedProject)?.name}
                  </span>
                </p>
              )}
            </div>

            {/* Timer Controls */}
            <div className="flex gap-3">
              <Button
                onClick={handleStartPause}
                disabled={loading}
                className={`flex-1 ${
                  isRunning
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-green-500 hover:bg-green-600"
                } text-white`}
                size="lg"
                data-help="btn-start-pause-timer"
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : elapsedTime > 0 ? (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Start
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                disabled={elapsedTime === 0 && !currentEntryId || loading}
                variant="outline"
                size="lg"
                className="border-gray-300"
              >
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            {/* Save Button */}
            {(elapsedTime > 0 || currentEntryId) && (
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                Save Entry
              </Button>
            )}

            {/* Hourly Rate and Note Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hourly Rate (Optional)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="$0.00"
                    value={hourlyRate === "" ? "" : hourlyRate}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "") {
                        setHourlyRate("")
                      } else {
                        const numValue = parseFloat(value)
                        if (!isNaN(numValue) && numValue >= 0) {
                          setHourlyRate(numValue)
                        }
                      }
                    }}
                    className="pl-9"
                    min="0"
                    step="0.01"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Add Note (Optional)</Label>
                <Input
                  placeholder="What are you working on?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Time Today</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(totalToday)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{formatDuration(totalWeek)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billable (This Week)</p>
                  <p className="text-2xl font-bold text-gray-900">${billableAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-gray-900">Recent Entries</CardTitle>
              <p className="text-sm text-gray-500">Last 7 days</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Start</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Stop</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Billable</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Note</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        No time entries yet. Start tracking to see your entries here.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const startDate = new Date(entry.start_time)
                      const isToday = startDate.toDateString() === new Date().toDateString()
                      const isYesterday = startDate.toDateString() === new Date(Date.now() - 86400000).toDateString()
                      
                      return (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            {isToday ? (
                              <span className="text-blue-600 font-medium">Today</span>
                            ) : isYesterday ? (
                              <span className="text-gray-600 font-medium">Yesterday</span>
                            ) : (
                              startDate.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric' 
                              })
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{entry.project_name}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            {startDate.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                            {entry.end_time 
                              ? new Date(entry.end_time).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })
                              : <span className="text-green-600 font-medium">Running...</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {entry.duration_seconds ? formatDuration(entry.duration_seconds) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-semibold text-green-600">
                              ${entry.billable_amount ? entry.billable_amount.toFixed(2) : '-'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                            {entry.note ? (
                              <button
                                onClick={() => handleNoteClick(entry)}
                                className="text-left truncate block max-w-full hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                title="Click to view full note"
                              >
                                {entry.note}
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteEntry(entry.id)}
                                disabled={entry.is_running || loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Timesheets Tab */}
          <TabsContent value="timesheets" className="space-y-6">
            {/* Filters */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Project Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      Project
                    </Label>
                    <Select value={filterProject} onValueChange={setFilterProject}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Projects</SelectItem>
                        {allProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range Filter */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date Range
                    </Label>
                    <Select value={filterDateRange} onValueChange={setFilterDateRange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="yesterday">Yesterday</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="last_week">Last Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Search */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      Search
                    </Label>
                    <Input
                      placeholder="Search notes or projects..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex justify-end mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFilterProject("all")
                      setFilterDateRange("this_month")
                      setSearchQuery("")
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Time</p>
                      <p className="text-2xl font-bold text-gray-900">{formatDuration(filteredTotalDuration)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Billable</p>
                      <p className="text-2xl font-bold text-gray-900">${filteredTotalBillable.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Entries</p>
                      <p className="text-2xl font-bold text-gray-900">{filteredEntries.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Timesheets Table */}
            <Card className="border-0 shadow-sm" data-help="timesheets-table">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Time Entries</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Export functionality placeholder
                      toast.info("Export feature coming soon!")
                    }}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Project</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Start Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">End Time</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Duration</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Rate</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Billable</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Note</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-12 text-gray-500">
                            <div className="flex flex-col items-center gap-3">
                              <FileSpreadsheet className="w-12 h-12 text-gray-300" />
                              <p>No entries found matching your filters.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEntries.map((entry) => {
                          const startDate = new Date(entry.start_time)
                          const endDate = entry.end_time ? new Date(entry.end_time) : null
                          
                          return (
                            <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm text-gray-900 whitespace-nowrap">
                                {startDate.toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-medium text-gray-900">{entry.project_name}</span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                                {startDate.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                                {endDate 
                                  ? endDate.toLocaleTimeString('en-US', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })
                                  : <span className="text-green-600 font-medium">Running</span>}
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                  {entry.duration_seconds ? formatDuration(entry.duration_seconds) : '-'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 whitespace-nowrap">
                                ${entry.hourly_rate ? entry.hourly_rate.toFixed(0) : '-'}/hr
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="font-semibold text-green-600">
                                  ${entry.billable_amount ? entry.billable_amount.toFixed(2) : '0.00'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600 max-w-xs">
                                {entry.note ? (
                                  <button
                                    onClick={() => handleNoteClick(entry)}
                                    className="text-left truncate block max-w-full hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                    title="Click to view full note"
                                  >
                                    {entry.note}
                                  </button>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                    onClick={() => {
                                      if (!entry.id.startsWith('dummy-')) {
                                        handleDeleteEntry(entry.id)
                                      } else {
                                        toast.info("This is sample data. Real entries can be deleted.")
                                      }
                                    }}
                                    disabled={entry.is_running || loading || entry.id.startsWith('dummy-')}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Note View Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Entry Note
              </DialogTitle>
            </DialogHeader>
            {selectedNote && (
              <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                {/* Entry Details */}
                <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span>{selectedNote.date}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="h-4 w-4 flex-shrink-0" />
                    <span className="font-medium text-gray-900 truncate">{selectedNote.project}</span>
                  </div>
                </div>

                {/* Note Content */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[120px]">
                  <p className="text-gray-900 whitespace-pre-wrap leading-relaxed break-words">
                    {selectedNote.note}
                  </p>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setNoteDialogOpen(false)}
                    variant="outline"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}

