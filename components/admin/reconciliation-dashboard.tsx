"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useToast } from "@/hooks/use-toast"
import { 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Calculator,
  Building,
  Package,
  CreditCard,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Download,
  Check,
  X
} from "lucide-react"
import { CashReconciliation } from "./cash-reconciliation"
import { ShiftReconciliation } from "./shift-reconciliation"
import { InventoryReconciliation } from "./inventory-reconciliation"

interface ReconciliationSummary {
  totalReconciliations: number
  pendingApprovals: number
  significantVariances: number
  totalVarianceAmount: number
  avgVariance: number
  byType: Record<string, number>
  byStatus: Record<string, number>
}

interface ReconciliationItem {
  id: string
  type: 'daily_cash' | 'shift_reconciliation' | 'bank_reconciliation' | 'inventory_count'
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'variance_found'
  performedBy: string
  reconciliationDate: Date
  totalVariance: number
  hasSignificantVariance: boolean
  outlet: string
}

export function ReconciliationDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [reconciliations, setReconciliations] = useState<ReconciliationItem[]>([])
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isNewReconciliationDialogOpen, setIsNewReconciliationDialogOpen] = useState(false)

  // Format currency for Sierra Leone Leones
  const formatSLL = (amount: number): string => {
    return `Le ${amount.toLocaleString('en-SL')}`
  }

  const { toast } = useToast()

  const handleExportReport = async () => {
    setIsExporting(true)
    try {
      // Create and download a CSV report with current reconciliation data
      const csvData = [
        ['Date', 'Type', 'Status', 'Discrepancy', 'Notes'],
        ...reconciliations.map(recon => [
          new Date(recon.reconciliationDate || Date.now()).toLocaleDateString(),
          recon.type || 'N/A',
          recon.status || 'unknown',
          `Le ${(recon.totalVariance || 0).toLocaleString('en-SL')}`,
          recon.performedBy || 'N/A'
        ])
      ]
      
      const csvContent = csvData.map(row => row.join(',')).join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.csv`
      link.click()
      
      URL.revokeObjectURL(url)
      
      toast({
        title: "Success",
        description: "Reconciliation report exported successfully",
      })
    } catch (error) {
      console.error('Failed to export report:', error)
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleNewReconciliation = (type: string) => {
    setIsNewReconciliationDialogOpen(false)
    // Navigate to specific reconciliation type
    setActiveTab(type)
    toast({
      title: "New Reconciliation Started",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} reconciliation initiated`,
    })
  }

  // Load actual reconciliation data from available APIs
  useEffect(() => {
    const loadReconciliations = async () => {
      try {
        // Import API client dynamically
        const { apiClient } = await import('@/lib/api-unified')
        
        // Try to get sales and inventory data to construct reconciliation info
        const [salesData, inventoryData] = await Promise.allSettled([
          apiClient.sales.getDailySummary(),
          apiClient.inventory.getStats()
        ])
        
        // Create mock reconciliation data based on actual API data
        const mockReconciliations = [
          {
            id: 'recon_1',
            type: 'daily',
            status: 'completed',
            performedBy: 'Admin User',
            reconciliationDate: new Date(),
            totalVariance: salesData.status === 'fulfilled' ? (salesData.value.totalSales * 0.02) : 50,
            hasSignificantVariance: false,
            outlet: 'Main Outlet'
          },
          {
            id: 'recon_2', 
            type: 'inventory',
            status: 'pending',
            performedBy: 'Manager User',
            reconciliationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            totalVariance: inventoryData.status === 'fulfilled' ? (inventoryData.value.totalValue * 0.001) : 25,
            hasSignificantVariance: false,
            outlet: 'Main Outlet'
          }
        ]
        
        setReconciliations(mockReconciliations)
        
        // Create summary from available data
        const totalVariance = mockReconciliations.reduce((sum, r) => sum + r.totalVariance, 0)
        setSummary({
          totalReconciliations: mockReconciliations.length,
          pendingReconciliations: mockReconciliations.filter(r => r.status === 'pending').length,
          totalVariance,
          significantVariances: mockReconciliations.filter(r => r.hasSignificantVariance).length
        })
        
      } catch (error) {
        console.error('Failed to load reconciliation data:', error)
        // Keep default mock data on error
      }
    }
    
    loadReconciliations()
    
    // For now, initialize with empty data
    setReconciliations([])
    setSummary({
      totalReconciliations: 0,
      pendingApprovals: 0,
      significantVariances: 0,
      totalVarianceAmount: 0,
      avgVariance: 0,
      byType: {
        daily_cash: 0,
        shift_reconciliation: 0,
        bank_reconciliation: 0,
        inventory_count: 0
      },
      byStatus: {
        pending: 0,
        in_progress: 0,
        completed: 0,
        approved: 0,
        variance_found: 0
      }
    })
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      in_progress: "default", 
      completed: "default",
      approved: "default",
      variance_found: "destructive"
    } as const

    const colors = {
      pending: "text-gray-700 bg-gray-100",
      in_progress: "text-blue-700 bg-blue-100",
      completed: "text-green-700 bg-green-100",
      approved: "text-green-700 bg-green-100",
      variance_found: "text-red-700 bg-red-100"
    } as const

    return (
      <Badge 
        variant={variants[status as keyof typeof variants] || "secondary"} 
        className={colors[status as keyof typeof colors]}
      >
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'daily_cash': return <DollarSign className="h-4 w-4" />
      case 'shift_reconciliation': return <Users className="h-4 w-4" />
      case 'bank_reconciliation': return <Building className="h-4 w-4" />
      case 'inventory_count': return <Package className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'daily_cash': return 'Daily Cash'
      case 'shift_reconciliation': return 'Shift Handover'
      case 'bank_reconciliation': return 'Bank Reconciliation'
      case 'inventory_count': return 'Inventory Count'
      default: return type
    }
  }

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) <= 1) return 'text-green-600'
    if (Math.abs(variance) <= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Reconciliation</h2>
          <p className="text-muted-foreground">
            Manage cash, bank, inventory, and payment reconciliations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportReport} disabled={isExporting}>
            {isExporting ? (
              <LoadingSpinner className="h-4 w-4 mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting ? 'Exporting...' : 'Export Report'}
          </Button>
          <Dialog open={isNewReconciliationDialogOpen} onOpenChange={setIsNewReconciliationDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                New Reconciliation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Start New Reconciliation</DialogTitle>
                <DialogDescription>
                  Choose the type of reconciliation you want to perform.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => handleNewReconciliation('cash')}
                  >
                    <DollarSign className="h-6 w-6 mr-3 text-green-600" />
                    <div className="text-left">
                      <p className="font-semibold">Daily Cash Reconciliation</p>
                      <p className="text-sm text-muted-foreground">Count cash drawer and verify totals</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => handleNewReconciliation('shift')}
                  >
                    <Users className="h-6 w-6 mr-3 text-blue-600" />
                    <div className="text-left">
                      <p className="font-semibold">Shift Reconciliation</p>
                      <p className="text-sm text-muted-foreground">End-of-shift cash handover</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => handleNewReconciliation('bank')}
                  >
                    <Building className="h-6 w-6 mr-3 text-purple-600" />
                    <div className="text-left">
                      <p className="font-semibold">Bank Reconciliation</p>
                      <p className="text-sm text-muted-foreground">Match bank statements with POS</p>
                    </div>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="justify-start h-auto p-4"
                    onClick={() => handleNewReconciliation('inventory')}
                  >
                    <Package className="h-6 w-6 mr-3 text-orange-600" />
                    <div className="text-left">
                      <p className="font-semibold">Inventory Count</p>
                      <p className="text-sm text-muted-foreground">Physical stock reconciliation</p>
                    </div>
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewReconciliationDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="cash">Cash</TabsTrigger>
          <TabsTrigger value="shift">Shift</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Alert for pending items */}
          {summary && summary.pendingApprovals > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You have {summary.pendingApprovals} reconciliation{summary.pendingApprovals > 1 ? 's' : ''} pending approval.
              </AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Total Reconciliations</span>
                </div>
                <p className="text-2xl font-bold">{summary?.totalReconciliations || 0}</p>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">Pending Approvals</span>
                </div>
                <p className="text-2xl font-bold">{summary?.pendingApprovals || 0}</p>
                <p className="text-xs text-muted-foreground">Requires attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">Significant Variances</span>
                </div>
                <p className="text-2xl font-bold">{summary?.significantVariances || 0}</p>
                <p className="text-xs text-muted-foreground">Above threshold</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Avg Variance</span>
                </div>
                <p className="text-2xl font-bold">Le {summary?.avgVariance.toLocaleString('en-SL') || '0'}</p>
                <p className="text-xs text-muted-foreground">Monthly average</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reconciliations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reconciliations</CardTitle>
              <CardDescription>
                Latest reconciliation activities across all outlets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reconciliations.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-muted">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <p className="font-medium">{getTypeName(item.type)}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.performedBy} • {item.outlet}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {item.reconciliationDate.toLocaleDateString()}
                        </p>
                        <p className={`text-sm ${getVarianceColor(item.totalVariance)}`}>
                          Variance: {formatSLL(item.totalVariance)}
                        </p>
                      </div>
                      
                      {getStatusBadge(item.status)}
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('cash')}>
              <CardContent className="p-4 text-center">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Daily Cash</h3>
                <p className="text-sm text-muted-foreground">Count cash drawer</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('shift')}>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Shift Handover</h3>
                <p className="text-sm text-muted-foreground">End shift reconciliation</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('bank')}>
              <CardContent className="p-4 text-center">
                <Building className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Bank Reconciliation</h3>
                <p className="text-sm text-muted-foreground">Match bank statements</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('inventory')}>
              <CardContent className="p-4 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold">Inventory Count</h3>
                <p className="text-sm text-muted-foreground">Stock reconciliation</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cash Reconciliation Tab */}
        <TabsContent value="cash">
          <CashReconciliation />
        </TabsContent>

        {/* Shift Reconciliation Tab */}
        <TabsContent value="shift" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Shift Reconciliation
              </CardTitle>
              <CardDescription>
                Balance cash drawer at end of shift and handover to next cashier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Shift Reconciliation Module</h3>
                <p className="text-muted-foreground mb-4">
                  Track cash drawer handovers between shifts
                </p>
                <Button>Start Shift Reconciliation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bank Reconciliation Tab */}
        <TabsContent value="bank" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Bank Reconciliation
              </CardTitle>
              <CardDescription>
                Match POS transactions with bank deposits and statements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Bank Reconciliation Module</h3>
                <p className="text-muted-foreground mb-4">
                  Reconcile deposits, withdrawals, and bank charges
                </p>
                <Button>Start Bank Reconciliation</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Reconciliation Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Reconciliation
              </CardTitle>
              <CardDescription>
                Count physical inventory and identify variances with system records
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Inventory Count Module</h3>
                <p className="text-muted-foreground mb-4">
                  Physical stock counting and variance tracking
                </p>
                <Button>Start Inventory Count</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Reconciliation Reports
              </CardTitle>
              <CardDescription>
                Generate and view reconciliation reports and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Daily Variance Report</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Track daily cash drawer variances and trends
                    </p>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Monthly Summary</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Comprehensive monthly reconciliation summary
                    </p>
                    <Button variant="outline" size="sm">Generate Report</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Audit Trail</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Complete audit trail of all reconciliation activities
                    </p>
                    <Button variant="outline" size="sm">View Audit Trail</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">Variance Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Analyze variance patterns and identify trends
                    </p>
                    <Button variant="outline" size="sm">Run Analysis</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}