'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Performance metrics interface
export interface PerformanceMetrics {
  renderTime: number
  apiCallTime: number
  cacheHitRate: number
  memoryUsage: number
  componentMountTime: number
  lastUpdate: Date
}

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    apiCallTime: 0,
    cacheHitRate: 0,
    memoryUsage: 0,
    componentMountTime: 0,
    lastUpdate: new Date(),
  })

  const mountTime = useRef<number>(0)
  const renderStartTime = useRef<number>(0)
  const apiCallTimes = useRef<number[]>([])
  const cacheHits = useRef<number>(0)
  const cacheMisses = useRef<number>(0)

  // Track component mount time
  useEffect(() => {
    mountTime.current = performance.now()
    
    return () => {
      const unmountTime = performance.now()
      const totalMountTime = unmountTime - mountTime.current
      
      // Log component lifecycle metrics
      console.debug(`Component ${componentName} lifecycle:`, {
        mountTime: totalMountTime,
        renderCount: renderStartTime.current,
      })
    }
  }, [componentName])

  // Track render performance
  const trackRender = useCallback(() => {
    renderStartTime.current = performance.now()
    
    // Use requestAnimationFrame to measure actual render time
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStartTime.current
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        componentMountTime: performance.now() - mountTime.current,
        lastUpdate: new Date(),
      }))
    })
  }, [])

  // Track API call performance
  const trackApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    cacheHit = false
  ): Promise<T> => {
    const startTime = performance.now()
    
    try {
      const result = await apiCall()
      const endTime = performance.now()
      const callTime = endTime - startTime
      
      apiCallTimes.current.push(callTime)
      
      // Keep only last 10 API call times
      if (apiCallTimes.current.length > 10) {
        apiCallTimes.current.shift()
      }
      
      // Update cache hit/miss tracking
      if (cacheHit) {
        cacheHits.current++
      } else {
        cacheMisses.current++
      }
      
      const avgApiTime = apiCallTimes.current.reduce((sum, time) => sum + time, 0) / apiCallTimes.current.length
      const totalRequests = cacheHits.current + cacheMisses.current
      const hitRate = totalRequests > 0 ? (cacheHits.current / totalRequests) * 100 : 0
      
      setMetrics(prev => ({
        ...prev,
        apiCallTime: avgApiTime,
        cacheHitRate: hitRate,
        lastUpdate: new Date(),
      }))
      
      return result
    } catch (error) {
      const endTime = performance.now()
      const callTime = endTime - startTime
      apiCallTimes.current.push(callTime)
      
      throw error
    }
  }, [])

  // Track memory usage (if available)
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory
      const memoryUsage = memInfo.usedJSHeapSize / (1024 * 1024) // Convert to MB
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage,
        lastUpdate: new Date(),
      }))
    }
  }, [])

  // Auto-track memory usage periodically
  useEffect(() => {
    const interval = setInterval(trackMemoryUsage, 5000) // Every 5 seconds
    return () => clearInterval(interval)
  }, [trackMemoryUsage])

  return {
    metrics,
    trackRender,
    trackApiCall,
    trackMemoryUsage,
  }
}

// Performance optimization suggestions
export interface OptimizationSuggestion {
  type: 'warning' | 'error' | 'info'
  message: string
  action?: string
}

export function usePerformanceAnalyzer(metrics: PerformanceMetrics): OptimizationSuggestion[] {
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([])

  useEffect(() => {
    const newSuggestions: OptimizationSuggestion[] = []

    // Analyze render time
    if (metrics.renderTime > 16) { // 60fps = 16.67ms per frame
      newSuggestions.push({
        type: 'warning',
        message: `Render time (${metrics.renderTime.toFixed(2)}ms) exceeds 16ms target`,
        action: 'Consider memoizing components or optimizing render logic',
      })
    }

    // Analyze API call time
    if (metrics.apiCallTime > 1000) {
      newSuggestions.push({
        type: 'warning',
        message: `Average API call time (${metrics.apiCallTime.toFixed(2)}ms) is high`,
        action: 'Consider implementing request optimization or caching',
      })
    }

    // Analyze cache hit rate
    if (metrics.cacheHitRate < 50) {
      newSuggestions.push({
        type: 'info',
        message: `Cache hit rate (${metrics.cacheHitRate.toFixed(1)}%) could be improved`,
        action: 'Review caching strategy and cache durations',
      })
    }

    // Analyze memory usage
    if (metrics.memoryUsage > 100) { // 100MB
      newSuggestions.push({
        type: 'warning',
        message: `Memory usage (${metrics.memoryUsage.toFixed(1)}MB) is high`,
        action: 'Check for memory leaks or optimize data structures',
      })
    }

    // Analyze component mount time
    if (metrics.componentMountTime > 5000) { // 5 seconds
      newSuggestions.push({
        type: 'error',
        message: `Component has been mounted for ${(metrics.componentMountTime / 1000).toFixed(1)}s`,
        action: 'Consider implementing lazy loading or code splitting',
      })
    }

    setSuggestions(newSuggestions)
  }, [metrics])

  return suggestions
}

// Web Vitals tracking
export interface WebVitals {
  FCP: number | null // First Contentful Paint
  LCP: number | null // Largest Contentful Paint
  INP: number | null // Interaction to Next Paint (replaces FID)
  CLS: number | null // Cumulative Layout Shift
  TTFB: number | null // Time to First Byte
}

export function useWebVitals() {
  const [vitals, setVitals] = useState<WebVitals>({
    FCP: null,
    LCP: null,
    INP: null,
    CLS: null,
    TTFB: null,
  })

  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return

    // Import web-vitals dynamically to avoid SSR issues
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => {
        setVitals(prev => ({ ...prev, CLS: metric.value }))
      })

      onINP((metric) => {
        setVitals(prev => ({ ...prev, INP: metric.value }))
      })

      onFCP((metric) => {
        setVitals(prev => ({ ...prev, FCP: metric.value }))
      })

      onLCP((metric) => {
        setVitals(prev => ({ ...prev, LCP: metric.value }))
      })

      onTTFB((metric) => {
        setVitals(prev => ({ ...prev, TTFB: metric.value }))
      })
    }).catch(() => {
      // Fallback implementation if web-vitals is not available
      console.warn('web-vitals library not available')
    })
  }, [])

  return vitals
}

// Performance budget monitoring
export interface PerformanceBudget {
  renderTime: number
  apiCallTime: number
  memoryUsage: number
  bundleSize: number
}

export function usePerformanceBudget(budget: PerformanceBudget) {
  const [violations, setViolations] = useState<string[]>([])

  const checkBudget = useCallback((metrics: PerformanceMetrics) => {
    const newViolations: string[] = []

    if (metrics.renderTime > budget.renderTime) {
      newViolations.push(`Render time exceeded budget: ${metrics.renderTime.toFixed(2)}ms > ${budget.renderTime}ms`)
    }

    if (metrics.apiCallTime > budget.apiCallTime) {
      newViolations.push(`API call time exceeded budget: ${metrics.apiCallTime.toFixed(2)}ms > ${budget.apiCallTime}ms`)
    }

    if (metrics.memoryUsage > budget.memoryUsage) {
      newViolations.push(`Memory usage exceeded budget: ${metrics.memoryUsage.toFixed(1)}MB > ${budget.memoryUsage}MB`)
    }

    setViolations(newViolations)
  }, [budget])

  return {
    violations,
    checkBudget,
    isWithinBudget: violations.length === 0,
  }
}

// Performance reporting
export function usePerformanceReporting() {
  const reportPerformance = useCallback((data: {
    componentName: string
    metrics: PerformanceMetrics
    vitals?: WebVitals
    userAgent?: string
  }) => {
    // In a real application, this would send data to an analytics service
    console.log('Performance Report:', {
      timestamp: new Date().toISOString(),
      ...data,
    })

    // Example: Send to analytics service
    // analytics.track('performance_metrics', data)
  }, [])

  return { reportPerformance }
}

// Hook for tracking specific operations
export function useOperationTracker() {
  const [operations, setOperations] = useState<Map<string, number>>(new Map())

  const startOperation = useCallback((operationId: string) => {
    setOperations(prev => new Map(prev.set(operationId, performance.now())))
  }, [])

  const endOperation = useCallback((operationId: string): number | null => {
    const startTime = operations.get(operationId)
    if (!startTime) return null

    const duration = performance.now() - startTime
    setOperations(prev => {
      const newMap = new Map(prev)
      newMap.delete(operationId)
      return newMap
    })

    return duration
  }, [operations])

  const getOperationDuration = useCallback((operationId: string): number | null => {
    const startTime = operations.get(operationId)
    if (!startTime) return null
    return performance.now() - startTime
  }, [operations])

  return {
    startOperation,
    endOperation,
    getOperationDuration,
    activeOperations: Array.from(operations.keys()),
  }
}

export default {
  usePerformanceMonitor,
  usePerformanceAnalyzer,
  useWebVitals,
  usePerformanceBudget,
  usePerformanceReporting,
  useOperationTracker,
}