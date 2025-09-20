'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useSessionManagement } from '@/hooks/use-session-management'
import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

interface SessionStatusProps {
  showTimeRemaining?: boolean
  className?: string
}

export function SessionStatus({ showTimeRemaining = false, className }: SessionStatusProps) {
  const { isAuthenticated } = useAuth()
  const { sessionStatus, formattedTimeRemaining } = useSessionManagement()

  if (!isAuthenticated) {
    return null
  }

  const getStatusIcon = () => {
    switch (sessionStatus) {
      case 'healthy':
        return <CheckCircle className="h-3 w-3" />
      case 'warning':
        return <AlertTriangle className="h-3 w-3" />
      case 'critical':
        return <XCircle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getStatusVariant = () => {
    switch (sessionStatus) {
      case 'healthy':
        return 'default'
      case 'warning':
        return 'secondary'
      case 'critical':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const getStatusText = () => {
    if (showTimeRemaining && formattedTimeRemaining) {
      return formattedTimeRemaining
    }
    
    switch (sessionStatus) {
      case 'healthy':
        return 'Active'
      case 'warning':
        return 'Expiring Soon'
      case 'critical':
        return 'Expires Soon'
      default:
        return 'Unknown'
    }
  }

  return (
    <Badge 
      variant={getStatusVariant()} 
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  )
}