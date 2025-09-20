"use client"

import { useState } from "react"
import { Download, Calendar, Receipt, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useTaxReport } from "@/hooks/use-reports"
import { useAuth } from "@/contexts/auth-context"

export function TaxReports() {
  const [timePeriod, setTimePeriod] = useState("quarterly")
  const { user } = useAuth()
  
  // Calculate date range based on time period
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timePeriod) {
      case "monthly":
        startDate.setMonth(endDate.getMonth() - 1)
        break
      case "quarterly":
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case "yearly":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 3)
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const { startDate, endDate } = getDateRange()
  
  // Use the hook with error handling for SSR
  let taxData = null
  let loading = false
  let error = null
  
  try {
    const result = useTaxReport({
      startDate,
      endDate,
      outletId: user?.outletId
    })
    taxData = result.taxData
    loading = result.loading
    error = result.error
  } catch (e) {
    // Handle SSR case - taxData will remain null and use fallback below
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
  const taxDataFallback = taxData || {
    salesTax: {
      taxableRevenue: 0,
      taxRate: 0,
      taxCollected: 0,
      taxPaid: 0,
      balance: 0,
    },
    incomeTax: {
      grossIncome: 0,
      deductions: 0,
      taxableIncome: 0,
      taxRate: 0,
      taxOwed: 0,
      taxPaid: 0,
      balance: 0,
    },
    payrollTax: {
      grossPayroll: 0,
      employerTax: 0,
      employeeTax: 0,
      totalTax: 0,
      taxPaid: 0,
      balance: 0,
    },
  }

  // TODO: Replace with actual backend endpoint when tax transactions API is available
  const taxTransactions: any[] = []

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="default">Paid</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "overdue":
        return <Badge variant="destructive">Overdue</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const finalTaxData = taxDataFallback
  const totalTaxLiability = finalTaxData.salesTax.balance + finalTaxData.incomeTax.balance + finalTaxData.payrollTax.balance
  const overdueTransactions = taxTransactions.filter((tx) => tx.status === "overdue")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Tax Reports</h1>
          <p className="text-muted-foreground">Tax compliance and reporting dashboard</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
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

      {/* Tax Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tax Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Le {totalTaxLiability.toLocaleString('en-SL')}</div>
            <p className="text-xs text-muted-foreground">Outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Le {taxData.salesTax.taxCollected.toLocaleString('en-SL')}</div>
            <p className="text-xs text-muted-foreground">Sales tax this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{overdueTransactions.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tax Breakdown */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Sales Tax</span>
            </CardTitle>
            <CardDescription>Sales tax collection and remittance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Taxable Revenue:</span>
              <span className="font-semibold">Le {finalTaxData.salesTax.taxableRevenue.toLocaleString('en-SL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax Rate:</span>
              <span className="font-semibold">{finalTaxData.salesTax.taxRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax Collected:</span>
              <span className="font-semibold">Le {finalTaxData.salesTax.taxCollected.toLocaleString('en-SL')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax Paid:</span>
              <span className="font-semibold">Le {finalTaxData.salesTax.taxPaid.toLocaleString('en-SL')}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Balance Due:</span>
              <span className={`font-bold ${finalTaxData.salesTax.balance > 0 ? "text-destructive" : "text-primary"}`}>
                ${finalTaxData.salesTax.balance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Income Tax</span>
            </CardTitle>
            <CardDescription>Corporate income tax calculation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Gross Income:</span>
              <span className="font-semibold">${finalTaxData.incomeTax.grossIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Deductions:</span>
              <span className="font-semibold">${finalTaxData.incomeTax.deductions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Taxable Income:</span>
              <span className="font-semibold">${finalTaxData.incomeTax.taxableIncome.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Tax Owed:</span>
              <span className="font-semibold">${finalTaxData.incomeTax.taxOwed.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Balance Due:</span>
              <span className={`font-bold ${finalTaxData.incomeTax.balance > 0 ? "text-destructive" : "text-primary"}`}>
                ${finalTaxData.incomeTax.balance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="h-5 w-5" />
              <span>Payroll Tax</span>
            </CardTitle>
            <CardDescription>Employee and employer payroll taxes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm">Gross Payroll:</span>
              <span className="font-semibold">${finalTaxData.payrollTax.grossPayroll.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Employer Tax:</span>
              <span className="font-semibold">${finalTaxData.payrollTax.employerTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Employee Tax:</span>
              <span className="font-semibold">${finalTaxData.payrollTax.employeeTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total Tax:</span>
              <span className="font-semibold">${finalTaxData.payrollTax.totalTax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-semibold">Balance Due:</span>
              <span className={`font-bold ${finalTaxData.payrollTax.balance > 0 ? "text-destructive" : "text-primary"}`}>
                ${finalTaxData.payrollTax.balance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Transactions</CardTitle>
          <CardDescription>Recent tax payments and obligations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono">{transaction.id}</TableCell>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className="font-semibold">${transaction.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{transaction.dueDate}</span>
                      {transaction.status === "overdue" && <AlertTriangle className="h-4 w-4 text-destructive" />}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
