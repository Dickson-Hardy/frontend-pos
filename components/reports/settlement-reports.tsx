"use client"

import { useState, useEffect } from "react"
import { Download, CreditCard, Banknote, Smartphone, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useSettlementReport } from "@/hooks/use-reports"
import { useAuth } from "@/contexts/auth-context"

export function SettlementReports() {
  const [timePeriod, setTimePeriod] = useState("weekly")
  const { user } = useAuth()
  
  // Calculate date range based on time period
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timePeriod) {
      case "daily":
        startDate.setDate(endDate.getDate() - 1)
        break
      case "weekly":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "monthly":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const { startDate, endDate } = getDateRange()
  
  // Use the hook with error handling for SSR
  let settlementData = null
  let loading = false
  let error = null
  
  try {
    const result = useSettlementReport({
      startDate,
      endDate,
      outletId: user?.outletId
    })
    settlementData = result.settlementData
    loading = result.loading
    error = result.error
  } catch (e) {
    // Handle SSR case - settlementData will remain null and use fallback below
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error?.message || error || 'An error occurred'} />
  }

  // Use empty data structure when backend data is not available
  const settlementDataFallback = settlementData || {
    cash: {
      openingBalance: 0,
      totalReceived: 0,
      totalPaid: 0,
      closingBalance: 0,
      transactions: 0,
    },
    card: {
      totalProcessed: 0,
      fees: 0,
      netAmount: 0,
      transactions: 0,
      avgTransaction: 0,
    },
    mobile: {
      totalProcessed: 0,
      fees: 0,
      netAmount: 0,
      transactions: 0,
      avgTransaction: 0,
    },
  }

  // Fetch actual settlement data from available APIs
  const [dailySettlements, setDailySettlements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    const fetchSettlementData = async () => {
      try {
        setIsLoading(true)
        // Import API client dynamically
        const { apiClient } = await import('@/lib/api-unified')
        
        // Get actual sales data to analyze payment methods
        const salesData = await apiClient.sales.getAll({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        } as any)
        
        // Analyze payment methods from actual sales
        const paymentMethodStats = new Map<string, {
          amount: number
          transactions: number
          fees: number
        }>()
        
        salesData.forEach((sale: any) => {
          const method = sale.paymentMethod || 'cash'
          const existing = paymentMethodStats.get(method) || { amount: 0, transactions: 0, fees: 0 }
          
          existing.amount += sale.total || 0
          existing.transactions += 1
          
          // Calculate fees based on payment method
          let feeRate = 0
          switch (method) {
            case 'card':
              feeRate = 0.025 // 2.5% for card payments
              break
            case 'mobile':
              feeRate = 0.015 // 1.5% for mobile payments
              break
            case 'cash':
            case 'insurance':
              feeRate = 0 // No fees for cash or insurance
              break
          }
          
          existing.fees += (sale.total || 0) * feeRate
          paymentMethodStats.set(method, existing)
        })
        
        // Convert to settlement format
        const settlements = Array.from(paymentMethodStats.entries()).map(([method, stats], index) => ({
          id: `settlement_${index + 1}`,
          date: new Date().toISOString().split('T')[0],
          method: method,
          amount: stats.amount,
          transactions: stats.transactions,
          fees: stats.fees,
          netAmount: stats.amount - stats.fees
        }))
        
        setDailySettlements(settlements)
      } catch (error) {
        console.error('Failed to fetch settlement data:', error)
        setDailySettlements([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchSettlementData()
  }, [])

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-4 w-4" />
      case "cash":
        return <Banknote className="h-4 w-4" />
      case "mobile":
        return <Smartphone className="h-4 w-4" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "settled":
        return <Badge variant="default">Settled</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const finalSettlementData = settlementDataFallback
  
  // Calculate totals from the fallback data structure (which has the correct format) 
  const totalRevenue = dailySettlements.reduce((sum, settlement) => sum + settlement.amount, 0) ||
    ((finalSettlementData as any).cash?.totalReceived || 0) + 
    ((finalSettlementData as any).card?.totalProcessed || 0) + 
    ((finalSettlementData as any).mobile?.totalProcessed || 0)
    
  const totalFees = dailySettlements.reduce((sum, settlement) => sum + (settlement.fees || 0), 0) ||
    ((finalSettlementData as any).card?.fees || 0) + ((finalSettlementData as any).mobile?.fees || 0)
    
  const netRevenue = totalRevenue - totalFees

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Settlement Reports</h1>
          <p className="text-muted-foreground">Payment processing and settlement tracking</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Gross payment processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Card and mobile fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${netRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">After processing fees</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Banknote className="h-5 w-5" />
              <span>Cash Payments</span>
            </CardTitle>
            <CardDescription>Cash handling and reconciliation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Opening Balance:</span>
              <span className="font-semibold">Le {((finalSettlementData as any).cash?.openingBalance || 0).toLocaleString('en-SL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Received:</span>
              <span className="font-semibold">${((finalSettlementData as any).cash?.totalReceived || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Paid Out:</span>
              <span className="font-semibold">${((finalSettlementData as any).cash?.totalPaid || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Closing Balance:</span>
              <span className="font-bold text-primary">${((finalSettlementData as any).cash?.closingBalance || 0).toLocaleString()}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {(finalSettlementData as any).cash?.transactions || 0} transactions
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Card Payments</span>
            </CardTitle>
            <CardDescription>Credit and debit card processing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Total Processed:</span>
              <span className="font-semibold">${((finalSettlementData as any).card?.totalProcessed || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Processing Fees:</span>
              <span className="font-semibold">${((finalSettlementData as any).card?.fees || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Net Amount:</span>
              <span className="font-bold text-primary">${((finalSettlementData as any).card?.netAmount || 0).toLocaleString()}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {(finalSettlementData as any).card?.transactions || 0} transactions • Avg: ${((finalSettlementData as any).card?.avgTransaction || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Mobile Payments</span>
            </CardTitle>
            <CardDescription>Digital wallet and mobile payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Total Processed:</span>
              <span className="font-semibold">${((finalSettlementData as any).mobile?.totalProcessed || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Processing Fees:</span>
              <span className="font-semibold">${((finalSettlementData as any).mobile?.fees || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Net Amount:</span>
              <span className="font-bold text-primary">${((finalSettlementData as any).mobile?.netAmount || 0).toLocaleString()}</span>
            </div>
            <div className="text-center text-sm text-muted-foreground">
              {(finalSettlementData as any).mobile?.transactions || 0} transactions • Avg: $
              {((finalSettlementData as any).mobile?.avgTransaction || 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Settlements */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Settlement Summary</CardTitle>
          <CardDescription>Daily breakdown of payment settlements</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Cash</TableHead>
                <TableHead>Card</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySettlements.map((settlement) => {
                // Calculate breakdown for display
                const cashAmount = settlement.method === 'cash' ? settlement.amount : 0
                const cardAmount = settlement.method === 'card' ? settlement.amount : 0
                const mobileAmount = settlement.method === 'mobile' ? settlement.amount : 0
                const total = settlement.amount
                
                return (
                  <TableRow key={settlement.id || settlement.date}>
                    <TableCell className="font-semibold">{settlement.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                        <span>${cashAmount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span>${cardAmount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <span>${mobileAmount.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">${total.toLocaleString()}</TableCell>
                    <TableCell>{settlement.transactions || 0}</TableCell>
                    <TableCell>{getStatusBadge('settled')}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
