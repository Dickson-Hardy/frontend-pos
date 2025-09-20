/**
 * Thermal Printer Service for Web Browsers
 * Supports XPrinter thermal printers via Web Bluetooth API
 */

export interface PrinterDevice {
  id: string
  name: string
  type: 'bluetooth' | 'usb' | 'network'
  status: 'connected' | 'disconnected' | 'error'
  model?: string
  characteristics?: {
    writeCharacteristic?: BluetoothRemoteGATTCharacteristic
    notifyCharacteristic?: BluetoothRemoteGATTCharacteristic
  }
}

export interface PrintJob {
  id: string
  data: Uint8Array
  status: 'pending' | 'printing' | 'completed' | 'failed'
  error?: string
  progress?: number
}

export interface PrinterCapabilities {
  maxWidth: number // characters per line
  supportsBold: boolean
  supportsUnderline: boolean
  supportsBarcode: boolean
  supportsQR: boolean
  supportsGraphics: boolean
  paperSizes: string[]
}

export class ThermalPrinterService {
  private device: BluetoothDevice | null = null
  private server: BluetoothRemoteGATTServer | null = null
  private service: BluetoothRemoteGATTService | null = null
  private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  private notifyCharacteristic: BluetoothRemoteGATTCharacteristic | null = null
  
  // XPrinter service UUIDs (common thermal printer UUIDs)
  private readonly PRINTER_SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
  private readonly WRITE_CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'
  private readonly NOTIFY_CHARACTERISTIC_UUID = '00002af0-0000-1000-8000-00805f9b34fb'
  
  // Alternative UUIDs for different printer models
  private readonly ALTERNATIVE_UUIDS = [
    {
      service: '000018f0-0000-1000-8000-00805f9b34fb',
      write: '00002af1-0000-1000-8000-00805f9b34fb',
      notify: '00002af0-0000-1000-8000-00805f9b34fb'
    },
    {
      service: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
      write: '49535343-8841-43f4-a8d4-ecbe34729bb3',
      notify: '49535343-1e4d-4bd9-ba61-23c647249616'
    }
  ]

  private eventListeners: Map<string, Function[]> = new Map()

  constructor() {
    this.initializeEventListeners()
  }

  /**
   * Check if Web Bluetooth is supported
   */
  isBluetoothSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator
  }

  /**
   * Scan for available thermal printers
   */
  async scanForPrinters(): Promise<PrinterDevice[]> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported in this browser')
    }

    try {
      const devices: PrinterDevice[] = []
      
      // Try each UUID set to find compatible printers
      for (const uuidSet of this.ALTERNATIVE_UUIDS) {
        try {
          const device = await navigator.bluetooth.requestDevice({
            filters: [
              { services: [uuidSet.service] },
              { namePrefix: 'XPrinter' },
              { namePrefix: 'Thermal' },
              { namePrefix: 'POS' }
            ],
            optionalServices: [uuidSet.service]
          })

          if (device) {
            devices.push({
              id: device.id,
              name: device.name || 'Unknown Printer',
              type: 'bluetooth',
              status: 'disconnected',
              model: this.detectPrinterModel(device.name || '')
            })
          }
        } catch (error) {
          console.log(`Failed to scan with UUID set: ${uuidSet.service}`)
        }
      }

      return devices
    } catch (error) {
      console.error('Failed to scan for printers:', error)
      throw new Error('Failed to scan for printers. Please ensure Bluetooth is enabled.')
    }
  }

  /**
   * Connect to a thermal printer
   */
  async connect(deviceId?: string): Promise<PrinterDevice> {
    if (!this.isBluetoothSupported()) {
      throw new Error('Web Bluetooth is not supported')
    }

    try {
      // If no device ID provided, request device selection
      if (!deviceId) {
        this.device = await navigator.bluetooth.requestDevice({
          filters: [
            { namePrefix: 'XPrinter' },
            { namePrefix: 'Thermal' },
            { namePrefix: 'POS' }
          ],
          optionalServices: this.ALTERNATIVE_UUIDS.map(u => u.service)
        })
      } else {
        // Connect to specific device (implementation depends on how you store device references)
        throw new Error('Connecting to specific device ID not yet implemented')
      }

      if (!this.device) {
        throw new Error('No device selected')
      }

      this.emit('connecting', { deviceId: this.device.id })

      // Connect to GATT server
      this.server = await this.device.gatt!.connect()
      
      // Try to connect with different UUID sets
      let connected = false
      for (const uuidSet of this.ALTERNATIVE_UUIDS) {
        try {
          this.service = await this.server.getPrimaryService(uuidSet.service)
          this.writeCharacteristic = await this.service.getCharacteristic(uuidSet.write)
          
          try {
            this.notifyCharacteristic = await this.service.getCharacteristic(uuidSet.notify)
            await this.notifyCharacteristic.startNotifications()
            this.notifyCharacteristic.addEventListener('characteristicvaluechanged', this.handleNotification.bind(this))
          } catch (notifyError) {
            console.log('Notify characteristic not available')
          }
          
          connected = true
          break
        } catch (error) {
          console.log(`Failed to connect with UUID set: ${uuidSet.service}`)
        }
      }

      if (!connected) {
        throw new Error('Unable to connect to printer service')
      }

      // Add disconnect listener
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect.bind(this))

      const printerDevice: PrinterDevice = {
        id: this.device.id,
        name: this.device.name || 'Unknown Printer',
        type: 'bluetooth',
        status: 'connected',
        model: this.detectPrinterModel(this.device.name || ''),
        characteristics: {
          writeCharacteristic: this.writeCharacteristic,
          notifyCharacteristic: this.notifyCharacteristic || undefined
        }
      }

      this.emit('connected', printerDevice)
      return printerDevice

    } catch (error) {
      console.error('Connection failed:', error)
      this.emit('error', { error: error.message })
      throw new Error(`Failed to connect to printer: ${error.message}`)
    }
  }

  /**
   * Disconnect from the printer
   */
  async disconnect(): Promise<void> {
    try {
      if (this.notifyCharacteristic) {
        await this.notifyCharacteristic.stopNotifications()
        this.notifyCharacteristic.removeEventListener('characteristicvaluechanged', this.handleNotification.bind(this))
      }
      
      if (this.server && this.server.connected) {
        this.server.disconnect()
      }
    } catch (error) {
      console.error('Disconnect error:', error)
    } finally {
      this.device = null
      this.server = null
      this.service = null
      this.writeCharacteristic = null
      this.notifyCharacteristic = null
      this.emit('disconnected')
    }
  }

  /**
   * Check if printer is connected
   */
  isConnected(): boolean {
    return this.server?.connected === true && this.writeCharacteristic !== null
  }

  /**
   * Get printer capabilities
   */
  getPrinterCapabilities(): PrinterCapabilities {
    // Default capabilities for XPrinter thermal printers
    return {
      maxWidth: 32, // 58mm paper
      supportsBold: true,
      supportsUnderline: true,
      supportsBarcode: true,
      supportsQR: true,
      supportsGraphics: true,
      paperSizes: ['58mm', '80mm']
    }
  }

  /**
   * Print raw data
   */
  async printRaw(data: Uint8Array): Promise<PrintJob> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected')
    }

    const jobId = this.generateJobId()
    const printJob: PrintJob = {
      id: jobId,
      data,
      status: 'pending'
    }

    try {
      this.emit('printStarted', printJob)
      printJob.status = 'printing'

      // Send data in chunks (Bluetooth has MTU limitations)
      const chunkSize = 20 // Conservative chunk size for Bluetooth
      const totalChunks = Math.ceil(data.length / chunkSize)
      
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize
        const end = Math.min(start + chunkSize, data.length)
        const chunk = data.slice(start, end)
        
        await this.writeCharacteristic!.writeValue(chunk)
        
        printJob.progress = Math.round(((i + 1) / totalChunks) * 100)
        this.emit('printProgress', printJob)
        
        // Small delay between chunks to avoid overwhelming the printer
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      printJob.status = 'completed'
      this.emit('printCompleted', printJob)
      
      return printJob

    } catch (error) {
      printJob.status = 'failed'
      printJob.error = error.message
      this.emit('printFailed', printJob)
      throw error
    }
  }

  /**
   * Print text with ESC/POS commands
   */
  async printText(text: string, options: {
    align?: 'left' | 'center' | 'right'
    bold?: boolean
    underline?: boolean
    fontSize?: 'normal' | 'large'
    lineFeed?: number
  } = {}): Promise<PrintJob> {
    const commands: number[] = []
    
    // Initialize printer
    commands.push(...this.ESC_POS.INIT)
    
    // Set alignment
    if (options.align === 'center') {
      commands.push(...this.ESC_POS.ALIGN_CENTER)
    } else if (options.align === 'right') {
      commands.push(...this.ESC_POS.ALIGN_RIGHT)
    } else {
      commands.push(...this.ESC_POS.ALIGN_LEFT)
    }
    
    // Set text style
    if (options.bold) {
      commands.push(...this.ESC_POS.BOLD_ON)
    }
    
    if (options.underline) {
      commands.push(...this.ESC_POS.UNDERLINE_ON)
    }
    
    if (options.fontSize === 'large') {
      commands.push(...this.ESC_POS.FONT_SIZE_LARGE)
    }
    
    // Add text
    const textBytes = new TextEncoder().encode(text)
    commands.push(...Array.from(textBytes))
    
    // Reset formatting
    commands.push(...this.ESC_POS.RESET_FORMAT)
    
    // Add line feeds
    const lineFeeds = options.lineFeed || 1
    for (let i = 0; i < lineFeeds; i++) {
      commands.push(...this.ESC_POS.LINE_FEED)
    }

    return this.printRaw(new Uint8Array(commands))
  }

  /**
   * Cut paper
   */
  async cutPaper(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Printer not connected')
    }

    const cutCommands = new Uint8Array(this.ESC_POS.CUT_PAPER)
    await this.writeCharacteristic!.writeValue(cutCommands)
  }

  /**
   * ESC/POS command constants
   */
  private readonly ESC_POS = {
    INIT: [0x1B, 0x40], // Initialize printer
    LINE_FEED: [0x0A], // Line feed
    ALIGN_LEFT: [0x1B, 0x61, 0x00],
    ALIGN_CENTER: [0x1B, 0x61, 0x01],
    ALIGN_RIGHT: [0x1B, 0x61, 0x02],
    BOLD_ON: [0x1B, 0x45, 0x01],
    BOLD_OFF: [0x1B, 0x45, 0x00],
    UNDERLINE_ON: [0x1B, 0x2D, 0x01],
    UNDERLINE_OFF: [0x1B, 0x2D, 0x00],
    FONT_SIZE_NORMAL: [0x1B, 0x21, 0x00],
    FONT_SIZE_LARGE: [0x1B, 0x21, 0x11],
    RESET_FORMAT: [0x1B, 0x21, 0x00],
    CUT_PAPER: [0x1D, 0x56, 0x01],
    DRAWER_OPEN: [0x1B, 0x70, 0x00, 0x19, 0xFA]
  }

  /**
   * Event handling
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  private initializeEventListeners(): void {
    // Initialize event listener arrays
    ;['connecting', 'connected', 'disconnected', 'error', 'printStarted', 'printProgress', 'printCompleted', 'printFailed']
      .forEach(event => this.eventListeners.set(event, []))
  }

  private handleDisconnect(): void {
    console.log('Printer disconnected')
    this.emit('disconnected')
  }

  private handleNotification(event: Event): void {
    const target = event.target as BluetoothRemoteGATTCharacteristic
    const value = target.value
    if (value) {
      const data = new Uint8Array(value.buffer)
      this.emit('notification', data)
    }
  }

  private detectPrinterModel(deviceName: string): string {
    const name = deviceName.toLowerCase()
    if (name.includes('xprinter')) {
      if (name.includes('58')) return 'XPrinter 58mm'
      if (name.includes('80')) return 'XPrinter 80mm'
      return 'XPrinter'
    }
    return 'Unknown'
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const thermalPrinterService = new ThermalPrinterService()