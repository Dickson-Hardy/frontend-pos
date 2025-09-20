'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation, cacheUtils } from './use-api'
import { apiClient, CreateSaleDto, SaleFilters, SaleItem } from '@/lib/api-unified'
import { dataTransforms, dataValidations, dataAggregations } from '@/lib/data-utils'

export function useSales(filters?: SaleFilters, options?: { paginated?: boolean; pageSize?: number }) {
  const { paginated = false, pageSize = 20 } = options || {}
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({})
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [cashierFilter, setCashierFilter] = useState<string>('')

  const combinedFilters = useMemo(() => ({
    ...filters,
    ...dateRange,
    ...(statusFilter && { status: statusFilter as any }),
    ...(cashierFilter && { cashierId: cashierFilter }),
  }), [filters, dateRange, statusFilter, cashierFilter])

  // Use paginated hook if requested
  if (paginated) {
    const { usePaginatedSales } = require('./use-paginated-data')
    return usePaginatedSales(filters?.outletId, {
      pageSize,
      filters: combinedFilters,
    })
  }

  const {
    data: sales,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.sales.getAll(combinedFilters),
    {
      cacheKey: `sales-${JSON.stringify(combinedFilters)}`,
      cacheDuration: cacheUtils.durations.short,
      tags: [cacheUtils.tags.sales],
      priority: 'medium',
    }
  )

  // Calculate aggregated data
  const salesStats = useMemo(() => {
    if (!sales || !Array.isArray(sales)) return null

    return {
      totalSales: dataAggregations.calculateTotalSales(sales),
      totalTransactions: sales.length,
      averageTransaction: dataAggregations.calculateAverageTransaction(sales),
      topProducts: dataAggregations.getTopSellingProducts(sales, 5),
      salesByDate: dataAggregations.groupSalesByDate(sales),
    }
  }, [sales])

  const handleDateRangeChange = useCallback((startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate })
  }, [])

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
  }, [])

  const handleCashierFilter = useCallback((cashierId: string) => {
    setCashierFilter(cashierId)
  }, [])

  const clearFilters = useCallback(() => {
    setDateRange({})
    setStatusFilter('')
    setCashierFilter('')
  }, [])

  return {
    sales: sales || [],
    salesStats,
    loading,
    error,
    filters: combinedFilters,
    handleDateRangeChange,
    handleStatusFilter,
    handleCashierFilter,
    clearFilters,
    refetch,
    mutate,
  }
}

export function useSale(id: string) {
  return useApi(
    () => apiClient.sales.getById(id),
    {
      cacheKey: `sale-${id}`,
      immediate: !!id,
    }
  )
}

export function useDailySummary(outletId?: string) {
  return useApi(
    () => apiClient.sales.getDailySummary(outletId),
    {
      cacheKey: `daily-summary-${outletId || 'all'}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )
}

export function useSaleMutations() {
  const createSale = useMutation(
    (saleData: CreateSaleDto) => apiClient.sales.create(saleData),
    {
      invalidateCache: ['sales-', 'daily-summary-', 'weekly-sales-'],
    }
  )

  const validateAndCreateSale = useCallback(async (saleData: CreateSaleDto) => {
    const validation = dataValidations.validateSale(saleData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    return createSale.mutate(saleData)
  }, [createSale])

  return {
    createSale: {
      ...createSale,
      mutate: validateAndCreateSale,
    },
  }
}

// Shopping cart hook for cashier interface
export function useShoppingCart() {
  const [items, setItems] = useState<Array<{
    productId: string
    product: any
    quantity: number
    unitPrice: number
    discount: number
    total: number
  }>>([])

  const addItem = useCallback((product: any, quantity = 1) => {
    setItems(currentItems => {
      const existingItemIndex = currentItems.findIndex(item => item.productId === product.id)
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...currentItems]
        const existingItem = updatedItems[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity
        const newTotal = newQuantity * existingItem.unitPrice - existingItem.discount
        
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          total: newTotal,
        }
        
        return updatedItems
      } else {
        // Add new item
        const newItem = {
          productId: product.id,
          product,
          quantity,
          unitPrice: product.price,
          discount: 0,
          total: quantity * product.price,
        }
        
        return [...currentItems, newItem]
      }
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems(currentItems => currentItems.filter(item => item.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setItems(currentItems => 
      currentItems.map(item => {
        if (item.productId === productId) {
          const newTotal = quantity * item.unitPrice - item.discount
          return {
            ...item,
            quantity,
            total: newTotal,
          }
        }
        return item
      })
    )
  }, [removeItem])

  const updateDiscount = useCallback((productId: string, discount: number) => {
    setItems(currentItems => 
      currentItems.map(item => {
        if (item.productId === productId) {
          const newTotal = item.quantity * item.unitPrice - discount
          return {
            ...item,
            discount,
            total: Math.max(0, newTotal), // Ensure total doesn't go negative
          }
        }
        return item
      })
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  // Calculate totals
  const cartTotals = useMemo(() => {
    const subtotal = dataTransforms.calculateSaleSubtotal(items as SaleItem[])
    const totalDiscount = dataTransforms.calculateSaleDiscount(items as SaleItem[])
    const total = dataTransforms.calculateSaleTotal(items as SaleItem[])

    return {
      subtotal,
      totalDiscount,
      total,
      itemCount: items.reduce((count, item) => count + item.quantity, 0),
    }
  }, [items])

  // Validate cart before checkout
  const validateCart = useCallback(() => {
    const validation = dataValidations.validateSale({ items })
    return validation
  }, [items])

  return {
    items,
    cartTotals,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    clearCart,
    validateCart,
    isEmpty: items.length === 0,
  }
}

// Recent sales hook for quick access
export function useRecentSales(limit = 10, outletId?: string) {
  const filters = useMemo(() => ({
    ...(outletId && { outletId }),
  }), [outletId])

  const { sales: allSales, ...rest } = useSales(filters)

  const recentSales = useMemo(() => {
    if (!allSales || !Array.isArray(allSales)) return []
    
    return [...allSales]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }, [allSales, limit])

  return {
    ...rest,
    sales: recentSales,
  }
}