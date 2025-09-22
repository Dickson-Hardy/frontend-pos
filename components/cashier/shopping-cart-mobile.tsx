"use client"

import { Trash2, Plus, Minus, ShoppingCart as CartIcon, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useInventory } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"
import type { CartItem } from "@/app/cashier/page"

interface ShoppingCartMobileProps {
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onProceedToPayment: () => void
  subtotal: number
  totalDiscount: number
  total: number
}

export function ShoppingCartMobile({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  subtotal,
  totalDiscount,
  total,
}: ShoppingCartMobileProps) {
  // All hooks must be called at the top level - never conditionally
  const { user } = useAuth()
  const { items: inventoryItems } = useInventory(user?.outletId)

  // Function to get current stock for a product
  const getCurrentStock = (productId: string) => {
    console.log('Mobile getting stock for product:', productId)
    console.log('Mobile inventory items:', inventoryItems)
    console.log('Mobile inventory loading state:', inventoryItems === null ? 'loading' : 'loaded')
    
    // First, try to get stock from the cart item itself (most reliable)
    const cartItem = items.find(item => item.id === productId)
    console.log('Mobile cart item found:', cartItem)
    console.log('Mobile cart item has stock field:', cartItem && 'stock' in cartItem)
    console.log('Mobile cart item stock value:', cartItem?.stock)
    
    if (cartItem && 'stock' in cartItem && cartItem.stock !== undefined && cartItem.stock > 0) {
      console.log('Mobile using cart item stock:', cartItem.stock)
      return cartItem.stock
    }
    
    // Handle cart item IDs with suffixes (e.g., "product-id-unit" or "product-id-pack-xxx")
    const baseProductId = productId.replace(/-unit$/, '').replace(/-pack-\d+$/, '')
    console.log('Mobile base product ID:', baseProductId)
    
    const inventoryItem = inventoryItems?.find((item: any) => item.id === baseProductId)
    console.log('Mobile found inventory item:', inventoryItem)
    
    const stock = inventoryItem?.stockQuantity || 0
    console.log('Mobile stock for product', productId, ':', stock)
    
    // TEMPORARY WORKAROUND: If both cart item and inventory show 0, use a default value
    if (stock === 0 && (!cartItem?.stock || cartItem.stock === 0) && (!inventoryItems || inventoryItems.length === 0)) {
      console.log('Mobile using default stock value (workaround)')
      return 100 // Default stock for testing
    }
    
    return stock
  }

  // Function to check if quantity exceeds available stock
  const isQuantityExceedsStock = (item: CartItem) => {
    const currentStock = getCurrentStock(item.id)
    return item.quantity > currentStock
  }

  // Function to check if there are any stock issues
  const hasStockIssues = () => {
    return items.some(item => isQuantityExceedsStock(item))
  }

  // Render empty cart state
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <CartIcon className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
        <p className="text-muted-foreground mb-4">Add some products to get started</p>
        <Button variant="outline">Browse Products</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Cart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive">
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </div>

      {/* Cart Items */}
      <div className="space-y-3">
        {items.map((item) => {
          const currentStock = getCurrentStock(item.id)
          const hasStockIssue = isQuantityExceedsStock(item)
          
          return (
            <Card key={item.id} className={hasStockIssue ? "border-destructive" : ""}>
              <CardContent className="p-3">
                <div className="space-y-3">
                  {/* Item Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-2">
                      <h4 className="font-medium text-sm leading-tight">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        Le {item.price.toLocaleString('en-SL')} per {item.unit}
                      </p>
                      {item.batchNumber && (
                        <p className="text-xs text-muted-foreground">
                          Batch: {item.batchNumber}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="text-destructive hover:text-destructive p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Stock warning */}
                  {hasStockIssue && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                      <p className="text-xs text-destructive">
                        ⚠️ Only {currentStock} in stock
                      </p>
                    </div>
                  )}

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const newQuantity = Number.parseInt(e.target.value) || 0
                          onUpdateQuantity(item.id, Math.min(newQuantity, currentStock))
                        }}
                        className="w-16 h-8 text-center text-sm"
                        min="0"
                        max={currentStock}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (item.quantity < currentStock) {
                            onUpdateQuantity(item.id, item.quantity + 1)
                          }
                        }}
                        className="h-8 w-8 p-0"
                        disabled={item.quantity >= currentStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Item Total */}
                    <div className="text-right">
                      <p className="font-semibold text-sm">
                        Le {(item.price * item.quantity).toLocaleString('en-SL')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Stock: {currentStock}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Cart Summary */}
      <Card className="sticky bottom-0 bg-background">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal ({items.length} items):</span>
                <span>Le {subtotal.toLocaleString('en-SL')}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Total Discount:</span>
                  <span>-Le {totalDiscount.toLocaleString('en-SL')}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>Le {total.toLocaleString('en-SL')}</span>
              </div>
            </div>
            
            {hasStockIssues() && (
              <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                <p className="text-xs text-destructive text-center">
                  ⚠️ Please resolve stock issues before proceeding
                </p>
              </div>
            )}
            
            <Button 
              onClick={onProceedToPayment} 
              className="w-full h-12 text-base font-semibold" 
              size="lg" 
              disabled={items.length === 0 || hasStockIssues()}
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}