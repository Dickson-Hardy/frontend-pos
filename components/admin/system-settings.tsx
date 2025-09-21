"use client"

import { useState, useEffect } from "react"
import { Save, Database, Shield, Bell, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export function SystemSettings() {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    companyName: "PharmaPOS Network",
    systemTimezone: "UTC-5 (Eastern)",
    companyAddress: "123 Business District, City 12345",
    twoFactorAuth: true,
    sessionTimeout: "30",
    passwordPolicy: true,
    automaticBackups: true,
    backupRetention: "30",
    dataArchiving: false,
    lowStockAlerts: true,
    expiryWarnings: true,
    systemMaintenance: true
  })
  const { toast } = useToast()

  const handleSaveSettings = async () => {
    setLoading(true)
    try {
      // Since there's no settings endpoint, we'll store settings locally
      // In a real implementation, this would call the backend API
      
      // Store settings in localStorage as fallback
      localStorage.setItem('systemSettings', JSON.stringify(settings))
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      toast({
        title: "Success",
        description: "Settings saved successfully (stored locally)",
      })
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold">System Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>General Settings</span>
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input 
                  id="company-name" 
                  value={settings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="system-timezone">System Timezone</Label>
                <Input 
                  id="system-timezone" 
                  value={settings.systemTimezone}
                  onChange={(e) => updateSetting('systemTimezone', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Input 
                id="company-address" 
                value={settings.companyAddress}
                onChange={(e) => updateSetting('companyAddress', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security Settings</span>
            </CardTitle>
            <CardDescription>Authentication and security configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for all admin accounts</p>
              </div>
              <Switch 
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => updateSetting('twoFactorAuth', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Session Timeout</Label>
                <p className="text-sm text-muted-foreground">Auto-logout after inactivity</p>
              </div>
              <div className="w-32">
                <Input 
                  value={settings.sessionTimeout}
                  onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
                  placeholder="minutes" 
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Policy</Label>
                <p className="text-sm text-muted-foreground">Enforce strong password requirements</p>
              </div>
              <Switch 
                checked={settings.passwordPolicy}
                onCheckedChange={(checked) => updateSetting('passwordPolicy', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Database Settings</span>
            </CardTitle>
            <CardDescription>Database backup and maintenance configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Backups</Label>
                <p className="text-sm text-muted-foreground">Daily database backups</p>
              </div>
              <Switch 
                checked={settings.automaticBackups}
                onCheckedChange={(checked) => updateSetting('automaticBackups', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Backup Retention</Label>
                <p className="text-sm text-muted-foreground">Keep backups for specified days</p>
              </div>
              <div className="w-32">
                <Input 
                  value={settings.backupRetention}
                  onChange={(e) => updateSetting('backupRetention', e.target.value)}
                  placeholder="days" 
                />
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Data Archiving</Label>
                <p className="text-sm text-muted-foreground">Archive old transaction data</p>
              </div>
              <Switch 
                checked={settings.dataArchiving}
                onCheckedChange={(checked) => updateSetting('dataArchiving', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Settings</span>
            </CardTitle>
            <CardDescription>System alerts and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Low Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">Notify when inventory is low</p>
              </div>
              <Switch 
                checked={settings.lowStockAlerts}
                onCheckedChange={(checked) => updateSetting('lowStockAlerts', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expiry Warnings</Label>
                <p className="text-sm text-muted-foreground">Alert for expiring products</p>
              </div>
              <Switch 
                checked={settings.expiryWarnings}
                onCheckedChange={(checked) => updateSetting('expiryWarnings', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>System Maintenance</Label>
                <p className="text-sm text-muted-foreground">Notify about system updates</p>
              </div>
              <Switch 
                checked={settings.systemMaintenance}
                onCheckedChange={(checked) => updateSetting('systemMaintenance', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg" onClick={handleSaveSettings} disabled={loading}>
            {loading ? (
              <LoadingSpinner className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
