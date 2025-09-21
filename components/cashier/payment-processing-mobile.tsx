"use client"

import { useState } from "react"
import { CreditCard, Smartphone, DollarSign, Receipt, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { CartItem } from "@/app/cashier/page"

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
}

interface PaymentProcessingMobileProps {
  items: CartItem[]
  customer: Customer | null
  subtotal: number
  totalDiscount: number
  total: number
  onBack: () => void
  onPaymentComplete: (paymentData: any) => void
}

type PaymentMethod = "cash" | "card" | "mobile" | "mixed"

export function PaymentProcessingMobile({
  items,
  customer,
  subtotal,
  totalDiscount,
  total,
  onBack,
  onPaymentComplete,
}: PaymentProcessingMobileProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash")
  const [cashReceived, setCashReceived] = useState("")
  const [cardAmount, setCardAmount] = useState("")
  const [mobileAmount, setMobileAmount] = useState("")
  const [mobileNumber, setMobileNumber] = useState("")
  const [processing, setProcessing] = useState(false)

  const cashReceivedAmount = Number.parseFloat(cashReceived) || 0
  const cardAmountValue = Number.parseFloat(cardAmount) || 0
  const mobileAmountValue = Number.parseFloat(mobileAmount) || 0

  const change = paymentMethod === "cash" ? Math.max(0, cashReceivedAmount - total) : 0
  const shortfall = paymentMethod === "cash" ? Math.max(0, total - cashReceivedAmount) : 0

  const mixedTotalPaid = cardAmountValue + mobileAmountValue + (paymentMethod === "mixed" ? Number.parseFloat(cashReceived) || 0 : 0)
  const mixedShortfall = paymentMethod === "mixed" ? Math.max(0, total - mixedTotalPaid) : 0

  const isPaymentValid = () => {
    switch (paymentMethod) {
      case "cash":
        return cashReceivedAmount >= total
      case "card":
        return true // Card payments are typically handled by external systems
      case "mobile":
        return mobileNumber.trim() !== ""
      case "mixed":
        return mixedShortfall === 0
      default:
        return false
    }
  }

  const handlePayment = async () => {
    if (!isPaymentValid()) return

    setProcessing(true)

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000))

    const paymentData = {
      method: paymentMethod,
      total,
      items,
      customer,
      timestamp: new Date().toISOString(),
      ...(paymentMethod === "cash" && {
        cashReceived: cashReceivedAmount,
        change,
      }),
      ...(paymentMethod === "card" && {
        cardAmount: total,
      }),
      ...(paymentMethod === "mobile" && {
        mobileAmount: total,
        mobileNumber,
      }),
      ...(paymentMethod === "mixed" && {
        cashAmount: Number.parseFloat(cashReceived) || 0,
        cardAmount: cardAmountValue,
        mobileAmount: mobileAmountValue,
        mobileNumber: mobileAmountValue > 0 ? mobileNumber : undefined,
      }),
    }

    onPaymentComplete(paymentData)
    setProcessing(false)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">Payment</h2>
      </div>

      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Order Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Items ({items.length}):</span>
            <span>Le {subtotal.toLocaleString('en-SL')}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount:</span>
              <span>-Le {totalDiscount.toLocaleString('en-SL')}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total:</span>
            <span>Le {total.toLocaleString('en-SL')}</span>
          </div>
          {customer && (
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">Customer: {customer.name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="cash" id="cash" />
              <Label htmlFor="cash" className="flex items-center space-x-2 cursor-pointer">
                <DollarSign className="h-4 w-4" />
                <span>Cash</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center space-x-2 cursor-pointer">
                <CreditCard className="h-4 w-4" />
                <span>Card</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mobile" id="mobile" />
              <Label htmlFor="mobile" className="flex items-center space-x-2 cursor-pointer">
                <Smartphone className="h-4 w-4" />
                <span>Mobile Money</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="mixed" id="mixed" />
              <Label htmlFor="mixed" className="flex items-center space-x-2 cursor-pointer">
                <Receipt className="h-4 w-4" />
                <span>Mixed Payment</span>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentMethod === "cash" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="cashReceived">Cash Received</Label>
                <Input
                  id="cashReceived"
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                  className="text-lg"
                />
              </div>
              {cashReceivedAmount > 0 && (
                <div className="space-y-2">
                  {shortfall > 0 ? (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                      <p className="text-sm text-destructive font-medium">
                        Shortfall: Le {shortfall.toLocaleString('en-SL')}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800 font-medium">
                        Change: Le {change.toLocaleString('en-SL')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <p className="text-sm text-blue-800">
                Please process card payment for Le {total.toLocaleString('en-SL')} on the card terminal.
              </p>
            </div>
          )}

          {paymentMethod === "mobile" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="mobileNumber">Mobile Number</Label>
                <Input
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+232 XX XXX XXX"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  Mobile money payment of Le {total.toLocaleString('en-SL')} will be processed.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "mixed" && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="mixedCash">Cash Amount</Label>
                <Input
                  id="mixedCash"
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="mixedCard">Card Amount</Label>
                <Input
                  id="mixedCard"
                  type="number"
                  value={cardAmount}
                  onChange={(e) => setCardAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="mixedMobile">Mobile Money Amount</Label>
                <Input
                  id="mixedMobile"
                  type="number"
                  value={mobileAmount}
                  onChange={(e) => setMobileAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
              {mobileAmountValue > 0 && (
                <div>
                  <Label htmlFor="mixedMobileNumber">Mobile Number</Label>
                  <Input
                    id="mixedMobileNumber"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="+232 XX XXX XXX"
                  />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Paid:</span>
                  <span>Le {mixedTotalPaid.toLocaleString('en-SL')}</span>
                </div>
                {mixedShortfall > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-2">
                    <p className="text-xs text-destructive">
                      Remaining: Le {mixedShortfall.toLocaleString('en-SL')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Payment Button */}
      <Button
        onClick={handlePayment}
        disabled={!isPaymentValid() || processing}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {processing ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Processing...</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Check className="h-5 w-5" />
            <span>Process Payment</span>
          </div>
        )}
      </Button>
    </div>
  )
}