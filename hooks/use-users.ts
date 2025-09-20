import { useState, useEffect } from 'react'
import { apiClient, User, CreateUserDto, UpdateUserDto } from '@/lib/api-unified'
import { useAuth } from '@/contexts/auth-context'

export interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  createUser: (userData: CreateUserDto) => Promise<User>
  updateUser: (id: string, userData: UpdateUserDto) => Promise<User>
  deleteUser: (id: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useUsers(outletId?: string): UseUsersReturn {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser, isAuthenticated, isValidated, isLoading: authLoading } = useAuth()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiClient.users.getAll(outletId)
      setUsers(data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  const createUser = async (userData: CreateUserDto): Promise<User> => {
    try {
      setError(null)
      const newUser = await apiClient.users.create(userData)
      setUsers(prev => [...prev, newUser])
      return newUser
    } catch (err: any) {
      setError(err.message || 'Failed to create user')
      throw err
    }
  }

  const updateUser = async (id: string, userData: UpdateUserDto): Promise<User> => {
    try {
      setError(null)
      const updatedUser = await apiClient.users.update(id, userData)
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user))
      return updatedUser
    } catch (err: any) {
      setError(err.message || 'Failed to update user')
      throw err
    }
  }

  const deleteUser = async (id: string): Promise<void> => {
    try {
      setError(null)
      await apiClient.users.delete(id)
      setUsers(prev => prev.filter(user => user.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete user')
      throw err
    }
  }

  const refetch = async () => {
    await fetchUsers()
  }

  useEffect(() => {
    // Only fetch data when auth is not loading, validation is complete, and user is authenticated
    if (!authLoading && isValidated && isAuthenticated && currentUser) {
      fetchUsers()
    } else if (!authLoading && isValidated && !isAuthenticated) {
      // Auth finished loading and validation completed, but user is not authenticated
      setLoading(false)
      setError('User not authenticated')
    }
  }, [outletId, currentUser, isAuthenticated, isValidated, authLoading])

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch,
  }
}