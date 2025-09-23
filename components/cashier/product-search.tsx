"use client"

import React, { useState } from "react"
import { Search, Scan, Package, Grid3x3, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SearchResultsSkeleton } from "@/components/ui/skeleton-loaders"
import { NoSearchResults, NoProductsFound } from "@/components/ui/empty-states"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useAuth } from "@/contexts/auth-context"
import { BarcodeScanner } from "./barcode-scanner"
import { ProductWithPacks } from "./product-with-packs"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import { apiClient } from "@/lib/api-unified"
import { getOutletId } from "@/lib/user-utils"
import { useInventory } from "@/hooks/use-inventory"
import type { CartItem } from "@/app/cashier/page"
import type { Product, InventoryItem } from "@/lib/api-unified"

// Extended product type with inventory information
type ProductWithStock = Product & {
  currentStock?: number
  stockQuantity?: number
  reorderLevel?: number
  minimumStock?: number
}

interface ProductSearchProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

export function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const { user } = useAuth()
  const outletId = getOutletId(user)
  const [searchTerm, setSearchTerm] = useState("")
  
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
    lastScanResult, 
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
      packInfo: {
        saleType: 'unit',
        unitQuantity: 1,
        effectiveUnitCount: 1,
      }
    }
    
    onAddToCart(cartItem)
    showSuccessToast(`Added ${product.name} to cart`)
  }

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const isLowStock = (stock: number, reorderLevel: number) => stock <= reorderLevel

  // Handle barcode scan results
  const handleBarcodeScanned = async (barcode: string) => {
    const result = await handleScan(barcode)
    
    if (result.success && result.product) {
      // Create CartItem for scanned product
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
        packInfo: {
          saleType: 'unit',
          unitQuantity: 1,
          effectiveUnitCount: 1,
        }
      }
      
      onAddToCart(cartItem)
      showSuccessToast(`Scanned: ${product.name}`)
      stopScanning()
    } else {
      showErrorToast(result.error || 'Product not found')
      // Keep scanner open for retry
    }
  }

  const handleStartScanning = () => {
    clearLastResult()
    startScanning()
  }

  // Helper function to get stock information
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
    return <SearchResultsSkeleton />
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Failed to load products: {String(error)}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products by name, category, or barcode..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={handleStartScanning}
          disabled={scannerLoading}
        >
          <Scan className="h-4 w-4 mr-2" />
          Scan Barcode
        </Button>
      </div>

      {/* Barcode Scanner */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onScan={handleBarcodeScanned}
          onClose={stopScanning}
        />
      )}

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        searchTerm ? (
          <NoSearchResults searchTerm={searchTerm} />
        ) : (
          <NoProductsFound />
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const stockInfo = getStockInfo(product)
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {product.category}
                        </p>
                        {product.manufacturer && (
                          <p className="text-xs text-gray-400 truncate">
                            {product.manufacturer}
                          </p>
                        )}
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
                        disabled={stockInfo.stock === 0}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    
                    {product.barcode && (
                      <p className="text-xs text-gray-400">
                        Barcode: {product.barcode}
                      </p>
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