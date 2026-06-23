'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, FileText, X, CheckCircle, AlertCircle, Loader2,
  Download, FileSpreadsheet, ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { Card } from '@/components/ui'
import * as XLSX from 'xlsx'
import {
  parseForm16, parseForm16A,
  type Form16Type, type ParsedForm16, type ParsedForm16A,
} from '@/lib/logic/form16-parser'

// ── PDF text extraction ───────────────────────────────────────────────────────
// Groups text items by Y coordinate so each visual line becomes one text line.
// Within a line, uses fragment width + X gap to detect column boundaries.
// Gap > COL_GAP_THRESHOLD pts = column separator (joined as "  |  ").
// Gap > WORD_GAP pts but < COL_GAP = space between words.
// This correctly splits "ARTISANAL DRINKS PRIVATE LIMITED  |  ANKUSH JAIN" even when
// individual words are separate PDF fragments.

const COL_GAP_THRESHOLD = 25  // PDF points; typical inter-column gap in TRACES A4 PDFs
const WORD_GAP_THRESHOLD = 1   // fragments touching (no gap) vs small space

async function extractPages(file: File): Promise<string[]> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pages: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = content.items as any[]

    // Group fragments by rounded Y (±2 pts tolerance to handle slight baseline shifts)
    type Frag = { x: number; w: number; str: string }
    const lineMap = new Map<number, Frag[]>()
    for (const item of items) {
      if (!('str' in item) || !item.str.trim()) continue
      // Bucket to nearest 2-pt bin so items on same visual row land together
      const y = Math.round(item.transform[5] / 2) * 2
      const x = item.transform[4]
      const w = item.width ?? 0
      if (!lineMap.has(y)) lineMap.set(y, [])
      lineMap.get(y)!.push({ x, w, str: item.str })
    }

    const sortedLines = [...lineMap.entries()]
      .sort((a, b) => b[0] - a[0])            // top-to-bottom (higher y = higher on page)
      .map(([, frags]) => {
        const sorted = frags.sort((a, b) => a.x - b.x)
        // Merge fragments into column-aware string
        const cols: string[] = []
        let curCol = sorted[0]?.str ?? ''
        let curEnd = (sorted[0]?.x ?? 0) + (sorted[0]?.w ?? 0)

        for (let fi = 1; fi < sorted.length; fi++) {
          const frag = sorted[fi]
          const gap = frag.x - curEnd
          if (gap > COL_GAP_THRESHOLD) {
            // Large gap → new column
            if (curCol.trim()) cols.push(curCol.trim())
            curCol = frag.str
          } else if (gap > WORD_GAP_THRESHOLD) {
            curCol += ' ' + frag.str   // small gap → word space
          } else {
            curCol += frag.str         // touching → concatenate
          }
          curEnd = frag.x + frag.w
        }
        if (curCol.trim()) cols.push(curCol.trim())
        return cols.join('  ')          // columns separated by double-space
      })
      .filter(l => l.length > 0)

    pages.push(sortedLines.join('\n'))
  }

  return pages
}

// ── Types ─────────────────────────────────────────────────────────────────────

type FileStatus = 'queued' | 'processing' | 'done' | 'error'

interface FileEntry {
  id:       string
  file:     File
  status:   FileStatus
  result?:  ParsedForm16 | ParsedForm16A
  rawText?: string    // first 2000 chars of extracted text for debugging
  error?:   string
}

let _id = 0
const uid = () => `f${++_id}`

// ── Excel helpers ─────────────────────────────────────────────────────────────

function downloadForm16Excel(results: ParsedForm16[], filename: string) {
  const headers = [
    'File', 'Employee Name', 'Employee PAN',
    'Employer Name', 'Employer PAN', 'Employer TAN',
    'Assessment Year', 'Financial Year', 'Period From', 'Period To',
    'Gross Salary (₹)', 'Allowances Exempt (₹)', 'Standard Deduction (₹)', 'Net Salary (₹)',
    'Sec 80C (₹)', 'Sec 80D (₹)', 'Sec 80CCD(1B) (₹)', 'Total Chapter VIA (₹)',
    'Taxable Income (₹)', 'Total Tax Payable (₹)', 'Total TDS Deducted (₹)', 'Total TDS Deposited (₹)',
    'Status',
  ]
  const rows = results.map(r => [
    r.filename, r.employeeName, r.employeePAN,
    r.employerName, r.employerPAN, r.employerTAN,
    r.assessmentYear, r.financialYear, r.periodFrom, r.periodTo,
    r.grossSalary, r.allowancesExempt, r.standardDeduction, r.netSalary,
    r.sec80C, r.sec80D, r.sec80CCD1B, r.totalChapterVIA,
    r.taxableIncome, r.netTaxPayable, r.totalTDSDeducted, r.totalTDSDeposited,
    r.status,
  ])

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map((h, i) => ({ wch: i === 0 ? 30 : i <= 3 ? 24 : 16 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Form 16 Data')
  XLSX.writeFile(wb, filename)
}

function downloadForm16AExcel(results: ParsedForm16A[], filename: string) {
  const headers = [
    'File', 'Deductor Name', 'Deductor TAN', 'Deductor PAN',
    'Deductee Name', 'Deductee PAN',
    'Assessment Year', 'Financial Year',
    'Section', 'Nature of Payment', 'Amount Paid (₹)', 'TDS Deducted (₹)', 'TDS Deposited (₹)',
    'Challan BSR', 'Challan Date', 'Challan Serial', 'Status',
  ]

  const rows: (string | number)[][] = []
  for (const r of results) {
    if (r.entries.length === 0) {
      rows.push([
        r.filename, r.deductorName, r.deductorTAN, r.deductorPAN,
        r.deducteeName, r.deducteePAN,
        r.assessmentYear, r.financialYear,
        '', '', '', '', '', '', '', '', r.status,
      ])
    } else {
      for (const e of r.entries) {
        rows.push([
          r.filename, r.deductorName, r.deductorTAN, r.deductorPAN,
          r.deducteeName, r.deducteePAN,
          r.assessmentYear, r.financialYear,
          e.section, e.natureOfPayment, e.amountPaid, e.tdsDeducted, e.tdsDeposited,
          e.challanBSRCode, e.challanDate, e.challanSerial, r.status,
        ])
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = headers.map(() => ({ wch: 20 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Form 16A Data')
  XLSX.writeFile(wb, filename)
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, error }: { status: FileStatus; error?: string }) {
  if (status === 'queued')
    return <span className="text-xs text-ink-400 flex items-center gap-1"><FileText size={12} /> Queued</span>
  if (status === 'processing')
    return <span className="text-xs text-brand-500 flex items-center gap-1 animate-pulse"><Loader2 size={12} className="animate-spin" /> Parsing…</span>
  if (status === 'done')
    return <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={12} /> Done</span>
  return (
    <span className="text-xs text-red-500 flex items-center gap-1" title={error}>
      <AlertCircle size={12} /> Error
    </span>
  )
}

// ── Form 16 result row ────────────────────────────────────────────────────────

function Form16Row({ r, idx, rawText }: { r: ParsedForm16; idx: number; rawText?: string }) {
  const [open, setOpen] = useState(false)
  const [showRaw, setShowRaw] = useState(false)
  const anyField = r.employeeName || r.grossSalary || r.totalTDSDeducted
  return (
    <div className="border border-ink-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-ink-50/50 hover:bg-ink-50 transition-colors text-left"
      >
        <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
        <span className="flex-1 text-sm font-medium text-ink-700 truncate">{r.filename}</span>
        {r.status === 'partial' && (
          <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Partial</span>
        )}
        {r.status === 'parsed' && (
          <span className="text-[11px] text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">Parsed</span>
        )}
        {open ? <ChevronUp size={14} className="text-ink-400 shrink-0" /> : <ChevronDown size={14} className="text-ink-400 shrink-0" />}
      </button>
      {open && (
        <div className="p-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Employee Name',      r.employeeName],
              ['Employee PAN',       r.employeePAN],
              ['Employer Name',      r.employerName],
              ['Employer TAN',       r.employerTAN],
              ['Employer PAN',       r.employerPAN],
              ['Assessment Year',    r.assessmentYear],
              ['Financial Year',     r.financialYear],
              ['Period',             r.periodFrom && r.periodTo ? `${r.periodFrom} – ${r.periodTo}` : (r.periodFrom || r.periodTo)],
              ['Gross Salary',       r.grossSalary ? `₹${r.grossSalary}` : ''],
              ['Standard Deduction', r.standardDeduction ? `₹${r.standardDeduction}` : ''],
              ['Net Salary',         r.netSalary ? `₹${r.netSalary}` : ''],
              ['Total Chapter VIA',  r.totalChapterVIA ? `₹${r.totalChapterVIA}` : ''],
              ['Taxable Income',     r.taxableIncome ? `₹${r.taxableIncome}` : ''],
              ['Net Tax Payable',    r.netTaxPayable ? `₹${r.netTaxPayable}` : ''],
              ['TDS Deducted',       r.totalTDSDeducted ? `₹${r.totalTDSDeducted}` : ''],
              ['TDS Deposited',      r.totalTDSDeposited ? `₹${r.totalTDSDeposited}` : ''],
            ].map(([label, value]) => (
              <div key={label} className={`rounded-lg px-3 py-2 ${value ? 'bg-ink-50' : 'bg-red-50/40 border border-red-100'}`}>
                <p className="text-ink-400 mb-0.5">{label}</p>
                <p className={`font-medium ${value ? 'text-ink-700' : 'text-ink-300 italic'}`}>{value || 'Not found'}</p>
              </div>
            ))}
          </div>
          {rawText && (
            <div>
              <button
                onClick={() => setShowRaw(v => !v)}
                className="text-[11px] text-ink-400 hover:text-ink-600 underline underline-offset-2"
              >
                {showRaw ? 'Hide' : 'Show'} raw extracted text (debug)
              </button>
              {showRaw && (
                <pre className="mt-2 p-3 bg-ink-50 rounded-lg text-[10px] text-ink-600 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto border border-ink-100">
                  {rawText}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Form 16A result row ───────────────────────────────────────────────────────

function Form16ARow({ r, idx }: { r: ParsedForm16A; idx: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-ink-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-ink-50/50 hover:bg-ink-50 transition-colors text-left"
      >
        <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
        <span className="flex-1 text-sm font-medium text-ink-700 truncate">{r.filename}</span>
        {r.entries.length > 0 && (
          <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">{r.entries.length} entr{r.entries.length > 1 ? 'ies' : 'y'}</span>
        )}
        {r.status === 'partial' && (
          <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">Partial</span>
        )}
        {open ? <ChevronUp size={14} className="text-ink-400 shrink-0" /> : <ChevronDown size={14} className="text-ink-400 shrink-0" />}
      </button>
      {open && (
        <div className="p-4 space-y-3 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              ['Deductor Name',  r.deductorName],
              ['Deductor TAN',   r.deductorTAN],
              ['Deductor PAN',   r.deductorPAN],
              ['Deductee Name',  r.deducteeName],
              ['Deductee PAN',   r.deducteePAN],
              ['Assessment Year', r.assessmentYear],
              ['Financial Year', r.financialYear],
            ].map(([label, value]) => (
              <div key={label} className={`rounded-lg px-3 py-2 ${value ? 'bg-ink-50' : 'bg-red-50/40 border border-red-100'}`}>
                <p className="text-ink-400 mb-0.5">{label}</p>
                <p className={`font-medium ${value ? 'text-ink-700' : 'text-ink-300 italic'}`}>{value || 'Not found'}</p>
              </div>
            ))}
          </div>
          {r.entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-teal-50">
                    {['Section', 'Amount Paid', 'TDS Deducted', 'TDS Deposited', 'Challan Date'].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-teal-700 font-semibold border border-teal-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.entries.map((e, i) => (
                    <tr key={i} className="border-b border-ink-50">
                      <td className="px-3 py-2 border border-ink-100">{e.section || '—'}</td>
                      <td className="px-3 py-2 border border-ink-100">{e.amountPaid ? `₹${e.amountPaid}` : '—'}</td>
                      <td className="px-3 py-2 border border-ink-100 font-medium text-ink-800">{e.tdsDeducted ? `₹${e.tdsDeducted}` : '—'}</td>
                      <td className="px-3 py-2 border border-ink-100">{e.tdsDeposited ? `₹${e.tdsDeposited}` : '—'}</td>
                      <td className="px-3 py-2 border border-ink-100">{e.challanDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function Form16Parser() {
  const [formType, setFormType]   = useState<Form16Type>('form16')
  const [files, setFiles]         = useState<FileEntry[]>([])
  const [processing, setProc]     = useState(false)
  const [dlOpen, setDlOpen]       = useState(false)
  const dlRef                     = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)
  const [dragging, setDragging]   = useState(false)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (dlRef.current && !dlRef.current.contains(e.target as Node)) setDlOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const addFiles = useCallback((incoming: File[]) => {
    const pdfs = incoming.filter(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'))
    setFiles(prev => [
      ...prev,
      ...pdfs.map(f => ({ id: uid(), file: f, status: 'queued' as FileStatus })),
    ])
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles([...e.dataTransfer.files])
  }, [addFiles])

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles([...e.target.files])
    e.target.value = ''
  }

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id))

  const parseAll = async () => {
    const queued = files.filter(f => f.status === 'queued')
    if (queued.length === 0) return
    setProc(true)

    for (const entry of queued) {
      // mark processing
      setFiles(prev => prev.map(f => f.id === entry.id ? { ...f, status: 'processing' } : f))

      try {
        const pages = await extractPages(entry.file)
        const rawText = pages.join('\n\n---PAGE---\n\n').slice(0, 3000)
        const result = formType === 'form16'
          ? parseForm16(pages, entry.file.name)
          : parseForm16A(pages, entry.file.name)

        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'done', result, rawText } : f
        ))
      } catch (err) {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, status: 'error', error: String(err) } : f
        ))
      }
    }

    setProc(false)
  }

  const doneFiles  = files.filter(f => f.status === 'done')
  const hasResults = doneFiles.length > 0
  const queued     = files.filter(f => f.status === 'queued').length

  const handleDownload = () => {
    const fy = new Date().getFullYear()
    if (formType === 'form16') {
      const results = doneFiles.map(f => f.result as ParsedForm16)
      downloadForm16Excel(results, `Form16_Extracted_${fy}.xlsx`)
    } else {
      const results = doneFiles.map(f => f.result as ParsedForm16A)
      downloadForm16AExcel(results, `Form16A_Extracted_${fy}.xlsx`)
    }
    setDlOpen(false)
  }

  return (
    <div className="space-y-5">

      {/* Type selector + info */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-ink-400 mb-1.5">Select form type</p>
            <div className="flex rounded-xl border border-ink-200 overflow-hidden text-sm">
              {([
                { value: 'form16',  label: 'Form 16',  sub: 'Salary TDS certificate' },
                { value: 'form16a', label: 'Form 16A', sub: 'Non-salary TDS certificate' },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setFormType(opt.value); setFiles([]) }}
                  className={`px-5 py-2 font-medium transition-colors ${
                    formType === opt.value
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-ink-500 hover:text-ink-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-ink-400 bg-ink-50 rounded-xl px-4 py-3 flex-1">
            <Info size={13} className="shrink-0 mt-0.5" />
            <span>
              {formType === 'form16'
                ? 'Upload one or more Form 16 PDFs (Part A + B). Employee names, PANs, salary figures, deductions, and TDS will be extracted.'
                : 'Upload one or more Form 16A PDFs. Deductor, deductee, section-wise payment amounts, and TDS deducted will be extracted.'}
            </span>
          </div>
        </div>
      </Card>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 transition-all ${
          dragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-ink-200 hover:border-brand-300 hover:bg-brand-50/30'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center">
          <Upload size={22} className="text-brand-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-ink-700">Drop PDF files here</p>
          <p className="text-xs text-ink-400 mt-1">or click to browse — multiple files supported</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          className="hidden"
          onChange={onInputChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-ink-400">
              {files.length} file{files.length > 1 ? 's' : ''} queued
            </p>
            <button
              onClick={() => setFiles([])}
              className="text-xs text-ink-400 hover:text-red-500 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {files.map(entry => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
                  entry.status === 'done'
                    ? 'border-green-100 bg-green-50/40'
                    : entry.status === 'error'
                    ? 'border-red-100 bg-red-50/40'
                    : entry.status === 'processing'
                    ? 'border-brand-100 bg-brand-50/40'
                    : 'border-ink-100 bg-ink-50/30'
                }`}
              >
                <FileText size={15} className="text-ink-400 shrink-0" />
                <span className="flex-1 text-sm text-ink-700 truncate min-w-0">{entry.file.name}</span>
                <span className="text-[11px] text-ink-400 shrink-0">
                  {(entry.file.size / 1024).toFixed(0)} KB
                </span>
                <StatusBadge status={entry.status} error={entry.error} />
                {entry.status === 'queued' && (
                  <button
                    onClick={() => removeFile(entry.id)}
                    className="p-0.5 rounded text-ink-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action row */}
          <div className="mt-4 flex items-center gap-3 justify-end">
            {hasResults && (
              <div ref={dlRef} className="relative">
                <button
                  onClick={() => setDlOpen(o => !o)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95 bg-teal-600 hover:bg-teal-700 text-white shadow-sm shadow-teal-200"
                >
                  <FileSpreadsheet size={14} /> Download Excel <ChevronDown size={13} />
                </button>
                {dlOpen && (
                  <div className="absolute right-0 top-full mt-1.5 z-20 w-52 bg-white rounded-xl border border-ink-100 shadow-lg overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-ink-50">
                      <p className="text-xs text-ink-400">{doneFiles.length} file{doneFiles.length > 1 ? 's' : ''} will be included</p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                    >
                      <FileSpreadsheet size={15} className="text-teal-500" />
                      Download as Excel (.xlsx)
                    </button>
                  </div>
                )}
              </div>
            )}
            {queued > 0 && (
              <button
                onClick={parseAll}
                disabled={processing}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95 bg-brand-600 hover:bg-brand-700 text-white shadow-sm shadow-brand-200 disabled:opacity-50"
              >
                {processing
                  ? <><Loader2 size={14} className="animate-spin" /> Parsing…</>
                  : <><FileText size={14} /> Parse {queued} file{queued > 1 ? 's' : ''}</>
                }
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Results */}
      {hasResults && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-ink-400 px-1">
            Extracted Data — {doneFiles.length} file{doneFiles.length > 1 ? 's' : ''}
          </p>
          {formType === 'form16'
            ? doneFiles.map((f, i) => (
                <Form16Row key={f.id} r={f.result as ParsedForm16} idx={i} rawText={f.rawText} />
              ))
            : doneFiles.map((f, i) => (
                <Form16ARow key={f.id} r={f.result as ParsedForm16A} idx={i} />
              ))
          }
        </div>
      )}

      {/* Extraction note */}
      <div className="flex items-start gap-2 text-xs text-ink-400 px-1">
        <Info size={12} className="shrink-0 mt-0.5" />
        <p>
          Extraction is best-effort. Accuracy depends on PDF quality and issuer format.
          TRACES-generated PDFs parse most reliably. Always verify extracted figures
          against the original document before use.
        </p>
      </div>
    </div>
  )
}
