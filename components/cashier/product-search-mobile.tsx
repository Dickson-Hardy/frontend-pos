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
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid')
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Barcode scanner functionality
  const { 
    isScanning, 
    isLoading: scannerLoading, 
    startScanning, 
    stopScanning, 
    handleScan,
    clearLastResult 
  } = useBarcodeScanner()

  // Load products using inventory API - same as desktop component
  const loadProducts = React.useCallback(async () => {
    if (!user?.outletId) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Mobile loading products for outlet:', user.outletId)
      const productsData = await apiClient.inventory.getItems(user.outletId)
      
      console.log('Mobile Inventory API Response:', productsData)
      
      // Use only outlet-specific products - no fallback to all products
      const finalProducts = productsData || []
      
      // Filter out any invalid products and add defaults
      const validProducts = (finalProducts || []).filter((product: any) => {
        if (!product || typeof product !== 'object') {
          console.warn('Invalid mobile product:', product)
          return false
        }
        if (!product.id || !product.name) {
          console.warn('Mobile product missing required fields:', product)
          return false
        }
        return true
      }).map((product: any) => ({
        ...product,
        id: product.id,
        price: product.sellingPrice || product.price || 0,
        unit: product.unitOfMeasure || product.unit || 'unit',
        category: product.category || 'Unknown',
        currentStock: product.stockQuantity || 0,
        stockQuantity: product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 0,
        minimumStock: product.reorderLevel || 0
      }))
      
      console.log('Valid mobile products:', validProducts)
      console.log('Mobile products with stock details:', validProducts.map(p => ({
        id: p.id,
        name: p.name,
        stockQuantity: p.stockQuantity,
        currentStock: p.currentStock,
        price: p.price
      })))
      setProducts(validProducts)
    } catch (err) {
      console.error('Failed to load mobile products:', err)
      setError('Failed to load products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.outletId])

  // Search products using inventory API with local filtering
  const searchProducts = React.useCallback(async (term: string) => {
    if (!user?.outletId || term.length < 3) return
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Mobile searching products for outlet:', user.outletId, 'term:', term)
      const productsData = await apiClient.inventory.getItems(user.outletId)
      
      console.log('Mobile Search Inventory API Response:', productsData)
      
      // If no products found for specific outlet, try loading all products
      let finalProducts = productsData
      if (!productsData || productsData.length === 0) {
        console.log('No products found for outlet, trying all products...')
        finalProducts = await apiClient.inventory.getItems()
      }
      
      // Filter products locally based on search term
      const filteredProducts = (finalProducts || []).filter((product: any) => {
        const searchFields = [
          product.name,
          product.sku,
          product.barcode,
          product.genericName,
          product.description,
          product.category
        ].filter(Boolean).join(' ').toLowerCase()
        
        return searchFields.includes(term.toLowerCase())
      })
      
      // Filter out any invalid products and add defaults
      const validProducts = filteredProducts.filter((product: any) => {
        if (!product || typeof product !== 'object') {
          console.warn('Invalid mobile search product:', product)
          return false
        }
        if (!product.id || !product.name) {
          console.warn('Mobile search product missing required fields:', product)
          return false
        }
        return true
      }).map((product: any) => ({
        ...product,
        id: product.id,
        price: product.sellingPrice || product.price || 0,
        unit: product.unitOfMeasure || product.unit || 'unit',
        category: product.category || 'Unknown',
        currentStock: product.stockQuantity || 0,
        stockQuantity: product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 0,
        minimumStock: product.reorderLevel || 0
      }))
      
      console.log('Valid mobile search products:', validProducts)
      setProducts(validProducts)
    } catch (err) {
      console.error('Failed to search mobile products:', err)
      setError('Failed to search products')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.outletId])

  // Load products on mount
  React.useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Handle search with debouncing
  React.useEffect(() => {
    if (searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchProducts(searchTerm)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else if (searchTerm.length === 0) {
      loadProducts()
    }
  }, [searchTerm, searchProducts, loadProducts])

  const handleAddToCart = (product: any) => {
    try {
      const stockValue = product.currentStock || product.stockQuantity || 0
      console.log('Mobile adding product to cart:', {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: stockValue,
        currentStock: product.currentStock,
        stockQuantity: product.stockQuantity,
        allFields: product
      })
      
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        stock: stockValue,
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

  // Calculate displayProducts - limit to 20 on mobile
  const displayProducts = products?.slice(0, 20) || []

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
            displayProducts.map((product: ProductWithStock) => {
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
            displayProducts.map((product: ProductWithStock) => {
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