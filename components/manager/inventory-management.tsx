"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Package, Plus, Minus, RefreshCw } from "lucide-react"
import { apiClient, InventoryItem, InventoryStats } from "@/lib/api-unified"

export function InventoryManagement() {
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [stats, setStats] = useState<InventoryStats>({ totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({})
  const [refreshing, setRefreshing] = useState(false)

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [itemsData, statsData] = await Promise.all([
        apiClient.inventory.getItems(),
        apiClient.inventory.getStats(),
      ])
      setInventoryItems(itemsData)
      setStats(statsData)
    } catch (err) {
      setError("Failed to fetch inventory data")
      console.error("Error fetching inventory:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchInventoryData()
    setRefreshing(false)
  }

  useEffect(() => {
    fetchInventoryData()
  }, [])

  const handleStockAdjustment = async (productId: string, newQuantity: number) => {
    if (!adjustmentReason.trim()) {
      setError("Please provide a reason for the adjustment")
      return
    }

    try {
      const currentItem = inventoryItems.find(item => item.productId === productId)
      if (!currentItem) return

      const quantityDiff = newQuantity - (currentItem.currentStock ?? 0)
      
      await apiClient.inventory.adjust({
        productId,
        quantity: Math.abs(quantityDiff),
        reason: adjustmentReason,
        type: quantityDiff >= 0 ? 'increase' : 'decrease',
        outletId: currentItem.outletId,
      })
      
      // Refresh data
      await fetchInventoryData()
      setAdjustmentReason("")
      setAdjustments({})
    } catch (err) {
      console.error("Error adjusting stock:", err)
      setError("Failed to adjust inventory")
    }
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: newQuantity
    }))
  }

  const getStockStatus = (item: InventoryItem) => {
    const currentStock = item.currentStock ?? 0
    const minimumStock = item.minimumStock ?? 0
    
    if (currentStock === 0) return { status: 'Out of Stock', variant: 'destructive' as const }
    if (currentStock <= minimumStock) return { status: 'Low Stock', variant: 'secondary' as const }
    return { status: 'In Stock', variant: 'default' as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700">
            <Package className="h-4 w-4 mr-2" />
            Stock Take
          </Button>
        </div>
      </div>

      {error && (
        <Card>
          <CardContent className="p-4">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{stats.totalItems}</p>
                <p className="text-xs text-muted-foreground">
                  Value: Le {stats.totalValue.toLocaleString('en-SL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-bold">{stats.lowStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-bold">{stats.outOfStockCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Adjustments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inventoryItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inventory items found
              </div>
            ) : (
              inventoryItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const currentAdjustment = adjustments[item.productId] ?? item.currentStock ?? 0
                
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product?.name || `Product ID: ${item.productId}`}</h3>
                      <p className="text-sm text-muted-foreground">
                        Current Stock: {item.currentStock ?? 0} | Min: {item.minimumStock ?? 0} | Max: {item.maximumStock ?? 0}
                      </p>
                      <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuantityChange(item.productId, Math.max(0, currentAdjustment - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input 
                        className="w-20 text-center" 
                        type="number"
                        min="0"
                        value={currentAdjustment}
                        onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 0)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuantityChange(item.productId, currentAdjustment + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      {currentAdjustment !== (item.currentStock ?? 0) && (
                        <Button 
                          size="sm" 
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => handleStockAdjustment(item.productId, currentAdjustment)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {Object.keys(adjustments).length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <label className="block text-sm font-medium mb-2">Adjustment Reason (Required)</label>
                <Textarea
                  placeholder="Enter reason for inventory adjustment..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  Apply individual adjustments using the "Apply" button next to each item.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InventoryManagement
