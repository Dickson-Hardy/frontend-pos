'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useApi } from './use-api'
import { PaginationState, paginateData, PaginationResult } from '@/lib/pagination-utils'
import { cacheUtils } from '@/lib/cache-manager'
import { apiOptimizationUtils } from '@/lib/api-optimization'

export interface UsePaginatedDataOptions {
  pageSize?: number
  initialPage?: number
  cacheKey?: string
  cacheDuration?: number
  serverSide?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  searchQuery?: string
  filters?: Record<string, any>
  prefetchNextPage?: boolean
  tags?: string[]
}

export interface UsePaginatedDataResult<T> {
  data: T[]
  pagination: PaginationResult<T>['pagination']
  loading: boolean
  error: any
  // Pagination controls
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  setPageSize: (size: number) => void
  // Sorting and filtering
  setSort: (field: string, order?: 'asc' | 'desc') => void
  setSearch: (query: string) => void
  setFilter: (key: string, value: any) => void
  setFilters: (filters: Record<string, any>) => void
  clearFilters: () => void
  // Data management
  refetch: () => Promise<void>
  refresh: () => void
  // State
  paginationState: PaginationState
}

export function usePaginatedData<T>(
  fetcher: (params: any) => Promise<T[] | { data: T[]; total: number }>,
  options: UsePaginatedDataOptions = {}
): UsePaginatedDataResult<T> {
  const {
    pageSize = 20,
    initialPage = 1,
    cacheKey,
    cacheDuration = cacheUtils.durations.medium,
    serverSide = false,
    sortBy,
    sortOrder = 'asc',
    searchQuery = '',
    filters = {},
    prefetchNextPage = true,
    tags = [],
  } = options

  // Initialize pagination state
  const [paginationState] = useState(() => new PaginationState({
    page: initialPage,
    pageSize,
    sortBy,
    sortOrder,
    search: searchQuery,
    filters,
  }))

  // Local state for client-side pagination
  const [allData, setAllData] = useState<T[]>([])
  const [forceRefresh, setForceRefresh] = useState(0)

  // Generate cache key based on current state
  const currentCacheKey = useMemo(() => {
    if (!cacheKey) return undefined
    
    const state = paginationState.getState()
    const keyParts = [
      cacheKey,
      serverSide ? state.page : 'all',
      state.pageSize,
      state.sortBy,
      state.sortOrder,
      state.search,
      JSON.stringify(state.filters),
      forceRefresh, // Include to force cache invalidation on refresh
    ].filter(Boolean)
    
    return keyParts.join('-')
  }, [cacheKey, serverSide, paginationState, forceRefresh])

  // API call with pagination parameters
  const apiCall = useCallback(async () => {
    const params = serverSide ? paginationState.getApiParams() : {}
    const result = await fetcher(params)
    
    if (Array.isArray(result)) {
      // Simple array response
      if (serverSide) {
        return { data: result, total: result.length }
      } else {
        setAllData(result)
        return { data: result, total: result.length }
      }
    } else {
      // Response with pagination info
      if (!serverSide) {
        setAllData(result.data)
      }
      return result
    }
  }, [fetcher, serverSide, paginationState])

  // Use the enhanced API hook
  const {
    data: apiData,
    loading,
    error,
    refetch: apiRefetch,
  } = useApi(apiCall, {
    cacheKey: currentCacheKey,
    cacheDuration,
    tags,
    priority: 'medium',
    immediate: true,
  })

  // Update pagination total when data changes
  useEffect(() => {
    if (apiData && serverSide) {
      paginationState.setTotal(apiData.total)
    } else if (allData.length > 0 && !serverSide) {
      paginationState.setTotal(allData.length)
    }
  }, [apiData, allData, serverSide, paginationState])

  // Calculate paginated data for client-side pagination
  const paginatedResult = useMemo(() => {
    if (serverSide && apiData) {
      // Server-side pagination - data is already paginated
      return {
        data: apiData.data,
        pagination: {
          ...paginationState.getState(),
          total: apiData.total,
          totalPages: Math.ceil(apiData.total / paginationState.getPageSize()),
        },
      }
    } else if (!serverSide && allData.length > 0) {
      // Client-side pagination - paginate the full dataset
      return paginateData(allData, {
        page: paginationState.getPage(),
        pageSize: paginationState.getPageSize(),
        total: allData.length,
      })
    } else {
      // No data or loading
      return {
        data: [],
        pagination: {
          ...paginationState.getState(),
          total: 0,
          totalPages: 0,
        },
      }
    }
  }, [serverSide, apiData, allData, paginationState])

  // Prefetch next page for better UX
  useEffect(() => {
    if (prefetchNextPage && serverSide && paginatedResult.pagination.hasNext && !loading) {
      const nextPageKey = currentCacheKey?.replace(
        `-${paginationState.getPage()}-`,
        `-${paginationState.getPage() + 1}-`
      )
      
      if (nextPageKey) {
        const nextPageParams = {
          ...paginationState.getApiParams(),
          page: paginationState.getPage() + 1,
        }
        
        // Prefetch next page in the background
        apiOptimizationUtils.createOptimizedCall(
          nextPageKey,
          () => fetcher(nextPageParams),
          {
            priority: 'low',
            cacheDuration,
            tags,
          }
        ).catch(() => {
          // Ignore prefetch errors
        })
      }
    }
  }, [prefetchNextPage, serverSide, paginatedResult.pagination.hasNext, loading, currentCacheKey, paginationState, fetcher, cacheDuration, tags])

  // Pagination controls
  const goToPage = useCallback((page: number) => {
    paginationState.setPage(page)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const nextPage = useCallback(() => {
    if (paginatedResult.pagination.hasNext) {
      paginationState.nextPage()
      setForceRefresh(prev => prev + 1)
    }
  }, [paginationState, paginatedResult.pagination.hasNext])

  const prevPage = useCallback(() => {
    if (paginatedResult.pagination.hasPrev) {
      paginationState.prevPage()
      setForceRefresh(prev => prev + 1)
    }
  }, [paginationState, paginatedResult.pagination.hasPrev])

  const firstPage = useCallback(() => {
    paginationState.firstPage()
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const lastPage = useCallback(() => {
    paginationState.lastPage()
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const setPageSize = useCallback((size: number) => {
    paginationState.setPageSize(size)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  // Sorting and filtering controls
  const setSort = useCallback((field: string, order?: 'asc' | 'desc') => {
    paginationState.setSort(field, order)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const setSearch = useCallback((query: string) => {
    paginationState.setSearch(query)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const setFilter = useCallback((key: string, value: any) => {
    paginationState.setFilter(key, value)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const setFilters = useCallback((newFilters: Record<string, any>) => {
    paginationState.setFilters(newFilters)
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  const clearFilters = useCallback(() => {
    paginationState.clearFilters()
    setForceRefresh(prev => prev + 1)
  }, [paginationState])

  // Data management
  const refetch = useCallback(async () => {
    setForceRefresh(prev => prev + 1)
    return apiRefetch()
  }, [apiRefetch])

  const refresh = useCallback(() => {
    setForceRefresh(prev => prev + 1)
  }, [])

  return {
    data: paginatedResult.data,
    pagination: paginatedResult.pagination,
    loading,
    error,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    setPageSize,
    setSort,
    setSearch,
    setFilter,
    setFilters,
    clearFilters,
    refetch,
    refresh,
    paginationState,
  }
}

// Specialized hooks for common use cases
export function usePaginatedProducts(outletId?: string, options: Omit<UsePaginatedDataOptions, 'cacheKey'> = {}) {
  return usePaginatedData(
    async (params) => {
      const { apiClient } = await import('@/lib/api-unified')
      
      if (params.page) {
        // Server-side pagination (if backend supports it)
        return apiClient.products.getAll(outletId)
      } else {
        // Client-side pagination
        return apiClient.products.getAll(outletId)
      }
    },
    {
      ...options,
      cacheKey: `paginated-products-${outletId || 'all'}`,
      tags: [cacheUtils.tags.products],
      serverSide: false, // Change to true when backend supports pagination
    }
  )
}

export function usePaginatedSales(outletId?: string, options: Omit<UsePaginatedDataOptions, 'cacheKey'> = {}) {
  return usePaginatedData(
    async (params) => {
      const { apiClient } = await import('@/lib/api-unified')
      return apiClient.sales.getAll({ outletId, ...params })
    },
    {
      ...options,
      cacheKey: `paginated-sales-${outletId || 'all'}`,
      tags: [cacheUtils.tags.sales],
      serverSide: false, // Change to true when backend supports pagination
    }
  )
}

export function usePaginatedUsers(outletId?: string, options: Omit<UsePaginatedDataOptions, 'cacheKey'> = {}) {
  return usePaginatedData(
    async (params) => {
      const { apiClient } = await import('@/lib/api-unified')
      return apiClient.users.getAll(outletId)
    },
    {
      ...options,
      cacheKey: `paginated-users-${outletId || 'all'}`,
      tags: [cacheUtils.tags.users],
      serverSide: false, // Change to true when backend supports pagination
    }
  )
}

export function usePaginatedInventory(outletId?: string, options: Omit<UsePaginatedDataOptions, 'cacheKey'> = {}) {
  return usePaginatedData(
    async (params) => {
      const { apiClient } = await import('@/lib/api-unified')
      return apiClient.inventory.getItems(outletId)
    },
    {
      ...options,
      cacheKey: `paginated-inventory-${outletId || 'all'}`,
      tags: [cacheUtils.tags.inventory],
      serverSide: false, // Change to true when backend supports pagination
    }
  )
}

// Infinite scroll hook
export function useInfiniteData<T>(
  fetcher: (params: { page: number; pageSize: number }) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    pageSize?: number
    cacheKey?: string
    cacheDuration?: number
    tags?: string[]
  } = {}
) {
  const {
    pageSize = 20,
    cacheKey,
    cacheDuration = cacheUtils.durations.medium,
    tags = [],
  } = options

  const [data, setData] = useState<T[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    setError(null)

    try {
      const result = await apiOptimizationUtils.createOptimizedCall(
        `${cacheKey}-page-${page}`,
        () => fetcher({ page, pageSize }),
        {
          priority: 'medium',
          cacheDuration,
          tags,
        }
      )

      setData(prev => [...prev, ...result.data])
      setHasMore(result.hasMore)
      setPage(prev => prev + 1)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [fetcher, page, pageSize, loading, hasMore, cacheKey, cacheDuration, tags])

  const reset = useCallback(() => {
    setData([])
    setPage(1)
    setHasMore(true)
    setError(null)
  }, [])

  // Load first page on mount
  useEffect(() => {
    if (data.length === 0 && hasMore) {
      loadMore()
    }
  }, []) // Only run on mount

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  }
}

export default {
  usePaginatedData,
  usePaginatedProducts,
  usePaginatedSales,
  usePaginatedUsers,
  usePaginatedInventory,
  useInfiniteData,
}