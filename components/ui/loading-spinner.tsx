'use client'

import React from 'react'
import { Loader2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'bars'
  className?: string
  text?: string
  fullScreen?: boolean
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'spinner',
  className, 
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {variant === 'spinner' && (
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      )}
      
      {variant === 'dots' && (
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary rounded-full animate-pulse',
                size === 'xs' ? 'h-1 w-1' : 
                size === 'sm' ? 'h-1.5 w-1.5' :
                size === 'md' ? 'h-2 w-2' :
                size === 'lg' ? 'h-3 w-3' : 'h-4 w-4'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
      )}
      
      {variant === 'pulse' && (
        <div className={cn(
          'bg-primary rounded-full animate-pulse',
          sizeClasses[size]
        )} />
      )}
      
      {variant === 'bars' && (
        <div className="flex items-end space-x-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                'bg-primary animate-pulse',
                size === 'xs' ? 'w-0.5' : 
                size === 'sm' ? 'w-1' :
                size === 'md' ? 'w-1.5' :
                size === 'lg' ? 'w-2' : 'w-3'
              )}
              style={{
                height: `${20 + (i * 10)}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.2s'
              }}
            />
          ))}
        </div>
      )}
      
      {text && (
        <p className={cn(
          'mt-3 text-muted-foreground text-center',
          size === 'xs' || size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}

// Inline loading states for buttons and small components
export function InlineLoader({ 
  size = 'sm', 
  className 
}: { 
  size?: 'xs' | 'sm' | 'md'
  className?: string 
}) {
  return (
    <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />
  )
}

// Loading overlay for cards and sections
export function LoadingOverlay({ 
  children, 
  loading, 
  text,
  className 
}: {
  children: React.ReactNode
  loading: boolean
  text?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  )
}

// Progress indicator for multi-step processes
export function ProgressLoader({ 
  progress, 
  text, 
  className 
}: { 
  progress: number
  text?: string
  className?: string 
}) {
  return (
    <div className={cn('flex flex-col items-center space-y-3', className)}>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {text && (
        <p className="text-sm text-muted-foreground text-center">{text}</p>
      )}
    </div>
  )
}

// Refresh button with loading state
export function RefreshButton({ 
  onRefresh, 
  loading, 
  className 
}: {
  onRefresh: () => void
  loading: boolean
  className?: string
}) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className={cn(
        'p-2 rounded-md hover:bg-muted transition-colors disabled:opacity-50',
        className
      )}
    >
      <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
    </button>
  )
}

// Legacy components for backward compatibility
export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse bg-muted rounded', className)} />
  )
}

export function LoadingCard() {
  return (
    <div className="p-6 border rounded-lg">
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
      </div>
    </div>
  )
}

export function LoadingTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex space-x-4 mb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-muted rounded flex-1"></div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4 mb-2">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-muted rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}