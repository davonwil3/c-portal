import { addMinutes, setHours, setMinutes, isBefore, isAfter, parseISO, format } from 'date-fns'

export interface TimeSlot {
  time: string // Format: "HH:mm"
  available: boolean
}

export interface AvailabilityWindow {
  startTime: string // Format: "HH:mm"
  endTime: string // Format: "HH:mm"
}

export interface ExistingBooking {
  startTime: string // Format: "HH:mm"
  endTime: string // Format: "HH:mm"
  scheduled_date: string // Format: "yyyy-MM-dd"
}

export interface GenerateTimeSlotsParams {
  availabilityWindow: AvailabilityWindow
  meetingDuration: number // in minutes
  bufferBefore: number // in minutes
  bufferAfter: number // in minutes
  existingBookings: ExistingBooking[]
  selectedDate: Date
  minimumAdvanceNoticeHours?: number // in hours
}

/**
 * Generates available time slots for meeting scheduling
 * 
 * @param params - Parameters for generating time slots
 * @returns Array of time slots with availability status
 */
export function generateTimeSlots(params: GenerateTimeSlotsParams): TimeSlot[] {
  const {
    availabilityWindow,
    meetingDuration,
    bufferBefore,
    bufferAfter,
    existingBookings,
    selectedDate,
    minimumAdvanceNoticeHours = 0,
  } = params

  const slots: TimeSlot[] = []
  
  // Calculate total block size (duration + buffers)
  const totalBlock = meetingDuration + bufferBefore + bufferAfter

  // Parse availability window times
  const [startHour, startMin] = availabilityWindow.startTime.split(':').map(Number)
  const [endHour, endMin] = availabilityWindow.endTime.split(':').map(Number)
  
  const availabilityStart = setMinutes(setHours(selectedDate, startHour), startMin)
  const availabilityEnd = setMinutes(setHours(selectedDate, endHour), endMin)

  // Create blocked time ranges from existing bookings (including their buffers)
  const blockedRanges: Array<{ start: Date; end: Date }> = existingBookings.map(booking => {
    const bookingStart = parseISO(`${booking.scheduled_date}T${booking.start_time}`)
    const bookingEnd = parseISO(`${booking.scheduled_date}T${booking.end_time}`)
    
    // Apply buffers to existing bookings
    const blockedStart = addMinutes(bookingStart, -bufferBefore)
    const blockedEnd = addMinutes(bookingEnd, bufferAfter)
    
    return {
      start: blockedStart,
      end: blockedEnd,
    }
  })

  // Get current time for minimum advance notice check
  const now = new Date()
  const minimumAdvanceTime = addMinutes(now, minimumAdvanceNoticeHours * 60)

  // Iterate through availability window in increments of totalBlock
  let currentTime = availabilityStart
  
  while (currentTime < availabilityEnd) {
    // Calculate slot end time (start + total block)
    const slotEnd = addMinutes(currentTime, totalBlock)
    
    // Check if slot fits within availability window
    if (slotEnd > availabilityEnd) {
      break // No more slots can fit
    }

    // Check if slot overlaps with any blocked range
    const hasOverlap = blockedRanges.some(blocked => {
      // Two ranges overlap if: slotStart < blockedEnd AND slotEnd > blockedStart
      // This handles all overlap cases including:
      // - Slot completely inside blocked
      // - Blocked completely inside slot
      // - Partial overlaps on either side
      return (
        currentTime.getTime() < blocked.end.getTime() &&
        slotEnd.getTime() > blocked.start.getTime()
      )
    })

    // Check minimum advance notice
    const isTooSoon = isBefore(currentTime, minimumAdvanceTime)

    // Slot is available if it doesn't overlap and meets advance notice requirement
    const available = !hasOverlap && !isTooSoon

    // Format time as "HH:mm"
    const timeStr = format(currentTime, 'HH:mm')

    slots.push({
      time: timeStr,
      available,
    })

    // Move to next slot (increment by totalBlock)
    currentTime = addMinutes(currentTime, totalBlock)
  }

  return slots
}

