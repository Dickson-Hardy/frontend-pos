'use client'

import React from 'react'
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Search, 
  AlertCircle,
  Plus,
  Database,
  TrendingUp,
  Clipboard,
  Building,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ 
  icon: Icon = Package, 
  title, 
  description, 
  action, 
  className 
}: EmptyStateProps) {
  return (
    <Card className={cn('border-dashed', className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
        {action && (
          <Button onClick={action.onClick}>
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Specific empty states for different sections

export function NoProductsFound({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No products found"
      description="No products match your search criteria. Try adjusting your filters or add a new product."
      action={onAddProduct ? {
        label: "Add Product",
        onClick: onAddProduct
      } : undefined}
    />
  )
}

export function NoSearchResults({ searchTerm }: { searchTerm: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No products found for "${searchTerm}". Try different keywords or check the spelling.`}
    />
  )
}

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">Cart is empty</h3>
      <p className="text-muted-foreground">Add products to start a new sale</p>
    </div>
  )
}

export function NoTransactions({ onCreateSale }: { onCreateSale?: () => void }) {
  return (
    <EmptyState
      icon={FileText}
      title="No transactions yet"
      description="No sales have been recorded today. Start by processing your first sale."
      action={onCreateSale ? {
        label: "New Sale",
        onClick: onCreateSale
      } : undefined}
    />
  )
}

export function NoUsers({ onAddUser }: { onAddUser?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No users found"
      description="No users match your search criteria. Add new team members to get started."
      action={onAddUser ? {
        label: "Add User",
        onClick: onAddUser
      } : undefined}
    />
  )
}

export function NoReports() {
  return (
    <EmptyState
      icon={TrendingUp}
      title="No data available"
      description="There's no data available for the selected period. Try selecting a different date range."
    />
  )
}

export function NoInventoryItems({ onAddProduct }: { onAddProduct?: () => void }) {
  return (
    <EmptyState
      icon={Package}
      title="No inventory items"
      description="Your inventory is empty. Add products to start managing your stock levels."
      action={onAddProduct ? {
        label: "Add Product",
        onClick: onAddProduct
      } : undefined}
    />
  )
}

export function NoPurchaseOrders({ onCreatePO }: { onCreatePO?: () => void }) {
  return (
    <EmptyState
      icon={Clipboard}
      title="No purchase orders"
      description="No purchase orders have been created yet. Create your first order to restock inventory."
      action={onCreatePO ? {
        label: "Create Purchase Order",
        onClick: onCreatePO
      } : undefined}
    />
  )
}

export function NoOutlets({ onAddOutlet }: { onAddOutlet?: () => void }) {
  return (
    <EmptyState
      icon={Building}
      title="No outlets configured"
      description="No pharmacy outlets have been set up yet. Add your first outlet to get started."
      action={onAddOutlet ? {
        label: "Add Outlet",
        onClick: onAddOutlet
      } : undefined}
    />
  )
}

export function NoAuditLogs() {
  return (
    <EmptyState
      icon={FileText}
      title="No audit logs"
      description="No system activity has been logged for the selected period."
    />
  )
}

export function DataUnavailable({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={Database}
      title="Data unavailable"
      description="Unable to load data at this time. Please check your connection and try again."
      action={onRetry ? {
        label: "Retry",
        onClick: onRetry
      } : undefined}
    />
  )
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="You're offline"
      description="Some features may not be available while offline. Check your internet connection."
      action={onRetry ? {
        label: "Try Again",
        onClick: onRetry
      } : undefined}
    />
  )
}

export function MaintenanceMode() {
  return (
    <EmptyState
      icon={Settings}
      title="System maintenance"
      description="The system is currently under maintenance. Please try again later."
    />
  )
}

// Generic empty table component
export function EmptyTable({ 
  columns, 
  message = "No data available" 
}: { 
  columns: number
  message?: string 
}) {
  return (
    <tr>
      <td colSpan={columns} className="py-12 text-center">
        <div className="flex flex-col items-center">
          <Database className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </td>
    </tr>
  )
}