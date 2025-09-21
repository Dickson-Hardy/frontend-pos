"use client"

import { useState } from "react"
import { Zap, Star, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { Badge } from "@/components/ui/badge"
import { useFrequentlysoldProducts } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import type { CartItem } from "@/app/cashier/page"

interface QuickActionsProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

type QuickActionTab = 'frequent' | 'favorites' | 'recent' | 'popular'

export function QuickActions({ onAddToCart }: QuickActionsProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<QuickActionTab>('frequent')
  
  // For now, we'll use frequent products for all tabs
  // In a real implementation, you'd have separate hooks for each
  const { data: frequentProducts, loading, error, refetch } = useFrequentlysoldProducts(user?.outletId, 8)

  const handleAddToCart = (product: any) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      category: product.category,
      stock: product.stock || product.currentStock || 0,
    })
  }

  // Mock data for demonstration - in real app, these would come from different APIs
  const getTabData = () => {
    if (!frequentProducts) return []
    
    switch (activeTab) {
      case 'frequent':
        return frequentProducts
      case 'favorites':
        // In real app, filter by user's favorite products
        return frequentProducts.slice(0, 4).map(p => ({...p, isFavorite: true}))
      case 'recent':
        // In real app, get recently sold/accessed products
        return frequentProducts.slice(0, 6).map(p => ({...p, lastUsed: new Date()}))
      case 'popular':
        // In real app, get most popular products by sales volume
        return frequentProducts.slice(0, 6).map(p => ({...p, salesCount: Math.floor(Math.random() * 100) + 50}))
      default:
        return frequentProducts
    }
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'frequent': return 'Frequently Sold'
      case 'favorites': return 'Favorites'
      case 'recent': return 'Recently Used'
      case 'popular': return 'Popular Items'
      default: return 'Quick Add Items'
    }
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
            error="Failed to load quick add items" 
            onRetry={refetch}
          />
        </CardContent>
      </Card>
    )
  }

  const tabData = getTabData()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5" />
          <span>{getTabTitle()}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex space-x-1">
          <Button 
            variant={activeTab === 'frequent' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => setActiveTab('frequent')}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Frequent
          </Button>
          <Button 
            variant={activeTab === 'favorites' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => setActiveTab('favorites')}
          >
            <Star className="h-3 w-3 mr-1" />
            Favorites
          </Button>
          <Button 
            variant={activeTab === 'recent' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => setActiveTab('recent')}
          >
            <Clock className="h-3 w-3 mr-1" />
            Recent
          </Button>
          <Button 
            variant={activeTab === 'popular' ? 'default' : 'ghost'} 
            size="sm" 
            className="flex-1 text-xs"
            onClick={() => setActiveTab('popular')}
          >
            <TrendingUp className="h-3 w-3 mr-1" />
            Popular
          </Button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-3">
          {tabData && tabData.length > 0 ? (
            tabData.map((item) => {
              const stock = item.stock || item.currentStock || 0
              const isOutOfStock = stock === 0
              
              return (
                <Button
                  key={item.id}
                  variant="outline"
                  onClick={() => !isOutOfStock && handleAddToCart(item)}
                  className="h-auto p-3 flex flex-col items-start text-left relative"
                  disabled={isOutOfStock}
                >
                  {/* Special indicators */}
                  {activeTab === 'favorites' && (
                    <Star className="absolute top-1 right-1 h-3 w-3 text-yellow-500 fill-current" />
                  )}
                  {activeTab === 'popular' && item.salesCount && (
                    <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                      {item.salesCount}
                    </Badge>
                  )}
                  
                  <div className="w-full">
                    <div className="font-semibold text-sm truncate w-full">{item.name}</div>
                    <div className="text-xs text-muted-foreground">Le {item.price.toLocaleString('en-SL')}</div>
                    
                    {/* Stock indicator */}
                    <div className="flex items-center justify-between w-full mt-1">
                      <span className="text-xs text-muted-foreground">
                        Stock: {stock}
                      </span>
                      {isOutOfStock && (
                        <Badge variant="destructive" className="text-xs">
                          Out
                        </Badge>
                      )}
                      {stock > 0 && stock <= 10 && (
                        <Badge variant="secondary" className="text-xs">
                          Low
                        </Badge>
                      )}
                    </div>
                    
                    {/* Additional info based on tab */}
                    {activeTab === 'recent' && item.lastUsed && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last used today
                      </div>
                    )}
                  </div>
                </Button>
              )
            })
          ) : (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {activeTab} items available</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
