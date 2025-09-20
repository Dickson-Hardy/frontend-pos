'use client'

// Enhanced cache management system with better performance and features
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  duration: number
  accessCount: number
  lastAccessed: number
  tags: string[]
  size: number
}

export interface CacheConfig {
  maxSize: number // Maximum cache size in MB
  maxEntries: number // Maximum number of entries
  defaultDuration: number // Default cache duration in ms
  cleanupInterval: number // Cleanup interval in ms
  compressionThreshold: number // Size threshold for compression in bytes
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  missRate: number
  evictionCount: number
  compressionRatio: number
}

class EnhancedCacheManager {
  private cache = new Map<string, CacheEntry>()
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    compressionSaves: 0,
  }
  private config: CacheConfig
  private cleanupTimer: NodeJS.Timeout | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 50, // 50MB default
      maxEntries: 1000,
      defaultDuration: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      compressionThreshold: 10 * 1024, // 10KB
      ...config,
    }

    this.startCleanupTimer()
  }

  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private calculateSize(data: any): number {
    // Rough estimation of object size in bytes
    const jsonString = JSON.stringify(data)
    return new Blob([jsonString]).size
  }

  private compressData(data: any): { compressed: string; originalSize: number; compressedSize: number } {
    const jsonString = JSON.stringify(data)
    const originalSize = new Blob([jsonString]).size
    
    // Simple compression using base64 encoding (in real app, use proper compression)
    const compressed = btoa(jsonString)
    const compressedSize = new Blob([compressed]).size
    
    return {
      compressed,
      originalSize,
      compressedSize,
    }
  }

  private decompressData(compressed: string): any {
    try {
      const decompressed = atob(compressed)
      return JSON.parse(decompressed)
    } catch (error) {
      console.error('Failed to decompress cache data:', error)
      return null
    }
  }

  private shouldCompress(size: number): boolean {
    return size > this.config.compressionThreshold
  }

  private evictLRU() {
    if (this.cache.size === 0) return

    let oldestKey = ''
    let oldestTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.stats.evictions++
    }
  }

  private evictExpired() {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.duration) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key)
    })

    return expiredKeys.length
  }

  private getTotalSize(): number {
    let totalSize = 0
    for (const entry of this.cache.values()) {
      totalSize += entry.size
    }
    return totalSize
  }

  private enforceMemoryLimits() {
    // Evict expired entries first
    this.evictExpired()

    // Check size limits
    const totalSizeMB = this.getTotalSize() / (1024 * 1024)
    
    while (
      (this.cache.size > this.config.maxEntries || totalSizeMB > this.config.maxSize) &&
      this.cache.size > 0
    ) {
      this.evictLRU()
    }
  }

  set<T>(key: string, data: T, options: {
    duration?: number
    tags?: string[]
    compress?: boolean
  } = {}): void {
    const {
      duration = this.config.defaultDuration,
      tags = [],
      compress = false,
    } = options

    const now = Date.now()
    let processedData = data
    let size = this.calculateSize(data)

    // Apply compression if needed
    if (compress || this.shouldCompress(size)) {
      const compressionResult = this.compressData(data)
      processedData = { __compressed: true, data: compressionResult.compressed } as any
      size = compressionResult.compressedSize
      this.stats.compressionSaves += compressionResult.originalSize - compressionResult.compressedSize
    }

    const entry: CacheEntry<T> = {
      data: processedData,
      timestamp: now,
      duration,
      accessCount: 0,
      lastAccessed: now,
      tags,
      size,
    }

    this.cache.set(key, entry)
    this.enforceMemoryLimits()
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      return null
    }

    const now = Date.now()
    
    // Check if expired
    if (now - entry.timestamp > entry.duration) {
      this.cache.delete(key)
      this.stats.misses++
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    this.stats.hits++

    // Handle decompression
    let data = entry.data
    if (typeof data === 'object' && data !== null && (data as any).__compressed) {
      data = this.decompressData((data as any).data)
    }

    return data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.duration) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      compressionSaves: 0,
    }
  }

  invalidateByTag(tag: string): number {
    let invalidated = 0
    const keysToDelete: string[] = []

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      invalidated++
    })

    return invalidated
  }

  invalidateByPattern(pattern: string | RegExp): number {
    let invalidated = 0
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => {
      this.cache.delete(key)
      invalidated++
    })

    return invalidated
  }

  cleanup(): void {
    const expiredCount = this.evictExpired()
    this.enforceMemoryLimits()
    
    if (expiredCount > 0) {
      console.debug(`Cache cleanup: removed ${expiredCount} expired entries`)
    }
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses
    const totalSize = this.getTotalSize()

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitRate: totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.stats.misses / totalRequests) * 100 : 0,
      evictionCount: this.stats.evictions,
      compressionRatio: this.stats.compressionSaves > 0 ? 
        (this.stats.compressionSaves / (totalSize + this.stats.compressionSaves)) * 100 : 0,
    }
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  getEntries(): Array<{ key: string; entry: CacheEntry }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }))
  }

  // Prefetch data for better performance
  async prefetch<T>(key: string, fetcher: () => Promise<T>, options?: {
    duration?: number
    tags?: string[]
    force?: boolean
  }): Promise<T> {
    const { force = false } = options || {}
    
    if (!force && this.has(key)) {
      return this.get<T>(key)!
    }

    try {
      const data = await fetcher()
      this.set(key, data, options)
      return data
    } catch (error) {
      console.error(`Failed to prefetch data for key: ${key}`, error)
      throw error
    }
  }

  // Batch operations for better performance
  setMany<T>(entries: Array<{ key: string; data: T; options?: any }>): void {
    entries.forEach(({ key, data, options }) => {
      this.set(key, data, options)
    })
  }

  getMany<T>(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {}
    keys.forEach(key => {
      result[key] = this.get<T>(key)
    })
    return result
  }

  deleteMany(keys: string[]): number {
    let deleted = 0
    keys.forEach(key => {
      if (this.delete(key)) {
        deleted++
      }
    })
    return deleted
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    this.clear()
  }
}

// Create and export the enhanced cache manager instance
export const cacheManager = new EnhancedCacheManager({
  maxSize: 100, // 100MB
  maxEntries: 2000,
  defaultDuration: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 2 * 60 * 1000, // 2 minutes
  compressionThreshold: 50 * 1024, // 50KB
})

// Cache utilities for common operations
export const cacheUtils = {
  // Generate cache keys with consistent formatting
  generateKey: (prefix: string, ...parts: (string | number | undefined)[]): string => {
    const cleanParts = parts.filter(part => part !== undefined && part !== null)
    return `${prefix}-${cleanParts.join('-')}`
  },

  // Cache tags for better invalidation
  tags: {
    products: 'products',
    sales: 'sales',
    inventory: 'inventory',
    users: 'users',
    outlets: 'outlets',
    reports: 'reports',
    dashboard: 'dashboard',
  },

  // Common cache durations
  durations: {
    short: 30 * 1000, // 30 seconds
    medium: 2 * 60 * 1000, // 2 minutes
    long: 10 * 60 * 1000, // 10 minutes
    veryLong: 30 * 60 * 1000, // 30 minutes
  },

  // Invalidate related caches
  invalidateRelated: (operation: 'create' | 'update' | 'delete', entity: string, outletId?: string) => {
    const patterns = []
    
    switch (entity) {
      case 'product':
        patterns.push('products-', 'inventory-', 'dashboard-')
        if (outletId) patterns.push(`-${outletId}`)
        break
      case 'sale':
        patterns.push('sales-', 'reports-', 'dashboard-', 'daily-summary-')
        if (outletId) patterns.push(`-${outletId}`)
        break
      case 'inventory':
        patterns.push('inventory-', 'products-', 'dashboard-')
        if (outletId) patterns.push(`-${outletId}`)
        break
      case 'user':
        patterns.push('users-', 'staff-performance-')
        if (outletId) patterns.push(`-${outletId}`)
        break
    }

    patterns.forEach(pattern => {
      cacheManager.invalidateByPattern(pattern)
    })
  },
}

export default cacheManager