"use client"

import { useState, useMemo, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Settings,
  Search,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Video,
  Phone,
  Building2,
  Share2,
  User,
  DollarSign,
  FileText,
  Link as LinkIcon,
  X,
  MoreHorizontal,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, subWeeks, subMonths, isSameDay, parseISO, isBefore, startOfDay } from "date-fns"
import { 
  getMeetingTypes,
  createMeetingType,
  getScheduleSettings, 
  createOrUpdateScheduleSettings,
  getBookings,
  createBooking,
  updateBooking,
  createPublicBookingPage,
  type MeetingType,
  type Booking,
  type ScheduleSettings
} from "@/lib/schedule"
import { getClients } from "@/lib/clients"
import { getProjects } from "@/lib/projects"
import { getCurrentAccount } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Availability Picker Component
interface DayAvailability {
  enabled: boolean
  startTime: string
  endTime: string
}

interface AvailabilityPickerProps {
  onBack: () => void
}

function AvailabilityPicker({ onBack }: AvailabilityPickerProps) {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>(() => {
    const defaultAvailability: Record<string, DayAvailability> = {}
    daysOfWeek.forEach(day => {
      defaultAvailability[day] = {
        enabled: day !== 'Saturday' && day !== 'Sunday', // Weekdays enabled by default
        startTime: '09:00',
        endTime: '17:00',
      }
    })
    return defaultAvailability
  })
  const [pickerTimezone, setPickerTimezone] = useState("America/New_York")
  const [copiedDay, setCopiedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        const settings = await getScheduleSettings()
        if (settings) {
          setPickerTimezone(settings.timezone)
          if (settings.availability && Object.keys(settings.availability).length > 0) {
            setAvailability(settings.availability as Record<string, DayAvailability>)
          }
        }
      } catch (error) {
        console.error('Error loading schedule settings:', error)
        toast.error('Failed to load availability settings')
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleToggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled,
      },
    }))
  }

  const handleTimeChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }))
  }

  const copyToAllDays = (sourceDay: string) => {
    const source = availability[sourceDay]
    const newAvailability = { ...availability }
    daysOfWeek.forEach(day => {
      if (day !== sourceDay) {
        newAvailability[day] = {
          ...source,
          enabled: source.enabled,
        }
      }
    })
    setAvailability(newAvailability)
    setCopiedDay(sourceDay)
    setTimeout(() => setCopiedDay(null), 2000)
    toast.success(`Copied ${sourceDay} hours to all days`)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await createOrUpdateScheduleSettings({
        availability,
        timezone: pickerTimezone,
      })
      toast.success('Availability settings saved!')
      onBack()
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3C3CFF] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading availability settings...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onBack}
                  className="h-9 w-9"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold text-gray-900">Set Your Availability</h2>
              </div>
              <p className="text-gray-600 ml-12">
                Choose when you're available for meetings. Clients will only be able to book during these times.
              </p>
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="mb-6 ml-12">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">Timezone</Label>
            <Select value={pickerTimezone} onValueChange={setPickerTimezone}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days List */}
          <div className="space-y-3 ml-12">
            {daysOfWeek.map((day) => {
              const dayAvailability = availability[day]
              return (
                <div
                  key={day}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white"
                >
                  {/* Day Toggle */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDay(day)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:ring-offset-2 ${
                        dayAvailability.enabled ? 'bg-[#3C3CFF]' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          dayAvailability.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`font-medium ${dayAvailability.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                      {day}
                    </span>
                  </div>

                  {/* Time Inputs */}
                  {dayAvailability.enabled ? (
                    <>
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={dayAvailability.startTime}
                          onChange={(e) => handleTimeChange(day, 'startTime', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">to</span>
                        <Input
                          type="time"
                          value={dayAvailability.endTime}
                          onChange={(e) => handleTimeChange(day, 'endTime', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToAllDays(day)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {copiedDay === day ? (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy to all
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Unavailable</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t ml-12">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const newAvailability = { ...availability }
                  daysOfWeek.forEach(day => {
                    newAvailability[day] = {
                      enabled: day !== 'Saturday' && day !== 'Sunday',
                      startTime: '09:00',
                      endTime: '17:00',
                    }
                  })
                  setAvailability(newAvailability)
                  toast.success('Reset to default hours')
                }}
              >
                Reset to Default
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const newAvailability = { ...availability }
                  daysOfWeek.forEach(day => {
                    newAvailability[day] = {
                      ...newAvailability[day],
                      enabled: true,
                    }
                  })
                  setAvailability(newAvailability)
                  toast.success('All days enabled')
                }}
              >
                Enable All Days
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-8 pt-6 border-t flex justify-end gap-3 ml-12">
            <Button variant="outline" onClick={onBack} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SchedulePage() {
  const [view, setView] = useState("week")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [newBookingOpen, setNewBookingOpen] = useState(false)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<any>(null)
  const [serviceFilter, setServiceFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<string[]>(["Scheduled"])
  const [locationFilter, setLocationFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showAvailabilityPicker, setShowAvailabilityPicker] = useState(false)

  // Helper function to convert 24-hour format to 12-hour format
  const formatHour = (hour: number): string => {
    if (hour === 0) return "12 AM"
    if (hour === 12) return "12 PM"
    if (hour < 12) return `${hour} AM`
    return `${hour - 12} PM`
  }

  // List view filters
  const [listTimeFilter, setListTimeFilter] = useState<"all" | "today" | "upcoming" | "past">("all")
  const [listStatusFilter, setListStatusFilter] = useState<"all" | "Scheduled" | "Completed" | "Canceled">("all")
  const [listTypeFilter, setListTypeFilter] = useState<"all" | "Video" | "Phone" | "In-person">("all")
  const [listSearch, setListSearch] = useState("")
  const [focusedListIndex, setFocusedListIndex] = useState<number>(-1)
  const [shareOpen, setShareOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [createServiceOpen, setCreateServiceOpen] = useState(false)
  const [publicBookingUrl, setPublicBookingUrl] = useState("")
  
  // Create Service state
  const [serviceName, setServiceName] = useState("")
  const [serviceDuration, setServiceDuration] = useState("60")
  const [serviceDescription, setServiceDescription] = useState("")
  const [servicePrice, setServicePrice] = useState("")
  const [serviceLocation, setServiceLocation] = useState("Zoom")
  const [serviceColor, setServiceColor] = useState("bg-blue-500")
  
  // Settings state
  const [timezone, setTimezone] = useState("America/New_York")
  const [defaultDuration, setDefaultDuration] = useState("60")
  const [bufferTime, setBufferTime] = useState("15")
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [displayName, setDisplayName] = useState("")
  const [industryLabel, setIndustryLabel] = useState("")
  
  // Share link modal state
  const [shareMeetingTypeModalOpen, setShareMeetingTypeModalOpen] = useState(false)
  const [selectedShareMeetingType, setSelectedShareMeetingType] = useState<string>("")
  const [selectedShareMeetingTypeData, setSelectedShareMeetingTypeData] = useState<MeetingType | null>(null)
  
  // New Booking state
  const [newBookingClient, setNewBookingClient] = useState("")
  const [newBookingClientIsCustom, setNewBookingClientIsCustom] = useState(false)
  const [newBookingCustomClientName, setNewBookingCustomClientName] = useState("")
  const [newBookingService, setNewBookingService] = useState("")
  const [newBookingDate, setNewBookingDate] = useState("")
  const [newBookingStartTime, setNewBookingStartTime] = useState("")
  const [newBookingLocation, setNewBookingLocation] = useState("Zoom")
  const [newBookingNotes, setNewBookingNotes] = useState("")
  const [newBookingProject, setNewBookingProject] = useState("")
  
  // Data state
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings | null>(null)
  const [savingService, setSavingService] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingBooking, setSavingBooking] = useState(false)
  const [rescheduleOpen, setRescheduleOpen] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleStartTime, setRescheduleStartTime] = useState("")
  const [updatingBooking, setUpdatingBooking] = useState(false)
  
  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [meetingTypesData, bookingsData, clientsData, projectsData, settingsData] = await Promise.all([
          getMeetingTypes(),
          getBookings(),
          getClients(),
          getProjects(),
          getScheduleSettings(),
        ])
        setMeetingTypes(meetingTypesData)
        setBookings(bookingsData)
        setClients(clientsData)
        setProjects(projectsData)
        if (settingsData) {
          setScheduleSettings(settingsData)
          setTimezone(settingsData.timezone)
          setDefaultDuration(String(settingsData.default_duration_minutes))
          setBufferTime(String(settingsData.buffer_time_minutes))
          setEmailNotifications(settingsData.email_notifications)
          
          // Generate public booking URL
          if (settingsData.shareable_link_slug) {
            const baseUrl = typeof window !== 'undefined' 
              ? window.location.origin 
              : process.env.NEXT_PUBLIC_APP_URL || 'https://jolix.io'
            setPublicBookingUrl(`${baseUrl}/schedule/${settingsData.shareable_link_slug}`)
          }
        }
      } catch (error) {
        console.error('Error loading schedule data:', error)
        toast.error('Failed to load schedule data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getMeetingType = (location: string): "Video" | "Phone" | "In-person" => {
    if (location === "Zoom" || location === "Google Meet") return "Video"
    if (location === "Phone") return "Phone"
    return "In-person"
  }

  const canJoinNow = (booking: any): boolean => {
    const type = getMeetingType(booking.location)
    if (type !== "Video") return false
    try {
      const d = parseISO(booking.date)
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), booking.startHour || 0, 0, 0, 0)
      const now = new Date()
      const diffMin = (now.getTime() - start.getTime()) / 60000
      return diffMin >= -15 && diffMin <= 15
    } catch {
      return false
    }
  }

  // Use real bookings from database
  const allBookings = useMemo(() => {
    return bookings.map(booking => ({
      id: booking.id,
      clientName: booking.client_name || 'Unknown Client',
      service: booking.service_name || 'Service',
      serviceColor: booking.service_color || 'bg-blue-500',
      date: booking.scheduled_date,
      startTime: format(new Date(`2000-01-01T${booking.start_time}`), 'h:mm a'),
      endTime: format(new Date(`2000-01-01T${booking.end_time}`), 'h:mm a'),
      startHour: parseInt(booking.start_time.split(':')[0]),
      duration: booking.service_duration_minutes ? `${booking.service_duration_minutes} min` : '1 hour',
      location: booking.location_type || 'Zoom',
      status: booking.status,
      price: booking.service_price ? `$${booking.service_price}` : undefined,
      notes: booking.description || booking.client_notes || booking.notes || '',
      createdAt: format(new Date(booking.created_at), 'MMM dd, yyyy'),
      bookingId: booking.booking_number || booking.id.substring(0, 8),
    }))
  }, [bookings])


  // Calculate date range based on view
  const dateRange = useMemo(() => {
    if (view === "week") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return { start, end, label: `${format(start, "MMM d")}–${format(end, "d, yyyy")}` }
    } else if (view === "month") {
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      return { start, end, label: format(currentDate, "MMMM yyyy") }
    } else {
      // Day view
      return { start: currentDate, end: currentDate, label: format(currentDate, "MMMM d, yyyy") }
    }
  }, [currentDate, view])

  // Get week days for week view
  const weekDays = useMemo(() => {
    const days = []
    for (let i = 0; i < 7; i++) {
      days.push(addDays(dateRange.start, i))
    }
    return days
  }, [dateRange.start])

  // Filter bookings based on filters and date range
  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking) => {
      const bookingDate = parseISO(booking.date)
      
      // Date range filter
      if (bookingDate < dateRange.start || bookingDate > dateRange.end) {
        return false
      }
      
      // Service filter
      if (serviceFilter !== "all" && booking.service !== serviceFilter) {
        return false
      }
      
      // Status filter
      if (statusFilter.length > 0 && !statusFilter.includes(booking.status)) {
        return false
      }
      
      // Location filter
      if (locationFilter !== "all" && booking.location !== locationFilter) {
        return false
      }
      
      // Search filter
      if (searchQuery && !booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !booking.service.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      
      return true
    })
  }, [allBookings, dateRange, serviceFilter, statusFilter, locationFilter, searchQuery])

  // Navigation functions
  const handlePrevious = () => {
    if (view === "week") {
      setCurrentDate(subWeeks(currentDate, 1))
    } else if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  const handleNext = () => {
    if (view === "week") {
      setCurrentDate(addWeeks(currentDate, 1))
    } else if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleBookingClick = (booking: any) => {
    setSelectedBooking(booking)
    setDetailsDrawerOpen(true)
  }

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
  }

  const getLocationIcon = (location: string) => {
    switch (location) {
      case "Zoom":
      case "Google Meet":
        return <Video className="h-4 w-4" />
      case "Phone":
        return <Phone className="h-4 w-4" />
      case "In-Person":
        return <Building2 className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50 -m-6">
        {/* Two Column Layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Sidebar */}
          <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* Header */}
          <div className="mb-6 rounded-xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-5 text-white" data-help="schedule-header">
            <h1 className="text-2xl font-bold mb-2">
                  Scheduler
                </h1>
            <p className="text-sm text-blue-100 mb-4">
                  Manage your appointments, meetings, and bookings in one place
                </p>
            <div className="flex items-center gap-3 p-3 bg-white/20 backdrop-blur-sm rounded-lg" data-help="schedule-stats">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{allBookings.filter(b => b.status !== 'Canceled').length}</div>
                <div className="text-xs text-blue-100">Total Bookings</div>
                </div>
                </div>
        </div>

          {/* Action Buttons */}
          <div className="mb-6 space-y-2">
            <Button variant="outline" className="w-full justify-start gap-2" data-help="btn-connect-calendar">
              <LinkIcon className="h-4 w-4" />
              Connect Calendar
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              data-help="btn-availability"
              onClick={() => setShowAvailabilityPicker(true)}
            >
              <Clock className="h-4 w-4" />
              Availability
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" aria-label="Share scheduler link" onClick={() => setShareMeetingTypeModalOpen(true)} data-help="btn-share-schedule">
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              onClick={() => setCreateServiceOpen(true)}
              data-help="btn-create-service"
            >
              <Plus className="h-4 w-4" />
              Create Meeting Type
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2" 
              data-help="btn-schedule-settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button className="w-full justify-start gap-2 bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white" onClick={() => setNewBookingOpen(true)} data-help="btn-new-booking">
              <Plus className="h-4 w-4" />
              New Booking
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-4" data-help="schedule-filters">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Meeting Type</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger data-help="filter-service">
                    <SelectValue placeholder="All meeting types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All meeting types</SelectItem>
                  {meetingTypes.filter(mt => mt.is_active && !mt.is_archived).map((meetingType) => (
                    <SelectItem key={meetingType.id} value={meetingType.name}>
                      {meetingType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div data-help="filter-status">
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Status</Label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant="outline" 
                  className={`cursor-pointer transition-colors ${statusFilter.includes("Scheduled") ? "bg-green-100 border-green-500 text-green-700" : "hover:bg-gray-100"}`}
                  onClick={() => toggleStatusFilter("Scheduled")}
                >
                  Scheduled
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`cursor-pointer transition-colors ${statusFilter.includes("Completed") ? "bg-blue-100 border-blue-500 text-blue-700" : "hover:bg-gray-100"}`}
                  onClick={() => toggleStatusFilter("Completed")}
                >
                  Completed
                </Badge>
                <Badge 
                  variant="outline" 
                  className={`cursor-pointer transition-colors ${statusFilter.includes("Canceled") ? "bg-red-100 border-red-500 text-red-700" : "hover:bg-gray-100"}`}
                  onClick={() => toggleStatusFilter("Canceled")}
                >
                  Canceled
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Location</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Legend */}
            <div className="pt-4 border-t" data-help="schedule-legend">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Legend</Label>
              <div className="space-y-2">
                {meetingTypes.filter(mt => mt.is_active && !mt.is_archived).map((meetingType) => (
                  <div key={meetingType.id} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${meetingType.color}`}></div>
                    <span className="text-sm text-gray-600">{meetingType.name}</span>
                  </div>
                ))}
                {meetingTypes.filter(mt => mt.is_active && !mt.is_archived).length === 0 && (
                  <p className="text-sm text-gray-500 italic">No meeting types yet</p>
                )}
              </div>
              
              {/* Filtered count & Reset */}
              <div className="mt-4 pt-4 border-t space-y-2">
                <p className="text-xs text-gray-500">
                  Showing {filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}
                </p>
                {(serviceFilter !== 'all' || locationFilter !== 'all' || statusFilter.length !== 1 || statusFilter[0] !== 'Scheduled' || searchQuery) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => {
                      setServiceFilter('all')
                      setLocationFilter('all')
                      setStatusFilter(['Scheduled'])
                      setSearchQuery('')
                      toast.success('Filters reset')
                    }}
                  >
                    <X className="h-3 w-3 mr-2" />
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          
           

          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 p-6 mx-6 mb-4 rounded-xl">
            {/* Date Navigation and Search */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Date Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleToday}>Today</Button>
                  <Button variant="outline" size="icon" onClick={handleNext}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold text-gray-900 ml-2">
                    {dateRange.label}
                  </span>
                </div>
              </div>

              {/* Search */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings, clients…"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    // Automatically switch to list view when searching
                    if (e.target.value.trim() && view !== 'list') {
                      setView('list')
                    }
                  }}
                />
              </div>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-3">
              <Tabs value={view} onValueChange={setView}>
              <TabsList className="grid w-full max-w-md grid-cols-4" data-help="schedule-view-tabs">
                <TabsTrigger value="week" data-help="view-week">Week</TabsTrigger>
                <TabsTrigger value="day" data-help="view-day">Day</TabsTrigger>
                <TabsTrigger value="month" data-help="view-month">Month</TabsTrigger>
                <TabsTrigger value="list" data-help="view-list">List</TabsTrigger>
              </TabsList>
            </Tabs>
              
              {/* Date Picker */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !currentDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {currentDate ? format(currentDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(date) => {
                      if (date) {
                        setCurrentDate(date)
                        setSelectedDate(date)
                        setDatePickerOpen(false)
                        toast.success(`Jumped to ${format(date, "MMMM d, yyyy")}`)
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Calendar Content or Availability Picker */}
          <div className="flex-1 overflow-auto p-6" data-help="schedule-calendar-content">
            {showAvailabilityPicker ? (
              <AvailabilityPicker onBack={() => setShowAvailabilityPicker(false)} />
            ) : (
            <Tabs value={view} className="h-full">
              {/* Week View */}
              <TabsContent value="week" className="m-0 h-full" data-help="week-view-content">
                {filteredBookings.length === 0 ? (
                  <Card className="h-full">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-center h-[600px]">
                        <div className="text-center">
                          <CalendarIcon className="h-20 w-20 mx-auto mb-6 text-gray-300" />
                          <h3 className="text-2xl font-bold text-gray-900 mb-2">No bookings this week</h3>
                          <p className="text-gray-600 mb-6 max-w-md">
                            Your schedule is clear for the week of {dateRange.label}
                          </p>
                          <Button onClick={() => setNewBookingOpen(true)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" size="lg">
                            <Plus className="mr-2 h-5 w-5" />
                            Create Your First Booking
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="bg-white rounded-xl border shadow-sm flex flex-col h-full overflow-hidden">
                    {/* Week Grid Header */}
                    <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-20 flex-shrink-0">
                      <div className="p-4 border-r bg-gray-50"></div>
                      {weekDays.map((day, i) => {
                        const isToday = isSameDay(day, new Date())
                        return (
                          <div key={i} className={`p-4 text-center border-r last:border-r-0 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                            <div className="text-sm font-medium text-gray-600">{format(day, "EEE")}</div>
                            <div className={`text-2xl font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                              {format(day, "d")}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Week Grid Body */}
                    <div className="flex-1 overflow-auto min-h-0">
                      <div className="grid grid-cols-8 bg-white min-w-[900px]" style={{ minHeight: '1920px' }}>
                        <div className="border-r">
                          {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="h-20 p-2 border-b text-sm text-gray-600 text-right">
                              {formatHour(i)}
                            </div>
                          ))}
                        </div>

                        {/* Day Columns */}
                        {weekDays.map((day, dayIndex) => {
                          const dayBookings = filteredBookings.filter(b => isSameDay(parseISO(b.date), day))
                          const isToday = isSameDay(day, new Date())
                          const currentHour = new Date().getHours()
                          
                          return (
                            <div key={dayIndex} className={`border-r last:border-r-0 relative ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
                              {/* Hour Slots */}
                              {Array.from({ length: 24 }).map((_, hourIndex) => (
                                <div key={hourIndex} className="h-20 border-b hover:bg-gray-50 transition-colors"></div>
                              ))}

                              {/* Render Bookings for this day */}
                              {dayBookings.map((booking) => {
                                const topPosition = (booking.startHour - 0) * 80 // 0:00 start, 80px per hour
                                const colorMap: any = {
                                  "bg-blue-500": { bg: "bg-blue-100", border: "border-blue-500", text: "text-blue" },
                                  "bg-purple-500": { bg: "bg-purple-100", border: "border-purple-500", text: "text-purple" },
                                  "bg-green-500": { bg: "bg-green-100", border: "border-green-500", text: "text-green" },
                                  "bg-orange-500": { bg: "bg-orange-100", border: "border-orange-500", text: "text-orange" },
                                  "bg-pink-500": { bg: "bg-pink-100", border: "border-pink-500", text: "text-pink" },
                                }
                                const colors = colorMap[booking.serviceColor] || colorMap["bg-blue-500"]
                                
                                return (
                                  <div
                                    key={booking.id}
                                    className={`absolute left-1 right-1 h-[76px] ${colors.bg} border-l-4 ${colors.border} rounded-lg p-2 cursor-pointer hover:shadow-lg transition-all group overflow-hidden ${
                                      booking.status === 'Completed' || booking.status === 'Canceled' ? 'opacity-60 grayscale' : ''
                                    }`}
                                    style={{ top: `${topPosition}px` }}
                                    onClick={() => handleBookingClick(booking)}
                                  >
                                    <div className={`text-sm font-semibold ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-500' : `${colors.text}-900`} truncate`}>{booking.clientName}</div>
                                    <div className={`text-xs ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-400' : `${colors.text}-700`} truncate`}>{booking.service}</div>
                                    <div className={`text-xs ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-400' : `${colors.text}-600`} mt-1`}>{booking.startTime}</div>
                                    
                                    {/* Quick Actions on Hover */}
                                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                                      <Button size="icon" variant="ghost" className="h-6 w-6 bg-white shadow-sm">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 bg-white shadow-sm">
                                        <Clock className="h-3 w-3" />
                                      </Button>
                                      <Button size="icon" variant="ghost" className="h-6 w-6 bg-white shadow-sm text-red-600">
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}

                              {/* Current Time Indicator (if today) */}
                              {isToday && currentHour >= 0 && currentHour <= 23 && (
                                <div 
                                  className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                                  style={{ top: `${(currentHour - 0) * 80 + (new Date().getMinutes() / 60) * 80}px` }}
                                >
                                  <div className="w-3 h-3 rounded-full bg-red-500 -mt-1.5 -ml-1.5"></div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Day View */}
              <TabsContent value="day" className="m-0 h-full" data-help="day-view-content">
                <Card className="h-full">
                  <CardContent className="p-0">
                    {/* Day Header */}
                    <div className="border-b p-6 bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">{format(currentDate, "EEEE")}</h3>
                          <p className="text-gray-600 mt-1">{format(currentDate, "MMMM d, yyyy")}</p>
                        </div>
                        <Badge className="text-lg px-4 py-2">
                          {(() => {
                            const count = allBookings.filter(b => {
                              try {
                                return isSameDay(parseISO(b.date), currentDate) &&
                                  (serviceFilter === "all" || b.service === serviceFilter) &&
                                  (statusFilter.length === 0 || statusFilter.includes(b.status)) &&
                                  (locationFilter === "all" || b.location === locationFilter) &&
                                  (!searchQuery || b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || b.service.toLowerCase().includes(searchQuery.toLowerCase()))
                              } catch (e) {
                                return false
                              }
                            }).length
                            return count
                          })()} {(() => {
                            const count = allBookings.filter(b => {
                              try {
                                return isSameDay(parseISO(b.date), currentDate) &&
                                  (serviceFilter === "all" || b.service === serviceFilter) &&
                                  (statusFilter.length === 0 || statusFilter.includes(b.status)) &&
                                  (locationFilter === "all" || b.location === locationFilter) &&
                                  (!searchQuery || b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || b.service.toLowerCase().includes(searchQuery.toLowerCase()))
                              } catch (e) {
                                return false
                              }
                            }).length
                            return count === 1 ? 'booking' : 'bookings'
                          })()}
                        </Badge>
                      </div>
                    </div>

                    {/* Day Schedule */}
                    <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                      {(() => {
                        // Use the same filtering logic as week view - filter allBookings directly
                        const dayBookings = allBookings.filter(b => {
                          try {
                            const bookingDate = parseISO(b.date)
                            
                            // Date filter - same day
                            if (!isSameDay(bookingDate, currentDate)) {
                              return false
                            }
                            
                            // Service filter
                            if (serviceFilter !== "all" && b.service !== serviceFilter) {
                              return false
                            }
                            
                            // Status filter
                            if (statusFilter.length > 0 && !statusFilter.includes(b.status)) {
                              return false
                            }
                            
                            // Location filter
                            if (locationFilter !== "all" && b.location !== locationFilter) {
                              return false
                            }
                            
                            // Search filter
                            if (searchQuery && !b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                                !b.service.toLowerCase().includes(searchQuery.toLowerCase())) {
                              return false
                            }
                            
                            return true
                          } catch (e) {
                            console.error('Error parsing booking date:', b.date, e)
                            return false
                          }
                        })
                        if (dayBookings.length === 0) {
                          return (
                            <div className="text-center py-20">
                              <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings today</h3>
                              <p className="text-gray-600 mb-6">Your schedule is clear for {format(currentDate, "MMMM d")}</p>
                              <Button onClick={() => setNewBookingOpen(true)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Booking
                              </Button>
                            </div>
                          )
                        }
                        return (
                          <>
                            {dayBookings
                              .sort((a, b) => a.startHour - b.startHour)
                              .map((booking) => (
                                <div
                                  key={booking.id}
                                  className={`${booking.serviceColor.replace('bg-', 'bg-').replace('-500', '-50')} border-l-4 ${booking.serviceColor.replace('bg-', 'border-')} rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all ${
                                    booking.status === 'Completed' || booking.status === 'Canceled' ? 'opacity-60 grayscale' : ''
                                  }`}
                                  onClick={() => handleBookingClick(booking)}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-lg font-semibold ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-500' : 'text-gray-900'}`}>{booking.startTime} - {booking.endTime}</span>
                                        <Badge variant="outline">{booking.duration}</Badge>
                                      </div>
                                      <h4 className={`text-xl font-bold mb-1 ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-500' : 'text-gray-900'}`}>{booking.clientName}</h4>
                                      <p className={`font-medium mb-2 ${booking.status === 'Completed' || booking.status === 'Canceled' ? 'text-gray-400' : 'text-gray-700'}`}>{booking.service}</p>
                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                          {getLocationIcon(booking.location)}
                                          <span>{booking.location}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <DollarSign className="h-4 w-4" />
                                          <span>{booking.price}</span>
                                        </div>
                                      </div>
                                      {booking.notes && (
                                        <p className="text-sm text-gray-600 mt-2 italic">{booking.notes}</p>
                                      )}
                                    </div>
                                    <Badge className={`${booking.status === 'Scheduled' ? 'bg-green-100 text-green-700' : booking.status === 'Completed' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                      {booking.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </>
                        )
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Month View */}
              <TabsContent value="month" className="m-0 h-full" data-help="month-view-content">
                <Card className="h-full">
                  <CardContent className="p-0">
                    {/* Month Header */}
                    <div className="border-b p-6 bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-3xl font-bold text-gray-900">{format(currentDate, "MMMM yyyy")}</h3>
                          <p className="text-gray-600 mt-1">{filteredBookings.length} total bookings this month</p>
                        </div>
                      </div>
                    </div>

                    {/* Month Grid - Simplified */}
                    <div className="p-6">
                      <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                            {day}
                          </div>
                        ))}
                      </div>
                      
                      <div className="grid grid-cols-7 gap-2 overflow-auto max-h-[70vh]">
                        {Array.from({ length: 42 }).map((_, i) => {
                          const monthStart = startOfMonth(currentDate)
                          const firstDay = monthStart.getDay()
                          const dayDate = addDays(monthStart, i - firstDay)
                          const isCurrentMonth = dayDate.getMonth() === currentDate.getMonth()
                          const isToday = isSameDay(dayDate, new Date())
                          const dayBookings = filteredBookings.filter(b => isSameDay(parseISO(b.date), dayDate))
                          
                          return (
                            <div
                              key={i}
                              className={`min-h-[100px] border rounded-lg p-2 ${
                                !isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white hover:bg-gray-50'
                              } ${isToday ? 'ring-2 ring-blue-500' : ''} cursor-pointer transition-all`}
                              onClick={() => {
                                setCurrentDate(dayDate)
                                setView('day')
                              }}
                            >
                              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                                {format(dayDate, 'd')}
                              </div>
                              <div className="space-y-1">
                                {dayBookings.slice(0, 3).map(booking => (
                                  <div
                                    key={booking.id}
                                    className={`${booking.serviceColor.replace('bg-', 'bg-').replace('-500', '-100')} text-xs p-1 rounded truncate ${
                                      booking.status === 'Completed' || booking.status === 'Canceled' ? 'opacity-60 grayscale' : ''
                                    }`}
                                  >
                                    {booking.startTime.split(' ')[0]} {booking.clientName.split(' ')[0]}
                                  </div>
                                ))}
                                {dayBookings.length > 3 && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    +{dayBookings.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* List View */}
              <TabsContent value="list" className="m-0 h-full" data-help="list-view-content">
                <Card className="h-full">
                  <CardContent className="p-0 h-full overflow-auto">
                    {/* Filters Row */}
                    <div className="p-4 flex items-center justify-between gap-4 border-b sticky top-0 z-20 bg-white">
                      <div className="hidden md:block text-sm text-gray-700 font-medium">All bookings</div>
                      <div className="flex items-center gap-4 flex-wrap justify-end w-full">
                        {/* Time Filter */}
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-gray-600">Time</Label>
                          <Select value={listTimeFilter} onValueChange={(v: any) => setListTimeFilter(v)}>
                            <SelectTrigger className="w-[140px] h-9 rounded-lg">
                              <SelectValue placeholder="Time" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="upcoming">Upcoming</SelectItem>
                              <SelectItem value="past">Past</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-gray-600">Status</Label>
                          <Select value={listStatusFilter} onValueChange={(v: any) => setListStatusFilter(v)}>
                            <SelectTrigger className="w-[140px] h-9 rounded-lg">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="Scheduled">Scheduled</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Type Filter */}
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-gray-600">Type</Label>
                          <Select value={listTypeFilter} onValueChange={(v: any) => setListTypeFilter(v)}>
                            <SelectTrigger className="w-[140px] h-9 rounded-lg">
                              <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="Video">Video</SelectItem>
                              <SelectItem value="Phone">Phone</SelectItem>
                              <SelectItem value="In-person">In-person</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Search */}
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs text-gray-600">Search</Label>
                          <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              aria-label="Search bookings"
                              placeholder="Search bookings… (client, title)"
                              className="pl-9 rounded-lg h-9"
                              value={listSearch}
                              onChange={(e) => setListSearch(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const now = new Date()
                      const matchesSearch = (b: any) => {
                        // Use main searchQuery if available, otherwise use listSearch
                        const q = (searchQuery || listSearch).trim().toLowerCase()
                        if (!q) return true
                        return (
                          b.clientName.toLowerCase().includes(q) ||
                          (b.service || "").toLowerCase().includes(q)
                        )
                      }
                      const matchesStatus = (b: any) => listStatusFilter === "all" || b.status === listStatusFilter
                      const matchesType = (b: any) => listTypeFilter === "all" || getMeetingType(b.location) === listTypeFilter
                      const byDateTime = (a: any, b: any) => {
                        const da = parseISO(a.date); const db = parseISO(b.date)
                        const aT = new Date(da.getFullYear(), da.getMonth(), da.getDate(), a.startHour || 0).getTime()
                        const bT = new Date(db.getFullYear(), db.getMonth(), db.getDate(), b.startHour || 0).getTime()
                        return aT - bT
                      }
                      // Use allBookings and apply only list view filters (not left panel filters)
                      const all = allBookings
                        .filter((b) => {
                          // Service filter (from left panel - still applies)
                          if (serviceFilter !== "all" && b.service !== serviceFilter) {
                            return false
                          }
                          
                          // Location filter (from left panel - still applies)
                          if (locationFilter !== "all" && b.location !== locationFilter) {
                            return false
                          }
                          
                          // Search filter (from main search bar - still applies)
                          if (searchQuery && !b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
                              !b.service.toLowerCase().includes(searchQuery.toLowerCase())) {
                            return false
                          }
                          
                          // Don't apply statusFilter from left panel - list view has its own status filter
                          
                          return true
                        })
                        .filter(matchesSearch)
                        .filter(matchesStatus)
                        .filter(matchesType)
                        .sort(byDateTime)

                      const nowStartOfDay = startOfDay(now)
                      const todayList = all.filter(b => {
                        try {
                          const bookingDate = parseISO(b.date)
                          // Today: date is today AND status is Scheduled (not completed/cancelled)
                          return isSameDay(bookingDate, now) && b.status === 'Scheduled'
                        } catch (e) {
                          return false
                        }
                      })
                      const upcomingList = all.filter(b => {
                        try {
                          const bookingDate = parseISO(b.date)
                          const bookingStartOfDay = startOfDay(bookingDate)
                          // Upcoming: date is after today AND status is Scheduled
                          return bookingStartOfDay > nowStartOfDay && b.status === 'Scheduled'
                        } catch (e) {
                          return false
                        }
                      })
                      const pastList = all.filter(b => {
                        try {
                          const bookingDate = parseISO(b.date)
                          const bookingStartOfDay = startOfDay(bookingDate)
                          // Past: date is before today (any status), OR status is Completed/Canceled (any date)
                          return bookingStartOfDay < nowStartOfDay || 
                            b.status === 'Completed' || 
                            b.status === 'Canceled'
                        } catch (e) {
                          return false
                        }
                      })

                      const groups: Array<{key: "today" | "upcoming" | "past", title: string, items: any[]}> = [
                        { key: "today", title: `Today — ${format(now, "MMM d, yyyy")}`, items: todayList },
                        { key: "upcoming", title: "Upcoming", items: upcomingList },
                        { key: "past", title: "Past", items: pastList },
                      ]

                      const visibleGroups = groups.filter(g => listTimeFilter === "all" || g.key === listTimeFilter)
                      const totalVisible = visibleGroups.reduce((sum, g) => sum + g.items.length, 0)

                      if (totalVisible === 0) {
                        return (
                          <div className="p-10 text-center text-gray-600">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <div className="text-lg font-medium">No bookings yet</div>
                            <p className="text-sm text-gray-500">Share your scheduler link or add a booking.</p>
                            <div className="mt-4 flex items-center justify-center gap-2">
                              <Button variant="outline" className="gap-2" onClick={() => setShareMeetingTypeModalOpen(true)}>
                                <Share2 className="h-4 w-4" />
                                Share link
                              </Button>
                              <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => setNewBookingOpen(true)}>
                                <Plus className="h-4 w-4 mr-1" />
                                New booking
                              </Button>
                            </div>
                          </div>
                        )
                      }

                      let flatIndex = -1
                      return (
                        <div
                          tabIndex={0}
                          onKeyDown={(e) => {
                            const flatTotal = visibleGroups.reduce((sum, g) => sum + g.items.length, 0)
                            if (e.key === "ArrowDown") {
                              e.preventDefault()
                              setFocusedListIndex(prev => Math.min((prev < 0 ? 0 : prev + 1), flatTotal - 1))
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault()
                              setFocusedListIndex(prev => Math.max(prev - 1, 0))
                            } else if (e.key === "Enter" && focusedListIndex >= 0) {
                              // Find the booking by index
                              let idx = 0
                              for (const g of visibleGroups) {
                                for (const b of g.items) {
                                  if (idx === focusedListIndex) {
                                    handleBookingClick(b)
                                    return
                                  }
                                  idx++
                                }
                              }
                            }
                          }}
                          className="outline-none"
                        >
                          {visibleGroups.map((group) => (
                            <div key={group.key} className="border-b">
                              <div className="p-4 bg-gray-50 sticky top-[56px] z-10">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-gray-900">{group.title}</h3>
                                  <span className="text-sm text-gray-600">{group.items.length} booking{group.items.length !== 1 ? "s" : ""}</span>
                                </div>
                              </div>
                              <div className="divide-y">
                                {group.items.length === 0 ? (
                                  <div className="p-8 text-center text-gray-500">
                                    <CalendarIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                                    {group.key === "today" ? "No bookings for today." : group.key === "upcoming" ? "No upcoming bookings." : "No past bookings."}
                                  </div>
                                ) : (
                                  group.items.map((booking) => {
                                    flatIndex++
                                    const groupIsPast = group.key === "past"
                                    const isOverdue = groupIsPast && booking.status === "Scheduled"
                                    const type = getMeetingType(booking.location)
                                    const isFocused = focusedListIndex === flatIndex
                                    return (
                                      <div
                                        key={booking.id}
                                        className={`p-4 cursor-pointer transition-all rounded-xl m-2 border ${isFocused ? "ring-2 ring-[#4647E0]" : "hover:shadow-md hover:-translate-y-0.5"} `}
                                        onClick={() => handleBookingClick(booking)}
                                        onMouseEnter={() => setFocusedListIndex(flatIndex)}
                                      >
                                        <div className="flex items-start justify-between gap-4">
                                          {/* Left: Time + Duration */}
                                          <div className="w-28 flex-shrink-0">
                                            <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                              {isOverdue && <span className="inline-block w-2 h-2 rounded-full bg-red-500" aria-hidden="true"></span>}
                                              {booking.startTime}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">{booking.duration}</div>
                                          </div>
                                          {/* Main */}
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="font-semibold text-gray-900 truncate">{booking.clientName}</span>
                                              <Badge
                                                variant="outline"
                                                className={`text-xs ${
                                                  booking.status === "Scheduled" ? "text-green-600 border-green-600" :
                                                  booking.status === "Completed" ? "text-gray-600 border-gray-400" :
                                                  "text-red-600 border-red-600"
                                                }`}
                                              >
                                                {booking.status}
                                              </Badge>
                                            </div>
                                            <div className="text-sm text-gray-700 font-medium mb-1 truncate">{booking.service}</div>
                                            <div className="text-xs text-gray-500 mb-2">
                                              {format(parseISO(booking.date), 'EEEE, MMMM d, yyyy')}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
                                              <div className="flex items-center gap-1">
                                                {getLocationIcon(booking.location)}
                                                <span>{type}</span>
                                              </div>
                                              {booking.price && (
                                                <div className="flex items-center gap-1">
                                                  <DollarSign className="h-3 w-3" />
                                                  <span>{booking.price}</span>
                                                </div>
                                              )}
                                              {booking.notes && (
                                                <div className="flex items-center gap-1 text-gray-500 min-w-0">
                                                  <FileText className="h-3 w-3" />
                                                  <span className="truncate max-w-[220px]">{booking.notes}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          {/* Right: Actions */}
                                          <div className="flex items-center gap-2 flex-shrink-0">
                                            {canJoinNow(booking) && (
                                              <Button size="sm" variant="outline" className="text-[#4647E0] border-[#4647E0]">
                                                Join
                                              </Button>
                                            )}
                                            <Button size="icon" variant="ghost" aria-label="Edit booking">
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-red-600 hover:text-red-700" aria-label="Delete booking">
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="max-w-2xl" data-help="new-booking-modal">
          <DialogHeader>
            <DialogTitle data-help="new-booking-title">New Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <Select 
                  value={newBookingClientIsCustom ? "custom" : newBookingClient || undefined} 
                  onValueChange={(value) => {
                    if (value === "custom") {
                      setNewBookingClientIsCustom(true)
                      setNewBookingClient("")
                    } else {
                      setNewBookingClientIsCustom(false)
                      setNewBookingClient(value)
                      setNewBookingCustomClientName("")
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">+ Custom Client</SelectItem>
                    {clients.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">No clients found</div>
                    ) : (
                      clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {`${client.first_name} ${client.last_name}`}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {newBookingClientIsCustom && (
                  <Input
                    placeholder="Enter client name"
                    value={newBookingCustomClientName}
                    onChange={(e) => setNewBookingCustomClientName(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>
              <div>
                <Label>Meeting Type</Label>
                <Select value={newBookingService} onValueChange={setNewBookingService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetingTypes.map((meetingType) => (
                      <SelectItem key={meetingType.id} value={meetingType.id}>
                        {meetingType.name} ({meetingType.duration_minutes} min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={newBookingDate}
                  onChange={(e) => setNewBookingDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input 
                  type="time" 
                  value={newBookingStartTime}
                  onChange={(e) => setNewBookingStartTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Project (Optional)</Label>
                <Select value={newBookingProject} onValueChange={setNewBookingProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select value={newBookingLocation} onValueChange={setNewBookingLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea 
                placeholder="Add any notes about this booking..." 
                rows={3}
                value={newBookingNotes}
                onChange={(e) => setNewBookingNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setNewBookingOpen(false)
              setNewBookingClient("")
              setNewBookingClientIsCustom(false)
              setNewBookingCustomClientName("")
              setNewBookingService("")
              setNewBookingDate("")
              setNewBookingStartTime("")
              setNewBookingLocation("Zoom")
              setNewBookingNotes("")
              setNewBookingProject("")
            }} disabled={savingBooking}>
              Cancel
            </Button>
            <Button 
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" 
              disabled={savingBooking || (!newBookingClient && !newBookingCustomClientName) || !newBookingService || !newBookingDate || !newBookingStartTime}
              onClick={async () => {
                try {
                  setSavingBooking(true)
                  const selectedService = meetingTypes.find(mt => mt.id === newBookingService)
                  const selectedClient = newBookingClientIsCustom ? null : clients.find(c => c.id === newBookingClient)
                  
                  if (!selectedService) {
                    toast.error("Please select a meeting type")
                    return
                  }
                  
                  if (newBookingClientIsCustom && !newBookingCustomClientName.trim()) {
                    toast.error("Please enter a client name")
                    return
                  }
                  
                  // Calculate end time
                  const [hours, minutes] = newBookingStartTime.split(':').map(Number)
                  const startDateTime = new Date(newBookingDate)
                  startDateTime.setHours(hours, minutes, 0, 0)
                  const endDateTime = new Date(startDateTime.getTime() + selectedService.duration_minutes * 60000)
                  const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`
                  
                  await createBooking({
                    meeting_type_id: newBookingService,
                    service_id: newBookingService, // Keep for backward compatibility
                    client_id: newBookingClientIsCustom ? undefined : newBookingClient,
                    project_id: newBookingProject && newBookingProject !== 'none' ? newBookingProject : undefined,
                    scheduled_date: newBookingDate,
                    start_time: newBookingStartTime,
                    end_time: endTime,
                    timezone: timezone,
                    location_type: newBookingLocation as 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person',
                    client_name: newBookingClientIsCustom ? newBookingCustomClientName.trim() : selectedClient ? `${selectedClient.first_name} ${selectedClient.last_name}` : undefined,
                    client_email: selectedClient?.email,
                    client_phone: selectedClient?.phone,
                    notes: newBookingNotes || undefined,
                  })
                  
                  // Reload bookings
                  const updatedBookings = await getBookings()
                  setBookings(updatedBookings)
                  
              toast.success("Booking created successfully!")
              setNewBookingOpen(false)
                  setNewBookingClient("")
                  setNewBookingClientIsCustom(false)
                  setNewBookingCustomClientName("")
                  setNewBookingService("")
                  setNewBookingDate("")
                  setNewBookingStartTime("")
                  setNewBookingLocation("Zoom")
                  setNewBookingNotes("")
                  setNewBookingProject("")
                } catch (error) {
                  console.error('Error creating booking:', error)
                  toast.error('Failed to create booking')
                } finally {
                  setSavingBooking(false)
                }
              }}
            >
              {savingBooking ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Service Modal */}
      <Dialog open={createServiceOpen} onOpenChange={setCreateServiceOpen}>
        <DialogContent className="max-w-2xl" data-help="create-service-modal">
          <DialogHeader>
            <DialogTitle data-help="create-service-title">Create Meeting Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Service Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Meeting Type Name *</Label>
              <Input
                placeholder="e.g., Strategy Session, Consultation, Design Review"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>

            {/* Duration and Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Duration *</Label>
                <Select value={serviceDuration} onValueChange={setServiceDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Location Type *</Label>
                <Select value={serviceLocation} onValueChange={setServiceLocation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Zoom">Zoom</SelectItem>
                    <SelectItem value="Google Meet">Google Meet</SelectItem>
                    <SelectItem value="Phone">Phone</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Price (Optional)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-7"
                  value={servicePrice}
                  onChange={(e) => setServicePrice(e.target.value)}
                />
              </div>
            </div>

            {/* Color */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Calendar Color *</Label>
              <div className="grid grid-cols-6 gap-2">
                {[
                  { value: "bg-blue-500", label: "Blue" },
                  { value: "bg-purple-500", label: "Purple" },
                  { value: "bg-green-500", label: "Green" },
                  { value: "bg-orange-500", label: "Orange" },
                  { value: "bg-pink-500", label: "Pink" },
                  { value: "bg-red-500", label: "Red" },
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setServiceColor(color.value)}
                    className={`h-10 rounded-lg ${color.value} border-2 transition-all ${
                      serviceColor === color.value ? "ring-2 ring-offset-2 ring-gray-900" : "border-transparent"
                    }`}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Description (Optional)</Label>
              <Textarea
                placeholder="Describe what this meeting type includes..."
                rows={3}
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateServiceOpen(false)
              setServiceName("")
              setServiceDuration("60")
              setServiceDescription("")
              setServicePrice("")
              setServiceLocation("Zoom")
              setServiceColor("bg-blue-500")
            }}>
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
              disabled={savingService || !serviceName.trim()}
              onClick={async () => {
                if (!serviceName.trim()) {
                  toast.error("Please enter a meeting type name")
                  return
                }
                
                if (!serviceDuration || isNaN(parseInt(serviceDuration))) {
                  toast.error("Please select a valid duration")
                  return
                }
                
                if (!serviceLocation) {
                  toast.error("Please select a location type")
                  return
                }
                
                if (!serviceColor) {
                  toast.error("Please select a color")
                  return
                }
                
                try {
                  setSavingService(true)
                  
                  const meetingTypeData = {
                    name: serviceName.trim(),
                    description: serviceDescription.trim() || undefined,
                    duration_minutes: parseInt(serviceDuration),
                    price: servicePrice && servicePrice.trim() ? parseFloat(servicePrice) : undefined,
                    location_type: serviceLocation as 'Zoom' | 'Google Meet' | 'Phone' | 'In-Person',
                    color: serviceColor,
                  }
                  
                  console.log('Creating meeting type with data:', meetingTypeData)
                  
                  const newMeetingType = await createMeetingType(meetingTypeData)
                  
                  if (!newMeetingType) {
                    throw new Error('Meeting type was not created - no data returned')
                  }
                  
                  // Reload meeting types
                  const updatedMeetingTypes = await getMeetingTypes()
                  setMeetingTypes(updatedMeetingTypes)
                  
                  toast.success(`Meeting type "${serviceName}" created successfully!`)
                  setCreateServiceOpen(false)
                  setServiceName("")
                  setServiceDuration("60")
                  setServiceDescription("")
                  setServicePrice("")
                  setServiceLocation("Zoom")
                  setServiceColor("bg-blue-500")
                } catch (error: any) {
                  console.error('Error creating service:', error)
                  const errorMessage = error?.message || error?.error?.message || 'Failed to create meeting type. Please try again.'
                  toast.error(errorMessage)
                } finally {
                  setSavingService(false)
                }
              }}
            >
              {savingService ? 'Creating...' : 'Create Meeting Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-help="schedule-settings-modal">
          <DialogHeader>
            <DialogTitle data-help="schedule-settings-title">Scheduler Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Display Name */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Display Name</Label>
              <Input
                placeholder="e.g., Company Name or Personal Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">This will be shown on your public scheduling page</p>
            </div>

            {/* Industry Label */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Industry Label</Label>
              <Input
                placeholder="e.g., Freelance Web Developer, Marketing Consultant"
                value={industryLabel}
                onChange={(e) => setIndustryLabel(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">Your profession or industry (optional)</p>
            </div>

            {/* Timezone */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                  <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                  <SelectItem value="America/Phoenix">America/Phoenix (MST)</SelectItem>
                  <SelectItem value="America/Anchorage">America/Anchorage (AKST/AKDT)</SelectItem>
                  <SelectItem value="Pacific/Honolulu">Pacific/Honolulu (HST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                  <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (CET/CEST)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Shanghai">Asia/Shanghai (CST)</SelectItem>
                  <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</SelectItem>
                  <SelectItem value="Australia/Melbourne">Australia/Melbourne (AEDT/AEST)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">All times will be displayed in this timezone</p>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Booking Preferences</h3>
              
              {/* Default Duration */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Default Meeting Duration</Label>
                <Select value={defaultDuration} onValueChange={setDefaultDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Buffer Time */}
              <div className="mb-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Buffer Time Between Meetings</Label>
                <Select value={bufferTime} onValueChange={setBufferTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No buffer</SelectItem>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Time between consecutive meetings</p>
              </div>

            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Notifications</h3>
              
              {/* Email Notifications */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                  <p className="text-xs text-gray-500">Receive email alerts for new bookings</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#3C3CFF] focus:ring-offset-2 ${
                    emailNotifications ? 'bg-[#3C3CFF]' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      emailNotifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)} disabled={savingSettings}>
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white"
              disabled={savingSettings}
              onClick={async () => {
                try {
                  setSavingSettings(true)
                  const updatedSettings = await createOrUpdateScheduleSettings({
                    timezone,
                    default_duration_minutes: parseInt(defaultDuration),
                    buffer_time_minutes: parseInt(bufferTime),
                    email_notifications: emailNotifications,
                    display_name: displayName || undefined,
                    industry_label: industryLabel || undefined,
                  })
                  setScheduleSettings(updatedSettings)
                  toast.success('Settings saved successfully!')
                  setSettingsOpen(false)
                } catch (error) {
                  console.error('Error saving settings:', error)
                  toast.error('Failed to save settings')
                } finally {
                  setSavingSettings(false)
                }
              }}
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Scheduler Link */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-lg" data-help="share-schedule-modal">
          <DialogHeader>
            <DialogTitle data-help="share-schedule-title">Share your booking link</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Send this link to clients so they can book time directly.
            </p>
            
            {/* Meeting Type Info Banner */}
            {(() => {
              // Get meeting type data - use stored data or find from selected ID
              const meetingTypeData = selectedShareMeetingTypeData || 
                (selectedShareMeetingType ? meetingTypes.find(mt => mt.id === selectedShareMeetingType) : null)
              
              return meetingTypeData && publicBookingUrl ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${meetingTypeData.color}`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-blue-900">{meetingTypeData.name}</div>
                      <div className="text-xs text-blue-700">
                        {meetingTypeData.duration_minutes} minutes • {meetingTypeData.location_type}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null
            })()}
            
            {publicBookingUrl ? (
              <>
                <div className="flex items-center gap-2">
                  <Input readOnly value={publicBookingUrl} className="font-mono text-sm" aria-label="Public booking link" />
                  <Button
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(publicBookingUrl)
                      toast.success("Link copied")
                    }}
                  >
                    Copy
                  </Button>
                  <Button
                    className="bg-[#4647E0] hover:bg-[#3b3ccf] text-white"
                    onClick={() => window.open(publicBookingUrl, "_blank")}
                  >
                    Preview
                  </Button>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => {
                    // Close share dialog and open meeting type selection modal to generate a new link
                    setShareOpen(false)
                    setSelectedShareMeetingType("")
                    setSelectedShareMeetingTypeData(null)
                    setShareMeetingTypeModalOpen(true)
                  }}
                >
                  Generate New Link
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-[#4647E0] hover:bg-[#3b3ccf] text-white"
                onClick={() => {
                  // Close share dialog and open meeting type selection modal
                  setShareOpen(false)
                  setShareMeetingTypeModalOpen(true)
                }}
              >
                Generate Booking Link
              </Button>
            )}
            <div>
              <Button variant="link" className="p-0 h-auto text-sm text-gray-600" disabled>
                Embed on website (coming soon)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Link - Meeting Type Selection Modal */}
      <Dialog open={shareMeetingTypeModalOpen} onOpenChange={setShareMeetingTypeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Meeting Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {meetingTypes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600 mb-4">No meeting types available. A default meeting will be used.</p>
                <Button
                  className="w-full bg-[#4647E0] hover:bg-[#3b3ccf] text-white"
                  onClick={async () => {
                    try {
                      const bookingPage = await createPublicBookingPage({})
                      const baseUrl = typeof window !== 'undefined' 
                        ? window.location.origin 
                        : process.env.NEXT_PUBLIC_APP_URL || 'https://jolix.io'
                      const url = `${baseUrl}/schedule/${bookingPage.slug}`
                      setPublicBookingUrl(url)
                      setShareMeetingTypeModalOpen(false)
                      setShareOpen(true)
                      toast.success("Booking link generated!")
                    } catch (error) {
                      console.error('Error generating booking link:', error)
                      toast.error('Failed to generate booking link')
                    }
                  }}
                >
                  Generate Link
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600">Choose a meeting type for this booking link:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {meetingTypes.map((meetingType) => (
                    <button
                      key={meetingType.id}
                      onClick={() => setSelectedShareMeetingType(meetingType.id)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                        selectedShareMeetingType === meetingType.id
                          ? 'border-[#4647E0] bg-[#4647E0]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{meetingType.name}</div>
                      {meetingType.description && (
                        <div className="text-sm text-gray-600 mt-1">{meetingType.description}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-1">
                        {meetingType.duration_minutes} min • {meetingType.location_type}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShareMeetingTypeModalOpen(false)
                      setSelectedShareMeetingType("")
                      setSelectedShareMeetingTypeData(null)
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-[#4647E0] hover:bg-[#3b3ccf] text-white"
                    disabled={!selectedShareMeetingType}
                    onClick={async () => {
                      if (!selectedShareMeetingType) {
                        toast.error("Please select a meeting type")
                        return
                      }
                      
                      // Get the meeting type data to display in banner
                      const meetingType = meetingTypes.find(mt => mt.id === selectedShareMeetingType)
                      if (!meetingType) {
                        toast.error("Meeting type not found")
                        return
                      }
                      
                      try {
                        const bookingPage = await createPublicBookingPage({
                          meeting_type_id: selectedShareMeetingType || undefined,
                        })
                        const baseUrl = typeof window !== 'undefined' 
                          ? window.location.origin 
                          : process.env.NEXT_PUBLIC_APP_URL || 'https://jolix.io'
                        const url = `${baseUrl}/schedule/${bookingPage.slug}`
                        setPublicBookingUrl(url)
                        // Set the meeting type data before opening share modal
                        setSelectedShareMeetingTypeData(meetingType)
                        setShareMeetingTypeModalOpen(false)
                        setShareOpen(true)
                        toast.success("Booking link generated!")
                      } catch (error) {
                        console.error('Error generating booking link:', error)
                        toast.error('Failed to generate booking link')
                      }
                    }}
                  >
                    Generate Link
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Details Drawer */}
      <Sheet open={detailsDrawerOpen} onOpenChange={setDetailsDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]" data-help="booking-details-drawer">
          <SheetHeader>
            <SheetTitle className="text-2xl" data-help="booking-details-title">{selectedBooking?.clientName}</SheetTitle>
          </SheetHeader>
          
          {selectedBooking && (
            <div className="mt-6 space-y-6">
              {/* Key Fields */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${selectedBooking.serviceColor} flex items-center justify-center`}>
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Meeting Type</div>
                    <div className="font-semibold text-gray-900">{selectedBooking.service}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Date & Time</div>
                    <div className="font-semibold text-gray-900">{selectedBooking.date}</div>
                    <div className="text-sm text-gray-600">{selectedBooking.startTime} - {selectedBooking.endTime}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Duration</div>
                    <div className="font-semibold text-gray-900">{selectedBooking.duration}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    {getLocationIcon(selectedBooking.location)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Location</div>
                    <div className="font-semibold text-gray-900">{selectedBooking.location}</div>
                    {(selectedBooking.location === "Zoom" || selectedBooking.location === "Google Meet") && (
                      <Button variant="link" className="p-0 h-auto text-[#3C3CFF] text-sm">
                        Join meeting →
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Price</div>
                    <div className="font-semibold text-gray-900">{selectedBooking.price}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-600">Notes</div>
                    <div className="text-gray-900 mt-1">{selectedBooking.notes}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                {selectedBooking.status === 'Scheduled' && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setRescheduleDate(selectedBooking.date)
                        setRescheduleStartTime(selectedBooking.startTime.split(' ')[0] + ':00')
                        setRescheduleOpen(true)
                      }}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={async () => {
                          try {
                            setUpdatingBooking(true)
                            await updateBooking(selectedBooking.id, { status: 'Completed' })
                            const updatedBookings = await getBookings()
                            setBookings(updatedBookings)
                            toast.success("Booking marked as completed!")
                            setDetailsDrawerOpen(false)
                          } catch (error) {
                            console.error('Error updating booking:', error)
                            toast.error('Failed to update booking')
                          } finally {
                            setUpdatingBooking(false)
                          }
                        }}
                        disabled={updatingBooking}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Mark Complete
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex-1 text-red-600 hover:text-red-700"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to cancel this booking?')) {
                            return
                          }
                          try {
                            setUpdatingBooking(true)
                            await updateBooking(selectedBooking.id, { status: 'Canceled' })
                            const updatedBookings = await getBookings()
                            setBookings(updatedBookings)
                            toast.success("Booking cancelled!")
                            setDetailsDrawerOpen(false)
                          } catch (error) {
                            console.error('Error cancelling booking:', error)
                            toast.error('Failed to cancel booking')
                          } finally {
                            setUpdatingBooking(false)
                          }
                        }}
                        disabled={updatingBooking}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Cancel Booking
                      </Button>
                    </div>
                  </>
                )}
                {(selectedBooking.status === 'Completed' || selectedBooking.status === 'Canceled') && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    This booking is {selectedBooking.status.toLowerCase()}
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-6 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Booking ID</span>
                  <span className="font-mono text-gray-900">{selectedBooking.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created at</span>
                  <span className="text-gray-900">{selectedBooking.createdAt}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Updated at</span>
                  <span className="text-gray-900">{selectedBooking.createdAt}</span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reschedule Modal */}
      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>New Date</Label>
              <Input 
                type="date" 
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
            <div>
              <Label>New Start Time</Label>
              <Input 
                type="time" 
                value={rescheduleStartTime}
                onChange={(e) => setRescheduleStartTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleOpen(false)} disabled={updatingBooking}>
              Cancel
            </Button>
            <Button
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC]"
              disabled={updatingBooking || !rescheduleDate || !rescheduleStartTime}
              onClick={async () => {
                if (!selectedBooking) return
                try {
                  setUpdatingBooking(true)
                  
                  // Calculate new end time based on meeting type duration
                  const selectedService = meetingTypes.find(mt => mt.name === selectedBooking.service)
                  const [hours, minutes] = rescheduleStartTime.split(':').map(Number)
                  const startDateTime = new Date(rescheduleDate)
                  startDateTime.setHours(hours, minutes, 0, 0)
                  const duration = selectedService?.duration_minutes || 60
                  const endDateTime = new Date(startDateTime.getTime() + duration * 60000)
                  const endTime = `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`
                  
                  await updateBooking(selectedBooking.id, {
                    scheduled_date: rescheduleDate,
                    start_time: rescheduleStartTime,
                    end_time: endTime,
                  })
                  
                  const updatedBookings = await getBookings()
                  setBookings(updatedBookings)
                  toast.success("Booking rescheduled successfully!")
                  setRescheduleOpen(false)
                  setDetailsDrawerOpen(false)
                } catch (error) {
                  console.error('Error rescheduling booking:', error)
                  toast.error('Failed to reschedule booking')
                } finally {
                  setUpdatingBooking(false)
                }
              }}
            >
              {updatingBooking ? 'Rescheduling...' : 'Reschedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  )
}

