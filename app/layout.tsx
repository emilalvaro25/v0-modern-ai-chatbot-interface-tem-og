import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { TranslationProvider } from "@/contexts/TranslationContext"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Eburon AI - The Fire Reborn",
  description: "Intelligent AI assistant created by Emilio AI",
  generator: "Eburon AI",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans">
        <TranslationProvider>
          <Suspense fallback={<div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950" />}>{children}</Suspense>
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  )
}
