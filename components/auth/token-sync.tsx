'use client'

import { useEffect } from 'react'

// Extend window type to include our custom property
declare global {
  interface Window {
    fetch: typeof fetch & { __tokenInterceptorSet?: boolean }
  }
}

/**
 * Component that synchronizes localStorage token with cookies and headers
 * for middleware access. This ensures consistent token storage across
 * client and server-side code.
 */
export function TokenSync() {
  useEffect(() => {
    // Function to sync token from localStorage to cookie
    const syncToken = () => {
      console.group('🔄 [TOKEN-SYNC] Starting token synchronization')
      const token = localStorage.getItem('auth_token')
      const syncStartTime = Date.now()
      
      console.log('🔄 [TOKEN-SYNC] Initial sync state', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 20) + '...' : null,
        timestamp: new Date().toISOString()
      })
      
      if (token) {
        try {
          // Validate token structure before setting cookie
          console.log('🔍 [TOKEN-SYNC] Validating token structure...')
          const parts = token.split('.')
          if (parts.length !== 3) {
            console.error('❌ [TOKEN-SYNC] Invalid JWT token structure', {
              parts: parts.length,
              expectedParts: 3
            })
            console.groupEnd()
            return
          }
          
          // Try to decode payload for additional validation
          try {
            const payload = JSON.parse(atob(parts[1]))
            console.log('✅ [TOKEN-SYNC] Token payload validation', {
              hasExpiry: !!payload.exp,
              hasRole: !!payload.role,
              hasUserId: !!(payload.sub || payload.id),
              isExpired: payload.exp ? payload.exp <= Date.now() / 1000 : 'unknown',
              expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'unknown'
            })
          } catch (payloadError) {
            console.warn('⚠️ [TOKEN-SYNC] Could not decode token payload (proceeding anyway)', {
              error: payloadError instanceof Error ? payloadError.message : 'Unknown error'
            })
          }
          
          // Set secure cookie for middleware access
          const isSecure = window.location.protocol === 'https:'
          const maxAge = 7 * 24 * 60 * 60 // 7 days
          const cookieOptions = `path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`
          const cookieString = `auth_token=${token}; ${cookieOptions}`
          
          console.log('🍪 [TOKEN-SYNC] Setting cookie', {
            isSecure,
            maxAge,
            sameSite: 'Lax',
            path: '/',
            cookieLength: cookieString.length
          })
          
          document.cookie = cookieString
          
          // Verify cookie was set successfully
          console.log('🔍 [TOKEN-SYNC] Verifying cookie was set...')
          const cookies = document.cookie.split(';').map(c => c.trim())
          const authCookie = cookies.find(c => c.startsWith('auth_token='))
          
          const cookieVerification = {
            found: !!authCookie,
            cookieValue: authCookie ? authCookie.substring(0, 30) + '...' : null,
            totalCookies: cookies.length,
            allCookieNames: cookies.map(c => c.split('=')[0])
          }
          
          console.log('✅ [TOKEN-SYNC] Cookie verification result', cookieVerification)
          
          if (!authCookie) {
            console.error('❌ [TOKEN-SYNC] Cookie was not set successfully!')
          }
          
          // Set up interceptor for future requests to include token in custom header
          console.log('🔧 [TOKEN-SYNC] Setting up fetch interceptor...')
          if (!window.fetch.__tokenInterceptorSet) {
            const originalFetch = window.fetch
            window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
              const currentToken = localStorage.getItem('auth_token')
              const headers = new Headers(init?.headers)
              
              if (currentToken) {
                headers.set('x-auth-token', currentToken)
                // Only log for non-health checks to reduce noise
                const url = typeof input === 'string' ? input : input.toString()
                if (!url.includes('/health') && process.env.NODE_ENV === 'development') {
                  console.log('📡 [TOKEN-SYNC] Adding token to request headers', {
                    url,
                    hasToken: true,
                    tokenLength: currentToken.length
                  })
                }
              }
              
              return originalFetch(input, {
                ...init,
                headers
              })
            }
            window.fetch.__tokenInterceptorSet = true
            console.log('✅ [TOKEN-SYNC] Fetch interceptor installed successfully')
          } else {
            console.log('ℹ️ [TOKEN-SYNC] Fetch interceptor already installed')
          }
          
        } catch (error) {
          console.error('❌ [TOKEN-SYNC] Error during token sync', {
            error: error instanceof Error ? error.message : 'Unknown error',
            tokenPresent: !!token
          })
        }
      } else {
        console.log('🧹 [TOKEN-SYNC] No token found, clearing cookie...')
        // Clear cookie if no token
        // Clear auth token cookie securely
        const isSecure = window.location.protocol === 'https:'
        const cookieOptions = `path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${isSecure ? '; Secure' : ''}`
        document.cookie = `auth_token=; ${cookieOptions}`
        // Also clear any role cookie to keep state consistent with standard auth flows
        document.cookie = 'user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax'
        
        // Verify cookie was cleared
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookie = cookies.find(c => c.startsWith('auth_token='))
        const roleCookie = cookies.find(c => c.startsWith('user_role='))
        console.log('🧹 [TOKEN-SYNC] Cookie clearing verification', {
          cookieStillPresent: !!authCookie,
          roleCookieStillPresent: !!roleCookie,
          success: !authCookie && !roleCookie
        })
      }
      
      const syncDuration = Date.now() - syncStartTime
      console.log('🏁 [TOKEN-SYNC] Synchronization completed', {
        duration: `${syncDuration}ms`,
        successful: true,
        timestamp: new Date().toISOString()
      })
      console.groupEnd()
    }

    // Sync on mount
    console.log('🚀 [TOKEN-SYNC] Component mounted, starting initial sync')
    syncToken()

    // Also sync shortly after mount to avoid race with other startup code.
    // Use a slightly longer delay and avoid multiple immediate syncs which can
    // cause quick cookie clears and trigger middleware redirects.
    const immediateSync = setTimeout(() => {
      console.log('⚡ [TOKEN-SYNC] Performing immediate follow-up sync')
      syncToken()
    }, 500)

    // Debounce syncs triggered by frequent events to avoid rapid cookie clears
    let debounceTimer: number | undefined
    const scheduleSync = () => {
      if (debounceTimer) window.clearTimeout(debounceTimer)
      // Coalesce rapid events into a single sync
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      debounceTimer = window.setTimeout(() => {
        guardedSyncToken()
        debounceTimer = undefined
      }, 250)
    }

    // Guard against clearing cookies more than once in a short interval
    let lastClearTime = 0
    const minClearInterval = 2000 // milliseconds

    const guardedSyncToken = () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        const now = Date.now()
        if (now - lastClearTime < minClearInterval) {
          console.log('🔐 [TOKEN-SYNC] Skipping cookie clear (debounced)')
          return
        }
        lastClearTime = now
      }
      syncToken()
    }

    // Listen for storage changes (when token is updated in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        console.log('🔄 [TOKEN-SYNC] Cross-tab storage change detected', {
          key: e.key,
          oldValue: e.oldValue ? e.oldValue.substring(0, 20) + '...' : null,
          newValue: e.newValue ? e.newValue.substring(0, 20) + '...' : null,
          storageArea: e.storageArea === localStorage ? 'localStorage' : 'other'
        })
        scheduleSync()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Listen for custom events when token is updated in the same tab
    const handleTokenUpdate = () => {
      console.log('📢 [TOKEN-SYNC] Same-tab token update event detected')
      scheduleSync()
    }

    window.addEventListener('auth-token-updated', handleTokenUpdate)

    // Also listen for page visibility changes to ensure token stays synced
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [TOKEN-SYNC] Page became visible, performing sync check', {
          visibilityState: document.visibilityState,
          hidden: document.hidden
        })
        scheduleSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Add focus event listener for when window regains focus
    const handleWindowFocus = () => {
      console.log('🎯 [TOKEN-SYNC] Window regained focus, performing sync check')
      scheduleSync()
    }

    window.addEventListener('focus', handleWindowFocus)

    return () => {
      console.log('🧹 [TOKEN-SYNC] Component unmounting, cleaning up listeners')
      clearTimeout(immediateSync)
      if (debounceTimer) window.clearTimeout(debounceTimer)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-token-updated', handleTokenUpdate)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [])

  return null // This component doesn't render anything
}

/**
 * Utility function to dispatch token update event
 * Call this whenever the token is updated to ensure sync
 */
export function notifyTokenUpdate() {
  if (typeof window !== 'undefined') {
    console.log('📢 [TOKEN-SYNC] Notifying token update event', {
      timestamp: new Date().toISOString(),
      hasToken: !!localStorage.getItem('auth_token')
    })
    window.dispatchEvent(new CustomEvent('auth-token-updated'))
  } else {
    console.warn('⚠️ [TOKEN-SYNC] Cannot notify token update - window not available')
  }
}