'use client'

import { lazy, ComponentType, LazyExoticComponent } from 'react'

// Enhanced lazy loading with error boundaries and loading states
export interface LazyLoadOptions {
  fallback?: ComponentType
  errorFallback?: ComponentType<{ error: Error; retry: () => void }>
  preload?: boolean
  timeout?: number
  retryAttempts?: number
}

// Lazy load component with enhanced error handling
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
): LazyExoticComponent<T> {
  const {
    timeout = 10000, // 10 seconds
    retryAttempts = 3,
  } = options

  let retryCount = 0

  const enhancedImportFn = async (): Promise<{ default: T }> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Component load timeout')), timeout)
    })

    try {
      const result = await Promise.race([importFn(), timeoutPromise])
      retryCount = 0 // Reset on success
      return result
    } catch (error) {
      if (retryCount < retryAttempts) {
        retryCount++
        console.warn(`Retrying component load (attempt ${retryCount}/${retryAttempts})`)
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
        return enhancedImportFn()
      }
      throw error
    }
  }

  return lazy(enhancedImportFn)
}

// Preload components for better performance
export class ComponentPreloader {
  private preloadedComponents = new Map<string, Promise<any>>()
  private loadedComponents = new Set<string>()

  preload(key: string, importFn: () => Promise<any>): Promise<any> {
    if (this.loadedComponents.has(key)) {
      return Promise.resolve()
    }

    if (!this.preloadedComponents.has(key)) {
      const promise = importFn().then(module => {
        this.loadedComponents.add(key)
        this.preloadedComponents.delete(key)
        return module
      }).catch(error => {
        this.preloadedComponents.delete(key)
        throw error
      })

      this.preloadedComponents.set(key, promise)
    }

    return this.preloadedComponents.get(key)!
  }

  isPreloaded(key: string): boolean {
    return this.loadedComponents.has(key)
  }

  isPreloading(key: string): boolean {
    return this.preloadedComponents.has(key)
  }

  // Preload multiple components
  preloadMany(components: Array<{ key: string; importFn: () => Promise<any> }>): Promise<any[]> {
    return Promise.all(components.map(({ key, importFn }) => this.preload(key, importFn)))
  }

  // Clear preloaded components
  clear(): void {
    this.preloadedComponents.clear()
    this.loadedComponents.clear()
  }
}

export const componentPreloader = new ComponentPreloader()

// Intersection Observer for lazy loading
export class LazyLoadObserver {
  private observer: IntersectionObserver | null = null
  private callbacks = new Map<Element, () => void>()

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target)
            if (callback) {
              callback()
              this.unobserve(entry.target)
            }
          }
        })
      }, {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      })
    }
  }

  observe(element: Element, callback: () => void): void {
    if (!this.observer) {
      // Fallback for browsers without IntersectionObserver
      callback()
      return
    }

    this.callbacks.set(element, callback)
    this.observer.observe(element)
  }

  unobserve(element: Element): void {
    if (this.observer) {
      this.observer.unobserve(element)
    }
    this.callbacks.delete(element)
  }

  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect()
    }
    this.callbacks.clear()
  }
}

export const lazyLoadObserver = new LazyLoadObserver()

// Image lazy loading utilities
export interface LazyImageOptions {
  placeholder?: string
  errorImage?: string
  fadeIn?: boolean
  threshold?: number
}

export function createLazyImage(options: LazyImageOptions = {}) {
  const {
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
    errorImage = placeholder,
    fadeIn = true,
    threshold = 0.1,
  } = options

  return {
    placeholder,
    errorImage,
    fadeIn,
    threshold,
  }
}

// Route-based code splitting utilities
export interface RouteConfig {
  path: string
  component: () => Promise<{ default: ComponentType<any> }>
  preload?: boolean
  priority?: 'high' | 'medium' | 'low'
}

export class RouteLazyLoader {
  private routes = new Map<string, RouteConfig>()
  private preloadQueue: RouteConfig[] = []

  register(config: RouteConfig): void {
    this.routes.set(config.path, config)
    
    if (config.preload) {
      this.preloadQueue.push(config)
    }
  }

  registerMany(configs: RouteConfig[]): void {
    configs.forEach(config => this.register(config))
  }

  async preloadRoute(path: string): Promise<void> {
    const route = this.routes.get(path)
    if (route) {
      await componentPreloader.preload(path, route.component)
    }
  }

  async preloadByPriority(priority: 'high' | 'medium' | 'low'): Promise<void> {
    const routesToPreload = Array.from(this.routes.values())
      .filter(route => route.priority === priority)

    await Promise.all(
      routesToPreload.map(route => 
        componentPreloader.preload(route.path, route.component)
      )
    )
  }

  async preloadAll(): Promise<void> {
    const allRoutes = Array.from(this.routes.values())
    await Promise.all(
      allRoutes.map(route => 
        componentPreloader.preload(route.path, route.component)
      )
    )
  }

  // Preload routes based on user behavior
  async preloadOnHover(path: string): Promise<void> {
    if (!componentPreloader.isPreloaded(path) && !componentPreloader.isPreloading(path)) {
      await this.preloadRoute(path)
    }
  }

  async preloadOnIdle(): Promise<void> {
    if ('requestIdleCallback' in window) {
      return new Promise(resolve => {
        requestIdleCallback(async () => {
          await this.preloadByPriority('high')
          resolve()
        })
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.preloadByPriority('high'), 100)
    }
  }
}

export const routeLazyLoader = new RouteLazyLoader()

// Bundle splitting utilities
export interface BundleConfig {
  name: string
  modules: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  preload?: boolean
}

export class BundleManager {
  private bundles = new Map<string, BundleConfig>()
  private loadedBundles = new Set<string>()

  registerBundle(config: BundleConfig): void {
    this.bundles.set(config.name, config)
  }

  async loadBundle(name: string): Promise<void> {
    if (this.loadedBundles.has(name)) {
      return
    }

    const bundle = this.bundles.get(name)
    if (!bundle) {
      throw new Error(`Bundle ${name} not found`)
    }

    // In a real implementation, this would load the actual bundle
    // For now, we'll simulate bundle loading
    await new Promise(resolve => setTimeout(resolve, 100))
    this.loadedBundles.add(name)
  }

  async preloadCriticalBundles(): Promise<void> {
    const criticalBundles = Array.from(this.bundles.values())
      .filter(bundle => bundle.priority === 'critical')

    await Promise.all(
      criticalBundles.map(bundle => this.loadBundle(bundle.name))
    )
  }

  isBundleLoaded(name: string): boolean {
    return this.loadedBundles.has(name)
  }
}

export const bundleManager = new BundleManager()

// Performance monitoring for lazy loading
export interface LazyLoadMetrics {
  componentName: string
  loadTime: number
  success: boolean
  error?: string
  retryCount: number
}

export class LazyLoadMonitor {
  private metrics: LazyLoadMetrics[] = []
  private listeners: Array<(metric: LazyLoadMetrics) => void> = []

  recordMetric(metric: LazyLoadMetrics): void {
    this.metrics.push(metric)
    this.listeners.forEach(listener => listener(metric))
  }

  getMetrics(): LazyLoadMetrics[] {
    return [...this.metrics]
  }

  getAverageLoadTime(): number {
    const successfulLoads = this.metrics.filter(m => m.success)
    if (successfulLoads.length === 0) return 0
    
    const totalTime = successfulLoads.reduce((sum, m) => sum + m.loadTime, 0)
    return totalTime / successfulLoads.length
  }

  getFailureRate(): number {
    if (this.metrics.length === 0) return 0
    const failures = this.metrics.filter(m => !m.success).length
    return (failures / this.metrics.length) * 100
  }

  subscribe(listener: (metric: LazyLoadMetrics) => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  clear(): void {
    this.metrics = []
  }
}

export const lazyLoadMonitor = new LazyLoadMonitor()

// Utility functions
export const lazyLoadUtils = {
  // Check if component should be lazy loaded based on viewport
  shouldLazyLoad: (element: Element): boolean => {
    if (typeof window === 'undefined') return false
    
    const rect = element.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    
    // Load if within 2 viewport heights
    return rect.top < viewportHeight * 2
  },

  // Preload components on user interaction
  preloadOnInteraction: (element: Element, preloadFn: () => Promise<any>) => {
    const events = ['mouseenter', 'touchstart', 'focus']
    let hasPreloaded = false

    const handleInteraction = () => {
      if (!hasPreloaded) {
        hasPreloaded = true
        preloadFn()
        events.forEach(event => {
          element.removeEventListener(event, handleInteraction)
        })
      }
    }

    events.forEach(event => {
      element.addEventListener(event, handleInteraction, { passive: true })
    })

    return () => {
      events.forEach(event => {
        element.removeEventListener(event, handleInteraction)
      })
    }
  },

  // Create loading placeholder
  createLoadingPlaceholder: (width?: number, height?: number) => {
    const style = {
      width: width ? `${width}px` : '100%',
      height: height ? `${height}px` : '200px',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#999',
      fontSize: '14px',
    }

    return style
  },
}

export default {
  createLazyComponent,
  componentPreloader,
  lazyLoadObserver,
  routeLazyLoader,
  bundleManager,
  lazyLoadMonitor,
  lazyLoadUtils,
}