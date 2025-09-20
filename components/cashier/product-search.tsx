"use client"

import { useState } from "react"
import { Search, Scan, Package, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SearchResultsSkeleton } from "@/components/ui/skeleton-loaders"
import { NoSearchResults, NoProductsFound } from "@/components/ui/empty-states"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useProducts, useProductSearch } from "@/hooks/use-products"
import { useAuth } from "@/contexts/auth-context"
import { BarcodeScanner } from "./barcode-scanner"
import { useBarcodeScanner } from "@/hooks/use-barcode-scanner"
import type { CartItem } from "@/app/cashier/page"

interface ProductSearchProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

export function ProductSearch({ onAddToCart }: ProductSearchProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  
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
  
  // Use the products hook for initial load and search hook for search results
  const { products: allProducts, loading: allProductsLoading, error: allProductsError } = useProducts(user?.outletId)
  const { data: searchResults, loading: searchLoading, error: searchError } = useProductSearch(
    searchTerm.length > 2 ? searchTerm : "", 
    user?.outletId
  )

  // Determine which products to show
  const displayProducts = searchTerm.length > 2 ? searchResults : allProducts
  const loading = searchTerm.length > 2 ? searchLoading : allProductsLoading
  const error = searchTerm.length > 2 ? searchError : allProductsError

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const isLowStock = (stock: number, reorderLevel: number) => stock <= reorderLevel

  const handleAddToCart = (product: any) => {
    try {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        stock: product.currentStock || product.stockQuantity || 0,
        batchNumber: product.sku || product.barcode,
        expiryDate: "2025-12-31", // This should come from batch data
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
      // Automatically add scanned product to cart
      handleAddToCart(result.product)
      showSuccessToast(`Scanned: ${result.product.name}`)
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
          {displayProducts && displayProducts.length > 0 ? (
            displayProducts.map((product) => {
              const stock = product.currentStock || product.stockQuantity || 0
              const reorderLevel = product.reorderLevel || product.minimumStock || 0
              
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
                        Price: Le {product.price.toLocaleString('en-SL')} per {product.unit}
                      </p>
                      <p>
                        Stock: {stock} {product.unit}
                      </p>
                      <p>
                        {product.barcode && `Barcode: ${product.barcode} | `}
                        {product.manufacturer && `Manufacturer: ${product.manufacturer}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAddToCart(product)} 
                    disabled={stock === 0} 
                    className="ml-4"
                  >
                    Add to Cart
                  </Button>
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
