"use client"

import { useState, useEffect } from "react"
import { User, Star, Clock, DollarSign } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { apiClient } from "@/lib/api-client"

interface StaffMember {
  _id: string
  cashier: {
    name: string
    role: string
  }
  sales: number
  transactions: number
  avgTransactionValue: number
  performance: number
  status: string
}

export function StaffPerformance() {
  const [staffData, setStaffData] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStaffPerformance = async () => {
      try {
        setLoading(true)
        const response = await apiClient.get("/reports/staff-performance")
        setStaffData(response.data)
      } catch (err) {
        setError("Failed to fetch staff performance")
        console.error("Error fetching staff performance:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStaffPerformance()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Staff Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Loading staff performance...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || staffData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Staff Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No staff performance data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Staff Performance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {staffData.map((staff) => (
          <div key={staff._id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {staff.cashier.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{staff.cashier.name}</p>
                  <p className="text-xs text-muted-foreground">{staff.cashier.role}</p>
                </div>
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full ${
                  staff.status === "active" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                }`}
              >
                {staff.status}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3" />
                <span>${staff.sales}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3" />
                <span>{staff.transactions} txn</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{formatSLL(staff.avgTransactionValue)} avg</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Performance</span>
                <span>{staff.performance}%</span>
              </div>
              <Progress value={staff.performance} className="h-2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
