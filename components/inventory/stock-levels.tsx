"use client"

import { AlertTriangle, TrendingDown, TrendingUp, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useInventory, useLowStockAlerts } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"

export function StockLevels() {
  const { user } = useAuth()
  
  // Fetch inventory data and alerts
  const { 
    items: inventoryItems, 
    inventoryStats,
    loading: inventoryLoading, 
    error: inventoryError,
    refetch
  } = useInventory(user?.outletId)
  
  const {
    alerts,
    lowStockCount,
    outOfStockCount,
    loading: alertsLoading,
    error: alertsError
  } = useLowStockAlerts(user?.outletId)

  const loading = inventoryLoading || alertsLoading
  const error = inventoryError || alertsError

  const getTrendIcon = (currentStock: number, minStock: number, reorderPoint: number) => {
    if (currentStock === 0) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />
    }
    if (currentStock < minStock) {
      return <TrendingDown className="h-4 w-4 text-secondary" />
    }
    if (currentStock < reorderPoint) {
      return <TrendingDown className="h-4 w-4 text-yellow-500" />
    }
    if (currentStock > reorderPoint * 1.5) {
      return <TrendingUp className="h-4 w-4 text-primary" />
    }
    return <Package className="h-4 w-4 text-muted-foreground" />
  }

  const getStockStatus = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100
    if (current === 0) return { status: "Out of Stock", variant: "destructive" as const, color: "bg-destructive" }
    if (current < min) return { status: "Low Stock", variant: "secondary" as const, color: "bg-secondary" }
    if (percentage > 80) return { status: "Well Stocked", variant: "default" as const, color: "bg-primary" }
    return { status: "Normal", variant: "outline" as const, color: "bg-muted" }
  }

  // Filter alerts by type
  const criticalItems = alerts?.filter(alert => alert.type === 'out_of_stock') || []
  const lowStockItems = alerts?.filter(alert => alert.type === 'low_stock') || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Stock Levels</h1>
          <p className="text-muted-foreground">Monitor inventory levels and reorder points</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Stock Levels</h1>
          <p className="text-muted-foreground">Monitor inventory levels and reorder points</p>
        </div>
        <ErrorMessage 
          error="Failed to load stock levels" 
          onRetry={refetch} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Stock Levels</h1>
        <p className="text-muted-foreground">Monitor inventory levels and reorder points</p>
      </div>

      {/* Stock Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Critical Stock Alerts</span>
            </CardTitle>
            <CardDescription>Items below minimum stock level</CardDescription>
          </CardHeader>
          <CardContent>
            {criticalItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No critical stock alerts</p>
            ) : (
              <div className="space-y-2">
                {criticalItems.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 border border-destructive/20 rounded"
                  >
                    <div>
                      <p className="font-semibold text-sm">{alert.item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.item.currentStock} / {alert.item.minimumStock} {alert.item.product.unit}
                      </p>
                    </div>
                    <Button size="sm" variant="destructive">
                      Reorder Now
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-secondary">
              <Package className="h-5 w-5" />
              <span>Reorder Recommendations</span>
            </CardTitle>
            <CardDescription>Items approaching reorder point</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reorder recommendations</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 border border-secondary/20 rounded"
                  >
                    <div>
                      <p className="font-semibold text-sm">{alert.item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {alert.item.currentStock} / {alert.item.reorderPoint} {alert.item.product.unit}
                      </p>
                    </div>
                    <Button size="sm" variant="secondary">
                      Create Order
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Overview</CardTitle>
          <CardDescription>Current inventory levels across all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {inventoryItems?.map((item) => {
              const stockStatus = getStockStatus(item.currentStock, item.minimumStock, item.maximumStock)
              const stockPercentage = (item.currentStock / item.maximumStock) * 100

              return (
                <div key={item.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTrendIcon(item.currentStock, item.minimumStock, item.reorderPoint)}
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.product.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                      <div className="text-right">
                        <p className="font-semibold">
                          {item.currentStock} / {item.maximumStock}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.product.unit}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Min: {item.minimumStock}</span>
                      <span>Reorder: {item.reorderPoint}</span>
                      <span>Max: {item.maximumStock}</span>
                    </div>
                    <Progress value={stockPercentage} className="h-2" />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
