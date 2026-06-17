'use client'

import { useState, useMemo } from 'react'
import {
  LogIn, Download, RefreshCw, AlertTriangle, CheckCircle2,
  FileSpreadsheet, FileText, Loader2, X, ChevronDown, Eye, EyeOff,
} from 'lucide-react'
import { Input, Card } from '@/components/ui'
import { gstReturns } from '@/lib/api'
import * as XLSX from 'xlsx'

/* ── Types ─────────────────────────────────────────────────────────── */
type ReturnType = 'GSTR-1' | 'GSTR-3B' | 'GSTR-2A' | 'GSTR-2B'
type Format     = 'excel' | 'json' | 'both' | 'pdf' | 'all'
type Preset     = 'last3' | 'last6' | 'current-fy' | 'prev-fy' | 'range' | 'custom'
type CustomMode = 'by-month' | 'by-year'
type Phase      = 'idle' | 'captcha-loading' | 'login' | 'logging-in' | 'select-period' | 'error'
type ItemStatus = 'pending' | 'active' | 'generating' | 'done' | 'error'

interface DownloadItem {
  id: string; fy: string; month: string; fmt: Format
  status: ItemStatus; error?: string; filename?: string; base64?: string; isPDF?: boolean; jobId?: string
}

/* ── Constants ─────────────────────────────────────────────────────── */
const FY_LIST  = ['2025-26', '2024-25', '2023-24', '2022-23', '2021-22', '2020-21']
const FY_M_L   = ['April','May','June','July','August','September','October','November','December','January','February','March']
const FY_M_S   = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

const RETURN_TYPES: { type: ReturnType; sub: string }[] = [
  { type: 'GSTR-1',  sub: 'Outward supplies' },
  { type: 'GSTR-3B', sub: 'Monthly return' },
  { type: 'GSTR-2A', sub: 'Auto-drafted inward' },
  { type: 'GSTR-2B', sub: 'ITC statement' },
]

/* ── Helpers ───────────────────────────────────────────────────────── */
function curFY() {
  const m = new Date().getMonth() + 1; const y = new Date().getFullYear()
  const s = m >= 4 ? y : y - 1; return `${s}-${String(s + 1).slice(-2)}`
}
function prevFY() {
  const [a] = curFY().split('-').map(Number)
  return `${a - 1}-${String(a).slice(-2)}`
}
function lastN(n: number) {
  const out: { fy: string; month: string }[] = []
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1)
  for (let i = 0; i < n; i++) {
    const month = d.toLocaleString('en-US', { month: 'long' })
    const cy = d.getFullYear(); const mn = d.getMonth() + 1
    const s = mn >= 4 ? cy : cy - 1
    out.push({ fy: `${s}-${String(s + 1).slice(-2)}`, month })
    d.setMonth(d.getMonth() - 1)
  }
  return out
}
function fyAll(fy: string) { return FY_M_L.map(m => ({ fy, month: m })) }
function pk(fy: string, m: string) { return `${fy}|${m}` }
function ms(month: string) { return FY_M_S[FY_M_L.indexOf(month)] ?? month.slice(0, 3) }
function saveFile(b64: string, name: string, isPDF?: boolean) {
  const isJSON = /\.json$/i.test(name)
  const mime   = isPDF ? 'application/pdf' : isJSON ? 'application/json' : 'application/octet-stream'
  const bytes  = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const blob   = new Blob([bytes], { type: mime })
  const url    = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: name }).click()
  URL.revokeObjectURL(url)
}
const STATE_CODES: Record<string, string> = {
  '01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh',
  '05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh',
  '10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur',
  '15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal',
  '20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh',
  '24':'Gujarat','25':'Daman & Diu','26':'Dadra & Nagar Haveli','27':'Maharashtra',
  '28':'Andhra Pradesh (old)','29':'Karnataka','30':'Goa','31':'Lakshadweep',
  '32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar',
  '36':'Telangana','37':'Andhra Pradesh','38':'Ladakh','97':'Other Territory',
}
const INV_TYPE: Record<string, string> = {
  R:'Regular', SEWP:'SEZ with payment', SEWOP:'SEZ without payment',
  DE:'Deemed export', CBW:'Customs bonded warehouse',
}

// GSTR-2B structure: month → { data: { docdata: { b2b: [...] } } }
interface B2BInv2B {
  inum: string; typ?: string; dt?: string; val?: number; pos?: string; rev?: string
  txval?: number; igst?: number; cgst?: number; sgst?: number; cess?: number
  itcavl?: string; rsn?: string; srctyp?: string; irn?: string; irngendate?: string
  appl_icjprc?: string
}
interface B2BEntry2B {
  ctin: string; trdnm?: string; supfildt?: string; supprd?: string; inv: B2BInv2B[]
}
interface MonthData2B {
  data?: { docdata?: { b2b?: B2BEntry2B[] }; gstin?: string; rtnprd?: string }
}

function gstr2aToExcel(items: { base64: string; month: string; fy: string }[], filename: string) {
  const HEADERS = [
    'Period',
    'GSTIN of Supplier', 'Trade/Legal Name', 'Invoice Number', 'Invoice Type',
    'Invoice Date', 'Invoice Value (₹)', 'Place of Supply', 'Supply Attract Reverse Charge',
    'Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)',
    'GSTR-1/IFF/GSTR-5 Period', 'GSTR-1/IFF/GSTR-5 Filing Date',
    'ITC Availability', 'Reason', 'Applicable % of Tax Rate',
    'Source', 'IRN', 'IRN Date',
  ]

  const rows: (string | number)[][] = []
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []

  for (const item of items) {
    let raw: MonthData2B
    try { raw = JSON.parse(atob(item.base64)) } catch { continue }
    const b2b = raw?.data?.docdata?.b2b ?? []
    const period = `${item.month} ${item.fy.split('-')[0]}`
    const monthStartRow = rows.length

    for (const supplier of b2b) {
      for (const inv of supplier.inv) {
        const isFirst = rows.length === monthStartRow
        rows.push([
          isFirst ? period : '',
          supplier.ctin ?? '',
          supplier.trdnm ?? '',
          inv.inum ?? '',
          INV_TYPE[inv.typ ?? ''] ?? (inv.typ ?? ''),
          inv.dt ?? '',
          inv.val ?? 0,
          STATE_CODES[inv.pos ?? ''] ?? (inv.pos ?? ''),
          inv.rev === 'Y' ? 'Yes' : inv.rev === 'N' ? 'No' : (inv.rev ?? ''),
          inv.txval ?? 0,
          inv.igst ?? 0,
          inv.cgst ?? 0,
          inv.sgst ?? 0,
          inv.cess ?? 0,
          supplier.supprd ?? '',
          supplier.supfildt ?? '',
          inv.itcavl === 'Y' ? 'Yes' : (inv.itcavl ?? ''),
          inv.rsn ?? '',
          inv.appl_icjprc ?? '',
          inv.srctyp ?? '',
          inv.irn ?? '',
          inv.irngendate ?? '',
        ])
      }
    }

    const monthEndRow = rows.length - 1
    if (monthEndRow > monthStartRow) {
      merges.push({ s: { r: monthStartRow + 1, c: 0 }, e: { r: monthEndRow + 1, c: 0 } })
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows])
  ws['!merges'] = merges
  ws['!cols'] = HEADERS.map((_, i) => ({ wch: [14,22,26,22,14,12,16,22,12,16,16,14,14,8,14,18,14,18,16,12,64,12][i] ?? 14 }))
  writeExcel(ws, filename)
}

function gstr2bToExcel(items: { base64: string; month: string; fy: string }[], filename: string) {
  const HEADERS = [
    'Period',
    'GSTIN of Supplier', 'Trade/Legal Name', 'Invoice Number', 'Invoice Type',
    'Invoice Date', 'Invoice Value (₹)', 'Place of Supply', 'Supply Attract Reverse Charge',
    'Taxable Value (₹)', 'Integrated Tax (₹)', 'Central Tax (₹)', 'State/UT Tax (₹)', 'Cess (₹)',
    'GSTR-1/IFF/GSTR-5 Period', 'GSTR-1/IFF/GSTR-5 Filing Date',
    'ITC Availability', 'Reason', 'Applicable % of Tax Rate',
    'Source', 'IRN', 'IRN Date',
  ]

  const rows: (string | number)[][] = []
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = []

  for (const item of items) {
    let raw: MonthData2B
    try { raw = JSON.parse(atob(item.base64)) } catch { continue }
    const b2b = raw?.data?.docdata?.b2b ?? []
    const period = `${item.month} ${item.fy.split('-')[0]}`
    const monthStartRow = rows.length

    for (const supplier of b2b) {
      for (const inv of supplier.inv) {
        const isFirst = rows.length === monthStartRow
        rows.push([
          isFirst ? period : '',
          supplier.ctin ?? '',
          supplier.trdnm ?? '',
          inv.inum ?? '',
          INV_TYPE[inv.typ ?? ''] ?? (inv.typ ?? ''),
          inv.dt ?? '',
          inv.val ?? 0,
          STATE_CODES[inv.pos ?? ''] ?? (inv.pos ?? ''),
          inv.rev === 'Y' ? 'Yes' : inv.rev === 'N' ? 'No' : (inv.rev ?? ''),
          inv.txval ?? 0,
          inv.igst ?? 0,
          inv.cgst ?? 0,
          inv.sgst ?? 0,
          inv.cess ?? 0,
          supplier.supprd ?? '',
          supplier.supfildt ?? '',
          inv.itcavl === 'Y' ? 'Yes' : (inv.itcavl ?? ''),
          inv.rsn ?? '',
          inv.appl_icjprc ?? '',
          inv.srctyp ?? '',
          inv.irn ?? '',
          inv.irngendate ?? '',
        ])
      }
    }

    const monthEndRow = rows.length - 1
    if (monthEndRow > monthStartRow) {
      merges.push({ s: { r: monthStartRow + 1, c: 0 }, e: { r: monthEndRow + 1, c: 0 } })
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...rows])
  ws['!merges'] = merges
  ws['!cols'] = HEADERS.map((_, i) => ({ wch: [14,22,26,22,14,12,16,22,12,16,16,14,14,8,14,18,14,18,16,12,64,12][i] ?? 14 }))
  writeExcel(ws, filename)
}

function writeExcel(ws: XLSX.WorkSheet, filename: string) {
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'B2B')
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

function downloadWb(wb: XLSX.WorkBook, filename: string) {
  const buf  = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  Object.assign(document.createElement('a'), { href: url, download: filename }).click()
  URL.revokeObjectURL(url)
}

// ── GSTR-1 interfaces ──
interface G1Itm   { itm_det: { rt?: number; txval?: number; iamt?: number; camt?: number; samt?: number; csamt?: number } }
interface G1Inv   { inum?: string; idt?: string; val?: number; pos?: string; rchrg?: string; inv_typ?: string; srctyp?: string; irn?: string; irngendate?: string; itms?: G1Itm[] }
interface G1B2B   { ctin?: string; inv?: G1Inv[] }
interface G1Nt    { nt_num?: string; ntty?: string; nt_dt?: string; val?: number; pos?: string; rchrg?: string; inv_typ?: string; srctyp?: string; irn?: string; irngendate?: string; itms?: G1Itm[] }
interface G1CDNR  { ctin?: string; nt?: G1Nt[] }
interface G1HSN   { hsn_sc?: string; desc?: string; uqc?: string; qty?: number; rt?: number; txval?: number; iamt?: number; camt?: number; samt?: number; csamt?: number }
interface G1Data  { gstin?: string; fp?: string; b2b?: G1B2B[]; cdnr?: G1CDNR[]; hsn?: { hsn_b2b?: G1HSN[]; hsn_b2c?: G1HSN[] } }

function gstr1ToExcel(items: { base64: string; month: string; fy: string }[], filename: string) {
  const b2bRows: unknown[][] = [[
    'Period', 'GSTIN/UIN of Recipient', 'Receiver Name', 'Invoice Number', 'Invoice Date',
    'Invoice Value', 'Place of Supply', 'Reverse Charge', 'Applicable % of Tax Rate',
    'Invoice Type', 'E-Commerce GSTN', 'Rate', 'Taxable Value',
    'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess Amount', 'IRN', 'IRN Date', 'E-Invoice Status',
  ]]
  const cdnrRows: unknown[][] = [[
    'Period', 'GSTIN/UIN of Supplier', 'Note Type', 'Note Number', 'Note Date', 'Note Value',
    'Place of Supply', 'Reverse Charge', 'Invoice Type',
    'Rate', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess',
    'IRN', 'IRN Date', 'E-Invoice Status',
  ]]
  const hsnRows: unknown[][] = [[
    'Period', 'HSN Code', 'Description', 'UQC', 'Total Quantity', 'Rate',
    'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess',
  ]]

  for (const item of items) {
    const period = `${ms(item.month)} ${item.fy}`
    let data: G1Data
    try { data = JSON.parse(atob(item.base64)) } catch { continue }

    for (const entry of data.b2b ?? []) {
      for (const inv of entry.inv ?? []) {
        for (const itm of inv.itms ?? []) {
          const d = itm.itm_det
          b2bRows.push([
            period, entry.ctin ?? '', '', inv.inum ?? '', inv.idt ?? '', inv.val ?? 0,
            inv.pos ?? '', inv.rchrg ?? '', '', inv.inv_typ ?? '', '',
            d.rt ?? 0, d.txval ?? 0, d.iamt ?? 0, d.camt ?? 0, d.samt ?? 0, d.csamt ?? 0,
            inv.irn ?? '', inv.irngendate ?? '', inv.srctyp ?? '',
          ])
        }
      }
    }

    for (const entry of data.cdnr ?? []) {
      for (const nt of entry.nt ?? []) {
        for (const itm of nt.itms ?? []) {
          const d = itm.itm_det
          cdnrRows.push([
            period, entry.ctin ?? '', nt.ntty ?? '', nt.nt_num ?? '', nt.nt_dt ?? '', nt.val ?? 0,
            nt.pos ?? '', nt.rchrg ?? '', nt.inv_typ ?? '',
            d.rt ?? 0, d.txval ?? 0, d.iamt ?? 0, d.camt ?? 0, d.samt ?? 0, d.csamt ?? 0,
            nt.irn ?? '', nt.irngendate ?? '', nt.srctyp ?? '',
          ])
        }
      }
    }

    for (const h of [...(data.hsn?.hsn_b2b ?? []), ...(data.hsn?.hsn_b2c ?? [])]) {
      hsnRows.push([
        period, h.hsn_sc ?? '', h.desc ?? '', h.uqc ?? '', h.qty ?? 0, h.rt ?? 0,
        h.txval ?? 0, h.iamt ?? 0, h.camt ?? 0, h.samt ?? 0, h.csamt ?? 0,
      ])
    }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(b2bRows),   'b2b')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cdnrRows),  'cdnr')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hsnRows),   'hsn')
  downloadWb(wb, filename)
}

// Convert FY+month to an absolute index (base = FY 2018-19)
const BASE_FY = 2018
function toIdx(fy: string, month: string) {
  const s = parseInt(fy.split('-')[0])
  return (s - BASE_FY) * 12 + FY_M_L.indexOf(month)
}
function monthsBetween(fromFY: string, fromMonth: string, toFY: string, toMonth: string) {
  const from = toIdx(fromFY, fromMonth)
  const to   = toIdx(toFY, toMonth)
  if (from > to) return []
  const out: { fy: string; month: string }[] = []
  for (let i = from; i <= to; i++) {
    const s = BASE_FY + Math.floor(i / 12)
    out.push({ fy: `${s}-${String(s + 1).slice(-2)}`, month: FY_M_L[i % 12] })
  }
  return out
}

function periodSummary(periods: { fy: string; month: string }[]) {
  if (periods.length === 0) return 'No periods selected'
  if (periods.length === 1) return `${ms(periods[0].month)} ${periods[0].fy}`
  if (periods.length <= 3) return periods.map(p => `${ms(p.month)} ${p.fy.slice(0, 4)}`).join(', ')
  return `${periods.length} months`
}

/* ── PeriodBadge ───────────────────────────────────────────────────── */
function PeriodBadge({ p, onRemove }: { p: { fy: string; month: string }; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 border border-brand-100 text-brand-700 text-xs rounded-full">
      {ms(p.month)} {p.fy}
      {onRemove && (
        <button type="button" onClick={onRemove} className="hover:text-brand-900">
          <X size={10} />
        </button>
      )}
    </span>
  )
}

/* ── MonthGrid ─────────────────────────────────────────────────────── */
function MonthGrid({
  fys, selected, onToggle, onToggleAll,
}: {
  fys: string[]
  selected: Set<string>
  onToggle: (fy: string, month: string) => void
  onToggleAll: (fy: string) => void
}) {
  return (
    <div className="space-y-2 overflow-x-auto">
      {/* Header */}
      <div className="grid grid-cols-[72px_repeat(12,1fr)] gap-1 min-w-[640px]">
        <div />
        {FY_M_S.map(s => (
          <div key={s} className="text-center text-[10px] font-medium text-ink-400">{s}</div>
        ))}
      </div>
      {fys.map(fy => {
        const allSel = FY_M_L.every(m => selected.has(pk(fy, m)))
        return (
          <div key={fy} className="grid grid-cols-[72px_repeat(12,1fr)] gap-1 min-w-[640px]">
            <button
              type="button"
              onClick={() => onToggleAll(fy)}
              title={allSel ? 'Deselect all' : 'Select all'}
              className={`text-[10px] font-semibold rounded-lg px-1.5 py-1.5 border transition-colors text-center ${
                allSel
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-ink-600 border-ink-200 hover:border-brand-400'
              }`}
            >
              {fy}
            </button>
            {FY_M_L.map(month => {
              const sel = selected.has(pk(fy, month))
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => onToggle(fy, month)}
                  className={`text-[10px] font-medium rounded-lg py-1.5 border transition-colors ${
                    sel
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-500 border-ink-200 hover:border-brand-300 hover:text-ink-700'
                  }`}
                >
                  {ms(month)}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

/* ── Main Component ────────────────────────────────────────────────── */
export function GSTReturnDownloader() {
  // Login state
  const [phase, setPhase]       = useState<Phase>('idle')
  const [sessionId, setSid]     = useState('')
  const [captchaImg, setCImg]   = useState('')
  const [username, setUser]     = useState('')
  const [password, setPass]     = useState('')
  const [showPass, setShowPass] = useState(false)
  const [captchaText, setCText] = useState('')
  const [errorMsg, setErr]      = useState('')

  // Period selection state
  const [returnType, setRT]  = useState<ReturnType>('GSTR-2B')
  const [format, setFmt]     = useState<Format>('excel')
  const [preset, setPre]     = useState<Preset>('last3')
  const [cMode, setCMode]    = useState<CustomMode>('by-month')
  const [selMonths, setSelM] = useState<Set<string>>(new Set())
  const [selYears, setSelY]  = useState<Set<string>>(new Set())
  const [showFYs, setShowFYs] = useState(3)
  const [rangeFrom, setRangeFrom] = useState({ fy: prevFY(), month: 'April' })
  const [rangeTo,   setRangeTo]   = useState(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1)
    const month = d.toLocaleString('en-US', { month: 'long' })
    return { fy: curFY(), month }
  })

  // Download state
  const [queue, setQueue]     = useState<DownloadItem[]>([])
  const [isDownloading, setDl] = useState(false)
  const [logsMap, setLogsMap] = useState<Record<string, string[]>>({})

  /* ── Computed periods ─────────────────────────────────────────── */
  const periods = useMemo(() => {
    if (preset === 'last3')      return lastN(3)
    if (preset === 'last6')      return lastN(6)
    if (preset === 'current-fy') return fyAll(curFY())
    if (preset === 'prev-fy')    return fyAll(prevFY())
    if (preset === 'range')      return monthsBetween(rangeFrom.fy, rangeFrom.month, rangeTo.fy, rangeTo.month)
    if (cMode === 'by-month')
      return [...selMonths].map(k => { const [fy, month] = k.split('|'); return { fy, month } })
    return [...selYears].flatMap(fy => fyAll(fy))
  }, [preset, cMode, selMonths, selYears, rangeFrom, rangeTo])

  /* ── Login ────────────────────────────────────────────────────── */
  async function loadCaptcha() {
    if (!username.trim()) return
    setPhase('captcha-loading'); setCText(''); setCImg('')
    try {
      const r = await gstReturns.getCaptcha(username.trim())
      setCImg(r.captcha); setSid(r.sessionId); setPhase('login')
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Failed'); setPhase('error') }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password || !captchaText.trim()) return
    setPhase('logging-in')
    try {
      const r = await gstReturns.login(sessionId, username.trim(), password, captchaText.trim())
      setSid(r.sessionId); setPhase('select-period')
    } catch (e: unknown) { setErr(e instanceof Error ? e.message : 'Login failed'); setPhase('login') }
  }

  /* ── Download ─────────────────────────────────────────────────── */
  function addLog(itemId: string, text: string) {
    setLogsMap(m => ({ ...m, [itemId]: [...(m[itemId] ?? []), text] }))
  }

  async function handleDownload() {
    if (periods.length === 0 || isDownloading) return
    // GSTR-1 'all' = JSON + PDF (Excel is derived from JSON client-side, not a separate download)
    const fmts: Format[] = format === 'both' ? ['excel', 'json']
      : format === 'all' ? (returnType === 'GSTR-1' ? ['json', 'pdf'] : ['excel', 'json', 'pdf'])
      : [format]
    const items: DownloadItem[] = periods.flatMap((p, pi) =>
      fmts.map(fmt => ({ id: `${pi}-${fmt}`, ...p, fmt, status: 'pending' as ItemStatus }))
    )
    setQueue(items); setDl(true); setLogsMap({})

    const pollers: Promise<void>[] = []

    async function pollJob(itemId: string, jobId: string) {
      for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise<void>(r => setTimeout(r, 60_000))
        addLog(itemId, `Checking portal status... (${attempt + 1} / 20)`)
        try {
          const r = await gstReturns.checkDownload(jobId)
          if (r.status === 'done' && r.base64) {
            addLog(itemId, `File is ready — ${r.filename ?? 'downloading'}`)
            setQueue(q => q.map(x => x.id === itemId
              ? { ...x, status: 'done', filename: r.filename!, base64: r.base64, isPDF: r.isPDF }
              : x))
            return
          }
          addLog(itemId, `Still generating... checking again in 60 s`)
        } catch { /* keep polling */ }
      }
      addLog(itemId, `Timed out — portal took over 20 minutes`)
      setQueue(q => q.map(x => x.id === itemId
        ? { ...x, status: 'error', error: 'GST portal took over 20 minutes to generate the file.' }
        : x))
    }

    for (let i = 0; i < items.length; i++) {
      const item  = items[i]
      const iid   = item.id
      const { fy, month, fmt: itemFmt } = item
      setQueue(q => q.map(x => x.id === iid ? { ...x, status: 'active' } : x))

      // Simulated steps matching backend timing (~25 s total for generate-page returns)
      const fmtLabel = itemFmt === 'json' ? 'JSON' : itemFmt === 'pdf' ? 'PDF' : 'Excel'
      const isGSTR1  = returnType === 'GSTR-1'
      const STEPS = [
        { text: `Opening ${returnType} returns page...`,                                                delay: 300 },
        { text: `Navigating to returns dashboard...`,                                                   delay: 2800 },
        { text: `Selecting financial year ${fy}...`,                                                    delay: 5800 },
        { text: `Selecting ${month}...`,                                                                delay: 9000 },
        { text: `Searching for ${returnType}...`,                                                       delay: 12000 },
        { text: isGSTR1 ? `Found ${returnType} — clicking View...` : `Found ${returnType} — clicking Download...`, delay: 16500 },
        { text: isGSTR1 ? `Downloading ${fmtLabel} from GSTR-1/IFF page...` : `Requesting ${fmtLabel} file generation...`, delay: 20500 },
      ]
      const timers = STEPS.map(s => setTimeout(() => addLog(iid, s.text), s.delay))

      try {
        const r = await gstReturns.download(sessionId, fy, month, returnType, itemFmt)
        timers.forEach(clearTimeout)

        if (r.status === 'generating' && r.jobId) {
          addLog(iid, `Portal acknowledged — generating ${fmtLabel} (up to 20 min)`)
          addLog(iid, `Checking back every 60 seconds...`)
          setQueue(q => q.map(x => x.id === iid ? { ...x, status: 'generating', jobId: r.jobId } : x))
          pollers.push(pollJob(iid, r.jobId))
        } else {
          addLog(iid, `${r.filename ?? 'File'} downloaded`)
          setQueue(q => q.map(x => x.id === iid
            ? { ...x, status: 'done', filename: r.filename, base64: r.base64, isPDF: r.isPDF } : x))
        }
      } catch (e) {
        timers.forEach(clearTimeout)
        const msg = e instanceof Error ? e.message : 'Failed'
        if (msg.includes('expired') || msg.includes('SESSION_EXPIRED') || msg.includes('login again')) {
          setDl(false)
          setQueue([])
          setLogsMap({})
          setSid('')
          setPhase('idle')
          setErr('Your GST portal session expired. Please login again.')
          return
        }
        addLog(iid, `Error: ${msg}`)
        setQueue(q => q.map(x => x.id === iid ? { ...x, status: 'error', error: msg } : x))
      }
    }

    setDl(false)
    if (pollers.length > 0) void Promise.allSettled(pollers)
  }

  async function handleReset() {
    if (sessionId) { try { await gstReturns.logout(sessionId) } catch { /* ignore */ } }
    setSid(''); setCImg(''); setUser(''); setPass(''); setCText('')
    setQueue([]); setLogsMap({}); setErr(''); setPhase('idle')
  }

  /* ── Toggle helpers ───────────────────────────────────────────── */
  function toggleMonth(fy: string, month: string) {
    const key = pk(fy, month)
    setSelM(s => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n })
    if (preset !== 'custom') setPre('custom')
  }
  function toggleFYMonths(fy: string) {
    const keys = FY_M_L.map(m => pk(fy, m))
    const allSel = keys.every(k => selMonths.has(k))
    setSelM(s => {
      const n = new Set(s)
      keys.forEach(k => allSel ? n.delete(k) : n.add(k))
      return n
    })
    if (preset !== 'custom') setPre('custom')
  }
  function toggleYear(fy: string) {
    setSelY(s => { const n = new Set(s); n.has(fy) ? n.delete(fy) : n.add(fy); return n })
    if (preset !== 'custom') setPre('custom')
  }

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── LOGIN CARD ── */}
      {(phase === 'idle' || phase === 'captcha-loading' || phase === 'login' || phase === 'logging-in') && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-4">GST Portal Login</p>
          <form
            onSubmit={phase === 'idle' ? (e) => { e.preventDefault(); void loadCaptcha() } : handleLogin}
            className="space-y-4"
          >
            <Input label="Username" value={username}
              onChange={e => { setUser(e.target.value); if (phase !== 'idle') { setPhase('idle'); setCImg('') } }}
              placeholder="e.g. AABCW7102K_76"
              disabled={phase === 'logging-in' || phase === 'captcha-loading'}
              autoComplete="username" />

            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPass(e.target.value)}
              placeholder="Enter password"
              disabled={phase === 'logging-in' || phase === 'captcha-loading'}
              autoComplete="current-password"
              suffix={
                <button type="button" tabIndex={-1} onClick={() => setShowPass(v => !v)}
                  className="text-ink-400 hover:text-ink-700">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {(phase === 'captcha-loading' || phase === 'login') && (
              <div>
                <p className="label-base mb-2">Captcha</p>
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-36 h-12 rounded-xl border border-ink-200 bg-ink-50 overflow-hidden flex items-center justify-center">
                    {phase === 'captcha-loading'
                      ? <div className="w-5 h-5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      : captchaImg
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={captchaImg} alt="Captcha" className="w-full h-full object-contain" />
                        : null}
                  </div>
                  <div className="flex-1">
                    <Input value={captchaText} onChange={e => setCText(e.target.value)}
                      placeholder="Enter characters shown" disabled={phase !== 'login'} className="font-mono" />
                  </div>
                  <button type="button" onClick={loadCaptcha} disabled={phase !== 'login' || !username.trim()}
                    className="flex-shrink-0 w-10 h-10 rounded-xl border border-ink-200 bg-white hover:bg-ink-50 flex items-center justify-center disabled:opacity-40"
                    title="Refresh captcha">
                    <RefreshCw size={15} className="text-ink-500" />
                  </button>
                </div>
                {phase === 'captcha-loading' && (
                  <p className="mt-2 text-xs text-ink-400 flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-ink-300 border-t-transparent rounded-full animate-spin inline-block" />
                    Opening GST portal…
                  </p>
                )}
              </div>
            )}

            {phase === 'idle' && (
              <button type="submit" disabled={!username.trim() || !password}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                Next — Load Captcha
              </button>
            )}
            {(phase === 'login' || phase === 'logging-in' || phase === 'captcha-loading') && (
              <button type={phase === 'login' ? 'submit' : 'button'}
                disabled={phase !== 'login' || !captchaText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {phase === 'logging-in'
                  ? <><Loader2 size={15} className="animate-spin" /> Logging in…</>
                  : phase === 'captcha-loading'
                    ? <><Loader2 size={15} className="animate-spin" /> Loading captcha…</>
                    : <><LogIn size={16} /> Login to GST Portal</>}
              </button>
            )}
          </form>
          {errorMsg && phase === 'idle' && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{errorMsg}</p>
            </div>
          )}
          <p className="mt-3 text-xs text-ink-400 text-center">Your credentials are used only to fetch returns — never stored.</p>
        </Card>
      )}

      {/* ── PERIOD SELECTION CARD ── */}
      {phase === 'select-period' && (
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 size={15} className="text-green-600" />
            <p className="text-sm font-semibold text-green-700">Logged in successfully</p>
          </div>

          {/* ── 1. Return Type ── */}
          <div className="mb-5">
            <p className="label-base mb-2">Return Type</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RETURN_TYPES.map(({ type, sub }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setRT(type)
                    // Auto-reset incompatible formats when switching return types
                    if (type === 'GSTR-1' && (format === 'excel' || format === 'both')) setFmt('json')
                    if (type !== 'GSTR-1' && (format === 'pdf' || format === 'all')) setFmt('excel')
                  }}
                  className={`flex flex-col items-center px-3 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    returnType === type
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300'
                  }`}
                >
                  {type}
                  <span className={`text-[10px] font-normal mt-0.5 ${returnType === type ? 'text-brand-100' : 'text-ink-400'}`}>
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 2. Format ── */}
          <div className="mb-5">
            <p className="label-base mb-2">Format</p>
            {returnType === 'GSTR-3B' ? (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-ink-50 border border-ink-200 rounded-xl w-fit">
                <FileText size={14} className="text-ink-500" />
                <div>
                  <p className="text-sm font-semibold text-ink-700">PDF only</p>
                  <p className="text-[10px] text-ink-400 mt-0.5">GSTR-3B is available as PDF from the portal</p>
                </div>
              </div>
            ) : (
            <div className="flex gap-2">
              {(returnType === 'GSTR-1' ? ([
                { id: 'json'  as Format, icon: FileText,        label: 'JSON',  sub: 'Data + Excel',     soon: false },
                { id: 'pdf'   as Format, icon: FileText,        label: 'PDF',   sub: 'Filed return',     soon: false },
                { id: 'all'   as Format, icon: Download,        label: 'All',   sub: 'JSON + PDF',       soon: false },
              ]) : ([
                { id: 'excel' as Format, icon: FileSpreadsheet, label: 'Excel', sub: 'Spreadsheet', soon: false },
                { id: 'json'  as Format, icon: FileText,        label: 'JSON',  sub: 'Raw data',    soon: false },
                { id: 'both'  as Format, icon: Download,        label: 'Both',  sub: 'Excel + JSON', soon: true  },
              ]) as { id: Format; icon: React.ElementType; label: string; sub: string; soon: boolean }[]).map(({ id, icon: Icon, label, sub, soon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFmt(id)}
                  className={`relative flex flex-col items-start px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    format === id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={13} />
                    {label}
                    {soon && (
                      <span className={`text-[9px] px-1 py-0.5 rounded font-semibold ${format === id ? 'bg-brand-500 text-brand-100' : 'bg-ink-100 text-ink-400'}`}>
                        Soon
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-normal mt-0.5 ${format === id ? 'text-brand-100' : 'text-ink-400'}`}>{sub}</span>
                </button>
              ))}
            </div>
            )}
          </div>

          {/* ── 3. Period ── */}
          <div className="mb-5">
            <p className="label-base mb-2">Period</p>

            {/* Preset pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {([
                { id: 'last3'      as Preset, label: 'Last 3 Months' },
                { id: 'last6'      as Preset, label: 'Last 6 Months' },
                { id: 'current-fy' as Preset, label: `Current FY (${curFY()})` },
                { id: 'prev-fy'    as Preset, label: `Prev FY (${prevFY()})` },
              ] as { id: Preset; label: string }[]).map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPre(id)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    preset === id
                      ? 'bg-ink-800 text-white border-ink-800'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                  }`}
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPre('range')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  preset === 'range'
                    ? 'bg-ink-800 text-white border-ink-800'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                }`}
              >
                Date Range
              </button>
              <button
                type="button"
                onClick={() => setPre('custom')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors flex items-center gap-1 ${
                  preset === 'custom'
                    ? 'bg-ink-800 text-white border-ink-800'
                    : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'
                }`}
              >
                Custom <ChevronDown size={11} className={preset === 'custom' ? 'rotate-180' : ''} />
              </button>
            </div>

            {/* ── Date Range selector ── */}
            {preset === 'range' && (
              <div className="border border-ink-200 rounded-xl p-3 bg-ink-50/40 space-y-3">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  {/* FROM */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">From</p>
                    <div className="relative">
                      <select
                        value={rangeFrom.fy}
                        onChange={e => setRangeFrom(v => ({ ...v, fy: e.target.value }))}
                        className="w-full appearance-none border border-ink-200 rounded-xl px-3 py-2 text-sm bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-7"
                      >
                        {FY_LIST.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={rangeFrom.month}
                        onChange={e => setRangeFrom(v => ({ ...v, month: e.target.value }))}
                        className="w-full appearance-none border border-ink-200 rounded-xl px-3 py-2 text-sm bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-7"
                      >
                        {FY_M_L.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex flex-col items-center gap-1 pt-6">
                    <div className="w-8 h-px bg-ink-300" />
                    <span className="text-ink-400 text-xs">→</span>
                  </div>

                  {/* TO */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">To</p>
                    <div className="relative">
                      <select
                        value={rangeTo.fy}
                        onChange={e => setRangeTo(v => ({ ...v, fy: e.target.value }))}
                        className="w-full appearance-none border border-ink-200 rounded-xl px-3 py-2 text-sm bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-7"
                      >
                        {FY_LIST.map(fy => <option key={fy} value={fy}>{fy}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <select
                        value={rangeTo.month}
                        onChange={e => setRangeTo(v => ({ ...v, month: e.target.value }))}
                        className="w-full appearance-none border border-ink-200 rounded-xl px-3 py-2 text-sm bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-500 pr-7"
                      >
                        {FY_M_L.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Range summary */}
                {periods.length > 0 ? (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-semibold rounded-lg">
                      {periods.length} month{periods.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-xs text-ink-500">
                      {ms(periods[0].month)} {periods[0].fy} → {ms(periods[periods.length - 1].month)} {periods[periods.length - 1].fy}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-red-500 pt-1">
                    "From" date must be before "To" date
                  </p>
                )}
              </div>
            )}

            {/* Custom selector */}
            {preset === 'custom' && (
              <div className="border border-ink-200 rounded-xl p-3 bg-ink-50/40 space-y-3">
                {/* Mode tabs */}
                <div className="flex gap-1.5">
                  {(['by-month', 'by-year'] as CustomMode[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCMode(m)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        cMode === m ? 'bg-white border-ink-300 text-ink-800 shadow-sm' : 'bg-transparent border-transparent text-ink-500 hover:text-ink-700'
                      }`}
                    >
                      {m === 'by-month' ? 'Select Months' : 'Select Years'}
                    </button>
                  ))}
                </div>

                {/* By Month grid */}
                {cMode === 'by-month' && (
                  <div className="space-y-2">
                    <MonthGrid
                      fys={FY_LIST.slice(0, showFYs)}
                      selected={selMonths}
                      onToggle={toggleMonth}
                      onToggleAll={toggleFYMonths}
                    />
                    {showFYs < FY_LIST.length && (
                      <button type="button" onClick={() => setShowFYs(v => v + 2)}
                        className="text-xs text-ink-400 hover:text-ink-600 flex items-center gap-1">
                        <ChevronDown size={12} /> Show older years
                      </button>
                    )}
                    {selMonths.size > 0 && (
                      <button type="button" onClick={() => setSelM(new Set())}
                        className="text-xs text-red-500 hover:text-red-700">
                        Clear selection
                      </button>
                    )}
                  </div>
                )}

                {/* By Year grid */}
                {cMode === 'by-year' && (
                  <div className="grid grid-cols-3 gap-2">
                    {FY_LIST.map(fy => {
                      const sel = selYears.has(fy)
                      return (
                        <button
                          key={fy}
                          type="button"
                          onClick={() => toggleYear(fy)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                            sel
                              ? 'bg-brand-600 text-white border-brand-600'
                              : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300'
                          }`}
                        >
                          <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center ${sel ? 'bg-white border-white' : 'border-ink-300'}`}>
                            {sel && <CheckCircle2 size={12} className="text-brand-600" />}
                          </span>
                          {fy}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Period preview */}
            {periods.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {periods.slice(0, 8).map(p => (
                  <PeriodBadge key={pk(p.fy, p.month)} p={p}
                    onRemove={preset === 'custom' && cMode === 'by-month' ? () => toggleMonth(p.fy, p.month) : undefined} />
                ))}
                {periods.length > 8 && (
                  <span className="inline-flex items-center px-2 py-0.5 bg-ink-100 text-ink-500 text-xs rounded-full">
                    +{periods.length - 8} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* ── Download button ── */}
          {(() => {
            const done  = queue.filter(x => x.status === 'done' || x.status === 'error').length
            const total = queue.length
            const pct   = total > 0 ? Math.round((done / total) * 100) : 0
            const showProgress = isDownloading && returnType === 'GSTR-1' && total > 0
            return (
              <button
                type="button"
                onClick={handleDownload}
                disabled={periods.length === 0 || isDownloading}
                className={`relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors
                  ${isDownloading
                    ? 'bg-brand-400 text-white cursor-not-allowed'
                    : periods.length === 0
                      ? 'bg-brand-200 text-brand-400 cursor-not-allowed'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
              >
                {/* progress fill bar — sweep is a child so it's clipped to the filled area */}
                {showProgress && (
                  <span
                    className="absolute inset-y-0 left-0 overflow-hidden bg-brand-600 transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  >
                    <span className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-sweep" />
                  </span>
                )}
                <span className="relative flex items-center gap-2">
                  {isDownloading
                    ? showProgress
                      ? <><Loader2 size={16} className="animate-spin" /> {done} of {total} downloaded…</>
                      : <><Loader2 size={16} className="animate-spin" /> Downloading…</>
                    : <><Download size={16} /> Download {returnType} ({periodSummary(periods)})</>
                  }
                </span>
              </button>
            )
          })()}
        </Card>
      )}

      {/* ── DOWNLOAD QUEUE ── */}
      {queue.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
              {returnType} · {format === 'excel' ? 'Excel' : format === 'json' ? 'JSON' : format === 'pdf' ? 'PDF' : format === 'all' ? 'All' : 'Both'} — {queue.length} period{queue.length !== 1 ? 's' : ''}
            </p>
            {!isDownloading && (
              <button onClick={() => setPhase('select-period')} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                + Download more
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {queue.map(item => {
              const logs = logsMap[item.id] ?? []
              const isLive = item.status === 'active' || item.status === 'generating'
              const isJSON = /\.json$/i.test(item.filename ?? '')
              // For GSTR-1 JSON items, Excel is derived client-side — show both buttons
              const isGSTR1JSON = returnType === 'GSTR-1' && isJSON
              const saveLabel = item.isPDF ? 'Save PDF' : isJSON ? 'Save JSON' : 'Save Excel'
              return (
                <div key={item.id} className={`rounded-xl border text-xs overflow-hidden ${
                  item.status === 'done'       ? 'bg-green-50 border-green-100' :
                  item.status === 'error'      ? 'bg-red-50 border-red-100' :
                  item.status === 'active'     ? 'bg-brand-50 border-brand-100' :
                  item.status === 'generating' ? 'bg-amber-50 border-amber-100' :
                  'bg-ink-50 border-ink-100'
                }`}>
                  {/* ── header row ── */}
                  <div className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      {item.status === 'pending'    && <div className="w-4 h-4 rounded-full border-2 border-ink-300 flex-shrink-0" />}
                      {item.status === 'active'     && <Loader2 size={14} className="animate-spin text-brand-600 flex-shrink-0" />}
                      {item.status === 'generating' && <RefreshCw size={14} className="animate-spin text-amber-500 flex-shrink-0" />}
                      {item.status === 'done'       && <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" />}
                      {item.status === 'error'      && <X size={14} className="text-red-500 flex-shrink-0" />}
                      <span className={`font-semibold ${
                        item.status === 'done'       ? 'text-green-800' :
                        item.status === 'error'      ? 'text-red-700' :
                        item.status === 'active'     ? 'text-brand-800' :
                        item.status === 'generating' ? 'text-amber-700' :
                        'text-ink-500'
                      }`}>
                        {ms(item.month)} {item.fy}{(format === 'both' || format === 'all') ? ` · ${item.fmt === 'json' ? 'JSON' : item.fmt === 'pdf' ? 'PDF' : 'Excel'}` : ''}
                      </span>
                      {item.status === 'error' && item.error && (
                        <span className="text-red-500 text-[10px] truncate max-w-[180px]">{item.error}</span>
                      )}
                      {item.status === 'generating' && (
                        <span className="text-amber-600 text-[10px]">up to 20 min…</span>
                      )}
                    </div>
                    {item.status === 'done' && item.base64 && item.filename && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {isGSTR1JSON && (
                          <button
                            type="button"
                            onClick={() => gstr1ToExcel(
                              [{ base64: item.base64!, month: item.month, fy: item.fy }],
                              `GSTR-1_${item.month}_${item.fy}.xlsx`,
                            )}
                            className="flex items-center gap-1 px-2.5 py-1 bg-green-700 text-white rounded-lg text-[10px] font-medium hover:bg-green-800 transition-colors"
                          >
                            <Download size={10} /> Save Excel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => saveFile(item.base64!, item.filename!, item.isPDF)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-green-700 text-white rounded-lg text-[10px] font-medium hover:bg-green-800 transition-colors"
                        >
                          <Download size={10} /> {saveLabel}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* ── thinking log ── */}
                  {logs.length > 0 && (
                    <div className={`px-3 pb-2.5 border-t ${
                      item.status === 'active'     ? 'border-brand-100' :
                      item.status === 'generating' ? 'border-amber-100' :
                      item.status === 'done'       ? 'border-green-100' :
                      item.status === 'error'      ? 'border-red-100' :
                      'border-ink-100'
                    }`}>
                      <div className="mt-2 pl-3 border-l-2 border-ink-200 space-y-1 max-h-[140px] overflow-y-auto">
                        {logs.map((entry, idx) => {
                          const isLatest = idx === logs.length - 1
                          return (
                            <div
                              key={idx}
                              className="flex items-start gap-2 animate-slide-in"
                              style={{ animationFillMode: 'both' }}
                            >
                              <span className={`mt-[3px] w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                isLatest && isLive ? 'bg-brand-500 animate-pulse' :
                                item.status === 'error' && isLatest ? 'bg-red-400' :
                                item.status === 'done' && isLatest ? 'bg-green-500' :
                                'bg-ink-300'
                              }`} />
                              <span className={`text-[10px] leading-relaxed ${
                                isLatest && isLive            ? 'text-ink-700 font-medium' :
                                isLatest && item.status === 'done'  ? 'text-green-700' :
                                isLatest && item.status === 'error' ? 'text-red-600' :
                                'text-ink-400'
                              }`}>
                                {entry}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {!isDownloading && (() => {
            const doneJSONs = returnType !== 'GSTR-3B' ? queue.filter(x => x.status === 'done' && x.base64 && /\.json$/i.test(x.filename ?? '')) : []
            return (
              <div className="mt-3 flex gap-2">
                {doneJSONs.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const merged: Record<string, unknown> = {}
                        for (const item of doneJSONs) {
                          const key = `${item.month}_${item.fy}`
                          try { merged[key] = JSON.parse(atob(item.base64!)) }
                          catch { merged[key] = item.base64 }
                        }
                        saveFile(btoa(JSON.stringify(merged, null, 2)), `${returnType}_merged.json`)
                      }}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                    >
                      <FileText size={13} /> Master JSON ({doneJSONs.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const excelItems = doneJSONs.map(x => ({ base64: x.base64!, month: x.month, fy: x.fy }))
                        const fname = `${returnType}_${doneJSONs[0].fy}.xlsx`
                        if (returnType === 'GSTR-2B') gstr2bToExcel(excelItems, fname)
                        else if (returnType === 'GSTR-1') gstr1ToExcel(excelItems, fname)
                        else gstr2aToExcel(excelItems, fname)
                      }}
                      className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
                    >
                      <FileSpreadsheet size={13} /> Master Excel ({doneJSONs.length})
                    </button>
                  </>
                )}
                <button onClick={handleReset} className="btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm">
                  <LogIn size={13} /> Logout
                </button>
              </div>
            )
          })()}
        </Card>
      )}

      {/* ── ERROR ── */}
      {phase === 'error' && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Something went wrong</p>
            <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            <button onClick={handleReset} className="mt-2 text-xs text-red-700 font-medium underline">Try again</button>
          </div>
        </div>
      )}
    </div>
  )
}
