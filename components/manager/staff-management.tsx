"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Search, Edit, Trash2, UserCheck, UserX, MoreHorizontal } from "lucide-react"
import { useUsers } from "@/hooks/use-users"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { UserRole } from "@/lib/api-unified"

export function StaffManagement() {
  const { user } = useAuth()
  const { users, loading, error, deleteUser, createUser, updateUser } = useUsers()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [newUser, setNewUser] = useState<{
    firstName: string
    lastName: string
    email: string
    password: string
    role: UserRole | ''
    outletId: string
    isActive: boolean
  }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    outletId: user?.outletId || '',
    isActive: true
  })

  // Filter staff for current outlet and exclude admin users
  const filteredStaff = users.filter((staffUser) => {
    const matchesSearch = 
      `${staffUser.firstName} ${staffUser.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staffUser.role.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Show staff from current outlet only (unless user is admin)
    const matchesOutlet = user?.role === 'admin' || staffUser.outletId === user?.outletId
    
    // Exclude admin users from staff management
    const isStaff = staffUser.role !== 'admin'
    
    return matchesSearch && matchesOutlet && isStaff
  })

  const handleAddStaff = async () => {
    try {
      if (!newUser.role) {
        toast({
          title: "Error",
          description: "Please select a role for the staff member",
          variant: "destructive",
        })
        return
      }

      const staffData = {
        ...newUser,
        role: newUser.role as UserRole
      }

      await createUser(staffData)
      setIsAddDialogOpen(false)
      setNewUser({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: '',
        outletId: user?.outletId || '',
        isActive: true
      })
      toast({
        title: "Success",
        description: "Staff member added successfully",
      })
    } catch (error) {
      console.error('Failed to add staff:', error)
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      })
    }
  }

  const handleEditStaff = (staff: any) => {
    setEditingUser({
      ...staff,
      password: '' // Don't pre-fill password
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateStaff = async () => {
    if (!editingUser) return
    
    try {
      // Only include password if it's been changed
      const updateData = { ...editingUser }
      if (!updateData.password) {
        delete updateData.password
      }

      await updateUser(editingUser.id, updateData)
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast({
        title: "Success",
        description: "Staff member updated successfully",
      })
    } catch (error) {
      console.error('Failed to update staff:', error)
      toast({
        title: "Error",
        description: "Failed to update staff member",
        variant: "destructive",
      })
    }
  }

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to remove ${staffName} from staff?`)) {
      try {
        await deleteUser(staffId)
        toast({
          title: "Success",
          description: "Staff member removed successfully",
        })
      } catch (error) {
        console.error('Failed to delete staff:', error)
        toast({
          title: "Error",
          description: "Failed to remove staff member",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleStatus = async (staff: any) => {
    try {
      await updateUser(staff.id, { ...staff, isActive: !staff.isActive })
      toast({
        title: "Success",
        description: `Staff member ${staff.isActive ? 'deactivated' : 'activated'} successfully`,
      })
    } catch (error) {
      console.error('Failed to update staff status:', error)
      toast({
        title: "Error",
        description: "Failed to update staff status",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'manager': return 'default'
      case 'inventory_manager': return 'secondary'
      case 'cashier': return 'outline'
      default: return 'outline'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Loading staff..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
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
        <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-rose-600 hover:bg-rose-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new staff account for the pharmacy system.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Enter user password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as UserRole | ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={newUser.isActive}
                  onCheckedChange={(checked) => setNewUser({...newUser, isActive: checked})}
                />
                <Label htmlFor="isActive">Active User</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddStaff}>Add Staff Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Staff Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredStaff.length}</p>
              <p className="text-sm text-muted-foreground">Total Staff</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredStaff.filter(s => s.isActive).length}</p>
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredStaff.filter(s => s.role === 'manager').length}</p>
              <p className="text-sm text-muted-foreground">Managers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{filteredStaff.filter(s => s.role === 'cashier').length}</p>
              <p className="text-sm text-muted-foreground">Cashiers</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No staff found matching your search" : "No staff members found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="font-medium">
                      {staff.firstName} {staff.lastName}
                    </TableCell>
                    <TableCell>{staff.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeColor(staff.role)}>
                        {staff.role.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={staff.isActive ? "default" : "secondary"}>
                        {staff.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(staff)}>
                            {staff.isActive ? (
                              <>
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteStaff(staff.id, `${staff.firstName} ${staff.lastName}`)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Staff Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update staff member information.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser({...editingUser, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser({...editingUser, lastName: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPassword">Password (leave blank to keep current)</Label>
                <Input
                  id="editPassword"
                  type="password"
                  value={editingUser.password}
                  onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                  placeholder="Enter new password or leave blank"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select value={editingUser.role} onValueChange={(value) => setEditingUser({...editingUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editingUser.isActive}
                  onCheckedChange={(checked) => setEditingUser({...editingUser, isActive: checked})}
                />
                <Label htmlFor="editIsActive">Active User</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStaff}>Update Staff Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StaffManagement