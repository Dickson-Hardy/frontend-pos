"use client"

import { useState } from "react"
import { Search, UserPlus, User, Phone, MapPin, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  totalPurchases?: number
  lastVisit?: string
  notes?: string
}

interface CustomerManagementMobileProps {
  selectedCustomer: Customer | null
  onSelectCustomer: (customer: Customer | null) => void
}

export function CustomerManagementMobile({
  selectedCustomer,
  onSelectCustomer,
}: CustomerManagementMobileProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddCustomer, setShowAddCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  })

  // Mock customer data - replace with actual API call
  const customers: Customer[] = [
    {
      id: "1",
      name: "John Doe",
      phone: "+232 78 123 456",
      email: "john@example.com",
      address: "123 Main St, Freetown",
      totalPurchases: 850000,
      lastVisit: "2024-01-15",
    },
    {
      id: "2",
      name: "Jane Smith",
      phone: "+232 76 987 654",
      email: "jane@example.com",
      address: "456 Oak Ave, Bo",
      totalPurchases: 650000,
      lastVisit: "2024-01-14",
    },
    {
      id: "3",
      name: "Mohamed Kamara",
      phone: "+232 77 555 123",
      address: "789 Pine St, Kenema",
      totalPurchases: 1200000,
      lastVisit: "2024-01-16",
    },
  ]

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddCustomer = () => {
    if (newCustomer.name.trim()) {
      const customer: Customer = {
        id: Date.now().toString(),
        ...newCustomer,
      }
      // Add customer to database here
      console.log("Adding customer:", customer)
      setNewCustomer({ name: "", phone: "", email: "", address: "", notes: "" })
      setShowAddCustomer(false)
    }
  }

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer)
  }

  const handleRemoveCustomer = () => {
    onSelectCustomer(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customer</h2>
        <Dialog open={showAddCustomer} onOpenChange={setShowAddCustomer}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="+232 XX XXX XXX"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  placeholder="Customer address"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer} disabled={!newCustomer.name.trim()}>
                  Add Customer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Selected Customer */}
      {selectedCustomer && (
        <Card className="border-primary">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <User className="h-4 w-4" />
                  <span className="font-medium text-sm">{selectedCustomer.name}</span>
                  <Badge variant="secondary" className="text-xs">Selected</Badge>
                </div>
                {selectedCustomer.phone && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                    <Phone className="h-3 w-3" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground mb-1">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{selectedCustomer.address}</span>
                  </div>
                )}
                {selectedCustomer.totalPurchases && (
                  <div className="text-xs text-muted-foreground">
                    Total purchases: Le {selectedCustomer.totalPurchases.toLocaleString('en-SL')}
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleRemoveCustomer} className="text-destructive">
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Search */}
      {!selectedCustomer && (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Customer List */}
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {filteredCustomers.length === 0 ? (
                <Card>
                  <CardContent className="p-4 text-center">
                    <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      {searchTerm ? "No customers found" : "No customers available"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredCustomers.map((customer) => (
                  <Card 
                    key={customer.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSelectCustomer(customer)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{customer.name}</span>
                          {customer.lastVisit && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(customer.lastVisit).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        
                        {customer.phone && (
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        
                        {customer.address && (
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                        
                        {customer.totalPurchases && (
                          <div className="text-xs text-muted-foreground">
                            Total purchases: Le {customer.totalPurchases.toLocaleString('en-SL')}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Walk-in Customer Option */}
      {!selectedCustomer && (
        <Button 
          variant="outline" 
          className="w-full h-12" 
          onClick={() => handleSelectCustomer({ id: 'walk-in', name: 'Walk-in Customer' })}
        >
          <User className="mr-2 h-4 w-4" />
          Walk-in Customer
        </Button>
      )}
    </div>
  )
}