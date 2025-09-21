'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode, useRef, useCallback } from 'react'
import { apiClient, User, LoginCredentials, RegisterData, UserRole, ApiError } from '@/lib/api-unified'
import { notifyTokenUpdate } from '@/components/auth/token-sync'
interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isValidated: boolean // Whether token validation has completed
  isLoading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  refreshToken: () => Promise<void>
  revokeAllSessions: () => Promise<void>
  hasRole: (role: UserRole) => boolean
  hasPermission: (permission: string) => boolean
  updateUser: (user: User) => void
  clearError: () => void
  retryInitialization: () => Promise<void>
  sessionTimeRemaining: number | null
  extendSession: () => void
  isSessionExpiring: boolean
}
const AuthContext = createContext<AuthContextType | undefined>(undefined)
interface AuthProviderProps {
  children: ReactNode
}
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isValidated, setIsValidated] = useState(false) // Track if validation completed
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number | null>(null)
  const [isSessionExpiring, setIsSessionExpiring] = useState(false)
  // Refs to prevent race conditions and infinite loops
  const initializationAttempted = useRef(false)
  const isInitializing = useRef(false)
  const retryCount = useRef(0)
  const maxRetries = 3
  const sessionTimer = useRef<NodeJS.Timeout | null>(null)
  const sessionWarningTimer = useRef<NodeJS.Timeout | null>(null)
  const SESSION_DURATION = 16 * 60 * 60 * 1000 // 16 hours in milliseconds (matching backend)
  const SESSION_WARNING_TIME = 30 * 60 * 1000 // 30 minutes before expiry (more reasonable for 16h)
  const clearError = useCallback(() => {
    setError(null)
  }, [])
  const clearSessionTimers = useCallback(() => {
    if (sessionTimer.current) {
      clearTimeout(sessionTimer.current)
      sessionTimer.current = null
    }
    if (sessionWarningTimer.current) {
      clearTimeout(sessionWarningTimer.current)
      sessionWarningTimer.current = null
    }
    setSessionTimeRemaining(null)
    setIsSessionExpiring(false)
  }, [])
  const startSessionTimer = useCallback((loginTime?: Date) => {
    clearSessionTimers()
    const startTime = loginTime || new Date()
    const expiryTime = new Date(startTime.getTime() + SESSION_DURATION)
    const warningTime = new Date(expiryTime.getTime() - SESSION_WARNING_TIME)
    const updateTimer = () => {
      const now = new Date()
      const remaining = expiryTime.getTime() - now.getTime()
      if (remaining <= 0) {
        // Session expired
        logout()
        return
      }
      setSessionTimeRemaining(remaining)
      if (remaining <= SESSION_WARNING_TIME && !isSessionExpiring) {
        setIsSessionExpiring(true)
      }
    }
    // Update immediately
    updateTimer()
    // Set interval to update every minute
    sessionTimer.current = setInterval(updateTimer, 60000)
    // Set warning timer
    const timeToWarning = warningTime.getTime() - new Date().getTime()
    if (timeToWarning > 0) {
      sessionWarningTimer.current = setTimeout(() => {
        setIsSessionExpiring(true)
      }, timeToWarning)
    }
  }, [SESSION_DURATION, SESSION_WARNING_TIME, isSessionExpiring])
  const extendSession = useCallback(() => {
    setIsSessionExpiring(false)
    startSessionTimer() // Reset timer from now
    // Update stored timestamp
    localStorage.setItem('session_start', new Date().toISOString())
  }, [startSessionTimer])
  const clearAuthState = useCallback(() => {
    setUser(null)
    setToken(null)
    setError(null)
    clearSessionTimers()
    // Clear localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('session_start')
    // Clear cookies (cannot set HttpOnly from JavaScript)
    const isSecure = window.location.protocol === 'https:'
    document.cookie = `auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`
    document.cookie = `user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`
    // Clear API client token
    apiClient.setToken(null)
    notifyTokenUpdate()
  }, [clearSessionTimers])
  const handleAuthError = useCallback((error: any, context: string) => {
    let errorMessage = 'An authentication error occurred'
    let shouldClearAuth = false
    if (error && typeof error === 'object') {
      const status = error.statusCode || error.response?.status
      if (status) {
        switch (status) {
          case 401:
            errorMessage = 'Your session has expired. Please log in again.'
            shouldClearAuth = true
            break
          case 403:
            errorMessage = 'Access denied. You don\'t have permission to perform this action.'
            shouldClearAuth = true
            break
          case 404:
            errorMessage = 'Service not found. Please try again later.'
            break
          case 429:
            errorMessage = 'Too many requests. Please wait and try again.'
            break
          case 500:
          case 502:
          case 503:
          case 504:
            errorMessage = 'Server error. Please try again later.'
            break
          default:
            errorMessage = error.message || 'An unexpected error occurred. Please try again.'
            shouldClearAuth = [401, 403].includes(status)
        }
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network connection failed. Please check your internet connection and try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
    }
    setError(errorMessage)
    if (shouldClearAuth) {
      clearAuthState()
    }
  }, [clearAuthState])
  const validateStoredAuth = useCallback(async (storedToken: string, storedUser: string): Promise<boolean> => {
    try {
      const parsedUser = JSON.parse(storedUser)
      const sessionStart = localStorage.getItem('session_start')
      // Set initial state from localStorage
      setToken(storedToken)
      setUser(parsedUser)
      // IMPORTANT: Set API client token BEFORE making any API calls
      apiClient.setToken(storedToken)
      // Ensure token is properly synchronized
      apiClient.syncTokenFromStorage()
      // Set cookies for middleware access (cannot set HttpOnly from JavaScript)
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `auth_token=${storedToken}; path=/; max-age=${16 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      document.cookie = `user_role=${parsedUser.role}; path=/; max-age=${16 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      // Start session timer with stored session start time
      if (sessionStart) {
        startSessionTimer(new Date(sessionStart))
      } else {
        // Fallback: start timer from now if no session start time stored
        const now = new Date()
        localStorage.setItem('session_start', now.toISOString())
        startSessionTimer(now)
      }
      // Try to verify token is still valid with better error handling
      try {
        const profile = await apiClient.auth.getProfile()
        setUser(profile)
        localStorage.setItem('user', JSON.stringify(profile))
        setIsValidated(true)
        return true
      } catch (profileError) {
        // Check if it's an authentication error
        if (profileError && typeof profileError === 'object') {
          const apiError = profileError as ApiError
          if (apiError.code === '401' || apiError.code === '403' || 
              (apiError as any).response?.status === 401 || 
              (apiError as any).response?.status === 403) {
            clearAuthState()
            setIsValidated(true)
            return false
          }
        }
        // For other errors (network, etc.), keep the stored state but log the issue
        setIsValidated(true)
        return true
      }
    } catch (error) {
      clearAuthState()
      return false
    }
  }, [clearAuthState, startSessionTimer])
  const initializeAuth = useCallback(async () => {
    if (isInitializing.current) {
      return
    }
    isInitializing.current = true
    setIsLoading(true)
    setError(null)
    try {
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken && storedUser) {
        const isValid = await validateStoredAuth(storedToken, storedUser)
        if (!isValid && retryCount.current < maxRetries) {
          retryCount.current++
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount.current))
          await initializeAuth()
          return
        }
        if (isValid) {
          retryCount.current = 0
        } else {
        }
      } else {
        clearAuthState()
        setIsValidated(true)
      }
    } catch (error) {
      handleAuthError(error, 'initialization')
      clearAuthState()
    } finally {
      setIsLoading(false)
      isInitializing.current = false
      initializationAttempted.current = true
      setIsValidated(true)
    }
  }, [validateStoredAuth, handleAuthError, clearAuthState])
  const retryInitialization = useCallback(async () => {
    retryCount.current = 0
    initializationAttempted.current = false
    await initializeAuth()
  }, [initializeAuth])
  // Initialize auth state from localStorage
  useEffect(() => {
    if (!initializationAttempted.current) {
      initializeAuth()
    }
    // Debug utilities removed for production
  }, [initializeAuth])
  // Cleanup session timers on unmount
  useEffect(() => {
    return () => {
      clearSessionTimers()
    }
  }, [clearSessionTimers])
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.auth.login(credentials)
      setToken(response.access_token)
      setUser(response.user)
      const now = new Date()
      // Store in localStorage
      localStorage.setItem('auth_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      localStorage.setItem('session_start', now.toISOString())
      // Set cookies for middleware access (cannot set HttpOnly from JavaScript)
      const isSecure = window.location.protocol === 'https:'
      document.cookie = `auth_token=${response.access_token}; path=/; max-age=${16 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      document.cookie = `user_role=${response.user.role}; path=/; max-age=${16 * 60 * 60}; SameSite=Lax${isSecure ? '; Secure' : ''}`
      // Set API client token with explicit sync
      apiClient.setToken(response.access_token)
      // Ensure token is properly synchronized with explicit call
      apiClient.syncTokenFromStorage()
      // Verify token was set correctly
      if (process.env.NODE_ENV === 'development') {
        console.log('[Auth Context] Token set in API client:', !!apiClient.getToken())
      }
      // Start session management
      startSessionTimer(now)
      notifyTokenUpdate()
      retryCount.current = 0
    } catch (error) {
      handleAuthError(error, 'login')
      clearAuthState()
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [handleAuthError, clearAuthState, startSessionTimer])
  const logout = useCallback(async () => {
    try {
      setIsLoading(true)
      // Try to revoke token on server (don't wait too long)
      const logoutPromises = [
        apiClient.auth.revokeToken().catch(() => {}),
        apiClient.auth.logout().catch(() => {})
      ]
      // Wait for API calls but don't block logout if they fail
      await Promise.allSettled(logoutPromises)
    } catch (error) {
    } finally {
      // Always clear local state regardless of API success
      clearAuthState()
      setIsLoading(false)
      // Redirect to login page
      if (typeof window !== 'undefined') {
        // Use router if available, otherwise fallback to location
        const currentPath = window.location.pathname
        const redirectParam = currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : ''
        window.location.href = `/login${redirectParam}`
      }
    }
  }, [clearAuthState])
  const register = useCallback(async (userData: RegisterData) => {
    try {
      setIsLoading(true)
      setError(null)
      await apiClient.auth.register(userData)
    } catch (error) {
      handleAuthError(error, 'registration')
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [handleAuthError])
  const refreshToken = useCallback(async () => {
    try {
      setError(null)
      const profile = await apiClient.auth.getProfile()
      setUser(profile)
      localStorage.setItem('user', JSON.stringify(profile))
    } catch (error) {
      handleAuthError(error, 'token refresh')
      if (error && typeof error === 'object') {
        const apiError = error as ApiError
        if (apiError.code === '401' || apiError.code === '403') {
          clearAuthState()
        }
      }
      throw error
    }
  }, [handleAuthError, clearAuthState])
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false
    // Define role hierarchy
    const roleHierarchy: Record<UserRole, number> = {
      admin: 4,
      manager: 3,
      inventory_manager: 2,
      cashier: 1,
    }
    const userRoleLevel = roleHierarchy[user.role]
    const requiredRoleLevel = roleHierarchy[role]
    return userRoleLevel >= requiredRoleLevel
  }
  const hasPermission = (permission: string): boolean => {
    if (!user) return false
    // Define permissions for each role
    const rolePermissions: Record<UserRole, string[]> = {
      admin: [
        'users.create',
        'users.read',
        'users.update',
        'users.delete',
        'outlets.create',
        'outlets.read',
        'outlets.update',
        'outlets.delete',
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'sales.create',
        'sales.read',
        'sales.update',
        'sales.delete',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'inventory.delete',
        'reports.read',
        'reports.inventory',
        'system.manage',
        'audit.read',
      ],
      manager: [
        'users.read',
        'users.update',
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'sales.create',
        'sales.read',
        'sales.update',
        'inventory.create',
        'inventory.read',
        'inventory.update',
        'inventory.delete',
        'reports.read',
        'reports.inventory',
        'shifts.manage',
      ],
      inventory_manager: [
        'products.create',
        'products.read',
        'products.update',
        'products.delete',
        'inventory.read',
        'inventory.manage',
        'suppliers.manage',
        'reports.inventory',
      ],
      cashier: [
        'products.read',
        'sales.create',
        'sales.read',
        'inventory.read',
        'shifts.manage',
      ],
    }
    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes(permission)
  }
  const revokeAllSessions = useCallback(async () => {
    try {
      setIsLoading(true)
      // Revoke all sessions on server
      await apiClient.auth.revokeAllSessions()
    } catch (error) {
      handleAuthError(error, 'revoke all sessions')
    } finally {
      // Always clear local state after revoking sessions
      clearAuthState()
      setIsLoading(false)
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }, [handleAuthError, clearAuthState])
  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    setError(null)
  }, [])
  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token && isValidated,
    isValidated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshToken,
    revokeAllSessions,
    hasRole,
    hasPermission,
    updateUser,
    clearError,
    retryInitialization,
    sessionTimeRemaining,
    extendSession,
    isSessionExpiring,
  }
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
// Higher-order component for route protection
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: UserRole,
  requiredPermission?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, hasRole, hasPermission, error, retryInitialization, clearError } = useAuth()
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      )
    }
    // Show error state with retry option
    if (error && !isAuthenticated) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={retryInitialization}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  clearError()
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login'
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )
    }
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const redirectParam = currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : ''
        window.location.href = `/login${redirectParam}`
      }
      return null
    }
    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Required role: {requiredRole}</p>
          </div>
        </div>
      )
    }
    if (requiredPermission && !hasPermission(requiredPermission)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have the required permission to access this page.</p>
            <p className="text-sm text-gray-500 mt-2">Required permission: {requiredPermission}</p>
          </div>
        </div>
      )
    }
    return <Component {...props} />
  }
}
// Hook for role-based rendering
export function useRoleAccess() {
  const { hasRole, hasPermission } = useAuth()
  return {
    canAccess: (role?: UserRole, permission?: string) => {
      if (role && !hasRole(role)) return false
      if (permission && !hasPermission(permission)) return false
      return true
    },
    hasRole,
    hasPermission,
  }
}
// Hook for handling authentication errors in components
export function useAuthError() {
  const { error, clearError, retryInitialization } = useAuth()
  const handleRetry = useCallback(async () => {
    try {
      await retryInitialization()
    } catch (error) {
    }
  }, [retryInitialization])
  const handleGoToLogin = useCallback(() => {
    clearError()
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [clearError])
  return {
    error,
    clearError,
    handleRetry,
    handleGoToLogin,
    hasError: !!error,
  }
}
// Hook for authentication state with loading management
export function useAuthState() {
  const { isAuthenticated, isLoading, user, error } = useAuth()
  return {
    isAuthenticated,
    isLoading,
    user,
    error,
    isReady: !isLoading && !error,
    needsLogin: !isLoading && !error && !isAuthenticated,
  }
}
