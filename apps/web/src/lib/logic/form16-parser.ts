// Form 16 / 16A PDF parser — tuned for TRACES (Income Tax Dept) PDFs
// Text is line-based (Y-coord grouped). Two-column lines use double-space as separator.

export type Form16Type = 'form16' | 'form16a'

// ── Utilities ─────────────────────────────────────────────────────────────────

// First match of any pattern; returns captured group 1 or full match
function find(text: string, ...patterns: RegExp[]): string {
  for (const re of patterns) {
    const m = text.match(re)
    if (m) return (m[1] ?? m[0]).trim()
  }
  return ''
}

// Return the next non-empty line after the line matching the pattern
function nextLine(lines: string[], pattern: RegExp | string): string {
  const re = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern
  for (let i = 0; i < lines.length - 1; i++) {
    if (re.test(lines[i])) {
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        if (lines[j].trim()) return lines[j].trim()
      }
    }
  }
  return ''
}

// Amount: full number (any digit count), optional comma grouping, optional decimal
// IMPORTANT: [0-9]+ not [0-9]{1,3} — TRACES amounts like "1359998.00" have no commas
const AMT_RE = /([0-9]+(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/

function firstAmt(s: string)  { return (s.match(AMT_RE)  ?? [])[1] ?? '' }
// Last standalone number on a line — skips numbers embedded in parentheses like "17(1)"
function lastAmt(s: string): string {
  // Strip "section X(Y)" style numbers first so row-numbers don't interfere
  const cleaned = s.replace(/\b(?:section|sec\.?)\s*[\d()]+/gi, ' ')
                   .replace(/\([\d]+\)/g, '')
  const all = [...cleaned.matchAll(new RegExp(AMT_RE.source, 'g'))]
  // Filter out plain 1-2 digit numbers (row numbers) unless they have a decimal
  const amounts = all.map(m => m[1]).filter(n => n.includes('.') || n.length > 3 || n.includes(','))
  return amounts.length > 0 ? amounts[amounts.length - 1] : ''
}

// ── Form 16 ───────────────────────────────────────────────────────────────────

export interface ParsedForm16 {
  filename:           string
  status:             'parsed' | 'partial' | 'error'
  errorMsg?:          string

  // Employer (Deductor) — Part A
  certificateNo:      string
  lastUpdated:        string
  employerName:       string
  employerPAN:        string
  employerTAN:        string
  employerAddress:    string
  employerEmail:      string
  // Employee (Deductee)
  employeeName:       string
  employeePAN:        string
  // Period / AY
  assessmentYear:     string
  financialYear:      string
  periodFrom:         string
  periodTo:           string
  // TDS summary (Part A quarterly)
  totalAmtPaid:       string
  totalTDSDeducted:   string
  totalTDSDeposited:  string
  // Salary breakdown (Part B / Annexure)
  grossSalary:        string          // sec 17(1)
  allowancesExempt:   string          // sec 10 total
  standardDeduction:  string          // sec 16(ia) ₹75,000 / ₹50,000
  netSalary:          string          // income chargeable under salaries
  housePropertyIncome: string
  otherSourcesIncome: string
  grossTotalIncome:   string          // row 9
  // Chapter VI-A
  sec80C:             string
  sec80D:             string
  sec80CCD1B:         string
  sec80CCD2:          string
  totalChapterVIA:    string          // row 11
  // Tax
  taxableIncome:      string          // row 12
  taxOnIncome:        string          // row 13
  rebate87A:          string          // row 14
  surcharge:          string          // row 15
  cess:               string          // row 16
  taxPayable:         string          // row 17
  netTaxPayable:      string          // row 21
}

export function parseForm16(pages: string[], filename: string): ParsedForm16 {
  const lines = pages.flatMap(p => p.split('\n'))
  const full = lines.join('\n')

  const blank = (): ParsedForm16 => ({
    filename, status: 'error',
    certificateNo:'', lastUpdated:'', employerName:'', employerPAN:'', employerTAN:'',
    employerAddress:'', employerEmail:'', employeeName:'', employeePAN:'',
    assessmentYear:'', financialYear:'', periodFrom:'', periodTo:'',
    totalAmtPaid:'', totalTDSDeducted:'', totalTDSDeposited:'',
    grossSalary:'', allowancesExempt:'', standardDeduction:'', netSalary:'',
    housePropertyIncome:'', otherSourcesIncome:'', grossTotalIncome:'',
    sec80C:'', sec80D:'', sec80CCD1B:'', sec80CCD2:'', totalChapterVIA:'',
    taxableIncome:'', taxOnIncome:'', rebate87A:'', surcharge:'', cess:'',
    taxPayable:'', netTaxPayable:'',
  })

  try {
    // ── PART A ────────────────────────────────────────────────────────────────

    // Certificate No / Last updated — "Certificate No. UYRYLRA  Last updated on  11-Jun-2026"
    const certLine = find(full, /certificate\s+no\.?\s+(\w+)/i)
    const certificateNo = certLine
    const lastUpdated = find(full, /last\s+updated\s+on\s+([\d\w-]+)/i)

    // PANs and TAN — most reliable, direct single-line matches
    const employerPAN = find(full,
      /pan\s+of\s+the\s+deductor\s+([A-Z]{5}[0-9]{4}[A-Z])/i,
    )
    const employerTAN = find(full,
      /tan\s+of\s+the\s+deductor\s+([A-Z]{4}[0-9]{5}[A-Z])/i,
    )
    const employeePAN = find(full,
      /pan\s+of\s+the\s+employee[^A-Z0-9\n]*([A-Z]{5}[0-9]{4}[A-Z])/i,
      /pan\s+of\s+the\s+employee\/specified\s+senior[^A-Z0-9\n]*([A-Z]{5}[0-9]{4}[A-Z])/i,
    )

    // Assessment Year — look near the "Assessment Year" label, check up to 3 lines ahead
    // TRACES: "Assessment Year" is a column header; value "2026-27" may be 1-2 lines below
    let assessmentYear = ''
    for (let i = 0; i < lines.length; i++) {
      if (/assessment\s+year/i.test(lines[i])) {
        for (let j = i; j < Math.min(i + 4, lines.length); j++) {
          const ay = lines[j].match(/\b(20\d{2}[-–—]\d{2,4})\b/)
          if (ay) { assessmentYear = ay[1]; break }
        }
        if (assessmentYear) break
      }
    }
    // Also try finding AY directly in full text as fallback
    if (!assessmentYear) assessmentYear = find(full, /\b(20\d{2}[-–—]\d{2,4})\b/)

    let financialYear = ''
    {
      const fy = assessmentYear.match(/^(20\d{2})[-–—](\d{2,4})/)
      if (fy) {
        const ayYear = parseInt(fy[1])
        financialYear = `${ayYear - 1}-${(ayYear % 100).toString().padStart(2, '0')}`
      }
    }

    // Period From / To — TRACES always uses "dd-Mon-yyyy" format
    // For Indian FY: From = 01-Apr-XXXX, To = 31-Mar-XXXX
    // Match directly rather than relying on "From"/"To" labels (too generic)
    const periodFrom = find(full,
      /\b(0?1[-‐]Apr[-‐]20\d{2})\b/i,
      /\bfrom\b[\s\n]+([\d]{1,2}[-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/]\d{4})/i,
    )
    const periodTo = find(full,
      /\b(31[-‐]Mar[-‐]20\d{2})\b/i,
      /\bto\b\s+([\d]{1,2}[-/](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/]\d{4})/i,
    )

    // Employer + Employee names
    // TRACES uses two-column layout. With Y-grouping, employer & employee headers are
    // on ONE line, and their names are on the next line (possibly also two-column).
    // We look for all-caps text near the respective headers. A company name contains
    // keywords like LIMITED/PVT/LTD; a person name does not.
    let employerName = ''
    let employeeName = ''
    let employerAddress = ''
    let employerEmail = ''

    // Find the line-index where employer header appears
    const employerHeaderIdx = lines.findIndex(l => /name\s+and\s+address\s+of\s+the\s+employer/i.test(l))
    if (employerHeaderIdx >= 0) {
      for (let j = employerHeaderIdx + 1; j < Math.min(employerHeaderIdx + 6, lines.length); j++) {
        const ln = lines[j].trim()
        if (!ln || /name\s+and\s+address|specified\s+bank|specified\s+senior/i.test(ln)) continue
        // Split on 2+ spaces → left col = employer, right col = employee
        const cols = ln.split(/\s{2,}/).map(c => c.trim()).filter(Boolean)
        if (cols.length >= 2) {
          // Distinguish by company-suffix keywords
          const isCompany = (s: string) => /\b(limited|pvt|private|ltd|llp|industries|services|solutions|technologies|company|corp)\b/i.test(s)
          if (isCompany(cols[0]) && !isCompany(cols[1])) {
            employerName = cols[0]
            employeeName = cols[1]
          } else if (!isCompany(cols[0]) && isCompany(cols[1])) {
            employeeName = cols[0]
            employerName = cols[1]
          } else {
            // Both or neither match; take left as employer (standard TRACES layout)
            employerName = cols[0]
            employeeName = cols[1]
          }
        } else if (cols.length === 1) {
          employerName = cols[0]
        }
        // Collect address lines from left column
        const addrLines: string[] = []
        for (let k = j + 1; k < Math.min(j + 6, lines.length); k++) {
          const al = lines[k].trim()
          if (!al || /pan\s+of|tan\s+of|assessment\s+year/i.test(al)) break
          const leftCol = al.split(/\s{2,}/)[0]
          if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(leftCol)) {
            employerEmail = leftCol
          } else {
            addrLines.push(leftCol)
          }
        }
        employerAddress = addrLines.join(', ')
        break
      }
    }

    // Employee name fallback: search backward from employee PAN line
    if (!employeeName && employeePAN) {
      const panLineIdx = lines.findIndex(l => l.includes(employeePAN))
      if (panLineIdx > 0) {
        for (let j = panLineIdx - 1; j >= Math.max(0, panLineIdx - 6); j--) {
          const ln = lines[j].trim()
          if (!ln) continue
          // Look at all columns (right to left = employee column first)
          const cols = ln.split(/\s{2,}/).map(c => c.trim()).filter(Boolean).reverse()
          for (const c of cols) {
            // Personal name: all-caps, 2-5 words, no company suffix, no digits
            if (/^[A-Z][A-Z ]{3,40}$/.test(c) && !/\b(LIMITED|PVT|LTD|PRIVATE|INDUSTRIES|FLAT|HOUSE|PLOT|NO\.?)\b/.test(c) && c.split(' ').length <= 5) {
              employeeName = c
              break
            }
          }
          if (employeeName) break
        }
      }
    }

    // TDS summary row: "Total (Rs.)  1338901.28  114559.00  114559.00"
    let totalAmtPaid = '', totalTDSDeducted = '', totalTDSDeposited = ''
    for (const line of lines) {
      if (/total\s*\(rs\.\)/i.test(line)) {
        const parts = line.split(/\s{2,}/)
        const nums = parts.map(p => firstAmt(p)).filter(Boolean)
        if (nums.length >= 3) {
          [totalAmtPaid, totalTDSDeducted, totalTDSDeposited] = nums
        } else if (nums.length === 2) {
          [totalAmtPaid, totalTDSDeducted] = nums
          totalTDSDeposited = nums[1]
        }
        break
      }
    }

    // ── PART B / ANNEXURE ─────────────────────────────────────────────────────

    // Helper: find a Part B amount — label is on same line, amount is last number on that line
    const partB = (re: RegExp): string => {
      for (const line of lines) {
        if (re.test(line)) return lastAmt(line) || firstAmt(line)
      }
      return ''
    }

    // 1(a) Salary sec 17(1)
    const grossSalary = partB(/salary\s+as\s+per\s+provisions\s+contained\s+in\s+section\s+17\(1\)/i)

    // 2(i) Allowances exempt sec 10 total
    const allowancesExempt = partB(/total\s+amount\s+of\s+exemption\s+claimed\s+under\s+section\s+10/i)

    // 4(a) Standard deduction sec 16(ia)
    const standardDeduction = partB(/standard\s+deduction\s+under\s+section\s+16\(ia\)/i)

    // 6 Income chargeable under Salaries
    const netSalary = partB(/income\s+chargeable\s+under\s+the\s+head\s+[""]?salaries/i)

    // 7(a) House property
    const housePropertyIncome = partB(/income.*house\s+property\s+reported.*offered\s+for\s+tds/i)

    // 7(b) Other sources
    const otherSourcesIncome = partB(/income\s+under\s+the\s+head\s+other\s+sources/i)

    // 9 Gross total income
    const grossTotalIncome = partB(/gross\s+total\s+income\s*\(6\+8\)/i)

    // 10(a) 80C
    const sec80C = partB(/life\s+insurance\s+premia.*section\s+80c\b/i)

    // 10(d) Total 80C+80CCC+80CCD(1)
    const sec80CTotal = partB(/total\s+deduction\s+under\s+section\s+80c,\s*80ccc\s+and\s+80ccd\(1\)/i)

    // 10(e) 80CCD(1B)
    const sec80CCD1B = partB(/amount\s+paid.*notified\s+pension\s+scheme.*80ccd\s*\(1b\)/i)

    // 10(f) 80CCD(2)
    const sec80CCD2 = partB(/contribution\s+by\s+employer.*pension.*80ccd\s*\(2\)/i)

    // 10(g) 80D
    const sec80D = partB(/health\s+insurance\s+premia.*section\s+80d/i)

    // 11 Aggregate deductions Chapter VI-A
    // Use find() on full text so we get the FIRST number after the label,
    // not the last number on the line (which may be income from an adjacent column).
    const totalChapterVIA = find(full,
      /aggregate\s+of\s+deductible\s+amount\s+under\s+chapter\s+vi[-–]?a[^0-9\n]*\n?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i,
    )

    // 12 Total taxable income
    const taxableIncome = partB(/total\s+taxable\s+income\s*\(9[-–]11\)/i)
      || partB(/total\s+taxable\s+income/i)

    // 13 Tax on total income
    const taxOnIncome = partB(/^tax\s+on\s+total\s+income/i)
      || find(full, /\btax\s+on\s+total\s+income\s+([0-9,]+\.?\d{0,2})/i)

    // 14 Rebate 87A
    const rebate87A = partB(/rebate\s+under\s+section\s+87a/i)

    // 15 Surcharge
    const surcharge = partB(/surcharge,\s+wherever\s+applicable/i)

    // 16 Cess
    const cess = partB(/health\s+and\s+education\s+cess/i)

    // 17 Tax payable
    const taxPayable = partB(/tax\s+payable\s*\(13\+15\+16[-–]14\)/i)

    // 21 Net tax payable
    const netTaxPayable = partB(/net\s+tax\s+payable\s*\(17[-–]18[-–]19[-–]20\)/i)

    const filledCount = [
      employerName, employeeName, employeePAN, employerTAN, assessmentYear,
      grossSalary || totalAmtPaid, totalTDSDeducted
    ].filter(Boolean).length

    return {
      filename,
      status: filledCount >= 4 ? 'parsed' : filledCount >= 2 ? 'partial' : 'error',
      certificateNo, lastUpdated,
      employerName, employerPAN, employerTAN, employerAddress, employerEmail,
      employeeName, employeePAN,
      assessmentYear, financialYear, periodFrom, periodTo,
      totalAmtPaid, totalTDSDeducted, totalTDSDeposited,
      grossSalary, allowancesExempt, standardDeduction, netSalary,
      housePropertyIncome, otherSourcesIncome, grossTotalIncome,
      sec80C: sec80C || sec80CTotal, sec80D, sec80CCD1B, sec80CCD2, totalChapterVIA,
      taxableIncome, taxOnIncome, rebate87A, surcharge, cess,
      taxPayable, netTaxPayable,
    }
  } catch (e) {
    return { ...blank(), errorMsg: String(e) }
  }
}

// ── Form 16A ──────────────────────────────────────────────────────────────────

export interface Form16AEntry {
  section:          string
  natureOfPayment:  string
  amountPaid:       string
  tdsDeducted:      string
  tdsDeposited:     string
  challanBSRCode:   string
  challanDate:      string
  challanSerial:    string
}

export interface ParsedForm16A {
  filename:           string
  status:             'parsed' | 'partial' | 'error'
  errorMsg?:          string

  deductorName:       string
  deductorTAN:        string
  deductorPAN:        string
  deductorAddress:    string
  deducteeName:       string
  deducteePAN:        string
  deducteeAddress:    string
  assessmentYear:     string
  financialYear:      string
  entries:            Form16AEntry[]
  totalAmtPaid:       string
  totalTDSDeducted:   string
  totalTDSDeposited:  string
}

export function parseForm16A(pages: string[], filename: string): ParsedForm16A {
  const lines = pages.flatMap(p => p.split('\n'))
  const full = lines.join('\n')

  const blank = (): ParsedForm16A => ({
    filename, status: 'error',
    deductorName:'', deductorTAN:'', deductorPAN:'', deductorAddress:'',
    deducteeName:'', deducteePAN:'', deducteeAddress:'',
    assessmentYear:'', financialYear:'', entries:[],
    totalAmtPaid:'', totalTDSDeducted:'', totalTDSDeposited:'',
  })

  try {
    const deductorTAN = find(full,
      /tan\s+of\s+(?:the\s+)?deductor[\s\n]+([A-Z]{4}[0-9]{5}[A-Z])/i,
      /t\.a\.n\.?\s+of\s+deductor[\s:]+([A-Z]{4}[0-9]{5}[A-Z])/i,
    )
    const deductorPAN = find(full,
      /pan\s+of\s+(?:the\s+)?deductor[\s\n]+([A-Z]{5}[0-9]{4}[A-Z])/i,
    )
    const deducteePAN = find(full,
      /pan\s+of\s+(?:the\s+)?deductee[\s\n]+([A-Z]{5}[0-9]{4}[A-Z])/i,
      /permanent\s+account\s+number\s+of\s+(?:the\s+)?deductee[\s\n]+([A-Z]{5}[0-9]{4}[A-Z])/i,
    )

    const assessmentYear = find(full, /assessment\s+year[\s\n]+(20\d{2}[-–]\d{2,4})/i)
    const financialYear = find(full, /(?:financial\s+year|f\.?y\.?)[\s:n]+(20\d{2}[-–]\d{2,4})/i)

    // Names via two-column approach
    let deductorName = '', deducteeName = ''
    for (let i = 0; i < lines.length; i++) {
      if (/name\s+and\s+address\s+of\s+(?:the\s+)?deductor/i.test(lines[i])) {
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const ln = lines[j].trim()
          if (ln && !/name\s+and\s+address|deductee/i.test(ln)) {
            const cols = ln.split(/\s{2,}/)
            deductorName = cols[0].trim()
            if (cols[1]) deducteeName = cols[1].trim()
            break
          }
        }
        break
      }
    }
    if (!deducteeName) {
      deducteeName = nextLine(lines, /name\s+and\s+address\s+of\s+(?:the\s+)?deductee/i)
    }

    // TDS summary
    let totalAmtPaid = '', totalTDSDeducted = '', totalTDSDeposited = ''
    for (const line of lines) {
      if (/total\s*\(rs\.\)/i.test(line)) {
        const nums = [...line.matchAll(new RegExp(AMT_RE.source, 'g'))].map(m => m[1])
        if (nums.length >= 3) [totalAmtPaid, totalTDSDeducted, totalTDSDeposited] = nums
        else if (nums.length === 2) { totalAmtPaid = nums[0]; totalTDSDeducted = totalTDSDeposited = nums[1] }
        break
      }
    }
    if (!totalTDSDeducted) {
      totalTDSDeducted = find(full, /(?:total\s+)?tax\s+deducted[^0-9\n]*([0-9,]+\.?\d{0,2})/i)
      totalAmtPaid = find(full, /(?:total\s+)?amount\s+(?:paid|credited)[^0-9\n]*([0-9,]+\.?\d{0,2})/i)
    }

    // TDS entries — section-wise rows
    const entries: Form16AEntry[] = []
    const sectionRe = /\b(192A?|193|194[A-Z]{0,3}|195|196[A-Z]?)\b/i
    for (const line of lines) {
      if (sectionRe.test(line) && /[0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?/.test(line)) {
        const m = line.match(sectionRe)
        const nums = [...line.matchAll(/([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})?)/g)].map(x => x[1])
        entries.push({
          section:         m?.[1] ?? '',
          natureOfPayment: '',
          amountPaid:      nums[0] ?? '',
          tdsDeducted:     nums[1] ?? '',
          tdsDeposited:    nums[2] ?? '',
          challanBSRCode:  '',
          challanDate:     '',
          challanSerial:   '',
        })
      }
    }

    const filledCount = [deductorName, deducteeName, deducteePAN, deductorTAN].filter(Boolean).length

    return {
      filename, status: filledCount >= 2 ? 'parsed' : 'partial',
      deductorName, deductorTAN, deductorPAN, deductorAddress: '',
      deducteeName, deducteePAN, deducteeAddress: '',
      assessmentYear, financialYear, entries,
      totalAmtPaid, totalTDSDeducted, totalTDSDeposited,
    }
  } catch (e) {
    return { ...blank(), errorMsg: String(e) }
  }
}
