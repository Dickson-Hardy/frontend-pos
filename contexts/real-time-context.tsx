'use client'

import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useAuth } from './auth-context'

interface RealTimeUpdate {
  type: 'inventory_update' | 'sale_created' | 'purchase_order_update' | 'low_stock_alert' | 'expiry_alert'
  data: any
  timestamp: Date
}

interface RealTimeContextType {
  isConnected: boolean
  lastUpdate: RealTimeUpdate | null
  subscribe: (callback: (update: RealTimeUpdate) => void) => () => void
  sendUpdate: (update: Omit<RealTimeUpdate, 'timestamp'>) => void
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined)

export function useRealTime() {
  const context = useContext(RealTimeContext)
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider')
  }
  return context
}

interface RealTimeProviderProps {
  children: React.ReactNode
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const { isAuthenticated, token } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null)
  const subscribersRef = useRef<Set<(update: RealTimeUpdate) => void>>(new Set())
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  const connect = () => {
    if (!isAuthenticated || !token) return

    try {
      // In a real implementation, you would connect to a WebSocket server
      // For now, we'll simulate real-time updates with periodic checks
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
      
      // Simulate WebSocket connection
      setIsConnected(true)
      reconnectAttempts.current = 0

      // TODO: Replace with actual WebSocket connection for production
      const interval = setInterval(() => {
        // Simulate random inventory updates
        if (Math.random() > 0.8) {
          const update: RealTimeUpdate = {
            type: 'inventory_update',
            data: {
              productId: `product-${Math.floor(Math.random() * 100)}`,
              newQuantity: Math.floor(Math.random() * 100),
              change: Math.floor(Math.random() * 10) - 5,
            },
            timestamp: new Date(),
          }
          
          setLastUpdate(update)
          subscribersRef.current.forEach(callback => callback(update))
        }

        // Simulate low stock alerts
        if (Math.random() > 0.95) {
          const update: RealTimeUpdate = {
            type: 'low_stock_alert',
            data: {
              productId: `product-${Math.floor(Math.random() * 100)}`,
              productName: `Product ${Math.floor(Math.random() * 100)}`,
              currentStock: Math.floor(Math.random() * 10),
              minimumStock: 20,
            },
            timestamp: new Date(),
          }
          
          setLastUpdate(update)
          subscribersRef.current.forEach(callback => callback(update))
        }
      }, 5000) // Check every 5 seconds

      return () => {
        clearInterval(interval)
        setIsConnected(false)
      }
    } catch (error) {
      console.error('Failed to connect to real-time service:', error)
      setIsConnected(false)
      scheduleReconnect()
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    setIsConnected(false)
  }

  const scheduleReconnect = () => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Exponential backoff, max 30s
    reconnectAttempts.current++

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
      connect()
    }, delay)
  }

  const subscribe = (callback: (update: RealTimeUpdate) => void) => {
    subscribersRef.current.add(callback)
    
    return () => {
      subscribersRef.current.delete(callback)
    }
  }

  const sendUpdate = (update: Omit<RealTimeUpdate, 'timestamp'>) => {
    const fullUpdate: RealTimeUpdate = {
      ...update,
      timestamp: new Date(),
    }
    
    // In a real implementation, you would send this to the WebSocket server
    // For now, we'll just broadcast it locally
    setLastUpdate(fullUpdate)
    subscribersRef.current.forEach(callback => callback(fullUpdate))
  }

  useEffect(() => {
    if (isAuthenticated && token) {
      const cleanup = connect()
      return cleanup
    } else {
      disconnect()
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const value: RealTimeContextType = {
    isConnected,
    lastUpdate,
    subscribe,
    sendUpdate,
  }

  return (
    <RealTimeContext.Provider value={value}>
      {children}
    </RealTimeContext.Provider>
  )
}

// Hook for inventory-specific real-time updates
export function useInventoryRealTime() {
  const { subscribe, sendUpdate } = useRealTime()
  const [inventoryUpdates, setInventoryUpdates] = useState<RealTimeUpdate[]>([])

  useEffect(() => {
    const unsubscribe = subscribe((update) => {
      if (update.type === 'inventory_update' || update.type === 'low_stock_alert' || update.type === 'expiry_alert') {
        setInventoryUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
      }
    })

    return unsubscribe
  }, [subscribe])

  const broadcastInventoryUpdate = (data: any) => {
    sendUpdate({
      type: 'inventory_update',
      data,
    })
  }

  const broadcastLowStockAlert = (data: any) => {
    sendUpdate({
      type: 'low_stock_alert',
      data,
    })
  }

  return {
    inventoryUpdates,
    broadcastInventoryUpdate,
    broadcastLowStockAlert,
  }
}

// Hook for purchase order real-time updates
export function usePurchaseOrderRealTime() {
  const { subscribe, sendUpdate } = useRealTime()
  const [purchaseOrderUpdates, setPurchaseOrderUpdates] = useState<RealTimeUpdate[]>([])

  useEffect(() => {
    const unsubscribe = subscribe((update) => {
      if (update.type === 'purchase_order_update') {
        setPurchaseOrderUpdates(prev => [update, ...prev.slice(0, 9)]) // Keep last 10 updates
      }
    })

    return unsubscribe
  }, [subscribe])

  const broadcastPurchaseOrderUpdate = (data: any) => {
    sendUpdate({
      type: 'purchase_order_update',
      data,
    })
  }

  return {
    purchaseOrderUpdates,
    broadcastPurchaseOrderUpdate,
  }
}