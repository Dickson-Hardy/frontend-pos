'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { apiClient, ApiError } from '@/lib/api-unified'
import { cacheManager, cacheUtils } from '@/lib/cache-manager'
import { apiOptimizationUtils, RequestPriority } from '@/lib/api-optimization'
import { id } from 'date-fns/locale'

interface UseApiOptions {
  immediate?: boolean
  cacheKey?: string
  cacheDuration?: number // in milliseconds
  retryAttempts?: number
  retryDelay?: number
  priority?: RequestPriority
  tags?: string[]
  deduplicate?: boolean
  prefetchRelated?: boolean
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
  refetch: () => Promise<void>
  mutate: (newData: T | null) => void
  reset: () => void
}

export function useApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    immediate = true,
    cacheKey,
    cacheDuration = cacheUtils.durations.medium,
    retryAttempts = 3,
    retryDelay = 1000,
    priority = 'medium',
    tags = [],
    deduplicate = true,
    prefetchRelated = false,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const retryCount = useRef(0)
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
    }
  }, [])

  const fetchData = useCallback(async () => {
    if (!isMounted.current) return

    // Check cache first
    if (cacheKey) {
      const cachedData = cacheManager.get<T>(cacheKey)
      if (cachedData) {
        setData(cachedData)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const result = await apiOptimizationUtils.createOptimizedCall(
        cacheKey || `api-call-${Date.now()}`,
        apiCall,
        {
          priority,
          cacheDuration,
          tags,
          deduplicate,
        }
      )

      if (!isMounted.current) return

      setData(result)
      setError(null)
      retryCount.current = 0

      // Prefetch related data if enabled
      if (prefetchRelated && cacheKey) {
        const [entity, id, outletId] = cacheKey.split('-')
        if (entity && id) {
          apiOptimizationUtils.prefetchRelated(entity, id, outletId)
        }
      }
    } catch (err) {
      if (!isMounted.current) return

      const apiError = err as ApiError
      
      if (retryCount.current < retryAttempts && shouldRetry(apiError)) {
        retryCount.current++
        setTimeout(() => fetchData(), retryDelay * retryCount.current)
        return
      }
      
      setError(apiError)
      retryCount.current = 0
    } finally {
      if (isMounted.current) {
        setLoading(false)
      }
    }
  }, [apiCall, cacheKey, cacheDuration, retryAttempts, retryDelay, priority, tags, deduplicate, prefetchRelated])

  const shouldRetry = (error: ApiError): boolean => {
    // Retry on network errors or 5xx server errors
    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'TIMEOUT' ||
      (error.code.startsWith('5') && error.code !== '501') // Don't retry on Not Implemented
    )
  }

  const mutate = useCallback((newData: T | null) => {
    setData(newData)
    if (cacheKey && newData) {
      cacheManager.set(cacheKey, newData, {
        duration: cacheDuration,
        tags,
      })
    }
  }, [cacheKey, cacheDuration, tags])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
    retryCount.current = 0
    if (cacheKey) {
      cacheManager.delete(cacheKey)
    }
  }, [cacheKey])

  const refetch = useCallback(async () => {
    if (cacheKey) {
      cacheManager.delete(cacheKey)
    }
    await fetchData()
  }, [fetchData, cacheKey])

  useEffect(() => {
    if (immediate) {
      fetchData()
    }
  }, [fetchData, immediate])

  return {
    data,
    loading,
    error,
    refetch,
    mutate,
    reset,
  }
}

// Specialized hooks for different data types
export function useProducts(outletId?: string) {
  return useApi(
    () => apiClient.products.getAll(outletId),
    {
      cacheKey: `products-${outletId || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )
}

export function useProduct(id: string) {
  return useApi(
    () => apiClient.products.getById(id),
    {
      cacheKey: `product-${id}`,
      immediate: !!id,
    }
  )
}

export function useProductSearch(query: string, outletId?: string) {
  return useApi(
    () => apiClient.products.search(query, outletId),
    {
      immediate: !!query && query.length > 2,
      cacheKey: `product-search-${query}-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useSales(filters?: any) {
  return useApi(
    () => apiClient.sales.getAll(filters),
    {
      cacheKey: `sales-${JSON.stringify(filters || {})}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )
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

export function useInventoryItems(outletId?: string) {
  return useApi(
    () => apiClient.inventory.getItems(outletId),
    {
      cacheKey: `inventory-items-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useInventoryStats(outletId?: string) {
  return useApi(
    () => apiClient.inventory.getStats(outletId),
    {
      cacheKey: `inventory-stats-${outletId || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )
}

export function useInventoryBatches(outletId?: string) {
  return useApi(
    () => apiClient.inventory.getBatches(outletId),
    {
      cacheKey: `inventory-batches-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useUsers(outletId?: string) {
  return useApi(
    () => apiClient.users.getAll(outletId),
    {
      cacheKey: `users-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useUser(id: string) {
  return useApi(
    () => apiClient.users.getById(id),
    {
      cacheKey: `user-${id}`,
      immediate: !!id,
    }
  )
}

export function useOutlets() {
  return useApi(
    () => apiClient.outlets.getAll(),
    {
      cacheKey: 'outlets',
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export function useOutlet(id: string) {
  return useApi(
    () => apiClient.outlets.getById(id),
    {
      cacheKey: `outlet-${id}`,
      immediate: !!id,
    }
  )
}

export function useSalesReport(params: any) {
  return useApi(
    () => apiClient.reports.getSales(params),
    {
      cacheKey: `sales-report-${JSON.stringify(params)}`,
      immediate: !!(params.startDate && params.endDate),
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useWeeklySalesReport(outletId?: string) {
  return useApi(
    () => apiClient.reports.getWeeklySales(outletId),
    {
      cacheKey: `weekly-sales-${outletId || 'all'}`,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export function useInventoryReport(outletId?: string) {
  return useApi(
    () => apiClient.reports.getInventory(outletId),
    {
      cacheKey: `inventory-report-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useStaffPerformanceReport(params: any) {
  return useApi(
    () => apiClient.reports.getStaffPerformance(params),
    {
      cacheKey: `staff-performance-${JSON.stringify(params)}`,
      immediate: !!(params.startDate && params.endDate),
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useShifts() {
  return useApi(
    () => apiClient.shifts.getAll(),
    {
      cacheKey: 'shifts',
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useShiftStats() {
  return useApi(
    () => apiClient.shifts.getStats(),
    {
      cacheKey: 'shift-stats',
      cacheDuration: 30 * 1000, // 30 seconds
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

// Mutation hooks for create/update/delete operations
export function useMutation<T, P>(
  mutationFn: (params: P) => Promise<T>,
  options: {
    onSuccess?: (data: T, params: P) => void
    onError?: (error: ApiError, params: P) => void
    invalidateCache?: string[]
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  const mutate = useCallback(async (params: P): Promise<T> => {
    setLoading(true)
    setError(null)

    try {
      const result = await mutationFn(params)
      
      // Invalidate specified cache keys
      if (options.invalidateCache) {
        options.invalidateCache.forEach(key => cacheManager.delete(key))
      }

      options.onSuccess?.(result, params)
      return result
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError)
      options.onError?.(apiError, params)
      throw apiError
    } finally {
      setLoading(false)
    }
  }, [mutationFn, options])

  return {
    mutate,
    loading,
    error,
    reset: () => {
      setError(null)
      setLoading(false)
    },
  }
}

// Enhanced product hooks
export function useLowStockProducts(outletId?: string) {
  return useApi(
    () => apiClient.products.getLowStock(outletId),
    {
      cacheKey: `low-stock-products-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useProductByBarcode(barcode: string) {
  return useApi(
    () => apiClient.products.getByBarcode(barcode),
    {
      cacheKey: `product-barcode-${barcode}`,
      immediate: !!barcode && barcode.length >= 8,
    }
  )
}

// Enhanced sales hooks
export function useRecentTransactions(outletId?: string, limit = 10) {
  return useApi(
    () => apiClient.sales.getAll({ outletId, limit } as any),
    {
      cacheKey: `recent-transactions-${outletId || 'all'}-${limit}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )
}

export function useSalesByDateRange(startDate: string, endDate: string, outletId?: string) {
  return useApi(
    () => apiClient.sales.getAll({ startDate, endDate, outletId }),
    {
      cacheKey: `sales-range-${startDate}-${endDate}-${outletId || 'all'}`,
      immediate: !!(startDate && endDate),
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )
}

// Enhanced inventory hooks
export function useInventoryAdjustments(outletId?: string) {
  return useApi(
    () => apiClient.inventory.getAdjustments(outletId),
    {
      cacheKey: `inventory-adjustments-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useExpiringBatches(outletId?: string, daysAhead = 30) {
  return useApi(
    async () => {
      const batches = await apiClient.inventory.getBatches(outletId)
      const now = new Date()
      const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)
      
      return batches.filter((batch: any) => {
        const expiryDate = new Date(batch.expiryDate)
        return expiryDate <= futureDate && expiryDate > now
      })
    },
    {
      cacheKey: `expiring-batches-${outletId || 'all'}-${daysAhead}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// Specialized report hooks
export function useTodaysSales(outletId?: string) {
  const today = new Date().toISOString().split('T')[0]
  
  return useApi(
    () => apiClient.reports.getSales({ 
      startDate: today, 
      endDate: today, 
      outletId 
    }),
    {
      cacheKey: `todays-sales-${outletId || 'all'}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )
}

export function useMonthlyReport(month: string, year: string, outletId?: string) {
  const startDate = `${year}-${month.padStart(2, '0')}-01`
  const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0]
  
  return useApi(
    () => apiClient.reports.getSales({ startDate, endDate, outletId }),
    {
      cacheKey: `monthly-report-${year}-${month}-${outletId || 'all'}`,
      immediate: !!(month && year),
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  )
}

// Frequently sold products hook for cashier quick actions
export function useFrequentlysoldProducts(outletId?: string, limit = 8) {
  return useApi(
    async () => {
      // Get recent sales to determine frequently sold items
      const recentSales = await apiClient.sales.getAll({ 
        outletId,
        limit: 100 // Get last 100 sales to analyze
      } as any)
      
      // Count product frequencies
      const productCounts = new Map<string, { product: any; count: number }>()
      
      recentSales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
          const existing = productCounts.get(item.productId)
          if (existing) {
            existing.count += item.quantity
          } else {
            productCounts.set(item.productId, {
              product: item.product,
              count: item.quantity
            })
          }
        })
      })
      
      // Sort by frequency and return top items
      return Array.from(productCounts.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map(item => item.product)
    },
    {
      cacheKey: `frequently-sold-${outletId || 'all'}-${limit}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// Staff performance hooks
export function useStaffSalesPerformance(staffId?: string, outletId?: string) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  
  return useApi(
    () => apiClient.reports.getStaffPerformance({
      startDate: weekAgo,
      endDate: today,
      staffId,
      outletId
    }),
    {
      cacheKey: `staff-performance-${staffId || 'all'}-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

// Audit and system hooks
export function useAuditLogs(outletId?: string, limit = 50) {
  return useApi(
    async () => {
      // This would need to be implemented in the backend
      // For now, return mock structure that matches expected audit log format
      return []
    },
    {
      cacheKey: `audit-logs-${outletId || 'all'}-${limit}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )
}

export function useSystemMetrics(outletId?: string) {
  return useApi(
    async () => {
      // Aggregate various system metrics
      const [inventoryStats, shiftStats, todaysSales] = await Promise.all([
        apiClient.inventory.getStats(outletId),
        apiClient.shifts.getStats(),
        apiClient.sales.getDailySummary(outletId)
      ])
      
      return {
        inventory: inventoryStats,
        shifts: shiftStats,
        sales: todaysSales
      }
    },
    {
      cacheKey: `system-metrics-${outletId || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )
}

// Specialized mutation hooks with cache invalidation
export function useCreateProduct(outletId?: string) {
  return useMutation(
    (productData: any) => apiClient.products.create(productData),
    {
      invalidateCache: [
        `products-${outletId || 'all'}`,
        `inventory-items-${outletId || 'all'}`,
        `inventory-stats-${outletId || 'all'}`
      ]
    }
  )
}

export function useUpdateProduct(outletId?: string) {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.products.update(id, data),
    {
      invalidateCache: [
        `products-${outletId || 'all'}`,
        `product-${id}`,
        `inventory-items-${outletId || 'all'}`
      ]
    }
  )
}

export function useDeleteProduct(outletId?: string) {
  return useMutation(
    (productId: string) => {
      // Store productId for cache invalidation
      const deleteProduct = async () => {
        await apiClient.products.delete(productId)
        return productId
      }
      return deleteProduct()
    },
    {
      invalidateCache: [
        `products-${outletId || 'all'}`,
        'product-',
        `inventory-items-${outletId || 'all'}`
      ]
    }
  )
}

export function useCreateSale(outletId?: string) {
  return useMutation(
    (saleData: any) => apiClient.sales.create(saleData),
    {
      invalidateCache: [
        `sales-${JSON.stringify({ outletId })}`,
        `recent-transactions-${outletId || 'all'}`,
        `daily-summary-${outletId || 'all'}`,
        `todays-sales-${outletId || 'all'}`,
        `inventory-items-${outletId || 'all'}`,
        `inventory-stats-${outletId || 'all'}`
      ]
    }
  )
}

export function useInventoryAdjust(outletId?: string) {
  return useMutation(
    (adjustmentData: any) => apiClient.inventory.adjust(adjustmentData),
    {
      invalidateCache: [
        `inventory-items-${outletId || 'all'}`,
        `inventory-stats-${outletId || 'all'}`,
        `inventory-adjustments-${outletId || 'all'}`,
        `low-stock-products-${outletId || 'all'}`
      ]
    }
  )
}

export function useCreateUser(outletId?: string) {
  return useMutation(
    (userData: any) => apiClient.users.create(userData),
    {
      invalidateCache: [
        `users-${outletId || 'all'}`,
        'users-all'
      ]
    }
  )
}

export function useUpdateUser(outletId?: string) {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.users.update(id, data),
    {
      invalidateCache: [
        `users-${outletId || 'all'}`,
        `user-${id}`,
        'users-all'
      ]
    }
  )
}

export function useDeleteUser(outletId?: string) {
  return useMutation(
    (userId: string) => {
      const deleteUser = async () => {
        await apiClient.users.delete(userId)
        return userId
      }
      return deleteUser()
    },
    {
      invalidateCache: [
        `users-${outletId || 'all'}`,
        'user-',
        'users-all'
      ]
    }
  )
}

export function useStartShift() {
  return useMutation(
    (shiftData: any) => apiClient.shifts.start(shiftData),
    {
      invalidateCache: [
        'shifts',
        'shift-stats'
      ]
    }
  )
}

export function useEndShift() {
  return useMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.shifts.end(id, data),
    {
      invalidateCache: [
        'shifts',
        'shift-stats'
      ]
    }
  )
}

// Enhanced cache management utilities
export { cacheUtils } from '@/lib/cache-manager'