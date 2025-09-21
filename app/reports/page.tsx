"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { ReportsSidebar } from "@/components/reports/reports-sidebar"
import { SalesReports } from "@/components/reports/sales-reports"
import { ProfitLossReport } from "@/components/reports/profit-loss-report"
import { TaxReports } from "@/components/reports/tax-reports"
import { InventoryReports } from "@/components/reports/inventory-reports"
import { SettlementReports } from "@/components/reports/settlement-reports"

type ReportView = "sales" | "profit-loss" | "tax" | "inventory" | "settlement"

export default function ReportsPage() {
  const [activeView, setActiveView] = useState<ReportView>("sales")

  const handleViewChange = (view: string) => {
    setActiveView(view as ReportView)
  }

  const renderContent = () => {
    switch (activeView) {
      case "sales":
        return <SalesReports />
      case "profit-loss":
        return <ProfitLossReport />
      case "tax":
        return <TaxReports />
      case "inventory":
        return <InventoryReports />
      case "settlement":
        return <SettlementReports />
      default:
        return <SalesReports />
    }
  }

  return (
    <LayoutWrapper role="manager">
      <Header title="Financial Reports" role="manager" />

      <div className="flex h-[calc(100vh-80px)]">
        <ReportsSidebar activeView={activeView} onViewChange={handleViewChange} />
        <main className="flex-1 p-6 overflow-y-auto bg-background">{renderContent()}</main>
      </div>
    </LayoutWrapper>
  )
}
