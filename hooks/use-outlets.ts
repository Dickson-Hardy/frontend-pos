import { useState, useEffect } from 'react'
import { apiClient, Outlet, CreateOutletDto, UpdateOutletDto } from '@/lib/api-unified'
import { useAuth } from '@/contexts/auth-context'

export interface UseOutletsReturn {
  outlets: Outlet[]
  loading: boolean
  error: string | null
  createOutlet: (outletData: CreateOutletDto) => Promise<Outlet>
  updateOutlet: (id: string, outletData: UpdateOutletDto) => Promise<Outlet>
  deleteOutlet: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useOutlets(): UseOutletsReturn {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser, isAuthenticated, isValidated, isLoading: authLoading } = useAuth()

  const fetchOutlets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.outlets.getAll()
      setOutlets(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch outlets')
      console.error('Error fetching outlets:', err)
    } finally {
      setLoading(false)
    }
  }

  const createOutlet = async (outletData: CreateOutletDto): Promise<Outlet> => {
    try {
      setError(null)
      const newOutlet = await apiClient.outlets.create(outletData)
      setOutlets(prev => [...prev, newOutlet])
      return newOutlet
    } catch (err: any) {
      setError(err.message || 'Failed to create outlet')
      throw err
    }
  }

  const updateOutlet = async (id: string, outletData: UpdateOutletDto): Promise<Outlet> => {
    try {
      setError(null)
      const updatedOutlet = await apiClient.outlets.update(id, outletData)
      setOutlets(prev => prev.map(outlet => outlet.id === id ? updatedOutlet : outlet))
      return updatedOutlet
    } catch (err: any) {
      setError(err.message || 'Failed to update outlet')
      throw err
    }
  }

  const deleteOutlet = async (id: string): Promise<void> => {
    try {
      setError(null)
      await apiClient.outlets.delete(id)
      setOutlets(prev => prev.filter(outlet => outlet.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete outlet')
      throw err
    }
  }

  const refetch = async () => {
    await fetchOutlets()
  }

  useEffect(() => {
    // Only fetch data when auth is not loading, validation is complete, and user is authenticated
    if (!authLoading && isValidated && isAuthenticated && currentUser) {
      fetchOutlets()
    } else if (!authLoading && isValidated && !isAuthenticated) {
      // Auth finished loading and validation completed, but user is not authenticated
      setLoading(false)
      setError('User not authenticated')
    }
  }, [currentUser, isAuthenticated, isValidated, authLoading])

  return {
    outlets,
    loading,
    error,
    createOutlet,
    updateOutlet,
    deleteOutlet,
    refetch,
  }
}