'use client'

// Re-export specific hooks to avoid conflicts
export { 
  useApi, 
  useMutation,
  cacheUtils,
  // Basic hooks from use-api
  useUsers,
  useUser,
  useOutlets,
  useOutlet,
  useShifts,
  useShiftStats,
  // Mutation hooks
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateSale,
  useInventoryAdjust,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useStartShift,
  useEndShift,
} from './use-api'

// Enhanced hooks from specialized files
export {
  useProducts,
  useProduct,
  useProductSearch,
  useProductMutations,
  useLowStockProducts,
  useProductByBarcode,
} from './use-products'

export {
  useSales,
  useSale,
  useDailySummary,
  useSaleMutations,
  useShoppingCart,
  useRecentSales,
} from './use-sales'

export {
  useInventory,
  useInventoryStats,
  useInventoryBatches,
  useInventoryMutations,
  useLowStockAlerts,
  useExpiryAlerts,
} from './use-inventory'

export {
  useSalesReport,
  useWeeklySalesReport,
  useInventoryReport,
  useStaffPerformanceReport,
  useTodaysReport,
  useWeeklyReport,
  useMonthlyReport,
  useTaxReport,
  useSettlementReport,
  useSalesAnalytics,
  useInventoryAnalytics,
} from './use-reports'

// Additional utility hooks for common data operations
import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation } from './use-api'
import { apiClient } from '@/lib/api-unified'
import { dataTransforms, dataValidations } from '@/lib/data-utils'

// Combined dashboard data hook
export function useDashboardData(outletId?: string) {
  const { data: todaysSales, loading: salesLoading, error: salesError } = useApi(
    () => apiClient.sales.getDailySummary(outletId),
    {
      cacheKey: `dashboard-sales-${outletId || 'all'}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )

  const { data: inventoryStats, loading: inventoryLoading, error: inventoryError } = useApi(
    () => apiClient.inventory.getStats(outletId),
    {
      cacheKey: `dashboard-inventory-${outletId || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )

  const { data: lowStockProducts, loading: lowStockLoading, error: lowStockError } = useApi(
    () => apiClient.products.getLowStock(outletId),
    {
      cacheKey: `dashboard-low-stock-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )

  const { data: shiftStats, loading: shiftLoading, error: shiftError } = useApi(
    () => apiClient.shifts.getStats(),
    {
      cacheKey: 'dashboard-shifts',
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )

  const loading = salesLoading || inventoryLoading || lowStockLoading || shiftLoading
  const error = salesError || inventoryError || lowStockError || shiftError

  const dashboardData = useMemo(() => {
    if (!todaysSales || !inventoryStats || !lowStockProducts || !shiftStats) {
      return null
    }

    return {
      sales: todaysSales,
      inventory: inventoryStats,
      lowStockProducts,
      shifts: shiftStats,
      alerts: {
        lowStock: Array.isArray(lowStockProducts) ? lowStockProducts.length : 0,
        outOfStock: (inventoryStats as any)?.outOfStockCount || 0,
        activeShifts: (shiftStats as any)?.activeShifts || 0,
      },
    }
  }, [todaysSales, inventoryStats, lowStockProducts, shiftStats])

  return {
    data: dashboardData,
    loading,
    error,
    refetch: useCallback(async () => {
      // This would trigger refetch of all dashboard data
      // Implementation would depend on how the individual hooks expose refetch
    }, []),
  }
}

// Search across multiple data types
export function useGlobalSearch(query: string, outletId?: string) {
  const [searchType, setSearchType] = useState<'all' | 'products' | 'sales' | 'users'>('all')

  const { data: productResults, loading: productsLoading } = useApi(
    () => apiClient.products.search(query, outletId),
    {
      immediate: !!query && query.length > 2 && (searchType === 'all' || searchType === 'products'),
      cacheKey: `global-search-products-${query}-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )

  const { data: salesResults, loading: salesLoading } = useApi(
    () => apiClient.sales.getAll({ 
      outletId,
      // Add search functionality to sales API if needed
    }),
    {
      immediate: !!query && query.length > 2 && (searchType === 'all' || searchType === 'sales'),
      cacheKey: `global-search-sales-${query}-${outletId || 'all'}`,
      cacheDuration: 30 * 1000, // 30 seconds
    }
  )

  const { data: userResults, loading: usersLoading } = useApi(
    () => apiClient.users.getAll(outletId),
    {
      immediate: !!query && query.length > 2 && (searchType === 'all' || searchType === 'users'),
      cacheKey: `global-search-users-${query}-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  const searchResults = useMemo(() => {
    if (!query || query.length < 3) return null

    const results = {
      products: Array.isArray(productResults) ? productResults : [],
      sales: Array.isArray(salesResults) ? salesResults.filter((sale: any) => 
        sale.saleNumber.toLowerCase().includes(query.toLowerCase()) ||
        sale.cashier.firstName.toLowerCase().includes(query.toLowerCase()) ||
        sale.cashier.lastName.toLowerCase().includes(query.toLowerCase())
      ) : [],
      users: Array.isArray(userResults) ? userResults.filter((user: any) =>
        user.firstName.toLowerCase().includes(query.toLowerCase()) ||
        user.lastName.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase())
      ) : [],
    }

    const totalResults = results.products.length + results.sales.length + results.users.length

    return {
      ...results,
      totalResults,
      hasResults: totalResults > 0,
    }
  }, [query, productResults, salesResults, userResults])

  const loading = productsLoading || salesLoading || usersLoading

  return {
    results: searchResults,
    loading,
    searchType,
    setSearchType,
  }
}

// Bulk operations hook
export function useBulkOperations() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [operationType, setOperationType] = useState<'delete' | 'update' | 'export'>('delete')

  const bulkDelete = useMutation(
    async (items: { type: 'products' | 'users' | 'sales'; ids: string[] }) => {
      const promises = items.ids.map(id => {
        switch (items.type) {
          case 'products':
            return apiClient.products.delete(id)
          case 'users':
            return apiClient.users.delete(id)
          default:
            throw new Error(`Bulk delete not supported for ${items.type}`)
        }
      })
      return Promise.all(promises)
    },
    {
      invalidateCache: ['products-', 'users-', 'inventory-'],
    }
  )

  const bulkUpdate = useMutation(
    async (items: { type: 'products' | 'users'; updates: Array<{ id: string; data: any }> }) => {
      const promises = items.updates.map(({ id, data }) => {
        switch (items.type) {
          case 'products':
            return apiClient.products.update(id, data)
          case 'users':
            return apiClient.users.update(id, data)
          default:
            throw new Error(`Bulk update not supported for ${items.type}`)
        }
      })
      return Promise.all(promises)
    },
    {
      invalidateCache: ['products-', 'users-', 'inventory-'],
    }
  )

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }, [])

  const selectAll = useCallback((ids: string[]) => {
    setSelectedItems(ids)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedItems([])
  }, [])

  const isSelected = useCallback((id: string) => {
    return selectedItems.includes(id)
  }, [selectedItems])

  return {
    selectedItems,
    operationType,
    setOperationType,
    selectItem,
    selectAll,
    clearSelection,
    isSelected,
    bulkDelete,
    bulkUpdate,
    hasSelection: selectedItems.length > 0,
    selectionCount: selectedItems.length,
  }
}

// Data synchronization hook for real-time updates
export function useDataSync(outletId?: string) {
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle')

  const syncData = useCallback(async () => {
    setSyncStatus('syncing')
    try {
      // Trigger refetch of critical data
      await Promise.all([
        apiClient.sales.getDailySummary(outletId),
        apiClient.inventory.getStats(outletId),
        apiClient.products.getLowStock(outletId),
        apiClient.shifts.getStats(),
      ])
      
      setLastSync(new Date())
      setSyncStatus('idle')
    } catch (error) {
      setSyncStatus('error')
      console.error('Data sync failed:', error)
    }
  }, [outletId])

  // Auto-sync every 5 minutes
  const autoSync = useCallback(() => {
    const interval = setInterval(syncData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [syncData])

  return {
    lastSync,
    syncStatus,
    syncData,
    autoSync,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  }
}

// Form data validation hook
export function useFormValidation<T>(
  initialData: T,
  validationRules: (data: T) => { isValid: boolean; errors: Record<string, string> }
) {
  const [data, setData] = useState<T>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validate = useCallback(() => {
    const validation = validationRules(data)
    setErrors(validation.errors)
    return validation.isValid
  }, [data, validationRules])

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Clear error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  const reset = useCallback(() => {
    setData(initialData)
    setErrors({})
    setTouched({})
  }, [initialData])

  const isFieldTouched = useCallback((field: keyof T) => {
    return touched[field as string] || false
  }, [touched])

  const getFieldError = useCallback((field: keyof T) => {
    return errors[field as string] || ''
  }, [errors])

  return {
    data,
    errors,
    touched,
    validate,
    updateField,
    reset,
    isFieldTouched,
    getFieldError,
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
  }
}

// Export utility functions for data transformations
export { dataTransforms, dataValidations } from '@/lib/data-utils'