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
import { LockedSection } from "@/components/LockedSection"
import { mockInvoices } from "@/data/mockInvoices"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  momGrowthTotalInvoiced,
  momGrowthTotalCollected,
  momGrowthOutstanding,
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
  TestTube,
  Sparkles,
  BarChart3
} from "lucide-react"
import { getCurrentAccount } from "@/lib/auth"
import type { Plan } from "@/lib/analytics-plan"
import {
  canUseFullAnalytics,
  isPremium,
  maxVisibleUpcomingDueDates,
  maxVisibleOverdueInvoices,
  maxVisibleClients,
  maxVisibleProjects,
  canSeeRevenueTrend,
  canSeePaymentTimeliness,
  canSeeClientTypes,
  canSeeAllKeyMetrics,
  canSeeAIInsights
} from "@/lib/analytics-plan"

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("all")
  const [useMockData, setUseMockData] = useState(false) // Default to real data
  const [realInvoices, setRealInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [plan, setPlan] = useState<Plan>("free")
  const [loadingPlan, setLoadingPlan] = useState(true)
  
  // Fetch current plan from database
  useEffect(() => {
    async function loadPlan() {
      try {
        setLoadingPlan(true)
        const account = await getCurrentAccount()
        if (account && account.plan_tier) {
          console.log('Loaded plan from database:', account.plan_tier)
          setPlan(account.plan_tier)
        } else {
          console.log('No account or plan_tier found, defaulting to free')
          setPlan('free')
        }
      } catch (error) {
        console.error('Error loading plan:', error)
        setPlan('free')
      } finally {
        setLoadingPlan(false)
      }
    }
    loadPlan()
  }, [])

  // Fetch real data on mount and when toggle is switched
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
    } else {
      // Clear real invoices when using mock data
      setRealInvoices([])
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
  
  // Calculate MoM trends
  const totalInvoicedTrend = momGrowthTotalInvoiced(invoices)
  const totalCollectedTrend = momGrowthTotalCollected(invoices)
  const outstandingTrend = momGrowthOutstanding(invoices)
  
  // Key metrics for new card
  const collection = collectionRate(invoices)
  const avgDays = avgPaymentDays(invoices)
  const growth = momGrowth(invoices)
  const newClients = newClientsThisMonth(invoices)
  
  // Helper function to format trend badge
  const formatTrendBadge = (trend: { value: number | null; hasData: boolean }) => {
    if (!trend.hasData || trend.value === null) {
      return { value: null, direction: 'neutral' as const, hasData: false }
    }
    const value = trend.value
    const formattedValue = `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    return {
      value: formattedValue,
      direction: value > 0 ? 'up' as const : value < 0 ? 'down' as const : 'neutral' as const,
      hasData: true
    }
  }
  
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
  
  // Plan-based limits
  const isFree = plan === 'free'
  const isPro = plan === 'pro'
  const isPremium = plan === 'premium'
  const canSeeFullAnalytics = canUseFullAnalytics(plan)
  
  // Table data with plan limits
  const maxDueSoon = maxVisibleUpcomingDueDates(plan)
  const maxOverdue = maxVisibleOverdueInvoices(plan)
  const dueSoonData = dueSoon(invoices, maxDueSoon === Infinity ? 10 : maxDueSoon)
  const overdueData = overdue(invoices, maxOverdue === Infinity ? 10 : maxOverdue)
  
  // Get total counts for upgrade messages
  const allDueSoon = dueSoon(invoices, 100)
  const allOverdue = overdue(invoices, 100)

  // Show loading state while plan is being fetched
  if (loadingPlan) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3C3CFF] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

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
              trendBadge={canSeeFullAnalytics ? formatTrendBadge(totalInvoicedTrend) : undefined}
            />
            {canSeeFullAnalytics ? (
              <>
                <MetricCard
                  title="Total Collected"
                  value={formatCurrency(totalCollected)}
                  hintIcon={TrendingUp}
                  trendBadge={formatTrendBadge(totalCollectedTrend)}
                />
                <MetricCard
                  title="Outstanding Balance"
                  value={formatCurrency(outstandingBalance)}
                  hintIcon={Clock}
                  trendBadge={formatTrendBadge(outstandingTrend)}
                />
              </>
            ) : (
              <>
                <Card className="bg-white border-0 shadow-sm rounded-2xl opacity-60">
                  <div className="p-6">
                    <div className="text-sm font-medium text-gray-600 mb-2">Total Collected</div>
                    <div className="text-2xl font-bold text-gray-400 mb-2">••••••</div>
                    <p className="text-xs text-gray-500">Upgrade to Pro to see collections and outstanding balances.</p>
                  </div>
                </Card>
                <Card className="bg-white border-0 shadow-sm rounded-2xl opacity-60">
                  <div className="p-6">
                    <div className="text-sm font-medium text-gray-600 mb-2">Outstanding Balance</div>
                    <div className="text-2xl font-bold text-gray-400 mb-2">••••••</div>
                    <p className="text-xs text-gray-500">Upgrade to Pro to see collections and outstanding balances.</p>
                  </div>
                </Card>
              </>
            )}
            <MetricCard
              title="Avg Invoice Amount"
              value={formatCurrency(avgAmount)}
              hintIcon={DollarSign}
            />
          </div>
        </Section>

        {/* Date Range Filter for Revenue Trend */}
        <Section title="Revenue Trend">
          {canSeeRevenueTrend(plan) ? (
            <>
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
            </>
          ) : (
            <LockedSection
              title="Revenue Trend"
              description="Monthly revenue and invoice creation trends"
              plan={plan}
              upgradeMessage="Revenue trends are available on Pro and Premium."
            >
              <RevenueTrend data={monthlyData} />
            </LockedSection>
          )}
        </Section>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canSeeFullAnalytics ? (
            <ClientBreakdown data={clientData} />
          ) : (
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Client</CardTitle>
                <CardDescription>Top clients by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clientData.slice(0, 1).map((item, index) => {
                    const totalRevenue = item.total
                    return (
                      <div key={item.client} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: 'hsl(239, 84%, 67%)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.client}</p>
                            <p className="text-xs text-gray-500">{item.count} invoices</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900">${item.total.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">100%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Showing your top client. Upgrade to see full client revenue breakdown.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {canSeeFullAnalytics ? (
            <ProjectBreakdown data={projectData} />
          ) : (
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Revenue by Project</CardTitle>
                <CardDescription>Top projects by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projectData.slice(0, 1).map((item, index) => {
                    const totalRevenue = item.total
                    return (
                      <div key={item.project} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-3 flex-1">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: 'hsl(239, 84%, 67%)' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{item.project}</p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <p className="text-sm font-semibold text-gray-900">${item.total.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">100%</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Showing your top project. Upgrade to see full project revenue breakdown.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canSeeFullAnalytics ? (
            <StatusStack data={statusData} />
          ) : (
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Payment Status</CardTitle>
                <CardDescription>Distribution of invoice payment statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paid:</span>
                    <span className="font-medium">{statusData.paid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending:</span>
                    <span className="font-medium">{statusData.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overdue:</span>
                    <span className="font-medium">{statusData.overdue}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Void:</span>
                    <span className="font-medium">{statusData.void}</span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 text-center">
                    Upgrade to see full visual payment status analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {canSeePaymentTimeliness(plan) ? (
            <TimelinessHistogram data={timelinessData} />
          ) : (
            <LockedSection
              title="Payment Timeliness"
              description="Distribution of payment times for paid invoices"
              plan={plan}
              upgradeMessage="See how fast clients pay across different time ranges (0–7 days, 8–14 days, etc.) with Pro."
              icon={Clock}
            />
          )}
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {canSeeClientTypes(plan) ? (
            <RecurringSplit data={recurringData} />
          ) : (
            <LockedSection
              title="Client Types"
              description="Breakdown of returning vs new clients"
              plan={plan}
              upgradeMessage="Upgrade to Pro to understand your client mix."
              icon={Users}
            />
          )}
          {canSeeAllKeyMetrics(plan) ? (
            <KeyMetrics 
              collectionRate={collection}
              avgPaymentDays={avgDays}
              momGrowth={growth}
              newClients={newClients}
            />
          ) : (
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Key Metrics</CardTitle>
                <CardDescription>Important performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Percent className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Collection Rate</p>
                        <p className="text-2xl font-bold text-gray-900">{collection.toFixed(1)}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Invoices paid on time</p>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gray-50 p-4 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">Avg Payment Time</p>
                        <p className="text-2xl font-bold text-gray-400">•••</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gray-50 p-4 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">MoM Growth</p>
                        <p className="text-2xl font-bold text-gray-400">•••</p>
                      </div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl bg-gray-50 p-4 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-600 mb-1">New Clients</p>
                        <p className="text-2xl font-bold text-gray-400">•••</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 text-center">
                    Upgrade to see all key performance indicators.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Upcoming Due Dates</CardTitle>
            </CardHeader>
            <CardContent>
              {dueSoonData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No upcoming due dates</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {dueSoonData.map((invoice) => {
                      const daysUntilDue = Math.ceil(
                        (new Date(invoice.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                      )
                      
                      return (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                            </div>
                            <p className="text-sm text-gray-600">{invoice.clientName} • {invoice.projectName}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</div>
                            <div className="text-sm text-gray-600">
                              {daysUntilDue === 0 ? 'Due today' : 
                               daysUntilDue === 1 ? 'Due tomorrow' : 
                               `Due in ${daysUntilDue} days`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {isFree && allDueSoon.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        Showing 1 of {allDueSoon.length} upcoming due invoices. Upgrade to unlock full upcoming due list.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {overdueData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No overdue invoices</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {overdueData.map((invoice) => {
                      const daysOverdue = Math.ceil(
                        (new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                      )
                      
                      return (
                        <div key={invoice.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900">{invoice.invoiceNumber}</span>
                            </div>
                            <p className="text-sm text-gray-600">{invoice.clientName} • {invoice.projectName}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">{formatCurrency(invoice.amount)}</div>
                            <div className="text-sm text-red-600">
                              {daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {isFree && allOverdue.length > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        Showing 1 of {allOverdue.length} overdue invoices. Upgrade to see all overdue invoices.
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Premium-only AI Insights */}
        {canSeeAIInsights(plan) ? (
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-sm rounded-2xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg font-semibold text-gray-900">AI Insights</CardTitle>
              </div>
              <CardDescription>Smart insights about your revenue, clients, and payment behavior</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-gray-900 mb-1">Revenue Trend Analysis</p>
                  <p className="text-sm text-gray-600">
                    Your revenue has grown 12.5% month-over-month. This trend suggests strong client retention and new business acquisition.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-gray-900 mb-1">Payment Behavior Insight</p>
                  <p className="text-sm text-gray-600">
                    Most clients pay within 0-7 days, indicating healthy cash flow. Consider offering early payment discounts to further improve collection times.
                  </p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-purple-100">
                  <p className="text-sm font-medium text-gray-900 mb-1">Client Mix Recommendation</p>
                  <p className="text-sm text-gray-600">
                    You have a good balance of returning and new clients. Focus on nurturing relationships with top revenue-generating clients.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-xs text-gray-500 italic">
                  * These are example insights. Real AI-powered insights will be available soon.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <LockedSection
            title="AI Insights"
            description="Smart insights about your revenue, clients, and payment behavior"
            plan={plan}
            upgradeMessage="Premium unlocks AI-powered insights based on your analytics."
            icon={Sparkles}
          />
        )}
      </div>
    </DashboardLayout>
  )
}
