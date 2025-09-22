"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useShift } from '@/contexts/shift-context'
import { useToast } from '@/hooks/use-toast'
import { Clock, DollarSign, User } from 'lucide-react'

interface StartShiftModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StartShiftModal({ isOpen, onClose }: StartShiftModalProps) {
  const { startShift, isLoading } = useShift()
  const { toast } = useToast()
  const [openingBalance, setOpeningBalance] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleStartShift = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid opening balance",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await startShift(parseFloat(openingBalance))
      
      toast({
        title: "Shift Started",
        description: `Your shift has started with Le ${parseFloat(openingBalance).toLocaleString('en-SL')} opening balance`
      })
      
      onClose()
      setOpeningBalance('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start shift. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Start Your Shift
          </DialogTitle>
          <DialogDescription>
            Begin your work day by entering your opening cash balance
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Opening Balance Input */}
          <div className="space-y-2">
            <Label htmlFor="openingBalance" className="text-sm font-medium">
              Opening Cash Balance (Le)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="openingBalance"
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the amount of cash you have at the start of your shift
            </p>
          </div>

          {/* Shift Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Shift Information</span>
            </div>
            <div className="text-xs text-blue-600 space-y-1">
              <div>• Your shift will be tracked automatically</div>
              <div>• All sales will be recorded against this shift</div>
              <div>• You can add expenses during your shift</div>
              <div>• End your shift when you're done for the day</div>
            </div>
          </div>

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
              onClick={handleStartShift}
              disabled={isSubmitting || !openingBalance}
              className="flex-1"
            >
              {isSubmitting ? 'Starting...' : 'Start Shift'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
