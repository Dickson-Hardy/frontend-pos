'use client'

import { useAuth } from '@/contexts/auth-context'
import { apiClient } from '@/lib/api-unified'
import { useState } from 'react'

export function AuthStatusDebug() {
  const { user, token, isAuthenticated, isValidated, isLoading, error } = useAuth()
  const [testResult, setTestResult] = useState<string | null>(null)

  const testApiCall = async () => {
    try {
      setTestResult('Testing...')
      apiClient.syncTokenFromStorage()
      const users = await apiClient.users.getAll()
      setTestResult(`✅ API call successful - got ${users.length} users`)
    } catch (error: any) {
      setTestResult(`❌ API call failed: ${error.message || error}`)
    }
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔐 Auth Debug</h3>
      <div className="space-y-1">
        <div>Loading: {isLoading ? '⏳' : '✅'}</div>
        <div>Validated: {isValidated ? '✅' : '❌'}</div>
        <div>Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>User: {user ? `✅ ${user.email}` : '❌'}</div>
        <div>Token: {token ? `✅ ${token.substring(0, 10)}...` : '❌'}</div>
        <div>API Token: {apiClient.getToken() ? `✅ ${apiClient.getToken()?.substring(0, 10)}...` : '❌'}</div>
        {error && <div className="text-red-400">Error: {error}</div>}
        
        <button 
          onClick={testApiCall}
          className="mt-2 px-2 py-1 bg-blue-600 rounded text-xs hover:bg-blue-700"
        >
          Test API Call
        </button>
        {testResult && <div className="mt-1">{testResult}</div>}
      </div>
    </div>
  )
}