"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './auth-context'
import { apiClient } from '@/lib/api-unified'

export interface Shift {
  id: string
  cashierId: string
  outletId: string
  startTime: string
  endTime?: string
  openingBalance: number
  closingBalance?: number
  totalSales: number
  totalExpenses: number
  netAmount: number
  status: 'active' | 'closed'
  createdAt: string
  updatedAt: string
}

export interface Expense {
  id: string
  shiftId: string
  amount: number
  description: string
  category: 'operational' | 'maintenance' | 'supplies' | 'other'
  createdAt: Date
}

interface ShiftContextType {
  currentShift: Shift | null
  isLoading: boolean
  startShift: (openingBalance: number) => Promise<void>
  endShift: (closingBalance: number) => Promise<void>
  addExpense: (amount: number, description: string, category: Expense['category']) => Promise<void>
  getShiftReport: (shiftId: string) => Promise<any>
  getDailyShifts: (date: string) => Promise<Shift[]>
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined)

export function ShiftProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentShift, setCurrentShift] = useState<Shift | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load current active shift on mount
  useEffect(() => {
    if (user?.id) {
      loadCurrentShift()
    }
  }, [user?.id])

  const loadCurrentShift = async () => {
    try {
      setIsLoading(true)
      const shift = await apiClient.shifts.getCurrent()
      setCurrentShift(shift)
    } catch (error) {
      console.error('Error loading current shift:', error)
      // Fallback to localStorage for offline mode
      const savedShift = localStorage.getItem(`currentShift_${user?.id}`)
      if (savedShift) {
        setCurrentShift(JSON.parse(savedShift))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const startShift = async (openingBalance: number) => {
    try {
      setIsLoading(true)
      
      if (!user?.id || !user?.outletId) {
        throw new Error('User or outlet information not available')
      }
      
      const newShift = await apiClient.shifts.start({ 
        openingBalance,
        cashierId: user.id,
        outletId: user.outletId
      })
      setCurrentShift(newShift)
      
      console.log('Shift started:', newShift)
    } catch (error) {
      console.error('Error starting shift:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const endShift = async (closingBalance: number) => {
    if (!currentShift) return

    try {
      setIsLoading(true)
      
      await apiClient.shifts.end(currentShift.id, { closingBalance })
      setCurrentShift(null)
      console.log('Shift ended successfully')
    } catch (error) {
      console.error('Error ending shift:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const addExpense = async (amount: number, description: string, category: Expense['category']) => {
    if (!currentShift) return

    try {
      await apiClient.shifts.addExpense(currentShift.id, { amount, description, category })

      // Reload current shift to get updated totals
      await loadCurrentShift()
      
      console.log('Expense added successfully')
    } catch (error) {
      console.error('Error adding expense:', error)
      throw error
    }
  }

  const getShiftReport = async (shiftId: string) => {
    try {
      return await apiClient.shifts.getShiftReport(shiftId)
    } catch (error) {
      console.error('Error getting shift report:', error)
      throw error
    }
  }

  const getDailyShifts = async (date: string) => {
    try {
      return await apiClient.shifts.getDailyShifts(date)
    } catch (error) {
      console.error('Error getting daily shifts:', error)
      throw error
    }
  }

  return (
    <ShiftContext.Provider value={{
      currentShift,
      isLoading,
      startShift,
      endShift,
      addExpense,
      getShiftReport,
      getDailyShifts
    }}>
      {children}
    </ShiftContext.Provider>
  )
}

export function useShift() {
  const context = useContext(ShiftContext)
  if (context === undefined) {
    throw new Error('useShift must be used within a ShiftProvider')
  }
  return context
}
