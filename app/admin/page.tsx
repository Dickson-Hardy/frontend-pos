"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { SystemOverview } from "@/components/admin/system-overview"
import { UserManagement } from "@/components/admin/user-management"
import { OutletManagement } from "@/components/admin/outlet-management"
import { SystemSettings } from "@/components/admin/system-settings"
import { AuditLogs } from "@/components/admin/audit-logs"
import { ProductManagement } from "@/components/manager/product-management"
import { InventoryManagement } from "@/components/manager/inventory-management"
import { SalesReports } from "@/components/manager/sales-reports"
import { ShiftReports } from "@/components/manager/shift-reports"
import { ReceiptTemplateManagement } from "@/components/admin/receipt-template-management"
import { ReconciliationDashboard } from "@/components/admin/reconciliation-dashboard"
import { withAuth } from "@/contexts/auth-context"

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

function AdminPage() {
  const [activeView, setActiveView] = useState<AdminView>("overview")

  const renderContent = () => {
    switch (activeView) {
      case "overview":
        return <SystemOverview />
      case "users":
        return <UserManagement />
      case "outlets":
        return <OutletManagement />
      case "products":
        return <ProductManagement />
      case "inventory":
        return <InventoryManagement />
      case "financial":
        return <SalesReports />
      case "shifts":
        return <ShiftReports />
      case "receipts":
        return <ReceiptTemplateManagement />
      case "reconciliation":
        return <ReconciliationDashboard />
      case "settings":
        return <SystemSettings />
      case "audit":
        return <AuditLogs />
      default:
        return <SystemOverview />
    }
  }

  return (
    <LayoutWrapper role="admin">
      <Header title="Admin Panel" role="admin" />

      <div className="flex h-[calc(100vh-80px)]">
        <AdminSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6 overflow-y-auto bg-background">{renderContent()}</main>
      </div>
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(AdminPage, "admin")
