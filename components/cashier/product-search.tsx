"use client"

import React, { useState } from "react"
import { Search, Scan, Package, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { CartItem } from "@/app/cashier/page"
import type { Product, InventoryItem } from "@/lib/api-unified"

// Extended product type with inventory information
type ProductWithStock = Product & {
  currentStock?: number
  stockQuantity?: number
  reorderLevel?: number
  minimumStock?: number
  inventory?: InventoryItem
}

interface ProductSearchProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

export function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
  
  // Memoize loadProducts to prevent recreating on every render
  const loadProductsMemoized = React.useCallback(async () => {
    if (!user?.outletId) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use inventory endpoint instead of products endpoint for better performance
      console.log('Loading products for outlet:', user.outletId)
      console.log('User object:', user)
      const response = await apiClient.inventory.getItems(user.outletId)
      
      console.log('Inventory API Response:', response)
      console.log('Response length:', response?.length)
      
      // Use only outlet-specific products - no fallback to all products
      const productsToProcess = response || []
      
      // Filter out any invalid products and add defaults
      const validProducts = productsToProcess.filter((product: any) => {
        if (!product || typeof product !== 'object') {
          console.warn('Invalid product:', product)
          return false
        }
        // Check for either id or _id field
        if ((!product.id && !product._id) || !product.name) {
          console.warn('Product missing required fields:', product)
          return false
        }
        return true
      }).map((product: any) => ({
        ...product,
        id: product.id || product._id, // Ensure consistent id field
        price: product.sellingPrice || product.price || 0,
        unit: product.unitOfMeasure || product.unit || 'unit',
        category: product.category || 'Unknown',
        currentStock: product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 0
      }))
      
      console.log('Valid products:', validProducts)
      setProducts(validProducts)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products. Please try again.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.outletId])

  // Memoize searchProducts to prevent recreating on every render
  const searchProductsMemoized = React.useCallback(async (term: string) => {
    if (!user?.outletId || term.length < 3) return
    
    try {
      setLoading(true)
      setError(null)
      
      // Use inventory endpoint and filter locally for better performance
      const response = await apiClient.inventory.getItems(user.outletId)
      
      console.log('Search API Response:', response)
      
      // Filter products locally by search term
      const filteredProducts = response.filter((product: any) => {
        const searchTerm = term.toLowerCase()
        return (
          product.name?.toLowerCase().includes(searchTerm) ||
          product.sku?.toLowerCase().includes(searchTerm) ||
          product.barcode?.toLowerCase().includes(searchTerm) ||
          product.genericName?.toLowerCase().includes(searchTerm) ||
          product.description?.toLowerCase().includes(searchTerm)
        )
      })
      
      // Filter out any invalid products and add defaults
      const validProducts = filteredProducts.filter((product: any) => {
        if (!product || typeof product !== 'object') {
          console.warn('Invalid search product:', product)
          return false
        }
        // Check for either id or _id field
        if ((!product.id && !product._id) || !product.name) {
          console.warn('Search product missing required fields:', product)
          return false
        }
        return true
      }).map((product: any) => ({
        ...product,
        id: product.id || product._id, // Ensure consistent id field
        price: product.sellingPrice || product.price || 0,
        unit: product.unitOfMeasure || product.unit || 'unit',
        category: product.category || 'Unknown',
        currentStock: product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 0
      }))
      
      console.log('Valid search products:', validProducts)
      setProducts(validProducts)
    } catch (err) {
      console.error('Failed to search products:', err)
      setError('Failed to search products. Please try again.')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [user?.outletId])

  // Load products on mount
  React.useEffect(() => {
    loadProductsMemoized()
  }, [loadProductsMemoized])

  // Handle search with debouncing
  React.useEffect(() => {
    if (searchTerm.length >= 3) {
      const timeoutId = setTimeout(() => {
        searchProductsMemoized(searchTerm)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else if (searchTerm.length === 0) {
      loadProductsMemoized()
    }
  }, [searchTerm, loadProductsMemoized, searchProductsMemoized])

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
    const stock = product.currentStock || product.stockQuantity || product.inventory?.currentStock || 0
    const reorderLevel = product.reorderLevel || product.minimumStock || product.minStockLevel || product.inventory?.minimumStock || 0
    return { stock, reorderLevel }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <div className="h-10 bg-muted animate-pulse rounded-md" />
            </div>
            <div className="h-10 w-10 bg-muted animate-pulse rounded-md" />
          </div>
          <SearchResultsSkeleton count={3} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Product Search</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive mb-4">Failed to load products</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Product Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, category, SKU, or manufacturer..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
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

        {/* Product Results */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {products && products.length > 0 ? (
            products.map((product: ProductWithStock) => {
              const { stock, reorderLevel } = getStockInfo(product)
              
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{product.name}</h4>
                      {isLowStock(stock, reorderLevel) && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Low Stock
                        </Badge>
                      )}
                      {stock === 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Price: Le {(product.price || 0).toLocaleString('en-SL')} per {product.unit || 'unit'}
                      </p>
                      <p>
                        Stock: {stock} {product.unit || 'unit'}
                      </p>
                      <p>
                        {product.barcode && `Barcode: ${product.barcode} | `}
                        {product.manufacturer && `Manufacturer: ${product.manufacturer}`}
                      </p>
                    </div>
                  </div>
                  <ProductWithPacks
                    product={product}
                    onAddToCart={onAddToCart}
                    stock={stock}
                    reorderLevel={reorderLevel}
                  />
                </div>
              )
            })
          ) : searchTerm.length > 2 ? (
            <NoSearchResults searchTerm={searchTerm} />
          ) : (
            <NoProductsFound />
          )}
        </div>
      </CardContent>
      
      {/* Barcode Scanner Modal */}
      {isScanning && (
        <BarcodeScanner
          isOpen={isScanning}
          onScan={handleBarcodeScanned}
          onClose={stopScanning}
        />
      )}
    </Card>
  )
}
