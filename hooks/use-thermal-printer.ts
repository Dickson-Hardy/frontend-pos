import { useState, useEffect, useCallback } from 'react'
import { thermalPrinterService, type PrinterDevice, type PrintJob } from '@/lib/thermal-printer-web'
import { receiptGenerator, type ReceiptData, type ReceiptTemplate } from '@/lib/receipt-generator'
import { useToast } from '@/hooks/use-toast'

export interface ThermalPrinterState {
  connectedDevice: PrinterDevice | null
  availableDevices: PrinterDevice[]
  isScanning: boolean
  isConnecting: boolean
  isPrinting: boolean
  lastPrintJob: PrintJob | null
  error: string | null
}

export function useThermalPrinter() {
  const [state, setState] = useState<ThermalPrinterState>({
    connectedDevice: null,
    availableDevices: [],
    isScanning: false,
    isConnecting: false,
    isPrinting: false,
    lastPrintJob: null,
    error: null
  })

  const { toast } = useToast()

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = thermalPrinterService.isBluetoothSupported()

  useEffect(() => {
    // Set up event listeners
    const handleConnected = (device: PrinterDevice) => {
      setState(prev => ({ ...prev, connectedDevice: device, isConnecting: false, error: null }))
      toast({
        title: "Printer Connected",
        description: `Connected to ${device.name}`,
      })
    }

    const handleDisconnected = () => {
      setState(prev => ({ ...prev, connectedDevice: null, error: null }))
      toast({
        title: "Printer Disconnected",
        description: "The thermal printer has been disconnected",
      })
    }

    const handleError = (data: { error: string }) => {
      setState(prev => ({ ...prev, error: data.error, isConnecting: false, isPrinting: false }))
      toast({
        title: "Printer Error",
        description: data.error,
        variant: "destructive",
      })
    }

    const handlePrintCompleted = (job: PrintJob) => {
      setState(prev => ({ ...prev, lastPrintJob: job, isPrinting: false }))
      toast({
        title: "Print Complete",
        description: "Receipt has been printed successfully",
      })
    }

    const handlePrintFailed = (job: PrintJob) => {
      setState(prev => ({ ...prev, lastPrintJob: job, isPrinting: false, error: job.error }))
      toast({
        title: "Print Failed",
        description: job.error || "Failed to print receipt",
        variant: "destructive",
      })
    }

    // Add event listeners
    thermalPrinterService.on('connected', handleConnected)
    thermalPrinterService.on('disconnected', handleDisconnected)
    thermalPrinterService.on('error', handleError)
    thermalPrinterService.on('printCompleted', handlePrintCompleted)
    thermalPrinterService.on('printFailed', handlePrintFailed)

    return () => {
      // Clean up event listeners
      thermalPrinterService.off('connected', handleConnected)
      thermalPrinterService.off('disconnected', handleDisconnected)
      thermalPrinterService.off('error', handleError)
      thermalPrinterService.off('printCompleted', handlePrintCompleted)
      thermalPrinterService.off('printFailed', handlePrintFailed)
    }
  }, [toast])

  const scanForPrinters = useCallback(async () => {
    if (!isBluetoothSupported) {
      setState(prev => ({ ...prev, error: 'Web Bluetooth is not supported in this browser' }))
      return
    }

    setState(prev => ({ ...prev, isScanning: true, error: null }))

    try {
      const devices = await thermalPrinterService.scanForPrinters()
      setState(prev => ({ ...prev, availableDevices: devices, isScanning: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isScanning: false, 
        error: error instanceof Error ? error.message : 'Failed to scan for printers'
      }))
    }
  }, [isBluetoothSupported])

  const connectToPrinter = useCallback(async (deviceId?: string) => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      const device = await thermalPrinterService.connect(deviceId)
      setState(prev => ({ ...prev, connectedDevice: device, isConnecting: false }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to printer'
      }))
    }
  }, [])

  const disconnectPrinter = useCallback(async () => {
    try {
      await thermalPrinterService.disconnect()
      setState(prev => ({ ...prev, connectedDevice: null }))
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to disconnect printer'
      }))
    }
  }, [])

  const printReceipt = useCallback(async (template: ReceiptTemplate, receiptData: ReceiptData) => {
    if (!state.connectedDevice) {
      setState(prev => ({ ...prev, error: 'No printer connected' }))
      return
    }

    setState(prev => ({ ...prev, isPrinting: true, error: null }))

    try {
      // Generate receipt data
      const receiptCommands = await receiptGenerator.generateReceipt(template, receiptData)
      
      // Print the receipt
      const printJob = await thermalPrinterService.printRaw(receiptCommands)
      setState(prev => ({ ...prev, lastPrintJob: printJob }))
      
      return printJob
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isPrinting: false, 
        error: error instanceof Error ? error.message : 'Failed to print receipt'
      }))
      throw error
    }
  }, [state.connectedDevice])

  const printText = useCallback(async (text: string, options?: {
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    underline?: boolean
    fontSize?: 'normal' | 'large'
    lineFeed?: number
  }) => {
    if (!state.connectedDevice) {
      setState(prev => ({ ...prev, error: 'No printer connected' }))
      return
    }

    setState(prev => ({ ...prev, isPrinting: true, error: null }))

    try {
      const printJob = await thermalPrinterService.printText(text, options)
      setState(prev => ({ ...prev, lastPrintJob: printJob, isPrinting: false }))
      return printJob
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isPrinting: false, 
        error: error instanceof Error ? error.message : 'Failed to print text'
      }))
      throw error
    }
  }, [state.connectedDevice])

  const cutPaper = useCallback(async () => {
    if (!state.connectedDevice) {
      setState(prev => ({ ...prev, error: 'No printer connected' }))
      return
    }

    try {
      await thermalPrinterService.cutPaper()
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to cut paper'
      }))
    }
  }, [state.connectedDevice])

  const testPrint = useCallback(async () => {
    const testText = `Test Print\nTime: ${new Date().toLocaleString()}\nPrinter: ${state.connectedDevice?.name}\n\n`
    return printText(testText, { align: 'center' })
  }, [state.connectedDevice, printText])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    // State
    ...state,
    isBluetoothSupported,
    isConnected: !!state.connectedDevice,
    
    // Actions
    scanForPrinters,
    connectToPrinter,
    disconnectPrinter,
    printReceipt,
    printText,
    cutPaper,
    testPrint,
    clearError,
    
    // Capabilities
    capabilities: state.connectedDevice ? thermalPrinterService.getPrinterCapabilities() : null
  }
}

// Hook for USB printer support (admin portal)
export function useUSBThermalPrinter() {
  const [usbPrinters, setUsbPrinters] = useState([])
  const [connectedUSBPrinter, setConnectedUSBPrinter] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const scanUSBPrinters = useCallback(async () => {
    setIsLoading(true)
    try {
      // Call backend API to scan for USB printers
      const response = await fetch('/api/thermal-printer/scan/usb')
      const printers = await response.json()
      setUsbPrinters(printers)
    } catch (error) {
      toast({
        title: "Scan Failed",
        description: "Failed to scan for USB printers",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const connectUSBPrinter = useCallback(async (printer: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/thermal-printer/connect/serial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printer)
      })
      
      if (response.ok) {
        setConnectedUSBPrinter(printer)
        toast({
          title: "Printer Connected",
          description: `Connected to ${printer.name}`,
        })
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect to USB printer",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const printViaUSB = useCallback(async (data: any) => {
    if (!connectedUSBPrinter) return

    try {
      const response = await fetch(`/api/thermal-printer/print/raw/${connectedUSBPrinter.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      })
      
      if (response.ok) {
        toast({
          title: "Print Successful",
          description: "Receipt printed via USB",
        })
      }
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Failed to print via USB",
        variant: "destructive",
      })
    }
  }, [connectedUSBPrinter, toast])

  return {
    usbPrinters,
    connectedUSBPrinter,
    isLoading,
    scanUSBPrinters,
    connectUSBPrinter,
    printViaUSB
  }
}