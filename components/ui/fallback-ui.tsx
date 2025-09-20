'use client'

import React from 'react'
import { AlertCircle, RefreshCw, Wifi, WifiOff, Database, Server, Clock } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '@/lib/utils'

interface FallbackUIProps {
  type: 'error' | 'loading' | 'empty' | 'offline' | 'maintenance'
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function FallbackUI({ 
  type, 
  title, 
  description, 
  action, 
  className,
  size = 'md' 
}: FallbackUIProps) {
  const config = getFallbackConfig(type, size)
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center',
      config.containerClass,
      className
    )}>
      <div className={cn('rounded-full p-4 mb-4', config.iconBg)}>
        <config.icon className={cn(config.iconClass)} />
      </div>
      
      <h3 className={cn('font-semibold text-gray-900 mb-2', config.titleClass)}>
        {title || config.defaultTitle}
      </h3>
      
      <p className={cn('text-gray-600 mb-4', config.descriptionClass)}>
        {description || config.defaultDescription}
      </p>
      
      {action || config.defaultAction}
    </div>
  )
}

function getFallbackConfig(type: FallbackUIProps['type'], size: FallbackUIProps['size']) {
  const sizeClasses = {
    sm: {
      containerClass: 'p-4',
      iconClass: 'h-8 w-8',
      titleClass: 'text-lg',
      descriptionClass: 'text-sm max-w-xs',
    },
    md: {
      containerClass: 'p-6',
      iconClass: 'h-12 w-12',
      titleClass: 'text-xl',
      descriptionClass: 'text-base max-w-md',
    },
    lg: {
      containerClass: 'p-8',
      iconClass: 'h-16 w-16',
      titleClass: 'text-2xl',
      descriptionClass: 'text-lg max-w-lg',
    },
  }

  const baseConfig = sizeClasses[size]

  switch (type) {
    case 'error':
      return {
        ...baseConfig,
        icon: AlertCircle,
        iconBg: 'bg-red-100',
        iconClass: `${baseConfig.iconClass} text-red-500`,
        defaultTitle: 'Something went wrong',
        defaultDescription: 'An error occurred while loading this content. Please try again.',
        defaultAction: (
          <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        ),
      }

    case 'loading':
      return {
        ...baseConfig,
        icon: Clock,
        iconBg: 'bg-blue-100',
        iconClass: `${baseConfig.iconClass} text-blue-500 animate-spin`,
        defaultTitle: 'Loading...',
        defaultDescription: 'Please wait while we load your content.',
        defaultAction: null,
      }

    case 'empty':
      return {
        ...baseConfig,
        icon: Database,
        iconBg: 'bg-gray-100',
        iconClass: `${baseConfig.iconClass} text-gray-400`,
        defaultTitle: 'No data available',
        defaultDescription: 'There is no content to display at the moment.',
        defaultAction: null,
      }

    case 'offline':
      return {
        ...baseConfig,
        icon: WifiOff,
        iconBg: 'bg-orange-100',
        iconClass: `${baseConfig.iconClass} text-orange-500`,
        defaultTitle: 'You are offline',
        defaultDescription: 'Please check your internet connection and try again.',
        defaultAction: (
          <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Retry Connection
          </Button>
        ),
      }

    case 'maintenance':
      return {
        ...baseConfig,
        icon: Server,
        iconBg: 'bg-yellow-100',
        iconClass: `${baseConfig.iconClass} text-yellow-500`,
        defaultTitle: 'Under Maintenance',
        defaultDescription: 'This service is temporarily unavailable. Please try again later.',
        defaultAction: (
          <Button onClick={() => window.location.reload()} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Check Again
          </Button>
        ),
      }

    default:
      return {
        ...baseConfig,
        icon: AlertCircle,
        iconBg: 'bg-gray-100',
        iconClass: `${baseConfig.iconClass} text-gray-500`,
        defaultTitle: 'Something happened',
        defaultDescription: 'An unexpected situation occurred.',
        defaultAction: null,
      }
  }
}

// Specialized fallback components
export function ErrorFallback({ 
  error, 
  onRetry, 
  className 
}: { 
  error?: string | Error
  onRetry?: () => void
  className?: string 
}) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An error occurred'
  
  return (
    <FallbackUI
      type="error"
      description={errorMessage}
      action={onRetry && (
        <Button onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
      className={className}
    />
  )
}

export function LoadingFallback({ 
  message = 'Loading...', 
  className 
}: { 
  message?: string
  className?: string 
}) {
  return (
    <FallbackUI
      type="loading"
      description={message}
      className={className}
    />
  )
}

export function EmptyFallback({ 
  title = 'No data available',
  description = 'There is nothing to display at the moment.',
  action,
  className 
}: { 
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string 
}) {
  return (
    <FallbackUI
      type="empty"
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}

export function OfflineFallback({ 
  onRetry,
  className 
}: { 
  onRetry?: () => void
  className?: string 
}) {
  return (
    <FallbackUI
      type="offline"
      action={onRetry && (
        <Button onClick={onRetry} variant="outline" className="flex items-center gap-2">
          <Wifi className="h-4 w-4" />
          Retry Connection
        </Button>
      )}
      className={className}
    />
  )
}

// Card-based fallback for smaller components
export function FallbackCard({ 
  type, 
  title, 
  description, 
  action,
  className 
}: Omit<FallbackUIProps, 'size'> & { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-center">
          <FallbackUI
            type={type}
            title={title}
            description={description}
            action={action}
            size="sm"
          />
        </CardTitle>
      </CardHeader>
    </Card>
  )
}

// Higher-order component for wrapping components with error boundaries
export function withFallback<P extends object>(
  Component: React.ComponentType<P>,
  fallbackType: FallbackUIProps['type'] = 'error'
) {
  return function FallbackWrappedComponent(props: P) {
    return (
      <ErrorBoundary
        fallback={<FallbackUI type={fallbackType} />}
      >
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// Simple ErrorBoundary for the withFallback HOC
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Fallback ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}