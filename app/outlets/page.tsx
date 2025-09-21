"use client"

import { useState } from "react"
import { Header } from "@/components/pharmacy/header"
import { LayoutWrapper } from "@/components/pharmacy/layout-wrapper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MapPin, Phone, Users, TrendingUp, Plus, Edit } from "lucide-react"

interface Outlet {
  id: string
  name: string
  address: string
  phone: string
  manager: string
  staff: number
  status: "active" | "inactive"
  revenue: number
  transactions: number
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([])

  const [isAddingOutlet, setIsAddingOutlet] = useState(false)

  return (
    <LayoutWrapper role="admin">
      <Header title="Outlet Management" role="admin" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">Pharmacy Outlets</h2>
            <p className="text-muted-foreground">Manage all pharmacy locations and their performance</p>
          </div>
          <Dialog open={isAddingOutlet} onOpenChange={setIsAddingOutlet}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Outlet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Outlet</DialogTitle>
                <DialogDescription>Create a new pharmacy outlet location</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Outlet Name</Label>
                  <Input id="name" placeholder="Enter outlet name" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" placeholder="Enter full address" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" placeholder="+1 (555) 000-0000" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="manager">Manager</Label>
                  <Input id="manager" placeholder="Manager name" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingOutlet(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddingOutlet(false)}>Create Outlet</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {outlets.map((outlet) => (
            <Card key={outlet.id} className="relative">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{outlet.name}</CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <MapPin className="mr-1 h-3 w-3" />
                      {outlet.address}
                    </CardDescription>
                  </div>
                  <Badge variant={outlet.status === "active" ? "default" : "secondary"}>{outlet.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
                    {outlet.phone}
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-3 w-3 text-muted-foreground" />
                    Manager: {outlet.manager}
                  </div>
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-3 w-3 text-muted-foreground" />
                    Staff: {outlet.staff} members
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                    <p className="text-lg font-semibold text-green-600">${outlet.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transactions</p>
                    <p className="text-lg font-semibold">{outlet.transactions.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </LayoutWrapper>
  )
}
