"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, DollarSign, Users, Download } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { apiClient } from "@/lib/api-unified"
import { useAuth } from "@/contexts/auth-context"

interface Shift {
  id: string
  cashierName: string
  date: string
  startTime: string
  endTime: string
  openingBalance: number
  closingBalance: number
  totalSales: number
  transactions: number
  status: string
}

interface ShiftStats {
  activeShifts: number
  todaysSales: number
  totalTransactions: number
  avgTransaction: number
}

export function ShiftReports() {
  const { user } = useAuth()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [stats, setStats] = useState<ShiftStats>({
    activeShifts: 0,
    todaysSales: 0,
    totalTransactions: 0,
    avgTransaction: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShiftData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Mock shift data since we don't have shift endpoints yet
        // In a real app, this would fetch from apiClient.shifts.getAll() and apiClient.shifts.getStats()
        const mockShifts: Shift[] = [
          {
            id: '1',
            cashierName: 'John Doe',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: '17:00',
            openingBalance: 500,
            closingBalance: 1250,
            totalSales: 750,
            transactions: 25,
            status: 'completed'
          },
          {
            id: '2',
            cashierName: 'Jane Smith',
            date: new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0],
            startTime: '17:00',
            endTime: '01:00',
            openingBalance: 1250,
            closingBalance: 1800,
            totalSales: 550,
            transactions: 18,
            status: 'completed'
          },
          {
            id: '3',
            cashierName: 'Bob Wilson',
            date: new Date().toISOString().split('T')[0],
            startTime: '09:00',
            endTime: 'ongoing',
            openingBalance: 500,
            closingBalance: 0,
            totalSales: 320,
            transactions: 12,
            status: 'active'
          }
        ]

        const mockStats: ShiftStats = {
          activeShifts: mockShifts.filter(s => s.status === 'active').length,
          todaysSales: mockShifts
            .filter(s => s.date === new Date().toISOString().split('T')[0])
            .reduce((sum, s) => sum + s.totalSales, 0),
          totalTransactions: mockShifts
            .filter(s => s.date === new Date().toISOString().split('T')[0])
            .reduce((sum, s) => sum + s.transactions, 0),
          avgTransaction: 0
        }
        
        mockStats.avgTransaction = mockStats.totalTransactions > 0 
          ? mockStats.todaysSales / mockStats.totalTransactions 
          : 0

        setShifts(mockShifts)
        setStats(mockStats)
      } catch (err) {
        setError("Failed to fetch shift data")
        console.error("Error fetching shifts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchShiftData()
  }, [user?.outletId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Shift Reports</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading shift reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Shift Reports</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Shift Reports</h1>
        <Button className="bg-rose-600 hover:bg-rose-700">
          <Download className="h-4 w-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
                <p className="text-2xl font-bold">{stats.activeShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-2xl font-bold">Le {stats.todaysSales.toLocaleString('en-SL')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Avg Transaction</p>
                <p className="text-2xl font-bold">{formatSLL(stats.avgTransaction)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Shifts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Cashier</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Opening Balance</th>
                  <th className="text-left p-2">Closing Balance</th>
                  <th className="text-left p-2">Sales</th>
                  <th className="text-left p-2">Transactions</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b">
                    <td className="p-2 font-medium">{shift.cashierName}</td>
                    <td className="p-2">{shift.date}</td>
                    <td className="p-2">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="p-2">Le {shift.openingBalance.toLocaleString('en-SL')}</td>
                    <td className="p-2">Le {shift.closingBalance.toLocaleString('en-SL')}</td>
                    <td className="p-2">Le {shift.totalSales.toLocaleString('en-SL')}</td>
                    <td className="p-2">{shift.transactions}</td>
                    <td className="p-2">
                      <Badge variant={shift.status === "completed" ? "default" : shift.status === "active" ? "secondary" : "outline"}>
                        {shift.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
