"use client"

import { Package, User, LogOut, Bell, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useLogoutConfirmation } from "@/hooks/use-session-management"
import Link from "next/link"

interface HeaderProps {
  title: string
  role: "cashier" | "manager" | "admin"
  userName?: string
  outletName?: string
}

export function Header({ title, role, userName = "User", outletName = "Main Outlet" }: HeaderProps) {
  const { user } = useAuth()
  const { confirmAndLogout } = useLogoutConfirmation()
  
  // Use real user data if available, fallback to props
  const displayName = user ? `${user.firstName} ${user.lastName}` : userName
  const userRole = user ? user.role : role
  const getRoleColor = () => {
    switch (userRole) {
      case "cashier":
        return "bg-primary text-primary-foreground"
      case "manager":
        return "bg-secondary text-secondary-foreground"
      case "admin":
        return "bg-accent text-accent-foreground"
    }
  }

  return (
    <header className="border-b border-border bg-card shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-lg font-serif font-bold">PharmaPOS</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div>
            <h1 className="text-xl font-serif font-bold">{title}</h1>
            <p className="text-sm text-muted-foreground">{outletName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">3</Badge>
          </Button>

          <Badge className={getRoleColor()}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Badge>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{displayName}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userRole === "cashier" && (
                <DropdownMenuItem asChild>
                  <Link href="/cashier/dashboard">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    My Dashboard
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Preferences</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={confirmAndLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
