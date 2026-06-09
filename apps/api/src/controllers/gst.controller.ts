import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const GST_SEARCH_URL = 'https://services.gst.gov.in/services/searchtp'

interface PuppeteerSession {
  browser: Browser
  page: Page
  expires: number
}

const sessions = new Map<string, PuppeteerSession>()

// Evict expired sessions and close their browsers
setInterval(async () => {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (s.expires < now) {
      try { await s.browser.close() } catch { /* ignore */ }
      sessions.delete(id)
    }
  }
}, 60_000)

async function findElement(page: Page, selectors: string[]) {
  for (const sel of selectors) {
    const el = await page.$(sel)
    if (el) return el
  }
  return null
}

export const GSTController = {

  // Step 1 — launch browser, intercept captcha network response, fill GSTIN, return image
  async getCaptcha(req: Request, res: Response) {
    const { gstin } = req.body as { gstin?: string }

    if (!gstin) {
      return res.status(400).json({ message: 'gstin is required.' })
    }
    const upper = gstin.trim().toUpperCase()
    if (!GSTIN_REGEX.test(upper)) {
      return res.status(400).json({ message: 'Invalid GSTIN format (e.g. 06AABCW7102K1ZD).' })
    }

    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--disable-blink-features=AutomationControlled',
        ],
      })

      const page = await browser.newPage()
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      )

      await page.goto(GST_SEARCH_URL, { waitUntil: 'networkidle2', timeout: 30_000 })

      // Fill GSTIN input
      const gstinInput = await page.waitForSelector(
        [
          'input[id="for_gstin"]',
          'input[name="for_gstin"]',
          'input[ng-model*="gstin" i]',
          'input[placeholder*="GSTIN" i]',
          '#gstnInp',
        ].join(', '),
        { timeout: 15_000 }
      )

      if (!gstinInput) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find GSTIN input on the GST portal.' })
      }

      await gstinInput.click({ count: 3 })
      await gstinInput.type(upper, { delay: 50 })

      // Wait for the captcha <img> to appear and fully load
      await page.waitForFunction(
        () => {
          const selectors = ['img[src*="captcha"]', '#captchaImg', 'img[class*="captcha" i]']
          for (const s of selectors) {
            const img = document.querySelector(s) as HTMLImageElement | null
            if (img && img.complete && img.naturalWidth > 0) return true
          }
          return false
        },
        { timeout: 15_000 }
      )

      // Use the browser's own fetch to get the captcha image — this runs inside the
      // Puppeteer page context so it carries the correct session cookies and Chrome's
      // SSL handling, avoiding the "text/html" problem from server-side interception.
      const captchaBase64 = await page.evaluate(async () => {
        const selectors = ['img[src*="captcha"]', '#captchaImg', 'img[class*="captcha" i]']
        let img: HTMLImageElement | null = null
        for (const s of selectors) {
          const el = document.querySelector(s) as HTMLImageElement | null
          if (el && el.src) { img = el; break }
        }
        if (!img) return null

        try {
          // Same-origin fetch — cookies included automatically, no CORS issue
          const resp = await fetch(img.src, { credentials: 'include' })
          if (!resp.ok) throw new Error(`status ${resp.status}`)
          const blob = await resp.blob()
          return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result as string)
            reader.onerror  = () => reject(new Error('FileReader error'))
            reader.readAsDataURL(blob)
          })
        } catch {
          // Canvas fallback: draw the already-loaded img element
          const canvas = document.createElement('canvas')
          canvas.width  = img.naturalWidth  || img.width  || 150
          canvas.height = img.naturalHeight || img.height || 50
          const ctx = canvas.getContext('2d')
          if (!ctx) return null
          ctx.drawImage(img, 0, 0)
          return canvas.toDataURL('image/png')
        }
      })

      if (!captchaBase64) {
        await browser.close()
        return res.status(502).json({ message: 'Could not extract captcha from GST portal.' })
      }

      const sessionId = randomUUID()
      sessions.set(sessionId, {
        browser,
        page,
        expires: Date.now() + 5 * 60 * 1000,
      })

      return res.json({ captcha: captchaBase64, sessionId })

    } catch (err: unknown) {
      if (browser) { try { await browser.close() } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST captcha]', msg)
      return res.status(500).json({ message: `Failed to load GST portal: ${msg}` })
    }
  },

  // Step 2 — fill captcha user typed, click search, intercept JSON response
  async verify(req: Request, res: Response) {
    const { sessionId, captcha } = req.body as { sessionId?: string; captcha?: string }

    if (!sessionId || !captcha) {
      return res.status(400).json({ message: 'sessionId and captcha are required.' })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expires < Date.now()) {
      sessions.delete(sessionId)
      return res.status(400).json({ message: 'Session expired. Please refresh and try again.' })
    }

    sessions.delete(sessionId) // one-shot: prevent reuse

    const { browser, page } = session

    try {
      // Find captcha text input
      const captchaInput = await findElement(page, [
        'input[id="captchaVal"]',
        'input[name="captchaVal"]',
        'input[ng-model*="captcha" i]',
        'input[placeholder*="captcha" i]',
        '#captchaInput',
        '#captchaInp',
      ])

      if (!captchaInput) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find captcha input on the GST portal.' })
      }

      await captchaInput.click({ count: 3 })
      await captchaInput.type(captcha.trim(), { delay: 50 })

      // Intercept the taxpayer-details API call
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('taxpayerDetails'),
        { timeout: 25_000 }
      )

      // Click search button
      const searchBtn = await findElement(page, [
        'button[type="submit"]',
        'button[ng-click*="search" i]',
        'button[id*="search" i]',
        '#searchBtn',
        'input[type="submit"]',
      ])

      if (!searchBtn) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find search button on the GST portal.' })
      }

      await searchBtn.click()

      const apiResponse = await responsePromise
      const text = await apiResponse.text()
      await browser.close()

      let data: Record<string, unknown>
      try {
        data = JSON.parse(text)
      } catch {
        return res.status(502).json({ message: 'Unexpected response from GSTN portal.' })
      }

      return res.json(data)

    } catch (err: unknown) {
      try { await browser.close() } catch { /* ignore */ }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST verify]', msg)
      return res.status(500).json({ message: `Verification failed: ${msg}` })
    }
  },
}
