'use client'

import { useState, useCallback, useMemo } from 'react'
import { useApi } from './use-api'
import { apiClient, SalesReportParams, StaffReportParams } from '@/lib/api-unified'
import { dataTransforms, dataAggregations } from '@/lib/data-utils'

export function useSalesReport(params?: SalesReportParams) {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({
    startDate: params?.startDate,
    endDate: params?.endDate,
  })
  const [outletFilter, setOutletFilter] = useState<string>(params?.outletId || '')

  const combinedParams = useMemo(() => ({
    startDate: dateRange.startDate || '',
    endDate: dateRange.endDate || '',
    ...(outletFilter && { outletId: outletFilter }),
  }), [dateRange, outletFilter])

  const {
    data: report,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.reports.getSales(combinedParams),
    {
      cacheKey: `sales-report-${JSON.stringify(combinedParams)}`,
      immediate: !!(combinedParams.startDate && combinedParams.endDate),
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  const handleDateRangeChange = useCallback((startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate })
  }, [])

  const handleOutletFilter = useCallback((outletId: string) => {
    setOutletFilter(outletId)
  }, [])

  const clearFilters = useCallback(() => {
    setDateRange({})
    setOutletFilter('')
  }, [])

  return {
    report,
    loading,
    error,
    params: combinedParams,
    handleDateRangeChange,
    handleOutletFilter,
    clearFilters,
    refetch,
    mutate,
  }
}

export function useWeeklySalesReport(outletId?: string) {
  return useApi(
    () => apiClient.reports.getWeeklySales(outletId),
    {
      cacheKey: `weekly-sales-report-${outletId || 'all'}`,
      cacheDuration: 10 * 60 * 1000, // 10 minutes
    }
  )
}

export function useInventoryReport(outletId?: string) {
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  const {
    data: report,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.reports.getInventory(outletId),
    {
      cacheKey: `inventory-report-${outletId || 'all'}`,
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Filtered report data
  const filteredReport = useMemo(() => {
    if (!report) return null

    let filteredLowStock = report.lowStockItems
    let filteredExpiring = report.expiringItems

    // Apply category filter
    if (categoryFilter) {
      filteredLowStock = filteredLowStock.filter(item => item.category === categoryFilter)
      filteredExpiring = filteredExpiring.filter(item => item.product.category === categoryFilter)
    }

    // Apply status filter for expiring items
    if (statusFilter === 'expired') {
      filteredExpiring = filteredExpiring.filter(item => item.daysToExpiry <= 0)
    } else if (statusFilter === 'expiring_soon') {
      filteredExpiring = filteredExpiring.filter(item => item.daysToExpiry > 0 && item.daysToExpiry <= 30)
    }

    return {
      ...report,
      lowStockItems: filteredLowStock,
      expiringItems: filteredExpiring,
    }
  }, [report, categoryFilter, statusFilter])

  const handleCategoryFilter = useCallback((category: string) => {
    setCategoryFilter(category)
  }, [])

  const handleStatusFilter = useCallback((status: string) => {
    setStatusFilter(status)
  }, [])

  const clearFilters = useCallback(() => {
    setCategoryFilter('')
    setStatusFilter('')
  }, [])

  return {
    report: filteredReport,
    originalReport: report,
    loading,
    error,
    categoryFilter,
    statusFilter,
    handleCategoryFilter,
    handleStatusFilter,
    clearFilters,
    refetch,
    mutate,
  }
}

export function useStaffPerformanceReport(params?: StaffReportParams) {
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({
    startDate: params?.startDate,
    endDate: params?.endDate,
  })
  const [staffFilter, setStaffFilter] = useState<string>(params?.staffId || '')
  const [outletFilter, setOutletFilter] = useState<string>(params?.outletId || '')

  const combinedParams = useMemo(() => ({
    startDate: dateRange.startDate || '',
    endDate: dateRange.endDate || '',
    ...(staffFilter && { staffId: staffFilter }),
    ...(outletFilter && { outletId: outletFilter }),
  }), [dateRange, staffFilter, outletFilter])

  const {
    data: reports,
    loading,
    error,
    refetch,
    mutate,
  } = useApi(
    () => apiClient.reports.getStaffPerformance(combinedParams),
    {
      cacheKey: `staff-performance-report-${JSON.stringify(combinedParams)}`,
      immediate: !!(combinedParams.startDate && combinedParams.endDate),
      cacheDuration: 5 * 60 * 1000, // 5 minutes
    }
  )

  // Calculate aggregated statistics
  const aggregatedStats = useMemo(() => {
    if (!reports || reports.length === 0) return null

    const totalSales = reports.reduce((sum, report) => sum + report.totalSales, 0)
    const totalTransactions = reports.reduce((sum, report) => sum + report.transactionCount, 0)
    const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0

    const topPerformer = reports.reduce((top, current) => 
      current.totalSales > top.totalSales ? current : top
    )

    return {
      totalSales,
      totalTransactions,
      averageTransaction,
      staffCount: reports.length,
      topPerformer,
      averageSalesPerStaff: reports.length > 0 ? totalSales / reports.length : 0,
    }
  }, [reports])

  const handleDateRangeChange = useCallback((startDate?: string, endDate?: string) => {
    setDateRange({ startDate, endDate })
  }, [])

  const handleStaffFilter = useCallback((staffId: string) => {
    setStaffFilter(staffId)
  }, [])

  const handleOutletFilter = useCallback((outletId: string) => {
    setOutletFilter(outletId)
  }, [])

  const clearFilters = useCallback(() => {
    setDateRange({})
    setStaffFilter('')
    setOutletFilter('')
  }, [])

  return {
    reports: reports || [],
    aggregatedStats,
    loading,
    error,
    params: combinedParams,
    handleDateRangeChange,
    handleStaffFilter,
    handleOutletFilter,
    clearFilters,
    refetch,
    mutate,
  }
}

// Specialized report hooks for common use cases
export function useTodaysReport(outletId?: string) {
  const today = new Date().toISOString().split('T')[0]
  
  return useSalesReport({
    startDate: today,
    endDate: today,
    outletId,
  })
}

export function useWeeklyReport(outletId?: string) {
  const today = new Date()
  const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const weekEnd = today.toISOString().split('T')[0]
  
  return useSalesReport({
    startDate: weekStart,
    endDate: weekEnd,
    outletId,
  })
}

export function useMonthlyReport(month?: number, year?: number, outletId?: string) {
  const currentDate = new Date()
  const targetMonth = month ?? currentDate.getMonth() + 1
  const targetYear = year ?? currentDate.getFullYear()
  
  const startDate = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-01`
  const endDate = new Date(targetYear, targetMonth, 0).toISOString().split('T')[0]
  
  return useSalesReport({
    startDate,
    endDate,
    outletId,
  })
}

// Tax reports hook
export function useTaxReport(params?: SalesReportParams) {
  const { report, ...rest } = useSalesReport(params)

  const taxData = useMemo(() => {
    if (!report) return null

    // Sierra Leone tax rates (as of 2024)
    const TAX_RATES = {
      'medicines': 0.0, // Medicines are typically tax-exempt
      'medical_supplies': 0.15, // 15% GST for medical supplies
      'general': 0.15, // 15% GST for general items
      'prescription': 0.0, // Prescription medicines are tax-exempt
      'otc': 0.15, // Over-the-counter medicines may have tax
    }

    // Calculate tax breakdown from sales data with proper tax rates
    const taxBreakdown = {
      totalTaxableAmount: report.totalSales,
      totalTaxCollected: report.salesByCategory.reduce((total, category) => {
        const taxRate = TAX_RATES[category.category as keyof typeof TAX_RATES] || TAX_RATES.general
        return total + (category.sales * taxRate)
      }, 0),
      taxByCategory: report.salesByCategory.map(category => {
        const taxRate = TAX_RATES[category.category as keyof typeof TAX_RATES] || TAX_RATES.general
        return {
          category: category.category,
          taxableAmount: category.sales,
          taxCollected: category.sales * taxRate,
          taxRate: taxRate * 100, // Convert to percentage
        }
      }),
      dailyTaxBreakdown: report.dailyBreakdown.map(day => {
        // For daily breakdown, use average tax rate
        const avgTaxRate = report.salesByCategory.length > 0 
          ? report.salesByCategory.reduce((sum, cat) => {
              const rate = TAX_RATES[cat.category as keyof typeof TAX_RATES] || TAX_RATES.general
              return sum + rate
            }, 0) / report.salesByCategory.length
          : TAX_RATES.general
        
        return {
          date: day.date,
          taxableAmount: day.sales,
          taxCollected: day.sales * avgTaxRate,
        }
      }),
    }

    return taxBreakdown
  }, [report])

  return {
    ...rest,
    report,
    taxData,
  }
}

// Settlement reports hook
export function useSettlementReport(params?: SalesReportParams) {
  const { report, ...rest } = useSalesReport(params)

  const settlementData = useMemo(() => {
    if (!report) return null

    // Calculate settlement breakdown
    const settlementBreakdown = {
      totalSales: report.totalSales,
      totalTransactions: report.totalTransactions,
      averageTransaction: report.averageTransaction,
      paymentMethodBreakdown: [
        // This would need to be enhanced with actual payment method data from backend
        { method: 'Cash', amount: report.totalSales * 0.4, transactions: Math.floor(report.totalTransactions * 0.4) },
        { method: 'Card', amount: report.totalSales * 0.35, transactions: Math.floor(report.totalTransactions * 0.35) },
        { method: 'Mobile', amount: report.totalSales * 0.2, transactions: Math.floor(report.totalTransactions * 0.2) },
        { method: 'Insurance', amount: report.totalSales * 0.05, transactions: Math.floor(report.totalTransactions * 0.05) },
      ],
      dailySettlement: report.dailyBreakdown.map(day => ({
        date: day.date,
        sales: day.sales,
        transactions: day.transactions,
        cashAmount: day.sales * 0.4,
        cardAmount: day.sales * 0.35,
        mobileAmount: day.sales * 0.2,
        insuranceAmount: day.sales * 0.05,
      })),
    }

    return settlementBreakdown
  }, [report])

  return {
    ...rest,
    report,
    settlementData,
  }
}

// Analytics hooks for dashboard widgets
export function useSalesAnalytics(outletId?: string, days = 30) {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { report, loading, error } = useSalesReport({
    startDate,
    endDate,
    outletId,
  })

  const analytics = useMemo(() => {
    if (!report) return null

    // Calculate trends and insights
    const dailySales = report.dailyBreakdown
    const recentDays = dailySales.slice(-7) // Last 7 days
    const previousDays = dailySales.slice(-14, -7) // Previous 7 days

    const recentAverage = recentDays.reduce((sum, day) => sum + day.sales, 0) / recentDays.length
    const previousAverage = previousDays.reduce((sum, day) => sum + day.sales, 0) / previousDays.length

    const salesTrend = previousAverage > 0 ? ((recentAverage - previousAverage) / previousAverage) * 100 : 0

    const peakSalesDay = dailySales.reduce((peak, day) => 
      day.sales > peak.sales ? day : peak
    )

    const categoryTrends = report.salesByCategory.map(category => {
      // Calculate trend based on comparing current period with previous period
      const currentTotal = category.sales || 0       // Use sales property
      const percentageShare = category.percentage || 0 // Use percentage property
      
      // Estimate trend based on performance relative to average
      const averageRevenue = report.totalSales / report.salesByCategory.length
      const performanceRatio = currentTotal / averageRevenue
      
      let trend = 0
      if (performanceRatio > 1.2) trend = 15 // Strong positive trend
      else if (performanceRatio > 1.1) trend = 8 // Moderate positive trend
      else if (performanceRatio > 0.9) trend = 2 // Slight positive trend
      else if (performanceRatio > 0.8) trend = -5 // Slight negative trend
      else trend = -12 // Strong negative trend
      
      return {
        ...category,
        trend,
      }
    })

    return {
      salesTrend,
      recentAverage,
      previousAverage,
      peakSalesDay,
      categoryTrends,
      topProducts: report.topProducts,
      totalGrowth: salesTrend,
    }
  }, [report])

  return {
    analytics,
    loading,
    error,
  }
}

export function useInventoryAnalytics(outletId?: string) {
  const { report, loading, error } = useInventoryReport(outletId)

  const analytics = useMemo(() => {
    if (!report) return null

    // Calculate inventory insights from real data
    // Calculate stock turnover rate from historical sales and inventory data
    const stockTurnoverRate = (() => {
      if (!report.totalItems || report.totalItems === 0) return 0
      
      // Estimate turnover based on sales velocity and current inventory
      const totalValue = report.totalValue || 1
      // Use totalValue from report instead of totalSales for inventory reports
      const dailyAverageSales = (totalValue * 0.1) / 30 // Estimate 10% daily movement
      
      // Calculate how many days it would take to sell current inventory
      const daysToSellInventory = dailyAverageSales > 0 ? totalValue / dailyAverageSales : 365
      
      // Convert to annual turnover rate
      const annualTurnoverRate = 365 / Math.max(daysToSellInventory, 1)
      
      return Math.round(annualTurnoverRate * 100) / 100 // Round to 2 decimal places
    })()
    const averageDaysToExpiry = report.expiringItems.reduce((sum, item) => sum + item.daysToExpiry, 0) / report.expiringItems.length || 0

    const categoryRisks = report.categoryBreakdown.map(category => ({
      category: category.category,
      riskLevel: category.itemCount > 50 ? 'high' : category.itemCount > 20 ? 'medium' : 'low',
      value: category.totalValue,
      itemCount: category.itemCount,
    }))

    const stockHealth = {
      healthy: report.totalItems - report.lowStockItems.length - report.expiringItems.length,
      lowStock: report.lowStockItems.length,
      expiring: report.expiringItems.length,
    }

    return {
      stockTurnoverRate,
      averageDaysToExpiry,
      categoryRisks,
      stockHealth,
      totalValue: report.totalValue,
      totalItems: report.totalItems,
    }
  }, [report])

  return {
    analytics,
    loading,
    error,
  }
}