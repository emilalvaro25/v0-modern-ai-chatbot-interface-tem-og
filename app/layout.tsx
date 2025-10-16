import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { TranslationProvider } from "@/contexts/TranslationContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "Eburon AI - Powered by Ollama Cloud",
  description: "Intelligent AI assistant powered by Ollama Cloud models",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <TranslationProvider>
          <Suspense fallback={<div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950" />}>{children}</Suspense>
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  )
}
