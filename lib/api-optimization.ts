'use client'

import { cacheManager, cacheUtils } from './cache-manager'

// Request deduplication to prevent duplicate API calls
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clear(): void {
    this.pendingRequests.clear()
  }

  hasPending(key: string): boolean {
    return this.pendingRequests.has(key)
  }

  getPendingCount(): number {
    return this.pendingRequests.size
  }
}

export const requestDeduplicator = new RequestDeduplicator()

// Batch API requests for better performance
export interface BatchRequest {
  id: string
  endpoint: string
  params?: any
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
}

export interface BatchResponse<T = any> {
  id: string
  data?: T
  error?: string
  status: number
}

class BatchRequestManager {
  private batchQueue: BatchRequest[] = []
  private batchTimeout: NodeJS.Timeout | null = null
  private batchSize = 10
  private batchDelay = 50 // ms

  constructor(config?: { batchSize?: number; batchDelay?: number }) {
    if (config) {
      this.batchSize = config.batchSize || 10
      this.batchDelay = config.batchDelay || 50
    }
  }

  addToBatch(request: BatchRequest): Promise<BatchResponse> {
    return new Promise((resolve, reject) => {
      const requestWithCallback = {
        ...request,
        resolve,
        reject,
      } as BatchRequest & {
        resolve: (value: BatchResponse) => void
        reject: (error: any) => void
      }

      this.batchQueue.push(requestWithCallback)

      if (this.batchQueue.length >= this.batchSize) {
        this.processBatch()
      } else if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => {
          this.processBatch()
        }, this.batchDelay)
      }
    })
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    if (this.batchQueue.length === 0) return

    const currentBatch = this.batchQueue.splice(0, this.batchSize)
    
    try {
      // In a real implementation, this would make a batch API call
      // For now, we'll simulate individual requests
      const responses = await Promise.allSettled(
        currentBatch.map(async (request) => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
          return {
            id: request.id,
            data: { success: true },
            status: 200,
          } as BatchResponse
        })
      )

      responses.forEach((response, index) => {
        const request = currentBatch[index] as any
        if (response.status === 'fulfilled') {
          request.resolve(response.value)
        } else {
          request.reject(response.reason)
        }
      })
    } catch (error) {
      currentBatch.forEach((request: any) => {
        request.reject(error)
      })
    }
  }

  flush(): Promise<void> {
    return this.processBatch()
  }

  clear(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }
    this.batchQueue = []
  }
}

export const batchRequestManager = new BatchRequestManager()

// Request prioritization
export type RequestPriority = 'critical' | 'high' | 'medium' | 'low'

export interface PriorityRequest {
  id: string
  priority: RequestPriority
  requestFn: () => Promise<any>
  timestamp: number
}

class RequestPriorityQueue {
  private queues: Record<RequestPriority, PriorityRequest[]> = {
    critical: [],
    high: [],
    medium: [],
    low: [],
  }
  private processing = false
  private maxConcurrent = 3

  async addRequest<T>(
    id: string,
    requestFn: () => Promise<T>,
    priority: RequestPriority = 'medium'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: PriorityRequest & {
        resolve: (value: T) => void
        reject: (error: any) => void
      } = {
        id,
        priority,
        requestFn,
        timestamp: Date.now(),
        resolve,
        reject,
      } as any

      this.queues[priority].push(request)
      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return
    this.processing = true

    const activeTasks: Promise<void>[] = []

    while (activeTasks.length < this.maxConcurrent) {
      const nextRequest = this.getNextRequest()
      if (!nextRequest) break

      const task = this.executeRequest(nextRequest as any)
      activeTasks.push(task)
    }

    if (activeTasks.length > 0) {
      await Promise.race(activeTasks)
      this.processing = false
      // Continue processing if there are more requests
      if (this.hasRequests()) {
        this.processQueue()
      }
    } else {
      this.processing = false
    }
  }

  private getNextRequest(): PriorityRequest | null {
    const priorities: RequestPriority[] = ['critical', 'high', 'medium', 'low']
    
    for (const priority of priorities) {
      if (this.queues[priority].length > 0) {
        return this.queues[priority].shift()!
      }
    }
    
    return null
  }

  private async executeRequest(request: PriorityRequest & {
    resolve: (value: any) => void
    reject: (error: any) => void
  }): Promise<void> {
    try {
      const result = await request.requestFn()
      request.resolve(result)
    } catch (error) {
      request.reject(error)
    }
  }

  private hasRequests(): boolean {
    return Object.values(this.queues).some(queue => queue.length > 0)
  }

  getQueueStats() {
    return {
      critical: this.queues.critical.length,
      high: this.queues.high.length,
      medium: this.queues.medium.length,
      low: this.queues.low.length,
      total: Object.values(this.queues).reduce((sum, queue) => sum + queue.length, 0),
      processing: this.processing,
    }
  }

  clear(): void {
    Object.keys(this.queues).forEach(priority => {
      this.queues[priority as RequestPriority] = []
    })
  }
}

export const requestPriorityQueue = new RequestPriorityQueue()

// Background sync for offline support
export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: string
  data: any
  timestamp: number
  retryCount: number
  maxRetries: number
}

class BackgroundSyncManager {
  private syncQueue: SyncOperation[] = []
  private isOnline = true
  private syncInterval: NodeJS.Timeout | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      window.addEventListener('online', () => {
        this.isOnline = true
        this.processSyncQueue()
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })

      // Load persisted queue from localStorage
      this.loadSyncQueue()
      
      // Start periodic sync
      this.startPeriodicSync()
    }
  }

  addToSyncQueue(operation: Omit<SyncOperation, 'timestamp' | 'retryCount'>): void {
    const syncOperation: SyncOperation = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.syncQueue.push(syncOperation)
    this.persistSyncQueue()

    if (this.isOnline) {
      this.processSyncQueue()
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return

    const operations = [...this.syncQueue]
    this.syncQueue = []

    for (const operation of operations) {
      try {
        await this.executeSyncOperation(operation)
        console.log(`Sync operation ${operation.id} completed successfully`)
      } catch (error) {
        console.error(`Sync operation ${operation.id} failed:`, error)
        
        if (operation.retryCount < operation.maxRetries) {
          operation.retryCount++
          this.syncQueue.push(operation)
        } else {
          console.error(`Sync operation ${operation.id} exceeded max retries`)
        }
      }
    }

    this.persistSyncQueue()
  }

  private async executeSyncOperation(operation: SyncOperation): Promise<void> {
    // In a real implementation, this would make the actual API call
    // For now, we'll simulate the operation
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Invalidate related caches
    cacheUtils.invalidateRelated(operation.type, operation.entity)
  }

  private loadSyncQueue(): void {
    try {
      const stored = localStorage.getItem('syncQueue')
      if (stored) {
        this.syncQueue = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error)
    }
  }

  private persistSyncQueue(): void {
    try {
      localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Failed to persist sync queue:', error)
    }
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.processSyncQueue()
      }
    }, 30000) // Sync every 30 seconds
  }

  getSyncStats() {
    return {
      queueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      oldestOperation: this.syncQueue.length > 0 ? 
        Math.min(...this.syncQueue.map(op => op.timestamp)) : null,
    }
  }

  clearSyncQueue(): void {
    this.syncQueue = []
    this.persistSyncQueue()
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

export const backgroundSyncManager = new BackgroundSyncManager()

// Smart prefetching based on user behavior
class SmartPrefetcher {
  private userPatterns = new Map<string, number>()
  private prefetchQueue: Array<{ key: string; fetcher: () => Promise<any> }> = []
  private isProcessing = false

  recordUserAction(action: string): void {
    const count = this.userPatterns.get(action) || 0
    this.userPatterns.set(action, count + 1)
  }

  shouldPrefetch(action: string, threshold = 3): boolean {
    const count = this.userPatterns.get(action) || 0
    return count >= threshold
  }

  addToPrefetchQueue(key: string, fetcher: () => Promise<any>): void {
    // Check if already cached
    if (cacheManager.has(key)) return

    // Check if already in queue
    if (this.prefetchQueue.some(item => item.key === key)) return

    this.prefetchQueue.push({ key, fetcher })
    this.processPrefetchQueue()
  }

  private async processPrefetchQueue(): Promise<void> {
    if (this.isProcessing || this.prefetchQueue.length === 0) return

    this.isProcessing = true

    // Process one item at a time to avoid overwhelming the network
    while (this.prefetchQueue.length > 0) {
      const item = this.prefetchQueue.shift()!
      
      try {
        const data = await item.fetcher()
        cacheManager.set(item.key, data, {
          duration: cacheUtils.durations.long,
          tags: ['prefetched'],
        })
      } catch (error) {
        console.warn(`Prefetch failed for ${item.key}:`, error)
      }

      // Small delay between prefetch operations
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    this.isProcessing = false
  }

  getUserPatterns(): Record<string, number> {
    return Object.fromEntries(this.userPatterns)
  }

  clearPatterns(): void {
    this.userPatterns.clear()
  }
}

export const smartPrefetcher = new SmartPrefetcher()

// API call optimization utilities
export const apiOptimizationUtils = {
  // Create optimized API call with all enhancements
  createOptimizedCall: <T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      priority?: RequestPriority
      cacheDuration?: number
      tags?: string[]
      deduplicate?: boolean
      batch?: boolean
    } = {}
  ): Promise<T> => {
    const {
      priority = 'medium',
      cacheDuration = cacheUtils.durations.medium,
      tags = [],
      deduplicate = true,
      batch = false,
    } = options

    // Check cache first
    const cached = cacheManager.get<T>(key)
    if (cached) {
      return Promise.resolve(cached)
    }

    const optimizedFetcher = async (): Promise<T> => {
      if (deduplicate) {
        return requestDeduplicator.deduplicate(key, fetcher)
      }
      return fetcher()
    }

    // Add to priority queue
    return requestPriorityQueue.addRequest(key, async () => {
      const data = await optimizedFetcher()
      
      // Cache the result
      cacheManager.set(key, data, {
        duration: cacheDuration,
        tags,
      })
      
      return data
    }, priority)
  },

  // Prefetch related data based on current data
  prefetchRelated: (currentEntity: string, currentId: string, outletId?: string) => {
    const prefetchActions: Array<{ key: string; fetcher: () => Promise<any> }> = []

    switch (currentEntity) {
      case 'product':
        // Prefetch related inventory data
        prefetchActions.push({
          key: cacheUtils.generateKey('inventory-items', outletId),
          fetcher: () => import('../lib/api-unified').then(({ apiClient }) => 
            apiClient.inventory.getItems(outletId)
          ),
        })
        break
      
      case 'sale':
        // Prefetch daily summary and recent sales
        prefetchActions.push(
          {
            key: cacheUtils.generateKey('daily-summary', outletId),
            fetcher: () => import('../lib/api-unified').then(({ apiClient }) => 
              apiClient.sales.getDailySummary(outletId)
            ),
          },
          {
            key: cacheUtils.generateKey('recent-sales', outletId),
            fetcher: () => import('../lib/api-unified').then(({ apiClient }) => 
              apiClient.sales.getAll({ outletId, limit: 10 } as any)
            ),
          }
        )
        break
    }

    prefetchActions.forEach(({ key, fetcher }) => {
      smartPrefetcher.addToPrefetchQueue(key, fetcher)
    })
  },

  // Optimize data loading for dashboard
  optimizeDashboardLoading: (outletId?: string) => {
    const criticalData = [
      {
        key: cacheUtils.generateKey('dashboard-sales', outletId),
        fetcher: () => import('../lib/api-unified').then(({ apiClient }) => 
          apiClient.sales.getDailySummary(outletId)
        ),
        priority: 'critical' as RequestPriority,
      },
      {
        key: cacheUtils.generateKey('dashboard-inventory', outletId),
        fetcher: () => import('../lib/api-unified').then(({ apiClient }) => 
          apiClient.inventory.getStats(outletId)
        ),
        priority: 'high' as RequestPriority,
      },
    ]

    return Promise.all(
      criticalData.map(({ key, fetcher, priority }) =>
        apiOptimizationUtils.createOptimizedCall(key, fetcher, {
          priority,
          cacheDuration: cacheUtils.durations.short,
          tags: [cacheUtils.tags.dashboard],
        })
      )
    )
  },

  // Get optimization statistics
  getOptimizationStats: () => ({
    cache: cacheManager.getStats(),
    requestQueue: requestPriorityQueue.getQueueStats(),
    backgroundSync: backgroundSyncManager.getSyncStats(),
    deduplication: {
      pendingRequests: requestDeduplicator.getPendingCount(),
    },
    userPatterns: smartPrefetcher.getUserPatterns(),
  }),

  // Clear all optimization caches and queues
  clearAll: () => {
    cacheManager.clear()
    requestDeduplicator.clear()
    requestPriorityQueue.clear()
    batchRequestManager.clear()
    smartPrefetcher.clearPatterns()
  },
}

export default {
  requestDeduplicator,
  batchRequestManager,
  requestPriorityQueue,
  backgroundSyncManager,
  smartPrefetcher,
  apiOptimizationUtils,
}