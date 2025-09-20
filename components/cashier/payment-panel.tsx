"use client"

import { useState } from "react"
import { ArrowLeft, CreditCard, Banknote, Smartphone, Receipt, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useSaleMutations } from "@/hooks/use-sales"
import { useAuth } from "@/contexts/auth-context"
import type { CartItem } from "@/app/cashier/page"
import type { PaymentMethod } from "@/lib/api-unified"

interface PaymentPanelProps {
  items: CartItem[]
  total: number
  onBack: () => void
  onPaymentComplete: () => void
}

export function PaymentPanel({ items, total, onBack, onPaymentComplete }: PaymentPanelProps) {
  const { user } = useAuth()
  const { createSale } = useSaleMutations()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashReceived, setCashReceived] = useState("")
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [saleId, setSaleId] = useState<string>("")

  const cashAmount = Number.parseFloat(cashReceived) || 0
  const change = cashAmount - total

  const handlePayment = async () => {
    if (!user?.outletId) {
      console.error("No outlet ID available")
      return
    }

    try {
      // Prepare sale data
      const saleData = {
        items: items.map(item => ({
          productId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          discount: item.discount || 0,
          batchId: item.batchNumber,
        })),
        discount: 0, // Could be calculated from item discounts
        paymentMethod,
        outletId: user.outletId,
      }

      // Create the sale
      const sale = await createSale.mutate(saleData)
      setSaleId(sale.id)
      setPaymentSuccess(true)

      // Auto-complete after showing success message
      setTimeout(() => {
        onPaymentComplete()
      }, 3000)

    } catch (error) {
      console.error("Payment failed:", error)
      // Error handling is managed by the mutation hook
    }
  }

  const canProcessPayment = () => {
    if (paymentMethod === "cash") {
      return cashAmount >= total
    }
    return true // For card and mobile payments
  }

  // Show success screen
  if (paymentSuccess) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <span>Payment Successful</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center space-y-4">
          <CheckCircle className="h-16 w-16 text-green-600" />
          <div className="text-center">
            <h3 className="text-lg font-semibold">Transaction Complete</h3>
            <p className="text-muted-foreground">Sale ID: {saleId}</p>
            <p className="text-muted-foreground">Total: Le {total.toLocaleString('en-SL')}</p>
            {paymentMethod === "cash" && change > 0 && (
              <p className="text-lg font-semibold mt-2">Change: Le {change.toLocaleString('en-SL')}</p>
            )}
          </div>
          <Button onClick={onPaymentComplete} className="mt-4">
            <Receipt className="mr-2 h-4 w-4" />
            Print Receipt & Continue
          </Button>
        </CardContent>
      </div>
    )
  }

  // Show error state
  if (createSale.error) {
    return (
      <div className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Payment Failed</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <ErrorMessage 
            error="Failed to process payment. Please try again." 
            onRetry={() => createSale.reset()}
          />
          <Button onClick={onBack} variant="outline" className="mt-4">
            Back to Cart
          </Button>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle>Payment</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.name} x{item.quantity}
                </span>
                <span>Le {(item.price * item.quantity).toLocaleString('en-SL')}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Payment Method</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
              className="flex flex-col items-center p-4 h-auto"
            >
              <Banknote className="h-6 w-6 mb-1" />
              <span className="text-xs">Cash</span>
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
              className="flex flex-col items-center p-4 h-auto"
            >
              <CreditCard className="h-6 w-6 mb-1" />
              <span className="text-xs">Card</span>
            </Button>
            <Button
              variant={paymentMethod === "mobile" ? "default" : "outline"}
              onClick={() => setPaymentMethod("mobile")}
              className="flex flex-col items-center p-4 h-auto"
            >
              <Smartphone className="h-6 w-6 mb-1" />
              <span className="text-xs">Mobile</span>
            </Button>
          </div>
        </div>

        {/* Cash Payment Details */}
        {paymentMethod === "cash" && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="cash-received">Cash Received</Label>
              <Input
                id="cash-received"
                type="number"
                step="0.01"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0.00"
                className="text-lg"
              />
            </div>
            {cashAmount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Amount Due:</span>
                  <span>Le {total.toLocaleString('en-SL')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash Received:</span>
                  <span>Le {cashAmount.toLocaleString('en-SL')}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Change:</span>
                  <span className={change >= 0 ? "text-primary" : "text-destructive"}>
                    Le {Math.abs(change).toLocaleString('en-SL')}
                  </span>
                </div>
                {change < 0 && (
                  <Badge variant="destructive" className="w-full justify-center">
                    Insufficient amount
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Card/Mobile Payment Status */}
        {(paymentMethod === "card" || paymentMethod === "mobile") && (
          <div className="text-center py-4">
            <div className="text-sm text-muted-foreground">
              {paymentMethod === "card" ? "Insert or tap card" : "Scan QR code or tap phone"}
            </div>
          </div>
        )}

        {/* Process Payment Button */}
        <div className="mt-auto pt-4">
          <Button 
            onClick={handlePayment} 
            disabled={!canProcessPayment() || createSale.loading} 
            className="w-full" 
            size="lg"
          >
            {createSale.loading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Processing Payment...
              </>
            ) : (
              <>
                <Receipt className="mr-2 h-4 w-4" />
                Complete Payment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
