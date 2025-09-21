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
import { withAuth, useAuth } from "@/contexts/auth-context"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect } from "react"
import { apiClient, Outlet } from "@/lib/api-unified"

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
  const { user, updateUser } = useAuth()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [selectedOutletId, setSelectedOutletId] = useState<string>(user?.outletId || "")

  useEffect(() => {
    const loadOutlets = async () => {
      try {
        const data = await apiClient.outlets.getAll()
        setOutlets(data)
        // Initialize selection from localStorage or user default
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('selected_outlet_id')
          if (saved && data.some(o => o.id === saved)) {
            setSelectedOutletId(saved)
          } else if (!selectedOutletId && (user?.outletId || data[0]?.id)) {
            setSelectedOutletId(user?.outletId || data[0]?.id || '')
          }
        }
      } catch {}
    }
    loadOutlets()
  }, [])

  useEffect(() => {
    if (user && selectedOutletId && selectedOutletId !== user.outletId) {
      updateUser({ ...user, outletId: selectedOutletId, outlet: outlets.find(o => o.id === selectedOutletId) as any })
      // Persist outlet selection for session
      if (typeof window !== 'undefined') {
        localStorage.setItem('selected_outlet_id', selectedOutletId)
      }
    }
  }, [selectedOutletId, user, outlets, updateUser])

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
        <main className="flex-1 p-6 overflow-y-auto bg-background">
          <div className="flex items-center justify-end mb-4 gap-4">
            <div className="text-sm text-muted-foreground hidden md:block">
              Outlet:
            </div>
            <div className="w-64">
              <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger>
                  <SelectValue placeholder={user?.outlet?.name || 'Select outlet'} />
                </SelectTrigger>
                <SelectContent>
                  {outlets.map(o => (
                    <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {renderContent()}
        </main>
      </div>
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(AdminPage, "admin")
