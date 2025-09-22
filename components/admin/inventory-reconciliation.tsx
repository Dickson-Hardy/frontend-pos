"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Calendar,
  Barcode,
  Eye,
  FileText,
  Save,
  Send,
  RefreshCw,
  Filter,
  Download,
  Upload,
  Calculator,
  Clock,
  ShoppingCart,
  Activity,
  Target,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-unified"

interface Product {
  id: string
  name: string
  description?: string
  barcode?: string
  price: number
  cost: number
  unit: string
  category: string
  manufacturer?: string
  requiresPrescription: boolean
  isActive: boolean
  minStockLevel?: number
  expiryDate?: string
  outletId: string
  packVariants?: any[]
  allowUnitSale: boolean
  createdAt: Date
  updatedAt: Date
}

interface StockRecord {
  id: string
  productId: string
  product: Product
  systemQuantity: number
  physicalCount: number | null
  variance: number
  varianceValue: number
  lastUpdated: Date
  countedBy?: string
  countedAt?: Date
  notes?: string
  reasons: VarianceReason[]
}

interface VarianceReason {
  type: 'damaged' | 'expired' | 'theft' | 'miscount' | 'system_error' | 'supplier_shortage' | 'customer_return' | 'transfer' | 'other'
  quantity: number
  description: string
  value: number
}

interface InventoryReconciliation {
  id?: string
  date: Date
  type: 'full' | 'cycle' | 'spot' | 'category'
  status: 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected'
  outlet: string
  initiatedBy: string
  totalProducts: number
  countedProducts: number
  productsWithVariance: number
  totalVarianceValue: number
  stockRecords: StockRecord[]
  inventoryItems: any[]
  variance: number
  shrinkageAnalysis: {
    totalShrinkage: number
    shrinkagePercentage: number
    categories: Array<{
      category: string
      shrinkage: number
      percentage: number
    }>
    reasons: Array<{
      reason: string
      quantity: number
      value: number
      percentage: number
    }>
  }
  completedAt?: Date
  approvedBy?: string
  notes: string
}

const VARIANCE_REASON_TYPES = [
  { value: 'damaged', label: 'Damaged Products', icon: AlertTriangle },
  { value: 'expired', label: 'Expired Products', icon: Calendar },
  { value: 'theft', label: 'Theft/Shrinkage', icon: TrendingDown },
  { value: 'miscount', label: 'Counting Error', icon: Calculator },
  { value: 'system_error', label: 'System Error', icon: Zap },
  { value: 'supplier_shortage', label: 'Supplier Shortage', icon: TrendingDown },
  { value: 'customer_return', label: 'Customer Return', icon: RefreshCw },
  { value: 'transfer', label: 'Store Transfer', icon: Package },
  { value: 'other', label: 'Other Reason', icon: FileText }
]

const PRODUCT_CATEGORIES = [
  'Prescription Medicines',
  'Over-the-Counter',
  'Pain Relief',
  'Antibiotics',
  'Cardiovascular',
  'Diabetes Care',
  'Respiratory',
  'Vitamins & Supplements',
  'Personal Care',
  'Medical Equipment'
]

export function InventoryReconciliation() {
  const [reconciliation, setReconciliation] = useState<InventoryReconciliation | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<StockRecord | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterVariance, setFilterVariance] = useState<'all' | 'positive' | 'negative' | 'zero'>('all')
  const [newVarianceReason, setNewVarianceReason] = useState('')
  const [newVarianceQuantity, setNewVarianceQuantity] = useState('')
  const [newVarianceDescription, setNewVarianceDescription] = useState('')
  const { toast } = useToast()

  // Format currency for Sierra Leone Leones
  const formatSLL = useCallback((amount: number): string => {
    return `Le ${amount.toLocaleString('en-SL')}`
  }, [])

  // Load actual inventory data from API
  const loadInventoryData = useCallback(async () => {
    setIsLoading(true)
    try {
      // Use API client directly
      
      // Fetch actual products from inventory
      try {
        const inventoryStats = await apiClient.inventory.getStats()
        const inventoryItems = await apiClient.inventory.getItems()
        
        if (inventoryItems.length === 0) {
          toast({
            title: "No Inventory Items",
            description: "No inventory items found. Please add products to your inventory first.",
            variant: "destructive",
          })
          return
        }
        
        // Create products from inventory items
        const products: Product[] = inventoryItems.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description,
          barcode: item.barcode,
          price: item.sellingPrice || 0,
          cost: item.costPrice || 0,
          unit: item.unitOfMeasure || 'piece',
          category: item.category,
          manufacturer: item.manufacturer,
          requiresPrescription: item.requiresPrescription || false,
          isActive: item.isActive || true,
          minStockLevel: item.reorderLevel,
          expiryDate: item.expiryDate,
          outletId: item.outletId,
          allowUnitSale: item.allowUnitSale || true,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
        
        // Create stock records based on real inventory data
        const stockRecords: StockRecord[] = products.map(product => {
          const inventoryItem = inventoryItems.find(item => item.id === product.id)!
          return {
            id: `stock_${product.id}`,
            productId: product.id,
            product: product,
            systemQuantity: inventoryItem.stockQuantity ?? 0,
            physicalCount: null, // To be filled during counting
            variance: 0,
            varianceValue: 0,
            lastUpdated: new Date(),
            reasons: []
          }
        })
        
        const newReconciliation: InventoryReconciliation = {
          id: 'inv_recon_' + Date.now(),
          date: new Date(),
          type: 'cycle',
          status: 'in_progress',
          outlet: 'Main Pharmacy',
          initiatedBy: 'Current User',
          totalProducts: stockRecords.length,
          countedProducts: 0,
          productsWithVariance: 0,
          totalVarianceValue: 0,
          stockRecords: stockRecords,
          inventoryItems: inventoryItems,
          variance: 0,
          shrinkageAnalysis: {
            totalShrinkage: 0,
            shrinkagePercentage: 0,
            categories: [],
            reasons: []
          },
          notes: ''
        }

        setReconciliation(newReconciliation)
        
        toast({
          title: "Inventory Data Loaded",
          description: "Ready to begin inventory reconciliation",
        })
      } catch (inventoryError) {
        console.error('Failed to fetch inventory data:', inventoryError)
        toast({
          title: "Error Loading Inventory",
          description: "Failed to load inventory data. Please check your connection and try again.",
          variant: "destructive",
        })
        throw inventoryError // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error in loadInventoryData:', error)
      toast({
        title: "Error",
        description: "Failed to load inventory data. Please ensure the backend is running and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Update physical count for a product
  const updatePhysicalCount = useCallback((productId: string, count: number) => {
    if (!reconciliation) return

    setReconciliation(prev => {
      if (!prev) return prev

      const updatedRecords = prev.stockRecords.map(record => {
        if (record.productId === productId) {
          const variance = count - record.systemQuantity
          const varianceValue = variance * record.product.price
          
          return {
            ...record,
            physicalCount: count,
            variance,
            varianceValue,
            countedAt: new Date(),
            countedBy: 'Current User'
          }
        }
        return record
      })

      const countedProducts = updatedRecords.filter(r => r.countedAt).length
      const productsWithVariance = updatedRecords.filter(r => r.variance !== 0).length
      const totalVarianceValue = updatedRecords.reduce((sum, r) => sum + r.varianceValue, 0)

      return {
        ...prev,
        stockRecords: updatedRecords,
        countedProducts,
        productsWithVariance,
        totalVarianceValue
      }
    })
  }, [reconciliation])

  // Add variance reason
  const addVarianceReason = useCallback((productId: string) => {
    if (!newVarianceReason || !newVarianceQuantity || !reconciliation) return

    const quantity = parseInt(newVarianceQuantity)
    const product = reconciliation.stockRecords.find(r => r.productId === productId)?.product
    if (!product) return

    const value = quantity * product.price

    const reason: VarianceReason = {
      type: newVarianceReason as any,
      quantity,
      description: newVarianceDescription,
      value
    }

    setReconciliation(prev => {
      if (!prev) return prev

      const updatedRecords = prev.stockRecords.map(record => {
        if (record.productId === productId) {
          return {
            ...record,
            reasons: [...record.reasons, reason]
          }
        }
        return record
      })

      return {
        ...prev,
        stockRecords: updatedRecords
      }
    })

    setNewVarianceReason('')
    setNewVarianceQuantity('')
    setNewVarianceDescription('')

    toast({
      title: "Variance Reason Added",
      description: "Reason has been recorded for the variance",
    })
  }, [newVarianceReason, newVarianceQuantity, newVarianceDescription, reconciliation, toast])

  // Complete reconciliation
  const completeReconciliation = useCallback(async () => {
    if (!reconciliation) return

    setIsLoading(true)
    try {
      // Complete inventory reconciliation via API using API client
      await apiClient.reconciliation.completeInventory({
        reconciliationId: reconciliation.id,
        inventoryItems: reconciliation.stockRecords,
        variance: reconciliation.totalVarianceValue
      })

      setReconciliation(prev => prev ? {
        ...prev,
        status: 'completed',
        completedAt: new Date()
      } : null)

      setActiveTab('summary')
      
      toast({
        title: "Reconciliation Completed",
        description: "Inventory reconciliation has been completed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete reconciliation",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [reconciliation, toast])

  // Filter products based on search and category
  const filteredProducts = useCallback(() => {
    if (!reconciliation) return []

    let filtered = reconciliation.stockRecords

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(record => record.product.category === selectedCategory)
    }

    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.product.barcode && record.product.barcode.includes(searchTerm))
      )
    }

    if (filterVariance !== 'all') {
      filtered = filtered.filter(record => {
        if (filterVariance === 'positive') return record.variance > 0
        if (filterVariance === 'negative') return record.variance < 0
        if (filterVariance === 'zero') return record.variance === 0
        return true
      })
    }

    return filtered
  }, [reconciliation, selectedCategory, searchTerm, filterVariance])

  const getVarianceColor = (variance: number) => {
    if (variance === 0) return 'text-gray-600'
    return variance > 0 ? 'text-green-600' : 'text-red-600'
  }

  const getVarianceIcon = (variance: number) => {
    if (variance === 0) return <CheckCircle className="h-4 w-4 text-gray-600" />
    return variance > 0 ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />
  }

  useEffect(() => {
    loadInventoryData()
  }, [loadInventoryData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory Reconciliation</h2>
          <p className="text-muted-foreground">
            Stock variance tracking and shrinkage analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          {reconciliation && (
            <>
              <Badge variant="outline" className="gap-1">
                <Package className="h-3 w-3" />
                {reconciliation.type.charAt(0).toUpperCase() + reconciliation.type.slice(1)} Count
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Activity className="h-3 w-3" />
                {reconciliation.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </>
          )}
        </div>
      </div>

      {/* Progress Alert */}
      {reconciliation && reconciliation.status === 'in_progress' && (
        <Alert>
          <Target className="h-4 w-4" />
          <AlertTitle>Reconciliation in Progress</AlertTitle>
          <AlertDescription>
            {reconciliation.countedProducts} of {reconciliation.totalProducts} products counted. 
            {reconciliation.productsWithVariance > 0 && ` ${reconciliation.productsWithVariance} products have variances.`}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="count" disabled={!reconciliation}>Product Count</TabsTrigger>
          <TabsTrigger value="variances" disabled={!reconciliation}>Variances</TabsTrigger>
          <TabsTrigger value="shrinkage" disabled={!reconciliation}>Shrinkage Analysis</TabsTrigger>
          <TabsTrigger value="summary" disabled={!reconciliation || reconciliation.status !== 'completed'}>
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {reconciliation && reconciliation.stockRecords.length > 0 ? (
            <>
              {/* Reconciliation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Reconciliation Progress
                  </CardTitle>
                  <CardDescription>
                    Started on {reconciliation.date.toLocaleDateString()} by {reconciliation.initiatedBy}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-blue-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-900">
                        {reconciliation.totalProducts}
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-600">Counted</p>
                      <p className="text-2xl font-bold text-green-900">
                        {reconciliation.countedProducts}
                      </p>
                    </div>
                    
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-orange-600">With Variance</p>
                      <p className="text-2xl font-bold text-orange-900">
                        {reconciliation.productsWithVariance}
                      </p>
                    </div>
                    
                    <div className="bg-red-50 p-4 rounded-lg text-center">
                      <TrendingDown className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-red-600">Total Variance</p>
                      <p className="text-2xl font-bold text-red-900">
                        {formatSLL(Math.abs(reconciliation.totalVarianceValue))}
                      </p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(reconciliation.countedProducts / reconciliation.totalProducts) * 100}%` 
                      }}
                    />
                  </div>
                  <p className="text-sm text-center text-muted-foreground">
                    {Math.round((reconciliation.countedProducts / reconciliation.totalProducts) * 100)}% Complete
                  </p>

                  <Button onClick={() => setActiveTab('count')} className="w-full" size="lg">
                    <Calculator className="h-4 w-4 mr-2" />
                    Continue Counting
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Shrinkage Rate</span>
                    </div>
                    <p className="text-2xl font-bold">{reconciliation.shrinkageAnalysis.shrinkagePercentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSLL(reconciliation.shrinkageAnalysis.totalShrinkage)} total shrinkage
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Last Count</span>
                    </div>
                    <p className="text-2xl font-bold">7 days ago</p>
                    <p className="text-xs text-muted-foreground">Weekly cycle count</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Accuracy Rate</span>
                    </div>
                    <p className="text-2xl font-bold">94.2%</p>
                    <p className="text-xs text-muted-foreground">Above target (90%)</p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : reconciliation && reconciliation.stockRecords.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Inventory Items</h3>
                <p className="text-muted-foreground mb-4">
                  No inventory items found for reconciliation. Please add products to your inventory first.
                </p>
                <Button onClick={() => window.location.href = '/admin/inventory'} variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Reconciliation</h3>
                <p className="text-muted-foreground mb-4">
                  Start a new inventory reconciliation to begin stock counting
                </p>
                <Button onClick={loadInventoryData} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Package className="h-4 w-4 mr-2" />
                      Start New Reconciliation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Product Count Tab */}
        <TabsContent value="count" className="space-y-4">
          {reconciliation && (
            <>
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Product Search & Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Search Products</Label>
                      <Input
                        placeholder="Name, barcode, or batch..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {PRODUCT_CATEGORIES.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Variance Filter</Label>
                      <Select value={filterVariance} onValueChange={setFilterVariance as any}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Products</SelectItem>
                          <SelectItem value="positive">Positive Variance</SelectItem>
                          <SelectItem value="negative">Negative Variance</SelectItem>
                          <SelectItem value="zero">No Variance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>&nbsp;</Label>
                      <Button variant="outline" className="w-full">
                        <Filter className="h-4 w-4 mr-2" />
                        Advanced
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Product List */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Count ({filteredProducts().length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {filteredProducts().map((record) => (
                        <div key={record.productId} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div>
                                  <h4 className="font-medium">{record.product.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {record.product.category} • {record.product.manufacturer || 'Unknown'}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                    <span>Barcode: {record.product.barcode || 'N/A'}</span>
                                    <span>Unit: {record.product.unit}</span>
                                    {record.product.expiryDate && <span>Expires: {new Date(record.product.expiryDate).toLocaleDateString()}</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">System</p>
                                <p className="font-semibold">{record.systemQuantity}</p>
                              </div>
                              
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Physical</p>
                                <Input
                                  type="number"
                                  min="0"
                                  value={record.physicalCount ?? ''}
                                  onChange={(e) => updatePhysicalCount(
                                    record.productId, 
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="w-20 text-center"
                                />
                              </div>
                              
                              <div className="text-center">
                                <p className="text-sm text-muted-foreground">Variance</p>
                                <div className="flex items-center gap-1">
                                  {getVarianceIcon(record.variance)}
                                  <span className={`font-semibold ${getVarianceColor(record.variance)}`}>
                                    {record.variance > 0 ? '+' : ''}{record.variance}
                                  </span>
                                </div>
                                <p className={`text-xs ${getVarianceColor(record.variance)}`}>
                                  {formatSLL(record.varianceValue)}
                                </p>
                              </div>
                              
                              {record.variance !== 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedProduct(record)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Button onClick={completeReconciliation} disabled={isLoading} className="w-full">
                {isLoading ? 'Completing...' : 'Complete Reconciliation'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Variances Tab */}
        <TabsContent value="variances" className="space-y-4">
          {reconciliation && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Products with Variances
                </CardTitle>
                <CardDescription>
                  Review and explain inventory variances
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reconciliation.stockRecords
                    .filter(record => record.variance !== 0)
                    .map((record) => (
                    <div key={record.productId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium">{record.product.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            System: {record.systemQuantity} | Physical: {record.physicalCount} | 
                            Variance: <span className={getVarianceColor(record.variance)}>
                              {record.variance > 0 ? '+' : ''}{record.variance}
                            </span>
                          </p>
                        </div>
                        <Badge variant={record.variance > 0 ? 'default' : 'destructive'}>
                          {formatSLL(record.varianceValue)}
                        </Badge>
                      </div>
                      
                      {record.reasons.length > 0 && (
                        <div className="space-y-2 mb-3">
                          <h5 className="text-sm font-medium">Variance Reasons:</h5>
                          {record.reasons.map((reason, index) => (
                            <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded">
                              <span>
                                {VARIANCE_REASON_TYPES.find(t => t.value === reason.type)?.label}: 
                                {reason.description}
                              </span>
                              <span>Qty: {reason.quantity} | {formatSLL(reason.value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedProduct(record)}
                      >
                        Add Variance Reason
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Shrinkage Analysis Tab */}
        <TabsContent value="shrinkage" className="space-y-4">
          {reconciliation && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5" />
                    Shrinkage Analysis
                  </CardTitle>
                  <CardDescription>
                    Detailed analysis of inventory shrinkage and reasons
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Shrinkage by Category</h4>
                      <div className="space-y-2">
                        {reconciliation.shrinkageAnalysis.categories.map((cat, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{cat.category}</span>
                            <div className="text-right">
                              <span className="font-medium">{formatSLL(cat.shrinkage)}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({cat.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Shrinkage by Reason</h4>
                      <div className="space-y-2">
                        {reconciliation.shrinkageAnalysis.reasons.map((reason, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{reason.reason}</span>
                            <div className="text-right">
                              <span className="font-medium">{formatSLL(reason.value)}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                ({reason.percentage}%)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-center">
                      <h4 className="font-semibold text-red-900 mb-1">Total Shrinkage</h4>
                      <p className="text-3xl font-bold text-red-900">
                        {formatSLL(reconciliation.shrinkageAnalysis.totalShrinkage)}
                      </p>
                      <p className="text-sm text-red-700">
                        {reconciliation.shrinkageAnalysis.shrinkagePercentage}% of total inventory value
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary" className="space-y-4">
          {reconciliation && reconciliation.status === 'completed' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Reconciliation Summary
                </CardTitle>
                <CardDescription>
                  Completed on {reconciliation.completedAt?.toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-blue-600">Products Counted</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {reconciliation.countedProducts}/{reconciliation.totalProducts}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-orange-600">With Variances</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {reconciliation.productsWithVariance}
                    </p>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-red-600">Total Shrinkage</p>
                    <p className="text-2xl font-bold text-red-900">
                      {formatSLL(reconciliation.shrinkageAnalysis.totalShrinkage)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-600">Accuracy Rate</p>
                    <p className="text-2xl font-bold text-green-900">
                      {((reconciliation.totalProducts - reconciliation.productsWithVariance) / reconciliation.totalProducts * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Submit for Approval
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Variance Reason Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Variance Reason</DialogTitle>
            <DialogDescription>
              Explain the variance for {selectedProduct?.product.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason Type</Label>
              <Select value={newVarianceReason} onValueChange={setNewVarianceReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason type" />
                </SelectTrigger>
                <SelectContent>
                  {VARIANCE_REASON_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={newVarianceQuantity}
                onChange={(e) => setNewVarianceQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newVarianceDescription}
                onChange={(e) => setNewVarianceDescription(e.target.value)}
                placeholder="Describe the reason for this variance..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setSelectedProduct(null)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => selectedProduct && addVarianceReason(selectedProduct.productId)} 
                disabled={!newVarianceReason || !newVarianceQuantity}
                className="flex-1"
              >
                Add Reason
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}