"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useInventory } from "@/hooks/use-inventory"
import { useApi } from "@/hooks/use-api"
import { apiClient } from "@/lib/api-unified"
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  ShoppingCart,
  Users,
  Calendar,
  BarChart3
} from "lucide-react"

export function CashierDashboard() {
  const { user } = useAuth()
  const { inventoryStats, loading: inventoryLoading } = useInventory(user?.outletId)
  
  // Get today's sales data
  const { data: todaysSales, loading: salesLoading } = useApi(
    () => apiClient.sales.getDailySummary(user?.outletId),
    {
      cacheKey: `cashier-daily-sales-${user?.outletId || 'all'}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )

  // Get recent transactions
  const { data: recentSales, loading: recentSalesLoading } = useApi(
    () => apiClient.sales.getAll({ outletId: user?.outletId }),
    {
      cacheKey: `cashier-recent-sales-${user?.outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )

  if (inventoryLoading || salesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Outlet</p>
          <p className="font-semibold">{user?.outlet?.name || "Main Pharmacy"}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Le {todaysSales?.totalSales?.toLocaleString('en-SL') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {todaysSales?.transactionCount || 0} transactions
            </p>
          </CardContent>
        </Card>

        {/* Total Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {inventoryStats?.totalItems || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Le {inventoryStats?.totalValue?.toLocaleString('en-SL') || '0'} value
            </p>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {inventoryStats?.lowStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
          </CardContent>
        </Card>

        {/* Out of Stock */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {inventoryStats?.outOfStockCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Items unavailable
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentSalesLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                    <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                  </div>
                  <div className="h-4 bg-muted animate-pulse rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : recentSales && recentSales.length > 0 ? (
            <div className="space-y-3">
              {recentSales.slice(0, 10).map((sale: any) => (
                <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Sale #{sale.saleNumber || sale.id.slice(-6)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Le {sale.total?.toLocaleString('en-SL') || '0'}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.items?.length || 0} items
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent transactions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Stock Items */}
      {inventoryStats?.lowStockItems && inventoryStats.lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span>Low Stock Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {inventoryStats.lowStockItems.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      SKU: {item.sku || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-orange-600">
                      {item.stockQuantity || 0} left
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      Min: {item.reorderLevel || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
