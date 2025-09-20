'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation } from './use-api'
import { 
  apiClient, 
  PurchaseOrder, 
  CreatePurchaseOrderDto, 
  UpdatePurchaseOrderDto,
  PurchaseOrderStatus,
  PurchaseOrderPriority 
} from '@/lib/api-unified'

export function usePurchaseOrders(outletId?: string) {
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | ''>('')
  const [priorityFilter, setPriorityFilter] = useState<PurchaseOrderPriority | ''>('')
  const [supplierFilter, setSupplierFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'orderDate' | 'expectedDelivery' | 'total' | 'status'>('orderDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const {
    data: purchaseOrders,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.purchaseOrders.getAll(outletId),
    {
      cacheKey: `purchase-orders-${outletId || 'all'}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
    }
  )

  // Filtered and sorted purchase orders
  const filteredOrders = useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) return []

    let filtered = purchaseOrders

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(order => order.priority === priorityFilter)
    }

    // Apply supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(order => 
        order.supplierName.toLowerCase().includes(supplierFilter.toLowerCase())
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'orderDate':
          comparison = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
          break
        case 'expectedDelivery':
          const aDate = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : 0
          const bDate = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : 0
          comparison = aDate - bDate
          break
        case 'total':
          comparison = a.total - b.total
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [purchaseOrders, statusFilter, priorityFilter, supplierFilter, sortBy, sortOrder])

  // Get unique suppliers
  const suppliers = useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) return []
    const supplierSet = new Set(purchaseOrders.map(order => order.supplierName))
    return Array.from(supplierSet).sort()
  }, [purchaseOrders])

  // Calculate purchase order statistics
  const orderStats = useMemo(() => {
    if (!purchaseOrders || !Array.isArray(purchaseOrders)) return null

    const stats = {
      total: purchaseOrders.length,
      pending: 0,
      approved: 0,
      inTransit: 0,
      delivered: 0,
      cancelled: 0,
      totalValue: 0,
      averageValue: 0,
    }

    purchaseOrders.forEach(order => {
      stats.totalValue += order.total
      
      switch (order.status) {
        case 'pending':
          stats.pending++
          break
        case 'approved':
          stats.approved++
          break
        case 'in_transit':
          stats.inTransit++
          break
        case 'delivered':
          stats.delivered++
          break
        case 'cancelled':
          stats.cancelled++
          break
      }
    })

    stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0

    return stats
  }, [purchaseOrders])

  const handleStatusFilter = useCallback((status: PurchaseOrderStatus | '') => {
    setStatusFilter(status)
  }, [])

  const handlePriorityFilter = useCallback((priority: PurchaseOrderPriority | '') => {
    setPriorityFilter(priority)
  }, [])

  const handleSupplierFilter = useCallback((supplier: string) => {
    setSupplierFilter(supplier)
  }, [])

  const handleSort = useCallback((field: 'orderDate' | 'expectedDelivery' | 'total' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const clearFilters = useCallback(() => {
    setStatusFilter('')
    setPriorityFilter('')
    setSupplierFilter('')
    setSortBy('orderDate')
    setSortOrder('desc')
  }, [])

  return {
    orders: filteredOrders,
    allOrders: purchaseOrders || [],
    suppliers,
    orderStats,
    loading,
    error,
    statusFilter,
    priorityFilter,
    supplierFilter,
    sortBy,
    sortOrder,
    handleStatusFilter,
    handlePriorityFilter,
    handleSupplierFilter,
    handleSort,
    clearFilters,
    refetch,
    mutate,
  }
}

export function usePurchaseOrderStatistics(outletId?: string) {
  return useApi(
    () => apiClient.purchaseOrders.getStatistics(outletId),
    {
      cacheKey: `purchase-order-stats-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function usePurchaseOrder(id: string) {
  return useApi(
    () => apiClient.purchaseOrders.getById(id),
    {
      cacheKey: `purchase-order-${id}`,
      cacheDuration: 2 * 60 * 1000, // 2 minutes
      enabled: !!id,
    }
  )
}

export function usePurchaseOrderMutations() {
  const createPurchaseOrder = useMutation(
    (purchaseOrder: CreatePurchaseOrderDto) => apiClient.purchaseOrders.create(purchaseOrder),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-'],
    }
  )

  const updatePurchaseOrder = useMutation(
    ({ id, data }: { id: string; data: UpdatePurchaseOrderDto }) => 
      apiClient.purchaseOrders.update(id, data),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-', 'purchase-order-'],
    }
  )

  const approvePurchaseOrder = useMutation(
    (id: string) => apiClient.purchaseOrders.approve(id),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-', 'purchase-order-'],
    }
  )

  const cancelPurchaseOrder = useMutation(
    (id: string) => apiClient.purchaseOrders.cancel(id),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-', 'purchase-order-'],
    }
  )

  const markAsDelivered = useMutation(
    ({ id, actualDeliveryDate }: { id: string; actualDeliveryDate?: string }) => 
      apiClient.purchaseOrders.markAsDelivered(id, actualDeliveryDate),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-', 'purchase-order-'],
    }
  )

  const deletePurchaseOrder = useMutation(
    (id: string) => apiClient.purchaseOrders.delete(id),
    {
      invalidateCache: ['purchase-orders-', 'purchase-order-stats-'],
    }
  )

  return {
    createPurchaseOrder,
    updatePurchaseOrder,
    approvePurchaseOrder,
    cancelPurchaseOrder,
    markAsDelivered,
    deletePurchaseOrder,
  }
}

// Hook for urgent purchase orders that need attention
export function useUrgentPurchaseOrders(outletId?: string) {
  const { orders, loading, error, refetch } = usePurchaseOrders(outletId)

  const urgentOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return []

    const now = new Date()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)

    return orders.filter(order => {
      // Include orders with urgent priority
      if (order.priority === 'urgent') return true
      
      // Include orders with high priority that are pending approval
      if (order.priority === 'high' && order.status === 'pending') return true
      
      // Include orders that are overdue for delivery
      if (order.expectedDeliveryDate && order.status === 'in_transit') {
        const expectedDate = new Date(order.expectedDeliveryDate)
        if (expectedDate < now) return true
      }
      
      // Include orders that need delivery soon
      if (order.expectedDeliveryDate && order.status === 'approved') {
        const expectedDate = new Date(order.expectedDeliveryDate)
        if (expectedDate <= threeDaysFromNow) return true
      }
      
      return false
    }).sort((a, b) => {
      // Sort by priority and expected delivery date
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
      const aPriority = priorityOrder[a.priority] || 0
      const bPriority = priorityOrder[b.priority] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first
      }
      
      // If same priority, sort by expected delivery date
      const aDate = a.expectedDeliveryDate ? new Date(a.expectedDeliveryDate).getTime() : Infinity
      const bDate = b.expectedDeliveryDate ? new Date(b.expectedDeliveryDate).getTime() : Infinity
      
      return aDate - bDate // Earlier dates first
    })
  }, [orders])

  return {
    urgentOrders,
    urgentCount: urgentOrders.length,
    loading,
    error,
    refetch,
  }
}