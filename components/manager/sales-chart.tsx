"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { apiClient } from "@/lib/api-unified"

interface SalesData {
  date: string
  sales: number
  transactions: number
}

const chartConfig = {
  sales: {
    label: "Sales ($)",
    color: "hsl(var(--primary))",
  },
  transactions: {
    label: "Transactions",
    color: "hsl(var(--secondary))",
  },
}

export function SalesChart() {
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const weeklyData = await apiClient.reports.getWeeklySales()
        
        // Transform the data to match chart format
        const chartData = weeklyData.dailyBreakdown.map(day => ({
          date: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
          sales: day.sales,
          transactions: day.transactions,
        }))
        
        setSalesData(chartData)
      } catch (err) {
        setError("Failed to fetch sales data")
        console.error("Error fetching sales data:", err)
        setSalesData([])
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Overview</CardTitle>
          <CardDescription>Loading sales data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Loading chart...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || salesData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Sales Overview</CardTitle>
          <CardDescription>Sales performance and transaction volume for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No sales data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Sales Overview</CardTitle>
        <CardDescription>Sales performance and transaction volume for the past week</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="sales"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default SalesChart
