"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, DollarSign, Users, Download } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { apiClient } from "@/lib/api-client"

interface Shift {
  _id: string
  cashier: {
    name: string
  }
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
        const [shiftsResponse, statsResponse] = await Promise.all([
          apiClient.get("/shifts"),
          apiClient.get("/shifts/stats"),
        ])
        setShifts(shiftsResponse.data)
        setStats(statsResponse.data)
      } catch (err) {
        setError("Failed to fetch shift data")
        console.error("Error fetching shifts:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchShiftData()
  }, [])

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
                <p className="text-2xl font-bold">${stats.todaysSales}</p>
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
                  <tr key={shift._id} className="border-b">
                    <td className="p-2 font-medium">{shift.cashier.name}</td>
                    <td className="p-2">{shift.date}</td>
                    <td className="p-2">
                      {shift.startTime} - {shift.endTime}
                    </td>
                    <td className="p-2">${shift.openingBalance}</td>
                    <td className="p-2">${shift.closingBalance}</td>
                    <td className="p-2">${shift.totalSales}</td>
                    <td className="p-2">{shift.transactions}</td>
                    <td className="p-2">
                      <Badge variant={shift.status === "completed" ? "default" : "secondary"}>{shift.status}</Badge>
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
