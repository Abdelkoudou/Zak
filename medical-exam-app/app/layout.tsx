import type React from "react"
import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Manrope } from "next/font/google"
import { AuthProvider } from "@/components/auth-provider"
import "./globals.css"

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist",
})

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
})

export const metadata: Metadata = {
  title: "MedExam Pro - Medical Exam Preparation",
  description: "Comprehensive MCQ practice app for medical students",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#01d2aa",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedExam Pro",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${manrope.variable} antialiased`}>
      <body className="font-sans bg-background text-foreground min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
