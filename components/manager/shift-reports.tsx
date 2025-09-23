"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, Banknote, Users, Download, Eye, FileText, TrendingUp, TrendingDown, Calendar, Filter } from "lucide-react"
import { formatSLL } from "@/lib/currency-utils"
import { apiClient, Shift } from "@/lib/api-unified"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"


interface Expense {
  id: string
  shiftId: string
  amount: number
  description: string
  category: 'operational' | 'maintenance' | 'supplies' | 'other'
  addedBy?: string
  receiptNumber?: string
  notes?: string
  createdAt: string
}

interface ShiftStats {
  activeShifts: number
  todaysSales: number
  totalExpenses: number
  netAmount: number
  totalTransactions: number
  avgTransaction: number
}

export function ShiftReports() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [shifts, setShifts] = useState<Shift[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [stats, setStats] = useState<ShiftStats>({
    activeShifts: 0,
    todaysSales: 0,
    totalExpenses: 0,
    netAmount: 0,
    totalTransactions: 0,
    avgTransaction: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [showShiftDetails, setShowShiftDetails] = useState(false)
  const [showExpenseDetails, setShowExpenseDetails] = useState(false)
  const [expenseFilter, setExpenseFilter] = useState<string>('all')

  useEffect(() => {
    fetchShiftData()
  }, [user?.outletId, selectedDate])

  const fetchShiftData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch daily shifts and summary using API client
      const [dailyShifts, dailySummary] = await Promise.all([
        apiClient.shifts.getDailyShifts(selectedDate),
        apiClient.shifts.getDailySummary(selectedDate)
      ])

      setShifts(dailyShifts)
      setStats({
        activeShifts: dailyShifts.filter((s: Shift) => s.status === 'active').length,
        todaysSales: dailySummary.totalSales || 0,
        totalExpenses: dailySummary.totalExpenses || 0,
        netAmount: dailySummary.netAmount || 0,
        totalTransactions: dailySummary.shiftCount || 0,
        avgTransaction: dailySummary.totalSales && dailySummary.shiftCount 
          ? dailySummary.totalSales / dailySummary.shiftCount 
          : 0
      })
    } catch (err) {
      setError("Failed to fetch shift data")
      console.error("Error fetching shifts:", err)
      toast({
        title: "Error",
        description: "Failed to load shift data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchShiftExpenses = async (shiftId: string) => {
    try {
      const shiftExpenses = await apiClient.shifts.getShiftExpenses(shiftId)
      setExpenses(shiftExpenses)
    } catch (err) {
      console.error("Error fetching shift expenses:", err)
    }
  }

  const handleViewShiftDetails = async (shift: Shift) => {
    setSelectedShift(shift)
    setShowShiftDetails(true)
    await fetchShiftExpenses(shift.id)
  }

  const handleViewExpenses = async (shift: Shift) => {
    setSelectedShift(shift)
    setShowExpenseDetails(true)
    await fetchShiftExpenses(shift.id)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Shift Reports</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading shift reports...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">Shift Reports</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  const filteredExpenses = expenses.filter(expense => 
    expenseFilter === 'all' || expense.category === expenseFilter
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-foreground">Shift Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchShiftData}>
            <Calendar className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-rose-600 hover:bg-rose-700">
            <Download className="h-4 w-4 mr-2" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor="date-filter">Date:</Label>
          <Input
            id="date-filter"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Active Shifts</p>
                <p className="text-2xl font-bold">{stats.activeShifts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Sales</p>
                <p className="text-2xl font-bold">Le {stats.todaysSales.toLocaleString('en-SL')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">Le {stats.totalExpenses.toLocaleString('en-SL')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Net Amount</p>
                <p className="text-2xl font-bold">Le {stats.netAmount.toLocaleString('en-SL')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Shifts Today</p>
                <p className="text-2xl font-bold">{stats.totalTransactions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shifts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="shifts">
          <Card>
            <CardHeader>
              <CardTitle>Daily Shifts - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cashier</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Opening Balance</TableHead>
                      <TableHead>Closing Balance</TableHead>
                      <TableHead>Sales</TableHead>
                      <TableHead>Expenses</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shifts.map((shift) => (
                      <TableRow key={shift.id}>
                        <TableCell className="font-medium">
                          {`${shift.cashier?.firstName} ${shift.cashier?.lastName}` || 'Unknown Cashier'}
                        </TableCell>
                        <TableCell>
                          {new Date(shift.startTime).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {shift.endTime ? new Date(shift.endTime).toLocaleTimeString() : 'Active'}
                        </TableCell>
                        <TableCell>Le {shift.openingBalance.toLocaleString('en-SL')}</TableCell>
                        <TableCell>
                          {shift.closingBalance ? `Le ${shift.closingBalance.toLocaleString('en-SL')}` : '-'}
                        </TableCell>
                        <TableCell className="text-green-600">
                          Le {shift.totalSales.toLocaleString('en-SL')}
                        </TableCell>
                        <TableCell className="text-red-600">
                          Le {shift.totalExpenses.toLocaleString('en-SL')}
                        </TableCell>
                        <TableCell className="font-medium">
                          Le {shift.netAmount.toLocaleString('en-SL')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shift.status === "closed" ? "default" : "secondary"}>
                            {shift.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewShiftDetails(shift)}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewExpenses(shift)}
                            >
                              <FileText className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Daily Expenses - {new Date(selectedDate).toLocaleDateString()}</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Expense Management</h3>
                <p className="text-muted-foreground mb-4">
                  Select a shift to view its expenses
                </p>
                <Button onClick={() => setShowExpenseDetails(true)}>
                  View All Expenses
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Shift Details Modal */}
      <Dialog open={showShiftDetails} onOpenChange={setShowShiftDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Shift Details</DialogTitle>
            <DialogDescription>
              Complete information for shift on {selectedShift && new Date(selectedShift.startTime).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Cashier</Label>
                  <p className="text-sm text-muted-foreground">
                    {`${selectedShift.cashier?.firstName} ${selectedShift.cashier?.lastName}` || 'Unknown Cashier'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Outlet</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedShift.outletId || 'Unknown Outlet'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Start Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedShift.startTime).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">End Time</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedShift.endTime ? new Date(selectedShift.endTime).toLocaleString() : 'Still Active'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Opening Balance</p>
                      <p className="text-2xl font-bold">Le {selectedShift.openingBalance.toLocaleString('en-SL')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold text-green-600">Le {selectedShift.totalSales.toLocaleString('en-SL')}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-2xl font-bold text-red-600">Le {selectedShift.totalExpenses.toLocaleString('en-SL')}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Net Amount</p>
                    <p className="text-3xl font-bold">Le {selectedShift.netAmount.toLocaleString('en-SL')}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Expenses Modal */}
      <Dialog open={showExpenseDetails} onOpenChange={setShowExpenseDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Shift Expenses</DialogTitle>
            <DialogDescription>
              All expenses for {selectedShift && new Date(selectedShift.startTime).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-red-600 font-medium">
                          Le {expense.amount.toLocaleString('en-SL')}
                        </TableCell>
                        <TableCell>
                          {new Date(expense.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {expense.receiptNumber || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredExpenses.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No expenses found for this shift</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
