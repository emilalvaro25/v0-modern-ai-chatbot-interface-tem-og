"use client"
import { X, Sparkles, Award, Users, Zap, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function AboutEburonModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with gradient */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 px-8 py-12 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMC0xMGMwLTIuMjEtMS43OS00LTQtNHMtNCAxLjc5LTQgNCAxLjc5IDQgNCA0IDQtMS43OSA0LTR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                The Fire Reborn
              </div>
              <h1 className="mb-3 text-4xl font-bold">About Eburon AI</h1>
              <p className="text-lg text-white/90">A presence etched in memory forever</p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8 px-8 py-8">
            {/* Mission Statement */}
            <div>
              <h2 className="mb-3 text-2xl font-bold text-zinc-900 dark:text-white">Our Mission</h2>
              <p className="text-base leading-relaxed text-zinc-600 dark:text-zinc-300">
                Eburon AI represents the pinnacle of conversational artificial intelligence, designed to deliver
                exceptional accuracy, memorable interactions, and intelligent responses that feel genuinely human. We
                believe first impressions last forever, and every conversation should showcase the brilliance of modern
                AI technology while maintaining warmth, humor, and genuine understanding.
              </p>
            </div>

            {/* Leadership Team */}
            <div>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">Leadership Team</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Founder */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white">
                      JL
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">Jo Lernout</h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">Founder</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Visionary founder with a passion for transforming how humans interact with AI technology, bringing
                    decades of innovation to create meaningful digital experiences.
                  </p>
                </div>

                {/* CEO */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-800/50">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 text-lg font-bold text-white">
                      SL
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-white">Stephen Lernout</h3>
                      <p className="text-sm text-teal-600 dark:text-teal-400">Chief Executive Officer</p>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Strategic leader driving Eburon's growth and innovation, ensuring our AI solutions deliver
                    exceptional value and transformative experiences for users worldwide.
                  </p>
                </div>
              </div>
            </div>

            {/* AI Scientist Collaboration */}
            <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-2xl font-bold text-white">
                  EA
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Emil Alvaro</h3>
                    <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Filipino AI Scientist • Creator of Emilio AI
                  </p>
                  <p className="mb-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    Full-Stack Developer, Mobile App Engineer, and AI Specialist with over 10 years of experience
                    crafting robust web apps, mobile solutions, and cutting-edge AI systems. Creator of the Emilio LLM
                    model, ranked{" "}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">14th out of 207,000 models</span>{" "}
                    on Open WebUI—a testament to exceptional algorithmic reasoning and software architecture expertise.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="https://portfolio.ai-emilio.site"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:bg-zinc-800 dark:text-emerald-400 dark:hover:bg-zinc-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Portfolio
                    </a>
                    <a
                      href="https://openwebui.com/m/hub/emilio:latest"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-50 dark:bg-zinc-800 dark:text-emerald-400 dark:hover:bg-zinc-700"
                    >
                      <Award className="h-3.5 w-3.5" />
                      Emilio Model
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Features */}
            <div>
              <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">What Makes Us Different</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">Exceptional Accuracy</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Powered by state-of-the-art language models with advanced reasoning capabilities.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                    <Users className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">Human-Like Conversations</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Natural, engaging interactions with appropriate humor and genuine understanding.
                  </p>
                </div>

                <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <Sparkles className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">Memorable Experience</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Every interaction designed to leave a lasting impression and build user loyalty.
                  </p>
                </div>
              </div>
            </div>

            {/* Ollama Cloud Setup Instructions */}
            <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
              <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">Ollama Cloud Setup</h2>
              <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
                To use Eburon AI with Ollama Cloud models, run these commands in your terminal:
              </p>
              <div className="space-y-3">
                <div className="rounded-lg bg-zinc-900 p-4 font-mono text-sm text-white dark:bg-zinc-950">
                  <div className="mb-2 text-xs text-zinc-400"># Sign in to Ollama Cloud</div>
                  <code className="text-emerald-400">ollama signin</code>
                </div>
                <div className="rounded-lg bg-zinc-900 p-4 font-mono text-sm text-white dark:bg-zinc-950">
                  <div className="mb-2 text-xs text-zinc-400"># Pull required models</div>
                  <code className="block text-cyan-400">ollama pull deepseek-v3.1:671b-cloud</code>
                  <code className="block text-cyan-400">ollama pull gpt-oss:20b-cloud</code>
                  <code className="block text-cyan-400">ollama pull gpt-oss:120b-cloud</code>
                  <code className="block text-cyan-400">ollama pull kimi-k2:1t-cloud</code>
                  <code className="block text-cyan-400">ollama pull qwen3-coder:480b-cloud</code>
                </div>
              </div>
              <p className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">
                These commands will authenticate your Ollama account and download all the AI models used by Eburon AI.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-200 px-8 py-6 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              © 2025 Eburon AI. The fire reborn, a presence etched in memory forever.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
