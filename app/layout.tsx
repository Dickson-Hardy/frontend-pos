import type React from "react"
import type { Metadata, Viewport } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display, Source_Sans_3 as Source_Sans_Pro } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { RealTimeProvider } from "@/contexts/real-time-context"
import { ErrorProvider } from "@/contexts/error-context"
import { LoadingProvider } from "@/contexts/loading-context"
import { ShiftProvider } from "@/contexts/shift-context"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { NetworkStatus } from "@/components/ui/error-message"
import { Toaster } from "@/components/ui/sonner"
import { TokenSync } from "@/components/auth/token-sync"
import { SessionExpiryWarning } from "@/components/auth/session-expiry-warning"
import { AuthRecovery } from "@/components/auth/auth-recovery"
import "./globals.css"

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "700"],
})

const sourceSansPro = Source_Sans_Pro({
  subsets: ["latin"],
  variable: "--font-source-sans",
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "PharmaPOS - Pharmacy Management System",
  description: "Professional pharmacy point of sale and management system with mobile barcode scanning",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PharmaPOS"
  },
  formatDetection: {
    telephone: false
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "PharmaPOS",
    "application-name": "PharmaPOS",
    "msapplication-TileColor": "#2563eb",
    "msapplication-tap-highlight": "no"
  }
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#2563eb"
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${playfairDisplay.variable} ${sourceSansPro.variable}`}
      >
        <ErrorBoundary level="global" showHomeButton>
          <ErrorProvider>
            <LoadingProvider>
              <AuthProvider>
                <TokenSync />
                <AuthRecovery />
                <SessionExpiryWarning />
                <ShiftProvider>
                  <RealTimeProvider>
                  <NetworkStatus />
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                  </div>}>
                    {children}
                  </Suspense>
                  <Toaster />
                  </RealTimeProvider>
                </ShiftProvider>
              </AuthProvider>
            </LoadingProvider>
          </ErrorProvider>
        </ErrorBoundary>
        <Analytics />
      </body>
    </html>
  )
}
