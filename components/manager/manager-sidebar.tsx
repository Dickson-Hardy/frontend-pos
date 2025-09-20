"use client"

import { cn } from "@/lib/utils"
import { LayoutDashboard, Package, Warehouse, Clock, TrendingUp, Users } from "lucide-react"

type ManagerView = "dashboard" | "products" | "inventory" | "shifts" | "sales" | "staff"

interface ManagerSidebarProps {
  activeView: ManagerView
  onViewChange: (view: ManagerView) => void
}

const sidebarItems = [
  { id: "dashboard" as ManagerView, label: "Dashboard", icon: LayoutDashboard },
  { id: "products" as ManagerView, label: "Products", icon: Package },
  { id: "inventory" as ManagerView, label: "Inventory", icon: Warehouse },
  { id: "shifts" as ManagerView, label: "Shift Reports", icon: Clock },
  { id: "sales" as ManagerView, label: "Sales Reports", icon: TrendingUp },
  { id: "staff" as ManagerView, label: "Staff Management", icon: Users },
]

export function ManagerSidebar({ activeView, onViewChange }: ManagerSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-foreground mb-4">Manager Panel</h2>
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                  activeView === item.id
                    ? "bg-rose-100 text-rose-700 font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
