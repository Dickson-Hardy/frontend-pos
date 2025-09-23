import { User } from './api-unified'

/**
 * Safely extracts outlet ID from user object
 * Handles cases where outletId might be a string or nested in outlet object
 */
export function getOutletId(user: User | null | undefined): string | undefined {
  if (!user) return undefined
  
  // First try direct outletId
  if (user.outletId && typeof user.outletId === 'string') {
    return user.outletId
  }
  
  // Then try outlet object
  if (user.outlet) {
    if (typeof user.outlet === 'string') {
      return user.outlet
    }
    if (typeof user.outlet === 'object' && user.outlet.id) {
      return user.outlet.id
    }
    if (typeof user.outlet === 'object' && user.outlet._id) {
      return user.outlet._id
    }
  }
  
  return undefined
}

/**
 * Gets outlet ID from localStorage as fallback
 */
export function getOutletIdFromStorage(): string | undefined {
  if (typeof window === 'undefined') return undefined
  
  try {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser)
      return getOutletId(parsedUser)
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error)
  }
  
  return undefined
}
