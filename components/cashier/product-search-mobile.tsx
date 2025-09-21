"use client"

import { useState } from "react"
import { Search, Scan, Package, Grid3x3, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useProducts, useProductSearch } from "@/hooks/use-products"
import { useAuth } from "@/contexts/auth-context"
import { BarcodeScanner } from "./barcode-scanner"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  
  // Barcode scanner functionality
  const { 
    isScanning, 
    isLoading: scannerLoading, 
    startScanning, 
    stopScanning, 
    handleScan,
    clearLastResult 
  } = useBarcodeScanner()
  
  // Use the products hook for initial load and search hook for search results
  const { data: allProducts, loading: allProductsLoading } = useProducts(user?.outletId)
  const { data: searchResults, loading: searchLoading } = useProductSearch(
    searchTerm.length > 2 ? searchTerm : "", 
    user?.outletId
  )

  // Calculate derived values
  const displayProducts = searchTerm.length > 2 ? searchResults : allProducts?.slice(0, 20) // Limit to 20 on mobile
  const loading = searchTerm.length > 2 ? searchLoading : allProductsLoading

  const handleAddToCart = (product: any) => {
    try {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        stock: product.currentStock || product.stockQuantity || 0,
        batchNumber: product.sku || product.barcode,
        expiryDate: "2025-12-31",
        category: product.category,
      })
      showSuccessToast(`${product.name} added to cart`)
    } catch (error) {
      showErrorToast("Failed to add product to cart")
    }
  }

  // Handle barcode scan results
  const handleBarcodeScanned = async (barcode: string) => {
    const result = await handleScan(barcode)
    
    if (result.success && result.product) {
      handleAddToCart(result.product)
      showSuccessToast(`Scanned: ${result.product.name}`)
      stopScanning()
    } else {
      showErrorToast(result.error || 'Product not found')
    }
  }

  const handleStartScanning = () => {
    clearLastResult()
    startScanning()
  }

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-10 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
          <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
        </div>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner text="Loading products..." />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mobile Search Header */}
      <div className="flex space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleStartScanning}
          disabled={scannerLoading}
          className="h-12 w-12"
        >
          <Scan className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          className="h-12 w-12"
        >
          <Grid3x3 className="h-5 w-5" />
        </Button>
      </div>

      {/* Products Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3">
          {displayProducts && displayProducts.length > 0 ? (
            displayProducts.map((product: any) => {
              const stock = product.currentStock || product.stockQuantity || 0
              const isOutOfStock = stock === 0
              const isLowStock = stock > 0 && stock <= (product.reorderLevel || 10)
              
              return (
                <Card key={product.id} className="relative">
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {product.category}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            Le {product.price.toLocaleString('en-SL')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stock: {stock}
                          </p>
                        </div>
                        
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Status badges */}
                      <div className="flex flex-wrap gap-1">
                        {isOutOfStock && (
                          <Badge variant="destructive" className="text-xs">
                            Out
                          </Badge>
                        )}
                        {isLowStock && (
                          <Badge variant="secondary" className="text-xs">
                            Low
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="col-span-2 text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{searchTerm ? "No products found" : "No products available"}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayProducts && displayProducts.length > 0 ? (
            displayProducts.map((product: any) => {
              const stock = product.currentStock || product.stockQuantity || 0
              const isOutOfStock = stock === 0
              const isLowStock = stock > 0 && stock <= (product.reorderLevel || 10)
              
              return (
                <Card key={product.id}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-3">
                        <h4 className="font-medium text-sm">{product.name}</h4>
                        <p className="text-xs text-muted-foreground mb-1">
                          {product.category} • Stock: {stock}
                        </p>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-sm">
                            Le {product.price.toLocaleString('en-SL')}
                          </p>
                          {isOutOfStock && (
                            <Badge variant="destructive" className="text-xs">
                              Out
                            </Badge>
                          )}
                          {isLowStock && (
                            <Badge variant="secondary" className="text-xs">
                              Low
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{searchTerm ? "No products found" : "No products available"}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Barcode Scanner Modal */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onScan={handleBarcodeScanned}
          onClose={stopScanning}
        />
      )}
    </div>
  )
}