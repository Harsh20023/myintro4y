import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import * as path from 'path'
import AdmZip from 'adm-zip'

const LOGIN_URL = 'https://services.gst.gov.in/services/login'
const UA            = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

const LAUNCH_ARGS = [
  '--no-sandbox', '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--ignore-certificate-errors',
  '--disable-blink-features=AutomationControlled',
  `--user-agent=${UA}`,
]

interface ReturnSession {
  browser: Browser
  page:    Page
  expires: number
}

interface GeneratingJob {
  sessionId:     string
  returnType:    string
  rtNorm:        string
  financialYear: string
  period:        string
  format:        string
  started:       number
  expires:       number
}

const sessions       = new Map<string, ReturnSession>()
const generatingJobs = new Map<string, GeneratingJob>()

setInterval(async () => {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (s.expires < now) {
      try { await s.browser.close() } catch { /* ignore */ }
      sessions.delete(id)
    }
  }
  for (const [id, j] of generatingJobs) {
    if (j.expires < now) generatingJobs.delete(id)
  }
}, 60_000)

function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms))
}

async function canvasCapture(page: Page): Promise<string | null> {
  return page.evaluate(() => {
    const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
    if (!img) return null
    const canvas = document.createElement('canvas')
    canvas.width  = img.naturalWidth  || 150
    canvas.height = img.naturalHeight || 50
    canvas.getContext('2d')?.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  })
}

async function clickButtonByText(page: Page, text: string): Promise<boolean> {
  return page.evaluate((t) => {
    const buttons = Array.from(document.querySelectorAll('button'))
    const btn = buttons.find(b => b.textContent?.trim().toUpperCase() === t.toUpperCase())
    if (btn) { btn.click(); return true }
    return false
  }, text)
}

async function angularSelect(page: Page, selector: string, value: string) {
  await page.evaluate((sel, val) => {
    const el = document.querySelector(sel) as HTMLSelectElement | null
    if (!el) return
    el.value = val
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }, selector, value)
}

// Pick option by text (works with AngularJS object-valued selects)
async function ngSelect(page: Page, selIdx: number, matchText: string) {
  return page.evaluate((si, mt) => {
    const sel = document.querySelectorAll('select')[si] as HTMLSelectElement | undefined
    if (!sel) return false
    const idx = Array.from(sel.options).findIndex(o => o.text.trim().includes(mt))
    if (idx < 0) return false
    sel.selectedIndex = idx
    sel.dispatchEvent(new Event('change', { bubbles: true }))
    sel.dispatchEvent(new Event('input',  { bubbles: true }))
    return sel.options[idx].text
  }, selIdx, matchText)
}

const MONTH_TO_Q: Record<string, string> = {
  April: '1', May: '1', June: '1',
  July: '2', August: '2', September: '2',
  October: '3', November: '3', December: '3',
  January: '4', February: '4', March: '4',
}

// Navigate from current page to FILE RETURNS, select FY/Quarter/Period, click SEARCH
async function navigateAndSearch(page: Page, financialYear: string, period: string) {
  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('a, li, button, span'))
      .find(e => e.textContent?.trim().toUpperCase() === 'DASHBOARD')
    if (el) (el as HTMLElement).click()
  })
  await wait(2500)

  await page.waitForSelector('a[href*="returns/auth/dashboard"]', { timeout: 15_000 })
  await page.evaluate(() => {
    const a = document.querySelector('a[href*="returns/auth/dashboard"]') as HTMLAnchorElement | null
    if (a) { a.scrollIntoView({ behavior: 'instant', block: 'center' }); a.click() }
  })
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => null)
  await wait(1500)

  await ngSelect(page, 0, financialYear)
  await wait(1200)
  await ngSelect(page, 1, `Quarter ${MONTH_TO_Q[period] ?? '1'}`)
  await wait(1200)
  await ngSelect(page, 2, period)
  await wait(500)

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button'))
      .find(b => b.textContent?.trim().toUpperCase() === 'SEARCH')
    if (btn) (btn as HTMLButtonElement).click()
  })
  await wait(3000)
}

// If the downloaded file is a ZIP, extract the first JSON inside and rewrite it as a .json file.
// Returns the final filename to use (may differ from input if ZIP was unwrapped).
function unwrapZip(downloadDir: string, filename: string): string {
  if (!/\.zip$/i.test(filename)) return filename
  const zipPath = path.join(downloadDir, filename)
  const zip = new AdmZip(zipPath)
  const entry = zip.getEntries().find(e => /\.json$/i.test(e.entryName))
  if (!entry) return filename  // no JSON inside — leave as-is
  const jsonName = path.basename(entry.entryName)
  const outPath  = path.join(downloadDir, jsonName)
  fs.writeFileSync(outPath, entry.getData())
  fs.unlinkSync(zipPath)
  return jsonName
}

async function pollForFile(downloadDir: string, timeoutMs: number): Promise<string | null> {
  return new Promise<string | null>(resolve => {
    const start = Date.now()
    const timer = setInterval(() => {
      try {
        const files = fs.readdirSync(downloadDir).filter(f => !f.endsWith('.crdownload') && !f.endsWith('.tmp'))
        if (files.length > 0) { clearInterval(timer); resolve(files[0]) }
        if (Date.now() - start > timeoutMs) { clearInterval(timer); resolve(null) }
      } catch { clearInterval(timer); resolve(null) }
    }, 500)
  })
}

export const GSTReturnsController = {

  // Step 1 — open login page, type username to trigger captcha, return image
  async getCaptcha(req: Request, res: Response) {
    const { username } = req.body as { username?: string }
    if (!username?.trim()) {
      return res.status(400).json({ message: 'username is required to load captcha.' })
    }

    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS })
      const page = await browser.newPage()
      await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30_000 })

      // Dump all inputs immediately after page load for debugging
      const allInputs = await page.evaluate(() =>
        Array.from(document.querySelectorAll('input')).map(el => ({
          id: el.id, name: el.name, type: el.type,
          placeholder: el.placeholder,
          ngModel: el.getAttribute('data-ng-model') ?? el.getAttribute('ng-model'),
        }))
      )
      console.log('[GST returns captcha] current URL:', page.url())
      console.log('[GST returns captcha] all inputs:', JSON.stringify(allInputs, null, 2))

      // Type username — captcha image only appears after username field is filled
      const usernameInput = await page.waitForSelector(
        'input[id="username"], input[name="user_name"], input[name="username"], input[data-ng-model*="username" i], input[placeholder*="user" i]',
        { timeout: 15_000 },
      )
      if (!usernameInput) {
        await browser.close()
        return res.status(502).json({ message: 'Username input not found on login page.' })
      }
      await usernameInput.click()
      await usernameInput.type(username.trim(), { delay: 40 })

      // Now wait for captcha image to appear
      try {
        await page.waitForFunction(
          () => {
            const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
            return img?.complete && (img.naturalWidth ?? 0) > 0
          },
          { timeout: 15_000 },
        )
      } catch {
        // Dump all images to find the right selector
        const allImgs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src, id: img.id, className: img.className,
            naturalWidth: img.naturalWidth, complete: img.complete,
          }))
        )
        const allInputs = await page.evaluate(() =>
          Array.from(document.querySelectorAll('input')).map(el => ({
            id: el.id, name: el.name, type: el.type, placeholder: el.placeholder,
          }))
        )
        console.error('[GST returns captcha] waitForFunction timed out')
        console.error('[GST returns captcha] current URL:', page.url())
        console.error('[GST returns captcha] all images:', JSON.stringify(allImgs, null, 2))
        console.error('[GST returns captcha] all inputs:', JSON.stringify(allInputs, null, 2))
        await page.screenshot({ path: '/tmp/gst-returns-captcha-debug.png', fullPage: true })
        console.error('[GST returns captcha] screenshot saved to /tmp/gst-returns-captcha-debug.png')
        await browser.close()
        return res.status(502).json({ message: 'Captcha image did not appear on login page.' })
      }

      const captchaBase64 = await canvasCapture(page)
      if (!captchaBase64) {
        await browser.close()
        return res.status(502).json({ message: 'Could not extract login captcha.' })
      }

      const sessionId = randomUUID()
      sessions.set(sessionId, { browser, page, expires: Date.now() + 10 * 60 * 1000 })
      return res.json({ captcha: captchaBase64, sessionId })

    } catch (err: unknown) {
      if (browser) { try { await browser.close() } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST returns captcha]', msg)
      return res.status(500).json({ message: `Failed to load login page: ${msg}` })
    }
  },

  // Step 2 — fill credentials, handle popup, land on dashboard
  async login(req: Request, res: Response) {
    const { sessionId, username, password, captcha } = req.body as {
      sessionId?: string; username?: string; password?: string; captcha?: string
    }
    if (!sessionId || !username || !password || !captcha) {
      return res.status(400).json({ message: 'sessionId, username, password and captcha are required.' })
    }

    const session = sessions.get(sessionId)
    if (!session || session.expires < Date.now()) {
      sessions.delete(sessionId)
      return res.status(400).json({ message: 'Session expired. Please refresh.' })
    }

    const { browser, page } = session

    try {
      // Fill all fields via evaluate — avoids Puppeteer's viewport/clickability requirements on AngularJS pages
      const filled = await page.evaluate((u, p, c) => {
        function fill(selector: string, value: string): boolean {
          const el = document.querySelector(selector) as HTMLInputElement | null
          if (!el) return false
          el.focus()
          el.value = value
          el.dispatchEvent(new Event('input',  { bubbles: true }))
          el.dispatchEvent(new Event('change', { bubbles: true }))
          return true
        }
        const usernameOk = fill('#username, [name="user_name"]', u)
        const passwordOk = fill('#user_pass, [name="user_pass"][placeholder]', p)
        const captchaOk  = fill('#captcha, [data-ng-model="lform.captcha"], [id*="captcha"]', c)
        return { usernameOk, passwordOk, captchaOk }
      }, username.trim(), password, captcha.trim())

      if (!filled.usernameOk) throw new Error('Username input not found on login page.')
      if (!filled.passwordOk) throw new Error('Password input not found on login page.')
      if (!filled.captchaOk)  throw new Error('Captcha input not found on login page.')

      await wait(400)

      // Submit
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => null),
        page.evaluate(() => {
          const btn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null
          btn?.click()
        }),
      ])

      await wait(1500)
      const currentUrl = page.url()

      // Still on login → wrong credentials / captcha
      if (currentUrl.includes('/login')) {
        const errText = await page.evaluate(() => {
          const el = document.querySelector('.error-msg, .alert-danger, [class*="error" i], [class*="invalid" i]')
          return el?.textContent?.trim() ?? null
        })
        return res.status(401).json({ message: errText ?? 'Login failed. Check your credentials or captcha.' })
      }

      // Dismiss "Remind Me Later" popup if it appears
      try {
        await page.waitForFunction(
          () => Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('REMIND ME LATER')),
          { timeout: 5_000 },
        )
        await clickButtonByText(page, 'REMIND ME LATER')
        await wait(1000)
      } catch { /* popup didn't appear */ }

      sessions.set(sessionId, { browser, page, expires: Date.now() + 15 * 60 * 1000 })
      return res.json({ success: true, sessionId })

    } catch (err: unknown) {
      try { await browser.close() } catch { /* ignore */ }
      sessions.delete(sessionId)
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST returns login]', msg)
      return res.status(500).json({ message: `Login failed: ${msg}` })
    }
  },

  // Step 3 — search for period, download return, return as base64 or JSON
  async downloadGSTR1(req: Request, res: Response) {
    const { sessionId, financialYear, period, returnType = 'GSTR-2B', format = 'excel' } = req.body as {
      sessionId?: string; financialYear?: string; period?: string; returnType?: string; format?: string
    }
    if (!sessionId || !financialYear || !period) {
      return res.status(400).json({ message: 'sessionId, financialYear and period are required.' })
    }
    const rtNorm   = returnType.toUpperCase().replace(/[-\s]/g, '')  // "GSTR3B", "GSTR2B", etc.
    // GSTR-3B: clicking DOWNLOAD directly triggers a PDF file download (no intermediate generate page)
    const isDirect = rtNorm === 'GSTR3B'
    // GSTR-1: clicking VIEW on the card navigates to GSTR-1/IFF page with "DOWNLOAD FILED (PDF)" and
    // "DOWNLOAD DETAILS FROM E-INVOICES (EXCEL)" buttons
    const isGSTR1  = rtNorm === 'GSTR1'
    console.log('[GST returns download] returnType:', returnType, '| rtNorm:', rtNorm, '| format:', format, '| isDirect:', isDirect)

    const session = sessions.get(sessionId)
    if (!session || session.expires < Date.now()) {
      sessions.delete(sessionId)
      return res.status(400).json({ message: 'Session expired. Please login again.' })
    }

    const { browser, page } = session

    try {
      console.log('[GST returns download] current URL:', page.url())

      // Step 1: Dismiss Aadhaar/KYC popup if present
      const hadPopup = await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent?.trim().toUpperCase().includes('REMIND ME LATER'))
        if (btn) { (btn as HTMLButtonElement).click(); return true }
        return false
      })
      if (hadPopup) { console.log('[GST returns download] dismissed popup'); await wait(1500) }

      // Guard: check if portal already logged us out before doing anything
      const preUrl = page.url()
      if (preUrl.includes('accessdenied') || preUrl.includes('/error') || preUrl.includes('/login')) {
        sessions.delete(sessionId)
        try { await browser.close() } catch { /* ignore */ }
        return res.status(401).json({ message: 'Portal session expired. Please login again.', code: 'SESSION_EXPIRED' })
      }

      // Step 2: Click the "Dashboard" tab in the nav bar
      const clickedDash = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('a, li, button, span'))
          .find(e => e.textContent?.trim().toUpperCase() === 'DASHBOARD')
        if (!el) return null
        ;(el as HTMLElement).click()
        return el.tagName + ': ' + el.textContent?.trim()
      })
      console.log('[GST returns download] clicked Dashboard tab:', clickedDash)
      await wait(2500)
      const urlAfterDash = page.url()
      console.log('[GST returns download] URL after Dashboard click:', urlAfterDash)

      // Guard: portal may have redirected to access denied after click
      if (urlAfterDash.includes('accessdenied') || urlAfterDash.includes('/error')) {
        sessions.delete(sessionId)
        try { await browser.close() } catch { /* ignore */ }
        return res.status(401).json({ message: 'Portal session expired. Please login again.', code: 'SESSION_EXPIRED' })
      }

      // Step 3: Wait for FILE RETURNS link — href points specifically to returns/auth/dashboard
      await page.waitForSelector('a[href*="returns/auth/dashboard"]', { timeout: 15_000 })
      await page.evaluate(() => {
        const a = document.querySelector('a[href*="returns/auth/dashboard"]') as HTMLAnchorElement | null
        if (a) { a.scrollIntoView({ behavior: 'instant', block: 'center' }); a.click() }
      })
      console.log('[GST returns download] clicked FILE RETURNS link')

      // This navigates cross-domain via SSO — wait for full load
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }).catch(() => null)
      await wait(1500)
      const urlAfterReturns = page.url()
      console.log('[GST returns download] URL after FILE RETURNS:', urlAfterReturns)

      if (urlAfterReturns.includes('accessdenied') || urlAfterReturns.includes('/error')) {
        sessions.delete(sessionId)
        try { await browser.close() } catch { /* ignore */ }
        return res.status(401).json({ message: 'Portal session expired. Please login again.', code: 'SESSION_EXPIRED' })
      }

      // Dump selects so we can verify options
      const selectsInfo = await page.evaluate(() =>
        Array.from(document.querySelectorAll('select')).map(s => ({
          id: s.id, name: s.name,
          options: Array.from(s.options).map(o => ({ value: o.value, text: o.text })),
        }))
      )
      console.log('[GST returns download] selects:', JSON.stringify(selectsInfo, null, 2))

      // FY select
      const fyResult = await ngSelect(page, 0, financialYear)
      console.log('[GST returns download] FY selected:', fyResult)
      await wait(1200)  // wait for Angular to refresh Quarter options

      // Quarter select — derive from month
      const qNum = MONTH_TO_Q[period] ?? '1'
      const qResult = await ngSelect(page, 1, `Quarter ${qNum}`)
      console.log('[GST returns download] Quarter selected:', qResult)
      await wait(1200)  // wait for Angular to refresh Period options

      // Period (month) select
      const pResult = await ngSelect(page, 2, period)
      console.log('[GST returns download] Period selected:', pResult)
      await wait(500)

      // Step 5: Click SEARCH
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent?.trim().toUpperCase() === 'SEARCH')
        if (btn) (btn as HTMLButtonElement).click()
      })
      console.log('[GST returns download] clicked SEARCH')
      await wait(3000)

      // Dump what appeared after search
      const afterSearch = await page.evaluate(() => ({
        url: window.location.href,
        buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean),
        cards: Array.from(document.querySelectorAll('[class*="card"], [class*="tile"], tr')).slice(0, 20)
          .map(el => el.textContent?.replace(/\s+/g, ' ').trim()).filter(Boolean),
      }))
      console.log('[GST returns download] after SEARCH:', JSON.stringify(afterSearch, null, 2))

      // Set up download dir (unique per call to avoid conflicts)
      const downloadDir = path.join('/tmp', `gst-returns-${sessionId}-${Date.now()}`)
      fs.mkdirSync(downloadDir, { recursive: true })

      // ── CRITICAL: set up CDP download BEFORE clicking the card button ──
      // If set after, direct-download returns (like GSTR-3B PDF) are missed
      const cdp = await page.createCDPSession()
      await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir })
      console.log('[GST returns download] CDP download dir set:', downloadDir)

      // GSTR-1 pdf only: click VIEW → GSTR-1/IFF page.
      // GSTR-1 json/excel: click DOWNLOAD → offline page → return JSON (frontend converts excel client-side)
      const useView = isGSTR1 && format === 'pdf'
      const clicked = await page.evaluate((rt, uv) => {
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const text = el.childNodes[0]?.textContent?.trim().replace(/[-\s]/g, '').toUpperCase() ?? ''
          if (text === rt) {
            let card: Element | null = el
            for (let i = 0; i < 6; i++) {
              card = card?.parentElement ?? null
              if (!card) break
              const btnLabel = uv ? 'VIEW' : 'DOWNLOAD'
              const dlBtn = Array.from(card.querySelectorAll('button'))
                .find(b => b.textContent?.trim().toUpperCase() === btnLabel)
              if (dlBtn) { dlBtn.click(); return el.textContent?.trim() + ' → clicked ' + btnLabel }
            }
          }
        }
        return null
      }, rtNorm, useView)
      console.log('[GST returns download] card click:', clicked)

      if (!clicked) {
        fs.rmSync(downloadDir, { recursive: true, force: true })
        return res.status(404).json({ message: `${returnType} download button not found. The return may not be filed for this period.` })
      }

      // ── GSTR-1 pdf: VIEW clicked → GSTR-1/IFF page with direct download buttons ──
      // ── GSTR-1 json/excel: DOWNLOAD clicked → falls into the offline download flow below ──
      if (isGSTR1 && useView) {
        // format is always 'pdf' here (useView = isGSTR1 && format === 'pdf')
        await wait(4000)
        console.log('[GST returns download] GSTR-1/IFF page URL:', page.url())

        // ── Path A: "DOWNLOAD FILED (PDF)" button directly on the GSTR-1/IFF page ──
        const directPdf = await page.evaluate(() => {
          const el = Array.from(document.querySelectorAll('button, a')).find(e => {
            const t = e.textContent?.trim().toUpperCase() ?? ''
            return t.includes('DOWNLOAD FILED') && t.includes('PDF')
          })
          if (el) { (el as HTMLElement).click(); return el.textContent?.trim() }
          return null
        })
        console.log('[GST returns download] GSTR-1 direct PDF button:', directPdf)

        if (!directPdf) {
          // ── Path B: "VIEW SUMMARY" → summary page → scroll → "DOWNLOAD (PDF)" ──
          const viewSummary = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('button, a')).find(e =>
              e.textContent?.trim().toUpperCase().includes('VIEW SUMMARY')
            )
            if (el) { (el as HTMLElement).click(); return el.textContent?.trim() }
            return null
          })
          console.log('[GST returns download] GSTR-1 VIEW SUMMARY clicked:', viewSummary)

          if (!viewSummary) {
            fs.rmSync(downloadDir, { recursive: true, force: true })
            return res.status(404).json({
              message: 'GSTR-1 PDF button not found — neither "Download Filed (PDF)" nor "View Summary" was found on the page.',
            })
          }

          // Wait for summary page to load then scroll to bottom
          await wait(4000)
          await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
          await wait(1000)
          console.log('[GST returns download] GSTR-1 summary page URL:', page.url())

          const summaryPdf = await page.evaluate(() => {
            const el = Array.from(document.querySelectorAll('button, a')).find(e => {
              const t = e.textContent?.trim().toUpperCase() ?? ''
              // Match "DOWNLOAD (PDF)" or "DOWNLOAD PDF" — avoid matching "DOWNLOAD DETAILS" Excel button
              return t.includes('DOWNLOAD') && t.includes('PDF') && !t.includes('DETAILS')
            })
            if (el) { (el as HTMLElement).click(); return el.textContent?.trim() }
            return null
          })
          console.log('[GST returns download] GSTR-1 summary PDF button:', summaryPdf)

          if (!summaryPdf) {
            fs.rmSync(downloadDir, { recursive: true, force: true })
            return res.status(404).json({
              message: 'GSTR-1 PDF download button not found on the summary page.',
            })
          }
        }

        // Check for info modal (e.g. "No details available")
        const infoModal = await page.waitForFunction(() => {
          const body = document.body?.textContent?.toUpperCase() ?? ''
          if (!body.includes('NO DETAILS AVAILABLE')) return false
          const ok = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent?.trim().toUpperCase() === 'OK')
          if (ok) (ok as HTMLElement).click()
          return true
        }, { polling: 200, timeout: 8000 })
          .then(() => 'modal')
          .catch(() => 'ok')

        console.log('[GST returns download] GSTR-1 post-click check:', infoModal)

        if (infoModal === 'modal') {
          fs.rmSync(downloadDir, { recursive: true, force: true })
          return res.status(422).json({
            message: 'No details available for this period on the GSTR-1/IFF page.',
          })
        }

      // ── For offline-download returns (GSTR-2A, GSTR-2B):
      //    clicking DOWNLOAD navigates to an "Offline Download" generate page with JSON + Excel buttons.
      //    The portal keeps previously generated files for 5 days — check for "Click here to download"
      //    links first before triggering a new generation.
      } else if (!isDirect) {
        await wait(3000)
        console.log('[GST returns download] URL after card click:', page.url())

        const pageText = await page.evaluate(() => document.body?.textContent?.toUpperCase() ?? '')
        if (pageText.includes('GENERATE') && pageText.includes('FILE TO DOWNLOAD')) {
          const defaultExcel = ['GSTR2B', 'GSTR2A'].includes(rtNorm)
          const wantExcel = format === 'excel' ? true
                          : (format === 'pdf' || format === 'json') ? false
                          : defaultExcel
          // GSTR-1 offline page link text is "Click here to download - File 1" (no JSON/EXCEL keyword)
          // GSTR-2A/2B link text is "Click here to download JSON/EXCEL - File 1"
          const dlKw  = isGSTR1 ? 'FILE' : wantExcel ? 'EXCEL' : 'JSON'
          const genKw = wantExcel ? 'GENERATE EXCEL FILE' : 'GENERATE JSON FILE'

          // ── Step A: Check for an existing download link (portal keeps files for 5 days) ──
          const existingLink = await page.evaluate((kw) => {
            const dl = Array.from(document.querySelectorAll('a')).find(a => {
              const t = a.textContent?.trim().toUpperCase() ?? ''
              return t.includes('CLICK HERE') && t.includes(kw)
            })
            if (dl) { (dl as HTMLElement).click(); return dl.textContent?.trim() }
            return null
          }, dlKw)
          console.log('[GST returns download] existing download link:', existingLink)

          if (!existingLink) {
            // ── Step B: No existing link — click Generate ──
            const genClicked = await page.evaluate((kw) => {
              const btn = Array.from(document.querySelectorAll('button'))
                .find(b => b.textContent?.trim().toUpperCase().includes(kw))
              if (btn) { (btn as HTMLButtonElement).click(); return btn.textContent?.trim() }
              return null
            }, genKw)
            console.log('[GST returns download] clicked generate button:', genClicked)

            // Wait 5s for portal to respond
            await wait(5000)

            // Check if a download link appeared (portal sometimes generates immediately)
            const quickLink = await page.evaluate((kw) => {
              const dl = Array.from(document.querySelectorAll('a')).find(a => {
                const t = a.textContent?.trim().toUpperCase() ?? ''
                return t.includes('CLICK HERE') && t.includes(kw)
              })
              if (dl) { (dl as HTMLElement).click(); return dl.textContent?.trim() }
              return null
            }, dlKw)
            console.log('[GST returns download] quick download link after generate:', quickLink)

            if (!quickLink) {
              // Check for acknowledgment (portal is generating async)
              const isAcknowledged = await page.evaluate(() => {
                const body = document.body?.textContent?.toUpperCase() ?? ''
                return body.includes('ACKNOWLEDGED') || body.includes('MAY TAKE') || body.includes('TAKE UPTO')
              })
              console.log('[GST returns download] portal acknowledged async generation:', isAcknowledged)

              if (isAcknowledged) {
                const jobId = randomUUID()
                generatingJobs.set(jobId, {
                  sessionId, returnType, rtNorm, financialYear, period, format,
                  started: Date.now(),
                  expires: Date.now() + 25 * 60 * 1000,
                })
                sessions.set(sessionId, { browser, page, expires: Date.now() + 25 * 60 * 1000 })
                console.log('[GST returns download] portal generating file, jobId:', jobId)
                fs.rmSync(downloadDir, { recursive: true, force: true })
                return res.json({
                  status: 'generating', jobId, filename: '', financialYear, period,
                  message: 'GST portal is generating your file. This may take up to 20 minutes.',
                })
              }
            }
          }
        }
      } else {
        // GSTR-3B: direct PDF download — just give the browser a moment to start the download
        await wait(2000)
        console.log('[GST returns download] GSTR-3B direct download — waiting for file…')
      }

      // Poll for downloaded file
      const timeout = isDirect ? 25_000 : 60_000
      const fileResult = await pollForFile(downloadDir, timeout)
      console.log('[GST returns download] file result:', fileResult)

      if (!fileResult) {
        fs.rmSync(downloadDir, { recursive: true, force: true })
        return res.status(504).json({ message: `File download timed out for ${returnType} ${period} ${financialYear}. The return may not be filed yet.` })
      }

      const resolvedName = unwrapZip(downloadDir, fileResult)
      const filePath     = path.join(downloadDir, resolvedName)
      const filename     = resolvedName
      const isExcel      = /\.(xlsx|xls)$/i.test(resolvedName)
      const isPDF        = /\.pdf$/i.test(resolvedName)

      if (isExcel || isPDF) {
        const buffer = fs.readFileSync(filePath)
        fs.rmSync(downloadDir, { recursive: true, force: true })
        sessions.set(sessionId, { browser, page, expires: Date.now() + 15 * 60 * 1000 })
        return res.json({ base64: buffer.toString('base64'), filename, financialYear, period, isExcel, isPDF })
      }

      // JSON file
      const content = fs.readFileSync(filePath, 'utf-8')
      let data: unknown
      try { data = JSON.parse(content) } catch { data = { raw: content } }
      const base64 = Buffer.from(content).toString('base64')
      fs.rmSync(downloadDir, { recursive: true, force: true })
      sessions.set(sessionId, { browser, page, expires: Date.now() + 15 * 60 * 1000 })
      return res.json({ data, base64, filename, financialYear, period, isExcel: false, isPDF: false })

    } catch (err: unknown) {
      // Keep browser open so UI state is visible for debugging
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST returns download] ERROR (browser kept open for debug):', msg)
      console.error('[GST returns download] current URL:', page.url())
      fs.rmSync(path.join('/tmp', `gst-returns-${sessionId}`), { recursive: true, force: true })
      return res.status(500).json({ message: `Download failed: ${msg}` })
    }
  },

  async checkDownload(req: Request, res: Response) {
    const { jobId } = req.body as { jobId?: string }
    if (!jobId) return res.status(400).json({ message: 'jobId is required.' })

    const job = generatingJobs.get(jobId)
    if (!job) return res.status(404).json({ message: 'Job not found or already completed.' })
    if (job.expires < Date.now()) {
      generatingJobs.delete(jobId)
      return res.status(410).json({ message: 'Generation job expired after 25 minutes.' })
    }

    const session = sessions.get(job.sessionId)
    if (!session || session.expires < Date.now()) {
      sessions.delete(job.sessionId)
      generatingJobs.delete(jobId)
      return res.status(400).json({ message: 'Browser session expired. Please login again.' })
    }

    const { browser, page } = session
    let downloadDir = ''

    try {
      const currentUrl = page.url()
      console.log('[GST returns check] jobId:', jobId, '| URL:', currentUrl)

      downloadDir = path.join('/tmp', `gst-check-${job.sessionId}-${Date.now()}`)
      fs.mkdirSync(downloadDir, { recursive: true })
      const cdp = await page.createCDPSession()
      await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadDir })

      // Always do a full re-navigation — refreshing in place doesn't update the portal's status.
      // The correct flow: go back to search → select FY/period → SEARCH → click DOWNLOAD on card.
      console.log('[GST returns check] re-navigating from URL:', currentUrl)
      await navigateAndSearch(page, job.financialYear, job.period)

      const cardClicked = await page.evaluate((rt) => {
        for (const el of Array.from(document.querySelectorAll('*'))) {
          const text = el.childNodes[0]?.textContent?.trim().replace(/[-\s]/g, '').toUpperCase() ?? ''
          if (text === rt) {
            let card: Element | null = el
            for (let i = 0; i < 6; i++) {
              card = card?.parentElement ?? null
              if (!card) break
              const dlBtn = Array.from(card.querySelectorAll('button'))
                .find(b => b.textContent?.trim().toUpperCase() === 'DOWNLOAD')
              if (dlBtn) { dlBtn.click(); return true }
            }
          }
        }
        return false
      }, job.rtNorm)
      console.log('[GST returns check] card DOWNLOAD clicked:', cardClicked)

      if (!cardClicked) {
        fs.rmSync(downloadDir, { recursive: true, force: true })
        return res.status(404).json({ message: `${job.returnType} card not found during re-navigation.` })
      }

      // Wait for the offline download page to load
      await wait(4000)

      // Check if the file is already available (link appeared immediately after clicking DOWNLOAD)
      const earlyFile = await pollForFile(downloadDir, 8_000)
      if (earlyFile) {
        const resolvedEarly = unwrapZip(downloadDir, earlyFile)
        const filePath  = path.join(downloadDir, resolvedEarly)
        const isExcel   = /\.(xlsx|xls)$/i.test(resolvedEarly)
        const isPDF     = /\.pdf$/i.test(resolvedEarly)
        const isJSON    = /\.json$/i.test(resolvedEarly)
        const buffer    = fs.readFileSync(filePath)
        const base64    = buffer.toString('base64')
        fs.rmSync(downloadDir, { recursive: true, force: true })
        generatingJobs.delete(jobId)
        sessions.set(job.sessionId, { browser, page, expires: Date.now() + 15 * 60 * 1000 })
        console.log('[GST returns check] file ready immediately after re-navigation:', resolvedEarly)
        const payload: Record<string, unknown> = { status: 'done', base64, filename: resolvedEarly, financialYear: job.financialYear, period: job.period, isExcel, isPDF }
        if (isJSON) { try { payload.data = JSON.parse(buffer.toString('utf-8')) } catch { /* ignore */ } }
        return res.json(payload)
      }

      // On the offline download page — check for existing link first, then click GENERATE if not found.
      // GSTR-1 link text: "Click here to download - File 1" (no JSON/EXCEL keyword)
      // GSTR-2A/2B link text: "Click here to download JSON/EXCEL - File 1"
      const dlKw  = job.rtNorm === 'GSTR1' ? 'FILE'
        : (job.format === 'json' || job.format === 'pdf') ? 'JSON' : 'EXCEL'
      const genKw = job.rtNorm === 'GSTR1' ? 'GENERATE JSON FILE'
        : (job.format === 'json' || job.format === 'pdf') ? 'GENERATE JSON FILE' : 'GENERATE EXCEL FILE'

      const findLink = async () => page.evaluate((kw) => {
        const el = Array.from(document.querySelectorAll('a, button')).find(e => {
          const t = e.textContent?.trim().toUpperCase() ?? ''
          return !t.includes('GENERATE') && t.includes('CLICK HERE') && t.includes(kw)
        })
        if (el) { (el as HTMLElement).click(); return el.textContent?.trim() ?? 'found' }
        return null
      }, dlKw)

      // Step A: check if link already visible
      let dlFound = await findLink()
      console.log('[GST returns check] existing download link:', dlFound)

      if (!dlFound) {
        // Step B: click GENERATE — portal needs this click to surface the download link
        const genClicked = await page.evaluate((kw) => {
          const btn = Array.from(document.querySelectorAll('button'))
            .find(b => b.textContent?.trim().toUpperCase().includes(kw))
          if (btn) { (btn as HTMLButtonElement).click(); return btn.textContent?.trim() }
          return null
        }, genKw)
        console.log('[GST returns check] generate clicked:', genClicked)

        // Wait up to 10s for the link to appear after clicking GENERATE
        await wait(5000)
        dlFound = await findLink()
        console.log('[GST returns check] download link after generate:', dlFound)
      }

      if (!dlFound) {
        fs.rmSync(downloadDir, { recursive: true, force: true })
        sessions.set(job.sessionId, { browser, page, expires: Date.now() + 25 * 60 * 1000 })
        return res.json({ status: 'generating', message: 'File is still being generated by the GST portal.' })
      }

      // Link clicked — poll for file
      const fileResult = await pollForFile(downloadDir, 30_000)
      console.log('[GST returns check] file result:', fileResult)

      if (!fileResult) {
        fs.rmSync(downloadDir, { recursive: true, force: true })
        sessions.set(job.sessionId, { browser, page, expires: Date.now() + 25 * 60 * 1000 })
        return res.json({ status: 'generating', message: 'Download link found but file not yet available.' })
      }

      const resolvedResult = unwrapZip(downloadDir, fileResult)
      const filePath = path.join(downloadDir, resolvedResult)
      const isExcel  = /\.(xlsx|xls)$/i.test(resolvedResult)
      const isPDF    = /\.pdf$/i.test(resolvedResult)
      const isJSON   = /\.json$/i.test(resolvedResult)
      const buffer   = fs.readFileSync(filePath)
      const base64   = buffer.toString('base64')
      fs.rmSync(downloadDir, { recursive: true, force: true })
      generatingJobs.delete(jobId)
      sessions.set(job.sessionId, { browser, page, expires: Date.now() + 15 * 60 * 1000 })

      const result: Record<string, unknown> = {
        status: 'done', base64, filename: resolvedResult,
        financialYear: job.financialYear, period: job.period, isExcel, isPDF,
      }
      if (isJSON) { try { result.data = JSON.parse(buffer.toString('utf-8')) } catch { /* ignore */ } }
      return res.json(result)

    } catch (err) {
      if (downloadDir) { try { fs.rmSync(downloadDir, { recursive: true, force: true }) } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST returns check] ERROR:', msg)
      return res.status(500).json({ message: `Check failed: ${msg}` })
    }
  },

  // Logout — close browser, delete session
  async logout(req: Request, res: Response) {
    const { sessionId } = req.body as { sessionId?: string }
    if (sessionId) {
      const session = sessions.get(sessionId)
      if (session) {
        try { await session.browser.close() } catch { /* ignore */ }
        sessions.delete(sessionId)
      }
    }
    return res.json({ success: true })
  },
}
