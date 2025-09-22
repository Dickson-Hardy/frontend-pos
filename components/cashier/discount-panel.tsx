"use client"

import { useState } from "react"
import { Percent, Tag, Gift, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface Discount {
  id: string
  type: 'percentage' | 'fixed' | 'loyalty' | 'coupon'
  value: number
  label: string
  code?: string
  minAmount?: number
  maxDiscount?: number
}

interface DiscountPanelProps {
  appliedDiscounts: Discount[]
  subtotal: number
  onApplyDiscount: (discount: Discount) => void
  onRemoveDiscount: (discountId: string) => void
  customerDiscountLevel?: number
}

export function DiscountPanel({ 
  appliedDiscounts, 
  subtotal, 
  onApplyDiscount, 
  onRemoveDiscount, 
  customerDiscountLevel 
}: DiscountPanelProps) {
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false)
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'coupon'>('percentage')
  const [discountValue, setDiscountValue] = useState("")
  const [couponCode, setCouponCode] = useState("")

  // Standard discount options available to cashiers
  const standardDiscounts = [
    { code: 'STAFF5', discount: 5, type: 'percentage', minAmount: 0, label: 'Staff Discount 5%' },
    { code: 'STAFF10', discount: 10, type: 'percentage', minAmount: 100, label: 'Staff Discount 10%' },
    { code: 'BULK15', discount: 15, type: 'percentage', minAmount: 500, label: 'Bulk Purchase 15%' },
    { code: 'SENIOR10', discount: 10, type: 'percentage', minAmount: 50, label: 'Senior Citizen 10%' },
    { code: 'STUDENT5', discount: 5, type: 'percentage', minAmount: 25, label: 'Student Discount 5%' },
  ]

  // Load custom coupons from localStorage (simple persistence)
  const [availableCoupons, setAvailableCoupons] = useState(() => {
    try {
      const saved = localStorage.getItem('pharmacy_coupons')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const calculateTotalDiscount = () => {
    return appliedDiscounts.reduce((total, discount) => {
      if (discount.type === 'percentage') {
        const percentageDiscount = (subtotal * discount.value) / 100
        return total + (discount.maxDiscount ? Math.min(percentageDiscount, discount.maxDiscount) : percentageDiscount)
      } else {
        return total + discount.value
      }
    }, 0)
  }

  const handleApplyDiscount = () => {
    if (discountType === 'coupon') {
      const coupon = availableCoupons.find(c => c.code === couponCode.toUpperCase())
      if (!coupon) {
        alert('Invalid coupon code')
        return
      }
      if (coupon.minAmount && subtotal < coupon.minAmount) {
        alert(`Minimum order amount is Le ${coupon.minAmount.toLocaleString('en-SL')}`)
        return
      }
      
      const discount: Discount = {
        id: Date.now().toString(),
        type: 'coupon',
        value: coupon.discount,
        label: coupon.label,
        code: coupon.code,
        minAmount: coupon.minAmount,
      }
      onApplyDiscount(discount)
      setCouponCode("")
    } else {
      const value = parseFloat(discountValue)
      if (!value || value <= 0) return
      
      if (discountType === 'percentage' && value > 50) {
        alert('Maximum percentage discount is 50%')
        return
      }
      
      if (discountType === 'fixed' && value > subtotal) {
        alert('Discount cannot exceed subtotal')
        return
      }

      const discount: Discount = {
        id: Date.now().toString(),
        type: discountType,
        value: value,
        label: discountType === 'percentage' ? `${value}% Discount` : `Le ${value} Discount`,
      }
      onApplyDiscount(discount)
      setDiscountValue("")
    }
    setIsDiscountDialogOpen(false)
  }

  const handleApplyLoyaltyDiscount = () => {
    if (!customerDiscountLevel || customerDiscountLevel <= 0) return
    
    // Check if loyalty discount already applied
    const hasLoyaltyDiscount = appliedDiscounts.some(d => d.type === 'loyalty')
    if (hasLoyaltyDiscount) return

    const discount: Discount = {
      id: 'loyalty-' + Date.now(),
      type: 'loyalty',
      value: customerDiscountLevel,
      label: `Loyalty ${customerDiscountLevel}% Discount`,
    }
    onApplyDiscount(discount)
  }

  const totalDiscountAmount = calculateTotalDiscount()
  const hasLoyaltyDiscount = appliedDiscounts.some(d => d.type === 'loyalty')

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Percent className="h-5 w-5" />
          <span>Discounts</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Applied Discounts */}
        {appliedDiscounts.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Applied Discounts:</Label>
            {appliedDiscounts.map((discount) => (
              <div key={discount.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                <div className="flex-1">
                  <div className="font-medium text-sm">{discount.label}</div>
                  {discount.code && (
                    <div className="text-xs text-muted-foreground">Code: {discount.code}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {discount.type === 'percentage' ? `${discount.value}%` : `Le ${discount.value}`}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveDiscount(discount.id)}
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Discount:</span>
              <span className="font-semibold text-green-600">
                -Le {totalDiscountAmount.toLocaleString('en-SL')}
              </span>
            </div>
          </div>
        )}

        {/* Loyalty Discount */}
        {customerDiscountLevel && customerDiscountLevel > 0 && !hasLoyaltyDiscount && (
          <Button
            variant="outline"
            onClick={handleApplyLoyaltyDiscount}
            className="w-full"
          >
            <Gift className="h-4 w-4 mr-2" />
            Apply Loyalty Discount ({customerDiscountLevel}%)
          </Button>
        )}

        {/* Add Discount */}
        <Dialog open={isDiscountDialogOpen} onOpenChange={setIsDiscountDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Discount
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply Discount</DialogTitle>
              <DialogDescription>
                Add a percentage discount, fixed amount discount, or apply a coupon code.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Discount Type</Label>
                <Select value={discountType} onValueChange={(value: any) => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="coupon">Coupon Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {discountType === 'coupon' ? (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="couponCode">Coupon Code</Label>
                    <Input
                      id="couponCode"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className="uppercase"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm">Available Coupons:</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {availableCoupons.map((coupon) => (
                        <Button
                          key={coupon.code}
                          variant="ghost"
                          className="w-full justify-start h-auto p-2"
                          onClick={() => setCouponCode(coupon.code)}
                        >
                          <div className="text-left">
                            <div className="font-medium text-sm">{coupon.code}</div>
                            <div className="text-xs text-muted-foreground">
                              {coupon.label} (Min: Le {coupon.minAmount?.toLocaleString('en-SL')})
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="discountValue">
                    {discountType === 'percentage' ? 'Percentage (%)' : 'Amount (Le)'}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '50'}
                    min="0"
                    max={discountType === 'percentage' ? '50' : undefined}
                  />
                  {discountType === 'percentage' && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 50% discount allowed
                    </p>
                  )}
                </div>
              )}
              
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Le {subtotal.toLocaleString('en-SL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Discounts:</span>
                    <span>-Le {totalDiscountAmount.toLocaleString('en-SL')}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>Le {(subtotal - totalDiscountAmount).toLocaleString('en-SL')}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDiscountDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleApplyDiscount}
                disabled={
                  (discountType === 'coupon' && !couponCode) ||
                  (discountType !== 'coupon' && !discountValue)
                }
              >
                Apply Discount
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {appliedDiscounts.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <Percent className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No discounts applied</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}