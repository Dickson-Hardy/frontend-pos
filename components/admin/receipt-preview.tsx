"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Printer, 
  Download, 
  Share2, 
  ZoomIn, 
  ZoomOut,
  RotateCcw,
  Smartphone,
  Monitor,
  Bluetooth,
  Usb
} from "lucide-react"

interface ReceiptPreviewProps {
  template: any
  receiptData: any
  onPrint?: (printerType: 'bluetooth' | 'usb') => void
  className?: string
}

export function ReceiptPreview({ 
  template, 
  receiptData, 
  onPrint,
  className = "" 
}: ReceiptPreviewProps) {
  const [scale, setScale] = useState(1)
  const [previewMode, setPreviewMode] = useState<'thermal' | 'web'>('thermal')
  const [generatedReceipt, setGeneratedReceipt] = useState<string>('')

  useEffect(() => {
    if (template && receiptData) {
      generatePreview()
    }
  }, [template, receiptData])

  const generatePreview = () => {
    if (!receiptData || !receiptData.items || receiptData.items.length === 0) {
      setGeneratedReceipt("No receipt data available for preview")
      return
    }
    
    // Generate receipt from actual data
    const receipt = generateReceiptFromData()
    setGeneratedReceipt(receipt)
  }

  const generateReceiptFromData = () => {
    const lines: string[] = []
    const width = template?.paperConfig?.width || 32

    // Store header
    lines.push(centerText("PHARMACY POS", width))
    lines.push(centerText("123 Health Street", width))
    lines.push(centerText("Medical District, CA 90210", width))
    lines.push(centerText("Phone: (555) 0101", width))
    lines.push('')
    lines.push('-'.repeat(width))
    lines.push('')

    // Transaction info
    lines.push(`Date: ${receiptData?.transaction?.date ? new Date(receiptData.transaction.date).toLocaleDateString() : new Date().toLocaleDateString()}`)
    lines.push(`Time: ${receiptData?.transaction?.time ? new Date(receiptData.transaction.time).toLocaleTimeString() : new Date().toLocaleTimeString()}`)
    lines.push(`Receipt: #${receiptData?.transaction?.id || 'TXN001'}`)
    lines.push(`Cashier: ${receiptData?.transaction?.cashier || 'Unknown'}`)
    lines.push('')
    lines.push('-'.repeat(width))
    lines.push('')

    // Items
    lines.push('ITEMS:')
    lines.push('')
    
    if (receiptData?.items && receiptData.items.length > 0) {
      receiptData.items.forEach((item: any) => {
        const itemLine = formatItemLine(item.name, item.quantity, item.total, width)
        lines.push(itemLine.name)
        lines.push(itemLine.details)
      })
    } else {
      lines.push('No items available')
    }

    lines.push('')
    lines.push('-'.repeat(width))
    lines.push('')

    // Totals
    const totals = receiptData?.totals || {
      subtotal: 0,
      tax: 0,
      discount: 0,
      total: 0
    }

    lines.push(rightAlign(`Subtotal: $${totals.subtotal.toFixed(2)}`, width))
    lines.push(rightAlign(`Tax: $${totals.tax.toFixed(2)}`, width))
    if (totals.discount > 0) {
      lines.push(rightAlign(`Discount: -$${totals.discount.toFixed(2)}`, width))
    }
    lines.push(rightAlign(`TOTAL: $${totals.total.toFixed(2)}`, width))
    lines.push('')

    // Payment
    const payment = receiptData?.payment || { method: 'Cash', amount: 0, change: 0 }
    lines.push(rightAlign(`Paid (${payment.method}): $${payment.amount.toFixed(2)}`, width))
    lines.push(rightAlign(`Change: $${payment.change.toFixed(2)}`, width))
    lines.push('')
    lines.push('-'.repeat(width))
    lines.push('')

    // Footer
    lines.push(centerText("Thank you for your business!", width))
    lines.push(centerText("Have a healthy day!", width))
    lines.push('')
    lines.push(centerText("www.pharmacypos.com", width))
    lines.push('')

    return lines.join('\n')
  }

  const centerText = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    const padding = Math.floor((width - text.length) / 2)
    return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding)
  }

  const rightAlign = (text: string, width: number): string => {
    if (text.length >= width) return text.substring(0, width)
    return ' '.repeat(width - text.length) + text
  }

  const formatItemLine = (name: string, quantity: number, total: number, width: number) => {
    const maxNameWidth = width - 2
    const truncatedName = name.length > maxNameWidth ? name.substring(0, maxNameWidth - 3) + '...' : name
    const details = `  ${quantity}x @ $${(total / quantity).toFixed(2)} = $${total.toFixed(2)}`
    
    return {
      name: truncatedName,
      details: rightAlign(details, width)
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleReset = () => {
    setScale(1)
  }

  const handlePrint = (type: 'bluetooth' | 'usb') => {
    onPrint?.(type)
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Preview Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Receipt Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {previewMode === 'thermal' ? 'Thermal Printer' : 'Web Display'}
              </Badge>
              <Badge variant="secondary">
                {template?.paperConfig?.width || 32} chars
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={previewMode === 'thermal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('thermal')}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Thermal
            </Button>
            <Button
              variant={previewMode === 'web' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('web')}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              Web
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex gap-2 items-center">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Print Actions */}
          <div className="flex gap-2">
            <Button onClick={() => handlePrint('bluetooth')} className="gap-2">
              <Bluetooth className="h-4 w-4" />
              Print via Bluetooth
            </Button>
            <Button onClick={() => handlePrint('usb')} variant="outline" className="gap-2">
              <Usb className="h-4 w-4" />
              Print via USB
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Preview */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <div className="p-6 flex justify-center">
              <div 
                className={`
                  ${previewMode === 'thermal' ? 'bg-white border border-gray-300 shadow-lg' : 'bg-gray-50 border border-gray-200'}
                  transition-all duration-200 font-mono text-sm leading-tight
                `}
                style={{ 
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  width: previewMode === 'thermal' ? '58mm' : '300px',
                  maxWidth: previewMode === 'thermal' ? '58mm' : '300px',
                  minHeight: '200px',
                  padding: '8mm 4mm'
                }}
              >
                {/* Thermal Printer Preview */}
                {previewMode === 'thermal' && (
                  <div className="whitespace-pre-wrap text-xs">
                    {generatedReceipt}
                  </div>
                )}

                {/* Web Display Preview */}
                {previewMode === 'web' && (
                  <div className="space-y-4 text-sm">
                    <div className="text-center">
                      <h2 className="font-bold text-lg">PHARMACY POS</h2>
                      <p className="text-gray-600">123 Health Street</p>
                      <p className="text-gray-600">Medical District, CA 90210</p>
                      <p className="text-gray-600">Phone: (555) 0101</p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Date: {new Date().toLocaleDateString()}</div>
                      <div>Time: {new Date().toLocaleTimeString()}</div>
                      <div>Receipt: #{receiptData?.transaction?.id || 'TXN001'}</div>
                      <div>Cashier: {receiptData?.transaction?.cashier || 'John Doe'}</div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-2">Items</h3>
                      <div className="space-y-2">
                        {receiptData?.items?.length > 0 ? receiptData.items.map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-gray-600 text-sm">
                                {item.quantity}x @ ${(item.total / item.quantity).toFixed(2)}
                              </div>
                            </div>
                            <div className="font-medium">${item.total.toFixed(2)}</div>
                          </div>
                        )) : (
                          <div className="text-gray-500 text-center py-4">
                            No items in receipt
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>${(receiptData?.totals?.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${(receiptData?.totals?.tax || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg">
                        <span>TOTAL:</span>
                        <span>${(receiptData?.totals?.total || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="text-center text-gray-600">
                      <p>Thank you for your business!</p>
                      <p>Have a healthy day!</p>
                      <p className="mt-2">www.pharmacypos.com</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Template Info */}
      {template && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Template Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Template:</span> {template.name}
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span> {template.version}
              </div>
              <div>
                <span className="text-muted-foreground">Paper Width:</span> {template.paperConfig?.width} chars
              </div>
              <div>
                <span className="text-muted-foreground">Printer Model:</span> {template.printerConfig?.model}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}