"use client"

import { TrendingUp, Package } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useSales } from "@/hooks/use-sales"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useMemo } from "react"

export function TopProducts() {
  const { user } = useAuth()
  const { salesStats, loading, error } = useSales({ outletId: user?.outletId })

  const topProducts = useMemo(() => {
    if (!salesStats?.topProducts) return []
    
    return salesStats.topProducts.slice(0, 5).map((product) => ({
      ...product,
      growth: 0, // TODO: Calculate from historical comparison
      category: "General", // TODO: Fetch from product details
    }))
  }, [salesStats])

  const maxSales = useMemo(() => {
    if (topProducts.length === 0) return 1
    return Math.max(...topProducts.map((p) => p.quantity))
  }, [topProducts])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Top Selling Products</span>
          </CardTitle>
          <CardDescription>Best performing products this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Top Selling Products</span>
          </CardTitle>
          <CardDescription>Best performing products this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorMessage error="Failed to load top products data" />
        </CardContent>
      </Card>
    )
  }

  if (!topProducts || topProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Top Selling Products</span>
          </CardTitle>
          <CardDescription>Best performing products this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No product data available</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Package className="h-5 w-5" />
          <span>Top Selling Products</span>
        </CardTitle>
        <CardDescription>Best performing products this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topProducts.map((product, index) => (
          <div key={product.productId} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-muted-foreground">#{index + 1}</span>
                <div>
                  <p className="font-semibold text-sm">{product.productName}</p>
                  <p className="text-xs text-muted-foreground">{product.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-sm">Le {product.revenue.toLocaleString('en-SL')}</p>
                <div className="flex items-center space-x-1 text-xs">
                  <TrendingUp className={`h-3 w-3 ${product.growth > 0 ? "text-primary" : "text-secondary"}`} />
                  <span className={product.growth > 0 ? "text-primary" : "text-secondary"}>
                    {product.growth > 0 ? "+" : ""}
                    {product.growth.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Units sold: {product.quantity}</span>
                <span>{Math.round((product.quantity / maxSales) * 100)}%</span>
              </div>
              <Progress value={(product.quantity / maxSales) * 100} className="h-2" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
