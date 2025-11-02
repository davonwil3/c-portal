"use client"

import { useState, useMemo } from "react"
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
import { Calendar } from "@/components/ui/calendar"
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
  User,
  DollarSign,
  FileText,
  Link as LinkIcon,
  X,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, subWeeks, subMonths, isSameDay, parseISO } from "date-fns"

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

  // Generate comprehensive mock bookings
  const allMockBookings = useMemo(() => {
    const bookings = []
    const services = [
      { name: "Strategy Session", color: "bg-blue-500", price: 150 },
      { name: "Design Review", color: "bg-purple-500", price: 200 },
      { name: "Consultation", color: "bg-green-500", price: 100 },
      { name: "Technical Review", color: "bg-orange-500", price: 180 },
      { name: "Brand Workshop", color: "bg-pink-500", price: 250 },
    ]
    
    const clients = [
      "Sarah Johnson", "Michael Chen", "Emily Davis", "David Miller", "Jessica Wilson",
      "Robert Taylor", "Amanda Brown", "James Anderson", "Lisa Martinez", "Daniel Lee",
      "Rachel White", "Thomas Harris", "Michelle Clark", "Christopher Lewis", "Karen Walker"
    ]
    
    const locations = ["Zoom", "Google Meet", "Phone", "In-Person"]
    const statuses = ["Scheduled", "Completed", "Canceled"]
    
    const notes = [
      "Discuss Q4 marketing strategy and goals",
      "Review homepage redesign mockups",
      "Initial consultation for new project",
      "Follow-up meeting to discuss progress",
      "Quarterly business review session",
      "Onboarding and setup discussion",
      "Technical architecture planning",
      "Brand identity refinement",
      "Content strategy workshop",
      "Product roadmap planning"
    ]

    // Generate bookings for the next 4 weeks
    const startDate = new Date()
    for (let day = 0; day < 28; day++) {
      const bookingDate = addDays(startDate, day)
      const numBookingsThisDay = Math.floor(Math.random() * 4) + 1 // 1-4 bookings per day
      
      for (let i = 0; i < numBookingsThisDay; i++) {
        const service = services[Math.floor(Math.random() * services.length)]
        const hour = 9 + Math.floor(Math.random() * 8) // 9 AM to 5 PM
        const startHour = hour
        const endHour = hour + 1
        
        bookings.push({
          id: `${day}-${i}`,
          clientName: clients[Math.floor(Math.random() * clients.length)],
          service: service.name,
          serviceColor: service.color,
          date: format(bookingDate, "yyyy-MM-dd"),
          startTime: `${startHour % 12 || 12}:00 ${startHour >= 12 ? 'PM' : 'AM'}`,
          endTime: `${endHour % 12 || 12}:00 ${endHour >= 12 ? 'PM' : 'AM'}`,
          startHour: startHour,
          duration: "1 hour",
          location: locations[Math.floor(Math.random() * locations.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          price: `$${service.price}`,
          notes: notes[Math.floor(Math.random() * notes.length)],
          createdAt: format(addDays(bookingDate, -5), "MMM dd, yyyy"),
          bookingId: `BK-${String(parseInt(day.toString() + i.toString()) + 100).padStart(3, '0')}`,
        })
      }
    }
    
    return bookings
  }, [])

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
    return allMockBookings.filter((booking) => {
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
  }, [allMockBookings, dateRange, serviceFilter, statusFilter, locationFilter, searchQuery])

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
      <div className="flex h-screen overflow-hidden bg-gray-50 -m-6">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* Mini Calendar */}
          <div className="mb-6">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(date) => {
                if (date) {
                  setCurrentDate(date)
                  setSelectedDate(date)
                  toast.success(`Jumped to ${format(date, "MMMM d, yyyy")}`)
                }
              }}
              className="rounded-xl border"
            />
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Service</Label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All services</SelectItem>
                  <SelectItem value="Strategy Session">Strategy Session</SelectItem>
                  <SelectItem value="Design Review">Design Review</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Technical Review">Technical Review</SelectItem>
                  <SelectItem value="Brand Workshop">Brand Workshop</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">Staff/Owner</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  <SelectItem value="me">Me</SelectItem>
                  <SelectItem value="team">Team members</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
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
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium text-gray-700 mb-3 block">Legend</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm text-gray-600">Strategy Session</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-600">Design Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Consultation</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-600">Technical Review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                  <span className="text-sm text-gray-600">Brand Workshop</span>
                </div>
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
          {/* Header */}
          <div className="bg-white border-b border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Connect Calendar
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white gap-2" onClick={() => setNewBookingOpen(true)}>
                  <Plus className="h-4 w-4" />
                  New Booking
                </Button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
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

                {/* Timezone */}
                <Badge variant="outline" className="text-sm">
                  🌎 America/New_York
                </Badge>
              </div>

              {/* Search */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search bookings, clients…"
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* View Tabs */}
            <Tabs value={view} onValueChange={setView} className="mt-4">
              <TabsList className="grid w-full max-w-md grid-cols-4">
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Calendar Content */}
          <div className="flex-1 overflow-auto p-6">
            <Tabs value={view} className="h-full">
              {/* Week View */}
              <TabsContent value="week" className="m-0 h-full">
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
                  <div className="bg-white rounded-xl border shadow-sm h-full overflow-hidden">
                    {/* Week Grid Header */}
                    <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-20">
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
                    <div className="grid grid-cols-8 bg-white">
                      <div className="border-r">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="h-20 p-2 border-b text-sm text-gray-600 text-right">
                            {i + 8}:00
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
                            {Array.from({ length: 12 }).map((_, hourIndex) => (
                              <div key={hourIndex} className="h-20 border-b hover:bg-gray-50 transition-colors"></div>
                            ))}

                            {/* Render Bookings for this day */}
                            {dayBookings.map((booking) => {
                              const topPosition = (booking.startHour - 8) * 80 // 8 AM start, 80px per hour
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
                                  className={`absolute left-1 right-1 h-[76px] ${colors.bg} border-l-4 ${colors.border} rounded-lg p-2 cursor-pointer hover:shadow-lg transition-all group overflow-hidden`}
                                  style={{ top: `${topPosition}px` }}
                                  onClick={() => handleBookingClick(booking)}
                                >
                                  <div className={`text-sm font-semibold ${colors.text}-900 truncate`}>{booking.clientName}</div>
                                  <div className={`text-xs ${colors.text}-700 truncate`}>{booking.service}</div>
                                  <div className={`text-xs ${colors.text}-600 mt-1`}>{booking.startTime}</div>
                                  
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
                            {isToday && currentHour >= 8 && currentHour <= 20 && (
                              <div 
                                className="absolute left-0 right-0 border-t-2 border-red-500 z-10"
                                style={{ top: `${(currentHour - 8) * 80 + (new Date().getMinutes() / 60) * 80}px` }}
                              >
                                <div className="w-3 h-3 rounded-full bg-red-500 -mt-1.5 -ml-1.5"></div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Day View */}
              <TabsContent value="day" className="m-0 h-full">
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
                          {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
                        </Badge>
                      </div>
                    </div>

                    {/* Day Schedule */}
                    <div className="p-6 space-y-3 max-h-[600px] overflow-y-auto">
                      {filteredBookings.length === 0 ? (
                        <div className="text-center py-20">
                          <CalendarIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings today</h3>
                          <p className="text-gray-600 mb-6">Your schedule is clear for {format(currentDate, "MMMM d")}</p>
                          <Button onClick={() => setNewBookingOpen(true)} className="bg-[#3C3CFF] hover:bg-[#2D2DCC]">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Booking
                          </Button>
                        </div>
                      ) : (
                        filteredBookings
                          .sort((a, b) => a.startHour - b.startHour)
                          .map((booking) => (
                            <div
                              key={booking.id}
                              className={`${booking.serviceColor.replace('bg-', 'bg-').replace('-500', '-50')} border-l-4 ${booking.serviceColor.replace('bg-', 'border-')} rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all`}
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="text-lg font-semibold text-gray-900">{booking.startTime} - {booking.endTime}</span>
                                    <Badge variant="outline">{booking.duration}</Badge>
                                  </div>
                                  <h4 className="text-xl font-bold text-gray-900 mb-1">{booking.clientName}</h4>
                                  <p className="text-gray-700 font-medium mb-2">{booking.service}</p>
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
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Month View */}
              <TabsContent value="month" className="m-0 h-full">
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
                      
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 35 }).map((_, i) => {
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
                                    className={`${booking.serviceColor.replace('bg-', 'bg-').replace('-500', '-100')} text-xs p-1 rounded truncate`}
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
              <TabsContent value="list" className="m-0 h-full">
                <Card>
                  <CardContent className="p-0">
                    {/* Today */}
                    <div className="border-b">
                      <div className="p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Today</h3>
                      </div>
                      <div className="divide-y">
                        {filteredBookings.filter(b => isSameDay(parseISO(b.date), new Date())).slice(0, 2).map((booking) => (
                          <div
                            key={booking.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="text-sm font-medium text-gray-900 w-28">
                                  {booking.startTime}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${booking.serviceColor}`}></div>
                                  <span className="font-medium text-gray-900">{booking.clientName}</span>
                                </div>
                                <span className="text-sm text-gray-600">{booking.service}</span>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  {getLocationIcon(booking.location)}
                                  <span>{booking.location}</span>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tomorrow */}
                    <div>
                      <div className="p-4 bg-gray-50">
                        <h3 className="font-semibold text-gray-900">Tomorrow</h3>
                      </div>
                      <div className="divide-y">
                        {filteredBookings.filter(b => isSameDay(parseISO(b.date), addDays(new Date(), 1))).slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => handleBookingClick(booking)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="text-sm font-medium text-gray-900 w-28">
                                  {booking.startTime}
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${booking.serviceColor}`}></div>
                                  <span className="font-medium text-gray-900">{booking.clientName}</span>
                                </div>
                                <span className="text-sm text-gray-600">{booking.service}</span>
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  {getLocationIcon(booking.location)}
                                  <span>{booking.location}</span>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-600">
                                  {booking.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button size="icon" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredBookings.filter(b => isSameDay(parseISO(b.date), addDays(new Date(), 1))).length === 0 && (
                          <div className="p-8 text-center text-gray-500">
                            No bookings for tomorrow
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Showing times in America/New_York</span>
              <Button variant="link" className="text-[#3C3CFF]">
                Availability & buffers
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* New Booking Modal */}
      <Dialog open={newBookingOpen} onOpenChange={setNewBookingOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Client</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">+ New Client</SelectItem>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="michael">Michael Chen</SelectItem>
                    <SelectItem value="emily">Emily Davis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strategy">Strategy Session (1 hour)</SelectItem>
                    <SelectItem value="design">Design Review (1 hour)</SelectItem>
                    <SelectItem value="consultation">Consultation (1 hour)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Timezone</Label>
                <Select defaultValue="est">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="est">America/New_York</SelectItem>
                    <SelectItem value="pst">America/Los_Angeles</SelectItem>
                    <SelectItem value="cst">America/Chicago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zoom">Zoom</SelectItem>
                    <SelectItem value="meet">Google Meet</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="in-person">In-Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Add any notes about this booking..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewBookingOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#3C3CFF] hover:bg-[#2D2DCC]" onClick={() => {
              toast.success("Booking created successfully!")
              setNewBookingOpen(false)
            }}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Details Drawer */}
      <Sheet open={detailsDrawerOpen} onOpenChange={setDetailsDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle className="text-2xl">{selectedBooking?.clientName}</SheetTitle>
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
                    <div className="text-sm text-gray-600">Service</div>
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
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1">
                  <Clock className="mr-2 h-4 w-4" />
                  Reschedule
                </Button>
                <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Cancel Booking
                </Button>
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
    </DashboardLayout>
  )
}

