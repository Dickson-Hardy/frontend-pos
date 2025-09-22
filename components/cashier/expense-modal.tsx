"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useShift } from '@/contexts/shift-context'
import { useToast } from '@/hooks/use-toast'
import { DollarSign, FileText, Tag } from 'lucide-react'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
}

const expenseCategories = [
  { value: 'operational', label: 'Operational', description: 'General operational costs' },
  { value: 'maintenance', label: 'Maintenance', description: 'Equipment and facility maintenance' },
  { value: 'supplies', label: 'Supplies', description: 'Office and cleaning supplies' },
  { value: 'other', label: 'Other', description: 'Miscellaneous expenses' }
] as const

export function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { addExpense, currentShift } = useShift()
  const { toast } = useToast()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<keyof typeof expenseCategories[0]>('operational')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid expense amount",
        variant: "destructive"
      })
      return
    }

    if (!description.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for this expense",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)
      await addExpense(parseFloat(amount), description.trim(), category)
      
      toast({
        title: "Expense Added",
        description: `Le ${parseFloat(amount).toLocaleString('en-SL')} expense recorded`
      })
      
      onClose()
      setAmount('')
      setDescription('')
      setCategory('operational')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add expense. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentShift) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-red-600" />
            Add Expense
          </DialogTitle>
          <DialogDescription>
            Record an expense for your current shift
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (Le)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="pl-10"
              />
            </div>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What was this expense for?"
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Category
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Select value={category} onValueChange={(value) => setCategory(value as any)}>
                <SelectTrigger className="pl-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div>
                        <div className="font-medium">{cat.label}</div>
                        <div className="text-xs text-muted-foreground">{cat.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Current Shift Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Current Expenses:</span>
                <span className="font-medium">Le {currentShift.totalExpenses.toLocaleString('en-SL')}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                This expense will be added to your shift total
              </div>
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
              onClick={handleAddExpense}
              disabled={isSubmitting || !amount || !description.trim()}
              className="flex-1"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
