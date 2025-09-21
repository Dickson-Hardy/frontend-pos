"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Download } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { useSales, useDailySummary } from "@/hooks/use-sales"

export function SalesReports() {
  const { salesStats, loading, error } = useSales()
  const { data: dailySummary, loading: dailyLoading } = useDailySummary()

  // Combine data from both hooks for more complete stats
  const combinedStats = {
    totalRevenue: dailySummary?.totalSales || salesStats?.totalSales || 0,
    totalTransactions: dailySummary?.transactionCount || salesStats?.totalTransactions || 0,
    averageOrderValue: dailySummary?.totalSales && dailySummary?.transactionCount 
      ? dailySummary.totalSales / dailySummary.transactionCount 
      : salesStats?.averageTransaction || 0,
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Sales Reports</h1>
        <Button className="bg-rose-600 hover:bg-rose-700">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {(loading || dailyLoading) && (
        <div className="text-center py-8 text-muted-foreground">
          Loading sales data...
        </div>
      )}

      {error && (
        <div className="text-center py-8 text-red-600">
          Error loading sales data
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today's Revenue</p>
                <p className="text-2xl font-bold">Le {combinedStats.totalRevenue?.toLocaleString('en-SL') || '0'}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+12%</span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{combinedStats.totalTransactions || 0}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+8%</span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">Le {combinedStats.averageOrderValue?.toLocaleString('en-SL') || '0'}</p>
                <div className="flex items-center gap-1 text-red-600">
                  <TrendingDown className="h-3 w-3" />
                  <span className="text-xs">-3%</span>
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Items Sold</p>
                <p className="text-2xl font-bold">{salesStats?.totalSales || 0}</p>
                <div className="flex items-center gap-1 text-green-600">
                  <TrendingUp className="h-3 w-3" />
                  <span className="text-xs">+15%</span>
                </div>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesStats?.topProducts?.slice(0, 3).map((product: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{product.name || 'Unknown Product'}</p>
                    <p className="text-sm text-muted-foreground">{product.sales || 0} units sold</p>
                  </div>
                  <p className="font-bold">Le {product.revenue?.toLocaleString('en-SL') || '0'}</p>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  No sales data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {salesStats?.paymentMethods?.map((payment: any, index: number) => (
                <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{payment.method || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">{payment.percentage || 0}% of sales</p>
                  </div>
                  <p className="font-bold">Le {payment.amount?.toLocaleString('en-SL') || '0'}</p>
                </div>
              )) || (
                <div className="text-center text-muted-foreground py-4">
                  No payment data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
