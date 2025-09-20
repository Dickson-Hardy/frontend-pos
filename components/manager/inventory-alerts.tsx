"use client"

import { AlertTriangle, Clock, Package, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useLowStockAlerts, useExpiryAlerts } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"
import { useInventoryRealTime } from "@/contexts/real-time-context"
import { format } from "date-fns"
import { useEffect } from "react"

export function InventoryAlerts() {
  const { user } = useAuth()
  const { inventoryUpdates } = useInventoryRealTime()
  
  const {
    alerts: lowStockAlerts,
    loading: lowStockLoading,
    error: lowStockError,
    refetch: refetchLowStock,
  } = useLowStockAlerts(user?.outletId)

  const {
    alerts: expiryAlerts,
    loading: expiryLoading,
    error: expiryError,
    refetch: refetchExpiry,
  } = useExpiryAlerts(user?.outletId)

  // Refresh alerts when inventory updates are received
  useEffect(() => {
    if (inventoryUpdates.length > 0) {
      const latestUpdate = inventoryUpdates[0]
      if (latestUpdate.type === 'inventory_update' || latestUpdate.type === 'low_stock_alert') {
        // Debounce the refresh to avoid too many API calls
        const timeoutId = setTimeout(() => {
          refetchLowStock()
          refetchExpiry()
        }, 1000)
        
        return () => clearTimeout(timeoutId)
      }
    }
  }, [inventoryUpdates, refetchLowStock, refetchExpiry])

  const loading = lowStockLoading || expiryLoading
  const error = lowStockError || expiryError

  // Combine and sort alerts by severity
  const allAlerts = [...(lowStockAlerts || []), ...(expiryAlerts || [])]
    .sort((a, b) => {
      // Sort by severity: error first, then warning
      if (a.severity === 'error' && b.severity === 'warning') return -1
      if (a.severity === 'warning' && b.severity === 'error') return 1
      return 0
    })
    .slice(0, 8) // Show only top 8 alerts

  const handleRefresh = () => {
    refetchLowStock()
    refetchExpiry()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Inventory Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Inventory Alerts</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage 
            error="Failed to load inventory alerts" 
            onRetry={handleRefresh}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Inventory Alerts</span>
            {allAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {allAlerts.length}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {allAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No inventory alerts at this time</p>
          </div>
        ) : (
          allAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                {alert.type === "low_stock" || alert.type === "out_of_stock" ? (
                  <Package className={`h-4 w-4 ${alert.severity === 'error' ? 'text-destructive' : 'text-yellow-600'}`} />
                ) : (
                  <Clock className={`h-4 w-4 ${alert.severity === 'error' ? 'text-destructive' : 'text-yellow-600'}`} />
                )}
                <div>
                  <p className="font-semibold text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                  {alert.type === 'expiring_soon' && alert.daysToExpiry && (
                    <p className="text-xs text-muted-foreground">
                      {alert.daysToExpiry} days remaining
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge
                  variant={alert.severity === "error" ? "destructive" : "secondary"}
                >
                  {alert.severity === "error" ? "Critical" : "Warning"}
                </Badge>
              </div>
            </div>
          ))
        )}
        
        {allAlerts.length > 0 && (
          <Button variant="outline" className="w-full mt-3 bg-transparent">
            View All Alerts ({(lowStockAlerts?.length || 0) + (expiryAlerts?.length || 0)})
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
