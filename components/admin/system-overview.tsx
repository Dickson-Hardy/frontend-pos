"use client"

import { Building2, Users, DollarSign, AlertTriangle, TrendingUp, Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ErrorMessage } from "@/components/ui/error-message"
import { useSystemMetrics } from "@/hooks/use-system-metrics"

export function SystemOverview() {
  const { systemMetrics, outletPerformance, loading, error } = useSystemMetrics()

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

  if (!systemMetrics) {
    return <ErrorMessage error="No system metrics available" />
  }

  const systemStats = [
    {
      title: "Total Outlets",
      value: systemMetrics.totalOutlets.toString(),
      change: "+2 this month",
      icon: Building2,
      color: "text-primary",
    },
    {
      title: "Active Users",
      value: systemMetrics.activeUsers.toString(),
      change: `${systemMetrics.onlineUsers} online now`,
      icon: Users,
      color: "text-secondary",
    },
    {
      title: "System Revenue",
      value: `Le ${systemMetrics.systemRevenue.toLocaleString('en-SL')}`,
      change: systemMetrics.revenueChange,
      icon: DollarSign,
      color: "text-primary",
    },
    {
      title: "System Alerts",
      value: systemMetrics.systemAlerts.toString(),
      change: `${systemMetrics.criticalAlerts} critical`,
      icon: AlertTriangle,
      color: "text-destructive",
    },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">System Overview</h1>
        <p className="text-muted-foreground">Monitor your pharmacy network performance and health</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Outlet Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outlet Performance</CardTitle>
            <CardDescription>Revenue and performance metrics by location</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {outletPerformance.map((outlet) => (
              <div key={outlet.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{outlet.name}</p>
                    <p className="text-xs text-muted-foreground">Le {outlet.revenue.toLocaleString('en-SL')} revenue</p>
                  </div>
                  <Badge
                    variant={
                      outlet.status === "excellent" ? "default" : outlet.status === "good" ? "secondary" : "outline"
                    }
                  >
                    {outlet.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Performance Score</span>
                    <span>{outlet.performance}%</span>
                  </div>
                  <Progress value={outlet.performance} className="h-2" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time system status and metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm">System Uptime</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{systemMetrics.systemUptime}%</p>
                <p className="text-xs text-muted-foreground">30 days</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm">API Response Time</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{systemMetrics.apiResponseTime}ms</p>
                <p className="text-xs text-muted-foreground">avg</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="text-sm">Concurrent Users</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{systemMetrics.concurrentUsers}</p>
                <p className="text-xs text-muted-foreground">active now</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Online Outlets</span>
              </div>
              <div className="text-right">
                <p className="font-semibold">{systemMetrics.onlineOutlets}/{systemMetrics.totalOutletsCount}</p>
                <p className="text-xs text-muted-foreground">
                  {Math.round((systemMetrics.onlineOutlets / systemMetrics.totalOutletsCount) * 100)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
