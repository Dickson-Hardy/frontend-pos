"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { InventorySidebar } from "@/components/inventory/inventory-sidebar"
import { ProductCatalog } from "@/components/inventory/product-catalog"
import { StockLevels } from "@/components/inventory/stock-levels"
import { BatchTracking } from "@/components/inventory/batch-tracking"
import { Suppliers } from "@/components/inventory/suppliers"
import { PurchaseOrders } from "@/components/inventory/purchase-orders"

type InventoryView = "catalog" | "stock" | "batches" | "suppliers" | "orders"

export default function InventoryPage() {
  const [activeView, setActiveView] = useState<InventoryView>("catalog")

  const handleViewChange = (view: string) => {
    setActiveView(view as InventoryView)
  }

  const renderContent = () => {
    switch (activeView) {
      case "catalog":
        return <ProductCatalog />
      case "stock":
        return <StockLevels />
      case "batches":
        return <BatchTracking />
      case "suppliers":
        return <Suppliers />
      case "orders":
        return <PurchaseOrders />
      default:
        return <ProductCatalog />
    }
  }

  return (
    <LayoutWrapper role="manager">
      <Header title="Inventory Management" role="manager" userName="Michael Chen" outletName="Downtown Pharmacy" />

      <div className="flex h-[calc(100vh-80px)]">
        <InventorySidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="flex-1 p-6 overflow-y-auto bg-background">{renderContent()}</main>
      </div>
    </LayoutWrapper>
  )
}
