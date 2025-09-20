"use client"

import { Zap, Star, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useFrequentlysoldProducts } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import type { CartItem } from "@/app/cashier/page"

interface QuickActionsProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

export function QuickActions({ onAddToCart }: QuickActionsProps) {
  const { user } = useAuth()
  const { data: frequentProducts, loading, error, refetch } = useFrequentlysoldProducts(user?.outletId, 8)

  const handleAddToCart = (product: any) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      category: product.category,
      stock: product.stock,
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Add Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Add Items</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage 
            error="Failed to load frequently sold items" 
            onRetry={refetch}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>Quick Add Items</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {frequentProducts && frequentProducts.length > 0 ? (
            frequentProducts.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                onClick={() => handleAddToCart(item)}
                className="h-auto p-3 flex flex-col items-start text-left"
                disabled={item.stock === 0}
              >
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs text-muted-foreground">Le {item.price.toLocaleString('en-SL')}</div>
                {item.stock === 0 && (
                  <div className="text-xs text-destructive">Out of stock</div>
                )}
              </Button>
            ))
          ) : (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No frequently sold items available</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex space-x-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Star className="h-4 w-4 mr-1" />
            Favorites
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <Clock className="h-4 w-4 mr-1" />
            Recent
          </Button>
          <Button variant="ghost" size="sm" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-1" />
            Popular
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
