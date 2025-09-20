'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Clock, AlertTriangle } from 'lucide-react'

export function SessionExpiryWarning() {
  const { isSessionExpiring, sessionTimeRemaining, extendSession, logout } = useAuth()

  if (!isSessionExpiring || !sessionTimeRemaining) {
    return null
  }

  const minutes = Math.floor(sessionTimeRemaining / (1000 * 60))
  const seconds = Math.floor((sessionTimeRemaining % (1000 * 60)) / 1000)
  const totalWarningTime = 30 * 60 * 1000 // 30 minutes warning for 16-hour sessions
  const progressValue = ((totalWarningTime - sessionTimeRemaining) / totalWarningTime) * 100

  const handleExtendSession = () => {
    extendSession()
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <Dialog open={isSessionExpiring} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <DialogTitle>Session Expiring Soon</DialogTitle>
              <DialogDescription>
                Your session will expire automatically for security reasons.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Session timeout progress</span>
              <span>{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Click "Continue Session" to extend your session and keep working, or "Sign Out" to log out now.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Sign Out Now
          </Button>
          <Button onClick={handleExtendSession} className="w-full sm:w-auto">
            Continue Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}