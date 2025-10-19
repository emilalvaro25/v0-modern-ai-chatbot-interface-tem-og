import type { ClassValue } from "clsx"

// Inline implementation of clsx functionality
function toVal(mix: ClassValue): string {
  let str = ""

  if (typeof mix === "string" || typeof mix === "number") {
    str += mix
  } else if (typeof mix === "object") {
    if (Array.isArray(mix)) {
      for (let k = 0; k < mix.length; k++) {
        if (mix[k]) {
          const y = toVal(mix[k])
          if (y) {
            str && (str += " ")
            str += y
          }
        }
      }
    } else {
      for (const k in mix) {
        if (mix[k]) {
          str && (str += " ")
          str += k
        }
      }
    }
  }

  return str
}

function clsx(...inputs: ClassValue[]): string {
  let str = ""
  for (let i = 0; i < inputs.length; i++) {
    const tmp = inputs[i]
    if (tmp) {
      const x = toVal(tmp)
      if (x) {
        str && (str += " ")
        str += x
      }
    }
  }
  return str
}

// Inline implementation of tailwind-merge functionality
function twMerge(...classLists: string[]): string {
  const classes = clsx(...classLists).split(" ")
  const classMap = new Map<string, string>()

  // Simple merge logic - later classes override earlier ones
  for (const cls of classes) {
    if (!cls) continue

    // Extract the base class name (before any modifiers like hover:, md:, etc.)
    const parts = cls.split(":")
    const baseClass = parts[parts.length - 1]

    // Store with full class name as key
    classMap.set(cls, cls)
  }

  return Array.from(classMap.values()).join(" ")
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}
