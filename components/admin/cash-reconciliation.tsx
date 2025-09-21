"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Calculator,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Save,
  Send,
  RefreshCw,
  User,
  Calendar,
  Receipt,
  CreditCard,
  Banknote,
  Target,
  Eye,
  Download,
  Upload
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CashCount {
  ten_thousand: number
  five_thousand: number
  two_thousand: number
  one_thousand: number
  five_hundred: number
  one_hundred: number
  fifty: number
  ten: number
  five: number
  one: number
}

interface DailySummary {
  startingCash: number
  totalSales: number
  cashSales: number
  creditCardSales: number
  totalRefunds: number
  cashRefunds: number
  cashPaidOuts: number
  expectedCash: number
  expectedEndingCash: number
  transactionCount: number
}

interface VarianceRecord {
  amount: number
  reason: string
  description: string
  reportedBy: string
  timestamp: Date
}

interface CashReconciliation {
  id?: string
  date: Date
  shift: string
  outlet: string
  cashier: string
  startingCash: number
  dailySummary: DailySummary
  actualCashCount: CashCount
  actualTotal: number
  actualCashTotal: number
  expectedCash: number
  expectedTotal: number
  variance: number
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'requires_attention'
  notes: string
  variances: VarianceRecord[]
  approvedBy?: string
  completedAt?: Date
  dueDate?: Date
}

const CASH_DENOMINATIONS = [
  { key: 'ten_thousand', label: 'Le 10,000 Notes', value: 10000, color: 'bg-green-100 text-green-800' },
  { key: 'five_thousand', label: 'Le 5,000 Notes', value: 5000, color: 'bg-blue-100 text-blue-800' },
  { key: 'two_thousand', label: 'Le 2,000 Notes', value: 2000, color: 'bg-purple-100 text-purple-800' },
  { key: 'one_thousand', label: 'Le 1,000 Notes', value: 1000, color: 'bg-orange-100 text-orange-800' },
  { key: 'five_hundred', label: 'Le 500 Notes', value: 500, color: 'bg-pink-100 text-pink-800' },
  { key: 'one_hundred', label: 'Le 100 Coins', value: 100, color: 'bg-gray-100 text-gray-800' },
  { key: 'fifty', label: 'Le 50 Coins', value: 50, color: 'bg-yellow-100 text-yellow-800' },
  { key: 'ten', label: 'Le 10 Coins', value: 10, color: 'bg-cyan-100 text-cyan-800' },
  { key: 'five', label: 'Le 5 Coins', value: 5, color: 'bg-indigo-100 text-indigo-800' },
  { key: 'one', label: 'Le 1 Coins', value: 1, color: 'bg-red-100 text-red-800' }
]

const VARIANCE_REASONS = [
  'Counting Error',
  'Cash Drawer Shortage',
  'Cash Drawer Overage', 
  'System Error',
  'Theft/Loss',
  'Credit Card Fee',
  'Bank Charge',
  'Refund Adjustment',
  'Other'
]

export function CashReconciliation() {
  const [reconciliation, setReconciliation] = useState<CashReconciliation | null>(null)
  const [startingCash, setStartingCash] = useState<number>(0)
  const [cashCount, setCashCount] = useState<CashCount>({
    ten_thousand: 0,
    five_thousand: 0,
    two_thousand: 0,
    one_thousand: 0,
    five_hundred: 0,
    one_hundred: 0,
    fifty: 0,
    ten: 0,
    five: 0,
    one: 0
  })
  const [selectedShift, setSelectedShift] = useState('day')
  const [selectedOutlet, setSelectedOutlet] = useState('main')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasLoadedSalesData, setHasLoadedSalesData] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [newVarianceReason, setNewVarianceReason] = useState('')
  const [newVarianceDescription, setNewVarianceDescription] = useState('')
  const { toast } = useToast()

  // Function to start reconciliation process
  const startReconciliation = useCallback(async () => {
    if (startingCash <= 0) {
      toast({
        title: "Invalid Starting Cash",
        description: "Please enter a valid starting cash amount.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Initialize reconciliation with starting cash
      const newReconciliation: CashReconciliation = {
        date: new Date(),
        shift: selectedShift,
        outlet: selectedOutlet,
        cashier: 'Current User', // This should come from auth context
        startingCash,
        dailySummary: {
          startingCash,
          totalSales: 0,
          cashSales: 0,
          creditCardSales: 0,
          totalRefunds: 0,
          cashRefunds: 0,
          cashPaidOuts: 0,
          expectedCash: startingCash,
          expectedEndingCash: startingCash,
          transactionCount: 0
        },
        actualCashCount: cashCount,
        actualTotal: 0,
        actualCashTotal: 0,
        expectedCash: startingCash,
        expectedTotal: startingCash,
        variance: 0,
        status: 'in_progress',
        notes: '',
        variances: []
      }
      
      setReconciliation(newReconciliation)
      setActiveTab('counting')
      
      toast({
        title: "Reconciliation Started",
        description: "You can now begin counting your cash drawer.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start reconciliation process.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [startingCash, selectedShift, selectedOutlet, cashCount, toast])

  // Helper functions for variance calculation
  const getVarianceIcon = (expectedCash: number, actualTotal: number) => {
    const variance = actualTotal - expectedCash
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <CheckCircle className="h-4 w-4 text-green-600" />
  }

  const getVarianceColor = (expectedCash: number, actualTotal: number) => {
    const variance = actualTotal - expectedCash
    if (variance > 0) return "text-green-600"
    if (variance < 0) return "text-red-600"
    return "text-green-600"
  }

  // Calculate total from cash count
  const calculateTotal = useCallback((count: CashCount): number => {
    return CASH_DENOMINATIONS.reduce((total, denom) => {
      const countValue = count[denom.key as keyof CashCount] || 0
      return total + (countValue * denom.value)
    }, 0)
  }, [])

  // Format currency for Sierra Leone Leones
  const formatSLL = useCallback((amount: number): string => {
    return `Le ${amount.toLocaleString('en-SL')}`
  }, [])

  const totalCounted = calculateTotal(cashCount)

  // Load sales data for selected shift
  const loadSalesData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch actual sales data from API
      const { apiClient } = await import('@/lib/api-unified')
      
      // Get sales summary for the selected period
      const salesData = await apiClient.sales.getDailySummary()
      
      // You could also filter by outlet and date range if the API supports it
      // const salesData = await apiClient.sales.getByDateRange(startDate, endDate, selectedOutlet)
      
      setHasLoadedSalesData(true)
      setActiveTab('count')
      
      toast({
        title: "Sales Data Loaded",
        description: `Sales summary loaded: $${salesData.totalSales.toFixed(2)} from ${salesData.transactionCount} transactions`,
      })
    } catch (error) {
      console.error('Failed to load sales data:', error)
      toast({
        title: "Error",
        description: "Failed to load sales data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedShift, selectedOutlet, cashCount, toast])

  // Update cash count and recalculate variance
  const updateCount = useCallback((denomination: keyof CashCount, value: number) => {
    const newValue = Math.max(0, value)
    setCashCount(prev => ({
      ...prev,
      [denomination]: newValue
    }))

    if (reconciliation) {
      const newCashCount = { ...cashCount, [denomination]: newValue }
      const newActualTotal = calculateTotal(newCashCount)
      const newVariance = newActualTotal - reconciliation.expectedTotal

      setReconciliation(prev => prev ? {
        ...prev,
        actualCashCount: newCashCount,
        actualTotal: newActualTotal,
        variance: newVariance,
        status: Math.abs(newVariance) > 20 ? 'requires_attention' : 'in_progress'
      } : null)
    }
  }, [cashCount, reconciliation, calculateTotal])

  // Quick add/subtract buttons
  const adjustCount = (denomination: keyof CashCount, adjustment: number) => {
    const currentValue = cashCount[denomination] || 0
    updateCount(denomination, currentValue + adjustment)
  }

  // Add variance explanation
  const addVarianceExplanation = () => {
    if (!newVarianceReason || !newVarianceDescription || !reconciliation) return

    const newVariance: VarianceRecord = {
      amount: reconciliation.variance,
      reason: newVarianceReason,
      description: newVarianceDescription,
      reportedBy: 'Current User',
      timestamp: new Date()
    }

    setReconciliation(prev => prev ? {
      ...prev,
      variances: [...prev.variances, newVariance]
    } : null)

    setNewVarianceReason('')
    setNewVarianceDescription('')
    
    toast({
      title: "Variance Explanation Added",
      description: "Variance reason has been recorded",
    })
  }

  // Submit cash count
  const submitCashCount = async () => {
    if (!reconciliation) return

    setIsLoading(true)
    try {
      const updatedReconciliation: CashReconciliation = {
        ...reconciliation,
        actualCashCount: cashCount,
        actualTotal: totalCounted,
        variance: totalCounted - reconciliation.expectedTotal,
        status: 'completed',
        notes,
        completedAt: new Date()
      }
      
      setReconciliation(updatedReconciliation)
      setActiveTab('review')
      
      toast({
        title: "Cash Count Submitted",
        description: `Variance: ${updatedReconciliation.variance >= 0 ? '+' : ''}${formatSLL(Math.abs(updatedReconciliation.variance))}`,
        variant: Math.abs(updatedReconciliation.variance) > 20 ? "destructive" : "default"
      })
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to submit cash count",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Submit for approval
  const submitForApproval = async () => {
    if (!reconciliation) return

    if (Math.abs(reconciliation.variance) > 20 && reconciliation.variances.length === 0) {
      toast({
        title: "Variance Explanation Required",
        description: "Large variances require explanation before approval",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setReconciliation(prev => prev ? {
        ...prev,
        status: Math.abs(prev.variance) <= 5 ? 'approved' : 'pending'
      } : null)
      
      toast({
        title: "Submitted for Approval",
        description: "Cash reconciliation submitted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit for approval",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getVarianceStatus = () => {
    if (!reconciliation) return { color: 'text-gray-600', icon: Clock, label: 'Not Started' }
    
    const absVariance = Math.abs(reconciliation.variance)
    if (absVariance === 0) return { color: 'text-green-600', icon: CheckCircle, label: 'Balanced' }
    if (absVariance <= 5) return { color: 'text-yellow-600', icon: AlertTriangle, label: 'Minor Variance' }
    if (absVariance <= 20) return { color: 'text-orange-600', icon: AlertTriangle, label: 'Significant Variance' }
    return { color: 'text-red-600', icon: AlertTriangle, label: 'Critical Variance' }
  }

  const varianceStatus = getVarianceStatus()
  const VarianceIcon = varianceStatus.icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Daily Cash Reconciliation</h2>
          <p className="text-muted-foreground">
            Count your cash drawer and reconcile with expected amounts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString()} - {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="count" disabled={!reconciliation}>Count Cash</TabsTrigger>
          <TabsTrigger value="summary" disabled={!reconciliation || reconciliation.status !== 'completed'}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Start Cash Reconciliation
              </CardTitle>
              <CardDescription>
                Begin the daily cash drawer reconciliation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startingCash">Starting Cash Amount</Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">Le</span>
                  <Input
                    id="startingCash"
                    type="number"
                    step="1"
                    value={startingCash}
                    onChange={(e) => setStartingCash(parseFloat(e.target.value) || 0)}
                    className="text-lg"
                    placeholder="2000000"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter the cash amount you started with in your drawer today
                </p>
              </div>

              <Button 
                onClick={startReconciliation} 
                disabled={isLoading || startingCash <= 0}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Starting...' : 'Start Reconciliation'}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Today's Sales</span>
                </div>
                <p className="text-2xl font-bold">Le {reconciliation?.dailySummary?.totalSales?.toLocaleString('en-SL') || '0'}</p>
                <p className="text-xs text-muted-foreground">Today's total sales</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Last Reconciliation</span>
                </div>
                <p className="text-2xl font-bold">Yesterday</p>
                <p className="text-xs text-muted-foreground">Variance: Le -250,000</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Weekly Avg Variance</span>
                </div>
                <p className="text-2xl font-bold">Le {reconciliation?.variance ? Math.abs(reconciliation.variance).toLocaleString('en-SL') : '0'}</p>
                <p className="text-xs text-muted-foreground">Current variance</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Count Cash Tab */}
        <TabsContent value="count" className="space-y-4">
          {reconciliation && (
            <>
              {/* Expected vs Actual Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Expected Cash Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Starting Cash</p>
                      <p className="text-lg font-semibold">${reconciliation.startingCash.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cash Sales</p>
                      <p className="text-lg font-semibold text-green-600">+${reconciliation.cashSales.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Cash Refunds</p>
                      <p className="text-lg font-semibold text-red-600">-${reconciliation.cashRefunds.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Expected Total</p>
                      <p className="text-xl font-bold">${reconciliation.expectedCash.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Counting Interface */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Count Your Cash
                  </CardTitle>
                  <CardDescription>
                    Count each denomination and enter the quantities below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Bills */}
                  <div>
                    <h4 className="font-semibold mb-3">Bills</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { key: 'hundreds' as keyof CashCount, label: '$100 Bills', value: 100 },
                        { key: 'fifties' as keyof CashCount, label: '$50 Bills', value: 50 },
                        { key: 'twenties' as keyof CashCount, label: '$20 Bills', value: 20 },
                        { key: 'tens' as keyof CashCount, label: '$10 Bills', value: 10 },
                        { key: 'fives' as keyof CashCount, label: '$5 Bills', value: 5 },
                        { key: 'ones' as keyof CashCount, label: '$1 Bills', value: 1 }
                      ].map(({ key, label, value }) => (
                        <div key={key} className="space-y-2">
                          <Label>{label}</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustCount(key, -1)}
                              disabled={cashCount[key] <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={cashCount[key]}
                              onChange={(e) => updateCount(key, parseInt(e.target.value) || 0)}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustCount(key, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm text-muted-foreground min-w-16">
                              ${(cashCount[key] * value).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Coins */}
                  <div>
                    <h4 className="font-semibold mb-3">Coins</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { key: 'quarters' as keyof CashCount, label: 'Quarters', value: 0.25 },
                        { key: 'dimes' as keyof CashCount, label: 'Dimes', value: 0.10 },
                        { key: 'nickels' as keyof CashCount, label: 'Nickels', value: 0.05 },
                        { key: 'pennies' as keyof CashCount, label: 'Pennies', value: 0.01 }
                      ].map(({ key, label, value }) => (
                        <div key={key} className="space-y-2">
                          <Label>{label}</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustCount(key, -1)}
                              disabled={cashCount[key] <= 0}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="0"
                              value={cashCount[key]}
                              onChange={(e) => updateCount(key, parseInt(e.target.value) || 0)}
                              className="text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => adjustCount(key, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm text-muted-foreground min-w-16">
                              ${(cashCount[key] * value).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Total and Variance */}
                  <div className="bg-muted p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Counted</p>
                        <p className="text-2xl font-bold">${totalCounted.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Expected</p>
                        <p className="text-2xl font-bold">${reconciliation.expectedCash.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Variance</p>
                        <div className="flex items-center justify-center gap-2">
                          {getVarianceIcon(reconciliation.expectedCash - totalCounted)}
                          <p className={`text-2xl font-bold ${getVarianceColor(reconciliation.expectedCash - totalCounted)}`}>
                            ${(reconciliation.expectedCash - totalCounted).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any notes about discrepancies or issues..."
                      rows={3}
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    onClick={submitCashCount}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isLoading ? 'Submitting...' : 'Submit Cash Count'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {reconciliation && reconciliation.status === 'completed' && (
            <>
              {/* Variance Alert */}
              {Math.abs(reconciliation.variance) > 10 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Significant variance detected: ${reconciliation.variance.toFixed(2)}. 
                    This requires manager approval.
                  </AlertDescription>
                </Alert>
              )}

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Reconciliation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Starting Cash:</span>
                      <span className="font-semibold">${reconciliation.startingCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cash Sales:</span>
                      <span className="font-semibold text-green-600">+${reconciliation.cashSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expected Total:</span>
                      <span className="font-semibold">${reconciliation.expectedCash.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span>Actual Counted:</span>
                      <span className="font-semibold">${reconciliation.actualCashTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Variance:</span>
                      <div className="flex items-center gap-2">
                        {getVarianceIcon(reconciliation.variance)}
                        <span className={`font-bold ${getVarianceColor(reconciliation.variance)}`}>
                          ${reconciliation.variance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Status & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span>Status:</span>
                      <Badge variant={reconciliation.status === 'completed' ? 'default' : 'secondary'}>
                        {reconciliation.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                      
                      {Math.abs(reconciliation.variance) <= 10 ? (
                        <Button className="w-full">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Auto-Approve
                        </Button>
                      ) : (
                        <Button variant="secondary" className="w-full">
                          <Send className="h-4 w-4 mr-2" />
                          Send for Manager Approval
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reconciliations</CardTitle>
              <CardDescription>
                View your recent cash reconciliation history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Today', variance: -2.50, status: 'completed' },
                  { date: 'Yesterday', variance: 1.25, status: 'approved' },
                  { date: '2 days ago', variance: -5.75, status: 'approved' },
                  { date: '3 days ago', variance: 0.00, status: 'approved' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.date}</p>
                      <p className="text-sm text-muted-foreground">Cash Reconciliation</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${getVarianceColor(item.variance)}`}>
                        ${item.variance.toFixed(2)}
                      </span>
                      <Badge variant={item.status === 'approved' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}