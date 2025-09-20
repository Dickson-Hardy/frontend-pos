'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { useAuthActions } from '@/hooks/use-auth-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorMessage } from '@/components/ui/error-message'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Eye, EyeOff, Pill, AlertCircle } from 'lucide-react'


export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const { login, isLoading, error, clearError } = useAuthActions()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const redirectTo = searchParams.get('redirect')

  // Redirect if already authenticated - after auth loading is complete
  // Always redirect: if no explicit redirect is provided, use role-based default.
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Determine target route
      const roleRedirects = {
        admin: '/admin',
        manager: '/manager',
        cashier: '/cashier',
      } as const

      let target = redirectTo || '/dashboard'

      // Prefer role from context; fallback to localStorage for safety
      const roleFromContext = user?.role
      if (!redirectTo) {
        if (roleFromContext) {
          target = (roleRedirects as any)[roleFromContext] || '/dashboard'
        } else {
          try {
            const storedUser = localStorage.getItem('user')
            if (storedUser) {
              const parsed = JSON.parse(storedUser)
              const role = parsed?.role as keyof typeof roleRedirects | undefined
              if (role) target = roleRedirects[role] || '/dashboard'
            }
          } catch {}
        }
      }

      router.replace(target)
    }
  }, [isAuthenticated, authLoading, router, redirectTo, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!email || !password) {
      return
    }

    try {
      await login({ email, password }, redirectTo || undefined)
    } catch (err) {
      // Error is handled by useAuthActions hook
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Redirecting..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Pill className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to PharmaPOS
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Access your pharmacy management system
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">
                        Authentication Failed
                      </h3>
                      <div className="mt-2 text-sm text-red-700">
                        {error.message || 'Invalid email or password. Please try again.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show redirect info if present */}
              {redirectTo && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-400" />
                    <div className="ml-3">
                      <div className="text-sm text-blue-700">
                        You'll be redirected to your requested page after login.
                      </div>
                    </div>
                  </div>
                </div>
              )}



              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>


          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>
            Need help? Contact your system administrator
          </p>
        </div>
      </div>
    </div>
  )
}