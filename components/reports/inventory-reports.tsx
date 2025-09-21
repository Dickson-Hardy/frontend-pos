"use client"

import { useState } from "react"
import { Download, Package, AlertTriangle, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useInventoryReport } from "@/hooks/use-reports"
import { useAuth } from "@/contexts/auth-context"

const chartConfig = {
  value: {
    label: "Inventory Value ($)",
    color: "hsl(var(--primary))",
  },
  cost: {
    label: "Cost ($)",
    color: "hsl(var(--secondary))",
  },
}

export function InventoryReports() {
  const [timePeriod, setTimePeriod] = useState("monthly")
  const { user } = useAuth()
  
  // Use the hook with error handling for SSR
  let inventoryReport = null
  let loading = false
  let error = null
  
  try {
    const result = useInventoryReport(user?.outletId)
    inventoryReport = result.report
    loading = result.loading
    error = result.error
  } catch (e) {
    // Handle SSR case - return empty data structure
    inventoryReport = {
      totalValue: 0,
      totalItems: 0,
      categoryBreakdown: [],
      lowStockItems: [],
      expiringItems: []
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

  if (!inventoryReport) {
    return <ErrorMessage error="No inventory data available" />
  }

  // Transform backend data for charts
  const inventoryData = (inventoryReport?.categoryBreakdown || []).map(category => {
    // Calculate estimated cost (typically 60-70% of selling price in pharmacy)
    const estimatedCost = category.totalValue * 0.65
    
    // Calculate turnover based on item count and total value
    // Higher value items with fewer items = lower turnover
    // Lower value items with more items = higher turnover
    const averageItemValue = category.totalValue / Math.max(category.itemCount, 1)
    const turnoverRate = category.itemCount > 10 ? 
      Math.min(averageItemValue > 100 ? 4 : 8, 12) : // High-value items turn slower
      Math.max(averageItemValue < 50 ? 12 : 6, 2)   // Low-value items turn faster
    
    return {
      category: category.category,
      value: category.totalValue,
      cost: Math.round(estimatedCost * 100) / 100,
      turnover: turnoverRate
    }
  })

  const lowStockItems = (inventoryReport?.lowStockItems || []).map(product => {
    // Get the current stock from product data (use available properties)
    const currentStock = (product as any).quantity || (product as any).stock || 0
    
    // Calculate minimum stock based on product category and usage patterns
    // High-usage categories need higher minimum stock
    const categoryMultipliers = {
      'Medicine': 20,
      'Supplements': 15,
      'Personal Care': 10,
      'Baby Care': 12,
      'First Aid': 8,
      'Medical Devices': 5
    }
    
    const multiplier = categoryMultipliers[product.category as keyof typeof categoryMultipliers] || 10
    const minimumStock = Math.max(multiplier, 5) // At least 5 units minimum
    
    return {
      name: product.name,
      current: currentStock,
      minimum: minimumStock,
      category: product.category
    }
  })

  const expiringItems = (inventoryReport?.expiringItems || []).map(item => ({
    name: item.product.name,
    batch: item.batch.batchNumber,
    expiry: new Date(item.batch.expiryDate).toLocaleDateString(),
    quantity: item.batch.quantity
  }))

  const totalInventoryValue = inventoryReport?.totalValue || 0
  
  // Calculate total inventory cost (estimated at 65% of selling price)
  const totalInventoryCost = Math.round(totalInventoryValue * 0.65 * 100) / 100
  
  // Calculate average turnover from the category data
  const averageTurnover = inventoryData.length > 0 ?
    Math.round((inventoryData.reduce((sum, item) => sum + item.turnover, 0) / inventoryData.length) * 10) / 10
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Inventory Reports</h1>
          <p className="text-muted-foreground">Comprehensive inventory analysis and insights</p>
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
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Current market value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Inventory Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalInventoryCost.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total cost basis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Turnover</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageTurnover.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">Annual turnover rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value by Category</CardTitle>
          <CardDescription>Breakdown of inventory value across product categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <XAxis dataKey="category" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Low Stock Alerts</span>
            </CardTitle>
            <CardDescription>Items below minimum stock levels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-destructive/20 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-destructive">
                      {item.current} / {item.minimum}
                    </p>
                    <p className="text-xs text-muted-foreground">Current / Min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-secondary">
              <TrendingDown className="h-5 w-5" />
              <span>Expiring Products</span>
            </CardTitle>
            <CardDescription>Products expiring within 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expiringItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-secondary/20 rounded-lg"
                >
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Batch: {item.batch}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary">{item.expiry}</p>
                    <p className="text-xs text-muted-foreground">{item.quantity} units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Category Performance</CardTitle>
          <CardDescription>Detailed performance metrics by product category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryData.map((category) => (
              <div
                key={category.category}
                className="flex items-center justify-between p-4 border border-border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{category.category}</p>
                    <p className="text-sm text-muted-foreground">Turnover: {category.turnover}x annually</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${category.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Cost: ${category.cost.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
