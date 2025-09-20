"use client"

import React, { useState } from "react"
import { Plus, Search, Phone, Mail, MapPin, Star, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useSuppliers } from "@/hooks/use-suppliers"

export function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // Fetch suppliers data
  const { 
    suppliers: filteredSuppliers, 
    supplierStats,
    loading, 
    error,
    handleSearch,
    refetch
  } = useSuppliers()

  // Update search when searchTerm changes
  React.useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm, handleSearch])

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < Math.floor(rating) ? "fill-primary text-primary" : "text-muted-foreground"}`}
      />
    ))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Suppliers</h1>
            <p className="text-muted-foreground">Manage your pharmaceutical suppliers and vendor relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold">Suppliers</h1>
            <p className="text-muted-foreground">Manage your pharmaceutical suppliers and vendor relationships</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        </div>
        <ErrorMessage 
          error="Failed to load suppliers" 
          onRetry={refetch} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your pharmaceutical suppliers and vendor relationships</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Directory</CardTitle>
          <CardDescription>Complete list of pharmaceutical suppliers and vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suppliers by name, contact person, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6">
            {filteredSuppliers.map((supplier) => (
              <Card key={supplier.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{supplier.name}</CardTitle>
                      <CardDescription>Contact: {supplier.contactPerson}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={supplier.status === "active" ? "default" : "secondary"}>{supplier.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Supplier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Supplier
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Contact Information</h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{supplier.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{supplier.phone}</span>
                        </div>
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{supplier.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Rating</h4>
                      <div className="flex items-center space-x-2">
                        <div className="flex">{renderStars(supplier.rating)}</div>
                        <span className="text-sm font-semibold">{supplier.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Products Supplied</h4>
                      <div className="text-2xl font-bold">{supplier.productsSupplied}</div>
                      <p className="text-xs text-muted-foreground">active products</p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Last Order</h4>
                      <div className="text-sm">{supplier.lastOrder}</div>
                      <p className="text-xs text-muted-foreground">Payment: {supplier.paymentTerms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
