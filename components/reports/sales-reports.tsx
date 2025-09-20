"use client"

import { useState } from "react"
import { Calendar, Download, Filter, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { FallbackUI, ErrorFallback } from "@/components/ui/fallback-ui"
import { useSalesReport } from "@/hooks/use-reports"
import { useAuth } from "@/contexts/auth-context"
import { useError, useAsyncWithErrorHandling } from "@/contexts/error-context"

const chartConfig = {
  revenue: {
    label: "Revenue ($)",
    color: "hsl(var(--primary))",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(var(--secondary))",
  },
}

export function SalesReports() {
  const [timePeriod, setTimePeriod] = useState("6months")
  const { user } = useAuth()
  
  // Calculate date range based on time period
  const getDateRange = () => {
    const endDate = new Date()
    const startDate = new Date()
    
    switch (timePeriod) {
      case "7days":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "30days":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "3months":
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case "6months":
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case "1year":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setMonth(endDate.getMonth() - 6)
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const { startDate, endDate } = getDateRange()
  
  // Use the hook with error handling for SSR
  let salesReport = null
  let loading = false
  let error = null
  
  try {
    const result = useSalesReport({
      startDate,
      endDate,
      outletId: user?.outletId
    })
    salesReport = result.report
    loading = result.loading
    error = result.error
  } catch (e) {
    // Handle SSR case - return empty data structure
    salesReport = {
      totalSales: 0,
      totalTransactions: 0,
      averageTransaction: 0,
      dailyBreakdown: [],
      topProducts: []
    }
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

  if (!salesReport) {
    return <ErrorMessage error="No sales data available" />
  }

  // Transform backend data for charts
  const salesData = (salesReport?.dailyBreakdown || []).map(day => ({
    period: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: day.sales,
    transactions: day.transactions,
    avgTransaction: day.transactions > 0 ? day.sales / day.transactions : 0
  }))

  const topProducts = (salesReport?.topProducts || []).map(product => ({
    name: product.productName,
    revenue: product.revenue,
    units: product.quantity,
    growth: 0 // TODO: Calculate from historical data when available
  }))

  const totalRevenue = salesReport?.totalSales || 0
  const totalTransactions = salesReport?.totalTransactions || 0
  const avgTransactionValue = salesReport?.averageTransaction || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Sales Reports</h1>
          <p className="text-muted-foreground">Comprehensive sales analytics and performance metrics</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary">+12.5%</span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions.toLocaleString()}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary">+8.2%</span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Transaction Value</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Le {avgTransactionValue.toLocaleString('en-SL')}</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary">+3.8%</span>
              <span>vs previous period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <XAxis dataKey="period" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Number of transactions per month</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <XAxis dataKey="period" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="transactions" fill="hsl(var(--secondary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
          <CardDescription>Best performing products by revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                  <div>
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.units} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${product.revenue.toLocaleString()}</p>
                  <div className="flex items-center space-x-1 text-xs">
                    {product.growth > 0 ? (
                      <TrendingUp className="h-3 w-3 text-primary" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-secondary" />
                    )}
                    <span className={product.growth > 0 ? "text-primary" : "text-secondary"}>
                      {product.growth > 0 ? "+" : ""}
                      {product.growth}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
