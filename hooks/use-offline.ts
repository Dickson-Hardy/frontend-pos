'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from './use-toast'

export interface OfflineState {
  isOnline: boolean
  isOffline: boolean
  wasOffline: boolean
}

export interface OfflineOptions {
  showToasts?: boolean
  pingUrl?: string
  pingInterval?: number
  onOnline?: () => void
  onOffline?: () => void
}

export function useOffline(options: OfflineOptions = {}) {
  const {
    showToasts = true,
    pingUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/health`,
    pingInterval = 30000, // 30 seconds
    onOnline,
    onOffline,
  } = options

  const { toast } = useToast()
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    wasOffline: false,
  })

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
      })
      return response.ok
    } catch {
      return false
    }
  }, [pingUrl])

  const handleOnline = useCallback(() => {
    setState(prev => {
      const wasOffline = prev.isOffline
      return {
        isOnline: true,
        isOffline: false,
        wasOffline,
      }
    })

    if (showToasts && state.wasOffline) {
      toast({
        title: 'Connection Restored',
        description: 'You are back online',
        variant: 'default',
      })
    }

    if (onOnline) {
      onOnline()
    }
  }, [showToasts, state.wasOffline, toast, onOnline])

  const handleOffline = useCallback(() => {
    setState(prev => ({
      isOnline: false,
      isOffline: true,
      wasOffline: prev.isOffline || prev.wasOffline,
    }))

    if (showToasts) {
      toast({
        title: 'Connection Lost',
        description: 'You are currently offline. Some features may not work.',
        variant: 'destructive',
      })
    }

    if (onOffline) {
      onOffline()
    }
  }, [showToasts, toast, onOffline])

  useEffect(() => {
    // Listen to browser online/offline events
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Periodic connection check
    const intervalId = setInterval(async () => {
      const isConnected = await checkConnection()
      if (isConnected && state.isOffline) {
        handleOnline()
      } else if (!isConnected && state.isOnline) {
        handleOffline()
      }
    }, pingInterval)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(intervalId)
    }
  }, [handleOnline, handleOffline, checkConnection, pingInterval, state.isOnline, state.isOffline])

  return state
}

// Hook for handling offline-capable operations
export function useOfflineCapable<T = any>() {
  const { isOnline, isOffline } = useOffline()
  const [queuedOperations, setQueuedOperations] = useState<Array<{
    id: string
    operation: () => Promise<T>
    onSuccess?: (result: T) => void
    onError?: (error: any) => void
  }>>([])

  const executeWhenOnline = useCallback((
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void
      onError?: (error: any) => void
    }
  ) => {
    const id = Math.random().toString(36).substr(2, 9)
    
    if (isOnline) {
      // Execute immediately if online
      return operation()
        .then(result => {
          options?.onSuccess?.(result)
          return result
        })
        .catch(error => {
          options?.onError?.(error)
          throw error
        })
    } else {
      // Queue for later execution
      setQueuedOperations(prev => [...prev, {
        id,
        operation,
        onSuccess: options?.onSuccess,
        onError: options?.onError,
      }])
      
      return Promise.reject(new Error('Operation queued for when connection is restored'))
    }
  }, [isOnline])

  // Execute queued operations when coming back online
  useEffect(() => {
    if (isOnline && queuedOperations.length > 0) {
      const operations = [...queuedOperations]
      setQueuedOperations([])
      
      operations.forEach(async ({ operation, onSuccess, onError }) => {
        try {
          const result = await operation()
          onSuccess?.(result)
        } catch (error) {
          onError?.(error)
        }
      })
    }
  }, [isOnline, queuedOperations])

  return {
    isOnline,
    isOffline,
    queuedOperationsCount: queuedOperations.length,
    executeWhenOnline,
  }
}