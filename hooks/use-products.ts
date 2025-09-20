'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation, cacheUtils } from './use-api'
import { apiClient, CreateProductDto, UpdateProductDto } from '@/lib/api-unified'
import { dataTransforms, dataValidations, utils } from '@/lib/data-utils'

export function useProducts(outletId?: string, options?: { paginated?: boolean; pageSize?: number }) {
  const { paginated = false, pageSize = 20 } = options || {}
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'category'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Use paginated hook if requested
  if (paginated) {
    const { usePaginatedProducts } = require('./use-paginated-data')
    return usePaginatedProducts(outletId, {
      pageSize,
      sortBy,
      sortOrder,
      searchQuery,
      filters: categoryFilter ? { category: categoryFilter } : {},
    })
  }

  const {
    data: products,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.products.getAll(outletId),
    {
      cacheKey: `products-${outletId || 'all'}`,
      cacheDuration: cacheUtils.durations.medium,
      tags: [cacheUtils.tags.products],
      priority: 'high',
      prefetchRelated: true,
    }
  )

  // Memoized filtered and sorted products
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return []

    let filtered = products

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = dataTransforms.searchProducts(filtered, searchQuery)
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = dataTransforms.filterProductsByCategory(filtered, categoryFilter)
    }

    // Apply sorting
    filtered = dataTransforms.sortProducts(filtered, sortBy, sortOrder)

    return filtered
  }, [products, searchQuery, categoryFilter, sortBy, sortOrder])

  // Get unique categories
  const categories = useMemo(() => {
    if (!products || !Array.isArray(products)) return []
    const categorySet = new Set(products.map(p => p.category))
    return Array.from(categorySet).sort()
  }, [products])

  // Debounced search function
  const debouncedSearch = useMemo(
    () => utils.debounce((query: string) => setSearchQuery(query), 300),
    []
  )

  const handleSearch = useCallback((query: string) => {
    debouncedSearch(query)
  }, [debouncedSearch])

  const handleCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category)
  }, [])

  const handleSort = useCallback((field: 'name' | 'price' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setCategoryFilter('')
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  return {
    products: filteredProducts,
    allProducts: products || [],
    categories,
    loading,
    error,
    searchQuery,
    categoryFilter,
    sortBy,
    sortOrder,
    handleSearch,
    handleCategoryFilter,
    handleSort,
    clearFilters,
    refetch,
    mutate,
  }
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

export function useProductMutations() {
  const createProduct = useMutation(
    (productData: CreateProductDto) => apiClient.products.create(productData),
    {
      onSuccess: () => {
        // Invalidate products cache
      },
      invalidateCache: ['products-'],
    }
  )

  const updateProduct = useMutation(
    ({ id, data }: { id: string; data: UpdateProductDto }) => 
      apiClient.products.update(id, data),
    {
      invalidateCache: ['products-', 'product-'],
    }
  )

  const deleteProduct = useMutation(
    (id: string) => apiClient.products.delete(id),
    {
      invalidateCache: ['products-', 'product-'],
    }
  )

  const validateAndCreateProduct = useCallback(async (productData: CreateProductDto) => {
    const validation = dataValidations.validateProduct(productData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    return createProduct.mutate(productData)
  }, [createProduct])

  const validateAndUpdateProduct = useCallback(async (id: string, productData: UpdateProductDto) => {
    const validation = dataValidations.validateProduct(productData)
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '))
    }
    return updateProduct.mutate({ id, data: productData })
  }, [updateProduct])

  return {
    createProduct: {
      ...createProduct,
      mutate: validateAndCreateProduct,
    },
    updateProduct: {
      ...updateProduct,
      mutate: validateAndUpdateProduct,
    },
    deleteProduct,
  }
}

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
      immediate: !!barcode && utils.validateBarcode(barcode),
      cacheKey: `product-barcode-${barcode}`,
    }
  )
}