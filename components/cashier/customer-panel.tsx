"use client"

import { useState } from "react"
import { User, Search, Plus, UserCheck, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/contexts/auth-context"

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  loyaltyNumber?: string
  discountLevel?: number
  totalPurchases?: number
}

interface CustomerPanelProps {
  selectedCustomer: Customer | null
  onCustomerSelect: (customer: Customer | null) => void
}

export function CustomerPanel({ selectedCustomer, onCustomerSelect }: CustomerPanelProps) {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([
    // Mock data - in real app this would come from API
    { id: '1', name: 'John Doe', phone: '+232 76 123456', email: 'john@example.com', loyaltyNumber: 'LOY001', discountLevel: 5, totalPurchases: 2500 },
    { id: '2', name: 'Jane Smith', phone: '+232 76 789012', email: 'jane@example.com', loyaltyNumber: 'LOY002', discountLevel: 10, totalPurchases: 5000 },
    { id: '3', name: 'Bob Wilson', phone: '+232 76 345678', email: 'bob@example.com', loyaltyNumber: 'LOY003', discountLevel: 0, totalPurchases: 500 },
  ])
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    loyaltyNumber: '',
  })

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.loyaltyNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddCustomer = () => {
    if (!newCustomer.name) return

    const customer: Customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      phone: newCustomer.phone || undefined,
      email: newCustomer.email || undefined,
      loyaltyNumber: newCustomer.loyaltyNumber || undefined,
      discountLevel: 0,
      totalPurchases: 0,
    }

    setCustomers([...customers, customer])
    onCustomerSelect(customer)
    setNewCustomer({ name: '', phone: '', email: '', loyaltyNumber: '' })
    setIsAddingCustomer(false)
    setIsSearchOpen(false)
  }

  const handleSelectCustomer = (customer: Customer) => {
    onCustomerSelect(customer)
    setIsSearchOpen(false)
    setSearchTerm("")
  }

  const getLoyaltyBadgeColor = (discountLevel?: number) => {
    if (!discountLevel || discountLevel === 0) return "secondary"
    if (discountLevel < 5) return "default"
    if (discountLevel < 10) return "secondary"
    return "default"
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Customer</span>
          </div>
          {selectedCustomer && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onCustomerSelect(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedCustomer ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">{selectedCustomer.name}</h4>
                <div className="text-sm text-muted-foreground">
                  {selectedCustomer.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedCustomer.phone}
                    </div>
                  )}
                  {selectedCustomer.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedCustomer.email}
                    </div>
                  )}
                </div>
              </div>
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
            
            {selectedCustomer.loyaltyNumber && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Loyalty #:</span>
                <Badge variant="outline">{selectedCustomer.loyaltyNumber}</Badge>
              </div>
            )}
            
            {selectedCustomer.discountLevel && selectedCustomer.discountLevel > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Discount:</span>
                <Badge variant={getLoyaltyBadgeColor(selectedCustomer.discountLevel)}>
                  {selectedCustomer.discountLevel}%
                </Badge>
              </div>
            )}
            
            {selectedCustomer.totalPurchases && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Purchases:</span>
                <span className="text-sm font-medium">
                  Le {selectedCustomer.totalPurchases.toLocaleString('en-SL')}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No customer selected</p>
            <p className="text-xs">Walk-in customer</p>
          </div>
        )}

        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {selectedCustomer ? 'Change Customer' : 'Select Customer'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Select Customer</DialogTitle>
              <DialogDescription>
                Search for an existing customer or add a new one.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, or loyalty number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <Button
                      key={customer.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => handleSelectCustomer(customer)}
                    >
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.phone} • {customer.loyaltyNumber}
                          {customer.discountLevel && customer.discountLevel > 0 && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {customer.discountLevel}% discount
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))
                ) : searchTerm ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No customers found</p>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Start typing to search customers</p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                {!isAddingCustomer ? (
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsAddingCustomer(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="customerName">Name *</Label>
                        <Input
                          id="customerName"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Phone</Label>
                        <Input
                          id="customerPhone"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                          placeholder="+232 76 123456"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="customerEmail">Email</Label>
                        <Input
                          id="customerEmail"
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="loyaltyNumber">Loyalty Number</Label>
                        <Input
                          id="loyaltyNumber"
                          value={newCustomer.loyaltyNumber}
                          onChange={(e) => setNewCustomer({...newCustomer, loyaltyNumber: e.target.value})}
                          placeholder="LOY001"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddingCustomer(false)} 
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddCustomer} 
                        disabled={!newCustomer.name}
                        className="flex-1"
                      >
                        Add Customer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}