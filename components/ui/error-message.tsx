'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Button } from './button'
import { ApiError } from '@/lib/api-unified'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  error: ApiError | Error | string
  onRetry?: () => void
  className?: string
  showRetry?: boolean
}

export function ErrorMessage({ error, onRetry, className, showRetry = true }: ErrorMessageProps) {
  const getErrorDetails = () => {
    if (typeof error === 'string') {
      return { message: error, code: 'UNKNOWN' }
    }

    if (error instanceof Error) {
      return { message: error.message, code: 'ERROR' }
    }

    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN',
    }
  }

  const { message, code } = getErrorDetails()

  const getErrorIcon = () => {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return <WifiOff className="h-5 w-5 text-red-500" />
      case '401':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case '403':
        return <AlertCircle className="h-5 w-5 text-orange-500" />
      case '404':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case '500':
      case '502':
      case '503':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getErrorTitle = () => {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT':
        return 'Connection Problem'
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

  const getUserFriendlyMessage = () => {
    switch (code) {
      case 'NETWORK_ERROR':
        return 'Please check your internet connection and try again.'
      case 'TIMEOUT':
        return 'The request took too long. Please try again.'
      case '401':
        return 'Please log in to continue.'
      case '403':
        return 'You don\'t have permission to perform this action.'
      case '404':
        return 'The requested resource was not found.'
      case '500':
        return 'A server error occurred. Please try again later.'
      case '502':
      case '503':
        return 'The service is temporarily unavailable. Please try again later.'
      default:
        return message
    }
  }

  return (
    <div className={cn('flex flex-col items-center justify-center p-6 text-center', className)}>
      <div className="flex items-center gap-2 mb-2">
        {getErrorIcon()}
        <h3 className="text-lg font-semibold text-gray-900">{getErrorTitle()}</h3>
      </div>
      
      <p className="text-gray-600 mb-4 max-w-md">{getUserFriendlyMessage()}</p>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mb-4 p-3 bg-gray-100 rounded text-left max-w-md">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Technical Details
          </summary>
          <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
            Code: {code}
            {'\n'}
            Message: {message}
          </pre>
        </details>
      )}
      
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  )
}

export function NetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(true)
  const [showReconnected, setShowReconnected] = React.useState(false)
  const [connectionQuality, setConnectionQuality] = React.useState<'good' | 'poor' | 'offline'>('good')

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionQuality('good')
      setShowReconnected(true)
      
      // Hide reconnected message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionQuality('offline')
      setShowReconnected(false)
    }

    // Check connection quality periodically
    const checkConnectionQuality = async () => {
      if (!navigator.onLine) {
        setConnectionQuality('offline')
        return
      }

      try {
        const start = Date.now()
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/health`, { 
          method: 'HEAD',
          cache: 'no-cache'
        })
        const duration = Date.now() - start

        if (response.ok) {
          setConnectionQuality(duration > 2000 ? 'poor' : 'good')
        } else {
          setConnectionQuality('poor')
        }
      } catch {
        setConnectionQuality('poor')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check connection quality every 30 seconds
    const qualityInterval = setInterval(checkConnectionQuality, 30000)
    
    // Initial check
    checkConnectionQuality()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(qualityInterval)
    }
  }, [])

  if (isOnline && !showReconnected && connectionQuality === 'good') return null

  const getStatusConfig = () => {
    if (!isOnline || connectionQuality === 'offline') {
      return {
        bg: 'bg-red-500',
        text: 'No internet connection',
        icon: <WifiOff className="h-4 w-4" />,
        action: null
      }
    }
    
    if (showReconnected) {
      return {
        bg: 'bg-green-500',
        text: 'Connection restored',
        icon: <Wifi className="h-4 w-4" />,
        action: null
      }
    }
    
    if (connectionQuality === 'poor') {
      return {
        bg: 'bg-yellow-500',
        text: 'Slow connection detected',
        icon: <WifiOff className="h-4 w-4" />,
        action: (
          <button 
            onClick={() => window.location.reload()}
            className="text-xs underline ml-2"
          >
            Refresh
          </button>
        )
      }
    }

    return null
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${config.bg} text-white p-2 text-center transition-all duration-300`}>
      <div className="flex items-center justify-center gap-2">
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
        {config.action}
      </div>
    </div>
  )
}

export function EmptyState({ 
  title, 
  description, 
  action,
  icon: Icon = AlertCircle,
  className 
}: {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <Icon className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-md">{description}</p>
      )}
      {action}
    </div>
  )
}