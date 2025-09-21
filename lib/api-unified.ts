import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'

// Types for API responses and requests
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: Date
  retryable?: boolean
  statusCode?: number
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  retryableErrors: string[]
}

export interface AuthResponse {
  access_token: string
  user: User
}

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  outletId?: string
  outlet?: Outlet
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  outletId?: string
}

export type UserRole = 'admin' | 'manager' | 'inventory_manager' | 'cashier'

export interface PackVariant {
  id?: string
  packSize: number // number of units in this pack
  packPrice: number // price for the entire pack
  unitPrice: number // price per individual unit
  isActive: boolean
  name?: string // optional name like "3-pack", "6-pack", "dozen"
}

export interface Product {
  id: string
  name: string
  description?: string
  barcode?: string
  price: number
  cost: number
  unit: string
  category: string
  manufacturer?: string
  requiresPrescription: boolean
  isActive: boolean
  minStockLevel?: number
  expiryDate?: string
  outletId: string
  packVariants?: PackVariant[] // multiple pack options for this product
  allowUnitSale: boolean // whether individual units can be sold
  createdAt: Date
  updatedAt: Date
}

export interface CreateProductDto {
  name: string
  description?: string
  barcode?: string
  price: number
  cost: number
  unit: string
  category: string
  manufacturer?: string
  requiresPrescription: boolean
  isActive?: boolean
  minStockLevel?: number
  expiryDate?: string
  outletId: string
  packVariants?: PackVariant[]
  allowUnitSale?: boolean
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface SalePackInfo {
  saleType: 'unit' | 'pack'
  packVariantId?: string // which pack variant was used (if pack sale)
  packQuantity?: number // number of packs sold
  unitQuantity?: number // number of individual units sold
  effectiveUnitCount: number // total units (for inventory deduction)
}

export interface Sale {
  id: string
  saleNumber: string
  customerId?: string
  cashierId: string
  cashier: User
  items: SaleItem[]
  subtotal: number
  discount: number
  tax: number
  total: number
  paymentMethod: PaymentMethod
  status: SaleStatus
  outletId: string
  createdAt: Date
}

export interface SaleItem {
  id: string
  productId: string
  product: Product
  quantity: number
  unitPrice: number
  discount: number
  total: number
  batchId?: string
  packInfo?: SalePackInfo // pack vs unit sale details
}

export interface CreateSaleDto {
  customerId?: string
  items: {
    productId: string
    quantity: number
    unitPrice: number
    discount?: number
    batchId?: string
    packInfo?: SalePackInfo
  }[]
  discount?: number
  paymentMethod: PaymentMethod
  outletId: string
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'insurance'
export type SaleStatus = 'completed' | 'pending' | 'cancelled' | 'refunded'

export interface InventoryItem {
  id: string
  productId: string
  product: Product
  currentStock: number
  minimumStock: number
  maximumStock: number
  reorderPoint: number
  outletId: string
  lastUpdated: Date
}

export interface InventoryStats {
  totalItems: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

export interface InventoryAdjustment {
  productId: string
  outletId: string
  adjustedQuantity: number
  reason: string
  adjustedBy: string
  notes?: string
  type: 'increase' | 'decrease' | 'damage' | 'expired' | 'return' | 'recount'
}

export interface Batch {
  id: string
  productId: string
  product: Product
  batchNumber: string
  manufacturingDate: Date
  expiryDate: Date
  quantity: number
  soldQuantity: number
  costPrice: number
  sellingPrice: number
  status: 'active' | 'expired' | 'recalled' | 'sold_out'
  supplierName?: string
  supplierInvoice?: string
  notes?: string
  outletId: string
  createdAt: Date
}

export interface Supplier {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  rating: number
  productsSupplied: number
  lastOrder?: string
  status: 'active' | 'inactive'
  paymentTerms: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateSupplierDto {
  name: string
  contactPerson: string
  email: string
  phone: string
  address: string
  paymentTerms: string
}

export interface UpdateSupplierDto extends Partial<CreateSupplierDto> {
  rating?: number
  status?: 'active' | 'inactive'
}

// Receipt Template Interfaces
export interface ReceiptTemplate {
  id: string
  name: string
  description?: string
  status: 'active' | 'inactive' | 'draft'
  outletId: string
  createdBy: string
  modifiedBy?: string
  version: number
  elements: ReceiptElement[]
  paperConfig: PaperConfiguration
  printerConfig: PrinterConfiguration
  isDefault: boolean
  isSystem: boolean
  availableVariables: string[]
  metadata: Record<string, any>
  createdAt: string
  updatedAt: string
}

export interface ReceiptElement {
  type: string
  content: string
  alignment: 'left' | 'center' | 'right'
  fontSize: 'small' | 'medium' | 'large'
  fontStyle: 'normal' | 'bold' | 'underline' | 'italic'
  bold: boolean
  underline: boolean
  height: number
  marginTop: number
  marginBottom: number
  properties: Record<string, any>
}

export interface PaperConfiguration {
  width: number
  unit: string
  physicalWidth: number
  physicalHeight: number
}

export interface PrinterConfiguration {
  type: string
  model: string
  connectionType: 'bluetooth' | 'usb' | 'ethernet' | 'wifi'
  commandSet: string
  settings: Record<string, any>
}

export interface CreateReceiptTemplateDto {
  name: string
  description?: string
  status?: 'active' | 'inactive' | 'draft'
  outletId: string
  elements: ReceiptElement[]
  paperConfig: PaperConfiguration
  printerConfig: PrinterConfiguration
  isDefault?: boolean
  availableVariables?: string[]
  metadata?: Record<string, any>
}

export interface UpdateReceiptTemplateDto extends Partial<CreateReceiptTemplateDto> {
  version?: number
}

export interface PurchaseOrder {
  id: string
  orderNumber: string
  createdBy: User
  outletId: string
  supplierName: string
  supplierEmail?: string
  supplierPhone?: string
  supplierAddress?: string
  items: PurchaseOrderItem[]
  subtotal: number
  tax: number
  total: number
  status: PurchaseOrderStatus
  priority: PurchaseOrderPriority
  orderDate: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  notes?: string
  approvedBy?: User
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface PurchaseOrderItem {
  productId: string
  product?: Product
  quantity: number
  unitCost: number
  totalCost: number
  notes?: string
}

export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'delivered' | 'cancelled'
export type PurchaseOrderPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface CreatePurchaseOrderDto {
  supplierName: string
  supplierEmail?: string
  supplierPhone?: string
  supplierAddress?: string
  items: CreatePurchaseOrderItemDto[]
  subtotal: number
  tax?: number
  total: number
  priority?: PurchaseOrderPriority
  orderDate: string
  expectedDeliveryDate?: string
  notes?: string
  outletId: string
}

export interface CreatePurchaseOrderItemDto {
  productId: string
  quantity: number
  unitCost: number
  totalCost: number
  notes?: string
}

export interface UpdatePurchaseOrderDto extends Partial<CreatePurchaseOrderDto> {
  status?: PurchaseOrderStatus
  actualDeliveryDate?: string
  approvedBy?: string
}

export interface PurchaseOrderStatistics {
  total: number
  pending: number
  approved: number
  inTransit: number
  delivered: number
  cancelled: number
}

export interface Outlet {
  id: string
  _id?: string // Optional MongoDB _id field
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email?: string
  licenseNumber: string
  managerId?: string
  operatingHours?: {
    open: string
    close: string
    days: string[]
  }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateOutletDto {
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  phone: string
  email?: string
  licenseNumber: string
  managerId?: string
  operatingHours?: {
    open: string
    close: string
    days: string[]
  }
}

export interface UpdateOutletDto extends Partial<CreateOutletDto> {}

export interface CreateUserDto {
  email: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  outletId?: string
}

export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password'>> {
  password?: string
}

export interface SaleFilters {
  outletId?: string
  startDate?: string
  endDate?: string
  cashierId?: string
  status?: SaleStatus
}

export interface SalesReport {
  period: string
  totalSales: number
  totalTransactions: number
  averageTransaction: number
  topProducts: TopProduct[]
  salesByCategory: CategorySales[]
  dailyBreakdown: DailySales[]
}

export interface TopProduct {
  productId: string
  productName: string
  quantity: number
  revenue: number
}

export interface CategorySales {
  category: string
  sales: number
  percentage: number
}

export interface DailySales {
  date: string
  sales: number
  transactions: number
}

export interface WeeklySalesReport {
  weekStart: string
  weekEnd: string
  totalSales: number
  dailyBreakdown: DailySales[]
}

export interface InventoryReport {
  totalItems: number
  totalValue: number
  lowStockItems: Product[]
  expiringItems: ExpiringItem[]
  categoryBreakdown: CategoryInventory[]
}

export interface ExpiringItem {
  product: Product
  batch: Batch
  daysToExpiry: number
}

export interface CategoryInventory {
  category: string
  itemCount: number
  totalValue: number
}

export interface StaffPerformanceReport {
  staffId: string
  staffName: string
  totalSales: number
  transactionCount: number
  averageTransaction: number
  period: string
}

export interface SalesReportParams {
  startDate: string
  endDate: string
  outletId?: string
}

export interface StaffReportParams {
  startDate: string
  endDate: string
  outletId?: string
  staffId?: string
}

export interface DailySummary {
  date: string
  totalSales: number
  transactionCount: number
  topProducts: TopProduct[]
}

export interface Shift {
  id: string
  cashierId: string
  cashier: User
  startTime: Date
  endTime?: Date
  openingBalance: number
  closingBalance?: number
  totalSales: number
  status: 'active' | 'closed'
  outletId: string
}

export interface StartShiftDto {
  cashierId: string
  openingBalance: number
  outletId: string
}

export interface EndShiftDto {
  closingBalance: number
}

export interface ShiftStats {
  activeShifts: number
  totalShiftsToday: number
  averageShiftDuration: number
}

class UnifiedApiClient {
  private axiosInstance: AxiosInstance
  private token: string | null = null
  private refreshPromise: Promise<string> | null = null
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', '500', '502', '503', '504']
  }

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 30000, // Increased timeout for better reliability
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    // Initialize token from localStorage if available
    this.initializeToken()
    this.setupInterceptors()
  }

  private initializeToken() {
    if (typeof window !== 'undefined') {
      // Try localStorage first, then cookie
      let storedToken = localStorage.getItem('auth_token')
      if (!storedToken) {
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]+)/)
        if (match) storedToken = match[1]
      }
      if (storedToken) {
        // Verify token is not expired before using it
        try {
          const parts = storedToken.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            const now = Math.floor(Date.now() / 1000)
            if (payload.exp && payload.exp > now) {
              this.token = storedToken
              
              // Ensure the token is properly set in the axios instance defaults
              this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
              
            } else {
              this.setToken(null)
            }
          } else {
            this.setToken(null)
          }
        } catch (error) {
          this.setToken(null)
        }
      } else {
        // No token found
      }
    }
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Always ensure we have the most current token
        if (typeof window !== 'undefined') {
          // Only sync from storage if we don't already have a token in memory
          if (!this.token) {
            // First check localStorage
            let storedToken = localStorage.getItem('auth_token')
            // If not in localStorage, check cookie
            if (!storedToken) {
              const match = document.cookie.match(/(?:^|; )auth_token=([^;]+)/)
              if (match) storedToken = match[1]
            }
            // Set token if found in storage
            if (storedToken) {
              this.token = storedToken
              if (process.env.NODE_ENV === 'development') {
                console.log('[API Client] Token loaded from storage')
              }
            }
          }
        }

        if (this.token) {
          // Ensure Authorization header is always set with current token
          config.headers = config.headers || {}
          config.headers.Authorization = `Bearer ${this.token}`
          
          // Only log in development and for important requests
          if (process.env.NODE_ENV === 'development' && !config.url?.includes('/health')) {
            console.log(`[API Client] Request with auth: ${config.method?.toUpperCase()} ${config.url}`)
          }
        } else {
          // Ensure no stale Authorization header exists
          if (config.headers && config.headers.Authorization) {
            delete config.headers.Authorization
          }
          if (process.env.NODE_ENV === 'development' && !config.url?.includes('/health')) {
            console.warn(`[API Client] No token for ${config.method?.toUpperCase()} ${config.url}`)
          }
        }
        return config
      },
      (error) => {
        return Promise.reject(this.handleError(error))
      }
    )

    // Response interceptor for error handling and token refresh
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Transform MongoDB _id to id for consistency
        if (response.data) {
          response.data = this.transformMongoResponse(response.data)
        }
        return response
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          // Check if we have a token to refresh
          const currentToken = this.token || (typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null)
          
          if (currentToken) {
            try {
              // Try to refresh token
              const newToken = await this.refreshToken()
              if (newToken) {
                // Update the original request with the new token
                originalRequest.headers = originalRequest.headers || {}
                originalRequest.headers.Authorization = `Bearer ${newToken}`
                // Retry the original request
                return this.axiosInstance(originalRequest)
              }
            } catch (refreshError) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('[API Client] Token refresh failed:', refreshError)
              }
            }
          }
          
          // If we get here, authentication failed - clear state and redirect
          this.setToken(null)
          if (typeof window !== 'undefined') {
            // Clear all auth data
            localStorage.removeItem('auth_token')
            localStorage.removeItem('user')
            localStorage.removeItem('session_start')
            
            // Only redirect if not already on login page
            if (!window.location.pathname.includes('/login')) {
              if (process.env.NODE_ENV === 'development') {
                console.log('[API Client] Redirecting to login due to authentication failure')
              }
              window.location.href = '/login'
            }
          }
          return Promise.reject(new Error('Authentication required. Please log in again.'))
        }

        // Handle 404 errors - don't clear auth state for legitimate missing resources
        if (error.response?.status === 404) {
          // Log 404 but don't clear authentication
          if (process.env.NODE_ENV === 'development') {
            console.warn('Resource not found:', {
              url: error.config?.url,
              method: error.config?.method,
              message: (error.response.data as any)?.message || 'Resource not found'
            })
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      retryable: false,
    }

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const status = error.response.status
      apiError.code = status.toString()
      apiError.statusCode = status
      apiError.details = error.response.data

      // Specific handling for different status codes
      switch (status) {
        case 400:
          apiError.message = (error.response.data as any)?.message || 'Invalid request. Please check your input.'
          break
        case 401:
          apiError.message = 'Authentication required. Please log in again.'
          break
        case 403:
          apiError.message = 'Access denied. You don\'t have permission to perform this action.'
          break
        case 404:
          // Don't clear auth state for 404 errors - they might be legitimate missing resources
          apiError.message = (error.response.data as any)?.message || 'The requested resource was not found.'
          break
        case 409:
          apiError.message = (error.response.data as any)?.message || 'Conflict. The resource already exists or is in use.'
          break
        case 422:
          apiError.message = (error.response.data as any)?.message || 'Validation failed. Please check your input.'
          break
        case 429:
          apiError.message = 'Too many requests. Please wait a moment before trying again.'
          apiError.retryable = true
          break
        case 500:
          apiError.message = 'Internal server error. Please try again later.'
          apiError.retryable = true
          break
        case 502:
          apiError.message = 'Bad gateway. The server is temporarily unavailable.'
          apiError.retryable = true
          break
        case 503:
          apiError.message = 'Service unavailable. Please try again later.'
          apiError.retryable = true
          break
        case 504:
          apiError.message = 'Gateway timeout. The server took too long to respond.'
          apiError.retryable = true
          break
        default:
          apiError.message = (error.response.data as any)?.message || `Server error (${status}). Please try again.`
          if (status >= 500) {
            apiError.retryable = true
          }
      }
    } else if (error.request) {
      // Network error - no response received
      apiError.code = 'NETWORK_ERROR'
      apiError.message = 'Network connection failed. Please check your internet connection and try again.'
      apiError.retryable = true
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      // Request timeout
      apiError.code = 'TIMEOUT'
      apiError.message = 'Request timed out. The server is taking too long to respond. Please try again.'
      apiError.retryable = true
    } else if (error.code === 'ENOTFOUND') {
      // DNS resolution failed
      apiError.code = 'ENOTFOUND'
      apiError.message = 'Cannot connect to server. Please check your internet connection.'
      apiError.retryable = true
    } else if (error.code === 'ECONNRESET') {
      // Connection reset
      apiError.code = 'ECONNRESET'
      apiError.message = 'Connection was reset. Please try again.'
      apiError.retryable = true
    } else {
      // Other errors
      apiError.code = 'CLIENT_ERROR'
      apiError.message = error.message || 'An unexpected error occurred. Please try again.'
    }

    // Determine if error is retryable
    if (!apiError.retryable) {
      apiError.retryable = this.retryConfig.retryableErrors.includes(apiError.code)
    }

    // Log error only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        code: apiError.code,
        message: apiError.message,
        url: error.config?.url,
        method: error.config?.method,
        statusCode: apiError.statusCode,
        retryable: apiError.retryable,
        timestamp: apiError.timestamp,
      })
    }

    return apiError
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private calculateRetryDelay(attempt: number): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.retryConfig.baseDelay * Math.pow(2, attempt),
      this.retryConfig.maxDelay
    )
    
    // Add jitter (±25% of the delay)
    const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1)
    return Math.max(0, exponentialDelay + jitter)
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'API request'
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break
        }

        // Check if error is retryable
        const apiError = error as ApiError
        if (!apiError.retryable) {
          break
        }

        // Calculate delay and wait
        const delay = this.calculateRetryDelay(attempt)
        if (process.env.NODE_ENV === 'development') {
          console.warn(`${context} failed (attempt ${attempt + 1}/${this.retryConfig.maxRetries + 1}). Retrying in ${delay}ms...`, {
            error: apiError.message,
            code: apiError.code
          })
        }
        
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  // Transform MongoDB response to use 'id' instead of '_id'
  private transformMongoResponse(data: any): any {
    if (!data) return data

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.transformMongoResponse(item))
    }

    // Handle objects
    if (typeof data === 'object' && data !== null) {
      const transformed = { ...data }
      
      // Convert _id to id if _id exists and id doesn't
      if (data._id && !data.id) {
        transformed.id = data._id
        delete transformed._id
      }

      // Recursively transform nested objects
      for (const key in transformed) {
        if (transformed.hasOwnProperty(key) && typeof transformed[key] === 'object') {
          transformed[key] = this.transformMongoResponse(transformed[key])
        }
      }

      return transformed
    }

    return data
  }

  public setToken(token: string | null) {
    this.token = token
    
    // Update Axios default headers
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else if (this.axiosInstance.defaults.headers.common['Authorization']) {
      // Clear Authorization header if token is null
      delete this.axiosInstance.defaults.headers.common['Authorization']
    }
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token)
  // Set cookie for middleware access (cannot set HttpOnly from JavaScript)
        const isSecure = window.location.protocol === 'https:'
        const sameSite = 'Lax'
        const maxAge = 16 * 60 * 60 // 16 hours (matching backend JWT expiry)
        
        // Set cookie for middleware access (cannot set HttpOnly from JavaScript)
        document.cookie = `auth_token=${token}; path=/; max-age=${maxAge}; SameSite=${sameSite}${isSecure ? '; Secure' : ''}`
      } else {
        // Clear token
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user') // Also clear user data
        localStorage.removeItem('session_start')
        document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
        document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
      }
    }
  }

  public syncTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
      // First check localStorage
      let storedToken = localStorage.getItem('auth_token')
      // If not in localStorage, check cookie
      if (!storedToken) {
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]+)/)
        if (match) storedToken = match[1]
      }
      
      if (storedToken !== this.token) {
        console.log('[API Client] Syncing token from storage/cookies')
        this.token = storedToken
        // Properly update axios auth header
        if (storedToken) {
          this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
          console.log('[API Client] Authorization header updated')
        } else if (this.axiosInstance.defaults.headers.common['Authorization']) {
          delete this.axiosInstance.defaults.headers.common['Authorization']
          console.log('[API Client] Authorization header removed')
        }
      } else if (storedToken) {
        // Even if token is the same, ensure Authorization header is set
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
        console.log('[API Client] Authorization header re-synced')
      }
    }
  }

  public getToken(): string | null {
    return this.token
  }

  private async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    // If no token is available, cannot refresh
    if (!this.token) {
      console.log('[API Client] No token available for refresh')
      return null
    }

    this.refreshPromise = (async () => {
      try {
        // Use the new refresh endpoint with current token
        const response = await this.axiosInstance.post('/auth/refresh', {}, {
          timeout: 10000, // 10 second timeout for token refresh
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })
        const newToken = response.data.access_token
        this.setToken(newToken)
        
        // Also update user data if returned
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
        
        console.log('[API Client] Token refreshed successfully')
        return newToken
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Token refresh failed:', error)
        }
        this.setToken(null)
        // Clear localStorage on refresh failure
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
        }
        throw error
      } finally {
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  // Public methods for configuration and utilities
  public configureRetry(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config }
  }

  public getRetryConfig(): RetryConfig {
    return { ...this.retryConfig }
  }

  public isRetryableError(error: ApiError): boolean {
    return error.retryable === true
  }

  public getErrorMessage(error: any): string {
    if (error && typeof error === 'object') {
      if ('message' in error) {
        return error.message
      }
      if ('code' in error) {
        return `Error ${error.code}: ${error.message || 'Unknown error'}`
      }
    }
    return 'An unexpected error occurred'
  }

  // Authentication methods
  auth = {
    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
      return this.executeWithRetry(async () => {
        // Use shorter timeout for login requests
        const response = await this.axiosInstance.post<AuthResponse>('/auth/login', credentials, {
          timeout: 15000 // 15 second timeout for authentication
        })
        
        this.setToken(response.data.access_token)
        
        // Store user data
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.user))
        }
        
        return response.data
      }, 'Login request')
    },

    register: async (userData: RegisterData): Promise<User> => {
      return this.executeWithRetry(async () => {
        const response = await this.axiosInstance.post<User>('/auth/register', userData, {
          timeout: 15000 // 15 second timeout for registration
        })
        return response.data
      }, 'Registration request')
    },

    logout: async (): Promise<void> => {
      try {
        // Don't retry logout requests - if they fail, still clear local state
        await this.axiosInstance.post('/auth/logout', {}, {
          timeout: 10000 // 10 second timeout for logout
        })
      } catch (error) {
        // Log error but don't throw - we still want to clear local state
        if (process.env.NODE_ENV === 'development') {
          console.warn('Logout request failed, clearing local state anyway:', error)
        }
      } finally {
        this.setToken(null)
      }
    },

    getProfile: async (): Promise<User> => {
      return this.executeWithRetry(async () => {
        const response = await this.axiosInstance.get<User>('/auth/me', {
          timeout: 10000 // 10 second timeout for profile requests
        })
        return response.data
      }, 'Profile request')
    },

    revokeToken: async (): Promise<void> => {
      try {
        await this.axiosInstance.post('/auth/revoke-token', {}, {
          timeout: 10000
        })
      } catch (error) {
        // Log error but don't throw - token revocation should be best effort
        if (process.env.NODE_ENV === 'development') {
          console.warn('Token revocation failed:', error)
        }
      }
    },

    revokeAllSessions: async (): Promise<void> => {
      try {
        await this.axiosInstance.post('/auth/revoke-all-sessions', {}, {
          timeout: 10000
        })
      } catch (error) {
        // Log error but don't throw - session revocation should be best effort
        if (process.env.NODE_ENV === 'development') {
          console.warn('All sessions revocation failed:', error)
        }
      }
    },
  }

  // Products methods
  products = {
    getAll: async (outletId?: string): Promise<Product[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<Product[]>('/products', { params })
      return response.data
    },

    search: async (query: string, outletId?: string): Promise<Product[]> => {
      const params: any = { q: query }
      if (outletId) params.outletId = outletId
      const response = await this.axiosInstance.get<Product[]>('/products/search', { params })
      return response.data
    },

    getById: async (id: string): Promise<Product> => {
      const response = await this.axiosInstance.get<Product>(`/products/${id}`)
      return response.data
    },

    create: async (product: CreateProductDto): Promise<Product> => {
      const response = await this.axiosInstance.post<Product>('/products', product)
      return response.data
    },

    update: async (id: string, product: UpdateProductDto): Promise<Product> => {
      const response = await this.axiosInstance.put<Product>(`/products/${id}`, product)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/products/${id}`)
    },

    getLowStock: async (outletId?: string): Promise<Product[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<Product[]>('/products/low-stock', { params })
      return response.data
    },

    getByBarcode: async (barcode: string): Promise<Product> => {
      const response = await this.axiosInstance.get<Product>(`/products/barcode/${barcode}`)
      return response.data
    },
  }

  // Sales methods
  sales = {
    create: async (sale: CreateSaleDto): Promise<Sale> => {
      const response = await this.axiosInstance.post<Sale>('/sales', sale)
      return response.data
    },

    getAll: async (filters?: SaleFilters): Promise<Sale[]> => {
      const response = await this.axiosInstance.get<Sale[]>('/sales', { params: filters })
      return response.data
    },

    getById: async (id: string): Promise<Sale> => {
      const response = await this.axiosInstance.get<Sale>(`/sales/${id}`)
      return response.data
    },

    getDailySummary: async (outletId?: string): Promise<DailySummary> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<DailySummary>('/sales/daily', { params })
      return response.data
    },
  }

  // Inventory methods
  inventory = {
    getItems: async (outletId?: string): Promise<InventoryItem[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<InventoryItem[]>('/inventory/items', { params })
      return response.data
    },

    getStats: async (outletId?: string): Promise<InventoryStats> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<InventoryStats>('/inventory/stats', { params })
      return response.data
    },

    adjust: async (adjustment: InventoryAdjustment): Promise<void> => {
      await this.axiosInstance.post('/inventory/adjust', adjustment)
    },

    // Items
    updateItem: async (productId: string, data: { reorderLevel?: number; maxStockLevel?: number }) => {
      const response = await this.axiosInstance.patch(`/inventory/items/${productId}`, data)
      return response.data
    },

    // Batches
    getBatches: async (outletId?: string, productId?: string): Promise<Batch[]> => {
      const params: any = {}
      if (outletId) params.outletId = outletId
      if (productId) params.productId = productId
      const response = await this.axiosInstance.get<Batch[]>('/inventory/batches', { params })
      return response.data
    },

    getBatchById: async (id: string): Promise<Batch> => {
      const response = await this.axiosInstance.get<Batch>(`/inventory/batches/${id}`)
      return response.data
    },

    createBatch: async (data: {
      batchNumber: string
      productId: string
      outletId: string
      manufacturingDate: string
      expiryDate: string
      quantity: number
      costPrice: number
      sellingPrice: number
      supplierName?: string
      supplierInvoice?: string
      notes?: string
    }): Promise<Batch> => {
      const response = await this.axiosInstance.post<Batch>('/inventory/batches', data)
      return response.data
    },

    updateBatch: async (id: string, data: Partial<{
      batchNumber: string
      manufacturingDate: string
      expiryDate: string
      quantity: number
      soldQuantity: number
      costPrice: number
      sellingPrice: number
      status: string
      supplierName?: string
      supplierInvoice?: string
      notes?: string
    }>): Promise<Batch> => {
      const response = await this.axiosInstance.patch<Batch>(`/inventory/batches/${id}`, data)
      return response.data
    },

    deleteBatch: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/inventory/batches/${id}`)
    },

    getAdjustments: async (outletId?: string): Promise<InventoryAdjustment[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<InventoryAdjustment[]>('/inventory/adjustments', { params })
      return response.data
    },
  }

  // Reports methods
  reports = {
    getSales: async (params: SalesReportParams): Promise<SalesReport> => {
      const response = await this.axiosInstance.get<SalesReport>('/reports/sales', { params })
      return response.data
    },

    getWeeklySales: async (outletId?: string): Promise<WeeklySalesReport> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<WeeklySalesReport>('/reports/sales/weekly', { params })
      return response.data
    },

    getInventory: async (outletId?: string): Promise<InventoryReport> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<InventoryReport>('/reports/inventory', { params })
      return response.data
    },

    getStaffPerformance: async (params: StaffReportParams): Promise<StaffPerformanceReport[]> => {
      const response = await this.axiosInstance.get<StaffPerformanceReport[]>('/reports/staff-performance', { params })
      return response.data
    },
  }

  // Users methods
  users = {
    getAll: async (outletId?: string): Promise<User[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<User[]>('/users', { params })
      return response.data
    },

    getById: async (id: string): Promise<User> => {
      const response = await this.axiosInstance.get<User>(`/users/${id}`)
      return response.data
    },

    create: async (user: CreateUserDto): Promise<User> => {
      const response = await this.axiosInstance.post<User>('/users', user)
      return response.data
    },

    update: async (id: string, user: UpdateUserDto): Promise<User> => {
      const response = await this.axiosInstance.put<User>(`/users/${id}`, user)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/users/${id}`)
    },
  }

  // Outlets methods
  outlets = {
    getAll: async (): Promise<Outlet[]> => {
      const response = await this.axiosInstance.get<Outlet[]>('/outlets')
      return response.data
    },

    getById: async (id: string): Promise<Outlet> => {
      const response = await this.axiosInstance.get<Outlet>(`/outlets/${id}`)
      return response.data
    },

    create: async (outlet: CreateOutletDto): Promise<Outlet> => {
      const response = await this.axiosInstance.post<Outlet>('/outlets', outlet)
      return response.data
    },

    update: async (id: string, outlet: UpdateOutletDto): Promise<Outlet> => {
      const response = await this.axiosInstance.put<Outlet>(`/outlets/${id}`, outlet)
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/outlets/${id}`)
    },
  }

  // Purchase Orders methods
  purchaseOrders = {
    getAll: async (outletId?: string): Promise<PurchaseOrder[]> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<PurchaseOrder[]>('/purchase-orders', { params })
      return response.data
    },

    getById: async (id: string): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.get<PurchaseOrder>(`/purchase-orders/${id}`)
      return response.data
    },

    create: async (purchaseOrder: CreatePurchaseOrderDto): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.post<PurchaseOrder>('/purchase-orders', purchaseOrder)
      return response.data
    },

    update: async (id: string, purchaseOrder: UpdatePurchaseOrderDto): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.patch<PurchaseOrder>(`/purchase-orders/${id}`, purchaseOrder)
      return response.data
    },

    approve: async (id: string): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.patch<PurchaseOrder>(`/purchase-orders/${id}/approve`)
      return response.data
    },

    cancel: async (id: string): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.patch<PurchaseOrder>(`/purchase-orders/${id}/cancel`)
      return response.data
    },

    markAsDelivered: async (id: string, actualDeliveryDate?: string): Promise<PurchaseOrder> => {
      const response = await this.axiosInstance.patch<PurchaseOrder>(`/purchase-orders/${id}/deliver`, {
        actualDeliveryDate
      })
      return response.data
    },

    delete: async (id: string): Promise<void> => {
      await this.axiosInstance.delete(`/purchase-orders/${id}`)
    },

    getStatistics: async (outletId?: string): Promise<PurchaseOrderStatistics> => {
      const params = outletId ? { outletId } : {}
      const response = await this.axiosInstance.get<PurchaseOrderStatistics>('/purchase-orders/statistics', { params })
      return response.data
    },
  }

  // Shifts methods
  shifts = {
    getAll: async (): Promise<Shift[]> => {
      const response = await this.axiosInstance.get<Shift[]>('/shifts')
      return response.data
    },

    getStats: async (): Promise<ShiftStats> => {
      const response = await this.axiosInstance.get<ShiftStats>('/shifts/stats')
      return response.data
    },

    start: async (data: StartShiftDto): Promise<Shift> => {
      const response = await this.axiosInstance.post<Shift>('/shifts/start', data)
      return response.data
    },

    end: async (id: string, data: EndShiftDto): Promise<Shift> => {
      const response = await this.axiosInstance.post<Shift>(`/shifts/${id}/end`, data)
      return response.data
    },
  }

  // Health check method
  health = {
    check: async (): Promise<{ status: string; timestamp: string; uptime: number; version: string }> => {
      return this.executeWithRetry(async () => {
        const response = await this.axiosInstance.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/health`, {
          timeout: 5000 // 5 second timeout for health checks
        })
        return response.data
      }, 'Health check request')
    },
  }

  // Suppliers methods (Note: These endpoints don't exist in backend yet)
  suppliers = {
    getAll: async (): Promise<Supplier[]> => {
      try {
        // Get supplier data from purchase orders since no dedicated supplier endpoints exist
        const purchaseOrders = await this.purchaseOrders.getAll()
        const supplierMap = new Map<string, Supplier & { totalOrders: number }>()
        
        purchaseOrders.forEach(order => {
          if (order.supplierName && !supplierMap.has(order.supplierName)) {
            supplierMap.set(order.supplierName, {
              id: order.supplierName.toLowerCase().replace(/\s+/g, '-'),
              name: order.supplierName,
              email: order.supplierEmail || '',
              phone: order.supplierPhone || '',
              address: order.supplierAddress || '',
              status: 'active',
              rating: 4.0, // Default rating
              productsSupplied: 0, // Will be calculated from orders
              totalOrders: 1,
              lastOrder: order.createdAt.toISOString(),
              paymentTerms: '30 days',
              contactPerson: '',
              createdAt: order.createdAt,
              updatedAt: order.updatedAt
            })
          } else if (order.supplierName && supplierMap.has(order.supplierName)) {
            const supplier = supplierMap.get(order.supplierName)!
            supplier.totalOrders++
            supplier.lastOrder = order.createdAt > new Date(supplier.lastOrder!) ? order.createdAt.toISOString() : supplier.lastOrder
          }
        })
        
        return Array.from(supplierMap.values()).map(({ totalOrders, ...supplier }) => supplier)
      } catch (error) {
        console.warn('Failed to fetch suppliers from purchase orders:', error)
        return []
      }
    },

    getById: async (id: string): Promise<Supplier> => {
      try {
        const suppliers = await this.suppliers.getAll()
        const supplier = suppliers.find(s => s.id === id)
        if (!supplier) {
          throw new Error(`Supplier with id ${id} not found`)
        }
        return supplier
      } catch (error) {
        throw new Error(`Failed to fetch supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    create: async (supplier: CreateSupplierDto): Promise<Supplier> => {
      // Since no backend supplier endpoints exist, we'll store supplier info via purchase orders
      // For now, return a properly formatted supplier object
      const newSupplier: Supplier = {
        id: supplier.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        status: 'active',
        rating: 4.0,
        productsSupplied: 0,
        lastOrder: new Date().toISOString(),
        paymentTerms: supplier.paymentTerms,
        contactPerson: supplier.contactPerson,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      // Note: In a real implementation, this would create a supplier in the backend
      console.warn('Supplier creation is simulated - no backend endpoint available')
      return newSupplier
    },

    update: async (id: string, supplier: UpdateSupplierDto): Promise<Supplier> => {
      try {
        const existingSupplier = await this.suppliers.getById(id)
        const updatedSupplier: Supplier = {
          ...existingSupplier,
          ...supplier,
          updatedAt: new Date()
        }
        
        // Note: In a real implementation, this would update the supplier in the backend
        console.warn('Supplier update is simulated - no backend endpoint available')
        return updatedSupplier
      } catch (error) {
        throw new Error(`Failed to update supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        // Verify supplier exists
        await this.suppliers.getById(id)
        
        // Note: In a real implementation, this would delete the supplier from the backend
        // For now, we'll just log the operation since no backend endpoint exists
        console.warn(`Supplier ${id} deletion is simulated - no backend endpoint available`)
      } catch (error) {
        throw new Error(`Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    },
  }

  // Receipt Templates API
  receiptTemplates = {
    getAll: async (outletId?: string, status?: 'active' | 'inactive' | 'draft'): Promise<ReceiptTemplate[]> => {
      try {
        const params = new URLSearchParams()
        if (outletId) params.append('outletId', outletId)
        if (status) params.append('status', status)
        
        const response = await this.axiosInstance.get(`/receipt-templates?${params.toString()}`)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    getById: async (id: string): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.get(`/receipt-templates/${id}`)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    getDefault: async (outletId: string): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.get(`/receipt-templates/default/${outletId}`)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    create: async (template: CreateReceiptTemplateDto): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.post('/receipt-templates', template)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    update: async (id: string, template: UpdateReceiptTemplateDto): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.patch(`/receipt-templates/${id}`, template)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    duplicate: async (id: string): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.post(`/receipt-templates/${id}/duplicate`)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    setAsDefault: async (id: string): Promise<ReceiptTemplate> => {
      try {
        const response = await this.axiosInstance.patch(`/receipt-templates/${id}/set-default`)
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    preview: async (id: string, sampleData?: any): Promise<string> => {
      try {
        const response = await this.axiosInstance.get(`/receipt-templates/${id}/preview`, {
          data: sampleData
        })
        return response.data
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },

    delete: async (id: string): Promise<void> => {
      try {
        await this.axiosInstance.delete(`/receipt-templates/${id}`)
      } catch (error) {
        throw this.handleError(error as AxiosError)
      }
    },
  }
}

// Create and export the unified API client instance
export const apiClient = new UnifiedApiClient()
export default apiClient

// Add global reference for debugging
if (typeof window !== 'undefined') {
  (window as any).apiClient = apiClient
}