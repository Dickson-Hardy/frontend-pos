import { Product, Sale, SaleItem, InventoryItem, User, PackVariant, SalePackInfo } from './api-unified'

// Data transformation utilities
export const dataTransforms = {
  // Product transformations
  formatPrice: (price: number, currency = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(price)
  },

  formatProductName: (product: Product): string => {
    return `${product.name}${product.manufacturer ? ` - ${product.manufacturer}` : ''}`
  },

  getProductDisplayPrice: (product: Product): string => {
    return dataTransforms.formatPrice(product.price)
  },

  // Sale transformations
  calculateSaleTotal: (items: SaleItem[]): number => {
    return items.reduce((total, item) => total + item.total, 0)
  },

  calculateSaleSubtotal: (items: SaleItem[]): number => {
    return items.reduce((subtotal, item) => subtotal + (item.quantity * item.unitPrice), 0)
  },

  calculateSaleDiscount: (items: SaleItem[]): number => {
    return items.reduce((discount, item) => discount + item.discount, 0)
  },

  formatSaleNumber: (saleNumber: string): string => {
    return saleNumber.toUpperCase()
  },

  // Inventory transformations
  getStockStatus: (item: InventoryItem): 'out_of_stock' | 'low_stock' | 'in_stock' | 'overstocked' => {
    if (item.currentStock <= 0) return 'out_of_stock'
    if (item.currentStock <= item.minimumStock) return 'low_stock'
    if (item.currentStock >= item.maximumStock) return 'overstocked'
    return 'in_stock'
  },

  getStockStatusColor: (status: string): string => {
    switch (status) {
      case 'out_of_stock': return 'text-red-600 bg-red-50'
      case 'low_stock': return 'text-yellow-600 bg-yellow-50'
      case 'overstocked': return 'text-orange-600 bg-orange-50'
      case 'in_stock': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  },

  calculateStockValue: (item: InventoryItem): number => {
    return item.currentStock * item.product.cost
  },

  // Date transformations
  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  },

  formatDateTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  formatTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  },

  getRelativeTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    
    return dataTransforms.formatDate(d)
  },

  // User transformations
  getUserDisplayName: (user: User): string => {
    return `${user.firstName} ${user.lastName}`
  },

  formatUserRole: (role: string): string => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  },

  // Number formatting
  formatNumber: (num: number, decimals = 0): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num)
  },

  formatPercentage: (value: number, total: number): string => {
    if (total === 0) return '0%'
    const percentage = (value / total) * 100
    return `${percentage.toFixed(1)}%`
  },

  // Search and filter utilities
  searchProducts: (products: Product[], query: string): Product[] => {
    if (!query.trim()) return products
    
    const searchTerm = query.toLowerCase()
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm) ||
      product.barcode?.includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.manufacturer?.toLowerCase().includes(searchTerm)
    )
  },

  filterProductsByCategory: (products: Product[], category: string): Product[] => {
    if (!category) return products
    return products.filter(product => product.category === category)
  },

  sortProducts: (products: Product[], sortBy: 'name' | 'price' | 'category' | 'stock', order: 'asc' | 'desc' = 'asc'): Product[] => {
    return [...products].sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'price':
          comparison = a.price - b.price
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        default:
          comparison = 0
      }
      
      return order === 'desc' ? -comparison : comparison
    })
  },

  // Pack variant utilities
  getAvailablePacks: (totalUnits: number, packSize: number): number => {
    return Math.floor(totalUnits / packSize)
  },

  getLooseUnits: (totalUnits: number, packSize: number): number => {
    return totalUnits % packSize
  },

  getPackDisplayText: (variant: PackVariant): string => {
    const name = variant.name || `${variant.packSize}-pack`
    return `${name} (${variant.packSize} units) - Le ${variant.packPrice.toLocaleString('en-SL')}`
  },

  getUnitDisplayText: (product: Product): string => {
    return `Individual unit - Le ${product.price.toLocaleString('en-SL')}`
  },

  calculatePackInventory: (totalUnits: number, packVariants: PackVariant[]): {
    packBreakdown: Array<{ variant: PackVariant; availablePacks: number }>
    looseUnits: number
    totalValue: number
  } => {
    // Sort pack variants by size (largest first) for optimal packing
    const sortedVariants = [...packVariants].sort((a, b) => b.packSize - a.packSize)
    let remainingUnits = totalUnits
    const packBreakdown: Array<{ variant: PackVariant; availablePacks: number }> = []
    let totalValue = 0

    // Calculate how many of each pack size can be made
    for (const variant of sortedVariants) {
      if (!variant.isActive) continue
      
      const availablePacks = Math.floor(remainingUnits / variant.packSize)
      if (availablePacks > 0) {
        packBreakdown.push({ variant, availablePacks })
        const unitsUsed = availablePacks * variant.packSize
        remainingUnits -= unitsUsed
        totalValue += availablePacks * variant.packPrice
      }
    }

    // Add value of loose units
    totalValue += remainingUnits * (sortedVariants[0]?.unitPrice || 0)

    return {
      packBreakdown,
      looseUnits: remainingUnits,
      totalValue
    }
  },

  createPackSaleInfo: (
    saleType: 'unit' | 'pack',
    packVariant?: PackVariant,
    packQuantity?: number,
    unitQuantity?: number
  ): SalePackInfo => {
    if (saleType === 'pack' && packVariant && packQuantity) {
      return {
        saleType: 'pack',
        packVariantId: packVariant.id,
        packQuantity,
        unitQuantity: 0,
        effectiveUnitCount: packQuantity * packVariant.packSize
      }
    } else if (saleType === 'unit' && unitQuantity) {
      return {
        saleType: 'unit',
        packQuantity: 0,
        unitQuantity,
        effectiveUnitCount: unitQuantity
      }
    }
    
    throw new Error('Invalid pack sale info parameters')
  },

  formatInventoryDisplay: (totalUnits: number, packVariants: PackVariant[]): string => {
    if (!packVariants || packVariants.length === 0) {
      return `${totalUnits} units`
    }

    const breakdown = dataTransforms.calculatePackInventory(totalUnits, packVariants)
    const parts: string[] = []

    breakdown.packBreakdown.forEach(({ variant, availablePacks }) => {
      const name = variant.name || `${variant.packSize}-pack`
      parts.push(`${availablePacks} ${name}${availablePacks !== 1 ? 's' : ''}`)
    })

    if (breakdown.looseUnits > 0) {
      parts.push(`${breakdown.looseUnits} unit${breakdown.looseUnits !== 1 ? 's' : ''}`)
    }

    return parts.length > 0 ? parts.join(' + ') : '0 units'
  },
}

// Data validation utilities
export const dataValidations = {
  // Product validations
  validateProduct: (product: Partial<Product>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!product.name?.trim()) {
      errors.push('Product name is required')
    }

    if (typeof product.price !== 'number' || product.price <= 0) {
      errors.push('Product price must be a positive number')
    }

    if (typeof product.cost !== 'number' || product.cost < 0) {
      errors.push('Product cost must be a non-negative number')
    }

    if (!product.unit?.trim()) {
      errors.push('Product unit is required')
    }

    if (!product.category?.trim()) {
      errors.push('Product category is required')
    }

    if (product.barcode && !/^[0-9]{8,13}$/.test(product.barcode)) {
      errors.push('Barcode must be 8-13 digits')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Sale validations
  validateSaleItem: (item: Partial<SaleItem>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!item.productId) {
      errors.push('Product is required')
    }

    if (typeof item.quantity !== 'number' || item.quantity <= 0) {
      errors.push('Quantity must be a positive number')
    }

    if (typeof item.unitPrice !== 'number' || item.unitPrice <= 0) {
      errors.push('Unit price must be a positive number')
    }

    if (typeof item.discount === 'number' && item.discount < 0) {
      errors.push('Discount cannot be negative')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  validateSale: (sale: { items: Partial<SaleItem>[] }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!sale.items || sale.items.length === 0) {
      errors.push('At least one item is required')
    }

    sale.items.forEach((item, index) => {
      const itemValidation = dataValidations.validateSaleItem(item)
      if (!itemValidation.isValid) {
        errors.push(`Item ${index + 1}: ${itemValidation.errors.join(', ')}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // User validations
  validateEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  validatePassword: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  validateUser: (user: Partial<User>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (!user.firstName?.trim()) {
      errors.push('First name is required')
    }

    if (!user.lastName?.trim()) {
      errors.push('Last name is required')
    }

    if (!user.email?.trim()) {
      errors.push('Email is required')
    } else if (!dataValidations.validateEmail(user.email)) {
      errors.push('Invalid email format')
    }

    if (!user.role) {
      errors.push('Role is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // Inventory validations
  validateInventoryAdjustment: (adjustment: { quantity: number; reason: string }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (typeof adjustment.quantity !== 'number') {
      errors.push('Quantity must be a number')
    }

    if (!adjustment.reason?.trim()) {
      errors.push('Reason is required')
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  },

  // General validations
  validateRequired: (value: any, fieldName: string): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`
    }
    return null
  },

  validatePositiveNumber: (value: number, fieldName: string): string | null => {
    if (typeof value !== 'number' || value <= 0) {
      return `${fieldName} must be a positive number`
    }
    return null
  },

  validateNonNegativeNumber: (value: number, fieldName: string): string | null => {
    if (typeof value !== 'number' || value < 0) {
      return `${fieldName} must be a non-negative number`
    }
    return null
  },
}

// Data aggregation utilities
export const dataAggregations = {
  // Sales aggregations
  calculateTotalSales: (sales: Sale[]): number => {
    return sales.reduce((total, sale) => total + sale.total, 0)
  },

  calculateAverageTransaction: (sales: Sale[]): number => {
    if (sales.length === 0) return 0
    return dataAggregations.calculateTotalSales(sales) / sales.length
  },

  groupSalesByDate: (sales: Sale[]): Record<string, Sale[]> => {
    return sales.reduce((groups, sale) => {
      const date = dataTransforms.formatDate(sale.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(sale)
      return groups
    }, {} as Record<string, Sale[]>)
  },

  getTopSellingProducts: (sales: Sale[], limit = 10): Array<{ productId: string; productName: string; quantity: number; revenue: number }> => {
    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>()

    sales.forEach(sale => {
      sale.items.forEach((item: SaleItem) => {
        const existing = productStats.get(item.productId) || { name: item.product.name, quantity: 0, revenue: 0 }
        existing.quantity += item.quantity
        existing.revenue += item.total
        productStats.set(item.productId, existing)
      })
    })

    return Array.from(productStats.entries())
      .map(([productId, stats]) => ({
        productId,
        productName: stats.name,
        quantity: stats.quantity,
        revenue: stats.revenue,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  },

  // Inventory aggregations
  calculateTotalInventoryValue: (items: InventoryItem[]): number => {
    return items.reduce((total, item) => total + dataTransforms.calculateStockValue(item), 0)
  },

  getLowStockItems: (items: InventoryItem[]): InventoryItem[] => {
    return items.filter(item => dataTransforms.getStockStatus(item) === 'low_stock')
  },

  getOutOfStockItems: (items: InventoryItem[]): InventoryItem[] => {
    return items.filter(item => dataTransforms.getStockStatus(item) === 'out_of_stock')
  },

  groupItemsByCategory: (items: InventoryItem[]): Record<string, InventoryItem[]> => {
    return items.reduce((groups, item) => {
      const category = item.product.category
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
      return groups
    }, {} as Record<string, InventoryItem[]>)
  },
}

// Utility functions for common operations
export const utils = {
  // Debounce function for search inputs
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout
    return ((...args: any[]) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(null, args), wait)
    }) as T
  },

  // Generate unique IDs
  generateId: (): string => {
    return Math.random().toString(36).substring(2, 11)
  },

  // Deep clone objects
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  },

  // Check if object is empty
  isEmpty: (obj: any): boolean => {
    if (obj === null || obj === undefined) return true
    if (Array.isArray(obj)) return obj.length === 0
    if (typeof obj === 'object') return Object.keys(obj).length === 0
    if (typeof obj === 'string') return obj.trim().length === 0
    return false
  },

  // Capitalize first letter
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Generate barcode check digit (for EAN-13)
  generateBarcodeCheckDigit: (barcode: string): string => {
    if (barcode.length !== 12) return ''
    
    let sum = 0
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(barcode[i])
      sum += i % 2 === 0 ? digit : digit * 3
    }
    
    const checkDigit = (10 - (sum % 10)) % 10
    return checkDigit.toString()
  },

  // Validate barcode
  validateBarcode: (barcode: string): boolean => {
    if (!/^\d{13}$/.test(barcode)) return false
    
    const checkDigit = barcode.slice(-1)
    const calculatedCheckDigit = utils.generateBarcodeCheckDigit(barcode.slice(0, 12))
    
    return checkDigit === calculatedCheckDigit
  },
}