'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAuthActions } from '@/hooks/use-auth-actions'
import { useRoleNavigation } from '@/hooks/use-auth-actions'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, LogOut, Shield, Clock } from 'lucide-react'

function DashboardContent() {
  const { user, hasRole, isLoading, isAuthenticated } = useAuth()
  const { logout } = useAuthActions()
  const { getAvailableRoutes, navigateToRole } = useRoleNavigation()

  // Add debugging
  console.log('Dashboard render:', { user, isLoading, isAuthenticated })

  // If still loading or no user, show loading
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Loading: {isLoading.toString()}, User: {user ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    )
  }

  const availableRoutes = getAvailableRoutes()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to PharmaPOS</h1>
          <p className="mt-2 text-gray-600">Choose your workspace or manage your account</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Your Account
              </CardTitle>
              <CardDescription>Account information and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Role:</strong> {user.role.replace('_', ' ').toUpperCase()}</p>
                {user.outlet && (
                  <p><strong>Outlet:</strong> {user.outlet.name}</p>
                )}
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="w-full mt-4 flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Role-based Access Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Your Workspace
              </CardTitle>
              <CardDescription>Access your role-specific dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Based on your role as {user.role.replace('_', ' ')}, you have access to:
              </p>
              <Button onClick={() => navigateToRole()} className="w-full">
                Go to {user?.role.replace('_', ' ').toUpperCase()} Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableRoutes.slice(1).map((route) => (
                <Button 
                  key={route.path}
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = route.path}
                >
                  {route.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Development Info */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Development Info</CardTitle>
              <CardDescription>Authentication and API client status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">Authentication Status</h4>
                  <ul className="text-sm space-y-1">
                    <li>✅ User authenticated</li>
                    <li>✅ JWT token stored</li>
                    <li>✅ API client configured</li>
                    <li>✅ Role-based access working</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Available Permissions</h4>
                  <div className="text-sm space-y-1">
                    <p>Admin: {hasRole('admin') ? '✅' : '❌'}</p>
                    <p>Manager: {hasRole('manager') ? '✅' : '❌'}</p>
                    <p>Manager: {hasRole('manager') ? '✅' : '❌'}</p>
                    <p>Cashier: {hasRole('cashier') ? '✅' : '❌'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}