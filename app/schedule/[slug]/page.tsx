"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format, addDays, parseISO, addMinutes, setHours, setMinutes, isBefore, isAfter, startOfDay, addMonths, subMonths, isToday } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { Clock, Video, Phone, Building2, CheckCircle2, Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { getScheduleSettingsBySlug, getMeetingTypesByAccount, getBookingsByAccount, createPublicBooking, getPublicBookingPageBySlug, type MeetingType, type ScheduleSettings } from "@/lib/schedule"
import { generateTimeSlots, type ExistingBooking } from "@/lib/schedule-utils"

interface TimeSlot {
  time: string
  available: boolean
}

export default function PublicSchedulePage() {
  const params = useParams()
  const slug = params?.slug as string

  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<(ScheduleSettings & { user_name?: string, account_name?: string, account_logo_url?: string }) | null>(null)
  const [meetingTypes, setMeetingTypes] = useState<MeetingType[]>([])
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [step, setStep] = useState<"date-time" | "details" | "confirmation">("date-time")
  
  // Form data
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Load schedule settings and meeting types
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Try to get public booking page first (new system)
        const bookingPage = await getPublicBookingPageBySlug(slug)
        
          if (bookingPage) {
          // Use booking page data
          if (bookingPage.schedule_settings) {
            setSettings({
              ...bookingPage.schedule_settings as any,
              account_logo_url: bookingPage.account_logo_url || (bookingPage.schedule_settings as any)?.account_logo_url,
              account_name: bookingPage.account_name,
              user_name: bookingPage.user_name,
            })
          }
          
          // If meeting type is specified in booking page, use it
          if (bookingPage.meeting_type) {
            setSelectedMeetingType(bookingPage.meeting_type as MeetingType)
            setMeetingTypes([bookingPage.meeting_type as MeetingType])
          } else {
            // Otherwise, load all meeting types and auto-select the first one
            const meetingTypesData = await getMeetingTypesByAccount(bookingPage.account_id)
            setMeetingTypes(meetingTypesData)
            
            // Auto-select first meeting type
            if (meetingTypesData.length > 0) {
              setSelectedMeetingType(meetingTypesData[0])
            }
          }
        } else {
          // Fallback to old system (schedule_settings by slug)
          const scheduleSettings = await getScheduleSettingsBySlug(slug)
          
          if (!scheduleSettings) {
            toast.error("Schedule not found")
            return
          }

          setSettings(scheduleSettings)
          
          const meetingTypesData = await getMeetingTypesByAccount(scheduleSettings.account_id)
          setMeetingTypes(meetingTypesData)
          
          // Auto-select first meeting type
          if (meetingTypesData.length > 0) {
            setSelectedMeetingType(meetingTypesData[0])
          }
        }
      } catch (error) {
        console.error('Error loading schedule:', error)
        toast.error('Failed to load schedule')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      loadData()
    }
  }, [slug])

  // Generate available time slots for selected date
  useEffect(() => {
    if (!selectedDate || !selectedMeetingType || !settings) {
      setAvailableSlots([])
      return
    }

    const loadTimeSlots = async () => {
      try {
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = selectedDate.getDay()
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const dayName = dayNames[dayOfWeek]

        // Check if day is available based on availability settings (with defaults)
        const availability = getAvailability()
        const dayAvailability = availability[dayName]

        // If day is not enabled in availability, no slots available
        if (!dayAvailability || !dayAvailability.enabled) {
          setAvailableSlots([])
          return
        }

        // Get existing bookings for this date
        const existingBookingsData = await getBookingsByAccount(settings.account_id, {
          startDate: format(selectedDate, 'yyyy-MM-dd'),
          endDate: format(selectedDate, 'yyyy-MM-dd'),
          status: ['Scheduled', 'Completed'],
        })

        // Transform bookings to the format expected by the utility
        const existingBookings: ExistingBooking[] = existingBookingsData.map(booking => ({
          startTime: booking.start_time,
          endTime: booking.end_time,
          scheduled_date: booking.scheduled_date,
        }))

        // Get buffer settings
        const bufferTime = settings.buffer_time_minutes || 15
        const bufferBefore = bufferTime
        const bufferAfter = bufferTime

        // Generate time slots using the utility function
        const slots = generateTimeSlots({
          availabilityWindow: {
            startTime: dayAvailability.startTime,
            endTime: dayAvailability.endTime,
          },
          meetingDuration: selectedMeetingType.duration_minutes,
          bufferBefore,
          bufferAfter,
          existingBookings,
          selectedDate,
          minimumAdvanceNoticeHours: 0, // No minimum advance notice
        })

        setAvailableSlots(slots)
      } catch (error) {
        console.error('Error generating time slots:', error)
        setAvailableSlots([])
      }
    }

    loadTimeSlots()
  }, [selectedDate, selectedMeetingType, settings])

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      setSelectedDate(undefined)
      setSelectedTime("")
      return
    }
    
    // Verify the date is actually available
    const dayOfWeek = date.getDay()
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayName = dayNames[dayOfWeek]
    const availability = getAvailability()
    const dayAvailability = availability[dayName]
    
    // Check if date is in the past
    if (isBefore(date, startOfDay(new Date()))) {
      toast.error("Cannot select a date in the past")
      setSelectedDate(undefined)
      return
    }
    
    // Check if day is available
    if (!dayAvailability || !dayAvailability.enabled) {
      toast.error("This day is not available for booking")
      setSelectedDate(undefined)
      return
    }
    
    // Date is valid, set it
    setSelectedDate(date)
    setSelectedTime("")
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setStep("details")
  }

  const handleSubmit = async () => {
    if (!clientName.trim() || !clientEmail.trim() || !selectedMeetingType || !selectedDate || !selectedTime || !settings) {
      toast.error("Please fill in all required fields")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(clientEmail)) {
      toast.error("Please enter a valid email address")
      return
    }

    try {
      setSubmitting(true)

      // Calculate end time
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const startDateTime = setMinutes(setHours(selectedDate, hours), minutes)
      const endDateTime = addMinutes(startDateTime, selectedMeetingType.duration_minutes)
      const endTime = format(endDateTime, 'HH:mm')

      await createPublicBooking({
        account_id: settings.account_id,
        user_id: settings.user_id,
        meeting_type_id: selectedMeetingType.id,
        service_id: selectedMeetingType.id, // Backward compatibility
        scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTime,
        timezone: settings.timezone,
        location_type: selectedMeetingType.location_type,
        client_name: clientName,
        client_email: clientEmail,
        description: notes || undefined,
      })

      setStep("confirmation")
      toast.success("Booking confirmed!")
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Get default availability (Monday-Friday 9-5)
  const getDefaultAvailability = () => {
    return {
      Monday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      Tuesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      Wednesday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      Thursday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      Friday: { enabled: true, startTime: '09:00', endTime: '17:00' },
      Saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
      Sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
    }
  }

  // Get availability with defaults
  const getAvailability = () => {
    if (!settings) return getDefaultAvailability()
    const availability = settings.availability || {}
    
    // If no availability is set at all, use defaults
    if (Object.keys(availability).length === 0) {
      return getDefaultAvailability()
    }
    
    // Merge with defaults to ensure all days have settings
    const defaultAvail = getDefaultAvailability()
    const merged: Record<string, { enabled: boolean, startTime: string, endTime: string }> = {}
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    dayNames.forEach(day => {
      if (availability[day]) {
        merged[day] = availability[day]
      } else {
        merged[day] = defaultAvail[day]
      }
    })
    
    return merged
  }

  // Get host initials
  const getHostInitials = () => {
    if (!settings) return "U"
    const name = settings.display_name || settings.user_name || settings.account_name || "User"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name[0].toUpperCase()
  }

  // Get host name
  const getHostName = () => {
    if (!settings) return "Host"
    return settings.display_name || settings.user_name || settings.account_name || "Host"
  }

  // Get industry label
  const getIndustryLabel = () => {
    if (!settings) return ""
    return settings.industry_label || ""
  }

  // Get timezone abbreviation
  const getTimezoneAbbr = (timezone: string) => {
    const tzMap: Record<string, string> = {
      'America/New_York': 'EST',
      'America/Chicago': 'CST',
      'America/Denver': 'MST',
      'America/Los_Angeles': 'PST',
      'America/Phoenix': 'MST',
      'America/Anchorage': 'AKST',
      'Pacific/Honolulu': 'HST',
    }
    return tzMap[timezone] || timezone.split('/').pop()?.split('_').join(' ') || 'UTC'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#0069FF] mx-auto mb-4" />
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  if (!settings || meetingTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Schedule Not Found</h1>
          <p className="text-gray-600">This scheduling link is invalid or has been removed.</p>
        </div>
      </div>
    )
  }


  const hostName = getHostName()
  const hostInitials = getHostInitials()
  const industryLabel = getIndustryLabel()
  const timezoneAbbr = getTimezoneAbbr(settings.timezone)

  return (
    <div className="min-h-screen bg-gray-50 py-8 md:py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-[400px,1fr] gap-8">
          {/* Left Column - Meeting & Host Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Host Info */}
              <div className="flex items-center gap-4 mb-6">
                {settings?.account_logo_url ? (
                  <>
                    <img 
                      src={settings.account_logo_url} 
                      alt={settings.account_name || hostName || "Logo"} 
                      className="w-16 h-16 rounded-lg object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                        const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement
                        if (placeholder) placeholder.style.display = 'flex'
                      }}
                    />
                    <div className="w-16 h-16 rounded-lg bg-[#0069FF] hidden items-center justify-center text-white text-xl font-semibold">
                      {hostInitials}
                    </div>
                  </>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-[#0069FF] flex items-center justify-center text-white text-xl font-semibold">
                    {hostInitials}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {settings?.account_name || hostName}
                  </h2>
                  {industryLabel && (
                    <p className="text-sm text-gray-600">{industryLabel}</p>
                  )}
                </div>
              </div>

              {/* Meeting Type Info */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedMeetingType.name}</h3>
                  {selectedMeetingType.description && (
                    <p className="text-sm text-gray-600 leading-relaxed">{selectedMeetingType.description}</p>
                  )}
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>{selectedMeetingType.duration_minutes} minutes</span>
                  </div>
                  {selectedMeetingType.location_type && (
                    <div className="flex items-center gap-2 text-gray-600">
                      {selectedMeetingType.location_type === 'Zoom' || selectedMeetingType.location_type === 'Google Meet' ? (
                        <Video className="h-4 w-4 text-gray-400" />
                      ) : selectedMeetingType.location_type === 'Phone' ? (
                        <Phone className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Building2 className="h-4 w-4 text-gray-400" />
                      )}
                      <span>{selectedMeetingType.location_type}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Flow */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              {step === "date-time" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Pick a date & time</h2>
                    <p className="text-sm text-gray-600">Times shown in {timezoneAbbr}</p>
                  </div>

                  {/* Calendar */}
                  <div className="relative">
                    {/* Custom Navigation Buttons */}
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium">
                        {format(currentMonth, 'MMMM yyyy')}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) {
                          handleDateSelect(date)
                        } else {
                          setSelectedDate(undefined)
                          setSelectedTime("")
                        }
                      }}
                      month={currentMonth}
                      onMonthChange={setCurrentMonth}
                      captionLayout="dropdown-buttons"
                      disabled={(date) => {
                        // Always disable dates in the past
                        const today = startOfDay(new Date())
                        if (isBefore(date, today)) {
                          return true
                        }
                        
                        // Check availability settings (with defaults)
                        const availability = getAvailability()
                        const dayOfWeek = date.getDay()
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        const dayName = dayNames[dayOfWeek]
                        const dayAvailability = availability[dayName]
                        
                        // Disable if day is not enabled in availability
                        if (!dayAvailability || !dayAvailability.enabled) {
                          return true
                        }
                        
                        return false
                      }}
                      className="rounded-lg [&_.rdp-nav]:hidden [&_.rdp-caption]:hidden"
                      classNames={{
                        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                        month: "space-y-4",
                        caption: "hidden",
                        nav: "hidden",
                        button_previous: "hidden",
                        button_next: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-gray-100 [&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: cn(
                          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md cursor-pointer transition-colors"
                        ),
                        day_selected: "bg-[#0069FF] text-white hover:bg-[#0052CC] hover:text-white focus:bg-[#0069FF] focus:text-white",
                        day_today: "bg-gray-100 text-gray-900",
                        day_outside: "text-gray-400 opacity-50",
                        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
                        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                        day_hidden: "invisible",
                      }}
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        {format(selectedDate, 'EEEE, MMMM d')}
                      </h3>
                      {availableSlots.length === 0 ? (
                        <p className="text-sm text-gray-500 py-4">No available times for this date</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.time}
                              onClick={() => slot.available && handleTimeSelect(slot.time)}
                              disabled={!slot.available}
                              className={cn(
                                "py-2.5 px-3 rounded-lg text-sm font-medium transition-all",
                                slot.available
                                  ? "border-2 border-gray-200 hover:border-[#0069FF] hover:bg-[#0069FF] hover:text-white bg-white text-gray-900"
                                  : "border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                              )}
                            >
                              {format(parseISO(`2000-01-01T${slot.time}`), 'h:mm a')}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {step === "details" && (
                <div className="space-y-6">
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                      Step 2 of 2: Your details
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Enter your details</h2>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Meeting:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedTime && format(parseISO(`2000-01-01T${selectedTime}`), 'h:mm a')} - {selectedTime && selectedMeetingType && format(addMinutes(parseISO(`2000-01-01T${selectedTime}`), selectedMeetingType.duration_minutes), 'h:mm a')} {timezoneAbbr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Your full name"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        className="h-11"
                      />
                    </div>

                    <div>
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700 mb-2 block">
                        Add notes for your meeting <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                      </Label>
                      <Textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional information you'd like to share..."
                        rows={4}
                        className="resize-none"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setStep("date-time")
                          setSelectedTime("")
                        }}
                        className="flex-1 h-11"
                      >
                        Back
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={submitting || !clientName.trim() || !clientEmail.trim()}
                        className="flex-1 h-11 bg-[#0069FF] hover:bg-[#0052CC] text-white font-medium"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scheduling...
                          </>
                        ) : (
                          "Schedule meeting"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {step === "confirmation" && (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 mb-6">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">You're booked!</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mt-6 mb-6 text-left max-w-md mx-auto">
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-gray-500">Meeting:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium text-gray-900">
                          {selectedTime && format(parseISO(`2000-01-01T${selectedTime}`), 'h:mm a')} - {selectedTime && selectedMeetingType && format(addMinutes(parseISO(`2000-01-01T${selectedTime}`), selectedMeetingType.duration_minutes), 'h:mm a')} {timezoneAbbr}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>{" "}
                        <span className="font-medium text-gray-900">{selectedMeetingType.duration_minutes} minutes</span>
                      </div>
                      {selectedMeetingType.location_type && (
                        <div>
                          <span className="text-gray-500">Location:</span>{" "}
                          <span className="font-medium text-gray-900">{selectedMeetingType.location_type}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    A confirmation will be sent to <span className="font-medium">{clientEmail}</span>
                  </p>
                  <p className="text-xs text-gray-500 mb-6">
                    You can reschedule or cancel using the link in your email.
                  </p>

                  <Button
                    variant="outline"
                    className="border-gray-300"
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Add to calendar
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
