'use client'

import { useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api-unified'

/**
 * Authentication Recovery Component
 * Automatically handles token synchronization issues
 */
export function AuthRecovery() {
  const recoveryAttempted = useRef(false)

  useEffect(() => {
    // Only run once per session
    if (recoveryAttempted.current) return
    recoveryAttempted.current = true

    const recoverAuth = () => {
      try {
        // Check if we have auth data but API client doesn't have the token
        const storedToken = localStorage.getItem('auth_token')
        const currentApiToken = apiClient.getToken()

        if (storedToken && !currentApiToken) {
          console.log('[Auth Recovery] Detected token sync issue, fixing...')
          apiClient.syncTokenFromStorage()
          
          // Force a small delay and then reload to ensure everything is properly initialized
          setTimeout(() => {
            window.location.reload()
          }, 500)
        }
      } catch (error) {
        console.error('[Auth Recovery] Error during recovery:', error)
      }
    }

    // Run recovery check after a short delay to allow other components to initialize
    const timer = setTimeout(recoverAuth, 1000)

    return () => clearTimeout(timer)
  }, [])

  return null // This component doesn't render anything
}