"use client"

import { Receipt, CreditCard, Banknote, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useRecentSales } from "@/hooks/use-sales"
import { useAuth } from "@/contexts/auth-context"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"

export function RecentTransactions() {
  const { user } = useAuth()
  const { sales, loading, error } = useRecentSales(10, user?.outletId)

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case "card":
        return <CreditCard className="h-3 w-3" />
      case "cash":
        return <Banknote className="h-3 w-3" />
      case "mobile":
        return <Smartphone className="h-3 w-3" />
      default:
        return <Receipt className="h-3 w-3" />
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
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
            <Receipt className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage error="Failed to load recent transactions" />
        </CardContent>
      </Card>
    )
  }

  if (!sales || sales.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Receipt className="h-5 w-5" />
            <span>Recent Transactions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No recent transactions found</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="h-5 w-5" />
          <span>Recent Transactions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sales.map((sale) => (
          <div key={sale.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-muted-foreground">
                {getPaymentIcon(sale.paymentMethod)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-sm">{sale.saleNumber}</p>
                  <Badge variant={sale.status === "completed" ? "default" : "secondary"} className="text-xs">
                    {sale.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatTime(sale.createdAt)} • {sale.items.length} items • {sale.cashier.firstName} {sale.cashier.lastName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">Le {sale.total.toLocaleString('en-SL')}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
