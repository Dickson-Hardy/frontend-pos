"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { ManagerSidebar } from "@/components/manager/manager-sidebar"
import { DashboardStats } from "@/components/manager/dashboard-stats"
import { SalesChart } from "@/components/manager/sales-chart"
import { InventoryAlerts } from "@/components/manager/inventory-alerts"
import { StaffPerformance } from "@/components/manager/staff-performance"
import { RecentTransactions } from "@/components/manager/recent-transactions"
import { TopProducts } from "@/components/manager/top-products"
import { ProductManagement } from "@/components/manager/product-management"
import { InventoryManagement } from "@/components/manager/inventory-management"
import { ShiftReports } from "@/components/manager/shift-reports"
import { SalesReports } from "@/components/manager/sales-reports"
import { StaffManagement } from "@/components/manager/staff-management"
import { withAuth } from "@/contexts/auth-context"

type ManagerView = "dashboard" | "products" | "inventory" | "shifts" | "sales" | "staff"

function ManagerPage() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState<ManagerView>("dashboard")

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <DashboardStats />
            <div className="grid lg:grid-cols-2 gap-6">
              <SalesChart />
              <TopProducts />
            </div>
            <div className="grid lg:grid-cols-3 gap-6">
              <InventoryAlerts />
              <StaffPerformance />
              <RecentTransactions />
            </div>
          </div>
        )
      case "products":
        return <ProductManagement />
      case "inventory":
        return <InventoryManagement />
      case "shifts":
        return <ShiftReports />
      case "sales":
        return <SalesReports />
      case "staff":
        return <StaffManagement />
      default:
        return <div>Dashboard content</div>
    }
  }

  return (
    <LayoutWrapper role="manager">
      <Header 
        title="Manager Dashboard" 
        role="manager" 
        userName={user ? `${user.firstName} ${user.lastName}` : "Manager"} 
        outletName={user?.outlet?.name || "Pharmacy"} 
      />

      <div className="flex h-[calc(100vh-80px)]">
        <ManagerSidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6 overflow-y-auto bg-background">{renderContent()}</main>
      </div>
    </LayoutWrapper>
  )
}

// Export the component wrapped with authentication
export default withAuth(ManagerPage, "manager")
