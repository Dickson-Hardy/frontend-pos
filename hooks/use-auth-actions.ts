'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoginCredentials, RegisterData, ApiError } from '@/lib/api-unified'

export function useAuthActions() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const { login: authLogin, logout: authLogout, register: authRegister } = useAuth()
  const router = useRouter()

  const login = useCallback(async (credentials: LoginCredentials, redirectTo?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await authLogin(credentials)
      
      // Small delay to ensure state is updated and cookie is set
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // If no specific redirect requested, use role-based redirection
      if (!redirectTo) {
        // Get user from localStorage since auth context might not be updated yet
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          const roleRedirects = {
            admin: '/admin',
            manager: '/manager',
            cashier: '/cashier'
          } as const
          
          redirectTo = roleRedirects[user.role as keyof typeof roleRedirects] || '/dashboard'
        } else {
          redirectTo = '/dashboard'
        }
      }
      
      console.log('Redirecting to:', redirectTo)
      
      // Use router.replace to prevent back button issues and redirect loops
      router.replace(redirectTo)
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [authLogin, router])

  const logout = useCallback(async (redirectTo?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await authLogout()
      
      // Redirect after logout
      const redirect = redirectTo || '/login'
      router.push(redirect)
    } catch (err) {
      setError(err as ApiError)
      // Even if logout fails, clear local state and redirect
      router.push('/login')
    } finally {
      setIsLoading(false)
    }
  }, [authLogout, router])

  const register = useCallback(async (userData: RegisterData, redirectTo?: string) => {
    setIsLoading(true)
    setError(null)

    try {
      await authRegister(userData)
      
      // After successful registration, redirect to login
      const redirect = redirectTo || '/login'
      router.push(redirect)
    } catch (err) {
      setError(err as ApiError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [authRegister, router])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    login,
    logout,
    register,
    isLoading,
    error,
    clearError,
  }
}

// Hook for handling authentication redirects
export function useAuthRedirect() {
  const { isAuthenticated, user } = useAuth()
  const router = useRouter()

  const redirectBasedOnRole = useCallback(() => {
    if (!isAuthenticated || !user) {
      router.push('/login')
      return
    }

    switch (user.role) {
      case 'admin':
        router.push('/admin')
        break
      case 'manager':
        router.push('/manager')
        break
      case 'cashier':
        router.push('/cashier')
        break
      default:
        router.push('/dashboard')
    }
  }, [isAuthenticated, user, router])

  const redirectToLogin = useCallback((returnUrl?: string) => {
    const loginUrl = returnUrl ? `/login?redirect=${encodeURIComponent(returnUrl)}` : '/login'
    router.push(loginUrl)
  }, [router])

  const redirectToDashboard = useCallback(() => {
    router.push('/dashboard')
  }, [router])

  return {
    redirectBasedOnRole,
    redirectToLogin,
    redirectToDashboard,
  }
}

// Hook for session management
export function useSessionManagement() {
  const { user, refreshToken, logout } = useAuth()
  const [sessionWarning, setSessionWarning] = useState(false)

  const checkSessionExpiry = useCallback(() => {
    if (!user) return

    // Check if token is close to expiry (this would need to be implemented based on your JWT structure)
    // For now, we'll use a simple approach
    const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date()
    const now = new Date()
    const hoursSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60)

    // Show warning if session is older than 23 hours (assuming 24-hour sessions)
    if (hoursSinceLogin > 23) {
      setSessionWarning(true)
    }
  }, [user])

  const extendSession = useCallback(async () => {
    try {
      await refreshToken()
      setSessionWarning(false)
    } catch (error) {
      console.error('Failed to extend session:', error)
      // Force logout if refresh fails
      await logout()
    }
  }, [refreshToken, logout])

  const dismissWarning = useCallback(() => {
    setSessionWarning(false)
  }, [])

  return {
    sessionWarning,
    checkSessionExpiry,
    extendSession,
    dismissWarning,
  }
}

// Hook for role-based navigation
export function useRoleNavigation() {
  const { user, hasRole, hasPermission } = useAuth()
  const router = useRouter()

  const getAvailableRoutes = useCallback(() => {
    if (!user) return []

    const routes = []

    // Always available
    routes.push({ path: '/dashboard', label: 'Dashboard', icon: 'Home' })

    // Role-based routes
    if (hasRole('cashier')) {
      routes.push({ path: '/cashier', label: 'Cashier POS', icon: 'ShoppingCart' })
    }

    if (hasRole('manager')) {
      routes.push({ path: '/manager', label: 'Manager Dashboard', icon: 'BarChart3' })
      routes.push({ path: '/inventory', label: 'Inventory', icon: 'Package' })
      routes.push({ path: '/reports', label: 'Reports', icon: 'FileText' })
    }

    if (hasRole('admin')) {
      routes.push({ path: '/admin', label: 'Administration', icon: 'Settings' })
      routes.push({ path: '/users', label: 'User Management', icon: 'Users' })
    }

    return routes
  }, [user, hasRole])

  const navigateToRole = useCallback((role?: string) => {
    const targetRole = role || user?.role

    switch (targetRole) {
      case 'admin':
        router.push('/admin')
        break
      case 'manager':
        router.push('/manager')
        break
      case 'cashier':
        router.push('/cashier')
        break
      case 'inventory_manager':
        router.push('/inventory')
        break
      default:
        router.push('/dashboard')
    }
  }, [user, router])

  const canNavigateTo = useCallback((path: string) => {
    const routePermissions: Record<string, { role?: string; permission?: string }> = {
      '/admin': { role: 'admin' },
      '/manager': { role: 'manager' },
      '/cashier': { role: 'cashier' },
      '/inventory': { role: 'manager' },
      '/reports': { role: 'manager' },
      '/users': { permission: 'users.read' },
    }

    const requirement = routePermissions[path]
    if (!requirement) return true // Public route

    if (requirement.role && !hasRole(requirement.role as any)) return false
    if (requirement.permission && !hasPermission(requirement.permission)) return false

    return true
  }, [hasRole, hasPermission])

  return {
    getAvailableRoutes,
    navigateToRole,
    canNavigateTo,
  }
}