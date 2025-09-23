"use client"

import React, { useState } from "react"
import { Search, Scan, Package, Grid3x3, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useAuth } from "@/contexts/auth-context"
import { BarcodeScanner } from "./barcode-scanner"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { apiClient } from "@/lib/api-unified"
import { getOutletId } from "@/lib/user-utils"
import { useInventory } from "@/hooks/use-inventory"
import type { Product } from "@/lib/api-unified"

// Extended product type with inventory information
type ProductWithStock = Product & {
  currentStock?: number
  stockQuantity?: number
  reorderLevel?: number
  minimumStock?: number
}

interface CartItem {
  id: string
  name: string
  price: number
  unit: string
  stock?: number
  batchNumber?: string
  expiryDate?: string
  category?: string
}

interface ProductSearchMobileProps {
  onAddToCart: (product: any) => void
  cartItems?: CartItem[]
}

export function ProductSearchMobile({ onAddToCart, cartItems = [] }: ProductSearchMobileProps) {
  // All hooks must be called at the top level - never conditionally
  const { user } = useAuth()
  const outletId = getOutletId(user)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  
  // Use inventory hook for automatic cache invalidation
  const { items: inventoryItems, loading, error } = useInventory(outletId)
  
  // Convert inventory items to products with stock
  const products: ProductWithStock[] = React.useMemo(() => {
    if (!inventoryItems) return []
    
    return inventoryItems.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      barcode: item.barcode || '',
      price: item.sellingPrice || item.price || 0,
      cost: item.costPrice || item.cost || 0,
      unit: item.unitOfMeasure || item.unit || 'unit',
      category: item.category || 'Unknown',
      manufacturer: item.manufacturer || '',
      requiresPrescription: item.requiresPrescription || false,
      isActive: true,
      outletId: outletId || '',
      allowUnitSale: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentStock: item.stockQuantity || 0,
      stockQuantity: item.stockQuantity || 0,
      reorderLevel: item.reorderLevel || 0,
      minimumStock: item.reorderLevel || 0,
      sku: item.sku || item.barcode,
      batchNumber: item.sku || item.barcode,
      expiryDate: item.expiryDate || '2025-12-31'
    }))
  }, [inventoryItems, outletId])
  
  // Filter products based on search term
  const filteredProducts = React.useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return products
    
    const term = searchTerm.toLowerCase()
    return products.filter(product => {
      const searchFields = [
        product.name,
        product.category,
        product.manufacturer,
        product.barcode,
        product.sku
      ].filter(Boolean).map(field => field?.toLowerCase()).filter(Boolean)
      
      return searchFields.some(field => field?.includes(term))
    })
  }, [products, searchTerm])
  
  // Barcode scanner functionality
  const { 
    isScanning, 
    isLoading: scannerLoading, 
    startScanning, 
    stopScanning, 
    handleScan,
    clearLastResult 
  } = useBarcodeScanner()

  const handleAddToCart = (product: any) => {
    const cartItem: Omit<CartItem, "quantity"> = {
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      stock: product.currentStock || product.stockQuantity || 0,
      batchNumber: product.batchNumber,
      expiryDate: product.expiryDate,
      category: product.category,
    }
    
    onAddToCart(cartItem)
    showSuccessToast(`Added ${product.name} to cart`)
  }

  // Handle barcode scan results
  const handleBarcodeScanned = async (barcode: string) => {
    const result = await handleScan(barcode)
    
    if (result.success && result.product) {
      const product = result.product as any
      const cartItem: Omit<CartItem, "quantity"> = {
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'unit',
        stock: product.currentStock || product.stockQuantity || 0,
        batchNumber: product.sku || product.barcode,
        expiryDate: "2025-12-31",
        category: product.category,
      }
      
      onAddToCart(cartItem)
      showSuccessToast(`Scanned: ${product.name}`)
      stopScanning()
    } else {
      showErrorToast(result.error || 'Product not found')
    }
  }

  const handleStartScanning = () => {
    clearLastResult()
    startScanning()
  }

  const isLowStock = (stock: number, reorderLevel: number) => stock <= reorderLevel

  const getStockInfo = (product: ProductWithStock) => {
    const stock = product.currentStock || product.stockQuantity || 0
    const reorderLevel = product.reorderLevel || product.minimumStock || 0
    const isLow = isLowStock(stock, reorderLevel)
    
    return {
      stock,
      reorderLevel,
      isLow,
      status: isLow ? 'low' : stock === 0 ? 'out' : 'good'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'out': return 'bg-red-100 text-red-800'
      default: return 'bg-green-100 text-green-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'low': return 'Low Stock'
      case 'out': return 'Out of Stock'
      default: return 'In Stock'
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
    return (
      <div className="text-center text-red-600 p-4">
        <p>Failed to load products: {String(error)}</p>
        <Button onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleStartScanning}
            disabled={scannerLoading}
          >
            <Scan className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <Package className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredProducts.length} products
          </div>
        </div>
      </div>
//fixes to do and push
      {/* Barcode Scanner */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onScan={handleBarcodeScanned}
          onClose={stopScanning}
        />
      )}

      {/* Products Grid/List */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No products found matching your search' : 'No products available'}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2'}>
          {filteredProducts.map((product) => {
            const stockInfo = getStockInfo(product)
            const isInCart = cartItems.some(item => item.id === product.id)
            
            return (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {product.category}
                        </p>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(stockInfo.status)}
                      >
                        {getStatusText(stockInfo.status)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-green-600">
                          Le {product.price.toLocaleString('en-SL')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Stock: {stockInfo.stock}
                        </p>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={stockInfo.stock === 0 || isInCart}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {isInCart && (
                      <div className="text-xs text-blue-600 font-medium">
                        In Cart
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}