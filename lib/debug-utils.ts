/**
 * Debug utilities for development-only logging
 * These functions will be stripped out in production builds
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const debugLog = {
  auth: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`🔐 [AUTH] ${message}`, data || '')
    }
  },
  
  api: (message: string, data?: any) => {
    if (isDevelopment) {
      console.log(`📡 [API] ${message}`, data || '')
    }
  },
  
  error: (message: string, error?: any) => {
    if (isDevelopment) {
      console.error(`❌ [ERROR] ${message}`, error || '')
    }
  },
  
  group: (title: string) => {
    if (isDevelopment) {
      console.group(title)
    }
  },
  
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd()
    }
  },
  
  warn: (message: string, data?: any) => {
    if (isDevelopment) {
      console.warn(`⚠️ [WARN] ${message}`, data || '')
    }
  }
}

export const debugAuth = () => {
  if (isDevelopment && typeof window !== 'undefined') {
    // Only expose debug utilities in development
    (window as any).authDebug = {
      getToken: () => localStorage.getItem('auth_token'),
      getUser: () => {
        try {
          return JSON.parse(localStorage.getItem('user') || 'null')
        } catch {
          return null
        }
      },
      clearAuth: () => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
        window.location.reload()
      }
    }
  }
}