"use client"
import { useState } from "react"
import { Plus, MapPin, Phone, Mail, MoreHorizontal, Edit, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useOutlets } from "@/hooks/use-outlets"
import { useUsers } from "@/hooks/use-users"
import { useSystemMetrics } from "@/hooks/use-system-metrics"
import { useToast } from "@/hooks/use-toast"
import { Outlet } from "@/lib/api-unified"

export function OutletManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null)
  const [newOutlet, setNewOutlet] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    licenseNumber: '',
    managerId: '',
    operatingHours: {
      open: '09:00',
      close: '18:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    isActive: true
  })
  const { outlets, loading, error, deleteOutlet, createOutlet, updateOutlet } = useOutlets()
  const { users } = useUsers()
  const { outletPerformance } = useSystemMetrics()
  const { toast } = useToast()

  const handleDeleteOutlet = async (outletId: string) => {
    // Handle both MongoDB _id and transformed id
    const id = outletId || (outlets.find(o => (o as Outlet & { _id?: string })._id === outletId)?._id as string)
    
    if (!id) {
      toast({
        title: "Error",
        description: "No outlet ID found. Cannot delete outlet.",
        variant: "destructive",
      })
      return
    }

    if (confirm('Are you sure you want to delete this outlet?')) {
      try {
        await deleteOutlet(id)
        toast({
          title: "Success",
          description: "Outlet deleted successfully",
        })
      } catch (error) {
        console.error('Failed to delete outlet:', error)
        toast({
          title: "Error",
          description: "Failed to delete outlet",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddOutlet = async () => {
    try {
      // Extract only the fields required by CreateOutletDto
      const outletData = {
        name: newOutlet.name,
        address: newOutlet.address,
        city: newOutlet.city,
        state: newOutlet.state,
        zipCode: newOutlet.zipCode,
        phone: newOutlet.phone,
        email: newOutlet.email || undefined, // Optional field
        licenseNumber: newOutlet.licenseNumber,
        managerId: newOutlet.managerId || undefined, // Optional field
        operatingHours: newOutlet.operatingHours
      }
      
      await createOutlet(outletData)
      setIsAddDialogOpen(false)
      setNewOutlet({
        name: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
        licenseNumber: '',
        managerId: '',
        operatingHours: {
          open: '09:00',
          close: '18:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
        },
        isActive: true
      })
      toast({
        title: "Success",
        description: "Outlet created successfully",
      })
    } catch (error) {
      console.error('Failed to create outlet:', error)
      toast({
        title: "Error",
        description: "Failed to create outlet",
        variant: "destructive",
      })
    }
  }

  const handleEditOutlet = (outlet: Outlet) => {
    // Handle both MongoDB _id and transformed id
    const outletWithId = {
      ...outlet,
      id: outlet.id || (outlet as any)._id // Ensure we have an id field
    }
    setEditingOutlet(outletWithId)
    setIsEditDialogOpen(true)
  }

  const handleUpdateOutlet = async () => {
    if (!editingOutlet) return
    
    // Handle both MongoDB _id and transformed id
    const outletId = editingOutlet.id || (editingOutlet as any)._id
    
    if (!outletId) {
      toast({
        title: "Error",
        description: "No outlet ID found. Cannot update outlet.",
        variant: "destructive",
      })
      return
    }
    
    try {
      // Extract only the fields required by UpdateOutletDto (which extends Partial<CreateOutletDto>)
      const outletData = {
        name: editingOutlet.name,
        address: editingOutlet.address,
        city: editingOutlet.city,
        state: editingOutlet.state,
        zipCode: editingOutlet.zipCode,
        phone: editingOutlet.phone,
        email: editingOutlet.email || undefined,
        licenseNumber: editingOutlet.licenseNumber,
        managerId: editingOutlet.managerId || undefined,
        operatingHours: editingOutlet.operatingHours
      }
      
      await updateOutlet(outletId, outletData)
      setIsEditDialogOpen(false)
      setEditingOutlet(null)
      toast({
        title: "Success",
        description: "Outlet updated successfully",
      })
    } catch (error) {
      console.error('Failed to update outlet:', error)
      toast({
        title: "Error",
        description: "Failed to update outlet",
        variant: "destructive",
      })
    }
  }

  const getOutletManager = (outletId: string) => {
    const manager = users.find(user => user.outletId === outletId && user.role === 'manager')
    return manager ? `${manager.firstName} ${manager.lastName}` : 'No Manager Assigned'
  }

  const getOutletStaffCount = (outletId: string) => {
    return users.filter(user => user.outletId === outletId && user.isActive).length
  }

  const getOutletPerformanceData = (outletId: string) => {
    return outletPerformance.find(perf => perf.id === outletId) || {
      revenue: 0,
      performance: 0,
      status: 'average' as const
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return <ErrorMessage error={error} />
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Outlet Management</h1>
          <p className="text-muted-foreground">Manage pharmacy locations and their operations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Outlet
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Outlet</DialogTitle>
              <DialogDescription>
                Create a new pharmacy outlet location.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="name">Outlet Name *</Label>
                <Input
                  id="name"
                  value={newOutlet.name}
                  onChange={(e) => setNewOutlet({...newOutlet, name: e.target.value})}
                  placeholder="e.g., Downtown Pharmacy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number *</Label>
                <Input
                  id="licenseNumber"
                  value={newOutlet.licenseNumber}
                  onChange={(e) => setNewOutlet({...newOutlet, licenseNumber: e.target.value})}
                  placeholder="e.g., PH-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  value={newOutlet.address}
                  onChange={(e) => setNewOutlet({...newOutlet, address: e.target.value})}
                  placeholder="e.g., 123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={newOutlet.city}
                    onChange={(e) => setNewOutlet({...newOutlet, city: e.target.value})}
                    placeholder="e.g., Freetown"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={newOutlet.state}
                    onChange={(e) => setNewOutlet({...newOutlet, state: e.target.value})}
                    placeholder="e.g., Western"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">Zip Code *</Label>
                <Input
                  id="zipCode"
                  value={newOutlet.zipCode}
                  onChange={(e) => setNewOutlet({...newOutlet, zipCode: e.target.value})}
                  placeholder="e.g., 00000"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={newOutlet.phone}
                    onChange={(e) => setNewOutlet({...newOutlet, phone: e.target.value})}
                    placeholder="e.g., +232-XX-XXXXXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newOutlet.email}
                    onChange={(e) => setNewOutlet({...newOutlet, email: e.target.value})}
                    placeholder="outlet@pharmacy.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="openTime" className="text-sm">Opening Time</Label>
                    <Input
                      id="openTime"
                      type="time"
                      value={newOutlet.operatingHours.open}
                      onChange={(e) => setNewOutlet({
                        ...newOutlet, 
                        operatingHours: {...newOutlet.operatingHours, open: e.target.value}
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="closeTime" className="text-sm">Closing Time</Label>
                    <Input
                      id="closeTime"
                      type="time"
                      value={newOutlet.operatingHours.close}
                      onChange={(e) => setNewOutlet({
                        ...newOutlet, 
                        operatingHours: {...newOutlet.operatingHours, close: e.target.value}
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newOutlet.isActive}
                  onCheckedChange={(checked) => setNewOutlet({...newOutlet, isActive: checked})}
                />
                <Label htmlFor="isActive">Active Outlet</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddOutlet}>Create Outlet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {outlets.map((outlet) => {
          const outletId = outlet.id || (outlet as Outlet & { _id?: string })._id
          if (!outletId) return null // Skip if no valid ID
          
          const performanceData = getOutletPerformanceData(outletId)
          const staffCount = getOutletStaffCount(outletId)
          const manager = getOutletManager(outletId)
          
          return (
            <Card key={outletId}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{outlet.name}</CardTitle>
                      <CardDescription>Managed by {manager}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={outlet.isActive ? "default" : "secondary"}>
                      {outlet.isActive ? "active" : "inactive"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditOutlet(outlet)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Outlet
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => outletId && handleDeleteOutlet(outletId)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Outlet
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
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{outlet.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{outlet.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{outlet.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Staff</h4>
                    <div className="text-2xl font-bold">{staffCount}</div>
                    <p className="text-xs text-muted-foreground">active employees</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Monthly Revenue</h4>
                    <div className="text-2xl font-bold">${performanceData.revenue.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">current month</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Performance Score</h4>
                    <div className="text-2xl font-bold">{performanceData.performance}%</div>
                    <p className="text-xs text-muted-foreground">overall rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Edit Outlet Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Outlet</DialogTitle>
            <DialogDescription>
              Update outlet information.
            </DialogDescription>
          </DialogHeader>
          {editingOutlet && (
            <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="editName">Outlet Name *</Label>
                <Input
                  id="editName"
                  value={editingOutlet.name}
                  onChange={(e) => setEditingOutlet({...editingOutlet, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLicenseNumber">License Number *</Label>
                <Input
                  id="editLicenseNumber"
                  value={editingOutlet.licenseNumber || ''}
                  onChange={(e) => setEditingOutlet({...editingOutlet, licenseNumber: e.target.value})}
                  placeholder="e.g., PH-2024-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editAddress">Street Address *</Label>
                <Input
                  id="editAddress"
                  value={editingOutlet.address}
                  onChange={(e) => setEditingOutlet({...editingOutlet, address: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCity">City *</Label>
                  <Input
                    id="editCity"
                    value={editingOutlet.city || ''}
                    onChange={(e) => setEditingOutlet({...editingOutlet, city: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editState">State *</Label>
                  <Input
                    id="editState"
                    value={editingOutlet.state || ''}
                    onChange={(e) => setEditingOutlet({...editingOutlet, state: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editZipCode">Zip Code *</Label>
                <Input
                  id="editZipCode"
                  value={editingOutlet.zipCode || ''}
                  onChange={(e) => setEditingOutlet({...editingOutlet, zipCode: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPhone">Phone Number *</Label>
                  <Input
                    id="editPhone"
                    value={editingOutlet.phone}
                    onChange={(e) => setEditingOutlet({...editingOutlet, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editingOutlet.email || ''}
                    onChange={(e) => setEditingOutlet({...editingOutlet, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Operating Hours</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editOpenTime" className="text-sm">Opening Time</Label>
                    <Input
                      id="editOpenTime"
                      type="time"
                      value={editingOutlet.operatingHours?.open || '09:00'}
                      onChange={(e) => setEditingOutlet({
                        ...editingOutlet, 
                        operatingHours: {
                          ...editingOutlet.operatingHours,
                          open: e.target.value,
                          close: editingOutlet.operatingHours?.close || '18:00',
                          days: editingOutlet.operatingHours?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="editCloseTime" className="text-sm">Closing Time</Label>
                    <Input
                      id="editCloseTime"
                      type="time"
                      value={editingOutlet.operatingHours?.close || '18:00'}
                      onChange={(e) => setEditingOutlet({
                        ...editingOutlet, 
                        operatingHours: {
                          ...editingOutlet.operatingHours,
                          open: editingOutlet.operatingHours?.open || '09:00',
                          close: e.target.value,
                          days: editingOutlet.operatingHours?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editingOutlet.isActive}
                  onCheckedChange={(checked) => setEditingOutlet({...editingOutlet, isActive: checked})}
                />
                <Label htmlFor="editIsActive">Active Outlet</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOutlet}>Update Outlet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
