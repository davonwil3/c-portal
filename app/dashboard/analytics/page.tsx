"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/layout"
import { MetricCard } from "@/components/MetricCard"
import { Section } from "@/components/Section"
import { RevenueTrend } from "@/components/charts/RevenueTrend"
import { ClientBreakdown } from "@/components/charts/ClientBreakdown"
import { ProjectBreakdown } from "@/components/charts/ProjectBreakdown"
import { StatusStack } from "@/components/charts/StatusStack"
import { TimelinessHistogram } from "@/components/charts/TimelinessHistogram"
import { RecurringSplit } from "@/components/charts/RecurringSplit"
import { KeyMetrics } from "@/components/charts/KeyMetrics"
import { DueSoonTable } from "@/components/tables/DueSoonTable"
import { OverdueTable } from "@/components/tables/OverdueTable"
import { mockInvoices } from "@/data/mockInvoices"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  sumTotal,
  sumCollected,
  sumOutstanding,
  avgInvoiceAmount,
  collectionRate,
  avgPaymentDays,
  momGrowth,
  newClientsThisMonth,
  groupByMonth,
  revenueByClient,
  revenueByProject,
  statusCounts,
  paymentBuckets,
  recurringSplit,
  dueSoon,
  overdue,
  formatCurrency,
  formatPercentage,
  fetchRealInvoices,
  getAvailableYears,
  type Invoice
} from "@/lib/analytics"
import {
  DollarSign,
  TrendingUp,
  Clock,
  Percent,
  Users,
  Calendar,
  Database,
  TestTube
} from "lucide-react"

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("all")
  const [useMockData, setUseMockData] = useState(true)
  const [realInvoices, setRealInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch real data when toggle is switched
  useEffect(() => {
    if (!useMockData) {
      setIsLoading(true)
      fetchRealInvoices()
        .then(invoices => {
          setRealInvoices(invoices)
          console.log('Fetched real invoices:', invoices.length)
        })
        .catch(error => {
          console.error('Error fetching real invoices:', error)
          setRealInvoices([])
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [useMockData])
  
  // Use mock or real data based on toggle
  const invoices = useMockData ? mockInvoices : realInvoices
  
  // Get available years for filter
  const availableYears = getAvailableYears(invoices)
  
  // Calculate all metrics
  const totalInvoiced = sumTotal(invoices)
  const totalCollected = sumCollected(invoices)
  const outstandingBalance = sumOutstanding(invoices)
  const avgAmount = avgInvoiceAmount(invoices)
  
  // Key metrics for new card
  const collection = collectionRate(invoices)
  const avgDays = avgPaymentDays(invoices)
  const growth = momGrowth(invoices)
  const newClients = newClientsThisMonth(invoices)
  
  // Chart data with date range filter
  const monthlyData = groupByMonth(invoices, dateRange)
  const clientData = revenueByClient(invoices)
  const projectData = revenueByProject(invoices)
  const statusData = statusCounts(invoices)
  const timelinessData = paymentBuckets(invoices)
  const recurringData = recurringSplit(invoices)
  
  // Debug: Log the data being passed to charts
  console.log(`${useMockData ? 'Mock' : 'Real'} invoices count:`, invoices.length)
  console.log('Monthly data:', monthlyData)
  console.log('Client data:', clientData)
  console.log('Project data:', projectData)
  console.log('Status data:', statusData)
  console.log('Timeliness data:', timelinessData)
  console.log('Recurring data:', recurringData)
  
  // Table data
  const dueSoonData = dueSoon(invoices, 3)
  const overdueData = overdue(invoices, 5)

  return (
    <DashboardLayout>
      <div className="space-y-8 bg-gradient-to-br from-gray-50 to-blue-50/30 min-h-screen -m-6 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#3C3CFF] to-[#6366F1] p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2">
                  Analytics Dashboard 📊
                </h1>
                <p className="text-blue-100 text-lg">
                  Track your business performance and revenue insights
                </p>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{formatCurrency(totalCollected)}</div>
                  <div className="text-blue-100 text-sm">Total Collected</div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
            </div>
            
            {/* Data Source Toggle */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 w-fit">
              <div className="flex items-center gap-2">
                {useMockData ? <TestTube className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                <Label htmlFor="data-toggle" className="text-white font-medium cursor-pointer">
                  {useMockData ? 'Test Data' : 'Real Data'}
                  {isLoading && <span className="ml-2 text-xs">(Loading...)</span>}
                </Label>
              </div>
              <Switch
                id="data-toggle"
                checked={!useMockData}
                onCheckedChange={(checked) => setUseMockData(!checked)}
                className="data-[state=checked]:bg-green-500"
              />
              <span className="text-xs text-blue-100">
                {invoices.length} invoice{invoices.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Summary Cards */}
        <Section title="Overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Invoiced"
              value={formatCurrency(totalInvoiced)}
              hintIcon={DollarSign}
              trendBadge={{ value: "+12.5%", direction: "up" }}
            />
            <MetricCard
              title="Total Collected"
              value={formatCurrency(totalCollected)}
              hintIcon={TrendingUp}
              trendBadge={{ value: "+8.2%", direction: "up" }}
            />
            <MetricCard
              title="Outstanding Balance"
              value={formatCurrency(outstandingBalance)}
              hintIcon={Clock}
              trendBadge={{ value: "-5.1%", direction: "down" }}
            />
            <MetricCard
              title="Avg Invoice Amount"
              value={formatCurrency(avgAmount)}
              hintIcon={DollarSign}
            />
          </div>
        </Section>

        {/* Date Range Filter for Revenue Trend */}
        <Section title="Revenue Trend">
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <Label className="text-sm font-medium text-gray-700">Time Period:</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={dateRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('all')}
                className={dateRange === 'all' ? 'bg-[#3C3CFF] hover:bg-[#2D2DCC]' : ''}
              >
                All Time
              </Button>
              <Button
                variant={dateRange === '6m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('6m')}
                className={dateRange === '6m' ? 'bg-[#3C3CFF] hover:bg-[#2D2DCC]' : ''}
              >
                Last 6 Months
              </Button>
              <Button
                variant={dateRange === '12m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('12m')}
                className={dateRange === '12m' ? 'bg-[#3C3CFF] hover:bg-[#2D2DCC]' : ''}
              >
                Last 12 Months
              </Button>
              <Button
                variant={dateRange === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDateRange('year')}
                className={dateRange === 'year' ? 'bg-[#3C3CFF] hover:bg-[#2D2DCC]' : ''}
              >
                {new Date().getFullYear()} YTD
              </Button>
            </div>
            
            {/* Year selector for older data */}
            {availableYears.length > 0 && (
              <Select 
                value={dateRange.match(/^\d{4}$/) ? dateRange : undefined} 
                onValueChange={setDateRange}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="By year..." />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <RevenueTrend data={monthlyData} />
        </Section>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientBreakdown data={clientData} />
          <ProjectBreakdown data={projectData} />
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusStack data={statusData} />
          <TimelinessHistogram data={timelinessData} />
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecurringSplit data={recurringData} />
          <KeyMetrics 
            collectionRate={collection}
            avgPaymentDays={avgDays}
            momGrowth={growth}
            newClients={newClients}
          />
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DueSoonTable items={dueSoonData} />
          <OverdueTable items={overdueData} />
        </div>
      </div>
    </DashboardLayout>
  )
}
