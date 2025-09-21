'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useAuthActions } from '@/hooks/use-auth-actions'
import { apiClient } from '@/lib/api-unified'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react'

export function AuthDebug() {
  const { user, token, isAuthenticated, isLoading, error } = useAuth()
  const { login } = useAuthActions()
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [authEndpointStatus, setAuthEndpointStatus] = useState<'checking' | 'accessible' | 'error'>('checking')
  const [localStorageData, setLocalStorageData] = useState<any>({})
  const [networkInfo, setNetworkInfo] = useState<any>({})
  const [testEmail, setTestEmail] = useState('admin@pharmpos.com')
  const [testPassword, setTestPassword] = useState('admin@2025')

  useEffect(() => {
    // Check API status
    const checkAPI = async () => {
      try {
        setApiStatus('checking')
        const response = await fetch('http://localhost:3001/api/health', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        setApiStatus(response.ok ? 'online' : 'offline')
      } catch (error) {
        console.error('API health check failed:', error)
        setApiStatus('offline')
      }
    }

    // Check auth endpoint
    const checkAuthEndpoint = async () => {
      try {
        setAuthEndpointStatus('checking')
        const response = await fetch('http://localhost:3001/api/auth/me', { 
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        })
        // 401 is expected for unauthenticated requests
        setAuthEndpointStatus(response.status === 401 ? 'accessible' : 'error')
      } catch (error) {
        console.error('Auth endpoint check failed:', error)
        setAuthEndpointStatus('error')
      }
    }

    // Check localStorage
    const checkLocalStorage = () => {
      if (typeof window !== 'undefined') {
        setLocalStorageData({
          auth_token: window.localStorage.getItem('auth_token'),
          user: window.localStorage.getItem('user'),
          hasAuthToken: !!window.localStorage.getItem('auth_token'),
          hasUserData: !!window.localStorage.getItem('user'),
        })
      }
    }

    // Check network information
    const checkNetwork = () => {
      if (typeof window !== 'undefined' && 'navigator' in window) {
        setNetworkInfo({
          online: navigator.onLine,
          userAgent: navigator.userAgent.substring(0, 100) + '...',
          language: navigator.language,
        })
      }
    }

    checkAPI()
    checkAuthEndpoint()
    checkLocalStorage()
    checkNetwork()

    // Set up event listeners for localStorage changes
    const storageListener = () => checkLocalStorage()
    window.addEventListener('storage', storageListener)
    
    return () => {
      window.removeEventListener('storage', storageListener)
    }
  }, [])

  const testLogin = async () => {
    try {
      console.log('Testing login with provided credentials...')
      
      if (!testEmail || !testPassword) {
        alert('Please enter both email and password')
        return
      }

      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: testEmail, password: testPassword }),
        signal: AbortSignal.timeout(10000),
      })

      const data = await response.text()
      console.log('Login test response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: data,
      })

      alert(`Login test result:\nStatus: ${response.status}\nResponse: ${data.substring(0, 200)}`)
    } catch (error) {
      console.error('Login test failed:', error)
      alert(`Login test failed: ${(error as Error).message}`)
    }
  }

  const testAuthFlow = async () => {
    try {
      console.log('Testing auth flow with useAuthActions...')
      await login({ 
        email: 'admin@pharmpos.com', 
        password: 'admin@2025' 
      })
      console.log('Auth flow completed successfully')
    } catch (error) {
      console.error('Auth flow failed:', error)
      alert(`Auth flow failed: ${(error as Error).message}`)
    }
  }

  const clearAuth = () => {
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('user')
    setLocalStorageData({
      auth_token: null,
      user: null,
      hasAuthToken: false,
      hasUserData: false,
    })
    window.location.reload()
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="mt-4 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          Authentication Debug Panel
        </CardTitle>
        <CardDescription>
          Development-only debugging information for authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* API Status */}
        <div>
          <h4 className="font-medium mb-2">Backend API Status</h4>
          <div className="flex items-center gap-2">
            {apiStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
            {apiStatus === 'online' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {apiStatus === 'offline' && <XCircle className="h-4 w-4 text-red-500" />}
            <Badge variant={apiStatus === 'online' ? 'default' : 'destructive'}>
              {apiStatus === 'checking' ? 'Checking...' : apiStatus}
            </Badge>
          </div>
        </div>

        {/* Auth Endpoint Status */}
        <div>
          <h4 className="font-medium mb-2">Auth Endpoint Status</h4>
          <div className="flex items-center gap-2">
            {authEndpointStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin" />}
            {authEndpointStatus === 'accessible' && <CheckCircle className="h-4 w-4 text-green-500" />}
            {authEndpointStatus === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
            <Badge variant={authEndpointStatus === 'accessible' ? 'default' : 'destructive'}>
              {authEndpointStatus === 'checking' ? 'Checking...' : authEndpointStatus}
            </Badge>
          </div>
        </div>

        {/* Auth Context Status */}
        <div>
          <h4 className="font-medium mb-2">Auth Context Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Is Loading: <Badge variant={isLoading ? 'secondary' : 'outline'}>{isLoading.toString()}</Badge></div>
            <div>Is Authenticated: <Badge variant={isAuthenticated ? 'default' : 'destructive'}>{isAuthenticated.toString()}</Badge></div>
            <div>Has User: <Badge variant={user ? 'default' : 'destructive'}>{(!!user).toString()}</Badge></div>
            <div>Has Token: <Badge variant={token ? 'default' : 'destructive'}>{(!!token).toString()}</Badge></div>
          </div>
          {error && (
            <Alert className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* User Information */}
        {user && (
          <div>
            <h4 className="font-medium mb-2">User Information</h4>
            <div className="text-sm space-y-1">
              <div>ID: {user.id}</div>
              <div>Email: {user.email}</div>
              <div>Name: {user.firstName} {user.lastName}</div>
              <div>Role: {user.role}</div>
            </div>
          </div>
        )}

        {/* LocalStorage Status */}
        <div>
          <h4 className="font-medium mb-2">LocalStorage Status</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Has Auth Token: <Badge variant={localStorageData.hasAuthToken ? 'default' : 'destructive'}>{localStorageData.hasAuthToken?.toString()}</Badge></div>
            <div>Has User Data: <Badge variant={localStorageData.hasUserData ? 'default' : 'destructive'}>{localStorageData.hasUserData?.toString()}</Badge></div>
          </div>
          {localStorageData.auth_token && (
            <div className="text-xs mt-2 p-2 bg-gray-100 rounded">
              Token (first 50 chars): {localStorageData.auth_token.substring(0, 50)}...
            </div>
          )}
        </div>

        {/* Network Information */}
        <div>
          <h4 className="font-medium mb-2">Network Status</h4>
          <div className="text-sm space-y-1">
            <div>Online: <Badge variant={networkInfo.online ? 'default' : 'destructive'}>{networkInfo.online?.toString()}</Badge></div>
            <div>Language: {networkInfo.language}</div>
          </div>
        </div>

        {/* Test Credentials */}
        <div className="space-y-2">
          <h4 className="font-medium">Test Credentials</h4>
          <div className="grid grid-cols-1 gap-2">
            <div>
              <Label htmlFor="test-email">Email</Label>
              <Input
                id="test-email"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email"
              />
            </div>
            <div>
              <Label htmlFor="test-password">Password</Label>
              <Input
                id="test-password"
                type="password"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="Enter test password"
              />
            </div>
          </div>
        </div>

        {/* Debug Actions */}
        <div className="space-y-2">
          <h4 className="font-medium">Debug Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testLogin} variant="outline" size="sm">
              Test Login API
            </Button>
            <Button onClick={testAuthFlow} variant="outline" size="sm">
              Test Auth Flow
            </Button>
            <Button onClick={clearAuth} variant="outline" size="sm">
              Clear Auth Data
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
            >
              Reload Page
            </Button>
          </div>
        </div>

        {/* Current URL */}
        <div className="text-xs text-gray-500">
          Current URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}
        </div>
      </CardContent>
    </Card>
  )
}