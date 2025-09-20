'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface LoadingContextType {
  isGlobalLoading: boolean
  loadingMessage: string
  showGlobalLoading: (message?: string) => void
  hideGlobalLoading: () => void
  withGlobalLoading: <T>(
    asyncFn: () => Promise<T>,
    message?: string
  ) => Promise<T>
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}

interface LoadingProviderProps {
  children: React.ReactNode
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isGlobalLoading, setIsGlobalLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')

  const showGlobalLoading = useCallback((message = 'Loading...') => {
    setLoadingMessage(message)
    setIsGlobalLoading(true)
  }, [])

  const hideGlobalLoading = useCallback(() => {
    setIsGlobalLoading(false)
    setLoadingMessage('')
  }, [])

  const withGlobalLoading = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    message = 'Loading...'
  ): Promise<T> => {
    try {
      showGlobalLoading(message)
      const result = await asyncFn()
      return result
    } finally {
      hideGlobalLoading()
    }
  }, [showGlobalLoading, hideGlobalLoading])

  const value: LoadingContextType = {
    isGlobalLoading,
    loadingMessage,
    showGlobalLoading,
    hideGlobalLoading,
    withGlobalLoading,
  }

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isGlobalLoading && (
        <LoadingSpinner
          fullScreen
          text={loadingMessage}
          size="lg"
        />
      )}
    </LoadingContext.Provider>
  )
}