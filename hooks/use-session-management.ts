'use client'

import { useCallback } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'

export function useSessionManagement() {
  const { 
    logout, 
    extendSession, 
    sessionTimeRemaining, 
    isSessionExpiring,
    revokeAllSessions 
  } = useAuth()
  const router = useRouter()

  const handleLogout = useCallback(async (redirectTo?: string) => {
    try {
      await logout()
      // Logout function already handles redirect to login
    } catch (error) {
      console.error('Logout failed:', error)
      // Force redirect even if logout API fails
      const currentPath = window.location.pathname
      const redirectParam = redirectTo || (currentPath !== '/login' ? `?redirect=${encodeURIComponent(currentPath)}` : '')
      window.location.href = `/login${redirectParam}`
    }
  }, [logout])

  const handleExtendSession = useCallback(() => {
    extendSession()
  }, [extendSession])

  const handleRevokeAllSessions = useCallback(async () => {
    try {
      await revokeAllSessions()
    } catch (error) {
      console.error('Failed to revoke all sessions:', error)
      // Still redirect to login even if API call fails
      window.location.href = '/login'
    }
  }, [revokeAllSessions])

  const formatTimeRemaining = useCallback((timeMs: number | null) => {
    if (!timeMs) return null

    const minutes = Math.floor(timeMs / (1000 * 60))
    const seconds = Math.floor((timeMs % (1000 * 60)) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }, [])

  const getSessionStatus = useCallback(() => {
    if (!sessionTimeRemaining) return 'unknown'
    
    const minutes = Math.floor(sessionTimeRemaining / (1000 * 60))
    
    if (minutes <= 5) return 'critical'
    if (minutes <= 15) return 'warning'
    return 'healthy'
  }, [sessionTimeRemaining])

  return {
    // Actions
    logout: handleLogout,
    extendSession: handleExtendSession,
    revokeAllSessions: handleRevokeAllSessions,
    
    // State
    sessionTimeRemaining,
    isSessionExpiring,
    sessionStatus: getSessionStatus(),
    formattedTimeRemaining: formatTimeRemaining(sessionTimeRemaining),
  }
}

export function useLogoutConfirmation() {
  const { logout } = useSessionManagement()

  const confirmAndLogout = useCallback(async () => {
    const confirmed = window.confirm(
      'Are you sure you want to sign out? Any unsaved work may be lost.'
    )
    
    if (confirmed) {
      await logout()
    }
  }, [logout])

  return {
    confirmAndLogout
  }
}