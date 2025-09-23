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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Clock,
  Users,
  Calculator,
  CheckCircle,
  AlertTriangle,
  ArrowRightLeft,
  Eye,
  FileText,
  Save,
  Send,
  RefreshCw,
  User,
  Calendar,
  Receipt,
  CreditCard,
  Banknote,
  TrendingUp,
  TrendingDown,
  LogOut,
  LogIn,
  Shield,
  History
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatSLL } from "@/lib/currency-utils"
import { apiClient } from "@/lib/api-unified"

interface ShiftSummary {
  shiftId: string
  startTime: string
  endTime?: string
  cashier: {
    id: string
    name: string
    email: string
  }
  outlet: {
    id: string
    name: string
  }
  startingCash: number
  endingCash: number
  totalSales: number
  cashSales: number
  creditCardSales: number
  refunds: number
  voids: number
  transactionCount: number
  averageTransaction: number
  status: 'active' | 'pending_close' | 'closed' | 'reconciled'
}

interface ShiftHandover {
  id?: string
  fromShift: ShiftSummary
  toShift?: ShiftSummary
  handoverTime: Date
  cashCount: {
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
  countedTotal: number
  expectedTotal: number
  variance: number
  issues: Array<{
    type: 'shortage' | 'overage' | 'damaged_product' | 'system_issue' | 'other'
    description: string
    amount?: number
  }>
  notes: string
  status: 'pending' | 'in_progress' | 'completed' | 'approved'
  signatures: {
    outgoingCashier?: string
    incomingCashier?: string
    supervisor?: string
  }
}

const CASH_DENOMINATIONS = [
  { key: 'ten_thousand', label: 'Le 10,000', value: 10000 },
  { key: 'five_thousand', label: 'Le 5,000', value: 5000 },
  { key: 'two_thousand', label: 'Le 2,000', value: 2000 },
  { key: 'one_thousand', label: 'Le 1,000', value: 1000 },
  { key: 'five_hundred', label: 'Le 500', value: 500 },
  { key: 'one_hundred', label: 'Le 100', value: 100 },
  { key: 'fifty', label: 'Le 50', value: 50 },
  { key: 'ten', label: 'Le 10', value: 10 },
  { key: 'five', label: 'Le 5', value: 5 },
  { key: 'one', label: 'Le 1', value: 1 }
]

const ISSUE_TYPES = [
  { value: 'shortage', label: 'Cash Shortage' },
  { value: 'overage', label: 'Cash Overage' },
  { value: 'damaged_product', label: 'Damaged Product' },
  { value: 'system_issue', label: 'System Issue' },
  { value: 'other', label: 'Other Issue' }
]

export function ShiftReconciliation() {
  const [currentShift, setCurrentShift] = useState<ShiftSummary | null>(null)
  const [handover, setHandover] = useState<ShiftHandover | null>(null)
  const [cashCount, setCashCount] = useState<ShiftHandover['cashCount']>({
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
  const [newIssueType, setNewIssueType] = useState('')
  const [newIssueDescription, setNewIssueDescription] = useState('')
  const [newIssueAmount, setNewIssueAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [isHandoverDialogOpen, setIsHandoverDialogOpen] = useState(false)
  const { toast } = useToast()

  // Format currency for Sierra Leone Leones
  const formatSLL = useCallback((amount: number): string => {
    return `Le ${amount.toLocaleString('en-SL')}`
  }, [])

  // Calculate total from cash count
  const calculateTotal = useCallback((count: ShiftHandover['cashCount']): number => {
    return CASH_DENOMINATIONS.reduce((total, denom) => {
      const countValue = count[denom.key as keyof typeof count] || 0
      return total + (countValue * denom.value)
    }, 0)
  }, [])

  const countedTotal = calculateTotal(cashCount)

  // Load current shift data
  const loadCurrentShift = useCallback(async () => {
    setIsLoading(true)
    try {
      // Get current active shift using API client
      const shift = await apiClient.shifts.getCurrent()
      
      if (shift) {
        // Convert Shift to ShiftSummary format
        const shiftSummary: ShiftSummary = {
          shiftId: shift.id,
          outlet: { id: shift.outletId, name: 'Unknown Outlet' },
          startingCash: shift.openingBalance,
          endingCash: shift.closingBalance || 0,
          totalSales: shift.totalSales,
          cashSales: shift.totalSales, // Assuming all sales are cash for now
          creditCardSales: 0,
          refunds: 0,
          voids: 0,
          transactionCount: 0, // This would need to be calculated from actual transactions
          averageTransaction: 0,
          status: shift.status as 'active' | 'pending_close' | 'closed' | 'reconciled',
          startTime: shift.startTime,
          endTime: shift.endTime,
          cashier: { 
            id: shift.cashierId, 
            name: shift.cashier?.firstName && shift.cashier?.lastName 
              ? `${shift.cashier.firstName} ${shift.cashier.lastName}` 
              : 'Unknown Cashier', 
            email: shift.cashier?.email || '' 
          }
        }
        setCurrentShift(shiftSummary)
        toast({
          title: "Shift Data Loaded",
          description: `Active shift information loaded for ${shift.cashier?.firstName || 'Unknown Cashier'}`,
        })
      } else {
        // No active shift found
        setCurrentShift(null)
        toast({
          title: "No Active Shift",
          description: "No active shift found. Please start a shift first.",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load shift data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Start shift handover process
  const startHandover = useCallback(async () => {
    if (!currentShift) {
      await loadCurrentShift()
      return
    }

    const newHandover: ShiftHandover = {
      id: 'handover_' + Date.now(),
      fromShift: currentShift,
      handoverTime: new Date(),
      cashCount: { ...cashCount },
      countedTotal: 0,
      expectedTotal: currentShift.endingCash,
      variance: 0,
      issues: [],
      notes: '',
      status: 'in_progress',
      signatures: {}
    }

    setHandover(newHandover)
    setActiveTab('count')
    setIsHandoverDialogOpen(false)
    
    toast({
      title: "Shift Handover Started",
      description: "Begin counting the cash drawer for shift handover",
    })
  }, [currentShift, cashCount, loadCurrentShift, toast])

  // Update cash count
  const updateCashCount = useCallback((denomination: keyof ShiftHandover['cashCount'], value: number) => {
    const newValue = Math.max(0, value)
    setCashCount(prev => ({
      ...prev,
      [denomination]: newValue
    }))

    if (handover) {
      const newCashCount = { ...cashCount, [denomination]: newValue }
      const newCountedTotal = calculateTotal(newCashCount)
      const newVariance = newCountedTotal - handover.expectedTotal

      setHandover(prev => prev ? {
        ...prev,
        cashCount: newCashCount,
        countedTotal: newCountedTotal,
        variance: newVariance
      } : null)
    }
  }, [cashCount, handover, calculateTotal])

  // Add issue
  const addIssue = useCallback(() => {
    if (!newIssueType || !newIssueDescription || !handover) return

    const issue = {
      type: newIssueType as any,
      description: newIssueDescription,
      amount: newIssueAmount ? parseFloat(newIssueAmount) : undefined
    }

    setHandover(prev => prev ? {
      ...prev,
      issues: [...prev.issues, issue]
    } : null)

    setNewIssueType('')
    setNewIssueDescription('')
    setNewIssueAmount('')

    toast({
      title: "Issue Added",
      description: "Issue has been recorded for this shift handover",
    })
  }, [newIssueType, newIssueDescription, newIssueAmount, handover, toast])

  // Complete handover
  const completeHandover = useCallback(async () => {
    if (!handover) return

    setIsLoading(true)
    try {
      // Complete handover via API using API client
      await apiClient.shifts.handover(currentShift?.shiftId!, {
        handoverData: handover,
        notes: notes
      })

      setHandover(prev => prev ? {
        ...prev,
        status: 'completed',
        notes,
        signatures: {
          ...prev.signatures,
          outgoingCashier: currentShift?.cashier.name
        }
      } : null)

      setActiveTab('summary')
      
      toast({
        title: "Shift Handover Completed",
        description: "Cash drawer handover has been completed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete handover",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [handover, notes, currentShift, toast])

  // Get variance status
  const getVarianceStatus = () => {
    if (!handover) return { color: 'text-gray-600', icon: Clock, label: 'Not Started' }
    
    const absVariance = Math.abs(handover.variance)
    if (absVariance === 0) return { color: 'text-green-600', icon: CheckCircle, label: 'Balanced' }
    if (absVariance <= 5) return { color: 'text-yellow-600', icon: AlertTriangle, label: 'Minor Variance' }
    if (absVariance <= 20) return { color: 'text-orange-600', icon: AlertTriangle, label: 'Significant Variance' }
    return { color: 'text-red-600', icon: AlertTriangle, label: 'Critical Variance' }
  }

  const varianceStatus = getVarianceStatus()
  const VarianceIcon = varianceStatus.icon

  useEffect(() => {
    loadCurrentShift()
  }, [loadCurrentShift])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shift Reconciliation</h2>
          <p className="text-muted-foreground">
            Manage cash drawer handovers between shifts
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentShift && (
            <>
              <Badge variant="outline" className="gap-1">
                <User className="h-3 w-3" />
                {currentShift.cashier.name}
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {currentShift.status === 'active' ? 'Active Shift' : 'Closed'}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Variance Alert */}
      {handover && Math.abs(handover.variance) > 0 && (
        <Alert className={`border-l-4 ${handover.variance > 0 ? 'border-l-green-500' : 'border-l-red-500'}`}>
          <VarianceIcon className="h-4 w-4" />
          <AlertTitle className={varianceStatus.color}>
            {varianceStatus.label}: {formatSLL(Math.abs(handover.variance))}
          </AlertTitle>
          <AlertDescription>
            {handover.variance > 0 
              ? `Cash drawer has ${formatSLL(handover.variance)} more than expected`
              : `Cash drawer has ${formatSLL(Math.abs(handover.variance))} less than expected`
            }
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="count" disabled={!handover}>Cash Count</TabsTrigger>
          <TabsTrigger value="issues" disabled={!handover}>Issues</TabsTrigger>
          <TabsTrigger value="summary" disabled={!handover || handover.status !== 'completed'}>
            Summary
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {currentShift ? (
            <>
              {/* Current Shift Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Current Shift Summary
                  </CardTitle>
                  <CardDescription>
                    Shift started at {currentShift.startTime.toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Banknote className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-600">Total Sales</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {formatSLL(currentShift.totalSales)}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Receipt className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-600">Transactions</p>
                      <p className="text-2xl font-bold text-green-900">
                        {currentShift.transactionCount}
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <Calculator className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-purple-600">Avg Transaction</p>
                      <p className="text-2xl font-bold text-purple-900">
                        {formatSLL(currentShift.averageTransaction)}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <Banknote className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-600">Expected Cash</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {formatSLL(currentShift.endingCash)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Starting Cash:</span>
                        <span className="font-medium">{formatSLL(currentShift.startingCash)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Cash Sales:</span>
                        <span className="font-medium text-green-600">+{formatSLL(currentShift.cashSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Card Sales:</span>
                        <span className="font-medium">{formatSLL(currentShift.creditCardSales)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Refunds:</span>
                        <span className="font-medium text-red-600">-{formatSLL(currentShift.refunds)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Voids:</span>
                        <span className="font-medium text-orange-600">{formatSLL(currentShift.voids)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Ending Cash:</span>
                        <span className="font-medium">{formatSLL(currentShift.endingCash)}</span>
                      </div>
                    </div>
                  </div>

                  <Button onClick={() => setIsHandoverDialogOpen(true)} className="w-full" size="lg">
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Start Shift Handover
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Shift</h3>
                <p className="text-muted-foreground mb-4">
                  There is currently no active shift to reconcile
                </p>
                <Button onClick={loadCurrentShift} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Cash Count Tab */}
        <TabsContent value="count" className="space-y-4">
          {handover && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Physical Cash Count
                </CardTitle>
                <CardDescription>
                  Count the actual cash in the drawer for handover
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {CASH_DENOMINATIONS.map((denom) => (
                    <div key={denom.key} className="space-y-2">
                      <Label className="text-center block">{denom.label}</Label>
                      <Input
                        type="number"
                        min="0"
                        value={cashCount[denom.key as keyof typeof cashCount]}
                        onChange={(e) => updateCashCount(
                          denom.key as keyof typeof cashCount, 
                          parseInt(e.target.value) || 0
                        )}
                        className="text-center"
                        placeholder="0"
                      />
                      <div className="text-xs text-center text-muted-foreground">
                        {formatSLL((cashCount[denom.key as keyof typeof cashCount] || 0) * denom.value)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expected Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatSLL(handover.expectedTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Counted Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatSLL(countedTotal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Variance</p>
                      <p className={`text-2xl font-bold ${handover.variance === 0 ? 'text-gray-900' : 
                        handover.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {handover.variance >= 0 ? '+' : ''}{formatSLL(handover.variance)}
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={() => setActiveTab('issues')} className="w-full">
                  Continue to Issues
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Issues Tab */}
        <TabsContent value="issues" className="space-y-4">
          {handover && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Report Issues
                  </CardTitle>
                  <CardDescription>
                    Document any issues found during the shift handover
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Issue Type</Label>
                      <Select value={newIssueType} onValueChange={setNewIssueType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select issue type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Amount (if applicable)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newIssueAmount}
                        onChange={(e) => setNewIssueAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button onClick={addIssue} disabled={!newIssueType || !newIssueDescription}>
                        Add Issue
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newIssueDescription}
                      onChange={(e) => setNewIssueDescription(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={3}
                    />
                  </div>

                  {handover.issues.length > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium">Reported Issues</h4>
                        {handover.issues.map((issue, index) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <Badge variant="outline" className="mb-2">
                                  {ISSUE_TYPES.find(t => t.value === issue.type)?.label}
                                </Badge>
                                <p className="text-sm">{issue.description}</p>
                              </div>
                              {issue.amount && (
                                <span className="font-semibold">Le {issue.amount.toFixed(2)}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Additional Notes</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any additional notes about the shift handover..."
                      rows={3}
                    />
                  </div>

                  <Button onClick={completeHandover} disabled={isLoading} className="w-full">
                    {isLoading ? 'Completing...' : 'Complete Handover'}
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {handover && handover.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Handover Summary
                </CardTitle>
                <CardDescription>
                  Shift handover completed at {handover.handoverTime.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Cash Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Expected Total:</span>
                        <span className="font-medium">Le {handover.expectedTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Counted Total:</span>
                        <span className="font-medium">Le {handover.countedTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Variance:</span>
                        <span className={`font-medium ${handover.variance === 0 ? 'text-gray-900' : 
                          handover.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          Le {handover.variance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Issues Reported</h4>
                    {handover.issues.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No issues reported</p>
                    ) : (
                      <div className="space-y-1 text-sm">
                        {handover.issues.map((issue, index) => (
                          <div key={index} className="flex justify-between">
                            <span>{ISSUE_TYPES.find(t => t.value === issue.type)?.label}:</span>
                            <span>{issue.amount ? `Le ${issue.amount.toFixed(2)}` : '—'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Handovers
              </CardTitle>
              <CardDescription>
                View recent shift handover history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { date: 'Today 2:00 PM', from: 'Sarah Johnson', to: 'Mike Chen', variance: -2.50, status: 'completed' },
                  { date: 'Today 10:00 AM', from: 'Alex Rodriguez', to: 'Sarah Johnson', variance: 1.25, status: 'approved' },
                  { date: 'Yesterday 6:00 PM', from: 'Emma Davis', to: 'Night Staff', variance: 0.00, status: 'approved' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.from} → {item.to}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${item.variance === 0 ? 'text-gray-600' : 
                        item.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
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

      {/* Start Handover Dialog */}
      <Dialog open={isHandoverDialogOpen} onOpenChange={setIsHandoverDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Shift Handover</DialogTitle>
            <DialogDescription>
              This will begin the cash drawer handover process. Make sure you have completed all transactions for this shift.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Once started, you will need to count all cash in the drawer and report any issues before completing the handover.
              </AlertDescription>
            </Alert>
            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setIsHandoverDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={startHandover} className="flex-1">
                Start Handover
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}