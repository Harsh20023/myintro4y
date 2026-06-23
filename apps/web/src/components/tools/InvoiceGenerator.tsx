

// 'use client'

// import { useState, useCallback, useEffect } from 'react'
// import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, FileDown } from 'lucide-react'
// import { Input, Select, Textarea } from '@/components/ui'
// import {
//   InvoiceData, InvoiceItem, CurrencyCode,
//   DEFAULT_INVOICE, CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES,
//   calcItem, calcTotals, formatCurrency, newItem, amountInWords,
//   validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate, computeEffectiveRate,
// } from '@/lib/logic/invoice'

// import html2canvas from 'html2canvas'
// import { jsPDF } from 'jspdf'

// // ─────────────────────────────────────────────────────────────────────────────
// // INVOICE PREVIEW
// // ─────────────────────────────────────────────────────────────────────────────
// function InvoicePreview({ data }: { data: InvoiceData }) {
//   const totals   = calcTotals(data.items)
//   const hasIGST  = data.items.some(i => i.gstType === 'igst')
//   const hasCGST  = data.items.some(i => i.gstType === 'cgst_sgst')
//   const hasCess  = data.items.some(i => i.cessRate > 0)

//   const formattedPOS   = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply
//   const isInvNumValid  = validateInvoiceNumber(data.invoiceNumber)

//   return (
//     <div
//       id="invoice-preview"
//       className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto p-1"
//     >
//       {/* ── HEADER ── */}
//       <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
//         <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Tax Invoice</h1>
//       </div>

//       {/* ── SELLER / INVOICE META ── */}
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
//           <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
//           <p className="text-slate-600 whitespace-pre-line">
//             {data.sellerAddress || 'Seller Address Location'}
//             {data.sellerLandmark && `\nLandmark: ${data.sellerLandmark}`}
//           </p>
//           {data.sellerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
//           {data.sellerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.sellerPAN}</p>}
//         </div>
//         <div className="p-3 space-y-1.5">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
//           <div className="grid grid-cols-3 gap-y-1 font-medium">
//             <span className="text-slate-500">Invoice No</span>
//             <span className={`col-span-2 font-mono font-bold ${isInvNumValid ? 'text-slate-900' : 'text-red-600 bg-red-50 px-1 rounded'}`}>
//               : {data.invoiceNumber || '—'} {!isInvNumValid && data.invoiceNumber && '(!)'}
//             </span>
//             <span className="text-slate-500">Date</span>
//             <span className="col-span-2">: {data.invoiceDate}</span>
//             <span className="text-slate-500">Due Date</span>
//             <span className="col-span-2">: {data.dueDate}</span>
//             <span className="text-slate-500">Place of Supply</span>
//             <span className="col-span-2">: {formattedPOS}</span>
//           </div>
//         </div>
//       </div>

//       {/* ── BILL TO / SHIP TO ── */}
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
//           <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
//           <p className="text-slate-600 whitespace-pre-line">
//             {data.buyerAddress || 'Client Billing Address'}
//             {data.buyerLandmark && `\nLandmark: ${data.buyerLandmark}`}
//           </p>
//           {data.buyerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
//           {data.buyerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.buyerPAN}</p>}
//         </div>
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
//           <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
//           <p className="text-slate-600 whitespace-pre-line">
//             {data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}
//             {data.shipToLandmark && `\nLandmark: ${data.shipToLandmark}`}
//           </p>
//           <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST || '—'}</span></p>
//         </div>
//       </div>

//       {/* ── LINE ITEMS TABLE ── */}
//       <div className="overflow-x-auto">
//         <table className="w-full border-b-2 border-slate-900 border-collapse text-left">
//           <thead>
//             <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-bold text-slate-900">
//               <th className="p-1.5 text-center border-r border-slate-400 w-8">S.No.</th>
//               <th className="p-1.5 border-r border-slate-400">Item Name</th>
//               <th className="p-1.5 text-center border-r border-slate-400 w-20">HSN Code</th>
//               <th className="p-1.5 text-center border-r border-slate-400 w-14">Qty</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">MRP</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">Rate</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">Disc %</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">CD %</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">GST%</th>
//               {hasCess && <th className="p-1.5 text-right border-r border-slate-400 w-14">Cess %</th>}
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">GST Amt</th>
//               <th className="p-1.5 text-right w-24">Amount</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-200">
//             {data.items.map((item, idx) => {
//               const c = calcItem(item)
//               return (
//                 <tr key={item.id} className="text-slate-700 text-[10px]">
//                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{idx + 1}</td>
//                   <td className="p-1.5 font-medium text-slate-900 border-r border-slate-300">{item.description || '—'}</td>
//                   <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-300">{item.hsn || '—'}</td>
//                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{item.quantity}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(item.mrp, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.effectiveRate, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.discRate.toFixed(2)}%</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cdRate.toFixed(2)}%</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.gstRate}%</td>
//                   {hasCess && <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cessRate}%</td>}
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.gstAmt, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrency(c.subtotal, data.currency)}</td>
//                 </tr>
//               )
//             })}
//             {/* Totals row */}
//             <tr className="bg-slate-50 font-bold text-[10px] border-t-2 border-slate-900">
//               <td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 text-center text-slate-700 border-r border-slate-300">Totals</td>
//               <td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 text-center font-mono border-r border-slate-300">
//                 {data.items.reduce((s, i) => s + i.quantity, 0)} Units
//               </td>
//               <td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalDisc.toFixed(2)}</td>
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalCD.toFixed(2)}</td>
//               <td className="p-1.5 border-r border-slate-300" />
//               {hasCess && <td className="p-1.5 border-r border-slate-300" />}
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(totals.totalGST, data.currency)}</td>
//               <td className="p-1.5 text-right font-mono text-slate-900">{formatCurrency(totals.subtotal, data.currency)}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>

//       {/* ── FINANCIALS SUMMARY ── */}
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 bg-slate-50/50 flex flex-col justify-between space-y-4">
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
//             <p className="font-medium text-blue-900 italic leading-relaxed bg-blue-50/50 p-1.5 rounded border border-blue-100">
//               {amountInWords(totals.totalGST + totals.totalCess, data.currency)}
//             </p>
//           </div>
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Grand Amount (in words)</p>
//             <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal, data.currency)}</p>
//           </div>
//         </div>
//         <div className="p-3 space-y-1.5 font-medium">
//           <div className="flex justify-between text-slate-600">
//             <span>Subtotal (Taxable)</span>
//             <span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span>
//           </div>
//           {totals.totalDisc > 0 && (
//             <div className="flex justify-between text-slate-500 text-[10px]">
//               <span>Trade Discount</span>
//               <span className="font-mono">- {formatCurrency(totals.totalDisc, data.currency)}</span>
//             </div>
//           )}
//           {totals.totalCD > 0 && (
//             <div className="flex justify-between text-slate-500 text-[10px]">
//               <span>Cash Discount (CD)</span>
//               <span className="font-mono">- {formatCurrency(totals.totalCD, data.currency)}</span>
//             </div>
//           )}
//           {hasCGST && (
//             <>
//               <div className="flex justify-between text-slate-600">
//                 <span>CGST</span>
//                 <span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span>
//               </div>
//               <div className="flex justify-between text-slate-600">
//                 <span>SGST</span>
//                 <span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span>
//               </div>
//             </>
//           )}
//           {hasIGST && (
//             <div className="flex justify-between text-slate-600">
//               <span>IGST</span>
//               <span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span>
//             </div>
//           )}
//           {totals.totalCess > 0 && (
//             <div className="flex justify-between text-slate-600">
//               <span>Total Cess</span>
//               <span className="font-mono">{formatCurrency(totals.totalCess, data.currency)}</span>
//             </div>
//           )}
//           <div className="border-t border-dashed border-slate-400 my-1" />
//           <div className="flex justify-between text-slate-600 font-medium">
//             <span>Gross Amount</span>
//             <span className="font-mono">{formatCurrency(totals.grandTotal, data.currency)}</span>
//           </div>
//           <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded">
//             <span>Net Amount (Rounded Off)</span>
//             <span className="font-mono text-emerald-700">{formatCurrency(Math.round(totals.grandTotal), data.currency)}</span>
//           </div>
//         </div>
//       </div>

//       {/* ── GST BREAKUP ── */}
//       <div className="border-b-2 border-slate-900 bg-slate-50/30">
//         <div className="p-1.5 bg-slate-50 border-b font-bold tracking-wider text-[10px] text-slate-500 uppercase">
//           GST Breakup Matrix
//         </div>
//         <table className="w-full border-collapse text-left text-[10px]">
//           <thead>
//             <tr className="border-b border-slate-900 font-bold text-slate-700 divide-x divide-slate-900 bg-slate-100">
//               <th className="p-1.5 text-center">HSN/SAC</th>
//               <th className="p-1.5 text-right">Taxable Value</th>
//               {hasCGST && <th className="p-1.5 text-right">CGST Amt</th>}
//               {hasCGST && <th className="p-1.5 text-right">SGST Amt</th>}
//               {hasIGST && <th className="p-1.5 text-right">IGST Amt</th>}
//               {hasCess && <th className="p-1.5 text-right">Cess Amt</th>}
//               <th className="p-1.5 text-right">Total Tax</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
//             {totals.hsnBreakup.map(row => (
//               <tr key={row.hsn} className="divide-x divide-slate-900">
//                 <td className="p-1.5 text-center font-bold text-slate-800">{row.hsn}</td>
//                 <td className="p-1.5 text-right">{formatCurrency(row.taxableValue, data.currency)}</td>
//                 {hasCGST && <td className="p-1.5 text-right">{formatCurrency(row.cgstAmount, data.currency)}</td>}
//                 {hasCGST && <td className="p-1.5 text-right">{formatCurrency(row.sgstAmount, data.currency)}</td>}
//                 {hasIGST && <td className="p-1.5 text-right">{formatCurrency(row.igstAmount, data.currency)}</td>}
//                 {hasCess && <td className="p-1.5 text-right">{formatCurrency(row.cessAmount, data.currency)}</td>}
//                 <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* ── BANK / DECLARATION / SIGNATURE ── */}
//       <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-0.5">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
//           <p className="font-bold text-slate-900">Punjab National Bank</p>
//           <p className="text-slate-600 font-mono">A/C: 12381131001919</p>
//           <p className="text-slate-600 font-mono">IFSC: PUNB0517010</p>
//         </div>
//         <div className="p-3 flex flex-col justify-between items-end relative min-h-[72px]">
//           <div className="w-full text-left">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Declaration</p>
//             <p className="text-slate-500 text-[10px] leading-tight">{data.termsAndConditions}</p>
//           </div>
//           <div className="text-right w-full border-t border-slate-300 pt-8 mt-4">
//             <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">For {data.sellerName || 'Your Business Name'}</p>
//             <p className="text-[9px] text-slate-400 mt-0.5">Authorised Signatory</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // ITEM ROW — now includes MRP, Disc %, CD % inputs
// // ─────────────────────────────────────────────────────────────────────────────
// function ItemRow({
//   item, index, onChange, onRemove, canRemove, currency,
// }: {
//   item: InvoiceItem
//   index: number
//   onChange: (id: string, field: keyof InvoiceItem, value: string | number) => void
//   onRemove: (id: string) => void
//   currency: string
//   canRemove: boolean
// }) {
//   const [customCess, setCustomCess] = useState(false)
//   const effectiveRate = computeEffectiveRate(item.mrp, item.discRate, item.cdRate)

//   return (
//     <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
//       <div className="flex items-center justify-between">
//         <span className="text-xs font-semibold text-slate-600">Line Item {index + 1}</span>
//         {canRemove && (
//           <button type="button" onClick={() => onRemove(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
//             <Trash2 size={14} />
//           </button>
//         )}
//       </div>

//       {/* Row 1: Description + HSN */}
//       <div className="grid grid-cols-3 gap-2">
//         <div className="col-span-2">
//           <Input
//             placeholder="Description of goods"
//             value={item.description}
//             onChange={e => onChange(item.id, 'description', e.target.value)}
//           />
//         </div>
//         <Input
//           placeholder="HSN/SAC"
//           value={item.hsn}
//           onChange={e => onChange(item.id, 'hsn', e.target.value)}
//         />
//       </div>

//       {/* Row 2: Qty + MRP + Disc% + CD% + effective rate (read-only) */}
//       <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
//         <Input
//           label="Qty"
//           type="number" min="1"
//           value={item.quantity}
//           onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
//         />
//         <Input
//           label="MRP"
//           type="number" min="0" step="0.01"
//           value={item.mrp}
//           onChange={e => onChange(item.id, 'mrp', parseFloat(e.target.value) || 0)}
//         />
//         <Input
//           label="Disc %"
//           type="number" min="0" max="100" step="0.01"
//           value={item.discRate}
//           onChange={e => onChange(item.id, 'discRate', parseFloat(e.target.value) || 0)}
//         />
//         <Input
//           label="CD %"
//           type="number" min="0" max="100" step="0.01"
//           value={item.cdRate}
//           onChange={e => onChange(item.id, 'cdRate', parseFloat(e.target.value) || 0)}
//         />
//         {/* Effective rate display — read only */}
//         <div className="flex flex-col justify-end">
//           <label className="text-[10px] text-slate-500 font-medium mb-1">Eff. Rate</label>
//           <div className="h-9 flex items-center px-2 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 select-none">
//             {effectiveRate.toFixed(2)}
//           </div>
//         </div>
//       </div>

//       {/* Row 3: GST Rate + Tax Type + Cess */}
//       <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
//         <Select
//           label="GST Rate"
//           value={String(item.gstRate)}
//           options={GST_RATES.map(r => ({ value: String(r), label: `${r}%` }))}
//           onChange={e => onChange(item.id, 'gstRate', parseInt(e.target.value))}
//         />
//         <Select
//           label="Tax Type"
//           value={item.gstType}
//           options={[
//             { value: 'none',      label: 'Exempt' },
//             { value: 'cgst_sgst', label: 'CGST + SGST' },
//             { value: 'igst',      label: 'IGST' },
//           ]}
//           onChange={e => onChange(item.id, 'gstType', e.target.value as any)}
//         />
//         <div className="flex flex-col justify-end">
//           {customCess ? (
//             <div className="relative">
//               <Input
//                 label="Cess %"
//                 type="number" min="0" max="100" step="0.1"
//                 value={item.cessRate}
//                 onChange={e => onChange(item.id, 'cessRate', parseFloat(e.target.value) || 0)}
//               />
//               <button
//                 type="button"
//                 onClick={() => { setCustomCess(false); onChange(item.id, 'cessRate', 0) }}
//                 className="absolute right-1 top-1 text-[9px] text-blue-500 underline"
//               >
//                 List
//               </button>
//             </div>
//           ) : (
//             <Select
//               label="Cess %"
//               value={CESS_RATES.includes(item.cessRate) ? String(item.cessRate) : 'custom'}
//               options={[
//                 ...CESS_RATES.map(c => ({ value: String(c), label: `${c}%` })),
//                 { value: 'custom', label: 'Custom...' },
//               ]}
//               onChange={e => {
//                 if (e.target.value === 'custom') setCustomCess(true)
//                 else onChange(item.id, 'cessRate', parseFloat(e.target.value))
//               }}
//             />
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SECTION WRAPPER
// // ─────────────────────────────────────────────────────────────────────────────
// function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
//   const [open, setOpen] = useState(defaultOpen)
//   return (
//     <div className="border border-slate-200 rounded-xl p-3 bg-white shadow-sm">
//       <button
//         type="button"
//         onClick={() => setOpen(!open)}
//         className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700"
//       >
//         <span>{title}</span>
//         {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
//       </button>
//       {open && <div className="space-y-3 pt-3">{children}</div>}
//     </div>
//   )
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // MAIN GENERATOR
// // ─────────────────────────────────────────────────────────────────────────────
// export function InvoiceGenerator() {
//   const [data, setData]           = useState<InvoiceData>(DEFAULT_INVOICE)
//   const [downloading, setDownloading] = useState(false)
//   const [invError, setInvError]   = useState<string | null>(null)

//   const set = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
//     setData(prev => {
//       const updated = { ...prev, [field]: value }
//       if (field === 'sellerGST') updated.sellerPAN = extractPANFromGST(value as string)
//       if (field === 'buyerGST')  updated.buyerPAN  = extractPANFromGST(value as string)
//       return updated
//     })
//   }, [])

//   useEffect(() => {
//     if (data.invoiceNumber && !validateInvoiceNumber(data.invoiceNumber)) {
//       setInvError("Max 16 chars. Alphanumeric, '/' and '-' only.")
//     } else {
//       setInvError(null)
//     }
//   }, [data.invoiceNumber])

//   useEffect(() => {
//     if (data.paymentTermsType === 'days') {
//       const computed = computeOffsetDueDate(data.invoiceDate, data.paymentTermsDays)
//       setData(prev => ({ ...prev, dueDate: computed }))
//     }
//   }, [data.invoiceDate, data.paymentTermsType, data.paymentTermsDays])

//   const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
//     setData(prev => ({
//       ...prev,
//       items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
//     }))
//   }, [])

//   const addItem    = () => setData(prev => ({ ...prev, items: [...prev.items, newItem()] }))
//   const removeItem = (id: string) => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
//   const resetInvoice = () => setData({ ...DEFAULT_INVOICE })

//   const exportPDF = async () => {
//     const target = document.getElementById('invoice-preview')
//     if (!target) return
//     try {
//       setDownloading(true)
//       const canvas = await html2canvas(target, { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' })
//       const imgData = canvas.toDataURL('image/png')
//       const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
//       const pdfWidth  = pdf.internal.pageSize.getWidth()
//       const pdfHeight = pdf.internal.pageSize.getHeight()
//       const ratio     = Math.min(pdfWidth / (canvas.width / 2.5), pdfHeight / (canvas.height / 2.5))
//       const finalW    = (canvas.width  / 2.5) * ratio
//       const finalH    = (canvas.height / 2.5) * ratio
//       const xOff      = (pdfWidth - finalW) / 2
//       pdf.addImage(imgData, 'PNG', xOff, 4, finalW, finalH, undefined, 'FAST')
//       const safeFilename = (data.invoiceNumber || 'Invoice').replace(/[^a-zA-Z0-9-_]/g, '_')
//       pdf.save(`${safeFilename}.pdf`)
//     } catch (err) {
//       console.error('PDF engine error:', err)
//     } finally {
//       setDownloading(false)
//     }
//   }

//   return (
//     <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start p-4 max-w-7xl mx-auto">
//       {/* ── FORM PANEL ── */}
//       <div className="xl:col-span-2 space-y-4 no-print">
//         <div className="flex gap-2 justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
//           <h2 className="font-bold text-sm">Conceptra Engine</h2>
//           <div className="flex gap-1.5">
//             <button type="button" onClick={resetInvoice} className="p-1.5 hover:bg-slate-800 rounded">
//               <RefreshCw size={14} />
//             </button>
//             <button
//               type="button"
//               disabled={downloading}
//               onClick={exportPDF}
//               className="bg-emerald-600 text-xs px-2.5 py-1.5 font-medium rounded hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
//             >
//               <FileDown size={14} />
//               {downloading ? 'Processing...' : 'Get PDF'}
//             </button>
//           </div>
//         </div>

//         <Section title="1. Metadata Core">
//           <div className="space-y-2">
//             <div>
//               <Input
//                 label="Invoice Number"
//                 value={data.invoiceNumber}
//                 onChange={e => set('invoiceNumber', e.target.value)}
//               />
//               {invError && (
//                 <p className="text-[10px] text-red-500 flex items-center gap-1 mt-1 font-medium">
//                   <AlertCircle size={10} /> {invError}
//                 </p>
//               )}
//             </div>
//             <Select
//               label="Place of Supply"
//               value={data.placeOfSupply}
//               options={INDIAN_STATES}
//               onChange={e => set('placeOfSupply', e.target.value)}
//             />
//             <div className="grid grid-cols-2 gap-2">
//               <Input label="Invoice Date" type="date" value={data.invoiceDate} onChange={e => set('invoiceDate', e.target.value)} />
//               <Select
//                 label="Payment Terms"
//                 value={data.paymentTermsType}
//                 options={[
//                   { value: 'days',   label: 'Net Days Period'   },
//                   { value: 'custom', label: 'Fixed Custom Date' },
//                 ]}
//                 onChange={e => set('paymentTermsType', e.target.value as any)}
//               />
//             </div>
//             {data.paymentTermsType === 'days' ? (
//               <Input
//                 label="Net Credit Period (Days)"
//                 type="number"
//                 value={data.paymentTermsDays}
//                 onChange={e => set('paymentTermsDays', parseInt(e.target.value) || 0)}
//               />
//             ) : (
//               <Input
//                 label="Due Date"
//                 type="date"
//                 value={data.dueDate}
//                 onChange={e => set('dueDate', e.target.value)}
//               />
//             )}
//             <Select
//               label="Billing Currency"
//               value={data.currency}
//               options={CURRENCIES}
//               onChange={e => set('currency', e.target.value as CurrencyCode)}
//             />
//           </div>
//         </Section>

//         <Section title="2. Parties (Seller)">
//           <Input label="Legal Name" value={data.sellerName} onChange={e => set('sellerName', e.target.value)} />
//           <Textarea label="Full Address" rows={2} value={data.sellerAddress} onChange={e => set('sellerAddress', e.target.value)} />
//           <Input label="Landmark / Area Locator" value={data.sellerLandmark || ''} onChange={e => set('sellerLandmark', e.target.value)} />
//           <Input label="Seller GSTIN" value={data.sellerGST} onChange={e => set('sellerGST', e.target.value)} />
//           {data.sellerPAN && <p className="text-[10px] text-slate-500 font-mono pl-1">Autodetected PAN: {data.sellerPAN}</p>}
//         </Section>

//         <Section title="3. Consignee Map (Bill To / Ship To)">
//           <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
//             <p className="text-[11px] font-bold text-slate-500 uppercase">Billing Profile</p>
//             <Input label="Buyer Client Name" value={data.buyerName} onChange={e => set('buyerName', e.target.value)} />
//             <Textarea label="Billing Address" rows={2} value={data.buyerAddress} onChange={e => set('buyerAddress', e.target.value)} />
//             <Input label="Landmark" value={data.buyerLandmark || ''} onChange={e => set('buyerLandmark', e.target.value)} />
//             <Input label="Buyer GSTIN" value={data.buyerGST} onChange={e => set('buyerGST', e.target.value)} />
//           </div>
//           <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
//             <p className="text-[11px] font-bold text-slate-500 uppercase">Shipping Profile (Optional)</p>
//             <Input label="Shipping Name" placeholder="Leave empty if identical" value={data.shipToName || ''} onChange={e => set('shipToName', e.target.value)} />
//             <Textarea label="Shipping Address" rows={2} value={data.shipToAddress || ''} onChange={e => set('shipToAddress', e.target.value)} />
//             <Input label="Shipping Landmark" value={data.shipToLandmark || ''} onChange={e => set('shipToLandmark', e.target.value)} />
//             <Input label="Shipping GSTIN (Required if different)" value={data.shipToGST || ''} onChange={e => set('shipToGST', e.target.value)} />
//           </div>
//         </Section>

//         <Section title="4. Line Material Items">
//           <div className="space-y-2">
//             {data.items.map((item, idx) => (
//               <ItemRow
//                 key={item.id}
//                 item={item}
//                 index={idx}
//                 onChange={updateItem}
//                 onRemove={removeItem}
//                 currency={data.currency}
//                 canRemove={data.items.length > 1}
//               />
//             ))}
//           </div>
//           <button
//             type="button"
//             onClick={addItem}
//             className="w-full py-2 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 font-bold text-xs text-slate-700 rounded-xl mt-2 flex items-center justify-center gap-1"
//           >
//             <Plus size={14} /> Add New Row
//           </button>
//         </Section>
//       </div>

//       {/* ── PREVIEW PANEL ── */}
//       <div className="xl:col-span-3 sticky top-6">
//         <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 no-print">Structured View Workspace</p>
//         <InvoicePreview data={data} />
//       </div>
//     </div>
//   )
// }










'use client'

import { useState, useCallback, useEffect } from 'react'
import { Plus, Trash2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, FileDown } from 'lucide-react'
import { Input, Select, Textarea } from '@/components/ui'
import {
  InvoiceData, InvoiceItem, CurrencyCode,
  DEFAULT_INVOICE, CURRENCIES, GST_RATES, CESS_RATES, INDIAN_STATES
  , formatCurrency, newItem, amountInWords,
  validateInvoiceNumber, extractPANFromGST, computeOffsetDueDate, computeRetailEffectiveRate,
  validatePAN,
} from '@/lib/logic/invoice'

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { InvoiceTemplate } from './invoice/types'
import ClassicGSTPreview from './invoice/ClassicGSTPreview'
import ServicePreview from './invoice/ServicePreview'
import RetailGSTPreview from './invoice/RetailGSTPreview'
import TemplateSelector from './invoice/TemplateSelector'

import ClassicGSTForm from './invoice/ClassicGSTForm'
import RetailGSTForm from './invoice/RetailGSTForm'
import LetterheadGSTForm from './invoice/LetterheadGSTForm'
import LetterheadGSTPreview from './invoice/LetterheadGSTPreview'


// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function validateGSTIN(gstin: string): string | null {
  if (!gstin) return null
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
  if (!regex.test(gstin.trim().toUpperCase())) return 'Invalid GSTIN format (e.g. 06ABCDE1234F1Z5)'
  return null
}

function validatePhone(phone: string): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length !== 10) return 'Enter a valid 10-digit mobile number'
  return null
}

function validateEmail(email: string): string | null {
  if (!email) return null
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!regex.test(email)) return 'Enter a valid email address'
  return null
}

function validateDate(dateStr: string): string | null {
  if (!dateStr) return 'Date is required'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 'Invalid date'
  return null
}

function validateDueDate(invoiceDate: string, dueDate: string): string | null {
  if (!dueDate) return 'Due date is required'
  if (invoiceDate && dueDate < invoiceDate) return 'Due date cannot be before invoice date'
  return null
}

function validatePANField(pan: string): string | null {
  if (!pan) return null
  if (!validatePAN(pan)) return 'Invalid PAN format (e.g. ABCDE1234F)'
  return null
}

function validateRequired(val: string, label: string): string | null {
  if (!val || !val.trim()) return `${label} is required`
  return null
}

function validatePositiveNumber(val: number, label: string): string | null {
  if (val === undefined || val === null || isNaN(val)) return `${label} is required`
  if (val < 0) return `${label} cannot be negative`
  return null
}

function validatePercent(val: number, label: string): string | null {
  if (val < 0 || val > 100) return `${label} must be between 0 and 100`
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION UI COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function FieldError({ msg }: { msg: string | null }) {
  if (!msg) return null
  return (
    <p className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5 font-medium">
      <AlertCircle size={10} className="shrink-0" /> {msg}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// INVOICE PREVIEW (unchanged from current)
// ─────────────────────────────────────────────────────────────────────────────
// function InvoicePreview({ data }: { data: InvoiceData }) {
//   const totals  = calcTotals(data.items)
//   const hasIGST = data.items.some(i => i.gstType === 'igst')
//   const hasCGST = data.items.some(i => i.gstType === 'cgst_sgst')
//   const hasCess = data.items.some(i => i.cessRate > 0)
//   const formattedPOS  = INDIAN_STATES.find(s => s.value === data.placeOfSupply)?.label || data.placeOfSupply
//   const isInvNumValid = validateInvoiceNumber(data.invoiceNumber)

//   return (
//     <div id="invoice-preview" className="bg-white text-slate-800 border-2 border-slate-900 overflow-hidden font-sans text-xs shadow-sm max-w-[210mm] mx-auto p-1">
//       <div className="border-b-2 border-slate-900 p-2 text-center bg-slate-50">
//         <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">Tax Invoice</h1>
//       </div>
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller</p>
//           <p className="font-bold text-slate-900 text-sm">{data.sellerName || 'Your Business Name'}</p>
//           <p className="text-slate-600 whitespace-pre-line">{data.sellerAddress || 'Seller Address Location'}{data.sellerLandmark && `\nLandmark: ${data.sellerLandmark}`}</p>
//           {data.sellerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.sellerGST}</span></p>}
//           {data.sellerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.sellerPAN}</p>}
//         </div>
//         <div className="p-3 space-y-1.5">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Invoice Details</p>
//           <div className="grid grid-cols-3 gap-y-1 font-medium">
//             <span className="text-slate-500">Invoice No</span>
//             <span className={`col-span-2 font-mono font-bold ${isInvNumValid ? 'text-slate-900' : 'text-red-600 bg-red-50 px-1 rounded'}`}>: {data.invoiceNumber || '—'} {!isInvNumValid && data.invoiceNumber && '(!)'}</span>
//             <span className="text-slate-500">Date</span><span className="col-span-2">: {data.invoiceDate}</span>
//             <span className="text-slate-500">Due Date</span><span className="col-span-2">: {data.dueDate}</span>
//             <span className="text-slate-500">Place of Supply</span><span className="col-span-2">: {formattedPOS}</span>
//           </div>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bill To</p>
//           <p className="font-bold text-slate-900">{data.buyerName || 'Client Business Name'}</p>
//           <p className="text-slate-600 whitespace-pre-line">{data.buyerAddress || 'Client Billing Address'}{data.buyerLandmark && `\nLandmark: ${data.buyerLandmark}`}</p>
//           {data.buyerGST && <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.buyerGST}</span></p>}
//           {data.buyerPAN && <p className="text-slate-500 font-mono text-[10px]">PAN: {data.buyerPAN}</p>}
//         </div>
//         <div className="p-3 space-y-1">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ship To</p>
//           <p className="font-bold text-slate-900">{data.shipToName || data.buyerName || 'Same as Billing'}</p>
//           <p className="text-slate-600 whitespace-pre-line">{data.shipToAddress || data.buyerAddress || 'Same as Delivery Location'}{data.shipToLandmark && `\nLandmark: ${data.shipToLandmark}`}</p>
//           <p className="font-medium text-slate-900 pt-0.5">GSTIN: <span className="font-mono">{data.shipToGST || data.buyerGST || '—'}</span></p>
//         </div>
//       </div>
//       <div className="overflow-x-auto">
//         <table className="w-full border-b-2 border-slate-900 border-collapse text-left">
//           <thead>
//             <tr className="bg-slate-50 border-b-2 border-slate-900 text-[10px] font-bold text-slate-900">
//               <th className="p-1.5 text-center border-r border-slate-400 w-8">S.No.</th>
//               <th className="p-1.5 border-r border-slate-400">Item Name</th>
//               <th className="p-1.5 text-center border-r border-slate-400 w-20">HSN Code</th>
//               <th className="p-1.5 text-center border-r border-slate-400 w-14">Qty</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">MRP</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">Rate</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">Disc %</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">CD %</th>
//               <th className="p-1.5 text-right border-r border-slate-400 w-14">GST%</th>
//               {hasCess && <th className="p-1.5 text-right border-r border-slate-400 w-14">Cess %</th>}
//               <th className="p-1.5 text-right border-r border-slate-400 w-20">GST Amt</th>
//               <th className="p-1.5 text-right w-24">Amount</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-200">
//             {data.items.map((item, idx) => {
//               const c = calcItem(item)
//               return (
//                 <tr key={item.id} className="text-slate-700 text-[10px]">
//                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{idx + 1}</td>
//                   <td className="p-1.5 font-medium text-slate-900 border-r border-slate-300">{item.description || '—'}</td>
//                   <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-300">{item.hsn || '—'}</td>
//                   <td className="p-1.5 text-center font-mono border-r border-slate-300">{item.quantity}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(item.mrp, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.effectiveRate, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.discRate.toFixed(2)}%</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cdRate.toFixed(2)}%</td>
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.gstRate}%</td>
//                   {hasCess && <td className="p-1.5 text-right font-mono border-r border-slate-300">{item.cessRate}%</td>}
//                   <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(c.gstAmt, data.currency)}</td>
//                   <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatCurrency(c.subtotal, data.currency)}</td>
//                 </tr>
//               )
//             })}
//             <tr className="bg-slate-50 font-bold text-[10px] border-t-2 border-slate-900">
//               <td className="p-1.5 border-r border-slate-300" /><td className="p-1.5 text-center text-slate-700 border-r border-slate-300">Totals</td>
//               <td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 text-center font-mono border-r border-slate-300">{data.items.reduce((s, i) => s + i.quantity, 0)} Units</td>
//               <td className="p-1.5 border-r border-slate-300" /><td className="p-1.5 border-r border-slate-300" />
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalDisc.toFixed(2)}</td>
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{totals.totalCD.toFixed(2)}</td>
//               <td className="p-1.5 border-r border-slate-300" />
//               {hasCess && <td className="p-1.5 border-r border-slate-300" />}
//               <td className="p-1.5 text-right font-mono border-r border-slate-300">{formatCurrency(totals.totalGST, data.currency)}</td>
//               <td className="p-1.5 text-right font-mono text-slate-900">{formatCurrency(totals.subtotal, data.currency)}</td>
//             </tr>
//           </tbody>
//         </table>
//       </div>
//       <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900">
//         <div className="p-3 bg-slate-50/50 flex flex-col justify-between space-y-4">
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tax Amount Chargeable (in words)</p>
//             <p className="font-medium text-blue-900 italic leading-relaxed bg-blue-50/50 p-1.5 rounded border border-blue-100">{amountInWords(totals.totalGST + totals.totalCess, data.currency)}</p>
//           </div>
//           <div>
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Grand Amount (in words)</p>
//             <p className="font-medium text-slate-800 italic leading-relaxed">{amountInWords(totals.grandTotal, data.currency)}</p>
//           </div>
//         </div>
//         <div className="p-3 space-y-1.5 font-medium">
//           <div className="flex justify-between text-slate-600"><span>Subtotal (Taxable)</span><span className="font-mono">{formatCurrency(totals.subtotal, data.currency)}</span></div>
//           {totals.totalDisc > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Trade Discount</span><span className="font-mono">- {formatCurrency(totals.totalDisc, data.currency)}</span></div>}
//           {totals.totalCD > 0 && <div className="flex justify-between text-slate-500 text-[10px]"><span>Cash Discount (CD)</span><span className="font-mono">- {formatCurrency(totals.totalCD, data.currency)}</span></div>}
//           {hasCGST && <><div className="flex justify-between text-slate-600"><span>CGST</span><span className="font-mono">{formatCurrency(totals.totalCGST, data.currency)}</span></div><div className="flex justify-between text-slate-600"><span>SGST</span><span className="font-mono">{formatCurrency(totals.totalSGST, data.currency)}</span></div></>}
//           {hasIGST && <div className="flex justify-between text-slate-600"><span>IGST</span><span className="font-mono">{formatCurrency(totals.totalIGST, data.currency)}</span></div>}
//           {totals.totalCess > 0 && <div className="flex justify-between text-slate-600"><span>Total Cess</span><span className="font-mono">{formatCurrency(totals.totalCess, data.currency)}</span></div>}
//           <div className="border-t border-dashed border-slate-400 my-1" />
//           <div className="flex justify-between text-slate-600 font-medium"><span>Gross Amount</span><span className="font-mono">{formatCurrency(totals.grandTotal, data.currency)}</span></div>
//           <div className="flex justify-between text-slate-900 font-bold text-sm bg-slate-100 p-1 rounded"><span>Net Amount (Rounded Off)</span><span className="font-mono text-emerald-700">{formatCurrency(Math.round(totals.grandTotal), data.currency)}</span></div>
//         </div>
//       </div>
//       <div className="border-b-2 border-slate-900 bg-slate-50/30">
//         <div className="p-1.5 bg-slate-50 border-b font-bold tracking-wider text-[10px] text-slate-500 uppercase">GST Breakup Matrix</div>
//         <table className="w-full border-collapse text-left text-[10px]">
//           <thead><tr className="border-b border-slate-900 font-bold text-slate-700 divide-x divide-slate-900 bg-slate-100">
//             <th className="p-1.5 text-center">HSN/SAC</th><th className="p-1.5 text-right">Taxable Value</th>
//             {hasCGST && <><th className="p-1.5 text-right">CGST Amt</th><th className="p-1.5 text-right">SGST Amt</th></>}
//             {hasIGST && <th className="p-1.5 text-right">IGST Amt</th>}
//             {hasCess && <th className="p-1.5 text-right">Cess Amt</th>}
//             <th className="p-1.5 text-right">Total Tax</th>
//           </tr></thead>
//           <tbody className="divide-y divide-slate-300 font-mono text-slate-600">
//             {totals.hsnBreakup.map(row => (
//               <tr key={row.hsn} className="divide-x divide-slate-900">
//                 <td className="p-1.5 text-center font-bold text-slate-800">{row.hsn}</td>
//                 <td className="p-1.5 text-right">{formatCurrency(row.taxableValue, data.currency)}</td>
//                 {hasCGST && <><td className="p-1.5 text-right">{formatCurrency(row.cgstAmount, data.currency)}</td><td className="p-1.5 text-right">{formatCurrency(row.sgstAmount, data.currency)}</td></>}
//                 {hasIGST && <td className="p-1.5 text-right">{formatCurrency(row.igstAmount, data.currency)}</td>}
//                 {hasCess && <td className="p-1.5 text-right">{formatCurrency(row.cessAmount, data.currency)}</td>}
//                 <td className="p-1.5 text-right font-bold text-slate-900">{formatCurrency(row.totalTax, data.currency)}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//       <div className="grid grid-cols-2 divide-x-2 divide-slate-900">
//         <div className="p-3 space-y-0.5">
//           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bank Details</p>
//           <p className="font-bold text-slate-900">Punjab National Bank</p>
//           <p className="text-slate-600 font-mono">A/C: 12381131001919</p>
//           <p className="text-slate-600 font-mono">IFSC: PUNB0517010</p>
//         </div>
//         <div className="p-3 flex flex-col justify-between items-end relative min-h-[72px]">
//           <div className="w-full text-left">
//             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Declaration</p>
//             <p className="text-slate-500 text-[10px] leading-tight">{data.termsAndConditions}</p>
//           </div>
//           <div className="text-right w-full border-t border-slate-300 pt-8 mt-4">
//             <p className="font-bold text-slate-900 text-[10px] uppercase tracking-wide">For {data.sellerName || 'Your Business Name'}</p>
//             <p className="text-[9px] text-slate-400 mt-0.5">Authorised Signatory</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// ─────────────────────────────────────────────────────────────────────────────
// ITEM ROW — with per-field validation
// ─────────────────────────────────────────────────────────────────────────────
function ItemRow({
  item, index, onChange, onRemove, canRemove,
}: {
  item: InvoiceItem
  index: number
  onChange: (id: string, field: keyof InvoiceItem, value: string | number) => void
  onRemove: (id: string) => void
  currency: string
  canRemove: boolean
}) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [customCess, setCustomCess] = useState(false)
  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }))
  const t     = (f: string) => touched[f] ?? false

  const effectiveRate = computeRetailEffectiveRate(item.mrp, item.discRate, item.cdRate)

  const errDesc    = t('description') ? validateRequired(item.description, 'Description') : null
  const errHSN     = t('hsn') && item.hsn ? (!/^\d{4}(\d{2}(\d{2})?)?$/.test(item.hsn.trim()) ? 'HSN must be 4, 6, or 8 digits' : null) : null
  const errQty     = t('quantity') ? (item.quantity <= 0 ? 'Qty must be greater than 0' : null) : null
  const MAX_MRP = 100000000 // 10 Crore

const errMRP = t('mrp')
  ? item.mrp <= 0
    ? 'MRP must be greater than 0'
    : item.mrp > 100000000
      ? 'MRP cannot exceed ₹10 Crore'
      : validatePositiveNumber(item.mrp, 'MRP')
  : null
  const errDisc    = t('discRate') ? validatePercent(item.discRate, 'Discount') : null
  const errCD      = t('cdRate')   ? validatePercent(item.cdRate,   'CD')       : null
  const errDiscCD  = (t('discRate') || t('cdRate')) && (item.discRate + item.cdRate > 100) ? 'Disc + CD cannot exceed 100%' : null

  return (
    <div className="grid gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">Line Item {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(item.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Description + HSN */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <Input placeholder="Description of goods *" value={item.description}
            onChange={e => onChange(item.id, 'description', e.target.value)}
            onBlur={() => touch('description')}
            className={errDesc ? 'border-red-400' : ''} />
          <FieldError msg={errDesc} />
        </div>
        <div>
          <Input placeholder="HSN/SAC" value={item.hsn}
            onChange={e => onChange(item.id, 'hsn', e.target.value)}
            onBlur={() => touch('hsn')}
            maxLength={8}
            className={errHSN ? 'border-red-400' : ''} />
          <FieldError msg={errHSN} />
        </div>
      </div>

      {/* Qty + MRP + Disc% + CD% + Eff.Rate */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div>
          <Input label="Qty *" type="number" min="1" value={item.quantity}
            onChange={e => onChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
            onBlur={() => touch('quantity')}
            className={errQty ? 'border-red-400' : ''} />
          <FieldError msg={errQty} />
        </div>
        <div>
          {/* <Input
  label="MRP *"
  type="number"
  min="0"
  max="100000000"
  step="0.01"
  value={item.mrp}
  // onChange={e => {
  //   const value = Math.min(
  //     parseFloat(e.target.value) || 0,
  //     100000000
  //   )
  //   onChange(item.id, 'mrp', value)
  // }}
  onChange={e => {
  const value = parseFloat(e.target.value) || 0

  if (value > 100000000) {
    onChange(item.id, 'mrp', 100000000)
    return
  }

  onChange(item.id, 'mrp', value)
}}
  onBlur={() => touch('mrp')}
  className={errMRP ? 'border-red-400' : ''}
/> */}
<Input
  label="MRP *"
  type="number"
  min="0"
  max="100000000"
  step="0.01"
  value={item.mrp}
  onKeyDown={(e) => {
    const next = Number(
      String(item.mrp ?? '') + e.key
    )

    if (!isNaN(next) && next > 100000000) {
      e.preventDefault()
    }
  }}
  onChange={e =>
    onChange(item.id, 'mrp', parseFloat(e.target.value) || 0)
  }
  onBlur={() => touch('mrp')}
  className={errMRP ? 'border-red-400' : ''}
/>
          <FieldError msg={errMRP} />
        </div>
        <div>
          <Input label="Disc %" type="number" min="0" max="100" step="0.01" value={item.discRate}
            onChange={e => onChange(item.id, 'discRate', parseFloat(e.target.value) || 0)}
            onBlur={() => touch('discRate')}
            className={(errDisc || errDiscCD) ? 'border-red-400' : ''} />
          <FieldError msg={errDisc || errDiscCD} />
        </div>
        <div>
          <Input label="CD %" type="number" min="0" max="100" step="0.01" value={item.cdRate}
            onChange={e => onChange(item.id, 'cdRate', parseFloat(e.target.value) || 0)}
            onBlur={() => touch('cdRate')}
            className={errCD ? 'border-red-400' : ''} />
          <FieldError msg={errCD} />
        </div>
        <div className="flex flex-col justify-end">
          <label className="text-[10px] text-slate-500 font-medium mb-1">Eff. Rate</label>
          <div className="h-9 flex items-center px-2 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-700 select-none">
            {effectiveRate.toFixed(2)}
          </div>
        </div>
      </div>

      {/* GST Rate + Tax Type + Cess */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Select label="GST Rate" value={String(item.gstRate)}
          options={GST_RATES.map(r => ({ value: String(r), label: `${r}%` }))}
          onChange={e => onChange(item.id, 'gstRate', parseInt(e.target.value))} />
        <Select label="Tax Type" value={item.gstType}
          options={[
            { value: 'none',      label: 'Exempt'      },
            { value: 'cgst_sgst', label: 'CGST + SGST' },
            { value: 'igst',      label: 'IGST'        },
          ]}
          onChange={e => onChange(item.id, 'gstType', e.target.value as any)} />
        <div className="flex flex-col justify-end">
          {customCess ? (
            <div className="relative">
              <Input label="Cess %" type="number" min="0" max="100" step="0.1" value={item.cessRate}
                onChange={e => onChange(item.id, 'cessRate', parseFloat(e.target.value) || 0)} />
              <button type="button" onClick={() => { setCustomCess(false); onChange(item.id, 'cessRate', 0) }}
                className="absolute right-1 top-1 text-[9px] text-blue-500 underline">List</button>
            </div>
          ) : (
            <Select label="Cess %"
              value={CESS_RATES.includes(item.cessRate) ? String(item.cessRate) : 'custom'}
              options={[...CESS_RATES.map(c => ({ value: String(c), label: `${c}%` })), { value: 'custom', label: 'Custom...' }]}
              onChange={e => { if (e.target.value === 'custom') setCustomCess(true); else onChange(item.id, 'cessRate', parseFloat(e.target.value)) }} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION WRAPPER — shows red border + icon if it contains errors
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = true, hasError = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean; hasError?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`border rounded-xl p-3 bg-white shadow-sm ${hasError ? 'border-red-300' : 'border-slate-200'}`}>
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-bold text-xs uppercase tracking-wider text-slate-700">
        <span className="flex items-center gap-1.5">
          {title}
          {hasError && <AlertCircle size={12} className="text-red-400" />}
        </span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="space-y-3 pt-3">{children}</div>}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN GENERATOR
// ─────────────────────────────────────────────────────────────────────────────
export function InvoiceGenerator() {
    const [template, setTemplate] =
    useState<InvoiceTemplate>('classic-gst')
  const [data, setData]                       = useState<InvoiceData>(DEFAULT_INVOICE)
  const [downloading, setDownloading]         = useState(false)
  const [touched, setTouched]                 = useState<Record<string, boolean>>({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [creditDaysExceeded, setCreditDaysExceeded] = useState(false)

  const touch = (f: string) => setTouched(p => ({ ...p, [f]: true }))
  const t     = (f: string) => touched[f] || submitAttempted

  const set = useCallback(<K extends keyof InvoiceData>(field: K, value: InvoiceData[K]) => {
    setData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'sellerGST') updated.sellerPAN = extractPANFromGST(value as string)
      if (field === 'buyerGST')  updated.buyerPAN  = extractPANFromGST(value as string)
      return updated
    })
  }, [])

  useEffect(() => {
    if (data.paymentTermsType === 'days') {
      setData(prev => ({ ...prev, dueDate: computeOffsetDueDate(data.invoiceDate, data.paymentTermsDays) }))
    }
  }, [data.invoiceDate, data.paymentTermsType, data.paymentTermsDays])

  const updateItem   = useCallback((id: string, field: keyof InvoiceItem, value: string | number) => {
    setData(prev => ({ ...prev, items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item) }))
  }, [])
  const addItem      = () => setData(prev => ({ ...prev, items: [...prev.items, newItem()] }))
  const removeItem   = (id: string) => setData(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }))
  const resetInvoice = () => { setData({ ...DEFAULT_INVOICE }); setTouched({}); setSubmitAttempted(false) }

  // ── All errors ─────────────────────────────────────────────────────────────
  const errors = {
    invoiceNumber:    !validateInvoiceNumber(data.invoiceNumber) ? "Max 16 chars. Alphanumeric, '/' and '-' only." : null,
    invoiceDate:      validateDate(data.invoiceDate),
    dueDate:          validateDueDate(data.invoiceDate, data.dueDate),
    paymentTermsDays: data.paymentTermsType === 'days' && data.paymentTermsDays <= 0 ? 'Credit days must be greater than 0' : data.paymentTermsType === 'days' && data.paymentTermsDays > 1000 ? 'Credit period cannot exceed 1000 days' : null,
    sellerName:       validateRequired(data.sellerName, 'Seller name'),
    sellerAddress:    validateRequired(data.sellerAddress, 'Seller address'),
    sellerGST:        validateGSTIN(data.sellerGST),
    sellerPAN:        validatePANField(data.sellerPAN || ''),
    sellerPhone:      validatePhone(data.sellerPhone),
    sellerEmail:      validateEmail(data.sellerEmail),
    buyerName:        validateRequired(data.buyerName, 'Buyer name'),
    buyerAddress:     validateRequired(data.buyerAddress, 'Buyer address'),
    buyerGST:         validateGSTIN(data.buyerGST),
    buyerPAN:         validatePANField(data.buyerPAN || ''),
    shipToGST:        validateGSTIN(data.shipToGST || ''),
  }

  const sec1Err = ['invoiceNumber','invoiceDate','dueDate','paymentTermsDays'].some(k => t(k) && (errors as any)[k])
  const sec2Err = ['sellerName','sellerAddress','sellerGST','sellerPAN','sellerPhone','sellerEmail'].some(k => t(k) && (errors as any)[k])
  const sec3Err = ['buyerName','buyerAddress','buyerGST','buyerPAN','shipToGST'].some(k => t(k) && (errors as any)[k])

  const exportPDF = async () => {
    setSubmitAttempted(true)
    if (Object.values(errors).some(Boolean)) return
    const target = document.getElementById('invoice-preview')
    if (!target) return
    try {
      setDownloading(true)
      const canvas  = await html2canvas(target, { scale: 2.5, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf     = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const pdfW    = pdf.internal.pageSize.getWidth()
      const pdfH    = pdf.internal.pageSize.getHeight()
      const ratio   = Math.min(pdfW / (canvas.width / 2.5), pdfH / (canvas.height / 2.5))
      const finalW  = (canvas.width  / 2.5) * ratio
      const finalH  = (canvas.height / 2.5) * ratio
      pdf.addImage(imgData, 'PNG', (pdfW - finalW) / 2, 4, finalW, finalH, undefined, 'FAST')
      pdf.save(`${(data.invoiceNumber || 'Invoice').replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`)
    } catch (err) {
      console.error('PDF engine error:', err)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start p-4 max-w-7xl mx-auto">
      <div className="xl:col-span-2 space-y-4 no-print">
 <TemplateSelector
    value={template}
    onChange={setTemplate}
  />

        {/* Top bar */}
        <div className="flex gap-2 justify-between items-center bg-slate-900 text-white p-3 rounded-xl">
          <h2 className="font-bold text-sm">Conceptra Engine</h2>
          <div className="flex gap-1.5">
            <button type="button" onClick={resetInvoice} className="p-1.5 hover:bg-slate-800 rounded" title="Reset"><RefreshCw size={14} /></button>
            <button type="button" disabled={downloading} onClick={exportPDF}
              className="bg-emerald-600 text-xs px-2.5 py-1.5 font-medium rounded hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50">
              <FileDown size={14} />{downloading ? 'Processing...' : 'Get PDF'}
            </button>
          </div>
        </div>

        {/* Global error banner — only after PDF attempt */}
        {submitAttempted && Object.values(errors).some(Boolean) && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-600 mb-1">Fix the following before downloading:</p>
              <ul className="space-y-0.5">
                {Object.entries(errors).map(([k, msg]) => msg ? <li key={k} className="text-[10px] text-red-500">• {msg}</li> : null)}
              </ul>
            </div>
          </div>
        )}
{template === 'classic-gst' && (
  <ClassicGSTForm
    data={data}
    set={set}
    updateItem={updateItem}
    addItem={addItem}
    removeItem={removeItem}
  />
)}

{/* {template === 'service' && (
  <ServiceForm
    data={data}
    set={set}
    updateItem={updateItem}
    addItem={addItem}
    removeItem={removeItem}
  />
)} */}

{template === 'retail-gst' && (
  <RetailGSTForm
    data={data}
    set={set}
    updateItem={updateItem}
    addItem={addItem}
    removeItem={removeItem}
  />
)}

{template === 'letterhead-gst' && (
  <LetterheadGSTForm
    data={data}
    set={set}
    updateItem={updateItem}
    addItem={addItem}
    removeItem={removeItem}
  />
)}
        {/* ── SECTION 1: METADATA ── */}
        {/* <Section title="1. Metadata Core" hasError={sec1Err}>
          <div className="space-y-2">
            <div>
              <Input label="Invoice Number *" value={data.invoiceNumber}
                onChange={e => set('invoiceNumber', e.target.value)}
                onBlur={() => touch('invoiceNumber')}
                className={t('invoiceNumber') && errors.invoiceNumber ? 'border-red-400' : ''} />
              <FieldError msg={t('invoiceNumber') ? errors.invoiceNumber : null} />
            </div>
            <Select label="Place of Supply *" value={data.placeOfSupply} options={INDIAN_STATES}
              onChange={e => set('placeOfSupply', e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Input label="Invoice Date *" type="date" value={data.invoiceDate}
                  onChange={e => set('invoiceDate', e.target.value)}
                  onBlur={() => touch('invoiceDate')}
                  className={t('invoiceDate') && errors.invoiceDate ? 'border-red-400' : ''} />
                <FieldError msg={t('invoiceDate') ? errors.invoiceDate : null} />
              </div>
              <Select label="Payment Terms" value={data.paymentTermsType}
                options={[{ value: 'days', label: 'Net Days Period' }, { value: 'custom', label: 'Fixed Custom Date' }]}
                onChange={e => set('paymentTermsType', e.target.value as any)} />
            </div>
            {data.paymentTermsType === 'days' ? (
              <div className="relative">
                {creditDaysExceeded && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-red-500 text-white text-[11px] font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                    Cannot exceed 1000 days
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-red-500" />
                  </div>
                )}
                <Input label="Net Credit Period (Days) *" type="number" min="1" max="1000" value={data.paymentTermsDays}
                  onChange={e => {
                    const raw = parseInt(e.target.value) || 0
                    const exceeded = raw > 1000
                    setCreditDaysExceeded(exceeded)
                    set('paymentTermsDays', exceeded ? 1000 : raw)
                  }}
                  onBlur={() => touch('paymentTermsDays')}
                  className={creditDaysExceeded || (t('paymentTermsDays') && errors.paymentTermsDays) ? 'border-red-400' : ''} />
                <FieldError msg={!creditDaysExceeded && t('paymentTermsDays') ? errors.paymentTermsDays : null} />
              </div>
            ) : (
              <div>
                <Input label="Due Date *" type="date" value={data.dueDate}
                  onChange={e => set('dueDate', e.target.value)}
                  onBlur={() => touch('dueDate')}
                  className={t('dueDate') && errors.dueDate ? 'border-red-400' : ''} />
                <FieldError msg={t('dueDate') ? errors.dueDate : null} />
              </div>
            )}
            <Select label="Billing Currency" value={data.currency} options={CURRENCIES}
              onChange={e => set('currency', e.target.value as CurrencyCode)} />
          </div>
        </Section> */}

        {/* ── SECTION 2: SELLER ── */}
        {/* <Section title="2. Parties (Seller)" hasError={sec2Err}>
          <div>
            <Input label="Legal Name *" value={data.sellerName}
              onChange={e => set('sellerName', e.target.value)}
              onBlur={() => touch('sellerName')}
              className={t('sellerName') && errors.sellerName ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerName') ? errors.sellerName : null} />
          </div>
          <div>
            <Textarea label="Full Address *" rows={2} value={data.sellerAddress}
              onChange={e => set('sellerAddress', e.target.value)}
              onBlur={() => touch('sellerAddress')}
              className={t('sellerAddress') && errors.sellerAddress ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerAddress') ? errors.sellerAddress : null} />
          </div>
          <Input label="Landmark / Area Locator" value={data.sellerLandmark || ''}
            onChange={e => set('sellerLandmark', e.target.value)} />
          <div>
            <Input label="Seller GSTIN" value={data.sellerGST}
              onChange={e => set('sellerGST', e.target.value.toUpperCase())}
              onBlur={() => touch('sellerGST')}
              maxLength={15} placeholder="e.g. 06ABCDE1234F1Z5"
              className={t('sellerGST') && errors.sellerGST ? 'border-red-400' : ''} />
            {t('sellerGST') && errors.sellerGST
              ? <FieldError msg={errors.sellerGST} />
              : data.sellerGST && !errors.sellerGST
                ? <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> Valid GSTIN</p>
                : null}
            {data.sellerPAN && (
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                Autodetected PAN: <span className="font-bold text-slate-700">{data.sellerPAN}</span>
                {!errors.sellerPAN && <CheckCircle2 size={10} className="text-emerald-500 inline ml-1" />}
              </p>
            )}
          </div>
          <div>
            <Input label="Seller Phone" type="tel" value={data.sellerPhone}
              onChange={e => set('sellerPhone', e.target.value)}
              onBlur={() => touch('sellerPhone')}
              maxLength={10} placeholder="10-digit mobile number"
              className={t('sellerPhone') && errors.sellerPhone ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerPhone') ? errors.sellerPhone : null} />
          </div>
          <div>
            <Input label="Seller Email" type="email" value={data.sellerEmail}
              onChange={e => set('sellerEmail', e.target.value)}
              onBlur={() => touch('sellerEmail')}
              placeholder="name@example.com"
              className={t('sellerEmail') && errors.sellerEmail ? 'border-red-400' : ''} />
            <FieldError msg={t('sellerEmail') ? errors.sellerEmail : null} />
          </div>
        </Section> */}

        {/* ── SECTION 3: BUYER / SHIP TO ── */}
        {/* <Section title="3. Consignee Map (Bill To / Ship To)" hasError={sec3Err}>
          <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Billing Profile</p>
            <div>
              <Input label="Buyer Client Name *" value={data.buyerName}
                onChange={e => set('buyerName', e.target.value)}
                onBlur={() => touch('buyerName')}
                className={t('buyerName') && errors.buyerName ? 'border-red-400' : ''} />
              <FieldError msg={t('buyerName') ? errors.buyerName : null} />
            </div>
            <div>
              <Textarea label="Billing Address *" rows={2} value={data.buyerAddress}
                onChange={e => set('buyerAddress', e.target.value)}
                onBlur={() => touch('buyerAddress')}
                className={t('buyerAddress') && errors.buyerAddress ? 'border-red-400' : ''} />
              <FieldError msg={t('buyerAddress') ? errors.buyerAddress : null} />
            </div>
            <Input label="Landmark" value={data.buyerLandmark || ''} onChange={e => set('buyerLandmark', e.target.value)} />
            <div>
              <Input label="Buyer GSTIN" value={data.buyerGST}
                onChange={e => set('buyerGST', e.target.value.toUpperCase())}
                onBlur={() => touch('buyerGST')}
                maxLength={15} placeholder="e.g. 07ABCDE1234F1Z5"
                className={t('buyerGST') && errors.buyerGST ? 'border-red-400' : ''} />
              {t('buyerGST') && errors.buyerGST
                ? <FieldError msg={errors.buyerGST} />
                : data.buyerGST && !errors.buyerGST
                  ? <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> Valid GSTIN</p>
                  : null}
              {data.buyerPAN && <p className="text-[10px] text-slate-500 font-mono mt-0.5">Autodetected PAN: <span className="font-bold text-slate-700">{data.buyerPAN}</span></p>}
            </div>
          </div>
          <div className="bg-slate-50 p-2 rounded-lg space-y-2 border">
            <p className="text-[11px] font-bold text-slate-500 uppercase">Shipping Profile (Optional)</p>
            <Input label="Shipping Name" placeholder="Leave empty if same as billing" value={data.shipToName || ''} onChange={e => set('shipToName', e.target.value)} />
            <Textarea label="Shipping Address" rows={2} value={data.shipToAddress || ''} onChange={e => set('shipToAddress', e.target.value)} />
            <Input label="Shipping Landmark" value={data.shipToLandmark || ''} onChange={e => set('shipToLandmark', e.target.value)} />
            <div>
              <Input label="Shipping GSTIN" value={data.shipToGST || ''}
                onChange={e => set('shipToGST', e.target.value.toUpperCase())}
                onBlur={() => touch('shipToGST')}
                maxLength={15} placeholder="Required if different from billing"
                className={t('shipToGST') && errors.shipToGST ? 'border-red-400' : ''} />
              {t('shipToGST') && errors.shipToGST
                ? <FieldError msg={errors.shipToGST} />
                : data.shipToGST && !errors.shipToGST
                  ? <p className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5"><CheckCircle2 size={10} /> Valid GSTIN</p>
                  : null}
            </div>
          </div>
        </Section> */}

        {/* ── SECTION 4: LINE ITEMS ── */}
        {/* <Section title="4. Line Material Items">
          <div className="space-y-2">
            {data.items.map((item, idx) => (
              <ItemRow key={item.id} item={item} index={idx}
                onChange={updateItem} onRemove={removeItem}
                currency={data.currency} canRemove={data.items.length > 1} />
            ))}
          </div>
          {data.items.length === 0 && <FieldError msg="At least one line item is required" />}
          <button type="button" onClick={addItem}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 border-2 border-dashed border-slate-300 font-bold text-xs text-slate-700 rounded-xl mt-2 flex items-center justify-center gap-1">
            <Plus size={14} /> Add New Row
          </button>
        </Section> */}
      </div>

      {/* ── PREVIEW PANEL ── */}
      <div className="xl:col-span-3 sticky top-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 no-print">Structured View Workspace</p>
        {/* <InvoicePreview data={data} /> */}
        {template === 'retail-gst' && (
  <RetailGSTPreview data={data} />
)}

{template === 'letterhead-gst' && (
  <LetterheadGSTPreview data={data} />
)}

{/* {template === 'service' && (
  <ServicePreview data={data} />
)} */}

{template === 'classic-gst' && (
  
  <ClassicGSTPreview data={data} />
)}
      </div>
    </div>
  )
}
