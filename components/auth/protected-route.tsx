'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/api-unified'
import { Shield, AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
  requiredPermission?: string
  fallbackPath?: string
  showAccessDenied?: boolean
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/dashboard',
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasRole, hasPermission, user } = useAuth()
  const router = useRouter()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/login')
    return null
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    if (!showAccessDenied) {
      router.push(fallbackPath)
      return null
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">
              You need {requiredRole.replace('_', ' ')} privileges to access this page.
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push(fallbackPath)} className="w-full">
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (!showAccessDenied) {
      router.push(fallbackPath)
      return null
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-100 p-3 rounded-full">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Insufficient Permissions</h1>
            <p className="text-gray-600 mb-6">
              You don't have the required permission ({requiredPermission}) to access this page.
            </p>
            <div className="space-y-3">
              <Button onClick={() => router.push(fallbackPath)} className="w-full">
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.back()} 
                className="w-full"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User has access, render children
  return <>{children}</>
}

// Higher-order component version
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook for conditional rendering based on permissions
export function usePermissionGuard() {
  const { hasRole, hasPermission, user } = useAuth()

  const canAccess = (role?: UserRole, permission?: string) => {
    if (role && !hasRole(role)) return false
    if (permission && !hasPermission(permission)) return false
    return true
  }

  const renderIfAllowed = (
    element: React.ReactNode,
    role?: UserRole,
    permission?: string,
    fallback?: React.ReactNode
  ) => {
    return canAccess(role, permission) ? element : (fallback || null)
  }

  return {
    canAccess,
    renderIfAllowed,
    hasRole,
    hasPermission,
    user,
  }
}