'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePerformanceMonitor, useWebVitals, usePerformanceAnalyzer } from '@/hooks/use-performance'
import { apiOptimizationUtils } from '@/lib/api-optimization'
import { cacheManager } from '@/lib/cache-manager'
import { Activity, Database, Zap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface PerformanceMonitorProps {
  componentName?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function PerformanceMonitor({
  componentName = 'App',
  showDetails = false,
  autoRefresh = true,
  refreshInterval = 5000,
}: PerformanceMonitorProps) {
  const { metrics, trackRender } = usePerformanceMonitor(componentName)
  const vitals = useWebVitals()
  const suggestions = usePerformanceAnalyzer(metrics)
  const [optimizationStats, setOptimizationStats] = useState<any>(null)

  // Auto-refresh optimization stats
  useEffect(() => {
    const updateStats = () => {
      setOptimizationStats(apiOptimizationUtils.getOptimizationStats())
    }

    updateStats()

    if (autoRefresh) {
      const interval = setInterval(updateStats, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Track renders
  useEffect(() => {
    trackRender()
  })

  const formatTime = (time: number) => {
    if (time < 1000) return `${time.toFixed(1)}ms`
    return `${(time / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getPerformanceColor = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return 'text-green-600'
    if (value <= thresholds.fair) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getVitalStatus = (vital: number | null, thresholds: { good: number; fair: number }) => {
    if (vital === null) return 'unknown'
    if (vital <= thresholds.good) return 'good'
    if (vital <= thresholds.fair) return 'fair'
    return 'poor'
  }

  if (!showDetails) {
    // Compact view - just show critical metrics
    return (
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-1">
          <Activity className="h-4 w-4" />
          <span className={getPerformanceColor(metrics.renderTime, { good: 16, fair: 50 })}>
            {formatTime(metrics.renderTime)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Database className="h-4 w-4" />
          <span className={getPerformanceColor(100 - metrics.cacheHitRate, { good: 20, fair: 50 })}>
            {metrics.cacheHitRate.toFixed(1)}%
          </span>
        </div>
        {suggestions.length > 0 && (
          <Badge variant="outline" className="text-yellow-600">
            {suggestions.length} issues
          </Badge>
        )}
      </div>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Performance Monitor - {componentName}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOptimizationStats(apiOptimizationUtils.getOptimizationStats())}
          >
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="vitals">Web Vitals</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="suggestions">Issues</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Render Time</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.renderTime, { good: 16, fair: 50 })}`}>
                  {formatTime(metrics.renderTime)}
                </div>
                <Progress 
                  value={Math.min((metrics.renderTime / 50) * 100, 100)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">API Calls</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.apiCallTime, { good: 500, fair: 1000 })}`}>
                  {formatTime(metrics.apiCallTime)}
                </div>
                <Progress 
                  value={Math.min((metrics.apiCallTime / 2000) * 100, 100)} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Cache Hit Rate</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(100 - metrics.cacheHitRate, { good: 20, fair: 50 })}`}>
                  {metrics.cacheHitRate.toFixed(1)}%
                </div>
                <Progress 
                  value={metrics.cacheHitRate} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Memory Usage</div>
                <div className={`text-2xl font-bold ${getPerformanceColor(metrics.memoryUsage, { good: 50, fair: 100 })}`}>
                  {formatBytes(metrics.memoryUsage * 1024 * 1024)}
                </div>
                <Progress 
                  value={Math.min((metrics.memoryUsage / 200) * 100, 100)} 
                  className="h-2"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vitals" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'FCP', value: vitals.FCP, unit: 'ms', thresholds: { good: 1800, fair: 3000 } },
                { name: 'LCP', value: vitals.LCP, unit: 'ms', thresholds: { good: 2500, fair: 4000 } },
                { name: 'FID', value: vitals.FID, unit: 'ms', thresholds: { good: 100, fair: 300 } },
                { name: 'CLS', value: vitals.CLS, unit: '', thresholds: { good: 0.1, fair: 0.25 } },
                { name: 'TTFB', value: vitals.TTFB, unit: 'ms', thresholds: { good: 800, fair: 1800 } },
              ].map((vital) => {
                const status = getVitalStatus(vital.value, vital.thresholds)
                const StatusIcon = status === 'good' ? CheckCircle : status === 'fair' ? AlertTriangle : XCircle
                
                return (
                  <div key={vital.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{vital.name}</div>
                      <div className="text-sm text-gray-500">
                        {vital.value !== null ? `${vital.value.toFixed(vital.name === 'CLS' ? 3 : 0)}${vital.unit}` : 'N/A'}
                      </div>
                    </div>
                    <StatusIcon 
                      className={`h-5 w-5 ${
                        status === 'good' ? 'text-green-500' : 
                        status === 'fair' ? 'text-yellow-500' : 
                        status === 'poor' ? 'text-red-500' : 'text-gray-400'
                      }`} 
                    />
                  </div>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            {optimizationStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h3 className="font-medium">Cache Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Entries:</span>
                      <span className="font-mono">{optimizationStats.cache.totalEntries}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Size:</span>
                      <span className="font-mono">{formatBytes(optimizationStats.cache.totalSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hit Rate:</span>
                      <span className="font-mono">{optimizationStats.cache.hitRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Evictions:</span>
                      <span className="font-mono">{optimizationStats.cache.evictionCount}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium">Request Queue</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Critical:</span>
                      <span className="font-mono">{optimizationStats.requestQueue.critical}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High:</span>
                      <span className="font-mono">{optimizationStats.requestQueue.high}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Medium:</span>
                      <span className="font-mono">{optimizationStats.requestQueue.medium}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Low:</span>
                      <span className="font-mono">{optimizationStats.requestQueue.low}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>No performance issues detected!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${
                      suggestion.type === 'error' ? 'border-red-200 bg-red-50' :
                      suggestion.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {suggestion.type === 'error' ? (
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      ) : suggestion.type === 'warning' ? (
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                      ) : (
                        <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{suggestion.message}</p>
                        {suggestion.action && (
                          <p className="text-sm text-gray-600 mt-1">{suggestion.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Floating performance indicator for development
export function FloatingPerformanceIndicator() {
  const [isVisible, setIsVisible] = useState(false)
  const { metrics } = usePerformanceMonitor('Global')

  // Only show in development
  useEffect(() => {
    setIsVisible(process.env.NODE_ENV === 'development')
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border shadow-lg rounded-lg p-3 text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <Activity className="h-3 w-3" />
          <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
        </div>
        <div className="flex items-center space-x-2">
          <Database className="h-3 w-3" />
          <span>Cache: {metrics.cacheHitRate.toFixed(1)}%</span>
        </div>
        <div className="flex items-center space-x-2">
          <Zap className="h-3 w-3" />
          <span>API: {metrics.apiCallTime.toFixed(1)}ms</span>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor