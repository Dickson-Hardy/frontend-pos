'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/lib/api-unified'
import { useToast } from './use-toast'

export interface ErrorState {
  error: ApiError | Error | string | null
  isError: boolean
  errorCode?: string
}

export interface ErrorHandlerOptions {
  showToast?: boolean
  logError?: boolean
  fallbackMessage?: string
  onError?: (error: ApiError | Error | string) => void
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { showToast = true, logError = true, fallbackMessage, onError } = options
  const { toast } = useToast()
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isError: false,
  })

  const handleError = useCallback((error: ApiError | Error | string | unknown) => {
    let processedError: ApiError | Error | string

    // Normalize error to expected types
    if (typeof error === 'string') {
      processedError = error
    } else if (error instanceof Error) {
      processedError = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      processedError = error as ApiError
    } else {
      processedError = fallbackMessage || 'An unexpected error occurred'
    }

    // Update error state
    const errorCode = getErrorCode(processedError)
    setErrorState({
      error: processedError,
      isError: true,
      errorCode,
    })

    // Log error if enabled
    if (logError) {
      console.error('Error handled:', processedError)
    }

    // Show toast notification if enabled
    if (showToast) {
      const message = getErrorMessage(processedError)
      toast({
        title: getErrorTitle(errorCode),
        description: message,
        variant: 'destructive',
      })
    }

    // Call custom error handler if provided
    if (onError) {
      onError(processedError)
    }
  }, [showToast, logError, fallbackMessage, onError, toast])

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isError: false,
    })
  }, [])

  const retryWithErrorHandling = useCallback(async (
    asyncFn: () => Promise<any>,
    retryOptions?: {
      maxRetries?: number
      retryDelay?: number
      onRetry?: (attempt: number) => void
    }
  ) => {
    const { maxRetries = 3, retryDelay = 1000, onRetry } = retryOptions || {}
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        clearError()
        const result = await asyncFn()
        return result
      } catch (error) {
        if (attempt === maxRetries) {
          handleError(error)
          throw error
        }
        
        if (onRetry) {
          onRetry(attempt)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
    }
  }, [handleError, clearError])

  return {
    ...errorState,
    handleError,
    clearError,
    retryWithErrorHandling,
  }
}

function getErrorCode(error: ApiError | Error | string): string {
  if (typeof error === 'string') {
    return 'UNKNOWN'
  }
  
  if (error instanceof Error) {
    return 'ERROR'
  }
  
  return error.code || 'UNKNOWN'
}

function getErrorMessage(error: ApiError | Error | string): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return error.message || 'An unexpected error occurred'
}

function getErrorTitle(errorCode: string): string {
  switch (errorCode) {
    case 'NETWORK_ERROR':
      return 'Connection Problem'
    case 'TIMEOUT':
      return 'Request Timeout'
    case '401':
      return 'Authentication Required'
    case '403':
      return 'Access Denied'
    case '404':
      return 'Not Found'
    case '500':
    case '502':
    case '503':
      return 'Server Error'
    default:
      return 'Error'
  }
}

// Hook for handling async operations with error handling
export function useAsyncOperation<T = any>() {
  const [isLoading, setIsLoading] = useState(false)
  const { handleError, clearError, ...errorState } = useErrorHandler()

  const execute = useCallback(async (
    asyncFn: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: any) => void
      showSuccessToast?: boolean
      successMessage?: string
    }
  ): Promise<T | null> => {
    const { onSuccess, onError, showSuccessToast, successMessage } = options || {}
    
    try {
      setIsLoading(true)
      clearError()
      
      const result = await asyncFn()
      
      if (onSuccess) {
        onSuccess(result)
      }
      
      if (showSuccessToast && successMessage) {
        // Note: Would need to import toast here or pass it as parameter
        console.log('Success:', successMessage)
      }
      
      return result
    } catch (error) {
      handleError(error)
      if (onError) {
        onError(error)
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }, [handleError, clearError])

  return {
    execute,
    isLoading,
    ...errorState,
  }
}