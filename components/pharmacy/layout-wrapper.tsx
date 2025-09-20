"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface LayoutWrapperProps {
  children: ReactNode
  className?: string
  role?: "cashier" | "manager" | "admin"
}

export function LayoutWrapper({ children, className, role }: LayoutWrapperProps) {
  const getRoleStyles = () => {
    switch (role) {
      case "cashier":
        return "bg-primary/5"
      case "manager":
        return "bg-secondary/5"
      case "admin":
        return "bg-accent/5"
      default:
        return "bg-background"
    }
  }

  return <div className={cn("min-h-screen", getRoleStyles(), className)}>{children}</div>
}
