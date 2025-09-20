'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi, useMutation } from './use-api'
import { apiClient, Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/lib/api-unified'

export function useSuppliers() {
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'lastOrder' | 'productsSupplied'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const {
    data: suppliers,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.suppliers.getAll(),
    {
      cacheKey: 'suppliers-all',
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Filtered and sorted suppliers
  const filteredSuppliers = useMemo(() => {
    if (!suppliers || !Array.isArray(suppliers)) return []

    let filtered = suppliers

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(supplier => supplier.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(term) ||
        supplier.contactPerson.toLowerCase().includes(term) ||
        supplier.email.toLowerCase().includes(term)
      )
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'rating':
          comparison = a.rating - b.rating
          break
        case 'lastOrder':
          const dateA = a.lastOrder ? new Date(a.lastOrder).getTime() : 0
          const dateB = b.lastOrder ? new Date(b.lastOrder).getTime() : 0
          comparison = dateA - dateB
          break
        case 'productsSupplied':
          comparison = a.productsSupplied - b.productsSupplied
          break
        default:
          comparison = 0
      }

      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [suppliers, statusFilter, searchTerm, sortBy, sortOrder])

  // Calculate supplier statistics
  const supplierStats = useMemo(() => {
    if (!suppliers || !Array.isArray(suppliers)) return null

    const activeSuppliers = suppliers.filter(s => s.status === 'active')
    const inactiveSuppliers = suppliers.filter(s => s.status === 'inactive')
    const averageRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length
    const totalProducts = suppliers.reduce((sum, s) => sum + s.productsSupplied, 0)

    return {
      totalSuppliers: suppliers.length,
      activeCount: activeSuppliers.length,
      inactiveCount: inactiveSuppliers.length,
      averageRating: Number(averageRating.toFixed(1)),
      totalProducts,
    }
  }, [suppliers])

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
  }, [])

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const handleSort = useCallback((field: 'name' | 'rating' | 'lastOrder' | 'productsSupplied') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const clearFilters = useCallback(() => {
    setStatusFilter('')
    setSearchTerm('')
    setSortBy('name')
    setSortOrder('asc')
  }, [])

  return {
    suppliers: filteredSuppliers,
    allSuppliers: suppliers || [],
    supplierStats,
    loading,
    error,
    statusFilter,
    searchTerm,
    sortBy,
    sortOrder,
    handleStatusFilter,
    handleSearch,
    handleSort,
    clearFilters,
    refetch,
    mutate,
  }
}

export function useSupplier(id: string) {
  return useApi(
    () => apiClient.suppliers.getById(id),
    {
      cacheKey: `supplier-${id}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )
}

export function useSupplierMutations() {
  const createSupplier = useMutation(
    (supplier: CreateSupplierDto) => apiClient.suppliers.create(supplier),
    {
      invalidateCache: ['suppliers-'],
    }
  )

  const updateSupplier = useMutation(
    ({ id, supplier }: { id: string; supplier: UpdateSupplierDto }) => 
      apiClient.suppliers.update(id, supplier),
    {
      invalidateCache: ['suppliers-'],
    }
  )

  const deleteSupplier = useMutation(
    (id: string) => apiClient.suppliers.delete(id),
    {
      invalidateCache: ['suppliers-'],
    }
  )

  return {
    createSupplier,
    updateSupplier,
    deleteSupplier,
  }
}