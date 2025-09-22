"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useShift } from '@/contexts/shift-context'
import { useAuth } from '@/contexts/auth-context'
import { 
  BarChart3, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Receipt,
  AlertCircle
} from 'lucide-react'

export function MobileReports() {
  const { currentShift, getDailyShifts, getShiftReport } = useShift()
  const { user } = useAuth()
  const [dailyShifts, setDailyShifts] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadDailyShifts()
  }, [selectedDate])

  const loadDailyShifts = async () => {
    try {
      setIsLoading(true)
      const shifts = await getDailyShifts(selectedDate)
      setDailyShifts(shifts)
    } catch (error) {
      console.error('Error loading daily shifts:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatCurrency = (amount: number) => {
    return `Le ${amount.toLocaleString('en-SL')}`
  }

  const getShiftStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateDailyTotals = () => {
    return dailyShifts.reduce((totals, shift) => {
      totals.totalSales += shift.totalSales || 0
      totals.totalExpenses += shift.totalExpenses || 0
      totals.netAmount += shift.netAmount || 0
      return totals
    }, { totalSales: 0, totalExpenses: 0, netAmount: 0 })
  }

  const dailyTotals = calculateDailyTotals()

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Daily Reports</h2>
        <div className="text-sm text-muted-foreground">
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Date Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
        />
        <Button size="sm" variant="outline" onClick={loadDailyShifts}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="current">Current</TabsTrigger>
        </TabsList>

        {/* Daily Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(dailyTotals.totalSales)}
                </div>
                <div className="flex items-center text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Daily Total
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(dailyTotals.totalExpenses)}
                </div>
                <div className="flex items-center text-xs text-red-600 mt-1">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Daily Total
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(dailyTotals.netAmount)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Sales - Expenses
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Shift Count</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {dailyShifts.length}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Shifts completed today
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shifts Tab */}
        <TabsContent value="shifts" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading shifts...
            </div>
          ) : dailyShifts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2" />
              <p>No shifts found for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyShifts.map((shift) => (
                <Card key={shift.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatTime(shift.startTime)} - {shift.endTime ? formatTime(shift.endTime) : 'Active'}
                        </span>
                      </div>
                      <Badge className={getShiftStatusColor(shift.status)}>
                        {shift.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Sales</div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(shift.totalSales)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Expenses</div>
                        <div className="font-medium text-red-600">
                          {formatCurrency(shift.totalExpenses)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Opening</div>
                        <div className="font-medium">
                          {formatCurrency(shift.openingBalance)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Net</div>
                        <div className="font-medium">
                          {formatCurrency(shift.netAmount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Current Shift Tab */}
        <TabsContent value="current" className="space-y-4">
          {currentShift ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Current Shift
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-3">
                    Started at {formatTime(currentShift.startTime)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Opening Balance:</span>
                      <span className="font-medium">{formatCurrency(currentShift.openingBalance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Sales:</span>
                      <span className="font-medium text-green-600">{formatCurrency(currentShift.totalSales)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Expenses:</span>
                      <span className="font-medium text-red-600">{formatCurrency(currentShift.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-medium">Current Balance:</span>
                      <span className="font-medium">{formatCurrency(currentShift.netAmount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Shift Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {Math.floor((new Date().getTime() - new Date(currentShift.startTime).getTime()) / (1000 * 60 * 60))}h{' '}
                    {Math.floor(((new Date().getTime() - new Date(currentShift.startTime).getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Time elapsed
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No active shift</p>
              <p className="text-xs">Start a shift to begin tracking</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
