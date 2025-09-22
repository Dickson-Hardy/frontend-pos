'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation } from './use-api'
import { apiClient, InventoryAdjustment } from '@/lib/api-unified'
import { dataTransforms, dataValidations, dataAggregations } from '@/lib/data-utils'

export function useInventory(outletId?: string) {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'value' | 'status'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const {
    data: inventoryItems,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => {
      console.log('useInventory: Fetching items for outlet:', outletId)
      return apiClient.inventory.getItems(outletId)
    },
    {
      cacheKey: `inventory-items-${outletId || 'all'}`,
      cacheDuration: 1 * 60 * 1000, // 1 minute
    }
  )

  console.log('useInventory: Raw data:', inventoryItems)
  console.log('useInventory: Loading:', loading)
  console.log('useInventory: Error:', error)

  // Filtered and sorted inventory items
  const filteredItems = useMemo(() => {
    if (!inventoryItems || !Array.isArray(inventoryItems)) return []

    let filtered = inventoryItems

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => 
        dataTransforms.getStockStatus(item) === statusFilter
      )
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(item => 
        item.category === categoryFilter
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'stock':
          comparison = (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0)
          break
        case 'value':
          comparison = dataTransforms.calculateStockValue(a) - dataTransforms.calculateStockValue(b)
          break
        case 'status':
          const statusA = dataTransforms.getStockStatus(a)
          const statusB = dataTransforms.getStockStatus(b)
          comparison = statusA.localeCompare(statusB)
          break
        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [inventoryItems, statusFilter, categoryFilter, sortBy, sortOrder])

  // Get unique categories
  const categories = useMemo(() => {
    if (!inventoryItems || !Array.isArray(inventoryItems)) return []
    const categorySet = new Set(inventoryItems.map(item => item.category))
    return Array.from(categorySet).sort()
  }, [inventoryItems])

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    if (!inventoryItems || !Array.isArray(inventoryItems)) return null

    const totalValue = dataAggregations.calculateTotalInventoryValue(inventoryItems)
    const lowStockItems = dataAggregations.getLowStockItems(inventoryItems)
    const outOfStockItems = dataAggregations.getOutOfStockItems(inventoryItems)
    const categoryBreakdown = dataAggregations.groupItemsByCategory(inventoryItems)

    return {
      totalItems: inventoryItems.length,
      totalValue,
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      lowStockItems,
      outOfStockItems,
      categoryBreakdown: Object.entries(categoryBreakdown).map(([category, items]) => ({
        category,
        itemCount: items.length,
        totalValue: dataAggregations.calculateTotalInventoryValue(items),
      })),
    }
  }, [inventoryItems])

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
  }, [])

  const handleCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category)
  }, [])

  const handleSort = useCallback((field: 'name' | 'stock' | 'value' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const clearFilters = useCallback(() => {
    setStatusFilter('')
    setCategoryFilter('')
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  return {
    items: filteredItems,
    allItems: inventoryItems || [],
    categories,
    inventoryStats,
    loading,
    error,
    statusFilter,
    categoryFilter,
    sortBy,
    sortOrder,
    handleStatusFilter,
    handleCategoryFilter,
    handleSort,
    clearFilters,
    refetch,
    mutate,
  }
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
  const [sortBy, setSortBy] = useState<'expiryDate' | 'quantity' | 'product'>('expiryDate')
  const [showExpiringSoon, setShowExpiringSoon] = useState(false)

  const {
    data: batches,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.inventory.getBatches(outletId),
    {
      cacheKey: `inventory-batches-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Filtered and sorted batches
  const filteredBatches = useMemo(() => {
    if (!batches || !Array.isArray(batches)) return []

    let filtered = batches

    // Filter expiring soon (within 30 days)
    if (showExpiringSoon) {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
      
      filtered = filtered.filter(batch => 
        new Date(batch.expiryDate) <= thirtyDaysFromNow
      )
    }

    // Sort batches
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'expiryDate':
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        case 'quantity':
          return b.quantity - a.quantity
        case 'product':
          return a.product.name.localeCompare(b.product.name)
        default:
          return 0
      }
    })

    return filtered
  }, [batches, showExpiringSoon, sortBy])

  // Calculate batch statistics
  const batchStats = useMemo(() => {
    if (!batches || !Array.isArray(batches)) return null

    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const expiredBatches = batches.filter(batch => new Date(batch.expiryDate) < now)
    const expiringSoonBatches = batches.filter(batch => {
      const expiryDate = new Date(batch.expiryDate)
      return expiryDate >= now && expiryDate <= thirtyDaysFromNow
    })

    return {
      totalBatches: batches.length,
      expiredCount: expiredBatches.length,
      expiringSoonCount: expiringSoonBatches.length,
      expiredBatches,
      expiringSoonBatches,
    }
  }, [batches])

  const handleSort = useCallback((field: 'expiryDate' | 'quantity' | 'product') => {
    setSortBy(field)
  }, [])

  const toggleExpiringSoonFilter = useCallback(() => {
    setShowExpiringSoon(prev => !prev)
  }, [])

  return {
    batches: filteredBatches,
    allBatches: batches || [],
    batchStats,
    loading,
    error,
    sortBy,
    showExpiringSoon,
    handleSort,
    toggleExpiringSoonFilter,
    refetch,
    mutate,
  }
}

export function useInventoryMutations() {
  const adjustInventory = useMutation(
    (adjustment: InventoryAdjustment) => apiClient.inventory.adjust(adjustment),
    {
      invalidateCache: ['inventory-items-', 'inventory-stats-'],
    }
  )

  const validateAndAdjustInventory = useCallback(async (adjustment: InventoryAdjustment) => {
    const validation = dataValidations.validateInventoryAdjustment(adjustment)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    
    const result = await adjustInventory.mutate(adjustment)
    
    // Broadcast real-time update if available
    try {
      const { useInventoryRealTime } = await import('@/contexts/real-time-context')
      const { broadcastInventoryUpdate } = useInventoryRealTime()
      broadcastInventoryUpdate({
        productId: adjustment.productId,
        type: 'adjustment',
        change: adjustment.adjustedQuantity,
        reason: adjustment.reason,
      })
    } catch (error) {
      // Real-time context not available, continue without broadcasting
    }
    
    return result
  }, [adjustInventory])

  return {
    adjustInventory: {
      ...adjustInventory,
      mutate: validateAndAdjustInventory,
    },
  }
}

// Hook for low stock alerts
export function useLowStockAlerts(outletId?: string) {
  const { inventoryStats, loading, error, refetch } = useInventory(outletId)

  const alerts = useMemo(() => {
    if (!inventoryStats) return []

    const alerts: Array<{
      id: string
      type: 'low_stock' | 'out_of_stock'
      severity: 'warning' | 'error'
      title: string
      message: string
      productId: string
      item: any
    }> = []

    // Low stock alerts
    inventoryStats.lowStockItems.forEach(item => {
      alerts.push({
        id: `low-stock-${item.id}`,
        type: 'low_stock' as const,
        severity: 'warning' as const,
        title: 'Low Stock Alert',
        message: `${item.name} is running low (${item.stockQuantity ?? 0} remaining)`,
        productId: item.id,
        item,
      })
    })

    // Out of stock alerts
    inventoryStats.outOfStockItems.forEach(item => {
      alerts.push({
        id: `out-of-stock-${item.id}`,
        type: 'out_of_stock' as const,
        severity: 'error' as const,
        title: 'Out of Stock Alert',
        message: `${item.name} is out of stock`,
        productId: item.id,
        item,
      })
    })

    return alerts.sort((a, b) => {
      // Sort by severity: error first, then warning
      if (a.severity === 'error' && b.severity === 'warning') return -1
      if (a.severity === 'warning' && b.severity === 'error') return 1
      return 0
    })
  }, [inventoryStats])

  return {
    alerts,
    alertCount: alerts.length,
    lowStockCount: inventoryStats?.lowStockCount || 0,
    outOfStockCount: inventoryStats?.outOfStockCount || 0,
    loading,
    error,
    refetch,
  }
}

// Hook for expiry alerts
export function useExpiryAlerts(outletId?: string) {
  const { batchStats, loading, error, refetch } = useInventoryBatches(outletId)

  const alerts = useMemo(() => {
    if (!batchStats) return []

    const alerts: Array<{
      id: string
      type: 'expired' | 'expiring_soon'
      severity: 'warning' | 'error'
      title: string
      message: string
      batchId: string
      batch: any
      daysToExpiry?: number
    }> = []

    // Expired batch alerts
    batchStats.expiredBatches.forEach(batch => {
      alerts.push({
        id: `expired-${batch.id}`,
        type: 'expired' as const,
        severity: 'error' as const,
        title: 'Expired Batch Alert',
        message: `Batch ${batch.batchNumber} of ${batch.product.name} has expired`,
        batchId: batch.id,
        batch,
      })
    })

    // Expiring soon alerts
    batchStats.expiringSoonBatches.forEach(batch => {
      const daysToExpiry = Math.ceil(
        (new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      
      alerts.push({
        id: `expiring-${batch.id}`,
        type: 'expiring_soon' as const,
        severity: 'warning' as const,
        title: 'Expiring Soon Alert',
        message: `Batch ${batch.batchNumber} of ${batch.product.name} expires in ${daysToExpiry} days`,
        batchId: batch.id,
        batch,
        daysToExpiry,
      })
    })

    return alerts.sort((a, b) => {
      // Sort by severity first, then by days to expiry
      if (a.severity === 'error' && b.severity === 'warning') return -1
      if (a.severity === 'warning' && b.severity === 'error') return 1
      
      if (a.type === 'expiring_soon' && b.type === 'expiring_soon') {
        return (a.daysToExpiry || 0) - (b.daysToExpiry || 0)
      }
      
      return 0
    })
  }, [batchStats])

  return {
    alerts,
    alertCount: alerts.length,
    expiredCount: batchStats?.expiredCount || 0,
    expiringSoonCount: batchStats?.expiringSoonCount || 0,
    loading,
    error,
    refetch,
  }
}