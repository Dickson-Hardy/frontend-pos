"use client"

import { useState } from "react"
import { Package, Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Product, PackVariant } from "@/lib/api-unified"
import { dataTransforms } from "@/lib/data-utils"
import type { CartItem } from "@/app/cashier/page"

interface ProductWithPacksProps {
  product: Product
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
  stock: number
  reorderLevel: number
}

export function ProductWithPacks({ product, onAddToCart, stock, reorderLevel }: ProductWithPacksProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const isLowStock = stock <= reorderLevel
  const isOutOfStock = stock === 0
  
  const packVariants = product.packVariants || []
  const hasPackVariants = packVariants.length > 0
  const allowUnitSale = product.allowUnitSale !== false // Default to true if undefined

  // Calculate available packs for each variant
  const getAvailablePacks = (packVariant: PackVariant) => {
    return dataTransforms.getAvailablePacks(stock, packVariant.packSize)
  }

  // Add unit sale to cart
  const handleAddUnit = () => {
    onAddToCart({
      id: `${product.id}-unit`,
      name: product.name,
      price: product.price,
      unit: product.unit || 'unit',
      stock,
      category: product.category,
      batchNumber: (product as any).sku || product.barcode,
      expiryDate: "2025-12-31",
      packInfo: {
        saleType: 'unit',
        unitQuantity: 1,
        effectiveUnitCount: 1,
      }
    })
    setIsDialogOpen(false)
  }

  // Add pack sale to cart
  const handleAddPack = (packVariant: PackVariant) => {
    const availablePacks = getAvailablePacks(packVariant)
    if (availablePacks <= 0) return

    onAddToCart({
      id: `${product.id}-pack-${packVariant.id || packVariant.packSize}`,
      name: `${product.name} (${packVariant.name || `${packVariant.packSize}-pack`})`,
      price: packVariant.packPrice,
      unit: packVariant.name || `${packVariant.packSize}-pack`,
      stock: availablePacks,
      category: product.category,
      batchNumber: (product as any).sku || product.barcode,
      expiryDate: "2025-12-31",
      packInfo: {
        saleType: 'pack',
        packVariantId: packVariant.id,
        packQuantity: 1,
        effectiveUnitCount: packVariant.packSize,
      },
      packVariant,
    })
    setIsDialogOpen(false)
  }

  // If no pack variants, show simple add button
  if (!hasPackVariants || (!allowUnitSale && packVariants.length === 0)) {
    return (
      <Button 
        onClick={handleAddUnit} 
        disabled={isOutOfStock} 
        className="ml-4"
      >
        Add to Cart
      </Button>
    )
  }

  // If only one pack variant and no unit sales, add directly
  if (packVariants.length === 1 && !allowUnitSale) {
    const packVariant = packVariants[0]
    const availablePacks = getAvailablePacks(packVariant)
    
    return (
      <Button 
        onClick={() => handleAddPack(packVariant)} 
        disabled={availablePacks <= 0} 
        className="ml-4"
      >
        Add {packVariant.name || `${packVariant.packSize}-pack`}
      </Button>
    )
  }

  // Multiple options available - show dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="ml-4" disabled={isOutOfStock}>
          <Package className="h-4 w-4 mr-2" />
          Add to Cart
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Select Pack Size - {product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {/* Individual unit option */}
          {allowUnitSale && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Individual Unit</h4>
                    <p className="text-sm text-muted-foreground">
                      Le {product.price.toLocaleString('en-SL')} per {product.unit || 'unit'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stock} units available
                    </p>
                  </div>
                  <Button 
                    onClick={handleAddUnit}
                    disabled={isOutOfStock}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Unit
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Pack variant options */}
          {packVariants.map((packVariant, index) => {
            const availablePacks = getAvailablePacks(packVariant)
            const isPackOutOfStock = availablePacks <= 0
            const unitPrice = packVariant.unitPrice || (packVariant.packPrice / packVariant.packSize)
            const savings = product.price > unitPrice ? ((product.price - unitPrice) / product.price * 100).toFixed(1) : null
            
            return (
              <Card key={packVariant.id || index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">
                          {packVariant.name || `${packVariant.packSize}-pack`}
                        </h4>
                        {savings && (
                          <Badge variant="secondary" className="text-xs">
                            Save {savings}%
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Le {packVariant.packPrice.toLocaleString('en-SL')} 
                        <span className="text-xs ml-1">
                          (Le {unitPrice.toLocaleString('en-SL')} per unit)
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {packVariant.packSize} units per pack • {availablePacks} packs available
                      </p>
                    </div>
                    <Button 
                      onClick={() => handleAddPack(packVariant)}
                      disabled={isPackOutOfStock}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Pack
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          
          {packVariants.length === 0 && !allowUnitSale && (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No pack options available for this product</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}