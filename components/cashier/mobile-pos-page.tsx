"use client"

import { useState } from "react"
import { 
  ShoppingCart, 
  Users, 
  Search, 
  Menu, 
  Home,
  Settings,
  User,
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ProductSearchMobile } from "@/components/cashier/product-search-mobile"
import { ShoppingCartMobile } from "@/components/cashier/shopping-cart-mobile"
import { CustomerManagementMobile } from "@/components/cashier/customer-management-mobile"
import { PaymentProcessingMobile } from "@/components/cashier/payment-processing-mobile"
import { ReceiptMobile } from "@/components/cashier/receipt-mobile"
import type { CartItem } from "@/app/cashier/page"

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

type ViewState = "pos" | "payment" | "receipt"
type TabState = "products" | "cart" | "customer"

export function MobileCashierPage() {
  // All hooks must be called at the top level - never conditionally
  const [viewState, setViewState] = useState<ViewState>("pos")
  const [activeTab, setActiveTab] = useState<TabState>("products")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [paymentData, setPaymentData] = useState<any>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const addToCart = (product: any) => {
    const existingItem = cartItems.find(item => item.id === product.id)
    
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        unit: product.unit,
        batchNumber: product.batchNumber,
      }])
    }
    
    // Auto-switch to cart tab when item is added
    if (activeTab === "products") {
      setActiveTab("cart")
    }
  }

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id))
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id ? { ...item, quantity } : item
      ))
    }
  }

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const clearCart = () => {
    setCartItems([])
  }

  const handleProceedToPayment = () => {
    setViewState("payment")
  }

  const handlePaymentComplete = (payment: any) => {
    setPaymentData(payment)
    setViewState("receipt")
  }

  const handleNewSale = () => {
    setCartItems([])
    setSelectedCustomer(null)
    setPaymentData(null)
    setViewState("pos")
    setActiveTab("products")
  }

  const handleBackToHome = () => {
    // Navigate back to main dashboard
    window.location.href = "/dashboard"
  }

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalDiscount = 0 // Calculate discounts here
  const total = subtotal - totalDiscount
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  // Render different views based on state
  const renderCurrentView = () => {
    switch (viewState) {
      case "receipt":
        if (!paymentData) return null
        return (
          <div className="min-h-screen bg-background p-4">
            <ReceiptMobile
              paymentData={paymentData}
              receiptNumber={`RCP-${Date.now().toString().slice(-6)}`}
              onNewSale={handleNewSale}
              onBackToHome={handleBackToHome}
            />
          </div>
        )
        
      case "payment":
        return (
          <div className="min-h-screen bg-background p-4">
            <PaymentProcessingMobile
              items={cartItems}
              customer={selectedCustomer}
              subtotal={subtotal}
              totalDiscount={totalDiscount}
              total={total}
              onBack={() => setViewState("pos")}
              onPaymentComplete={handlePaymentComplete}
            />
          </div>
        )
        
      default: // "pos"
        return (
          <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 shadow-sm sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                  <h1 className="text-lg font-semibold">Cashier POS</h1>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            {sidebarOpen && (
              <div className="fixed inset-0 z-20 bg-black bg-opacity-50" onClick={() => setSidebarOpen(false)}>
                <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
                  <div className="p-4">
                    <h2 className="text-lg font-semibold mb-4">Menu</h2>
                    <div className="space-y-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("products")
                          setSidebarOpen(false)
                        }}
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Products
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("cart")
                          setSidebarOpen(false)
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Cart ({cartItemCount})
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          setActiveTab("customer")
                          setSidebarOpen(false)
                        }}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Customer
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => {
                          window.location.href = "/dashboard"
                        }}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "products" && (
                <div className="p-4">
                  <ProductSearchMobile 
                    onAddToCart={addToCart}
                  />
                </div>
              )}
              
              {activeTab === "cart" && (
                <div className="p-4 pb-20">
                  <ShoppingCartMobile
                    items={cartItems}
                    onUpdateQuantity={updateQuantity}
                    onRemoveItem={removeItem}
                    onClearCart={clearCart}
                    onProceedToPayment={handleProceedToPayment}
                    subtotal={subtotal}
                    totalDiscount={totalDiscount}
                    total={total}
                  />
                </div>
              )}
              
              {activeTab === "customer" && (
                <div className="p-4">
                  <CustomerManagementMobile
                    selectedCustomer={selectedCustomer}
                    onSelectCustomer={setSelectedCustomer}
                  />
                </div>
              )}
            </div>

            {/* Cart Summary Bar */}
            {cartItems.length > 0 && activeTab !== "cart" && (
              <div className="bg-white border-t px-4 py-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {cartItemCount} items • Le {total.toLocaleString('en-SL')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedCustomer ? selectedCustomer.name : 'No customer selected'}
                    </p>
                  </div>
                  <Button size="sm" className="h-8" onClick={() => setActiveTab("cart")}>
                    View Cart
                  </Button>
                </div>
              </div>
            )}

            {/* Bottom Navigation */}
            <div className="bg-white border-t px-4 py-2 sticky bottom-0 z-10">
              <div className="flex justify-around">
                <Button
                  variant={activeTab === "products" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("products")}
                  className="flex-1 mx-1 h-12 flex-col"
                >
                  <Search className="h-4 w-4 mb-1" />
                  <span className="text-xs">Products</span>
                </Button>
                
                <Button
                  variant={activeTab === "cart" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("cart")}
                  className="flex-1 mx-1 h-12 flex-col relative"
                >
                  <div className="relative">
                    <ShoppingCart className="h-4 w-4 mb-1" />
                    {cartItemCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 text-xs p-0 flex items-center justify-center"
                      >
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs">Cart</span>
                </Button>
                
                <Button
                  variant={activeTab === "customer" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveTab("customer")}
                  className="flex-1 mx-1 h-12 flex-col relative"
                >
                  <div className="relative">
                    <Users className="h-4 w-4 mb-1" />
                    {selectedCustomer && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center"
                      >
                        1
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs">Customer</span>
                </Button>
              </div>
            </div>
          </div>
        )
    }
  }

  return renderCurrentView()
}