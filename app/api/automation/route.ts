import { NextRequest, NextResponse } from "next/server"
import { chromium, Browser, Page } from "playwright"

let browser: Browser | null = null
let page: Page | null = null
let actionLog: any[] = []

// Initialize browser
async function initBrowser() {
  if (!browser) {
    browser = await chromium.launch({
      headless: false, // Run in headed mode to see the browser
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
  }
  if (!page) {
    page = await browser.newPage()
    await page.setViewportSize({ width: 1280, height: 720 })
  }
  return { browser, page }
}

// Log action for visual feedback
function logAction(action: string, details: any) {
  const timestamp = new Date().toISOString()
  actionLog.push({ timestamp, action, details })
  // Keep only last 100 actions
  if (actionLog.length > 100) {
    actionLog = actionLog.slice(-100)
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, url, selector, text, x, y, scrollAmount } = await req.json()

    await initBrowser()
    
    if (!page) {
      return NextResponse.json({ error: "Failed to initialize browser" }, { status: 500 })
    }

    let result: any = { success: true }

    switch (action) {
      case "navigate":
        await page.goto(url, { waitUntil: "networkidle" })
        logAction("navigate", { url })
        result.message = `Navigated to ${url}`
        break

      case "click":
        if (selector) {
          await page.click(selector)
          logAction("click", { selector })
          result.message = `Clicked on ${selector}`
        } else if (x !== undefined && y !== undefined) {
          await page.mouse.click(x, y)
          logAction("click", { x, y })
          result.message = `Clicked at (${x}, ${y})`
        }
        break

      case "type":
        if (selector && text) {
          await page.fill(selector, text)
          logAction("type", { selector, text })
          result.message = `Typed "${text}" into ${selector}`
        }
        break

      case "scroll":
        const scrollY = scrollAmount || 500
        await page.evaluate((amount) => window.scrollBy(0, amount), scrollY)
        logAction("scroll", { amount: scrollY })
        result.message = `Scrolled ${scrollY}px`
        break

      case "screenshot":
        const screenshot = await page.screenshot()
        result.screenshot = screenshot.toString("base64")
        result.message = "Screenshot captured"
        break

      case "getActions":
        result.actions = actionLog
        result.message = "Retrieved action log"
        break

      case "close":
        if (page) {
          await page.close()
        }
        if (browser) {
          await browser.close()
        }
        page = null
        browser = null
        actionLog = []
        result.message = "Browser closed"
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Always include current URL and action log
    if (page && !page.isClosed()) {
      result.currentUrl = page.url()
      result.recentActions = actionLog.slice(-10)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Automation error:", error)
    return NextResponse.json(
      {
        error: error.message,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const action = searchParams.get("action")

    if (action === "status") {
      return NextResponse.json({
        browserActive: browser !== null && page !== null,
        currentUrl: page && !page.isClosed() ? page.url() : null,
        actionsCount: actionLog.length,
        recentActions: actionLog.slice(-10),
      })
    }

    if (action === "actions") {
      return NextResponse.json({
        actions: actionLog,
        count: actionLog.length,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
