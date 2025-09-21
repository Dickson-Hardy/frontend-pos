"use client"

import { useState } from "react"
import { Printer, Download, Share2, CheckCircle, Home, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

interface PaymentData {
  method: string
  total: number
  items: CartItem[]
  customer: Customer | null
  timestamp: string
  cashReceived?: number
  change?: number
  cardAmount?: number
  mobileAmount?: number
  mobileNumber?: string
  cashAmount?: number
}

interface ReceiptMobileProps {
  paymentData: PaymentData
  receiptNumber: string
  onNewSale: () => void
  onBackToHome: () => void
}

export function ReceiptMobile({
  paymentData,
  receiptNumber,
  onNewSale,
  onBackToHome,
}: ReceiptMobileProps) {
  const [printing, setPrinting] = useState(false)

  const handlePrint = async () => {
    setPrinting(true)
    // Simulate printing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setPrinting(false)
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receipt #${receiptNumber}`,
          text: `Receipt for purchase at Pharmacy - Total: Le ${paymentData.total.toLocaleString('en-SL')}`,
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-SL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const subtotal = paymentData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalDiscount = subtotal - paymentData.total

  return (
    <div className="space-y-4">
      {/* Success Header */}
      <div className="text-center py-6">
        <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h2>
        <p className="text-muted-foreground">Transaction completed successfully</p>
      </div>

      {/* Receipt Card */}
      <Card className="max-w-sm mx-auto">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg">RECEIPT</CardTitle>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Pharmacy Management System</p>
            <p>Receipt #: {receiptNumber}</p>
            <p>{formatDate(paymentData.timestamp)}</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Customer Info */}
          {paymentData.customer && (
            <div className="text-sm">
              <p className="font-medium">Customer: {paymentData.customer.name}</p>
              {paymentData.customer.phone && (
                <p className="text-muted-foreground">Phone: {paymentData.customer.phone}</p>
              )}
            </div>
          )}

          <Separator />

          {/* Items */}
          <div className="space-y-2">
            <p className="font-medium text-sm">Items:</p>
            {paymentData.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.quantity} × Le {item.price.toLocaleString('en-SL')}
                  </p>
                </div>
                <p className="font-medium">
                  Le {(item.price * item.quantity).toLocaleString('en-SL')}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>Le {subtotal.toLocaleString('en-SL')}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-Le {totalDiscount.toLocaleString('en-SL')}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base">
              <span>Total:</span>
              <span>Le {paymentData.total.toLocaleString('en-SL')}</span>
            </div>
          </div>

          <Separator />

          {/* Payment Details */}
          <div className="space-y-2 text-sm">
            <p className="font-medium">Payment Method:</p>
            <div className="space-y-1">
              {paymentData.method === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Received:</span>
                    <span>Le {(paymentData.cashReceived || 0).toLocaleString('en-SL')}</span>
                  </div>
                  {paymentData.change && paymentData.change > 0 && (
                    <div className="flex justify-between font-medium">
                      <span>Change:</span>
                      <span>Le {paymentData.change.toLocaleString('en-SL')}</span>
                    </div>
                  )}
                </>
              )}
              
              {paymentData.method === "card" && (
                <div className="flex justify-between">
                  <span>Card Payment:</span>
                  <span>Le {paymentData.total.toLocaleString('en-SL')}</span>
                </div>
              )}
              
              {paymentData.method === "mobile" && (
                <>
                  <div className="flex justify-between">
                    <span>Mobile Money:</span>
                    <span>Le {paymentData.total.toLocaleString('en-SL')}</span>
                  </div>
                  {paymentData.mobileNumber && (
                    <div className="text-xs text-muted-foreground">
                      Number: {paymentData.mobileNumber}
                    </div>
                  )}
                </>
              )}
              
              {paymentData.method === "mixed" && (
                <>
                  {paymentData.cashAmount && paymentData.cashAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Cash:</span>
                      <span>Le {paymentData.cashAmount.toLocaleString('en-SL')}</span>
                    </div>
                  )}
                  {paymentData.cardAmount && paymentData.cardAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Card:</span>
                      <span>Le {paymentData.cardAmount.toLocaleString('en-SL')}</span>
                    </div>
                  )}
                  {paymentData.mobileAmount && paymentData.mobileAmount > 0 && (
                    <div className="flex justify-between">
                      <span>Mobile Money:</span>
                      <span>Le {paymentData.mobileAmount.toLocaleString('en-SL')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
            <Badge variant="outline" className="w-fit">
              {paymentData.method.charAt(0).toUpperCase() + paymentData.method.slice(1)} Payment
            </Badge>
          </div>

          <Separator />

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground">
            <p>Thank you for your business!</p>
            <p>Keep this receipt for your records</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={handlePrint}
            disabled={printing}
            className="h-12"
          >
            {printing ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                <span>Printing...</span>
              </div>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </>
            )}
          </Button>
          
          <Button variant="outline" onClick={handleShare} className="h-12">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>

        <Button 
          onClick={onNewSale} 
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          <RotateCcw className="mr-2 h-5 w-5" />
          New Sale
        </Button>

        <Button 
          variant="outline" 
          onClick={onBackToHome} 
          className="w-full h-12"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}