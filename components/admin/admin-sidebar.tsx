"use client"

import {
  BarChart3,
  Users,
  Building2,
  Settings,
  FileText,
  Shield,
  Package,
  Warehouse,
  DollarSign,
  Clock,
  Receipt,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type AdminView =
  | "overview"
  | "users"
  | "outlets"
  | "products"
  | "inventory"
  | "financial"
  | "shifts"
  | "receipts"
  | "reconciliation"
  | "settings"
  | "audit"

interface AdminSidebarProps {
  activeView: AdminView
  onViewChange: (view: AdminView) => void
}

const menuItems: { id: AdminView; label: string; icon: any }[] = [
  { id: "overview", label: "System Overview", icon: BarChart3 },
  { id: "users", label: "User Management", icon: Users },
  { id: "outlets", label: "Outlet Management", icon: Building2 },
  { id: "products", label: "Product Management", icon: Package },
  { id: "inventory", label: "Inventory Control", icon: Warehouse },
  { id: "financial", label: "Financial Reports", icon: DollarSign },
  { id: "shifts", label: "Shift Monitoring", icon: Clock },
  { id: "receipts", label: "Receipt Templates", icon: Receipt },
  { id: "reconciliation", label: "Reconciliation", icon: Calculator },
  { id: "settings", label: "System Settings", icon: Settings },
  { id: "audit", label: "Audit Logs", icon: FileText },
]

export function AdminSidebar({ activeView, onViewChange }: AdminSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="font-serif font-bold">Administration</h2>
        </div>
      </div>

      <nav className="p-4 space-y-2 max-h-[calc(100vh-120px)] overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeView === item.id && "bg-accent text-accent-foreground hover:bg-accent/90",
              )}
              onClick={() => onViewChange(item.id)}
            >
              <Icon className="mr-2 h-4 w-4" />
              {item.label}
            </Button>
          )
        })}
      </nav>
    </div>
  )
}
