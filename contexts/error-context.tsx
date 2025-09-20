'use client'

import React, { createContext, useContext, useCallback, ReactNode } from 'react'
import { useErrorHandler } from '@/hooks/use-error-handler'
import { useOffline } from '@/hooks/use-offline'
import { errorReporting, reportError, reportApiError, reportComponentError } from '@/lib/error-reporting'
import { ApiError } from '@/lib/api-unified'
import { useToast } from '@/hooks/use-toast'

interface ErrorContextType {
  // Error handling
  handleError: (error: any, context?: string) => void
  handleApiError: (error: ApiError, endpoint: string, method?: string) => void
  handleComponentError: (error: Error, componentName: string, action?: string) => void
  clearError: () => void
  
  // Error state
  hasError: boolean
  error: any
  
  // Network state
  isOnline: boolean
  isOffline: boolean
  
  // Retry functionality
  retryWithErrorHandling: (fn: () => Promise<any>, options?: RetryOptions) => Promise<any>
}

interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
}

interface ErrorProviderProps {
  children: ReactNode
  enableErrorReporting?: boolean
  errorReportingConfig?: {
    endpoint?: string
    apiKey?: string
    userId?: string
  }
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined)

export function ErrorProvider({ 
  children, 
  enableErrorReporting = true,
  errorReportingConfig = {}
}: ErrorProviderProps) {
  const { toast } = useToast()
  const { isOnline, isOffline } = useOffline({
    showToasts: true,
    onOffline: () => {
      toast({
        title: 'Connection Lost',
        description: 'You are now offline. Some features may not work.',
        variant: 'destructive',
      })
    },
    onOnline: () => {
      toast({
        title: 'Connection Restored',
        description: 'You are back online.',
        variant: 'default',
      })
    },
  })

  const { 
    handleError: baseHandleError, 
    clearError, 
    retryWithErrorHandling,
    hasError,
    error 
  } = useErrorHandler({
    showToast: true,
    logError: true,
  })

  // Initialize error reporting
  React.useEffect(() => {
    if (enableErrorReporting) {
      errorReporting.updateConfig({
        enabled: true,
        ...errorReportingConfig,
      })
    }
  }, [enableErrorReporting, errorReportingConfig])

  const handleError = useCallback((error: any, context?: string) => {
    baseHandleError(error)
    
    if (enableErrorReporting) {
      reportError(error, context)
    }
  }, [baseHandleError, enableErrorReporting])

  const handleApiError = useCallback((error: ApiError, endpoint: string, method: string = 'GET') => {
    baseHandleError(error)
    
    if (enableErrorReporting) {
      reportApiError(error, endpoint, method)
    }
  }, [baseHandleError, enableErrorReporting])

  const handleComponentError = useCallback((error: Error, componentName: string, action?: string) => {
    baseHandleError(error)
    
    if (enableErrorReporting) {
      reportComponentError(error, componentName, action)
    }
  }, [baseHandleError, enableErrorReporting])

  const value: ErrorContextType = {
    handleError,
    handleApiError,
    handleComponentError,
    clearError,
    hasError,
    error,
    isOnline,
    isOffline,
    retryWithErrorHandling,
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

export function useError(): ErrorContextType {
  const context = useContext(ErrorContext)
  if (context === undefined) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Higher-order component for automatic error handling
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function ErrorHandledComponent(props: P) {
    const { handleComponentError } = useError()

    const ErrorBoundary = React.useMemo(() => {
      return class extends React.Component<
        { children: React.ReactNode },
        { hasError: boolean }
      > {
        constructor(props: { children: React.ReactNode }) {
          super(props)
          this.state = { hasError: false }
        }

        static getDerivedStateFromError(): { hasError: boolean } {
          return { hasError: true }
        }

        componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
          handleComponentError(
            error, 
            componentName || Component.displayName || Component.name || 'Unknown',
            'render'
          )
        }

        render() {
          if (this.state.hasError) {
            return (
              <div className="p-4 text-center">
                <p className="text-red-600">Something went wrong in this component.</p>
              </div>
            )
          }

          return this.props.children
        }
      }
    }, [handleComponentError])

    return (
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Hook for handling async operations with comprehensive error handling
export function useAsyncWithErrorHandling() {
  const { handleError, isOnline, retryWithErrorHandling } = useError()
  const [isLoading, setIsLoading] = React.useState(false)

  const executeAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    options: {
      onSuccess?: (result: T) => void
      onError?: (error: any) => void
      context?: string
      retryOptions?: RetryOptions
      requiresOnline?: boolean
    } = {}
  ): Promise<T | null> => {
    const { 
      onSuccess, 
      onError, 
      context, 
      retryOptions,
      requiresOnline = true 
    } = options

    if (requiresOnline && !isOnline) {
      const offlineError = new Error('This action requires an internet connection')
      handleError(offlineError, context)
      onError?.(offlineError)
      return null
    }

    try {
      setIsLoading(true)
      
      const result = retryOptions 
        ? await retryWithErrorHandling(asyncFn, retryOptions)
        : await asyncFn()
      
      onSuccess?.(result)
      return result
    } catch (error) {
      handleError(error, context)
      onError?.(error)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [handleError, isOnline, retryWithErrorHandling])

  return {
    executeAsync,
    isLoading,
  }
}

// Hook for form error handling
export function useFormErrorHandling() {
  const { handleError } = useError()
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})

  const handleFormError = useCallback((error: any) => {
    if (error && typeof error === 'object' && error.details && error.details.errors) {
      // Handle validation errors
      const errors: Record<string, string> = {}
      error.details.errors.forEach((err: any) => {
        if (err.field) {
          errors[err.field] = err.message
        }
      })
      setFieldErrors(errors)
    } else {
      // Handle general form errors
      handleError(error, 'form')
    }
  }, [handleError])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return {
    fieldErrors,
    handleFormError,
    clearFieldError,
    clearAllFieldErrors,
  }
}