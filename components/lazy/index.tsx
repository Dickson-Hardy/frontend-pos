'use client'

import { createLazyComponent } from '@/lib/lazy-loading'
import { Suspense, ComponentType } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

// Loading fallback components
const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  </div>
)

const ChartSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-6 w-32" />
    <Skeleton className="h-64 w-full" />
    <div className="flex justify-center space-x-4">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
)

const FormSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-8 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
    <div className="flex justify-end space-x-2">
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-10 w-20" />
    </div>
  </div>
)

const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="p-6 border rounded-lg">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ChartSkeleton />
      <TableSkeleton />
    </div>
  </div>
)

// Lazy-loaded components with optimized loading
export const LazyProductCatalog = createLazyComponent(
  () => import('@/components/inventory/product-catalog'),
  {
    timeout: 10000,
    retryAttempts: 3,
  }
)

export const LazyProductManagement = createLazyComponent(
  () => import('@/components/manager/product-management'),
  {
    timeout: 10000,
    retryAttempts: 3,
  }
)

export const LazySalesChart = createLazyComponent(
  () => import('@/components/manager/sales-chart'),
  {
    timeout: 10000,
    retryAttempts: 3,
  }
)

export const LazyInventoryManagement = createLazyComponent(
  () => import('@/components/manager/inventory-management'),
  {
    timeout: 10000,
    retryAttempts: 3,
  }
)

export const LazyUserManagement = createLazyComponent(
  () => import('@/components/admin/user-management'),
  {
    timeout: 10000,
    retryAttempts: 3,
  }
)

export const LazyReportsPage = createLazyComponent(
  () => import('@/app/reports/page'),
  {
    timeout: 15000,
    retryAttempts: 3,
  }
)

export const LazyInventoryPage = createLazyComponent(
  () => import('@/app/inventory/page'),
  {
    timeout: 15000,
    retryAttempts: 3,
  }
)

export const LazyManagerPage = createLazyComponent(
  () => import('@/app/manager/page'),
  {
    timeout: 15000,
    retryAttempts: 3,
  }
)

export const LazyAdminPage = createLazyComponent(
  () => import('@/app/admin/page'),
  {
    timeout: 15000,
    retryAttempts: 3,
  }
)

// Wrapper components with Suspense and appropriate fallbacks
export const ProductCatalogWithSuspense = () => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyProductCatalog />
  </Suspense>
)

export const ProductManagementWithSuspense = () => (
  <Suspense fallback={<FormSkeleton />}>
    <LazyProductManagement />
  </Suspense>
)

export const SalesChartWithSuspense = () => (
  <Suspense fallback={<ChartSkeleton />}>
    <LazySalesChart />
  </Suspense>
)

export const InventoryManagementWithSuspense = () => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyInventoryManagement />
  </Suspense>
)

export const UserManagementWithSuspense = () => (
  <Suspense fallback={<TableSkeleton />}>
    <LazyUserManagement />
  </Suspense>
)

export const ReportsPageWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyReportsPage />
  </Suspense>
)

export const InventoryPageWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyInventoryPage />
  </Suspense>
)

export const ManagerPageWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyManagerPage />
  </Suspense>
)

export const AdminPageWithSuspense = () => (
  <Suspense fallback={<DashboardSkeleton />}>
    <LazyAdminPage />
  </Suspense>
)

// Higher-order component for adding lazy loading to any component
export function withLazyLoading<P extends object>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  fallback?: ComponentType,
  options?: {
    timeout?: number
    retryAttempts?: number
  }
) {
  const LazyComponent = createLazyComponent(importFn, options)

  return function LazyWrapper(props: P) {
    const FallbackComponent = fallback || (() => <div>Loading...</div>)

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    )
  }
}

// Preload functions for better UX
export const preloadComponents = {
  productCatalog: () => import('@/components/inventory/product-catalog'),
  productManagement: () => import('@/components/manager/product-management'),
  salesChart: () => import('@/components/manager/sales-chart'),
  inventoryManagement: () => import('@/components/manager/inventory-management'),
  userManagement: () => import('@/components/admin/user-management'),
  reportsPage: () => import('@/app/reports/page'),
  inventoryPage: () => import('@/app/inventory/page'),
  managerPage: () => import('@/app/manager/page'),
  adminPage: () => import('@/app/admin/page'),
}

// Preload critical components on app start
export function preloadCriticalComponents() {
  // Preload components that are likely to be used soon
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback for better performance
    const preloadFn = () => {
      preloadComponents.productCatalog()
      preloadComponents.salesChart()
    }

    if ('requestIdleCallback' in window) {
      requestIdleCallback(preloadFn)
    } else {
      setTimeout(preloadFn, 1000)
    }
  }
}

// Route-based preloading
export function preloadRouteComponents(route: string) {
  switch (route) {
    case '/inventory':
      preloadComponents.inventoryPage()
      preloadComponents.productCatalog()
      preloadComponents.inventoryManagement()
      break
    case '/manager':
      preloadComponents.managerPage()
      preloadComponents.salesChart()
      preloadComponents.productManagement()
      break
    case '/admin':
      preloadComponents.adminPage()
      preloadComponents.userManagement()
      break
    case '/reports':
      preloadComponents.reportsPage()
      break
  }
}

export default {
  LazyProductCatalog,
  LazyProductManagement,
  LazySalesChart,
  LazyInventoryManagement,
  LazyUserManagement,
  LazyReportsPage,
  LazyInventoryPage,
  LazyManagerPage,
  LazyAdminPage,
  ProductCatalogWithSuspense,
  ProductManagementWithSuspense,
  SalesChartWithSuspense,
  InventoryManagementWithSuspense,
  UserManagementWithSuspense,
  ReportsPageWithSuspense,
  InventoryPageWithSuspense,
  ManagerPageWithSuspense,
  AdminPageWithSuspense,
  withLazyLoading,
  preloadComponents,
  preloadCriticalComponents,
  preloadRouteComponents,
}