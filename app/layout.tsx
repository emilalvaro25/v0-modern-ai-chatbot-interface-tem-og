import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { TranslationProvider } from "@/contexts/TranslationContext"
import "./globals.css"

// Using system fonts as fallback when Google Fonts are not available
const fontVariables = {
  sans: 'var(--font-sans, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif)',
  mono: 'var(--font-mono, ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace)',
}

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
    <html lang="en">
      <body className="font-sans" style={{ fontFamily: fontVariables.sans }}>
        <TranslationProvider>
          <Suspense fallback={<div className="h-screen w-full bg-zinc-50 dark:bg-zinc-950" />}>{children}</Suspense>
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  )
}
