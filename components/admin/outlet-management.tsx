"use client"
import { Plus, MapPin, Phone, Mail, MoreHorizontal, Edit, Trash2, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useOutlets } from "@/hooks/use-outlets"
import { useUsers } from "@/hooks/use-users"
import { useSystemMetrics } from "@/hooks/use-system-metrics"

export function OutletManagement() {
  const { outlets, loading, error, deleteOutlet } = useOutlets()
  const { users } = useUsers()
  const { outletPerformance } = useSystemMetrics()

  const handleDeleteOutlet = async (outletId: string) => {
    if (confirm('Are you sure you want to delete this outlet?')) {
      try {
        await deleteOutlet(outletId)
      } catch (error) {
        console.error('Failed to delete outlet:', error)
      }
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Outlet
        </Button>
      </div>

      <div className="grid gap-6">
        {outlets.map((outlet) => {
          const performanceData = getOutletPerformanceData(outlet.id)
          const staffCount = getOutletStaffCount(outlet.id)
          const manager = getOutletManager(outlet.id)
          
          return (
            <Card key={outlet.id}>
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
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Outlet
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteOutlet(outlet.id)}
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
    </div>
  )
}
