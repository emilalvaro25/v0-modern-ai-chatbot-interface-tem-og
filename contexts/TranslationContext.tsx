"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { detectBrowserLanguage } from "@/lib/languages"

interface TranslationContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (text: string) => Promise<string>
  isTranslating: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Translation cache to avoid re-translating the same text
const translationCache: Record<string, Record<string, string>> = {}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState("en")
  const [isTranslating, setIsTranslating] = useState(false)

  useEffect(() => {
    // Load saved language or detect browser language
    const savedLang = localStorage.getItem("eburon_language")
    if (savedLang) {
      setLanguageState(savedLang)
    } else {
      const detected = detectBrowserLanguage()
      setLanguageState(detected)
      localStorage.setItem("eburon_language", detected)
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem("eburon_language", lang)
    // Clear cache when language changes
    if (translationCache[lang]) {
      delete translationCache[lang]
    }
  }

  const t = async (text: string): Promise<string> => {
    // If English or no translation needed, return original
    if (language === "en" || !text || text.trim() === "") return text

    // Check cache first
    if (translationCache[language]?.[text]) {
      return translationCache[language][text]
    }

    try {
      setIsTranslating(true)

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetLang: language, sourceLang: "en" }),
      })

      const data = await response.json()
      const translated = data.translatedText || text

      // Cache the translation
      if (!translationCache[language]) {
        translationCache[language] = {}
      }
      translationCache[language][text] = translated

      setIsTranslating(false)
      return translated
    } catch (error) {
      console.error("[v0] Translation error:", error)
      setIsTranslating(false)
      return text
    }
  }

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider")
  }
  return context
}
