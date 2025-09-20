// Advanced caching strategies for different data types

export interface CacheConfig {
  key: string
  duration: number // in milliseconds
  strategy: 'memory' | 'localStorage' | 'sessionStorage'
  maxSize?: number
  compression?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  duration: number
  accessCount: number
  lastAccessed: number
}

// Cache strategies for different data types
export const cacheStrategies = {
  // Fast-changing data (30 seconds - 2 minutes)
  realtime: {
    sales: { duration: 30 * 1000, strategy: 'memory' as const },
    inventory: { duration: 1 * 60 * 1000, strategy: 'memory' as const },
    shifts: { duration: 30 * 1000, strategy: 'memory' as const },
  },

  // Medium-changing data (2-10 minutes)
  frequent: {
    products: { duration: 2 * 60 * 1000, strategy: 'memory' as const },
    users: { duration: 5 * 60 * 1000, strategy: 'memory' as const },
    reports: { duration: 5 * 60 * 1000, strategy: 'memory' as const },
  },

  // Slow-changing data (10+ minutes)
  stable: {
    outlets: { duration: 10 * 60 * 1000, strategy: 'localStorage' as const },
    categories: { duration: 30 * 60 * 1000, strategy: 'localStorage' as const },
    settings: { duration: 60 * 60 * 1000, strategy: 'localStorage' as const },
  },

  // Session-based data
  session: {
    auth: { duration: 24 * 60 * 60 * 1000, strategy: 'localStorage' as const },
    preferences: { duration: 7 * 24 * 60 * 60 * 1000, strategy: 'localStorage' as const },
  },
}

class AdvancedCache<T> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private strategy: 'memory' | 'localStorage' | 'sessionStorage'

  constructor(maxSize = 100, strategy: 'memory' | 'localStorage' | 'sessionStorage' = 'memory') {
    this.maxSize = maxSize
    this.strategy = strategy
    
    // Load from persistent storage if not memory strategy
    if (strategy !== 'memory') {
      this.loadFromStorage()
    }
  }

  private getStorage() {
    switch (this.strategy) {
      case 'localStorage':
        return typeof window !== 'undefined' ? window.localStorage : null
      case 'sessionStorage':
        return typeof window !== 'undefined' ? window.sessionStorage : null
      default:
        return null
    }
  }

  private loadFromStorage() {
    const storage = this.getStorage()
    if (!storage) return

    try {
      const stored = storage.getItem('cache-data')
      if (stored) {
        const data = JSON.parse(stored)
        Object.entries(data).forEach(([key, entry]) => {
          this.cache.set(key, entry as CacheEntry<T>)
        })
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error)
    }
  }

  private saveToStorage() {
    const storage = this.getStorage()
    if (!storage) return

    try {
      const data = Object.fromEntries(this.cache.entries())
      storage.setItem('cache-data', JSON.stringify(data))
    } catch (error) {
      console.warn('Failed to save cache to storage:', error)
    }
  }

  private evictLRU() {
    if (this.cache.size <= this.maxSize) return

    // Find least recently used entry
    let lruKey = ''
    let lruTime = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed
        lruKey = key
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey)
    }
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    
    // Check if expired
    if (now - entry.timestamp > entry.duration) {
      this.cache.delete(key)
      if (this.strategy !== 'memory') {
        this.saveToStorage()
      }
      return null
    }

    // Update access statistics
    entry.accessCount++
    entry.lastAccessed = now
    
    return entry.data
  }

  set(key: string, data: T, duration: number) {
    const now = Date.now()
    
    this.cache.set(key, {
      data,
      timestamp: now,
      duration,
      accessCount: 1,
      lastAccessed: now,
    })

    // Evict if necessary
    this.evictLRU()

    // Save to persistent storage if needed
    if (this.strategy !== 'memory') {
      this.saveToStorage()
    }
  }

  delete(key: string) {
    const deleted = this.cache.delete(key)
    if (deleted && this.strategy !== 'memory') {
      this.saveToStorage()
    }
    return deleted
  }

  clear() {
    this.cache.clear()
    if (this.strategy !== 'memory') {
      const storage = this.getStorage()
      storage?.removeItem('cache-data')
    }
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

  size(): number {
    return this.cache.size
  }

  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get cache statistics
  getStats() {
    const entries = Array.from(this.cache.values())
    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    const averageAge = entries.reduce((sum, entry) => sum + (Date.now() - entry.timestamp), 0) / entries.length || 0

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      totalAccesses,
      averageAge,
      hitRate: totalAccesses > 0 ? (totalAccesses - entries.length) / totalAccesses : 0,
    }
  }

  // Invalidate entries matching a pattern
  invalidatePattern(pattern: string | RegExp) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.delete(key))
    return keysToDelete.length
  }

  // Preload data with background refresh
  async preload<P>(key: string, fetcher: () => Promise<T>, duration: number, backgroundRefresh = true) {
    // Check if we have valid cached data
    const cached = this.get(key)
    if (cached) return cached

    try {
      // Fetch fresh data
      const data = await fetcher()
      this.set(key, data, duration)

      // Set up background refresh if enabled
      if (backgroundRefresh) {
        setTimeout(async () => {
          try {
            const freshData = await fetcher()
            this.set(key, freshData, duration)
          } catch (error) {
            console.warn('Background refresh failed for key:', key, error)
          }
        }, duration * 0.8) // Refresh at 80% of duration
      }

      return data
    } catch (error) {
      console.error('Preload failed for key:', key, error)
      throw error
    }
  }
}

// Create specialized cache instances
export const memoryCache = new AdvancedCache(200, 'memory')
export const persistentCache = new AdvancedCache(100, 'localStorage')
export const sessionCache = new AdvancedCache(50, 'sessionStorage')

// Cache factory function
export function createCache<T>(config: CacheConfig): AdvancedCache<T> {
  return new AdvancedCache<T>(config.maxSize, config.strategy)
}

// Cache utilities
export const cacheUtils = {
  // Generate cache key with parameters
  generateKey: (base: string, params?: Record<string, any>): string => {
    if (!params) return base
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${base}:${sortedParams}`
  },

  // Get appropriate cache duration based on data type
  getDuration: (dataType: string): number => {
    if (dataType in cacheStrategies.realtime) {
      return cacheStrategies.realtime[dataType as keyof typeof cacheStrategies.realtime].duration
    }
    if (dataType in cacheStrategies.frequent) {
      return cacheStrategies.frequent[dataType as keyof typeof cacheStrategies.frequent].duration
    }
    if (dataType in cacheStrategies.stable) {
      return cacheStrategies.stable[dataType as keyof typeof cacheStrategies.stable].duration
    }
    if (dataType in cacheStrategies.session) {
      return cacheStrategies.session[dataType as keyof typeof cacheStrategies.session].duration
    }
    return 5 * 60 * 1000 // Default 5 minutes
  },

  // Clear all caches
  clearAll: () => {
    memoryCache.clear()
    persistentCache.clear()
    sessionCache.clear()
  },

  // Get cache statistics
  getAllStats: () => ({
    memory: memoryCache.getStats(),
    persistent: persistentCache.getStats(),
    session: sessionCache.getStats(),
  }),

  // Invalidate pattern across all caches
  invalidatePatternAll: (pattern: string | RegExp) => {
    const results = {
      memory: memoryCache.invalidatePattern(pattern),
      persistent: persistentCache.invalidatePattern(pattern),
      session: sessionCache.invalidatePattern(pattern),
    }
    return results
  },
}