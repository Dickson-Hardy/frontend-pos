'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  Loader2, 
  X,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Status indicator component
interface StatusIndicatorProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'loading'
  message: string
  className?: string
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function StatusIndicator({
  status,
  message,
  className,
  showIcon = true,
  size = 'md',
}: StatusIndicatorProps) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
    loading: Loader2,
  }

  const colors = {
    success: 'text-green-600 bg-green-50 border-green-200',
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    info: 'text-blue-600 bg-blue-50 border-blue-200',
    loading: 'text-gray-600 bg-gray-50 border-gray-200',
  }

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const Icon = icons[status]

  return (
    <div className={cn(
      'flex items-center space-x-2 rounded-md border',
      colors[status],
      sizes[size],
      className
    )}>
      {showIcon && (
        <Icon className={cn(
          iconSizes[size],
          status === 'loading' && 'animate-spin'
        )} />
      )}
      <span className="font-medium">{message}</span>
    </div>
  )
}

// Action feedback component for user actions
interface ActionFeedbackProps {
  status: 'idle' | 'loading' | 'success' | 'error'
  successMessage?: string
  errorMessage?: string
  loadingMessage?: string
  onRetry?: () => void
  onDismiss?: () => void
  autoHideSuccess?: number
  className?: string
}

export function ActionFeedback({
  status,
  successMessage = 'Action completed successfully',
  errorMessage = 'An error occurred',
  loadingMessage = 'Processing...',
  onRetry,
  onDismiss,
  autoHideSuccess = 3000,
  className,
}: ActionFeedbackProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (status === 'success' && autoHideSuccess > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        onDismiss?.()
      }, autoHideSuccess)
      return () => clearTimeout(timer)
    }
  }, [status, autoHideSuccess, onDismiss])

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true)
    }
  }, [status])

  if (!visible || status === 'idle') {
    return null
  }

  return (
    <Card className={cn('border-l-4', className, {
      'border-l-green-500': status === 'success',
      'border-l-red-500': status === 'error',
      'border-l-blue-500': status === 'loading',
    })}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status === 'loading' && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            )}
            {status === 'success' && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            
            <span className={cn('text-sm font-medium', {
              'text-green-700': status === 'success',
              'text-red-700': status === 'error',
              'text-blue-700': status === 'loading',
            })}>
              {status === 'loading' && loadingMessage}
              {status === 'success' && successMessage}
              {status === 'error' && errorMessage}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {status === 'error' && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 px-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setVisible(false)
                  onDismiss()
                }}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Network status indicator
interface NetworkStatusProps {
  className?: string
  showWhenOnline?: boolean
}

export function NetworkStatus({ className, showWhenOnline = false }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showWhenOnline) {
    return null
  }

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 transition-all duration-300',
      className
    )}>
      <Badge
        variant={isOnline ? 'default' : 'destructive'}
        className="flex items-center space-x-2 px-3 py-2"
      >
        {isOnline ? (
          <>
            <Wifi className="h-3 w-3" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3 w-3" />
            <span>Offline</span>
          </>
        )}
      </Badge>
    </div>
  )
}

// Data sync status
interface SyncStatusProps {
  status: 'synced' | 'syncing' | 'error' | 'pending'
  lastSyncTime?: Date
  onSync?: () => void
  className?: string
}

export function SyncStatus({ 
  status, 
  lastSyncTime, 
  onSync, 
  className 
}: SyncStatusProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'synced':
        return {
          icon: CheckCircle,
          text: 'Synced',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        }
      case 'syncing':
        return {
          icon: Loader2,
          text: 'Syncing...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          animate: true,
        }
      case 'error':
        return {
          icon: XCircle,
          text: 'Sync failed',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
        }
      case 'pending':
        return {
          icon: AlertCircle,
          text: 'Sync pending',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
        }
    }
  }

  const statusInfo = getStatusInfo()
  const Icon = statusInfo.icon

  return (
    <div className={cn(
      'flex items-center space-x-2 px-3 py-2 rounded-md text-sm',
      statusInfo.color,
      statusInfo.bgColor,
      className
    )}>
      <Icon className={cn(
        'h-4 w-4',
        statusInfo.animate && 'animate-spin'
      )} />
      <span className="font-medium">{statusInfo.text}</span>
      
      {lastSyncTime && status === 'synced' && (
        <span className="text-xs opacity-70">
          {lastSyncTime.toLocaleTimeString()}
        </span>
      )}
      
      {(status === 'error' || status === 'pending') && onSync && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSync}
          className="h-6 px-2 ml-2"
        >
          <RefreshCw className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}

// Form validation feedback
interface ValidationFeedbackProps {
  errors: Record<string, string>
  touched: Record<string, boolean>
  className?: string
}

export function ValidationFeedback({ 
  errors, 
  touched, 
  className 
}: ValidationFeedbackProps) {
  const visibleErrors = Object.entries(errors).filter(
    ([field]) => touched[field]
  )

  if (visibleErrors.length === 0) {
    return null
  }

  return (
    <div className={cn('space-y-2', className)}>
      {visibleErrors.map(([field, error]) => (
        <div
          key={field}
          className="flex items-center space-x-2 text-sm text-red-600"
        >
          <XCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ))}
    </div>
  )
}

// Operation progress feedback
interface OperationProgressProps {
  operations: Array<{
    id: string
    name: string
    status: 'pending' | 'running' | 'completed' | 'failed'
    progress?: number
  }>
  className?: string
}

export function OperationProgress({ operations, className }: OperationProgressProps) {
  const completedCount = operations.filter(op => op.status === 'completed').length
  const failedCount = operations.filter(op => op.status === 'failed').length
  const runningCount = operations.filter(op => op.status === 'running').length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          Progress: {completedCount}/{operations.length} completed
        </span>
        {failedCount > 0 && (
          <Badge variant="destructive" className="text-xs">
            {failedCount} failed
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {operations.map((operation) => (
          <div
            key={operation.id}
            className="flex items-center justify-between p-2 rounded border"
          >
            <div className="flex items-center space-x-2">
              {operation.status === 'pending' && (
                <div className="h-2 w-2 rounded-full bg-gray-300" />
              )}
              {operation.status === 'running' && (
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              )}
              {operation.status === 'completed' && (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              {operation.status === 'failed' && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className="text-sm">{operation.name}</span>
            </div>

            {operation.progress !== undefined && (
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${operation.progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}