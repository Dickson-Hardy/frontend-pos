"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useShift } from '@/contexts/shift-context'
import { useToast } from '@/hooks/use-toast'
import { Clock, DollarSign, TrendingUp, TrendingDown, Calculator } from 'lucide-react'

interface EndShiftModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EndShiftModal({ isOpen, onClose }: EndShiftModalProps) {
  const { currentShift, endShift, isLoading } = useShift()
  const { toast } = useToast()
  const [closingBalance, setClosingBalance] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!currentShift) return null

  const calculateExpectedBalance = () => {
    return currentShift.openingBalance + currentShift.totalSales - currentShift.totalExpenses
  }

  const calculateDifference = () => {
    const expected = calculateExpectedBalance()
    const actual = parseFloat(closingBalance) || 0
    return actual - expected
  }

  const handleEndShift = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid closing balance",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await endShift(parseFloat(closingBalance))
      
      const difference = calculateDifference()
      const differenceText = difference > 0 
        ? `+Le ${difference.toLocaleString('en-SL')} (Over)`
        : difference < 0 
        ? `Le ${Math.abs(difference).toLocaleString('en-SL')} (Short)`
        : 'Balanced'

      toast({
        title: "Shift Ended",
        description: `Your shift has ended. ${differenceText}`
      })
      
      onClose()
      setClosingBalance('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to end shift. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const expectedBalance = calculateExpectedBalance()
  const difference = calculateDifference()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-600" />
            End Your Shift
          </DialogTitle>
          <DialogDescription>
            Close your work day by entering your closing cash balance
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Shift Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Shift Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opening Balance:</span>
                <span className="font-medium">Le {currentShift.openingBalance.toLocaleString('en-SL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales:</span>
                <span className="font-medium text-green-600">+Le {currentShift.totalSales.toLocaleString('en-SL')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Expenses:</span>
                <span className="font-medium text-red-600">-Le {currentShift.totalExpenses.toLocaleString('en-SL')}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">Expected Balance:</span>
                <span className="font-medium">Le {expectedBalance.toLocaleString('en-SL')}</span>
              </div>
            </div>
          </div>

          {/* Closing Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="closingBalance" className="text-sm font-medium">
              Actual Closing Balance (Le)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="closingBalance"
                type="number"
                min="0"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Count your actual cash and enter the amount
            </p>
          </div>

          {/* Difference Display */}
          {closingBalance && (
            <div className={`border rounded-lg p-3 ${
              difference > 0 ? 'bg-green-50 border-green-200' : 
              difference < 0 ? 'bg-red-50 border-red-200' : 
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {difference > 0 ? 'Over' : difference < 0 ? 'Short' : 'Balanced'}
                </span>
              </div>
              <div className="text-sm">
                {difference > 0 ? (
                  <span className="text-green-600">
                    +Le {difference.toLocaleString('en-SL')} over expected
                  </span>
                ) : difference < 0 ? (
                  <span className="text-red-600">
                    Le {Math.abs(difference).toLocaleString('en-SL')} short of expected
                  </span>
                ) : (
                  <span className="text-blue-600">
                    Perfectly balanced
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEndShift}
              disabled={isSubmitting || !closingBalance}
              className="flex-1"
            >
              {isSubmitting ? 'Ending...' : 'End Shift'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
