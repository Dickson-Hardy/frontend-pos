"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Clock } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface SessionWarningProps {
  warningThreshold?: number // Minutes before expiry to show warning
  className?: string
}

export function SessionWarning({ warningThreshold = 5, className }: SessionWarningProps) {
  const { user, logout, refreshToken } = useAuth()
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [showWarning, setShowWarning] = useState(false)

  useEffect(() => {
    if (!user?.tokenExpiry) return

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const expiry = new Date(user.tokenExpiry).getTime()
      const remaining = Math.max(0, expiry - now)
      const remainingMinutes = Math.floor(remaining / (1000 * 60))
      
      setTimeRemaining(remainingMinutes)
      
      // Show warning if less than threshold minutes remaining
      if (remainingMinutes <= warningThreshold && remainingMinutes > 0) {
        setShowWarning(true)
      } else {
        setShowWarning(false)
      }
      
      // Auto logout if expired
      if (remainingMinutes <= 0) {
        logout()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [user?.tokenExpiry, warningThreshold, logout])

  const handleExtendSession = async () => {
    try {
      await refreshToken()
      setShowWarning(false)
    } catch (error) {
      console.error('Failed to refresh token:', error)
      // Let the user know refresh failed, they'll be logged out soon
    }
  }

  if (!showWarning || timeRemaining === null) {
    return null
  }

  return (
    <Alert className={`border-warning bg-warning/10 ${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Session Expiring Soon
      </AlertTitle>
      <AlertDescription className="mt-2">
        <div className="flex items-center justify-between">
          <span>
            Your session will expire in {timeRemaining} minute{timeRemaining !== 1 ? 's' : ''}. 
            Would you like to extend your session?
          </span>
          <div className="flex gap-2 ml-4">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExtendSession}
            >
              Extend Session
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={logout}
            >
              Logout Now
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}

export default SessionWarning
