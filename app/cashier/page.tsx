"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { withAuth } from "@/contexts/auth-context"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { ProductSearch } from "@/components/cashier/product-search"
import { ShoppingCart } from "@/components/cashier/shopping-cart"
import { PaymentPanel } from "@/components/cashier/payment-panel"
import { QuickActions } from "@/components/cashier/quick-actions"
import { CustomerPanel } from "@/components/cashier/customer-panel"
import { DiscountPanel } from "@/components/cashier/discount-panel"
import { MobileCashierPage } from "@/components/cashier/mobile-pos-page"
import { CashierDashboard } from "@/components/cashier/cashier-dashboard"
import { PackVariant, SalePackInfo } from "@/lib/api-unified"
import { Button } from "@/components/ui/button"
import { Monitor, BarChart3 } from "lucide-react"

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
  packInfo?: SalePackInfo // Track if this is a pack sale
  packVariant?: PackVariant // The pack variant if applicable
}

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  loyaltyNumber?: string
  discountLevel?: number
  totalPurchases?: number
}

interface Discount {
  id: string
  type: 'percentage' | 'fixed' | 'loyalty' | 'coupon'
  value: number
  label: string
  code?: string
  minAmount?: number
  maxDiscount?: number
}

function CashierContent() {
  // ALL HOOKS MUST BE CALLED AT THE TOP LEVEL - NEVER CONDITIONALLY
  const { user } = useAuth()
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'dashboard' | 'pos'>('dashboard')
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([])

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024) // lg breakpoint
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Return mobile version for mobile devices
  if (isMobile) {
    return <MobileCashierPage />
  }

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
    setSelectedCustomer(null)
    setAppliedDiscounts([])
    setShowPayment(false)
  }

  const handleApplyDiscount = (discount: Discount) => {
    setAppliedDiscounts(prev => [...prev, discount])
  }

  const handleRemoveDiscount = (discountId: string) => {
    setAppliedDiscounts(prev => prev.filter(d => d.id !== discountId))
  }

  const calculateDiscountAmount = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return appliedDiscounts.reduce((total, discount) => {
      if (discount.type === 'percentage') {
        const percentageDiscount = (subtotal * discount.value) / 100
        return total + (discount.maxDiscount ? Math.min(percentageDiscount, discount.maxDiscount) : percentageDiscount)
      } else {
        return total + discount.value
      }
    }, 0)
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalItemDiscount = cartItems.reduce((sum, item) => sum + (item.discount || 0) * item.quantity, 0)
  const appliedDiscountAmount = calculateDiscountAmount()
  const totalDiscount = totalItemDiscount + appliedDiscountAmount
  const total = subtotal - totalDiscount

  return (
    <LayoutWrapper role="cashier">
      <Header 
        title="Cashier" 
        role="cashier" 
        userName={user ? `${user.firstName} ${user.lastName}` : "Cashier"} 
        outletName={user?.outlet?.name || "Pharmacy"} 
      />

      {/* View Toggle Buttons */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2 bg-muted rounded-lg p-1">
            <Button
              variant={currentView === 'dashboard' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </Button>
            <Button
              variant={currentView === 'pos' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('pos')}
              className="flex items-center space-x-2"
            >
              <Monitor className="h-4 w-4" />
              <span>POS</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {currentView === 'dashboard' ? (
        <CashierDashboard />
      ) : (
        <>
          {/* Mobile Layout - Single column with tabs */}
          <div className="block lg:hidden h-[calc(100vh-160px)]">
        <div className="p-2 space-y-2">
          <ProductSearch onAddToCart={addToCart} />
          <div className="grid grid-cols-1 gap-2">
            <CustomerPanel 
              selectedCustomer={selectedCustomer}
              onCustomerSelect={setSelectedCustomer}
            />
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
                customer={selectedCustomer}
                discounts={appliedDiscounts}
                onBack={() => setShowPayment(false)}
                onPaymentComplete={clearCart}
              />
            )}
          </div>
        </div>
      </div>

          {/* Desktop Layout - Three column layout */}
          <div className="hidden lg:flex h-[calc(100vh-160px)]">
        {/* Left Panel - Product Search & Quick Actions */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <ProductSearch onAddToCart={addToCart} />
          <QuickActions onAddToCart={addToCart} />
        </div>

        {/* Center Panel - Customer & Discounts */}
        <div className="w-80 border-l border-r border-border p-4 space-y-4 overflow-y-auto">
          <CustomerPanel 
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
          <DiscountPanel
            appliedDiscounts={appliedDiscounts}
            subtotal={subtotal}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            customerDiscountLevel={selectedCustomer?.discountLevel}
          />
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
              customer={selectedCustomer}
              discounts={appliedDiscounts}
              onBack={() => setShowPayment(false)}
              onPaymentComplete={clearCart}
            />
          )}
        </div>
      </div>
        </>
      )}
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(CashierContent, "cashier")
