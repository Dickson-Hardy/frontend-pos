"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { AlertTriangle, Package, Plus, Minus, RefreshCw, Search, Camera, Filter } from "lucide-react"
import { apiClient, Product, InventoryStats } from "@/lib/api-unified"
import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { BatchManagement } from "../admin/batch-management"

export function InventoryManagement() {
  const { user } = useAuth()
  const [adjustmentReason, setAdjustmentReason] = useState("")
  const [inventoryItems, setInventoryItems] = useState<Product[]>([])
  const [stats, setStats] = useState<InventoryStats>({ totalItems: 0, totalValue: 0, lowStockCount: 0, outOfStockCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adjustments, setAdjustments] = useState<{ [key: string]: number }>({})
  const [refreshing, setRefreshing] = useState(false)
  const [isReasonOpen, setIsReasonOpen] = useState(false)
  const [pendingAdjustment, setPendingAdjustment] = useState<{ productId: string; newQuantity: number } | null>(null)
  const [isThresholdOpen, setIsThresholdOpen] = useState(false)
  const [thresholds, setThresholds] = useState<{ productId: string; reorderLevel: number; maxStockLevel: number; productName?: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [barcodeInput, setBarcodeInput] = useState("")
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)

  const fetchInventoryData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [itemsData, statsData] = await Promise.all([
        apiClient.inventory.getItems(user?.outletId || undefined),
        apiClient.inventory.getStats(user?.outletId || undefined),
      ])
      console.log('=== INVENTORY DATA DEBUG ===')
      console.log('Items data:', itemsData)
      console.log('First item:', itemsData[0])
      console.log('First item keys:', itemsData[0] ? Object.keys(itemsData[0]) : 'No items')
      console.log('=== END DEBUG ===')
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
      const currentItem = inventoryItems.find(item => item.id === productId)
      if (!currentItem) return

      const quantityDiff = newQuantity - (currentItem.stockQuantity ?? 0)
      if (quantityDiff === 0) return
      
      const outletIdValue = typeof currentItem.outletId === 'string' 
        ? currentItem.outletId 
        : (currentItem.outletId as any)?.id || user?.outletId || ''
      
      const adjustmentType: 'increase' | 'decrease' = quantityDiff > 0 ? 'increase' : 'decrease'
      
      const payload: any = {
        productId: currentItem.id,
        outletId: outletIdValue,
        adjustedQuantity: quantityDiff,
        reason: adjustmentReason.trim(),
        adjustedBy: user?.id || "000000000000000000000000", // Default ObjectId for system
        type: adjustmentType,
      }

      console.log('Inventory adjustment payload:', payload)
      await apiClient.inventory.adjust(payload as any)
      
      // Refresh data
      const [itemsData, statsData] = await Promise.all([
        apiClient.inventory.getItems(user?.outletId || undefined),
        apiClient.inventory.getStats(user?.outletId || undefined),
      ])
      setInventoryItems(itemsData)
      setStats(statsData)
      
      // Debug: Check if the stock was updated
      const updatedItem = itemsData.find(item => item.id === payload.productId)
      console.log('After adjustment - Updated item:', updatedItem)
      console.log('Expected new stock:', (updatedItem?.stockQuantity ?? 0) + quantityDiff)
      
      setAdjustmentReason("")
      setAdjustments({})
      setIsReasonOpen(false)
      setPendingAdjustment(null)
    } catch (err) {
      console.error("Error adjusting stock:", err)
      setError("Failed to adjust inventory")
    }
  }

  const openReasonModal = (productId: string, newQuantity: number) => {
    setPendingAdjustment({ productId, newQuantity })
    setIsReasonOpen(true)
  }

  const openThresholdModal = (item: Product) => {
    setThresholds({
      productId: item.id,
      reorderLevel: item.reorderLevel ?? 0,
      maxStockLevel: item.maxStockLevel ?? 0,
      productName: item.name,
    })
    setIsThresholdOpen(true)
  }

  const saveThresholds = async () => {
    if (!thresholds) return
    try {
      await apiClient.inventory.updateItem(thresholds.productId, {
        reorderLevel: thresholds.reorderLevel,
        maxStockLevel: thresholds.maxStockLevel,
      })
      await fetchInventoryData()
      setIsThresholdOpen(false)
      setThresholds(null)
    } catch (err) {
      console.error('Failed to update thresholds', err)
      setError('Failed to update thresholds')
    }
  }

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    setAdjustments(prev => ({
      ...prev,
      [productId]: newQuantity
    }))
  }

  const handleBarcodeSearch = async () => {
    if (!barcodeInput.trim()) return
    
    try {
      // Search within the current inventory items first
      const foundItem = inventoryItems.find(item => 
        item.barcode === barcodeInput.trim()
      )
      
      if (foundItem) {
        // Scroll to the product in the list
        const element = document.getElementById(`product-${foundItem.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
          element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
          }, 3000)
        }
      } else {
        // If not found in current inventory, try API search
        const product = await apiClient.products.getByBarcode(barcodeInput)
        if (product) {
          // Find the inventory item for this product
          const inventoryItem = inventoryItems.find(item => 
            item.id === product.id
          )
          if (inventoryItem) {
            // Scroll to the product in the list
            const element = document.getElementById(`product-${product.id}`)
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' })
              element.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50')
              setTimeout(() => {
                element.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50')
              }, 3000)
            }
          }
        }
      }
      setBarcodeInput("")
    } catch (error) {
      console.error('Barcode search error:', error)
    }
  }

  const filteredInventoryItems = inventoryItems.filter(item => {
    const term = searchTerm.toLowerCase()
    const productName = item.name || item.genericName || ''
    const productId = item.id || ''
    const barcode = item.barcode || ''
    const sku = item.sku || ''
    const description = item.description || ''
    const manufacturer = item.manufacturer || ''
    
    return productName.toLowerCase().includes(term) ||
           productId.toLowerCase().includes(term) ||
           barcode.toLowerCase().includes(term) ||
           sku.toLowerCase().includes(term) ||
           description.toLowerCase().includes(term) ||
           manufacturer.toLowerCase().includes(term)
  })

  const getStockStatus = (item: Product) => {
    const currentStock = item.stockQuantity ?? 0
    const minimumStock = item.reorderLevel ?? 0
    
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

      {/* Search and Barcode Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products by name, ID, or barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Barcode Input */}
            <div className="flex gap-2">
              <div className="relative">
                <Camera className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Scan barcode..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                  className="pl-10 w-48"
                />
              </div>
              <Button onClick={handleBarcodeSearch} disabled={!barcodeInput.trim()}>
                <Camera className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>
          </div>
          
          {searchTerm && (
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredInventoryItems.length} of {inventoryItems.length} products
            </div>
          )}
        </CardContent>
      </Card>

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
          <CardTitle>Inventory Adjustments {user?.outlet?.name ? `- ${user.outlet.name}` : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInventoryItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inventory items found
              </div>
            ) : (
              filteredInventoryItems.map((item) => {
                const stockStatus = getStockStatus(item)
                const currentAdjustment = adjustments[item.id] ?? item.stockQuantity ?? 0
                
                return (
                  <div key={item.id} id={`product-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium text-lg">
                        {item.name || item.genericName || `Product ID: ${item.id}`}
                      </h3>
                      {(item.description || item.genericName) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.description || `${item.genericName} ${item.strength || ''}`.trim()}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>SKU: {item.sku || 'N/A'}</span>
                        {item.barcode && <span>Barcode: {item.barcode}</span>}
                        <span>Category: {item.category || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="font-medium">Current Stock: {item.stockQuantity ?? 0}</span>
                        <span>Min: {item.reorderLevel ?? 0}</span>
                        <span>Max: {item.maxStockLevel ?? 0}</span>
                        <Badge variant={stockStatus.variant}>{stockStatus.status}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, Math.max(0, currentAdjustment - 1))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input 
                        className="w-20 text-center" 
                        type="number"
                        min="0"
                        value={currentAdjustment}
                        onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, currentAdjustment + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openThresholdModal(item)}>
                        Edit thresholds
                      </Button>
                      {currentAdjustment !== (item.stockQuantity ?? 0) && (
                        <Button 
                          size="sm" 
                          className="bg-rose-600 hover:bg-rose-700"
                          onClick={() => openReasonModal(item.id, currentAdjustment)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            {/* Reason Modal */}
            <Dialog open={isReasonOpen} onOpenChange={setIsReasonOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Stock Adjustment</DialogTitle>
                  <DialogDescription>Provide a reason to apply this change. This will be logged for audit.</DialogDescription>
                </DialogHeader>
                {pendingAdjustment && (() => {
                  const item = inventoryItems.find(i => i.id === pendingAdjustment.productId)
                  const current = item?.stockQuantity ?? 0
                  const diff = pendingAdjustment.newQuantity - current
                  return (
                    <div className="space-y-3">
                      <div>
                        <Label>Product</Label>
                        <div className="mt-1 text-sm">{item?.name || pendingAdjustment.productId}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><Label>Current</Label><div className="mt-1">{current}</div></div>
                        <div><Label>New</Label><div className="mt-1">{pendingAdjustment.newQuantity}</div></div>
                        <div><Label>Change</Label><div className="mt-1">{diff > 0 ? `+${diff}` : `${diff}`}</div></div>
                      </div>
                      <div>
                        <Label>Reason</Label>
                <Textarea
                  placeholder="Enter reason for inventory adjustment..."
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsReasonOpen(false)}>Cancel</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700" onClick={() => handleStockAdjustment(pendingAdjustment.productId, pendingAdjustment.newQuantity)}>Confirm</Button>
                      </div>
                    </div>
                  )
                })()}
              </DialogContent>
            </Dialog>

            {/* Thresholds Modal */}
            <Dialog open={isThresholdOpen} onOpenChange={setIsThresholdOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Inventory Thresholds</DialogTitle>
                  <DialogDescription>Update minimum and maximum stock levels.</DialogDescription>
                </DialogHeader>
                {thresholds && (
                  <div className="space-y-3">
                    <div>
                      <Label>Product</Label>
                      <div className="mt-1 text-sm">{thresholds.productName}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Minimum (Reorder) Level</Label>
                        <Input type="number" value={thresholds.reorderLevel} onChange={(e) => setThresholds({ ...thresholds, reorderLevel: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Maximum Stock Level</Label>
                        <Input type="number" value={thresholds.maxStockLevel} onChange={(e) => setThresholds({ ...thresholds, maxStockLevel: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsThresholdOpen(false)}>Cancel</Button>
                      <Button onClick={saveThresholds}>Save</Button>
                    </div>
              </div>
            )}
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />
      {/* Batches Management Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Management</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchManagement />
        </CardContent>
      </Card>
    </div>
  )
}

export default InventoryManagement
