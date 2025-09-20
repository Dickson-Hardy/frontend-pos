"use client"

import React, { useState } from "react"
import { Plus, Search, Filter, Edit, Trash2, MoreHorizontal, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { TableSkeleton } from "@/components/ui/skeleton-loaders"
import { NoProductsFound, EmptyTable } from "@/components/ui/empty-states"
import { showSuccessToast, showErrorToast } from "@/lib/toast-utils"
import { useProducts } from "@/hooks/use-products"
import { useInventory } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"

export function ProductCatalog() {
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()
  
  // Fetch products and inventory data
  const { 
    products, 
    loading: productsLoading, 
    error: productsError,
    handleSearch: setProductSearch,
    clearFilters: clearProductFilters
  } = useProducts(user?.outletId)
  
  const { 
    items: inventoryItems, 
    loading: inventoryLoading, 
    error: inventoryError 
  } = useInventory(user?.outletId)

  const loading = productsLoading || inventoryLoading
  const error = productsError || inventoryError

  // Create a map of inventory data by product ID for quick lookup
  const inventoryMap = new Map(
    inventoryItems?.map(item => [item.productId, item]) || []
  )

  // Combine product data with inventory data
  const enrichedProducts = products?.map(product => {
    const inventory = inventoryMap.get(product.id)
    return {
      ...product,
      currentStock: inventory?.currentStock || 0,
      minStock: inventory?.minimumStock || 0,
      maxStock: inventory?.maximumStock || 0,
      reorderPoint: inventory?.reorderPoint || 0,
      lastUpdated: inventory?.lastUpdated || product.updatedAt,
    }
  }) || []

  // Filter products based on search term
  const filteredProducts = enrichedProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  // Update search when searchTerm changes
  React.useEffect(() => {
    setProductSearch(searchTerm)
  }, [searchTerm, setProductSearch])

  const getStatusBadge = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>
    }
    if (currentStock < minStock) {
      return <Badge variant="secondary">Low Stock</Badge>
    }
    return <Badge variant="default">In Stock</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical inventory and product information</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-6 w-32 bg-muted animate-pulse rounded" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-10 w-24 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 flex-1 bg-muted animate-pulse rounded" />
              <div className="h-10 w-20 bg-muted animate-pulse rounded" />
            </div>
            <TableSkeleton rows={8} columns={8} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical inventory and product information</p>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-4">Failed to load product catalog</p>
              <Button 
                onClick={() => {
                  clearProductFilters()
                  window.location.reload()
                }}
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Product Catalog</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical inventory and product information</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Inventory</CardTitle>
          <CardDescription>Complete catalog of pharmaceutical products and medical supplies</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, category, or manufacturer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.manufacturer}</p>
                      </div>
                    </TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{product.currentStock}</span>
                        <span className="text-sm text-muted-foreground">
                          / {product.maxStock} {product.unit}
                        </span>
                        {product.currentStock < product.minStock && <AlertTriangle className="h-4 w-4 text-secondary" />}
                      </div>
                    </TableCell>
                    <TableCell>Le {product.cost.toLocaleString('en-SL')}</TableCell>
                    <TableCell>Le {product.price.toLocaleString('en-SL')}</TableCell>
                    <TableCell>{getStatusBadge(product.currentStock, product.minStock)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(product.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <EmptyTable 
                  columns={8} 
                  message={searchTerm ? `No products found for "${searchTerm}"` : "No products available"} 
                />
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductCatalog
