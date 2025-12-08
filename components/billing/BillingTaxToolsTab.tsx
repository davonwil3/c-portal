"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { ChartContainer, ChartConfig, ChartTooltipContent } from "@/components/ui/chart"
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Info,
  Plus,
  Upload,
  Download,
  FileText,
  Sparkles,
  Calendar,
  Filter,
  CheckCircle,
  X,
  Tag,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { useCurrentPlan, type PlanTier } from "@/hooks/use-current-plan"

export type TaxTier = PlanTier

export interface Expense {
  id: string
  date: string
  description: string
  category: string
  amount: number
  aiCategorized?: boolean
}

export interface QuarterlyData {
  quarter: string
  income: number
  expenses: number
  estimatedTax: number
}

export interface BillingTaxToolsTabProps {
  incomeYtd?: number
  estimatedTax?: number
  quarterlyData?: QuarterlyData[]
  expenses?: Expense[]
  nextDeadline?: string
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Helper functions
const calculateProjectedYearEnd = (incomeYtd: number, taxRate: number): { income: number; taxes: number } => {
  const currentDate = new Date()
  const startOfYear = new Date(currentDate.getFullYear(), 0, 1)
  
  // Set both dates to midnight for accurate day calculation
  const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
  const yearStart = new Date(startOfYear.getFullYear(), startOfYear.getMonth(), startOfYear.getDate())
  
  // Calculate days elapsed (including today) - more precise calculation
  const msPerDay = 1000 * 60 * 60 * 24
  const daysElapsed = Math.floor((today.getTime() - yearStart.getTime()) / msPerDay) + 1
  const daysInYear = 365
  
  // Handle edge cases
  if (daysElapsed <= 0 || incomeYtd <= 0) {
    // At the very beginning of the year or no income yet
    return { income: incomeYtd, taxes: Math.round(incomeYtd * (taxRate / 100)) }
  }
  
  if (daysElapsed >= daysInYear) {
    // We're at or past year end, projection equals current
    return { income: incomeYtd, taxes: Math.round(incomeYtd * (taxRate / 100)) }
  }
  
  // Industry-standard projection: annualize based on time elapsed
  // Formula: Projected Annual Income = YTD Income × (365 / Days Elapsed)
  // This assumes consistent income throughout the year (standard tax projection method)
  const annualizationFactor = daysInYear / daysElapsed
  const projectedIncome = Math.round(incomeYtd * annualizationFactor)
  const projectedTaxes = Math.round(projectedIncome * (taxRate / 100))
  
  return { income: projectedIncome, taxes: projectedTaxes }
}

const calculateCategorizedPercentage = (expenses: Expense[]): number => {
  if (expenses.length === 0) return 0
  const aiCategorized = expenses.filter((e) => e.aiCategorized).length
  return Math.round((aiCategorized / expenses.length) * 100)
}

// Chart configuration for expense breakdown
const expenseChartConfig = {
  value: {
    label: "Amount",
  },
} satisfies ChartConfig

// Color palette for expense categories
const EXPENSE_COLORS = [
  "#3C3CFF", // Primary blue
  "#6366F1", // Indigo
  "#8B5CF6", // Purple
  "#A855F7", // Purple-500
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Green
]

export function BillingTaxToolsTab({
  incomeYtd = 125000,
  estimatedTax: initialEstimatedTax = 31250,
  quarterlyData = [
    { quarter: "Q1", income: 32000, expenses: 4500, estimatedTax: 8000 },
    { quarter: "Q2", income: 35000, expenses: 5200, estimatedTax: 8750 },
    { quarter: "Q3", income: 31000, expenses: 4800, estimatedTax: 7750 },
    { quarter: "Q4", income: 27000, expenses: 3500, estimatedTax: 6750 },
  ],
  expenses: initialExpenses = [
    { id: "1", date: "2024-01-15", description: "Office supplies", category: "Office", amount: 245.50, aiCategorized: true },
    { id: "2", date: "2024-01-20", description: "Software subscription", category: "Software", amount: 99.00 },
    { id: "3", date: "2024-02-05", description: "Co-working space", category: "Office", amount: 350.00 },
    { id: "4", date: "2024-02-12", description: "Marketing tools", category: "Marketing", amount: 149.99, aiCategorized: true },
    { id: "5", date: "2024-03-01", description: "Professional development course", category: "Education", amount: 499.00 },
  ],
  nextDeadline = "2024-04-15",
}: BillingTaxToolsTabProps) {
  const dbTaxTier = useCurrentPlan()
  const [useTestData, setUseTestData] = useState(false)
  const [overridePlan, setOverridePlan] = useState<PlanTier | null>(null)
  
  // Use override plan if set, otherwise use DB plan
  const taxTier = overridePlan || dbTaxTier
  const [loading, setLoading] = useState(true)
  const [taxRate, setTaxRate] = useState(25) // Percentage
  const [isCustomTaxRate, setIsCustomTaxRate] = useState(false)
  
  // Real data state
  const [realIncomeYtd, setRealIncomeYtd] = useState(0)
  const [realQuarterlyData, setRealQuarterlyData] = useState<QuarterlyData[]>([])
  const [realExpenses, setRealExpenses] = useState<Expense[]>([])
  const [realNextDeadline, setRealNextDeadline] = useState("")
  
  // Test data state
  const [testExpenses, setTestExpenses] = useState<Expense[]>(initialExpenses)
  
  // Use test or real data based on toggle
  const incomeYtdValue = useTestData ? incomeYtd : realIncomeYtd
  const quarterlyDataValue = useTestData ? quarterlyData : realQuarterlyData
  const expenses = useTestData ? testExpenses : realExpenses
  const nextDeadlineValue = useTestData ? nextDeadline : realNextDeadline
  
  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false)
  const [receiptUploadModalOpen, setReceiptUploadModalOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [emailReminders, setEmailReminders] = useState(taxTier !== "free")
  const [dateRange, setDateRange] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedExpenses, setSelectedExpenses] = useState<string[]>([])
  const [bulkCategoryOpen, setBulkCategoryOpen] = useState(false)
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "",
    amount: 0,
  })

  // Fetch real tax data
  useEffect(() => {
    if (!useTestData) {
      loadTaxData()
    } else {
      setLoading(false)
    }
  }, [useTestData])

  const loadTaxData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/tax/summary')
      if (!response.ok) throw new Error('Failed to fetch tax data')
      const data = await response.json()
      
      setRealIncomeYtd(data.incomeYtd || 0)
      setRealQuarterlyData(data.quarterlyData || [])
      setRealExpenses(data.expenses || [])
      setRealNextDeadline(data.nextDeadline || "")
    } catch (error) {
      console.error('Error loading tax data:', error)
      toast.error('Failed to load tax data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate estimated tax based on income and rate
  const estimatedTax = Math.round(incomeYtdValue * (taxRate / 100))

  const tierLabels = {
    free: "Free",
    pro: "Pro",
    premium: "Premium",
  }

  const categories = ["Office", "Software", "Marketing", "Education", "Travel", "Meals", "Other"]

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
      
      // Date range filtering
      if (dateRange === "all") {
        return matchesCategory
      }
      
      const expenseDate = new Date(expense.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (dateRange === "this-month") {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return matchesCategory && expenseDate >= startOfMonth
      }
      
      if (dateRange === "this-quarter") {
        const currentQuarter = Math.floor(today.getMonth() / 3)
        const startOfQuarter = new Date(today.getFullYear(), currentQuarter * 3, 1)
        return matchesCategory && expenseDate >= startOfQuarter
      }
      
      if (dateRange === "this-year") {
        const startOfYear = new Date(today.getFullYear(), 0, 1)
        return matchesCategory && expenseDate >= startOfYear
      }
      
      return matchesCategory
    })
  }, [expenses, categoryFilter, dateRange])

  const handleAddExpense = async () => {
    if (!newExpense.description || !newExpense.category || newExpense.amount <= 0) {
      toast.error("Please fill in all required fields")
      return
    }

    if (useTestData) {
      // Test data mode
      const newExpenseObj: Expense = {
        id: Date.now().toString(),
        ...newExpense,
      }
      setTestExpenses([...testExpenses, newExpenseObj])
      toast.success("Expense added successfully")
    } else {
      // Real data mode - save to API
      try {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newExpense),
        })
        if (!response.ok) throw new Error('Failed to create expense')
        const data = await response.json()
        setRealExpenses([...realExpenses, data.expense])
        toast.success("Expense added successfully")
        // Reload tax summary to update totals
        loadTaxData()
      } catch (error) {
        console.error('Error adding expense:', error)
        toast.error('Failed to add expense')
        return
      }
    }

    setAddExpenseModalOpen(false)
    setNewExpense({
      date: new Date().toISOString().split("T")[0],
      description: "",
      category: "",
      amount: 0,
    })
  }

  const handleExportCSV = () => {
    if (taxTier === "free") {
      toast.error("Exports available on Pro and Premium plans")
      return
    }

    try {
      // Create CSV content
      const headers = ["Date", "Description", "Category", "Amount"]
      const rows = filteredExpenses.map((exp) => [
        formatDate(exp.date),
        exp.description,
        exp.category,
        exp.amount.toFixed(2),
      ])

      let csvContent = [
        headers.join(","),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
      ].join("\n")

      // Add summary rows
      csvContent += "\n\n"
      csvContent += `"","Total Expenses (Filtered)","","${filteredTotalExpenses.toFixed(2)}"\n`
      csvContent += `"","Year-to-Date Income","","${incomeYtdValue.toFixed(2)}"\n`
      csvContent += `"","Estimated Taxes (${taxRate}%)","","${estimatedTax.toFixed(2)}"`

      // Create blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `tax-expenses-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success("CSV exported successfully")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      toast.error("Failed to export CSV")
    }
  }

  const handleExportPDF = async () => {
    if (taxTier === "free") {
      toast.error("Exports available on Pro and Premium plans")
      return
    }

    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Title
      doc.setFontSize(18)
      doc.text("Tax Summary Report", 14, 20)

      // Date
      doc.setFontSize(10)
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

      let yPos = 40

      // Summary section
      doc.setFontSize(14)
      doc.text("Summary", 14, yPos)
      yPos += 10

      doc.setFontSize(10)
      doc.text(`Year-to-Date Income: $${incomeYtdValue.toFixed(2)}`, 14, yPos)
      yPos += 7
      doc.text(`Total Expenses (Filtered): $${filteredTotalExpenses.toFixed(2)}`, 14, yPos)
      yPos += 7
      doc.text(`Estimated Taxes (${taxRate}%): $${estimatedTax.toFixed(2)}`, 14, yPos)
      yPos += 15

      // Expenses table
      doc.setFontSize(14)
      doc.text("Expenses", 14, yPos)
      yPos += 10

      // Table headers
      doc.setFontSize(10)
      doc.setFont(undefined, "bold")
      doc.text("Date", 14, yPos)
      doc.text("Description", 50, yPos)
      doc.text("Category", 120, yPos)
      doc.text("Amount", 160, yPos, { align: "right" })
      yPos += 7

      // Table rows
      doc.setFont(undefined, "normal")
      filteredExpenses.forEach((exp) => {
        if (yPos > 270) {
          // New page if needed
          doc.addPage()
          yPos = 20
        }

        doc.text(formatDate(exp.date), 14, yPos)
        doc.text(exp.description.substring(0, 30), 50, yPos)
        doc.text(exp.category, 120, yPos)
        doc.text(`$${exp.amount.toFixed(2)}`, 160, yPos, { align: "right" })
        yPos += 7
      })

      // Save PDF
      doc.save(`tax-summary-${new Date().toISOString().split("T")[0]}.pdf`)
      toast.success("PDF exported successfully")
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Failed to export PDF")
    }
  }

  const handleReceiptUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    setUploadedFiles([...uploadedFiles, ...fileArray])
    toast.success(`${fileArray.length} receipt(s) uploaded`)
  }

  const handleProcessReceipts = async () => {
    // Simulate AI processing - create new expenses
    const mockAmounts = [89.99, 125.50, 45.00, 199.99, 75.25]
    const mockCategories = ["Office", "Software", "Marketing", "Travel", "Meals"]
    const mockDescriptions = [
      "Office supplies from receipt",
      "Software subscription",
      "Marketing materials",
      "Business travel",
      "Client meeting meal",
    ]
    
    const newExpenses: Expense[] = uploadedFiles.map((file, index) => ({
      id: `receipt-${Date.now()}-${index}`,
      date: new Date().toISOString().split("T")[0],
      description: mockDescriptions[index % mockDescriptions.length],
      category: mockCategories[index % mockCategories.length],
      amount: mockAmounts[index % mockAmounts.length],
      aiCategorized: true,
    }))

    if (useTestData) {
      // Test data mode
      setTestExpenses([...testExpenses, ...newExpenses])
      toast.success(`Processed ${newExpenses.length} receipt(s) with AI`)
    } else {
      // Real data mode - save to API
      try {
        await Promise.all(
          newExpenses.map((exp) =>
            fetch('/api/expenses', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                date: exp.date,
                description: exp.description,
                category: exp.category,
                amount: exp.amount,
                aiCategorized: exp.aiCategorized,
              }),
            })
          )
        )
        setRealExpenses([...realExpenses, ...newExpenses])
        toast.success(`Processed ${newExpenses.length} receipt(s) with AI`)
        // Reload tax summary to update totals
        loadTaxData()
      } catch (error) {
        console.error('Error processing receipts:', error)
        toast.error('Failed to process receipts')
        return
      }
    }

    setUploadedFiles([])
    setReceiptUploadModalOpen(false)
  }

  const handleSelectAllExpenses = (checked: boolean) => {
    if (checked) {
      setSelectedExpenses(filteredExpenses.map((e) => e.id))
    } else {
      setSelectedExpenses([])
    }
  }

  const handleSelectExpense = (expenseId: string, checked: boolean) => {
    if (checked) {
      setSelectedExpenses([...selectedExpenses, expenseId])
    } else {
      setSelectedExpenses(selectedExpenses.filter((id) => id !== expenseId))
    }
  }

  const handleBulkCategorize = async (category: string) => {
    const count = selectedExpenses.length
    
    if (useTestData) {
      // Test data mode
      setTestExpenses(
        testExpenses.map((exp) =>
          selectedExpenses.includes(exp.id) ? { ...exp, category } : exp
        )
      )
      toast.success(`Categorized ${count} expense(s)`)
    } else {
      // Real data mode - update via API
      try {
        await Promise.all(
          selectedExpenses.map((id) =>
            fetch(`/api/expenses/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category }),
            })
          )
        )
        setRealExpenses(
          realExpenses.map((exp) =>
            selectedExpenses.includes(exp.id) ? { ...exp, category } : exp
          )
        )
        toast.success(`Categorized ${count} expense(s)`)
        // Reload tax summary to update totals
        loadTaxData()
      } catch (error) {
        console.error('Error categorizing expenses:', error)
        toast.error('Failed to categorize expenses')
        return
      }
    }
    
    setSelectedExpenses([])
    setBulkCategoryOpen(false)
  }

  const handleBulkDelete = async () => {
    const count = selectedExpenses.length
    
    if (useTestData) {
      // Test data mode
      setTestExpenses(testExpenses.filter((exp) => !selectedExpenses.includes(exp.id)))
      toast.success(`Deleted ${count} expense(s)`)
    } else {
      // Real data mode - delete from API
      try {
        await Promise.all(
          selectedExpenses.map((id) =>
            fetch(`/api/expenses/${id}`, { method: 'DELETE' })
          )
        )
        setRealExpenses(realExpenses.filter((exp) => !selectedExpenses.includes(exp.id)))
        toast.success(`Deleted ${count} expense(s)`)
        // Reload tax summary to update totals
        loadTaxData()
      } catch (error) {
        console.error('Error deleting expenses:', error)
        toast.error('Failed to delete expenses')
        return
      }
    }
    
    setSelectedExpenses([])
  }


  // Total expenses (all expenses, not filtered) for summary cards
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }, [expenses])
  
  // Filtered total for exports
  const filteredTotalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
  }, [filteredExpenses])
  
  // Calculate expense breakdown by category (using all expenses, not filtered)
  const expenseBreakdown = useMemo(() => {
    return expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount
      return acc
    }, {} as Record<string, number>)
  }, [expenses])

  // Transform expense breakdown into pie chart data
  const expenseChartData = useMemo(() => {
    return Object.entries(expenseBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        fill: EXPENSE_COLORS[index % EXPENSE_COLORS.length],
      }))
  }, [expenseBreakdown])

  // Calculate days until deadline
  const deadlineDate = nextDeadlineValue ? new Date(nextDeadlineValue) : new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  deadlineDate.setHours(0, 0, 0, 0)
  const daysUntilDeadline = Math.max(0, Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))

  // Calculate projected year-end
  const projectedYearEnd = useMemo(() => {
    return calculateProjectedYearEnd(incomeYtdValue, taxRate)
  }, [incomeYtdValue, taxRate])

  // Calculate AI categorization percentage
  const aiCategorizedPercentage = useMemo(
    () => calculateCategorizedPercentage(expenses),
    [expenses]
  )

  // Update email reminders when tier changes
  useEffect(() => {
    if (taxTier === "free") {
      setEmailReminders(false)
    } else {
      setEmailReminders(true)
    }
  }, [taxTier])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Tax Tools</h2>
            <p className="text-gray-600">
              A simple overview of your freelance income, expenses, and estimated taxes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Test Data Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Label htmlFor="test-data-toggle" className="text-sm text-gray-700 cursor-pointer">
                Use Test Data
              </Label>
              <Switch
                id="test-data-toggle"
                checked={useTestData}
                onCheckedChange={setUseTestData}
              />
            </div>
            {/* Plan Override Selector (Temporary for testing) */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <Label htmlFor="plan-override" className="text-sm text-gray-700">
                Plan:
              </Label>
              <Select
                value={overridePlan || "db"}
                onValueChange={(value) => {
                  if (value === "db") {
                    setOverridePlan(null)
                  } else {
                    setOverridePlan(value as PlanTier)
                  }
                }}
              >
                <SelectTrigger id="plan-override" className="h-8 w-32 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="db">DB Plan</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge
              variant="outline"
              className={`px-3 py-1 text-sm font-medium ${
                taxTier === "premium"
                  ? "border-purple-300 text-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50"
                  : "border-[#3C3CFF] text-[#3C3CFF] bg-[#F0F2FF]"
              }`}
            >
              {tierLabels[taxTier]}
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Info className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Jolix Tax Tools gives general guidance only and is not legal or financial advice.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Overview */}
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="h-5 w-5 text-[#3C3CFF]" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Year-to-date income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? "Loading..." : formatCurrency(incomeYtdValue)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">From all invoices</p>
                </CardContent>
              </Card>

              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Estimated taxes</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estimatedTax)}</p>
                  <p className="text-xs text-gray-500 mt-1">~{taxRate}% of income</p>
                </CardContent>
                {/* Tax Estimate Settings Panel (All Plans) */}
                <div className="px-6 pb-4 pt-0 border-t border-gray-100">
                  <div className="pt-4">
                    <Label htmlFor="tax-rate" className="text-xs font-medium text-gray-600 mb-2 block">
                      Tax estimate rate
                    </Label>
                    <Select
                      value={isCustomTaxRate ? "other" : taxRate.toString()}
                      onValueChange={(value) => {
                        if (value === "other") {
                          setIsCustomTaxRate(true)
                          // If current rate is one of the standard rates, set to 25% as default
                          if (taxRate === 20 || taxRate === 25 || taxRate === 30) {
                            setTaxRate(25)
                          }
                        } else {
                          setIsCustomTaxRate(false)
                          setTaxRate(parseInt(value))
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="25">25%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="other">Other (Custom)</SelectItem>
                      </SelectContent>
                    </Select>
                    {isCustomTaxRate && (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter custom tax rate %"
                        value={taxRate === 0 ? "" : taxRate}
                        className="mt-2 h-8 text-sm rounded-lg"
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0
                          if (value >= 0 && value <= 100) {
                            setTaxRate(value)
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt className="h-5 w-5 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Logged expenses</p>
                  <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalExpenses)} total</p>
                </CardContent>
              </Card>
            </div>

            {/* Projected Year-End Tax Widget (Premium only) */}
            {taxTier === "premium" && (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <p className="text-sm font-medium text-gray-900 mb-3">Projected year-end tax</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Projected income:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(projectedYearEnd.income)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Projected taxes:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(projectedYearEnd.taxes)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Tax Deadline Card (Pro+) */}
            {(taxTier === "pro" || taxTier === "premium") && (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Next tax deadline</p>
                      <p className="text-sm text-gray-600">
                        {nextDeadlineValue ? (
                          <>Next quarterly payment: {formatDate(nextDeadlineValue)} • {daysUntilDeadline} {daysUntilDeadline === 1 ? "day" : "days"} left</>
                        ) : (
                          <>No upcoming deadline</>
                        )}
                      </p>
                    </div>
                    <Calendar className="h-5 w-5 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quarterly Overview */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Quarterly Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-gray-500 text-center py-4">Loading quarterly data...</p>
                  ) : quarterlyDataValue.length > 0 ? (
                    quarterlyDataValue.map((quarter) => (
                    <div
                      key={quarter.quarter}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2">{quarter.quarter}</p>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Income</p>
                            <p className="font-medium text-gray-900">{formatCurrency(quarter.income)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expenses</p>
                            <p className="font-medium text-gray-900">{formatCurrency(quarter.expenses)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Est. Tax</p>
                            <p className="font-medium text-orange-600">{formatCurrency(quarter.estimatedTax)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No quarterly data available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Expense Breakdown (Pro+) */}
            {(taxTier === "pro" || taxTier === "premium") && (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Expense Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseChartData.length > 0 ? (
                    <>
                      <ChartContainer config={expenseChartConfig} className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart accessibilityLayer>
                            <Pie
                              data={expenseChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={100}
                              innerRadius={30}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {expenseChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              content={<ChartTooltipContent />}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="mt-4 space-y-2 text-sm">
                        {expenseChartData.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: item.fill }}
                              />
                              <span className="text-gray-600">{item.name}</span>
                            </div>
                            <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">No expenses to display</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Upgrade Banner */}
            <Card
              className={`border-0 shadow-sm rounded-2xl ${
                taxTier === "premium"
                  ? "bg-green-50 border-green-200"
                  : "bg-[#F0F2FF] border-[#3C3CFF]/20"
              }`}
            >
              <CardContent className="p-6">
                {taxTier === "free" && (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-2">
                        Upgrade to Pro for full reports, exports, and unlimited expenses.
                      </p>
                      <Button
                        size="sm"
                        className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
                        onClick={() => toast.info("Upgrade to Pro")}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}
                {taxTier === "pro" && (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 mb-2">
                        Upgrade to Premium for receipt uploads, AI categorization, and advanced reports.
                      </p>
                      <Button
                        size="sm"
                        className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
                        onClick={() => toast.info("Upgrade to Premium")}
                      >
                        Upgrade
                      </Button>
                    </div>
                  </div>
                )}
                {taxTier === "premium" && (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-700">You've unlocked all Tax Tools in Jolix.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Expenses & Reports */}
          <div className="space-y-6">
            {/* Expenses Section */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Expenses</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={taxTier !== "premium"}
                      className="rounded-lg"
                      onClick={() => {
                        if (taxTier !== "premium") {
                          toast.error("Available on Premium plan")
                        } else {
                          setReceiptUploadModalOpen(true)
                        }
                      }}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload receipts
                    </Button>
                    <Button
                      size="sm"
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
                      onClick={() => setAddExpenseModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add expense
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="flex-1 rounded-xl border-gray-200">
                      <Calendar className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="this-month">This month</SelectItem>
                      <SelectItem value="this-quarter">This quarter</SelectItem>
                      <SelectItem value="this-year">This year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="flex-1 rounded-xl border-gray-200">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* AI Categorization Percentage (Premium only) */}
                {taxTier === "premium" && expenses.length > 0 && (
                  <p className="text-xs text-gray-600">
                    AI automatically categorized {aiCategorizedPercentage}% of your expenses.
                  </p>
                )}

                {/* Bulk Actions Bar (Premium only) */}
                {taxTier === "premium" && selectedExpenses.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-[#F0F2FF] border border-[#3C3CFF]/20 rounded-lg">
                    <span className="text-sm font-medium text-gray-900">
                      {selectedExpenses.length} expense{selectedExpenses.length > 1 ? "s" : ""} selected
                    </span>
                    <div className="flex gap-2">
                      <Popover open={bulkCategoryOpen} onOpenChange={setBulkCategoryOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="rounded-lg">
                            <Tag className="mr-2 h-4 w-4" />
                            Categorize selected
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2">
                          <div className="space-y-1">
                            {categories.map((cat) => (
                              <Button
                                key={cat}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start text-sm"
                                onClick={() => handleBulkCategorize(cat)}
                              >
                                {cat}
                              </Button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete selected
                      </Button>
                    </div>
                  </div>
                )}

                {/* Expenses Table */}
                {filteredExpenses.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            {taxTier === "premium" && (
                              <th className="text-left p-3 w-12">
                                <Checkbox
                                  checked={selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0}
                                  onCheckedChange={handleSelectAllExpenses}
                                />
                              </th>
                            )}
                            <th className="text-left p-3 text-xs font-medium text-gray-600">Date</th>
                            <th className="text-left p-3 text-xs font-medium text-gray-600">Description</th>
                            <th className="text-left p-3 text-xs font-medium text-gray-600">Category</th>
                            <th className="text-right p-3 text-xs font-medium text-gray-600">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                              {taxTier === "premium" && (
                                <td className="p-3">
                                  <Checkbox
                                    checked={selectedExpenses.includes(expense.id)}
                                    onCheckedChange={(checked) => handleSelectExpense(expense.id, checked as boolean)}
                                  />
                                </td>
                              )}
                              <td className="p-3 text-sm text-gray-600">{formatDate(expense.date)}</td>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-900">{expense.description}</span>
                                  {taxTier === "studio" && expense.aiCategorized && (
                                    <Badge variant="outline" className="text-xs px-1.5 py-0.5 border-purple-200 text-purple-700 bg-purple-50">
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      AI
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline" className="text-xs">
                                  {expense.category}
                                </Badge>
                              </td>
                              <td className="p-3 text-sm font-medium text-gray-900 text-right">
                                {formatCurrency(expense.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 border border-gray-200 rounded-xl bg-gray-50">
                    <Receipt className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-sm text-gray-600 mb-4 text-center max-w-sm">
                      Start tracking your business expenses to get a clearer picture of your tax situation.
                    </p>
                    <Button
                      size="sm"
                      className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
                      onClick={() => setAddExpenseModalOpen(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add your first expense
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reports & Reminders Card */}
            <Card className="bg-white border-0 shadow-sm rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Reports & Reminders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Export summaries for your accountant or tax prep.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={taxTier === "free"}
                      className="flex-1 rounded-lg"
                      onClick={handleExportCSV}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={taxTier === "free"}
                      className="flex-1 rounded-lg"
                      onClick={handleExportPDF}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label htmlFor="email-reminders" className="text-sm font-medium text-gray-900">
                        Email me before each quarterly tax deadline
                      </Label>
                      {taxTier === "free" && (
                        <p className="text-xs text-gray-500 mt-1">Available on Pro and Premium.</p>
                      )}
                    </div>
                    <Switch
                      id="email-reminders"
                      checked={emailReminders}
                      onCheckedChange={setEmailReminders}
                      disabled={taxTier === "free"}
                    />
                  </div>
                  {emailReminders && nextDeadlineValue && (
                    <p className="text-xs text-gray-500 mt-2">
                      Next deadline: {formatDate(nextDeadlineValue)}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Advanced Reports Card (Premium only) */}
            {taxTier === "premium" && (
              <Card className="bg-white border-0 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Advanced Reports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">Year-end tax forecast</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projected annual income:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(projectedYearEnd.income)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Projected taxes:</span>
                        <span className="font-medium text-orange-600">{formatCurrency(projectedYearEnd.taxes)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>Download a full tax summary for your accountant.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-gray-400 mt-1">•</span>
                        <span>See year-over-year changes in income and expenses.</span>
                      </li>
                    </ul>
                  </div>

                  <Button
                    className="w-full bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
                    onClick={async () => {
                      try {
                        toast.info("Generating full tax report...")
                        // Generate a comprehensive PDF report
                        const { jsPDF } = await import("jspdf")
                        const doc = new jsPDF()

                        // Title
                        doc.setFontSize(20)
                        doc.text("Full Tax Report", 14, 20)

                        // Date
                        doc.setFontSize(10)
                        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30)

                        let yPos = 40

                        // Executive Summary
                        doc.setFontSize(16)
                        doc.text("Executive Summary", 14, yPos)
                        yPos += 10

                        doc.setFontSize(11)
                        doc.setFont(undefined, "bold")
                        doc.text("Year-to-Date Income:", 14, yPos)
                        doc.setFont(undefined, "normal")
                        doc.text(`$${incomeYtdValue.toFixed(2)}`, 80, yPos)
                        yPos += 8

                        doc.setFont(undefined, "bold")
                        doc.text("Total Expenses:", 14, yPos)
                        doc.setFont(undefined, "normal")
                        doc.text(`$${totalExpenses.toFixed(2)}`, 80, yPos)
                        yPos += 8

                        doc.setFont(undefined, "bold")
                        doc.text("Net Income:", 14, yPos)
                        doc.setFont(undefined, "normal")
                        doc.text(`$${(incomeYtdValue - totalExpenses).toFixed(2)}`, 80, yPos)
                        yPos += 8

                        doc.setFont(undefined, "bold")
                        doc.text(`Estimated Taxes (${taxRate}%):`, 14, yPos)
                        doc.setFont(undefined, "normal")
                        doc.text(`$${estimatedTax.toFixed(2)}`, 80, yPos)
                        yPos += 15

                        // Quarterly Breakdown
                        doc.setFontSize(16)
                        doc.text("Quarterly Breakdown", 14, yPos)
                        yPos += 10

                        doc.setFontSize(10)
                        doc.setFont(undefined, "bold")
                        doc.text("Quarter", 14, yPos)
                        doc.text("Income", 50, yPos)
                        doc.text("Expenses", 90, yPos)
                        doc.text("Net", 130, yPos)
                        doc.text("Est. Tax", 160, yPos, { align: "right" })
                        yPos += 7

                        doc.setFont(undefined, "normal")
                        quarterlyDataValue.forEach((q) => {
                          if (yPos > 270) {
                            doc.addPage()
                            yPos = 20
                          }
                          const net = q.income - q.expenses
                          doc.text(q.quarter, 14, yPos)
                          doc.text(`$${q.income.toFixed(2)}`, 50, yPos)
                          doc.text(`$${q.expenses.toFixed(2)}`, 90, yPos)
                          doc.text(`$${net.toFixed(2)}`, 130, yPos)
                          doc.text(`$${q.estimatedTax.toFixed(2)}`, 160, yPos, { align: "right" })
                          yPos += 7
                        })

                        yPos += 10

                        // Expense Breakdown by Category
                        doc.setFontSize(16)
                        doc.text("Expense Breakdown by Category", 14, yPos)
                        yPos += 10

                        doc.setFontSize(10)
                        doc.setFont(undefined, "bold")
                        doc.text("Category", 14, yPos)
                        doc.text("Amount", 120, yPos, { align: "right" })
                        yPos += 7

                        doc.setFont(undefined, "normal")
                        Object.entries(expenseBreakdown)
                          .sort(([, a], [, b]) => b - a)
                          .forEach(([category, amount]) => {
                            if (yPos > 270) {
                              doc.addPage()
                              yPos = 20
                            }
                            doc.text(category, 14, yPos)
                            doc.text(`$${amount.toFixed(2)}`, 120, yPos, { align: "right" })
                            yPos += 7
                          })

                        yPos += 10

                        // All Expenses
                        doc.setFontSize(16)
                        doc.text("All Expenses", 14, yPos)
                        yPos += 10

                        doc.setFontSize(10)
                        doc.setFont(undefined, "bold")
                        doc.text("Date", 14, yPos)
                        doc.text("Description", 50, yPos)
                        doc.text("Category", 120, yPos)
                        doc.text("Amount", 160, yPos, { align: "right" })
                        yPos += 7

                        doc.setFont(undefined, "normal")
                        expenses.forEach((exp) => {
                          if (yPos > 270) {
                            doc.addPage()
                            yPos = 20
                          }
                          doc.text(formatDate(exp.date), 14, yPos)
                          doc.text(exp.description.substring(0, 25), 50, yPos)
                          doc.text(exp.category, 120, yPos)
                          doc.text(`$${exp.amount.toFixed(2)}`, 160, yPos, { align: "right" })
                          yPos += 7
                        })

                        // Save PDF
                        doc.save(`full-tax-report-${new Date().toISOString().split("T")[0]}.pdf`)
                        toast.success("Full tax report generated successfully")
                      } catch (error) {
                        console.error("Error generating full tax report:", error)
                        toast.error("Failed to generate full tax report")
                      }
                    }}
                  >
                    Generate full tax report
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={addExpenseModalOpen} onOpenChange={setAddExpenseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-date">Date *</Label>
              <Input
                id="expense-date"
                type="date"
                value={newExpense.date}
                onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-description">Description *</Label>
              <Input
                id="expense-description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                placeholder="e.g., Office supplies"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-category">Category *</Label>
              <Select
                value={newExpense.category}
                onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Amount *</Label>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0"
                value={newExpense.amount || ""}
                onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddExpenseModalOpen(false)}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
            >
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Upload Modal (Premium only) */}
      <Dialog open={receiptUploadModalOpen} onOpenChange={setReceiptUploadModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Receipts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="receipt-upload">Select receipt files</Label>
              <Input
                id="receipt-upload"
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => handleReceiptUpload(e.target.files)}
                className="rounded-xl"
              />
              <p className="text-xs text-gray-500">Upload images or PDF files of your receipts</p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded files</Label>
                <div className="border border-gray-200 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 truncate flex-1">{file.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                        Processed
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReceiptUploadModalOpen(false)
                setUploadedFiles([])
              }}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessReceipts}
              disabled={uploadedFiles.length === 0}
              className="bg-[#3C3CFF] hover:bg-[#2D2DCC] text-white rounded-lg"
            >
              Process with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}

