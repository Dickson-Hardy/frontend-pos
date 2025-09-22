"use client"

import { useState, useEffect } from "react"
import { Zap, Star, Clock, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { Badge } from "@/components/ui/badge"
import { useFrequentlysoldProducts } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api-unified"
import type { CartItem } from "@/app/cashier/page"

interface QuickActionsProps {
  onAddToCart: (product: Omit<CartItem, "quantity">) => void
}

type QuickActionTab = 'frequent' | 'favorites' | 'recent' | 'popular'

export function QuickActions({ onAddToCart }: QuickActionsProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<QuickActionTab>('frequent')
  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([])
  const [recentProducts, setRecentProducts] = useState<any[]>([])
  const [popularProducts, setPopularProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Use real data for frequently sold products
  const { data: frequentProducts, loading: frequentLoading, error: frequentError, refetch: refetchFrequent } = useFrequentlysoldProducts(user?.outletId, 8)

  // Load data for different tabs
  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'frequent') return // Already handled by hook
      
      setLoading(true)
      setError(null)
      
      try {
        switch (activeTab) {
          case 'favorites':
            // Load from localStorage (user's favorite products)
            const savedFavorites = localStorage.getItem('pharmacy_favorites')
            if (savedFavorites) {
              const favoriteIds = JSON.parse(savedFavorites)
              if (favoriteIds.length > 0) {
                const products = await apiClient.inventory.getItems(user?.outletId)
                const favorites = products.filter((p: any) => favoriteIds.includes(p.id)).slice(0, 8)
                setFavoriteProducts(favorites.map((p: any) => ({...p, isFavorite: true})))
              }
            }
            break
            
          case 'recent':
            // Get recently sold products from sales data
            const recentSales = await apiClient.sales.getAll({ 
              outletId: user?.outletId,
              limit: 50
            } as any)
            
            // Get unique recently sold products
            const recentProductIds = new Set<string>()
            const recentProductsList: any[] = []
            
            recentSales.forEach((sale: any) => {
              sale.items.forEach((item: any) => {
                if (!recentProductIds.has(item.productId) && recentProductsList.length < 8) {
                  recentProductIds.add(item.productId)
                  recentProductsList.push({
                    ...item.product,
                    lastUsed: new Date(sale.createdAt)
                  })
                }
              })
            })
            
            setRecentProducts(recentProductsList)
            break
            
          case 'popular':
            // Get products sorted by total sales volume
            const allSales = await apiClient.sales.getAll({ 
              outletId: user?.outletId,
              limit: 200
            } as any)
            
            const productSales = new Map<string, { product: any; totalSold: number }>()
            
            allSales.forEach((sale: any) => {
              sale.items.forEach((item: any) => {
                const existing = productSales.get(item.productId)
                if (existing) {
                  existing.totalSold += item.quantity
                } else {
                  productSales.set(item.productId, {
                    product: item.product,
                    totalSold: item.quantity
                  })
                }
              })
            })
            
            const popular = Array.from(productSales.values())
              .sort((a, b) => b.totalSold - a.totalSold)
              .slice(0, 8)
              .map(item => ({
                ...item.product,
                salesCount: item.totalSold
              }))
            
            setPopularProducts(popular)
            break
        }
      } catch (err) {
        setError('Failed to load product data')
        console.error('Error loading tab data:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadTabData()
  }, [activeTab, user?.outletId])

  const handleAddToCart = (product: any) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.sellingPrice || product.price,
      unit: product.unitOfMeasure || product.unit,
      category: product.category,
      stock: product.stockQuantity || product.stock || product.currentStock || 0,
    })
  }

  const toggleFavorite = (productId: string) => {
    const savedFavorites = localStorage.getItem('pharmacy_favorites')
    let favorites = savedFavorites ? JSON.parse(savedFavorites) : []
    
    if (favorites.includes(productId)) {
      favorites = favorites.filter((id: string) => id !== productId)
    } else {
      favorites.push(productId)
    }
    
    localStorage.setItem('pharmacy_favorites', JSON.stringify(favorites))
    
    // Update local state
    if (activeTab === 'favorites') {
      setFavoriteProducts(prev => 
        prev.filter(p => p.id !== productId)
      )
    }
  }

  const getTabData = () => {
    switch (activeTab) {
      case 'frequent':
        return frequentProducts || []
      case 'favorites':
        return favoriteProducts
      case 'recent':
        return recentProducts
      case 'popular':
        return popularProducts
      default:
        return []
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

  const isLoading = (activeTab === 'frequent' ? frequentLoading : loading) || false
  const currentError = (activeTab === 'frequent' ? frequentError : error) || null

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>{getTabTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (currentError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>{getTabTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage 
            error="Failed to load quick add items" 
            onRetry={activeTab === 'frequent' ? refetchFrequent : () => window.location.reload()}
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
              const stock = item.stockQuantity || item.stock || item.currentStock || 0
              const price = item.sellingPrice || item.price || 0
              const isOutOfStock = stock === 0
              
              return (
                <div key={item.id} className="relative">
                  <Button
                    variant="outline"
                    onClick={() => !isOutOfStock && handleAddToCart(item)}
                    className="h-auto p-3 flex flex-col items-start text-left w-full"
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
                      <div className="text-xs text-muted-foreground">Le {price.toLocaleString('en-SL')}</div>
                      
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
                  
                  {/* Favorite toggle button */}
                  {activeTab !== 'favorites' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(item.id)
                      }}
                    >
                      <Star className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )
            })
          ) : (
            <div className="col-span-2 text-center py-4 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No {activeTab} items available</p>
              {activeTab === 'favorites' && (
                <p className="text-xs">Add products to favorites by clicking the star icon</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
