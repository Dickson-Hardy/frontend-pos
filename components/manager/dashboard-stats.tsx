"use client"

import { useState, useEffect } from "react"
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCardSkeleton } from "@/components/ui/skeleton-loaders"
import { showErrorToast } from "@/lib/toast-utils"
import { apiClient } from "@/lib/api-unified"

interface DashboardStatsData {
  todaysSales: number
  transactions: number
  lowStockItems: number
  activeStaff: number
  salesChange: number
  transactionChange: number
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get today's date for sales report
        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        const [todaysSalesData, yesterdaysSalesData, inventoryData, usersData] = await Promise.all([
          apiClient.reports.getSales({ startDate: today, endDate: today }),
          apiClient.reports.getSales({ startDate: yesterday, endDate: yesterday }),
          apiClient.reports.getInventory(),
          apiClient.users.getAll(),
        ])

        // Calculate percentage changes
        const salesChange = yesterdaysSalesData.totalSales > 0 
          ? ((todaysSalesData.totalSales - yesterdaysSalesData.totalSales) / yesterdaysSalesData.totalSales) * 100
          : 0

        const transactionChange = yesterdaysSalesData.totalTransactions > 0
          ? ((todaysSalesData.totalTransactions - yesterdaysSalesData.totalTransactions) / yesterdaysSalesData.totalTransactions) * 100
          : 0

        setStats({
          todaysSales: todaysSalesData.totalSales || 0,
          transactions: todaysSalesData.totalTransactions || 0,
          lowStockItems: inventoryData.lowStockItems?.length || 0,
          activeStaff: usersData.filter(user => user.isActive).length || 0,
          salesChange: salesChange,
          transactionChange: transactionChange,
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        const errorMessage = "Failed to load dashboard statistics"
        setError(errorMessage)
        showErrorToast(errorMessage, {
          action: {
            label: "Retry",
            onClick: () => fetchStats()
          }
        })
        // Fallback to default values
        setStats({
          todaysSales: 0,
          transactions: 0,
          lowStockItems: 0,
          activeStaff: 0,
          salesChange: 0,
          transactionChange: 0,
        })
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center py-8">
            <p className="text-destructive">{error || "Failed to load statistics"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statsData = [
    {
      title: "Today's Sales",
      value: formatSLL(stats.todaysSales),
      change: `${stats.salesChange > 0 ? "+" : ""}${stats.salesChange.toFixed(1)}%`,
      trend: stats.salesChange > 0 ? "up" : stats.salesChange < 0 ? "down" : "neutral",
      icon: DollarSign,
      description: "vs yesterday",
    },
    {
      title: "Transactions",
      value: stats.transactions.toString(),
      change: `${stats.transactionChange > 0 ? "+" : ""}${stats.transactionChange.toFixed(1)}%`,
      trend: stats.transactionChange > 0 ? "up" : stats.transactionChange < 0 ? "down" : "neutral",
      icon: ShoppingCart,
      description: "completed today",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockItems.toString(),
      change: "need reorder",
      trend: "neutral",
      icon: Package,
      description: "items below threshold",
    },
    {
      title: "Active Staff",
      value: stats.activeStaff.toString(),
      change: "currently working",
      trend: "neutral",
      icon: Users,
      description: "staff members",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                {stat.trend === "up" && <TrendingUp className="h-3 w-3 text-primary" />}
                {stat.trend === "down" && <TrendingDown className="h-3 w-3 text-secondary" />}
                <span className={stat.trend === "up" ? "text-primary" : stat.trend === "down" ? "text-secondary" : ""}>
                  {stat.change}
                </span>
                <span>{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
