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
import { CustomerPanel } from "@/components/cashier/customer-panel"
import { DiscountPanel } from "@/components/cashier/discount-panel"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  ShoppingCart as CartIcon, 
  Search, 
  User, 
  Percent, 
  ArrowLeft,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

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

type MobileView = 'products' | 'cart' | 'customer' | 'discounts' | 'payment'

function CashierContent() {
  const { user } = useAuth()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [appliedDiscounts, setAppliedDiscounts] = useState<Discount[]>([])
  const [currentMobileView, setCurrentMobileView] = useState<MobileView>('products')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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
    setCurrentMobileView('products')
  }

  const handleApplyDiscount = (discount: Discount) => {
    setAppliedDiscounts(prev => [...prev, discount])
  }

  const handleRemoveDiscount = (discountId: string) => {
    setAppliedDiscounts(prev => prev.filter(d => d.id !== discountId))
  }

  const handleProceedToPayment = () => {
    setShowPayment(true)
    setCurrentMobileView('payment')
  }

  const handleBackFromPayment = () => {
    setShowPayment(false)
    setCurrentMobileView('cart')
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

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Mobile Navigation
  const mobileNavItems = [
    { id: 'products', label: 'Products', icon: Search },
    { id: 'cart', label: 'Cart', icon: CartIcon, badge: cartItemCount },
    { id: 'customer', label: 'Customer', icon: User },
    { id: 'discounts', label: 'Discounts', icon: Percent, badge: appliedDiscounts.length },
  ]

  const renderMobileContent = () => {
    if (showPayment) {
      return (
        <PaymentPanel
          items={cartItems}
          total={total}
          customer={selectedCustomer}
          discounts={appliedDiscounts}
          onBack={handleBackFromPayment}
          onPaymentComplete={clearCart}
        />
      )
    }

    switch (currentMobileView) {
      case 'products':
        return (
          <div className="space-y-4">
            <ProductSearch onAddToCart={addToCart} />
            <QuickActions onAddToCart={addToCart} />
          </div>
        )
      case 'cart':
        return (
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onProceedToPayment={handleProceedToPayment}
            subtotal={subtotal}
            totalDiscount={totalDiscount}
            total={total}
          />
        )
      case 'customer':
        return (
          <CustomerPanel 
            selectedCustomer={selectedCustomer}
            onCustomerSelect={setSelectedCustomer}
          />
        )
      case 'discounts':
        return (
          <DiscountPanel
            appliedDiscounts={appliedDiscounts}
            subtotal={subtotal}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            customerDiscountLevel={selectedCustomer?.discountLevel}
          />
        )
      default:
        return null
    }
  }

  return (
    <LayoutWrapper role="cashier">
      {/* Desktop Layout */}
      <div className="hidden lg:block">
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
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-screen">
        {/* Mobile Header */}
        <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <div>
              <h1 className="font-semibold">POS System</h1>
              <p className="text-xs opacity-90">{user?.outlet?.name || "Pharmacy"}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {cartItemCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMobileView('cart')}
                className="text-primary-foreground hover:bg-primary-foreground/20 relative"
              >
                <CartIcon className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              </Button>
            )}
            {total > 0 && (
              <div className="text-right">
                <p className="text-xs opacity-90">Total</p>
                <p className="font-semibold">Le {total.toLocaleString('en-SL')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute inset-0 bg-black/50 z-50" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-background w-64 h-full p-4" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Menu</h2>
                  <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cashier: {user?.firstName} {user?.lastName}</p>
                  <p className="text-sm text-muted-foreground">Outlet: {user?.outlet?.name}</p>
                </div>
                <hr className="my-4" />
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    setCurrentMobileView('products')
                    setIsMobileMenuOpen(false)
                  }}
                >
                  <Search className="mr-2 h-4 w-4" />
                  New Sale
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    clearCart()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderMobileContent()}
        </div>

        {/* Mobile Bottom Navigation */}
        {!showPayment && (
          <div className="bg-background border-t border-border p-2">
            <div className="flex justify-around">
              {mobileNavItems.map((item) => {
                const Icon = item.icon
                const isActive = currentMobileView === item.id
                return (
                  <Button
                    key={item.id}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentMobileView(item.id as MobileView)}
                    className={cn(
                      "flex-1 flex flex-col items-center space-y-1 h-auto py-2 relative",
                      isActive && "bg-primary text-primary-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Mobile Quick Cart Summary */}
        {!showPayment && cartItems.length > 0 && currentMobileView !== 'cart' && (
          <div className="bg-primary text-primary-foreground p-3 m-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">{cartItemCount} items</p>
                <p className="font-semibold">Le {total.toLocaleString('en-SL')}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentMobileView('cart')}
              >
                View Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(CashierContent, "cashier")
