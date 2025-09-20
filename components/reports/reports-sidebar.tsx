"use client"

import { BarChart3, DollarSign, Receipt, Package, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ReportsSidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const menuItems = [
  { id: "sales", label: "Sales Reports", icon: BarChart3 },
  { id: "profit-loss", label: "Profit & Loss", icon: DollarSign },
  { id: "tax", label: "Tax Reports", icon: Receipt },
  { id: "inventory", label: "Inventory Reports", icon: Package },
  { id: "settlement", label: "Settlement Reports", icon: CreditCard },
]

export function ReportsSidebar({ activeView, onViewChange }: ReportsSidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-serif font-bold">Financial Reports</h2>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <Button
              key={item.id}
              variant={activeView === item.id ? "default" : "ghost"}
              className={cn(
                "w-full justify-start",
                activeView === item.id && "bg-primary text-primary-foreground hover:bg-primary/90",
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
