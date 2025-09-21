"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload, Package, Edit, Trash2, FileText } from "lucide-react"

interface Product {
  id: string
  name: string
  category: string
  supplier: string
  currentStock: number
  unit: string
  costPrice: number
  sellingPrice: number
  batchNumber: string
  expiryDate: string
  status: "active" | "inactive"
}

export default function ProductManagementPage() {
  const [products, setProducts] = useState<Product[]>([])

  const [isAddingProduct, setIsAddingProduct] = useState(false)
  const [isUploadingInvoice, setIsUploadingInvoice] = useState(false)
  const [adjustmentReason, setAdjustmentReason] = useState("")

  const suppliers: any[] = [
    // TODO: Fetch suppliers from API
  ]

  return (
    <LayoutWrapper role="manager">
      <Header title="Product Management" role="manager" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Product Management</h2>
            <p className="text-muted-foreground">Create products from suppliers and manage inventory</p>
          </div>
          <div className="flex space-x-2">
            <Dialog open={isUploadingInvoice} onOpenChange={setIsUploadingInvoice}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Invoice
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Supplier Invoice</DialogTitle>
                  <DialogDescription>
                    Upload invoice to automatically create products and update inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="invoice">Invoice File</Label>
                    <Input id="invoice" type="file" accept=".pdf,.jpg,.png" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" placeholder="Additional notes about this invoice" />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadingInvoice(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsUploadingInvoice(false)}>Process Invoice</Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddingProduct} onOpenChange={setIsAddingProduct}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>Create a new product from supplier information</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="productName">Product Name</Label>
                      <Input id="productName" placeholder="Enter product name" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pain-relief">Pain Relief</SelectItem>
                          <SelectItem value="antibiotics">Antibiotics</SelectItem>
                          <SelectItem value="vitamins">Vitamins</SelectItem>
                          <SelectItem value="equipment">Medical Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="supplier">Supplier</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tablets">Tablets</SelectItem>
                          <SelectItem value="capsules">Capsules</SelectItem>
                          <SelectItem value="bottles">Bottles</SelectItem>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="ml">ML</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="costPrice">Cost Price</Label>
                      <Input id="costPrice" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sellingPrice">Selling Price</Label>
                      <Input id="sellingPrice" type="number" step="0.01" placeholder="0.00" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="initialStock">Initial Stock</Label>
                      <Input id="initialStock" type="number" placeholder="0" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="batchNumber">Batch Number</Label>
                      <Input id="batchNumber" placeholder="Enter batch number" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input id="expiryDate" type="date" />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddingProduct(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsAddingProduct(false)}>Create Product</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="adjustments">Inventory Adjustments</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.category} • {product.supplier}
                          </p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm">
                              Stock: {product.currentStock} {product.unit}
                            </span>
                            <span className="text-sm">Batch: {product.batchNumber}</span>
                            <span className="text-sm">Expires: {product.expiryDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Cost: ${product.costPrice.toFixed(2)}</p>
                          <p className="font-semibold">Sell: ${product.sellingPrice.toFixed(2)}</p>
                        </div>
                        <Badge variant={product.status === "active" ? "default" : "secondary"}>{product.status}</Badge>
                        <div className="flex space-x-1">
                          <Button variant="outline" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="adjustments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Adjustments</CardTitle>
                <CardDescription>Make inventory adjustments with proper tracking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="adjustProduct">Product</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adjustType">Adjustment Type</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="increase">Stock Increase</SelectItem>
                        <SelectItem value="decrease">Stock Decrease</SelectItem>
                        <SelectItem value="damage">Damaged Goods</SelectItem>
                        <SelectItem value="expired">Expired Items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adjustQuantity">Quantity</Label>
                    <Input id="adjustQuantity" type="number" placeholder="0" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="adjustReason">Reason for Adjustment</Label>
                  <Textarea
                    id="adjustReason"
                    placeholder="Provide detailed reason for this inventory adjustment"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                  />
                </div>
                <Button>Process Adjustment</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((supplier) => (
                <Card key={supplier.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{supplier.name}</CardTitle>
                    <CardDescription>Contact: {supplier.contact}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{supplier.phone}</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <FileText className="mr-1 h-3 w-3" />
                        View Orders
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
