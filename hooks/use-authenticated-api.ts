'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useApi } from './use-api'

interface UseApiOptions {
  immediate?: boolean
  cacheKey?: string
  cacheDuration?: number
  retryAttempts?: number
  retryDelay?: number
  priority?: 'low' | 'medium' | 'high'
  tags?: string[]
  deduplicate?: boolean
  prefetchRelated?: boolean
}

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: any | null
  refetch: () => Promise<void>
  mutate: (newData: T | null) => void
  reset: () => void
}

/**
 * Authentication-aware wrapper around useApi that only makes API calls
 * when the user is authenticated
 */
export function useAuthenticatedApi<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { isAuthenticated, isValidated, isLoading: authLoading } = useAuth()

  // Create a conditional API call that only executes when authenticated and validated
  const conditionalApiCall = useCallback(async (): Promise<T> => {
    if (!isAuthenticated || !isValidated) {
      throw new Error('User not authenticated')
    }
    return apiCall()
  }, [apiCall, isAuthenticated, isValidated])

  // Only fetch immediately if authenticated, validated, and not still loading auth
  const shouldFetchImmediately = !authLoading && isValidated && isAuthenticated && (options.immediate !== false)

  return useApi(conditionalApiCall, {
    ...options,
    immediate: shouldFetchImmediately,
  })
}

/**
 * Hook that waits for authentication before making API calls
 * Returns loading state while authentication is being checked
 */
export function useAuthenticatedApiWithLoading<T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
): UseApiResult<T> & { authLoading: boolean } {
  const { isAuthenticated, isValidated, isLoading: authLoading } = useAuth()
  
  const result = useAuthenticatedApi(apiCall, options)
  
  return {
    ...result,
    // Show loading if either auth is loading or API is loading
    loading: authLoading || result.loading,
    authLoading,
  }
}