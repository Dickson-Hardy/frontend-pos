"use client"

import { Trash2, Plus, Minus, CarIcon as CartIcon, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useInventory } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"
import type { CartItem } from "@/app/cashier/page"

interface ShoppingCartProps {
  items: CartItem[]
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onClearCart: () => void
  onProceedToPayment: () => void
  subtotal: number
  totalDiscount: number
  total: number
}

export function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  subtotal,
  totalDiscount,
  total,
}: ShoppingCartProps) {
  const { user } = useAuth()
  const { data: inventoryItems } = useInventory(user?.outletId)

  // Function to get current stock for a product
  const getCurrentStock = (productId: string) => {
    const inventoryItem = inventoryItems?.find(item => item.productId === productId)
    return inventoryItem?.currentStock || 0
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
  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CartIcon className="h-5 w-5" />
            <span>Shopping Cart</span>
          </div>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearCart} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Cart Items */}
        <div className="flex-1 space-y-3 overflow-y-auto mb-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CartIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Your cart is empty</p>
              <p className="text-sm">Add products to get started</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="border border-border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Le {item.price.toLocaleString('en-SL')} per {item.unit}
                    </p>
                    {item.batchNumber && <p className="text-xs text-muted-foreground">Batch: {item.batchNumber}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-destructive hover:text-destructive p-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Stock validation warning */}
                {isQuantityExceedsStock(item) && (
                  <div className="mb-2">
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Insufficient stock (Available: {getCurrentStock(item.id)})
                    </Badge>
                  </div>
                )}

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
                        const maxStock = getCurrentStock(item.id)
                        onUpdateQuantity(item.id, Math.min(newQuantity, maxStock))
                      }}
                      className={`w-16 h-8 text-center ${isQuantityExceedsStock(item) ? 'border-destructive' : ''}`}
                      min="0"
                      max={getCurrentStock(item.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const maxStock = getCurrentStock(item.id)
                        if (item.quantity < maxStock) {
                          onUpdateQuantity(item.id, item.quantity + 1)
                        }
                      }}
                      className="h-8 w-8 p-0"
                      disabled={item.quantity >= getCurrentStock(item.id)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">Le {(item.price * item.quantity).toLocaleString('en-SL')}</p>
                    <p className="text-xs text-muted-foreground">Stock: {getCurrentStock(item.id)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {items.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Le {subtotal.toLocaleString('en-SL')}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-sm text-secondary">
                  <span>Discount:</span>
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
              <div className="mb-2">
                <Badge variant="destructive" className="w-full justify-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Please resolve stock issues before proceeding
                </Badge>
              </div>
            )}
            <Button 
              onClick={onProceedToPayment} 
              className="w-full" 
              size="lg" 
              disabled={items.length === 0 || hasStockIssues()}
            >
              Proceed to Payment
            </Button>
          </div>
        )}
      </CardContent>
    </div>
  )
}
