"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { withAuth } from "@/contexts/auth-context"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { ProductSearch } from "@/components/cashier/product-search"
import { ShoppingCart } from "@/components/cashier/shopping-cart"
import { PaymentPanel } from "@/components/cashier/payment-panel"
import { QuickActions } from "@/components/cashier/quick-actions"

export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  unit: string
  stock?: number
  category?: string
  batchNumber?: string
  expiryDate?: string
  discount?: number
}

function CashierContent() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)

  const addToCart = (product: Omit<CartItem, "quantity">) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id)
      if (existingItem) {
        return prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id))
    } else {
      setCartItems((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const clearCart = () => {
    setCartItems([])
    setShowPayment(false)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0) * item.quantity, 0)
  const total = subtotal - totalDiscount

  return (
    <LayoutWrapper role="cashier">
      <Header 
        title="Cashier POS" 
        role="cashier" 
        userName={user ? `${user.firstName} ${user.lastName}` : "Cashier"} 
        outletName={user?.outlet?.name || "Pharmacy"} 
      />

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Panel - Product Search & Quick Actions */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <ProductSearch onAddToCart={addToCart} />
          <QuickActions onAddToCart={addToCart} />
        </div>

        {/* Right Panel - Cart & Payment */}
        <div className="w-96 border-l border-border bg-card">
          {!showPayment ? (
            <ShoppingCart
              items={cartItems}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeFromCart}
              onClearCart={clearCart}
              onProceedToPayment={() => setShowPayment(true)}
              subtotal={subtotal}
              totalDiscount={totalDiscount}
              total={total}
            />
          ) : (
            <PaymentPanel
              items={cartItems}
              total={total}
              onBack={() => setShowPayment(false)}
              onPaymentComplete={clearCart}
            />
          )}
        </div>
      </div>
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(CashierContent, "cashier")
