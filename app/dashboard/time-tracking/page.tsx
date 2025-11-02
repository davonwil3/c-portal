"use client"

import { useState, useEffect, useRef } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
} from "lucide-react"
import { toast } from "sonner"
import { getProjects, type Project } from "@/lib/projects"
import {
  getTimeEntries,
  getRunningTimer,
  startTimeEntry,
  stopTimeEntry,
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

export default function TimeTrackingPage() {
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // seconds
  const [note, setNote] = useState("")
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [hourlyRate, setHourlyRate] = useState<number>(100)
  
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [todayEntries, setTodayEntries] = useState<TimeEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<TimeEntry[]>([])
  
  // Note dialog state
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<{ note: string; project: string; date: string } | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load projects and entries on mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
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
          setHourlyRate(runningTimer.hourly_rate || 100)
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

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  const handleStartPause = async () => {
    if (!selectedProject) {
      toast.error("Please select a project first")
      return
    }

    try {
      if (isRunning) {
        // Pause
        setIsRunning(false)
        toast.success("Timer paused")
      } else {
        // Start or Resume
        if (elapsedTime === 0 && !currentEntryId) {
          // Starting new
          const projectName = projects.find(p => p.id === selectedProject)?.name || "Unknown Project"
          const entry = await startTimeEntry({
            project_id: selectedProject,
            project_name: projectName,
            hourly_rate: hourlyRate,
            note: note,
          })
          
          setCurrentEntryId(entry.id)
          toast.success("Timer started")
        } else {
          // Resuming
          toast.success("Timer resumed")
        }
        setIsRunning(true)
      }
    } catch (error) {
      console.error('Error starting/pausing timer:', error)
      toast.error('Failed to start/pause timer')
    }
  }

  const handleSave = async () => {
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

      // If we have a current entry, stop it
      if (currentEntryId) {
        await stopTimeEntry(currentEntryId)
      }

      // Reload data
      await loadData()
      
      // Reset all state
      setElapsedTime(0)
      setNote("")
      setCurrentEntryId(null)
      setSelectedProject("")
      toast.success("Time entry saved")
    } catch (error) {
      console.error('Error saving time entry:', error)
      toast.error('Failed to save time entry')
    }
  }

  const handleReset = async () => {
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
      
      // Reset all state
      setElapsedTime(0)
      setNote("")
      setCurrentEntryId(null)
      toast.success("Timer reset")
    } catch (error) {
      console.error('Error resetting timer:', error)
      toast.error('Failed to reset timer')
    }
  }

  const handleDeleteEntry = async (id: string) => {
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
  const billableAmount = calculateTotalBillable(weekEntries) + (isRunning && hourlyRate ? (elapsedTime / 3600) * hourlyRate : 0)

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

        {/* Main Timer Card */}
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-lg relative">
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
                <SelectTrigger className="w-full">
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
                    placeholder="100"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="pl-9"
                    min="0"
                    step="5"
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

