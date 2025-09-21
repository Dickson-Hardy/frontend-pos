"use client"

import { useState } from "react"
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuditLogs } from "@/hooks/use-audit-logs"
import { useToast } from "@/hooks/use-toast"

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [filters, setFilters] = useState({
    severity: '',
    dateFrom: '',
    dateTo: '',
    action: '',
    outlet: ''
  })
  const [isExporting, setIsExporting] = useState(false)
  const { auditLogs, loading, error } = useAuditLogs()

  const filteredLogs = auditLogs.filter(
    (log) =>
      (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.outlet.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filters.severity === '' || log.severity === filters.severity) &&
      (filters.action === '' || log.action.toLowerCase().includes(filters.action.toLowerCase())) &&
      (filters.outlet === '' || log.outlet.toLowerCase().includes(filters.outlet.toLowerCase()))
  )

  const { toast } = useToast()

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Get current audit logs data
      const auditData = auditLogs
      
      if (!auditData || auditData.length === 0) {
        throw new Error('No audit log data to export')
      }
      
      // Create CSV content
      const csvHeaders = ['Timestamp', 'User', 'Action', 'Details', 'Outlet', 'Severity', 'IP Address']
      const csvContent = [
        csvHeaders.join(','),
        ...auditData.map(log => [
          `"${log.timestamp}"`,
          `"${log.user}"`,
          `"${log.action}"`,
          `"${log.details}"`,
          `"${log.outlet}"`,
          `"${log.severity}"`,
          `"${log.ipAddress}"`
        ].join(','))
      ].join('\n')
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      toast({
        title: "Success",
        description: "Audit logs exported successfully",
      })
    } catch (error) {
      console.error('Failed to export audit logs:', error)
      toast({
        title: "Error",
        description: "Failed to export audit logs",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const applyFilters = () => {
    setIsFilterDialogOpen(false)
    toast({
      title: "Filters Applied",
      description: `Showing ${filteredLogs.length} filtered results`,
    })
  }

  const clearFilters = () => {
    setFilters({
      severity: '',
      dateFrom: '',
      dateTo: '',
      action: '',
      outlet: ''
    })
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

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-secondary" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-primary" />
      default:
        return <Eye className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "error":
        return <Badge variant="destructive">{severity}</Badge>
      case "warning":
        return <Badge variant="secondary">{severity}</Badge>
      case "info":
        return <Badge variant="default">{severity}</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and user actions</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Filter Audit Logs</DialogTitle>
                <DialogDescription>
                  Apply filters to narrow down the audit log results.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters({...filters, severity: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="All severities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-severities">All severities</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">Action</Label>
                  <Input
                    id="action"
                    value={filters.action}
                    onChange={(e) => setFilters({...filters, action: e.target.value})}
                    placeholder="Filter by action type"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outlet">Outlet</Label>
                  <Input
                    id="outlet"
                    value={filters.outlet}
                    onChange={(e) => setFilters({...filters, outlet: e.target.value})}
                    placeholder="Filter by outlet"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Date From</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Date To</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={applyFilters}>Apply Filters</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Activity Log</CardTitle>
          <CardDescription>Comprehensive record of all system activities and user actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by user, action, or details..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-mono text-sm">{log.timestamp}</TableCell>
                  <TableCell className="font-semibold">{log.user}</TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="max-w-xs truncate" title={log.details}>
                    {log.details}
                  </TableCell>
                  <TableCell>{log.outlet}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getSeverityIcon(log.severity)}
                      {getSeverityBadge(log.severity)}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
