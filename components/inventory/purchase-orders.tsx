"use client"

import { useState } from "react"
import { Plus, Search, Eye, Download, MoreHorizontal, Edit, Trash2, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { usePurchaseOrders, usePurchaseOrderMutations } from "@/hooks/use-purchase-orders"
import { useAuth } from "@/contexts/auth-context"
import { usePurchaseOrderRealTime } from "@/contexts/real-time-context"
import { PurchaseOrderStatus, PurchaseOrderPriority } from "@/lib/api-unified"
import { format } from "date-fns"
import { useEffect } from "react"

export function PurchaseOrders() {
  const { user } = useAuth()
  const { purchaseOrderUpdates, broadcastPurchaseOrderUpdate } = usePurchaseOrderRealTime()
  const [searchTerm, setSearchTerm] = useState("")
  
  const {
    orders: filteredOrders,
    orderStats,
    loading,
    error,
    statusFilter,
    priorityFilter,
    supplierFilter,
    suppliers,
    handleStatusFilter,
    handlePriorityFilter,
    handleSupplierFilter,
    clearFilters,
    refetch,
  } = usePurchaseOrders(user?.outletId)

  const {
    approvePurchaseOrder,
    cancelPurchaseOrder,
    markAsDelivered,
    deletePurchaseOrder,
  } = usePurchaseOrderMutations()

  // Refresh purchase orders when real-time updates are received
  useEffect(() => {
    if (purchaseOrderUpdates.length > 0) {
      const timeoutId = setTimeout(() => {
        refetch()
      }, 1000)
      
      return () => clearTimeout(timeoutId)
    }
  }, [purchaseOrderUpdates, refetch])

  // Filter by search term
  const searchFilteredOrders = filteredOrders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleApprove = async (id: string) => {
    try {
      await approvePurchaseOrder.mutate(id)
      broadcastPurchaseOrderUpdate({
        orderId: id,
        action: 'approved',
        userId: user?.id,
      })
    } catch (error) {
      console.error('Failed to approve purchase order:', error)
    }
  }

  const handleCancel = async (id: string) => {
    try {
      await cancelPurchaseOrder.mutate(id)
      broadcastPurchaseOrderUpdate({
        orderId: id,
        action: 'cancelled',
        userId: user?.id,
      })
    } catch (error) {
      console.error('Failed to cancel purchase order:', error)
    }
  }

  const handleMarkDelivered = async (id: string) => {
    try {
      await markAsDelivered.mutate({ id })
      broadcastPurchaseOrderUpdate({
        orderId: id,
        action: 'delivered',
        userId: user?.id,
      })
    } catch (error) {
      console.error('Failed to mark as delivered:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await deletePurchaseOrder.mutate(id)
        broadcastPurchaseOrderUpdate({
          orderId: id,
          action: 'deleted',
          userId: user?.id,
        })
      } catch (error) {
        console.error('Failed to delete purchase order:', error)
      }
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
    return (
      <ErrorMessage 
        error="Failed to load purchase orders" 
        onRetry={refetch}
      />
    )
  }

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>
      case "pending":
        return <Badge variant="secondary">Pending</Badge>
      case "approved":
        return <Badge variant="default">Approved</Badge>
      case "in_transit":
        return <Badge variant="default">In Transit</Badge>
      case "delivered":
        return <Badge variant="default">Delivered</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: PurchaseOrderPriority) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>
      case "high":
        return <Badge variant="secondary">High</Badge>
      case "normal":
        return <Badge variant="outline">Normal</Badge>
      case "low":
        return <Badge variant="outline">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and supplier deliveries</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Management</CardTitle>
          <CardDescription>Track and manage all purchase orders and deliveries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, supplier, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={supplierFilter} onValueChange={handleSupplierFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Suppliers</SelectItem>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier} value={supplier}>
                    {supplier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter || priorityFilter || supplierFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {orderStats && (
            <div className="grid grid-cols-6 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{orderStats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{orderStats.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{orderStats.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{orderStats.inTransit}</div>
                <div className="text-xs text-muted-foreground">In Transit</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{orderStats.delivered}</div>
                <div className="text-xs text-muted-foreground">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{orderStats.cancelled}</div>
                <div className="text-xs text-muted-foreground">Cancelled</div>
              </div>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Expected Delivery</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchFilteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {searchTerm || statusFilter || priorityFilter || supplierFilter 
                      ? "No purchase orders match your filters" 
                      : "No purchase orders found"}
                  </TableCell>
                </TableRow>
              ) : (
                searchFilteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-semibold">{order.orderNumber}</TableCell>
                    <TableCell>{order.supplierName}</TableCell>
                    <TableCell>{format(new Date(order.orderDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      {order.expectedDeliveryDate 
                        ? format(new Date(order.expectedDeliveryDate), 'MMM dd, yyyy')
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{order.items.length} items</TableCell>
                    <TableCell className="font-semibold">Le {order.total.toLocaleString('en-SL')}</TableCell>
                    <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download PDF
                          </DropdownMenuItem>
                          {order.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleApprove(order.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Approve Order
                            </DropdownMenuItem>
                          )}
                          {order.status === 'approved' && (
                            <DropdownMenuItem onClick={() => handleMarkDelivered(order.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Mark as Delivered
                            </DropdownMenuItem>
                          )}
                          {(order.status === 'draft' || order.status === 'pending') && (
                            <DropdownMenuItem onClick={() => handleCancel(order.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Cancel Order
                            </DropdownMenuItem>
                          )}
                          {order.status === 'draft' && (
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => handleDelete(order.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Order
                            </DropdownMenuItem>
                          )}
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
    </div>
  )
}
