"use client"

import React, { useState } from "react"
import { Calendar, AlertTriangle, Package, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useInventoryBatches, useExpiryAlerts } from "@/hooks/use-inventory"
import { useAuth } from "@/contexts/auth-context"

export function BatchTracking() {
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()
  
  // Fetch batch data and expiry alerts
  const { 
    batches: allBatches, 
    batchStats,
    loading: batchesLoading, 
    error: batchesError,
    refetch: refetchBatches
  } = useInventoryBatches(user?.outletId)
  
  const {
    alerts,
    expiredCount,
    expiringSoonCount,
    loading: alertsLoading,
    error: alertsError,
    refetch: refetchAlerts
  } = useExpiryAlerts(user?.outletId)

  const loading = batchesLoading || alertsLoading
  const error = batchesError || alertsError

  // Filter batches based on search term
  const filteredBatches = allBatches?.filter(
    (batch) =>
      batch.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (batch.supplierName && batch.supplierName.toLowerCase().includes(searchTerm.toLowerCase())),
  ) || []

  const getStatusBadge = (batch: any) => {
    const now = new Date()
    const expiryDate = new Date(batch.expiryDate)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)

    if (expiryDate < now) {
      return <Badge variant="destructive">Expired</Badge>
    }
    if (expiryDate < sixMonthsFromNow) {
      return <Badge variant="secondary">Expiring Soon</Badge>
    }
    if (batch.status === 'sold_out' || (batch.quantity - batch.soldQuantity) === 0) {
      return <Badge variant="outline">Sold Out</Badge>
    }
    return <Badge variant="default">Active</Badge>
  }

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const sixMonthsFromNow = new Date()
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6)
    return expiry < sixMonthsFromNow && expiry > new Date()
  }

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date()
  }

  // Get expired and expiring batches from alerts
  const expiredBatches = alerts?.filter(alert => alert.type === 'expired') || []
  const expiringBatches = alerts?.filter(alert => alert.type === 'expiring_soon') || []

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Batch Tracking</h1>
          <p className="text-muted-foreground">Monitor product batches, expiry dates, and traceability</p>
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Batch Tracking</h1>
          <p className="text-muted-foreground">Monitor product batches, expiry dates, and traceability</p>
        </div>
        <ErrorMessage 
          error="Failed to load batch tracking data" 
          onRetry={() => {
            refetchBatches()
            refetchAlerts()
          }} 
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">Batch Tracking</h1>
        <p className="text-muted-foreground">Monitor product batches, expiry dates, and traceability</p>
      </div>

      {/* Expiry Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <span>Expired Batches</span>
            </CardTitle>
            <CardDescription>Batches that have passed their expiry date</CardDescription>
          </CardHeader>
          <CardContent>
            {expiredBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expired batches</p>
            ) : (
              <div className="space-y-2">
                {expiredBatches.map((alert) => (
                  <div key={alert.id} className="p-2 border border-destructive/20 rounded">
                    <p className="font-semibold text-sm">{alert.batch.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Batch: {alert.batch.batchNumber} | Expired: {new Date(alert.batch.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-secondary">
              <Calendar className="h-5 w-5" />
              <span>Expiring Soon</span>
            </CardTitle>
            <CardDescription>Batches expiring within 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {expiringBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">No batches expiring soon</p>
            ) : (
              <div className="space-y-2">
                {expiringBatches.map((alert) => (
                  <div key={alert.id} className="p-2 border border-secondary/20 rounded">
                    <p className="font-semibold text-sm">{alert.batch.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Batch: {alert.batch.batchNumber} | Expires: {new Date(alert.batch.expiryDate).toLocaleDateString()}
                      {alert.daysToExpiry && ` (${alert.daysToExpiry} days)`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Batch Details */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>Complete batch information and traceability records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name, batch number, or supplier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Batch Number</TableHead>
                <TableHead>Manufacturing Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => {
                const remainingQuantity = batch.quantity - batch.soldQuantity
                return (
                  <TableRow key={batch.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{batch.product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                    <TableCell>{new Date(batch.manufacturingDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{new Date(batch.expiryDate).toLocaleDateString()}</span>
                        {isExpired(batch.expiryDate.toString()) && <AlertTriangle className="h-4 w-4 text-destructive" />}
                        {isExpiringSoon(batch.expiryDate.toString()) && !isExpired(batch.expiryDate.toString()) && (
                          <AlertTriangle className="h-4 w-4 text-secondary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{batch.quantity}</TableCell>
                    <TableCell>
                      <span className={remainingQuantity === 0 ? "text-destructive font-semibold" : ""}>
                        {remainingQuantity}
                      </span>
                    </TableCell>
                    <TableCell>{batch.supplierName || 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(batch)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
