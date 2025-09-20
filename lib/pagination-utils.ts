'use client'

export interface PaginationConfig {
  page: number
  pageSize: number
  total?: number
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
    startIndex: number
    endIndex: number
  }
}

export interface PaginationHookResult<T> {
  data: T[]
  pagination: PaginationResult<T>['pagination']
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setPageSize: (size: number) => void
  refresh: () => void
}

// Client-side pagination for already loaded data
export function paginateData<T>(
  data: T[],
  config: PaginationConfig
): PaginationResult<T> {
  const { page, pageSize, total = data.length } = config
  
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, data.length)
  const paginatedData = data.slice(startIndex, endIndex)
  
  const totalPages = Math.ceil(total / pageSize)
  
  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      startIndex: startIndex + 1, // 1-based for display
      endIndex: Math.min(endIndex, total),
    },
  }
}

// Server-side pagination parameters
export interface ServerPaginationParams {
  page?: number
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}

export function buildPaginationParams(config: {
  page: number
  pageSize: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, any>
}): ServerPaginationParams {
  const { page, pageSize, sortBy, sortOrder, search, filters } = config
  
  return {
    page,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(search && { search }),
    ...(filters && { filters }),
  }
}

// Virtual scrolling utilities for large datasets
export interface VirtualScrollConfig {
  itemHeight: number
  containerHeight: number
  overscan?: number // Number of items to render outside visible area
}

export interface VirtualScrollResult {
  startIndex: number
  endIndex: number
  totalHeight: number
  offsetY: number
  visibleItems: number
}

export function calculateVirtualScroll(
  scrollTop: number,
  totalItems: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const { itemHeight, containerHeight, overscan = 5 } = config
  
  const visibleItems = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2)
  
  return {
    startIndex,
    endIndex,
    totalHeight: totalItems * itemHeight,
    offsetY: startIndex * itemHeight,
    visibleItems: endIndex - startIndex + 1,
  }
}

// Infinite scroll utilities
export interface InfiniteScrollConfig {
  threshold?: number // Distance from bottom to trigger load (in pixels)
  hasMore: boolean
  loading: boolean
}

export function useInfiniteScrollTrigger(
  config: InfiniteScrollConfig,
  onLoadMore: () => void
) {
  const { threshold = 200, hasMore, loading } = config
  
  const handleScroll = (event: Event) => {
    const target = event.target as HTMLElement
    if (!target || loading || !hasMore) return
    
    const { scrollTop, scrollHeight, clientHeight } = target
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    if (distanceFromBottom < threshold) {
      onLoadMore()
    }
  }
  
  return { handleScroll }
}

// Pagination state management
export class PaginationState {
  private page = 1
  private pageSize = 20
  private total = 0
  private sortBy?: string
  private sortOrder: 'asc' | 'desc' = 'asc'
  private search = ''
  private filters: Record<string, any> = {}
  private listeners: Array<() => void> = []

  constructor(initialConfig?: Partial<PaginationConfig & {
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    filters?: Record<string, any>
  }>) {
    if (initialConfig) {
      this.page = initialConfig.page || 1
      this.pageSize = initialConfig.pageSize || 20
      this.total = initialConfig.total || 0
      this.sortBy = initialConfig.sortBy
      this.sortOrder = initialConfig.sortOrder || 'asc'
      this.search = initialConfig.search || ''
      this.filters = initialConfig.filters || {}
    }
  }

  // Getters
  getPage(): number { return this.page }
  getPageSize(): number { return this.pageSize }
  getTotal(): number { return this.total }
  getTotalPages(): number { return Math.ceil(this.total / this.pageSize) }
  getSortBy(): string | undefined { return this.sortBy }
  getSortOrder(): 'asc' | 'desc' { return this.sortOrder }
  getSearch(): string { return this.search }
  getFilters(): Record<string, any> { return { ...this.filters } }

  // Computed properties
  getHasNext(): boolean { return this.page < this.getTotalPages() }
  getHasPrev(): boolean { return this.page > 1 }
  getStartIndex(): number { return (this.page - 1) * this.pageSize + 1 }
  getEndIndex(): number { return Math.min(this.page * this.pageSize, this.total) }

  // Setters with notification
  setPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.page = page
      this.notify()
    }
  }

  setPageSize(pageSize: number): void {
    if (pageSize > 0) {
      this.pageSize = pageSize
      this.page = 1 // Reset to first page
      this.notify()
    }
  }

  setTotal(total: number): void {
    this.total = Math.max(0, total)
    // Adjust page if necessary
    const maxPage = this.getTotalPages()
    if (this.page > maxPage && maxPage > 0) {
      this.page = maxPage
    }
    this.notify()
  }

  setSort(sortBy: string, sortOrder?: 'asc' | 'desc'): void {
    if (this.sortBy === sortBy && !sortOrder) {
      // Toggle sort order if same field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    } else {
      this.sortBy = sortBy
      this.sortOrder = sortOrder || 'asc'
    }
    this.page = 1 // Reset to first page
    this.notify()
  }

  setSearch(search: string): void {
    this.search = search
    this.page = 1 // Reset to first page
    this.notify()
  }

  setFilter(key: string, value: any): void {
    if (value === null || value === undefined || value === '') {
      delete this.filters[key]
    } else {
      this.filters[key] = value
    }
    this.page = 1 // Reset to first page
    this.notify()
  }

  setFilters(filters: Record<string, any>): void {
    this.filters = { ...filters }
    this.page = 1 // Reset to first page
    this.notify()
  }

  clearFilters(): void {
    this.filters = {}
    this.search = ''
    this.page = 1
    this.notify()
  }

  // Navigation methods
  nextPage(): void {
    if (this.getHasNext()) {
      this.setPage(this.page + 1)
    }
  }

  prevPage(): void {
    if (this.getHasPrev()) {
      this.setPage(this.page - 1)
    }
  }

  firstPage(): void {
    this.setPage(1)
  }

  lastPage(): void {
    this.setPage(this.getTotalPages())
  }

  // Get current state as params for API calls
  getApiParams(): ServerPaginationParams {
    return buildPaginationParams({
      page: this.page,
      pageSize: this.pageSize,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search || undefined,
      filters: Object.keys(this.filters).length > 0 ? this.filters : undefined,
    })
  }

  // Get current state as object
  getState() {
    return {
      page: this.page,
      pageSize: this.pageSize,
      total: this.total,
      totalPages: this.getTotalPages(),
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
      search: this.search,
      filters: this.getFilters(),
      hasNext: this.getHasNext(),
      hasPrev: this.getHasPrev(),
      startIndex: this.getStartIndex(),
      endIndex: this.getEndIndex(),
    }
  }

  // Event handling
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  private notify(): void {
    this.listeners.forEach(listener => listener())
  }
}

// Utility functions for pagination UI
export const paginationUtils = {
  // Generate page numbers for pagination UI
  generatePageNumbers: (currentPage: number, totalPages: number, maxVisible = 7): number[] => {
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const half = Math.floor(maxVisible / 2)
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisible - 1)

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  },

  // Format pagination info text
  formatPaginationInfo: (pagination: PaginationResult<any>['pagination']): string => {
    const { startIndex, endIndex, total } = pagination
    if (total === 0) return 'No items found'
    if (total === 1) return '1 item'
    return `${startIndex}-${endIndex} of ${total} items`
  },

  // Calculate optimal page size based on container height and item height
  calculateOptimalPageSize: (containerHeight: number, itemHeight: number, minPageSize = 10, maxPageSize = 100): number => {
    const visibleItems = Math.floor(containerHeight / itemHeight)
    const optimalSize = Math.max(visibleItems * 2, minPageSize) // Show 2 pages worth
    return Math.min(optimalSize, maxPageSize)
  },

  // Debounced search function for pagination
  createDebouncedSearch: (callback: (query: string) => void, delay = 300) => {
    let timeoutId: NodeJS.Timeout
    return (query: string) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => callback(query), delay)
    }
  },
}

export default {
  paginateData,
  buildPaginationParams,
  calculateVirtualScroll,
  useInfiniteScrollTrigger,
  PaginationState,
  paginationUtils,
}