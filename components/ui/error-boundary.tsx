'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react'
import { Button } from './button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'global'
  showHomeButton?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = Math.random().toString(36).substr(2, 9)
    return { 
      hasError: true, 
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Log error with additional context
    const errorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: this.props.level || 'component',
      errorId: this.state.errorId,
    }

    // In production, you might want to send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error reporting service
      // errorReportingService.report(errorReport)
    }

    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    } else {
      // Max retries reached, suggest page refresh
      window.location.reload()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  getErrorSeverity = () => {
    const { level } = this.props
    const { error } = this.state

    if (level === 'global') return 'critical'
    if (error?.name === 'ChunkLoadError') return 'medium'
    if (error?.message?.includes('Network')) return 'medium'
    return 'low'
  }

  getErrorMessage = () => {
    const { error } = this.state
    const severity = this.getErrorSeverity()

    if (error?.name === 'ChunkLoadError') {
      return 'The application needs to be updated. Please refresh the page to get the latest version.'
    }

    if (error?.message?.includes('Network')) {
      return 'A network error occurred. Please check your connection and try again.'
    }

    switch (severity) {
      case 'critical':
        return 'A critical error occurred that prevents the application from working properly.'
      case 'medium':
        return 'An error occurred that may affect some functionality.'
      default:
        return 'An unexpected error occurred in this component.'
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const severity = this.getErrorSeverity()
      const canRetry = this.retryCount < this.maxRetries
      const isChunkError = this.state.error?.name === 'ChunkLoadError'

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <div className={`p-4 rounded-full mb-4 ${
            severity === 'critical' ? 'bg-red-100' : 
            severity === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
          }`}>
            <AlertTriangle className={`h-16 w-16 ${
              severity === 'critical' ? 'text-red-500' : 
              severity === 'medium' ? 'text-yellow-500' : 'text-gray-500'
            }`} />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {severity === 'critical' ? 'Critical Error' : 'Something went wrong'}
          </h2>
          
          <p className="text-gray-600 mb-6 max-w-md">
            {this.getErrorMessage()}
          </p>

          {this.state.errorId && (
            <p className="text-xs text-gray-400 mb-4">
              Error ID: {this.state.errorId}
            </p>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-6 p-4 bg-gray-100 rounded-lg text-left max-w-2xl">
              <summary className="cursor-pointer font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Error Details (Development)
              </summary>
              <div className="mt-2 space-y-2">
                <div>
                  <strong>Error:</strong> {this.state.error.name}
                </div>
                <div>
                  <strong>Message:</strong> {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div>
                    <strong>Stack Trace:</strong>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1 p-2 bg-gray-50 rounded">
                      {this.state.error.stack}
                    </pre>
                  </div>
                )}
                {this.state.errorInfo?.componentStack && (
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap mt-1 p-2 bg-gray-50 rounded">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-3">
            {canRetry && !isChunkError && (
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again {this.retryCount > 0 && `(${this.maxRetries - this.retryCount} left)`}
              </Button>
            )}
            
            {isChunkError && (
              <Button onClick={() => window.location.reload()} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh Page
              </Button>
            )}

            {this.props.showHomeButton && (
              <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}