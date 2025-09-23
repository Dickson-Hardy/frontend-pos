"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Search, Upload, Edit, Trash2, RefreshCw, Package, AlertTriangle, DollarSign, Calendar } from "lucide-react"
import { useProductMutations } from "@/hooks/use-products"
import { useToast } from "@/hooks/use-toast"
import { apiClient, Product, CreateProductDto, PackVariant } from "@/lib/api-unified"
import { useAuth } from "@/contexts/auth-context"

// Form state interface for the UI
interface ProductFormState {
  name: string
  description: string
  category: string
  manufacturer: string
  barcode: string
  price: number | undefined
  cost: number | undefined
  minStockLevel: number | undefined // This represents initial stock quantity
  unit: string
  requiresPrescription: boolean
  isActive: boolean
  expiryDate: string
  outletId: string
  allowUnitSale: boolean
  // New fields for pack-based products
  packSize: number
  genericName: string
  strength: string
  form: string
  brandName: string
  // Remove old pack variants system
  // packVariants: PackVariant[]
}

export function ProductManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [newProduct, setNewProduct] = useState<ProductFormState>({
    name: '',
    description: '',
    category: '',
    manufacturer: '',
    barcode: '',
    price: undefined as any,
    cost: undefined as any,
    minStockLevel: undefined as any, // Initial stock quantity - user can input
    unit: '',
    requiresPrescription: false,
    isActive: true,
    expiryDate: '',
    outletId: '',
    allowUnitSale: true,
    // New pack-based fields
    packSize: 1,
    genericName: '',
    strength: '',
    form: '',
    brandName: '',
  })

  const { createProduct, updateProduct, deleteProduct } = useProductMutations()
  const { toast } = useToast()

  // Local fetch of products
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const items = await apiClient.products.getAll(user?.outletId || undefined)
      setProducts(items)
    } catch (e) {
      console.error('Failed to fetch products', e)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [user?.outletId])

  // Pack-based product validation
  const validatePackProduct = () => {
    const errors: string[] = []
    
    if (!newProduct.genericName?.trim()) {
      errors.push("Generic name is required")
    }
    
    if (!newProduct.strength?.trim()) {
      errors.push("Strength is required")
    }
    
    if (!newProduct.form?.trim()) {
      errors.push("Form is required")
    }
    
    if (newProduct.packSize < 1) {
      errors.push("Pack size must be at least 1")
    }
    
    return errors
  }

  // Pack-based product editing functions (simplified)
  // handleEditProduct function is defined later in the file

  // ...existing state and dialog handlers...

  const handleAddProduct = async () => {
    try {
      // Validate pack-based product before submission
      const validationErrors = validatePackProduct()
      
      if (validationErrors.length > 0) {
        toast({ 
          title: "Validation Error", 
          description: validationErrors.join('; '), 
          variant: "destructive" 
        })
        return
      }

      // Ensure outletId defaults to current outlet if not set
      const outletId = newProduct.outletId || user?.outletId || ''
      
      // Generate product name with pack size
      const genericName = newProduct.genericName?.trim() || newProduct.name?.trim() || ''
      const strength = newProduct.strength?.trim() || ''
      const form = newProduct.form?.trim() || ''
      const brandName = newProduct.brandName?.trim() || ''
      const packSize = newProduct.packSize || 1
      
      // Create product name following the convention: "GenericName Strength – BrandName – Pack of X Form"
      const productName = `${genericName} ${strength}${brandName ? ` – ${brandName}` : ''} – Pack of ${packSize} ${form || newProduct.unit || 'units'}`
      
      // Generate SKU with pack size: "GENERIC-STRENGTH-PACKSIZE"
      const skuBase = `${genericName.toUpperCase().replace(/[^A-Z0-9]+/g, '')}-${strength.replace(/[^A-Z0-9]+/g, '')}`
      const generatedSku = `${skuBase}-${packSize}`
      
      // Generate or normalize required backend fields
      const strengthFromName = strength || (() => {
        const m = productName.match(/(\d+\s?(mg|ml|g))/i)
        return m ? m[0] : '1 unit'
      })()
      
      // Map frontend category to backend enum
      const normalizeCategory = (cat?: string) => {
        if (!cat) return 'otc'
        const map: Record<string, string> = {
          'prescription': 'prescription',
          'otc': 'otc',
          'vitamins': 'vitamins',
          'medical-devices': 'medical_equipment',
          'medical_devices': 'medical_equipment',
          'medical_equipment': 'medical_equipment',
          'personal-care': 'personal_care',
          'personal care': 'personal_care',
          'personal_care': 'personal_care',
          'first-aid': 'first_aid',
          'first aid': 'first_aid',
          'first_aid': 'first_aid',
        }
        const key = cat.toLowerCase()
        return (map[key] || 'otc')
      }
      
      // Map frontend unit to backend enum
      const normalizeUnitOfMeasure = (unit?: string) => {
        if (!unit) return 'pieces'
        const map: Record<string, string> = {
          'tablets': 'tablets',
          'capsules': 'capsules',
          'ml': 'ml',
          'bottles': 'bottles',
          'boxes': 'boxes',
          'pieces': 'pieces',
        }
        const key = unit.toLowerCase()
        return (map[key] || 'pieces')
      }

      // Build payload with exact backend DTO structure
      const payload = {
        name: productName,
        sku: generatedSku,
        barcode: newProduct.barcode || '',
        description: newProduct.description || 'No description provided',
        category: normalizeCategory(newProduct.category),
        manufacturer: newProduct.manufacturer || '',
        genericName: genericName,
        strength: strengthFromName,
        unitOfMeasure: normalizeUnitOfMeasure(newProduct.unit),
        costPrice: newProduct.cost ?? 0,
        sellingPrice: newProduct.price ?? 0,
        stockQuantity: newProduct.minStockLevel || 0,
        reorderLevel: Math.max(newProduct.minStockLevel || 0, 10),
        maxStockLevel: Math.max((newProduct.minStockLevel || 0) + 100, 100),
        requiresPrescription: !!newProduct.requiresPrescription,
        outletId: outletId,
        allowUnitSale: newProduct.allowUnitSale !== false,
        // Remove pack variants - each pack size is now a separate product
        // packVariants: [],
      }

      await createProduct.mutate(payload as any)
      setIsAddDialogOpen(false)
      setNewProduct({
        name: '',
        description: '',
        category: '',
        manufacturer: '',
        barcode: '',
        price: undefined as any,
        cost: undefined as any,
        minStockLevel: undefined as any, // Initial stock quantity - user can input
        unit: '',
        requiresPrescription: false,
        isActive: true,
        expiryDate: '',
        outletId: '',
        allowUnitSale: true,
        // Reset new pack-based fields
        packSize: 1,
        genericName: '',
        strength: '',
        form: '',
        brandName: '',
      })
      toast({ title: "Success", description: "Product created successfully" })
      fetchProducts()
    } catch (error: any) {
      console.error('Failed to create product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      })
    }
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return
    try {
      await updateProduct.mutate(editingProduct.id, editingProduct)
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      toast({ title: "Success", description: "Product updated successfully" })
      fetchProducts()
    } catch (error: any) {
      console.error('Failed to update product:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      })
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct.mutate(productId)
        toast({ title: "Success", description: "Product deleted successfully" })
        fetchProducts()
      } catch (error: any) {
        console.error('Failed to delete product:', error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete product",
          variant: "destructive",
        })
      }
    }
  }

  const handleUploadInvoice = async () => {
    setIsUploadDialogOpen(false)
    toast({
      title: "Feature Coming Soon",
      description: "Invoice upload functionality will be available soon",
    })
  }

  // Use locally fetched products
  const sourceProducts: Product[] = products

  const filteredProducts = sourceProducts.filter((product: Product) => {
    const term = searchTerm.trim().toLowerCase()
    const includes = (v?: string) => (v ? v.toLowerCase().includes(term) : false)
    const matchesSearch = term === '' ||
      includes(product.name) ||
      includes(product.category) ||
      includes(product.manufacturer) ||
      includes((product as any).barcode)

    if (!matchesSearch) return false

    if (activeTab === 'low-stock') return (product.stockQuantity || (product as any).currentStock || 0) <= (product.reorderLevel || product.minStockLevel || 0)
    if (activeTab === 'expired') return !!(product as any).expiryDate && new Date((product as any).expiryDate) < new Date()
    if (activeTab === 'inactive') return !product.isActive
    // 'all'
    return true
  })

  const getStockStatus = (product: Product) => {
    const currentStock = product.stockQuantity || (product as any).currentStock || 0
    const minLevel = product.reorderLevel || product.minStockLevel || 0
    
    if (currentStock === 0) return { label: 'Out of Stock', variant: 'destructive' as const }
    if (currentStock <= minLevel) return { label: 'Low Stock', variant: 'secondary' as const }
    return { label: 'In Stock', variant: 'default' as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading products..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchProducts} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchProducts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload Invoice
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Invoice</DialogTitle>
                <DialogDescription>
                  Upload product invoice to automatically add products to inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice">Select Invoice File</Label>
                  <Input id="invoice" type="file" accept=".pdf,.csv,.xlsx" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Populate from suppliers API */}
                      <SelectItem value="medplus-pharma">MedPlus Pharmaceuticals</SelectItem>
                      <SelectItem value="wellness-corp">Wellness Corporation</SelectItem>
                      <SelectItem value="health-first">Health First Supplies</SelectItem>
                      <SelectItem value="pharma-direct">Pharma Direct Ltd</SelectItem>
                      <SelectItem value="medical-solutions">Medical Solutions Inc</SelectItem>
                      <SelectItem value="generic-meds">Generic Medicines Co</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUploadInvoice}>Upload & Process</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open)
            if (open) {
              setNewProduct(prev => ({ ...prev, outletId: prev.outletId || user?.outletId || '' }))
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-rose-600 hover:bg-rose-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
                <DialogDescription>
                  Add a new product to your pharmacy inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="genericName">Generic Name *</Label>
                    <Input
                      id="genericName"
                      value={newProduct.genericName}
                      onChange={(e) => setNewProduct({...newProduct, genericName: e.target.value})}
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="strength">Strength *</Label>
                    <Input
                      id="strength"
                      value={newProduct.strength}
                      onChange={(e) => setNewProduct({...newProduct, strength: e.target.value})}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="form">Form *</Label>
                    <Select value={newProduct.form} onValueChange={(value) => setNewProduct({...newProduct, form: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablets">Tablets</SelectItem>
                        <SelectItem value="capsules">Capsules</SelectItem>
                        <SelectItem value="syrup">Syrup</SelectItem>
                        <SelectItem value="injection">Injection</SelectItem>
                        <SelectItem value="cream">Cream</SelectItem>
                        <SelectItem value="drops">Drops</SelectItem>
                        <SelectItem value="powder">Powder</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="brandName">Brand Name</Label>
                    <Input
                      id="brandName"
                      value={newProduct.brandName}
                      onChange={(e) => setNewProduct({...newProduct, brandName: e.target.value})}
                      placeholder="e.g., BrandX (optional)"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="packSize">Pack Size *</Label>
                    <Input
                      id="packSize"
                      type="number"
                      min="1"
                      value={newProduct.packSize}
                      onChange={(e) => setNewProduct({...newProduct, packSize: parseInt(e.target.value) || 1})}
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barcode">Barcode</Label>
                    <Input
                      id="barcode"
                      value={newProduct.barcode}
                      onChange={(e) => setNewProduct({...newProduct, barcode: e.target.value})}
                      placeholder="Product barcode"
                    />
                  </div>
                </div>
                <div className="space-y-2">
              <Label htmlFor="outlet">Outlet *</Label>
              <Input id="outlet" value={newProduct.outletId || user?.outletId || ''} onChange={(e) => setNewProduct({ ...newProduct, outletId: e.target.value })} placeholder="Outlet ID" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    placeholder="Product description"
                  />
                </div>
                
                {/* Product Preview */}
                {(newProduct.genericName || newProduct.strength || newProduct.packSize > 1) && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-sm font-medium text-blue-700 mb-2">Product Preview:</div>
                    <div className="text-sm text-blue-600">
                      <div className="font-medium">
                        {newProduct.genericName || 'Generic Name'} {newProduct.strength || 'Strength'}
                        {newProduct.brandName ? ` – ${newProduct.brandName}` : ''}
                        {newProduct.packSize > 1 ? ` – Pack of ${newProduct.packSize} ${newProduct.form || 'units'}` : ''}
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        SKU: {newProduct.genericName ? `${newProduct.genericName.toUpperCase().replace(/[^A-Z0-9]+/g, '')}-${newProduct.strength?.replace(/[^A-Z0-9]+/g, '') || 'STRENGTH'}-${newProduct.packSize}` : 'Generated on save'}
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prescription">Prescription</SelectItem>
                        <SelectItem value="otc">OTC</SelectItem>
                        <SelectItem value="vitamins">Vitamins</SelectItem>
                        <SelectItem value="medical_equipment">Medical Equipment</SelectItem>
                        <SelectItem value="personal_care">Personal Care</SelectItem>
                        <SelectItem value="first_aid">First Aid</SelectItem>
                        <SelectItem value="pain_relief">Pain Relief</SelectItem>
                        <SelectItem value="antibiotics">Antibiotics</SelectItem>
                        <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                        <SelectItem value="diabetes">Diabetes</SelectItem>
                        <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                        <SelectItem value="respiratory">Respiratory</SelectItem>
                        <SelectItem value="mental_health">Mental Health</SelectItem>
                        <SelectItem value="dermatology">Dermatology</SelectItem>
                        <SelectItem value="supplements">Supplements</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={newProduct.manufacturer}
                      onChange={(e) => setNewProduct({...newProduct, manufacturer: e.target.value})}
                      placeholder="Manufacturer name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (Le) *</Label>
                    <Input
                      id="price"
                      type="number"
                      min="1"
                      max="1500"
                      step="0.01"
                      value={newProduct.price || ''}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value ? parseFloat(e.target.value) : undefined})}
                      placeholder="1.00 - 1500.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price (Le)</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      min="1"
                      max="1500"
                      step="0.01"
                      value={newProduct.cost || ''}
                      onChange={(e) => setNewProduct({...newProduct, cost: e.target.value ? parseFloat(e.target.value) : undefined})}
                      placeholder="1.00 - 1500.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newProduct.unit} onValueChange={(value) => setNewProduct({...newProduct, unit: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tablets">Tablets</SelectItem>
                        <SelectItem value="capsules">Capsules</SelectItem>
                        <SelectItem value="ml">Milliliters</SelectItem>
                        <SelectItem value="bottles">Bottles</SelectItem>
                        <SelectItem value="boxes">Boxes</SelectItem>
                        <SelectItem value="pieces">Pieces</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStockLevel">Quantity in Stock</Label>
                    <Input
                      id="minStockLevel"
                      type="number"
                      min={0}
                      value={newProduct.minStockLevel?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value ? parseInt(value) : undefined;
                        setNewProduct(prev => ({...prev, minStockLevel: numValue}));
                      }}
                      placeholder="Enter quantity"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="date"
                      value={newProduct.expiryDate}
                      onChange={(e) => setNewProduct({...newProduct, expiryDate: e.target.value})}
                    />
                  </div>
                </div>
                
                {/* Pack-based Product Info */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-700 mb-2">📦 Pack-Based Product System</div>
                  <div className="text-xs text-green-600 space-y-1">
                    <div>• Each pack size is created as a separate product</div>
                    <div>• Product name includes pack size: "Amoxicillin 500mg – Pack of 10 tablets"</div>
                    <div>• SKU includes pack size: "AMOX500-10"</div>
                    <div>• Clear identification at POS for cashiers</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="allowUnitSale"
                      checked={newProduct.allowUnitSale}
                      onCheckedChange={(checked) => setNewProduct({...newProduct, allowUnitSale: checked})}
                    />
                    <Label htmlFor="allowUnitSale">Allow Individual Unit Sales</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="prescription"
                      checked={newProduct.requiresPrescription}
                      onCheckedChange={(checked) => setNewProduct({...newProduct, requiresPrescription: checked})}
                    />
                    <Label htmlFor="prescription">Requires Prescription</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={newProduct.isActive}
                      onCheckedChange={(checked) => setNewProduct({...newProduct, isActive: checked})}
                    />
                    <Label htmlFor="active">Active Product</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddProduct} disabled={createProduct.loading}>
                  {createProduct.loading ? 'Creating...' : 'Create Product'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Product Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Products</span>
            </div>
            <p className="text-2xl font-bold">{sourceProducts.length}</p>
            <p className="text-xs text-muted-foreground">All products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Low Stock</span>
            </div>
            <p className="text-2xl font-bold">
              {sourceProducts.filter((p: Product) => (p.stockQuantity || (p as any).currentStock || 0) <= (p.reorderLevel || p.minStockLevel || 0)).length}
            </p>
            <p className="text-xs text-muted-foreground">Need reorder</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium">Expiring Soon</span>
            </div>
            <p className="text-2xl font-bold">
              {sourceProducts.filter((p: Product) => (p as any).expiryDate && new Date((p as any).expiryDate) < new Date(Date.now() + 30*24*60*60*1000)).length}
            </p>
            <p className="text-xs text-muted-foreground">Next 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Value</span>
            </div>
            <p className="text-2xl font-bold">
              Le {sourceProducts.reduce((sum: number, p: Product) => sum + ((p.stockQuantity || (p as any).currentStock || 0) * (p.sellingPrice || p.price || 0)), 0).toLocaleString('en-SL')}
            </p>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Products Catalog</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Products ({sourceProducts.length})</TabsTrigger>
              <TabsTrigger value="low-stock">
                Low Stock ({sourceProducts.filter((p: Product) => (p.stockQuantity || (p as any).currentStock || 0) <= (p.reorderLevel || p.minStockLevel || 0)).length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expiring ({sourceProducts.filter((p: Product) => (p as any).expiryDate && new Date((p as any).expiryDate) < new Date(Date.now() + 30*24*60*60*1000)).length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({sourceProducts.filter((p: Product) => !p.isActive).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Stock Info</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {searchTerm ? "No products found matching your search" : "No products available"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product: Product) => {
                        const stockStatus = getStockStatus(product)
                        return (
                          <TableRow key={product.id || `${product.name}-${(product as any).sku || (product as any).barcode || Math.random()}`}>
                            <TableCell className="font-medium">
                              <div>
                                <p>{product.name || "N/A"}</p>
                                {product.requiresPrescription && (
                                  <Badge variant="outline" className="text-xs">Rx</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{product.category || "N/A"}</TableCell>
                            <TableCell>{product.manufacturer || "N/A"}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <p className="text-sm">{product.stockQuantity || (product as any).currentStock || 0} {product.unitOfMeasure || product.unit || 'units'}</p>
                                <Badge variant={stockStatus.variant} className="text-xs">
                                  {stockStatus.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>Le {(product.sellingPrice || product.price || 0).toLocaleString('en-SL')}</TableCell>
                            <TableCell>
                              <Badge variant={product.isActive ? "default" : "secondary"}>
                                {product.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleEditProduct(product)}>
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information.
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">Product Name *</Label>
                  <Input
                    id="editName"
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editBarcode">Barcode</Label>
                  <Input
                    id="editBarcode"
                    value={(editingProduct as any).barcode || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, barcode: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDescription">Description *</Label>
                <Textarea
                  id="editDescription"
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCategory">Category *</Label>
                  <Select value={editingProduct.category} onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="otc">OTC</SelectItem>
                      <SelectItem value="vitamins">Vitamins</SelectItem>
                      <SelectItem value="medical_equipment">Medical Equipment</SelectItem>
                      <SelectItem value="personal_care">Personal Care</SelectItem>
                      <SelectItem value="first_aid">First Aid</SelectItem>
                      <SelectItem value="pain_relief">Pain Relief</SelectItem>
                      <SelectItem value="antibiotics">Antibiotics</SelectItem>
                      <SelectItem value="cardiovascular">Cardiovascular</SelectItem>
                      <SelectItem value="diabetes">Diabetes</SelectItem>
                      <SelectItem value="gastrointestinal">Gastrointestinal</SelectItem>
                      <SelectItem value="respiratory">Respiratory</SelectItem>
                      <SelectItem value="mental_health">Mental Health</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="supplements">Supplements</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editManufacturer">Manufacturer</Label>
                  <Input
                    id="editManufacturer"
                    value={editingProduct.manufacturer || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, manufacturer: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPrice">Selling Price (Le) *</Label>
                  <Input
                    id="editPrice"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({...editingProduct, price: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editCostPrice">Cost Price (Le)</Label>
                  <Input
                    id="editCostPrice"
                    type="number"
                    value={(editingProduct as any).cost || 0}
                    onChange={(e) => setEditingProduct({...editingProduct, cost: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editUnit">Unit</Label>
                  <Select value={editingProduct.unit || ''} onValueChange={(value) => setEditingProduct({...editingProduct, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tablets">Tablets</SelectItem>
                      <SelectItem value="capsules">Capsules</SelectItem>
                      <SelectItem value="ml">Milliliters</SelectItem>
                      <SelectItem value="bottles">Bottles</SelectItem>
                      <SelectItem value="boxes">Boxes</SelectItem>
                      <SelectItem value="pieces">Pieces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editMinStockLevel">Min Stock Level</Label>
                  <Input
                    id="editMinStockLevel"
                    type="number"
                    value={editingProduct.minStockLevel || 0}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value ? parseInt(value) : undefined;
                      setEditingProduct({...editingProduct, minStockLevel: numValue});
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editExpiryDate">Expiry Date</Label>
                  <Input
                    id="editExpiryDate"
                    type="date"
                    value={(editingProduct as any).expiryDate || ''}
                    onChange={(e) => setEditingProduct({...editingProduct, expiryDate: e.target.value})}
                  />
                </div>
              </div>
              
              {/* Pack-based Product Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-700 mb-2">📦 Pack-Based Product System</div>
                <div className="text-xs text-green-600 space-y-1">
                  <div>• This product uses the new pack-based naming convention</div>
                  <div>• Each pack size is a separate product</div>
                  <div>• To create different pack sizes, create new products</div>
                  <div>• Product name includes pack size for clear identification</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editAllowUnitSale"
                    checked={(editingProduct as any).allowUnitSale !== false}
                    onCheckedChange={(checked) => setEditingProduct({...editingProduct, allowUnitSale: checked})}
                  />
                  <Label htmlFor="editAllowUnitSale">Allow Individual Unit Sales</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editPrescription"
                    checked={editingProduct.requiresPrescription || false}
                    onCheckedChange={(checked) => setEditingProduct({...editingProduct, requiresPrescription: checked})}
                  />
                  <Label htmlFor="editPrescription">Requires Prescription</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editActive"
                    checked={editingProduct.isActive}
                    onCheckedChange={(checked) => setEditingProduct({...editingProduct, isActive: checked})}
                  />
                  <Label htmlFor="editActive">Active Product</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={updateProduct.loading}>
              {updateProduct.loading ? 'Updating...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ProductManagement