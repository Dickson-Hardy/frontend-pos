/**
 * Receipt Generation Engine
 * Converts receipt templates into ESC/POS commands for thermal printers
 */

import { thermalPrinterService } from './thermal-printer-web'

export interface ReceiptData {
  // Receipt header info
  outlet: {
    name: string
    address: string
    phone: string
    email: string
    licenseNumber?: string
  }
  
  // Transaction info
  transaction: {
    id: string
    date: Date
    cashier: string
    customer?: {
      name?: string
      phone?: string
      address?: string
    }
  }
  
  // Items
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
    total: number
    unit?: string
    barcode?: string
  }>
  
  // Totals
  totals: {
    subtotal: number
    tax: number
    discount: number
    total: number
  }
  
  // Payment
  payment: {
    method: string
    amount: number
    change: number
  }
  
  // Additional data
  notes?: string
  prescription?: {
    doctorName: string
    patientName: string
    instructions: string
  }
}

export interface ReceiptTemplate {
  id: string
  name: string
  elements: ReceiptElement[]
  paperConfig: {
    width: number // characters per line
    physicalWidth: number // mm
  }
  printerConfig: {
    type: string
    model: string
    commandSet: string
  }
}

export interface ReceiptElement {
  type: 'text' | 'logo' | 'line' | 'qr' | 'barcode' | 'items_table' | 'totals' | 'spacer' | 'image'
  content: string
  alignment: 'left' | 'center' | 'right'
  fontSize: 'small' | 'medium' | 'large'
  fontStyle: 'normal' | 'bold' | 'underline' | 'italic'
  bold: boolean
  underline: boolean
  height: number
  marginTop: number
  marginBottom: number
  properties: Record<string, any>
}

export class ReceiptGenerator {
  private readonly ESC = 0x1B
  private readonly GS = 0x1D
  private readonly LF = 0x0A
  private readonly CR = 0x0D

  /**
   * Generate receipt from template and data
   */
  async generateReceipt(template: ReceiptTemplate, data: ReceiptData): Promise<Uint8Array> {
    const commands: number[] = []
    
    // Initialize printer
    commands.push(this.ESC, 0x40) // Initialize
    commands.push(this.ESC, 0x74, 0x01) // Set character set to CP437
    
    // Process each template element
    for (const element of template.elements) {
      const elementCommands = await this.processElement(element, data, template.paperConfig.width)
      commands.push(...elementCommands)
    }
    
    // End with paper cut
    commands.push(this.GS, 0x56, 0x01) // Partial cut
    
    return new Uint8Array(commands)
  }

  /**
   * Process individual template element
   */
  private async processElement(element: ReceiptElement, data: ReceiptData, paperWidth: number): Promise<number[]> {
    const commands: number[] = []
    
    // Add top margin
    for (let i = 0; i < element.marginTop; i++) {
      commands.push(this.LF)
    }
    
    switch (element.type) {
      case 'text':
        commands.push(...this.generateTextElement(element, data, paperWidth))
        break
        
      case 'line':
        commands.push(...this.generateLineElement(element, paperWidth))
        break
        
      case 'spacer':
        commands.push(...this.generateSpacerElement(element))
        break
        
      case 'logo':
        commands.push(...await this.generateLogoElement(element, paperWidth))
        break
        
      case 'items_table':
        commands.push(...this.generateItemsTableElement(element, data, paperWidth))
        break
        
      case 'totals':
        commands.push(...this.generateTotalsElement(element, data, paperWidth))
        break
        
      case 'barcode':
        commands.push(...this.generateBarcodeElement(element, data))
        break
        
      case 'qr':
        commands.push(...this.generateQRElement(element, data))
        break
        
      default:
        // Fallback to text
        commands.push(...this.generateTextElement(element, data, paperWidth))
    }
    
    // Add bottom margin
    for (let i = 0; i < element.marginBottom; i++) {
      commands.push(this.LF)
    }
    
    return commands
  }

  /**
   * Generate text element
   */
  private generateTextElement(element: ReceiptElement, data: ReceiptData, paperWidth: number): number[] {
    const commands: number[] = []
    
    // Set alignment
    commands.push(this.ESC, 0x61, this.getAlignmentCode(element.alignment))
    
    // Set font size and style
    commands.push(...this.getFontCommands(element))
    
    // Process content with variable substitution
    const processedContent = this.substituteVariables(element.content, data)
    
    // Split text into lines that fit the paper width
    const lines = this.wrapText(processedContent, paperWidth, element.fontSize)
    
    for (const line of lines) {
      const textBytes = new TextEncoder().encode(line)
      commands.push(...Array.from(textBytes))
      commands.push(this.LF)
    }
    
    // Reset formatting
    commands.push(this.ESC, 0x21, 0x00) // Reset font
    
    return commands
  }

  /**
   * Generate line separator element
   */
  private generateLineElement(element: ReceiptElement, paperWidth: number): number[] {
    const commands: number[] = []
    
    commands.push(this.ESC, 0x61, this.getAlignmentCode(element.alignment))
    
    const lineChar = element.properties?.character || '-'
    const lineWidth = element.properties?.width || paperWidth
    const line = lineChar.repeat(Math.min(lineWidth, paperWidth))
    
    const textBytes = new TextEncoder().encode(line)
    commands.push(...Array.from(textBytes))
    commands.push(this.LF)
    
    return commands
  }

  /**
   * Generate spacer element
   */
  private generateSpacerElement(element: ReceiptElement): number[] {
    const commands: number[] = []
    const lines = element.height || 1
    
    for (let i = 0; i < lines; i++) {
      commands.push(this.LF)
    }
    
    return commands
  }

  /**
   * Generate logo element (placeholder for image printing)
   */
  private async generateLogoElement(element: ReceiptElement, paperWidth: number): Promise<number[]> {
    const commands: number[] = []
    
    // Center alignment for logo
    commands.push(this.ESC, 0x61, 0x01)
    
    // For now, print logo placeholder text
    // In a full implementation, this would process and print actual logo images
    const logoText = element.properties?.logoText || '[LOGO]'
    const textBytes = new TextEncoder().encode(logoText)
    commands.push(...Array.from(textBytes))
    commands.push(this.LF)
    
    return commands
  }

  /**
   * Generate items table
   */
  private generateItemsTableElement(element: ReceiptElement, data: ReceiptData, paperWidth: number): number[] {
    const commands: number[] = []
    
    // Left align for table
    commands.push(this.ESC, 0x61, 0x00)
    
    // Table header
    if (element.properties?.showHeader !== false) {
      const header = this.formatTableRow('Item', 'Qty', 'Price', 'Total', paperWidth)
      const headerBytes = new TextEncoder().encode(header)
      commands.push(...Array.from(headerBytes))
      commands.push(this.LF)
      
      // Header separator
      const separator = '-'.repeat(paperWidth)
      const separatorBytes = new TextEncoder().encode(separator)
      commands.push(...Array.from(separatorBytes))
      commands.push(this.LF)
    }
    
    // Items
    for (const item of data.items) {
      const itemName = this.truncateText(item.name, Math.floor(paperWidth * 0.4))
      const qty = item.quantity.toString()
      const price = this.formatCurrency(item.price)
      const total = this.formatCurrency(item.total)
      
      const row = this.formatTableRow(itemName, qty, price, total, paperWidth)
      const rowBytes = new TextEncoder().encode(row)
      commands.push(...Array.from(rowBytes))
      commands.push(this.LF)
    }
    
    return commands
  }

  /**
   * Generate totals section
   */
  private generateTotalsElement(element: ReceiptElement, data: ReceiptData, paperWidth: number): number[] {
    const commands: number[] = []
    
    // Right align for totals
    commands.push(this.ESC, 0x61, 0x02)
    
    const totals = [
      { label: 'Subtotal:', value: this.formatCurrency(data.totals.subtotal) },
      { label: 'Tax:', value: this.formatCurrency(data.totals.tax) },
      { label: 'Discount:', value: this.formatCurrency(data.totals.discount) },
      { label: 'TOTAL:', value: this.formatCurrency(data.totals.total), bold: true }
    ]
    
    for (const total of totals) {
      if (total.bold) {
        commands.push(this.ESC, 0x45, 0x01) // Bold on
      }
      
      const line = `${total.label.padEnd(15)} ${total.value}`
      const lineBytes = new TextEncoder().encode(line)
      commands.push(...Array.from(lineBytes))
      commands.push(this.LF)
      
      if (total.bold) {
        commands.push(this.ESC, 0x45, 0x00) // Bold off
      }
    }
    
    return commands
  }

  /**
   * Generate barcode element
   */
  private generateBarcodeElement(element: ReceiptElement, data: ReceiptData): number[] {
    const commands: number[] = []
    
    // Center align barcode
    commands.push(this.ESC, 0x61, 0x01)
    
    // Barcode settings
    commands.push(this.GS, 0x48, 0x02) // Print HRI below barcode
    commands.push(this.GS, 0x68, 0x50) // Barcode height
    commands.push(this.GS, 0x77, 0x02) // Barcode width
    
    // Print CODE128 barcode
    const barcodeData = this.substituteVariables(element.content, data)
    commands.push(this.GS, 0x6B, 0x49) // CODE128
    commands.push(barcodeData.length) // Data length
    
    const barcodeBytes = new TextEncoder().encode(barcodeData)
    commands.push(...Array.from(barcodeBytes))
    
    return commands
  }

  /**
   * Generate QR code element
   */
  private generateQRElement(element: ReceiptElement, data: ReceiptData): number[] {
    const commands: number[] = []
    
    // Center align QR code
    commands.push(this.ESC, 0x61, 0x01)
    
    const qrData = this.substituteVariables(element.content, data)
    
    // QR code settings (simplified - actual implementation depends on printer model)
    commands.push(this.GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00) // Model
    commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x03) // Size
    commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x30) // Error correction
    
    // QR data
    const dataLength = qrData.length + 3
    commands.push(this.GS, 0x28, 0x6B, dataLength & 0xFF, (dataLength >> 8) & 0xFF, 0x31, 0x50, 0x30)
    
    const qrBytes = new TextEncoder().encode(qrData)
    commands.push(...Array.from(qrBytes))
    
    // Print QR code
    commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30)
    
    return commands
  }

  /**
   * Substitute template variables with actual data
   */
  private substituteVariables(content: string, data: ReceiptData): string {
    const variables: Record<string, string> = {
      // Outlet variables
      '{{outlet.name}}': data.outlet.name,
      '{{outlet.address}}': data.outlet.address,
      '{{outlet.phone}}': data.outlet.phone,
      '{{outlet.email}}': data.outlet.email,
      '{{outlet.license}}': data.outlet.licenseNumber || '',
      
      // Transaction variables
      '{{transaction.id}}': data.transaction.id,
      '{{transaction.date}}': data.transaction.date.toLocaleDateString(),
      '{{transaction.time}}': data.transaction.date.toLocaleTimeString(),
      '{{transaction.cashier}}': data.transaction.cashier,
      
      // Customer variables
      '{{customer.name}}': data.transaction.customer?.name || '',
      '{{customer.phone}}': data.transaction.customer?.phone || '',
      
      // Totals variables
      '{{totals.subtotal}}': this.formatCurrency(data.totals.subtotal),
      '{{totals.tax}}': this.formatCurrency(data.totals.tax),
      '{{totals.discount}}': this.formatCurrency(data.totals.discount),
      '{{totals.total}}': this.formatCurrency(data.totals.total),
      
      // Payment variables
      '{{payment.method}}': data.payment.method,
      '{{payment.amount}}': this.formatCurrency(data.payment.amount),
      '{{payment.change}}': this.formatCurrency(data.payment.change),
      
      // Dynamic variables
      '{{current.date}}': new Date().toLocaleDateString(),
      '{{current.time}}': new Date().toLocaleTimeString(),
    }
    
    let result = content
    for (const [variable, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value)
    }
    
    return result
  }

  /**
   * Helper functions
   */
  private getAlignmentCode(alignment: string): number {
    switch (alignment) {
      case 'center': return 0x01
      case 'right': return 0x02
      default: return 0x00 // left
    }
  }

  private getFontCommands(element: ReceiptElement): number[] {
    let fontCode = 0x00
    
    // Font size
    if (element.fontSize === 'large') {
      fontCode |= 0x11 // Double height and width
    } else if (element.fontSize === 'medium') {
      fontCode |= 0x01 // Double height
    }
    
    // Bold
    if (element.bold || element.fontStyle === 'bold') {
      fontCode |= 0x08
    }
    
    return [this.ESC, 0x21, fontCode]
  }

  private wrapText(text: string, maxWidth: number, fontSize: string): string[] {
    // Adjust max width based on font size
    let adjustedWidth = maxWidth
    if (fontSize === 'large') {
      adjustedWidth = Math.floor(maxWidth / 2)
    }
    
    const lines: string[] = []
    const words = text.split(' ')
    let currentLine = ''
    
    for (const word of words) {
      if ((currentLine + word).length <= adjustedWidth) {
        currentLine += (currentLine ? ' ' : '') + word
      } else {
        if (currentLine) {
          lines.push(currentLine)
        }
        currentLine = word
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines.length > 0 ? lines : ['']
  }

  private formatTableRow(col1: string, col2: string, col3: string, col4: string, totalWidth: number): string {
    const col1Width = Math.floor(totalWidth * 0.4)
    const col2Width = Math.floor(totalWidth * 0.1)
    const col3Width = Math.floor(totalWidth * 0.2)
    const col4Width = totalWidth - col1Width - col2Width - col3Width
    
    return (
      this.truncateText(col1, col1Width).padEnd(col1Width) +
      this.truncateText(col2, col2Width).padStart(col2Width) +
      this.truncateText(col3, col3Width).padStart(col3Width) +
      this.truncateText(col4, col4Width).padStart(col4Width)
    )
  }

  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text
  }

  private formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`
  }
}

// Export singleton instance
export const receiptGenerator = new ReceiptGenerator()