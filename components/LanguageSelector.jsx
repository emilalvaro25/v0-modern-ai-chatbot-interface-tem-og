"use client"
import { useState } from "react"
import { Globe, Check } from "lucide-react"
import { LANGUAGES } from "@/lib/languages"
import { useTranslation } from "@/contexts/TranslationContext"

export default function LanguageSelector({ onClose }) {
  const { language, setLanguage } = useTranslation()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredLanguages = LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleLanguageSelect = (langCode) => {
    setLanguage(langCode)
    onClose?.()
  }

  return (
    <div className="w-96 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-lg">Select Language</h3>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search languages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Language List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageSelect(lang.code)}
            className={`w-full flex items-center justify-between p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ${
              language === lang.code ? "bg-emerald-50 dark:bg-emerald-900/20" : ""
            }`}
          >
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{lang.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{lang.nativeName}</span>
            </div>
            {language === lang.code && <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 text-center">
        {filteredLanguages.length} languages available • Auto-translation enabled
      </div>
    </div>
  )
}
