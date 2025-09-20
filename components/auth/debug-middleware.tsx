'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

export function DebugMiddleware() {
  const { user, token, isAuthenticated, isLoading } = useAuth()
  const [cookieInfo, setCookieInfo] = useState<string>('')
  const [localStorageInfo, setLocalStorageInfo] = useState<string>('')

  useEffect(() => {
    const updateDebugInfo = () => {
      // Check cookies
      const cookies = document.cookie.split(';').map(c => c.trim())
      const authCookie = cookies.find(c => c.startsWith('auth_token='))
      setCookieInfo(authCookie ? `Found: ${authCookie.substring(0, 30)}...` : 'Not found')

      // Check localStorage
      const storedToken = localStorage.getItem('auth_token')
      setLocalStorageInfo(storedToken ? `Found: ${storedToken.substring(0, 30)}...` : 'Not found')
    }

    updateDebugInfo()
    
    // Update every second
    const interval = setInterval(updateDebugInfo, 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User Role: {user?.role || 'None'}</div>
        <div>Token: {token ? 'Present' : 'None'}</div>
        <div>Cookie: {cookieInfo}</div>
        <div>LocalStorage: {localStorageInfo}</div>
      </div>
    </div>
  )
}