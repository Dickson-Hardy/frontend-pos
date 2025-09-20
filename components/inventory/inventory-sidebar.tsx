"use client"

import { Package, BarChart3, Calendar, Truck, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface InventorySidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

const menuItems = [
  { id: "catalog", label: "Product Catalog", icon: Package },
  { id: "stock", label: "Stock Levels", icon: BarChart3 },
  { id: "batches", label: "Batch Tracking", icon: Calendar },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "orders", label: "Purchase Orders", icon: ShoppingCart },
]

export function InventorySidebar({ activeView, onViewChange }: InventorySidebarProps) {
  return (
    <div className="w-64 border-r border-border bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <h2 className="font-serif font-bold">Inventory</h2>
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
