import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

export interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  details: string
  outlet: string
  severity: 'info' | 'warning' | 'error'
  ipAddress: string
}

export interface UseAuditLogsReturn {
  auditLogs: AuditLog[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAuditLogs(outletId?: string, limit = 50): UseAuditLogsReturn {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user: currentUser } = useAuth()

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Replace with actual backend API call when audit logs endpoint is available
      // const response = await apiClient.auditLogs.getAll({ outletId, limit })
      
      // For now, return mock data that matches the expected structure
      const mockLogs: AuditLog[] = [
        {
          id: "1",
          timestamp: "2024-01-15 15:30:25",
          user: "Alex Rodriguez",
          action: "User Created",
          details: "Created new cashier account for Emma Wilson",
          outlet: "System",
          severity: "info",
          ipAddress: "192.168.1.100",
        },
        {
          id: "2",
          timestamp: "2024-01-15 14:45:12",
          user: "Michael Chen",
          action: "Inventory Update",
          details: "Updated stock levels for Paracetamol 500mg",
          outlet: "Downtown Pharmacy",
          severity: "info",
          ipAddress: "192.168.1.105",
        },
        {
          id: "3",
          timestamp: "2024-01-15 13:20:08",
          user: "System",
          action: "Security Alert",
          details: "Multiple failed login attempts detected",
          outlet: "Mall Branch",
          severity: "warning",
          ipAddress: "203.0.113.45",
        },
        {
          id: "4",
          timestamp: "2024-01-15 12:15:33",
          user: "Sarah Johnson",
          action: "Transaction Void",
          details: "Voided transaction TXN-12345 - customer request",
          outlet: "Downtown Pharmacy",
          severity: "warning",
          ipAddress: "192.168.1.102",
        },
        {
          id: "5",
          timestamp: "2024-01-15 11:30:45",
          user: "David Kim",
          action: "Price Override",
          details: "Applied 10% discount to Vitamin C 1000mg",
          outlet: "Mall Branch",
          severity: "info",
          ipAddress: "192.168.1.108",
        },
      ]

      // Filter by outlet if specified
      const filteredLogs = outletId 
        ? mockLogs.filter(log => log.outlet === outletId || log.outlet === 'System')
        : mockLogs

      setAuditLogs(filteredLogs.slice(0, limit))
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs')
      console.error('Error fetching audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const refetch = async () => {
    await fetchAuditLogs()
  }

  useEffect(() => {
    if (currentUser) {
      fetchAuditLogs()
    }
  }, [outletId, limit, currentUser])

  return {
    auditLogs,
    loading,
    error,
    refetch,
  }
}