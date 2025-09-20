"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DollarSign, Package, Clock, TrendingUp, LogIn, LogOut } from "lucide-react"

export default function CashierDashboard() {
  const [shiftStatus, setShiftStatus] = useState<"closed" | "open">("closed")
  const [openingBalance, setOpeningBalance] = useState("")
  const [closingBalance, setClosingBalance] = useState("")
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false)

  const todayStats = {
    sales: 2450.75,
    transactions: 28,
    averageTransaction: 87.53,
    itemsSold: 156,
  }

  const recentSales = [
    { id: "TXN001", time: "14:30", amount: 45.99, items: 3, customer: "Walk-in" },
    { id: "TXN002", time: "14:15", amount: 123.5, items: 7, customer: "John Doe" },
    { id: "TXN003", time: "13:45", amount: 67.25, items: 4, customer: "Walk-in" },
    { id: "TXN004", time: "13:30", amount: 89.99, items: 2, customer: "Mary Smith" },
  ]

  const lowStockItems = [
    { name: "Paracetamol 500mg", current: 15, minimum: 50, unit: "tablets" },
    { name: "Amoxicillin 250mg", current: 8, minimum: 30, unit: "capsules" },
    { name: "Insulin Pen", current: 3, minimum: 10, unit: "units" },
    { name: "Blood Pressure Monitor", current: 2, minimum: 5, unit: "units" },
  ]

  const handleShiftAction = () => {
    if (shiftStatus === "closed") {
      setShiftStatus("open")
    } else {
      setShiftStatus("closed")
    }
    setIsShiftDialogOpen(false)
  }

  return (
    <LayoutWrapper role="cashier">
      <Header title="Cashier Dashboard" role="cashier" userName="Sarah Johnson" outletName="Downtown Pharmacy" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">My Dashboard</h2>
            <p className="text-muted-foreground">Track your sales, inventory, and shift management</p>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={shiftStatus === "open" ? "default" : "secondary"} className="px-3 py-1">
              Shift {shiftStatus === "open" ? "Open" : "Closed"}
            </Badge>
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button variant={shiftStatus === "open" ? "destructive" : "default"}>
                  {shiftStatus === "open" ? (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      Close Shift
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Open Shift
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{shiftStatus === "open" ? "Close Shift" : "Open Shift"}</DialogTitle>
                  <DialogDescription>
                    {shiftStatus === "open"
                      ? "Enter your closing balance to end your shift"
                      : "Enter your opening balance to start your shift"}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="balance">{shiftStatus === "open" ? "Closing Balance" : "Opening Balance"}</Label>
                    <Input
                      id="balance"
                      type="number"
                      placeholder="0.00"
                      value={shiftStatus === "open" ? closingBalance : openingBalance}
                      onChange={(e) =>
                        shiftStatus === "open" ? setClosingBalance(e.target.value) : setOpeningBalance(e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsShiftDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleShiftAction}>{shiftStatus === "open" ? "Close Shift" : "Open Shift"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">My Sales</TabsTrigger>
            <TabsTrigger value="inventory">Inventory View</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${todayStats.sales.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">+12% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayStats.transactions}</div>
                  <p className="text-xs text-muted-foreground">+3 from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${todayStats.averageTransaction.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">+5% from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{todayStats.itemsSold}</div>
                  <p className="text-xs text-muted-foreground">+8% from yesterday</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Your recent sales activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{sale.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {sale.time} • {sale.customer}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${sale.amount.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{sale.items} items</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Low Stock Alerts</CardTitle>
                <CardDescription>Items that need attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {lowStockItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-destructive/10 rounded-full">
                          <Package className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current: {item.current} {item.unit} • Min: {item.minimum} {item.unit}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </LayoutWrapper>
  )
}
