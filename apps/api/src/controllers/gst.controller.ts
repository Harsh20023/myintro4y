import { Request, Response } from 'express'
import { randomUUID } from 'crypto'
import puppeteer from 'puppeteer'
import type { Browser, Page, HTTPResponse } from 'puppeteer'

const STATE_CODES: Record<string, string> = {
  '01':'Jammu and Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
  '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur',
  '15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal',
  '20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh',
  '24':'Gujarat','25':'Daman and Diu','26':'Dadra and Nagar Haveli','27':'Maharashtra',
  '28':'Andhra Pradesh (Old)','29':'Karnataka','30':'Goa','31':'Lakshadweep',
  '32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman and Nicobar Islands',
  '36':'Telangana','37':'Andhra Pradesh','38':'Ladakh','97':'Other Territory','99':'Centre',
}

const GSTIN_REGEX    = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/
const PAN_REGEX      = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const SEARCH_PAGE    = 'https://services.gst.gov.in/services/searchtp'
const PAN_SEARCH_PAGE = 'https://services.gst.gov.in/services/searchtpbypan'
const UA             = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

interface Session {
  browser: Browser
  page:    Page
  gstin:   string
  expires: number
}

interface FilingSession {
  browser:       Browser
  page:          Page
  gstin:         string
  filingApiBase: string | null  // discovered from intercepted portal calls
  expires:       number
}

export interface FilingEntry {
  fy:      string
  taxp:    string
  dof:     string
  sts:     string
  mof:     string
  rtntype: string
}

interface PANSession {
  browser: Browser
  page:    Page
  pan:     string
  expires: number
}

export interface PANResult {
  gstin: string
  sts:   string
  state: string
}

const sessions       = new Map<string, Session>()
const filingSessions = new Map<string, FilingSession>()
const panSessions    = new Map<string, PANSession>()

setInterval(async () => {
  const now = Date.now()
  for (const [id, s] of sessions) {
    if (s.expires < now) { try { await s.browser.close() } catch { /* ignore */ }; sessions.delete(id) }
  }
  for (const [id, s] of filingSessions) {
    if (s.expires < now) { try { await s.browser.close() } catch { /* ignore */ }; filingSessions.delete(id) }
  }
  for (const [id, s] of panSessions) {
    if (s.expires < now) { try { await s.browser.close() } catch { /* ignore */ }; panSessions.delete(id) }
  }
}, 60_000)

function parseFilingData(raw: Record<string, unknown>): { gstr3b: FilingEntry[]; gstr1: FilingEntry[] } {
  console.log('[GST filing] raw response keys:', Object.keys(raw))
  console.log('[GST filing] raw (first 600):', JSON.stringify(raw).slice(0, 600))

  const allEntries: Record<string, string>[] = []

  // filingStatus is [[...entries...]] — a nested array, flatten it
  if (Array.isArray(raw.filingStatus)) {
    allEntries.push(...(raw.filingStatus as unknown[]).flat() as Record<string, string>[])
    console.log('[GST filing] found entries under filingStatus (flattened), count:', allEntries.length)
  }

  // Try other known field names for the filing list
  if (allEntries.length === 0) {
    for (const field of ['efiling', 'EFilingList', 'FilingList', 'filinglist', 'returns', 'data', 'taxpayerList']) {
      if (Array.isArray(raw[field])) {
        allEntries.push(...(raw[field] as Record<string, string>[]))
        console.log('[GST filing] found entries under field:', field, 'count:', allEntries.length)
        break
      }
    }
  }

  // Fallback: scan any array that looks like filing data
  if (allEntries.length === 0) {
    for (const key of Object.keys(raw)) {
      const val = raw[key]
      if (Array.isArray(val) && val.length > 0) {
        const first = val[0] as Record<string, string>
        if (first && ('sts' in first || 'dof' in first || 'rtntype' in first)) {
          allEntries.push(...(val as Record<string, string>[]))
          console.log('[GST filing] fallback entries under field:', key, 'count:', allEntries.length)
          break
        }
      }
    }
  }

  const gstr3b: FilingEntry[] = []
  const gstr1:  FilingEntry[] = []

  for (const e of allEntries) {
    const rtntype = (e.rtntype || e.retType || '').toUpperCase()
    const entry: FilingEntry = {
      fy:      e.fy      || '',
      taxp:    e.taxp    || e.period || e.retPrd || '',
      dof:     e.dof     || e.dateOfFiling || '',
      sts:     e.sts     || e.status || '',
      mof:     e.mof     || '',
      rtntype,
    }
    if (rtntype.includes('3B'))                      gstr3b.push(entry)
    else if (rtntype.includes('R1') || rtntype.includes('IFF') || rtntype === 'GSTR1') gstr1.push(entry)
  }

  console.log('[GST filing] parsed gstr3b:', gstr3b.length, 'gstr1:', gstr1.length)
  return { gstr3b, gstr1 }
}

export const GSTController = {

  // Step 1 — open browser, fill GSTIN, return captcha image
  async getCaptcha(req: Request, res: Response) {
    const { gstin } = req.body as { gstin?: string }
    if (!gstin) return res.status(400).json({ message: 'gstin is required.' })
    const upper = gstin.trim().toUpperCase()
    if (!GSTIN_REGEX.test(upper)) return res.status(400).json({ message: 'Invalid GSTIN format (e.g. 06AABCW7102K1ZD).' })

    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox', '--disable-setuid-sandbox',
          '--ignore-certificate-errors',
          '--disable-blink-features=AutomationControlled',
          `--user-agent=${UA}`,
        ],
      })

      const page = await browser.newPage()
      await page.goto(SEARCH_PAGE, { waitUntil: 'networkidle2', timeout: 30_000 })

      const gstinInput = await page.waitForSelector(
        'input[id="for_gstin"], input[name="for_gstin"], input[placeholder*="GSTIN" i]',
        { timeout: 15_000 },
      )
      if (!gstinInput) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find GSTIN input on GST portal.' })
      }
      await gstinInput.click({ count: 3 })
      await gstinInput.type(upper, { delay: 50 })

      await page.waitForFunction(
        () => {
          const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
          return img?.complete && (img.naturalWidth ?? 0) > 0
        },
        { timeout: 15_000 },
      )

      const captchaBase64 = await page.evaluate(() => {
        const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
        if (!img) return null
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth  || 150
        canvas.height = img.naturalHeight || 50
        canvas.getContext('2d')?.drawImage(img, 0, 0)
        return canvas.toDataURL('image/png')
      })

      if (!captchaBase64) {
        await browser.close()
        return res.status(502).json({ message: 'Could not extract captcha image.' })
      }

      const sessionId = randomUUID()
      sessions.set(sessionId, { browser, page, gstin: upper, expires: Date.now() + 5 * 60 * 1000 })
      return res.json({ captcha: captchaBase64, sessionId })

    } catch (err: unknown) {
      if (browser) { try { await browser.close() } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST captcha]', msg)
      return res.status(500).json({ message: `Failed to load GST portal: ${msg}` })
    }
  },

  // Step 2 — submit captcha, intercept all portal API responses, KEEP browser alive
  async verify(req: Request, res: Response) {
    const { sessionId, captcha } = req.body as { sessionId?: string; captcha?: string }
    if (!sessionId || !captcha) return res.status(400).json({ message: 'sessionId and captcha are required.' })

    const session = sessions.get(sessionId)
    if (!session || session.expires < Date.now()) {
      sessions.delete(sessionId)
      return res.status(400).json({ message: 'Session expired. Please refresh and try again.' })
    }
    sessions.delete(sessionId)

    const { browser, page } = session
    let filingSessionId: string | null = null

    try {
      const captchaInput = await page.$('input[id="fo-captcha"], input[name="cap"], input[placeholder*="Characters" i]')
      if (!captchaInput) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find captcha input on GST portal.' })
      }
      await captchaInput.click({ count: 3 })
      await captchaInput.type(captcha.trim(), { delay: 50 })

      // Set up interceptors BEFORE clicking — portal fires multiple calls after search
      const taxpayerPromise = page.waitForResponse(
        r => r.url().includes('taxpayerDetails'),
        { timeout: 25_000 },
      )
      const goodservicePromise = page.waitForResponse(
        r => r.url().includes('goodservice'),
        { timeout: 10_000 },
      ).catch(() => null)
      const filingPromise = page.waitForResponse(
        r => {
          const url = r.url()
          return (url.includes('filing') || url.includes('returndetail') || url.includes('taxpayerfiling')) &&
                 !url.includes('taxpayerDetails')
        },
        { timeout: 15_000 },
      ).catch(() => null)

      // Track ALL portal API URLs so we can discover the filing endpoint
      const discoveredUrls: string[] = []
      const urlTracker = (r: HTTPResponse) => {
        const url = r.url()
        if (url.includes('services.gst.gov.in/services/api')) discoveredUrls.push(url)
      }
      page.on('response', urlTracker)

      const searchBtn = await page.$('button[type="submit"], input[type="submit"], button[id*="search" i]')
      if (!searchBtn) {
        await browser.close()
        return res.status(502).json({ message: 'Could not find search button on GST portal.' })
      }
      await searchBtn.click()

      // Collect all three responses — read texts BEFORE doing anything with the browser
      const [taxpayerResponse, gsResponse, filingResponse] = await Promise.all([
        taxpayerPromise, goodservicePromise, filingPromise,
      ])

      const taxpayerText = await taxpayerResponse.text()
      const gsText       = gsResponse      ? await gsResponse.text().catch(() => null)      : null
      const filingText   = filingResponse  ? await filingResponse.text().catch(() => null)  : null

      page.off('response', urlTracker)
      console.log('[GST verify] all portal API URLs after search:', discoveredUrls)
      console.log('[GST verify] goodservice intercepted:', gsText      ? 'YES' : 'NO (timed out)')
      console.log('[GST verify] filing intercepted:',     filingText   ? 'YES' : 'NO (timed out)')
      if (filingText) console.log('[GST verify] filing raw (first 300):', filingText.slice(0, 300))

      // Discover filing API base URL from captured calls
      const filingApiBase = discoveredUrls.find(u =>
        u.includes('filing') || u.includes('returndetail') || u.includes('taxpayerfiling')
      ) ?? null

      // Keep browser alive — store as filing session
      filingSessionId = randomUUID()
      filingSessions.set(filingSessionId, {
        browser, page, gstin: session.gstin, filingApiBase,
        expires: Date.now() + 10 * 60 * 1000,
      })

      let data: Record<string, unknown>
      try { data = JSON.parse(taxpayerText) }
      catch { return res.status(502).json({ message: 'Unexpected response from GSTN portal.' }) }

      // Merge goodservice SAC/HSN codes
      if (gsText) {
        try {
          const gsData = JSON.parse(gsText) as Record<string, unknown>
          if (Array.isArray(gsData?.bzsdtls) && gsData.bzsdtls.length > 0) {
            data.bzsdtls = gsData.bzsdtls
            console.log('[GST verify] merged bzsdtls count:', (gsData.bzsdtls as unknown[]).length)
          } else {
            console.log('[GST verify] goodservice parsed but no bzsdtls:', gsData)
          }
        } catch (e) { console.log('[GST verify] goodservice parse error:', e) }
      }

      // Merge current-year filing data
      if (filingText) {
        try {
          const parsed = parseFilingData(JSON.parse(filingText))
          data.filing = parsed
        } catch (e) { console.log('[GST verify] filing parse error:', e) }
      }

      data.filingSessionId = filingSessionId
      return res.json(data)

    } catch (err: unknown) {
      // Only close browser if filing session was not yet created
      if (!filingSessionId) { try { await browser.close() } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[GST verify]', msg)
      return res.status(500).json({ message: `Verification failed: ${msg}` })
    }
  },

  // Step 3 — fetch filing data (two modes: filing-table or return-frequency)
  async getFilings(req: Request, res: Response) {
    const { filingSessionId, fy, mode = 'filing-table' } = req.body as {
      filingSessionId?: string; fy?: string; mode?: 'filing-table' | 'return-frequency'
    }
    if (!filingSessionId) return res.status(400).json({ message: 'filingSessionId is required.' })
    if (mode === 'filing-table' && !fy) return res.status(400).json({ message: 'fy is required for filing-table mode.' })

    const session = filingSessions.get(filingSessionId)
    if (!session || session.expires < Date.now()) {
      filingSessions.delete(filingSessionId)
      return res.status(400).json({ message: 'Filing session expired. Please search the GSTIN again.' })
    }
    // Extend session TTL on each use
    session.expires = Date.now() + 10 * 60 * 1000

    const { page, gstin, filingApiBase } = session

    // ── MODE: RETURN FILING FREQUENCY ─────────────────────────────────────────
    if (mode === 'return-frequency') {
      try {
        console.log('[GST frequency] clicking SHOW RETURN FILING FREQUENCY…')

        // Click the portal button that toggles the frequency view
        const clicked = await page.evaluate(() => {
          const els = Array.from(document.querySelectorAll('button, a, input[type="button"]'))
          const btn = els.find(el => el.textContent?.toUpperCase().includes('RETURN FILING FREQUENCY'))
          if (btn) { (btn as HTMLElement).click(); return true }
          return false
        })
        console.log('[GST frequency] button clicked:', clicked)

        // Wait for Angular to render the frequency table
        await new Promise(r => setTimeout(r, 1800))

        const frequency = await page.evaluate(() => {
          // Dump ALL tables for debugging
          const allTables = Array.from(document.querySelectorAll('table'))
          const debug = allTables.map(t => (t.innerText ?? t.textContent ?? '').slice(0, 120))
          console.log('[freq debug tables]', JSON.stringify(debug))

          const rows: { fy: string; aprJun: string; julSep: string; octDec: string; janMar: string }[] = []

          for (const table of allTables) {
            const text = table.innerText ?? table.textContent ?? ''
            // Must contain frequency-related keywords
            if (!text.includes('Apr') && !text.toLowerCase().includes('monthly') && !text.toLowerCase().includes('quarterly')) continue

            Array.from(table.querySelectorAll('tr')).forEach(tr => {
              const tds  = Array.from(tr.querySelectorAll('td'))
              const cells = tds.map(td => (td.textContent ?? '').trim())
              if (cells.length < 3) return
              // FY cell looks like "2026-27" or "2025-26"
              if (!cells[0].match(/^\d{4}-\d{2,4}$/)) return
              rows.push({
                fy:      cells[0],
                aprJun:  cells[2] ?? '',
                julSep:  cells[4] ?? '',
                octDec:  cells[6] ?? '',
                janMar:  cells[8] ?? '',
              })
            })

            if (rows.length > 0) break
          }

          return { rows, debug }
        })

        console.log('[GST frequency] scraped rows:', frequency.rows)
        console.log('[GST frequency] debug tables:', frequency.debug)

        return res.json({ mode: 'return-frequency', frequency: frequency.rows })

      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.log('[GST frequency] error:', msg)
        return res.status(502).json({ message: `Could not fetch frequency data: ${msg}` })
      }
    }

    // ── MODE: FILING TABLE ────────────────────────────────────────────────────

    // Click "SHOW FILING TABLE" first to ensure we're on that tab
    await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('button, a, input[type="button"]'))
      const btn = els.find(el => el.textContent?.toUpperCase().includes('SHOW FILING TABLE'))
      if (btn) (btn as HTMLElement).click()
    }).catch(() => {})
    await new Promise(r => setTimeout(r, 500))

    // Try direct API fetch with portal cookies first
    const cookies = await page.cookies()
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')

    const urlsToTry: string[] = []
    if (filingApiBase) {
      urlsToTry.push(`${filingApiBase.split('?')[0]}?gstin=${gstin}&fy=${fy}`)
    }
    urlsToTry.push(
      `https://services.gst.gov.in/services/api/search/filingreturndetails?gstin=${gstin}&fy=${fy}`,
      `https://services.gst.gov.in/services/api/search/taxpayerfiling?gstin=${gstin}&fy=${fy}`,
      `https://services.gst.gov.in/services/api/search/filingdetails?gstin=${gstin}&fy=${fy}`,
    )

    for (const url of [...new Set(urlsToTry)]) {
      try {
        console.log('[GST filingTable] trying URL:', url)
        const r = await fetch(url, {
          headers: {
            'User-Agent': UA,
            'Cookie': cookieHeader,
            'Referer': 'https://services.gst.gov.in/services/searchtp',
            'Accept': 'application/json, text/plain, */*',
          },
          signal: AbortSignal.timeout(10_000),
        })
        const text = await r.text()
        console.log('[GST filingTable] status:', r.status, 'body:', text.slice(0, 300))
        if (r.ok) return res.json(parseFilingData(JSON.parse(text) as Record<string, unknown>))
      } catch (e) {
        console.log('[GST filingTable] URL failed:', url, e instanceof Error ? e.message : e)
      }
    }

    // Fallback — interact with page's year dropdown + SEARCH button
    console.log('[GST filingTable] direct fetch failed, trying page interaction…')
    try {
      const filingPromise = page.waitForResponse(
        r => {
          const url = r.url()
          return url.includes('gst.gov.in/services/api') &&
                 !url.includes('taxpayerDetails') &&
                 !url.includes('goodservice') &&
                 !url.includes('captcha')
        },
        { timeout: 12_000 },
      ).catch(() => null)

      await page.evaluate((targetFy: string | undefined) => {
        if (!targetFy) return
        const selects = Array.from(document.querySelectorAll('select'))
        for (const sel of selects) {
          const match = Array.from(sel.options).find(o =>
            o.text.trim() === targetFy || o.value === targetFy
          )
          if (match) {
            sel.value = match.value
            sel.dispatchEvent(new Event('change', { bubbles: true }))
            break
          }
        }
      }, fy)

      await new Promise(r => setTimeout(r, 400))

      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'))
          .filter(b => b.textContent?.trim().toLowerCase() === 'search')
        if (btns.length > 0) (btns[btns.length - 1] as HTMLButtonElement).click()
      })

      const filingResponse = await filingPromise
      if (filingResponse) {
        const text = await filingResponse.text()
        console.log('[GST filingTable] page interaction URL:', filingResponse.url())
        console.log('[GST filingTable] body:', text.slice(0, 300))
        return res.json(parseFilingData(JSON.parse(text) as Record<string, unknown>))
      }
    } catch (e) {
      console.log('[GST filingTable] page interaction failed:', e instanceof Error ? e.message : e)
    }

    return res.status(502).json({ message: 'Could not fetch filing details. Please try again.' })
  },

  // PAN Step 1 — open searchtpbypan, fill PAN, return captcha image
  async getPANCaptcha(req: Request, res: Response) {
    const { pan } = req.body as { pan?: string }
    if (!pan) return res.status(400).json({ message: 'pan is required.' })
    const upper = pan.trim().toUpperCase()
    if (!PAN_REGEX.test(upper)) return res.status(400).json({ message: 'Invalid PAN format (e.g. AABCW7102K).' })

    let browser: Browser | null = null
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors',
               '--disable-blink-features=AutomationControlled', `--user-agent=${UA}`],
      })

      const page = await browser.newPage()
      await page.goto(PAN_SEARCH_PAGE, { waitUntil: 'networkidle2', timeout: 30_000 })

      // Fill PAN
      const panInput = await page.waitForSelector(
        'input[placeholder*="PAN" i], input[name*="pan" i], input[id*="pan" i]',
        { timeout: 15_000 },
      )
      if (!panInput) { await browser.close(); return res.status(502).json({ message: 'Could not find PAN input on portal.' }) }
      await panInput.click({ count: 3 })
      await panInput.type(upper, { delay: 50 })

      // Wait for captcha image
      await page.waitForFunction(
        () => {
          const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
          return img?.complete && (img.naturalWidth ?? 0) > 0
        },
        { timeout: 15_000 },
      )

      const captchaBase64 = await page.evaluate(() => {
        const img = document.querySelector('img[src*="captcha"]') as HTMLImageElement | null
        if (!img) return null
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth  || 150
        canvas.height = img.naturalHeight || 50
        canvas.getContext('2d')?.drawImage(img, 0, 0)
        return canvas.toDataURL('image/png')
      })

      if (!captchaBase64) { await browser.close(); return res.status(502).json({ message: 'Could not extract captcha image.' }) }

      const sessionId = randomUUID()
      panSessions.set(sessionId, { browser, page, pan: upper, expires: Date.now() + 5 * 60 * 1000 })
      return res.json({ captcha: captchaBase64, sessionId })

    } catch (err: unknown) {
      if (browser) { try { await browser.close() } catch { /* ignore */ } }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[PAN captcha]', msg)
      return res.status(500).json({ message: `Failed to load GST portal: ${msg}` })
    }
  },

  // PAN Step 2 — submit captcha, intercept results, close browser
  async searchByPAN(req: Request, res: Response) {
    const { sessionId, captcha } = req.body as { sessionId?: string; captcha?: string }
    if (!sessionId || !captcha) return res.status(400).json({ message: 'sessionId and captcha are required.' })

    const session = panSessions.get(sessionId)
    if (!session || session.expires < Date.now()) {
      panSessions.delete(sessionId)
      return res.status(400).json({ message: 'Session expired. Please refresh and try again.' })
    }
    panSessions.delete(sessionId)

    const { browser, page } = session

    try {
      // Fill captcha
      const captchaInput = await page.$('input[placeholder*="Characters" i], input[id*="captcha" i], input[name*="cap" i]')
      if (!captchaInput) { await browser.close(); return res.status(502).json({ message: 'Could not find captcha input.' }) }
      await captchaInput.click({ count: 3 })
      await captchaInput.type(captcha.trim(), { delay: 50 })

      // Click SEARCH
      const searchBtn = await page.$('button[type="submit"], input[type="submit"], button[id*="search" i]')
      if (!searchBtn) { await browser.close(); return res.status(502).json({ message: 'Could not find search button.' }) }

      // Intercept the first non-captcha portal API response (race against 12s timeout)
      const allPortalUrls: string[] = []
      const resultText: string | null = await new Promise<string | null>(resolve => {
        const timer = setTimeout(() => { page.off('response', handler); resolve(null) }, 12_000)
        const handler = async (r: HTTPResponse) => {
          const url = r.url()
          if (!url.includes('services.gst.gov.in/services/api')) return
          allPortalUrls.push(url)
          if (!url.includes('captcha')) {
            try {
              const text = await r.text()
              clearTimeout(timer)
              page.off('response', handler)
              resolve(text)
            } catch { /* ignore */ }
          }
        }
        page.on('response', handler)
        searchBtn.click()
      })

      console.log('[PAN search] portal API URLs:', allPortalUrls)
      console.log('[PAN search] resultText captured:', resultText ? 'YES' : 'NO')
      console.log('[PAN search] body (first 400):', resultText ? resultText.slice(0, 400) : 'none')

      // Fallback: scrape the results table from DOM
      if (!resultText) {
        console.log('[PAN search] no network intercept — scraping DOM table…')
        await new Promise(r => setTimeout(r, 2000))
        const scraped = await page.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tr')).slice(1)
          return rows.map(tr => {
            const cells = Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').trim())
            return { gstin: cells[1] || '', sts: cells[2] || '', state: cells[3] || '' }
          }).filter(r => r.gstin.length > 0)
        })
        console.log('[PAN search] DOM scraped rows:', scraped)
        await browser.close()
        return res.json({ results: scraped })
      }

      await browser.close()

      // Parse network response
      let parsed: Record<string, unknown>
      try { parsed = JSON.parse(resultText) }
      catch { return res.status(502).json({ message: 'Unexpected response from GSTN portal.' }) }

      console.log('[PAN search] response keys:', Object.keys(parsed))

      // The portal may return a list under various field names
      const toStateName = (cd: string) => STATE_CODES[cd] || cd || ''
      const mapEntry = (e: Record<string, string>): PANResult => ({
        gstin: e.gstin  || e.GSTIN || '',
        sts:   e.authStatus || e.sts || e.status || e.gstinStatus || '',
        state: toStateName(e.stateCd || e.statenm || e.state || e.stateName || ''),
      })

      const listFields = ['gstinResList', 'taxpayerList', 'gstinList', 'taxpayers', 'data', 'result']
      for (const field of listFields) {
        if (Array.isArray(parsed[field])) {
          const results: PANResult[] = (parsed[field] as Record<string, string>[]).map(mapEntry)
          console.log('[PAN search] parsed results:', results.length)
          return res.json({ results })
        }
      }

      // If response is directly an array
      if (Array.isArray(parsed)) {
        const results: PANResult[] = (parsed as Record<string, string>[]).map(mapEntry)
        return res.json({ results })
      }

      // Return raw for debugging
      console.log('[PAN search] could not parse results, raw:', JSON.stringify(parsed).slice(0, 500))
      return res.json([])

    } catch (err: unknown) {
      try { await browser.close() } catch { /* ignore */ }
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[PAN search]', msg)
      return res.status(500).json({ message: `Search failed: ${msg}` })
    }
  },
}
