'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useLoading } from '@/contexts/loading-context'
import { showErrorToast, showSuccessToast, showLoadingToast } from '@/lib/toast-utils'

export interface EnhancedLoadingOptions {
  showGlobalLoading?: boolean
  showToast?: boolean
  successMessage?: string
  errorMessage?: string
  loadingMessage?: string
  autoResetSuccess?: number
  onSuccess?: (result: any) => void
  onError?: (error: any) => void
}

export interface EnhancedLoadingState {
  loading: boolean
  error: string | null
  success: boolean
  data: any
}

export function useEnhancedLoading(initialState?: Partial<EnhancedLoadingState>) {
  const { withGlobalLoading } = useLoading()
  const [state, setState] = useState<EnhancedLoadingState>({
    loading: false,
    error: null,
    success: false,
    data: null,
    ...initialState,
  })

  const timeoutRef = useRef<NodeJS.Timeout>()

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      loading,
      error: loading ? null : prev.error,
      success: loading ? false : prev.success,
    }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      success: false,
    }))
  }, [])

  const setSuccess = useCallback((success: boolean, data?: any, autoReset?: number) => {
    setState(prev => ({
      ...prev,
      success,
      data: data !== undefined ? data : prev.data,
      loading: false,
      error: null,
    }))

    if (success && autoReset) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, success: false }))
      }, autoReset)
    }
  }, [])

  const setData = useCallback((data: any) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setState({
      loading: false,
      error: null,
      success: false,
      data: null,
    })
  }, [])

  const executeAsync = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: EnhancedLoadingOptions = {}
  ): Promise<T | null> => {
    const {
      showGlobalLoading = false,
      showToast = false,
      successMessage,
      errorMessage,
      loadingMessage = 'Loading...',
      autoResetSuccess = 3000,
      onSuccess,
      onError,
    } = options

    let loadingToast: any = null

    try {
      // Show loading toast if requested
      if (showToast) {
        loadingToast = showLoadingToast(loadingMessage)
      }

      // Execute with or without global loading
      const result = showGlobalLoading
        ? await withGlobalLoading(async () => {
            setLoading(true)
            return await asyncFn()
          }, loadingMessage)
        : await (async () => {
            setLoading(true)
            return await asyncFn()
          })()

      // Handle success
      setSuccess(true, result, autoResetSuccess)

      if (showToast) {
        if (loadingToast) {
          loadingToast.success(successMessage || 'Operation completed successfully')
        } else {
          showSuccessToast(successMessage || 'Operation completed successfully')
        }
      }

      if (onSuccess) {
        onSuccess(result)
      }

      return result
    } catch (error) {
      const errorMsg = errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred')
      
      setError(errorMsg)

      if (showToast) {
        if (loadingToast) {
          loadingToast.error(errorMsg)
        } else {
          showErrorToast(errorMsg)
        }
      }

      if (onError) {
        onError(error)
      }

      return null
    } finally {
      if (!showGlobalLoading) {
        setLoading(false)
      }
    }
  }, [withGlobalLoading, setLoading, setSuccess, setError])

  // Specialized methods for common operations
  const fetchData = useCallback(async <T>(
    fetchFn: () => Promise<T>,
    options?: EnhancedLoadingOptions
  ) => {
    return executeAsync(fetchFn, {
      loadingMessage: 'Loading data...',
      errorMessage: 'Failed to load data',
      ...options,
    })
  }, [executeAsync])

  const submitForm = useCallback(async <T>(
    submitFn: () => Promise<T>,
    options?: EnhancedLoadingOptions
  ) => {
    return executeAsync(submitFn, {
      showToast: true,
      loadingMessage: 'Submitting...',
      successMessage: 'Form submitted successfully',
      errorMessage: 'Failed to submit form',
      ...options,
    })
  }, [executeAsync])

  const saveData = useCallback(async <T>(
    saveFn: () => Promise<T>,
    options?: EnhancedLoadingOptions
  ) => {
    return executeAsync(saveFn, {
      showToast: true,
      loadingMessage: 'Saving...',
      successMessage: 'Data saved successfully',
      errorMessage: 'Failed to save data',
      ...options,
    })
  }, [executeAsync])

  const deleteData = useCallback(async <T>(
    deleteFn: () => Promise<T>,
    options?: EnhancedLoadingOptions
  ) => {
    return executeAsync(deleteFn, {
      showToast: true,
      loadingMessage: 'Deleting...',
      successMessage: 'Data deleted successfully',
      errorMessage: 'Failed to delete data',
      ...options,
    })
  }, [executeAsync])

  return {
    // State
    ...state,
    
    // State setters
    setLoading,
    setError,
    setSuccess,
    setData,
    reset,
    
    // Async execution
    executeAsync,
    
    // Specialized methods
    fetchData,
    submitForm,
    saveData,
    deleteData,
    
    // Computed properties
    isIdle: !state.loading && !state.error && !state.success,
    hasData: state.data !== null,
  }
}

// Hook for managing multiple loading states
export function useMultipleLoadingStates(keys: string[]) {
  const [states, setStates] = useState<Record<string, EnhancedLoadingState>>(() => {
    const initial: Record<string, EnhancedLoadingState> = {}
    keys.forEach(key => {
      initial[key] = {
        loading: false,
        error: null,
        success: false,
        data: null,
      }
    })
    return initial
  })

  const getState = useCallback((key: string) => {
    return states[key] || {
      loading: false,
      error: null,
      success: false,
      data: null,
    }
  }, [states])

  const updateState = useCallback((key: string, updates: Partial<EnhancedLoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }))
  }, [])

  const executeForKey = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>,
    options: EnhancedLoadingOptions = {}
  ): Promise<T | null> => {
    const { withGlobalLoading } = useLoading()
    
    try {
      updateState(key, { loading: true, error: null, success: false })
      
      const result = options.showGlobalLoading
        ? await withGlobalLoading(asyncFn, options.loadingMessage)
        : await asyncFn()
      
      updateState(key, { 
        loading: false, 
        success: true, 
        data: result,
        error: null 
      })
      
      if (options.showToast && options.successMessage) {
        showSuccessToast(options.successMessage)
      }
      
      return result
    } catch (error) {
      const errorMsg = options.errorMessage || 
        (error instanceof Error ? error.message : 'An error occurred')
      
      updateState(key, { 
        loading: false, 
        error: errorMsg, 
        success: false 
      })
      
      if (options.showToast) {
        showErrorToast(errorMsg)
      }
      
      return null
    }
  }, [updateState])

  const resetKey = useCallback((key: string) => {
    updateState(key, {
      loading: false,
      error: null,
      success: false,
      data: null,
    })
  }, [updateState])

  const resetAll = useCallback(() => {
    const resetStates: Record<string, EnhancedLoadingState> = {}
    keys.forEach(key => {
      resetStates[key] = {
        loading: false,
        error: null,
        success: false,
        data: null,
      }
    })
    setStates(resetStates)
  }, [keys])

  return {
    states,
    getState,
    updateState,
    executeForKey,
    resetKey,
    resetAll,
    
    // Computed properties
    isAnyLoading: Object.values(states).some(state => state.loading),
    hasAnyError: Object.values(states).some(state => state.error),
    allErrors: Object.values(states)
      .map(state => state.error)
      .filter((error): error is string => Boolean(error)),
  }
}