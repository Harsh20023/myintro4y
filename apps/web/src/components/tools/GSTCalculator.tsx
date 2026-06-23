'use client'

import { useState } from 'react'
import { Plus, Trash2, Download, Info, ArrowRight, Layers } from 'lucide-react'
import { Input, Select, Card } from '@/components/ui'
import { calcGST, GST_SLABS, type GSTCalcMode, type TransactionType } from '@/lib/logic/gst'
import { amountInWords } from '@/lib/logic/invoice'

// ── Types ──────────────────────────────────────────────────────────────────
interface LineItem {
  id: string
  description: string
  qty: string
  unitPrice: string
  gstRate: number
  mode: GSTCalcMode
}

let _id = 1
const newItem = (): LineItem => ({
  id: String(_id++), description: '', qty: '1', unitPrice: '', gstRate: 18, mode: 'exclusive',
})

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(n)

const fmtN = (n: number) =>
  new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)

function calcItem(item: LineItem, txType: TransactionType) {
  const qty       = parseFloat(item.qty)       || 0
  const unitPrice = parseFloat(item.unitPrice) || 0
  const lineAmt   = qty * unitPrice
  if (lineAmt === 0) return null
  return { qty, unitPrice, lineAmt, ...calcGST(lineAmt, item.gstRate, item.mode, txType) }
}

// ── PDF ─────────────────────────────────────────────────────────────────────
async function downloadPDF(items: LineItem[], txType: TransactionType, docTitle: string) {
  const { default: jsPDF }     = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210, M = 10, CW = W - M * 2  // content width = 190mm

  const TEAL   = [13, 148, 136]  as [number,number,number]
  const TEAL_L = [240, 253, 249] as [number,number,number]
  const DARK   = [15, 23, 42]    as [number,number,number]
  const GREY   = [100, 116, 139] as [number,number,number]
  const WHITE  = [255, 255, 255] as [number,number,number]
  const LIGHT  = [248, 250, 252] as [number,number,number]

  const base = {
    margin: { left: M, right: M },
    theme: 'grid' as const,
    styles: { font: 'helvetica', fontSize: 7.5, textColor: DARK, lineWidth: 0.25, lineColor: DARK, cellPadding: 2.5 },
  }

  // ── 1. Title bar ──────────────────────────────────────────────────────────
  autoTable(doc, {
    ...base,
    startY: M,
    body: [['GST QUOTATION']],
    columnStyles: { 0: { cellWidth: CW, halign: 'center', fontStyle: 'bold', fontSize: 12, textColor: WHITE, fillColor: TEAL } },
  })

  // ── 2. Document meta ──────────────────────────────────────────────────────
  const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const txLabel = txType === 'intra' ? 'Intra-State  (CGST + SGST)' : 'Inter-State  (IGST)'
  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    body: [[
      `Document: ${docTitle || 'GST Quotation'}`,
      `Date: ${dateStr}\nTransaction Type: ${txLabel}`,
    ]],
    columnStyles: {
      0: { cellWidth: CW * 0.55, fontStyle: 'bold', fontSize: 8, fillColor: LIGHT },
      1: { cellWidth: CW * 0.45, halign: 'right', fillColor: LIGHT, textColor: GREY },
    },
  })

  // ── 3. Line items table ───────────────────────────────────────────────────
  let grandBase = 0, grandGST = 0, grandTotal = 0
  const grandCGST: number[] = [], grandSGST: number[] = [], grandIGST: number[] = []

  // GST breakup grouped by rate
  const rateMap = new Map<number, { base: number; cgst: number; sgst: number; igst: number }>()

  const bodyRows: string[][] = []
  items.forEach((item, i) => {
    const r = calcItem(item, txType)
    if (!r) return
    grandBase  += r.baseAmount
    grandGST   += r.totalGST
    grandTotal += r.totalAmount
    grandCGST.push(r.cgst); grandSGST.push(r.sgst); grandIGST.push(r.igst)

    const prev = rateMap.get(item.gstRate) || { base: 0, cgst: 0, sgst: 0, igst: 0 }
    rateMap.set(item.gstRate, {
      base: prev.base + r.baseAmount,
      cgst: prev.cgst + r.cgst,
      sgst: prev.sgst + r.sgst,
      igst: prev.igst + r.igst,
    })

    const gstLabel = txType === 'intra'
      ? `${item.gstRate}%\nCGST ${item.gstRate/2}%\nSGST ${item.gstRate/2}%`
      : `${item.gstRate}%\nIGST ${item.gstRate}%`

    const modeNote = item.mode === 'exclusive'
      ? `Rs.${fmtN(r.unitPrice)} + ${item.gstRate}% GST [Add-up]`
      : `Rs.${fmtN(r.unitPrice)} incl. GST [Add-on]`

    bodyRows.push([
      String(i + 1),
      (item.description || `Item ${i + 1}`) + `\n${modeNote}`,
      String(r.qty),
      `Rs.${fmtN(r.unitPrice)}`,
      `Rs.${fmtN(r.baseAmount)}`,
      gstLabel,
      `Rs.${fmtN(r.totalGST)}`,
      `Rs.${fmtN(r.totalAmount)}`,
    ])
  })

  // Totals footer row
  const totalsCGST = grandCGST.reduce((a, b) => a + b, 0)
  const totalsSGST = grandSGST.reduce((a, b) => a + b, 0)
  const totalsIGST = grandIGST.reduce((a, b) => a + b, 0)
  bodyRows.push(['', 'TOTALS', '', '', `Rs.${fmtN(grandBase)}`, '', `Rs.${fmtN(grandGST)}`, `Rs.${fmtN(grandTotal)}`])

  // Column widths: #(8) Desc(flex) Qty(12) UnitPrice(25) Base(25) GSTRate(22) GSTAmt(22) Total(26)
  const fixedW = 8 + 12 + 25 + 25 + 22 + 22 + 26
  const descW  = CW - fixedW  // ~50mm

  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Base Amount', 'GST Rate', 'GST Amount', 'Total']],
    body: bodyRows,
    headStyles: { fillColor: TEAL_L, textColor: DARK, fontStyle: 'bold', fontSize: 7, halign: 'center' },
    columnStyles: {
      0: { cellWidth: 8,     halign: 'center' },
      1: { cellWidth: descW, halign: 'left'   },
      2: { cellWidth: 12,    halign: 'center' },
      3: { cellWidth: 25,    halign: 'right'  },
      4: { cellWidth: 25,    halign: 'right'  },
      5: { cellWidth: 22,    halign: 'center' },
      6: { cellWidth: 22,    halign: 'right'  },
      7: { cellWidth: 26,    halign: 'right', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index === bodyRows.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = TEAL_L
      }
    },
  })

  // ── 4. GST Breakup Matrix ─────────────────────────────────────────────────
  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [['GST BREAKUP MATRIX']],
    columnStyles: { 0: { cellWidth: CW, fontStyle: 'bold', fontSize: 7.5, textColor: GREY, fillColor: LIGHT } },
  })

  const breakupHead = txType === 'intra'
    ? [['GST Rate', 'Taxable Base', 'CGST Amount', 'SGST Amount', 'Total Tax']]
    : [['GST Rate', 'Taxable Base', 'IGST Amount', 'Total Tax']]

  const breakupBody = Array.from(rateMap.entries()).map(([rate, v]) =>
    txType === 'intra'
      ? [`${rate}%`, `Rs.${fmtN(v.base)}`, `Rs.${fmtN(v.cgst)}`, `Rs.${fmtN(v.sgst)}`, `Rs.${fmtN(v.cgst + v.sgst)}`]
      : [`${rate}%`, `Rs.${fmtN(v.base)}`, `Rs.${fmtN(v.igst)}`, `Rs.${fmtN(v.igst)}`]
  )
  // Total row
  if (txType === 'intra') {
    breakupBody.push(['Total', `Rs.${fmtN(grandBase)}`, `Rs.${fmtN(totalsCGST)}`, `Rs.${fmtN(totalsSGST)}`, `Rs.${fmtN(grandGST)}`])
  } else {
    breakupBody.push(['Total', `Rs.${fmtN(grandBase)}`, `Rs.${fmtN(totalsIGST)}`, `Rs.${fmtN(grandGST)}`])
  }

  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    head:   breakupHead,
    body:   breakupBody,
    headStyles: { fillColor: TEAL_L, textColor: DARK, fontStyle: 'bold', fontSize: 7, halign: 'right' },
    bodyStyles: { halign: 'right' },
    columnStyles: { 0: { halign: 'center', fontStyle: 'bold' } },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index === breakupBody.length - 1) {
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = TEAL_L
      }
    },
  })

  // ── 5. Amount in words ───────────────────────────────────────────────────
  const words = amountInWords(grandTotal)
  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    body:   [[`Amount in Words:  ${words}`]],
    columnStyles: { 0: { cellWidth: CW, fontStyle: 'italic', textColor: GREY, fontSize: 7.5 } },
  })

  // ── 5b. Financial summary rows ────────────────────────────────────────────
  // Use grandGST as canonical total to avoid floating-point drift between CGST+SGST sum
  const r2 = (n: number) => Math.round(n * 100) / 100
  const summaryRows: string[][] = [
    ['Sub-total (Taxable Base)', `Rs.${fmtN(r2(grandBase))}`],
    ...(txType === 'intra'
      ? [['CGST', `Rs.${fmtN(r2(totalsCGST))}`], ['SGST', `Rs.${fmtN(r2(totalsSGST))}`]]
      : [['IGST', `Rs.${fmtN(r2(totalsIGST))}`]]),
    ['Total GST', `Rs.${fmtN(r2(grandGST))}`],
    ['Grand Total', `Rs.${fmtN(r2(grandTotal))}`],
  ]

  autoTable(doc, {
    ...base,
    startY: (doc as any).lastAutoTable.finalY,
    body:   summaryRows,
    columnStyles: {
      0: { cellWidth: CW * 0.62, halign: 'right', textColor: GREY },
      1: { cellWidth: CW * 0.38, halign: 'right', fontStyle: 'bold', textColor: DARK },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index === summaryRows.length - 1) {
        data.cell.styles.fontStyle  = 'bold'
        data.cell.styles.fontSize   = 9.5
        data.cell.styles.fillColor  = TEAL
        data.cell.styles.textColor  = WHITE
      }
    },
  })

  // ── 6. Footer on every page ───────────────────────────────────────────────
  const totalPages = (doc as any).internal.getNumberOfPages()
  const pageH = doc.internal.pageSize.height
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...GREY)
    doc.text('Generated via Conceptra', M, pageH - 6)
    doc.text(`Page ${p} of ${totalPages}`, W - M, pageH - 6, { align: 'right' })
  }

  doc.save(`${(docTitle || 'GST-Quotation').replace(/\s+/g, '-')}.pdf`)
}

// ── Item Result Bar ────────────────────────────────────────────────────────
function ItemResult({ item, txType }: { item: LineItem; txType: TransactionType }) {
  const r = calcItem(item, txType)
  if (!r) return null
  const isAdd = item.mode === 'exclusive'
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 px-2 py-2 bg-ink-50 rounded-xl">
      <div className="flex items-center gap-1.5 text-xs text-ink-500">
        <span className="font-medium text-ink-700">Base</span>
        <span className="font-mono font-semibold text-ink-800">{fmt(r.baseAmount)}</span>
      </div>

      <ArrowRight size={11} className="text-ink-300 flex-shrink-0" />

      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-ink-500">
          {txType === 'intra'
            ? `CGST ${item.gstRate/2}%+SGST ${item.gstRate/2}%`
            : `IGST ${item.gstRate}%`}
        </span>
        <span className="font-mono font-semibold text-ink-700">{fmt(r.totalGST)}</span>
        {txType === 'intra' && (
          <span className="text-ink-400">({fmt(r.cgst)}+{fmt(r.sgst)})</span>
        )}
      </div>

      <ArrowRight size={11} className="text-ink-300 flex-shrink-0" />

      <div className="flex items-center gap-2 ml-auto">
        <div className="flex flex-col items-end">
          <span className="font-mono font-bold text-brand-700 text-sm">{fmt(r.totalAmount)}</span>
          <span className="text-[10px] text-brand-500 leading-none">
            {isAdd
              ? `${fmt(r.baseAmount)} + ${fmt(r.totalGST)} GST`
              : `base ${fmt(r.baseAmount)} + GST ${fmt(r.totalGST)}`}
          </span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          isAdd ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {isAdd ? 'Add GST (Add-up)' : 'Extract GST (Add-on)'}
        </span>
      </div>
    </div>
  )
}

// ── Main ────────────────────────────────────────────────────────────────────
export function GSTCalculator() {
  const [items,  setItems]  = useState<LineItem[]>([newItem()])
  const [txType, setTxType] = useState<TransactionType>('intra')
  const [docTitle, setDocTitle] = useState('GST Quotation')
  const [priceExceeded, setPriceExceeded] = useState<Record<string, boolean>>({})
  const [qtyExceeded,   setQtyExceeded]   = useState<Record<string, boolean>>({})

  const update = (id: string, patch: Partial<LineItem>) =>
    setItems(p => p.map(i => i.id === id ? { ...i, ...patch } : i))
  const remove = (id: string) =>
    setItems(p => p.length > 1 ? p.filter(i => i.id !== id) : p)
  const add = () => setItems(p => [...p, newItem()])

  const computed = items.map(i => ({ i, r: calcItem(i, txType) }))
  const active   = computed.filter(x => x.r !== null)

  const grandBase  = active.reduce((s, x) => s + (x.r?.baseAmount ?? 0), 0)
  const grandGST   = active.reduce((s, x) => s + (x.r?.totalGST   ?? 0), 0)
  const grandCGST  = active.reduce((s, x) => s + (x.r?.cgst       ?? 0), 0)
  const grandSGST  = active.reduce((s, x) => s + (x.r?.sgst       ?? 0), 0)
  const grandIGST  = active.reduce((s, x) => s + (x.r?.igst       ?? 0), 0)
  const grandTotal = active.reduce((s, x) => s + (x.r?.totalAmount ?? 0), 0)

  return (
    <div className="max-w-6xl mx-auto space-y-4">

      {/* ── Header settings (full width) ── */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex flex-col">
            <p className="label-base">Document Title</p>
            <input
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              placeholder="e.g. GST Quotation – Client ABC"
              className="input-base w-full flex-1"
            />
          </div>
          <div className="flex flex-col">
            <p className="label-base">Transaction Type</p>
            <div className="flex rounded-xl border border-ink-200 overflow-hidden flex-1">
              {([['intra', 'Intra-state', 'CGST + SGST'], ['inter', 'Inter-state', 'IGST']] as [TransactionType, string, string][]).map(([t, lbl, sub]) => (
                <button key={t} onClick={() => setTxType(t)}
                  className={`flex-1 flex flex-col items-center justify-center transition-colors ${
                    txType === t ? 'bg-brand-600 text-white' : 'bg-white text-ink-500 hover:bg-ink-50'
                  }`}>
                  <span className="text-sm font-semibold">{lbl}</span>
                  <span className={`text-[10px] mt-0.5 ${txType === t ? 'text-brand-200' : 'text-ink-400'}`}>{sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Two-column: left = data entry, right = summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

        {/* ── Left: Line items ── */}
        <div className="space-y-4">
          <Card padding="sm">
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-sm font-semibold text-ink-700 flex items-center gap-2">
                <Layers size={15} className="text-brand-600" /> Line Items
              </p>
              <button onClick={add}
                className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors border border-brand-100">
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.id}
                  className="border border-ink-100 hover:border-brand-200 rounded-2xl p-3 sm:p-4 transition-colors group">

                  {/* Top row: number + description + delete */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <input
                        value={item.description}
                        onChange={e => update(item.id, { description: e.target.value })}
                        placeholder="Item description (e.g. Web Design Services)"
                        className="w-full text-sm font-medium text-ink-800 placeholder:text-ink-300 bg-transparent border-b border-transparent focus:border-brand-400 focus:outline-none pb-0.5 transition-colors"
                      />
                    </div>
                    <button onClick={() => remove(item.id)} disabled={items.length === 1}
                      className="p-1.5 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-20 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100">
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Input grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="relative">
                      {qtyExceeded[item.id] && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                          Cannot exceed 10 Lakh
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
                        </div>
                      )}
                      <Input label="Qty" type="number" min="0" max="1000000" step="1"
                        value={item.qty}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v) && v > 1000000) { setQtyExceeded(p => ({ ...p, [item.id]: true })); return }
                          setQtyExceeded(p => ({ ...p, [item.id]: false }))
                          update(item.id, { qty: e.target.value })
                        }}
                        className={qtyExceeded[item.id] ? 'border-red-400' : ''}
                        placeholder="1" />
                    </div>
                    <div className="relative">
                      {priceExceeded[item.id] && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                          Cannot exceed ₹1 Crore
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
                        </div>
                      )}
                      <Input label="Unit Price" type="number" min="0" max="10000000" step="0.01"
                        prefix="₹" value={item.unitPrice}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          if (!isNaN(v) && v > 10000000) {
                            setPriceExceeded(p => ({ ...p, [item.id]: true }))
                            return
                          }
                          setPriceExceeded(p => ({ ...p, [item.id]: false }))
                          update(item.id, { unitPrice: e.target.value })
                        }}
                        className={priceExceeded[item.id] ? 'border-red-400' : ''}
                        placeholder="0.00" />
                    </div>
                    <Select label="GST Rate"
                      value={String(item.gstRate)}
                      options={GST_SLABS.map(s => ({ value: String(s.value), label: s.label }))}
                      onChange={e => update(item.id, { gstRate: parseInt(e.target.value) })} />
                    <div>
                      <p className="label-base">Mode</p>
                      <div className="flex rounded-xl border border-ink-200 overflow-hidden h-[38px]">
                        {(['exclusive', 'inclusive'] as GSTCalcMode[]).map(m => (
                          <button key={m} onClick={() => update(item.id, { mode: m })}
                            className={`flex-1 text-xs font-semibold transition-colors ${
                              item.mode === m
                                ? m === 'exclusive' ? 'bg-teal-600 text-white' : 'bg-amber-500 text-white'
                                : 'bg-white text-ink-400 hover:bg-ink-50'
                            }`}>
                            {m === 'exclusive' ? 'Add GST' : 'Extract GST'}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-ink-400 mt-1 leading-tight">
                        {item.mode === 'exclusive' ? 'Add-up' : 'Add-on'}
                      </p>
                    </div>
                  </div>

                  {/* Result bar */}
                  <ItemResult item={item} txType={txType} />
                </div>
              ))}
            </div>

            <button onClick={add}
              className="mt-3 w-full py-2.5 border-2 border-dashed border-ink-200 rounded-xl text-sm text-ink-400 hover:text-brand-600 hover:border-brand-300 hover:bg-brand-50/50 transition-all flex items-center justify-center gap-1.5">
              <Plus size={13} /> Add another item
            </button>
          </Card>

          {/* ── Info ── */}
          <div className="flex gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
            <Info size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Add GST (Add-up):</strong> Enter the base price — GST is added on top to get the final total.{' '}
              <strong>Extract GST (Add-on):</strong> Enter the GST-inclusive price — the add-on GST is separated out from the base.{' '}
              <strong>Intra-state:</strong> CGST + SGST (each at half rate).{' '}
              <strong>Inter-state:</strong> Full IGST.
            </p>
          </div>
        </div>

        {/* ── Right: Summary (sticky) ── */}
        <div className="lg:sticky lg:top-4">
          {active.length > 0 ? (
            <Card>
              {/* Header with download button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-ink-800">Summary</p>
                  <p className="text-xs text-ink-400 mt-0.5">{active.length} item{active.length > 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => downloadPDF(items, txType, docTitle)}
                  className="flex items-center gap-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 active:scale-95 px-4 py-2 rounded-xl transition-all shadow-sm shadow-brand-200">
                  <Download size={14} /> Download PDF
                </button>
              </div>

              {/* Multi-item table */}
              {active.length > 1 && (
                <div className="overflow-x-auto mb-5">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b-2 border-ink-100">
                        <th className="text-left pb-2 text-ink-400 font-semibold">#</th>
                        <th className="text-left pb-2 text-ink-400 font-semibold">Description</th>
                        <th className="text-center pb-2 text-ink-400 font-semibold">Qty</th>
                        <th className="text-right pb-2 text-ink-400 font-semibold">Base</th>
                        <th className="text-right pb-2 text-ink-400 font-semibold">GST</th>
                        <th className="text-right pb-2 text-ink-400 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.map(({ i: item, r }, idx) => r && (
                        <tr key={item.id} className="border-b border-ink-50 hover:bg-ink-50/50 transition-colors">
                          <td className="py-2 pr-2 text-ink-300 font-medium">{idx + 1}</td>
                          <td className="py-2 pr-3 text-ink-700 max-w-[180px]">
                            <p className="truncate">{item.description || `Item ${idx + 1}`}</p>
                            <p className="text-[10px] text-ink-400">
                              {item.mode === 'exclusive' ? 'Add GST (Add-up)' : 'Extract GST (Add-on)'} @ {item.gstRate}%
                            </p>
                          </td>
                          <td className="py-2 text-center text-ink-600">{r.qty}</td>
                          <td className="py-2 text-right font-mono text-ink-600">{fmt(r.baseAmount)}</td>
                          <td className="py-2 text-right font-mono text-ink-600">
                            <span>{fmt(r.totalGST)}</span>
                            {txType === 'intra' && (
                              <p className="text-[10px] text-ink-400">{fmt(r.cgst)}+{fmt(r.sgst)}</p>
                            )}
                          </td>
                          <td className="py-2 text-right font-mono font-bold text-ink-900">
                            {fmt(r.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Totals block */}
              <div className="space-y-1.5">
                <div className="flex justify-between py-2 px-3 rounded-lg bg-ink-50 text-sm">
                  <span className="text-ink-500">Sub-total (Taxable Base)</span>
                  <span className="font-mono font-semibold text-ink-800">{fmt(grandBase)}</span>
                </div>

                {txType === 'intra' ? (
                  <>
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-ink-50 text-sm">
                      <span className="text-ink-500">CGST</span>
                      <span className="font-mono text-ink-700">{fmt(grandCGST)}</span>
                    </div>
                    <div className="flex justify-between py-2 px-3 rounded-lg bg-ink-50 text-sm">
                      <span className="text-ink-500">SGST</span>
                      <span className="font-mono text-ink-700">{fmt(grandSGST)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-2 px-3 rounded-lg bg-ink-50 text-sm">
                    <span className="text-ink-500">IGST</span>
                    <span className="font-mono text-ink-700">{fmt(grandIGST)}</span>
                  </div>
                )}

                <div className="flex justify-between py-2 px-3 rounded-lg bg-ink-50 text-sm">
                  <span className="text-ink-500 font-medium">Total GST</span>
                  <span className="font-mono font-semibold text-ink-800">{fmt(grandGST)}</span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-brand-600 mt-2">
                  <div>
                    <p className="text-brand-100 text-sm font-medium">Grand Total</p>
                    <p className="text-brand-200 text-xs">incl. GST {fmt(grandGST)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-white text-xl">{fmt(grandTotal)}</p>
                    <p className="text-brand-200 text-[10px]">
                      {grandBase > 0 ? `Eff. rate ${((grandGST / grandBase) * 100).toFixed(2)}%` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extract GST callout */}
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Extract GST (Add-on view)</p>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  The grand total of <strong>{fmt(grandTotal)}</strong> includes GST of{' '}
                  <strong>{fmt(grandGST)}</strong>. The taxable base value is{' '}
                  <strong>{fmt(grandBase)}</strong>.
                </p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-semibold text-ink-400">Summary will appear here</p>
                <p className="text-xs text-ink-300 mt-1">Enter a quantity and unit price to see the breakdown</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
