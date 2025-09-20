"use client"

import { useState } from "react"
import { Download, Calendar, TrendingUp, TrendingDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const profitLossData = {
  revenue: {
    grossSales: 321500,
    returns: 2800,
    discounts: 8900,
    netSales: 309800,
  },
  costOfGoodsSold: {
    inventory: 185400,
    freight: 3200,
    total: 188600,
  },
  grossProfit: 121200,
  operatingExpenses: {
    salaries: 45000,
    rent: 12000,
    utilities: 3500,
    insurance: 2800,
    marketing: 1500,
    supplies: 2200,
    maintenance: 1800,
    other: 3200,
    total: 72000,
  },
  operatingIncome: 49200,
  otherIncome: {
    interest: 450,
    other: 200,
    total: 650,
  },
  otherExpenses: {
    interest: 1200,
    taxes: 8500,
    total: 9700,
  },
  netIncome: 40150,
}

export function ProfitLossReport() {
  const [timePeriod, setTimePeriod] = useState("monthly")

  const grossProfitMargin = (profitLossData.grossProfit / profitLossData.revenue.netSales) * 100
  const operatingMargin = (profitLossData.operatingIncome / profitLossData.revenue.netSales) * 100
  const netProfitMargin = (profitLossData.netIncome / profitLossData.revenue.netSales) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">Comprehensive financial performance analysis</p>
        </div>
        <div className="flex space-x-2">
          <Select value={timePeriod} onValueChange={setTimePeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{grossProfitMargin.toFixed(1)}%</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary">+2.3%</span>
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Operating Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operatingMargin.toFixed(1)}%</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary" />
              <span className="text-primary">+1.8%</span>
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{netProfitMargin.toFixed(1)}%</div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-secondary" />
              <span className="text-secondary">-0.5%</span>
              <span>vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit & Loss Statement */}
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <CardDescription>Detailed financial performance breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Revenue Section */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-lg">Revenue</h3>
            <div className="space-y-1 ml-4">
              <div className="flex justify-between">
                <span>Gross Sales</span>
                <span className="font-semibold">${profitLossData.revenue.grossSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Less: Returns</span>
                <span>-${profitLossData.revenue.returns.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Less: Discounts</span>
                <span>-${profitLossData.revenue.discounts.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Net Sales</span>
                <span>${profitLossData.revenue.netSales.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Cost of Goods Sold */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-lg">Cost of Goods Sold</h3>
            <div className="space-y-1 ml-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Inventory</span>
                <span>${profitLossData.costOfGoodsSold.inventory.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Freight & Shipping</span>
                <span>${profitLossData.costOfGoodsSold.freight.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total COGS</span>
                <span>${profitLossData.costOfGoodsSold.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Gross Profit */}
          <div className="bg-primary/5 p-3 rounded-lg">
            <div className="flex justify-between font-bold text-lg">
              <span>Gross Profit</span>
              <span>${profitLossData.grossProfit.toLocaleString()}</span>
            </div>
          </div>

          {/* Operating Expenses */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-lg">Operating Expenses</h3>
            <div className="space-y-1 ml-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Salaries & Benefits</span>
                <span>${profitLossData.operatingExpenses.salaries.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Rent</span>
                <span>${profitLossData.operatingExpenses.rent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Utilities</span>
                <span>${profitLossData.operatingExpenses.utilities.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Insurance</span>
                <span>${profitLossData.operatingExpenses.insurance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Marketing</span>
                <span>${profitLossData.operatingExpenses.marketing.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Supplies</span>
                <span>${profitLossData.operatingExpenses.supplies.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Maintenance</span>
                <span>${profitLossData.operatingExpenses.maintenance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Other</span>
                <span>${profitLossData.operatingExpenses.other.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total Operating Expenses</span>
                <span>${profitLossData.operatingExpenses.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Operating Income */}
          <div className="bg-secondary/5 p-3 rounded-lg">
            <div className="flex justify-between font-bold text-lg">
              <span>Operating Income</span>
              <span>${profitLossData.operatingIncome.toLocaleString()}</span>
            </div>
          </div>

          {/* Other Income/Expenses */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Other Income</h4>
              <div className="space-y-1 ml-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Interest Income</span>
                  <span>${profitLossData.otherIncome.interest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Other</span>
                  <span>${profitLossData.otherIncome.other.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${profitLossData.otherIncome.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Other Expenses</h4>
              <div className="space-y-1 ml-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Interest Expense</span>
                  <span>${profitLossData.otherExpenses.interest.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Taxes</span>
                  <span>${profitLossData.otherExpenses.taxes.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>${profitLossData.otherExpenses.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Income */}
          <div className="bg-primary/10 p-4 rounded-lg">
            <div className="flex justify-between font-bold text-xl">
              <span>Net Income</span>
              <span className="text-primary">${profitLossData.netIncome.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
