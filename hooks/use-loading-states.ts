'use client'

import { useState, useCallback, useRef } from 'react'

export interface LoadingState {
  loading: boolean
  error: string | null
  success: boolean
}

export interface LoadingStates {
  [key: string]: LoadingState
}

export function useLoadingStates(initialStates: string[] = []) {
  const [states, setStates] = useState<LoadingStates>(() => {
    const initial: LoadingStates = {}
    initialStates.forEach(key => {
      initial[key] = { loading: false, error: null, success: false }
    })
    return initial
  })

  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const setLoading = useCallback((key: string, loading: boolean) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        loading,
        error: loading ? null : prev[key]?.error || null,
        success: loading ? false : prev[key]?.success || false,
      }
    }))
  }, [])

  const setError = useCallback((key: string, error: string | null) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        error,
        loading: false,
        success: false,
      }
    }))
  }, [])

  const setSuccess = useCallback((key: string, success: boolean = true, autoReset?: number) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        success,
        loading: false,
        error: null,
      }
    }))

    // Auto-reset success state after specified time
    if (success && autoReset) {
      const existingTimeout = timeouts.current.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      const timeout = setTimeout(() => {
        setStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            success: false,
          }
        }))
        timeouts.current.delete(key)
      }, autoReset)

      timeouts.current.set(key, timeout)
    }
  }, [])

  const reset = useCallback((key: string) => {
    const existingTimeout = timeouts.current.get(key)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      timeouts.current.delete(key)
    }

    setStates(prev => ({
      ...prev,
      [key]: { loading: false, error: null, success: false }
    }))
  }, [])

  const resetAll = useCallback(() => {
    // Clear all timeouts
    timeouts.current.forEach(timeout => clearTimeout(timeout))
    timeouts.current.clear()

    setStates(prev => {
      const newStates: LoadingStates = {}
      Object.keys(prev).forEach(key => {
        newStates[key] = { loading: false, error: null, success: false }
      })
      return newStates
    })
  }, [])

  const getState = useCallback((key: string): LoadingState => {
    return states[key] || { loading: false, error: null, success: false }
  }, [states])

  const isLoading = useCallback((key: string): boolean => {
    return states[key]?.loading || false
  }, [states])

  const hasError = useCallback((key: string): boolean => {
    return Boolean(states[key]?.error)
  }, [states])

  const isSuccess = useCallback((key: string): boolean => {
    return states[key]?.success || false
  }, [states])

  const getError = useCallback((key: string): string | null => {
    return states[key]?.error || null
  }, [states])

  // Helper for async operations
  const executeAsync = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      autoResetSuccess?: number
    }
  ): Promise<T | null> => {
    try {
      setLoading(key, true)
      const result = await asyncFn()
      setSuccess(key, true, options?.autoResetSuccess)
      return result
    } catch (error) {
      const errorMessage = options?.errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred')
      setError(key, errorMessage)
      return null
    }
  }, [setLoading, setSuccess, setError])

  // Batch operations
  const isAnyLoading = useCallback((): boolean => {
    return Object.values(states).some(state => state.loading)
  }, [states])

  const hasAnyError = useCallback((): boolean => {
    return Object.values(states).some(state => state.error)
  }, [states])

  const getAllErrors = useCallback((): string[] => {
    return Object.values(states)
      .map(state => state.error)
      .filter((error): error is string => Boolean(error))
  }, [states])

  return {
    // State getters
    states,
    getState,
    isLoading,
    hasError,
    isSuccess,
    getError,

    // State setters
    setLoading,
    setError,
    setSuccess,
    reset,
    resetAll,

    // Async helper
    executeAsync,

    // Batch helpers
    isAnyLoading,
    hasAnyError,
    getAllErrors,
  }
}

// Specialized hook for form submissions
export function useFormLoadingState() {
  const { 
    setLoading, 
    setError, 
    setSuccess, 
    reset, 
    executeAsync,
    ...rest 
  } = useLoadingStates(['submit'])

  const submitForm = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (result: T) => void
      onError?: (error: string) => void
    }
  ): Promise<T | null> => {
    const result = await executeAsync('submit', asyncFn, {
      successMessage: options?.successMessage,
      errorMessage: options?.errorMessage,
      autoResetSuccess: 3000,
    })

    if (result && options?.onSuccess) {
      options.onSuccess(result)
    } else if (!result && options?.onError) {
      const error = rest.getError('submit')
      if (error) {
        options.onError(error)
      }
    }

    return result
  }, [executeAsync, rest])

  return {
    ...rest,
    isSubmitting: rest.isLoading('submit'),
    submitError: rest.getError('submit'),
    isSubmitSuccess: rest.isSuccess('submit'),
    submitForm,
    resetSubmit: () => reset('submit'),
  }
}

// Hook for data fetching with retry capability
export function useDataLoadingState<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const { executeAsync, ...loadingState } = useLoadingStates(['fetch'])

  const fetchData = useCallback(async () => {
    const result = await executeAsync('fetch', fetchFn)
    if (result) {
      setData(result)
    }
    return result
  }, [executeAsync, fetchFn])

  const retry = useCallback(() => {
    return fetchData()
  }, [fetchData])

  // Auto-fetch on mount and dependency changes
  React.useEffect(() => {
    fetchData()
  }, dependencies)

  return {
    data,
    loading: loadingState.isLoading('fetch'),
    error: loadingState.getError('fetch'),
    retry,
    refetch: fetchData,
  }
}