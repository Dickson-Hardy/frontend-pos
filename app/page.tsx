'use client'

import React from 'react'
import Link from "next/link"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ShoppingCart, BarChart3, Settings, Package, Users, CreditCard, LogIn } from "lucide-react"

export default function HomePage() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()

  // If authenticated, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, user, isLoading, router])

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-serif font-bold text-foreground">PharmaPOS</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">Professional Pharmacy Management System</div>
              <Link href="/login">
                <Button variant="outline" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-foreground mb-4">Welcome to PharmaPOS</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamlined pharmacy management system designed for modern pharmaceutical outlets. Manage sales, inventory,
            and operations with professional-grade tools.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Cashier Interface */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl font-serif">Cashier POS</CardTitle>
              <CardDescription>Quick sales processing, product scanning, and customer transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/cashier">
                <Button className="w-full" size="lg">
                  Access Cashier
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Manager Dashboard */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-secondary/10 rounded-full w-fit">
                <BarChart3 className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-xl font-serif">Manager Dashboard</CardTitle>
              <CardDescription>Sales analytics, inventory monitoring, and staff performance tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/manager">
                <Button variant="secondary" className="w-full" size="lg">
                  Manager Access
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Admin Panel */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-accent/10 rounded-full w-fit">
                <Settings className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl font-serif">Admin Panel</CardTitle>
              <CardDescription>System configuration, user management, and multi-outlet oversight</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin">
                <Button variant="outline" className="w-full bg-transparent" size="lg">
                  Admin Access
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16">
          <h3 className="text-2xl font-serif font-bold text-center mb-8">Key Features</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Inventory Management</h4>
              <p className="text-sm text-muted-foreground">Real-time stock tracking with pharmaceutical-specific UOM</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Payment Processing</h4>
              <p className="text-sm text-muted-foreground">
                Multiple payment methods with detailed transaction records
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Financial Reports</h4>
              <p className="text-sm text-muted-foreground">Comprehensive analytics and settlement tracking</p>
            </div>
            <div className="text-center">
              <div className="mx-auto mb-3 p-2 bg-primary/10 rounded-full w-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Multi-Outlet Support</h4>
              <p className="text-sm text-muted-foreground">Centralized management across multiple pharmacy locations</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
