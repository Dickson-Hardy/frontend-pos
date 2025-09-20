'use client'

import React from 'react'
import { AuthProvider } from '@/contexts/auth-context'
import { SessionWarning } from './session-warning'

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <AuthProvider>
      <SessionWarning />
      {children}
    </AuthProvider>
  )
}