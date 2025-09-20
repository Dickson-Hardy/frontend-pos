'use client'

import { ApiError } from './api-unified'

export interface ErrorReport {
  id: string
  timestamp: string
  error: {
    name: string
    message: string
    stack?: string
  }
  context: {
    url: string
    userAgent: string
    userId?: string
    sessionId?: string
    component?: string
    action?: string
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  metadata?: Record<string, any>
}

export interface ErrorReportingConfig {
  enabled: boolean
  endpoint?: string
  apiKey?: string
  userId?: string
  sessionId?: string
  maxReports: number
  reportingInterval: number
}

class ErrorReportingService {
  private config: ErrorReportingConfig
  private reportQueue: ErrorReport[] = []
  private reportingTimer?: NodeJS.Timeout

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'production',
      maxReports: 50,
      reportingInterval: 30000, // 30 seconds
      ...config,
    }

    if (this.config.enabled) {
      this.startReporting()
    }
  }

  updateConfig(newConfig: Partial<ErrorReportingConfig>) {
    this.config = { ...this.config, ...newConfig }
  }

  reportError(
    error: Error | ApiError | string,
    context: Partial<ErrorReport['context']> = {},
    options: {
      severity?: ErrorReport['severity']
      tags?: string[]
      metadata?: Record<string, any>
      component?: string
      action?: string
    } = {}
  ) {
    if (!this.config.enabled) {
      return
    }

    const report = this.createErrorReport(error, context, options)
    this.addToQueue(report)
  }

  private createErrorReport(
    error: Error | ApiError | string,
    context: Partial<ErrorReport['context']>,
    options: {
      severity?: ErrorReport['severity']
      tags?: string[]
      metadata?: Record<string, any>
      component?: string
      action?: string
    }
  ): ErrorReport {
    const errorObj = this.normalizeError(error)
    const severity = options.severity || this.determineSeverity(errorObj)

    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      error: errorObj,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.config.userId,
        sessionId: this.config.sessionId,
        component: options.component,
        action: options.action,
        ...context,
      },
      severity,
      tags: options.tags || [],
      metadata: options.metadata,
    }
  }

  private normalizeError(error: Error | ApiError | string) {
    if (typeof error === 'string') {
      return {
        name: 'StringError',
        message: error,
      }
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }
    }

    // ApiError
    return {
      name: 'ApiError',
      message: error.message,
      stack: error.details?.stack,
    }
  }

  private determineSeverity(error: { name: string; message: string }): ErrorReport['severity'] {
    // Critical errors
    if (error.name === 'ChunkLoadError' || 
        error.message.includes('Loading chunk') ||
        error.message.includes('Loading CSS chunk')) {
      return 'critical'
    }

    // High severity errors
    if (error.name === 'TypeError' || 
        error.name === 'ReferenceError' ||
        error.message.includes('Network Error') ||
        error.message.includes('500')) {
      return 'high'
    }

    // Medium severity errors
    if (error.name === 'ApiError' ||
        error.message.includes('401') ||
        error.message.includes('403') ||
        error.message.includes('404')) {
      return 'medium'
    }

    return 'low'
  }

  private addToQueue(report: ErrorReport) {
    this.reportQueue.push(report)

    // Limit queue size
    if (this.reportQueue.length > this.config.maxReports) {
      this.reportQueue = this.reportQueue.slice(-this.config.maxReports)
    }

    // Send immediately for critical errors
    if (report.severity === 'critical') {
      this.sendReports([report])
    }
  }

  private startReporting() {
    this.reportingTimer = setInterval(() => {
      if (this.reportQueue.length > 0) {
        const reportsToSend = [...this.reportQueue]
        this.reportQueue = []
        this.sendReports(reportsToSend)
      }
    }, this.config.reportingInterval)
  }

  private async sendReports(reports: ErrorReport[]) {
    if (!this.config.endpoint) {
      // Log to console in development or when no endpoint is configured
      console.group('Error Reports')
      reports.forEach(report => {
        console.error(`[${report.severity.toUpperCase()}] ${report.error.name}: ${report.error.message}`, report)
      })
      console.groupEnd()
      return
    }

    try {
      await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
        },
        body: JSON.stringify({ reports }),
      })
    } catch (error) {
      console.error('Failed to send error reports:', error)
      // Re-add reports to queue for retry
      this.reportQueue.unshift(...reports)
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  getQueuedReports(): ErrorReport[] {
    return [...this.reportQueue]
  }

  clearQueue() {
    this.reportQueue = []
  }

  destroy() {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer)
    }
    this.clearQueue()
  }
}

// Global error reporting instance
export const errorReporting = new ErrorReportingService()

// Global error handlers
if (typeof window !== 'undefined') {
  // Catch unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    errorReporting.reportError(
      event.error || new Error(event.message),
      {
        url: event.filename,
        component: 'global',
        action: 'unhandled_error',
      },
      {
        severity: 'high',
        tags: ['unhandled', 'javascript'],
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
        },
      }
    )
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    errorReporting.reportError(
      event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      {
        component: 'global',
        action: 'unhandled_promise_rejection',
      },
      {
        severity: 'high',
        tags: ['unhandled', 'promise'],
      }
    )
  })

  // Catch resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement
      errorReporting.reportError(
        new Error(`Resource failed to load: ${target.tagName}`),
        {
          component: 'global',
          action: 'resource_load_error',
        },
        {
          severity: 'medium',
          tags: ['resource', 'loading'],
          metadata: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
          },
        }
      )
    }
  }, true)
}

// Helper functions for manual error reporting
export function reportError(
  error: Error | ApiError | string,
  context?: string,
  metadata?: Record<string, any>
) {
  errorReporting.reportError(error, { component: context }, { metadata })
}

export function reportApiError(
  error: ApiError,
  endpoint: string,
  method: string = 'GET'
) {
  errorReporting.reportError(error, {
    component: 'api',
    action: `${method} ${endpoint}`,
  }, {
    tags: ['api', 'network'],
    metadata: {
      endpoint,
      method,
      statusCode: error.code,
    },
  })
}

export function reportComponentError(
  error: Error,
  componentName: string,
  action?: string
) {
  errorReporting.reportError(error, {
    component: componentName,
    action,
  }, {
    tags: ['component', 'react'],
  })
}

export default errorReporting