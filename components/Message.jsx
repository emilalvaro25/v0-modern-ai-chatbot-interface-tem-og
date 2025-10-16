import { cls } from "./utils"

export default function Message({ role, children, thinking }) {
  const isUser = role === "user"
  return (
    <div className="space-y-2">
      {thinking && !isUser && (
        <div className="flex gap-3 justify-start">
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">
            E
          </div>
          <div className="max-w-[80%] rounded-2xl px-3 py-2 text-sm bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Thinking...
            </div>
            <div className="text-xs text-emerald-900/70 dark:text-emerald-100/70 whitespace-pre-wrap font-mono">
              {thinking}
            </div>
          </div>
        </div>
      )}
      <div className={cls("flex gap-3", isUser ? "justify-end" : "justify-start")}>
        {!isUser && (
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-bold text-white">
            E
          </div>
        )}
        <div
          className={cls(
            "max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm",
            isUser
              ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
              : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800",
          )}
        >
          {children}
        </div>
        {isUser && (
          <div className="mt-0.5 grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-white dark:text-zinc-900">
            U
          </div>
        )}
      </div>
    </div>
  )
}
