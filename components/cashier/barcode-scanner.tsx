'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Camera, X, Flashlight, FlashlightOff } from 'lucide-react'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  isOpen: boolean
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFlashlight, setHasFlashlight] = useState(false)
  const [flashlightOn, setFlashlightOn] = useState(false)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const codeReader = useRef<BrowserMultiFormatReader | null>(null)

  useEffect(() => {
    if (isOpen) {
      startScanning()
    } else {
      stopScanning()
    }

    return () => {
      stopScanning()
    }
  }, [isOpen])

  const startScanning = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Initialize the code reader
      codeReader.current = new BrowserMultiFormatReader()

      // Get available video devices
      const videoInputDevices = await codeReader.current.listVideoInputDevices()
      
      if (videoInputDevices.length === 0) {
        throw new Error('No camera devices found')
      }

      // Prefer back camera for mobile devices
      const backCamera = videoInputDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      ) || videoInputDevices[0]

      // Start scanning
      const constraints = {
        video: {
          deviceId: backCamera.deviceId,
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      setStream(mediaStream)

      // Check if flashlight is available
      const track = mediaStream.getVideoTracks()[0]
      const capabilities = track.getCapabilities()
      setHasFlashlight('torch' in capabilities)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        
        // Start decoding
        codeReader.current.decodeFromVideoDevice(
          backCamera.deviceId,
          videoRef.current,
          (result, error) => {
            if (result) {
              // Success! Found a barcode
              const barcode = result.getText()
              onScan(barcode)
              
              // Play success sound
              playSuccessSound()
              
              // Vibrate if available
              if (navigator.vibrate) {
                navigator.vibrate(200)
              }
            }
            
            if (error && !(error instanceof NotFoundException)) {
              console.warn('Barcode scan error:', error)
            }
          }
        )
      }
    } catch (err) {
      console.error('Error starting barcode scanner:', err)
      setError(err instanceof Error ? err.message : 'Failed to start camera')
      setIsScanning(false)
    }
  }

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset()
      codeReader.current = null
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop())
      setStream(null)
    }

    setIsScanning(false)
    setFlashlightOn(false)
  }

  const toggleFlashlight = async () => {
    if (!stream || !hasFlashlight) return

    try {
      const track = stream.getVideoTracks()[0]
      await track.applyConstraints({
        advanced: [{ torch: !flashlightOn }]
      })
      setFlashlightOn(!flashlightOn)
    } catch (err) {
      console.error('Error toggling flashlight:', err)
    }
  }

  const playSuccessSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'square'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 p-4">
        <div className="flex items-center justify-between text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Scan Barcode
          </h2>
          <div className="flex items-center gap-2">
            {hasFlashlight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleFlashlight}
                className="text-white hover:bg-white/20"
              >
                {flashlightOn ? (
                  <FlashlightOff className="w-5 h-5" />
                ) : (
                  <Flashlight className="w-5 h-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Camera View */}
      <div className="relative w-full h-full">
        {isScanning && !error ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            
            {/* Scanning Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                {/* Scanning Frame */}
                <div className="w-64 h-64 border-2 border-white/50 relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400"></div>
                  
                  {/* Scanning Line Animation */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="w-full h-0.5 bg-green-400 animate-pulse"></div>
                  </div>
                </div>
                
                <p className="text-white text-center mt-4 text-sm">
                  Position barcode within the frame
                </p>
              </div>
            </div>
          </>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-6 m-4 max-w-sm">
              <div className="text-center">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Camera Error</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={startScanning} className="w-full">
                  Try Again
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white text-center">
              <Camera className="w-12 h-12 mx-auto mb-4" />
              <p>Starting camera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-4">
        <p className="text-white text-center text-sm">
          Point your camera at a barcode to scan it automatically
        </p>
      </div>
    </div>
  )
}